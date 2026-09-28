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

  const navItems = React.useMemo(
    () => [
      { href: "/app", label: t("home"), icon: Home },
      { href: "/app/calendar", label: t("calendar"), icon: CalendarIcon },
      { href: "/app/bookings", label: t("bookings"), icon: BookOpen },
      { href: "/app/poojas", label: t("poojaNav"), icon: Flame },
      { href: "/app/settings", label: t("settings") || "Settings", icon: Settings },
    ],
    [t]
  );

  // Optimistic path for 0ms instantaneous tap feedback
  const [optimisticPath, setOptimisticPath] = React.useState<string>(pathname || "/app");

  // Keep optimistic path synchronized whenever route change completes
  React.useEffect(() => {
    if (pathname) {
      setOptimisticPath(pathname);
    }
  }, [pathname]);

  // Warm up and prefetch all 5 primary bottom navigation routes on mount
  React.useEffect(() => {
    navItems.forEach((item) => {
      try {
        router.prefetch(item.href);
      } catch {}
    });
  }, [navItems, router]);

  // Hide bottom navigation on full-screen booking creation pages so action buttons are unobstructed
  if (
    pathname?.startsWith("/app/bookings/new") ||
    pathname?.startsWith("/app/bookings/quick")
  ) {
    return null;
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Instant optimistic visual feedback in 0ms
    setOptimisticPath(href);

    // Light subtle haptic feedback on supported mobile devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }

    // If user is already on the page and taps Home, smooth scroll to top
    if (href === "/app" && pathname === "/app") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 w-full z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:shadow-[0_-2px_16px_rgba(0,0,0,0.05)] transition-all duration-150 select-none touch-manipulation"
    >
      {/* Responsive layout: 5 equal columns on mobile, elegant centered row on desktop */}
      <div className="w-full max-w-4xl lg:max-w-5xl mx-auto px-1 sm:px-3 md:px-6 h-[68px] md:h-16 flex items-center justify-between">
        {navItems.map((item) => {
          const currentPath = optimisticPath || pathname;
          const isActive =
            item.href === "/app"
              ? currentPath === "/app"
              : currentPath.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={(e) => handleNavClick(e, item.href)}
              className="flex-1 flex items-center justify-center h-full group focus:outline-none"
            >
              {/* Desktop layout: Slim horizontal pill (Icon + Label side by side) */}
              <div
                className={`hidden md:flex items-center gap-2.5 px-4 lg:px-5 py-2.5 rounded-xl transition-all duration-150 ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-950 via-[#0d3b1e] to-emerald-900 text-amber-300 shadow-sm ring-1 ring-amber-400/30"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-100/90"
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    isActive
                      ? "text-amber-400 stroke-[2.4]"
                      : "text-slate-600 group-hover:text-slate-950 stroke-[1.9]"
                  }`}
                />
                <span
                  className={`text-xs tracking-tight ${
                    isActive ? "font-bold text-amber-300" : "font-semibold text-slate-700 group-hover:text-slate-950"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Mobile layout: Perfectly centered vertical stack inside spacious white bar */}
              <div className="md:hidden flex flex-col items-center justify-center w-full py-1">
                <div
                  className={`flex items-center justify-center px-3.5 py-1.5 rounded-xl transition-all duration-150 ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-950 via-[#0d3b1e] to-emerald-900 shadow-2xs ring-1 ring-amber-400/30"
                      : "text-slate-500 group-active:bg-slate-100"
                  }`}
                >
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${
                      isActive
                        ? "text-amber-400 stroke-[2.3]"
                        : "text-slate-600 group-hover:text-slate-900 stroke-[1.85]"
                    }`}
                  />
                </div>
                <span
                  className={`text-[10.5px] sm:text-[11px] mt-0.5 tracking-tight truncate max-w-[68px] transition-colors leading-tight ${
                    isActive
                      ? "font-extrabold text-emerald-950"
                      : "font-semibold text-slate-500 group-hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
});

BottomNav.displayName = "BottomNav";


