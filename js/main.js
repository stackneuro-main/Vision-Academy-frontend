document.addEventListener("DOMContentLoaded", () => {
  const header = document.getElementById("siteHeader");
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  const backToTop = document.getElementById("backToTop");
  const counters = document.querySelectorAll("[data-count]");
  const reveals = document.querySelectorAll(".reveal");
  const sections = document.querySelectorAll("main section[id]");
  const navLinks = document.querySelectorAll(".nav-menu a");
  let publicCourses = [];

  window.showVisionToast = (message, type = "success") => {
    let toast = document.getElementById("visionToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "visionToast";
      toast.className = "public-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `public-toast show ${type}`;
    clearTimeout(window.showVisionToast.timer);
    window.showVisionToast.timer = setTimeout(() => {
      toast.className = "public-toast";
    }, 3500);
  };

  const appendOptions = (select, items, valueKey, labelKey) => {
    if (!select) return;
    items.forEach((item) => {
      const option = document.createElement("option");
      option.value = item[valueKey];
      option.textContent = item[labelKey];
      select.appendChild(option);
    });
  };

  const loadPublicCatalogControls = async () => {
    if (!window.CourseService || !window.CategoryService) return;
    try {
      const [courseData, categoryData] = await Promise.all([
        window.CourseService.getCourses({ page: 1, page_size: 100 }),
        window.CategoryService.getCategories()
      ]);
      publicCourses = courseData.items;
      const availableCoursesText = document.getElementById(
        "availableCoursesText"
      );
      if (availableCoursesText) {
        availableCoursesText.textContent = publicCourses.length
          ? `${publicCourses.map((course) => course.course_name).join(", ")} are currently available.`
          : "No active programs are currently listed.";
      }
      appendOptions(
        document.getElementById("courseSearchSelect"),
        publicCourses,
        "id",
        "course_name"
      );
      appendOptions(
        document.getElementById("inquiryCourseSelect"),
        publicCourses,
        "id",
        "course_name"
      );
      appendOptions(
        document.getElementById("courseCategorySelect"),
        categoryData.items,
        "id",
        "category_name"
      );

      const durationSelect = document.getElementById(
        "courseDurationSelect"
      );
      const durations = [...new Set(
        publicCourses.map((course) => course.course_duration)
      )].sort();
      durations.forEach((duration) => {
        const option = document.createElement("option");
        option.value = duration;
        option.textContent = duration;
        durationSelect?.appendChild(option);
      });

      const footer = document.getElementById("footerCourseLinks");
      if (footer) {
        publicCourses.slice(0, 4).forEach((course) => {
          const link = document.createElement("a");
          link.href = `course-details.html?id=${course.id}`;
          link.textContent = course.course_name;
          footer.appendChild(link);
        });
      }
    } catch (error) {
      window.showVisionToast(
        "Course information is temporarily unavailable.",
        "error"
      );
    }
  };

  loadPublicCatalogControls();

  const setHeaderState = () => {
    const scrolled = window.scrollY > 20;
    header?.classList.toggle("scrolled", scrolled);
    backToTop?.classList.toggle("show", window.scrollY > 520);
  };

  setHeaderState();
  window.addEventListener("scroll", setHeaderState, { passive: true });

  navToggle?.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.classList.toggle("open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open menu");
    });
  });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  document.addEventListener("click", (event) => {
    if (
      !navMenu?.classList.contains("open")
      || navMenu.contains(event.target)
      || navToggle?.contains(event.target)
    ) return;
    navMenu.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !navMenu?.classList.contains("open")) return;
    navMenu.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
    navToggle?.focus();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth <= 1024) return;
    navMenu?.classList.remove("open");
    navToggle?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open menu");
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const href = anchor.getAttribute("href");
      if (!href || href === "#") return;
      const target = document.querySelector(href);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });

  reveals.forEach((item) => revealObserver.observe(item));

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      counters.forEach((counter) => {
        const target = Number(counter.dataset.count);
        const suffix = counter.dataset.suffix || "";
        const duration = 1300;
        const startTime = performance.now();

        const update = (now) => {
          const progress = Math.min((now - startTime) / duration, 1);
          counter.textContent = `${Math.floor(progress * target).toLocaleString("en-IN")}${suffix}`;
          if (progress < 1) requestAnimationFrame(update);
        };

        requestAnimationFrame(update);
      });

      counterObserver.disconnect();
    });
  }, { threshold: 0.4 });

  const statsCard = document.getElementById("statsCard");
  if (statsCard && window.StatsService) {
    window.StatsService.getStats()
      .then((stats) => {
        statsCard.querySelectorAll("[data-stat]").forEach((counter) => {
          counter.dataset.count = stats[counter.dataset.stat] ?? 0;
        });
      })
      .catch(() => {
        window.showVisionToast(
          "Academy statistics are temporarily unavailable.",
          "error"
        );
      })
      .finally(() => counterObserver.observe(statsCard));
  } else if (statsCard) {
    counterObserver.observe(statsCard);
  }

  document.querySelectorAll(".faq-item button").forEach((button) => {
    button.addEventListener("click", () => {
      const item = button.closest(".faq-item");
      document.querySelectorAll(".faq-item").forEach((faq) => {
        if (faq !== item) faq.classList.remove("active");
      });
      item.classList.toggle("active");
    });
  });

  const activeObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      navLinks.forEach((link) => {
        link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  }, { rootMargin: "-45% 0px -48% 0px" });

  sections.forEach((section) => activeObserver.observe(section));

  document.querySelectorAll("form").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      form.classList.add("form-submitted");
      setTimeout(() => form.classList.remove("form-submitted"), 900);

      if (form.classList.contains("search-card")) {
        const data = new FormData(form);
        const courseId = data.get("course_id");
        if (courseId) {
          window.location.href = `course-details.html?id=${courseId}`;
          return;
        }
        const categoryId = data.get("category_id");
        const duration = data.get("duration");
        document.getElementById("courses")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        window.dispatchEvent(new CustomEvent("vision:course-filter", {
          detail: { categoryId, duration }
        }));
        return;
      }

      if (!form.classList.contains("contact-form")) return;

      const button = form.querySelector('button[type="submit"]');
      const originalText = button.textContent;
      const data = new FormData(form);
      button.disabled = true;
      button.textContent = "Sending...";

      try {
        const selectedCourseId = data.get("course_id");
        const selectedCourse = publicCourses.find(
          (course) => String(course.id) === String(selectedCourseId)
        );
        await window.InquiryService.submitInquiry({
          name: data.get("name"),
          email: data.get("email") || null,
          phone: data.get("phone"),
          course_id: selectedCourseId
            ? Number(selectedCourseId)
            : null,
          interested_course: selectedCourse?.course_name || null,
          message: data.get("message") || null
        });
        form.reset();
        button.textContent = "Enquiry Sent";
        window.showVisionToast(
          "Your enquiry has been submitted successfully.",
          "success"
        );
      } catch (error) {
        button.textContent = "Please Try Again";
        window.showVisionToast(error.message, "error");
      } finally {
        setTimeout(() => {
          button.disabled = false;
          button.textContent = originalText;
        }, 2500);
      }
    });
  });
});
