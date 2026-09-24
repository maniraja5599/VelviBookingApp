"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import Link from "next/link";
import {
  Building2,
  Flame,
  Users,
  UserCheck,
  CreditCard,
  Gift,
  Cloud,
  Palette,
  ChevronRight,
  LogOut,
  Shield,
  Sparkles,
  Phone,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Trash2,
  RotateCcw,
  AlertTriangle,
  Database,
  X,
  Check,
  Tag,
  Search,
  Pencil,
  History,
  Calendar,
  Download,
  Info,
  BookOpen,
  Mail,
  Globe,
} from "lucide-react";
import { PwaInstallBanner } from "@/components/mobile/PwaInstallBanner";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { APP_VERSION } from "@/lib/version/history";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";

interface SettingItem {
  href?: string;
  onClick?: () => void;
  label: string;
  desc: string;
  icon: any;
  iconBg?: string;
  iconColor?: string;
  badge?: string;
  highlight?: boolean;
  keywords?: string;
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsHubPage() {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  // State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showClearDemoModal, setShowClearDemoModal] = useState(false);
  const [trashTab, setTrashTab] = useState<"deleted" | "history">("deleted");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Live Counts & Deleted Items
  const [counts, setCounts] = useState({
    bookings: db.getBookings(businessId).length,
    customers: db.getCustomers(businessId).length,
    poojas: db.getPoojas(businessId).length,
  });
  const [recentlyDeleted, setRecentlyDeleted] = useState(db.getRecentlyDeleted());
  const [auditLogs, setAuditLogs] = useState(db.auditLogs || []);

  useEffect(() => {
    const updateCounts = () => {
      setCounts({
        bookings: db.getBookings(businessId).length,
        customers: db.getCustomers(businessId).length,
        poojas: db.getPoojas(businessId).length,
      });
      setRecentlyDeleted(db.getRecentlyDeleted());
      setAuditLogs([...(db.auditLogs || [])].reverse().slice(0, 25));
      setDataVersion((v) => v + 1);
    };

    updateCounts();
    window.addEventListener("velvi:db-change", updateCounts);
    return () => window.removeEventListener("velvi:db-change", updateCounts);
  }, [businessId]);

  // Restore deleted record
  const handleRestoreItem = (id: string) => {
    const result = db.restoreDeletedItem(id);
    if (result.success) {
      setToastMessage(`'${result.name}' வெற்றிகரமாக மீட்டெடுக்கப்பட்டது (Restored)!`);
      setRecentlyDeleted(db.getRecentlyDeleted());
    } else {
      setToastMessage(result.message || "மீட்டெடுப்பதில் பிழை.");
    }
    setTimeout(() => setToastMessage(null), 4500);
  };

  const isPro =
    subscription?.status === "ACTIVE" &&
    subscription?.planCode === "VELVI_PRO";

  // Format validity
  const validityText = useMemo(() => {
    if (subscription?.currentPeriodEnd) {
      const end = new Date(subscription.currentPeriodEnd);
      const now = new Date();
      const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const formattedDate = end.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      if (diffDays > 0) {
        return `${formattedDate} (${diffDays} days left)`;
      }
      return `Expired on ${formattedDate}`;
    }
    return "30-Day Free Trial";
  }, [subscription]);

  const allSettingSections: SettingSection[] = useMemo(() => [
    {
      title: "Business & Services (வணிகம் & சேவைகள்)",
      items: [
        {
          href: "/app/settings/branding",
          label: "Business Profile & Branding",
          desc: currentBusiness?.name || "Logo, vadhyar name, service title & receipt watermark",
          icon: Building2,
          iconBg: "bg-blue-100/90 border border-blue-200",
          iconColor: "text-blue-700",
          badge: currentBusiness?.logoUrl ? "Custom Logo" : "Default Logo",
          highlight: true,
          keywords: "profile branding vadhyar name logo watermark business",
        },
        {
          href: "/app/poojas",
          label: "Pooja & Seva Catalog",
          desc: "Manage rituals, dakshina fees & item checklists",
          icon: Flame,
          iconBg: "bg-orange-100/90 border border-orange-200",
          iconColor: "text-orange-700",
          badge: `${counts.poojas} Poojas`,
          keywords: "pooja homam seva dakshina fee samagri checklist",
        },
        {
          onClick: () => setShowCategoryModal(true),
          label: "Samagri Categories",
          desc: "Create, edit & manage pooja items categories & icons",
          icon: Tag,
          iconBg: "bg-purple-100/90 border border-purple-200",
          iconColor: "text-purple-700",
          keywords: "category categories samagri items fruits flowers ghee vastram",
        },
        {
          href: "/app/customers",
          label: "Devotees & Clients",
          desc: "Manage devotee directory, star nakshatram & history",
          icon: Users,
          iconBg: "bg-emerald-100/90 border border-emerald-200",
          iconColor: "text-emerald-700",
          badge: `${counts.customers} Devotees`,
          keywords: "customer devotee client phone mobile nakshatram rasi gothram",
        },
        {
          href: "/app/team",
          label: "Team & Assistant Priests",
          desc: "Manage purohits, schedules & assignments",
          icon: UserCheck,
          iconBg: "bg-indigo-100/90 border border-indigo-200",
          iconColor: "text-indigo-700",
          keywords: "team assistant purohit vadhyar staff purohits iyer",
        },
      ],
    },
    {
      title: "Plan & Rewards (திட்டம் & சலுகைகள்)",
      items: [
        {
          href: "/app/subscription",
          label: "Subscription & Plan",
          desc: isPro ? "Velvi Pro Active • Auto-renews" : "30-Day Free Trial • Upgrade to Pro",
          icon: Sparkles,
          iconBg: "bg-amber-100/90 border border-amber-300",
          iconColor: "text-amber-800",
          badge: isPro ? "Pro Active" : "Free Trial",
          keywords: "subscription plan pro trial billing upi payment renew validity",
        },
        {
          href: "/app/referrals",
          label: "Referral & Earn Free Days",
          desc: "Invite colleagues, earn +30 days free per referral",
          icon: Gift,
          iconBg: "bg-pink-100/90 border border-pink-200",
          iconColor: "text-pink-700",
          badge: "+30 Days Free",
          keywords: "referral invite reward free days friend earn code",
        },
      ],
    },
    {
      title: "Data & Security (தரவு & பாதுகாப்பு)",
      items: [
        {
          onClick: () => setShowTrashModal(true),
          label: "Recycle Bin & Restore Log",
          desc: `${recentlyDeleted.length} deleted item(s) • View changes & restore records`,
          icon: RotateCcw,
          iconBg: "bg-rose-100/90 border border-rose-200",
          iconColor: "text-rose-700",
          badge: recentlyDeleted.length > 0 ? `${recentlyDeleted.length} in trash` : undefined,
          keywords: "trash restore recycle bin delete undo recover change log history",
        },
        {
          href: "/app/data-backup",
          label: "Data & Cloud Backup",
          desc: "Excel export, contacts import & safe backup",
          icon: Cloud,
          iconBg: "bg-cyan-100/90 border border-cyan-200",
          iconColor: "text-cyan-800",
          keywords: "backup export excel csv import restore cloud data",
        },
        ...(currentUser?.id === "u-ravi-iyer-01" || businessId === "biz-venkateswara-01"
          ? [
              {
                onClick: () => setShowClearDemoModal(true),
                label: "Clear Demo Data",
                desc: "மாதிரி முன்பதிவுகள் & பக்தர்களை நீக்கி புதிய கணக்கை தொடங்கவும்",
                icon: Sparkles,
                iconBg: "bg-red-100/90 border border-red-200",
                iconColor: "text-red-700",
                keywords: "clear demo sample data wipe test bookings customers மாதிரி நீக்கு",
              },
            ]
          : []),
      ],
    },
    {
      title: "Preferences & System (விருப்பத்தேர்வுகள் & தகவல்)",
      items: [
        {
          onClick: () => {
            const nextLang = language === "ta" ? "en" : "ta";
            setLanguage(nextLang);
            setToastMessage(nextLang === "ta" ? "மொழி தமிழுக்கு மாற்றப்பட்டது!" : "Language switched to English!");
            setTimeout(() => setToastMessage(null), 3000);
          },
          label: language === "ta" ? "செயலி மொழி (App Language)" : "App Language (செயலி மொழி)",
          desc: language === "ta" ? "தற்போது: தமிழ் • தட்டினால் ஆங்கிலத்திற்கு மாறும்" : "Current: English • Tap to switch to தமிழ்",
          icon: Globe,
          iconBg: "bg-emerald-100/90 border border-emerald-200",
          iconColor: "text-emerald-700",
          badge: language === "ta" ? "தமிழ்" : "English",
          keywords: "language tamil english மொழி தமிழ் ஆங்கிலம்",
        },
        {
          href: "/app/settings/guide",
          label: "App Guide & Documentation",
          desc: "Comprehensive A to Z user manual with examples",
          icon: BookOpen,
          iconBg: "bg-teal-100/90 border border-teal-200",
          iconColor: "text-teal-700",
          badge: "A-Z Guide",
          keywords: "guide manual help docs tutorial how to use walkthrough panchangam",
        },
        {
          href: "/app/settings/theme",
          label: "Theme & Sacred Colors",
          desc: "Traditional, Bilva Green, Royal Kumkum & Modern palettes",
          icon: Palette,
          iconBg: "bg-fuchsia-100/90 border border-fuchsia-200",
          iconColor: "text-fuchsia-700",
          keywords: "theme color style palette sacred dark light green kumkum",
        },
        {
          href: "/app/settings/version",
          label: "Version & Release Notes",
          desc: `v${APP_VERSION} Stable • View changelog & updates`,
          icon: Sparkles,
          iconBg: "bg-violet-100/90 border border-violet-200",
          iconColor: "text-violet-700",
          badge: `v${APP_VERSION}`,
          keywords: "version release notes changelog update",
        },
      ],
    },
  ], [currentBusiness, counts, isPro, recentlyDeleted, language, setLanguage]);

  // Search filtering
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return allSettingSections;
    const q = searchQuery.toLowerCase().trim();
    return allSettingSections
      .map((sec) => ({
        ...sec,
        items: sec.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q) ||
            (item.keywords && item.keywords.toLowerCase().includes(q))
        ),
      }))
      .filter((sec) => sec.items.length > 0);
  }, [searchQuery, allSettingSections]);

  // Quick chips for common settings with colorful styling
  const quickSettings: Array<{
    label: string;
    icon: any;
    iconColor?: string;
    chipBg?: string;
    href?: string;
    action?: () => void;
  }> = [
    { label: "Profile", icon: Pencil, iconColor: "text-blue-700", chipBg: "hover:bg-blue-50 hover:border-blue-300", href: "/app/settings/branding" },
    { label: "Plan & Pro", icon: Sparkles, iconColor: "text-amber-700", chipBg: "hover:bg-amber-50 hover:border-amber-300", href: "/app/subscription" },
    { label: `Poojas (${counts.poojas})`, icon: Flame, iconColor: "text-orange-700", chipBg: "hover:bg-orange-50 hover:border-orange-300", href: "/app/poojas" },
    { label: `Devotees (${counts.customers})`, icon: Users, iconColor: "text-emerald-700", chipBg: "hover:bg-emerald-50 hover:border-emerald-300", href: "/app/customers" },
    { label: "Categories", icon: Tag, iconColor: "text-purple-700", chipBg: "hover:bg-purple-50 hover:border-purple-300", action: () => setShowCategoryModal(true) },
    { label: `Trash (${recentlyDeleted.length})`, icon: RotateCcw, iconColor: "text-rose-700", chipBg: "hover:bg-rose-50 hover:border-rose-300", action: () => setShowTrashModal(true) },
    { label: "Themes", icon: Palette, iconColor: "text-fuchsia-700", chipBg: "hover:bg-fuchsia-50 hover:border-fuchsia-300", href: "/app/settings/theme" },
    { label: "Cloud Backup", icon: Cloud, iconColor: "text-cyan-800", chipBg: "hover:bg-cyan-50 hover:border-cyan-300", href: "/app/data-backup" },
    { label: "App Guide", icon: BookOpen, iconColor: "text-teal-700", chipBg: "hover:bg-teal-50 hover:border-teal-300", href: "/app/settings/guide" },
    { label: "Refer & Earn", icon: Gift, iconColor: "text-pink-700", chipBg: "hover:bg-pink-50 hover:border-pink-300", href: "/app/referrals" },
  ];

  return (
    <div className="space-y-4 pb-24 sm:pb-28 animate-in fade-in duration-200">
      {/* Header & Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">{t("settings")}</h2>
          <p className="text-xs text-velvi-brown/60">Manage your business profile, rituals & preferences</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO NAME & BRANDING CARD (Perfect Centered Logo, Pro Status & Metrics) */}
      {/* ========================================================================= */}
      <div
        className={`p-4 sm:p-5 rounded-3xl relative overflow-hidden transition-all shadow-xs ${
          isPro
            ? "bg-gradient-to-br from-amber-50/95 via-white to-emerald-50/50 border border-emerald-400/80 ring-1 ring-emerald-400/20"
            : "bg-gradient-to-br from-amber-50/95 via-white to-amber-100/50 border border-amber-300/80"
        }`}
      >
        {/* Subtle decorative background watermarks */}
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Profile Header Row */}
        <div className="flex items-center justify-between gap-3 relative">
          <div className="flex items-center gap-3.5 min-w-0 flex-1">
            {/* Perfectly Centered Avatar / Logo Container */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white border border-amber-300/80 ring-2 ring-amber-400/30 shadow-xs flex items-center justify-center p-1.5 overflow-hidden transition-transform">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentBusiness?.name || currentUser?.name || "Priest"}
                    className="w-full h-full rounded-xl object-cover"
                  />
                ) : currentBusiness?.logoUrl ? (
                  <img
                    src={currentBusiness.logoUrl}
                    alt={currentBusiness.name || "Business Logo"}
                    className="w-full h-full rounded-xl object-contain"
                  />
                ) : (
                  <img
                    src="/icons/velvi-logo.png"
                    alt="Velvi Logo"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>
              <Link
                href="/app/settings/branding"
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md hover:bg-emerald-900 transition active:scale-95 border-2 border-white"
                title="Edit Profile Picture / Logo"
                aria-label="Edit Profile"
              >
                <Pencil className="w-2.5 h-2.5 text-amber-300" />
              </Link>
            </div>

            {/* Name, Business & Contact info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-[15px] sm:text-base text-slate-900 tracking-tight truncate leading-tight">
                  {currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}
                </h3>
              </div>

              {/* Sub-label if business has vadhyar name */}
              {currentBusiness?.name && currentUser?.name && currentBusiness.name !== currentUser.name && (
                <p className="text-[11px] font-semibold text-amber-900/80 truncate mt-0.5">
                  👤 {currentUser.name}
                </p>
              )}

              {/* Contact info: Phone & Email */}
              <div className="flex flex-col gap-0.5 mt-1">
                {currentUser?.mobile && (
                  <div className="text-[11px] text-slate-700 font-bold flex items-center gap-1 leading-tight">
                    <Phone className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                    <span>{currentUser.mobile}</span>
                  </div>
                )}
                {currentUser?.email && (
                  <div className="text-[10.5px] text-slate-500 font-medium truncate flex items-center gap-1 leading-tight">
                    <Mail className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                    <span className="truncate">{currentUser.email}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Top Badges: Plan & Role */}
          <div className="shrink-0 flex flex-col items-end gap-1.5 self-start">
            <Link
              href="/app/subscription"
              className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border flex items-center gap-1 transition active:scale-95 shadow-2xs ${
                isPro
                  ? "bg-gradient-to-r from-emerald-800 to-emerald-950 text-amber-300 border-amber-300/80 shadow-xs ring-1 ring-amber-400/40"
                  : "bg-amber-100/90 text-amber-900 border-amber-300"
              }`}
              title="Subscription Plan"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{isPro ? "PRO ACTIVE" : "FREE TRIAL"}</span>
            </Link>

            <span className="text-[9.5px] px-2 py-0.5 rounded-md font-bold bg-amber-100/80 text-amber-900 border border-amber-200/90">
              {currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Vadhyar"}
            </span>
          </div>
        </div>

        {/* Live Metrics Row inside Hero Card */}
        <div className="mt-3 pt-2.5 border-t border-amber-200/60 grid grid-cols-3 gap-2">
          <Link
            href="/app/bookings"
            className="bg-white/80 hover:bg-white rounded-xl p-2 border border-amber-200/70 text-center transition group active:scale-95 shadow-2xs"
          >
            <div className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
              {counts.bookings}
            </div>
            <div className="text-[10px] font-bold text-slate-500">Bookings</div>
          </Link>

          <Link
            href="/app/customers"
            className="bg-white/80 hover:bg-white rounded-xl p-2 border border-amber-200/70 text-center transition group active:scale-95 shadow-2xs"
          >
            <div className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
              {counts.customers}
            </div>
            <div className="text-[10px] font-bold text-slate-500">Devotees</div>
          </Link>

          <Link
            href="/app/poojas"
            className="bg-white/80 hover:bg-white rounded-xl p-2 border border-amber-200/70 text-center transition group active:scale-95 shadow-2xs"
          >
            <div className="text-xs font-black text-slate-900 group-hover:text-emerald-800 transition-colors">
              {counts.poojas}
            </div>
            <div className="text-[10px] font-bold text-slate-500">Poojas</div>
          </Link>
        </div>

        {/* Bottom Validity Details & Edit Profile Link */}
        <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong className="text-slate-900 font-bold">Plan:</strong> {validityText}
            </span>
          </div>

          <Link
            href="/app/settings/branding"
            className="text-[11px] font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 bg-white px-2.5 py-1 rounded-lg border border-amber-300/80 shadow-2xs transition group active:scale-95"
          >
            <span>Edit Profile</span>
            <ArrowUpRight className="w-3 h-3 text-emerald-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT SETTINGS SEARCH BAR & QUICK SHORTCUTS                          */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search settings (e.g. profile, plan, catalog, backup)..."
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Recommendation Chips */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            <span className="text-[10.5px] font-bold text-slate-400 whitespace-nowrap pl-1">
              Quick:
            </span>
            {quickSettings.map((chip, idx) => {
              const ChipIcon = chip.icon;
              const content = (
                <>
                  <ChipIcon className={`w-3 h-3 ${chip.iconColor || "text-amber-800"}`} />
                  <span>{chip.label}</span>
                </>
              );

              if (chip.href) {
                return (
                  <Link
                    key={idx}
                    href={chip.href}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition shrink-0 border border-slate-200/90 shadow-2xs active:scale-95 cursor-pointer ${chip.chipBg || ""}`}
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.action}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition shrink-0 border border-slate-200/90 shadow-2xs active:scale-95 cursor-pointer ${chip.chipBg || ""}`}
                >
                  {content}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBTLE INSTALL APP (Neat & compact)                                    */}
      {/* ========================================================================= */}
      <PwaInstallBanner mode="button" />

      {/* ========================================================================= */}
      {/* 4. CATEGORIZED SETTINGS GROUPS (With Live Counts & Search Matches)        */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h3 className="text-[11.5px] font-extrabold text-slate-600 uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                const iconBgClass = (item as any).iconBg || "bg-amber-100/70 border border-amber-200";
                const iconColorClass = (item as any).iconColor || "text-amber-900";

                const content = (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl ${iconBgClass} ${iconColorClass} flex items-center justify-center shrink-0 group-hover:scale-105 transition-all shadow-2xs`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-[13px] text-slate-900 group-hover:text-amber-900 transition-colors">
                            {item.label}
                          </h4>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded-full ${
                                item.badge.includes("Pro")
                                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                  : item.badge.includes("trash")
                                  ? "bg-rose-100 text-rose-800 border border-rose-200"
                                  : "bg-amber-100 text-amber-800 border border-amber-200"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-relaxed mt-0.5 truncate">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-amber-700 group-hover:translate-x-0.5 transition-all shrink-0" />
                  </>
                );

                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="w-full text-left p-3.5 sm:p-4 flex items-center justify-between hover:bg-amber-50/40 active:bg-amber-100/40 transition group cursor-pointer"
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href || item.label}
                    href={item.href || "#"}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-amber-50/40 active:bg-amber-100/40 transition group"
                  >
                    {content}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Super Admin Portal (VISIBLE FOR SUPER_ADMIN ROLE & DEVELOPER) */}
      {(currentUser?.role === "SUPER_ADMIN" || currentUser?.email?.toLowerCase() === "manirajankg@gmail.com") && (
        <Link
          href="/admin"
          className="block bg-gradient-to-r from-emerald-950 via-[#0d3b1e] to-emerald-950 p-3.5 rounded-2xl text-white shadow-md hover:opacity-95 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-amber-400" />
              <div>
                <h4 className="font-bold text-xs">Super Admin Portal</h4>
                <p className="text-[11px] text-white/70">
                  Global metrics, validity adjustments & audit logs
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-amber-400" />
          </div>
        </Link>
      )}

      {/* Developer Footer */}
      <div className="text-center pt-2 pb-1 space-y-1.5">
        <Link
          href="/app/settings/version"
          className="inline-flex items-center gap-2 px-3 py-1 bg-amber-100/70 hover:bg-amber-200/70 border border-amber-300/80 rounded-full transition"
        >
          <VelviLogo size="sm" variant="icon" />
          <span className="text-[11px] font-bold text-amber-950">
            Velvi v{APP_VERSION}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-700 text-white rounded-full">
            Stable
          </span>
        </Link>
        <p className="text-[10.5px] text-slate-500 font-medium">
          Dedicated Vedic Astrological, Pooja & Homam ERP
        </p>
        <DeveloperCredit />
      </div>

      {/* Logout Action */}
      <button
        onClick={logout}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200/80 active:scale-98 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[90%] bg-emerald-950 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700/80 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECYCLE BIN & CHANGE HISTORY LOG (நீக்கப்பட்டவை & மீட்டெடுப்பு)     */}
      {/* ========================================================================= */}
      {showTrashModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <RotateCcw className="w-5 h-5 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Recycle Bin &amp; Change Log
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    நீக்கப்பட்டவை மற்றும் சமீபத்திய மாற்றங்கள் வரலாறு
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-slate-200 px-4 pt-2 gap-2 bg-slate-50/70">
              <button
                type="button"
                onClick={() => setTrashTab("deleted")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  trashTab === "deleted"
                    ? "border-emerald-800 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>நீக்கப்பட்டவை ({recentlyDeleted.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setTrashTab("history")}
                className={`pb-2 px-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 ${
                  trashTab === "history"
                    ? "border-emerald-800 text-emerald-900"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>மாற்றங்கள் வரலாறு ({auditLogs.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto flex-1 space-y-2.5">
              {trashTab === "deleted" ? (
                recentlyDeleted.length === 0 ? (
                  <div className="py-12 text-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-800">
                      நீக்கப்பட்ட பதிவுகள் எதுவும் இல்லை
                    </h4>
                    <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                      நீங்கள் நீக்கும் முன்பதிவுகள், பூஜைகள் அல்லது பக்தர்கள் இங்கு பட்டியலிடப்பட்டு மீட்டெடுக்க முடியும்.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1">
                      <span>மொத்தம்: {recentlyDeleted.length} பதிவுகள்</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("குப்பைத் தொட்டியில் உள்ள அனைத்து பதிவுகளையும் நிரந்தரமாக அழிக்கவா?")) {
                            db.clearRecentlyDeleted();
                            setRecentlyDeleted([]);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 font-bold"
                      >
                        Clear Trash
                      </button>
                    </div>

                    {recentlyDeleted.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-slate-50 hover:bg-amber-50/50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                                entry.type === "booking"
                                  ? "bg-blue-100 text-blue-800"
                                  : entry.type === "customer"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {entry.type}
                            </span>
                            <h5 className="font-extrabold text-xs text-slate-900 truncate max-w-[180px]">
                              {entry.title}
                            </h5>
                          </div>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">
                            {entry.subtitle}
                          </p>
                          <span className="text-[9.5px] text-slate-400 mt-1 block">
                            Deleted: {new Date(entry.deletedAt).toLocaleString("en-IN")}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRestoreItem(entry.id)}
                          className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
                          title="Restore Record"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>மீட்டெடு</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* History Tab */
                auditLogs.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    பதிவுகள் எதுவும் இல்லை (No change logs)
                  </div>
                ) : (
                  <div className="space-y-2">
                    {auditLogs.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            {log.action}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">
                          Actor: <strong>{log.actorName || "Priest"}</strong> • Target: {log.targetType || "System"}
                        </p>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowTrashModal(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close (மூடு)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
      />

      {/* Clear Demo Data Confirmation Modal */}
      {showClearDemoModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Clear Demo Data?
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  மாதிரித் தரவுகளை நீக்கு
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/70 p-3 rounded-2xl border border-rose-100">
              மாதிரி முன்பதிவுகள் (Demo Bookings) மற்றும் மாதிரி பக்தர்களின் விவரங்களை நீக்கவா? உங்கள் சொந்த முன்பதிவுகள் பாதிக்கப்படாது.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowClearDemoModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                ரத்து (Cancel)
              </button>
              <button
                type="button"
                onClick={() => {
                  const res = db.clearDemoData();
                  setShowClearDemoModal(false);
                  setToastMessage(`மாதிரி முன்பதிவுகள் (${res.removedBookings}) மற்றும் பக்தர்கள் (${res.removedCustomers}) வெற்றிகரமாக நீக்கப்பட்டன!`);
                  setTimeout(() => setToastMessage(null), 4000);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm transition cursor-pointer"
              >
                ஆம், நீக்கு (Clear)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
