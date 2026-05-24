export const defaultGmailUser = 'sayuuzin@gmail.com';

function normalizeEnv(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function getGmailUser() {
  return normalizeEnv(process.env.GMAIL_USER) || defaultGmailUser;
}

export function getGmailAppPassword() {
  return normalizeEnv(process.env.GMAIL_APP_PASSWORD).replace(/\s+/g, '');
}

export function getContactRecipient() {
  return normalizeEnv(process.env.CONTACT_NOTIFICATION_EMAIL) || 'linnubr@gmail.com';
}

export function hasGmailConfig() {
  return Boolean(getGmailAppPassword());
}

export function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export function hasMailConfig() {
  return hasGmailConfig() || hasSmtpConfig();
}

export function getSender() {
  return normalizeEnv(process.env.SMTP_FROM) || (hasGmailConfig() ? getGmailUser() : normalizeEnv(process.env.SMTP_USER));
}
