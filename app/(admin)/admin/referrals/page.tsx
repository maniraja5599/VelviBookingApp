"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Gift, ShieldCheck, Clock, CheckCircle, Hourglass, Users, Search, ArrowUpRight } from "lucide-react";
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
      <div className="bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#040710] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-[11px] font-bold text-amber-300 shadow-xs">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>Viral Growth &amp; Rewards Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Referrals &amp; Reward Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Track referral invitations, conversion attribution, and +30 day dual rewards
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Super Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* KPI Counters: Total vs Signup Only vs Payment Done */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Invites</span>
            <Users className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalInvites}</div>
          <div className="text-[10.5px] text-slate-400">Viral invitations sent</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
            <span>Signed Up Only</span>
            <Hourglass className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{signedUpOnlyCount}</div>
          <div className="text-[10.5px] text-amber-400/90">Awaiting 1st payment</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-emerald-400 flex items-center justify-between">
            <span>Paid &amp; Subscribed</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{paidCount}</div>
          <div className="text-[10.5px] text-emerald-500">Verified payment completed</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Days Awarded</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">+{totalDaysAwarded}d</div>
          <div className="text-[10.5px] text-slate-400">+30d per qualified pair</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search referrer, referee, or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-[#080d19] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-semibold">
          {[
            { key: "ALL", label: `All (${totalInvites})` },
            { key: "SIGNUP_ONLY", label: `⏳ Signup Only (${signedUpOnlyCount})` },
            { key: "PAID", label: `🎁 Paid & Rewarded (${paidCount})` },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-3 py-2 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                filter === key
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs"
                  : "bg-[#0c1220] text-slate-400 border border-slate-800 hover:text-white"
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
          <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-slate-800">
            No referral records found matching &quot;{search}&quot;
          </div>
        ) : (
          filteredReferrals.map((r) => {
            const isPaid = r.status === "REWARDED";
            return (
              <div
                key={r.id}
                className="p-4 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] rounded-2xl border border-slate-800/90 space-y-2.5 text-xs shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Referrer → Friend</span>
                    <div className="font-extrabold text-white text-sm">
                      {r.referrerName} <span className="text-amber-400">→</span> {r.refereeName}
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20 text-[10px]">
                    {r.referralCode}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80">
                  <span
                    className={`text-[9.5px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                      isPaid
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : "bg-amber-950/80 text-amber-400 border border-amber-800"
                    }`}
                  >
                    {isPaid ? <CheckCircle className="w-3 h-3" /> : <Hourglass className="w-3 h-3" />}
                    <span>{isPaid ? "Payment Verified" : "Awaiting Payment"}</span>
                  </span>

                  <span className={`font-bold text-[10.5px] ${isPaid ? "text-emerald-400" : "text-slate-500"}`}>
                    {isPaid ? "+30d Added to Both" : "Pending"}
                  </span>
                </div>

                <div className="text-[10px] text-slate-400 text-right font-mono">
                  Joined: {new Date(r.createdAt).toLocaleDateString("en-IN")}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-[#0c1220]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/90">
              <tr>
                <th className="p-4">Referrer (Who Invited)</th>
                <th className="p-4">Referred User (Friend)</th>
                <th className="p-4">Code Used</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Reward Status</th>
                <th className="p-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredReferrals.map((r) => {
                const isPaid = r.status === "REWARDED";

                return (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-white text-sm">{r.referrerName}</div>
                      <div className="text-[10px] text-slate-400">Referrer</div>
                    </td>
                    <td className="p-4">
                      <div className="font-extrabold text-amber-300 text-sm">{r.refereeName}</div>
                      <div className="text-[10px] text-slate-400">Devotee / Vadhyar</div>
                    </td>
                    <td className="p-4 font-mono text-amber-300 font-bold tracking-wider">{r.referralCode}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1.5 ${
                          isPaid
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : "bg-amber-950/80 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>1st Payment Verified</span>
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3.5 h-3.5 text-amber-400" />
                            <span>Signed Up • Awaiting Payment</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {isPaid ? (
                        <span className="text-emerald-400 font-extrabold">+30 Days Added to Both</span>
                      ) : (
                        <span className="text-slate-500 font-medium">Pending 1st Payment</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400 text-right font-mono">
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
