"use client";

import React from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import Link from "next/link";
import {
  Building2,
  Flame,
  Users,
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
} from "lucide-react";
import { PwaInstallBanner } from "@/components/mobile/PwaInstallBanner";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { APP_VERSION } from "@/lib/version/history";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function SettingsHubPage() {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const isPro =
    subscription?.status === "ACTIVE" &&
    subscription?.planCode === "VELVI_PRO";

  const settingSections = [
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
          href: "/app/team",
          label: "Team & Purohits",
          desc: "Manage assistants, schedules & assignments",
          icon: Users,
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
          href: "/app/payments",
          label: "Payments & Ledgers",
          desc: "Devotee advances, balances & settlements",
          icon: CreditCard,
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
                return (
                  <Link
                    key={item.href}
                    href={item.href}
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
    </div>
  );
}
