// ==============================================================================
// VELVI REFERRAL & SUBSCRIPTION VALIDITY ENGINE
// ==============================================================================

/**
 * Generates a clean, memorable referral code based on user's name
 * e.g. "Ravi Iyer" -> "VELVI-RAVI123"
 */
export function generateReferralCode(name: string): string {
  const cleanName = name
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase()
    .slice(0, 5) || "USER";
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `VELVI-${cleanName}${randomSuffix}`;
}

/**
 * Calculate new expiry date when adding days (e.g., +30 days for referral or plan purchase)
 * Specification Point 18:
 * - If user has active validity: Current expiry + days
 * - If user is already expired: Today + days (NEVER add days to an old expired date!)
 */
export function calculateNewExpiryDate(
  currentExpiryStr: string,
  daysToAdd: number
): { newExpiry: Date; isExpiredExtension: boolean } {
  const now = new Date();
  const currentExpiry = new Date(currentExpiryStr);
  const isAlreadyExpired = currentExpiry.getTime() < now.getTime();

  const baseDate = isAlreadyExpired ? new Date(now) : new Date(currentExpiry);
  const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

  return {
    newExpiry,
    isExpiredExtension: isAlreadyExpired,
  };
}

/**
 * Check if a referral qualification can be rewarded:
 * - Referrer and referee cannot be the same user
 * - Referrer and referee cannot have identical Google IDs or Mobile numbers
 * - Referee must have completed their first verified paid subscription
 */
export function validateReferralReward(params: {
  referrerUserId: string;
  refereeUserId: string;
  referrerGoogleId?: string;
  refereeGoogleId?: string;
  referrerMobile: string;
  refereeMobile: string;
  isFirstVerifiedPayment: boolean;
  alreadyRewarded: boolean;
}): { eligible: boolean; reason?: string } {
  if (params.referrerUserId === params.refereeUserId) {
    return { eligible: false, reason: "Self-referral is not permitted." };
  }

  if (
    params.referrerGoogleId &&
    params.refereeGoogleId &&
    params.referrerGoogleId === params.refereeGoogleId
  ) {
    return { eligible: false, reason: "Duplicate Google account detected." };
  }

  if (params.referrerMobile === params.refereeMobile) {
    return { eligible: false, reason: "Duplicate mobile number detected." };
  }

  if (!params.isFirstVerifiedPayment) {
    return {
      eligible: false,
      reason: "Reward requires a verified first paid subscription.",
    };
  }

  if (params.alreadyRewarded) {
    return {
      eligible: false,
      reason: "Referral reward has already been granted for this referee.",
    };
  }

  return { eligible: true };
}
