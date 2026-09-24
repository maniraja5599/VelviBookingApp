import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { db, isLegacyObsoletePooja } from "@/lib/db/store";
import { Booking, Customer, Pooja, Business, User } from "@/lib/types";

let isSyncing = false;
let realtimeSubscription: any = null;

/**
 * Pushes a user profile up to Supabase.
 */
export async function pushUserToCloud(user: User): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || !user) return false;

  try {
    const validRole = ["SUPER_ADMIN", "OWNER", "IYER", "STAFF"].includes(user.role as any)
      ? user.role
      : "OWNER";

    const payload = {
      id: user.id,
      google_id: user.googleId || null,
      email: user.email || `${user.id}@velvi.app`,
      name: user.name || "Priest",
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
  const supabase = getSupabaseClient();
  if (!supabase || !business) return false;

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
  if (!supabase) return false;

  try {
    // 1. Business & User Profile
    const biz = db.businesses.find((b) => b.id === businessId) || db.businesses[0];
    if (biz) {
      await pushBusinessToCloud(biz);
    }

    // 2. Customers
    const customers = db.customers.filter((c) => c.businessId === businessId);
    for (const c of customers) {
      await pushCustomerToCloud(c);
    }

    // 3. Poojas
    const poojas = db.poojas.filter(
      (p) => p.businessId === businessId && !isLegacyObsoletePooja(p)
    );
    for (const p of poojas) {
      await pushPoojaToCloud(p);
    }

    // 4. Bookings
    const bookings = db.bookings.filter((b) => b.businessId === businessId);
    for (const b of bookings) {
      await pushBookingToCloud(b);
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
  if (!supabase) return false;

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
    } else if (Array.isArray(cloudBookings) && cloudBookings.length > 0) {
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

      mapped.forEach((cb) => {
        const idx = db.bookings.findIndex((b) => b.id === cb.id);
        if (idx >= 0) {
          db.bookings[idx] = { ...db.bookings[idx], ...cb };
        } else {
          db.bookings.push(cb);
        }
      });
    }

    db.saveToLocalStorage();
    db.notifyListeners();
    return true;
  } catch (err: any) {
    console.error("[CloudSync] Pull error:", err);
    return false;
  }
}

/**
 * Performs full bidirectional cloud synchronization (Push Local -> Cloud, then Pull Cloud -> Local).
 */
export async function syncAll(businessId: string): Promise<{ ok: boolean; message?: string }> {
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
    // 1. Push local changes up to Supabase Cloud
    await pushAllToCloud(businessId);

    // 2. Pull remote records down from Supabase Cloud
    await pullFromCloud(businessId);

    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("velvi:sync-state", { detail: { state: "synced" } })
      );
    }

    return {
      ok: true,
      message: "மேகக்கணி ஒத்திசைவு வெற்றிகரமாக முடிந்தது! (Cloud Synced)",
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
export async function retryCloudSync(businessId: string): Promise<{ ok: boolean; message?: string }> {
  return await syncAll(businessId);
}

/**
 * Initializes two-way synchronization between LocalStorage and Supabase Cloud.
 */
export async function initCloudSync(businessId: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  // 1. Full Initial Sync (Push local records + Pull cloud records)
  try {
    await syncAll(businessId);
  } catch (err) {
    console.warn("[CloudSync] Initial sync notice:", err);
  }

  // 2. Realtime subscription: listen for updates from other devices / Super Admin
  if (!realtimeSubscription) {
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
        .subscribe();
    } catch (subErr) {
      console.warn("[CloudSync] Realtime subscribe notice:", subErr);
    }
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
  } else if (payload.eventType === "DELETE") {
    const oldId = payload.old?.id;
    if (oldId) {
      db.bookings = db.bookings.filter((b) => b.id !== oldId);
      db.saveToLocalStorage();
      db.notifyListeners();
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
  } else if (payload.eventType === "DELETE") {
    const oldId = payload.old?.id;
    if (oldId) {
      db.customers = db.customers.filter((c) => c.id !== oldId);
      db.saveToLocalStorage();
      db.notifyListeners();
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
