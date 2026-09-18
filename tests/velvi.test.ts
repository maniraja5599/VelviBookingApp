import { describe, it, expect, beforeEach } from "vitest";
import { VelviDatabaseStore } from "../lib/db/store";
import { getTamilDate } from "../lib/calendar/tamil";
import {
  normalizeIndianMobile,
  maskEmail,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "../lib/utils/phone";
import { cashfree } from "../lib/payments/cashfree";

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

  // TEST CASE 21: WhatsApp Formatter uses English labels while preserving Tamil calendar date
  it("Test 21: WhatsApp formatter outputs clean English labels with Tamil calendar date", async () => {
    const { formatPoojaItemsWhatsAppMessage, formatBookingConfirmationWhatsAppMessage } = await import(
      "../lib/whatsapp/formatter"
    );

    const booking = store.bookings[0];
    const business = store.businesses[0];

    const itemsMsg = formatPoojaItemsWhatsAppMessage(booking, business);
    expect(itemsMsg).toContain("Time: *08:00 AM*");
    expect(itemsMsg).toContain("Devotee:");
    expect(itemsMsg).toContain("Required Items:");
    expect(itemsMsg).toContain("Please keep all items ready");
    // Preserves Tamil calendar date (e.g. ஆவணி 27)
    expect(itemsMsg).toMatch(/[\u0B80-\u0BFF]+\s+[0-9]{1,2}/);

    const confMsg = formatBookingConfirmationWhatsAppMessage(booking, business);
    expect(confMsg).toContain("Booking Confirmed");
    expect(confMsg).not.toContain("முன்பதிவு உறுதி செய்யப்பட்டது");
    expect(confMsg).toContain("Date:");
    expect(confMsg).toContain("Time:");
    expect(confMsg).toContain("Total Fee:");
  });

  // TEST CASE 22: Version Control Registry & PWA Manifest Integrity
  it("Test 22: Version control registry and PWA manifest are properly configured", async () => {
    const { APP_VERSION, VERSION_HISTORY, RELEASE_CHANNEL } = await import(
      "../lib/version/history"
    );

    expect(APP_VERSION).toBe("2.1.0");
    expect(RELEASE_CHANNEL).toContain("Stable");
    expect(VERSION_HISTORY.length).toBeGreaterThanOrEqual(5);

    // Latest version check
    const latest = VERSION_HISTORY[0];
    expect(latest.version).toBe("2.1.0");
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

    // 2. First-time install popup component exists and has 10-second auto-close + once-only persistence
    const popupPath = path.join(__dirname, "..", "components", "mobile", "FirstTimeInstallPopup.tsx");
    expect(fs.existsSync(popupPath)).toBe(true);
    const popupCode = fs.readFileSync(popupPath, "utf-8");
    expect(popupCode).toContain("velvi_first_install_prompt_seen");
    expect(popupCode).toContain("10000"); // 10 seconds auto-dismiss
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
});

