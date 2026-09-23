"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, CheckCircle2, Database, EyeOff } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";

export default function PrivacyPolicyPage() {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 rounded-full text-xs font-bold border border-emerald-300/80">
            <Shield className="w-3.5 h-3.5 text-emerald-700" />
            <span>Privacy &amp; Data Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Privacy Policy (தனியுரிமைக் கொள்கை)
          </h1>
          <p className="text-xs text-slate-500">
            Last Updated: September 2026 • Dedicated to protecting your devotees&apos; sacred data
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">1</span>
              <span>Our Commitment to Privacy</span>
            </h2>
            <p>
              At <strong>Velvi</strong>, we deeply respect the confidentiality of our users (priests, vadhyars, astrologers) and the sacred devotee records entrusted to them. This Privacy Policy details what information we collect, how it is stored, and how your data is safeguarded.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">2</span>
              <span>Information We Collect</span>
            </h2>
            <p>
              We collect only the minimum required information necessary to provide booking management and billing:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>User Account Data:</strong> Name, Email, and Profile picture provided during Google Sign-In.</li>
              <li><strong>Business Profile:</strong> Vadhyar name, business name, WhatsApp / mobile number, and optional logo for pooja receipts.</li>
              <li><strong>Devotee / Pooja Records:</strong> Devotee name, phone number, star nakshatram, gothram, ritual date, dakshina fees, and required item checklists.</li>
              <li><strong>Payment Data:</strong> Order IDs, amounts, and transaction status returned by Cashfree. <em>(Note: Sensitive card numbers, CVVs, and UPI PINs are entered directly on Cashfree&apos;s PCI-DSS compliant screens and are NEVER stored or seen by Velvi)</em>.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">3</span>
              <span>How We Protect Your Data (Security &amp; Encryption)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>256-Bit SSL Encryption</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  All communications between your device and our servers are encrypted using industry-standard TLS/SSL protocols.
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span>Secure Cloud &amp; Offline Cache</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Data is securely synchronized to Supabase PostgreSQL enterprise infrastructure with Row Level Security (RLS).
                </p>
              </div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">4</span>
              <span>No Sale or Sharing of Devotee Data</span>
            </h2>
            <p>
              <strong>We never sell, rent, or trade devotee records, names, or contact lists to any third parties or advertisers.</strong> Your devotee contact records belong exclusively to your priest account.
            </p>
          </section>

          {/* Section 5 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">5</span>
              <span>Data Export &amp; Account Deletion</span>
            </h2>
            <p>
              You maintain full ownership of your records. You may export all devotee contacts, pooja histories, and dakshina records to Excel / CSV at any time via Settings &gt; Data &amp; Cloud Backup. You may request account deletion by emailing support@velvi.app.
            </p>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black flex items-center justify-center">6</span>
              <span>Privacy Contact</span>
            </h2>
            <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200 text-xs space-y-1">
              <p><strong>Privacy Officer:</strong> Mani Raja</p>
              <p><strong>Email:</strong> support@velvi.app</p>
              <p><strong>Phone:</strong> +91-8300030123</p>
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
