import { NextResponse } from "next/server";
import { Client } from "pg";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const adminEmail = (body.adminEmail || "manirajankg@gmail.com").trim().toLowerCase();

    if (adminEmail !== "manirajankg@gmail.com" && adminEmail !== "admin@velvi.app") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Super Admin access required." },
        { status: 403 }
      );
    }

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
    await client.connect();

    try {
      await client.query("BEGIN");

      // 1. Identify Super Admin user
      const superAdminRes = await client.query(
        `SELECT id, email, name FROM users WHERE LOWER(TRIM(email)) = 'manirajankg@gmail.com'`
      );
      let superAdminId: string;
      if (superAdminRes.rows.length > 0) {
        superAdminId = superAdminRes.rows[0].id;
      } else {
        superAdminId = "u-super-admin-01";
        await client.query(
          `INSERT INTO users (id, email, name, role, mobile, mobile_verified, referral_code)
           VALUES ($1, 'manirajankg@gmail.com', 'Mani Raja', 'SUPER_ADMIN', '+918300030123', true, 'VELVI-MANI-DEV')`,
          [superAdminId]
        );
      }

      await client.query(`UPDATE users SET role = 'SUPER_ADMIN' WHERE id = $1`, [superAdminId]);

      // 2. Identify Super Admin's business
      const saBizRes = await client.query(
        `SELECT id FROM businesses WHERE owner_id = $1`,
        [superAdminId]
      );
      let saBizId: string = saBizRes.rows.length > 0 ? saBizRes.rows[0].id : "biz-super-admin-01";

      if (saBizRes.rows.length === 0) {
        await client.query(
          `INSERT INTO businesses (id, owner_id, name, service_name, iyer_name, phone, whatsapp, address, show_watermark)
           VALUES ($1, $2, 'Velvi Admin Services', 'Pooja • Homam • Seva', 'Mani Raja', '+918300030123', '+918300030123', 'Tamil Nadu, India', false)`,
          [saBizId, superAdminId]
        );
      }

      // Check existing tables
      const tablesRes = await client.query(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      const existingTables = new Set(tablesRes.rows.map((r: any) => r.table_name));

      // Reset Collections
      if (existingTables.has("bookings")) {
        await client.query(`DELETE FROM bookings WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("pooja_items")) {
        await client.query(
          `DELETE FROM pooja_items WHERE pooja_id IN (SELECT id FROM poojas WHERE business_id != $1)`,
          [saBizId]
        );
      }
      if (existingTables.has("poojas")) {
        await client.query(`DELETE FROM poojas WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("customers")) {
        await client.query(`DELETE FROM customers WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("iyer_settlements")) {
        await client.query(`DELETE FROM iyer_settlements WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("subscription_events")) {
        await client.query(`DELETE FROM subscription_events WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("branding_settings")) {
        await client.query(`DELETE FROM branding_settings WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("business_members")) {
        await client.query(`DELETE FROM business_members WHERE business_id != $1`, [saBizId]);
      }
      if (existingTables.has("subscriptions")) {
        await client.query(`DELETE FROM subscriptions WHERE business_id != $1`, [saBizId]);
        const subExists = await client.query(
          `SELECT id FROM subscriptions WHERE business_id = $1`,
          [saBizId]
        );
        if (subExists.rows.length === 0) {
          await client.query(
            `INSERT INTO subscriptions (id, business_id, plan_name, plan_code, status, trial_start, trial_end, current_period_start, current_period_end, billing_cycle, auto_renew)
             VALUES ('sub-super-admin-01', $1, 'Velvi Lifetime Pro', 'VELVI_PRO', 'ACTIVE', NOW(), NOW() + INTERVAL '10 years', NOW(), NOW() + INTERVAL '10 years', 'YEARLY', true)`,
            [saBizId]
          );
        } else {
          await client.query(
            `UPDATE subscriptions 
             SET plan_name = 'Velvi Lifetime Pro', plan_code = 'VELVI_PRO', status = 'ACTIVE', current_period_end = NOW() + INTERVAL '10 years'
             WHERE business_id = $1`,
            [saBizId]
          );
        }
      }

      // Delete non-superadmin businesses
      if (existingTables.has("businesses")) {
        await client.query(
          `DELETE FROM businesses WHERE id != $1 AND owner_id != $2`,
          [saBizId, superAdminId]
        );
      }

      // Delete non-superadmin users
      if (existingTables.has("users")) {
        await client.query(`DELETE FROM users WHERE id != $1`, [superAdminId]);
      }

      await client.query("COMMIT");

      return NextResponse.json({
        success: true,
        message: "All non-super-admin collections, bookings, and users deleted successfully.",
        preservedUser: { id: superAdminId, email: "manirajankg@gmail.com" },
      });
    } catch (err: any) {
      await client.query("ROLLBACK");
      return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
    } finally {
      await client.end();
    }
  } catch (outerErr: any) {
    return NextResponse.json({ success: false, error: outerErr?.message }, { status: 500 });
  }
}
