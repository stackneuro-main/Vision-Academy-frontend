(function (window) {
  "use strict";

  function queryString(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, value);
      }
    });
    const serialized = query.toString();
    return serialized ? `?${serialized}` : "";
  }

  window.CourseService = {
    getCourses(params = {}) {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.request(`${window.API_ENDPOINTS.public.courses}${queryString(params)}`)
      );
    },
    getCourse(courseId) {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.cachedGet(`${window.API_ENDPOINTS.public.courses}/${courseId}`, 30000)
      );
    },
    getCourseBySlug(slug) {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.cachedGet(
          `${window.API_ENDPOINTS.public.courses}/slug/${encodeURIComponent(slug)}`,
          30000
        )
      );
    }
  };
})(window);
