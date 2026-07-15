const TOKEN_KEY = 'auth_token';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token || token === 'null' || token === 'undefined') return null;
  return token;
}

export function setToken(token) {
  token ? localStorage.setItem(TOKEN_KEY, token) : clearToken();
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch(path, options = {}) {
  const url = API_BASE_URL + (path.startsWith('/') ? path : '/' + path);
  const headers = { ...options.headers };
  const token = getToken();

  if (token) headers['Authorization'] = 'Bearer ' + token;

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(url, { ...options, headers, body });

  if (res.status === 204) return null;

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = payload?.detail;
    throw new Error(
      typeof detail === 'string' ? detail : detail ? JSON.stringify(detail) : 'HTTP ' + res.status
    );
  }

  return payload;
}
