"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { BottomNav } from "@/components/mobile/BottomNav";
import { MobileHeader } from "@/components/mobile/MobileHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.replace("/login");
    }
  }, [isLoading, currentUser, router]);

  if (!isLoading && !currentUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-velvi-creamDark/20 flex flex-col justify-between">
      <div className="w-full max-w-md mx-auto min-h-screen bg-velvi-cream shadow-2xl relative flex flex-col pb-20 border-x border-velvi-gold/10">
        <MobileHeader />
        <main className="flex-1 px-4 py-3">{children}</main>
        <BottomNav />
      </div>
    </div>
  );
}
