import { apiRequest } from '../lib/httpClient';

export function submitWaitlistLead(payload) {
  return apiRequest('/api/waitlist', {
    method: 'POST',
    body: payload
  });
}

export function submitContactMessage(payload) {
  return apiRequest('/api/contact', {
    method: 'POST',
    body: payload
  });
}
