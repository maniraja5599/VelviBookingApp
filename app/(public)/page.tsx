"use client";

import React from "react";
import Link from "next/link";
import {
  Calendar,
  Flame,
  MessageCircle,
  Users,
  CreditCard,
  Cloud,
  Gift,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function PublicLandingPage() {
  return (
    <div className="min-h-screen bg-velvi-cream text-velvi-brownDark">
      {/* Navigation Header */}
      <header className="border-b border-velvi-gold/20 bg-velvi-cream/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <VelviLogo size="sm" variant="horizontal" />
          </Link>

          <div className="flex items-center gap-2.5">
            <Link
              href="/login"
              className="text-xs font-bold text-velvi-brown hover:text-velvi-goldDark px-3 py-1.5 transition"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-xs font-bold bg-velvi-brown hover:bg-velvi-brownLight text-white px-4 py-2 rounded-xl shadow-sacred transition"
            >
              Start 30 Days Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 pt-10 pb-12 max-w-4xl mx-auto text-center space-y-5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-velvi-gold/15 border border-velvi-gold/40 text-velvi-brown text-xs font-bold">
          <span>🪔</span>
          <span>Pooja • Homam • Seva Management</span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-velvi-brownDark tracking-tight leading-tight">
          Manage your Pooja Services <br className="hidden sm:inline" />
          with Ease & Sacred Tradition.
        </h1>

        <p className="text-sm md:text-base text-velvi-brown/80 max-w-xl mx-auto leading-relaxed">
          Designed specifically for Iyers, Purohits, and Vedic service providers. Seamless
          bookings, dual Tamil+English calendar, WhatsApp item lists, and Iyer settlements.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-velvi-brown to-velvi-brownLight hover:opacity-95 text-white rounded-2xl font-bold text-sm shadow-sacred flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <span>Start 30 Days FREE</span>
            <ArrowRight className="w-4 h-4 text-velvi-goldLight" />
          </Link>
          <Link
            href="/app"
            className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-velvi-creamDark/30 text-velvi-brown rounded-2xl font-bold text-sm border border-velvi-gold/30 shadow-sm flex items-center justify-center gap-2 transition"
          >
            <span>Explore Demo App</span>
          </Link>
        </div>

        <p className="text-xs text-velvi-brown/60">
          No credit card required • Instant 30 days full access
        </p>
      </section>

      {/* 9 Core Feature Highlights Grid */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-velvi-brownDark">Everything an Iyer Needs</h2>
          <p className="text-xs text-velvi-brown/70 mt-1">
            Feature-rich backend, ultra-simple frontend for mobile
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
          {[
            {
              icon: Calendar,
              title: "Tamil + English Calendar",
              desc: "Gregorian date alongside Tamil solar month, day, and auspicious Panchangam timings.",
            },
            {
              icon: Flame,
              title: "Pooja & Homam Templates",
              desc: "Pre-loaded with Ganapathi, Gruhapravesam, Navagraha, Ayushya and required item checklists.",
            },
            {
              icon: MessageCircle,
              title: "WhatsApp Flyer Generator",
              desc: "1-tap instant PNG flyer creation with temple border, deepam motifs and customer item tables.",
            },
            {
              icon: Users,
              title: "Iyer Team & Conflict Checks",
              desc: "Assign purohits with real-time double-booking prevention and immutable reassignment logs.",
            },
            {
              icon: CreditCard,
              title: "Receipts & Iyer Settlements",
              desc: "Track customer advances, pending balances, and Iyer fixed or percentage payouts.",
            },
            {
              icon: Cloud,
              title: "Cloud Backup & Excel Export",
              desc: "Encrypted cloud persistence with complete XLSX, CSV, and JSON data exports.",
            },
            {
              icon: Gift,
              title: "Referral Rewards (+30 Days)",
              desc: "Earn 30 free days for both you and your friend upon verified subscription.",
            },
            {
              icon: Sparkles,
              title: "Live Themes & Custom Branding",
              desc: "Traditional, Classic, Royal, Modern, and Custom styles with your business logo.",
            },
            {
              icon: Shield,
              title: "Super Admin Console",
              desc: "Complete desktop panel for platform owner to monitor users, revenue, and validity.",
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-2 hover:border-velvi-gold/50 transition"
              >
                <div className="w-10 h-10 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center">
                  <Icon className="w-5 h-5 text-velvi-goldDark" />
                </div>
                <h3 className="font-bold text-sm text-velvi-brownDark">{item.title}</h3>
                <p className="text-xs text-velvi-brown/70 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing Section (Point 13 & 90) */}
      <section className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <span className="text-xs font-bold text-velvi-goldDark uppercase tracking-widest">
          Simple Transparent Pricing
        </span>
        <h2 className="text-2xl font-bold text-velvi-brownDark">One Plan. Everything Included.</h2>

        <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-3xl p-6 border-2 border-velvi-gold shadow-sacred space-y-4 text-left relative overflow-hidden">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-xl text-velvi-brownDark">Velvi Pro</h3>
            <span className="bg-velvi-gold text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
              30 Days Free Trial
            </span>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-velvi-brownDark">₹499</span>
              <span className="text-xs text-velvi-brown/70 font-semibold">/ month</span>
            </div>
            <div className="text-xs text-velvi-sacredGreen font-bold">
              or ₹4,999 / year (Save ₹989)
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-velvi-gold/20 text-xs text-velvi-brownDark">
            {[
              "Unlimited Bookings & Calendar Management",
              "Tamil + English Gregorian Calendar",
              "WhatsApp Item List Flyer Image Generation",
              "Iyer Team Scheduling & Double-booking Shield",
              "Customer History & Iyer Settlement Tracking",
              "Automated Cloud Backup & Excel Export",
              "+30 Day Referral Rewards",
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-velvi-sacredGreen shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          <Link
            href="/login"
            className="block w-full py-3.5 bg-velvi-brown hover:bg-velvi-brownLight text-white text-center rounded-xl font-bold text-xs shadow-sm transition"
          >
            Start 30 Days Free Now
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-velvi-gold/20 py-6 text-center text-xs text-velvi-brown/60 space-y-2">
        <p className="font-bold text-velvi-brownDark">Velvi — Tradition Organized</p>
        <p>Pooja • Homam • Seva Management Platform</p>
        <DeveloperCredit />
      </footer>
    </div>
  );
}
