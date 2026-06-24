(function (window) {
  "use strict";

  window.StatsService = {
    getStats() {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.request(window.API_ENDPOINTS.public.dashboardStats)
      );
    }
  };
})(window);
