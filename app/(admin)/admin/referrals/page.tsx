"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Gift, Clock, CheckCircle, Hourglass, Users, Search, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function AdminReferralsPage() {
  const [filter, setFilter] = useState<"ALL" | "SIGNUP_ONLY" | "PAID">("ALL");
  const [search, setSearch] = useState("");
  const referrals = db.referrals;

  const totalInvites = referrals.length;
  const signedUpOnlyCount = referrals.filter((r) => r.status === "PENDING").length;
  const paidCount = referrals.filter((r) => r.status === "REWARDED").length;
  const totalDaysAwarded = paidCount * 30;

  const filteredReferrals = referrals.filter((r) => {
    const matchesFilter =
      filter === "ALL" ||
      (filter === "SIGNUP_ONLY" && r.status === "PENDING") ||
      (filter === "PAID" && r.status === "REWARDED");

    const matchesSearch =
      r.referrerName.toLowerCase().includes(search.toLowerCase()) ||
      r.refereeName.toLowerCase().includes(search.toLowerCase()) ||
      r.referralCode.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 shadow-2xs">
            <Gift className="w-3.5 h-3.5 text-amber-700" />
            <span>VIRAL GROWTH &amp; REFERRAL ENGINE</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Referral Network &amp; Reward Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Track tenant invitations, conversion milestones, and mutual +30 days bonus validity
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

      {/* KPI Counters: Total vs Signup Only vs Payment Done */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Total Invitations</span>
            <Users className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalInvites}</div>
          <div className="text-[10.5px] text-slate-500">Outbound Invites</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-amber-800 flex items-center justify-between">
            <span>Signed Up (Unpaid)</span>
            <Hourglass className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800">{signedUpOnlyCount}</div>
          <div className="text-[10.5px] text-amber-700 font-medium">Pending First Payment</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>Paid &amp; Converted</span>
            <CheckCircle className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{paidCount}</div>
          <div className="text-[10.5px] text-emerald-700 font-medium">Rewards Unlocked</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Bonus Days Given</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800">+{totalDaysAwarded}d</div>
          <div className="text-[10.5px] text-slate-500">+30 Days to Each Party</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by referrer, friend, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-semibold">
          {[
            { key: "ALL", label: `All Referrals (${totalInvites})` },
            { key: "SIGNUP_ONLY", label: `Pending Payment (${signedUpOnlyCount})` },
            { key: "PAID", label: `Rewarded (${paidCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-2 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                filter === key
                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {filteredReferrals.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No referrals found matching &quot;{search}&quot;.
          </div>
        ) : (
          filteredReferrals.map((r) => {
            const isPaid = r.status === "REWARDED";
            return (
              <div
                key={r.id}
                className="p-4 bg-white rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Referrer → Referee</span>
                    <div className="font-extrabold text-slate-900 text-sm">
                      {r.referrerName} <span className="text-amber-600">→</span> {r.refereeName}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200 text-[10px]">
                    {r.referralCode}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                      isPaid
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {isPaid ? <CheckCircle className="w-3 h-3 text-emerald-700" /> : <Hourglass className="w-3 h-3 text-amber-700" />}
                    <span>{isPaid ? "Payment Verified" : "Payment Pending"}</span>
                  </span>

                  <span className={`font-bold text-[10.5px] ${isPaid ? "text-emerald-800" : "text-slate-500"}`}>
                    {isPaid ? "+30 Days to Both" : "Pending"}
                  </span>
                </div>

                <div className="text-[10px] text-slate-500 text-right font-mono">
                  Joined: {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </div>
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
                <th className="p-4">Referrer</th>
                <th className="p-4">Invited Tenant (Friend)</th>
                <th className="p-4">Promo Code</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Reward Status</th>
                <th className="p-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReferrals.map((r) => {
                const isPaid = r.status === "REWARDED";

                return (
                  <tr key={r.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 text-sm">{r.referrerName}</div>
                      <div className="text-[10px] text-slate-500">Referrer</div>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-amber-900 text-sm">{r.refereeName}</div>
                      <div className="text-[10px] text-slate-500">Priest / Client</div>
                    </td>
                    <td className="p-4 font-mono text-amber-800 font-bold tracking-wider">{r.referralCode}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1.5 ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                            <span>First Payment Confirmed</span>
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3.5 h-3.5 text-amber-700" />
                            <span>Signed Up • Payment Pending</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {isPaid ? (
                        <span className="text-emerald-800 font-extrabold">+30 Days Awarded to Both</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Awaiting First Payment</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-right font-mono">
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </td>
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
