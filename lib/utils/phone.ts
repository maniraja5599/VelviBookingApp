/**
 * Normalize Indian mobile numbers:
 * Removes spaces, dashes, parentheses.
 * Converts 9876543210 or 09876543210 to +919876543210
 */
export function normalizeIndianMobile(input: string): string {
  if (!input) return "";
  const digits = input.replace(/\D/g, "");

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith("0")) {
    return `+91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+${digits}`;
  }
  if (input.startsWith("+") && digits.length >= 10) {
    return `+${digits}`;
  }
  return input.trim();
}

/**
 * Validate standard 10-digit Indian phone number
 */
export function isValidIndianMobile(input: string): boolean {
  const normalized = normalizeIndianMobile(input);
  return /^\+91[6-9]\d{9}$/.test(normalized);
}

/**
 * Mask an email for privacy during account recovery (Point 10 & 11)
 * Example from spec:
 * "Show masked email: r*****@gmail.com"
 * "Never reveal the full email before successful OTP verification."
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "r*****@gmail.com";
  const [local, domain] = email.split("@");
  const first = local.length > 0 ? local[0] : "r";
  return `${first}*****@${domain}`;
}
