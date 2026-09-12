-- ==============================================================================
-- VELVI SAAS — PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- Multi-Tenant Pooja, Homam & Seva Management Platform
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS (Google OAuth & Mobile Recovery)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    google_id VARCHAR(255) UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    mobile VARCHAR(20) UNIQUE,
    mobile_verified BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) NOT NULL DEFAULT 'OWNER' CHECK (role IN ('OWNER', 'IYER', 'SUPER_ADMIN')),
    referral_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON users(mobile);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);

-- 2. BUSINESSES (Tenants)
CREATE TABLE IF NOT EXISTS businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    name VARCHAR(255) NOT NULL,
    iyer_name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    phone VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    address TEXT,
    show_watermark BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON businesses(owner_id);

-- 3. BUSINESS MEMBERS (Staff & Iyers)
CREATE TABLE IF NOT EXISTS business_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'IYER' CHECK (role IN ('OWNER', 'IYER', 'STAFF')),
    active BOOLEAN DEFAULT TRUE,
    specialization TEXT,
    working_days TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat,Sun',
    working_hours TEXT DEFAULT '06:00 - 20:00',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(business_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_business_members_biz ON business_members(business_id);
CREATE INDEX IF NOT EXISTS idx_business_members_user ON business_members(user_id);

-- 4. SUBSCRIPTIONS (One Public Plan: Velvi Pro, 30 Days Free Trial)
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    plan_name VARCHAR(100) NOT NULL DEFAULT 'Velvi Pro',
    plan_code VARCHAR(50) NOT NULL DEFAULT 'VELVI_PRO',
    status VARCHAR(50) NOT NULL DEFAULT 'TRIAL' CHECK (status IN ('TRIAL', 'ACTIVE', 'EXPIRING', 'EXPIRED', 'CANCELLED', 'PAYMENT_FAILED')),
    trial_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    trial_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_biz ON subscriptions(business_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(current_period_end);

-- 5. SUBSCRIPTION IMMUTABLE EVENTS & AUDIT
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('TRIAL_START', 'PAYMENT_ACTIVATION', 'REFERRAL_REWARD', 'ADMIN_ADJUSTMENT', 'EXPIRATION', 'RENEWAL')),
    days_added INTEGER DEFAULT 0,
    previous_end_date TIMESTAMPTZ,
    new_end_date TIMESTAMPTZ NOT NULL,
    amount NUMERIC(10, 2) DEFAULT 0.00,
    reference_id VARCHAR(255),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_events_biz ON subscription_events(business_id);

-- 6. SUPER ADMIN VALIDITY ADJUSTMENTS
CREATE TABLE IF NOT EXISTS subscription_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    adjustment_type VARCHAR(50) NOT NULL CHECK (adjustment_type IN ('EXTEND', 'REDUCE', 'PAUSE', 'ACTIVATE', 'EXPIRE', 'RESTORE')),
    days_changed INTEGER NOT NULL,
    previous_end_date TIMESTAMPTZ NOT NULL,
    new_end_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. CASHFREE GATEWAY TRANSACTIONS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_id VARCHAR(100) NOT NULL UNIQUE,
    gateway VARCHAR(50) NOT NULL DEFAULT 'CASHFREE',
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED')),
    billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
    payment_method VARCHAR(50),
    raw_webhook_payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_biz ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 8. REFERRALS & REWARD LEDGER (+30 Days on verified paid subscription)
CREATE TABLE IF NOT EXISTS referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referrer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    referrer_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT,
    referral_code VARCHAR(50) NOT NULL,
    referee_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT UNIQUE,
    referee_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE RESTRICT UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUALIFIED', 'REWARDED', 'REJECTED', 'REVERSED')),
    first_payment_id UUID REFERENCES payments(id),
    reward_days_granted INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    qualified_at TIMESTAMPTZ,
    rewarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON referrals(referee_user_id);

CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    beneficiary_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    beneficiary_business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    days_rewarded INTEGER NOT NULL DEFAULT 30,
    previous_end_date TIMESTAMPTZ NOT NULL,
    new_end_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    whatsapp VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_biz ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(business_id, mobile);

-- 10. POOJAS & HOMAMS (Vedic Services)
CREATE TABLE IF NOT EXISTS poojas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    english_name VARCHAR(255) NOT NULL,
    tamil_name VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    base_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    procedure TEXT,
    active BOOLEAN DEFAULT TRUE,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poojas_biz ON poojas(business_id);

-- 11. POOJA REQUIRED ITEMS TEMPLATE
CREATE TABLE IF NOT EXISTS pooja_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pooja_id UUID NOT NULL REFERENCES poojas(id) ON DELETE CASCADE,
    item_english_name VARCHAR(255) NOT NULL,
    item_tamil_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL CHECK (unit IN ('pcs', 'nos', 'kg', 'g', 'litre', 'ml', 'packet', 'bundle', 'set', 'dozen')),
    is_custom BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pooja_items_pooja ON pooja_items(pooja_id);

-- 12. BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) NOT NULL,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    pooja_id UUID NOT NULL REFERENCES poojas(id) ON DELETE RESTRICT,
    assigned_iyer_id UUID REFERENCES business_members(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 120,
    location TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'CONFIRMED' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED', 'REASSIGNED')),
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (total_amount >= 0),
    advance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    balance_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance_amount >= 0),
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PAID', 'PARTIALLY_PAID', 'PENDING')),
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_biz ON bookings(business_id);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(business_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_iyer ON bookings(assigned_iyer_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON bookings(customer_id);

-- 13. BOOKING SPECIFIC ITEM OVERRIDES
CREATE TABLE IF NOT EXISTS booking_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    item_english_name VARCHAR(255) NOT NULL,
    item_tamil_name VARCHAR(255) NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL,
    is_override BOOLEAN DEFAULT FALSE,
    is_checked BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_booking_items_booking ON booking_items(booking_id);

-- 14. BOOKING ASSIGNMENT & REASSIGNMENT HISTORY (Immutable)
CREATE TABLE IF NOT EXISTS booking_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    previous_iyer_id UUID REFERENCES business_members(id) ON DELETE SET NULL,
    new_iyer_id UUID NOT NULL REFERENCES business_members(id) ON DELETE RESTRICT,
    reassigned_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_booking_assignments_booking ON booking_assignments(booking_id);

-- 15. IYER SETTLEMENT SETTINGS & SETTLEMENT LEDGER
CREATE TABLE IF NOT EXISTS iyer_payment_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    iyer_id UUID NOT NULL REFERENCES business_members(id) ON DELETE CASCADE UNIQUE,
    is_tracking_enabled BOOLEAN DEFAULT TRUE,
    settlement_type VARCHAR(50) NOT NULL DEFAULT 'FIXED' CHECK (settlement_type IN ('FIXED', 'PERCENTAGE', 'CUSTOM', 'NONE')),
    fixed_amount NUMERIC(10, 2) DEFAULT 0.00,
    percentage NUMERIC(5, 2) DEFAULT 0.00,
    custom_pooja_rates JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iyer_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    iyer_id UUID NOT NULL REFERENCES business_members(id) ON DELETE RESTRICT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    payment_method VARCHAR(50) NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER')),
    reference VARCHAR(255),
    notes TEXT,
    settlement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_iyer_settlements_biz ON iyer_settlements(business_id);
CREATE INDEX IF NOT EXISTS idx_iyer_settlements_iyer ON iyer_settlements(iyer_id);

-- 16. THEMES & BRANDING
CREATE TABLE IF NOT EXISTS branding_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE UNIQUE,
    theme_preset VARCHAR(50) NOT NULL DEFAULT 'traditional' CHECK (theme_preset IN ('traditional', 'classic', 'royal', 'modern', 'custom')),
    primary_color VARCHAR(50) NOT NULL DEFAULT '#4A2E18',
    secondary_color VARCHAR(50) NOT NULL DEFAULT '#C89234',
    accent_color VARCHAR(50) NOT NULL DEFAULT '#FAF7F2',
    logo_url TEXT,
    show_watermark BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_name VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(100) NOT NULL,
    target_id VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_biz ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE pooja_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE iyer_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: Get Current Business ID for authenticated session
CREATE OR REPLACE FUNCTION current_business_id() RETURNS UUID AS $$
    SELECT business_id FROM business_members WHERE user_id = auth.uid() AND active = TRUE LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- Business isolation policies
CREATE POLICY "Tenant members can view their own business"
    ON businesses FOR SELECT
    USING (id = current_business_id() OR owner_id = auth.uid());

CREATE POLICY "Tenant members can view their customers"
    ON customers FOR ALL
    USING (business_id = current_business_id());

CREATE POLICY "Tenant members can manage poojas"
    ON poojas FOR ALL
    USING (business_id = current_business_id());

CREATE POLICY "Tenant members can manage bookings"
    ON bookings FOR ALL
    USING (business_id = current_business_id());

CREATE POLICY "Tenant members can view settlements"
    ON iyer_settlements FOR ALL
    USING (business_id = current_business_id());
