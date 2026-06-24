(function () {
  "use strict";

  const mount = document.getElementById("courseShowcase");
  if (
    !mount
    || !window.React
    || !window.ReactDOM
    || !window.CourseService
    || !window.CategoryService
  ) return;

  const { useEffect, useMemo, useState } = React;
  const h = React.createElement;

  function formatFee(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function shortText(value, limit = 130) {
    if (!value || value.length <= limit) return value || "";
    return `${value.slice(0, limit).trim()}…`;
  }

  function useCountUp(target) {
    const [value, setValue] = useState(0);

    useEffect(() => {
      let frameId;
      const duration = 900;
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / duration, 1);
        setValue(Math.round(target * progress));
        if (progress < 1) frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(frameId);
    }, [target]);

    return value;
  }

  function CourseStat({ item }) {
    const value = useCountUp(item.value);
    return h("article", { className: "course-stat-card" },
      h("i", { className: item.icon, "aria-hidden": "true" }),
      h("strong", null, value.toLocaleString("en-IN"), item.suffix || ""),
      h("span", null, item.label)
    );
  }

  function CourseCard({ course, index }) {
    const category = course.category;
    return h("article", {
      className: "course-card course-card-modern",
      style: { animationDelay: `${Math.min(index, 8) * 45}ms` },
      itemScope: true,
      itemType: "https://schema.org/Course"
    },
      h("div", { className: "course-icon-wrap" },
        course.course_thumbnail
          ? h("img", {
              src: course.course_thumbnail,
              alt: "",
              loading: "lazy"
            })
          : h("i", {
              className: "fa-solid fa-book-open",
              "aria-hidden": "true"
            })
      ),
      h("div", { className: "course-card-body" },
        h("span", { className: "course-badge category" },
          category?.category_name || "Course"
        ),
        h("h3", { itemProp: "name" }, course.course_name),
        h("p", { itemProp: "description" },
          shortText(course.course_description)
        ),
        h("div", { className: "course-meta" },
          h("span", { className: "course-badge" },
            h("i", {
              className: "fa-solid fa-indian-rupee-sign",
              "aria-hidden": "true"
            }),
            formatFee(course.course_fee)
          ),
          h("span", { className: "course-badge" },
            h("i", {
              className: "fa-solid fa-chalkboard-user",
              "aria-hidden": "true"
            }),
            course.teacher?.full_name || "Faculty to be assigned"
          )
        ),
        h("meta", {
          itemProp: "provider",
          content: "Vision Academy Computer Education"
        })
      ),
      h("div", { className: "course-card-footer" },
        h("span", { className: "course-badge duration" },
          h("i", {
            className: "fa-solid fa-clock",
            "aria-hidden": "true"
          }),
          course.course_duration
        ),
        h("a", {
          href: `course-details.html?id=${course.id}`,
          className: "course-link"
        },
          "View Details ",
          h("i", {
            className: "fa-solid fa-arrow-right",
            "aria-hidden": "true"
          })
        )
      )
    );
  }

  function CourseShowcase() {
    const [courses, setCourses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("");
    const [durationFilter, setDurationFilter] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
      let active = true;
      Promise.all([
        window.CourseService.getCourses({ page: 1, page_size: 6 }),
        window.CategoryService.getCategories()
      ])
        .then(([courseData, categoryData]) => {
          if (!active) return;
          setCourses(courseData.items);
          setCategories(categoryData.items);
        })
        .catch((requestError) => {
          if (active) setError(requestError.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }, []);

    useEffect(() => {
      const applyExternalFilter = (event) => {
        if (event.detail?.categoryId !== undefined) {
          setActiveCategory(String(event.detail.categoryId || ""));
        }
        if (event.detail?.search !== undefined) {
          setSearchTerm(event.detail.search || "");
        }
        if (event.detail?.duration !== undefined) {
          setDurationFilter(event.detail.duration || "");
        }
      };
      window.addEventListener("vision:course-filter", applyExternalFilter);
      return () => {
        window.removeEventListener("vision:course-filter", applyExternalFilter);
      };
    }, []);

    const filteredCourses = useMemo(() => {
      const query = searchTerm.trim().toLowerCase();
      return courses.filter((course) => {
        const categoryMatches = !activeCategory
          || String(course.category_id) === activeCategory;
        const searchMatches = !query
          || course.course_name.toLowerCase().includes(query)
          || course.course_description.toLowerCase().includes(query);
        const durationMatches = !durationFilter
          || course.course_duration === durationFilter;
        return categoryMatches && searchMatches && durationMatches;
      });
    }, [activeCategory, courses, durationFilter, searchTerm]);

    const stats = [
      {
        label: "Active Courses",
        value: courses.length,
        icon: "fa-solid fa-layer-group"
      },
      {
        label: "Students Trained",
        value: 5000,
        suffix: "+",
        icon: "fa-solid fa-user-graduate"
      },
      {
        label: "Success Rate",
        value: 95,
        suffix: "%",
        icon: "fa-solid fa-chart-line"
      },
      {
        label: "Career Guidance",
        value: 100,
        suffix: "%",
        icon: "fa-solid fa-compass"
      }
    ];

    if (loading) {
      return h("div", {
        className: "course-empty-state",
        role: "status"
      },
        h("i", {
          className: "fa-solid fa-circle-notch fa-spin",
          "aria-hidden": "true"
        }),
        h("p", null, "Loading courses…")
      );
    }

    if (error) {
      return h("div", {
        className: "course-empty-state",
        role: "alert"
      },
        h("i", {
          className: "fa-solid fa-triangle-exclamation",
          "aria-hidden": "true"
        }),
        h("p", null, error)
      );
    }

    return h(React.Fragment, null,
      h("div", { className: "course-stats-grid" },
        stats.map((item) => h(CourseStat, { key: item.label, item }))
      ),
      h("div", { className: "course-discovery-panel" },
        h("label", { className: "course-search-field" },
          h("i", {
            className: "fa-solid fa-magnifying-glass",
            "aria-hidden": "true"
          }),
          h("span", { className: "sr-only" }, "Search courses"),
          h("input", {
            type: "search",
            value: searchTerm,
            placeholder: "Search courses...",
            onChange: (event) => setSearchTerm(event.target.value)
          })
        ),
        h("div", {
          className: "course-filter-bar",
          role: "tablist",
          "aria-label": "Course categories"
        },
          h("button", {
            type: "button",
            className: `course-filter-btn${!activeCategory ? " active" : ""}`,
            onClick: () => setActiveCategory(""),
            role: "tab",
            "aria-selected": !activeCategory
          }, "All Categories"),
          categories.map((category) => h("button", {
            key: category.id,
            type: "button",
            className: `course-filter-btn${String(category.id) === activeCategory ? " active" : ""}`,
            onClick: () => setActiveCategory(String(category.id)),
            role: "tab",
            "aria-selected": String(category.id) === activeCategory
          }, category.category_name))
        )
      ),
      filteredCourses.length
        ? h("div", {
            className: "course-grid",
            key: `${activeCategory}-${searchTerm}`
          },
            filteredCourses.map((course, index) => h(CourseCard, {
              key: course.id,
              course,
              index
            }))
          )
        : h("div", {
            className: "course-empty-state",
            role: "status"
          },
            h("i", {
              className: "fa-solid fa-magnifying-glass-chart",
              "aria-hidden": "true"
            }),
            h("p", null, courses.length
              ? "No courses found. Try another category or search term."
              : "No active courses are available yet.")
          )
    );
  }

  ReactDOM.createRoot(mount).render(h(CourseShowcase));
})();
