"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Check, Sparkles, Shield, Clock, ArrowRight, Zap } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";

export default function PublicPricingPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-800 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-amber-200/60 shadow-2xs py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="p-1.5 hover:bg-amber-100/60 rounded-full text-amber-900 transition active:scale-95"
              title="Back to Login"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <VelviLogo size="sm" variant="horizontal" showTagline={false} />
          </div>
          <Link
            href="/login"
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            Start Free Trial / தொடங்கு
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8 flex-1">
        {/* Title */}
        <div className="text-center space-y-2.5 max-w-xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>Transparent Pricing in Indian Rupees (₹)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Simple, Honest Plans for Every Purohit
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Start with a 30-Day Free Trial. Upgrade to Velvi Pro whenever you&apos;re ready. No hidden fees.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Monthly Plan */}
          <div className="bg-white rounded-3xl p-6 border border-amber-200/90 shadow-sm space-y-5 flex flex-col justify-between hover:border-amber-300 transition">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                  Monthly Membership
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                  Flexible
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹499</span>
                  <span className="text-xs text-slate-500 font-semibold">/ month</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Billed monthly • GST included • Instant activation
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Unlimited Pooja &amp; Homam Bookings</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Dual Tamil + English Panchangam Calendar</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Devotee Records &amp; PDF Slips</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Samagri Checklists &amp; WhatsApp Sharing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Assistant Iyer &amp; Team Dakshina Settlements</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Excel Data Export &amp; Import</span>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-extrabold text-xs rounded-2xl text-center transition block active:scale-98"
            >
              Choose Monthly Plan
            </Link>
          </div>

          {/* Annual Plan (Featured) */}
          <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-100/50 rounded-3xl p-6 border-2 border-amber-400 shadow-md space-y-5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-600 to-amber-700 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-xs">
              BEST VALUE • SAVE 17%
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900">
                  Annual Membership
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">
                  Save ₹989
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900">₹4,999</span>
                  <span className="text-xs text-slate-500 font-semibold">/ year</span>
                </div>
                <p className="text-[11px] text-amber-900 font-semibold mt-0.5">
                  Equivalent to ₹416/month • 12 months full access
                </p>
              </div>

              <div className="space-y-2.5 pt-2 border-t border-amber-200/60 text-xs text-slate-700">
                <div className="flex items-center gap-2 font-medium">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>All Monthly Plan Features Included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Custom Temple / Business Logo Watermark</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority WhatsApp Support (+91-8300030123)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Automated Daily Supabase Cloud Backup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Zero Lost Days Renewal Protection</span>
                </div>
              </div>
            </div>

            <Link
              href="/login"
              className="w-full py-3 bg-gradient-to-r from-amber-700 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white font-extrabold text-xs rounded-2xl text-center shadow-sm transition block active:scale-98"
            >
              Get Annual Plan &amp; Save
            </Link>
          </div>
        </div>

        {/* Payment Methods Banner */}
        <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-xs max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-0.5">
            <h4 className="font-extrabold text-xs text-slate-900">
              Accepted Payment Gateways &amp; Methods
            </h4>
            <p className="text-[11px] text-slate-500">
              UPI (GPay, PhonePe, Paytm), RuPay / Visa / Mastercard, and Netbanking.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 shrink-0">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Cashfree PG Verified</span>
          </div>
        </div>
      </main>

      {/* Compliance Footer */}
      <div className="max-w-4xl mx-auto w-full px-4">
        <ComplianceFooter />
      </div>
    </div>
  );
}
