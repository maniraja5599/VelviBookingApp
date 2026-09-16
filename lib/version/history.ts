/**
 * VELVI — APP VERSION CONTROL & RELEASE NOTES HISTORY
 * Tracks all deployments, feature additions, and UI improvements with exact dates and change logs.
 */

export interface VersionChange {
  category: "Feature" | "UI/UX" | "Fix" | "Architecture" | "Security" | "Enhancement";
  description: string;
}

export interface VersionRelease {
  version: string;
  releaseDate: string;
  releaseTime?: string;
  title: string;
  summary: string;
  isCurrent?: boolean;
  tag: "Major" | "Feature" | "Enhancement" | "Hotfix";
  changes: VersionChange[];
}

export const APP_VERSION = "2.0.0";
export const RELEASE_CHANNEL = "Production Stable";
export const BUILD_DATE = "16 Sep 2026, 04:30 PM IST";
export const APP_NAME = "Velvi";
export const APP_TAGLINE = "Pooja • Homam • Seva Management";

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: "2.0.0",
    releaseDate: "16 Sep 2026",
    releaseTime: "04:30 PM IST",
    title: "4-Step Pooja Booking Wizard, Standalone Payment Box & Booking Details Overhaul",
    summary:
      "Major upgrade featuring a streamlined 4-step Pooja Booking Wizard with draft auto-save, app-wide duration removal, dedicated standalone payment box with advance shortcuts, instant 1-tap priest selection cards, Step 3 live booking preview, and a completely revamped Booking Details dashboard.",
    isCurrent: true,
    tag: "Major",
    changes: [
      {
        category: "Feature",
        description: "Modern 4-Step Pooja Booking Wizard (Devotee → Pooja & Samagri → Date & Time → Review & Payment) with robust localStorage auto-save draft persistence.",
      },
      {
        category: "UI/UX",
        description: "Step 3 Live Quick Booking Preview Card confirming selected Date, Tamil Panchangam (திதி, நட்சத்திரம்), Time slot, and Devotee/Pooja details before advancing.",
      },
      {
        category: "UI/UX",
        description: "Dedicated Standalone Payment Box (தனியா ஒரு பாக்ஸ்) with Total Fee, Advance Received, Balance Due, and quick 1-tap advance chips (₹0 Nil, 25%, 50%, 100% Full Paid).",
      },
      {
        category: "Feature",
        description: "Instant 1-Tap Priest Selection (No dropdown) with default '✨ நானே செய்து வைக்கிறேன் (தலைமை குருக்கள் / Self)' and respectful Tamil priest role labels.",
      },
      {
        category: "UI/UX",
        description: "App-wide duration purge: Completely removed duration minute inputs and badges across all booking wizards, pooja catalog forms, and detail views.",
      },
      {
        category: "UI/UX",
        description: "Revamped Booking Details screen (/app/bookings/[id]) with Sacred Amber Hero Card, direct 1-tap Call & WhatsApp devotee actions, and dedicated Financial Settlement Box.",
      },
      {
        category: "UI/UX",
        description: "Devotee Search list updated with clean Tick Mark (✓ Check Icon) selection buttons and quick phone WhatsApp links.",
      },
    ],
  },
  {
    version: "1.3.1",
    releaseDate: "12 Sep 2026",
    releaseTime: "12:45 PM IST",
    title: "Header Brand Identity, Developer Credit & Clean Terminology",
    summary:
      "Enhanced top mobile header branding with prominent Velvi App identity alongside customer company name, added developer credit for Maniraja (@maniraja__), and eliminated SaaS technical jargon from all user-facing screens.",
    isCurrent: false,
    tag: "Enhancement",
    changes: [
      {
        category: "UI/UX",
        description: "Redesigned top header to prominently feature VELVI App title alongside business/company name in sacred typography.",
      },
      {
        category: "Feature",
        description: "Added developer attribution: 'Developed by Maniraja (@maniraja__)' with verified Instagram link across Settings, More, and Landing footers.",
      },
      {
        category: "UI/UX",
        description: "Completely purged SaaS jargon from user-facing screens, keeping platform terminology natural for Iyers and devotees.",
      },
    ],
  },
  {
    version: "1.3.0",
    releaseDate: "12 Sep 2026",
    releaseTime: "12:15 PM IST",
    title: "Mobile LAN Access, Sacred Branding & English UI with Tamil Calendar",
    summary:
      "Bound Next.js dev server to 0.0.0.0 for Wi-Fi mobile testing, added default Velvi sacred Deepam logo and PWA install engine, and standardized UI to clean English while keeping Tamil calendar & Panchangam.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "Architecture",
        description: "Bound dev server to 0.0.0.0:3000 to enable direct mobile phone testing over local Wi-Fi network.",
      },
      {
        category: "Feature",
        description: "Official Velvi vector SVG logo with sacred Deepam brass lamp and glowing divine flame.",
      },
      {
        category: "Feature",
        description: "PWA Progressive Web App engine with 192x192 & 512x512 icons, maskable icons, and Add-to-Home-Screen prompt.",
      },
      {
        category: "Feature",
        description: "Built in-app Version History & Release Notes timeline screen (/app/settings/version).",
      },
      {
        category: "UI/UX",
        description: "Standardized all pooja cards, dropdowns, and lists to clean English, eliminating Tamil subtitles from dashboard cards.",
      },
      {
        category: "UI/UX",
        description: "Preserved Tamil solar months (புரட்டாசி), solar days, and Panchangam (திதி, நட்சத்திரம், ராகு காலம், எமகண்டம்) exclusively for calendar.",
      },
      {
        category: "Enhancement",
        description: "Updated WhatsApp pooja item list and booking confirmation templates to clean English with Tamil calendar date.",
      },
      {
        category: "Enhancement",
        description: "Updated HTML5 Canvas sacred flyer generator to English labels while keeping Tamil calendar schedule intact.",
      },
    ],
  },
  {
    version: "1.2.0",
    releaseDate: "12 Sep 2026",
    releaseTime: "11:45 AM IST",
    title: "Booking Cancellation, Permanent Deletion & Double-Booking Edit Engine",
    summary:
      "Added full booking lifecycle management with refund vs. retained dakshina decision, deletion safety with immutable audit logs, and full ceremony editing with collision prevention.",
    tag: "Feature",
    changes: [
      {
        category: "Feature",
        description: "Booking cancellation engine with prompt to either Refund to Devotee or Retain Dakshina as per policy.",
      },
      {
        category: "Feature",
        description: "Booking deletion action with destructive confirmation modal and audit log tracking.",
      },
      {
        category: "Feature",
        description: "Full booking edit screen (/app/bookings/[id]/edit) allowing changes to devotee, pooja, date, time, location, and priest.",
      },
      {
        category: "Security",
        description: "Real-time double-booking collision detector preventing priest schedule overlaps during edits.",
      },
      {
        category: "Fix",
        description: "Dedicated Dakshina Payment Editor with math safeguards ensuring Total - Advance = Balance integrity.",
      },
    ],
  },
  {
    version: "1.1.0",
    releaseDate: "12 Sep 2026",
    releaseTime: "10:30 AM IST",
    title: "Flexible Priest Dispatching & Verified-Payment Referral Engine",
    summary:
      "Added support for self-performed vs. team-assigned ceremonies, and updated referral reward rules to require verified referee subscription payment.",
    tag: "Feature",
    changes: [
      {
        category: "Feature",
        description: "Priest assignment flexibility: Head Iyer can select 'Perform Myself' (Self) or dispatch to team members.",
      },
      {
        category: "Security",
        description: "Referral +30 days reward requires verified referee paid subscription (does not trigger on signup alone).",
      },
      {
        category: "UI/UX",
        description: "Referral dashboard displays separate counters for Total Invites, Signed Up (Pending), and Paid & Verified friends.",
      },
      {
        category: "Feature",
        description: "Iyer reassignment modal with availability conflict detection and reassignment audit history.",
      },
    ],
  },
  {
    version: "1.0.0",
    releaseDate: "12 Sep 2026",
    releaseTime: "09:00 AM IST",
    title: "Velvi Initial Production Foundation",
    summary:
      "Initial production release of Velvi — Pooja • Homam • Seva Management for Iyers, Purohits, and Vedic service providers.",
    tag: "Major",
    changes: [
      {
        category: "Architecture",
        description: "Multi-tenant architecture with phone normalization (+91) and strict tenant data isolation.",
      },
      {
        category: "Feature",
        description: "Dual Gregorian + Tamil Solar Calendar engine with live Panchangam bar (Tithi, Nakshatram, Rahu Kalam, Yamagandam).",
      },
      {
        category: "Feature",
        description: "1-to-3 tap quick booking engine with double-booking prevention.",
      },
      {
        category: "Feature",
        description: "Required items checklist with custom addition and WhatsApp sharing.",
      },
      {
        category: "Feature",
        description: "HTML5 Canvas sacred flyer image generator for WhatsApp devotee updates.",
      },
      {
        category: "Feature",
        description: "Cashfree checkout modal with subscription lifecycle management (Velvi Pro ₹499/mo).",
      },
      {
        category: "Feature",
        description: "Dedicated Super Admin console (/admin) for platform owner metrics and revenue tracking.",
      },
    ],
  },
];
