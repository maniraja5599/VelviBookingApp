import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: NextRequest) {
  try {
    const { userId, adminEmail } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    if (!adminEmail || adminEmail.trim().toLowerCase() !== "manirajankg@gmail.com") {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Super Admin authorization required" },
        { status: 403 }
      );
    }

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({
        success: true,
        message: "User deleted locally (DATABASE_URL not configured for cloud)",
      });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    try {
      // Find businesses owned by user
      const bizRes = await client.query(
        "SELECT id FROM businesses WHERE owner_id = $1",
        [userId]
      );
      const bizIds = bizRes.rows.map((r: any) => r.id);

      if (bizIds.length > 0) {
        // Delete bookings
        await client.query("DELETE FROM bookings WHERE business_id = ANY($1)", [bizIds]);
        // Delete subscriptions
        await client.query("DELETE FROM subscriptions WHERE business_id = ANY($1)", [bizIds]);
        // Delete customers
        await client.query("DELETE FROM customers WHERE business_id = ANY($1)", [bizIds]);
        // Delete payments
        await client.query("DELETE FROM payments WHERE business_id = ANY($1)", [bizIds]);
        // Delete businesses
        await client.query("DELETE FROM businesses WHERE id = ANY($1)", [bizIds]);
      }

      // Also clean up any direct user records
      await client.query("DELETE FROM payments WHERE user_id = $1", [userId]);
      await client.query("DELETE FROM bookings WHERE assigned_iyer_id = $1", [userId]);
      await client.query("DELETE FROM users WHERE id = $1 AND email != 'manirajankg@gmail.com'", [userId]);

      return NextResponse.json({
        success: true,
        message: `User ${userId} and all related records permanently removed from cloud database.`,
      });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err: any) {
    console.error("[API delete-user] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}
