// Runtime environment overrides for the built frontend.
// Deployers can edit this file on the server (S3/CloudFront) to set
// runtime values without rebuilding the app.
/* Example to set after upload (replace the URL):
window.__ENV__ = {
  VITE_API_BASE_URL: 'https://your-api.example.com'
};
*/
window.__ENV__ = {
// Runtime env for the built frontend.
// Using an empty string makes the app use relative URLs (recommended when
// serving the site from the same CloudFront domain that also proxies /api/*).
window.__ENV__ = {
  VITE_API_BASE_URL: ""
};