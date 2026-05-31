// Runtime environment overrides for the built frontend.
// Deployers can edit this file on the server (S3/CloudFront) to set
// runtime values without rebuilding the app.
(function () {
  const runtimeEnv = {
    // Using an empty string makes the app use relative URLs (recommended when
    // serving the site from the same CloudFront domain that also proxies /api/*).
    VITE_API_BASE_URL: "",
  };

  window.__ENV = runtimeEnv;
  window.__ENV__ = runtimeEnv;
})();