"use client";

import React from "react";
import {
  Code2,
  Laptop,
  Database,
  Shield,
  Server,
  CreditCard,
  Flame,
  ExternalLink,
  PhoneCall,
  Mail,
} from "lucide-react";

export default function DevSpecsPage() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Developer Specs</h1>
            <p className="text-xs text-slate-500">Platform architecture, tech stack, and system information</p>
          </div>
        </div>

        {/* Hero Developer Card */}
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 sm:p-7">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0">
                M
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Maniraja</h2>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Lead Architect & Creator</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Root Super Admin
                  </span>
                </div>
                <p className="text-xs text-amber-700 font-semibold">Velvi Technologies • Tamil Nadu, India</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  Account: <strong className="text-slate-900 font-mono">manirajankg@gmail.com</strong> • ID: <strong className="text-slate-700 font-mono">u-super-admin-01</strong>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <a href="tel:+918300030123"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow transition active:scale-95 cursor-pointer">
                <PhoneCall className="w-4 h-4" />
                <span>Call +91 83000 30123</span>
              </a>
              <a href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja" target="_blank" rel="noopener noreferrer"
                className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-black flex items-center gap-2 transition active:scale-95 cursor-pointer">
                <span>WhatsApp</span>
              </a>
              <a href="mailto:manirajankg@gmail.com"
                className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer">
                <Mail className="w-4 h-4 text-amber-700" />
                <span>Send Email</span>
              </a>
            </div>
          </div>
        </div>

        {/* Grid of Technical Specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Full-Stack Framework */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center"><Laptop className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Full-Stack Framework</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">Next.js 14.2</span>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                ["Core Runtime", "Next.js 14.2.35 (React 18.3.1)"],
                ["Type System", "TypeScript 5.9.3 (Strict Mode)"],
                ["CSS & Styling", "Tailwind CSS 3.4.19 + Sacred Tokens"],
                ["Iconography", "Lucide React v0.453.0"],
                ["Excel / Reporting", "SheetJS (xlsx v0.18.5)"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}:</span>
                  <span className="font-bold text-slate-900 text-right">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Supabase PostgreSQL */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-emerald-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center"><Database className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Supabase PostgreSQL</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-md">AWS ap-south-1</span>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                ["Cloud Provider", "Supabase Cloud (PostgreSQL 15)"],
                ["Project Ref", "yyvcmfjqbeixlxcjnohn"],
                ["Core Tables", "9 Tables (users, bookings, etc.)"],
                ["Client Store", "Reactive Store (velvi_db_state_v2)"],
                ["Sync Architecture", "Hybrid Local-First + Cloud Pooler"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[140px] truncate">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Auth & Security */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-sky-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-700 flex items-center justify-center"><Shield className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Auth & Security</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-500/10 px-2 py-0.5 rounded-md">Google OAuth 2.0</span>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                ["Auth Flow", "Direct OAuth 2.0 Redirect"],
                ["OAuth Client ID", "239924321651..."],
                ["Role Engine", "SUPER_ADMIN, OWNER, IYER"],
                ["Audit Logging", "Client IP & Geolocation Auditing"],
                ["Root Account", "manirajankg@gmail.com"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[150px] truncate">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Deployment & Hosting */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-purple-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center"><Server className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Deployment & Hosting</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-500/10 px-2 py-0.5 rounded-md">Vercel Edge</span>
            </div>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Production URL:</span>
                <a href="https://velvi.date" target="_blank" rel="noopener noreferrer"
                  className="font-mono text-amber-700 hover:underline flex items-center gap-1 text-[11px]">
                  velvi.date <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">GitHub Repo:</span>
                <a href="https://github.com/maniraja5599/VelviBookingApp" target="_blank" rel="noopener noreferrer"
                  className="font-mono text-slate-700 hover:text-slate-900 flex items-center gap-1 text-[11px]">
                  maniraja5599/Velvi <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Continuous Deploy:</span>
                <span className="font-bold text-emerald-700 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Auto on git push
                </span>
              </li>
              <li className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                <span className="text-slate-500">Vercel CLI:</span>
                <span className="font-bold text-slate-900">CLI 59.23.2</span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-500">App Version:</span>
                <span className="font-bold text-amber-700 font-mono">v2.5.4 Enterprise Pro</span>
              </li>
            </ul>
          </div>

          {/* Payment & Billing */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Payment & Billing</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-500/10 px-2 py-0.5 rounded-md">Cashfree SDK</span>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                ["Gateway Provider", "Cashfree Payments (v2023-08-01)"],
                ["Supported Methods", "UPI, GPay, PhonePe, Cards, NetBanking"],
                ["Pricing Plans", "Monthly (₹499) / Annual (₹4,999)"],
                ["Developer Promo", "VELVIPRO100 (100% Free Pass)"],
                ["Trial Quota", "20 Free Devotee Bookings"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}:</span>
                  <span className="font-bold text-slate-900 text-right">{value}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Vedic Domain Engines */}
          <div className="bg-white p-5 rounded-3xl border border-amber-200/80 shadow-sm space-y-3 hover:border-rose-200 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center"><Flame className="w-4 h-4" /></div>
                <h3 className="font-black text-sm text-slate-900">Vedic Domain Engines</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md">8 Homams</span>
            </div>
            <ul className="space-y-2 text-xs">
              {[
                ["Panchangam Engine", "Thithi, Nakshatram, Rahu Kalam, Yamagandam"],
                ["Homam Templates", "Ganapathi, Navagraha, Sudarshana, etc."],
                ["Samagri Checklists", "30+ items per homam with Tamil names"],
                ["Devotee Slips", "1-Tap WhatsApp Receipts & Dakshina Slips"],
                ["Cloud Sync", "Offline-First & Realtime Cloud Replication"],
              ].map(([label, value]) => (
                <li key={label} className="flex items-center justify-between border-b border-slate-100 pb-1.5 last:border-0 last:pb-0">
                  <span className="text-slate-500">{label}:</span>
                  <span className="font-bold text-slate-900 text-right">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Database Schema Card */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-700" />
              <h3 className="font-black text-sm sm:text-base text-slate-900">Supabase PostgreSQL — 9 Core Tables Schema</h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">Managed AWS ap-south-1</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "users", desc: "Vadhyars, priests, super admin accounts, IP address & location telemetry" },
              { name: "businesses", desc: "Vadhyar booking enterprise profiles, phone, whatsapp, logo branding" },
              { name: "subscriptions", desc: "Plan codes, trial periods, renewal cycles, validity dates" },
              { name: "poojas", desc: "8 Authentic Vedic Homams + custom user poojas + samagri item checklists" },
              { name: "bookings", desc: "Devotee appointments, date/time, muhurtham slots, priest assignments" },
              { name: "customers", desc: "Devotee directory with gothram, rasi, nakshatram & family records" },
              { name: "payments", desc: "Dakshina accounts, advance settlements, Cashfree transaction IDs" },
              { name: "members", desc: "Assistant priests & vadhyar team members with role access" },
              { name: "audit_logs", desc: "Tamper-evident Super Admin security audit trail with client IPs" },
            ].map((tbl, i) => (
              <div key={tbl.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-black text-amber-700">{i + 1}. {tbl.name}</span>
                  <span className="text-[9px] font-bold bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Table</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">{tbl.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
