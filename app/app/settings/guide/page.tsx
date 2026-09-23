"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  Search,
  BookOpen,
  Calendar,
  Flame,
  CheckCircle2,
  Share2,
  Users,
  UserCheck,
  RotateCcw,
  Sparkles,
  Gift,
  Palette,
  Cloud,
  ArrowRight,
  Clock,
  Phone,
  MessageCircle,
  Download,
  Info,
  Layers,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

interface GuideTopic {
  id: string;
  category: string;
  categoryIcon: string;
  title: string;
  summary: string;
  steps: string[];
  exampleTitle: string;
  exampleScenario: string;
  proTip?: string;
  badge?: string;
}

const GUIDE_TOPICS: GuideTopic[] = [
  // 1. Quick Start
  {
    id: "quick-start",
    category: "Getting Started",
    categoryIcon: "🚀",
    title: "Initial Setup & Business Branding",
    summary: "Set up your Priest/Vadhyar profile, custom logo, contact details, and install Velvi as a fast mobile app.",
    steps: [
      "Open Settings > 'Business Profile & Branding'.",
      "Enter your Business Name (e.g. 'Sri Venkateswara Vadhyar Seva') and Service Name (e.g. 'Pooja • Homam • Seva').",
      "Upload your profile photo or temple logo (supports images up to 10MB).",
      "Tap 'Install Velvi Mobile App' banner to install Velvi on your phone home screen for 1-tap fast access with offline support.",
    ],
    exampleTitle: "Example: Setting up Sri Ram Iyer's Profile",
    exampleScenario:
      "Vadhyar Sri Ram Iyer logs in for the first time. In Settings > Business Profile, he sets his Business Name to 'Sri Ram Iyer - Vaidika Purohit' and Service Name to 'Pooja • Homam • Seva'. Now, whenever he downloads or shares pooja checklists, his custom brand and phone number appear at the top.",
    proTip: "You can update your business name, mobile number, and receipt logo anytime without affecting existing bookings.",
  },

  // 2. Calendar & Panchangam
  {
    id: "calendar-panchangam",
    category: "Calendar & Panchangam",
    categoryIcon: "🗓️",
    title: "Tamil Panchangam & Smart Date Booking",
    summary: "Navigate the authentic Tamil calendar with daily Thithi, Nakshatram, Nalla Neram, and Raghu Kalam.",
    steps: [
      "Open the Calendar tab from the bottom bar.",
      "View the current Tamil month (e.g. ஆவணி / புரட்டாசி) and year (பராபவ வருடம்).",
      "Double-tap any calendar date to immediately open the 'New Booking' form pre-filled with that selected date.",
      "Press and hold (or tap) a date to view the rich Day Details sheet showing Auspicious times (நல்ல நேரம்), Gauri Nalla Neram, and Rahu Kalam.",
    ],
    exampleTitle: "Example: Checking Muhurtham for Ganesh Chaturthi",
    exampleScenario:
      "A devotee calls Sri Ram Iyer to fix a Ganapathi Homam on 12 September. Sri Ram opens Calendar, taps 12 Sep, and instantly checks that Nalla Neram is 06:00 AM - 07:00 AM and Raghu Kalam starts at 09:00 AM. He double-clicks 12 Sep and immediately confirms the booking for 08:00 AM.",
    proTip: "Look for the golden flame 🪔 indicator on calendar cells—it highlights days with confirmed poojas!",
  },

  // 3. Pooja Bookings & Timeline
  {
    id: "bookings-timeline",
    category: "Bookings & Timeline",
    categoryIcon: "🪔",
    title: "Managing Bookings & Swipe-to-Complete",
    summary: "Track upcoming rituals by month, assign priests, track advance/due fees, and mark completed with gestures.",
    steps: [
      "Tap '+ New Booking' to register a ritual. Enter devotee name, phone, pooja type, date, time, and total Dakshina.",
      "Specify Advance Amount collected; the balance due is automatically computed.",
      "Assign the ritual to yourself ('Self / நானே') or an assistant purohit from your team.",
      "In the Bookings page, view the WhatsApp-style monthly chronological timeline.",
      "Swipe right on any booking card to mark it as 'Completed ✅' (பூஜை முடிந்தது). A 4.5-second floating Undo toast allows 1-tap rollback if needed.",
    ],
    exampleTitle: "Example: Completing Meena Sundaram's Sathyanarayana Pooja",
    exampleScenario:
      "Upon finishing Meena Sundaram's Sathyanarayana Pooja on Saturday evening, Sri Ram Iyer opens the Bookings tab, swipes right across Meena's card. The card turns emerald green with 'முடிந்தது ✅', and the status updates in real-time.",
    proTip: "You can also tap the 1-tap 'Complete' button on any card if you prefer tapping over swiping.",
  },

  // 4. Pooja Catalog & Samagri
  {
    id: "catalog-samagri",
    category: "Pooja Catalog & Items",
    categoryIcon: "📦",
    title: "Catalog, Sacred Icons & Smart Auto-Detect",
    summary: "Customize rituals, dakshina fees, and item checklists organized with 32+ sacred spiritual icons.",
    steps: [
      "Go to Settings > 'Pooja & Seva Catalog' to browse pre-loaded rituals (Ganapathi Homam, Navagraha Homam, etc.).",
      "Tap any pooja to edit its default Dakshina fee and required item checklist.",
      "Go to Settings > 'Samagri Categories' to manage categories (Fruits, Ghee, Flowers, Vastram, etc.).",
      "When adding a category, type keywords in Tamil or English (e.g., 'மலர் மாலை', 'பழங்கள்')—Velvi auto-detects and selects the ideal sacred emoji icon!",
      "You can also pick from the 32+ curated spiritual icons with a single tap.",
    ],
    exampleTitle: "Example: Creating a 'Sudarshana Homam' Checklist",
    exampleScenario:
      "Sri Ram Iyer creates a custom checklist for Sudarshana Homam. In Samagri Categories, he creates a new category 'ஹோம மூலிகைகள்' (Homam Herbs). As he types, Velvi auto-selects the sacred wood icon 🪵.",
    proTip: "Each booking gets an independent copy of the checklist, so you can tailor item quantities specifically for that devotee.",
  },

  // 5. WhatsApp Sharing & Canvas Flyer
  {
    id: "whatsapp-flyer",
    category: "WhatsApp & Sharing",
    categoryIcon: "💬",
    title: "Devotee Checklist Sharing & HD Image Flyers",
    summary: "Send devotees their item checklists as formatted WhatsApp messages or high-res printable PNG flyers.",
    steps: [
      "Open any booking and go to the 'Pooja Samagri Items' section.",
      "Tap 'Share List (வாட்ஸ்அப் பகிர்வு)'.",
      "A dual-tab preview modal appears showing: (1) HD Canvas Image Flyer, (2) WhatsApp Chat Message Preview.",
      "Flyer Tab: Tap 'Download Image (PNG)' to save the golden-bordered flyer to your gallery, or 'Share' to send via apps.",
      "WhatsApp Tab: Tap 'Copy Text' to copy the formatted checklist, or tap 'Open WhatsApp' to launch WhatsApp directly with the message pre-typed to the devotee's phone number.",
    ],
    exampleTitle: "Example: Sending Checklist to Ramesh Kumar",
    exampleScenario:
      "Ramesh Kumar books a Ganapathi Homam and requests the samagri list. Sri Ram opens Ramesh's booking, taps 'Share List', and previews the flyer. He taps 'Download Image (PNG)' and sends both the flyer image and WhatsApp text with 1 tap.",
    proTip: "The flyer automatically displays your Business Name, vadhyar contact number, and the Tamil panchangam date at the bottom.",
  },

  // 6. Devotee Directory
  {
    id: "devotee-directory",
    category: "Devotees & Clients",
    categoryIcon: "👥",
    title: "Devotee Profiles, Nakshatram & Rasi",
    summary: "Maintain a client address book with birth stars, gotrams, and complete past ritual history.",
    steps: [
      "Open Settings > 'Devotees & Clients' (or go to `/app/customers`).",
      "Tap '+ Add Devotee' or select an existing devotee.",
      "Store their phone number, home address, Janma Nakshatram (e.g. Rohini, Swathi), Rasi, and Gothram.",
      "View all past and upcoming poojas booked by that family in one place.",
      "Tap the Call 📞 or WhatsApp 💬 icons on their card to connect instantly.",
    ],
    exampleTitle: "Example: Booking Annual Shrardham for Lakshmi Narayanan",
    exampleScenario:
      "When Lakshmi Narayanan calls, Sri Ram opens Devotees, searches 'Lakshmi', and instantly sees his family Gotram (Srivatsa) and Vadhyar notes from his previous year's Navagraha Homam.",
    proTip: "When creating a booking, typing an existing devotee's name auto-fills their phone, address, and star!",
  },

  // 7. Team & Purohits
  {
    id: "team-purohits",
    category: "Team & Purohits",
    categoryIcon: "🤝",
    title: "Assistant Priests & Assignment Engine",
    summary: "Coordinate multiple purohits, prevent overlapping double-bookings, and track assignments.",
    steps: [
      "Open Settings > 'Team & Assistant Priests'.",
      "Add your team members (e.g. 'Suresh Iyer', 'Kumar Iyer') with their phone numbers and roles.",
      "When assigning a booking, select the assistant purohit.",
      "Velvi's smart collision engine automatically checks if the priest has another ritual scheduled at the same time and warns you.",
    ],
    exampleTitle: "Example: Delegating Concurrent Morning Homams",
    exampleScenario:
      "Sri Ram has two homams on the auspicious Sunday morning: one in Salem at 8:00 AM and one in Namakkal at 8:30 AM. He assigns Salem to Suresh Iyer and Namakkal to himself. Velvi validates both schedules with zero conflicts.",
    proTip: "Filter by 'Self' or priest name in the Bookings timeline to see individual workloads at a glance.",
  },

  // 8. Trash & Undo
  {
    id: "trash-undo",
    category: "Data & Safety",
    categoryIcon: "♻️",
    title: "Instant 5-Sec Undo & 30-Day Recycle Bin",
    summary: "Accidentally deleted or modified something? Instantly restore it with Velvi's multi-tier safety net.",
    steps: [
      "Instant Undo Toast: Whenever you delete or modify a record, a 5-second black toast pops up with an 'Undo' button. Tap it to restore immediately.",
      "Recycle Bin: Open Settings > 'Recycle Bin & Restore Log'.",
      "Browse deleted bookings, poojas, or devotees. Tap 'Restore' to put them right back into your active system.",
      "Audit Log: Check the 'Change History' tab to view a timestamped log of who edited what.",
    ],
    exampleTitle: "Example: Restoring an Accidental Pooja Deletion",
    exampleScenario:
      "While cleaning up test records, an assistant deletes a confirmed booking. Sri Ram opens Settings > Recycle Bin, spots the deleted booking at the top of the list, and taps 'Restore'. The booking reappears on the calendar instantly.",
    proTip: "Items in the Recycle Bin are safely preserved for 30 days before permanent cleanup.",
  },

  // 9. Plan & Referrals
  {
    id: "plan-referrals",
    category: "Plan & Rewards",
    categoryIcon: "💎",
    title: "Subscription Validity & Referral Engine",
    summary: "Check your Pro validity, renew via UPI QR code, and invite fellow purohits to earn 30 free days.",
    steps: [
      "Open Settings > 'Subscription & Plan'. Check your active plan status, expiry date, and days remaining.",
      "To renew, select monthly or yearly plan and pay via instant UPI QR code.",
      "Open Settings > 'Referral & Earn Free Days'. Copy your unique invite code or WhatsApp share link.",
      "When a fellow purohit signs up using your code, both of you automatically receive +30 free days added to your validity!",
    ],
    exampleTitle: "Example: Earning 60 Days Free by Inviting Colleagues",
    exampleScenario:
      "Sri Ram Iyer shares his referral link with two fellow purohits in his Vedapatashala group. Both install Velvi. Sri Ram's trial validity automatically extends from 30 days to 90 days without spending a single rupee!",
    proTip: "There is no limit on referral rewards—invite 12 purohit colleagues and enjoy Velvi completely free for a full year!",
  },

  // 10. Branding & Backup
  {
    id: "branding-backup",
    category: "Branding & Backup",
    categoryIcon: "🎨",
    title: "Themes, Custom Watermarks & Cloud Backup",
    summary: "Personalize app appearance with sacred colors, export Excel backups, and manage contacts.",
    steps: [
      "Open Settings > 'Theme & Sacred Colors'. Choose from 5 themes: Traditional Gold, Bilva Green, Royal Kumkum, Evening Sandhya, or Modern Slate.",
      "Open Settings > 'Business Profile & Branding' to enable your custom watermark for devotee receipts.",
      "Open Settings > 'Data & Cloud Backup' to download complete backups of all your bookings, customers, and payments in Excel/CSV format.",
    ],
    exampleTitle: "Example: Switching to Bilva Green for Shravana Month",
    exampleScenario:
      "During Shravana month, Sri Ram opens Theme settings and activates 'Bilva Green'. The entire app transforms into a serene, deep forest emerald aesthetic with sacred golden accents.",
    proTip: "Always download an Excel backup at the end of each Tamil month to archive your devotee accounts locally.",
  },
];

