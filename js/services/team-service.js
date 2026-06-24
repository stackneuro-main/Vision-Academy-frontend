(function (window) {
  "use strict";

  window.TeamService = {
    getTeamMembers() {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.request(`${window.API_ENDPOINTS.public.teams}?page_size=100`)
      );
    }
  };
})(window);
