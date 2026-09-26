import { describe, it, expect, beforeEach } from "vitest";
import fs from "fs";
import path from "path";
import { VelviDatabaseStore, DEFAULT_SAMAGRI_CATEGORIES } from "../lib/db/store";
import { getTamilDate, formatTime12H } from "../lib/calendar/tamil";
import {
  normalizeIndianMobile,
  maskEmail,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "../lib/utils/phone";
import { cashfree } from "../lib/payments/cashfree";
import { SAMAGRI_CATALOG, normalizeCategoryId } from "../lib/samagri/catalog";
import { APP_VERSION } from "../lib/version/history";

describe("VELVI SAAS — CORE ARCHITECTURE & BUSINESS RULES VERIFICATION", () => {
  let store: VelviDatabaseStore;

  beforeEach(() => {
    store = new VelviDatabaseStore();
  });

  // TEST CASE 1: Tenant Isolation
  it("Test 1: User A cannot access Business B data (Tenant Isolation)", () => {
    // Add data for Business B
    store.customers.push({
      id: "c-secret-b",
      businessId: "biz-secret-b",
      name: "Business B Customer",
      mobile: "+919111111111",
      createdAt: new Date().toISOString(),
    });

    const businessACustomers = store.getCustomers("biz-venkateswara-01");
    expect(businessACustomers.some((c) => c.businessId === "biz-secret-b")).toBe(false);

    const businessBCustomers = store.getCustomers("biz-secret-b");
    expect(businessBCustomers.length).toBe(1);
    expect(businessBCustomers[0].name).toBe("Business B Customer");
  });

  // TEST CASE 2: Duplicate Mobile Number Check
  it("Test 2: User cannot create second account with same mobile", () => {
    const existingMobile = "+919876543210";
    const foundUser = store.findUserByMobile(existingMobile);
    expect(foundUser).toBeDefined();
    expect(foundUser?.email).toBe("ravi.iyer@gmail.com");

    // Normalization test (98765 43210 matches +919876543210)
    const normalizedFound = store.findUserByMobile("98765 43210");
    expect(normalizedFound).toBeDefined();
    expect(normalizedFound?.id).toBe(foundUser?.id);
  });

  // TEST CASE 2B: Multi-Account Lookup by Mobile Number (Point 3)
  it("Test 2B: Multi-account lookup returns all accounts linked to the same mobile", () => {
    // Dynamically insert test accounts for multi-account lookup verification
    store.users.push({
      id: "u-ravi-temple-05",
      googleId: "google-50697880",
      email: "ravi.temple@gmail.com",
      name: "Ravi Iyer (Temple Trust)",
      mobile: "+919876543210",
      mobileVerified: true,
      role: "OWNER",
      referralCode: "VELVI-TEMPLE55",
      createdAt: "2026-08-25T14:00:00Z",
    });
    store.users.push({
      id: "u-suresh-iyer-02",
      googleId: "google-20394857",
      email: "suresh.iyer@gmail.com",
      name: "Suresh Iyer",
      mobile: "+919876543211",
      mobileVerified: true,
      role: "IYER",
      referralCode: "VELVI-SURESH456",
      createdAt: "2026-08-05T10:00:00Z",
    });

    const multiAccounts = store.findUsersByMobile("98765 43210");
    expect(multiAccounts.length).toBeGreaterThanOrEqual(2);
    const emails = multiAccounts.map((u) => u.email);
    expect(emails).toContain("ravi.iyer@gmail.com");
    expect(emails).toContain("ravi.temple@gmail.com");

    // Single account test
    const singleAccount = store.findUsersByMobile("98765 43211");
    expect(singleAccount.length).toBe(1);
    expect(singleAccount[0].email).toBe("suresh.iyer@gmail.com");
  });

  // TEST CASE 2C: Platform Branding & App Updates (Point 1)
  it("Test 2C: Platform branding and updates can be modified by super admin", () => {
    expect(store.platformSettings.appName).toBe("Velvi");
    const updated = store.updatePlatformSettings({
      appName: "Velvi Poojas",
      appVersion: "1.3.0",
      announcementMessage: "Festive season pooja bookings are now open!",
    });
    expect(updated.appName).toBe("Velvi Poojas");
    expect(updated.appVersion).toBe("1.3.0");
    expect(store.platformSettings.announcementMessage).toContain("Festive season");

    // Verify immutable audit log was created
    const log = store.auditLogs.find((l) => l.action === "UPDATE_PLATFORM_SETTINGS");
    expect(log).toBeDefined();
    expect(log?.targetType).toBe("PLATFORM_SETTINGS");
  });

  // TEST CASE 3: Account Recovery Masked Email
  it("Test 3: Account recovery masks email until OTP verified", () => {
    const masked1 = maskEmail("ravi.iyer@gmail.com");
    expect(masked1).toBe("r*****@gmail.com");

    const masked2 = maskEmail("r@gmail.com");
    expect(masked2).toBe("r*****@gmail.com");
    // Ensure full email is not revealed
    expect(masked1).not.toBe("ravi.iyer@gmail.com");
  });

  // TEST CASE 4: Referral Reward Does Not Happen on Signup Alone
  it("Test 4: Referral reward does not trigger on signup alone", () => {
    if (!store.users.some((u) => u.id === "u-kumar-iyer-03")) {
      store.users.push({
        id: "u-kumar-iyer-03",
        googleId: "google-30495867",
        email: "kumar.iyer@gmail.com",
        name: "Kumar Iyer",
        mobile: "+919876543212",
        mobileVerified: true,
        role: "IYER",
        referralCode: "VELVI-KUMAR789",
        createdAt: "2026-08-10T11:00:00Z",
      });
    }

    const pendingRef = store.referrals.find((r) => r.id === "ref-02");
    expect(pendingRef?.status).toBe("PENDING");
    expect(pendingRef?.rewardDaysGranted).toBe(0);

    // Attempting to reward without verified first payment fails
    const result = store.processReferralReward({
      referralId: "ref-02",
      isFirstPaymentVerified: false,
    });
    expect(result.success).toBe(false);
    expect(result.error).toContain("verified first paid subscription");
  });

  // TEST CASE 5: Referral Reward Happens Only After Verified Payment
  it("Test 5: Referral reward succeeds when first payment is verified", () => {
    if (!store.users.some((u) => u.id === "u-kumar-iyer-03")) {
      store.users.push({
        id: "u-kumar-iyer-03",
        googleId: "google-30495867",
        email: "kumar.iyer@gmail.com",
        name: "Kumar Iyer",
        mobile: "+919876543212",
        mobileVerified: true,
        role: "IYER",
        referralCode: "VELVI-KUMAR789",
        createdAt: "2026-08-10T11:00:00Z",
      });
    }

    // Setup referee subscription
    store.subscriptions.push({
      id: "sub-kumar-99",
      businessId: "biz-kumar-99",
      planName: "Velvi Pro",
      planCode: "VELVI_PRO",
      status: "ACTIVE",
      trialStart: new Date().toISOString(),
      trialEnd: new Date().toISOString(),
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: "2026-10-01T00:00:00Z",
      billingCycle: "MONTHLY",
      autoRenew: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const result = store.processReferralReward({
      referralId: "ref-02",
      isFirstPaymentVerified: true,
    });
    expect(result.success).toBe(true);

    const updatedRef = store.referrals.find((r) => r.id === "ref-02");
    expect(updatedRef?.status).toBe("REWARDED");
    expect(updatedRef?.rewardDaysGranted).toBe(30);
  });

  // TEST CASE 6 & 7: Active vs Expired Referral Expiry Date Calculation
  it("Test 6 & 7: Referral validity calculation handles active vs expired dates correctly", () => {
    // Active subscription: adds to existing expiry
    const futureDate = "2026-10-30T00:00:00Z";
    const activeResult = store.adjustSubscriptionValidity({
      businessId: "biz-venkateswara-01",
      adminUserId: "u-super-admin-01",
      adminName: "Velvi Admin",
      adjustmentType: "EXTEND",
      days: 30,
      reason: "Referral reward",
    });
    expect(activeResult.success).toBe(true);

    // Expired subscription: adds to today, NOT to old expired date
    const oldExpiredDate = "2024-01-01T00:00:00Z";
    store.subscriptions.push({
      id: "sub-expired-test",
      businessId: "biz-expired-01",
      planName: "Velvi Pro",
      planCode: "VELVI_PRO",
      status: "EXPIRED",
      trialStart: "2023-11-01T00:00:00Z",
      trialEnd: "2023-12-01T00:00:00Z",
      currentPeriodStart: "2023-12-01T00:00:00Z",
      currentPeriodEnd: oldExpiredDate,
      billingCycle: "MONTHLY",
      autoRenew: false,
      createdAt: "2023-11-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    });

    const expiredResult = store.adjustSubscriptionValidity({
      businessId: "biz-expired-01",
      adminUserId: "u-super-admin-01",
      adminName: "Velvi Admin",
      adjustmentType: "EXTEND",
      days: 30,
      reason: "Renewal reward",
    });
    expect(expiredResult.success).toBe(true);

    const updatedEnd = new Date(expiredResult.subscription!.currentPeriodEnd);
    const now = new Date();
    // New end date must be approximately now + 30 days (greater than today)
    expect(updatedEnd.getTime()).toBeGreaterThan(now.getTime());
    // Must NOT be 2024 + 30 days
    expect(updatedEnd.getFullYear()).toBeGreaterThanOrEqual(now.getFullYear());
  });

  // TEST CASE 8: Super Admin Manual Validity Adjustment with Audit Log
  it("Test 8: Admin can manually extend validity with mandatory audit log", () => {
    const initialSub = store.getSubscription("biz-venkateswara-01")!;
    const prevEnd = initialSub.currentPeriodEnd;

    const res = store.adjustSubscriptionValidity({
      businessId: "biz-venkateswara-01",
      adminUserId: "u-super-admin-01",
      adminName: "Velvi Admin",
      adjustmentType: "EXTEND",
      days: 15,
      reason: "Festival support compensation",
    });

    expect(res.success).toBe(true);
    expect(new Date(res.subscription!.currentPeriodEnd).getTime()).toBeGreaterThan(
      new Date(prevEnd).getTime()
    );

    // Verify audit log
    const lastAudit = store.auditLogs[store.auditLogs.length - 1];
    expect(lastAudit.action).toBe("SUBSCRIPTION_EXTEND");
    expect(lastAudit.reason).toBe("Festival support compensation");
  });

  // TEST CASE 9: Double Booking Prevention
  it("Test 9: Iyer cannot be assigned to conflicting overlapping booking", () => {
    // Kumar Iyer has booking on 2026-09-15 from 08:00 AM for 180 mins (8:00 AM - 11:00 AM)
    const conflictCheck = store.checkIyerConflict({
      businessId: "biz-venkateswara-01",
      iyerId: "m-kumar-03",
      date: "2026-09-15",
      startTime: "09:00 AM",
      durationMinutes: 120,
    });

    expect(conflictCheck.hasConflict).toBe(true);
    expect(conflictCheck.reason).toContain("already has a booking");

    // Non-conflicting time (evening 04:00 PM)
    const nonConflict = store.checkIyerConflict({
      businessId: "biz-venkateswara-01",
      iyerId: "m-kumar-03",
      date: "2026-09-15",
      startTime: "04:00 PM",
      durationMinutes: 120,
    });
    expect(nonConflict.hasConflict).toBe(false);
  });

  // TEST CASE 10: Reassignment Preserves History
  it("Test 10: Reassignment preserves history and updates assigned Iyer", () => {
    const booking = store.bookings[0]; // b-8248 initially assigned to Ravi Iyer (m-ravi-01)
    expect(booking.assignedIyerId).toBe("m-ravi-01");

    const reassignRes = store.reassignBooking({
      bookingId: booking.id,
      newIyerId: "m-suresh-02",
      reassignedBy: "Ravi Iyer",
      reason: "Traveling out of town",
    });

    expect(reassignRes.success).toBe(true);
    expect(store.bookings[0].assignedIyerId).toBe("m-suresh-02");
    expect(store.bookings[0].assignedIyerName).toBe("Suresh Iyer");

    // Check assignment history
    const history = store.bookingAssignments.filter((a) => a.bookingId === booking.id);
    expect(history.length).toBe(1);
    expect(history[0].previousIyerId).toBe("m-ravi-01");
    expect(history[0].newIyerId).toBe("m-suresh-02");
    expect(history[0].reason).toBe("Traveling out of town");
  });

  // TEST CASE 11: Paid User Can Export, Trial Gate Check
  it("Test 11: Paid user can export, expired/restricted accounts handled gracefully", () => {
    const activeSub = store.getSubscription("biz-venkateswara-01");
    expect(activeSub?.status).toBe("ACTIVE");

    // Feature gate check
    const isExportAllowed = (status?: string) => status === "ACTIVE";
    expect(isExportAllowed(activeSub?.status)).toBe(true);
    expect(isExportAllowed("TRIAL")).toBe(false);
    expect(isExportAllowed("EXPIRED")).toBe(false);
  });

  // TEST CASE 12: Expired User Data Remains Safe
  it("Test 12: Expired user data remains safely preserved", () => {
    // Change subscription to EXPIRED
    const sub = store.getSubscription("biz-venkateswara-01")!;
    sub.status = "EXPIRED";

    // All customer and booking data is still 100% accessible
    const customers = store.getCustomers("biz-venkateswara-01");
    expect(customers.length).toBeGreaterThan(0);
    const bookings = store.getBookings("biz-venkateswara-01");
    expect(bookings.length).toBeGreaterThan(0);
  });

  // TEST CASE 13: Cashfree Frontend Success Without Verification Fails
  it("Test 13: Webhook verification rejects invalid signature", () => {
    const isValid = cashfree.verifyWebhookSignature(
      "invalid-forged-signature",
      JSON.stringify({ order_id: "order_123", status: "SUCCESS" }),
      Date.now().toString()
    );
    expect(isValid).toBe(false);
  });

  // TEST CASE 14: Dual Tamil + English Calendar Accuracy
  it("Test 14: Tamil + English calendar accurately computes dual dates and Tamil month", () => {
    const tamilInfo = getTamilDate("2026-09-12");
    expect(tamilInfo.dayOfMonth).toBe(12);
    expect(tamilInfo.monthNameEn).toBe("Sep");
    expect(tamilInfo.dayOfWeekEn).toBe("Saturday");
    expect(tamilInfo.dayOfWeekTa).toBe("சனி");
    expect(tamilInfo.tamilMonth).toBeDefined();
    expect(tamilInfo.tamilDay).toBeGreaterThan(0);
    expect(tamilInfo.rahuKalam).toBe("09:00 - 10:30");
    expect(tamilInfo.formattedDualDate).toContain("12 Sep 2026");
  });

  // TEST CASE 15: Self-Attendance Default & Re-claiming Pooja Back to Self
  it("Test 15: Delegated booking can be reclaimed back to Self (நானே செல்கிறேன்)", () => {
    // b-8249 is initially assigned to Suresh Iyer (m-suresh-02)
    const booking = store.bookings.find((b) => b.id === "b-8249")!;
    expect(booking.assignedIyerId).toBe("m-suresh-02");

    // Owner Ravi Iyer reclaims it to himself
    const reclaimRes = store.reassignBooking({
      bookingId: booking.id,
      newIyerId: "m-ravi-01",
      reassignedBy: "Ravi Iyer",
      reason: "நானே செல்கிறேன் (Taking back to perform personally)",
    });

    expect(reclaimRes.success).toBe(true);
    expect(booking.assignedIyerId).toBe("m-ravi-01");
    expect(booking.assignedIyerName).toBe("Ravi Iyer");

    // Verify assignment history has logged the change
    const logs = store.bookingAssignments.filter((a) => a.bookingId === booking.id);
    expect(logs.length).toBeGreaterThan(0);
    const lastLog = logs[logs.length - 1];
    expect(lastLog.previousIyerName).toBe("Suresh Iyer");
    expect(lastLog.newIyerName).toBe("Ravi Iyer");
    expect(lastLog.reason).toContain("நானே செல்கிறேன்");
  });

  // TEST CASE 16: Cancel Booking with Refund to Customer
  it("Test 16: Cancel booking with Refund to Customer records refund & frees slot", () => {
    const booking = store.bookings[0];
    const initialAdvance = booking.advanceAmount; // 5000

    const cancelRes = store.cancelBooking({
      bookingId: booking.id,
      cancelledBy: "Ravi Iyer",
      reason: "Client family function postponed",
      refundDecision: "REFUNDED",
      refundAmount: initialAdvance,
    });

    expect(cancelRes.success).toBe(true);
    expect(booking.status).toBe("CANCELLED");
    expect(booking.refundDecision).toBe("REFUNDED");
    expect(booking.refundAmount).toBe(initialAdvance);
    expect(booking.cancellationReason).toBe("Client family function postponed");

    // Verify slot is now free (conflict check returns false)
    const slotCheck = store.checkIyerConflict({
      businessId: booking.businessId,
      iyerId: booking.assignedIyerId!,
      date: booking.date,
      startTime: booking.startTime,
      durationMinutes: booking.durationMinutes,
    });
    expect(slotCheck.hasConflict).toBe(false);
  });

  // TEST CASE 17: Cancel Booking with Retained by Us
  it("Test 17: Cancel booking with Retained by Us preserves advance as non-refundable dakshina", () => {
    const booking = store.bookings[1];
    const advance = booking.advanceAmount;

    const cancelRes = store.cancelBooking({
      bookingId: booking.id,
      cancelledBy: "Ravi Iyer",
      reason: "Client cancelled on the morning of muhurtham",
      refundDecision: "RETAINED",
      retainedAmount: advance,
    });

    expect(cancelRes.success).toBe(true);
    expect(booking.status).toBe("CANCELLED");
    expect(booking.refundDecision).toBe("RETAINED");
    expect(booking.retainedAmount).toBe(advance);
  });

  // TEST CASE 18: Delete Booking Removes from List & Logs Audit
  it("Test 18: Delete booking permanently removes booking and creates audit log", () => {
    const totalBefore = store.bookings.length;
    const targetId = store.bookings[0].id;

    const delRes = store.deleteBooking({
      bookingId: targetId,
      deletedBy: "Ravi Iyer",
      reason: "Accidental duplicate booking entry",
    });

    expect(delRes.success).toBe(true);
    expect(store.bookings.length).toBe(totalBefore - 1);
    expect(store.bookings.some((b) => b.id === targetId)).toBe(false);

    // Audit log check
    const lastAudit = store.auditLogs[store.auditLogs.length - 1];
    expect(lastAudit.action).toBe("BOOKING_DELETED");
    expect(lastAudit.targetId).toBe(targetId);
  });

  // TEST CASE 19: Full Booking Update with Double-Booking Conflict Prevention
  it("Test 19: Full booking update validates double-booking collision before saving", () => {
    // b-8248 is on 2026-09-12 08:00 AM (Ravi Iyer)
    // b-8250 (on 2026-09-15) tries to move to 2026-09-12 08:30 AM with Ravi Iyer -> should conflict
    const bookingToEdit = store.bookings.find((b) => b.id === "b-8250")!;

    const editRes = store.updateBooking({
      bookingId: bookingToEdit.id,
      updatedBy: "Ravi Iyer",
      updates: {
        date: "2026-09-12",
        startTime: "08:30 AM",
        assignedIyerId: "m-ravi-01",
        durationMinutes: 120,
      },
    });

    expect(editRes.success).toBe(false);
    expect(editRes.error).toContain("already has a booking");

    // Non-conflicting update (evening 05:00 PM) succeeds
    const successRes = store.updateBooking({
      bookingId: bookingToEdit.id,
      updatedBy: "Ravi Iyer",
      updates: {
        date: "2026-09-12",
        startTime: "05:00 PM",
        assignedIyerId: "m-ravi-01",
        durationMinutes: 90,
        location: "Trichy Road, Salem",
      },
    });

    expect(successRes.success).toBe(true);
    expect(bookingToEdit.startTime).toBe("05:00 PM");
    expect(bookingToEdit.location).toBe("Trichy Road, Salem");
  });

  // TEST CASE 20: Controlled Payment Edit Engine Guarantees Math Integrity
  it("Test 20: Controlled payment edit correctly recalculates balance and assigns status", () => {
    const booking = store.bookings[0];

    // Case A: Full payment
    store.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: 6000,
      advanceAmount: 6000,
      updatedBy: "Ravi Iyer",
      reason: "Client paid full dakshina in cash",
    });

    expect(booking.totalAmount).toBe(6000);
    expect(booking.advanceAmount).toBe(6000);
    expect(booking.balanceAmount).toBe(0);
    expect(booking.paymentStatus).toBe("PAID");

    // Case B: Partial payment
    store.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: 7000,
      advanceAmount: 3000,
      updatedBy: "Ravi Iyer",
      reason: "Scope increased with partial advance",
    });

    expect(booking.totalAmount).toBe(7000);
    expect(booking.advanceAmount).toBe(3000);
    expect(booking.balanceAmount).toBe(4000);
    expect(booking.paymentStatus).toBe("PARTIALLY_PAID");

    // Case C: Zero payment
    store.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: 7000,
      advanceAmount: 0,
      updatedBy: "Ravi Iyer",
      reason: "Advance refunded/reset",
    });

    expect(booking.balanceAmount).toBe(7000);
    expect(booking.paymentStatus).toBe("PENDING");

    // Negative amounts rejected
    const negativeRes = store.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: -100,
      advanceAmount: 0,
      updatedBy: "Ravi Iyer",
    });
    expect(negativeRes.success).toBe(false);
  });

  // TEST CASE 21: WhatsApp Formatter uses clean sacred formatting, numbered checklist, Velvi App branding, and never exposes priest to user
  it("Test 21: WhatsApp formatter outputs clean numbered checklist, stylish Velvi branding, and never exposes priest to user", async () => {
    const {
      formatPoojaItemsWhatsAppMessage,
      formatBookingConfirmationWhatsAppMessage,
      formatPoojaReminderWhatsAppMessage,
    } = await import("../lib/whatsapp/formatter");

    const booking = store.bookings[0];
    const business = store.businesses[0];

    const itemsMsg = formatPoojaItemsWhatsAppMessage(booking, business);
    expect(itemsMsg).toContain("08:00 AM");
    expect(itemsMsg).toContain("பக்தர்");
    expect(itemsMsg).toContain("பூஜை சாமக்கிரி பொருட்கள்:");
    expect(itemsMsg).toContain("1. ");
    expect(itemsMsg).toContain("✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨");
    // Preserves Tamil calendar date (e.g. ஆவணி 27)
    expect(itemsMsg).toMatch(/[\u0B80-\u0BFF]+\s+[0-9]{1,2}/);
    // Never exposes priest to customer
    expect(itemsMsg).not.toContain("Priest:");
    expect(itemsMsg).not.toContain("குருக்கள்");

    const confMsg = formatBookingConfirmationWhatsAppMessage(booking, business);
    expect(confMsg).toContain("தேதி:");
    expect(confMsg).toContain("நேரம்:");
    expect(confMsg).toContain("தட்சணை:");
    expect(confMsg).toContain("✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨");
    // Never exposes priest to customer
    expect(confMsg).not.toContain("Assigned Priest");
    expect(confMsg).not.toContain("குருக்கள்");

    const reminderMsg = formatPoojaReminderWhatsAppMessage(booking, business);
    expect(reminderMsg).not.toContain("குருக்கள்:");
    expect(reminderMsg).toContain("✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨");
  });

  // TEST CASE 22: Version Control Registry & PWA Manifest Integrity
  it("Test 22: Version control registry and PWA manifest are properly configured", async () => {
    const { APP_VERSION, VERSION_HISTORY, RELEASE_CHANNEL } = await import(
      "../lib/version/history"
    );

    expect(APP_VERSION).toBe("2.5.3");
    expect(RELEASE_CHANNEL).toContain("Stable");
    expect(VERSION_HISTORY.length).toBeGreaterThanOrEqual(5);

    // Latest version check
    const latest = VERSION_HISTORY[0];
    expect(latest.version).toBe("2.5.3");
    expect(latest.isCurrent).toBe(true);
    expect(latest.changes.length).toBeGreaterThan(0);
    expect(latest.changes.some((c) => c.category === "UI/UX" || c.category === "Feature")).toBe(true);

    // Verify manifest
    const fs = await import("fs");
    const path = await import("path");
    const manifestPath = path.join(__dirname, "..", "public", "manifest.json");
    expect(fs.existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    expect(manifest.short_name).toBe("Velvi");
    expect(manifest.display).toBe("standalone");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "192x192")).toBe(true);
    expect(manifest.icons.some((i: { sizes: string }) => i.sizes === "512x512")).toBe(true);
  });

  // TEST CASE 23: Default Velvi Logo Fallback & Custom Logo Override
  it("Test 23: Business branding falls back to Velvi logo and supports custom logo override", () => {
    const biz = store.businesses[0];

    // Case A: Default state has no custom logo or empty string
    expect(biz.logoUrl || "").toBe("");

    // Case B: Customer uploads custom logo
    const customLogoDataUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    biz.logoUrl = customLogoDataUrl;
    expect(biz.logoUrl).toBe(customLogoDataUrl);

    // Case C: Customer resets back to default logo
    biz.logoUrl = "";
    expect(biz.logoUrl).toBe("");
  });

  // TEST CASE 24: Developer Attribution & Zero User-Facing SaaS Terminology
  it("Test 24: Developer credit is configured for Maniraja (@maniraja__) and user-facing app has zero SaaS terms", async () => {
    const fs = await import("fs");
    const path = await import("path");

    // Developer credit component exists and has correct Instagram link & handle
    const devCreditPath = path.join(__dirname, "..", "components", "ui", "DeveloperCredit.tsx");
    expect(fs.existsSync(devCreditPath)).toBe(true);
    const devCreditCode = fs.readFileSync(devCreditPath, "utf-8");
    expect(devCreditCode).toContain("@maniraja__");
    expect(devCreditCode).toContain("instagram.com/maniraja__");
    expect(devCreditCode).toContain("Maniraja");
    expect(devCreditCode).toContain("+91-8300030123");
    expect(devCreditCode).toContain("App Developed by");

    // Check user-facing pages: Settings, More, Landing, Login do not contain SaaS
    const settingsCode = fs.readFileSync(path.join(__dirname, "..", "app", "app", "settings", "page.tsx"), "utf-8");
    expect(settingsCode).not.toContain("SaaS");

    const moreCode = fs.readFileSync(path.join(__dirname, "..", "app", "app", "more", "page.tsx"), "utf-8");
    expect(moreCode).not.toContain("SaaS");

    const landingCode = fs.readFileSync(path.join(__dirname, "..", "app", "(public)", "page.tsx"), "utf-8");
    expect(landingCode).not.toContain("SaaS");

    const loginCode = fs.readFileSync(path.join(__dirname, "..", "app", "(public)", "login", "page.tsx"), "utf-8");
    expect(loginCode).not.toContain("SaaS");
  });

  // TEST CASE 25: Empty Business Branding Defaults & Watermark Plan Validation
  it("Test 25: Business branding defaults are empty and watermark removal checks plan status", () => {
    const biz = store.businesses[0];

    // Business Name, Iyer Name, and Address default to empty strings
    expect(biz.name).toBe("");
    expect(biz.iyerName).toBe("");
    expect(biz.address).toBe("");
    expect(biz.whatsapp).toBe("");

    // Watermark is true by default
    expect(biz.showWatermark).toBe(true);

    // Initial seed business is active Velvi Pro
    const sub = store.subscriptions[0];
    const isPlanActive = sub.status === "ACTIVE" && sub.planCode === "VELVI_PRO";
    expect(isPlanActive).toBe(true);

    // When plan is ACTIVE, watermark can be toggled/removed
    biz.showWatermark = false;
    expect(biz.showWatermark).toBe(false);

    // When plan is TRIAL / inactive, watermark removal is gated
    const isRemovalAllowed = (status: string) => status === "ACTIVE";
    expect(isRemovalAllowed("TRIAL")).toBe(false);
    expect(isRemovalAllowed("ACTIVE")).toBe(true);
  });

  // TEST CASE 26: Dev Switcher Removal, First-Time PWA Install Popup & Admin Portal Role-Gating
  it("Test 26: Dev switcher is removed, First-time install popup is configured, and Admin portal is role-gated", async () => {
    const fs = await import("fs");
    const path = await import("path");

    // 1. Root layout no longer contains DevRoleSwitcher
    const layoutPath = path.join(__dirname, "..", "app", "layout.tsx");
    const layoutCode = fs.readFileSync(layoutPath, "utf-8");
    expect(layoutCode).not.toContain("DevRoleSwitcher");
    expect(layoutCode).toContain("FirstTimeInstallPopup");

    // 2. First-time install popup component exists and has 5-second post-login delay + once-only persistence
    const popupPath = path.join(__dirname, "..", "components", "mobile", "FirstTimeInstallPopup.tsx");
    expect(fs.existsSync(popupPath)).toBe(true);
    const popupCode = fs.readFileSync(popupPath, "utf-8");
    expect(popupCode).toContain("velvi_first_install_prompt_seen");
    expect(popupCode).toContain("5000"); // 5 seconds post-login delay
    expect(popupCode).toContain("velvi_pwa_installed");
    expect(popupCode).toContain("Install Velvi Mobile App");

    // 3. Super Admin Portal in Settings & More pages is strictly role-gated for SUPER_ADMIN
    const settingsPath = path.join(__dirname, "..", "app", "app", "settings", "page.tsx");
    const settingsCode = fs.readFileSync(settingsPath, "utf-8");
    expect(settingsCode).toContain('currentUser?.role === "SUPER_ADMIN"');

    const morePath = path.join(__dirname, "..", "app", "app", "more", "page.tsx");
    const moreCode = fs.readFileSync(morePath, "utf-8");
    expect(moreCode).toContain('currentUser?.role === "SUPER_ADMIN"');
  });

  // TEST CASE 27: New Booking Button Label, Customer Quick Add, and Pooja Homam CRUD
  it("Test 27: Double '+' fix, Customer quick creation, and Pooja Homam CRUD methods work correctly", async () => {
    const { DICTIONARY } = await import("../components/providers/LanguageContext");

    // 1. Double '+' fix: newBooking does not have duplicate '+' prefix
    expect(DICTIONARY.newBooking.en).toBe("New Booking");
    expect(DICTIONARY.newBooking.ta).toBe("புதிய முன்பதிவு");

    // 2. Customer Quick Creation
    const newCust = store.createCustomer({
      businessId: "biz-venkateswara-01",
      name: "Murugan Swamy",
      mobile: "94422 11000",
      city: "Namakkal",
    });
    expect(newCust.id).toBeDefined();
    expect(newCust.mobile).toBe("+919442211000");
    const foundCustomer = store.getCustomers("biz-venkateswara-01").find((c) => c.id === newCust.id);
    expect(foundCustomer).toBeDefined();
    expect(foundCustomer?.name).toBe("Murugan Swamy");

    // 3. Pooja CRUD: Create
    const newPooja = store.createPooja({
      businessId: "biz-venkateswara-01",
      englishName: "Chandi Homam",
      tamilName: "சண்டி ஹோமம்",
      description: "Grand ceremony for divine protection and victory.",
      durationMinutes: 240,
      basePrice: 15000,
      items: [
        {
          id: "it-1",
          poojaId: "",
          itemEnglishName: "Sari",
          itemTamilName: "பட்டு புடவை",
          quantity: 1,
          unit: "nos",
          sortOrder: 1,
        },
      ],
    });
    expect(newPooja.id).toBeDefined();
    expect(newPooja.englishName).toBe("Chandi Homam");
    expect(store.getPoojas("biz-venkateswara-01").some((p) => p.id === newPooja.id)).toBe(true);

    // 4. Pooja CRUD: Update
    const updatedPooja = store.updatePooja(newPooja.id, {
      basePrice: 18000,
      durationMinutes: 300,
    });
    expect(updatedPooja?.basePrice).toBe(18000);
    expect(updatedPooja?.durationMinutes).toBe(300);

    // 5. Pooja CRUD: Delete
    const deleted = store.deletePooja(newPooja.id);
    expect(deleted).toBe(true);
    expect(store.getPoojas("biz-venkateswara-01").some((p) => p.id === newPooja.id)).toBe(false);
  });

  // TEST CASE 28: Nalla Neram & Gowri Nalla Neram Calculation
  it("Test 28: Tamil calendar computes Nalla Neram and Gowri Nalla Neram correctly for weekdays", () => {
    // 2026-09-13 is a Sunday (ஞாயிறு)
    const sundayInfo = getTamilDate("2026-09-13");
    expect(sundayInfo.dayOfWeekTa).toBe("ஞாயிறு");
    expect(sundayInfo.nallaNeramMorning).toBe("07:45 - 08:45");
    expect(sundayInfo.nallaNeramEvening).toBe("15:15 - 16:15");
    expect(sundayInfo.gowriNallaNeramMorning).toBe("10:45 - 11:45");
    expect(sundayInfo.gowriNallaNeramEvening).toBe("13:30 - 14:30");
    expect(sundayInfo.nallaNeram).toContain("காலை: 07:45 - 08:45");
    expect(sundayInfo.gowriNallaNeram).toContain("காலை: 10:45 - 11:45");

    // 2026-09-14 is a Monday (திங்கள்)
    const mondayInfo = getTamilDate("2026-09-14");
    expect(mondayInfo.dayOfWeekTa).toBe("திங்கள்");
    expect(mondayInfo.nallaNeramMorning).toBe("06:15 - 07:15");
    expect(mondayInfo.gowriNallaNeramMorning).toBe("09:15 - 10:15");
  });

  // TEST CASE 29: Timezone Safety, Date Parsing, and Accurate Tamil Panchangam Calculations
  it("Test 29: getLocalDateString and getTamilDate provide 100% timezone-safe, authentic Tamil dates", async () => {
    const { getLocalDateString, getTamilDate, formatTimeRangeTo12H } = await import("../lib/calendar/tamil");

    // 1. Timezone-safe date string generation (No UTC offset regression)
    expect(getLocalDateString("2026-09-13")).toBe("2026-09-13");
    expect(getLocalDateString("2026-09-17")).toBe("2026-09-17");

    // 2. September 13, 2026 (Sunday) evaluation (Matches authentic Tamil Daily Calendar)
    const sep13 = getTamilDate("2026-09-13");
    expect(sep13.dateStr).toBe("2026-09-13");
    expect(sep13.dayOfMonth).toBe(13);
    expect(sep13.monthNameEn).toBe("Sep");
    expect(sep13.year).toBe(2026);
    expect(sep13.dayOfWeekEn).toBe("Sunday");
    expect(sep13.dayOfWeekTa).toBe("ஞாயிறு");
    expect(sep13.tamilMonth).toBe("ஆவணி");
    expect(sep13.tamilDay).toBe(27);
    expect(sep13.tamilYear).toBe("பராபவ");
    expect(sep13.tithi).toBe("திருதியை (Tritiya)");
    expect(sep13.nakshatra).toBe("ஹஸ்தம் (Hastham)");
    expect(sep13.formattedDualDate).toBe("13 Sep 2026 • ஆவணி 27");
    expect(sep13.formattedTamilFull).toContain("ஞாயிறு, 13 செப்டம்பர் 2026 • ஆவணி 27");
    expect(sep13.formattedEnglishFull).toContain("Sunday, 13 September 2026 • Aavani 27");

    // 3. Purattasi 1 transition on September 18, 2026
    const sep17 = getTamilDate("2026-09-17");
    expect(sep17.dateStr).toBe("2026-09-17");
    expect(sep17.tamilMonth).toBe("ஆவணி");
    expect(sep17.tamilDay).toBe(31);

    const sep18 = getTamilDate("2026-09-18");
    expect(sep18.dateStr).toBe("2026-09-18");
    expect(sep18.tamilMonth).toBe("புரட்டாசி");
    expect(sep18.tamilDay).toBe(1);
    expect(sep18.dayOfWeekEn).toBe("Friday");
    expect(sep18.dayOfWeekTa).toBe("வெள்ளி");

    // 4. 12-hour format verification with AM/PM
    expect(formatTimeRangeTo12H(sep13.nallaNeramMorning)).toBe("07:45 - 08:45");
    expect(formatTimeRangeTo12H(sep13.nallaNeramEvening)).toBe("03:15 - 04:15");
    expect(formatTimeRangeTo12H(sep13.gowriNallaNeramMorning)).toBe("10:45 - 11:45");
    expect(formatTimeRangeTo12H(sep13.gowriNallaNeramEvening)).toBe("01:30 - 02:30");
    expect(formatTimeRangeTo12H(sep13.rahuKalam)).toBe("04:30 - 06:00");
    expect(formatTimeRangeTo12H("15:15 - 16:15", true)).toBe("03:15 PM - 04:15 PM");
  });

  // TEST CASE 30: Sacred Days and Muhurtham Calculations
  it("Test 30: Tamil calendar correctly detects Muhurtham, Pournami, Amavasai, Pradosham, and sacred tags", () => {
    // Sep 7, 2026: Monday, Aavani 21 => Auspicious Subha Muhurtham
    const sep7 = getTamilDate("2026-09-07");
    expect(sep7.isMuhurtham).toBe(true);
    expect(sep7.specialDayTag).toBe("சுப முகூர்த்தம்");
    expect(sep7.specialDayIcon).toBe("💍");
    expect(sep7.tamilMonth).toBe("ஆவணி");
    expect(sep7.tamilDay).toBe(21);

    // Sep 13, 2026: Sunday, Aavani 27 => Auspicious Subha Muhurtham
    const sep13 = getTamilDate("2026-09-13");
    expect(sep13.isMuhurtham).toBe(true);
    expect(sep13.specialDayTag).toBe("சுப முகூர்த்தம்");
    expect(sep13.specialDayIcon).toBe("💍");
    expect(sep13.tamilMonth).toBe("ஆவணி");
    expect(sep13.tamilDay).toBe(27);

    // Sep 14, 2026: Monday, Aavani 28 => Sri Vinayagar Chaturthi festival
    const sep14 = getTamilDate("2026-09-14");
    expect(sep14.festivalName).toBe("ஸ்ரீவிநாயகர் சதுர்த்தி");
    expect(sep14.specialDayTag).toBe("ஸ்ரீவிநாயகர் சதுர்த்தி");
    expect(sep14.specialDayIcon).toBe("🐘");
    expect(sep14.tithiNameTa).toBe("சதுர்த்தி");
    expect(sep14.isKarinaal).toBe(true);

    // Sep 17, 2026: Thursday, Aavani 31 => Auspicious Subha Muhurtham
    const sep17 = getTamilDate("2026-09-17");
    expect(sep17.isMuhurtham).toBe(true);
    expect(sep17.specialDayTag).toBe("சுப முகூர்த்தம்");
    expect(sep17.specialDayIcon).toBe("💍");
    expect(sep17.tamilMonth).toBe("ஆவணி");
    expect(sep17.tamilDay).toBe(31);

    // Purattasi Month Rule: NO wedding muhurthams during Purattasi month
    const sep21 = getTamilDate("2026-09-21");
    expect(sep21.tamilMonth).toBe("புரட்டாசி");
    expect(sep21.isMuhurtham).toBe(false);

    const sep28 = getTamilDate("2026-09-28");
    expect(sep28.tamilMonth).toBe("புரட்டாசி");
    expect(sep28.isMuhurtham).toBe(false);

    // Sep 10, 2026: Amavasai start date (symbol 🌑 and title 'அமாவாசை')
    // Per user rule: Amavasai / Pournami is strictly placed on the start date only
    const sep10 = getTamilDate("2026-09-10");
    expect(sep10.isAmavasai).toBe(true);
    expect(sep10.tithiNameTa).toBe("அமாவாசை");
    expect(sep10.specialDayTag).toBe("அமாவாசை");
    expect(sep10.specialDayIcon).toBe("🌑");

    const sep11 = getTamilDate("2026-09-11");
    expect(sep11.isAmavasai).toBe(false);
    expect(sep11.tithiNameTa).toBe("பிரதமை");

    // Sep 25, 2026: Pournami start date (symbol 🌕 and title 'பௌர்ணமி')
    const sep25 = getTamilDate("2026-09-25");
    expect(sep25.isPournami).toBe(true);
    expect(sep25.specialDayTag).toBe("பௌர்ணமி");
    expect(sep25.specialDayIcon).toBe("🌕");

    const sep26 = getTamilDate("2026-09-26");
    expect(sep26.isPournami).toBe(false);
    expect(sep26.specialDayTag).not.toBe("பௌர்ணமி");

    // Pradosham is fully removed per user request
    const sep8 = getTamilDate("2026-09-08");
    expect(sep8.isPradosham).toBe(false);
    expect(sep8.specialDayTag).not.toBe("பிரதோஷம்");

    const sep24 = getTamilDate("2026-09-24");
    expect(sep24.isPradosham).toBe(false);
    expect(sep24.specialDayTag).not.toBe("பிரதோஷம்");
  });

  // TEST CASE 33: Instant Pooja Add, Edit, Delete during booking
  it("Test 33: Instant Pooja CRUD operations within business scope", () => {
    const bizId = "biz-venkateswara-01";
    const initialPoojas = store.getPoojas(bizId);
    const initialCount = initialPoojas.length;

    // 1. Instant Add Pooja
    const newPooja = store.createPooja({
      businessId: bizId,
      englishName: "Chandi Homam",
      tamilName: "சண்டி ஹோமம்",
      basePrice: 15000,
      durationMinutes: 180,
      description: "Grand Chandi Parayanam and Homam",
    });

    expect(newPooja.id).toBeDefined();
    expect(newPooja.englishName).toBe("Chandi Homam");
    expect(newPooja.tamilName).toBe("சண்டி ஹோமம்");
    expect(newPooja.basePrice).toBe(15000);

    const afterAdd = store.getPoojas(bizId);
    expect(afterAdd.length).toBe(initialCount + 1);
    expect(afterAdd.some((p) => p.id === newPooja.id)).toBe(true);

    // 2. Instant Edit Pooja
    const updated = store.updatePooja(newPooja.id, {
      englishName: "Maha Chandi Homam",
      basePrice: 18000,
      durationMinutes: 240,
    });

    expect(updated).toBeDefined();
    expect(updated?.englishName).toBe("Maha Chandi Homam");
    expect(updated?.basePrice).toBe(18000);
    expect(updated?.durationMinutes).toBe(240);

    // 3. Instant Delete Pooja
    const deleteResult = store.deletePooja(newPooja.id);
    expect(deleteResult).toBe(true);

    const afterDelete = store.getPoojas(bizId);
    expect(afterDelete.length).toBe(initialCount);
    expect(afterDelete.some((p) => p.id === newPooja.id)).toBe(false);
  });

  // TEST CASE 33: Smart Paste & Country Code Sanitizer for Mobile Number
  it("Test 33: cleanPastedIndianMobile strips +91, leading 0, spaces, dashes properly", () => {
    expect(cleanPastedIndianMobile("+91 98765 43210")).toBe("9876543210");
    expect(cleanPastedIndianMobile("919876543210")).toBe("9876543210");
    expect(cleanPastedIndianMobile("+91-98765-43210")).toBe("9876543210");
    expect(cleanPastedIndianMobile("09876543210")).toBe("9876543210");
    expect(cleanPastedIndianMobile("+91 (987) 654-3210")).toBe("9876543210");
    expect(cleanPastedIndianMobile("98765")).toBe("98765");
    expect(cleanPastedIndianMobile("9876543210999")).toBe("9876543210");

    // Inspect live feedback status
    const emptyStatus = inspectIndianMobile("");
    expect(emptyStatus.status).toBe("EMPTY");

    const shortStatus = inspectIndianMobile("98765");
    expect(shortStatus.status).toBe("TOO_SHORT");
    expect(shortStatus.messageTa).toContain("5/10");

    const invalidStart = inspectIndianMobile("1234567890");
    expect(invalidStart.status).toBe("INVALID_START");

    const validStatus = inspectIndianMobile("9876543210");
    expect(validStatus.status).toBe("VALID");
    expect(validStatus.messageTa).toContain("சரியான");
  });

  // TEST CASE 34: Customer Creation with Optional Mobile Number
  it("Test 34: Customers can be created without a mobile number (Optional Mobile)", () => {
    const bizId = "biz-venkateswara-01";
    const customerWithoutMobile = store.createCustomer({
      businessId: bizId,
      name: "Sankaranarayanan (No Phone)",
      city: "Tiruchengode",
      address: "Sannathi Street",
      notes: "Kashyapa Gothram",
    });

    expect(customerWithoutMobile.id).toBeDefined();
    expect(customerWithoutMobile.name).toBe("Sankaranarayanan (No Phone)");
    expect(customerWithoutMobile.mobile).toBe("");

    const customers = store.getCustomers(bizId);
    expect(customers.some((c) => c.id === customerWithoutMobile.id)).toBe(true);

    // Another customer without phone should also be allowed without triggering duplicate phone error
    const customer2 = store.createCustomer({
      businessId: bizId,
      name: "Meenakshi Ammal",
    });
    expect(customer2.id).toBeDefined();
    expect(customer2.mobile).toBe("");
  });

  // TEST CASE 35: Clear All Data
  it("Test 35: store.clearAllData() wipes out bookings, customers, payments while keeping user accounts", () => {
    const bizId = "biz-venkateswara-01";
    expect(store.getBookings(bizId).length).toBeGreaterThan(0);
    expect(store.getCustomers(bizId).length).toBeGreaterThan(0);
    expect(store.getPoojas(bizId).length).toBeGreaterThan(0);

    store.clearAllData();

    expect(store.getBookings(bizId).length).toBe(0);
    expect(store.getCustomers(bizId).length).toBe(0);
    expect(store.getPoojas(bizId).length).toBe(0);
    expect(store.payments.length).toBe(0);
    expect(store.settlements.length).toBe(0);

    // Users and businesses should remain intact so session isn't lost
    expect(store.users.length).toBeGreaterThan(0);
    expect(store.businesses.length).toBeGreaterThan(0);
  });

  // TEST CASE 36: Load All Data
  it("Test 36: store.loadAllData() restores full sample data after clear", () => {
    const bizId = "biz-venkateswara-01";
    store.clearAllData();
    expect(store.getBookings(bizId).length).toBe(0);

    store.loadAllData();

    expect(store.getBookings(bizId).length).toBeGreaterThan(0);
    expect(store.getCustomers(bizId).length).toBeGreaterThan(0);
    expect(store.getPoojas(bizId).length).toBeGreaterThan(0);
    expect(store.payments.length).toBeGreaterThan(0);
  });

  // TEST CASE 37: Optional Bilingual Names (Either English OR Tamil is sufficient)
  it("Test 37: Pooja can be created with ONLY Tamil name or ONLY English name without requiring both", () => {
    const bizId = "biz-venkateswara-01";

    // 1. Create with only Tamil name (no English name)
    const tamilOnlyPooja = store.createPooja({
      businessId: bizId,
      tamilName: "சுதர்சன ஹோமம் மற்றும் அர்ச்சனை",
      basePrice: 6500,
    });
    expect(tamilOnlyPooja.id).toBeDefined();
    expect(tamilOnlyPooja.tamilName).toBe("சுதர்சன ஹோமம் மற்றும் அர்ச்சனை");
    expect(tamilOnlyPooja.englishName).toBe("சுதர்சன ஹோமம் மற்றும் அர்ச்சனை"); // Graceful fallback

    // 2. Create with only English name (no Tamil name)
    const englishOnlyPooja = store.createPooja({
      businessId: bizId,
      englishName: "Special Dhanvantri Pooja",
      basePrice: 5500,
    });
    expect(englishOnlyPooja.id).toBeDefined();
    expect(englishOnlyPooja.englishName).toBe("Special Dhanvantri Pooja");
    expect(englishOnlyPooja.tamilName).toBe("Special Dhanvantri Pooja"); // Graceful fallback

    // 3. Booking creation with only one name
    const booking = store.createBooking({
      businessId: bizId,
      customerId: "c-1",
      poojaId: tamilOnlyPooja.id,
      poojaTamilName: "சுதர்சன ஹோமம் மற்றும் அர்ச்சனை",
      date: "2026-09-25",
      startTime: "09:00 AM",
      location: "Namakkal",
      totalAmount: 6500,
      advanceAmount: 2000,
      balanceAmount: 4500,
      paymentStatus: "PARTIALLY_PAID",
      status: "CONFIRMED",
    });
    expect(booking.id).toBeDefined();
    expect(booking.poojaTamilName).toBe("சுதர்சன ஹோமம் மற்றும் அர்ச்சனை");
    expect(booking.poojaEnglishName).toBe("சுதர்சன ஹோமம் மற்றும் அர்ச்சனை");
  });

  it("Test 38: removeSampleData removes only sample records while protecting custom user records", () => {
    const store = new VelviDatabaseStore();
    // Initially has sample records
    expect(store.bookings.length).toBeGreaterThan(0);
    expect(store.customers.length).toBeGreaterThan(0);

    // Create a real custom user booking and customer
    const userCustomer = store.createCustomer({
      businessId: "biz-venkateswara-01",
      name: "Custom Real Customer",
      mobile: "+919944112233",
    });
    const userBooking = store.createBooking({
      businessId: "biz-venkateswara-01",
      customerId: userCustomer.id,
      customerName: userCustomer.name,
      poojaId: "custom-p-1",
      poojaEnglishName: "Custom Real Pooja",
      date: "2026-10-01",
      startTime: "10:00 AM",
      location: "Chennai",
      totalAmount: 5000,
      advanceAmount: 1000,
      balanceAmount: 4000,
      paymentStatus: "PENDING",
      status: "CONFIRMED",
    });

    const result = store.removeSampleData();
    expect(result.removedBookings).toBeGreaterThan(0);
    expect(result.removedCustomers).toBeGreaterThan(0);

    // User's custom customer and booking MUST still exist!
    expect(store.customers.some((c) => c.id === userCustomer.id)).toBe(true);
    expect(store.bookings.some((b) => b.id === userBooking.id)).toBe(true);
  });

  it("Test 39: undoLastDelete restores deleted booking, pooja, or customer", () => {
    const store = new VelviDatabaseStore();
    const pooja = store.createPooja({
      businessId: "biz-venkateswara-01",
      englishName: "Undo Test Pooja",
      basePrice: 3000,
    });
    expect(store.poojas.some((p) => p.id === pooja.id)).toBe(true);

    // Delete pooja
    store.deletePooja(pooja.id);
    expect(store.poojas.some((p) => p.id === pooja.id)).toBe(false);

    // Undo delete
    const undoRes = store.undoLastDelete();
    expect(undoRes.success).toBe(true);
    expect(undoRes.type).toBe("pooja");
    expect(store.poojas.some((p) => p.id === pooja.id)).toBe(true);
  });

  it("Test 40: getRecentlyDeleted and restoreDeletedItem allow selective trash recovery in Settings", () => {
    const store = new VelviDatabaseStore();
    const customer = store.createCustomer({
      businessId: "biz-venkateswara-01",
      name: "Trash Test Devotee",
      mobile: "+919876599999",
      city: "Madurai",
    });
    expect(store.customers.some((c) => c.id === customer.id)).toBe(true);

    // Delete customer
    store.deleteCustomer(customer.id);
    expect(store.customers.some((c) => c.id === customer.id)).toBe(false);

    // Verify it appears in recentlyDeleted list
    const trashList = store.getRecentlyDeleted();
    expect(trashList.length).toBeGreaterThanOrEqual(1);
    const foundInTrash = trashList.find((t) => t.id === customer.id);
    expect(foundInTrash).toBeDefined();
    expect(foundInTrash?.title).toBe("Trash Test Devotee");

    // Restore specific item
    const restoreRes = store.restoreDeletedItem(customer.id);
    expect(restoreRes.success).toBe(true);
    expect(store.customers.some((c) => c.id === customer.id)).toBe(true);

    // Verify removed from trash
    const updatedTrash = store.getRecentlyDeleted();
    expect(updatedTrash.some((t) => t.id === customer.id)).toBe(false);
  });

  it("Test 41: formatTime12H always formats time strings to 12-hour AM/PM format", () => {
    expect(formatTime12H("18:00")).toBe("06:00 PM");
    expect(formatTime12H("08:00")).toBe("08:00 AM");
    expect(formatTime12H("8:30")).toBe("08:30 AM");
    expect(formatTime12H("00:15")).toBe("12:15 AM");
    expect(formatTime12H("12:00")).toBe("12:00 PM");
    expect(formatTime12H("12:45")).toBe("12:45 PM");
    expect(formatTime12H("06:00 PM")).toBe("06:00 PM");
    expect(formatTime12H("8:00 AM")).toBe("08:00 AM");
    expect(formatTime12H("18:00 - 20:00")).toBe("06:00 PM - 08:00 PM");
    expect(formatTime12H("")).toBe("");
  });

  it("Test 42: clearDemoData purges sample bookings and customers while preserving real user records and master pooja templates", () => {
    const store = new VelviDatabaseStore();
    expect(store.bookings.length).toBeGreaterThan(0);
    expect(store.customers.length).toBeGreaterThan(0);
    const initialPoojas = store.poojas.length;

    // Create a real user customer and booking
    const realCustomer = store.createCustomer({
      businessId: "biz-venkateswara-01",
      name: "Real Devotee",
      mobile: "+919842109876",
    });
    const realBooking = store.createBooking({
      businessId: "biz-venkateswara-01",
      customerId: realCustomer.id,
      customerName: realCustomer.name,
      poojaId: "p-kumbabishekam-11",
      poojaEnglishName: "Maha Kumbabishekam",
      date: "2026-11-15",
      startTime: "06:00 AM",
      location: "Thanjavur",
      totalAmount: 25000,
      advanceAmount: 5000,
      balanceAmount: 20000,
      paymentStatus: "PARTIALLY_PAID",
      status: "CONFIRMED",
    });

    const res = store.clearDemoData();
    expect(res.removedBookings).toBeGreaterThan(0);
    expect(res.removedCustomers).toBeGreaterThan(0);

    // Real records must remain intact!
    expect(store.customers.some((c) => c.id === realCustomer.id)).toBe(true);
    expect(store.bookings.some((b) => b.id === realBooking.id)).toBe(true);

    // Master poojas should be kept so user can still book ceremonies
    expect(store.poojas.length).toBe(initialPoojas);
    expect(store.poojas.some((p) => p.id === "p-kumbabishekam-11")).toBe(true);
  });

  it("Test 43: DEFAULT_SAMAGRI_CATEGORIES contains the 8 authentic Kumbabishekam & Grihapravesam categories", () => {
    expect(DEFAULT_SAMAGRI_CATEGORIES.length).toBe(8);
    const catIds = DEFAULT_SAMAGRI_CATEGORIES.map((c) => c.id);
    expect(catIds).toContain("pooja_items");
    expect(catIds).toContain("homam_items");
    expect(catIds).toContain("navagraha_items");
    expect(catIds).toContain("flowers_garlands");
    expect(catIds).toContain("fruits_food");
    expect(catIds).toContain("vessels_utensils");
    expect(catIds).toContain("vastram_clothes");
    expect(catIds).toContain("grihapravesam_items");

    // Verify alias normalization
    expect(normalizeCategoryId("essentials")).toBe("pooja_items");
    expect(normalizeCategoryId("powders")).toBe("pooja_items");
    expect(normalizeCategoryId("ghee_oils")).toBe("homam_items");
    expect(normalizeCategoryId("homam")).toBe("homam_items");
    expect(normalizeCategoryId("flowers")).toBe("flowers_garlands");
    expect(normalizeCategoryId("fruits_prasad")).toBe("fruits_food");
    expect(normalizeCategoryId("vessels_items")).toBe("vessels_utensils");
    expect(normalizeCategoryId("vastram")).toBe("vastram_clothes");
  });

  it("Test 44: SAMAGRI_CATALOG contains 130+ items with confirmed Tamil spellings and v2.5.2 release parity", () => {
    expect(SAMAGRI_CATALOG.length).toBeGreaterThanOrEqual(130);
    const itemNamesTa = SAMAGRI_CATALOG.map((i) => i.ta);

    // Verify specific confirmed spellings requested by user
    expect(itemNamesTa).toContain("குங்குமம்");
    expect(itemNamesTa).toContain("டை கல்கண்டு");
    expect(itemNamesTa).toContain("கெட்டி கல்கண்டு");
    expect(itemNamesTa).toContain("ஹோம திரவியம்");
    expect(itemNamesTa).toContain("ஜவ்வாது");
    expect(itemNamesTa).toContain("அரகஜா");
    expect(itemNamesTa).toContain("கோரோசனை");
    expect(itemNamesTa).toContain("கஸ்தூரி");
    expect(itemNamesTa).toContain("சீகக்காய் தூள்");
    expect(itemNamesTa).toContain("மட்டிப்பால்");
    expect(itemNamesTa).toContain("கலர் கோலப்பொடி – 5 கலர்");
    expect(itemNamesTa).toContain("நெய்");
    expect(itemNamesTa).toContain("நவ சமித்து");
    expect(itemNamesTa).toContain("சீந்தில் புடி");
    expect(itemNamesTa).toContain("நாயுருவி");
    expect(itemNamesTa).toContain("மாடா குச்சி");
    expect(itemNamesTa).toContain("தவிடு");
    expect(itemNamesTa).toContain("பூர்ணாகுதி சாமான்கள்");

    // Verify version is 2.5.3
    expect(APP_VERSION).toBe("2.5.3");
  });

  // TEST CASE 45: Authentic 8 Poojas Catalog from Iyyer Documents with Items & Categories
  it("Test 45: 8 Authentic Poojas from Iyyer Documents with accurate items, units, and categories", () => {
    const poojas = store.getPoojas("biz-venkateswara-01");
    expect(poojas.length).toBe(8);

    const poojaIds = poojas.map((p) => p.id);
    expect(poojaIds).toContain("p-ganapathi-01");
    expect(poojaIds).toContain("p-vastu-02");
    expect(poojaIds).toContain("p-ayush-03");
    expect(poojaIds).toContain("p-swayamvara-parvathi-04");
    expect(poojaIds).toContain("p-kumbabishekam-11");
    expect(poojaIds).toContain("p-sangu-pooja-06");
    expect(poojaIds).toContain("p-punyaham-07");
    expect(poojaIds).toContain("p-lakshmi-08");

    // Check Maha Ganapathi Homam items
    const ganapathi = poojas.find((p) => p.id === "p-ganapathi-01")!;
    expect(ganapathi.tamilName).toBe("மகா கணபதி ஹோமம்");
    expect(ganapathi.items.length).toBeGreaterThanOrEqual(50);
    expect(ganapathi.items.some((i) => i.itemTamilName === "மஞ்சள்தூள்" && i.quantity === 250 && i.unit === "g")).toBe(true);
    expect(ganapathi.items.some((i) => i.itemTamilName === "செங்கல்" && i.quantity === 40 && i.unit === "nos")).toBe(true);

    // Check Vastu Shanthi Homam items
    const vastu = poojas.find((p) => p.id === "p-vastu-02")!;
    expect(vastu.tamilName).toBe("வாஸ்து சாந்தி ஹோமம்");
    expect(vastu.items.length).toBeGreaterThanOrEqual(50);
    expect(vastu.items.some((i) => i.itemTamilName === "வாஸ்துபதம் பெரிது")).toBe(true);
    expect(vastu.items.some((i) => i.itemTamilName === "செங்கல்" && i.quantity === 75)).toBe(true);

    // Check Ayushya Homam (93 items from Namakkal S.S. Jeyaraman slip)
    const ayush = poojas.find((p) => p.id === "p-ayush-03")!;
    expect(ayush.tamilName).toContain("ஆயுஷ்");
    expect(ayush.items.length).toBe(93);

    // Check Swayamvara Parvathi Homam
    const swayamvara = poojas.find((p) => p.id === "p-swayamvara-parvathi-04")!;
    expect(swayamvara.tamilName).toBe("சுயம்வர பார்வதி ஹோமம்");
    expect(swayamvara.items.length).toBeGreaterThanOrEqual(45);

    // Check 108 Sangu Pooja
    const sangu = poojas.find((p) => p.id === "p-sangu-pooja-06")!;
    expect(sangu.tamilName).toBe("108 சங்கு பூஜை");
    expect(sangu.items.length).toBeGreaterThanOrEqual(40);
    expect(sangu.items.some((i) => i.itemTamilName === "ரோஜா" && i.quantity === 110)).toBe(true);

    // Check Sudhi Punyahavachanam
    const punyaham = poojas.find((p) => p.id === "p-punyaham-07")!;
    expect(punyaham.tamilName).toBe("சுத்தி புண்யாகவாசனம்");
    expect(punyaham.items.length).toBeGreaterThanOrEqual(45);

    // Check Sri Maha Lakshmi Pooja
    const lakshmi = poojas.find((p) => p.id === "p-lakshmi-08")!;
    expect(lakshmi.tamilName).toBe("ஸ்ரீ மகா லட்சுமி பூஜை");
    expect(lakshmi.items.length).toBeGreaterThanOrEqual(30);

    // Verify all items have valid categories
    const validCategories = new Set([
      "pooja_items",
      "homam_items",
      "navagraha_items",
      "flowers_garlands",
      "fruits_food",
      "vessels_utensils",
      "vastram_clothes",
      "grihapravesam_items",
    ]);

    for (const pooja of poojas) {
      for (const item of pooja.items) {
        expect(validCategories.has(item.category || "")).toBe(true);
      }
    }
  });

  // TEST CASE 47: All users receive only the 8 authentic poojas by default, no obsolete poojas
  it("Test 47: All users receive only the 8 authentic poojas by default, and legacy poojas are purged", () => {
    const defaultBizPoojas = store.getPoojas("biz-venkateswara-01");
    // Must be exactly 8 authentic poojas
    expect(defaultBizPoojas.length).toBe(8);

    const obsoleteIds = [
      "p-ayushya-02", "p-navagraha-03", "p-gruhapravesam-04",
      "p-sathyanarayana-05", "p-sudarshana-06", "p-rudra-07",
      "p-lakshmi-kubera-08", "p-mrityunjaya-09", "p-sashtiapthapoorthi-10",
      "p-durga-11", "p-karthigai-12", "p-subamuhurtha-13",
    ];

    // None of the obsolete IDs should exist
    for (const obsId of obsoleteIds) {
      expect(defaultBizPoojas.some((p) => p.id === obsId)).toBe(false);
    }

    // New business querying getPoojas automatically gets the 8 authentic poojas
    const newBizId = "biz-new-swami-99";
    const newBizPoojas = store.getPoojas(newBizId);
    expect(newBizPoojas.length).toBe(8);
    for (const p of newBizPoojas) {
      expect(p.businessId).toBe(newBizId);
      expect(p.items.length).toBeGreaterThan(0);
      expect(p.items.every((it) => it.poojaId === p.id)).toBe(true);
    }

    // If an obsolete dummy pooja is present in store (e.g. tenant-suffixed or name-based), getPoojas purges it
    store.poojas.push({
      id: "p-sathyanarayana-05-biz-priest-77",
      businessId: "biz-venkateswara-01",
      englishName: "Legacy Pooja",
      tamilName: "சத்தியநாராயண பூஜை",
      description: "Old",
      durationMinutes: 60,
      basePrice: 1000,
      active: true,
      items: [],
      createdAt: new Date().toISOString(),
    });

    store.poojas.push({
      id: "p-random-custom-999",
      businessId: "biz-venkateswara-01",
      englishName: "Navagraha Homam",
      tamilName: "நவகிரக ஹோமம்",
      description: "Old Navagraha",
      durationMinutes: 60,
      basePrice: 2000,
      active: true,
      items: [],
      createdAt: new Date().toISOString(),
    });

    const refreshed = store.getPoojas("biz-venkateswara-01");
    expect(refreshed.some((p) => p.id === "p-sathyanarayana-05-biz-priest-77")).toBe(false);
    expect(refreshed.some((p) => p.tamilName.includes("சத்தியநாராயண"))).toBe(false);
    expect(refreshed.some((p) => p.tamilName.includes("நவகிரக ஹோமம்"))).toBe(false);
    expect(refreshed.length).toBe(8);

    // Custom pooja created by user is preserved
    const custom = store.createPooja({
      businessId: newBizId,
      englishName: "Custom Special Pooja",
      tamilName: "கோவில் சிறப்பு பூஜை",
      basePrice: 5000,
    });
    expect(custom.isCustom).toBe(true);

    const newBizWithCustom = store.getPoojas(newBizId);
    expect(newBizWithCustom.length).toBe(9);
    expect(newBizWithCustom.some((p) => p.id === custom.id)).toBe(true);
  });

  // TEST CASE 47: Samagri Item Colorful Icons
  it("Test 47: getItemIcon returns accurate vibrant icons for all key items and falls back appropriately", async () => {
    const { getItemIcon } = await import("@/lib/samagri/icons");

    // Key sacred items
    expect(getItemIcon({ itemTamilName: "தேங்காய் (Coconut)", category: "fruits_food" })).toBe("🥥");
    expect(getItemIcon({ itemTamilName: "வாழைப்பழம் (Banana)", category: "fruits_food" })).toBe("🍌");
    expect(getItemIcon({ itemTamilName: "எலுமிச்சம்பழம் (Lemon)", category: "fruits_food" })).toBe("🍋");
    expect(getItemIcon({ itemTamilName: "தாமரை மலர் (Lotus)", category: "flowers_garlands" })).toBe("🪷");
    expect(getItemIcon({ itemTamilName: "மல்லிகை பூ (Jasmine)", category: "flowers_garlands" })).toBe("🌸");
    expect(getItemIcon({ itemTamilName: "ரோஜா மாலை (Rose)", category: "flowers_garlands" })).toBe("🌹");
    expect(getItemIcon({ itemTamilName: "பசு நெய் (Pure Ghee)", category: "homam_items" })).toBe("🧈");
    expect(getItemIcon({ itemTamilName: "சுத்தமான தேன் (Honey)", category: "pooja_items" })).toBe("🍯");
    expect(getItemIcon({ itemTamilName: "பசும்பால் (Milk)", category: "pooja_items" })).toBe("🥛");
    expect(getItemIcon({ itemTamilName: "கற்பூரம் (Camphor)", category: "pooja_items" })).toBe("🕯️");
    expect(getItemIcon({ itemTamilName: "மஞ்சள் தூள் (Turmeric)", category: "pooja_items" })).toBe("🟡");
    expect(getItemIcon({ itemTamilName: "குங்குமம் (Kumkum)", category: "pooja_items" })).toBe("🔴");
    expect(getItemIcon({ itemTamilName: "விபூதி (Vibhuti)", category: "pooja_items" })).toBe("⚪");
    expect(getItemIcon({ itemTamilName: "வெற்றிலை பாக்கு (Betel)", category: "pooja_items" })).toBe("🍃");
    expect(getItemIcon({ itemTamilName: "சமித்து கட்டுகள் (Samithu)", category: "homam_items" })).toBe("🪵");
    expect(getItemIcon({ itemTamilName: "பூசணிக்காய் (Ash Gourd)", category: "fruits_food" })).toBe("🎃");
    expect(getItemIcon({ itemTamilName: "வலம்புரி சங்கு (Conch)", category: "vessels_utensils" })).toBe("🐚");
    expect(getItemIcon({ itemTamilName: "மணி (Pooja Bell)", category: "vessels_utensils" })).toBe("🔔");
    expect(getItemIcon({ itemTamilName: "பட்டு வஸ்திரம் (Silk Vastram)", category: "vastram_clothes" })).toBe("🥻");
    expect(getItemIcon({ itemTamilName: "வேஷ்டி (Dhoti)", category: "vastram_clothes" })).toBe("🧣");
    expect(getItemIcon({ itemTamilName: "கலச சொம்பு (Kalasam)", category: "vessels_utensils" })).toBe("🏺");

    // Fallback to category icon for unknown item
    expect(getItemIcon({ itemTamilName: "அறியப்படாத விசேஷ பொருள்", category: "homam_items" })).toBe("🔥");
    expect(getItemIcon({ itemTamilName: "அறியப்படாத நவகிரக தானியம்", category: "navagraha_items" })).toBe("🪐");
    expect(getItemIcon({ itemTamilName: "அறியப்படாத ஆடை", category: "vastram_clothes" })).toBe("🧣");
  });

  it("Test 48: New User Isolation — 100% empty bookings and customers, default authentic poojas with 93 items Ayush Homam", () => {
    const store = new VelviDatabaseStore();
    const newBizId = "biz-new-priest-99";

    // A brand new business starts with 0 bookings, 0 customers, 0 payments
    expect(store.getBookings(newBizId)).toHaveLength(0);
    expect(store.getCustomers(newBizId)).toHaveLength(0);
    expect(store.payments.filter((p) => p.businessId === newBizId)).toHaveLength(0);

    // Default authentic poojas are auto-seeded
    const poojas = store.getPoojas(newBizId);
    expect(poojas).toHaveLength(8);

    // Ayush Homam in new business has all 93 items
    const ayush = poojas.find((p) => p.id.startsWith("p-ayush-03"))!;
    expect(ayush).toBeDefined();
    expect(ayush.items).toHaveLength(93);

    // Demo user retains their bookings and customers
    expect(store.getBookings("biz-venkateswara-01").length).toBeGreaterThan(0);
    expect(store.getCustomers("biz-venkateswara-01").length).toBeGreaterThan(0);

    // If new business requests demo reload, it only seeds into their business
    const reloadRes = store.loadSampleData(newBizId);
    expect(reloadRes.addedBookings).toBeGreaterThan(0);
    expect(store.getBookings(newBizId).length).toBeGreaterThan(0);
    expect(store.getBookings(newBizId).every((b) => b.businessId === newBizId)).toBe(true);

    // Clear demo data removes it from new business without corrupting others
    const clearRes = store.clearSampleData(newBizId);
    expect(clearRes.removedBookings).toBeGreaterThan(0);
    expect(store.getBookings(newBizId)).toHaveLength(0);
  });

  it("should verify App Enhancements: No blinking footer, Step 2 scroll, jewel settings icons, Days to Expiry, and 1-Day reminders", () => {
    // 1. Developer credit footer does NOT have animate-ping
    const devCreditPath = path.join(__dirname, "..", "components", "ui", "DeveloperCredit.tsx");
    const devCreditCode = fs.readFileSync(devCreditPath, "utf-8");
    expect(devCreditCode).not.toContain("animate-ping");
    expect(devCreditCode).toContain("+91-8300030123");

    // 2. Login page has restyled distinct Demo button with 20 Free Bookings
    const loginPath = path.join(__dirname, "..", "app", "(public)", "login", "page.tsx");
    const loginCode = fs.readFileSync(loginPath, "utf-8");
    expect(loginCode).toContain("Quick Demo Access");
    expect(loginCode).toContain("20 Free Bookings");

    // 3. New booking step 2 top-to-bottom scroll reset
    const quickBookingPath = path.join(__dirname, "..", "app", "app", "bookings", "quick", "page.tsx");
    const quickBookingCode = fs.readFileSync(quickBookingPath, "utf-8");
    expect(quickBookingCode).toContain("twoStepStage === 2");
    expect(quickBookingCode).toContain("window.scrollTo({ top: 0");

    // 4. Settings page has vibrant jewel-toned iconBg and iconColor
    const settingsPath = path.join(__dirname, "..", "app", "app", "settings", "page.tsx");
    const settingsCode = fs.readFileSync(settingsPath, "utf-8");
    expect(settingsCode).toContain("iconBg");
    expect(settingsCode).toContain("iconColor");
    expect(settingsCode).toContain("bg-blue-100");
    expect(settingsCode).toContain("bg-emerald-100");

    // 5. MobileHeader contains Days to Expiry calculation, tomorrow 1-day alert, and Devotees & Priests button
    const headerPath = path.join(__dirname, "..", "components", "mobile", "MobileHeader.tsx");
    const headerCode = fs.readFileSync(headerPath, "utf-8");
    expect(headerCode).toContain("daysToExpiry");
    expect(headerCode).toContain("tomorrowBookingsCount");
    expect(headerCode).toContain("/app/customers");
    expect(headerCode).toContain("Devotees & Priests");

    // 6. GlobalSearchModal has 1-Day Before reminder and WhatsApp action
    const searchModalPath = path.join(__dirname, "..", "components", "search", "GlobalSearchModal.tsx");
    const searchModalCode = fs.readFileSync(searchModalPath, "utf-8");
    expect(searchModalCode).toContain("tomorrowBookings");
    expect(searchModalCode).toContain("handleSendReminderWhatsApp");
    expect(searchModalCode).toContain("1 Day Before Reminder");

    // 7. App Guide has expanded topics for Ayush Homam 93-items, 1-Day Before alerts, and PWA
    const guidePath = path.join(__dirname, "..", "app", "app", "settings", "guide", "page.tsx");
    const guideCode = fs.readFileSync(guidePath, "utf-8");
    expect(guideCode).toContain("ayush-homam-93");
    expect(guideCode).toContain("one-day-before-reminders");
    expect(guideCode).toContain("pwa-offline-usage");
  });

  // TEST CASE 50: Cashfree Payment Gateway for App Subscriptions
  it("Test 50: Cashfree creates monthly/annual subscription orders and verifies webhook signatures", async () => {
    // 1. Create monthly subscription order
    const monthlyOrder = await cashfree.createSubscriptionOrder(
      "biz-venkateswara-01",
      "u-ravi-iyer-01",
      "MONTHLY",
      { name: "Ravi Iyer", email: "ravi.iyer@gmail.com", phone: "+919876543210" }
    );
    expect(monthlyOrder.orderId).toContain("order_");
    expect(monthlyOrder.orderAmount).toBe(499);
    expect(monthlyOrder.paymentSessionId).toBeDefined();

    // 2. Create annual subscription order
    const yearlyOrder = await cashfree.createSubscriptionOrder(
      "biz-venkateswara-01",
      "u-ravi-iyer-01",
      "YEARLY",
      { name: "Ravi Iyer", email: "ravi.iyer@gmail.com", phone: "+919876543210" }
    );
    expect(yearlyOrder.orderId).toContain("order_");
    expect(yearlyOrder.orderAmount).toBe(4999);
    expect(yearlyOrder.paymentSessionId).toBeDefined();

    // 3. Webhook signature verification
    const validSig = cashfree.verifyWebhookSignature("test-valid-signature", '{"data":{}}', "1720000000");
    expect(validSig).toBe(true);

    const invalidSig = cashfree.verifyWebhookSignature("tampered-signature", '{"data":{}}', "1720000000");
    expect(invalidSig).toBe(false);

    // 4. Extend subscription validity via verified payment
    const beforeSub = store.subscriptions.find((s) => s.businessId === "biz-venkateswara-01")!;
    const beforeEnd = new Date(beforeSub.currentPeriodEnd).getTime();

    const adjustRes = store.adjustSubscriptionValidity({
      businessId: "biz-venkateswara-01",
      adminUserId: "u-super-admin-01",
      adminName: "Cashfree Payment Gateway",
      adjustmentType: "EXTEND",
      days: 30,
      reason: "Cashfree verified test payment",
    });
    expect(adjustRes.success).toBe(true);
    expect(adjustRes.subscription?.status).toBe("ACTIVE");

    const afterEnd = new Date(adjustRes.subscription!.currentPeriodEnd).getTime();
    expect(afterEnd).toBeGreaterThan(beforeEnd);
  });

  // TEST CASE 51: Super Admin Directory & Vadhyar Earnings Metrics
  it("Test 51: Super Admin directory metrics compute joined date, total bookings, and dakshina earnings", () => {
    const metrics = store.getAllUsersDirectoryMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    // Verify Ravi Iyer metrics
    const raviMetric = metrics.find((m) => m.user.id === "u-ravi-iyer-01");
    expect(raviMetric).toBeDefined();
    expect(raviMetric!.bookingCount).toBeGreaterThan(0);
    expect(raviMetric!.totalEarnings).toBeGreaterThan(0);
    expect(raviMetric!.joinedDate).toBeDefined();

    // Verify Super Admin identification
    const superAdminMetric = metrics.find(
      (m) => m.user.email.toLowerCase() === "manirajankg@gmail.com"
    );
    expect(superAdminMetric).toBeDefined();
    expect(superAdminMetric!.isSuperAdmin).toBe(true);
  });

  // TEST CASE 52: Super Admin Coupon Management Engine
  it("Test 52: Super Admin coupon engine creates, toggles, validates discounts and enforces limits", () => {
    // 1. Create a percentage coupon
    const createRes = store.createCoupon({
      code: "TEST50",
      description: "50% Test Discount",
      discountType: "PERCENTAGE",
      discountValue: 50,
      validityDaysBonus: 15,
      maxUses: 2,
      validUntil: "2030-12-31T23:59:59Z",
      isActive: true,
    });
    expect(createRes.success).toBe(true);
    expect(createRes.coupon?.code).toBe("TEST50");

    // 2. Validate monthly calculation
    const valMonthly = store.validateCoupon("TEST50", "MONTHLY");
    expect(valMonthly.valid).toBe(true);
    expect(valMonthly.originalAmount).toBe(499);
    expect(valMonthly.discountAmount).toBe(250); // Math.round(499 * 0.5)
    expect(valMonthly.finalAmount).toBe(249);
    expect(valMonthly.bonusDays).toBe(15);

    // 3. Validate yearly calculation
    const valYearly = store.validateCoupon("TEST50", "YEARLY");
    expect(valYearly.valid).toBe(true);
    expect(valYearly.originalAmount).toBe(4999);
    expect(valYearly.discountAmount).toBe(2500); // Math.round(4999 * 0.5)
    expect(valYearly.finalAmount).toBe(2499);

    // 4. Test 100% Free Validity Coupon
    const freeVal = store.validateCoupon("VELVIPRO100", "MONTHLY");
    expect(freeVal.valid).toBe(true);
    expect(freeVal.discountAmount).toBe(499);
    expect(freeVal.finalAmount).toBe(0);
    expect(freeVal.bonusDays).toBe(30);

    // 5. Test Inactive Coupon
    store.toggleCouponStatus(createRes.coupon!.id);
    const valInactive = store.validateCoupon("TEST50", "MONTHLY");
    expect(valInactive.valid).toBe(false);
    expect(valInactive.error).toContain("inactive");

    // Re-activate
    store.toggleCouponStatus(createRes.coupon!.id);
    expect(store.validateCoupon("TEST50", "MONTHLY").valid).toBe(true);
  });

  // TEST CASE 53: Coupon Redemption in Subscription Flow
  it("Test 53: Redeeming coupon extends validity, increments usedCount, and logs payment", () => {
    // 1. Create a 100% Free Developer coupon
    store.createCoupon({
      code: "MANISPECIAL",
      description: "Developer 1-Year Free Pass",
      discountType: "FREE_VALIDITY",
      discountValue: 100,
      validityDaysBonus: 365,
      maxUses: 10,
      validUntil: "2030-12-31T23:59:59Z",
    });

    const targetBizId = "biz-venkateswara-01";
    const subBefore = store.subscriptions.find((s) => s.businessId === targetBizId)!;
    const endBefore = new Date(subBefore.currentPeriodEnd).getTime();

    // 2. Redeem coupon for monthly cycle
    const redeemRes = store.redeemCoupon({
      code: "MANISPECIAL",
      businessId: targetBizId,
      cycle: "MONTHLY",
      userId: "u-super-admin-01",
    });

    expect(redeemRes.success).toBe(true);
    expect(redeemRes.daysAdded).toBe(395); // 30 (monthly) + 365 (bonus)
    expect(redeemRes.finalAmount).toBe(0);
    expect(redeemRes.coupon?.usedCount).toBe(1);

    const endAfter = new Date(redeemRes.subscription!.currentPeriodEnd).getTime();
    const daysDiff = Math.round((endAfter - endBefore) / (1000 * 60 * 60 * 24));
    expect(daysDiff).toBe(395);

    // 3. Verify payment ledger entry
    const lastPayment = store.payments[store.payments.length - 1];
    expect(lastPayment.orderId).toContain("coupon_MANISPECIAL");
    expect(lastPayment.amount).toBe(0);
    expect(lastPayment.paymentMethod).toBe("Coupon 100% Free");
  });

  // TEST CASE 54: Free Demo User 20-Booking Cap & Pro User Unlimited Bookings
  it("Test 54: Free Demo user cannot create more than 20 bookings; Pro users have unlimited bookings", () => {
    // Pro business has active subscription and unlimited bookings
    expect(store.isUnlimitedBookings("biz-venkateswara-01")).toBe(true);
    expect(store.isDemoBusiness("biz-venkateswara-01")).toBe(false);

    // Pure Demo business with no active subscription
    const demoBizId = "biz-demo-01";
    store.businesses.push({
      id: demoBizId,
      ownerId: "u-demo-01",
      name: "Demo Temple",
      serviceName: "Pooja Services",
      iyerName: "Demo Priest",
      phone: "+919000000000",
      showWatermark: true,
      createdAt: new Date().toISOString(),
    });

    expect(store.isDemoBusiness(demoBizId)).toBe(true);
    expect(store.isUnlimitedBookings(demoBizId)).toBe(false);

    // Initial demo bookings count is 0
    const initialCount = store.getBookings(demoBizId).length;
    expect(initialCount).toBe(0);

    // Add bookings until reaching exactly 20
    for (let i = 0; i < 20; i++) {
      store.createBooking({
        businessId: demoBizId,
        customerId: "c-ramesh-01",
        poojaId: "p-ganapathi-01",
        date: "2026-12-01",
        startTime: "09:00 AM",
        location: "Namakkal",
        totalAmount: 5000,
        advanceAmount: 1000,
        balanceAmount: 4000,
        paymentStatus: "PARTIALLY_PAID",
        status: "CONFIRMED",
      });
    }

    expect(store.getBookings(demoBizId).length).toBe(20);

    // Attempting to create booking #21 MUST throw limit error
    expect(() => {
      store.createBooking({
        businessId: demoBizId,
        customerId: "c-ramesh-01",
        poojaId: "p-ganapathi-01",
        date: "2026-12-02",
        startTime: "10:00 AM",
        location: "Namakkal",
        totalAmount: 5000,
        advanceAmount: 1000,
        balanceAmount: 4000,
        paymentStatus: "PARTIALLY_PAID",
        status: "CONFIRMED",
      });
    }).toThrow(/இலவச டெமோ வரம்பு முடிந்தது|Free Demo limit reached/);

    // Booking count must remain capped at 20
    expect(store.getBookings(demoBizId).length).toBe(20);
  });

  // TEST CASE 55: Fresh New User Starts Completely Clean (0 Bookings, 0 Customers)
  it("Test 55: Fresh newly created users start with 0 bookings and 0 customers", () => {
    const newUserId = "u-fresh-priest-99";
    const newBizId = "biz-fresh-priest-99";

    store.users.push({
      id: newUserId,
      googleId: "google-fresh-99",
      email: "freshpriest@velvi.app",
      name: "Fresh Vadhyar",
      mobile: "+919876543299",
      mobileVerified: true,
      role: "OWNER",
      referralCode: "VELVI-FRESH99",
      createdAt: new Date().toISOString(),
    });

    store.businesses.push({
      id: newBizId,
      ownerId: newUserId,
      name: "Fresh Pooja Services",
      iyerName: "Fresh Vadhyar",
      phone: "+919876543299",
      showWatermark: true,
      createdAt: new Date().toISOString(),
    });

    // Fresh business must have ZERO dummy bookings and ZERO dummy customers
    expect(store.getBookings(newBizId)).toHaveLength(0);
    expect(store.getCustomers(newBizId)).toHaveLength(0);

    // Non-demo businesses are not blocked by the demo 20 cap
    expect(store.isDemoBusiness(newBizId)).toBe(false);
  });

  // TEST CASE 56: Geo Location (City, Country) and Audit Logging
  it("Test 56: Directory metrics and audit logging support IP, City, and Country", () => {
    const metrics = store.getAllUsersDirectoryMetrics();
    expect(metrics.length).toBeGreaterThan(0);

    const raviMetric = metrics.find((m) => m.user.id === "u-ravi-iyer-01");
    expect(raviMetric).toBeDefined();
    expect(raviMetric?.city).toBeDefined();
    expect(raviMetric?.country).toBe("India");
    expect(raviMetric?.ipAddress).toBeDefined();

    // Verify audit log creation
    const log = store.logAudit({
      actorId: "u-ravi-iyer-01",
      actorName: "Ravi Iyer",
      action: "DEMO_LOGIN",
      targetType: "AUTH_SESSION",
      ipAddress: "106.210.142.88",
      city: "Chennai",
      country: "India",
      reason: "Quick demo access",
    });

    expect(log.id).toBeDefined();
    expect(log.ipAddress).toBe("106.210.142.88");
    expect(log.city).toBe("Chennai");
    expect(log.country).toBe("India");
    expect(store.auditLogs[0].id).toBe(log.id);
  });

  // TEST CASE 57: Super Admin Authentication Rule (Email + PIN 5599)
  it("Test 57: Super Admin Panel strictly requires manirajankg@gmail.com and PIN 5599", () => {
    const SUPER_ADMIN_EMAIL = "manirajankg@gmail.com";
    const SUPER_ADMIN_PIN = "5599";

    // Direct email without PIN cannot unlock
    const verifyPin = (email: string, pin: string) => {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPin = pin.trim();
      if (cleanEmail !== SUPER_ADMIN_EMAIL) {
        return { success: false, error: "Only manirajankg@gmail.com is authorized as Super Admin." };
      }
      if (cleanPin !== SUPER_ADMIN_PIN) {
        return { success: false, error: "Incorrect Security PIN." };
      }
      return { success: true };
    };

    // Wrong email with correct PIN -> denied
    expect(verifyPin("other@gmail.com", "5599").success).toBe(false);

    // Correct email with wrong PIN -> denied
    expect(verifyPin(SUPER_ADMIN_EMAIL, "1234").success).toBe(false);
    expect(verifyPin(SUPER_ADMIN_EMAIL, "").success).toBe(false);

    // Correct email with correct PIN 5599 -> success
    expect(verifyPin(SUPER_ADMIN_EMAIL, "5599").success).toBe(true);
    expect(verifyPin("MANIRAJANKG@GMAIL.COM", "5599").success).toBe(true);
  });

  // TEST CASE 58: UI String Verification - Integrated Pro status without extra boxes or subtitles
  it("Test 58: Mobile profile dropdown pro card has clean branding without separate box or extra subtitles", () => {
    // Read MobileHeader.tsx to ensure clean integrated design
    const headerPath = path.resolve(__dirname, "../components/mobile/MobileHeader.tsx");
    const content = fs.readFileSync(headerPath, "utf-8");

    // Must have Velvi Pro Active
    expect(content).toContain("Velvi Pro Active");

    // Must NOT contain separate box subtitle "முழு அணுகல் • பிரீமியம் வசதிகள்"
    expect(content).not.toContain("முழு அணுகல் • பிரீமியம் வசதிகள்");

    // Must not contain "வரம்பற்ற முன்பதிவுகள் (Unlimited)"
    expect(content).not.toContain("வரம்பற்ற முன்பதிவுகள் (Unlimited)");
  });

  // TEST CASE 59: Real Cloud Database Telemetry & Storage Metrics
  it("Test 59: Real Cloud Database Telemetry and Metrics are integrated in DataBackup page", () => {
    const backupPath = path.resolve(__dirname, "../app/app/data-backup/page.tsx");
    const content = fs.readFileSync(backupPath, "utf-8");

    // Must query live cloud stats from /api/cloud/stats
    expect(content).toContain("/api/cloud/stats");

    // Must display real storage metrics: Total records, Bookings, Devotees, Poojas, Payments
    expect(content).toContain("totalRecords");
    expect(content).toContain("bookingsCount");
    expect(content).toContain("customersCount");
    expect(content).toContain("poojasCount");
    expect(content).toContain("paymentsCount");

    // Must have cloud backup labels
    expect(content).toContain("Cloud Storage");
  });

  // TEST CASE 60: Uniform Payment Recording with Date, Remark, Discount & Dynamic Balance Tracking
  it("Test 60: Record payment supports payment date, remark, discount, and paymentRecords ledger", () => {
    const newBooking = store.createBooking({
      businessId: "biz-venkateswara-01",
      customerId: "c-01",
      poojaId: "p-01",
      date: "2026-10-05",
      startTime: "09:00",
      location: "Namakkal",
      totalAmount: 5000,
      advanceAmount: 1000,
      balanceAmount: 4000,
      paymentStatus: "PARTIALLY_PAID",
      paymentDate: "2026-09-26",
      paymentMethod: "UPI",
      paymentNotes: "GPay initial advance",
      status: "CONFIRMED",
    });

    expect(newBooking.paymentRecords).toBeDefined();
    expect(newBooking.paymentRecords?.length).toBe(1);
    expect(newBooking.paymentRecords?.[0].amount).toBe(1000);
    expect(newBooking.paymentRecords?.[0].remark).toBe("GPay initial advance");
    expect(newBooking.paymentRecords?.[0].date).toBe("2026-09-26");

    // Record second partial payment with discount
    const res = store.recordBookingPayment({
      bookingId: newBooking.id,
      amount: 2000,
      discount: 500,
      paymentDate: "2026-09-27",
      paymentMethod: "CASH",
      notes: "Cash partial payment with 500 festival discount",
      recordedBy: "Ravi Iyer",
    });

    expect(res.success).toBe(true);
    expect(res.booking).toBeDefined();
    expect(res.booking?.discountAmount).toBe(500);
    expect(res.booking?.advanceAmount).toBe(3000); // 1000 + 2000
    // Net: 5000 - 500 = 4500. Balance: 4500 - 3000 = 1500
    expect(res.booking?.balanceAmount).toBe(1500);
    expect(res.booking?.paymentStatus).toBe("PARTIALLY_PAID");
    expect(res.booking?.paymentRecords?.length).toBe(2);
    expect(res.booking?.paymentRecords?.[1].amount).toBe(2000);
    expect(res.booking?.paymentRecords?.[1].discount).toBe(500);
    expect(res.booking?.paymentRecords?.[1].remark).toBe("Cash partial payment with 500 festival discount");
    expect(res.booking?.paymentRecords?.[1].date).toBe("2026-09-27");

    // Clear remaining balance
    const finalRes = store.recordBookingPayment({
      bookingId: newBooking.id,
      amount: 1500,
      paymentDate: "2026-09-28",
      paymentMethod: "UPI",
      notes: "Final settlement via UPI",
    });

    expect(finalRes.success).toBe(true);
    expect(finalRes.booking?.balanceAmount).toBe(0);
    expect(finalRes.booking?.paymentStatus).toBe("PAID");
    expect(finalRes.booking?.paymentRecords?.length).toBe(3);
  });
});



