(function (window) {
  "use strict";

  window.TeacherService = {
    getTeachers() {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.request(`${window.API_ENDPOINTS.public.teachers}?page_size=100`)
      );
    }
  };
})(window);
