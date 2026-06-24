(() => {
  "use strict";

  const state = { token: null, admin: null, section: "dashboard", page: 1, search: "", status: "", department: "", categoryId: "", teacherId: "", records: [] };

  const $ = (selector, root = document) => root.querySelector(selector);
  const loginView = $("#loginView");
  const shell = $("#adminShell");
  const content = $("#sectionContent");
  const modal = $("#editorModal");
  const detailsModal = $("#detailsModal");
  const editorForm = $("#editorForm");

  const configs = {
    categories: {
      title: "Categories", singular: "Category", endpoint: window.API_ENDPOINTS.admin.categories,
      statuses: ["active", "inactive"],
      columns: [
        ["category_name", "Category Name"], ["category_slug", "Slug"],
        ["category_description", "Description", value => value || "—"],
        ["total_courses", "Total Courses"], ["status", "Status", badge],
        ["created_at", "Created Date", dateTime]
      ],
      fields: [
        field("category_name", "Category name", "text", true),
        field("category_slug", "Category slug", "text"),
        textarea("category_description", "Description"),
        selectField("status", "Status", ["active", "inactive"], true)
      ],
      normalize(data) {
        data.category_slug = data.category_slug || null;
        data.category_description = data.category_description || null;
        return data;
      }
    },
    courses: {
      title: "Courses", singular: "Course", endpoint: window.API_ENDPOINTS.admin.courses,
      statuses: ["active", "inactive", "draft"],
      columns: [
        ["course_thumbnail", "Thumbnail", (value, record) => courseThumbnail(value, record.course_name)],
        ["course_name", "Course"], ["category", "Category", value => value?.category_name || "—"],
        ["teacher", "Assigned Teacher", value => value?.full_name || "Unassigned"],
        ["course_duration", "Duration"], ["course_fee", "Fees", v => money(v)],
        ["status", "Status", badge]
      ],
      fields: [
        field("course_name", "Course name", "text", true),
        selectField("category_id", "Course category", [], true),
        field("course_duration", "Duration", "text", true),
        field("course_fee", "Course fee", "number", true, { min: 0, step: ".01" }),
        searchSelectField("teacher_id", "Assigned teacher", []),
        selectField("status", "Status", ["active", "inactive", "draft"], true),
        textarea("course_description", "Description", true),
        textarea("prerequisites", "Prerequisites", false, {
          placeholder: "Enter course prerequisites..."
        }),
        textarea("syllabus", "Syllabus"),
        imageField("course_thumbnail", "Thumbnail"), imageField("course_banner", "Banner")
      ],
      normalize(data) {
        data.category_id = Number(data.category_id);
        data.course_fee = Number(data.course_fee);
        data.teacher_id = data.teacher_id ? Number(data.teacher_id) : null;
        data.prerequisites = data.prerequisites?.trim() || null;
        return data;
      }
    },
    teachers: {
      title: "Teachers", singular: "Teacher", endpoint: window.API_ENDPOINTS.admin.teachers,
      statuses: ["active", "inactive"],
      columns: [
        ["teacher_code", "Teacher Code"], ["full_name", "Teacher Name"],
        ["qualification", "Qualification"], ["specialization", "Specialization"],
        ["experience", "Experience", value => `${value} year${Number(value) === 1 ? "" : "s"}`],
        ["status", "Status", badge]
      ],
      fields: [
        field("full_name", "Full name", "text", true), field("email", "Email", "email", true),
        field("phone", "Phone", "tel", true), field("qualification", "Qualification", "text", true),
        field("specialization", "Specialization", "text", true),
        field("experience", "Experience (years)", "number", true, { min: 0, max: 80 }),
        imageField("profile_image", "Profile image"),
        field("joining_date", "Joining date", "date", true),
        selectField("status", "Status", ["active", "inactive"], true)
      ],
      normalize(data) {
        data.experience = Number(data.experience);
        return data;
      }
    },
    teams: {
      title: "Teams", singular: "Staff Member", endpoint: window.API_ENDPOINTS.admin.teams,
      statuses: ["active", "inactive"],
      columns: [
        ["profile_image", "Image", (value, record) => avatar(value, record.full_name)],
        ["staff_code", "Staff Code"], ["full_name", "Name"], ["designation", "Designation"],
        ["department", "Department"], ["phone", "Phone"], ["status", "Status", badge]
      ],
      fields: [
        field("full_name", "Full name", "text", true), field("email", "Email", "email", true),
        field("phone", "Phone", "tel", true), field("designation", "Designation", "text", true),
        field("department", "Department", "text", true),
        field("joining_date", "Joining date", "date", true),
        field("experience", "Experience (years)", "number", true, { min: 0, max: 80 }),
        selectField("status", "Status", ["active", "inactive"], true),
        imageField("profile_image", "Profile image"), textarea("skills", "Skills"),
        textarea("address", "Address")
      ],
      normalize(data) {
        data.experience = Number(data.experience);
        return data;
      }
    },
    gallery: {
      title: "Gallery", singular: "Photo", endpoint: window.API_ENDPOINTS.admin.gallery,
      statuses: ["active", "inactive"],
      columns: [
        ["image", "Image Preview", (value, record) => galleryPreview(value, record.title)],
        ["gallery_code", "Gallery Code"], ["title", "Title"],
        ["display_order", "Display Order"], ["status", "Status", badge],
        ["created_at", "Created Date", dateTime]
      ],
      fields: [
        field("title", "Title", "text", true),
        imageField("image", "Image"),
        field("display_order", "Display order", "number", true, { min: 0, step: 1 }),
        selectField("status", "Status", ["active", "inactive"], true)
      ],
      normalize(data) {
        if (!data.image) throw new Error("Image is required");
        data.display_order = Number(data.display_order);
        return data;
      }
    },
    inquiries: {
      title: "Inquiries", singular: "Inquiry", endpoint: window.API_ENDPOINTS.admin.inquiries, noCreate: true,
      statuses: ["new", "contacted", "converted", "closed"],
      columns: [
        ["student_name", "Name"], ["phone", "Phone"], ["email", "Email", v => v || "—"],
        ["interested_course", "Interested course", v => v || "—"], ["created_at", "Received", dateTime],
        ["status", "Status", badge]
      ],
      fields: [selectField("status", "Status", ["new", "contacted", "converted", "closed"], true)],
      normalize(data) { return { status: data.status }; }
    }
  };

  function field(name, label, type = "text", required = false, attrs = {}) {
    return { name, label, type, required, attrs };
  }
  function textarea(name, label, required = false, attrs = {}) { return { name, label, type: "textarea", required, attrs, wide: true }; }
  function selectField(name, label, options, required = false) { return { name, label, type: "select", options, required }; }
  function searchSelectField(name, label, options, required = false) { return { name, label, type: "searchselect", options, required, wide: true }; }
  function imageField(name, label) { return { name, label, type: "image" }; }
  function checkbox(name, label) { return { name, label, type: "checkbox" }; }
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
  }
  function money(value) { return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value || 0)); }
  function dateTime(value) { return value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—"; }
  function badge(value) { return `<span class="admin-badge" data-status="${escapeHtml(value)}">${escapeHtml(value)}</span>`; }
  function titleCase(value) { return String(value || "").replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase()); }
  function avatar(value, name) {
    return value
      ? `<img class="admin-avatar" src="${escapeHtml(value)}" alt="${escapeHtml(name)}">`
      : `<span class="admin-avatar">${escapeHtml(String(name || "?").charAt(0).toUpperCase())}</span>`;
  }
  function adminInitials(name) {
    return String(name || "Vision Academy")
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join("") || "VA";
  }
  function adminAvatarMarkup(admin, className = "settings-avatar") {
    return admin.profile_image
      ? `<img class="${className}" src="${escapeHtml(admin.profile_image)}" alt="${escapeHtml(admin.full_name)}">`
      : `<span class="${className} admin-gradient-avatar">${escapeHtml(adminInitials(admin.full_name))}</span>`;
  }
  function passwordField(name, label, autocomplete) {
    return `<label>${label}<span class="password-field"><input name="${name}" type="password" minlength="8" autocomplete="${autocomplete}" required><button type="button" data-toggle-password aria-label="Show ${label.toLowerCase()}" title="Show password"><i class="fa-solid fa-eye"></i></button></span></label>`;
  }
  function bindPasswordToggles(root = document) {
    root.querySelectorAll("[data-toggle-password]").forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = "true";
      button.addEventListener("click", () => {
        const input = button.closest(".password-field")?.querySelector("input");
        if (!input) return;
        const showing = input.type === "text";
        input.type = showing ? "password" : "text";
        button.innerHTML = `<i class="fa-solid ${showing ? "fa-eye" : "fa-eye-slash"}"></i>`;
        button.setAttribute("aria-label", `${showing ? "Show" : "Hide"} password`);
        button.title = showing ? "Show password" : "Hide password";
      });
    });
  }
  function courseThumbnail(value, name) {
    return value
      ? `<img class="admin-avatar" src="${escapeHtml(value)}" alt="${escapeHtml(name)}">`
      : `<span class="admin-avatar"><i class="fa-solid fa-book-open"></i></span>`;
  }
  function galleryPreview(value, title) {
    return value
      ? `<img class="admin-gallery-preview" src="${escapeHtml(value)}" alt="${escapeHtml(title)}">`
      : `<span class="admin-avatar"><i class="fa-solid fa-image"></i></span>`;
  }

  function courseNames(courses) {
    if (!courses?.length) return "Unassigned";
    return escapeHtml(courses.map(course => course.course_name).join(", "));
  }

  function statusSwitch(record) {
    const active = record.status === "active";
    const nextStatus = active ? "inactive" : "active";
    return `<button
      class="admin-status-switch toggle-status ${active ? "is-on" : "is-off"}"
      data-id="${record.id}"
      type="button"
      role="switch"
      aria-checked="${active}"
      aria-label="Set ${escapeHtml(record.title || record.course_name || record.category_name || record.full_name || "record")} ${nextStatus}"
      title="${active ? "Active — click to turn off" : "Inactive — click to turn on"}">
      <span aria-hidden="true"></span>
    </button>`;
  }

  async function api(path, options = {}) {
    await window.VisionConfig.ready;
    if (window.VisionConfig.loadError) throw window.VisionConfig.loadError;
    const headers = { ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
    if (state.token) headers.Authorization = `Bearer ${state.token}`;
    const response = await fetch(`${window.VisionConfig.backendUrl}${path}`, { ...options, headers });
    if (response.status === 401 && path !== window.API_ENDPOINTS.admin.login) logout();
    const payload = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) {
      const validationMessage = payload?.errors?.[0]?.msg
        ?.replace(/^Value error,\s*/i, "");
      const message = validationMessage || payload?.detail || "The request could not be completed";
      throw new Error(typeof message === "string" ? message : "The request could not be completed");
    }
    return payload;
  }

  async function initialize() {
    await window.VisionConfig.ready;
    if (window.VisionConfig.loadError) {
      $("#loginMessage").textContent = window.VisionConfig.loadError.message;
      return showLogin();
    }
    state.token = localStorage.getItem(window.VisionConfig.tokenStorageKey);
    if (location.protocol === "file:") {
      $("#loginMessage").textContent = "Open admin.html through Live Server or another local web server; direct file mode is not supported.";
    }
    if (!state.token) return showLogin();
    try {
      state.admin = await api(window.API_ENDPOINTS.admin.me);
      showShell();
      navigate("dashboard");
    } catch { showLogin(); }
  }

  function showLogin() { loginView.hidden = false; shell.hidden = true; }
  function showShell() {
    loginView.hidden = true; shell.hidden = false;
    updateAdminProfileUI();
  }
  function updateAdminProfileUI() {
    $("#adminName").textContent = state.admin.full_name;
    $("#adminRole").textContent = titleCase(state.admin.role);
    $("#adminAvatar").outerHTML = state.admin.profile_image
      ? `<img class="admin-profile-avatar" id="adminAvatar" src="${escapeHtml(state.admin.profile_image)}" alt="${escapeHtml(state.admin.full_name)}">`
      : `<span class="admin-profile-avatar admin-gradient-avatar" id="adminAvatar">${escapeHtml(adminInitials(state.admin.full_name))}</span>`;
  }
  function logout() {
    localStorage.removeItem(window.VisionConfig.tokenStorageKey);
    state.token = null; state.admin = null;
    showLogin();
  }

  $("#loginForm").addEventListener("submit", async event => {
    event.preventDefault();
    if (location.protocol === "file:") {
      $("#loginMessage").textContent = "Open admin.html through Live Server, then try again.";
      return;
    }
    const form = new FormData(event.currentTarget);
    const message = $("#loginMessage");
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    const originalButtonHtml = submitButton.innerHTML;
    message.textContent = "";
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Signing In...';
    try {
      const result = await api(window.API_ENDPOINTS.admin.login, {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      state.token = result.access_token; state.admin = result.admin;
      localStorage.setItem(window.VisionConfig.tokenStorageKey, state.token);
      showShell(); navigate("dashboard");
    } catch (error) {
      message.textContent = error.message === "Failed to fetch"
        ? `Cannot reach the API at ${window.VisionConfig.backendUrl}. Check frontend/.env and start the backend server.`
        : error.message;
    } finally {
      submitButton.disabled = false;
      submitButton.innerHTML = originalButtonHtml;
    }
  });

  $("#logoutButton").addEventListener("click", logout);
  $("#profileMenuButton").addEventListener("click", event => {
    event.stopPropagation();
    const menu = $("#profileMenu");
    menu.hidden = !menu.hidden;
    event.currentTarget.setAttribute("aria-expanded", String(!menu.hidden));
  });
  document.addEventListener("click", event => {
    if (!event.target.closest(".admin-profile-wrap")) {
      $("#profileMenu").hidden = true;
      $("#profileMenuButton").setAttribute("aria-expanded", "false");
    }
  });
  document.querySelectorAll("[data-profile-section]").forEach(button => button.addEventListener("click", () => {
    $("#profileMenu").hidden = true;
    navigate(button.dataset.profileSection);
  }));
  document.querySelectorAll("[data-close-modal]").forEach(button => button.addEventListener("click", () => modal.close()));
  document.querySelectorAll("[data-close-details]").forEach(button => button.addEventListener("click", () => detailsModal.close()));
  $("#menuButton").addEventListener("click", () => $("#adminSidebar").classList.toggle("open"));
  document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => {
    navigate(button.dataset.section);
    $("#adminSidebar").classList.remove("open");
  }));

  function navigate(section, openCreate = false) {
    state.section = section; state.page = 1; state.search = ""; state.status = ""; state.department = ""; state.categoryId = ""; state.teacherId = "";
    document.querySelectorAll("[data-section]").forEach(button => button.classList.toggle("active", button.dataset.section === section));
    const settingsTitles = {
      "profile-settings": "Profile Settings",
      "security-settings": "Security Settings"
    };
    $("#pageTitle").textContent = section === "dashboard"
      ? "Welcome Back, Vision Academy Administrator 👋"
      : settingsTitles[section] || configs[section].title;
    $("#pageEyebrow").textContent = section === "dashboard"
      ? "Academy Overview"
      : settingsTitles[section] ? "Account Settings" : "Academy Management";
    if (section === "dashboard") loadDashboard();
    else if (section === "profile-settings") loadProfileSettings();
    else if (section === "security-settings") loadSecuritySettings();
    else loadList(openCreate);
  }

  function doughnut(points, palette) {
    const total = points.reduce((sum, item) => sum + Number(item.count), 0);
    if (!total) return empty("No analytics data available yet");
    let offset = 0;
    const segments = points.map((item, index) => {
      const start = offset;
      offset += Number(item.count) / total * 100;
      return `${palette[index % palette.length]} ${start}% ${offset}%`;
    }).join(",");
    return `<div class="admin-doughnut-wrap">
      <div class="admin-doughnut" style="background:conic-gradient(${segments})"><span><strong>${total}</strong><small>Total</small></span></div>
      <div class="admin-chart-legend">${points.map((item, index) => `<div><i style="background:${palette[index % palette.length]}"></i><span>${escapeHtml(titleCase(item.name))}</span><strong>${item.count}</strong></div>`).join("")}</div>
    </div>`;
  }

  async function loadDashboard() {
    content.innerHTML = loading();
    try {
      const data = await api(window.API_ENDPOINTS.admin.dashboard);
      const stats = [
        ["categories", "fa-folder-tree", "Total Categories", data.stats.total_categories],
        ["courses", "fa-book-open", "Total Courses", data.stats.total_courses],
        ["teachers", "fa-chalkboard-user", "Total Teachers", data.stats.total_teachers],
        ["team_members", "fa-people-group", "Total Team Members", data.stats.total_team_members],
        ["gallery_photos", "fa-images", "Total Gallery Photos", data.stats.total_gallery_photos],
        ["inquiries", "fa-message", "Total Inquiries", data.stats.total_inquiries]
      ];
      const points = data.charts.courses_by_category;
      const max = Math.max(...points.map(item => item.count), 1);
      content.innerHTML = `
        <section class="admin-welcome">
          <div><span>Today at Vision Academy</span><h2>Here's what's happening in your academy today.</h2><p>Monitor growth, respond to inquiries, and manage academy content from one place.</p></div>
          <div class="admin-welcome-date"><i class="fa-regular fa-calendar"></i><strong>${new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</strong></div>
        </section>
        <div class="admin-stats admin-stats-premium">${stats.map((item, index) => `<article class="admin-stat premium-stat stat-${index + 1}"><i class="fa-solid ${item[1]}"></i><div><strong>${escapeHtml(item[3])}</strong><span>${item[2]}</span><small><i class="fa-solid fa-arrow-trend-up"></i> +${data.stats.growth[item[0]] || 0} in last 30 days</small></div></article>`).join("")}</div>
        <section class="admin-quick-actions">
          ${[
            ["courses", "fa-book-medical", "Add Course"],
            ["teachers", "fa-user-plus", "Add Teacher"],
            ["teams", "fa-users-gear", "Add Team Member"],
            ["gallery", "fa-cloud-arrow-up", "Upload Gallery Photo"]
          ].map(item => `<button data-quick-section="${item[0]}"><i class="fa-solid ${item[1]}"></i><span>${item[2]}</span><small>Open management</small></button>`).join("")}
          <a href="index.html" target="_blank"><i class="fa-solid fa-arrow-up-right-from-square"></i><span>View Website</span><small>Open public site</small></a>
        </section>
        <div class="admin-analytics-grid">
          <article class="admin-panel dashboard-card"><header><div><span>Analytics</span><h2>Courses By Category</h2></div><i class="fa-solid fa-chart-pie"></i></header>${doughnut(points, ["#243bd6", "#1ba99c", "#ffc107", "#7452d6", "#e7665a", "#4c86e8"])}</article>
          <article class="admin-panel dashboard-card"><header><div><span>Distribution</span><h2>Courses By Status</h2></div><i class="fa-solid fa-chart-simple"></i></header>${doughnut(data.charts.courses_by_status, ["#1ba99c", "#e7665a", "#ffc107"])}</article>
          <article class="admin-panel dashboard-card gallery-stat-card"><header><div><span>Media Library</span><h2>Gallery Statistics</h2></div><i class="fa-solid fa-images"></i></header><div class="gallery-stat-numbers"><div><strong>${data.gallery_statistics.total_photos}</strong><span>Total Photos</span></div><div><strong>${data.gallery_statistics.active_photos}</strong><span>Active Photos</span></div></div><div class="admin-progress"><i style="width:${data.gallery_statistics.total_photos ? data.gallery_statistics.active_photos / data.gallery_statistics.total_photos * 100 : 0}%"></i></div></article>
        </div>
        <div class="admin-dashboard-grid premium-dashboard-grid">
          <article class="admin-panel dashboard-card recent-inquiries-card"><header><div><span>Admissions</span><h2>Recent Inquiries</h2></div><button data-go-section="inquiries">View All</button></header>${data.recent_inquiries.length ? `<div class="recent-inquiry-list">${data.recent_inquiries.map(item => `<div><span class="inquiry-initial">${escapeHtml(item.student_name.charAt(0).toUpperCase())}</span><div><strong>${escapeHtml(item.student_name)}</strong><p>${escapeHtml(item.interested_course || "General inquiry")}</p><time>${dateTime(item.created_at)}</time></div><button data-view-inquiry="${item.id}" title="Quick view"><i class="fa-solid fa-eye"></i></button></div>`).join("")}</div>` : empty("No inquiries received yet")}</article>
          <article class="admin-panel dashboard-card"><header><div><span>Performance</span><h2>Top Categories</h2></div><i class="fa-solid fa-ranking-star"></i></header>${points.length ? `<div class="top-category-list">${points.slice(0, 6).map(point => `<div><header><span>${escapeHtml(point.name)}</span><strong>${point.count}</strong></header><div class="admin-progress"><i style="width:${point.count / max * 100}%"></i></div></div>`).join("")}</div>` : empty("Categories will appear after courses are added")}</article>
          <article class="admin-panel dashboard-card activity-timeline-card"><header><div><span>Latest Updates</span><h2>Recent Activity</h2></div><i class="fa-solid fa-clock-rotate-left"></i></header>${data.recent_activities.length ? `<div class="activity-timeline">${data.recent_activities.map(item => `<div data-type="${escapeHtml(item.type)}"><i class="fa-solid ${item.type === "category" ? "fa-folder-plus" : item.type === "teacher" ? "fa-chalkboard-user" : item.type === "team" ? "fa-people-group" : item.type === "gallery" ? "fa-image" : item.type === "inquiry" ? "fa-message" : "fa-book-open"}"></i><div><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.description)}</p><time>${dateTime(item.created_at)}</time></div></div>`).join("")}</div>` : empty("Activity will appear as records are created")}</article>
        </div>`;
      bindDashboardActions();
    } catch (error) { renderError(error); }
  }

  function bindDashboardActions() {
    document.querySelectorAll("[data-quick-section]").forEach(button => button.addEventListener("click", async () => {
      const section = button.dataset.quickSection;
      navigate(section, true);
    }));
    document.querySelectorAll("[data-go-section]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.goSection)));
    document.querySelectorAll("[data-view-inquiry]").forEach(button => button.addEventListener("click", async () => {
      try {
        const inquiry = await api(`${window.API_ENDPOINTS.admin.inquiries}/${button.dataset.viewInquiry}`);
        openDetails(configs.inquiries, inquiry);
      } catch (error) { toast(error.message, true); }
    }));
  }

  function profilePreview() {
    return `<article class="settings-preview-card">
      ${adminAvatarMarkup(state.admin)}
      <h2>${escapeHtml(state.admin.full_name)}</h2>
      <span>${escapeHtml(titleCase(state.admin.role))}</span>
      <p>${escapeHtml(state.admin.email)}</p>
      ${badge(state.admin.is_active ? "active" : "inactive")}
    </article>`;
  }

  function accountInformation() {
    return `<article class="admin-panel settings-account-card"><h2>Account Information</h2>
      ${detailItem("Admin Name", escapeHtml(state.admin.full_name))}
      ${detailItem("Email", escapeHtml(state.admin.email))}
      ${detailItem("Role", escapeHtml(titleCase(state.admin.role)))}
      ${detailItem("Created Date", dateTime(state.admin.created_at))}
      ${detailItem("Last Login", state.admin.last_login_at ? dateTime(state.admin.last_login_at) : "First session")}
    </article>`;
  }

  function loadProfileSettings() {
    content.innerHTML = `<div class="settings-layout">
      <div class="settings-side">${profilePreview()}${accountInformation()}</div>
      <article class="admin-panel settings-form-card">
        <header><span>Personal Details</span><h2>Profile Settings</h2><p>Update the administrator identity shown throughout the dashboard.</p></header>
        <form id="profileSettingsForm" class="settings-form">
          <label>Full Name<input name="full_name" value="${escapeHtml(state.admin.full_name)}" minlength="2" maxlength="150" required></label>
          <label>Email Address<input name="email" type="email" value="${escapeHtml(state.admin.email)}" required></label>
          <label class="wide">Profile Image<input name="profile_image" type="url" value="${escapeHtml(state.admin.profile_image || "")}" placeholder="Image URL or upload below"><input type="file" data-profile-upload accept="image/jpeg,image/png,image/webp"></label>
          <p class="admin-form-message" id="profileSettingsMessage" role="alert"></p>
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-floppy-disk"></i> Save Profile</button>
        </form>
      </article>
    </div>`;
    $("#profileSettingsForm").addEventListener("submit", saveProfileSettings);
  }

  async function saveProfileSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = $("#profileSettingsMessage");
    const button = form.querySelector('button[type="submit"]');
    message.textContent = "";
    button.disabled = true;
    try {
      const file = form.querySelector("[data-profile-upload]").files[0];
      if (file) {
        const upload = new FormData();
        upload.append("file", file);
        const result = await api(window.API_ENDPOINTS.admin.uploads, { method: "POST", body: upload });
        form.elements.profile_image.value = `${window.VisionConfig.backendUrl}${result.url}`;
      }
      state.admin = await api(window.API_ENDPOINTS.admin.profile, {
        method: "PUT",
        body: JSON.stringify({
          full_name: form.elements.full_name.value.trim(),
          email: form.elements.email.value.trim(),
          profile_image: form.elements.profile_image.value.trim() || null
        })
      });
      updateAdminProfileUI();
      toast("Profile updated successfully");
      loadProfileSettings();
    } catch (error) {
      message.textContent = error.message;
    } finally {
      button.disabled = false;
    }
  }

  function loadSecuritySettings() {
    content.innerHTML = `<div class="settings-layout">
      <div class="settings-side">${profilePreview()}${accountInformation()}</div>
      <article class="admin-panel settings-form-card">
        <header><span>Account Protection</span><h2>Security Settings</h2><p>Use at least eight characters with uppercase, lowercase, and a number.</p></header>
        <form id="securitySettingsForm" class="settings-form">
          <div class="wide">${passwordField("current_password", "Current Password", "current-password")}</div>
          ${passwordField("new_password", "New Password", "new-password")}
          ${passwordField("confirm_password", "Confirm Password", "new-password")}
          <p class="admin-form-message wide" id="securitySettingsMessage" role="alert"></p>
          <button class="btn btn-primary" type="submit"><i class="fa-solid fa-shield-halved"></i> Change Password</button>
        </form>
      </article>
    </div>`;
    bindPasswordToggles(content);
    $("#securitySettingsForm").addEventListener("submit", async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const message = $("#securitySettingsMessage");
      const button = form.querySelector('button[type="submit"]');
      const currentPassword = form.elements.current_password.value;
      const newPassword = form.elements.new_password.value;
      const confirmPassword = form.elements.confirm_password.value;
      message.textContent = "";
      if (newPassword !== confirmPassword) {
        message.textContent = "New password and confirmation do not match";
        return;
      }
      if (newPassword.length < 8) {
        message.textContent = "New password must contain at least 8 characters";
        return;
      }
      if (!/[A-Z]/.test(newPassword)) {
        message.textContent = "New password must contain an uppercase letter";
        return;
      }
      if (!/[a-z]/.test(newPassword)) {
        message.textContent = "New password must contain a lowercase letter";
        return;
      }
      if (!/\d/.test(newPassword)) {
        message.textContent = "New password must contain a number";
        return;
      }
      if (newPassword === currentPassword) {
        message.textContent = "New password must be different from current password";
        return;
      }
      button.disabled = true;
      try {
        const result = await api(window.API_ENDPOINTS.admin.changePassword, {
          method: "POST",
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
            confirm_password: confirmPassword
          })
        });
        form.reset();
        toast(result.message);
      } catch (error) {
        message.textContent = error.message;
      } finally {
        button.disabled = false;
      }
    });
  }

  async function loadList(openCreate = false) {
    const config = configs[state.section];
    await prepareListFilters(config);
    content.innerHTML = `<article class="admin-panel">${toolbar(config)}<div id="listArea">${loading()}</div></article>`;
    bindToolbar(config);
    if (openCreate) $("#addRecord")?.click();
    try {
      const params = new URLSearchParams({ page: state.page, page_size: 15 });
      if (state.search) params.set("search", state.search);
      if (state.status) params.set("status", state.status);
      if (state.section === "teams" && state.department) params.set("department", state.department);
      if (state.section === "courses" && state.categoryId) params.set("category_id", state.categoryId);
      if (state.section === "courses" && state.teacherId) params.set("teacher_id", state.teacherId);
      const data = await api(`${config.endpoint}?${params}`);
      state.records = data.items;
      $("#listArea").innerHTML = data.items.length ? table(config, data) : empty(`No ${config.title.toLowerCase()} found`);
      bindTable(config, data);
    } catch (error) { $("#listArea").innerHTML = empty(error.message, true); }
  }

  function toolbar(config) {
    return `<div class="admin-toolbar">
      <input class="admin-search" id="listSearch" type="search" value="${escapeHtml(state.search)}" placeholder="Search ${config.title.toLowerCase()}...">
      <select id="statusFilter"><option value="">All statuses</option>${config.statuses.map(item => `<option value="${item}" ${state.status === item ? "selected" : ""}>${titleCase(item)}</option>`).join("")}</select>
      ${state.section === "courses" ? `<select id="categoryFilter"><option value="">All categories</option>${(config.categoryOptions || []).map(item => `<option value="${item.id}" ${String(state.categoryId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.category_name)}</option>`).join("")}</select><select id="teacherFilter"><option value="">All teachers</option>${(config.teacherOptions || []).map(item => `<option value="${item.id}" ${String(state.teacherId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.full_name)}</option>`).join("")}</select>` : ""}
      ${state.section === "teams" ? `<input id="departmentFilter" type="search" value="${escapeHtml(state.department)}" placeholder="Filter department">` : ""}
      ${config.noCreate ? "" : `<button class="btn btn-primary" id="addRecord"><i class="fa-solid fa-plus"></i> Add ${config.singular}</button>`}
    </div>`;
  }
  function bindToolbar(config) {
    let timer;
    $("#listSearch").addEventListener("input", event => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.search = event.target.value.trim(); state.page = 1; loadList(); }, 350);
    });
    $("#statusFilter").addEventListener("change", event => { state.status = event.target.value; state.page = 1; loadList(); });
    $("#categoryFilter")?.addEventListener("change", event => { state.categoryId = event.target.value; state.page = 1; loadList(); });
    $("#teacherFilter")?.addEventListener("change", event => { state.teacherId = event.target.value; state.page = 1; loadList(); });
    let departmentTimer;
    $("#departmentFilter")?.addEventListener("input", event => {
      clearTimeout(departmentTimer);
      departmentTimer = setTimeout(() => { state.department = event.target.value.trim(); state.page = 1; loadList(); }, 350);
    });
    $("#addRecord")?.addEventListener("click", () => openEditor(config));
  }

  function table(config, data) {
    return `<div class="admin-table-wrap"><table class="admin-table"><thead><tr>${config.columns.map(column => `<th>${column[1]}</th>`).join("")}<th>Actions</th></tr></thead>
      <tbody>${data.items.map(record => `<tr>${config.columns.map(column => {
        const raw = record[column[0]]; const rendered = column[2] ? column[2](raw, record) : escapeHtml(raw ?? "—");
        return `<td>${column[0].includes("name") && !column[2] ? `<strong>${rendered}</strong>` : rendered}</td>`;
      }).join("")}<td><div class="admin-actions"><button class="admin-icon-btn view" data-id="${record.id}" title="View"><i class="fa-solid fa-eye"></i></button><button class="admin-icon-btn edit" data-id="${record.id}" title="Edit"><i class="fa-solid fa-pen"></i></button>${["teams", "teachers", "categories", "courses", "gallery"].includes(state.section) ? statusSwitch(record) : ""}${state.admin.role === "super_admin" ? `<button class="admin-icon-btn delete" data-id="${record.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>` : ""}</div></td></tr>`).join("")}</tbody></table></div>
      <div class="admin-pagination"><span>Page ${data.page} of ${Math.max(data.pages, 1)} · ${data.total} records</span><div><button class="btn admin-btn-light" id="prevPage" ${data.page <= 1 ? "disabled" : ""}>Previous</button><button class="btn admin-btn-light" id="nextPage" ${data.page >= data.pages ? "disabled" : ""}>Next</button></div></div>`;
  }
  function bindTable(config, data) {
    document.querySelectorAll(".view").forEach(button => button.addEventListener("click", () => openDetails(config, state.records.find(item => item.id === Number(button.dataset.id)))));
    document.querySelectorAll(".edit").forEach(button => button.addEventListener("click", () => openEditor(config, state.records.find(item => item.id === Number(button.dataset.id)))));
    document.querySelectorAll(".toggle-status").forEach(button => button.addEventListener("click", () => toggleStatus(config, state.records.find(item => item.id === Number(button.dataset.id)))));
    document.querySelectorAll(".delete").forEach(button => button.addEventListener("click", () => deleteRecord(config, Number(button.dataset.id))));
    $("#prevPage")?.addEventListener("click", () => { state.page--; loadList(); });
    $("#nextPage")?.addEventListener("click", () => { state.page++; loadList(); });
  }

  async function openEditor(config, record = null) {
    $("#modalKicker").textContent = record ? "Update record" : "New record";
    $("#modalTitle").textContent = `${record ? "Edit" : "Add"} ${config.singular}`;
    $("#formMessage").textContent = "";
    editorForm.dataset.id = record?.id || "";
    editorForm.dataset.section = state.section;
    if (state.section === "courses") await hydrateOptions(config);
    $("#formFields").innerHTML = config.fields.map(item => renderField(item, record)).join("");
    bindSearchSelects();
    modal.showModal();
  }

  async function hydrateOptions(config) {
    if (state.section === "courses") {
      const categories = await api(`${window.API_ENDPOINTS.admin.categories}?page_size=100&status=active`);
      const teachers = await api(`${window.API_ENDPOINTS.admin.teachers}?page_size=100&status=active`);
      config.fields.find(item => item.name === "category_id").options = categories.items.map(item => [item.id, item.category_name]);
      config.fields.find(item => item.name === "teacher_id").options = teachers.items.map(item => [item.id, item.full_name]);
    }
  }

  async function prepareListFilters(config) {
    if (state.section !== "courses") return;
    const [categories, teachers] = await Promise.all([
      api(`${window.API_ENDPOINTS.admin.categories}?page_size=100`),
      api(`${window.API_ENDPOINTS.admin.teachers}?page_size=100`)
    ]);
    config.categoryOptions = categories.items;
    config.teacherOptions = teachers.items;
  }

  function renderField(item, record) {
    const value = record?.[item.name] ?? (item.type === "checkbox" ? true : "");
    const classes = item.wide || ["textarea", "image"].includes(item.type) ? "wide" : "";
    if (item.type === "textarea") {
      const attrs = Object.entries(item.attrs || {}).map(([key, val]) => `${key}="${escapeHtml(val)}"`).join(" ");
      return `<label class="${classes}">${item.label}<textarea name="${item.name}" ${item.required ? "required" : ""} ${attrs}>${escapeHtml(value)}</textarea></label>`;
    }
    if (item.type === "select") return `<label>${item.label}<select name="${item.name}" ${item.required ? "required" : ""}><option value="">Select ${item.label.toLowerCase()}</option>${item.options.map(option => {
      const pair = Array.isArray(option) ? option : [option, titleCase(option)];
      return `<option value="${escapeHtml(pair[0])}" ${String(value) === String(pair[0]) ? "selected" : ""}>${escapeHtml(pair[1])}</option>`;
    }).join("")}</select></label>`;
    if (item.type === "searchselect") {
      const placeholder = item.name === "teacher_id"
        ? "Search active teachers..."
        : "Search options...";
      return `<label class="wide">${item.label}<input type="search" data-search-select="${item.name}" placeholder="${placeholder}"><select name="${item.name}" ${item.required ? "required" : ""}><option value="">Select ${item.label.toLowerCase()}</option>${item.options.map(option => {
        const pair = Array.isArray(option) ? option : [option, titleCase(option)];
        return `<option value="${escapeHtml(pair[0])}" ${String(value) === String(pair[0]) ? "selected" : ""}>${escapeHtml(pair[1])}</option>`;
      }).join("")}</select></label>`;
    }
    if (item.type === "checkbox") return `<label class="admin-check wide"><input type="checkbox" name="${item.name}" ${value ? "checked" : ""}> ${item.label}</label>`;
    if (item.type === "image") return `<label class="wide">${item.label}<input type="url" name="${item.name}" value="${escapeHtml(value)}" placeholder="Image URL or upload below"><input type="file" data-upload-for="${item.name}" accept="image/jpeg,image/png,image/webp"></label>`;
    const attrs = Object.entries(item.attrs || {}).map(([key, val]) => `${key}="${val}"`).join(" ");
    return `<label class="${classes}">${item.label}<input type="${item.type}" name="${item.name}" value="${escapeHtml(value)}" ${item.required ? "required" : ""} ${attrs}></label>`;
  }

  editorForm.addEventListener("submit", async event => {
    event.preventDefault();
    const section = editorForm.dataset.section;
    const config = configs[section];
    const id = editorForm.dataset.id;
    const message = $("#formMessage");
    message.textContent = "";
    try {
      await uploadPendingImages(editorForm);
      const form = new FormData(editorForm);
      const payload = {};
      config.fields.forEach(item => {
        if (item.type === "image") payload[item.name] = form.get(item.name) || null;
        else if (item.type === "checkbox") payload[item.name] = form.has(item.name);
        else payload[item.name] = form.get(item.name);
      });
      config.normalize(payload);
      await api(`${config.endpoint}${id ? `/${id}` : ""}`, { method: id ? "PUT" : "POST", body: JSON.stringify(payload) });
      modal.close(); toast(`${config.singular} ${id ? "updated" : "created"} successfully`); loadList();
    } catch (error) { message.textContent = error.message; }
  });

  async function uploadPendingImages(formElement) {
    const files = [...formElement.querySelectorAll("[data-upload-for]")].filter(input => input.files[0]);
    for (const input of files) {
      const body = new FormData(); body.append("file", input.files[0]);
      const result = await api(window.API_ENDPOINTS.admin.uploads, { method: "POST", body });
      formElement.elements[input.dataset.uploadFor].value = `${window.VisionConfig.backendUrl}${result.url}`;
    }
  }

  async function deleteRecord(config, id) {
    if (!confirm(`Delete this ${config.singular.toLowerCase()}? This cannot be undone.`)) return;
    try {
      await api(`${config.endpoint}/${id}`, { method: "DELETE" });
      toast(`${config.singular} deleted`); loadList();
    } catch (error) { toast(error.message, true); }
  }

  function bindSearchSelects() {
    document.querySelectorAll("[data-search-select]").forEach(input => {
      const select = editorForm.elements[input.dataset.searchSelect];
      const options = [...select.options].slice(1);
      input.addEventListener("input", () => {
        const query = input.value.trim().toLowerCase();
        options.forEach(option => {
          option.hidden = Boolean(query) && !option.textContent.toLowerCase().includes(query);
        });
      });
    });
  }

  async function toggleStatus(config, record) {
    const status = record.status === "active" ? "inactive" : "active";
    try {
      await api(`${config.endpoint}/${record.id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      toast(`${config.singular} status changed to ${status}`);
      loadList();
    } catch (error) { toast(error.message, true); }
  }

  function openDetails(config, record) {
    $("#detailsTitle").textContent = `${config.singular} Details`;
    $("#detailsContent").innerHTML = state.section === "teachers"
      ? teacherDetails(record)
      : state.section === "teams"
        ? teamDetails(record)
        : state.section === "courses"
          ? courseDetails(record)
          : state.section === "gallery"
            ? galleryDetails(record)
            : genericDetails(config, record);
    detailsModal.showModal();
  }

  function detailItem(label, value, wide = false) {
    return `<div class="admin-detail-item${wide ? " wide" : ""}"><span>${escapeHtml(label)}</span><strong>${value ?? "—"}</strong></div>`;
  }

  function profileHero(record, subtitle) {
    return `<div class="admin-detail-hero">${avatar(record.profile_image, record.full_name)}<div><h3>${escapeHtml(record.full_name)}</h3><p>${escapeHtml(subtitle)}</p>${badge(record.status)}</div></div>`;
  }

  function teamDetails(record) {
    return `${profileHero(record, `${record.designation} · ${record.department}`)}
      ${detailItem("Staff Code", escapeHtml(record.staff_code))}
      ${detailItem("Phone", escapeHtml(record.phone))}
      ${detailItem("Email", escapeHtml(record.email))}
      ${detailItem("Joining Date", escapeHtml(record.joining_date))}
      ${detailItem("Experience", `${record.experience} years`)}
      ${detailItem("Skills", escapeHtml(record.skills || "—"), true)}
      ${detailItem("Address", escapeHtml(record.address || "—"), true)}`;
  }

  function teacherDetails(record) {
    const courses = record.assigned_courses?.length
      ? `<div class="admin-course-tags">${record.assigned_courses.map(course => `<span>${escapeHtml(course.course_name)} · ${escapeHtml(course.category.category_name)} · ${escapeHtml(course.course_duration)} · ${titleCase(course.status)}</span>`).join("")}</div>`
      : "No assigned courses";
    return `${profileHero(record, record.specialization)}
      ${detailItem("Teacher Code", escapeHtml(record.teacher_code))}
      ${detailItem("Qualification", escapeHtml(record.qualification))}
      ${detailItem("Phone", escapeHtml(record.phone))}
      ${detailItem("Email", escapeHtml(record.email))}
      ${detailItem("Experience", `${record.experience} years`)}
      ${detailItem("Joining Date", escapeHtml(record.joining_date))}
      ${detailItem("Total Courses Assigned", record.total_courses_assigned)}
      ${detailItem("Assigned Courses", courses, true)}
      ${detailItem("Address", escapeHtml(record.address || "—"), true)}`;
  }

  function courseDetails(record) {
    return `${detailItem("Course Code", escapeHtml(record.course_code))}
      ${detailItem("Course Name", escapeHtml(record.course_name))}
      ${detailItem("Category", escapeHtml(record.category?.category_name || "—"))}
      ${detailItem("Assigned Teacher", escapeHtml(record.teacher?.full_name || "Unassigned"))}
      ${detailItem("Duration", escapeHtml(record.course_duration))}
      ${detailItem("Fees", money(record.course_fee))}
      ${detailItem("Status", badge(record.status))}
      ${detailItem("Description", escapeHtml(record.course_description), true)}
      ${detailItem("Prerequisites", escapeHtml(record.prerequisites || "No prerequisites specified."), true)}
      ${detailItem("Syllabus", escapeHtml(record.syllabus || "—"), true)}`;
  }

  function galleryDetails(record) {
    return `<div class="admin-gallery-detail wide">
        <img src="${escapeHtml(record.image)}" alt="${escapeHtml(record.title)}">
      </div>
      ${detailItem("Gallery Code", escapeHtml(record.gallery_code))}
      ${detailItem("Title", escapeHtml(record.title))}
      ${detailItem("Display Order", record.display_order)}
      ${detailItem("Status", badge(record.status))}
      ${detailItem("Created Date", dateTime(record.created_at))}`;
  }

  function genericDetails(config, record) {
    return config.columns.map(column => {
      const raw = record[column[0]];
      const rendered = column[2] ? column[2](raw, record) : escapeHtml(raw ?? "—");
      return detailItem(column[1], rendered);
    }).join("");
  }

  function loading() { return `<div class="admin-loading"><i class="fa-solid fa-circle-notch fa-spin"></i>Loading...</div>`; }
  function empty(message, error = false) { return `<div class="admin-empty"><i class="fa-solid ${error ? "fa-triangle-exclamation" : "fa-inbox"}"></i>${escapeHtml(message)}</div>`; }
  function renderError(error) { content.innerHTML = empty(error.message, true); }
  function toast(message, error = false) {
    const node = $("#toast"); node.textContent = message; node.className = `admin-toast show${error ? " error" : ""}`;
    clearTimeout(toast.timer); toast.timer = setTimeout(() => node.className = "admin-toast", 3200);
  }

  bindPasswordToggles();
  initialize();
})();
