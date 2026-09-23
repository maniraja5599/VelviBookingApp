"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Calendar as CalendarIcon, BookOpen, Flame, Settings } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";

export const BottomNav: React.FC = React.memo(() => {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLanguage();

  const navItems = [
    { href: "/app", label: t("home"), icon: Home },
    { href: "/app/calendar", label: t("calendar"), icon: CalendarIcon },
    { href: "/app/bookings", label: t("bookings"), icon: BookOpen },
    { href: "/app/poojas", label: t("poojaNav"), icon: Flame },
    { href: "/app/settings", label: t("settings") || "Settings", icon: Settings },
  ];

  // Hide bottom navigation on full-screen booking creation pages so action buttons are unobstructed
  if (
    pathname?.startsWith("/app/bookings/new") ||
    pathname?.startsWith("/app/bookings/quick")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-2.5 left-2.5 right-2.5 sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md md:max-w-lg z-40 bg-white/95 backdrop-blur-xl border border-amber-200/80 shadow-[0_12px_36px_rgba(200,146,52,0.14),0_4px_16px_rgba(0,0,0,0.06)] rounded-[26px] px-2 py-1.5 transition-all relative overflow-hidden before:absolute before:inset-x-8 before:top-0 before:h-[2px] before:bg-gradient-to-r before:from-transparent before:via-amber-400/80 before:to-transparent">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onMouseEnter={() => {
                try {
                  router.prefetch(item.href);
                } catch {}
              }}
              onTouchStart={() => {
                try {
                  router.prefetch(item.href);
                } catch {}
              }}
              className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-2 rounded-2xl transition-all duration-200 min-w-[56px] sm:min-w-[68px] active:scale-95 group ${
                isActive ? "text-emerald-950" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`relative flex items-center justify-center px-3.5 py-1.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-900 via-[#0d3b1e] to-emerald-950 shadow-md ring-1 ring-amber-400/50 scale-105"
                    : "group-hover:bg-slate-100/90"
                }`}
              >
                <Icon
                  className={`w-5 h-5 sm:w-5.5 sm:h-5.5 transition-all ${
                    isActive ? "text-amber-400 stroke-[2.5]" : "stroke-[1.9] text-slate-600 group-hover:text-slate-900"
                  }`}
                />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] mt-1 tracking-tight truncate max-w-[62px] sm:max-w-[76px] transition-colors leading-tight ${
                  isActive ? "font-black text-emerald-950" : "font-semibold text-slate-500"
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";


