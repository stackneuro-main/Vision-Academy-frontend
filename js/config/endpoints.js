(function (window) {
  "use strict";

  window.API_ENDPOINTS = Object.freeze({
    public: Object.freeze({
      categories: "/api/categories",
      courses: "/api/courses",
      inquiries: "/api/inquiries",
      gallery: "/api/gallery",
      teachers: "/api/teachers",
      teams: "/api/teams",
      dashboardStats: "/api/dashboard/stats"
    }),
    admin: Object.freeze({
      login: "/api/admin/auth/login",
      me: "/api/admin/auth/me",
      dashboard: "/api/admin/dashboard",
      profile: "/api/admin/profile",
      changePassword: "/api/admin/security/password",
      categories: "/api/admin/categories",
      courses: "/api/admin/courses",
      teachers: "/api/admin/teachers",
      teams: "/api/admin/teams",
      gallery: "/api/admin/gallery",
      inquiries: "/api/admin/inquiries",
      uploads: "/api/admin/uploads/images"
    })
  });
})(window);
