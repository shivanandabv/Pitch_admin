const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
).replace(/\/$/, '');

const TOKEN_KEY = 'pitchxpo_admin_token';
const PROFILE_KEY = 'pitchxpo_admin_profile';

const PUBLIC_AUTH_PATHS = [
  '/api/admin/login',
  '/api/admin/forgot-password',
  '/api/admin/reset-password',
];

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function getProfile() {
  try {
    return JSON.parse(sessionStorage.getItem(PROFILE_KEY) || 'null');
  } catch {
    return null;
  }
}

export function setSession(token, admin) {
  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  if (admin) sessionStorage.setItem(PROFILE_KEY, JSON.stringify(admin));
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(PROFILE_KEY);
}

function isPublicAuthPath(path) {
  const pathname = String(path || '').split('?')[0];
  return PUBLIC_AUTH_PATHS.includes(pathname);
}

function handleUnauthorized(path) {
  if (isPublicAuthPath(path)) return;
  if (!getToken()) return;
  clearSession();
  if (typeof location !== 'undefined' && !String(location.hash || '').includes('login')) {
    location.hash = '#login';
  }
}

export async function apiRequest(path, { method = 'GET', body, raw } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined && !raw) headers['Content-Type'] = 'application/json';

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : raw ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Unable to reach the server. Please try again.', 0);
  }

  if (response.status === 401) {
    handleUnauthorized(path);
  }

  if (raw) return response;

  let data = null;
  try {
    data = await response.json();
  } catch {
    throw new ApiError('Unexpected server response.', response.status);
  }

  if (!response.ok || data?.success === false) {
    const detailMessage = data?.details?.map((d) => d.message).filter(Boolean).join(' ');
    throw new ApiError(
      detailMessage || data?.message || 'Request failed.',
      response.status,
      data?.details,
    );
  }

  return data;
}

export const api = {
  login: (email, password) => apiRequest('/api/admin/login', { method: 'POST', body: { email, password } }),
  me: () => apiRequest('/api/admin/me'),
  updateMe: (body) => apiRequest('/api/admin/me', { method: 'PATCH', body }),
  changePassword: (body) => apiRequest('/api/admin/change-password', { method: 'POST', body }),
  changeEmail: (body) => apiRequest('/api/admin/change-email', { method: 'POST', body }),
  forgotPassword: (email) => apiRequest('/api/admin/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (body) => apiRequest('/api/admin/reset-password', { method: 'POST', body }),
  dashboard: () => apiRequest('/api/admin/dashboard'),
  submissions: (query) => apiRequest(`/api/admin/submissions${query}`),
  submission: (id) => apiRequest(`/api/admin/submissions/${encodeURIComponent(id)}`),
  updateStatus: (id, status) =>
    apiRequest(`/api/admin/submissions/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status },
    }),
  addNote: (id, body) =>
    apiRequest(`/api/admin/submissions/${encodeURIComponent(id)}/notes`, {
      method: 'POST',
      body: { body },
    }),
  payments: (query) => apiRequest(`/api/admin/payments${query}`),
  events: () => apiRequest('/api/admin/events'),
  createEvent: (body) => apiRequest('/api/admin/events', { method: 'POST', body }),
  updateEvent: (id, body) => apiRequest(`/api/admin/events/${id}`, { method: 'PATCH', body }),
  deleteEvent: (id) => apiRequest(`/api/admin/events/${id}`, { method: 'DELETE' }),
  categories: () => apiRequest('/api/admin/categories'),
  createCategory: (body) => apiRequest('/api/admin/categories', { method: 'POST', body }),
  updateCategory: (id, body) => apiRequest(`/api/admin/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => apiRequest(`/api/admin/categories/${id}`, { method: 'DELETE' }),
  users: () => apiRequest('/api/admin/users'),
  createUser: (body) => apiRequest('/api/admin/users', { method: 'POST', body }),
  updateUser: (id, body) => apiRequest(`/api/admin/users/${id}`, { method: 'PATCH', body }),
  deleteUser: (id) => apiRequest(`/api/admin/users/${id}`, { method: 'DELETE' }),
};

export async function downloadCsv(path, filename) {
  const response = await apiRequest(path, { raw: true });
  if (!response.ok) {
    let message = 'Export failed.';
    try {
      const data = await response.json();
      message = data.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, response.status);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export { API_BASE_URL };
