/**
 * Indian Phone Number Validator and Normalizer
 * Standard Indian mobile numbers are 10 digits starting with 6, 7, 8, or 9.
 */

const normalizeIndianPhone = (rawPhone) => {
  if (!rawPhone || typeof rawPhone !== 'string') return null;

  // Remove spaces, hyphens, parentheses, plus
  let cleaned = rawPhone.replace(/[\s\-\(\)\+]/g, '');

  // Handle leading 0 (e.g. 09876543210)
  if (cleaned.startsWith('0') && cleaned.length === 11) {
    cleaned = cleaned.substring(1);
  }

  // Handle country code 91 (e.g. 919876543210)
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    cleaned = cleaned.substring(2);
  }

  // Must now be exactly 10 digits starting with 6-9
  if (/^[6-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
};

const formatForMSG91 = (tenDigitPhone) => {
  const normalized = normalizeIndianPhone(tenDigitPhone);
  if (!normalized) return null;
  return `91${normalized}`;
};

// Check if a phone number belongs to dummy seed data
const isSamplePhoneNumber = (phone) => {
  const norm = normalizeIndianPhone(phone);
  if (!norm) return true;
  // Common sample prefixes / repetitive patterns
  if (/^(9999999999|9888888888|9111111111|9000000000|9123456789|9876543210)$/.test(norm)) {
    return true;
  }
  return false;
};

module.exports = {
  normalizeIndianPhone,
  formatForMSG91,
  isSamplePhoneNumber
};
