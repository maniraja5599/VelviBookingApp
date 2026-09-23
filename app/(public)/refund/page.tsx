"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Clock, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";

export default function CancellationAndRefundPage() {
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
            Sign In / தொடங்கு
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6 flex-1">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-bold border border-amber-300/80">
            <RotateCcw className="w-3.5 h-3.5 text-amber-800" />
            <span>Fair &amp; Transparent Policy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Cancellation &amp; Refund Policy (ரத்து &amp; ரீஃபண்ட் கொள்கை)
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 2026 • 100% compliant with RBI &amp; Cashfree Merchant Guidelines
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Key Highlight Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              <Clock className="w-4 h-4 text-amber-900" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                5–7 Business Days Refund Guarantee
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                All approved refunds are processed within <strong>5 to 7 working days</strong> directly back to the original payment source (UPI account, Credit/Debit card, or Bank Account).
              </p>
            </div>
          </div>

          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">1</span>
              <span>7-Day Money-Back Period for New Subscriptions</span>
            </h2>
            <p>
              We want every vadhyar, purohit, and priest to experience the complete convenience of Velvi Pro with total peace of mind. If you are not satisfied with Velvi Pro or if you subscribed by mistake, you can request a <strong>100% full refund within 7 days</strong> of your initial payment date.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">2</span>
              <span>Duplicate or Erroneous Transactions</span>
            </h2>
            <p>
              In case of technical network glitches, server timeouts, or accidental double debits where amount is deducted twice for the same renewal, the duplicate payment will be automatically identified and refunded in full within <strong>5–7 business days</strong>.
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">3</span>
              <span>Zero Lost Days Renewal Policy</span>
            </h2>
            <p>
              When you renew or extend your Velvi Pro subscription (Monthly +30 days or Annual +365 days), your new days are added <strong>on top of your existing remaining validity</strong>. You never lose a single day even if you renew days before your current plan expires.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">4</span>
              <span>How to Request a Cancellation or Refund</span>
            </h2>
            <p>
              To request a cancellation or refund, simply contact our support desk with your registered mobile number and Order ID:
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <p>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@velvi.app" className="text-emerald-700 font-bold hover:underline">
                  support@velvi.app
                </a>
              </p>
              <p>
                <strong>WhatsApp / Call:</strong>{" "}
                <a href="https://wa.me/918300030123" target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline">
                  +91-8300030123
                </a>
              </p>
              <p>
                <strong>Response Window:</strong> We acknowledge refund requests within 24 hours.
              </p>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">5</span>
              <span>Refund Credit Timeline (Cashfree PG)</span>
            </h2>
            <p>
              Refunds are initiated through Cashfree Payments API directly back to your source account. The credited amount will reflect on your bank / credit card statement within <strong>5 to 7 working days</strong>, subject to your issuing bank&apos;s settlement timelines.
            </p>
          </section>
        </div>
      </main>

      {/* Compliance Footer */}
      <div className="max-w-4xl mx-auto w-full px-4">
        <ComplianceFooter />
      </div>
    </div>
  );
}
