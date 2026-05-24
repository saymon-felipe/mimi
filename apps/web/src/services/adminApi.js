import { apiRequest } from '../lib/httpClient';

export function registerAdmin(payload) {
  return apiRequest('/api/admin/register', {
    method: 'POST',
    body: payload
  });
}

export function loginAdmin(payload) {
  return apiRequest('/api/admin/login', {
    method: 'POST',
    body: payload
  });
}

export function fetchAdminDashboard(token) {
  return apiRequest('/api/admin/dashboard', {
    method: 'GET',
    token
  });
}

export function fetchAdminMe(token) {
  return apiRequest('/api/admin/me', {
    method: 'GET',
    token
  });
}

export function logoutAdmin(token) {
  return apiRequest('/api/admin/logout', {
    method: 'POST',
    token
  });
}
