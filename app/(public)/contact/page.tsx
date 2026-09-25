"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Phone, Mail, MapPin, MessageCircle, Clock, ShieldCheck, User } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";

export default function ContactUsPage() {
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
            <Phone className="w-3.5 h-3.5 text-amber-800" />
            <span>Support Desk &amp; About Us</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Contact Us &amp; About Velvi (தொடர்பு &amp; எங்களைப் பற்றி)
          </h1>
          <p className="text-xs text-slate-500">
            We are here to support your spiritual practice and application requirements.
          </p>
        </div>

        {/* About Velvi Overview */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">1</span>
            <span>About Velvi Platform</span>
          </h2>
          <p>
            <strong>Velvi (வேள்வி)</strong> is an Indian specialized Vedic Astrology, Pooja &amp; Homam booking management SaaS platform engineered specifically for traditional purohits, vadhyars, temples, and Vedic practitioners.
          </p>
          <p>
            Our mission is to help traditional priests preserve sacred time by automating diary scheduling, devotee records, auspicious Muhurtham panchangam lookups, and samagri list sharing through modern cloud technology.
          </p>
        </div>

        {/* Official Contact Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Phone & WhatsApp */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Phone className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Phone &amp; WhatsApp Support</h3>
              <p className="text-xs text-slate-500 mt-0.5">Call or WhatsApp us for instant help</p>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <a
                href="tel:+919159036301"
                className="text-emerald-700 hover:text-emerald-800 font-bold text-sm block"
              >
                +91-9159036301
              </a>
              <a
                href="https://wa.me/918300030123"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 hover:text-emerald-700 font-medium text-xs block"
              >
                Secondary WhatsApp: +91-8300030123
              </a>
              <span className="text-[11px] text-slate-500 font-medium">Available 08:00 AM – 09:00 PM IST (All Days)</span>
            </div>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-3xl p-5 border border-amber-200/80 shadow-xs space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Mail className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Official Support Email</h3>
              <p className="text-xs text-slate-500 mt-0.5">For billing, refunds &amp; inquiries</p>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <a
                href="mailto:manirajankg@gmail.com"
                className="text-blue-700 hover:text-blue-800 font-bold text-sm block"
              >
                manirajankg@gmail.com
              </a>
              <a
                href="mailto:support@velvi.app"
                className="text-slate-600 hover:text-blue-700 font-medium text-xs block"
              >
                support@velvi.app
              </a>
              <span className="text-[11px] text-slate-500 font-medium">Guaranteed response within 24 hours</span>
            </div>
          </div>
        </div>

        {/* Operating Address & Legal Entity Details */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-200/80 shadow-xs space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">2</span>
            <span>Registered Legal Entity &amp; Operating Address</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <User className="w-4 h-4 text-amber-700" />
                <span>Legal Business Entity</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                <strong>Legal Name:</strong> NACHIMUTHU MANIRAJA<br />
                <strong>Trade / Brand Name:</strong> Velvi (Vedic SaaS)<br />
                <strong>Email:</strong> manirajankg@gmail.com<br />
                <strong>Contact Phone:</strong> +91 9159036301
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                <MapPin className="w-4 h-4 text-rose-600" />
                <span>Registered Operating Location</span>
              </div>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                Velvi Software &amp; Astrology Solutions<br />
                Namakkal &amp; Chennai, Tamil Nadu, 600001, India.<br />
                Website: <span className="font-mono text-amber-800 font-semibold">https://velvi-booking-app.vercel.app</span>
              </p>
            </div>
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
