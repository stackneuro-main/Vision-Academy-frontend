(function () {
  "use strict";

  const mount = document.getElementById("courseDetailsApp");
  if (
    !mount
    || !window.React
    || !window.ReactDOM
    || !window.CourseService
    || !window.InquiryService
  ) return;

  const { useEffect, useMemo, useState } = React;
  const h = React.createElement;

  const tabs = [
    ["overview", "Overview", "fa-solid fa-circle-info"],
    ["curriculum", "Syllabus", "fa-solid fa-list-check"],
    ["enquiry", "Enquire Now", "fa-solid fa-message"]
  ];

  function formatFee(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function textLines(value) {
    return (value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function LoadingState() {
    return h("section", { className: "section lms-workspace" },
      h("div", { className: "container" },
        h("div", {
          className: "course-empty-state",
          role: "status"
        },
          h("i", {
            className: "fa-solid fa-circle-notch fa-spin",
            "aria-hidden": "true"
          }),
          h("p", null, "Loading course details…")
        )
      )
    );
  }

  function ErrorState({ message }) {
    return h("section", { className: "section lms-workspace" },
      h("div", { className: "container" },
        h("div", {
          className: "course-empty-state",
          role: "alert"
        },
          h("i", {
            className: "fa-solid fa-triangle-exclamation",
            "aria-hidden": "true"
          }),
          h("p", null, message),
          h("a", {
            className: "btn btn-primary",
            href: "index.html#courses"
          }, "Back to Courses")
        )
      )
    );
  }

  function InquiryForm({ course }) {
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState("");

    async function submit(event) {
      event.preventDefault();
      const form = event.currentTarget;
      const data = new FormData(form);
      setSubmitting(true);
      setMessage("");
      try {
        await window.InquiryService.submitInquiry({
          name: data.get("name"),
          phone: data.get("phone"),
          email: data.get("email") || null,
          course_id: course.id,
          interested_course: course.course_name,
          message: data.get("message") || null
        });
        form.reset();
        setMessage("Your enquiry has been submitted successfully.");
        window.showVisionToast?.(
          "Your course enquiry has been submitted.",
          "success"
        );
      } catch (error) {
        setMessage(error.message);
        window.showVisionToast?.(error.message, "error");
      } finally {
        setSubmitting(false);
      }
    }

    return h("div", { className: "lms-overview-grid" },
      h("article", { className: "lms-panel" },
        h("h2", null, `Enquire About ${course.course_name}`),
        h("p", null,
          "Share your contact details and our academy team will help you with fees, schedules, and enrollment."
        ),
        h("div", { className: "course-enquiry-summary" },
          h("span", { className: "course-badge category" },
            course.category.category_name
          ),
          h("strong", null, course.course_name)
        )
      ),
      h("form", {
        className: "contact-form course-enquiry-form",
        onSubmit: submit
      },
        h("input", {
          type: "text",
          name: "name",
          placeholder: "Name",
          "aria-label": "Name",
          required: true
        }),
        h("input", {
          type: "email",
          name: "email",
          placeholder: "Email",
          "aria-label": "Email"
        }),
        h("input", {
          type: "tel",
          name: "phone",
          placeholder: "Phone",
          "aria-label": "Phone",
          required: true
        }),
        h("textarea", {
          name: "message",
          placeholder: "Message",
          "aria-label": "Message",
          rows: 5
        }),
        h("button", {
          className: "btn btn-gold",
          type: "submit",
          disabled: submitting
        }, submitting ? "Sending…" : "Submit Enquiry"),
        message && h("p", {
          className: "inquiry-form-message",
          role: "status"
        }, message)
      )
    );
  }

  function CourseDetailsApp() {
    const params = useMemo(
      () => new URLSearchParams(window.location.search),
      []
    );
    const [course, setCourse] = useState(null);
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
      let active = true;
      const courseId = params.get("id");
      const legacySlug = params.get("course");
      const request = courseId
        ? window.CourseService.getCourse(courseId)
        : legacySlug
          ? window.CourseService.getCourseBySlug(legacySlug)
          : Promise.reject(new Error("No course was selected."));

      request
        .then((value) => {
          if (!active) return;
          setCourse(value);
          document.title = `${value.course_name} | Vision Academy`;
          const description = document.querySelector(
            'meta[name="description"]'
          );
          if (description) {
            description.content = value.course_description.slice(0, 155);
          }
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, [params]);

    if (loading) return h(LoadingState);
    if (error || !course) {
      return h(ErrorState, {
        message: error || "Course details are unavailable."
      });
    }

    const syllabus = textLines(course.syllabus);
    const prerequisites = course.prerequisites
      || "No prerequisites specified.";

    let tabContent;
    if (activeTab === "overview") {
      tabContent = h("div", { className: "lms-overview-grid" },
        h("article", { className: "lms-panel" },
          h("h2", null, "Course Overview"),
          h("p", null, course.course_description),
          h("h3", null, "Prerequisites"),
          h("p", { className: "course-prerequisites" }, prerequisites)
        ),
        h("article", { className: "lms-panel" },
          h("h2", null, "Course Information"),
          h("div", { className: "download-list" },
            h("article", null,
              h("span", null, "Category"),
              h("strong", null, course.category.category_name)
            ),
            h("article", null,
              h("span", null, "Teacher"),
              h("strong", null,
                course.teacher?.full_name || "Faculty to be assigned"
              )
            ),
            h("article", null,
              h("span", null, "Duration"),
              h("strong", null, course.course_duration)
            ),
            h("article", null,
              h("span", null, "Course Fee"),
              h("strong", null, formatFee(course.course_fee))
            )
          )
        )
      );
    } else if (activeTab === "curriculum") {
      tabContent = h("div", { className: "lms-panel" },
        h("h2", null, "Course Syllabus"),
        syllabus.length
          ? h("ul", null,
              syllabus.map((line, index) => h("li", {
                key: `${index}-${line}`
              }, line))
            )
          : h("div", {
              className: "course-empty-state",
              role: "status"
            },
              h("i", {
                className: "fa-solid fa-list-check",
                "aria-hidden": "true"
              }),
              h("p", null,
                "The syllabus has not been published yet. Please enquire for details."
              )
            )
      );
    } else {
      tabContent = h(InquiryForm, { course });
    }

    const media = course.course_banner || course.course_thumbnail;

    return h(React.Fragment, null,
      h("section", { className: "lms-hero" },
        h("div", { className: "container lms-hero-grid" },
          h("div", { className: "lms-hero-copy" },
            h("a", {
              className: "lms-back-link",
              href: "index.html#courses"
            },
              h("i", {
                className: "fa-solid fa-arrow-left",
                "aria-hidden": "true"
              }),
              " Back to Courses"
            ),
            h("span", { className: "course-badge category" },
              course.category.category_name
            ),
            h("h1", null, course.course_name),
            h("p", null, course.course_description),
            h("div", { className: "lms-hero-meta" },
              h("span", null,
                h("i", {
                  className: "fa-solid fa-clock",
                  "aria-hidden": "true"
                }),
                course.course_duration
              ),
              h("span", null,
                h("i", {
                  className: "fa-solid fa-indian-rupee-sign",
                  "aria-hidden": "true"
                }),
                formatFee(course.course_fee)
              ),
              h("span", null,
                h("i", {
                  className: "fa-solid fa-chalkboard-user",
                  "aria-hidden": "true"
                }),
                course.teacher?.full_name || "Faculty to be assigned"
              )
            ),
            h("div", { className: "lms-hero-actions" },
              h("button", {
                type: "button",
                className: "btn btn-gold",
                onClick: () => setActiveTab("enquiry")
              }, "Enquire Now")
            )
          ),
          h("div", { className: "lms-hero-media" },
            media
              ? h("img", {
                  src: media,
                  alt: `${course.course_name} course banner`,
                  loading: "eager"
                })
              : h("div", { className: "course-detail-icon-fallback" },
                  h("i", {
                    className: "fa-solid fa-book-open",
                    "aria-hidden": "true"
                  })
                ),
            h("div", { className: "lms-floating-card" },
              course.course_thumbnail
                ? h("img", {
                    src: course.course_thumbnail,
                    alt: "",
                    loading: "lazy"
                  })
                : h("i", {
                    className: "fa-solid fa-book-open",
                    "aria-hidden": "true"
                  }),
              h("strong", null, course.course_code),
              h("span", null, course.category.category_name)
            )
          )
        )
      ),
      h("section", { className: "section lms-workspace" },
        h("div", { className: "container" },
          h("div", {
            className: "lms-tabbar",
            role: "tablist",
            "aria-label": "Course detail sections"
          },
            tabs.map(([id, label, icon]) => h("button", {
              key: id,
              type: "button",
              className: activeTab === id ? "active" : "",
              onClick: () => setActiveTab(id),
              role: "tab",
              "aria-selected": activeTab === id
            },
              h("i", { className: icon, "aria-hidden": "true" }),
              label
            ))
          ),
          h("div", { className: "lms-tab-content" }, tabContent)
        )
      )
    );
  }

  ReactDOM.createRoot(mount).render(h(CourseDetailsApp));
})();
