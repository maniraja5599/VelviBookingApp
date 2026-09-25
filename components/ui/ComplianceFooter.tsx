"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock } from "lucide-react";
import { DeveloperCredit } from "./DeveloperCredit";

export function ComplianceFooter() {
  return (
    <footer className="w-full pt-6 pb-8 border-t border-amber-200/50 mt-8 space-y-4 text-center">
      {/* Policy Navigation Links */}
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
        <Link
          href="/pricing"
          className="hover:text-amber-900 transition-colors py-0.5"
        >
          Pricing &amp; Plans
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/terms"
          className="hover:text-amber-900 transition-colors py-0.5"
        >
          Terms &amp; Conditions
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/privacy"
          className="hover:text-amber-900 transition-colors py-0.5"
        >
          Privacy Policy
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/refund"
          className="hover:text-amber-900 transition-colors py-0.5"
        >
          Cancellation &amp; Refund
        </Link>
        <span className="text-slate-300">•</span>
        <Link
          href="/contact"
          className="hover:text-amber-900 transition-colors py-0.5"
        >
          Contact Us
        </Link>
      </nav>

      {/* Trust Badges */}
      <div className="flex items-center justify-center gap-3 text-[11px] font-medium text-slate-500 flex-wrap">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cashfree PG Verified</span>
        </div>
        <span>•</span>
        <div className="flex items-center gap-1">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>256-Bit SSL Encrypted</span>
        </div>
        <span>•</span>
        <span>Chennai, Tamil Nadu, India</span>
      </div>

      {/* Merchant Legal Information for Payment Gateway Compliance */}
      <div className="text-[11px] text-slate-500 max-w-xl mx-auto leading-relaxed pt-1 px-4">
        <p>
          <strong className="text-slate-700">Legal Entity:</strong> NACHIMUTHU MANIRAJA &bull; <strong className="text-slate-700">Brand:</strong> Velvi &bull; <strong className="text-slate-700">Support:</strong>{" "}
          <a href="mailto:manirajankg@gmail.com" className="underline hover:text-amber-900">
            manirajankg@gmail.com
          </a>{" "}
          &bull;{" "}
          <a href="tel:+919159036301" className="underline hover:text-amber-900">
            +91 9159036301
          </a>
        </p>
      </div>

      {/* Developer and Copyright */}
      <div className="pt-1">
        <DeveloperCredit />
      </div>
      <p className="text-[10px] text-slate-400">
        &copy; {new Date().getFullYear()} Velvi SaaS Platform (NACHIMUTHU MANIRAJA). All rights reserved.
      </p>
    </footer>
  );
}
