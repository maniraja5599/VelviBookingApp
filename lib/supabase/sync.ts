import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { db, isLegacyObsoletePooja } from "@/lib/db/store";
import { Booking, Customer, Pooja, Business, User, Subscription, Coupon } from "@/lib/types";

let isSyncing = false;
let realtimeSubscription: any = null;

/**
 * Pushes a user profile up to Supabase.
 */
export async function pushUserToCloud(user: User): Promise<boolean> {
  if (!user) return false;

  // 1. Post to same-origin server API (Immune to client-side RLS, VPN, or adblockers)
  if (typeof window !== "undefined") {
    try {
      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      }).catch(() => {});
    } catch (_) {}
  }

  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    const validRole = ["SUPER_ADMIN", "OWNER", "IYER", "STAFF"].includes(user.role as any)
      ? user.role
      : "OWNER";

    const payload = {
      id: user.id,
      google_id: user.googleId || null,
      email: user.email || `${user.id}@velvi.app`,
      name: user.name || (user.email ? user.email.split("@")[0] : "User"),
      avatar_url: user.avatarUrl || null,
      mobile: user.mobile || null,
      mobile_verified: Boolean(user.mobileVerified),
      role: validRole,
      referral_code: user.referralCode || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("users").upsert(payload);
    if (error) {
      console.warn("[CloudSync] Upsert user warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push user exception:", err);
    return false;
  }
}

/**
 * Pushes a business profile up to Supabase.
 */
