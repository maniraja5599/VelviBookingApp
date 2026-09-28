"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/store";
import { User } from "@/lib/types";
import {
  Search,
  Shield,
  CheckCircle,
  X,
  RotateCcw,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Calendar,
  Phone,
  Mail,
  Building,
} from "lucide-react";
import Link from "next/link";
import {
  syncSuperAdminDirectoryFromCloud,
} from "@/lib/supabase/sync";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Modal actions
  const [adjustmentType, setAdjustmentType] = useState<
    "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE"
  >("EXTEND");
  const [days, setDays] = useState<number>(30);
  const [reason, setReason] = useState<string>("Admin compensation adjustment");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [, setForceTick] = useState(0);

  const handleCloudSync = useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      db.purgeLegacyDummyData();
      const res = await syncSuperAdminDirectoryFromCloud();
      if (res.success) {
        setSuccessMsg(`Synced ${res.usersCount} real users from Supabase Cloud!`);
        setTimeout(() => setSuccessMsg(""), 4000);
      }
    } catch (_) {
    } finally {
      setIsCloudSyncing(false);
      setForceTick((t) => t + 1);
    }
  }, []);

  useEffect(() => {
    db.purgeLegacyDummyData();
    handleCloudSync();
  }, [handleCloudSync]);

  const rawUsers = db.users;
  const businesses = db.businesses;
  const subscriptions = db.subscriptions;

  const users = rawUsers.filter((u) => {
    const isSuper =
      u.role === "SUPER_ADMIN" ||
      u.email?.trim().toLowerCase() === "manirajankg@gmail.com";
    if (isSuper) return false;

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

    const isSuper =
      selectedUser.role === "SUPER_ADMIN" ||
      selectedUser.email?.trim().toLowerCase() === "manirajankg@gmail.com";
    const biz =
      businesses.find((b) => b.ownerId === selectedUser.id) ||
      (isSuper ? businesses.find((b) => b.id === "biz-super-admin-01") : undefined) ||
      businesses[0];

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
      setForceTick((t) => t + 1);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 shadow-2xs">
            <Shield className="w-3.5 h-3.5 text-amber-700" />
            <span>TENANT DIRECTORY &amp; VALIDITY CONTROL</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            User Directory &amp; Validity Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Real tenants, active subscriptions, and quota control • Real-time cloud sync
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isCloudSyncing}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-emerald-700 ${isCloudSyncing ? "animate-spin" : ""}`} />
            <span>{isCloudSyncing ? "Syncing..." : "Sync Cloud"}</span>
          </button>

          <Link
            href="/admin"
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Super Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-2xs animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-semibold">
          {[
            { id: "ALL", label: "All Users" },
            { id: "ACTIVE", label: "Paid Subscriptions" },
            { id: "TRIAL", label: "Free Trial" },
            { id: "EXPIRED", label: "Expired" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                filter === f.id
                  ? "bg-amber-100 text-amber-900 border border-amber-300 font-bold shadow-2xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-2.5">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No users found matching &quot;{search}&quot;
          </div>
        ) : (
          users.map((u) => {
            const biz = businesses.find((b) => b.ownerId === u.id) || businesses[0];
            const sub = subscriptions.find((s) => s.businessId === biz?.id) || subscriptions[0];
            const isExpanded = expandedUserId === u.id;
            const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={u.id}
                className="p-3.5 bg-white rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-2xs transition"
              >
                <div
                  onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                  className="flex items-start justify-between cursor-pointer gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{u.name}</h4>
                      <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                        {sub?.planName || "Pro"}
                      </span>
                    </div>
                    <div className="text-[11px] text-amber-900 font-medium truncate mt-0.5">
                      {biz?.name || "Independent Consultant / Priest"}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        sub.status === "ACTIVE"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : sub.status === "TRIAL"
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      {sub.status === "ACTIVE" ? "Active" : sub.status === "TRIAL" ? "Trial" : "Expired"}
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
                  onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                  className="flex items-center justify-between text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 cursor-pointer"
                >
                  <span className="text-slate-600 font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    {u.mobile}
                  </span>
                  <span className="text-amber-900 font-mono font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-amber-700" />
                    {validUntil}
                  </span>
                </div>

                {/* Collapsible Full Tenant Details */}
                {isExpanded && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2 text-[11px] animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Email</span>
                        <span className="font-mono text-slate-900 truncate block">{u.email}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">User ID</span>
                        <span className="font-mono text-slate-600 text-[10px] truncate block">{u.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50">
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Last Login City</span>
                        <span className="text-slate-800 font-medium">
                          {u.lastLoginCity ? `${u.lastLoginCity}, ${u.lastLoginCountry || "IN"}` : "Namakkal, India"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Last Known IP</span>
                        <span className="font-mono text-amber-800 font-semibold">{u.lastLoginIp || "127.0.0.1"}</span>
                      </div>
                    </div>

                    {u.createdAt && (
                      <div className="pt-1 border-t border-amber-200/50 text-[10px] text-slate-500">
                        Joined: {new Date(u.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedUserId(isExpanded ? null : u.id)}
                    className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(u)}
                    className="flex-1 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs transition cursor-pointer active:scale-95"
                  >
                    Adjust Validity
                  </button>
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
                <th className="p-4">User / Tenant</th>
                <th className="p-4">Business / Organization</th>
                <th className="p-4">Phone Number</th>
                <th className="p-4">Subscription Status</th>
                <th className="p-4">Validity Expiry</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const biz = businesses.find((b) => b.ownerId === u.id) || businesses[0];
                const sub = subscriptions.find((s) => s.businessId === biz?.id) || subscriptions[0];
                const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={u.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-slate-900 text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>
                    <td className="p-4 text-slate-700">{biz?.name || "Independent Consultant / Priest"}</td>
                    <td className="p-4 text-slate-700 font-mono">{u.mobile}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : sub.status === "TRIAL"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-rose-50 text-rose-800 border border-rose-200"
                        }`}
                      >
                        {sub.status === "ACTIVE" ? "Active" : sub.status === "TRIAL" ? "Trial" : "Expired"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-amber-800 font-mono">{validUntil}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold text-xs shadow-2xs transition active:scale-95 cursor-pointer"
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

      {/* Manual Validity Adjustment Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-amber-200/90 shadow-2xl text-slate-900 relative">
            <div className="flex items-center justify-between pb-3 border-b border-amber-100">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Adjust Subscription Validity</h3>
                <p className="text-xs text-slate-500">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustValidity} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-700 block mb-1.5 font-bold uppercase text-[10.5px]">Action Type</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                >
                  <option value="EXTEND">Extend Duration (+ Add Days)</option>
                  <option value="REDUCE">Reduce Duration (- Deduct Days)</option>
                  <option value="ACTIVATE">Reactivate Plan (Set Active)</option>
                  <option value="EXPIRE">Expire Immediately (Revoke Access)</option>
                </select>
              </div>

              {adjustmentType === "EXTEND" && (
                <div>
                  <label className="text-slate-700 block mb-1.5 font-bold uppercase text-[10.5px]">Preset Duration</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(d)}
                        className={`py-2 rounded-xl font-bold transition text-xs cursor-pointer ${
                          days === d
                            ? "bg-emerald-700 text-white font-extrabold shadow-xs"
                            : "bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-700 block mb-1.5 font-bold uppercase text-[10.5px]">Adjustment Duration (Days)</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-700 block mb-1.5 font-bold uppercase text-[10.5px]">
                  Audit Reason / Admin Note *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer support extension, goodwill promo, invoice settlement..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold shadow-xs transition cursor-pointer active:scale-95"
                >
                  Save &amp; Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
