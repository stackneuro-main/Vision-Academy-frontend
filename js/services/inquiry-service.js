(function (window) {
  "use strict";

  window.InquiryService = {
    submitInquiry(payload) {
      return window.VisionConfig.ready.then(() =>
        window.VisionAPI.request(window.API_ENDPOINTS.public.inquiries, {
          method: "POST",
          body: JSON.stringify(payload)
        })
      );
    }
  };
})(window);