export default function AppGuidePage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>("quick-start");

  const categories = useMemo(() => {
    const cats = Array.from(new Set(GUIDE_TOPICS.map((t) => t.category)));
    return ["ALL", ...cats];
  }, []);

  const filteredTopics = useMemo(() => {
    return GUIDE_TOPICS.filter((t) => {
      const matchesCategory = selectedCategory === "ALL" || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.steps.some((s) => s.toLowerCase().includes(q)) ||
        t.exampleScenario.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <div className="space-y-4 pb-12 animate-in fade-in duration-200 max-w-2xl mx-auto">
      {/* Top Header with Back Navigation */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2">
          <Link
            href="/app/settings"
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 shadow-2xs hover:bg-slate-50 transition active:scale-95"
            title="Back to Settings"
          >
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          </Link>
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <span>Velvi App Guide & Manual</span>
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Complete A to Z walkthrough with step-by-step examples
            </p>
          </div>
        </div>

        <Link
          href="/app/settings"
          className="text-xs font-bold text-emerald-800 hover:text-emerald-950 px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200"
        >
          Done
        </Link>
      </div>

      {/* Search Guide Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search guide (e.g. swipe, flyer, advance fee, panchangam, undo)..."
          className="w-full pl-9 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition shadow-2xs"
        />
      </div>

      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 text-xs flex items-center gap-1.5 ${
              selectedCategory === cat
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>{cat === "ALL" ? "All Topics (10)" : cat}</span>
          </button>
        ))}
      </div>

      {/* Topic Cards List */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 shadow-2xs space-y-2">
            <p className="text-2xl">🔍</p>
            <h4 className="font-bold text-sm text-slate-800">No matching guide topic found</h4>
            <p className="text-xs text-slate-500">
              Try searching for &apos;booking&apos;, &apos;panchangam&apos;, &apos;flyer&apos;, or &apos;undo&apos;.
            </p>
          </div>
        ) : (
          filteredTopics.map((topic, idx) => {
            const isExpanded = expandedTopicId === topic.id;

            return (
              <div
                key={topic.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs hover:border-amber-300 transition overflow-hidden"
              >
                {/* Topic Header Accordion Bar */}
                <button
                  type="button"
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-amber-50/20 transition cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 flex items-center justify-center text-lg shrink-0 shadow-2xs">
                      {topic.categoryIcon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.2 rounded-md border border-emerald-200">
                          {topic.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          Part {idx + 1}
                        </span>
                      </div>
                      <h3 className="font-black text-sm text-slate-900 mt-1 leading-tight">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5 line-clamp-2">
                        {topic.summary}
                      </p>
                    </div>
                  </div>

                  <div className="p-1 rounded-lg bg-slate-100 text-slate-500 shrink-0 mt-1">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3.5 bg-slate-50/40">
                    {/* Step-by-Step Instructions */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <span>📋</span>
                        <span>How To Use (பயன்படுத்தும் முறை):</span>
                      </h4>
                      <div className="space-y-1.5 pl-1">
                        {topic.steps.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-700">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span className="leading-relaxed">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Real World Example Scenario */}
                    <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3.5 space-y-1.5 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                        <span>💡</span>
                        <span>{topic.exampleTitle}</span>
                      </div>
                      <p className="text-xs text-amber-900/90 leading-relaxed font-medium">
                        {topic.exampleScenario}
                      </p>
                    </div>

                    {/* Pro Tip */}
                    {topic.proTip && (
                      <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-3 flex items-start gap-2 text-xs text-emerald-950 shadow-2xs">
                        <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <p className="font-semibold leading-relaxed">
                          <span className="font-black text-emerald-800">Pro Tip: </span>
                          {topic.proTip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Developer Footer */}
      <DeveloperCredit />
    </div>
  );
}
