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

    const fallbackTimer = setTimeout(() => {
      if (typeof window !== "undefined") {
        window.location.href = currentUser ? "/app/calendar" : "/login";
      }
    }, 1200);
    return () => clearTimeout(fallbackTimer);
  }, [currentUser, isLoading, router]);

  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            try {
              var uid = localStorage.getItem("velvi_active_user_id");
              if (uid && uid !== "LOGGED_OUT") {
                window.location.replace("/app/calendar");
              } else {
                window.location.replace("/login");
              }
            } catch(e) {}
          `,
        }}
      />
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <VelviLogo size="lg" variant="full" showTagline={false} />
          <div className="w-7 h-7 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    </>
  );
}
