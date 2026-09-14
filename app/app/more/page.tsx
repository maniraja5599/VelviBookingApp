"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/components/providers/LanguageContext";
import {
  Users,
  UserCheck,
  CreditCard,
  Gift,
  Sparkles,
  BarChart3,
  Settings,
  Cloud,
  HelpCircle,
  ChevronRight,
  Shield,
} from "lucide-react";

import { useAuth } from "@/components/providers/AuthContext";
import { PwaInstallBanner } from "@/components/mobile/PwaInstallBanner";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { APP_VERSION } from "@/lib/version/history";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function MoreMenuPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();

  const menuSections = [
    {
      title: "Business & Contacts",
      items: [
        { href: "/app/customers", label: t("customers"), icon: Users, desc: "Manage devotees and history" },
        { href: "/app/team", label: t("team"), icon: UserCheck, desc: "Iyers, availability, settlements" },
        { href: "/app/payments", label: t("payment"), icon: CreditCard, desc: "Customer receipts & ledger" },
      ],
    },
    {
      title: "Growth & Membership",
      items: [
        { href: "/app/subscription", label: t("subscription"), icon: Sparkles, desc: "Velvi Pro plan & validity" },
        { href: "/app/referrals", label: t("referral"), icon: Gift, desc: "Invite friends, get +30 days" },
      ],
    },
    {
      title: "Data & Configuration",
      items: [
        { href: "/app/data-backup", label: t("dataBackup"), icon: Cloud, desc: "Excel export, contact import" },
        { href: "/app/settings", label: t("settings"), icon: Settings, desc: "Branding, themes, language" },
        { href: "/app/settings/version", label: "Version & Updates", icon: Sparkles, desc: `v${APP_VERSION} Changelog & timeline` },
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      <div>
        <h2 className="text-base sm:text-lg font-black text-slate-900">{t("more")}</h2>
        <p className="text-xs text-slate-500 font-medium">Explore additional tools & business settings</p>
      </div>

      {/* Business Brand Header Card */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandLogo
            size="md"
            variant="icon"
            customLogoUrl={currentBusiness?.logoUrl}
            businessName={currentBusiness?.name}
          />
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              {currentBusiness?.name || "Business Profile"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              {currentBusiness?.iyerName || "Vadhyar Profile"}
            </p>
          </div>
        </div>
        <Link
          href="/app/settings/branding"
          className="text-xs font-bold text-emerald-900 hover:text-emerald-950 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition shadow-2xs"
        >
          Branding
        </Link>
      </div>

      {/* PWA Mobile Install Card */}
      <PwaInstallBanner mode="card" />

      <div className="space-y-4">
        {menuSections.map((section, idx) => (
          <div key={idx} className="space-y-1.5">
            <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
              {section.title}
            </h3>

            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 overflow-hidden">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-emerald-800" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-900">{item.label}</h4>
                        <p className="text-[11px] text-slate-500 font-medium">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Global Admin Shortcut (Only shown for SUPER_ADMIN) */}
        {currentUser?.role === "SUPER_ADMIN" && (
          <Link
            href="/admin"
            className="block bg-gradient-to-r from-emerald-950 to-emerald-900 p-4 rounded-2xl text-white shadow-md hover:opacity-95 transition mt-2 border border-emerald-800"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-amber-300" />
                <div>
                  <h4 className="font-bold text-xs">Super Admin Portal</h4>
                  <p className="text-[11px] text-white/80">
                    Global metrics, validity adjustments & audit logs
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-velvi-goldLight" />
            </div>
          </Link>
        )}

        {/* Velvi Version, Branding & Developer Footer */}
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
      </div>
    </div>
  );
}
