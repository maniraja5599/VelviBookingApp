import { getSupabaseClient, isSupabaseConfigured } from "./client";
import { db } from "@/lib/db/store";
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
 * Pulls latest records from Supabase into local store.
 */
export async function pullFromCloud(businessId: string): Promise<boolean> {
  const supabase = getSupabaseClient();
  if (!supabase || isSyncing) return false;

  isSyncing = true;
  try {
    // Fetch bookings
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
      db.saveToLocalStorage();
      db.notifyListeners();
    }

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
  }
}
