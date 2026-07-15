import { apiFetch, setToken, clearToken } from './api';

const USER_ID_KEY = 'user_id';

function _persist(data) {
  setToken(data.access_token);
  if (data.user_id) localStorage.setItem(USER_ID_KEY, data.user_id);
  return { token: data.access_token };
}

export async function login(email, password) {
  const data = await apiFetch('/auth/login', { method: 'POST', body: { email, password } });
  return data?.access_token ? _persist(data) : { token: null };
}

export async function register(email, password, extra = {}) {
  const data = await apiFetch('/auth/register', {
    method: 'POST',
    body: { email, password, ...extra },
  });
  return data?.access_token ? _persist(data) : { token: null };
}

export function logout() {
  clearToken();
  localStorage.removeItem(USER_ID_KEY);
}
