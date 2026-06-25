(function () {
  "use strict";

  const mount = document.getElementById("courseDetailsApp");
  if (!mount || !window.CourseService || !window.InquiryService) return;

  const tabs = [
    ["overview", "Overview", "fa-solid fa-circle-info"],
    ["curriculum", "Syllabus", "fa-solid fa-list-check"],
    ["enquiry", "Enquire Now", "fa-solid fa-message"]
  ];

  let course = null;
  let activeTab = "overview";

  function escapeHtml(value) {
    return String(value ?? "").replace(
      /[&<>"']/g,
      (character) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      })[character]
    );
  }

  function formatFee(value) {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(Number(value || 0));
  }

  function textLines(value) {
    return String(value || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function showState(message, role, icon, includeBackLink = false) {
    mount.innerHTML = `<section class="section lms-workspace">
      <div class="container">
        <div class="course-empty-state" role="${role}">
          <i class="fa-solid ${icon}" aria-hidden="true"></i>
          <p>${escapeHtml(message)}</p>
          ${includeBackLink ? '<a class="btn btn-primary" href="index.html#courses">Back to Courses</a>' : ""}
        </div>
      </div>
    </section>`;
  }

  function informationRow(label, value) {
    return `<article><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
  }

  function renderTabContent() {
    if (activeTab === "overview") {
      return `<div class="lms-overview-grid">
        <article class="lms-panel">
          <h2>Course Overview</h2>
          <p>${escapeHtml(course.course_description)}</p>
          <h3>Prerequisites</h3>
          <p class="course-prerequisites">${escapeHtml(course.prerequisites || "No prerequisites specified.")}</p>
        </article>
        <article class="lms-panel">
          <h2>Course Information</h2>
          <div class="download-list">
            ${informationRow("Category", course.category?.category_name || "Course")}
            ${informationRow("Teacher", course.teacher?.full_name || "Faculty to be assigned")}
            ${informationRow("Duration", course.course_duration)}
            ${informationRow("Course Fee", formatFee(course.course_fee))}
          </div>
        </article>
      </div>`;
    }

    if (activeTab === "curriculum") {
      const syllabus = textLines(course.syllabus);
      return `<article class="lms-panel">
        <h2>Course Syllabus</h2>
        ${syllabus.length
          ? `<ul>${syllabus.map((line) => `<li>${escapeHtml(line)}</li>`).join("")}</ul>`
          : `<div class="course-empty-state" role="status">
              <i class="fa-solid fa-list-check" aria-hidden="true"></i>
              <p>The syllabus has not been published yet. Please enquire for details.</p>
            </div>`}
      </article>`;
    }

    return `<div class="lms-overview-grid">
      <article class="lms-panel">
        <h2>Enquire About ${escapeHtml(course.course_name)}</h2>
        <p>Share your contact details and our academy team will help you with fees, schedules, and enrollment.</p>
        <div class="course-enquiry-summary">
          <span class="course-badge category">${escapeHtml(course.category?.category_name || "Course")}</span>
          <strong>${escapeHtml(course.course_name)}</strong>
        </div>
      </article>
      <form class="contact-form course-enquiry-form" id="courseEnquiryForm">
        <input type="text" name="name" placeholder="Name" aria-label="Name" autocomplete="name" required>
        <input type="email" name="email" placeholder="Email" aria-label="Email" autocomplete="email">
        <input type="tel" name="phone" placeholder="Phone" aria-label="Phone" autocomplete="tel" required>
        <textarea name="message" placeholder="Message" aria-label="Message" rows="5"></textarea>
        <button class="btn btn-gold" type="submit">Submit Enquiry</button>
        <p class="inquiry-form-message" id="courseEnquiryMessage" role="status"></p>
      </form>
    </div>`;
  }

  function bindTabEvents() {
    mount.querySelectorAll("[data-course-tab]").forEach((button) => {
      button.addEventListener("click", () => {
        activeTab = button.dataset.courseTab;
        render();
        mount.querySelector(".lms-tabbar")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      });
    });

    mount.querySelector("[data-open-enquiry]")?.addEventListener("click", () => {
      activeTab = "enquiry";
      render();
      mount.querySelector(".lms-tabbar")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });

    mount.querySelector("#courseEnquiryForm")?.addEventListener("submit", submitEnquiry);
  }

  async function submitEnquiry(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const button = form.querySelector('button[type="submit"]');
    const message = form.querySelector("#courseEnquiryMessage");
    const data = new FormData(form);
    button.disabled = true;
    button.textContent = "Sending…";
    message.textContent = "";

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
      message.textContent = "Your enquiry has been submitted successfully.";
      window.showVisionToast?.("Your course enquiry has been submitted.", "success");
    } catch (error) {
      message.textContent = error.message;
      window.showVisionToast?.(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = "Submit Enquiry";
    }
  }

  function render() {
    const category = course.category?.category_name || "Course";
    const teacher = course.teacher?.full_name || "Faculty to be assigned";
    const media = course.course_banner || course.course_thumbnail;
    const mediaMarkup = media
      ? `<img src="${escapeHtml(media)}" alt="${escapeHtml(course.course_name)} course banner" loading="eager">`
      : `<div class="course-detail-icon-fallback"><i class="fa-solid fa-book-open" aria-hidden="true"></i></div>`;
    const thumbnail = course.course_thumbnail
      ? `<img src="${escapeHtml(course.course_thumbnail)}" alt="" loading="lazy">`
      : `<i class="fa-solid fa-book-open" aria-hidden="true"></i>`;

    mount.innerHTML = `<section class="lms-hero">
      <div class="container lms-hero-grid">
        <div class="lms-hero-copy">
          <a class="lms-back-link" href="index.html#courses"><i class="fa-solid fa-arrow-left" aria-hidden="true"></i> Back to Courses</a>
          <span class="course-badge category">${escapeHtml(category)}</span>
          <h1>${escapeHtml(course.course_name)}</h1>
          <p>${escapeHtml(course.course_description)}</p>
          <div class="lms-hero-meta">
            <span><i class="fa-solid fa-clock" aria-hidden="true"></i>${escapeHtml(course.course_duration)}</span>
            <span><i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i>${escapeHtml(formatFee(course.course_fee))}</span>
            <span><i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i>${escapeHtml(teacher)}</span>
          </div>
          <div class="lms-hero-actions">
            <button type="button" class="btn btn-gold" data-open-enquiry>Enquire Now</button>
          </div>
        </div>
        <div class="lms-hero-media">
          ${mediaMarkup}
          <div class="lms-floating-card">
            ${thumbnail}
            <strong>${escapeHtml(course.course_code)}</strong>
            <span>${escapeHtml(category)}</span>
          </div>
        </div>
      </div>
    </section>
    <section class="section lms-workspace">
      <div class="container">
        <div class="lms-tabbar" role="tablist" aria-label="Course detail sections">
          ${tabs.map(([id, label, icon]) => `<button type="button" class="${activeTab === id ? "active" : ""}" data-course-tab="${id}" role="tab" aria-selected="${String(activeTab === id)}">
            <i class="${icon}" aria-hidden="true"></i>${label}
          </button>`).join("")}
        </div>
        <div class="lms-tab-content">${renderTabContent()}</div>
      </div>
    </section>`;

    bindTabEvents();
  }

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get("id");
  const legacySlug = params.get("course");
  const request = courseId
    ? window.CourseService.getCourse(courseId)
    : legacySlug
      ? window.CourseService.getCourseBySlug(legacySlug)
      : Promise.reject(new Error("No course was selected."));

  showState("Loading course details…", "status", "fa-circle-notch fa-spin");
  request
    .then((value) => {
      course = value;
      document.title = `${value.course_name} | Vision Academy`;
      const description = document.querySelector('meta[name="description"]');
      if (description) {
        description.content = String(value.course_description || "").slice(0, 155);
      }
      render();
    })
    .catch((error) => {
      showState(
        error.message || "Course details are unavailable.",
        "alert",
        "fa-triangle-exclamation",
        true
      );
    });
})();
