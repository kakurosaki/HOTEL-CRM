const runtimeEnv = (typeof window !== "undefined" && window.__ENV) || {};
const rawBase = runtimeEnv.VITE_API_BASE_URL || runtimeEnv.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || "";
const apiBaseUrl = (rawBase && rawBase.replace ? rawBase.replace(/\/$/, "") : rawBase) || "";

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${apiBaseUrl}${normalizedPath}`;
};

export const apiFetch = (path, options) => {
  return fetch(buildApiUrl(path), options);
};