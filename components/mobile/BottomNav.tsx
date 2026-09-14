"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar as CalendarIcon, BookOpen, Flame, Menu } from "lucide-react";
import { useLanguage } from "@/components/providers/LanguageContext";

export const BottomNav: React.FC = () => {
  const pathname = usePathname();
  const { t } = useLanguage();

  const navItems = [
    { href: "/app", label: t("home"), icon: Home },
    { href: "/app/calendar", label: t("calendar"), icon: CalendarIcon },
    { href: "/app/bookings", label: t("bookings"), icon: BookOpen },
    { href: "/app/poojas", label: t("poojaNav"), icon: Flame },
    { href: "/app/more", label: t("more"), icon: Menu },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.05)] px-2 sm:px-4 py-1.5 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto transition-all">
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
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-200 min-w-[52px] sm:min-w-[62px] ${
                isActive
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <div
                className={`flex items-center justify-center px-3 py-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-900 to-emerald-950 shadow-xs scale-105"
                    : "hover:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-4.5 sm:h-4.5 transition-all ${
                    isActive ? "text-amber-400 stroke-[2.5]" : "stroke-[1.8]"
                  }`}
                />
              </div>
              <span
                className={`text-[9.5px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-[58px] sm:max-w-[72px] transition-colors ${
                  isActive ? "font-bold text-emerald-950" : "font-medium text-slate-500"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

