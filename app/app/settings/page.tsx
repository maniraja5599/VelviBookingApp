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
  const { t } = useLanguage();

  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
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

  const allSettingSections: SettingSection[] = [
    {
      title: "Business & Profile / வணிகம் & சுயவிவரம்",
      items: [
        {
          href: "/app/settings/branding",
          label: "Business Profile & Branding (சுயவிவரம்)",
          desc: currentBusiness?.name || "Logo, vadhyar name, service name & receipt watermark",
          icon: Building2,
          badge: currentBusiness?.logoUrl ? "Custom Logo" : "Default Logo",
          highlight: true,
          keywords: "profile branding vadhyar name logo watermark business பெயர் லோகோ",
        },
        {
          href: "/app/poojas",
          label: "Pooja & Seva Catalog (பூஜா பட்டியல்)",
          desc: "Manage rituals, dakshina fees & item checklists",
          icon: Flame,
          keywords: "pooja homam seva dakshina fee samagri checklist பூஜை தட்சிணை ஹோமம்",
        },
        {
          onClick: () => setShowCategoryModal(true),
          label: "பொருட்கள் வகைகள் (Samagri Categories)",
          desc: "Create, edit & manage pooja items categories & icons",
          icon: Tag,
          keywords: "category categories samagri items பொருட்கள் வகைகள் மலர் மளிகை பழங்கள்",
        },
        {
          href: "/app/customers",
          label: "Devotees & Clients (பக்தர்கள் பட்டியல்)",
          desc: "Manage devotee directory, star nakshatram & history",
          icon: Users,
          keywords: "customer devotee client phone mobile nakshatram rasi பக்தர்கள் வாடிக்கையாளர்",
        },
        {
          href: "/app/team",
          label: "Team & Purohits (உதவி புரோகிதர்கள்)",
          desc: "Manage assistants, schedules & assignments",
          icon: UserCheck,
          keywords: "team assistant purohit vadhyar staff purohits புரோகிதர் குழு",
        },
      ],
    },
    {
      title: "Data & Safety / தரவு & மீட்டெடுப்பு",
      items: [
        {
          onClick: () => setShowTrashModal(true),
          label: "Recycle Bin & Restore Log (நீக்கப்பட்டவை & மீட்டெடுப்பு)",
          desc: `${recentlyDeleted.length} deleted item(s) • View changes & restore records`,
          icon: RotateCcw,
          badge: recentlyDeleted.length > 0 ? `${recentlyDeleted.length} in trash` : undefined,
          keywords: "trash restore recycle bin delete undo recover change log மீட்டெடு நீக்கப்பட்டவை",
        },
        {
          href: "/app/data-backup",
          label: "Data & Cloud Backup (தரவு பேக்கப்)",
          desc: "Excel export, contacts import & safe backup",
          icon: Cloud,
          keywords: "backup export excel csv import restore cloud தரவு பேக்கப் எக்செல்",
        },
      ],
    },
    {
      title: "Billing & Growth / சந்தா & வளர்ச்சி",
      items: [
        {
          href: "/app/subscription",
          label: "Subscription & Plan (திட்டம் & சந்தா)",
          desc: isPro ? "Velvi Pro Active • Auto-renews" : "30-Day Free Trial • Upgrade to Pro",
          icon: Sparkles,
          badge: isPro ? "Pro Active" : "Free Trial",
          keywords: "subscription plan pro trial billing upi payment renew சந்தா கட்டணம்",
        },
        {
          href: "/app/referrals",
          label: "Referral & Free Days (பரிந்துரை)",
          desc: "Invite colleagues, earn +30 days free per referral",
          icon: Gift,
          keywords: "referral invite reward free days நண்பர்கள் பரிந்துரை",
        },
      ],
    },
    {
      title: "Preferences & System / விருப்பங்கள் & அமைப்புகள்",
      items: [
        {
          href: "/app/settings/theme",
          label: "Theme & Sacred Colors (வண்ண தீம்கள்)",
          desc: "Traditional, Bilva Green, Royal Kumkum & Modern palettes",
          icon: Palette,
          keywords: "theme color style palette sacred dark light பச்சை குங்குமம் தீம்",
        },
        {
          href: "/app/settings/version",
          label: "Version & Release Notes (பதிப்பு)",
          desc: `v${APP_VERSION} Stable • View changelog & updates`,
          icon: Sparkles,
          badge: `v${APP_VERSION}`,
          keywords: "version release notes changelog update பதிப்பு புதியவை",
        },
      ],
    },
  ];

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

  // Quick chips for common settings
  const quickSettings = [
    { label: "சுயவிவரம் (Profile)", icon: Pencil, action: () => (window.location.href = "/app/settings/branding") },
    { label: "வகைகள் (Categories)", icon: Tag, action: () => setShowCategoryModal(true) },
    { label: "மீட்டெடுப்பு (Trash)", icon: RotateCcw, action: () => setShowTrashModal(true) },
    { label: "பக்தர்கள் (Devotees)", icon: Users, action: () => (window.location.href = "/app/customers") },
    { label: "பூஜைகள் (Poojas)", icon: Flame, action: () => (window.location.href = "/app/poojas") },
    { label: "தீம்கள் (Themes)", icon: Palette, action: () => (window.location.href = "/app/settings/theme") },
    { label: "பேக்கப் (Backup)", icon: Cloud, action: () => (window.location.href = "/app/data-backup") },
  ];

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header & Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">{t("settings")}</h2>
          <p className="text-xs text-velvi-brown/60">Manage your business profile, rituals & preferences</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO NAME & BRANDING CARD (Prominent & Elegant with Pencil Icon)       */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 p-4 sm:p-5 rounded-3xl border-2 border-amber-300/80 shadow-sacred relative overflow-hidden space-y-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar / Logo with quick edit badge */}
            <div className="relative shrink-0">
              <BrandLogo
                size="lg"
                variant="icon"
                customLogoUrl={currentBusiness?.logoUrl}
                businessName={currentBusiness?.name}
                className="ring-2 ring-amber-400/40 shadow-xs"
              />
              <Link
                href="/app/settings/branding"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center shadow-md hover:bg-emerald-900 transition active:scale-95 border-2 border-white"
                title="Edit Profile Picture / Logo"
                aria-label="Edit Profile"
              >
                <Pencil className="w-3 h-3 text-amber-300" />
              </Link>
            </div>

            {/* Name & Service Title */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-extrabold text-base text-slate-900 tracking-tight truncate max-w-[200px] sm:max-w-xs">
                  {currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}
                </h3>
                <Link
                  href="/app/settings/branding"
                  className="p-1 text-slate-500 hover:text-emerald-800 hover:bg-amber-200/50 rounded-lg transition"
                  title="சுயவிவரத்தைத் திருத்து (Edit Profile)"
                >
                  <Pencil className="w-3.5 h-3.5 text-amber-700" />
                </Link>
              </div>

              {/* Service Name */}
              <p className="text-xs font-semibold text-emerald-900 truncate max-w-[240px] mt-0.5">
                {currentBusiness?.serviceName || "Pooja • Homam • Seva"}
              </p>

              {/* Phone & Role */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {currentUser?.mobile && (
                  <span className="text-[11px] text-slate-700 flex items-center gap-1 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-amber-200/60 shadow-2xs">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {currentUser.mobile}
                  </span>
                )}
                <span className="text-[10px] px-2 py-0.5 rounded-md font-extrabold bg-amber-200/70 text-amber-950 border border-amber-300/80">
                  {currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Vadhyar"}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Validity Pill (Kutty a show pannu) */}
          <Link
            href="/app/subscription"
            className={`shrink-0 px-2.5 py-1.5 rounded-2xl text-[10.5px] font-black border flex items-center gap-1.5 transition active:scale-95 shadow-2xs ${
              isPro
                ? "bg-emerald-100/90 text-emerald-900 border-emerald-300 hover:bg-emerald-200"
                : "bg-amber-100/90 text-amber-900 border-amber-300 hover:bg-amber-200"
            }`}
            title="Subscription Validity"
          >
            {isPro ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Pro Active</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-700" />
                <span>Trial</span>
              </>
            )}
          </Link>
        </div>

        {/* Compact Validity Details & Edit Profile Link */}
        <div className="pt-2.5 border-t border-amber-200/70 flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
            <Calendar className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>செல்லுபடியாகும் காலம்:</strong> {validityText}
            </span>
          </div>

          <Link
            href="/app/settings/branding"
            className="text-xs font-bold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-xl border border-amber-300/80 shadow-2xs transition group"
          >
            <span>சுயவிவரம் திருத்து</span>
            <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COMPACT SETTINGS SEARCH BAR & QUICK SUGGESTIONS                        */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="அமைப்புகளைத் தேடுக... (Search Settings e.g. profile, pooja, trash)"
            className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-2xs text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/40 focus:border-emerald-700 transition"
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

        {/* Quick Recommendation Chips (சமீபத்திய அமைப்புகள்) */}
        {!searchQuery && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar pt-0.5">
            <span className="text-[10.5px] font-bold text-slate-500 whitespace-nowrap pl-1">
              பரிந்துரைகள்:
            </span>
            {quickSettings.map((chip, idx) => {
              const ChipIcon = chip.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={chip.action}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-amber-100/80 text-slate-700 text-[11px] font-semibold transition shrink-0 border border-slate-200/80 active:scale-95"
                >
                  <ChipIcon className="w-3 h-3 text-amber-800" />
                  <span>{chip.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. SUBTLE INSTALL APP (Romba highlight venam - neat & compact)           */}
      {/* ========================================================================= */}
      <PwaInstallBanner mode="button" />

      {/* ========================================================================= */}
      {/* 4. CATEGORIZED SETTINGS GROUPS (With Live Counts & Search Matches)        */}
      {/* ========================================================================= */}
      <div className="space-y-3.5">
        {filteredSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h3 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="w-full text-left p-3.5 flex items-center justify-between hover:bg-amber-50/40 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs text-slate-900">{item.label}</h4>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-extrabold rounded-full bg-emerald-100 text-emerald-800">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href || item.label}
                    href={item.href || "#"}
                    className="p-3.5 flex items-center justify-between hover:bg-amber-50/40 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-900 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-xs text-slate-900">{item.label}</h4>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-extrabold rounded-full ${
                                item.badge.includes("Pro")
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Super Admin Portal (ONLY VISIBLE FOR SUPER_ADMIN ROLE) */}
      {currentUser?.role === "SUPER_ADMIN" && (
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
          வேத ஜோதிட, பூஜை மற்றும் ஹோம முன்பதிவு செயலி
        </p>
        <DeveloperCredit />
      </div>

      {/* Logout Action */}
      <button
        onClick={logout}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200/80 active:scale-98 cursor-pointer"
      >
        <LogOut className="w-4 h-4" />
        <span>வெளியேறு (Sign Out)</span>
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
    </div>
  );
}
