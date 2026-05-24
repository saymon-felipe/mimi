export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeEmail(value) {
  return normalizeString(value).toLowerCase();
}

export function normalizeList(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeString).filter(Boolean);
  }

  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }

  return [];
}
