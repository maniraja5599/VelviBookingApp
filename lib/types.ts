export type UserRole = "OWNER" | "IYER" | "SUPER_ADMIN" | "ADMIN";

export interface User {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  mobile: string;
  mobileVerified: boolean;
  role: UserRole;
  referralCode: string;
  createdAt: string;
  registrationIp?: string;
  lastLoginIp?: string;
  registrationCity?: string;
  registrationCountry?: string;
  lastLoginCity?: string;
  lastLoginCountry?: string;
}

export interface Business {
  id: string;
  ownerId: string;
  name: string;
  serviceName?: string;
  iyerName: string;
  logoUrl?: string;
  phone: string;
  whatsapp?: string;
  address?: string;
  showWatermark: boolean;
  createdAt: string;
}

export interface BusinessMember {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  mobile: string;
  role: "OWNER" | "IYER" | "STAFF";
  active: boolean;
  specialization?: string;
  workingDays?: string;
  workingHours?: string;
  bookingCount?: number;
  createdAt: string;
}

export type SubscriptionStatus = "TRIAL" | "ACTIVE" | "EXPIRING" | "EXPIRED" | "CANCELLED" | "PAYMENT_FAILED";
export type BillingCycle = "MONTHLY" | "YEARLY";

export interface Subscription {
  id: string;
  businessId: string;
  planName: string;
  planCode: string;
  status: SubscriptionStatus;
  trialStart: string;
  trialEnd: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  billingCycle: BillingCycle;
  autoRenew: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionEvent {
  id: string;
  subscriptionId: string;
  businessId: string;
  eventType: "TRIAL_START" | "PAYMENT_ACTIVATION" | "REFERRAL_REWARD" | "ADMIN_ADJUSTMENT" | "EXPIRATION" | "RENEWAL";
  daysAdded: number;
  previousEndDate?: string;
  newEndDate: string;
  amount?: number;
  referenceId?: string;
  reason?: string;
  createdAt: string;
}

export interface SubscriptionAdjustment {
  id: string;
  businessId: string;
  adminUserId: string;
  adjustmentType: "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE";
  daysChanged: number;
  previousEndDate: string;
  newEndDate: string;
  reason: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  businessId: string;
  userId: string;
  orderId: string;
  gateway: "CASHFREE";
  gatewayPaymentId?: string;
  gatewayOrderId?: string;
  amount: number;
  currency: string;
  status: "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";
  billingCycle: BillingCycle;
  paymentMethod?: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  referrerUserId: string;
  referrerName: string;
  referrerBusinessId: string;
  referralCode: string;
  refereeUserId: string;
  refereeName: string;
  refereeBusinessId: string;
  status: "PENDING" | "QUALIFIED" | "REWARDED" | "REJECTED" | "REVERSED";
  rewardDaysGranted: number;
  createdAt: string;
  qualifiedAt?: string;
  rewardedAt?: string;
}

export interface ReferralReward {
  id: string;
  referralId: string;
  beneficiaryUserId: string;
  beneficiaryBusinessId: string;
  daysRewarded: number;
  previousEndDate: string;
  newEndDate: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  mobile: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  notes?: string;
  gothram?: string;
  nakshatram?: string;
  rasi?: string;
  updatedAt?: string;
  isSample?: boolean;
  createdAt: string;
}

export interface SamagriCategory {
  id: string;
  labelTa: string;
  labelEn: string;
  icon: string;
  isDefault?: boolean;
}

export interface PoojaItemTemplate {
  id: string;
  poojaId: string;
  itemEnglishName: string;
  itemTamilName: string;
  quantity: number;
  unit: "pcs" | "nos" | "kg" | "g" | "litre" | "ml" | "packet" | "bundle" | "set" | "dozen";
  category?: string;
  isCustom?: boolean;
  sortOrder: number;
}

export interface Pooja {
  id: string;
  businessId: string;
  englishName: string;
  tamilName: string;
  description: string;
  durationMinutes?: number;
  basePrice: number;
  procedure?: string;
  active: boolean;
  imageUrl?: string;
  items: PoojaItemTemplate[];
  isCustom?: boolean;
  isSample?: boolean;
  createdAt: string;
}

export type BookingStatus = "DRAFT" | "CONFIRMED" | "PENDING" | "COMPLETED" | "CANCELLED" | "REASSIGNED";
export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "PENDING";

export interface BookingItem {
  id: string;
  bookingId: string;
  itemEnglishName: string;
  itemTamilName: string;
  quantity: number;
  unit: string;
  category?: string;
  isOverride?: boolean;
  isChecked?: boolean;
  isCustom?: boolean;
  sortOrder?: number;
}

export interface Booking {
  id: string;
  bookingNumber: string;
  businessId: string;
  customerId: string;
  customerName?: string;
  customerMobile?: string;
  customerAddress?: string;
  poojaId: string;
  poojaEnglishName?: string;
  poojaTamilName?: string;
  assignedIyerId?: string;
  assignedIyerName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  location: string;
  status: BookingStatus;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD (date payment was received or updated)
  paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";
  paymentRecipient?: "BUSINESS" | "PRIEST";
  priestShareAmount?: number;
  adminCommissionAmount?: number;
  paymentNotes?: string;
  expenseAmount?: number;
  expenseNotes?: string;
  notes?: string;
  items: BookingItem[];
  cancellationReason?: string;
  isSample?: boolean;
  cancelledAt?: string;
  refundDecision?: "REFUNDED" | "RETAINED" | "NO_PAYMENT";
  refundAmount?: number;
  retainedAmount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingAssignment {
  id: string;
  bookingId: string;
  previousIyerId?: string;
  previousIyerName?: string;
  newIyerId: string;
  newIyerName: string;
  reassignedBy: string;
  reason: string;
  createdAt: string;
}

export interface IyerPaymentSetting {
  id: string;
  businessId: string;
  iyerId: string;
  isTrackingEnabled: boolean;
  settlementType: "FIXED" | "PERCENTAGE" | "CUSTOM" | "NONE";
  fixedAmount: number;
  percentage: number;
  customPoojaRates: Record<string, number>;
}

export interface IyerSettlement {
  id: string;
  businessId: string;
  iyerId: string;
  iyerName?: string;
  amount: number;
  paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER";
  reference?: string;
  notes?: string;
  settlementDate: string;
  createdAt: string;
}

export type ThemePreset = "traditional" | "classic" | "royal" | "modern" | "custom";

export interface BrandingSetting {
  id?: string;
  businessId: string;
  themePreset: ThemePreset;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl?: string;
  showWatermark: boolean;
}

export interface AuditLog {
  id: string;
  businessId?: string;
  actorId?: string;
  actorName: string;
  action: string;
  targetType: string;
  targetId?: string;
  oldValue?: any;
  newValue?: any;
  reason?: string;
  ipAddress?: string;
  city?: string;
  country?: string;
  createdAt: string;
}

export type CouponDiscountType = "FREE_VALIDITY" | "PERCENTAGE" | "FLAT";

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: CouponDiscountType;
  discountValue: number;
  validityDaysBonus: number;
  maxUses: number;
  usedCount: number;
  validUntil: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserDirectoryMetric {
  user: User;
  business?: Business;
  subscription?: Subscription;
  bookingCount: number;
  completedBookingsCount: number;
  totalEarnings: number;
  joinedDate: string;
  isSuperAdmin: boolean;
  isAdmin?: boolean;
  adminRole?: "SUPER_ADMIN" | "ADMIN" | "NONE";
  isDemo?: boolean;
  ipAddress?: string;
  city?: string;
  country?: string;
}