export async function pushBusinessToCloud(business: Business): Promise<boolean> {
  if (!business) return false;

  // 1. Post to same-origin server API
  if (typeof window !== "undefined") {
    try {
      fetch("/api/auth/sync-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ business }),
      }).catch(() => {});
    } catch (_) {}
  }

  const supabase = getSupabaseClient();
  if (!supabase) return true;

  try {
    // If ownerId exists in local store, ensure user is pushed first
    if (business.ownerId) {
      const owner = db.users.find((u) => u.id === business.ownerId);
      if (owner) {
        await pushUserToCloud(owner);
      }
    }

    const payload = {
      id: business.id,
      owner_id: business.ownerId || null,
      name: business.name || "Pooja Services",
      service_name: business.serviceName || null,
      iyer_name: business.iyerName || null,
      logo_url: business.logoUrl || null,
      phone: business.phone || null,
      whatsapp: business.whatsapp || null,
      address: business.address || null,
      show_watermark: business.showWatermark ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("businesses").upsert(payload);
    if (error) {
      console.warn("[CloudSync] Upsert business warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push business exception:", err);
    return false;
  }
}

/**
 * Pushes a customer record up to Supabase.
 */
export async function pushCustomerToCloud(customer: Customer): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !customer) return false;

  try {
    // Ensure business exists in cloud
    if (customer.businessId) {
      const biz = db.businesses.find((b) => b.id === customer.businessId);
      if (biz) {
        await pushBusinessToCloud(biz);
      }
    }

    const payload = {
      id: customer.id,
      business_id: customer.businessId || null,
      name: customer.name || "Devotee",
      mobile: customer.mobile || null,
      whatsapp: customer.whatsapp || null,
      address: customer.address || null,
      city: customer.city || "Namakkal",
      notes: customer.notes || null,
      gothram: customer.gothram || null,
      nakshatram: customer.nakshatram || null,
      rasi: customer.rasi || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("customers").upsert(payload);
    if (error) {
      console.warn("[CloudSync] Upsert customer warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push customer exception:", err);
    return false;
  }
}

/**
 * Deletes a customer record from Supabase.
 */
export async function deleteCustomerFromCloud(customerId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("customers").delete().eq("id", customerId);
    if (error) {
      console.warn("[CloudSync] Delete customer warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Delete customer exception:", err);
    return false;
  }
}

/**
 * Pushes a pooja record up to Supabase.
 */
export async function pushPoojaToCloud(pooja: Pooja): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !pooja) return false;

  try {
    // Ensure business exists in cloud
    if (pooja.businessId) {
      const biz = db.businesses.find((b) => b.id === pooja.businessId);
      if (biz) {
        await pushBusinessToCloud(biz);
      }
    }

    const finalEn = pooja.englishName || pooja.tamilName || "Pooja";
    const finalTa = pooja.tamilName || pooja.englishName || "பூஜை";

    const payload = {
      id: pooja.id,
      business_id: pooja.businessId || null,
      english_name: finalEn,
      tamil_name: finalTa,
      description: pooja.description || null,
      duration_minutes: pooja.durationMinutes || 120,
      base_price: pooja.basePrice || 0,
      procedure: pooja.procedure || null,
      items: pooja.items || [],
      is_custom: Boolean(pooja.isCustom),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("poojas").upsert(payload);
    if (error) {
      console.warn("[CloudSync] Upsert pooja warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push pooja exception:", err);
    return false;
  }
}

/**
 * Deletes a pooja record from Supabase.
 */
export async function deletePoojaFromCloud(poojaId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("poojas").delete().eq("id", poojaId);
    if (error) {
      console.warn("[CloudSync] Delete pooja warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Delete pooja exception:", err);
    return false;
  }
}

/**
 * Pushes a subscription record up to Supabase.
 */
export async function pushSubscriptionToCloud(subscription: Subscription): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !subscription) return false;

  try {
    if (subscription.businessId) {
      const biz = db.businesses.find((b) => b.id === subscription.businessId);
      if (biz) {
        await pushBusinessToCloud(biz);
      }
    }

    const payload = {
      id: subscription.id,
      business_id: subscription.businessId,
      plan_name: subscription.planName || "Velvi Pro",
      plan_code: subscription.planCode || "VELVI_PRO",
      status: subscription.status || "ACTIVE",
      trial_start: subscription.trialStart || new Date().toISOString(),
      trial_end: subscription.trialEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
      current_period_start: subscription.currentPeriodStart || new Date().toISOString(),
      current_period_end: subscription.currentPeriodEnd || new Date(Date.now() + 30 * 86400000).toISOString(),
      billing_cycle: subscription.billingCycle || "MONTHLY",
      auto_renew: subscription.autoRenew ?? true,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("subscriptions").upsert(payload, { onConflict: "business_id" });
    if (error) {
      console.warn("[CloudSync] Upsert subscription warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push subscription exception:", err);
    return false;
  }
}

/**
 * Pulls subscription from Supabase for a business.
 */
export async function pullSubscriptionFromCloud(businessId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !businessId) return false;

  try {
    const { data: cloudSubs, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("business_id", businessId)
      .limit(1);

    if (error) {
      console.warn("[CloudSync] Subscription pull warning:", error.message);
      return false;
    }

    if (Array.isArray(cloudSubs) && cloudSubs.length > 0) {
      const cs = cloudSubs[0];
      const mapped: Subscription = {
        id: cs.id,
        businessId: cs.business_id,
        planName: cs.plan_name || "Velvi Pro",
        planCode: cs.plan_code || "VELVI_PRO",
        status: cs.status || "ACTIVE",
        trialStart: cs.trial_start,
        trialEnd: cs.trial_end,
        currentPeriodStart: cs.current_period_start,
        currentPeriodEnd: cs.current_period_end,
        billingCycle: cs.billing_cycle || "MONTHLY",
        autoRenew: Boolean(cs.auto_renew),
        createdAt: cs.created_at || cs.current_period_start,
        updatedAt: cs.updated_at || new Date().toISOString(),
      };
      const idx = db.subscriptions.findIndex((s) => s.businessId === businessId);
      if (idx >= 0) {
        const existingSub = db.subscriptions[idx];
        const existingTime = existingSub.currentPeriodEnd ? new Date(existingSub.currentPeriodEnd).getTime() : 0;
        const cloudTime = mapped.currentPeriodEnd ? new Date(mapped.currentPeriodEnd).getTime() : 0;
        const bestPeriodEnd = Math.max(existingTime, cloudTime) > 0
          ? new Date(Math.max(existingTime, cloudTime)).toISOString()
          : (mapped.currentPeriodEnd || existingSub.currentPeriodEnd);
        const bestStatus = (Math.max(existingTime, cloudTime) > Date.now() || existingSub.status === "ACTIVE" || mapped.status === "ACTIVE")
          ? "ACTIVE"
          : mapped.status;
        db.subscriptions[idx] = {
          ...existingSub,
          ...mapped,
          currentPeriodEnd: bestPeriodEnd,
          status: bestStatus,
        };
        if (existingTime > cloudTime) {
          pushSubscriptionToCloud(db.subscriptions[idx]).catch(() => {});
        }
      } else {
        db.subscriptions.push(mapped);
      }
      db.saveToLocalStorage();
      db.notifyListeners();
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[CloudSync] Pull subscription exception:", err);
    return false;
  }
}

/**
 * Pushes a single booking change up to Supabase with comprehensive constraint handling.
 */
export async function pushBookingToCloud(booking: Booking): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !booking) return false;

  try {
    // 1. Ensure business exists in Supabase
    if (booking.businessId) {
      const biz = db.businesses.find((b) => b.id === booking.businessId);
      if (biz) {
        await pushBusinessToCloud(biz);
      }
    }

    // 2. If customerId is provided, ensure customer is pushed first
    let validCustomerId = booking.customerId;
    if (validCustomerId) {
      const cust = db.customers.find((c) => c.id === validCustomerId);
      if (cust) {
        await pushCustomerToCloud(cust);
      } else {
        // If customer doesn't exist in local store, pass null so FK constraint doesn't abort
        validCustomerId = undefined as any;
      }
    }

    // 3. Normalize check-constrained columns
    const validPaymentStatus = ["PAID", "PARTIALLY_PAID", "PENDING"].includes(
      booking.paymentStatus as any
    )
      ? booking.paymentStatus
      : booking.balanceAmount === 0
      ? "PAID"
      : (booking.advanceAmount || 0) > 0
      ? "PARTIALLY_PAID"
      : "PENDING";

    const validStatus = ["ENQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(
      booking.status as any
    )
      ? booking.status
      : "CONFIRMED";

    const payload = {
      id: booking.id,
      booking_number: booking.bookingNumber || "#8001",
      business_id: booking.businessId || null,
      customer_id: validCustomerId || null,
      customer_name: booking.customerName || "Devotee",
      customer_mobile: booking.customerMobile || null,
      customer_address: booking.customerAddress || null,
      pooja_id: booking.poojaId || null,
      pooja_english_name: booking.poojaEnglishName || booking.poojaTamilName || "Pooja",
      pooja_tamil_name: booking.poojaTamilName || booking.poojaEnglishName || "பூஜை",
      assigned_iyer_id: booking.assignedIyerId || null,
      assigned_iyer_name: booking.assignedIyerName || null,
      date: booking.date || new Date().toISOString().split("T")[0],
      start_time: booking.startTime || "09:00 AM",
      end_time: booking.endTime || null,
      duration_minutes: booking.durationMinutes || 120,
      location: booking.location || "Namakkal",
      total_amount: Number(booking.totalAmount || 0),
      advance_amount: Number(booking.advanceAmount || 0),
      balance_amount: Number(booking.balanceAmount || 0),
      payment_status: validPaymentStatus,
      status: validStatus,
      items: booking.items || [],
      notes: booking.notes || null,
      cancellation_reason: booking.cancellationReason || null,
      cancelled_at: booking.cancelledAt || null,
      created_by: booking.createdBy || booking.assignedIyerName || "Priest",
      created_at: booking.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("bookings").upsert(payload);
    if (error) {
      console.warn("[CloudSync] Upsert booking warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Push booking exception:", err);
    return false;
  }
}

/**
 * Deletes a booking record from Supabase.
 */
export async function deleteBookingFromCloud(bookingId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("bookings").delete().eq("id", bookingId);
    if (error) {
      console.warn("[CloudSync] Delete booking warning:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] Delete booking exception:", err);
    return false;
  }
}

/**
 * Permanently deletes all bookings, customers, and payments for a business in Supabase Cloud (Factory Reset).
 */
export async function clearCloudBusinessData(businessId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !businessId) return false;

  try {
    // 1. Delete payments
    await supabase.from("payments").delete().eq("business_id", businessId);

    // 2. Delete bookings
    const { error: bkErr } = await supabase.from("bookings").delete().eq("business_id", businessId);
    if (bkErr) console.warn("[CloudSync] Delete bookings warning:", bkErr.message);

    // 3. Delete customers
    const { error: cErr } = await supabase.from("customers").delete().eq("business_id", businessId);
    if (cErr) console.warn("[CloudSync] Delete customers warning:", cErr.message);

    return true;
  } catch (err) {
    console.warn("[CloudSync] clearCloudBusinessData exception:", err);
    return false;
  }
}

/**
 * Pushes all local entities (business, user, customers, poojas, bookings) for a business up to Supabase.
 */
export async function pushAllToCloud(businessId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !businessId) return false;

  try {
    // 1. Business & User Profile
    const biz = db.businesses.find((b) => b.id === businessId) || db.businesses[0];
    if (biz) {
      await pushBusinessToCloud(biz);
    }

    // 2. Batch upsert customers for this business
    const customers = db.customers.filter((c) => c.businessId === businessId);
    if (customers.length > 0) {
      const custPayload = customers.map((c) => ({
        id: c.id,
        business_id: c.businessId || businessId,
        name: c.name || "Devotee",
        mobile: c.mobile || null,
        whatsapp: c.whatsapp || null,
        address: c.address || null,
        city: c.city || "Namakkal",
        notes: c.notes || null,
        gothram: c.gothram || null,
        nakshatram: c.nakshatram || null,
        rasi: c.rasi || null,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("customers").upsert(custPayload);
    }

    // 3. Batch upsert poojas for this business
    const poojas = db.poojas.filter(
      (p) => p.businessId === businessId && !isLegacyObsoletePooja(p)
    );
    if (poojas.length > 0) {
      const poojaPayload = poojas.map((p) => ({
        id: p.id,
        business_id: p.businessId || businessId,
        english_name: p.englishName || p.tamilName || "Pooja",
        tamil_name: p.tamilName || p.englishName || "பூஜை",
        description: p.description || null,
        duration_minutes: p.durationMinutes || 120,
        base_price: p.basePrice || 0,
        procedure: p.procedure || null,
        items: p.items || [],
        is_custom: Boolean(p.isCustom),
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("poojas").upsert(poojaPayload);
    }

    // 4. Batch upsert bookings for this business
    const bookings = db.bookings.filter((b) => b.businessId === businessId);
    if (bookings.length > 0) {
      const bookingPayload = bookings.map((b) => {
        const validPaymentStatus = ["PAID", "PARTIALLY_PAID", "PENDING"].includes(
          b.paymentStatus as any
        )
          ? b.paymentStatus
          : b.balanceAmount === 0
          ? "PAID"
          : (b.advanceAmount || 0) > 0
          ? "PARTIALLY_PAID"
          : "PENDING";

        const validStatus = ["ENQUIRY", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(
          b.status as any
        )
          ? b.status
          : "CONFIRMED";

        return {
          id: b.id,
          booking_number: b.bookingNumber || "#8001",
          business_id: b.businessId || businessId,
          customer_id: b.customerId || null,
          customer_name: b.customerName || "Devotee",
          customer_mobile: b.customerMobile || null,
          customer_address: b.customerAddress || null,
          pooja_id: b.poojaId || null,
          pooja_english_name: b.poojaEnglishName || b.poojaTamilName || "Pooja",
          pooja_tamil_name: b.poojaTamilName || b.poojaEnglishName || "பூஜை",
          assigned_iyer_id: b.assignedIyerId || null,
          assigned_iyer_name: b.assignedIyerName || null,
          date: b.date || new Date().toISOString().split("T")[0],
          start_time: b.startTime || "09:00 AM",
          end_time: b.endTime || null,
          duration_minutes: b.durationMinutes || 120,
          location: b.location || "Namakkal",
          total_amount: Number(b.totalAmount || 0),
          advance_amount: Number(b.advanceAmount || 0),
          balance_amount: Number(b.balanceAmount || 0),
          payment_status: validPaymentStatus,
          status: validStatus,
          items: b.items || [],
          notes: b.notes || null,
          cancellation_reason: b.cancellationReason || null,
          cancelled_at: b.cancelledAt || null,
          created_by: b.createdBy || b.assignedIyerName || "Priest",
          created_at: b.createdAt || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      });
      await supabase.from("bookings").upsert(bookingPayload);
    }

    // 5. Ensure subscription is pushed
    const sub = db.subscriptions.find((s) => s.businessId === businessId);
    if (sub) {
      await pushSubscriptionToCloud(sub);
    }

    return true;
  } catch (err) {
    console.warn("[CloudSync] pushAllToCloud exception:", err);
    return false;
  }
}

/**
 * Pulls latest records (Bookings, Customers, Poojas) from Supabase into local store.
 */
export async function pullFromCloud(businessId: string): Promise<boolean> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: { state: "error", error: "இணைய இணைப்பு இல்லை (Offline)" },
        })
      );
    }
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase || !businessId) return false;

  try {
    // 1. Fetch Customers
    const { data: cloudCustomers, error: cErr } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId);

    if (cErr) {
      console.warn("[CloudSync] Customers fetch notice:", cErr.message);
    } else if (Array.isArray(cloudCustomers) && cloudCustomers.length > 0) {
      cloudCustomers.forEach((c) => {
        const mappedCust: Customer = {
          id: c.id,
          businessId: c.business_id,
          name: c.name,
          mobile: c.mobile || "",
          whatsapp: c.whatsapp || "",
          address: c.address || "",
          city: c.city || "Namakkal",
          notes: c.notes || "",
          gothram: c.gothram || "",
          nakshatram: c.nakshatram || "",
          rasi: c.rasi || "",
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        };
        const idx = db.customers.findIndex((item) => item.id === mappedCust.id);
        if (idx >= 0) {
          db.customers[idx] = { ...db.customers[idx], ...mappedCust };
        } else {
          db.customers.push(mappedCust);
        }
      });
    }

    // 2. Fetch Poojas
    const { data: cloudPoojas, error: pErr } = await supabase
      .from("poojas")
      .select("*")
      .eq("business_id", businessId);

    if (pErr) {
      console.warn("[CloudSync] Poojas fetch notice:", pErr.message);
    } else if (Array.isArray(cloudPoojas) && cloudPoojas.length > 0) {
      cloudPoojas.forEach((p) => {
        const mappedPooja: Pooja = {
          id: p.id,
          businessId: p.business_id,
          englishName: p.english_name,
          tamilName: p.tamil_name,
          description: p.description || "",
          durationMinutes: Number(p.duration_minutes || 120),
          basePrice: Number(p.base_price || 0),
          procedure: p.procedure || "",
          active: true,
          items: p.items || [],
          isCustom: Boolean(p.is_custom),
          createdAt: p.created_at,
        };
        if (isLegacyObsoletePooja(mappedPooja)) {
          return;
        }
        const idx = db.poojas.findIndex((item) => item.id === mappedPooja.id);
        if (idx >= 0) {
          db.poojas[idx] = { ...db.poojas[idx], ...mappedPooja };
        } else {
          db.poojas.push(mappedPooja);
        }
      });
    }

    // 3. Fetch Bookings
    const { data: cloudBookings, error: bErr } = await supabase
      .from("bookings")
      .select("*")
      .eq("business_id", businessId);

    if (bErr) {
      console.warn("[CloudSync] Bookings fetch notice:", bErr.message);
    } else if (Array.isArray(cloudBookings)) {
      const mapped: Booking[] = cloudBookings.map((b) => ({
        id: b.id,
        bookingNumber: b.booking_number,
        businessId: b.business_id,
        customerId: b.customer_id,
        customerName: b.customer_name,
        customerMobile: b.customer_mobile,
        customerAddress: b.customer_address,
        poojaId: b.pooja_id,
        poojaEnglishName: b.pooja_english_name,
        poojaTamilName: b.pooja_tamil_name,
        assignedIyerId: b.assigned_iyer_id,
        assignedIyerName: b.assigned_iyer_name,
        date: b.date,
        startTime: b.start_time,
        endTime: b.end_time,
        durationMinutes: b.duration_minutes,
        location: b.location,
        totalAmount: Number(b.total_amount || 0),
        advanceAmount: Number(b.advance_amount || 0),
        balanceAmount: Number(b.balance_amount || 0),
        paymentStatus: b.payment_status,
        status: b.status,
        items: b.items || [],
        notes: b.notes,
        cancellationReason: b.cancellation_reason,
        cancelledAt: b.cancelled_at,
        createdBy: b.created_by || b.assigned_iyer_name || "Priest",
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));

      // Upsert / merge cloud bookings into local store
      mapped.forEach((cb) => {
        const idx = db.bookings.findIndex((b) => b.id === cb.id);
        if (idx >= 0) {
          db.bookings[idx] = { ...db.bookings[idx], ...cb };
        } else {
          db.bookings.push(cb);
        }
      });
    }

    // 4. Fetch Subscriptions
    await pullSubscriptionFromCloud(businessId);

    db.saveToLocalStorage();
    db.notifyListeners();

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: {
            state: "synced",
            lastSyncedAt: new Date().toISOString(),
            bookingsCount: cloudBookings?.length || 0,
            customersCount: cloudCustomers?.length || 0,
          },
        })
      );
    }

    return true;
  } catch (err: any) {
    console.error("[CloudSync] Pull error:", err);
    return false;
  }
}

