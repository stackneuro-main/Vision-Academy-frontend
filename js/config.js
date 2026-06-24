(function (window) {
  "use strict";

  const defaults = {
    BACKEND_URL: window.location.origin,
    ADMIN_TOKEN_STORAGE_KEY: "vision_admin_token",
    APP_NAME: "Vision Academy",
    APP_ENV: "production"
  };

  const values = {
    ...defaults,
    ...(window.__VISION_ENV__ || {})
  };

  if (!values.BACKEND_URL) {
    throw new Error("BACKEND_URL is missing from frontend runtime configuration");
  }

  window.VisionConfig = Object.freeze({
    values: Object.freeze(values),
    backendUrl: values.BACKEND_URL.replace(/\/+$/, ""),
    tokenStorageKey: values.ADMIN_TOKEN_STORAGE_KEY,
    appName: values.APP_NAME,
    appEnv: values.APP_ENV,
    loadError: null,
    ready: Promise.resolve()
  });
})(window);
