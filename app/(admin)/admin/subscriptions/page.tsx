"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Sparkles, Clock, CheckCircle, Search, Calendar, ArrowUpRight, ChevronDown, ChevronUp, UserCheck, Shield } from "lucide-react";
import Link from "next/link";

export default function AdminSubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
  const subscriptions = db.subscriptions;
  const businesses = db.businesses;

  const totalActive = subscriptions.filter((s) => s.status === "ACTIVE").length;
  const totalAnnual = subscriptions.filter((s) => s.billingCycle === "YEARLY").length;
  const totalMonthly = subscriptions.filter((s) => s.billingCycle === "MONTHLY").length;

  const filtered = subscriptions.filter((sub) => {
    const biz = businesses.find((b) => b.id === sub.businessId);
    const user = db.users.find((u) => u.id === biz?.ownerId);
    const q = search.toLowerCase();
    return (
      biz?.name.toLowerCase().includes(q) ||
      sub.planName.toLowerCase().includes(q) ||
      user?.name.toLowerCase().includes(q) ||
      sub.billingCycle.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>SUBSCRIPTION ENGINE &amp; BILLING TIERS</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Subscription Management &amp; Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Plan tiers, renewal cycles, and tenant subscription status overview
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Super Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Total Subscriptions</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{subscriptions.length}</div>
          <div className="text-[10.5px] text-slate-500">Registered Accounts</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Active Paid Plans</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{totalActive}</div>
          <div className="text-[10.5px] text-emerald-700 font-medium">Valid Active Access</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Annual Plans</span>
            <Calendar className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800">{totalAnnual}</div>
          <div className="text-[10.5px] text-slate-500">365-Day Cycle</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Monthly Plans</span>
            <Clock className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800">{totalMonthly}</div>
          <div className="text-[10.5px] text-slate-500">30-Day Cycle</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by business name, plan tier, priest name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
        />
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-2.5">
        {filtered.map((sub) => {
          const biz = businesses.find((b) => b.id === sub.businessId) || businesses[0];
          const user = db.users.find((u) => u.id === biz?.ownerId);
          const isExpanded = expandedSubId === sub.id;
          const expiryFormatted = sub.currentPeriodEnd
            ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "N/A";

          return (
            <div
              key={sub.id}
              className="p-3.5 bg-white rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-2xs transition"
            >
              <div
                onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                className="flex items-start justify-between cursor-pointer gap-2"
              >
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-sm text-slate-900 truncate">{biz?.name || "Independent Service"}</h4>
                  <div className="text-[11px] text-amber-800 font-medium truncate mt-0.5">{user?.name || "Priest"}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {sub.status === "ACTIVE" ? "Active" : sub.status}
                  </span>
                  <button
                    type="button"
                    aria-label="Toggle details"
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>
              </div>

              <div
                onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 cursor-pointer"
              >
                <div>
                  <span className="text-[9.5px] text-slate-500 block uppercase font-medium">Plan</span>
                  <span className="font-bold text-amber-800">{sub.planName} ({sub.billingCycle})</span>
                </div>
                <div>
                  <span className="text-[9.5px] text-slate-500 block uppercase font-medium">Expiry</span>
                  <span className="font-bold text-slate-900 font-mono">{expiryFormatted}</span>
                </div>
              </div>

              {/* Collapsible Subscription Full Metadata */}
              {isExpanded && (
                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2 text-[11px] animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Subscription ID</span>
                      <span className="font-mono text-slate-700 text-[10px] truncate block">{sub.id}</span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Business ID</span>
                      <span className="font-mono text-slate-700 text-[10px] truncate block">{sub.businessId}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50">
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Period Start</span>
                      <span className="font-mono text-slate-700">
                        {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Auto Renewal</span>
                      <span className="font-bold text-emerald-800">
                        {sub.status === "ACTIVE" ? "Active (UPI/Gateway)" : "Manual"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpandedSubId(isExpanded ? null : sub.id)}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                {isExpanded ? "Hide Ledger Details" : "View Full Details"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-3xl border border-amber-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
            <thead className="bg-amber-50/80 text-slate-700 uppercase text-[10px] tracking-wider border-b border-amber-200">
              <tr>
                <th className="p-4">Business &amp; Priest</th>
                <th className="p-4">Plan Name</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Period Start</th>
                <th className="p-4">Period Expiry</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sub) => {
                const biz = businesses.find((b) => b.id === sub.businessId) || businesses[0];
                const user = db.users.find((u) => u.id === biz?.ownerId);
                const expiryFormatted = sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <tr key={sub.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 text-sm">{biz?.name || "Independent Service"}</div>
                      <div className="text-[10.5px] text-slate-500">{user?.name}</div>
                    </td>
                    <td className="p-4 text-amber-800 font-bold">{sub.planName}</td>
                    <td className="p-4 uppercase text-[10.5px] font-mono text-slate-700 font-semibold">{sub.billingCycle}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {sub.status === "ACTIVE" ? "Active" : sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 font-mono">
                      {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 font-bold text-slate-900 font-mono">{expiryFormatted}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
