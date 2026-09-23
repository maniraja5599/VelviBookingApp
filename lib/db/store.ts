import {
  User,
  Business,
  BusinessMember,
  Subscription,
  Customer,
  Pooja,
  PoojaItemTemplate,
  Booking,
  BookingAssignment,
  IyerSettlement,
  Payment,
  Referral,
  ReferralReward,
  AuditLog,
  SubscriptionAdjustment,
  ThemePreset,
  BrandingSetting,
  BookingItem,
  BookingStatus,
  PaymentStatus,
  SamagriCategory,
} from "@/lib/types";
import {
  SEED_USER,
  SEED_SUPER_ADMIN,
  SEED_BUSINESS,
  SEED_SUBSCRIPTION,
  SEED_MEMBERS,
  SEED_CUSTOMERS,
  SEED_POOJAS,
  SEED_BOOKINGS,
} from "@/lib/seed/data";
import { calculateNewExpiryDate, validateReferralReward } from "@/lib/referrals/engine";
import {
  pushBookingToCloud,
  pushCustomerToCloud,
  deleteCustomerFromCloud,
  pushPoojaToCloud,
  deletePoojaFromCloud,
} from "@/lib/supabase/sync";
import { normalizeIndianMobile } from "@/lib/utils/phone";

export interface PlatformSettings {
  appName: string;
  appTamilName: string;
  tagline: string;
  taglineTamil: string;
  logoUrl: string;
  appVersion: string;
  developerName: string;
  developerMobile: string;
  developerInstagram: string;
  announcementActive: boolean;
  announcementMessage: string;
  maintenanceMode: boolean;
}

export const DEFAULT_SAMAGRI_CATEGORIES: SamagriCategory[] = [
  { id: "pooja_items", labelTa: "பூஜைப் பொருட்கள்", labelEn: "Pooja Items", icon: "🪔", isDefault: true },
  { id: "homam_items", labelTa: "ஹோமப் பொருட்கள்", labelEn: "Homam Items", icon: "🔥", isDefault: true },
  { id: "navagraha_items", labelTa: "நவக்கிரகப் பொருட்கள்", labelEn: "Navagraha Items", icon: "🪐", isDefault: true },
  { id: "flowers_garlands", labelTa: "பூ மற்றும் மாலை வகைகள்", labelEn: "Flowers & Garlands", icon: "🌺", isDefault: true },
  { id: "fruits_food", labelTa: "பழங்கள் மற்றும் உணவுப் பொருட்கள்", labelEn: "Fruits & Food", icon: "🍌", isDefault: true },
  { id: "vessels_utensils", labelTa: "பூஜை உபகரணங்கள்", labelEn: "Vessels & Utensils", icon: "🏺", isDefault: true },
  { id: "vastram_clothes", labelTa: "வஸ்திரம் / துணி வகைகள்", labelEn: "Vastram & Clothes", icon: "🧣", isDefault: true },
  { id: "grihapravesam_items", labelTa: "கிரகப்பிரவேசப் பொருட்கள்", labelEn: "Grihapravesam Items", icon: "🏠", isDefault: true },
];

export const AUTHENTIC_POOJA_BASE_IDS = [
  "p-ganapathi-01",
  "p-vastu-02",
  "p-ayush-03",
  "p-swayamvara-parvathi-04",
  "p-kumbabishekam-11",
  "p-sangu-pooja-06",
  "p-punyaham-07",
  "p-lakshmi-08",
];

export const OBSOLETE_POOJA_IDS = new Set([
  "p-ayushya-02",
  "p-navagraha-03",
  "p-gruhapravesam-04",
  "p-sathyanarayana-05",
  "p-sudarshana-06",
  "p-rudra-07",
  "p-lakshmi-kubera-08",
  "p-mrityunjaya-09",
  "p-sashtiapthapoorthi-10",
  "p-durga-11",
  "p-karthigai-12",
  "p-subamuhurtha-13",
  "p-navagraha-02",
  "p-sudarshana-03",
  "p-lakshmi-04",
  "p-vastu-05",
  "p-rudra-06",
  "p-satya-07",
  "p-ayush-08",
  "p-sample-1",
  "p-sample-2",
  "p-sample-3",
  "p-sample-4",
  "p-sample-5",
  "p-sample-6",
  "p-sample-7",
  "p-sample-8",
]);

export function isLegacyObsoletePooja(p: Pooja): boolean {
  if (!p) return false;

  // 1. Direct ID check
  if (OBSOLETE_POOJA_IDS.has(p.id)) return true;
  if (p.id.startsWith("p-sample-")) return true;

  // 2. Prefix check (e.g. p-sathyanarayana-05-biz-123)
  for (const obs of Array.from(OBSOLETE_POOJA_IDS)) {
    if (p.id.startsWith(obs)) return true;
  }

  // 3. Name check (Tamil & English) for old dummy poojas
  const legacyKeywords = [
    "சத்தியநாராயண", "sathyanarayana", "satyanarayan",
    "நவகிரக", "navagraha", "navagragha",
    "சுதர்சன", "sudarshana", "sudarshan",
    "ருத்ர ஏகாதச", "rudra ekadasa", "rudra homam", "ஸ்ரீ ருத்ர",
    "லக்ஷ்மி குபேர", "lakshmi kubera",
    "மிருத்யுஞ்சய", "mrityunjaya", "mrityunjay",
    "சஷ்டியப்தபூர்த்தி", "sashtiapthapoorthi", "60-ஆம் கல்யாணம்", "60th birthday",
    "துர்கா", "durga",
    "கார்த்திகை தீப", "karthigai",
    "சுப முகூர்த்தம்", "subamuhurtha", "subha muhurtham",
  ];

  const tName = (p.tamilName || "").toLowerCase();
  const eName = (p.englishName || "").toLowerCase();

  for (const kw of legacyKeywords) {
    if (tName.includes(kw) || eName.includes(kw)) {
      return true;
    }
  }

  // 4. Old Gruhapravesam dummy pooja ("கிரகப்பிரவேசம் & வாஸ்து ஹோமம்" vs authentic "வாஸ்து சாந்தி & கிரகப்பிரவேசம்")
  if (p.id.includes("gruhapravesam-04") || tName.includes("கிரகப்பிரவேசம் & வாஸ்து")) {
    return true;
  }

  // 5. Old Ayushya dummy pooja ("ஆயுஷ்ய ஹோமம்" vs authentic "ஆயுஷ் ஹோமம்")
  if (p.id.includes("ayushya-02") || tName.includes("ஆயுஷ்ய")) {
    return true;
  }

  // 6. Old version of Ganapathi Homam with only a few items (< 30)
  if (
    (p.id === "p-ganapathi-01" || p.id.startsWith("p-ganapathi-01-")) &&
    Array.isArray(p.items) &&
    p.items.length < 30
  ) {
    return true;
  }

  // 7. Non-authentic and non-custom poojas
  const isAuthentic = AUTHENTIC_POOJA_BASE_IDS.some(
    (baseId) => p.id === baseId || p.id.startsWith(baseId + "-")
  );
  if (!isAuthentic && p.isCustom !== true) {
    return true;
  }

  return false;
}

// Synchronous immediate purge on script evaluation
if (typeof window !== "undefined") {
  try {
    const raw = localStorage.getItem("velvi_db_state_v2");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.poojas)) {
        const initialLen = parsed.poojas.length;
        parsed.poojas = parsed.poojas.filter((p: any) => !isLegacyObsoletePooja(p));
        if (parsed.poojas.length !== initialLen) {
          localStorage.setItem("velvi_db_state_v2", JSON.stringify(parsed));
        }
      }
    }
  } catch (e) {}
}

export class VelviDatabaseStore {
  public platformSettings: PlatformSettings = {
    appName: "Velvi",
    appTamilName: "வேள்வி",
    tagline: "Sacred Ceremonies, Seamless Management",
    taglineTamil: "நல்லதே நம் நோக்கம்",
    logoUrl: "/velvi-sacred-flame.png",
    appVersion: "2.4.0",
    developerName: "Maniraja",
    developerMobile: "+91-8300030123",
    developerInstagram: "@maniraja__",
    announcementActive: true,
    announcementMessage: "System operational. All bookings and reminders running on schedule.",
    maintenanceMode: false,
  };

  public samagriCategories: SamagriCategory[] = structuredClone(DEFAULT_SAMAGRI_CATEGORIES);

