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

export const APP_VERSION = "2.5.1";
export const RELEASE_CHANNEL = "Production Stable";
export const BUILD_DATE = "23 Sep 2026, 02:35 AM IST";
export const APP_NAME = "Velvi";
export const APP_TAGLINE = "Pooja • Homam • Seva Management";

export const VERSION_HISTORY: VersionRelease[] = [
  {
    version: "2.5.1",
    releaseDate: "23 Sep 2026",
    releaseTime: "02:35 AM IST",
    title: "Pure White Top Header, Compact Sync Badge, Zero-Wobble Swipe & Dashboard Performance Boost",
    summary:
      "Comprehensive polish across top navbar, swipe gesture mechanics, and dashboard responsiveness: pure white top header with hairline border, compact cloud sync profile badge eliminating mobile overflow, strict horizontal axis-locking on booking card swipe-to-complete eliminating vertical wobble, and dashboard performance optimizations including requestAnimationFrame debouncing, O(1) indexed lookup maps, and memoized SVG chart rendering.",
    isCurrent: true,
    tag: "Enhancement",
    changes: [
      {
        category: "UI/UX",
        description: "Pure white top navbar with subtle slate-100 hairline divider, removing heavy background tints and border shadows.",
      },
      {
        category: "UI/UX",
        description: "Compact cloud sync badge and profile chip ('Syncing' / 'Synced') sized to prevent any horizontal overflow on small mobile screens.",
      },
      {
        category: "Fix",
        description: "Strict horizontal axis-lock (pan-y and translate3d) on swipe-to-complete booking cards, completely eliminating vertical wobbling and screen jitter.",
      },
      {
        category: "Enhancement",
        description: "Dashboard rendering performance boost: requestAnimationFrame debounced DB event listeners, O(1) precomputed devotee/priest booking maps, and memoized SVG Bezier cashflow chart.",
      },
    ],
  },
  {
    version: "2.5.0",
    releaseDate: "23 Sep 2026",
    releaseTime: "02:25 AM IST",
    title: "Animated Cloud Sync Ticker, Calendar 2x Auto-Fill & Pooja Slip Upgrades",
    summary:
      "Major UI/UX and operational polish: real-time animated vertical scroll-up cloud sync status in top navbar, double-click date auto-fill from calendar with 14-day strip inclusion, default-checked Pooja Slip checklist with green tickmarks, universal multi-layer clipboard copy engine for all devices, and refined sacred hairline navbar styling.",
    isCurrent: false,
    tag: "Major",
    changes: [
      {
        category: "UI/UX",
        description: "Real-time animated vertical scroll-up ticker in navbar profile button smoothly cycling between Priest Name, 'Syncing...', and 'Cloud Synced ✓'.",
      },
      {
        category: "UI/UX",
        description: "Refined top navbar border to clean hairline amber-900/10 with subtle sacred elevation, removing harsh dark borders.",
      },
      {
        category: "Feature",
        description: "Calendar cell double-tap / double-click automatically opens New Booking with exact date pre-filled and dynamically selected in the date strip.",
      },
      {
        category: "UI/UX",
        description: "Pooja Slip checklist items now default checked with crisp emerald checkmark boxes (no strike-throughs or empty squares).",
      },
      {
        category: "Fix",
        description: "Universal clipboard copy engine with execCommand fallback ensuring 'Copy List' works reliably across all mobile browsers, webviews, and desktop.",
      },
      {
        category: "Enhancement",
        description: "Removed redundant top 'Share Image' button from Pooja Slip modal, streamlining direct Save Image (PNG) and WhatsApp preview actions.",
      },
      {
        category: "UI/UX",
        description: "Smooth cubic-bezier swipe-to-complete animation on bookings list with haptic vibration feedback.",
      },
      {
        category: "Security",
        description: "Robust Google Sign-In cancellation handling with non-blocking 1-tap instant Demo Login recovery.",
      },
    ],
  },
  {
    version: "2.4.2",
    releaseDate: "22 Sep 2026",
    releaseTime: "11:15 PM IST",
    title: "One-Line Samagri Checklist, Stepper Before Units & 100-Step Decrement",
    summary:
      "All-new one-line checklist presentation for Pooja Samagri across New Booking, Step 2 Preview, View Booking, and Edit Items. Includes smart 100-step decrement/increment for weight/volume (grams/ml), stepper before Tamil unit badge, full checklist preview without scroll cutoff, and updated receipts.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "UI/UX",
        description: "One-line checklist format (1, 2, 3..) for Samagri items with checkbox, Tamil primary name, English subtitle, and delete button.",
      },
      {
        category: "Enhancement",
        description: "Positioned quantity stepper [-] [qty] [+] BEFORE the Tamil unit badge (e.g. 100 கிராம்).",
      },
      {
        category: "Fix",
        description: "Implemented smart 100-step decrement and increment for grams and ml, and 1-step for pieces.",
      },
      {
        category: "UI/UX",
        description: "Full inline checklist preview in Step 2 and Preview Modal without scroll trapping.",
      },
    ],
  },
  {
    version: "2.4.0",
    releaseDate: "22 Sep 2026",
    releaseTime: "10:00 PM IST",
    title: "Smart Samagri Modal, Quick Dakshina Customizer, Slip Image Sharing & WhatsApp 2.0",
    summary:
      "Comprehensive priest workflow and booking receipt upgrade: 1-click ₹100 & long-press ₹500 Dakshina adjustments, compact Samagri checklist popup with live selections, sleek Pooja slip without PDF/UPI QR, direct Save & Share Image (PNG) capability, and clean branded WhatsApp receipts without priest names.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "UI/UX",
        description: "Replaced 25+ inline checklist with a compact Samagri trigger card and full-featured interactive selection modal.",
      },
      {
        category: "Enhancement",
        description: "Reliable 1-tap ₹100 decrement/increment and long-press ₹500 adjustments for Dakshina.",
      },
      {
        category: "Feature",
        description: "Replaced PDF & Print in Pooja Slip with direct high-resolution PNG Save & Share Image buttons.",
      },
      {
        category: "UI/UX",
        description: "Removed UPI QR code and streamlined logo for a compact, neat receipt aesthetic.",
      },
      {
        category: "Enhancement",
        description: "Enhanced WhatsApp sharing with numbered checklists, no priest name disclosure, and elegant Velvi App branding footer.",
      },
    ],
  },
  {
    version: "2.3.0",
    releaseDate: "20 Sep 2026",
    releaseTime: "02:00 PM IST",
    title: "Branding Split, 10MB Media, Smart Install Popup, State Restoration & Undo Recovery",
    summary:
      "Comprehensive priest empowerment update: Split Business and Service names with live sample card previews, 10MB image uploads, 10s wait / 6s auto-dismiss install popup, automatic page scroll position preservation, global Undo recovery for deleted items, and safe sample data removal protecting real records.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "Feature",
        description: "Split Business Name (defaults to vadhyar/user name) & Service Name (defaults to 'Pooja • Homam • Seva') with live receipt flyer preview.",
      },
      {
        category: "Enhancement",
        description: "Increased business logo/media upload limit to 10MB with instant preview and priest guidance tips.",
      },
      {
        category: "UI/UX",
        description: "Smart Install Velvi App popup configured for first-time users with 10s delay and 6s auto-dismiss progress bar.",
      },
      {
        category: "UI/UX",
        description: "Automatic page scroll position and working state preservation across all tabs.",
      },
      {
        category: "Feature",
        description: "Instant Undo floating toast to recover deleted bookings, customers, and poojas with single tap.",
      },
      {
        category: "Security",
        description: "Permanent removal of destructive 'Clear All Data' button in Settings, replaced with safe 'Remove Sample Data' that only purges mock records.",
      },
      {
        category: "Feature",
        description: "Data Import & Export gated to active paid subscribers with automated expiry notice banner and 1-tap UPI renewal flow.",
      },
    ],
  },
  {
    version: "2.2.0",
    releaseDate: "20 Sep 2026",
    releaseTime: "11:00 AM IST",
    title: "Interactive Pooja Creation Wizard, Samagri Checklist & Booking UX Overhaul",
    summary:
      "Major UX upgrade introducing a 3-step Pooja creation wizard with Quick Templates, full-length samagri checklist library with 1-click toggles, smart action buttons, and streamlined 4-step booking workflow with real-time Nalla Neram guidance.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "Feature",
        description: "Interactive 3-Step Pooja Creation Modal (Details & Dakshina, Samagri Checklist, Review & Confirm) with zero keyboard pop-up disturbance.",
      },
      {
        category: "UI/UX",
        description: "Quick Templates with Ganapathi Homam, Gruhapravesam, and Vastu Homam presets and cross-clear selection button.",
      },
      {
        category: "UI/UX",
        description: "Step 2 Smart Icon Buttons (Clear All & Items Count), full-length added items view, and 1-click interactive Samagri checklist library with quantity steppers.",
      },
      {
        category: "UI/UX",
        description: "Streamlined 4-Step Booking Wizard with compact smart tips, highlighted devotee search, contextual Nalla Neram placement, and flexible advance payment selector.",
      },
    ],
  },
  {
    version: "2.1.0",
    releaseDate: "18 Sep 2026",
    releaseTime: "10:15 AM IST",
    title: "Cumulative Analytics Line Chart, Multi-Year Breakdown, Calendar Hold Tips & Timeline Stabilization",
    summary:
      "Comprehensive performance and analytics update featuring a cumulative progressive collection line chart, smart multi-year monthly breakdown (2026, 2025, 2024 & all-time), quick press-and-hold tip for the calendar, and zero-shake hardware-accelerated timeline scrolling on all mobile screens.",
    isCurrent: false,
    tag: "Feature",
    changes: [
      {
        category: "Feature",
        description: "Cumulative Monthly Collection Line Chart on Home Dashboard showing steady progressive funds realization over time.",
      },
      {
        category: "Feature",
        description: "Smart Multi-Year Analytics Breakdown (2026, 2025, 2024 and All Years) allowing priests and administrators to inspect month-wise collections across different years.",
      },
      {
        category: "UI/UX",
        description: "Added cute, elegant tip pill on Calendar page informing users that long-pressing (press & hold for 0.4s) opens the detailed day and Panchangam view.",
      },
      {
        category: "Fix",
        description: "Fixed floating month header shaking/jitter during timeline scrolling on Bookings page with zero-lag GPU acceleration across all iOS and Android screen sizes.",
      },
    ],
  },
  {
    version: "2.0.0",
    releaseDate: "16 Sep 2026",
    releaseTime: "04:30 PM IST",
    title: "4-Step Pooja Booking Wizard, Standalone Payment Box & Booking Details Overhaul",
    summary:
      "Major upgrade featuring a streamlined 4-step Pooja Booking Wizard with draft auto-save, app-wide duration removal, dedicated standalone payment box with advance shortcuts, instant 1-tap priest selection cards, Step 3 live booking preview, and a completely revamped Booking Details dashboard.",
    isCurrent: false,
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
