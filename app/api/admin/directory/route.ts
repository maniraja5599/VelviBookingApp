import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    return NextResponse.json(
      { success: false, error: "DATABASE_URL not configured." },
      { status: 500 }
    );
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();

    // 1. Fetch Users
    const usersRes = await client.query(
      `SELECT id, google_id, email, name, avatar_url, mobile, mobile_verified, role, referral_code, created_at, updated_at
       FROM users
       ORDER BY created_at DESC`
    );

    // 2. Fetch Businesses
    const bizRes = await client.query(
      `SELECT id, owner_id, name, service_name, iyer_name, logo_url, phone, whatsapp, address, show_watermark, created_at, updated_at
       FROM businesses
       ORDER BY created_at DESC`
    );

    // 3. Fetch Subscriptions
    const subsRes = await client.query(
      `SELECT id, business_id, plan_name, plan_code, status, trial_start, trial_end, current_period_start, current_period_end, billing_cycle, auto_renew, created_at, updated_at
       FROM subscriptions`
    );

    // 4. Fetch Bookings
    const bookingsRes = await client.query(
      `SELECT id, booking_number, business_id, customer_id, pooja_id, assigned_iyer_id, date, start_time, end_time, duration_minutes, location, status, total_amount, advance_amount, balance_amount, payment_status, notes, created_by, created_at, updated_at
       FROM bookings
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      success: true,
      users: usersRes.rows,
      businesses: bizRes.rows,
      subscriptions: subsRes.rows,
      bookings: bookingsRes.rows,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[API /api/admin/directory] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to query database." },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
