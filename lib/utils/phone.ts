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
 * Extract clean 10-digit mobile number from pasted text,
 * stripping +91, 91, leading 0, spaces, dashes, brackets.
 */
export function cleanPastedIndianMobile(input: string): string {
  if (!input) return "";
  let digits = input.replace(/\D/g, "");

  // If starts with 91 and has 12 digits -> strip 91
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  } else if (digits.length > 10 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  // Return at most 10 digits
  return digits.slice(0, 10);
}

/**
 * Mobile number validation state inspector
 */
export function inspectIndianMobile(input: string): {
  status: "EMPTY" | "VALID" | "TOO_SHORT" | "TOO_LONG" | "INVALID_START";
  messageTa: string;
  digitCount: number;
} {
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return { status: "EMPTY", messageTa: "விருப்பத்தேர்வு (Optional)", digitCount: 0 };
  }
  if (digits.length < 10) {
    return {
      status: "TOO_SHORT",
      messageTa: `⚠️ ${digits.length}/10 இலக்கங்கள் (இன்னும் ${10 - digits.length} எண்கள் தேவை)`,
      digitCount: digits.length,
    };
  }
  if (digits.length > 10) {
    return {
      status: "TOO_LONG",
      messageTa: `⚠️ 10 இலக்கங்களுக்கு மேல் உள்ளது (${digits.length} எண்கள்)`,
      digitCount: digits.length,
    };
  }
  if (!/^[6-9]/.test(digits)) {
    return {
      status: "INVALID_START",
      messageTa: "⚠️ எண் 6, 7, 8 அல்லது 9-ல் தொடங்க வேண்டும்",
      digitCount: digits.length,
    };
  }
  return {
    status: "VALID",
    messageTa: "✅ சரியான 10 இலக்க எண்",
    digitCount: 10,
  };
}

/**
 * Validate standard 10-digit Indian phone number
 */
export function isValidIndianMobile(input: string): boolean {
  if (!input) return false;
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
