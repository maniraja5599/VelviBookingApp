import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { user, business, subscription } = body;

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 500 });
    }

    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });

    await client.connect();

    try {
      // 1. Upsert User
      if (user && user.id) {
        const validRole = ["SUPER_ADMIN", "ADMIN", "OWNER", "IYER", "STAFF"].includes(user.role)
          ? user.role
          : "OWNER";

        await client.query(
          `INSERT INTO users (id, google_id, email, name, avatar_url, mobile, mobile_verified, role, referral_code, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
           ON CONFLICT (id) DO UPDATE SET
             google_id = COALESCE(EXCLUDED.google_id, users.google_id),
             email = COALESCE(EXCLUDED.email, users.email),
             name = COALESCE(EXCLUDED.name, users.name),
             avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
             mobile = COALESCE(EXCLUDED.mobile, users.mobile),
             mobile_verified = EXCLUDED.mobile_verified,
             role = CASE WHEN users.role = 'SUPER_ADMIN' THEN 'SUPER_ADMIN' ELSE EXCLUDED.role END,
             referral_code = COALESCE(EXCLUDED.referral_code, users.referral_code),
             updated_at = NOW()`,
          [
            user.id,
            user.googleId || null,
            user.email || `${user.id}@velvi.app`,
            user.name || (user.email ? user.email.split("@")[0] : "User"),
            user.avatarUrl || null,
            user.mobile || null,
            Boolean(user.mobileVerified),
            validRole,
            user.referralCode || null,
          ]
        );
      }

      // 2. Upsert Business
      if (business && business.id) {
        await client.query(
          `INSERT INTO businesses (id, owner_id, name, service_name, iyer_name, logo_url, phone, whatsapp, address, show_watermark, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
           ON CONFLICT (id) DO UPDATE SET
             owner_id = COALESCE(EXCLUDED.owner_id, businesses.owner_id),
             name = COALESCE(EXCLUDED.name, businesses.name),
             service_name = COALESCE(EXCLUDED.service_name, businesses.service_name),
             iyer_name = COALESCE(EXCLUDED.iyer_name, businesses.iyer_name),
             logo_url = COALESCE(EXCLUDED.logo_url, businesses.logo_url),
             phone = COALESCE(EXCLUDED.phone, businesses.phone),
             whatsapp = COALESCE(EXCLUDED.whatsapp, businesses.whatsapp),
             address = COALESCE(EXCLUDED.address, businesses.address),
             show_watermark = EXCLUDED.show_watermark,
             updated_at = NOW()`,
          [
            business.id,
            business.ownerId || null,
            business.name || "Pooja Services",
            business.serviceName || null,
            business.iyerName || null,
            business.logoUrl || null,
            business.phone || null,
            business.whatsapp || null,
            business.address || null,
            business.showWatermark ?? true,
          ]
        );
      }

      // 3. Upsert Subscription if provided
      if (subscription && subscription.id && subscription.businessId) {
        await client.query(
          `INSERT INTO subscriptions (id, business_id, plan_name, plan_code, status, trial_start, trial_end, current_period_start, current_period_end, billing_cycle, auto_renew, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
           ON CONFLICT (id) DO UPDATE SET
             business_id = EXCLUDED.business_id,
             plan_name = EXCLUDED.plan_name,
             plan_code = EXCLUDED.plan_code,
             status = EXCLUDED.status,
             trial_start = EXCLUDED.trial_start,
             trial_end = EXCLUDED.trial_end,
             current_period_start = EXCLUDED.current_period_start,
             current_period_end = EXCLUDED.current_period_end,
             billing_cycle = EXCLUDED.billing_cycle,
             auto_renew = EXCLUDED.auto_renew,
             updated_at = NOW()`,
          [
            subscription.id,
            subscription.businessId,
            subscription.planName || "Velvi Pro",
            subscription.planCode || "VELVI_PRO",
            subscription.status || "ACTIVE",
            subscription.trialStart || null,
            subscription.trialEnd || null,
            subscription.currentPeriodStart || null,
            subscription.currentPeriodEnd || null,
            subscription.billingCycle || "MONTHLY",
            Boolean(subscription.autoRenew),
          ]
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err: any) {
    console.error("[API /api/auth/sync-user] Error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
