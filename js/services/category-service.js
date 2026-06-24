(function (window) {
  "use strict";

  window.CategoryService = {
    getCategories() {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.cachedGet(
          `${window.API_ENDPOINTS.public.categories}?page_size=100`,
          60000
        )
      );
    }
  };
})(window);
