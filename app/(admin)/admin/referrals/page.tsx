"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Gift, ShieldCheck, Clock, CheckCircle, Hourglass, Users, Search } from "lucide-react";

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Referrals & Reward Ledger</h1>
        <p className="text-xs text-gray-400">
          Track referral attribution, signup-only vs payment completion counts, and +30 day extensions
        </p>
      </div>

      {/* KPI Counters: Total vs Signup Only vs Payment Done */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-amber-400" /> Total Invites
          </div>
          <div className="text-2xl font-black text-white">{totalInvites}</div>
          <div className="text-[11px] text-gray-400">Total viral invitations</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-amber-900/40 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
            <Hourglass className="w-4 h-4" /> Signed Up Only
          </div>
          <div className="text-2xl font-black text-amber-400">{signedUpOnlyCount}</div>
          <div className="text-[11px] text-amber-500">Awaiting 1st payment</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-green-900/40 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-green-400 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4" /> Paid & Subscribed
          </div>
          <div className="text-2xl font-black text-green-400">{paidCount}</div>
          <div className="text-[11px] text-green-500">Verified payment completed</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400" /> Days Awarded
          </div>
          <div className="text-2xl font-black text-amber-400">+{totalDaysAwarded}</div>
          <div className="text-[11px] text-gray-400">+30d per qualified pair</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search referrer or referee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto text-xs font-semibold">
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === "ALL"
                ? "bg-amber-500 text-black font-bold"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            All ({totalInvites})
          </button>
          <button
            onClick={() => setFilter("SIGNUP_ONLY")}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === "SIGNUP_ONLY"
                ? "bg-amber-500 text-black font-bold"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Signup Only ({signedUpOnlyCount})
          </button>
          <button
            onClick={() => setFilter("PAID")}
            className={`px-3 py-1.5 rounded-xl transition ${
              filter === "PAID"
                ? "bg-amber-500 text-black font-bold"
                : "bg-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            Paid & Rewarded ({paidCount})
          </button>
        </div>
      </div>

      {/* Referrals Detailed Table */}
      <div className="bg-gray-800/60 rounded-3xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-4">Referrer (Who Referred)</th>
                <th className="p-4">Referred User (Friend)</th>
                <th className="p-4">Code Used</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4">Reward Status</th>
                <th className="p-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {filteredReferrals.map((r) => {
                const isPaid = r.status === "REWARDED";

                return (
                  <tr key={r.id} className="hover:bg-gray-700/30 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{r.referrerName}</div>
                      <div className="text-[10px] text-gray-400">Referrer</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-amber-300">{r.refereeName}</div>
                      <div className="text-[10px] text-gray-400">New User</div>
                    </td>
                    <td className="p-4 font-mono text-gray-300 font-semibold">{r.referralCode}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                          isPaid
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> 1st Payment Verified
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3 h-3" /> Signed Up • Awaiting Payment
                          </>
                        )}
                      </span>
                    </td>
                    <td className="p-4 font-bold">
                      {isPaid ? (
                        <span className="text-green-400">+30 Days Added to Both</span>
                      ) : (
                        <span className="text-gray-500">Pending Payment</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-400">
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
