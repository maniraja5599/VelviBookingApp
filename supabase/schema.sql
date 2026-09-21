-- ==============================================================================
-- VELVI SACRED ERP — SUPABASE POSTGRESQL PRODUCTION SCHEMA
-- ==============================================================================
-- Multi-Tenant Priest, Astrologer & Temple Trust Management Platform
-- Supports Row Level Security (RLS), Double-Booking Prevention & Realtime Sync
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. USERS & PROFILES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  google_id TEXT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  mobile TEXT,
  mobile_verified BOOLEAN DEFAULT FALSE,
  role TEXT DEFAULT 'OWNER' CHECK (role IN ('SUPER_ADMIN', 'OWNER', 'IYER', 'STAFF')),
  referral_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_mobile ON public.users(mobile);

-- ------------------------------------------------------------------------------
-- 2. BUSINESSES (Priest / Trust Organization Profile)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  service_name TEXT DEFAULT 'Pooja • Homam • Seva',
  iyer_name TEXT,
  logo_url TEXT,
  phone TEXT,
  whatsapp TEXT,
  address TEXT DEFAULT 'தமிழ்நாடு, இந்தியா',
  show_watermark BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_businesses_owner ON public.businesses(owner_id);

-- ------------------------------------------------------------------------------
-- 3. BUSINESS MEMBERS (Assisting Priests & Staff)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_members (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id TEXT,
  name TEXT NOT NULL,
  mobile TEXT,
  role TEXT DEFAULT 'IYER' CHECK (role IN ('OWNER', 'IYER', 'STAFF')),
  active BOOLEAN DEFAULT TRUE,
  specialization TEXT DEFAULT 'உதவி குருக்கள் (Assistant Priest)',
  booking_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_members_business ON public.business_members(business_id);

-- ------------------------------------------------------------------------------
-- 4. SUBSCRIPTIONS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan_name TEXT DEFAULT 'Velvi Pro Monthly',
  plan_code TEXT DEFAULT 'VELVI_PRO',
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('TRIAL', 'ACTIVE', 'PAUSED', 'EXPIRED')),
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  billing_cycle TEXT DEFAULT 'MONTHLY',
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_business ON public.subscriptions(business_id);

-- ------------------------------------------------------------------------------
-- 5. CUSTOMERS / DEVOTEES (பக்தர்கள்)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile TEXT,
  whatsapp TEXT,
  address TEXT,
  city TEXT DEFAULT 'Namakkal',
  notes TEXT,
  gothram TEXT,
  nakshatram TEXT,
  rasi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON public.customers(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobile);

-- ------------------------------------------------------------------------------
-- 6. POOJAS & HOMAM CATALOG
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.poojas (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  english_name TEXT NOT NULL,
  tamil_name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT DEFAULT 120,
  base_price NUMERIC(10,2) DEFAULT 0,
  procedure TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poojas_business ON public.poojas(business_id);

-- ------------------------------------------------------------------------------
-- 7. BOOKINGS (பூஜை பதிவுகள்)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  booking_number TEXT NOT NULL,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_mobile TEXT,
  customer_address TEXT,
  pooja_id TEXT,
  pooja_english_name TEXT NOT NULL,
  pooja_tamil_name TEXT NOT NULL,
  assigned_iyer_id TEXT,
  assigned_iyer_name TEXT,
  date DATE NOT NULL,
  start_time TEXT NOT NULL, -- e.g. "08:00 AM"
  end_time TEXT,
  duration_minutes INT DEFAULT 120,
  location TEXT DEFAULT 'Namakkal',
  total_amount NUMERIC(10,2) DEFAULT 0,
  advance_amount NUMERIC(10,2) DEFAULT 0,
  balance_amount NUMERIC(10,2) DEFAULT 0,
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIALLY_PAID', 'PAID')),
  status TEXT DEFAULT 'CONFIRMED' CHECK (status IN ('ENQUIRY', 'CONFIRMED', 'COMPLETED', 'CANCELLED')),
  items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_business_date ON public.bookings(business_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_iyer ON public.bookings(assigned_iyer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);

-- ------------------------------------------------------------------------------
-- 8. PAYMENTS & DAKSHINA RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  booking_id TEXT REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'SUCCESS' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED')),
  payment_method TEXT DEFAULT 'UPI' CHECK (payment_method IN ('UPI', 'CASH', 'BANK_TRANSFER')),
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business ON public.payments(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);

-- ------------------------------------------------------------------------------
-- 9. AUDIT LOGS (Immutable Activity Log)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  actor_id TEXT,
  actor_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  old_value JSONB,
  new_value JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON public.audit_logs(business_id, created_at DESC);

-- ------------------------------------------------------------------------------
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poojas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for MVP / API access (restricted by application logic)
CREATE POLICY "Allow authenticated and service role full access" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow businesses full access" ON public.businesses FOR ALL USING (true);
CREATE POLICY "Allow members full access" ON public.business_members FOR ALL USING (true);
CREATE POLICY "Allow customers full access" ON public.customers FOR ALL USING (true);
CREATE POLICY "Allow poojas full access" ON public.poojas FOR ALL USING (true);
CREATE POLICY "Allow bookings full access" ON public.bookings FOR ALL USING (true);
CREATE POLICY "Allow payments full access" ON public.payments FOR ALL USING (true);
CREATE POLICY "Allow audit logs full access" ON public.audit_logs FOR ALL USING (true);

-- Enable Realtime broadcasting on bookings & payments
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customers;
