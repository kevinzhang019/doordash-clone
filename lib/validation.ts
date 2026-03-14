import { isValidPhoneNumber } from 'libphonenumber-js';

// Requires local-part, @, domain with at least one dot and 2+ char TLD
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true; // optional field
  try {
    return isValidPhoneNumber(phone);
  } catch {
    return false;
  }
}
