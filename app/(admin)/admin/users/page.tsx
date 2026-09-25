"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/store";
import { User, Subscription } from "@/lib/types";
import {
  Search,
  Shield,
  Plus,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  RotateCcw,
  Trash2,
  ArrowUpRight,
  Smartphone,
  Mail,
  Calendar,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import {
  syncSuperAdminDirectoryFromCloud,
  initSuperAdminRealtimeSync,
} from "@/lib/supabase/sync";

export default function AdminUsersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Modal actions
  const [adjustmentType, setAdjustmentType] = useState<
    "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE"
  >("EXTEND");
  const [days, setDays] = useState<number>(30);
  const [reason, setReason] = useState<string>("Admin compensation adjustment");
  const [successMsg, setSuccessMsg] = useState("");
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  const handleResetCollections = async () => {
    if (
      !window.confirm(
        "Are you sure you want to delete all non-super-admin users and reset all collections in Supabase Cloud and LocalStorage?"
      )
    ) {
      return;
    }

    setIsResetting(true);
    try {
      const res = await fetch("/api/admin/reset-collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminEmail: "manirajankg@gmail.com" }),
      });
      const data = await res.json();
      db.purgeLegacyDummyData();
      await syncSuperAdminDirectoryFromCloud();
      setSuccessMsg(
        data.success
          ? "All collections and non-super-admin users deleted!"
          : data.error || "Reset failed"
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (e: any) {
      setSuccessMsg(e?.message || "Reset failed");
    } finally {
      setIsResetting(false);
      setForceTick((t) => t + 1);
    }
  };

  useEffect(() => {
    db.purgeLegacyDummyData();
    handleCloudSync();

    const cleanup = initSuperAdminRealtimeSync(() => {
      setForceTick((t) => t + 1);
    });

    const handleDbChange = () => {
      setForceTick((t) => t + 1);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("velvi:db-change", handleDbChange);
    }

    const pollTimer = setInterval(() => {
      syncSuperAdminDirectoryFromCloud()
        .then(() => {
          setForceTick((t) => t + 1);
        })
        .catch(() => {});
    }, 15000);

    return () => {
      cleanup();
      clearInterval(pollTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("velvi:db-change", handleDbChange);
      }
    };
  }, [handleCloudSync]);

  const businesses = db.businesses;
  const subscriptions = db.subscriptions;

  const users = db.users.filter((u) => {
    const isMock =
      u.id === "u-ravi-iyer-01" ||
      u.email?.trim().toLowerCase() === "ravi.iyer@gmail.com" ||
      u.id.startsWith("u-demo-");
    if (isMock) return false;

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
      <div className="bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#040710] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-[11px] font-bold text-amber-300 shadow-xs">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>பயனர்கள் & வேலிடிட்டி மேலாண்மை • Tenant Directory &amp; Validity Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            பயனர்கள் &amp; வேலிடிட்டி கட்டுப்பாடு (Users &amp; Validity)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            நேரடி வாடிக்கையாளர்கள் &amp; வாத்தியார்கள் • Supabase Cloud உடன் நேரலை ஒத்திசைவு
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isCloudSyncing}
            className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? "animate-spin" : ""}`} />
            <span>{isCloudSyncing ? "ஒத்திசைக்கிறது..." : "கிளவுட் ஒத்திசைவு (Sync)"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetCollections}
            disabled={isResetting}
            className="px-3 py-2 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{isResetting ? "மீட்டமைக்கிறது..." : "தரவு மீட்டமை (Reset)"}</span>
          </button>

          <Link
            href="/admin"
            className="px-3 py-2 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>முதன்மை பலகை (Super Console)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="பெயர், மின்னஞ்சல், தொலைபேசி தேட..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-[#080d19] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-semibold">
          {[
            { id: "ALL", label: "அனைத்தும் (All)" },
            { id: "ACTIVE", label: "கட்டண சந்தா (Active)" },
            { id: "TRIAL", label: "சோதனை காலம் (Trial)" },
            { id: "EXPIRED", label: "காலாவதியானது (Expired)" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                filter === f.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs"
                  : "bg-[#0c1220] text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {users.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-slate-800">
            தேடலுக்கு ஏற்ற பயனர்கள் யாரும் இல்லை &quot;{search}&quot;
          </div>
        ) : (
          users.map((u) => {
            const biz = businesses.find((b) => b.ownerId === u.id) || businesses[0];
            const sub = subscriptions.find((s) => s.businessId === biz?.id) || subscriptions[0];
            const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });

            return (
              <div
                key={u.id}
                className="p-4 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] rounded-2xl border border-slate-800/90 space-y-3 text-xs shadow-lg"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{u.name}</h4>
                    <div className="text-[11px] text-amber-400/90 font-medium">{biz?.name || "தனிப்பட்ட வாத்தியார்"}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{u.email}</div>
                  </div>
                  <span
                    className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      sub.status === "ACTIVE"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : sub.status === "TRIAL"
                        ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                        : "bg-rose-950/80 text-rose-400 border border-rose-800"
                    }`}
                  >
                    {sub.status === "ACTIVE" ? "செயலில் உள்ளது" : sub.status === "TRIAL" ? "சோதனை காலம்" : "காலாவதியானது"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 font-mono">{u.mobile}</span>
                  <span className="text-amber-300 font-mono font-bold">வேலிடிட்டி: {validUntil}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="w-full py-2 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-xl font-extrabold text-xs transition cursor-pointer active:scale-95"
                >
                  வேலிடிட்டி மாற்று (Adjust)
                </button>
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
                <th className="p-4">பயனர் / வாத்தியார் (User)</th>
                <th className="p-4">வணிகம் / தொழில் (Business)</th>
                <th className="p-4">தொலைபேசி (Mobile)</th>
                <th className="p-4">சந்தா நிலை (Status)</th>
                <th className="p-4">முடிவடையும் நாள் (Valid Until)</th>
                <th className="p-4 text-right">செயல் (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {users.map((u) => {
                const biz = businesses.find((b) => b.ownerId === u.id) || businesses[0];
                const sub = subscriptions.find((s) => s.businessId === biz?.id) || subscriptions[0];
                const validUntil = new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });

                return (
                  <tr key={u.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4">
                      <div className="font-extrabold text-white text-sm">{u.name}</div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </td>
                    <td className="p-4 text-slate-300">{biz?.name || "தனிப்பட்ட வாத்தியார்"}</td>
                    <td className="p-4 text-slate-300 font-mono">{u.mobile}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                            : sub.status === "TRIAL"
                            ? "bg-amber-950/80 text-amber-400 border border-amber-800"
                            : "bg-rose-950/80 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {sub.status === "ACTIVE" ? "செயலில் உள்ளது" : sub.status === "TRIAL" ? "சோதனை காலம்" : "காலாவதியானது"}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-amber-400 font-mono">{validUntil}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-xl font-extrabold text-xs shadow-xs transition active:scale-95 cursor-pointer"
                      >
                        வேலிடிட்டி மாற்று
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Validity Adjustment Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c1424] rounded-3xl p-6 max-w-md w-full space-y-4 border border-amber-500/40 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="font-extrabold text-base text-white">சந்தா வேலிடிட்டி மாற்றம்</h3>
                <p className="text-xs text-slate-400">{selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustValidity} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1.5 font-bold uppercase text-[10.5px]">செயல் வகை (Action Type)</label>
                <select
                  value={adjustmentType}
                  onChange={(e) => setAdjustmentType(e.target.value as any)}
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="EXTEND">நாட்களை நீட்டிக்க (+ நாட்கள்)</option>
                  <option value="REDUCE">நாட்களை குறைக்க (- நாட்கள்)</option>
                  <option value="ACTIVATE">மீண்டும் செயல்படுத்த (Activate Plan)</option>
                  <option value="EXPIRE">உடனடியாக காலாவதியாக்க (Expire)</option>
                </select>
              </div>

              {adjustmentType === "EXTEND" && (
                <div>
                  <label className="text-slate-300 block mb-1.5 font-bold uppercase text-[10.5px]">விரைவு தேர்வு (Preset Duration)</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[7, 30, 90, 365].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDays(d)}
                        className={`py-2 rounded-xl font-bold transition text-xs cursor-pointer ${
                          days === d
                            ? "bg-amber-500 text-black font-extrabold"
                            : "bg-[#060a14] text-slate-300 border border-slate-800 hover:bg-slate-800"
                        }`}
                      >
                        +{d}d
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-slate-300 block mb-1.5 font-bold uppercase text-[10.5px]">கூடுதல் நாட்கள் எண்ணிக்கை (Days Count)</label>
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1.5 font-bold uppercase text-[10.5px]">
                  காரணம் / தணிக்கை குறிப்பு (Mandatory Reason) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="எ.கா. வாடிக்கையாளர் ஆதரவு, திருவிழா சலுகை..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#060a14] border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(null)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold transition cursor-pointer"
                >
                  ரத்து (Cancel)
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-black rounded-xl font-black shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
                >
                  சேமித்து புதுப்பி (Save &amp; Log)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