  public users: User[] = [
    SEED_USER,
    SEED_SUPER_ADMIN,
    {
      id: "u-suresh-iyer-02",
      googleId: "google-20394857",
      email: "suresh.iyer@gmail.com",
      name: "Suresh Iyer",
      mobile: "+919876543211",
      mobileVerified: true,
      role: "IYER",
      referralCode: "VELVI-SURESH456",
      createdAt: "2026-08-05T10:00:00Z",
    },
    {
      id: "u-kumar-iyer-03",
      googleId: "google-30495867",
      email: "kumar.iyer@gmail.com",
      name: "Kumar Iyer",
      mobile: "+919876543212",
      mobileVerified: true,
      role: "IYER",
      referralCode: "VELVI-KUMAR789",
      createdAt: "2026-08-10T11:00:00Z",
    },
    {
      id: "u-mani-04",
      googleId: "google-40596879",
      email: "mani.iyer@gmail.com",
      name: "Mani",
      mobile: "+919876543299",
      mobileVerified: true,
      role: "OWNER",
      referralCode: "VELVI-MANI101",
      createdAt: "2026-08-22T09:00:00Z",
    },
    {
      id: "u-ravi-temple-05",
      googleId: "google-50697880",
      email: "ravi.temple@gmail.com",
      name: "Ravi Iyer (Temple Trust)",
      mobile: "+919876543210",
      mobileVerified: true,
      role: "OWNER",
      referralCode: "VELVI-TEMPLE55",
      createdAt: "2026-08-25T14:00:00Z",
    },
  ];
  public businesses: Business[] = structuredClone([SEED_BUSINESS]);
  public members: BusinessMember[] = structuredClone(SEED_MEMBERS);
  public subscriptions: Subscription[] = structuredClone([SEED_SUBSCRIPTION]);
  public customers: Customer[] = structuredClone(SEED_CUSTOMERS).map((c) => ({ ...c, isSample: true }));
  public poojas: Pooja[] = structuredClone(SEED_POOJAS).map((p) => ({ ...p, isSample: true }));
  public bookings: Booking[] = structuredClone(SEED_BOOKINGS).map((b) => ({ ...b, isSample: true }));
  public recentlyDeleted: Array<{
    id: string;
    type: "booking" | "customer" | "pooja";
    item: any;
    deletedAt: string;
  }> = [];
  public bookingAssignments: BookingAssignment[] = [];
  public settlements: IyerSettlement[] = [
    {
      id: "set-01",
      businessId: "biz-venkateswara-01",
      iyerId: "m-suresh-02",
      iyerName: "Suresh Iyer",
      amount: 30000,
      paymentMethod: "UPI",
      reference: "UPI/39482710/Axis",
      notes: "August full settlement",
      settlementDate: "2026-09-01",
      createdAt: "2026-09-01T18:00:00Z",
    },
  ];
  public payments: Payment[] = [
    {
      id: "pay-sub-01",
      businessId: "biz-venkateswara-01",
      userId: "u-ravi-iyer-01",
      orderId: "order_venk_01",
      gateway: "CASHFREE",
      gatewayPaymentId: "cf_pay_918237",
      amount: 499,
      currency: "INR",
      status: "SUCCESS",
      billingCycle: "MONTHLY",
      paymentMethod: "UPI",
      createdAt: "2026-08-31T08:30:00Z",
    },
  ];
  public referrals: Referral[] = [
    {
      id: "ref-01",
      referrerUserId: "u-ravi-iyer-01",
      referrerName: "Ravi Iyer",
      referrerBusinessId: "biz-venkateswara-01",
      referralCode: "VELVI-RAVI123",
      refereeUserId: "u-suresh-iyer-02",
      refereeName: "Suresh",
      refereeBusinessId: "biz-suresh-99",
      status: "REWARDED",
      rewardDaysGranted: 30,
      createdAt: "2026-08-15T10:00:00Z",
      qualifiedAt: "2026-08-18T12:00:00Z",
      rewardedAt: "2026-08-18T12:00:00Z",
    },
    {
      id: "ref-02",
      referrerUserId: "u-ravi-iyer-01",
      referrerName: "Ravi Iyer",
      referrerBusinessId: "biz-venkateswara-01",
      referralCode: "VELVI-RAVI123",
      refereeUserId: "u-kumar-iyer-03",
      refereeName: "Kumar",
      refereeBusinessId: "biz-kumar-99",
      status: "PENDING",
      rewardDaysGranted: 0,
      createdAt: "2026-09-01T15:00:00Z",
    },
    {
      id: "ref-03",
      referrerUserId: "u-ravi-iyer-01",
      referrerName: "Ravi Iyer",
      referrerBusinessId: "biz-venkateswara-01",
      referralCode: "VELVI-RAVI123",
      refereeUserId: "u-mani-04",
      refereeName: "Mani",
      refereeBusinessId: "biz-mani-99",
      status: "REWARDED",
      rewardDaysGranted: 30,
      createdAt: "2026-08-22T09:00:00Z",
      qualifiedAt: "2026-08-25T14:00:00Z",
      rewardedAt: "2026-08-25T14:00:00Z",
    },
  ];
  public referralRewards: ReferralReward[] = [];
  public subscriptionAdjustments: SubscriptionAdjustment[] = [];
  public auditLogs: AuditLog[] = [
    {
      id: "audit-01",
      businessId: "biz-venkateswara-01",
      actorId: "u-ravi-iyer-01",
      actorName: "Ravi Iyer",
      action: "TRIAL_ACTIVATED",
      targetType: "SUBSCRIPTION",
      targetId: "sub-ravi-01",
      newValue: { days: 30, plan: "Velvi Pro" },
      reason: "New account registration",
      createdAt: "2026-08-01T08:30:00Z",
    },
  ];
  public branding: Record<string, BrandingSetting> = {
    "biz-venkateswara-01": {
      id: "brand-01",
      businessId: "biz-venkateswara-01",
      themePreset: "traditional",
      primaryColor: "#4A2E18",
      secondaryColor: "#C89234",
      accentColor: "#FAF7F2",
      showWatermark: true,
    },
  };

  constructor() {
    if (typeof window !== "undefined") {
      this.loadFromLocalStorage();
    }
  }

