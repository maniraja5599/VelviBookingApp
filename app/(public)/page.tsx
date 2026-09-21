"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { VelviLogo } from "@/components/ui/VelviLogo";

export default function PublicLandingPage() {
  const router = useRouter();
  const { currentUser, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (currentUser) {
      router.replace("/app/calendar");
    } else {
      router.replace("/login");
    }
  }, [currentUser, isLoading, router]);

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center space-y-4">
        <VelviLogo size="lg" variant="full" showTagline={false} />
        <div className="w-7 h-7 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );
}
