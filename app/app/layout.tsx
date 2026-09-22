"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";
import { PlanExpiryNotice } from "@/components/subscription/PlanExpiryNotice";
import { GlobalUndoToast } from "@/components/common/GlobalUndoToast";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
      const fallbackTimer = setTimeout(() => {
        if (typeof window !== "undefined" && !localStorage.getItem("velvi_active_user_id")) {
          window.location.href = "/login";
        }
      }, 1200);
      return () => clearTimeout(fallbackTimer);
    }
  }, [isLoading, currentUser, router]);

  // First time app open: Default landing page is Calendar (/app/calendar)
  useEffect(() => {
    if (typeof window !== "undefined" && pathname === "/app") {
      const hasLanded = sessionStorage.getItem("velvi_session_landed");
      if (!hasLanded) {
        sessionStorage.setItem("velvi_session_landed", "true");
        router.replace("/app/calendar");
      }
    }
  }, [pathname, router]);

  // Scroll listener saving position for current page ("return antha page pona athe place la irukanum")
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (typeof window !== "undefined" && pathname) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          sessionStorage.setItem(`velvi_scroll_${pathname}`, window.scrollY.toString());
        }, 150);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [pathname]);

  // Restore scroll position when returning to page
  useEffect(() => {
    if (typeof window !== "undefined" && pathname) {
      const saved = sessionStorage.getItem(`velvi_scroll_${pathname}`);
      if (saved) {
        const top = parseInt(saved, 10);
        if (!isNaN(top) && top > 0) {
          const timer = setTimeout(() => {
            window.scrollTo({ top, behavior: "instant" });
          }, 70);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [pathname]);

  // Route prefetching for instant navigation in production only (disabled in dev to prevent compile bottleneck)
  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const mainRoutes = [
      "/app",
      "/app/calendar",
      "/app/bookings",
      "/app/poojas",
      "/app/settings",
      "/app/bookings/new",
      "/app/customers",
      "/app/team",
      "/app/payments",
    ];
    mainRoutes.forEach((route) => {
      try {
        router.prefetch(route);
      } catch (err) {
        // Ignore prefetch errors
      }
    });
  }, [router]);

  if (!isMounted || isLoading || !currentUser) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-between overflow-x-clip">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-[#fafaf9] shadow-xl relative flex flex-col pb-28 sm:pb-24 border-x border-slate-200/80 overflow-x-clip">
        <MobileHeader />
        <PlanExpiryNotice />
        <main className="flex-1 px-3 sm:px-5 py-3 sm:py-4 overflow-x-clip">{children}</main>
        <BottomNav />
        <GlobalUndoToast />
      </div>
    </div>
  );
}

