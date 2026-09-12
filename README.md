# VELVI — Pooja • Homam • Seva Management SaaS

> "Tradition Organized — Designed specifically for Iyers, Purohits, Vadhyars, and Pooja/Homam service providers."

VELVI is a production-ready, mobile-first SaaS platform that combines sacred Indian aesthetics (warm cream, deep earth brown, temple gold) with modern SaaS reliability, multi-tenancy, and an ultra-simple mobile UX for non-technical users, accompanied by a responsive desktop Super Admin console for the platform owner.

---

## 🌟 Key Features

1. **Mobile-First PWA (18 Connected Screens)**:
   - Optimized for single-hand mobile usage (360px – 414px+), zero horizontal overflow, large touch targets, minimal forms.
   - PWA installable with offline asset caching and home screen launcher.
2. **Dual Tamil + English Calendar Engine**:
   - Algorithmic Gregorian-to-Tamil conversion: solar month (சித்திரை to பங்குனி), Tamil day, and Tamil weekdays (ஞாயிறு to சனி).
   - Panchangam slots for Tithi, Nakshatra, Rahu Kalam, Yamagandam, and Kuligai.
   - Month, Week, Day, and Agenda schedule timelines.
3. **Pooja & Homam Management**:
   - Pre-loaded with standard Vedic ceremonies: Ganapathi Homam, Ayushya Homam, Navagraha Homam, Gruhapravesam, Sathyanarayana Pooja, and Sudarshana Homam.
   - Customizable item templates with quantities and standardized units (nos, kg, g, litre, ml, bundle, set, dozen).
4. **WhatsApp Text & High-Resolution Canvas Image Generator**:
   - 1-tap instant WhatsApp formatted bilingual invitation/checklist messages.
   - Client-side HTML5 Canvas generator creating high-DPI (1080x1500) shareable PNG flyers with sacred temple borders, deepam motifs, and business branding.
5. **Iyer Team Scheduling & Double-Booking Shield**:
   - Real-time conflict detector preventing overlapping bookings for the same purohit.
   - Reassignment workflow preserving immutable audit history.
6. **Iyer Settlement & Customer Payment Ledger**:
   - Track customer advances, balances, and payment methods (Cash, UPI, Bank Transfer).
   - Iyer settlements with flexible models (Fixed amount, Percentage, or Custom) and payout recording.
7. **Cashfree Payment Gateway Integration**:
   - Modular integration with cryptographic HMAC-SHA256 signature verification.
   - **Strict Security Rule**: Frontend payment success never activates subscriptions; backend webhook verification is mandatory.
   - Single MVP Public Plan: **Velvi Pro** at **₹499/month** or **₹4,999/year** (Save ₹989) with a **30-Day Free Trial**.
8. **Referral Rewards (+30 Days)**:
   - Unique referral codes (e.g., `VELVI-RAVI123`).
   - Grants +30 days free to both Referrer and Referee upon verified first paid subscription.
   - Validity calculation: Active subscribers get `current_expiry + 30 days`; Expired accounts get `today + 30 days`.
   - Comprehensive backend abuse prevention (self-referrals, duplicate Google IDs/mobiles prevented).
9. **Live Themes & Business Branding**:
   - 5 presets: Traditional (Cream + Brown + Gold), Classic (White + Green + Gold), Royal (Cream + Maroon + Gold), Modern (White + Brown + Soft Gold), and Custom hex color pickers.
   - "Powered by Velvi" watermark toggle.
10. **Data Protection & Paid-Only Export/Import**:
    - Gated feature: Active paid subscribers can export to Excel (.xlsx), CSV, and JSON.
    - Import engine with preview, duplicate contact checking, and confirmation before write.
    - Expired accounts retain all records securely without deletion.
11. **SaaS Super Admin Console (`/admin`)**:
    - Desktop/tablet portal with platform metrics (Total Users, MRR, Expiring accounts).
    - User validity adjustment modal (`+7d`, `+30d`, `+90d`, `+1yr`, `Custom`) with mandatory audit reasons.
    - Immutable Audit Log recorder.
12. **Bilingual Localization**:
    - Global English and தமிழ் toggle (முன்பதிவு, வாடிக்கையாளர், பூஜை, ஹோமம், தேவையான பொருட்கள், பணம், மீதம், ஒதுக்கப்பட்ட ஐயர், நாட்காட்டி).

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router), React 18, TypeScript (Strict Mode)
- **Styling**: Tailwind CSS with custom traditional sacred palette and CSS variables
- **Icons**: Lucide React
- **Graphics & Visuals**: HTML5 Canvas 2D API for high-resolution WhatsApp flyers, Canvas Confetti
- **Spreadsheets**: SheetJS (`xlsx`) for data export and import
- **Database & Security**: PostgreSQL with Row Level Security (RLS) policies (Supabase ready)
- **Testing**: Vitest test suite covering 14 mandatory test cases

---

## 🚀 Quick Start & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Verification Tests
```bash
npm test
```
All 13 core business rules (Tenant isolation, duplicate mobile detection, masked recovery email, referral reward timing, active vs expired validity math, double booking conflict prevention, reassignment history, Cashfree webhook verification, and Tamil calendar accuracy) will execute and verify 100% pass rate.

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

- **Mobile App**: Visit [http://localhost:3000/app](http://localhost:3000/app) (or use browser Device Mode at 390px width).
- **Super Admin Console**: Visit [http://localhost:3000/admin](http://localhost:3000/admin).
- **Interactive Dev Toolbar**: Use the floating `🪔 Dev Switcher` button at the bottom-right corner to toggle between Owner, Iyer, and Admin roles, change themes, or switch languages on any screen!

---

## 📦 Database Schema Setup (`schema.sql`)

To run on a live Supabase or PostgreSQL database:
1. Copy the contents of `schema.sql`.
2. Paste into the Supabase SQL Editor and execute.
3. The script creates 17+ normalized tables with foreign keys, indexes, triggers, and PostgreSQL Row-Level Security (RLS) policies ensuring tenant isolation.

---

## 🔒 Security Principles

- **Tenant Isolation**: Every query and transaction filters strictly by `business_id`.
- **Payment Verification**: Subscriptions are never extended from frontend callbacks; signed webhook verification is mandatory.
- **Privacy**: Mobile lookup during account recovery never exposes the full email before SMS OTP verification. Masked format: `r*****@gmail.com`.
- **Audit Trails**: All manual administrative adjustments and booking reassignments create immutable audit records with timestamps, actors, and reasons.