  // -------------------------------------------------------------
  // TENANT ISOLATION: Strict business_id Filtering
  // -------------------------------------------------------------
  public getCustomers(businessId: string): Customer[] {
    const list = this.customers.filter((c) => c.businessId === businessId);
    const seen = new Set<string>();
    return list.filter((c) => {
      const cleanMobile = c.mobile ? normalizeIndianMobile(c.mobile) : "";
      const key = cleanMobile ? `m:${cleanMobile}` : `id:${c.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  public getBookings(businessId: string): Booking[] {
    return this.bookings.filter((b) => b.businessId === businessId);
  }

  public seedDefaultPoojasForBusiness(businessId: string): Pooja[] {
    if (!businessId) return [];

    // Purge any obsolete legacy dummy poojas across store and for this business
    this.poojas = this.poojas.filter((p) => !isLegacyObsoletePooja(p));

    const existing = this.poojas.filter((p) => p.businessId === businessId);
    const existingBaseIds = new Set(
      existing.map((p) => {
        const found = AUTHENTIC_POOJA_BASE_IDS.find((baseId) => p.id === baseId || p.id.startsWith(baseId + "-"));
        return found || p.id;
      })
    );

    const added: Pooja[] = [];
    SEED_POOJAS.forEach((sp) => {
      const pId = businessId === "biz-venkateswara-01" ? sp.id : `${sp.id}-${businessId}`;
      const existingIdx = this.poojas.findIndex(
        (p) => p.businessId === businessId && (p.id === pId || p.id.startsWith(sp.id + "-"))
      );
      if (existingIdx === -1) {
        const newPooja: Pooja = {
          ...structuredClone(sp),
          id: pId,
          businessId: businessId,
          items: sp.items.map((it) => ({
            ...it,
            id: businessId === "biz-venkateswara-01" ? it.id : `${it.id}-${businessId}`,
            poojaId: pId,
          })),
        };
        this.poojas.push(newPooja);
        added.push(newPooja);
      } else {
        const existingP = this.poojas[existingIdx];
        if (existingP.items.length < sp.items.length) {
          existingP.items = sp.items.map((it) => ({
            ...it,
            id: businessId === "biz-venkateswara-01" ? it.id : `${it.id}-${businessId}`,
            poojaId: existingP.id,
          }));
        }
      }
    });

    if (typeof window !== "undefined") {
      this.saveToLocalStorage();
    }

    return this.poojas.filter((p) => p.businessId === businessId);
  }

  public getPoojas(businessId: string): Pooja[] {
    if (!businessId) return [];

    const beforeCount = this.poojas.length;

    // Purge any obsolete legacy poojas
    this.poojas = this.poojas.filter((p) => !isLegacyObsoletePooja(p));

    let businessPoojas = this.poojas.filter((p) => p.businessId === businessId);

    // If business has no poojas and the pooja catalog is active in store, seed the 8 authentic defaults
    if (businessPoojas.length === 0 && this.poojas.length > 0) {
      businessPoojas = this.seedDefaultPoojasForBusiness(businessId);
    } else if (this.poojas.length > 0) {
      // Ensure all 8 authentic poojas exist for this business
      let addedOrUpdated = false;
      for (const sp of SEED_POOJAS) {
        const pId = businessId === "biz-venkateswara-01" ? sp.id : `${sp.id}-${businessId}`;
        const existingIdx = this.poojas.findIndex(
          (p) => p.businessId === businessId && (p.id === pId || p.id.startsWith(sp.id + "-"))
        );
        if (existingIdx === -1) {
          const newPooja: Pooja = {
            ...structuredClone(sp),
            id: pId,
            businessId: businessId,
            items: sp.items.map((it) => ({
              ...it,
              id: businessId === "biz-venkateswara-01" ? it.id : `${it.id}-${businessId}`,
              poojaId: pId,
            })),
          };
          this.poojas.push(newPooja);
          addedOrUpdated = true;
        } else {
          // If existing pooja has old incomplete items, update them
          const existing = this.poojas[existingIdx];
          if (existing.items.length < sp.items.length) {
            this.poojas[existingIdx] = {
              ...structuredClone(sp),
              id: existing.id,
              businessId: businessId,
              items: sp.items.map((it) => ({
                ...it,
                id: businessId === "biz-venkateswara-01" ? it.id : `${it.id}-${businessId}`,
                poojaId: existing.id,
              })),
            };
            addedOrUpdated = true;
          }
        }
      }
      if (addedOrUpdated) {
        businessPoojas = this.poojas.filter((p) => p.businessId === businessId);
      }
    }

    if (this.poojas.length !== beforeCount && typeof window !== "undefined") {
      this.saveToLocalStorage();
    }

    return businessPoojas;
  }

  public getMembers(businessId: string): BusinessMember[] {
    return this.members.filter((m) => m.businessId === businessId);
  }

  public getSubscription(businessId: string): Subscription | undefined {
    return this.subscriptions.find((s) => s.businessId === businessId);
  }


  // -------------------------------------------------------------
  // DOUBLE BOOKING PREVENTION ENGINE (Point 33)
  // -------------------------------------------------------------
  public checkIyerConflict(params: {
    businessId: string;
    iyerId: string;
    date: string;
    startTime: string; // "08:00 AM" or "08:00"
    durationMinutes: number;
    excludeBookingId?: string;
  }): { hasConflict: boolean; conflictingBooking?: Booking; reason?: string } {
    const iyerBookings = this.bookings.filter(
      (b) =>
        b.businessId === params.businessId &&
        b.assignedIyerId === params.iyerId &&
        b.date === params.date &&
        b.status !== "CANCELLED" &&
        b.id !== params.excludeBookingId
    );

    if (iyerBookings.length === 0) {
      return { hasConflict: false };
    }

    const parseToMinutes = (timeStr: string): number => {
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const mins = parseInt(match[2], 10);
      const modifier = match[3]?.toUpperCase();
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      return hours * 60 + mins;
    };

    const newStart = parseToMinutes(params.startTime);
    const newEnd = newStart + params.durationMinutes;

    for (const booking of iyerBookings) {
      const existingStart = parseToMinutes(booking.startTime);
      const existingEnd = existingStart + booking.durationMinutes;

      // Check if intervals overlap: max(newStart, existingStart) < min(newEnd, existingEnd)
      if (Math.max(newStart, existingStart) < Math.min(newEnd, existingEnd)) {
        return {
          hasConflict: true,
          conflictingBooking: booking,
          reason: `${booking.assignedIyerName || "Assigned Iyer"} already has a booking (${booking.poojaEnglishName}) from ${booking.startTime} to ${booking.endTime}.`,
        };
      }
    }

    return { hasConflict: false };
  }

  // -------------------------------------------------------------
  // REASSIGNMENT WITH IMMUTABLE HISTORY (Points 36 & 45)
  // -------------------------------------------------------------
  public reassignBooking(params: {
    bookingId: string;
    newIyerId: string;
    reassignedBy: string;
    reason: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    const newIyer = this.members.find((m) => m.id === params.newIyerId);
    if (!newIyer) return { success: false, error: "New Iyer not found" };

    // Check conflict for new Iyer
    const conflict = this.checkIyerConflict({
      businessId: booking.businessId,
      iyerId: params.newIyerId,
      date: booking.date,
      startTime: booking.startTime,
      durationMinutes: booking.durationMinutes,
      excludeBookingId: booking.id,
    });

    if (conflict.hasConflict) {
      return { success: false, error: conflict.reason };
    }

    const previousIyerId = booking.assignedIyerId;
    const previousIyerName = booking.assignedIyerName;

    // Log immutable reassignment
    const assignmentRecord: BookingAssignment = {
      id: `asg-${Date.now()}`,
      bookingId: booking.id,
      previousIyerId,
      previousIyerName,
      newIyerId: newIyer.id,
      newIyerName: newIyer.name,
      reassignedBy: params.reassignedBy,
      reason: params.reason,
      createdAt: new Date().toISOString(),
    };
    this.bookingAssignments.push(assignmentRecord);

    // Update current booking
    booking.assignedIyerId = newIyer.id;
    booking.assignedIyerName = newIyer.name;
    booking.status = "CONFIRMED";
    booking.updatedAt = new Date().toISOString();

    // Audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.reassignedBy,
      action: "BOOKING_REASSIGNED",
      targetType: "BOOKING",
      targetId: booking.id,
      oldValue: { iyerId: previousIyerId, iyerName: previousIyerName },
      newValue: { iyerId: newIyer.id, iyerName: newIyer.name },
      reason: params.reason,
      createdAt: new Date().toISOString(),
    });

    return { success: true, booking };
  }

  // -------------------------------------------------------------
  // BOOKING CANCELLATION ENGINE (Refund vs Retained)
  // -------------------------------------------------------------
  public cancelBooking(params: {
    bookingId: string;
    cancelledBy: string;
    reason: string;
    refundDecision: "REFUNDED" | "RETAINED" | "NO_PAYMENT";
    refundAmount?: number;
    retainedAmount?: number;
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    booking.status = "CANCELLED";
    booking.cancellationReason = params.reason;
    booking.cancelledAt = new Date().toISOString();
    booking.refundDecision = params.refundDecision;
    booking.refundAmount = params.refundAmount || 0;
    booking.retainedAmount = params.retainedAmount || 0;
    booking.updatedAt = new Date().toISOString();

    // Audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.cancelledBy,
      action: "BOOKING_CANCELLED",
      targetType: "BOOKING",
      targetId: booking.id,
      newValue: {
        reason: params.reason,
        refundDecision: params.refundDecision,
        refundAmount: params.refundAmount,
        retainedAmount: params.retainedAmount,
      },
      reason: params.reason,
      createdAt: new Date().toISOString(),
    });

    return { success: true, booking };
  }

  // -------------------------------------------------------------
  // BOOKING DELETION ENGINE (Safety Delete)
  // -------------------------------------------------------------
  public deleteBooking(params: {
    bookingId: string;
    deletedBy: string;
    reason?: string;
  }): { success: boolean; error?: string } {
    const index = this.bookings.findIndex((b) => b.id === params.bookingId);
    if (index === -1) return { success: false, error: "Booking not found" };

    const deleted = this.bookings[index];
    this.recentlyDeleted.push({
      id: deleted.id,
      type: "booking",
      item: structuredClone(deleted),
      deletedAt: new Date().toISOString(),
    });
    this.bookings.splice(index, 1);
    this.saveToLocalStorage();
    this.notifyListeners();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:deleted-item", {
          detail: {
            type: "booking",
            name: `${deleted.bookingNumber} (${deleted.poojaEnglishName || deleted.poojaTamilName || "Booking"})`,
            id: deleted.id,
          },
        })
      );
    }

    // Audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: deleted.businessId,
      actorName: params.deletedBy,
      action: "BOOKING_DELETED",
      targetType: "BOOKING",
      targetId: deleted.id,
      oldValue: {
        bookingNumber: deleted.bookingNumber,
        customerName: deleted.customerName,
        pooja: deleted.poojaEnglishName,
        date: deleted.date,
        totalAmount: deleted.totalAmount,
        deletedPaymentAmount: deleted.advanceAmount || 0,
        paymentStatus: deleted.paymentStatus,
      },
      reason: params.reason || "Manual deletion by owner",
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  }

  // -------------------------------------------------------------
  // FULL BOOKING EDIT ENGINE (With Collision Checks)
  // -------------------------------------------------------------
  public updateBooking(params: {
    bookingId: string;
    updatedBy: string;
    updates: {
      customerId?: string;
      customerName?: string;
      customerMobile?: string;
      customerAddress?: string;
      poojaId?: string;
      poojaEnglishName?: string;
      poojaTamilName?: string;
      assignedIyerId?: string;
      assignedIyerName?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      location?: string;
      notes?: string;
      status?: BookingStatus;
    };
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    // Check double-booking conflict if time, date, or priest changed
    const targetIyerId = params.updates.assignedIyerId || booking.assignedIyerId;
    const targetDate = params.updates.date || booking.date;
    const targetStartTime = params.updates.startTime || booking.startTime;
    const targetDuration = params.updates.durationMinutes || booking.durationMinutes;

    if (targetIyerId) {
      const conflict = this.checkIyerConflict({
        businessId: booking.businessId,
        iyerId: targetIyerId,
        date: targetDate,
        startTime: targetStartTime,
        durationMinutes: targetDuration,
        excludeBookingId: booking.id,
      });

      if (conflict.hasConflict) {
        return { success: false, error: conflict.reason };
      }
    }

    // Apply updates safely
    Object.assign(booking, params.updates);
    booking.updatedAt = new Date().toISOString();

    // Audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.updatedBy,
      action: "BOOKING_UPDATED",
      targetType: "BOOKING",
      targetId: booking.id,
      newValue: params.updates,
      reason: "Booking details edited",
      createdAt: new Date().toISOString(),
    });

    this.saveToLocalStorage();
    try { pushBookingToCloud(booking).catch(() => {}); } catch (_) {}

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("velvi:db-change"));
    }

    return { success: true, booking };
  }

  public updateBookingStatus(
    bookingId: string,
    status: BookingStatus,
    updatedBy: string = "User"
  ): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    const oldStatus = booking.status;
    booking.status = status;
    booking.updatedAt = new Date().toISOString();

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: updatedBy,
      action: "BOOKING_STATUS_CHANGED",
      targetType: "BOOKING",
      targetId: booking.id,
      oldValue: { status: oldStatus },
      newValue: { status },
      reason: `Booking status changed to ${status}`,
      createdAt: new Date().toISOString(),
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("velvi:db-change"));
    }

    return { success: true, booking };
  }

  // -------------------------------------------------------------
  // CONTROLLED PAYMENT EDIT ENGINE (Guaranteed Math & Integrity)
  // -------------------------------------------------------------
  public updateBookingPayment(params: {
    bookingId: string;
    totalAmount: number;
    advanceAmount: number;
    updatedBy: string;
    reason?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    if (params.totalAmount < 0 || params.advanceAmount < 0) {
      return { success: false, error: "Payment amounts cannot be negative." };
    }

    const previousFinancials = {
      totalAmount: booking.totalAmount,
      advanceAmount: booking.advanceAmount,
      balanceAmount: booking.balanceAmount,
      paymentStatus: booking.paymentStatus,
    };

    booking.totalAmount = params.totalAmount;
    booking.advanceAmount = params.advanceAmount;
    booking.balanceAmount = Math.max(0, params.totalAmount - params.advanceAmount);

    if (booking.balanceAmount === 0) {
      booking.paymentStatus = "PAID";
    } else if (booking.advanceAmount > 0) {
      booking.paymentStatus = "PARTIALLY_PAID";
    } else {
      booking.paymentStatus = "PENDING";
    }

    booking.updatedAt = new Date().toISOString();

    // Audit log
    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.updatedBy,
      action: "BOOKING_PAYMENT_ADJUSTED",
      targetType: "BOOKING",
      targetId: booking.id,
      oldValue: previousFinancials,
      newValue: {
        totalAmount: booking.totalAmount,
        advanceAmount: booking.advanceAmount,
        balanceAmount: booking.balanceAmount,
        paymentStatus: booking.paymentStatus,
      },
      reason: params.reason || "Payment details adjusted",
      createdAt: new Date().toISOString(),
    });

    this.saveToLocalStorage();
    this.notifyListeners();

    return { success: true, booking };
  }

  public recordBookingPayment(params: {
    bookingId: string;
    amount: number;
    paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER" | string;
    paymentDate?: string;
    recordedBy?: string;
    notes?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    if (params.amount <= 0) {
      return { success: false, error: "Payment amount must be greater than zero." };
    }

    const previousFinancials = {
      advanceAmount: booking.advanceAmount || 0,
      balanceAmount: booking.balanceAmount,
      paymentStatus: booking.paymentStatus,
    };

    booking.advanceAmount = (booking.advanceAmount || 0) + params.amount;
    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advanceAmount);
    booking.paymentStatus = booking.balanceAmount === 0 ? "PAID" : "PARTIALLY_PAID";
    booking.paymentDate = params.paymentDate || new Date().toISOString().split("T")[0];
    if (params.paymentMethod) {
      booking.paymentMethod = params.paymentMethod as any;
    }
    booking.updatedAt = new Date().toISOString();

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.recordedBy || "User",
      action: "PAYMENT_COLLECTED",
      targetType: "BOOKING",
      targetId: booking.id,
      oldValue: previousFinancials,
      newValue: {
        collectedAdded: params.amount,
        advanceAmount: booking.advanceAmount,
        balanceAmount: booking.balanceAmount,
        paymentStatus: booking.paymentStatus,
        paymentMethod: params.paymentMethod || "CASH",
      },
      reason: params.notes || `Payment of ₹${params.amount} collected`,
      createdAt: new Date().toISOString(),
    });

    this.saveToLocalStorage();
    this.notifyListeners();
    try { pushBookingToCloud(booking).catch(() => {}); } catch (_) {}

    return { success: true, booking };
  }

  public resetBookingPayment(params: {
    bookingId: string;
    deletedBy?: string;
    reason?: string;
  }): { success: boolean; booking?: Booking; error?: string } {
    const booking = this.bookings.find((b) => b.id === params.bookingId);
    if (!booking) return { success: false, error: "Booking not found" };

    const previousFinancials = {
      advanceAmount: booking.advanceAmount || 0,
      balanceAmount: booking.balanceAmount,
      paymentStatus: booking.paymentStatus,
    };

    booking.advanceAmount = 0;
    booking.balanceAmount = booking.totalAmount;
    booking.paymentStatus = "PENDING";
    booking.updatedAt = new Date().toISOString();

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: booking.businessId,
      actorName: params.deletedBy || "User",
      action: "PAYMENT_DELETED",
      targetType: "BOOKING",
      targetId: booking.id,
      oldValue: previousFinancials,
      newValue: {
        advanceAmount: 0,
        balanceAmount: booking.totalAmount,
        paymentStatus: "PENDING",
      },
      reason: params.reason || `Payment of ₹${previousFinancials.advanceAmount} deleted/reset`,
      createdAt: new Date().toISOString(),
    });

    this.saveToLocalStorage();
    this.notifyListeners();

    return { success: true, booking };
  }

  // -------------------------------------------------------------
  // SUPER ADMIN VALIDITY ADJUSTMENT WITH AUDIT (Point 20)
  // -------------------------------------------------------------
  public adjustSubscriptionValidity(params: {
    businessId: string;
    adminUserId: string;
    adminName: string;
    adjustmentType: "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE";
    days: number;
    reason: string;
  }): { success: boolean; subscription?: Subscription; error?: string } {
    const sub = this.subscriptions.find((s) => s.businessId === params.businessId);
    if (!sub) return { success: false, error: "Subscription not found" };

    const previousEndDate = sub.currentPeriodEnd;
    let newEndDate: Date;

    if (params.adjustmentType === "EXTEND") {
      newEndDate = calculateNewExpiryDate(previousEndDate, params.days).newExpiry;
      sub.status = "ACTIVE";
    } else if (params.adjustmentType === "REDUCE") {
      newEndDate = new Date(new Date(previousEndDate).getTime() - params.days * 86400000);
    } else if (params.adjustmentType === "EXPIRE") {
      newEndDate = new Date();
      sub.status = "EXPIRED";
    } else if (params.adjustmentType === "ACTIVATE" || params.adjustmentType === "RESTORE") {
      newEndDate = calculateNewExpiryDate(new Date().toISOString(), params.days || 30).newExpiry;
      sub.status = "ACTIVE";
    } else {
      newEndDate = new Date(previousEndDate);
    }

    sub.currentPeriodEnd = newEndDate.toISOString();
    sub.updatedAt = new Date().toISOString();

    // Record adjustment audit
    const adj: SubscriptionAdjustment = {
      id: `adj-${Date.now()}`,
      businessId: sub.businessId,
      adminUserId: params.adminUserId,
      adjustmentType: params.adjustmentType,
      daysChanged: params.days,
      previousEndDate,
      newEndDate: sub.currentPeriodEnd,
      reason: params.reason,
      createdAt: new Date().toISOString(),
    };
    this.subscriptionAdjustments.push(adj);

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: sub.businessId,
      actorName: params.adminName,
      action: `SUBSCRIPTION_${params.adjustmentType}`,
      targetType: "SUBSCRIPTION",
      targetId: sub.id,
      oldValue: { endDate: previousEndDate },
      newValue: { endDate: sub.currentPeriodEnd, status: sub.status },
      reason: params.reason,
      createdAt: new Date().toISOString(),
    });

    return { success: true, subscription: sub };
  }

  // -------------------------------------------------------------
  // REFERRAL REWARD EXECUTION (+30 Days for both) (Points 17 & 18)
  // -------------------------------------------------------------
  public processReferralReward(params: {
    referralId: string;
    isFirstPaymentVerified: boolean;
  }): { success: boolean; error?: string } {
    const ref = this.referrals.find((r) => r.id === params.referralId);
    if (!ref) return { success: false, error: "Referral not found" };

    const referrerUser = this.users.find((u) => u.id === ref.referrerUserId);
    const refereeUser = this.users.find((u) => u.id === ref.refereeUserId);

    if (!referrerUser || !refereeUser) {
      return { success: false, error: "User accounts not found" };
    }

    const validation = validateReferralReward({
      referrerUserId: ref.referrerUserId,
      refereeUserId: ref.refereeUserId,
      referrerGoogleId: referrerUser.googleId,
      refereeGoogleId: refereeUser.googleId,
      referrerMobile: referrerUser.mobile,
      refereeMobile: refereeUser.mobile,
      isFirstVerifiedPayment: params.isFirstPaymentVerified,
      alreadyRewarded: ref.status === "REWARDED",
    });

    if (!validation.eligible) {
      return { success: false, error: validation.reason };
    }

    // Reward both Referrer and Referee with +30 Days
    const referrerSub = this.subscriptions.find((s) => s.businessId === ref.referrerBusinessId);
    const refereeSub = this.subscriptions.find((s) => s.businessId === ref.refereeBusinessId);

    if (referrerSub) {
      const prev = referrerSub.currentPeriodEnd;
      const next = calculateNewExpiryDate(prev, 30).newExpiry;
      referrerSub.currentPeriodEnd = next.toISOString();
      referrerSub.status = "ACTIVE";
      referrerSub.updatedAt = new Date().toISOString();

      this.referralRewards.push({
        id: `rew-${Date.now()}-1`,
        referralId: ref.id,
        beneficiaryUserId: ref.referrerUserId,
        beneficiaryBusinessId: ref.referrerBusinessId,
        daysRewarded: 30,
        previousEndDate: prev,
        newEndDate: referrerSub.currentPeriodEnd,
        createdAt: new Date().toISOString(),
      });
    }

    if (refereeSub) {
      const prev = refereeSub.currentPeriodEnd;
      const next = calculateNewExpiryDate(prev, 30).newExpiry;
      refereeSub.currentPeriodEnd = next.toISOString();
      refereeSub.status = "ACTIVE";
      refereeSub.updatedAt = new Date().toISOString();

      this.referralRewards.push({
        id: `rew-${Date.now()}-2`,
        referralId: ref.id,
        beneficiaryUserId: ref.refereeUserId,
        beneficiaryBusinessId: ref.refereeBusinessId,
        daysRewarded: 30,
        previousEndDate: prev,
        newEndDate: refereeSub.currentPeriodEnd,
        createdAt: new Date().toISOString(),
      });
    }

    ref.status = "REWARDED";
    ref.rewardDaysGranted = 30;
    ref.rewardedAt = new Date().toISOString();

    return { success: true };
  }

  // -------------------------------------------------------------
  // DUPLICATE MOBILE NUMBER CHECK (Point 10)
  // -------------------------------------------------------------
  public findUserByMobile(rawMobile: string): User | undefined {
    const normalized = normalizeIndianMobile(rawMobile);
    return this.users.find((u) => u.mobile === normalized);
  }

  public findUsersByMobile(rawMobile: string): User[] {
    const normalized = normalizeIndianMobile(rawMobile);
    return this.users.filter(
      (u) => u.mobile === normalized || u.mobile === rawMobile
    );
  }

  public updatePlatformSettings(
    updates: Partial<PlatformSettings>,
    adminUserId: string = "u-super-admin-01"
  ): PlatformSettings {
    this.platformSettings = { ...this.platformSettings, ...updates };
    this.auditLogs.unshift({
      id: `log-admin-${Date.now()}`,
      actorId: adminUserId,
      actorName: "Velvi Super Admin",
      action: "UPDATE_PLATFORM_SETTINGS",
      targetType: "PLATFORM_SETTINGS",
      newValue: updates,
      createdAt: new Date().toISOString(),
    });
    return this.platformSettings;
  }

  // -------------------------------------------------------------
  // CUSTOMER MANAGEMENT (Quick Add, Edit, Delete & Cloud Sync)
  // -------------------------------------------------------------
  public createCustomer(params: {
    businessId: string;
    name: string;
    mobile?: string;
    whatsapp?: string;
    address?: string;
    city?: string;
    notes?: string;
    gothram?: string;
    nakshatram?: string;
    rasi?: string;
  }): Customer {
    const normalizedMobile = params.mobile?.trim() ? normalizeIndianMobile(params.mobile) : "";

    // Prevent duplicate customers with the same mobile for this business
    if (normalizedMobile) {
      const existing = this.customers.find(
        (c) => c.businessId === params.businessId && c.mobile && normalizeIndianMobile(c.mobile) === normalizedMobile
      );
      if (existing) {
        if (params.name) existing.name = params.name.trim();
        if (params.city) existing.city = params.city.trim();
        if (params.address) existing.address = params.address.trim();
        if (params.notes) existing.notes = params.notes.trim();
        if (params.gothram) existing.gothram = params.gothram.trim();
        if (params.nakshatram) existing.nakshatram = params.nakshatram.trim();
        if (params.rasi) existing.rasi = params.rasi.trim();
        this.saveToLocalStorage();
        this.notifyListeners();
        return existing;
      }
    }

    const newCustomer: Customer = {
      id: `c-${Date.now()}`,
      businessId: params.businessId,
      name: params.name.trim(),
      mobile: normalizedMobile,
      whatsapp: params.whatsapp?.trim() || normalizedMobile,
      address: params.address?.trim() || "",
      city: params.city?.trim() || "Namakkal",
      notes: params.notes?.trim() || "",
      gothram: params.gothram?.trim() || "",
      nakshatram: params.nakshatram?.trim() || "",
      rasi: params.rasi?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCustomer);
    this.saveToLocalStorage();
    this.notifyListeners();
    pushCustomerToCloud(newCustomer).catch(() => {});
    return newCustomer;
  }

  public updateCustomer(
    customerId: string,
    updates: Partial<Customer>
  ): Customer | null {
    const customer = this.customers.find((c) => c.id === customerId);
    if (!customer) return null;
    Object.assign(customer, updates, { updatedAt: new Date().toISOString() });
    this.saveToLocalStorage();
    this.notifyListeners();
    pushCustomerToCloud(customer).catch(() => {});
    return customer;
  }

  public deleteCustomer(customerId: string): boolean {
    const idx = this.customers.findIndex((c) => c.id === customerId);
    if (idx === -1) return false;
    const deleted = this.customers[idx];
    this.recentlyDeleted.push({
      id: deleted.id,
      type: "customer",
      item: structuredClone(deleted),
      deletedAt: new Date().toISOString(),
    });
    this.customers.splice(idx, 1);
    this.saveToLocalStorage();
    this.notifyListeners();
    deleteCustomerFromCloud(customerId).catch(() => {});

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:deleted-item", {
          detail: {
            type: "customer",
            name: deleted.name || "Customer",
            id: deleted.id,
          },
        })
      );
    }
    return true;
  }

  // -------------------------------------------------------------
  // MEMBER MANAGEMENT (Add, Toggle, Delete)
  // -------------------------------------------------------------
  public createMember(params: {
    businessId: string;
    name: string;
    mobile?: string;
    role?: "OWNER" | "IYER" | "STAFF";
    specialization?: string;
    workingHours?: string;
  }): BusinessMember {
    const normalizedMobile = params.mobile ? normalizeIndianMobile(params.mobile) : "";
    const newMember: BusinessMember = {
      id: `m-${Date.now()}`,
      businessId: params.businessId,
      userId: `u-${Date.now()}`,
      name: params.name.trim(),
      mobile: normalizedMobile,
      role: params.role || "IYER",
      active: true,
      specialization: params.specialization?.trim() || "உதவி குருக்கள் (Assistant Priest)",
      workingDays: "All days",
      workingHours: params.workingHours || "06:00 - 20:00",
      bookingCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.members.push(newMember);
    this.saveToLocalStorage();
    this.notifyListeners();
    return newMember;
  }

  // -------------------------------------------------------------
  // BOOKING MANAGEMENT (Create, Get, List)
  // -------------------------------------------------------------
  public createBooking(params: {
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
    date: string;
    startTime: string;
    endTime?: string;
    durationMinutes?: number;
    location: string;
    totalAmount: number;
    advanceAmount: number;
    balanceAmount: number;
    paymentStatus: PaymentStatus;
    paymentDate?: string;
    paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE" | "OTHER";
    paymentRecipient?: "BUSINESS" | "PRIEST";
    paymentNotes?: string;
    status: BookingStatus;
    expenseAmount?: number;
    expenseNotes?: string;
    items?: BookingItem[];
    notes?: string;
  }): Booking {
    const bNum = (8248 + this.bookings.length + 1).toString();
    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      bookingNumber: `#${bNum}`,
      businessId: params.businessId,
      customerId: params.customerId,
      customerName: params.customerName,
      customerMobile: params.customerMobile,
      customerAddress: params.customerAddress,
      poojaId: params.poojaId,
      poojaEnglishName: params.poojaEnglishName || params.poojaTamilName,
      poojaTamilName: params.poojaTamilName || params.poojaEnglishName,
      assignedIyerId: params.assignedIyerId,
      assignedIyerName: params.assignedIyerName,
      date: params.date,
      startTime: params.startTime,
      endTime: params.endTime || params.startTime,
      durationMinutes: params.durationMinutes || 120,
      location: params.location || "Namakkal",
      totalAmount: params.totalAmount,
      advanceAmount: params.advanceAmount,
      balanceAmount: params.balanceAmount,
      paymentStatus: params.paymentStatus,
      paymentDate: params.paymentDate,
      paymentMethod: params.paymentMethod,
      paymentRecipient: params.paymentRecipient || "BUSINESS",
      paymentNotes: params.paymentNotes,
      status: params.status || "CONFIRMED",
      expenseAmount: params.expenseAmount || 0,
      expenseNotes: params.expenseNotes || "",
      items: params.items || [],
      notes: params.notes || "",
      createdBy: params.assignedIyerName || "Priest",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.bookings.unshift(newBooking);
    this.saveToLocalStorage();
    this.notifyListeners();
    try { pushBookingToCloud(newBooking).catch(() => {}); } catch (_) {}
    return newBooking;
  }

  // -------------------------------------------------------------
  // POOJA & HOMAM SERVICES CRUD
  // -------------------------------------------------------------
  public createPooja(params: {
    businessId: string;
    englishName?: string;
    tamilName?: string;
    description?: string;
    durationMinutes?: number;
    basePrice?: number;
    procedure?: string;
    items?: PoojaItemTemplate[];
  }): Pooja {
    const finalEn = (params.englishName?.trim() || params.tamilName?.trim() || "Pooja");
    const finalTa = (params.tamilName?.trim() || params.englishName?.trim() || "பூஜை");

    const newPooja: Pooja = {
      id: `p-${Date.now()}`,
      businessId: params.businessId,
      englishName: finalEn,
      tamilName: finalTa,
      description: params.description?.trim() || "",
      durationMinutes: Number(params.durationMinutes) || 120,
      basePrice: Number(params.basePrice) || 0,
      procedure: params.procedure?.trim() || "",
      active: true,
      isCustom: true,
      items: params.items || [],
      createdAt: new Date().toISOString(),
    };
    this.poojas.unshift(newPooja);
    this.saveToLocalStorage();
    this.notifyListeners();
    pushPoojaToCloud(newPooja).catch(() => {});
    return newPooja;
  }

  public updatePooja(
    poojaId: string,
    updates: Partial<Pooja>
  ): Pooja | null {
    const pooja = this.poojas.find((p) => p.id === poojaId);
    if (!pooja) return null;
    Object.assign(pooja, updates);
    this.saveToLocalStorage();
    this.notifyListeners();
    pushPoojaToCloud(pooja).catch(() => {});
    return pooja;
  }

  public deletePooja(poojaId: string): boolean {
    const idx = this.poojas.findIndex((p) => p.id === poojaId);
    if (idx === -1) return false;
    const deleted = this.poojas[idx];
    this.recentlyDeleted.push({
      id: deleted.id,
      type: "pooja",
      item: structuredClone(deleted),
      deletedAt: new Date().toISOString(),
    });
    this.poojas.splice(idx, 1);
    this.saveToLocalStorage();
    this.notifyListeners();
    deletePoojaFromCloud(poojaId).catch(() => {});

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:deleted-item", {
          detail: {
            type: "pooja",
            name: deleted.tamilName || deleted.englishName || "Pooja",
            id: deleted.id,
          },
        })
      );
    }
    return true;
  }

  public undoLastDelete(): { success: boolean; type?: string; name?: string; message?: string } {
    if (this.recentlyDeleted.length === 0) {
      return { success: false, message: "மீட்டெடுக்க எதுவும் இல்லை (Nothing to undo)" };
    }
    const last = this.recentlyDeleted.pop()!;
    let name = "";
    if (last.type === "booking") {
      this.bookings.unshift(last.item);
      name = `${last.item.bookingNumber} (${last.item.poojaEnglishName || last.item.poojaTamilName || "Booking"})`;
    } else if (last.type === "pooja") {
      this.poojas.unshift(last.item);
      name = last.item.tamilName || last.item.englishName || "Pooja";
    } else if (last.type === "customer") {
      this.customers.unshift(last.item);
      name = last.item.name || "Customer";
    }
    this.saveToLocalStorage();
    this.notifyListeners();
    return { success: true, type: last.type, name };
  }

  public getRecentlyDeleted(): Array<{
    id: string;
    type: "booking" | "pooja" | "customer";
    item: any;
    deletedAt: string;
    title: string;
    subtitle: string;
  }> {
    return [...this.recentlyDeleted].reverse().map((entry) => {
      let title = "";
      let subtitle = "";
      if (entry.type === "booking") {
        title = `${entry.item.bookingNumber || "#"} - ${entry.item.poojaTamilName || entry.item.poojaEnglishName || "பூஜா முன்பதிவு"}`;
        subtitle = `${entry.item.customerName || "பக்தர்"} • ${entry.item.date || ""} • ₹${entry.item.totalAmount?.toLocaleString("en-IN") || 0}`;
      } else if (entry.type === "pooja") {
        title = entry.item.tamilName || entry.item.englishName || "பூஜா வகை";
        subtitle = `கட்டணம்: ₹${entry.item.basePrice?.toLocaleString("en-IN") || 0} • ${entry.item.items?.length || 0} பொருட்கள்`;
      } else if (entry.type === "customer") {
        title = entry.item.name || "பக்தர்";
        subtitle = `${entry.item.mobile || ""} • ${entry.item.city || ""}`;
      }
      return {
        ...entry,
        title,
        subtitle,
      };
    });
  }

  public restoreDeletedItem(id: string): { success: boolean; type?: string; name?: string; message?: string } {
    const idx = this.recentlyDeleted.findIndex((d) => d.id === id);
    if (idx === -1) {
      return { success: false, message: "பதிவு கிடைக்கவில்லை (Item not found in trash)" };
    }
    const [entry] = this.recentlyDeleted.splice(idx, 1);
    let name = "";
    if (entry.type === "booking") {
      this.bookings.unshift(entry.item);
      name = `${entry.item.bookingNumber} (${entry.item.poojaEnglishName || entry.item.poojaTamilName || "Booking"})`;
    } else if (entry.type === "pooja") {
      this.poojas.unshift(entry.item);
      name = entry.item.tamilName || entry.item.englishName || "Pooja";
    } else if (entry.type === "customer") {
      this.customers.unshift(entry.item);
      name = entry.item.name || "Customer";
    }

    this.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId: entry.item.businessId || "biz-venkateswara-01",
      actorName: "Priest",
      action: "RESTORE_ITEM",
      targetType: entry.type.toUpperCase() as any,
      targetId: entry.id,
      newValue: { name },
      createdAt: new Date().toISOString(),
    });

    this.saveToLocalStorage();
    this.notifyListeners();
    return { success: true, type: entry.type, name };
  }

  public clearRecentlyDeleted(): void {
    this.recentlyDeleted = [];
    this.saveToLocalStorage();
    this.notifyListeners();
  }

  // -------------------------------------------------------------
  // REACTIVITY & PERSISTENCE
  // -------------------------------------------------------------
  private listeners: Array<() => void> = [];

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l();
      } catch (e) {
        console.error(e);
      }
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("velvi:db-change"));
    }
  }

  public saveToLocalStorage(): void {
    if (typeof window === "undefined") return;
    try {
      const state = {
        isCleared: this.bookings.length === 0 && this.customers.length === 0,
        users: this.users,
        businesses: this.businesses,
        subscriptions: this.subscriptions,
        customers: this.customers,
        bookings: this.bookings,
        poojas: this.poojas,
        members: this.members,
        settlements: this.settlements,
        payments: this.payments,
        auditLogs: this.auditLogs,
        referrals: this.referrals,
        referralRewards: this.referralRewards,
        samagriCategories: this.samagriCategories,
        recentlyDeleted: this.recentlyDeleted,
      };
      localStorage.setItem("velvi_db_state_v2", JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage", e);
    }
  }

  public loadFromLocalStorage(): boolean {
    if (typeof window === "undefined") return false;
    try {
      const raw = localStorage.getItem("velvi_db_state_v2");
      if (!raw) return false;
      const state = JSON.parse(raw);
      if (state) {
        if (Array.isArray(state.users) && state.users.length > 0) {
          this.users = state.users;
        }
        if (Array.isArray(state.businesses) && state.businesses.length > 0) {
          this.businesses = state.businesses;
        }
        if (Array.isArray(state.subscriptions) && state.subscriptions.length > 0) {
          this.subscriptions = state.subscriptions;
        }
        if (Array.isArray(state.customers)) this.customers = state.customers;
        if (Array.isArray(state.bookings)) this.bookings = state.bookings;
        if (Array.isArray(state.poojas)) {
          this.poojas = state.poojas;
          
          // Unconditionally purge any legacy obsolete poojas across all businesses
          this.poojas = this.poojas.filter((p) => !isLegacyObsoletePooja(p));

          // Check if authentic 8 poojas migration has run
          const migrationKey = "velvi_authentic_8_poojas_v8";
          const hasMigrated = localStorage.getItem(migrationKey) === "true";

          if (!hasMigrated) {
            // Upsert / refresh the 8 authentic poojas for default business
            SEED_POOJAS.forEach((sp) => {
              const existingIdx = this.poojas.findIndex((p) => p.id === sp.id);
              if (existingIdx !== -1) {
                this.poojas[existingIdx] = structuredClone(sp);
              } else {
                this.poojas.push(structuredClone(sp));
              }
            });

            // Ensure every business in state is seeded with the authentic 8 poojas
            if (Array.isArray(this.businesses)) {
              this.businesses.forEach((b) => {
                this.seedDefaultPoojasForBusiness(b.id);
              });
            }
            localStorage.setItem(migrationKey, "true");
          } else {
            // Ensure any missing authentic pooja exists for default business and items are upgraded
            SEED_POOJAS.forEach((sp) => {
              const existingIdx = this.poojas.findIndex((p) => p.id === sp.id);
              if (existingIdx === -1) {
                this.poojas.push(structuredClone(sp));
              } else if (this.poojas[existingIdx].items.length < sp.items.length) {
                this.poojas[existingIdx].items = structuredClone(sp.items);
              }
            });

            // Ensure every business has its 8 authentic poojas
            if (Array.isArray(this.businesses)) {
              this.businesses.forEach((b) => {
                this.seedDefaultPoojasForBusiness(b.id);
              });
            }
          }

          // Persist clean poojas array to localStorage immediately
          this.saveToLocalStorage();
        }
        if (Array.isArray(state.members)) this.members = state.members;
        if (Array.isArray(state.settlements)) this.settlements = state.settlements;
        if (Array.isArray(state.payments)) this.payments = state.payments;
        if (Array.isArray(state.auditLogs)) this.auditLogs = state.auditLogs;
        if (Array.isArray(state.referrals)) this.referrals = state.referrals;
        if (Array.isArray(state.referralRewards)) this.referralRewards = state.referralRewards;
        if (Array.isArray(state.recentlyDeleted)) this.recentlyDeleted = state.recentlyDeleted;
        if (Array.isArray(state.samagriCategories) && state.samagriCategories.length > 0) {
          this.samagriCategories = state.samagriCategories;
          DEFAULT_SAMAGRI_CATEGORIES.forEach((defCat) => {
            const idx = this.samagriCategories.findIndex((c) => c.id === defCat.id);
            if (idx === -1) {
              this.samagriCategories.push(structuredClone(defCat));
            } else if (this.samagriCategories[idx].isDefault) {
              this.samagriCategories[idx].icon = defCat.icon;
              this.samagriCategories[idx].labelTa = defCat.labelTa;
              this.samagriCategories[idx].labelEn = defCat.labelEn;
            }
          });
        }
        if (localStorage.getItem("velvi_demo_data_cleared") === "true") {
          const seedBookingIds = new Set(SEED_BOOKINGS.map((b) => b.id));
          const seedCustomerIds = new Set(SEED_CUSTOMERS.map((c) => c.id));
          this.bookings = this.bookings.filter((b) => !b.isSample && !seedBookingIds.has(b.id) && !b.id.startsWith("b-82"));
          this.customers = this.customers.filter((c) => !c.isSample && !seedCustomerIds.has(c.id));
        }
        return true;
      }
    } catch (e) {
      console.error("Failed to load state from localStorage", e);
    }
    return false;
  }

  // -------------------------------------------------------------
  // SAMAGRI CATEGORIES MANAGEMENT (Add, Edit, Delete)
  // -------------------------------------------------------------
  public getSamagriCategories(): SamagriCategory[] {
    if (!this.samagriCategories || this.samagriCategories.length === 0) {
      this.samagriCategories = structuredClone(DEFAULT_SAMAGRI_CATEGORIES);
    } else {
      DEFAULT_SAMAGRI_CATEGORIES.forEach((defCat) => {
        const idx = this.samagriCategories.findIndex((c) => c.id === defCat.id);
        if (idx === -1) {
          this.samagriCategories.push(structuredClone(defCat));
        } else if (this.samagriCategories[idx].isDefault) {
          this.samagriCategories[idx].icon = defCat.icon;
          this.samagriCategories[idx].labelTa = defCat.labelTa;
          this.samagriCategories[idx].labelEn = defCat.labelEn;
        }
      });
    }
    return this.samagriCategories;
  }

  public addSamagriCategory(cat: Omit<SamagriCategory, "id">): SamagriCategory {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newCat: SamagriCategory = {
      ...cat,
      id,
      isDefault: false,
    };
    this.samagriCategories.push(newCat);
    this.saveToLocalStorage();
    this.notifyListeners();
    return newCat;
  }

  public updateSamagriCategory(id: string, updates: Partial<SamagriCategory>): boolean {
    const idx = this.samagriCategories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    this.samagriCategories[idx] = { ...this.samagriCategories[idx], ...updates };
    this.saveToLocalStorage();
    this.notifyListeners();
    return true;
  }

  public deleteSamagriCategory(id: string): boolean {
    const idx = this.samagriCategories.findIndex((c) => c.id === id);
    if (idx === -1) return false;
    if (this.samagriCategories.length <= 1) return false;
    this.samagriCategories.splice(idx, 1);
    this.saveToLocalStorage();
    this.notifyListeners();
    return true;
  }

  // -------------------------------------------------------------
  // DATA MANAGEMENT: CLEAR ALL & LOAD ALL
  // -------------------------------------------------------------
  public clearAllData(options?: { keepCatalog?: boolean }): void {
    this.bookings = [];
    this.customers = [];
    this.settlements = [];
    this.payments = [];
    this.bookingAssignments = [];
    this.referrals = [];
    this.referralRewards = [];
    this.auditLogs = [];
    if (!options?.keepCatalog) {
      this.poojas = [];
    }

    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem("velvi_booking_draft_v1");
      } catch (e) {}
      this.saveToLocalStorage();
    }
    this.notifyListeners();
  }

  public clearDemoData(options?: {
    clearBookings?: boolean;
    clearCustomers?: boolean;
    clearPoojas?: boolean;
  }): {
    removedBookings: number;
    removedCustomers: number;
    removedPoojas: number;
  } {
    const clearBookings = options?.clearBookings !== false;
    const clearCustomers = options?.clearCustomers !== false;
    const clearPoojas = options?.clearPoojas === true;

    const seedBookingIds = new Set(SEED_BOOKINGS.map((b) => b.id));
    const seedCustomerIds = new Set(SEED_CUSTOMERS.map((c) => c.id));
    const seedPoojaIds = new Set(SEED_POOJAS.map((p) => p.id));

    const isSampleBooking = (b: Booking) =>
      b.isSample === true ||
      b.id.startsWith("b-sample-") ||
      b.id.startsWith("b-82") ||
      seedBookingIds.has(b.id) ||
      ["b-101", "b-102", "b-103", "b-104", "b-105", "b-106"].includes(b.id);

    const isSampleCustomer = (c: Customer) =>
      c.isSample === true ||
      c.id.startsWith("c-sample-") ||
      seedCustomerIds.has(c.id) ||
      ["c-ramesh-01", "c-lakshmi-02", "c-meena-03", "c-suresh-04", "c-vignesh-05", "c-anandhi-06", "c-balaji-07", "c-karthik-08", "c-gowri-09", "c-jayanthi-10", "c-soundar-11", "c-revathi-12"].includes(c.id);

    const isSamplePooja = (p: Pooja) =>
      p.isSample === true ||
      p.id.startsWith("p-sample-") ||
      seedPoojaIds.has(p.id);

    const prevBCount = this.bookings.length;
    const prevCCount = this.customers.length;
    const prevPCount = this.poojas.length;

    if (clearBookings) {
      this.bookings = this.bookings.filter((b) => !isSampleBooking(b));
    }
    if (clearCustomers) {
      this.customers = this.customers.filter((c) => !isSampleCustomer(c));
    }
    if (clearPoojas) {
      this.poojas = this.poojas.filter((p) => !isSamplePooja(p));
    }

    const removedBookings = prevBCount - this.bookings.length;
    const removedCustomers = prevCCount - this.customers.length;
    const removedPoojas = prevPCount - this.poojas.length;

    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_demo_data_cleared", "true");
      this.saveToLocalStorage();
    }
    this.notifyListeners();

    return { removedBookings, removedCustomers, removedPoojas };
  }

  public removeSampleData(businessId?: string): {
    removedBookings: number;
    removedCustomers: number;
    removedPoojas: number;
  } {
    return this.clearSampleData(businessId);
  }

  public clearSampleData(businessId?: string): {
    removedBookings: number;
    removedCustomers: number;
    removedPoojas: number;
  } {
    const seedBookingIds = new Set(SEED_BOOKINGS.map((b) => b.id));
    const seedCustomerIds = new Set(SEED_CUSTOMERS.map((c) => c.id));

    const isSampleBooking = (b: Booking) => {
      if (businessId && b.businessId !== businessId) return false;
      return (
        b.isSample === true ||
        b.id.startsWith("b-sample-") ||
        b.id.startsWith("b-82") ||
        seedBookingIds.has(b.id) ||
        (b.id.includes("-biz-") && Array.from(seedBookingIds).some((id) => b.id.startsWith(id))) ||
        ["b-101", "b-102", "b-103", "b-104", "b-105", "b-106"].includes(b.id)
      );
    };

    const isSampleCustomer = (c: Customer) => {
      if (businessId && c.businessId !== businessId) return false;
      return (
        c.isSample === true ||
        c.id.startsWith("c-sample-") ||
        seedCustomerIds.has(c.id) ||
        (c.id.includes("-biz-") && Array.from(seedCustomerIds).some((id) => c.id.startsWith(id))) ||
        ["c-ramesh-01", "c-lakshmi-02", "c-meena-03", "c-suresh-04", "c-vignesh-05", "c-anandhi-06", "c-balaji-07", "c-karthik-08", "c-gowri-09", "c-jayanthi-10", "c-soundar-11", "c-revathi-12"].includes(c.id)
      );
    };

    const isSamplePooja = (p: Pooja) => {
      if (businessId && p.businessId !== businessId) return false;
      return p.isSample === true || p.id.startsWith("p-sample-");
    };

    const prevBCount = this.bookings.length;
    const prevCCount = this.customers.length;
    const prevPCount = this.poojas.length;

    this.bookings = this.bookings.filter((b) => !isSampleBooking(b));
    this.customers = this.customers.filter((c) => !isSampleCustomer(c));
    this.poojas = this.poojas.filter((p) => !isSamplePooja(p));

    const removedBookings = prevBCount - this.bookings.length;
    const removedCustomers = prevCCount - this.customers.length;
    const removedPoojas = prevPCount - this.poojas.length;

    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_demo_data_cleared", "true");
      this.saveToLocalStorage();
    }
    this.notifyListeners();

    return { removedBookings, removedCustomers, removedPoojas };
  }

  public loadSampleData(businessId?: string): { addedBookings: number; addedCustomers: number; addedPoojas: number } {
    const targetBizId = businessId || "biz-venkateswara-01";
    const sampleBookings = structuredClone(SEED_BOOKINGS).map((b) => ({
      ...b,
      id: targetBizId === "biz-venkateswara-01" ? b.id : `${b.id}-${targetBizId}`,
      businessId: targetBizId,
      customerId: targetBizId === "biz-venkateswara-01" ? b.customerId : `${b.customerId}-${targetBizId}`,
      poojaId: targetBizId === "biz-venkateswara-01" ? b.poojaId : `${b.poojaId}-${targetBizId}`,
      isSample: true,
    }));
    const sampleCustomers = structuredClone(SEED_CUSTOMERS).map((c) => ({
      ...c,
      id: targetBizId === "biz-venkateswara-01" ? c.id : `${c.id}-${targetBizId}`,
      businessId: targetBizId,
      isSample: true,
    }));
    const samplePoojas = structuredClone(SEED_POOJAS).map((p) => ({
      ...p,
      id: targetBizId === "biz-venkateswara-01" ? p.id : `${p.id}-${targetBizId}`,
      businessId: targetBizId,
      isSample: true,
    }));

    let addedBookings = 0;
    let addedCustomers = 0;
    let addedPoojas = 0;

    sampleBookings.forEach((sb) => {
      if (!this.bookings.some((b) => b.id === sb.id)) {
        this.bookings.push(sb);
        addedBookings++;
      }
    });
    sampleCustomers.forEach((sc) => {
      if (!this.customers.some((c) => c.id === sc.id)) {
        this.customers.push(sc);
        addedCustomers++;
      }
    });
    samplePoojas.forEach((sp) => {
      if (!this.poojas.some((p) => p.id === sp.id)) {
        this.poojas.push(sp);
        addedPoojas++;
      }
    });

    if (typeof window !== "undefined") {
      localStorage.removeItem("velvi_demo_data_cleared");
      this.saveToLocalStorage();
    }
    this.notifyListeners();

    return { addedBookings, addedCustomers, addedPoojas };
  }

  public loadAllData(): void {
    this.bookings = structuredClone(SEED_BOOKINGS).map((b) => ({ ...b, isSample: true }));
    this.customers = structuredClone(SEED_CUSTOMERS).map((c) => ({ ...c, isSample: true }));
    this.poojas = structuredClone(SEED_POOJAS).map((p) => ({ ...p, isSample: true }));
    this.members = structuredClone(SEED_MEMBERS);
    this.businesses = structuredClone([SEED_BUSINESS]);
    this.subscriptions = structuredClone([SEED_SUBSCRIPTION]);
    this.settlements = [
      {
        id: "set-01",
        businessId: "biz-venkateswara-01",
        iyerId: "m-suresh-02",
        iyerName: "Suresh Iyer",
        amount: 30000,
        paymentMethod: "UPI",
        reference: "UPI/39482710/Axis",
        notes: "August full settlement",
        settlementDate: "2026-09-01",
        createdAt: "2026-09-01T18:00:00Z",
      },
    ];
    this.payments = [
      {
        id: "pay-sub-01",
        businessId: "biz-venkateswara-01",
        userId: "u-ravi-iyer-01",
        orderId: "order_venk_01",
        gateway: "CASHFREE",
        gatewayPaymentId: "cf_pay_918237",
        amount: 499,
        currency: "INR",
        status: "SUCCESS",
        billingCycle: "MONTHLY",
        paymentMethod: "UPI",
        createdAt: "2026-08-31T08:30:00Z",
      },
    ];
    this.referrals = [
      {
        id: "ref-01",
        referrerUserId: "u-ravi-iyer-01",
        referrerName: "Ravi Iyer",
        referrerBusinessId: "biz-venkateswara-01",
        referralCode: "VELVI-RAVI123",
        refereeUserId: "u-suresh-iyer-02",
        refereeName: "Suresh",
        refereeBusinessId: "biz-suresh-99",
        status: "REWARDED",
        rewardDaysGranted: 30,
        createdAt: "2026-08-15T10:00:00Z",
        qualifiedAt: "2026-08-18T12:00:00Z",
        rewardedAt: "2026-08-18T12:00:00Z",
      },
    ];
    this.referralRewards = [];
    this.subscriptionAdjustments = [];
    this.auditLogs = [];

    if (typeof window !== "undefined") {
      this.saveToLocalStorage();
    }
    this.notifyListeners();
  }
}

// Global singleton instance
declare global {
  var __velviDb: VelviDatabaseStore | undefined;
}

export const db: VelviDatabaseStore = global.__velviDb || new VelviDatabaseStore();
if (process.env.NODE_ENV !== "production") {
  global.__velviDb = db;
}
