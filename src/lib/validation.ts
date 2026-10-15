/**
 * Validation & Business Constraint Utilities for iShop Huy Hoàng
 */

export const VALID_REPAIR_STATUSES = [
  'received',
  'inspecting',
  'repairing',
  'qc_checking',
  'ready_for_pickup',
  'delivered',
  'cancelled',
] as const;

export type ValidRepairStatus = (typeof VALID_REPAIR_STATUSES)[number];

export const VALID_PAYMENT_METHODS = ['cash', 'vietqr', 'card', 'transfer'] as const;
export type ValidPaymentMethod = (typeof VALID_PAYMENT_METHODS)[number];

export const VALID_STAFF_ROLES = ['admin', 'cashier', 'technician', 'pending'] as const;
export type ValidStaffRole = (typeof VALID_STAFF_ROLES)[number];

/**
 * Normalizes Vietnamese phone number.
 * Converts '+84', removes spaces, dots, dashes, parentheses.
 */
export function normalizePhone(phone: unknown): string {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.trim().replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('84') && cleaned.length === 11) {
    cleaned = '0' + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * Validates Vietnamese mobile or hotline phone number:
 * 10 digits starting with 03, 05, 07, 08, 09, or 10-11 digits landline/hotline starting with 02/09.
 */
export function isValidPhone(phone: unknown): boolean {
  const normalized = normalizePhone(phone);
  // Vietnamese mobile phone: 10 digits starting with 03, 05, 07, 08, 09
  // Vietnamese hotline/landline: 10 or 11 digits starting with 02/1800/1900
  const mobileRegex = /^0(3|5|7|8|9)[0-9]{8}$/;
  const hotlineRegex = /^(02[0-9]{8,9}|1800[0-9]{4,6}|1900[0-9]{4,6})$/;
  return mobileRegex.test(normalized) || hotlineRegex.test(normalized);
}

/**
 * Validates standard email address format.
 */
export function isValidEmail(email: unknown): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates IMEI number (typically 15 digits, or 8-20 alphanumeric characters without spaces).
 */
export function isValidImei(imei: unknown): boolean {
  if (!imei || typeof imei !== 'string') return false;
  const cleaned = imei.trim();
  // Valid IMEI: 8 to 20 alphanumeric characters, no spaces or special symbols
  const imeiRegex = /^[a-zA-Z0-9]{8,25}$/;
  return imeiRegex.test(cleaned);
}

/**
 * Validates non-negative price / amount.
 */
export function isValidAmount(amount: unknown, allowZero = true): boolean {
  if (typeof amount !== 'number' || isNaN(amount) || !Number.isFinite(amount)) {
    return false;
  }
  return allowZero ? amount >= 0 : amount > 0;
}

/**
 * Validates positive integer quantity.
 */
export function isValidQuantity(qty: unknown): boolean {
  if (typeof qty !== 'number' || isNaN(qty) || !Number.isFinite(qty)) {
    return false;
  }
  return Number.isInteger(qty) && qty > 0;
}

/**
 * Sanitizes generic input strings, collapses whitespace, trims.
 */
export function sanitizeString(val: unknown, maxLength = 255): string {
  if (!val || typeof val !== 'string') return '';
  return val.trim().slice(0, maxLength);
}

/**
 * Validates username (3-30 chars, lowercase letters, numbers, underscores).
 */
export function isValidUsername(username: unknown): boolean {
  if (!username || typeof username !== 'string') return false;
  const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
  return usernameRegex.test(username.trim());
}
