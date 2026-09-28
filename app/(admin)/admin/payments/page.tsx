"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { CreditCard, CheckCircle, ShieldCheck, Search, DollarSign, ArrowUpRight, Globe, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
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
      <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>CASHFREE PRODUCTION GATEWAY</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Cashfree Payments &amp; Cashflow
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real-time verified transactions, webhook order events, and payment ledger records
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
            <span>Total Volume</span>
            <DollarSign className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">₹{totalAmount.toLocaleString("en-IN")}</div>
          <div className="text-[10.5px] text-emerald-700 font-medium">Processed Collections</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Verified Orders</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalSuccess}</div>
          <div className="text-[10.5px] text-slate-500">Webhook Confirmed</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Gateway Engine</span>
            <CreditCard className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-lg font-black text-amber-800 font-mono">Cashfree 2026</div>
          <div className="text-[10.5px] text-slate-500">Production Mode</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Connected Domain</span>
            <Globe className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-lg font-black text-slate-900 font-mono truncate">velvi.date</div>
          <div className="text-[10.5px] text-emerald-700 font-medium">Active Production Webhook</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by order ID, gateway ref, or cycle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
        />
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-2.5">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No transactions found matching &quot;{search}&quot;.
          </div>
        ) : (
          filtered.map((p) => {
            const isExpanded = expandedPaymentId === p.id;
            return (
              <div
                key={p.id}
                className="p-3.5 bg-white rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-2xs transition"
              >
                <div
                  onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                  className="flex items-center justify-between cursor-pointer gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono font-bold text-slate-900 text-xs truncate">{p.orderId}</div>
                    <div className="text-[10px] text-slate-500 font-mono truncate">{p.gatewayPaymentId || "Cashfree Live"}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono font-black text-emerald-800 text-sm">
                      ₹{p.amount.toLocaleString("en-IN")}
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
                  onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                  className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 cursor-pointer"
                >
                  <span className="text-slate-500 uppercase text-[10px] font-mono">{p.billingCycle}</span>
                  <span className="text-slate-700 font-semibold">{p.paymentMethod || "UPI"}</span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-700" /> {p.status}
                  </span>
                </div>

                {/* Collapsible Payment Details */}
                {isExpanded && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2 text-[11px] animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">User ID</span>
                        <span className="font-mono text-slate-700 text-[10px] truncate block">{p.userId || "u-super-admin-01"}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Business ID</span>
                        <span className="font-mono text-slate-700 text-[10px] truncate block">{p.businessId || "biz-super-admin-01"}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-amber-200/50 space-y-1">
                      <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Full Transaction Timestamp</span>
                      <div className="font-mono text-slate-800 text-[10.5px]">
                        {new Date(p.createdAt).toLocaleString("en-IN", {
                          dateStyle: "full",
                          timeStyle: "medium",
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  {isExpanded ? "Hide Details" : "View Receipt & Order Details"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-3xl border border-amber-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
            <thead className="bg-amber-50/80 text-slate-700 uppercase text-[10px] tracking-wider border-b border-amber-200">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Gateway Reference</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Payment Method</th>
                <th className="p-4 text-right">Transaction Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-amber-50/30 transition">
                  <td className="p-4 font-mono font-bold text-slate-900">{p.orderId}</td>
                  <td className="p-4 font-mono text-slate-500">{p.gatewayPaymentId || "cf_live"}</td>
                  <td className="p-4 font-black text-emerald-800 text-sm">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 uppercase text-[11px] font-mono text-slate-700 font-semibold">{p.billingCycle}</td>
                  <td className="p-4">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" /> {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 font-medium">{p.paymentMethod || "UPI"}</td>
                  <td className="p-4 text-slate-500 text-right font-mono">
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
