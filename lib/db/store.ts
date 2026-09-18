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

export class VelviDatabaseStore {
  public platformSettings: PlatformSettings = {
    appName: "Velvi",
    appTamilName: "வேள்வி",
    tagline: "Sacred Ceremonies, Seamless Management",
    taglineTamil: "நல்லதே நம் நோக்கம்",
    logoUrl: "/velvi-sacred-flame.png",
    appVersion: "2.1.0",
    developerName: "Maniraja",
    developerMobile: "+91-8300030123",
    developerInstagram: "@maniraja__",
    announcementActive: true,
    announcementMessage: "System operational. All bookings and reminders running on schedule.",
    maintenanceMode: false,
  };

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
  public customers: Customer[] = structuredClone(SEED_CUSTOMERS);
  public poojas: Pooja[] = structuredClone(SEED_POOJAS);
  public bookings: Booking[] = structuredClone(SEED_BOOKINGS);
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

  // -------------------------------------------------------------
  // TENANT ISOLATION: Strict business_id Filtering
  // -------------------------------------------------------------
  public getCustomers(businessId: string): Customer[] {
    return this.customers.filter((c) => c.businessId === businessId);
  }

  public getBookings(businessId: string): Booking[] {
    return this.bookings.filter((b) => b.businessId === businessId);
  }

  public getPoojas(businessId: string): Pooja[] {
    return this.poojas.filter((p) => p.businessId === businessId);
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
    this.bookings.splice(index, 1);

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
  // CUSTOMER MANAGEMENT (Quick Add & Find)
  // -------------------------------------------------------------
  public createCustomer(params: {
    businessId: string;
    name: string;
    mobile?: string;
    address?: string;
    city?: string;
    notes?: string;
  }): Customer {
    const normalizedMobile = params.mobile?.trim() ? normalizeIndianMobile(params.mobile) : "";
    const newCust: Customer = {
      id: `c-${Date.now()}`,
      businessId: params.businessId,
      name: params.name.trim(),
      mobile: normalizedMobile,
      whatsapp: normalizedMobile,
      address: params.address?.trim() || "",
      city: params.city?.trim() || "Namakkal",
      notes: params.notes?.trim() || "",
      createdAt: new Date().toISOString(),
    };
    this.customers.unshift(newCust);
    return newCust;
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
    status: BookingStatus;
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
      poojaEnglishName: params.poojaEnglishName,
      poojaTamilName: params.poojaTamilName,
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
      status: params.status || "CONFIRMED",
      items: params.items || [],
      notes: params.notes || "",
      createdBy: params.assignedIyerName || "Priest",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.bookings.unshift(newBooking);
    return newBooking;
  }

  // -------------------------------------------------------------
  // POOJA & HOMAM SERVICES CRUD
  // -------------------------------------------------------------
  public createPooja(params: {
    businessId: string;
    englishName: string;
    tamilName?: string;
    description?: string;
    durationMinutes?: number;
    basePrice?: number;
    procedure?: string;
    items?: PoojaItemTemplate[];
  }): Pooja {
    const newPooja: Pooja = {
      id: `p-${Date.now()}`,
      businessId: params.businessId,
      englishName: params.englishName.trim(),
      tamilName: params.tamilName?.trim() || params.englishName.trim(),
      description: params.description?.trim() || "",
      durationMinutes: Number(params.durationMinutes) || 120,
      basePrice: Number(params.basePrice) || 0,
      procedure: params.procedure?.trim() || "",
      active: true,
      items: params.items || [],
      createdAt: new Date().toISOString(),
    };
    this.poojas.unshift(newPooja);
    return newPooja;
  }

  public updatePooja(
    poojaId: string,
    updates: Partial<Pooja>
  ): Pooja | null {
    const pooja = this.poojas.find((p) => p.id === poojaId);
    if (!pooja) return null;
    Object.assign(pooja, updates);
    return pooja;
  }

  public deletePooja(poojaId: string): boolean {
    const idx = this.poojas.findIndex((p) => p.id === poojaId);
    if (idx === -1) return false;
    this.poojas.splice(idx, 1);
    return true;
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