/**
 * Performs full bidirectional cloud synchronization (Pulls Cloud -> Local first, then Pushes Local -> Cloud).
 */
export async function syncAll(businessId: string): Promise<{ ok: boolean; message?: string; count?: number }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const error = "இணைய இணைப்பு இல்லை (Offline)";
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", { detail: { state: "error", error } })
      );
    }
    return { ok: false, message: error };
  }

  if (isSyncing) {
    return { ok: true, message: "ஒத்திசைவு நடைபெறுகிறது... (Sync in progress)" };
  }

  isSyncing = true;
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("velvi:sync-state", { detail: { state: "syncing" } }));
  }

  try {
    // 1. Pull remote records FIRST so multi-device updates appear immediately
    await pullFromCloud(businessId);

    // 2. Push any local changes up to Supabase Cloud
    await pushAllToCloud(businessId);

    const count = db.getBookings(businessId).length;

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: {
            state: "synced",
            lastSyncedAt: new Date().toISOString(),
            bookingsCount: count,
          },
        })
      );
    }

    return {
      ok: true,
      message: "மேகக்கணி ஒத்திசைவு வெற்றிகரமாக முடிந்தது! (Cloud Synced)",
      count,
    };
  } catch (err: any) {
    console.error("[CloudSync] syncAll failed:", err);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: { state: "error", error: err?.message || "ஒத்திசைவு தோல்வி" },
        })
      );
    }
    return { ok: false, message: err?.message || "ஒத்திசைவு தோல்வி" };
  } finally {
    isSyncing = false;
  }
}

