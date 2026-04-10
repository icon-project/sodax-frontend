const EMAIL_REGEX = /^[^\s@]+@[^\s@.]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

export function isValidEmail(email: string): boolean {
  return email.length <= MAX_EMAIL_LENGTH && EMAIL_REGEX.test(email);
}
