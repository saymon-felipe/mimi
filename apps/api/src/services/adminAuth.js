import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export const adminSessionDurationMs = 1000 * 60 * 60 * 24 * 7;

export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [algorithm, salt, hash] = String(storedHash || '').split(':');

  if (algorithm !== 'scrypt' || !salt || !hash) {
    return false;
  }

  const candidate = Buffer.from(hashPassword(password, salt).split(':')[2], 'hex');
  const expected = Buffer.from(hash, 'hex');

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function createSessionToken() {
  return randomBytes(32).toString('hex');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function getSessionExpiry() {
  return new Date(Date.now() + adminSessionDurationMs);
}

export function sanitizeAdminUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    admin: user.admin,
    createdAt: user.createdAt
  };
}
