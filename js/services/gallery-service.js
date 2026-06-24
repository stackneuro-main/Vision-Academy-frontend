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

  window.GalleryService = {
    getGallery(params = {}, ttl = 30000) {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.cachedGet(
          `${window.API_ENDPOINTS.public.gallery}${queryString(params)}`,
          ttl
        )
      );
    }
  };
})(window);
