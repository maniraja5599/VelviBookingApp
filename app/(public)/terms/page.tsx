"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";

export default function TermsAndConditionsPage() {
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
            <FileText className="w-3.5 h-3.5 text-amber-800" />
            <span>Legal Agreement</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Terms &amp; Conditions (பயன்பாட்டு விதிமுறைகள்)
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 2026 • Effective for all Velvi users &amp; subscribers
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">1</span>
              <span>Overview &amp; Acceptance of Terms</span>
            </h2>
            <p>
              Welcome to <strong>Velvi</strong> (&quot;the Platform&quot;), a SaaS software application designed for Vedic astrologers, priests (purohits/vadhyars), and spiritual organizers to manage pooja bookings, panchangam calendars, devotee records, and ritual samagri checklists.
            </p>
            <p>
              By signing in, accessing, or subscribing to Velvi (including Velvi Pro membership), you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">2</span>
              <span>Account Registration &amp; Security</span>
            </h2>
            <p>
              To access the features of Velvi, you must sign in via official Google Authentication. You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete business information (such as your Vadhyar name and contact phone number).
            </p>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">3</span>
              <span>Subscription &amp; Payment Terms</span>
            </h2>
            <p>
              Velvi offers free-tier usage as well as premium <strong>Velvi Pro</strong> membership plans:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Monthly Plan:</strong> ₹499 per month.</li>
              <li><strong>Annual Plan:</strong> ₹4,999 per year (inclusive of savings).</li>
            </ul>
            <p>
              All online subscription fees are securely processed through our RBI-authorized payment aggregator partner <strong>Cashfree Payments India Private Limited</strong>. By completing a payment, you authorize Cashfree to process the transaction via UPI, Cards, Netbanking, or Wallets.
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">4</span>
              <span>Panchangam &amp; Muhurtham Information</span>
            </h2>
            <p>
              Velvi provides calculated Tamil Panchangam data (Thithi, Nakshatram, Nalla Neram, Raghu Kalam). While computations adhere to standard astronomical and Drik Ganitha principles, religious dates and muhurthams should be cross-verified according to your family sampradayam and local temple traditions.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">5</span>
              <span>Governing Law &amp; Jurisdiction</span>
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to the use of Velvi shall be subject to the exclusive jurisdiction of the competent courts in <strong>Chennai, Tamil Nadu, India</strong>.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">6</span>
              <span>Support &amp; Grievances</span>
            </h2>
            <p>
              For questions regarding these Terms &amp; Conditions, please reach out via our official support channels:
            </p>
            <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1">
              <p><strong>Legal Entity:</strong> NACHIMUTHU MANIRAJA (Trade Name: Velvi)</p>
              <p><strong>Support Email:</strong> manirajankg@gmail.com / support@velvi.app</p>
              <p><strong>Contact Phone:</strong> +91 9159036301 / +91 8300030123</p>
              <p><strong>Operating Address:</strong> Namakkal &amp; Chennai, Tamil Nadu, India</p>
            </div>
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
