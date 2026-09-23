import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { db, isLegacyObsoletePooja } from "@/lib/db/store";
import { Booking, Customer, Pooja, Payment } from "@/lib/types";

let isSyncing = false;
let realtimeSubscription: any = null;

/**
 * Initializes two-way synchronization between LocalStorage and Supabase Cloud.
 */
export async function initCloudSync(businessId: string) {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = getSupabaseClient();
  if (!supabase) return;

  // 1. Initial Pull: sync cloud data down into local store if present
  try {
    await pullFromCloud(businessId);
  } catch (err) {
    console.warn("[CloudSync] Initial pull failed, using local store:", err);
  }

  // 2. Realtime subscription: listen for updates from other phones/devices
  if (!realtimeSubscription) {
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
          table: "payments",
          filter: `business_id=eq.${businessId}`,
        },
        () => {
          pullFromCloud(businessId);
        }
      )
      .subscribe();
  }
}

/**
 * Pulls latest records (Bookings, Customers, Poojas) from Supabase into local store.
 */
export async function pullFromCloud(businessId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || isSyncing) return false;

  isSyncing = true;
  try {
    // 1. Fetch Customers
    const { data: cloudCustomers, error: cErr } = await supabase
      .from("customers")
      .select("*")
      .eq("business_id", businessId);

    if (!cErr && Array.isArray(cloudCustomers) && cloudCustomers.length > 0) {
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

    if (!pErr && Array.isArray(cloudPoojas) && cloudPoojas.length > 0) {
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

    if (!bErr && Array.isArray(cloudBookings) && cloudBookings.length > 0) {
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
        createdBy: b.created_by || b.assigned_iyer_name || "Priest",
        createdAt: b.created_at,
        updatedAt: b.updated_at,
      }));

      // Merge cloud bookings into local store
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
  } catch (err) {
    console.error("[CloudSync] Pull error:", err);
    return false;
  } finally {
    isSyncing = false;
  }
}

/**
 * Pushes a single booking change up to Supabase.
 */
export async function pushBookingToCloud(booking: Booking): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: booking.id,
      booking_number: booking.bookingNumber,
      business_id: booking.businessId,
      customer_id: booking.customerId,
      customer_name: booking.customerName,
      customer_mobile: booking.customerMobile,
      customer_address: booking.customerAddress,
      pooja_id: booking.poojaId,
      pooja_english_name: booking.poojaEnglishName,
      pooja_tamil_name: booking.poojaTamilName,
      assigned_iyer_id: booking.assignedIyerId,
      assigned_iyer_name: booking.assignedIyerName,
      date: booking.date,
      start_time: booking.startTime,
      end_time: booking.endTime,
      duration_minutes: booking.durationMinutes,
      location: booking.location,
      total_amount: booking.totalAmount,
      advance_amount: booking.advanceAmount,
      balance_amount: booking.balanceAmount,
      payment_status: booking.paymentStatus,
      status: booking.status,
      items: booking.items || [],
      notes: booking.notes,
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
 * Pushes a customer record up to Supabase.
 */
export async function pushCustomerToCloud(customer: Customer): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase) return false;

  try {
    const payload = {
      id: customer.id,
      business_id: customer.businessId,
      name: customer.name,
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
  if (!supabase) return false;

  try {
    const payload = {
      id: pooja.id,
      business_id: pooja.businessId,
      english_name: pooja.englishName,
      tamil_name: pooja.tamilName,
      description: pooja.description || null,
      duration_minutes: pooja.durationMinutes || 120,
      base_price: pooja.basePrice || 0,
      procedure: pooja.procedure || null,
      items: pooja.items || [],
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
