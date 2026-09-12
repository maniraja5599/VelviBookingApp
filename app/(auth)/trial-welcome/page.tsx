"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export default function TrialWelcomePage() {
  useEffect(() => {
    // Confetti celebration burst
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#C89234", "#4A2E18", "#E6B865", "#22543D"],
      });
    } catch {
      // safe fallback if canvas unsupported
    }
  }, []);

  const features = [
    "Bookings & Schedule",
    "Tamil & English Calendar",
    "Pooja & Items Templates",
    "Customer Profiles & History",
    "Payments & Iyer Settlements",
    "WhatsApp Message Generator",
    "Team Management & Double-booking Shield",
    "Cloud Backup & Offline Resilience",
  ];

  return (
    <div className="min-h-screen bg-velvi-cream flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm w-full mx-auto space-y-6 text-center">
        {/* Confetti & Icon */}
        <div className="text-4xl mb-1 animate-bounce">🎉</div>

        <div className="space-y-1">
          <h1 className="text-2xl font-black text-velvi-brownDark">You're all set!</h1>
          <p className="text-sm font-bold text-velvi-brown">
            Get <span className="text-velvi-goldDark font-black">30 days FREE</span> to explore
            all features
          </p>
        </div>

        {/* Feature List Card (Matching Mockup Screen 4) */}
        <div className="bg-white rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-2.5 text-left">
          {features.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-velvi-brownDark">
              <div className="w-4 h-4 rounded-full bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span className="font-semibold">{feat}</span>
            </div>
          ))}
        </div>

        {/* Let's Go Button */}
        <Link
          href="/app"
          className="w-full py-4 bg-gradient-to-r from-velvi-brown to-velvi-brownLight hover:opacity-95 text-white rounded-2xl font-bold text-sm shadow-sacred flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <span>Let's Go</span>
          <ArrowRight className="w-4 h-4 text-velvi-goldLight" />
        </Link>
      </div>
    </div>
  );
}
