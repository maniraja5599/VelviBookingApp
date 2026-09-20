"use client";

import React, { useState, useEffect } from "react";
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
  Globe,
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
  RefreshCw,
  AlertTriangle,
  Database,
  X,
  Check,
  Tag,
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
}

interface SettingSection {
  title: string;
  items: SettingItem[];
}

export default function SettingsHubPage() {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // Data management modals and feedback state
  const [showRemoveSampleModal, setShowRemoveSampleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Live Counts
  const [counts, setCounts] = useState({
    bookings: db.getBookings(businessId).length,
    customers: db.getCustomers(businessId).length,
    poojas: db.getPoojas(businessId).length,
  });

  useEffect(() => {
    const updateCounts = () => {
      setCounts({
        bookings: db.getBookings(businessId).length,
        customers: db.getCustomers(businessId).length,
        poojas: db.getPoojas(businessId).length,
      });
      setDataVersion((v) => v + 1);
    };

    updateCounts();
    window.addEventListener("velvi:db-change", updateCounts);
    return () => window.removeEventListener("velvi:db-change", updateCounts);
  }, [businessId]);

  const handleRemoveSampleData = () => {
    const res = db.removeSampleData(businessId);
    setShowRemoveSampleModal(false);
    setToastMessage(`மாதிரி தரவு (${res.removedBookings} முன்பதிவுகள், ${res.removedCustomers} பக்தர்கள்) நீக்கப்பட்டது! உங்கள் சொந்த தரவுகள் பாதுகாப்பாக உள்ளன.`);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleLoadSampleData = () => {
    db.loadSampleData();
    setShowLoadModal(false);
    setToastMessage("மாதிரி தரவு வெற்றிகரமாக ஏற்றப்பட்டது (Sample demo data loaded)!");
    setTimeout(() => setToastMessage(null), 5000);
  };

  const isPro =
    subscription?.status === "ACTIVE" &&
    subscription?.planCode === "VELVI_PRO";

  const settingSections: SettingSection[] = [
    {
      title: "Business & Services",
      items: [
        {
          href: "/app/settings/branding",
          label: "Business Profile & Branding",
          desc: currentBusiness?.name || "Logo, vadhyar name & receipt watermark",
          icon: Building2,
          badge: currentBusiness?.logoUrl ? "Custom Logo" : "Default Logo",
          highlight: true,
        },
        {
          href: "/app/poojas",
          label: "Pooja & Seva Catalog",
          desc: "Manage rituals, dakshina fees & item checklists",
          icon: Flame,
        },
        {
          onClick: () => setShowCategoryModal(true),
          label: "பொருட்கள் வகைகள் (Samagri Categories)",
          desc: "Create, edit & manage pooja items categories & icons",
          icon: Tag,
        },
        {
          href: "/app/customers",
          label: "Devotees & Clients (பக்தர்கள் பட்டியல்)",
          desc: "Manage devotee directory, star nakshatram & history",
          icon: Users,
        },
        {
          href: "/app/team",
          label: "Team & Purohits",
          desc: "Manage assistants, schedules & assignments",
          icon: UserCheck,
        },
      ],
    },
    {
      title: "Billing & Growth",
      items: [
        {
          href: "/app/subscription",
          label: "Subscription & Plan",
          desc: isPro ? "Velvi Pro Active • Auto-renews monthly" : "30-Day Free Trial • Upgrade to Pro",
          icon: Sparkles,
          badge: isPro ? "Pro Active" : "Free Trial",
        },
        {
          href: "/app/referrals",
          label: "Referral & Free Days",
          desc: "Invite colleagues, earn +30 days free per referral",
          icon: Gift,
        },
      ],
    },
    {
      title: "Preferences & System",
      items: [
        {
          href: "/app/settings/theme",
          label: "Theme & Sacred Colors",
          desc: "Traditional, Classic, Royal & Modern palettes",
          icon: Palette,
        },
        {
          href: "/app/data-backup",
          label: "Data & Cloud Backup",
          desc: "Excel export, contacts import & safe backup",
          icon: Cloud,
        },
        {
          href: "/app/settings/version",
          label: "Version & Release Notes",
          desc: `v${APP_VERSION} Stable • View changelog & updates`,
          icon: Sparkles,
          badge: `v${APP_VERSION}`,
        },
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">{t("settings")}</h2>
          <p className="text-xs text-velvi-brown/60">Configure your business profile & preferences</p>
        </div>
      </div>

      {/* Hero Profile & Subscription Card */}
      <div className="bg-gradient-to-br from-velvi-creamLight via-white to-amber-50/60 p-4 rounded-3xl border border-velvi-gold/30 shadow-sacred relative overflow-hidden space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <BrandLogo
              size="lg"
              variant="icon"
              customLogoUrl={currentBusiness?.logoUrl}
              businessName={currentBusiness?.name}
            />
            <div>
              <h3 className="font-bold text-sm text-velvi-brownDark">
                {currentBusiness?.name || currentUser?.name || "Velvi Pooja Services"}
              </h3>
              {currentBusiness?.iyerName && (
                <p className="text-xs text-velvi-brown/80 font-medium">
                  {currentBusiness.iyerName}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {currentUser?.mobile && (
                  <span className="text-[11px] text-velvi-brown/60 flex items-center gap-1 font-semibold">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    {currentUser.mobile}
                  </span>
                )}
                <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-velvi-brown/10 text-velvi-brown">
                  {currentUser?.role}
                </span>
              </div>
            </div>
          </div>

          {/* Subscription Status Pill */}
          <Link
            href="/app/subscription"
            className={`px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1 transition ${
              isPro
                ? "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200"
                : "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200"
            }`}
          >
            {isPro ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> PRO
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-amber-600" /> TRIAL
              </>
            )}
          </Link>
        </div>

        {/* Quick Edit Branding Bar */}
        <div className="pt-2 border-t border-velvi-gold/20 flex items-center justify-between text-xs">
          <span className="text-[11px] text-velvi-brown/70 font-medium">
            Branding & Receipt Watermark
          </span>
          <Link
            href="/app/settings/branding"
            className="text-xs font-bold text-velvi-goldDark hover:text-velvi-brown flex items-center gap-1 transition"
          >
            Edit Profile
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Language Switcher Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Globe className="w-4 h-4 text-velvi-gold" />
          <div>
            <div className="font-bold text-xs text-velvi-brownDark">Language / மொழி</div>
            <div className="text-[11px] text-velvi-brown/60">Display language preference</div>
          </div>
        </div>

        <div className="flex gap-1">
          <button
            onClick={() => setLanguage("en")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              language === "en"
                ? "bg-velvi-brown text-white shadow-sm"
                : "bg-velvi-cream text-velvi-brown"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("ta")}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
              language === "ta"
                ? "bg-velvi-brown text-white shadow-sm"
                : "bg-velvi-cream text-velvi-brown"
            }`}
          >
            தமிழ்
          </button>
        </div>
      </div>

      {/* Mobile App Install Action Banner */}
      <PwaInstallBanner mode="button" />

      {/* Categorized Settings Groups */}
      <div className="space-y-3.5">
        {settingSections.map((section) => (
          <div key={section.title} className="space-y-1.5">
            <h3 className="text-[11px] font-bold text-velvi-brown/60 uppercase tracking-wider px-1">
              {section.title}
            </h3>
            <div className="bg-white rounded-3xl border border-velvi-gold/20 shadow-sm divide-y divide-velvi-creamDark overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.onClick) {
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={item.onClick}
                      className="w-full text-left p-3.5 flex items-center justify-between hover:bg-velvi-cream/40 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-velvi-gold/10 text-velvi-brown flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-xs text-velvi-brownDark">{item.label}</h4>
                            {item.badge && (
                              <span
                                className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                                  item.badge.includes("Pro")
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-velvi-brown/60 leading-tight mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-velvi-brown/40 group-hover:text-velvi-brown transition-colors shrink-0" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.href || item.label}
                    href={item.href || "#"}
                    className="p-3.5 flex items-center justify-between hover:bg-velvi-cream/40 transition group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-velvi-gold/10 text-velvi-brown flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-velvi-brownDark">{item.label}</h4>
                          {item.badge && (
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-black rounded-full ${
                                item.badge.includes("Pro")
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-velvi-brown/60 leading-tight mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-velvi-brown/40 group-hover:text-velvi-brown transition-colors shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* DATA & STORAGE CONTROLS (Clear All Data & Load Sample Data)                */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[11px] font-bold text-velvi-brown/60 uppercase tracking-wider">
            Data &amp; Storage Controls / தரவு மேலாண்மை
          </h3>
          <span className="text-[10px] font-bold text-slate-500">
            {counts.bookings} Bookings • {counts.customers} Devotees • {counts.poojas} Poojas
          </span>
        </div>

        {/* Action Cards Container */}
        <div className="bg-white rounded-3xl p-3.5 border border-velvi-gold/20 shadow-sm space-y-2.5">
          {/* Card 1: Remove Sample Data Only (Safe Purge of Mock Records) */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200 mt-0.5">
                <Trash2 className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-amber-950 flex items-center gap-1.5">
                  <span>Remove Sample Data</span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.2 rounded">
                    மாதிரி தரவை மட்டும் நீக்கு
                  </span>
                </h4>
                <p className="text-[11px] text-amber-900/80 mt-0.5 leading-tight">
                  Safely purge only demo bookings, sample devotees, and default catalog. Your real customer records and poojas are completely preserved.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRemoveSampleModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove Sample Data</span>
            </button>
          </div>

          {/* Card 2: Load All Sample Data (Restore Demo Data) */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200 mt-0.5">
                <RefreshCw className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-emerald-950 flex items-center gap-1.5">
                  <span>Load All Sample Data</span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                    மாதிரி தரவை ஏற்று
                  </span>
                </h4>
                <p className="text-[11px] text-emerald-800/80 mt-0.5 leading-tight">
                  Restore complete demo poojas, September 2026 bookings, devotee directory, and ledgers for testing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowLoadModal(true)}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Load Sample Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* Super Admin Portal (ONLY VISIBLE FOR SUPER_ADMIN ROLE) */}
      {currentUser?.role === "SUPER_ADMIN" && (
        <Link
          href="/admin"
          className="block bg-gradient-to-r from-velvi-brown to-velvi-brownLight p-3.5 rounded-2xl text-white shadow-sacred hover:opacity-95 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-velvi-goldLight" />
              <div>
                <h4 className="font-bold text-xs">Super Admin Portal</h4>
                <p className="text-[11px] text-white/70">
                  Global metrics, validity adjustments & audit logs
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-velvi-goldLight" />
          </div>
        </Link>
      )}

      {/* App Branding, Version & Developer Footer */}
      <div className="text-center pt-2 pb-1 space-y-1.5">
        <Link
          href="/app/settings/version"
          className="inline-flex items-center gap-2 px-3 py-1 bg-velvi-gold/15 hover:bg-velvi-gold/25 border border-velvi-gold/30 rounded-full transition"
        >
          <VelviLogo size="sm" variant="icon" />
          <span className="text-[11px] font-bold text-velvi-brownDark">
            Velvi v{APP_VERSION}
          </span>
          <span className="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-600 text-white rounded-full">
            Latest
          </span>
        </Link>
        <p className="text-[10px] text-velvi-brown/50">
          Pooja • Homam • Seva Management
        </p>
        <DeveloperCredit />
      </div>

      {/* Logout Action */}
      <button
        onClick={logout}
        className="w-full py-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200/60"
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
      {/* MODAL: REMOVE SAMPLE DATA ONLY WARNING & CONFIRMATION                     */}
      {/* ========================================================================= */}
      {showRemoveSampleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Remove Sample Data Only?
                  </h3>
                  <span className="text-[11px] font-bold text-amber-800">
                    மாதிரி தரவை மட்டும் நீக்கவா?
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRemoveSampleModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Warning Details Callout */}
            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/90 text-xs text-amber-950 space-y-2">
              <p className="font-extrabold flex items-center gap-1.5 text-amber-950">
                <span>🛡️ உங்கள் சொந்த பதிவுகள் பாதுகாப்பாக இருக்கும்!</span>
              </p>
              <ul className="space-y-1 text-[11px] text-amber-900 list-disc list-inside font-medium leading-tight">
                <li>மாதிரி முன்பதிவுகள் மற்றும் மாதிரி காலண்டர் பதிவுகள் மட்டுமே நீக்கப்படும்.</li>
                <li>மாதிரி பக்தர்கள் (Demo devotees) நீக்கப்படும்.</li>
                <li>நீங்கள் கைப்பட சேர்த்த வாடிக்கையாளர்கள், தனிப்பயன் பூஜைகள் <strong>பாதுகாப்பாக இருக்கும்</strong>.</li>
              </ul>
              <p className="text-[10.5px] font-bold text-amber-900/90 pt-1 border-t border-amber-200/70">
                டெமோ மாதிரி தரவு மட்டுமே நீக்கப்படும் — உங்கள் உண்மையான பதிவுகள் அழியாது.
              </p>
            </div>

            {/* Confirmation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRemoveSampleModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Cancel (ரத்து செய்)
              </button>
              <button
                type="button"
                onClick={handleRemoveSampleData}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Sample Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOAD SAMPLE DATA CONFIRMATION                                      */}
      {/* ========================================================================= */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-emerald-200 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                  <RefreshCw className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Load All Sample Data?
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-800">
                    மாதிரி தரவை ஏற்றவா?
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Info Callout */}
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/90 text-xs text-emerald-950 space-y-2">
              <p className="font-extrabold flex items-center gap-1.5 text-emerald-950">
                <span>🔄 மாதிரி தரவு மீட்டமைக்கப்படும் (Restore Demo)</span>
              </p>
              <ul className="space-y-1 text-[11px] text-emerald-850 list-disc list-inside font-medium leading-tight">
                <li>மாதிரி முன்பதிவுகள் (September 2026 பூஜா காலண்டர்) மீண்டும் ஏற்றப்படும்.</li>
                <li>மாதிரி பக்தர்கள் விபரங்கள் மற்றும் முகவரிகள் கிடைக்கும்.</li>
                <li>பூஜை பட்டியல் மற்றும் தட்சிணை கட்டண விவரங்கள் மீட்டமைக்கப்படும்.</li>
                <li>அனைத்து அனலிட்டிக்ஸ் நிதி அறிக்கைகளும் செயல்படும்.</li>
              </ul>
            </div>

            {/* Confirmation Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLoadModal(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                Cancel (ரத்து செய்)
              </button>
              <button
                type="button"
                onClick={handleLoadSampleData}
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-sm transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Yes, Load Data</span>
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
