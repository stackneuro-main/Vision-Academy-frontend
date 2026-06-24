(function (window) {
  "use strict";

  const cache = new Map();

  function cacheKey(path) {
    return `${window.VisionConfig.backendUrl}${path}`;
  }

  async function request(path, options = {}) {
    await window.VisionConfig.ready;
    if (window.VisionConfig.loadError) throw window.VisionConfig.loadError;
    const response = await fetch(`${window.VisionConfig.backendUrl}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {})
      }
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload.detail === "Validation failed"
        ? payload.errors?.[0]?.msg
        : payload.detail;
      throw new Error(message || "Unable to complete the request.");
    }
    return payload;
  }

  async function cachedGet(path, ttl = 30000) {
    await window.VisionConfig.ready;
    const key = cacheKey(path);
    const stored = cache.get(key);
    if (stored && Date.now() - stored.createdAt < ttl) return stored.value;
    const value = await request(path);
    cache.set(key, { value, createdAt: Date.now() });
    return value;
  }

  window.VisionAPI = {
    get baseUrl() {
      return window.VisionConfig.backendUrl;
    },
    request,
    cachedGet,
    clearCache() {
      cache.clear();
    }
  };
})(window);
