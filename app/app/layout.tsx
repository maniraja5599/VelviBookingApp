"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading, loginWithGoogle } = useAuth();
  const router = useRouter();

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

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col justify-between overflow-x-hidden">
      <div className="w-full max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-[#fafaf9] shadow-xl relative flex flex-col pb-28 sm:pb-24 border-x border-slate-200/80 overflow-x-hidden">
        <MobileHeader />
        <main className="flex-1 px-3 sm:px-5 py-3 sm:py-4 overflow-x-hidden">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}

