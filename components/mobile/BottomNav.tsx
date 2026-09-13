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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-velvi-creamLight border-t border-velvi-gold/30 shadow-[0_-4px_20px_rgba(0,0,0,0.04)] px-1 sm:px-3 py-1.5 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto">
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
              className={`flex flex-col items-center justify-center py-1 px-1.5 sm:px-3 rounded-xl transition-all duration-150 min-w-[48px] sm:min-w-[56px] ${
                isActive
                  ? "text-velvi-brown font-bold"
                  : "text-velvi-brown/60 hover:text-velvi-brown font-medium"
              }`}
            >
              <div
                className={`p-1 rounded-full transition-all ${
                  isActive ? "bg-velvi-gold/20 scale-110" : ""
                }`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${
                    isActive ? "text-velvi-goldDark stroke-[2.5]" : "stroke-[1.75]"
                  }`}
                />
              </div>
              <span className="text-[9.5px] sm:text-[10px] mt-0.5 tracking-tight truncate max-w-[54px] sm:max-w-[70px]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
