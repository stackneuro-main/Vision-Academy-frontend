(function () {
  "use strict";

  const mount = document.getElementById("courseShowcase");
  if (!mount || !window.CourseService || !window.CategoryService) return;

  const state = {
    courses: [],
    categories: [],
    activeCategory: "",
    duration: "",
    search: "",
    page: 0
  };

  let carouselViewport = null;
  let resizeTimer = null;

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

  function shortText(value, limit = 130) {
    const text = String(value || "");
    return text.length <= limit ? text : `${text.slice(0, limit).trim()}…`;
  }

  function getSlidesPerView() {
    return window.matchMedia("(max-width: 767px)").matches ? 1 : 2;
  }

  function isDesktopLayout() {
    return window.matchMedia("(min-width: 1025px)").matches;
  }

  function filteredCourses() {
    const query = state.search.trim().toLowerCase();
    return state.courses.filter((course) => {
      const description = String(course.course_description || "").toLowerCase();
      return (
        (!state.activeCategory
          || String(course.category_id) === state.activeCategory)
        && (!state.duration || course.course_duration === state.duration)
        && (!query
          || String(course.course_name || "").toLowerCase().includes(query)
          || description.includes(query))
      );
    });
  }

  function statCard(label, value, suffix, icon) {
    return `<article class="course-stat-card">
      <i class="${escapeHtml(icon)}" aria-hidden="true"></i>
      <strong data-course-count="${Number(value)}" data-suffix="${escapeHtml(suffix)}">0${escapeHtml(suffix)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>`;
  }

  function courseCard(course, index) {
    const category = course.category?.category_name || "Course";
    const teacher = course.teacher?.full_name || "Faculty to be assigned";
    const media = course.course_thumbnail
      ? `<img src="${escapeHtml(course.course_thumbnail)}" alt="" loading="lazy" decoding="async">`
      : `<i class="fa-solid fa-book-open" aria-hidden="true"></i>`;

    return `<article class="course-card course-card-modern" style="animation-delay:${Math.min(index, 8) * 45}ms" itemscope itemtype="https://schema.org/Course">
      <div class="course-icon-wrap">${media}</div>
      <div class="course-card-body">
        <span class="course-badge category">${escapeHtml(category)}</span>
        <h3 itemprop="name">${escapeHtml(course.course_name)}</h3>
        <p itemprop="description">${escapeHtml(shortText(course.course_description))}</p>
        <div class="course-meta">
          <span class="course-badge"><i class="fa-solid fa-indian-rupee-sign" aria-hidden="true"></i>${escapeHtml(formatFee(course.course_fee))}</span>
          <span class="course-badge"><i class="fa-solid fa-chalkboard-user" aria-hidden="true"></i>${escapeHtml(teacher)}</span>
        </div>
        <meta itemprop="provider" content="Vision Academy Computer Education">
      </div>
      <div class="course-card-footer">
        <span class="course-badge duration"><i class="fa-solid fa-clock" aria-hidden="true"></i>${escapeHtml(course.course_duration)}</span>
        <a href="course-details.html?id=${encodeURIComponent(course.id)}" class="course-link">
          View Details <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </a>
      </div>
    </article>`;
  }

  function renderFilters() {
    return `<div class="course-discovery-panel">
      <label class="course-search-field">
        <i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
        <span class="sr-only">Search courses</span>
        <input id="courseShowcaseSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Search courses..." autocomplete="off">
      </label>
      <div class="course-filter-bar" role="group" aria-label="Filter courses by category">
        <button type="button" class="course-filter-btn${state.activeCategory ? "" : " active"}" data-course-category="" aria-pressed="${String(!state.activeCategory)}">All Categories</button>
        ${state.categories.map((category) => {
          const active = String(category.id) === state.activeCategory;
          return `<button type="button" class="course-filter-btn${active ? " active" : ""}" data-course-category="${escapeHtml(category.id)}" aria-pressed="${String(active)}">${escapeHtml(category.category_name)}</button>`;
        }).join("")}
      </div>
    </div>`;
  }

  function renderCarousel(courses) {
    if (!courses.length) {
      return `<div class="course-empty-state" role="status">
        <i class="fa-solid fa-magnifying-glass-chart" aria-hidden="true"></i>
        <p>${state.courses.length
          ? "No courses found. Try another category or search term."
          : "No active courses are available yet."}</p>
      </div>`;
    }

    const slidesPerView = getSlidesPerView();
    const pages = Array.from(
      { length: Math.ceil(courses.length / slidesPerView) },
      (_, pageIndex) => courses.slice(
        pageIndex * slidesPerView,
        (pageIndex + 1) * slidesPerView
      )
    );
    const totalPages = Math.max(1, pages.length);
    state.page = Math.min(state.page, totalPages - 1);

    return `<section class="course-carousel${totalPages === 1 ? " single-page" : ""}" aria-label="Popular course carousel">
      <div class="course-carousel-viewport" tabindex="0">
        <div class="course-carousel-track">
          ${pages.map((pageCourses, pageIndex) => `
            <div class="course-carousel-page" style="--page-count:${pageCourses.length}" aria-label="Course page ${pageIndex + 1} of ${totalPages}">
              ${pageCourses.map((course, index) =>
                courseCard(course, (pageIndex * slidesPerView) + index)
              ).join("")}
            </div>
          `).join("")}
        </div>
      </div>
      <div class="course-carousel-footer">
        <div class="course-carousel-arrows">
          <button class="course-carousel-arrow" type="button" data-carousel-direction="-1" aria-label="Previous courses">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
          </button>
          <button class="course-carousel-arrow" type="button" data-carousel-direction="1" aria-label="Next courses">
            <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
          </button>
        </div>
        <div class="course-carousel-dots" aria-label="Choose a course page">
          ${Array.from({ length: totalPages }, (_, index) =>
            `<button type="button" class="course-carousel-dot${index === state.page ? " active" : ""}" data-carousel-page="${index}" aria-label="Go to course page ${index + 1}" aria-current="${index === state.page ? "true" : "false"}"></button>`
          ).join("")}
        </div>
        <span class="course-carousel-status" aria-live="polite">Page ${state.page + 1} of ${totalPages}</span>
      </div>
    </section>`;
  }

  function renderCourseCards(courses) {
    if (!courses.length) return renderCarousel(courses);

    if (isDesktopLayout()) {
      const columnCount = Math.min(courses.length, 4);
      const maximumWidth = (columnCount * 300) + ((columnCount - 1) * 18);
      return `<div class="course-grid" style="max-width:${maximumWidth}px">
        ${courses.map(courseCard).join("")}
      </div>`;
    }

    return renderCarousel(courses);
  }

  function animateCounts() {
    mount.querySelectorAll("[data-course-count]").forEach((element) => {
      const target = Number(element.dataset.courseCount);
      const suffix = element.dataset.suffix || "";
      const start = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - start) / 900, 1);
        element.textContent = `${Math.round(target * progress).toLocaleString("en-IN")}${suffix}`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }

  function render(options = {}) {
    const courses = filteredCourses();
    mount.innerHTML = `
      <div class="course-stats-grid">
        ${statCard("Active Courses", state.courses.length, "", "fa-solid fa-layer-group")}
        ${statCard("Students Trained", 5000, "+", "fa-solid fa-user-graduate")}
        ${statCard("Success Rate", 95, "%", "fa-solid fa-chart-line")}
        ${statCard("Career Guidance", 100, "%", "fa-solid fa-compass")}
      </div>
      ${renderFilters()}
      <div class="course-results-bar">
        <p><span>${courses.length}</span> course${courses.length === 1 ? "" : "s"} available</p>
      </div>
      ${renderCourseCards(courses)}
    `;

    carouselViewport = mount.querySelector(".course-carousel-viewport");
    bindEvents();
    updateCarousel(false);
    if (carouselViewport && !isDesktopLayout()) {
      carouselViewport.scrollLeft = state.page * carouselViewport.clientWidth;
      requestAnimationFrame(() => updateCarousel(false));
    }
    if (options.animateCounts !== false) animateCounts();
  }

  function updateCarousel(smooth = true) {
    if (!carouselViewport) return;
    const totalPages = Math.max(
      1,
      Math.ceil(filteredCourses().length / getSlidesPerView())
    );
    state.page = Math.max(0, Math.min(state.page, totalPages - 1));
    carouselViewport.scrollTo({
      left: state.page * carouselViewport.clientWidth,
      behavior: smooth ? "smooth" : "auto"
    });

    mount.querySelectorAll("[data-carousel-page]").forEach((dot) => {
      const active = Number(dot.dataset.carouselPage) === state.page;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", String(active));
    });

    const status = mount.querySelector(".course-carousel-status");
    if (status) status.textContent = `Page ${state.page + 1} of ${totalPages}`;

    const arrows = mount.querySelectorAll("[data-carousel-direction]");
    arrows.forEach((arrow) => {
      const direction = Number(arrow.dataset.carouselDirection);
      arrow.disabled = totalPages <= 1
        || (direction < 0 && state.page === 0)
        || (direction > 0 && state.page === totalPages - 1);
    });
  }

  function bindEvents() {
    mount.querySelector("#courseShowcaseSearch")?.addEventListener("input", (event) => {
      state.search = event.target.value;
      state.page = 0;
      render({ animateCounts: false });
      const input = mount.querySelector("#courseShowcaseSearch");
      input?.focus();
      input?.setSelectionRange(state.search.length, state.search.length);
    });

    mount.querySelectorAll("[data-course-category]").forEach((button) => {
      button.addEventListener("click", () => {
        state.activeCategory = button.dataset.courseCategory;
        state.page = 0;
        render({ animateCounts: false });
      });
    });

    mount.querySelectorAll("[data-carousel-direction]").forEach((button) => {
      button.addEventListener("click", () => {
        state.page += Number(button.dataset.carouselDirection);
        updateCarousel();
      });
    });

    mount.querySelectorAll("[data-carousel-page]").forEach((button) => {
      button.addEventListener("click", () => {
        state.page = Number(button.dataset.carouselPage);
        updateCarousel();
      });
    });

    carouselViewport?.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      state.page += event.key === "ArrowRight" ? 1 : -1;
      updateCarousel();
    });

    let scrollTimer;
    carouselViewport?.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (!carouselViewport?.clientWidth) return;
        state.page = Math.round(carouselViewport.scrollLeft / carouselViewport.clientWidth);
        updateCarousel(false);
      }, 100);
    }, { passive: true });
  }

  function showState(message, role, icon) {
    mount.innerHTML = `<div class="course-empty-state" role="${role}">
      <i class="fa-solid ${icon}" aria-hidden="true"></i>
      <p>${escapeHtml(message)}</p>
    </div>`;
  }

  showState("Loading courses…", "status", "fa-circle-notch fa-spin");

  Promise.all([
    window.CourseService.getCourses({ page: 1, page_size: 100 }),
    window.CategoryService.getCategories()
  ])
    .then(([courseData, categoryData]) => {
      state.courses = Array.isArray(courseData.items) ? courseData.items : [];
      state.categories = Array.isArray(categoryData.items) ? categoryData.items : [];
      render();
    })
    .catch((error) => {
      showState(error.message || "Courses are temporarily unavailable.", "alert", "fa-triangle-exclamation");
    });

  window.addEventListener("vision:course-filter", (event) => {
    if (event.detail?.categoryId !== undefined) {
      state.activeCategory = String(event.detail.categoryId || "");
    }
    if (event.detail?.duration !== undefined) {
      state.duration = event.detail.duration || "";
    }
    if (event.detail?.search !== undefined) {
      state.search = event.detail.search || "";
    }
    state.page = 0;
    if (state.courses.length) render({ animateCounts: false });
  });

  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!state.courses.length) return;
      state.page = 0;
      render({ animateCounts: false });
    }, 180);
  }, { passive: true });
})();
