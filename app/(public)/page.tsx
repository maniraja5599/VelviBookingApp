"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";
import { Sparkles } from "lucide-react";

export default function PublicLandingPage() {
  const router = useRouter();

  useEffect(() => {
    // Automatically transition into the live app on the Calendar page
    router.replace("/app/calendar");
  }, [router]);

  return (
    <div className="min-h-screen bg-velvi-cream flex flex-col justify-center items-center px-4 py-12 text-center">
      <div className="max-w-sm w-full space-y-6">
        <VelviLogo size="xl" variant="full" showTagline={true} />

        <div className="bg-white/80 border border-velvi-gold/30 rounded-3xl p-6 shadow-sacred space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-velvi-gold/15 text-velvi-brown mx-auto flex items-center justify-center animate-pulse">
            <Sparkles className="w-5 h-5 text-velvi-goldDark" />
          </div>
          <h2 className="text-sm font-bold text-velvi-brownDark">
            Opening Velvi App...
          </h2>
          <p className="text-xs text-velvi-brown/70 leading-relaxed">
            Connecting directly to your calendar schedule and bookings.
          </p>

          <a
            href="/app/calendar"
            className="block w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm transition"
          >
            Enter Calendar Directly →
          </a>
        </div>

        <DeveloperCredit />
      </div>
    </div>
  );
}
