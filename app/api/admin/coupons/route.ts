import { NextResponse } from "next/server";
import { Client } from "pg";

export const dynamic = "force-dynamic";

function getPgClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL not configured.");
  }
  return new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });
}

// Map PostgreSQL row to TypeScript Coupon
function mapRowToCoupon(row: any) {
  return {
    id: row.id,
    code: row.code,
    description: row.description || "",
    discountType: row.discount_type,
    discountValue: Number(row.discount_value || 0),
    validityDaysBonus: Number(row.validity_days_bonus || 0),
    maxUses: Number(row.max_uses || 100),
    usedCount: Number(row.used_count || 0),
    validUntil: row.valid_until ? new Date(row.valid_until).toISOString() : "2030-12-31T23:59:59Z",
    isActive: Boolean(row.is_active),
    showInSuggestions: Boolean(row.show_in_suggestions),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
  };
}

// GET /api/admin/coupons - Fetch all live coupons
export async function GET() {
  const client = getPgClient();
  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, code, description, discount_type, discount_value,
             validity_days_bonus, max_uses, used_count, valid_until,
             is_active, show_in_suggestions, created_at, updated_at
      FROM coupons
      ORDER BY created_at DESC
    `);
    const coupons = res.rows.map(mapRowToCoupon);
    return NextResponse.json({ success: true, coupons });
  } catch (err: any) {
    console.error("[API /api/admin/coupons GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to fetch coupons" },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}

// POST /api/admin/coupons - Create coupon
export async function POST(req: Request) {
  const client = getPgClient();
  try {
    const body = await req.json();
    const cleanCode = (body.code || "").trim().toUpperCase();
    if (!cleanCode) {
      return NextResponse.json({ success: false, error: "Coupon code is required" }, { status: 400 });
    }

    await client.connect();

    const id = body.id || `coup-${Date.now()}`;
    const description = (body.description || "").trim();
    const discountType = body.discountType || "FREE_VALIDITY";
    const discountValue = Number(body.discountValue) || 0;
    const validityDaysBonus = Number(body.validityDaysBonus) || 0;
    const maxUses = Number(body.maxUses) || 100;
    const validUntil = body.validUntil || "2030-12-31T23:59:59Z";
    const isActive = body.isActive !== false;
    const showInSuggestions = body.showInSuggestions !== false;

    const res = await client.query(`
      INSERT INTO coupons (id, code, description, discount_type, discount_value,
                           validity_days_bonus, max_uses, used_count, valid_until,
                           is_active, show_in_suggestions, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `, [
      id, cleanCode, description, discountType, discountValue,
      validityDaysBonus, maxUses, validUntil, isActive, showInSuggestions
    ]);

    const created = mapRowToCoupon(res.rows[0]);
    return NextResponse.json({ success: true, coupon: created });
  } catch (err: any) {
    console.error("[API /api/admin/coupons POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create coupon" },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}

// PUT /api/admin/coupons - Update coupon
export async function PUT(req: Request) {
  const client = getPgClient();
  try {
    const body = await req.json();
    const id = body.id;
    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID is required" }, { status: 400 });
    }

    await client.connect();

    // Check existing
    const existing = await client.query(`SELECT * FROM coupons WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ success: false, error: "Coupon not found" }, { status: 404 });
    }

    const row = existing.rows[0];
    const code = body.code !== undefined ? body.code.trim().toUpperCase() : row.code;
    const description = body.description !== undefined ? body.description.trim() : row.description;
    const discountType = body.discountType !== undefined ? body.discountType : row.discount_type;
    const discountValue = body.discountValue !== undefined ? Number(body.discountValue) : row.discount_value;
    const validityDaysBonus = body.validityDaysBonus !== undefined ? Number(body.validityDaysBonus) : row.validity_days_bonus;
    const maxUses = body.maxUses !== undefined ? Number(body.maxUses) : row.max_uses;
    const validUntil = body.validUntil !== undefined ? body.validUntil : row.valid_until;
    const usedCount = body.usedCount !== undefined ? Number(body.usedCount) : row.used_count;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : row.is_active;
    const showInSuggestions = body.showInSuggestions !== undefined ? Boolean(body.showInSuggestions) : row.show_in_suggestions;

    const res = await client.query(`
      UPDATE coupons
      SET code = $1, description = $2, discount_type = $3, discount_value = $4,
          validity_days_bonus = $5, max_uses = $6, valid_until = $7,
          is_active = $8, show_in_suggestions = $9, used_count = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `, [
      code, description, discountType, discountValue,
      validityDaysBonus, maxUses, validUntil,
      isActive, showInSuggestions, usedCount, id
    ]);

    const updated = mapRowToCoupon(res.rows[0]);
    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: any) {
    console.error("[API /api/admin/coupons PUT] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update coupon" },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}

// DELETE /api/admin/coupons - Delete coupon
export async function DELETE(req: Request) {
  const client = getPgClient();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Coupon ID is required" }, { status: 400 });
    }

    await client.connect();
    await client.query(`DELETE FROM coupons WHERE id = $1`, [id]);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("[API /api/admin/coupons DELETE] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete coupon" },
      { status: 500 }
    );
  } finally {
    await client.end().catch(() => {});
  }
}
