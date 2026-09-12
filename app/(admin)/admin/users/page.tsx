"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { User, Subscription } from "@/lib/types";
import { Search, Shield, Plus, Clock, CheckCircle, AlertTriangle, X } from "lucide-react";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modal actions
  const [adjustmentType, setAdjustmentType] = useState<"EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE">("EXTEND");
  const [days, setDays] = useState<number>(30);
  const [reason, setReason] = useState<string>("Admin compensation adjustment");
  const [successMsg, setSuccessMsg] = useState("");

  const businesses = db.businesses;
  const subscriptions = db.subscriptions;

  const users = db.users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.mobile.includes(search);
    const biz = businesses.find((b) => b.ownerId === u.id);
    const sub = biz ? subscriptions.find((s) => s.businessId === biz.id) : null;
    const matchesFilter =
      filter === "ALL" ||
      (filter === "ACTIVE" && sub?.status === "ACTIVE") ||
      (filter === "TRIAL" && sub?.status === "TRIAL") ||
      (filter === "EXPIRED" && sub?.status === "EXPIRED");

    return matchesSearch && matchesFilter;
  });

  const handleAdjustValidity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const biz = businesses.find((b) => b.ownerId === selectedUser.id) || businesses[0];

    const res = db.adjustSubscriptionValidity({
      businessId: biz.id,
      adminUserId: "u-super-admin-01",
      adminName: "Velvi Super Admin",
      adjustmentType,
      days,
      reason,
    });

    if (res.success) {
      setSuccessMsg(`Validity adjusted successfully for ${selectedUser.name}!`);
      setSelectedUser(null);
      setTimeout(() => setSuccessMsg(""), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Users & Validity Control</h1>
        <p className="text-xs text-gray-400">
          Super Admin manual validity extensions, plan adjustments & tenant inspection
        </p>
      </div>

      {successMsg && (
        <div className="bg-green-950 border border-green-800 text-green-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex gap-1.5 w-full sm:w-auto text-xs font-semibold">
          {["ALL", "ACTIVE", "TRIAL", "EXPIRED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl transition ${
                filter === f
                  ? "bg-amber-500 text-black font-bold"
                  : "bg-gray-800 text-gray-400 hover:text-white"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table (Points 62 & 63) */}
      <div className="bg-gray-800/60 rounded-3xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-4">User</th>
                <th className="p-4">Business</th>
                <th className="p-4">Mobile</th>
                <th className="p-4">Status</th>
                <th className="p-4">Valid Until</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {users.map((u) => {
                const biz = businesses.find((b) => b.ownerId === u.id) || businesses[0];
                const sub = subscriptions.find((s) => s.businessId === biz?.id) || subscriptions[0];
                const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={u.id} className="hover:bg-gray-700/30 transition">
                    <td className="p-4">
                      <div className="font-bold text-white">{u.name}</div>
                      <div className="text-[11px] text-gray-400">{u.email}</div>
                    </td>
                    <td className="p-4 text-gray-300">{biz?.name || "Independent"}</td>
                    <td className="p-4 text-gray-300 font-mono">{u.mobile}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          sub.status === "ACTIVE"
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : sub.status === "TRIAL"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-red-950 text-red-400 border border-red-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 font-semibold text-amber-400">{validUntil}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold text-xs shadow transition"
                      >
                        Adjust Validity
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Validity Adjustment Drawer / Modal (Points 20 & 63) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-md w-full space-y-4 border border-amber-500/40 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Adjust Subscription Validity</h3>
                <p className="text-xs text-gray-400">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustValidity} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-300 block mb-1 font-bold">Action Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="EXTEND">Extend Validity (+ Days)</option>
                  <option value="REDUCE">Reduce Validity (- Days)</option>
                  <option value="ACTIVATE">Activate / Restore Plan</option>
                  <option value="EXPIRE">Expire Immediately</option>
                </select>
              </div>

              {adjustmentType === "EXTEND" && (
                <div>
                  <label className="text-gray-300 block mb-1 font-bold">Preset Duration</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[7, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(d)}
                        className={`py-1.5 rounded-xl font-bold transition ${
                          days === d
                            ? "bg-amber-500 text-black"
                            : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                        }`}
                      >
                        +{d} Days
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-gray-300 block mb-1 font-bold">Custom Days Count</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer support compensation, festival offer"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold shadow"
                >
                  Save & Log to Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