/**
 * User-triggered manual retry of cloud synchronization.
 */
export async function retryCloudSync(businessId: string): Promise<{ ok: boolean; message?: string; count?: number }> {
  return await syncAll(businessId);
}

/**
 * Initializes two-way synchronization between LocalStorage and Supabase Cloud.
 */
export async function initCloudSync(businessId: string) {
  if (!isSupabaseConfigured() || !businessId) {
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  // Clean up any stale subscription channel so we subscribe to the active business channel
  if (realtimeSubscription) {
    try {
      supabase.removeChannel(realtimeSubscription);
    } catch (_) {}
    realtimeSubscription = null;
  }

  // 1. Full Initial Sync (Pull first, then push)
  try {
    await syncAll(businessId);
  } catch (err) {
    console.warn("[CloudSync] Initial sync notice:", err);
  }

  // 2. Realtime subscription: listen for updates from other devices / Super Admin
  try {
    realtimeSubscription = supabase
      .channel(`business-${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bookings",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: any) => {
          handleCloudBookingChange(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: any) => {
          handleCloudCustomerChange(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poojas",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: any) => {
          handleCloudPoojaChange(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `business_id=eq.${businessId}`,
        },
        (payload: any) => {
          handleCloudSubscriptionChange(payload);
        }
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("velvi:sync-state", {
                detail: { state: "synced", lastSyncedAt: new Date().toISOString() },
              })
            );
          }
        }
      });
  } catch (subErr) {
    console.warn("[CloudSync] Realtime subscribe notice:", subErr);
  }
}

function handleCloudBookingChange(payload: any) {
  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const b = payload.new;
    if (!b) return;
    const existingIndex = db.bookings.findIndex((item) => item.id === b.id);
    const updated: Booking = {
      id: b.id,
      bookingNumber: b.booking_number,
      businessId: b.business_id,
      customerId: b.customer_id,
      customerName: b.customer_name,
      customerMobile: b.customer_mobile,
      customerAddress: b.customer_address,
      poojaId: b.pooja_id,
      poojaEnglishName: b.pooja_english_name,
      poojaTamilName: b.pooja_tamil_name,
      assignedIyerId: b.assigned_iyer_id,
      assignedIyerName: b.assigned_iyer_name,
      date: b.date,
      startTime: b.start_time,
      endTime: b.end_time,
      durationMinutes: b.duration_minutes,
      location: b.location,
      totalAmount: Number(b.total_amount || 0),
      advanceAmount: Number(b.advance_amount || 0),
      balanceAmount: Number(b.balance_amount || 0),
      paymentStatus: b.payment_status,
      status: b.status,
      items: b.items || [],
      notes: b.notes,
      cancellationReason: b.cancellation_reason,
      cancelledAt: b.cancelled_at,
      createdBy: b.created_by || b.assigned_iyer_name || "Priest",
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };

    if (existingIndex >= 0) {
      db.bookings[existingIndex] = updated;
    } else {
      db.bookings.unshift(updated);
    }
    db.saveToLocalStorage();
    db.notifyListeners();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: { state: "synced", lastSyncedAt: new Date().toISOString() },
        })
      );
    }
  } else if (payload.eventType === "DELETE") {
    const oldId = payload.old?.id;
    if (oldId) {
      db.bookings = db.bookings.filter((b) => b.id !== oldId);
      db.saveToLocalStorage();
      db.notifyListeners();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("velvi:sync-state", {
            detail: { state: "synced", lastSyncedAt: new Date().toISOString() },
          })
        );
      }
    }
  }
}

function handleCloudCustomerChange(payload: any) {
  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const c = payload.new;
    if (!c) return;
    const existingIndex = db.customers.findIndex((item) => item.id === c.id);
    const updated: Customer = {
      id: c.id,
      businessId: c.business_id,
      name: c.name,
      mobile: c.mobile || "",
      whatsapp: c.whatsapp || "",
      address: c.address || "",
      city: c.city || "Namakkal",
      notes: c.notes || "",
      gothram: c.gothram || "",
      nakshatram: c.nakshatram || "",
      rasi: c.rasi || "",
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };

    if (existingIndex >= 0) {
      db.customers[existingIndex] = updated;
    } else {
      db.customers.unshift(updated);
    }
    db.saveToLocalStorage();
    db.notifyListeners();
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", {
          detail: { state: "synced", lastSyncedAt: new Date().toISOString() },
        })
      );
    }
  } else if (payload.eventType === "DELETE") {
    const oldId = payload.old?.id;
    if (oldId) {
      db.customers = db.customers.filter((c) => c.id !== oldId);
      db.saveToLocalStorage();
      db.notifyListeners();
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("velvi:sync-state", {
            detail: { state: "synced", lastSyncedAt: new Date().toISOString() },
          })
        );
      }
    }
  }
}

function handleCloudPoojaChange(payload: any) {
  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const p = payload.new;
    if (!p) return;
    const existingIndex = db.poojas.findIndex((item) => item.id === p.id);
    const updated: Pooja = {
      id: p.id,
      businessId: p.business_id,
      englishName: p.english_name,
      tamilName: p.tamil_name,
      description: p.description || "",
      durationMinutes: Number(p.duration_minutes || 120),
      basePrice: Number(p.base_price || 0),
      procedure: p.procedure || "",
      active: true,
      items: p.items || [],
      isCustom: Boolean(p.is_custom),
      createdAt: p.created_at,
    };

    if (isLegacyObsoletePooja(updated)) {
      return;
    }

    if (existingIndex >= 0) {
      db.poojas[existingIndex] = updated;
    } else {
      db.poojas.unshift(updated);
    }
    db.saveToLocalStorage();
    db.notifyListeners();
  } else if (payload.eventType === "DELETE") {
    const oldId = payload.old?.id;
    if (oldId) {
      db.poojas = db.poojas.filter((p) => p.id !== oldId);
      db.saveToLocalStorage();
      db.notifyListeners();
    }
  }
}

function handleCloudSubscriptionChange(payload: any) {
  if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
    const s = payload.new;
    if (!s) return;
    const mapped: Subscription = {
      id: s.id,
      businessId: s.business_id,
      planName: s.plan_name || "Velvi Pro",
      planCode: s.plan_code || "VELVI_PRO",
      status: s.status || "ACTIVE",
      trialStart: s.trial_start,
      trialEnd: s.trial_end,
      currentPeriodStart: s.current_period_start,
      currentPeriodEnd: s.current_period_end,
      billingCycle: s.billing_cycle || "MONTHLY",
      autoRenew: Boolean(s.auto_renew),
      createdAt: s.created_at || s.current_period_start,
      updatedAt: s.updated_at || new Date().toISOString(),
    };

    const existingIndex = db.subscriptions.findIndex((sub) => sub.businessId === mapped.businessId);
    if (existingIndex >= 0) {
      db.subscriptions[existingIndex] = mapped;
    } else {
      db.subscriptions.push(mapped);
    }
    db.saveToLocalStorage();
    db.notifyListeners();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("velvi:db-change"));
    }
  }
}

/**
 * SUPER ADMIN: Pulls all live real records (Users, Businesses, Subscriptions, Bookings) from Supabase Cloud.
 */
export async function syncSuperAdminDirectoryFromCloud(): Promise<{
  success: boolean;
  usersCount: number;
  businessesCount: number;
  subscriptionsCount: number;
  bookingsCount: number;
  error?: string;
}> {
  // Strategy 1: Server-Side Direct DB Query (Bypasses client-side RLS, adblockers, mobile network firewalls)
  if (typeof window !== "undefined") {
    try {
      const res = await fetch("/api/admin/directory", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.users)) {
          // 1. Process Users
          data.users.forEach((cu: any) => {
            const isMock =
              cu.id === "u-ravi-iyer-01" ||
              cu.email?.trim().toLowerCase() === "ravi.iyer@gmail.com" ||
              cu.id.startsWith("u-demo-");
            if (isMock) return;

            const mappedUser: User = {
              id: cu.id,
              googleId: cu.google_id || undefined,
              email: cu.email,
              name: cu.name,
              avatarUrl: cu.avatar_url || undefined,
              mobile: cu.mobile || "",
              mobileVerified: Boolean(cu.mobile_verified),
              role: cu.role,
              referralCode: cu.referral_code || undefined,
              createdAt: cu.created_at,
              registrationIp: cu.registration_ip || undefined,
              lastLoginIp: cu.last_login_ip || undefined,
              registrationCity: cu.registration_city || undefined,
              registrationCountry: cu.registration_country || undefined,
              lastLoginCity: cu.last_login_city || undefined,
              lastLoginCountry: cu.last_login_country || undefined,
            };
            const uIdx = db.users.findIndex(
              (u) =>
                u.id === mappedUser.id ||
                (u.email && mappedUser.email && u.email.trim().toLowerCase() === mappedUser.email.trim().toLowerCase())
            );
            if (uIdx >= 0) {
              db.users[uIdx] = { ...db.users[uIdx], ...mappedUser };
            } else {
              db.users.push(mappedUser);
            }
          });

          // 2. Process Businesses
          if (Array.isArray(data.businesses)) {
            data.businesses.forEach((cb: any) => {
              const mappedBiz: Business = {
                id: cb.id,
                ownerId: cb.owner_id,
                name: cb.name,
                serviceName: cb.service_name || undefined,
                iyerName: cb.iyer_name || undefined,
                logoUrl: cb.logo_url || undefined,
                phone: cb.phone || "",
                whatsapp: cb.whatsapp || undefined,
                address: cb.address || undefined,
                showWatermark: cb.show_watermark ?? true,
                createdAt: cb.created_at,
              };
              const bIdx = db.businesses.findIndex((b) => b.id === mappedBiz.id);
              if (bIdx >= 0) {
                db.businesses[bIdx] = { ...db.businesses[bIdx], ...mappedBiz };
              } else {
                db.businesses.push(mappedBiz);
              }
            });
          }

          // 3. Process Subscriptions
          if (Array.isArray(data.subscriptions)) {
            data.subscriptions.forEach((cs: any) => {
              const mappedSub: Subscription = {
                id: cs.id,
                businessId: cs.business_id,
                planName: cs.plan_name || "Velvi Pro",
                planCode: cs.plan_code || "VELVI_PRO",
                status: cs.status || "ACTIVE",
                trialStart: cs.trial_start,
                trialEnd: cs.trial_end,
                currentPeriodStart: cs.current_period_start,
                currentPeriodEnd: cs.current_period_end,
                billingCycle: cs.billing_cycle || "MONTHLY",
                autoRenew: Boolean(cs.auto_renew),
                createdAt: cs.created_at || cs.current_period_start,
                updatedAt: cs.updated_at || new Date().toISOString(),
              };
              const subIdx = db.subscriptions.findIndex((s) => s.businessId === mappedSub.businessId);
              if (subIdx >= 0) {
                const existingSub = db.subscriptions[subIdx];
                const existingTime = existingSub.currentPeriodEnd ? new Date(existingSub.currentPeriodEnd).getTime() : 0;
                const cloudTime = mappedSub.currentPeriodEnd ? new Date(mappedSub.currentPeriodEnd).getTime() : 0;
                const bestPeriodEnd = Math.max(existingTime, cloudTime) > 0
                  ? new Date(Math.max(existingTime, cloudTime)).toISOString()
                  : (mappedSub.currentPeriodEnd || existingSub.currentPeriodEnd);
                const bestStatus = (Math.max(existingTime, cloudTime) > Date.now() || existingSub.status === "ACTIVE" || mappedSub.status === "ACTIVE")
                  ? "ACTIVE"
                  : mappedSub.status;
                db.subscriptions[subIdx] = {
                  ...existingSub,
                  ...mappedSub,
                  currentPeriodEnd: bestPeriodEnd,
                  status: bestStatus,
                };
                if (existingTime > cloudTime) {
                  pushSubscriptionToCloud(db.subscriptions[subIdx]).catch(() => {});
                }
              } else {
                db.subscriptions.push(mappedSub);
              }
            });
          }

          // 4. Process Bookings
          if (Array.isArray(data.bookings)) {
            data.bookings.forEach((b: any) => {
              const mappedBooking: Booking = {
                id: b.id,
                bookingNumber: b.booking_number,
                businessId: b.business_id,
                customerId: b.customer_id,
                customerName: b.customer_name || "Devotee",
                customerMobile: b.customer_mobile || "",
                customerAddress: b.customer_address || "",
                poojaId: b.pooja_id,
                poojaEnglishName: b.pooja_english_name || "",
                poojaTamilName: b.pooja_tamil_name || "",
                assignedIyerId: b.assigned_iyer_id,
                assignedIyerName: b.assigned_iyer_name || "",
                date: b.date,
                startTime: b.start_time,
                endTime: b.end_time,
                durationMinutes: b.duration_minutes,
                location: b.location,
                totalAmount: Number(b.total_amount || 0),
                advanceAmount: Number(b.advance_amount || 0),
                balanceAmount: Number(b.balance_amount || 0),
                paymentStatus: b.payment_status,
                status: b.status,
                items: b.items || [],
                notes: b.notes,
                cancellationReason: b.cancellation_reason,
                cancelledAt: b.cancelled_at,
                createdBy: b.created_by || b.assigned_iyer_name || "Organizer",
                createdAt: b.created_at,
                updatedAt: b.updated_at,
              };
              const bkIdx = db.bookings.findIndex((bk) => bk.id === mappedBooking.id);
              if (bkIdx >= 0) {
                db.bookings[bkIdx] = { ...db.bookings[bkIdx], ...mappedBooking };
              } else {
                db.bookings.push(mappedBooking);
              }
            });
          }

          db.purgeLegacyDummyData();
          db.saveToLocalStorage();
          db.notifyListeners();
          window.dispatchEvent(new CustomEvent("velvi:db-change"));

          return {
            success: true,
            usersCount: data.users.length,
            businessesCount: data.businesses?.length || 0,
            subscriptionsCount: data.subscriptions?.length || 0,
            bookingsCount: data.bookings?.length || 0,
          };
        }
      }
    } catch (apiErr) {
      console.warn("[SuperAdminCloudSync] Server API directory fetch fallback:", apiErr);
    }
  }

  // Strategy 2: Fallback to Supabase JS Client
  const supabase = getSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      usersCount: 0,
      businessesCount: 0,
      subscriptionsCount: 0,
      bookingsCount: 0,
      error: "Supabase not configured",
    };
  }

  try {
    // 1. Fetch Users
    const { data: cloudUsers, error: uErr } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (uErr) console.warn("[SuperAdminCloudSync] Users fetch warning:", uErr.message);

    if (Array.isArray(cloudUsers)) {
      cloudUsers.forEach((cu) => {
        const mappedUser: User = {
          id: cu.id,
          googleId: cu.google_id || undefined,
          email: cu.email,
          name: cu.name,
          avatarUrl: cu.avatar_url || undefined,
          mobile: cu.mobile || "",
          mobileVerified: Boolean(cu.mobile_verified),
          role: cu.role,
          referralCode: cu.referral_code || undefined,
          createdAt: cu.created_at,
          registrationIp: cu.registration_ip || undefined,
          lastLoginIp: cu.last_login_ip || undefined,
          registrationCity: cu.registration_city || undefined,
          registrationCountry: cu.registration_country || undefined,
          lastLoginCity: cu.last_login_city || undefined,
          lastLoginCountry: cu.last_login_country || undefined,
        };
        const uIdx = db.users.findIndex(
          (u) =>
            u.id === mappedUser.id ||
            (u.email && mappedUser.email && u.email.trim().toLowerCase() === mappedUser.email.trim().toLowerCase())
        );
        if (uIdx >= 0) {
          db.users[uIdx] = { ...db.users[uIdx], ...mappedUser };
        } else {
          db.users.push(mappedUser);
        }
      });
    }

    // 2. Fetch Businesses
    const { data: cloudBiz, error: bErr } = await supabase
      .from("businesses")
      .select("*");

    if (bErr) console.warn("[SuperAdminCloudSync] Businesses fetch warning:", bErr.message);

    if (Array.isArray(cloudBiz)) {
      cloudBiz.forEach((cb) => {
        const mappedBiz: Business = {
          id: cb.id,
          ownerId: cb.owner_id,
          name: cb.name,
          serviceName: cb.service_name || undefined,
          iyerName: cb.iyer_name || undefined,
          logoUrl: cb.logo_url || undefined,
          phone: cb.phone || "",
          whatsapp: cb.whatsapp || undefined,
          address: cb.address || undefined,
          showWatermark: cb.show_watermark ?? true,
          createdAt: cb.created_at,
        };
        const bIdx = db.businesses.findIndex((b) => b.id === mappedBiz.id);
        if (bIdx >= 0) {
          db.businesses[bIdx] = { ...db.businesses[bIdx], ...mappedBiz };
        } else {
          db.businesses.push(mappedBiz);
        }
      });
    }

    // 3. Fetch Subscriptions
    const { data: cloudSubs, error: sErr } = await supabase
      .from("subscriptions")
      .select("*");

    if (sErr) console.warn("[SuperAdminCloudSync] Subscriptions fetch warning:", sErr.message);

    if (Array.isArray(cloudSubs)) {
      cloudSubs.forEach((cs) => {
        const mappedSub: Subscription = {
          id: cs.id,
          businessId: cs.business_id,
          planName: cs.plan_name || "Velvi Pro",
          planCode: cs.plan_code || "VELVI_PRO",
          status: cs.status || "ACTIVE",
          trialStart: cs.trial_start,
          trialEnd: cs.trial_end,
          currentPeriodStart: cs.current_period_start,
          currentPeriodEnd: cs.current_period_end,
          billingCycle: cs.billing_cycle || "MONTHLY",
          autoRenew: Boolean(cs.auto_renew),
          createdAt: cs.created_at || cs.current_period_start,
          updatedAt: cs.updated_at || new Date().toISOString(),
        };
        const subIdx = db.subscriptions.findIndex((s) => s.businessId === mappedSub.businessId);
        if (subIdx >= 0) {
          const existingSub = db.subscriptions[subIdx];
          const existingTime = existingSub.currentPeriodEnd ? new Date(existingSub.currentPeriodEnd).getTime() : 0;
          const cloudTime = mappedSub.currentPeriodEnd ? new Date(mappedSub.currentPeriodEnd).getTime() : 0;
          const bestPeriodEnd = Math.max(existingTime, cloudTime) > 0
            ? new Date(Math.max(existingTime, cloudTime)).toISOString()
            : (mappedSub.currentPeriodEnd || existingSub.currentPeriodEnd);
          const bestStatus = (Math.max(existingTime, cloudTime) > Date.now() || existingSub.status === "ACTIVE" || mappedSub.status === "ACTIVE")
            ? "ACTIVE"
            : mappedSub.status;
          db.subscriptions[subIdx] = {
            ...existingSub,
            ...mappedSub,
            currentPeriodEnd: bestPeriodEnd,
            status: bestStatus,
          };
          if (existingTime > cloudTime) {
            pushSubscriptionToCloud(db.subscriptions[subIdx]).catch(() => {});
          }
        } else {
          db.subscriptions.push(mappedSub);
        }
      });
    }

    // 4. Fetch Bookings
    const { data: cloudBookings, error: bkErr } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (bkErr) console.warn("[SuperAdminCloudSync] Bookings fetch warning:", bkErr.message);

    if (Array.isArray(cloudBookings)) {
      cloudBookings.forEach((b) => {
        const mappedBooking: Booking = {
          id: b.id,
          bookingNumber: b.booking_number,
          businessId: b.business_id,
          customerId: b.customer_id,
          customerName: b.customer_name,
          customerMobile: b.customer_mobile,
          customerAddress: b.customer_address,
          poojaId: b.pooja_id,
          poojaEnglishName: b.pooja_english_name,
          poojaTamilName: b.pooja_tamil_name,
          assignedIyerId: b.assigned_iyer_id,
          assignedIyerName: b.assigned_iyer_name,
          date: b.date,
          startTime: b.start_time,
          endTime: b.end_time,
          durationMinutes: b.duration_minutes,
          location: b.location,
          totalAmount: Number(b.total_amount || 0),
          advanceAmount: Number(b.advance_amount || 0),
          balanceAmount: Number(b.balance_amount || 0),
          paymentStatus: b.payment_status,
          status: b.status,
          items: b.items || [],
          notes: b.notes,
          cancellationReason: b.cancellation_reason,
          cancelledAt: b.cancelled_at,
          createdBy: b.created_by || b.assigned_iyer_name || "Organizer",
          createdAt: b.created_at,
          updatedAt: b.updated_at,
        };
        const bkIdx = db.bookings.findIndex((bk) => bk.id === mappedBooking.id);
        if (bkIdx >= 0) {
          db.bookings[bkIdx] = { ...db.bookings[bkIdx], ...mappedBooking };
        } else {
          db.bookings.push(mappedBooking);
        }
      });
    }

    db.saveToLocalStorage();
    db.notifyListeners();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("velvi:db-change"));
    }

    return {
      success: true,
      usersCount: cloudUsers?.length || 0,
      businessesCount: cloudBiz?.length || 0,
      subscriptionsCount: cloudSubs?.length || 0,
      bookingsCount: cloudBookings?.length || 0,
    };
  } catch (err: any) {
    console.error("[SuperAdminCloudSync] Full sync error:", err);
    return {
      success: false,
      usersCount: 0,
      businessesCount: 0,
      subscriptionsCount: 0,
      bookingsCount: 0,
      error: err?.message,
    };
  }
}

let superAdminChannel: any = null;

export function initSuperAdminRealtimeSync(onUpdate?: () => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return () => {};

  if (superAdminChannel) {
    try {
      supabase.removeChannel(superAdminChannel);
    } catch (_) {}
    superAdminChannel = null;
  }

  try {
    superAdminChannel = supabase
      .channel("super-admin-global-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users" },
        (payload: any) => {
          if (payload.new) {
            const cu = payload.new;
            const mappedUser: User = {
              id: cu.id,
              googleId: cu.google_id || undefined,
              email: cu.email,
              name: cu.name,
              avatarUrl: cu.avatar_url || undefined,
              mobile: cu.mobile || "",
              mobileVerified: Boolean(cu.mobile_verified),
              role: cu.role,
              referralCode: cu.referral_code || undefined,
              createdAt: cu.created_at,
            };
            const idx = db.users.findIndex(
              (u) =>
                u.id === mappedUser.id ||
                (u.email && mappedUser.email && u.email.trim().toLowerCase() === mappedUser.email.trim().toLowerCase())
            );
            if (idx >= 0) {
              db.users[idx] = { ...db.users[idx], ...mappedUser };
            } else {
              db.users.unshift(mappedUser);
            }
            db.saveToLocalStorage();
            db.notifyListeners();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("velvi:db-change"));
            }
            if (onUpdate) onUpdate();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "businesses" },
        (payload: any) => {
          if (payload.new) {
            const cb = payload.new;
            const mappedBiz: Business = {
              id: cb.id,
              ownerId: cb.owner_id,
              name: cb.name,
              serviceName: cb.service_name || undefined,
              iyerName: cb.iyer_name || undefined,
              logoUrl: cb.logo_url || undefined,
              phone: cb.phone || "",
              whatsapp: cb.whatsapp || undefined,
              address: cb.address || undefined,
              showWatermark: cb.show_watermark ?? true,
              createdAt: cb.created_at,
            };
            const idx = db.businesses.findIndex((b) => b.id === mappedBiz.id);
            if (idx >= 0) {
              db.businesses[idx] = { ...db.businesses[idx], ...mappedBiz };
            } else {
              db.businesses.unshift(mappedBiz);
            }
            db.saveToLocalStorage();
            db.notifyListeners();
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("velvi:db-change"));
            }
            if (onUpdate) onUpdate();
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions" },
        (payload: any) => {
          handleCloudSubscriptionChange(payload);
          if (onUpdate) onUpdate();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        (payload: any) => {
          handleCloudBookingChange(payload);
          if (onUpdate) onUpdate();
        }
      )
      .subscribe();

    return () => {
      if (superAdminChannel) {
        supabase.removeChannel(superAdminChannel);
        superAdminChannel = null;
      }
    };
  } catch (e) {
    console.warn("[SuperAdminRealtime] Channel subscription warning:", e);
    return () => {};
  }
}

/**
 * Push a new coupon to cloud database via /api/admin/coupons
 */
export async function pushCouponToCloud(coupon: Coupon): Promise<boolean> {
  if (!coupon || typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    if (!res.ok) {
      const putRes = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(coupon),
      });
      return putRes.ok;
    }
    return true;
  } catch (err) {
    console.warn("[CloudSync] pushCouponToCloud error:", err);
    return false;
  }
}

/**
 * Update an existing coupon in cloud database
 */
export async function updateCouponInCloud(coupon: Partial<Coupon> & { id: string }): Promise<boolean> {
  if (!coupon || !coupon.id || typeof window === "undefined") return false;
  try {
    const res = await fetch("/api/admin/coupons", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coupon),
    });
    return res.ok;
  } catch (err) {
    console.warn("[CloudSync] updateCouponInCloud error:", err);
    return false;
  }
}

/**
 * Delete a coupon from cloud database
 */
export async function deleteCouponFromCloud(couponId: string): Promise<boolean> {
  if (!couponId || typeof window === "undefined") return false;
  try {
    const res = await fetch(`/api/admin/coupons?id=${encodeURIComponent(couponId)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch (err) {
    console.warn("[CloudSync] deleteCouponFromCloud error:", err);
    return false;
  }
}

/**
 * Fetch all coupons from cloud database
 */
export async function fetchCouponsFromCloud(): Promise<Coupon[] | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/api/admin/coupons", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && Array.isArray(data.coupons)) {
      return data.coupons;
    }
    return null;
  } catch (err) {
    console.warn("[CloudSync] fetchCouponsFromCloud error:", err);
    return null;
  }
}



