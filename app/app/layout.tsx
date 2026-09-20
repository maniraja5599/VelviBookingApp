"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !currentUser) {
      // Auto-authenticate so visitor can use the app without having to log in
      loginWithGoogle("ravi.iyer@gmail.com", "Ravi Iyer");
    }
  }, [isLoading, currentUser, loginWithGoogle]);

  // Aggressive route prefetching for instant, zero-delay navigation
  useEffect(() => {
    const mainRoutes = [
      "/app",
      "/app/calendar",
      "/app/bookings",
      "/app/poojas",
      "/app/more",
      "/app/bookings/new",
      "/app/customers",
      "/app/team",
      "/app/payments",
      "/app/settings",
    ];
    mainRoutes.forEach((route) => {
      try {
        router.prefetch(route);
      } catch (err) {
        // Ignore prefetch errors in development
      }
    });
  }, [router]);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-100/80 flex flex-col justify-between overflow-x-clip">
        <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-[#fafaf9] shadow-xl relative flex flex-col pb-28 sm:pb-24 border-x border-slate-200/80 overflow-x-clip">
          <div className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-black tracking-wider text-emerald-950 text-base uppercase">VELVI</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 rounded-md border border-amber-300/80 leading-none">App</span>
            </div>
          </div>
          <div className="flex-1 px-3 sm:px-5 py-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-800 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-between overflow-x-clip">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-[#fafaf9] shadow-xl relative flex flex-col pb-28 sm:pb-24 border-x border-slate-200/80 overflow-x-clip">
        <MobileHeader />
        <main className="flex-1 px-3 sm:px-5 py-3 sm:py-4 overflow-x-clip">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

