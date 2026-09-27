import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

export async function GET(req: Request) {
  const client = getPgClient();
  if (!client) {
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email")?.trim().toLowerCase();
    const businessId = searchParams.get("businessId")?.trim();
    const userId = searchParams.get("userId")?.trim();

    if (!email && !businessId && !userId) {
      return NextResponse.json({ success: false, error: "Query parameter required" }, { status: 400 });
    }

    await client.connect();

    try {
      // 1. Look up user
      let userQuery = `SELECT * FROM users WHERE 1=0`;
      const userParams: any[] = [];
      if (email && userId) {
        userQuery = `SELECT * FROM users WHERE LOWER(email) = LOWER($1) OR id = $2 LIMIT 1`;
        userParams.push(email, userId);
      } else if (email) {
        userQuery = `SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`;
        userParams.push(email);
      } else if (userId) {
        userQuery = `SELECT * FROM users WHERE id = $1 LIMIT 1`;
        userParams.push(userId);
      }
      const userRes = await client.query(userQuery, userParams);
      const userRow = userRes.rows[0] || null;

      // 2. Look up businesses belonging to user or matching businessId
      const resolvedUserId = userRow?.id || userId;
      const bizRes = await client.query(
        `SELECT * FROM businesses 
         WHERE (owner_id = $1 AND $1 IS NOT NULL) 
            OR (id = $2 AND $2 IS NOT NULL)
         ORDER BY updated_at DESC`,
        [resolvedUserId || null, businessId || null]
      );
      const businessRows = bizRes.rows;
      const primaryBiz = businessRows[0] || null;

      // 3. Look up subscription with furthest future current_period_end
      const allBizIds = businessRows.map((b: any) => b.id);
      if (businessId && !allBizIds.includes(businessId)) {
        allBizIds.push(businessId);
      }

      let subRow: any = null;
      if (allBizIds.length > 0 || email) {
        const subRes = await client.query(
          `SELECT s.* FROM subscriptions s
           LEFT JOIN businesses b ON s.business_id = b.id
           LEFT JOIN users u ON b.owner_id = u.id
           WHERE s.business_id = ANY($1::text[])
              OR ($2::text IS NOT NULL AND LOWER(u.email) = LOWER($2))
           ORDER BY s.current_period_end DESC NULLS LAST
           LIMIT 1`,
          [allBizIds, email || null]
        );
        subRow = subRes.rows[0] || null;
      }

      let mappedSub = null;
      if (subRow) {
        const isFuture = subRow.current_period_end && new Date(subRow.current_period_end).getTime() > Date.now();
        mappedSub = {
          id: subRow.id,
          businessId: subRow.business_id,
          planName: subRow.plan_name || "Velvi Pro",
          planCode: subRow.plan_code || "VELVI_PRO",
          status: isFuture ? "ACTIVE" : subRow.status || "ACTIVE",
          trialStart: subRow.trial_start ? new Date(subRow.trial_start).toISOString() : null,
          trialEnd: subRow.trial_end ? new Date(subRow.trial_end).toISOString() : null,
          currentPeriodStart: subRow.current_period_start ? new Date(subRow.current_period_start).toISOString() : null,
          currentPeriodEnd: subRow.current_period_end ? new Date(subRow.current_period_end).toISOString() : null,
          billingCycle: subRow.billing_cycle || "MONTHLY",
          autoRenew: Boolean(subRow.auto_renew),
          createdAt: subRow.created_at ? new Date(subRow.created_at).toISOString() : null,
          updatedAt: subRow.updated_at ? new Date(subRow.updated_at).toISOString() : null,
        };
      }

      return NextResponse.json({
        success: true,
        user: userRow
          ? {
              id: userRow.id,
              googleId: userRow.google_id,
              email: userRow.email,
              name: userRow.name,
              avatarUrl: userRow.avatar_url,
              mobile: userRow.mobile,
              mobileVerified: userRow.mobile_verified,
              role: userRow.role,
              referralCode: userRow.referral_code,
            }
          : null,
        business: primaryBiz
          ? {
              id: primaryBiz.id,
              ownerId: primaryBiz.owner_id,
              name: primaryBiz.name,
              serviceName: primaryBiz.service_name,
              iyerName: primaryBiz.iyer_name,
              logoUrl: primaryBiz.logo_url,
              phone: primaryBiz.phone,
              whatsapp: primaryBiz.whatsapp,
              address: primaryBiz.address,
              showWatermark: primaryBiz.show_watermark,
            }
          : null,
        subscription: mappedSub,
      });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err: any) {
    console.error("[API /api/auth/sync-user GET] Error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const client = getPgClient();
  if (!client) {
    return NextResponse.json({ success: false, error: "DATABASE_URL not set" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { user, business, subscription, email, businessId } = body;

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

      // 3. Upsert / Merge Subscription
      let updatedSubscription: any = null;
      if (subscription && (subscription.businessId || businessId)) {
        const targetBizId = subscription.businessId || businessId;
        const targetEmail = email || user?.email;

        // Check if an existing subscription row already exists for this business or this user's email
        const existingRes = await client.query(
          `SELECT s.* FROM subscriptions s
           LEFT JOIN businesses b ON s.business_id = b.id
           LEFT JOIN users u ON b.owner_id = u.id
           WHERE s.business_id = $1 
              OR ($2::text IS NOT NULL AND LOWER(u.email) = LOWER($2))
           ORDER BY s.current_period_end DESC NULLS LAST
           LIMIT 1`,
          [targetBizId, targetEmail || null]
        );

        const existing = existingRes.rows[0];
        const incomingEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : 0;
        const existingEnd = existing?.current_period_end ? new Date(existing.current_period_end).getTime() : 0;
        const bestEndTimestamp = Math.max(incomingEnd, existingEnd);
        const bestEndDateIso = bestEndTimestamp > 0
          ? new Date(bestEndTimestamp).toISOString()
          : (subscription.currentPeriodEnd || new Date().toISOString());

        const isFuture = bestEndTimestamp > Date.now();
        const finalStatus = isFuture ? "ACTIVE" : (subscription.status || existing?.status || "ACTIVE");

        if (existing) {
          // Update the authoritative row with maximum validity
          const updateRes = await client.query(
            `UPDATE subscriptions SET
               plan_name = COALESCE($1, plan_name),
               plan_code = COALESCE($2, plan_code),
               status = $3,
               current_period_start = COALESCE($4, current_period_start),
               current_period_end = $5,
               billing_cycle = COALESCE($6, billing_cycle),
               auto_renew = COALESCE($7, auto_renew),
               updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [
              subscription.planName || "Velvi Pro",
              subscription.planCode || "VELVI_PRO",
              finalStatus,
              subscription.currentPeriodStart || null,
              bestEndDateIso,
              subscription.billingCycle || "MONTHLY",
              Boolean(subscription.autoRenew),
              existing.id,
            ]
          );
          updatedSubscription = updateRes.rows[0];
        } else {
          // Insert new subscription row
          const insertRes = await client.query(
            `INSERT INTO subscriptions (id, business_id, plan_name, plan_code, status, trial_start, trial_end, current_period_start, current_period_end, billing_cycle, auto_renew, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
             ON CONFLICT (business_id) DO UPDATE SET
               plan_name = EXCLUDED.plan_name,
               plan_code = EXCLUDED.plan_code,
               status = EXCLUDED.status,
               current_period_end = GREATEST(subscriptions.current_period_end, EXCLUDED.current_period_end),
               billing_cycle = EXCLUDED.billing_cycle,
               auto_renew = EXCLUDED.auto_renew,
               updated_at = NOW()
             RETURNING *`,
            [
              subscription.id || `sub-${Date.now()}`,
              targetBizId,
              subscription.planName || "Velvi Pro",
              subscription.planCode || "VELVI_PRO",
              finalStatus,
              subscription.trialStart || null,
              subscription.trialEnd || null,
              subscription.currentPeriodStart || null,
              bestEndDateIso,
              subscription.billingCycle || "MONTHLY",
              Boolean(subscription.autoRenew),
            ]
          );
          updatedSubscription = insertRes.rows[0];
        }
      }

      return NextResponse.json({
        success: true,
        subscription: updatedSubscription
          ? {
              id: updatedSubscription.id,
              businessId: updatedSubscription.business_id,
              planName: updatedSubscription.plan_name,
              planCode: updatedSubscription.plan_code,
              status: updatedSubscription.status,
              trialStart: updatedSubscription.trial_start ? new Date(updatedSubscription.trial_start).toISOString() : null,
              trialEnd: updatedSubscription.trial_end ? new Date(updatedSubscription.trial_end).toISOString() : null,
              currentPeriodStart: updatedSubscription.current_period_start ? new Date(updatedSubscription.current_period_start).toISOString() : null,
              currentPeriodEnd: updatedSubscription.current_period_end ? new Date(updatedSubscription.current_period_end).toISOString() : null,
              billingCycle: updatedSubscription.billing_cycle,
              autoRenew: Boolean(updatedSubscription.auto_renew),
              updatedAt: updatedSubscription.updated_at ? new Date(updatedSubscription.updated_at).toISOString() : null,
            }
          : null,
      });
    } finally {
      await client.end().catch(() => {});
    }
  } catch (err: any) {
    console.error("[API /api/auth/sync-user POST] Error:", err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
