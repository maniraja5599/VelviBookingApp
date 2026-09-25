"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { CreditCard, CheckCircle, ShieldCheck, Search, DollarSign, ArrowUpRight, Globe } from "lucide-react";
import Link from "next/link";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const payments = db.payments;

  const totalSuccess = payments.filter((p) => p.status === "SUCCESS").length;
  const totalAmount = payments
    .filter((p) => p.status === "SUCCESS")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const filtered = payments.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.orderId.toLowerCase().includes(q) ||
      (p.gatewayPaymentId && p.gatewayPaymentId.toLowerCase().includes(q)) ||
      p.billingCycle.toLowerCase().includes(q) ||
      (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#040710] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300 shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>கேஷ்பிரீ நேரலை கட்டண கேட்வே (Cashfree PG)</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            கேஷ்பிரீ கட்டணங்கள் &amp; பணப்புழக்கம் (Payments)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            நிகழ்நேர சரிபார்க்கப்பட்ட பரிவர்த்தனைகள், வெப்ஹூக் ஆர்டர் நிகழ்வுகள் மற்றும் லெட்ஜர்
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>முதன்மை பலகை (Super Console)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>மொத்த பரிவர்த்தனை</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">₹{totalAmount.toLocaleString("en-IN")}</div>
          <div className="text-[10.5px] text-emerald-500">திரட்டப்பட்ட தக்ஷிணை / சந்தாக்கள்</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>சரிபார்க்கப்பட்டவை</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalSuccess}</div>
          <div className="text-[10.5px] text-slate-400">வெப்ஹூக் மூலம் உறுதியானது</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>கேட்வே என்ஜின்</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 font-mono">Cashfree 2026</div>
          <div className="text-[10.5px] text-slate-400">நேரலை இயக்கம் (Production)</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>இணைக்கப்பட்ட டொமைன்</span>
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-white font-mono truncate">velvi.date</div>
          <div className="text-[10.5px] text-emerald-400">செயலில் உள்ள வெப்ஹூக்</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="ஆர்டர் எண், கட்டண எண் அல்லது சுழற்சி தேட... (Filter payments)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-[#080d19] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner"
        />
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-slate-800">
            &quot;{search}&quot; என்ற குறிப்பில் பரிவர்த்தனைகள் எதுவும் இல்லை.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              className="p-4 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] rounded-2xl border border-slate-800/90 space-y-2.5 text-xs shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono font-bold text-white text-xs">{p.orderId}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{p.gatewayPaymentId || "cf_live"}</div>
                </div>
                <span className="font-mono font-black text-emerald-400 text-base">
                  ₹{p.amount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 uppercase text-[10px] font-mono">{p.billingCycle}</span>
                <span className="text-slate-300 font-semibold">{p.paymentMethod || "UPI"}</span>
                <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> {p.status}
                </span>
              </div>

              <div className="text-[10px] text-slate-400 text-right">
                {new Date(p.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-[#0c1220]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/90">
              <tr>
                <th className="p-4">ஆர்டர் எண் (Order ID)</th>
                <th className="p-4">கேட்வே எண் (Gateway Ref)</th>
                <th className="p-4">தொகை (Amount)</th>
                <th className="p-4">சுழற்சி (Cycle)</th>
                <th className="p-4">நிலை (Status)</th>
                <th className="p-4">கட்டண முறை (Method)</th>
                <th className="p-4 text-right">தேதி (Date)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4 font-mono font-bold text-white">{p.orderId}</td>
                  <td className="p-4 font-mono text-slate-400">{p.gatewayPaymentId || "cf_live"}</td>
                  <td className="p-4 font-black text-emerald-400 text-sm">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 uppercase text-[11px] font-mono text-slate-300 font-semibold">{p.billingCycle}</td>
                  <td className="p-4">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" /> {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-300 font-medium">{p.paymentMethod || "UPI"}</td>
                  <td className="p-4 text-slate-400 text-right font-mono">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
