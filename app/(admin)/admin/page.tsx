"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/db/store";
import { UserDirectoryMetric } from "@/lib/types";
import {
  Users,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  DollarSign,
  Globe,
  MapPin,
  RotateCcw,
  Tag,
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { formatCleanLocation } from "@/lib/utils/location";
import {
  retryCloudSync,
  syncSuperAdminDirectoryFromCloud,
  initSuperAdminRealtimeSync,
} from "@/lib/supabase/sync";
import { useAuth } from "@/components/providers/AuthContext";

export default function SuperAdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { currentUser } = useAuth();

  const isSuperAdmin = Boolean(
    currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com"
  );

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [directoryMetrics, setDirectoryMetrics] = useState<UserDirectoryMetric[]>(() =>
    db.getAllUsersDirectoryMetrics()
  );

  // Notifications
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionError, setActionError] = useState("");

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(""), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(""), 4000);
    }
  };

  const handleCloudSync = React.useCallback(async () => {
    setIsCloudSyncing(true);
    try {
      db.purgeLegacyDummyData();
      const res = await syncSuperAdminDirectoryFromCloud();
      setDirectoryMetrics(db.getAllUsersDirectoryMetrics());
      if (res.success) {
        showToast(`Synced ${res.usersCount} real users from Supabase Cloud!`);
      } else {
        showToast(res.error || "Cloud sync notice", true);
      }
    } catch (e: any) {
      showToast(e?.message || "Cloud sync notice", true);
    } finally {
      setIsCloudSyncing(false);
    }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    db.purgeLegacyDummyData();
    setDirectoryMetrics(db.getAllUsersDirectoryMetrics());
    handleCloudSync();

    const cleanupRealtime = initSuperAdminRealtimeSync(() => {
      setDirectoryMetrics(db.getAllUsersDirectoryMetrics());
      showToast("Live update received from Cloud!");
    });

    const handleDbChange = () => {
      setDirectoryMetrics(db.getAllUsersDirectoryMetrics());
    };
    if (typeof window !== "undefined") {
      window.addEventListener("velvi:db-change", handleDbChange);
    }

    const pollTimer = setInterval(() => {
      syncSuperAdminDirectoryFromCloud()
        .then(() => setDirectoryMetrics(db.getAllUsersDirectoryMetrics()))
        .catch(() => {});
    }, 15000);

    return () => {
      cleanupRealtime();
      clearInterval(pollTimer);
      if (typeof window !== "undefined") {
        window.removeEventListener("velvi:db-change", handleDbChange);
      }
    };
  }, [handleCloudSync]);

  // Validity Modal State
  const [selectedBizForModal, setSelectedBizForModal] = useState<{
    bizId: string;
    userName: string;
    currentExpiry: string;
    rawExpiryDate?: string;
  } | null>(null);
  const [modalAdjustmentType, setModalAdjustmentType] = useState<
    "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE"
  >("EXTEND");
  const [modalDays, setModalDays] = useState<number>(30);
  const [modalReason, setModalReason] = useState<string>("Developer promotional extension");
  const [isConfirmingValidity, setIsConfirmingValidity] = useState<boolean>(false);
  const [customTargetDate, setCustomTargetDate] = useState<string>("");

  const computeNewExpiryDate = (
    baseDateStr: string | undefined,
    days: number,
    type: string
  ) => {
    let base = new Date();
    if (baseDateStr) {
      const parsed = new Date(baseDateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) base = parsed;
    }
    const target = new Date(base);
    if (type === "EXTEND") target.setDate(target.getDate() + days);
    else if (type === "REDUCE") target.setDate(target.getDate() - days);
    return target.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const computeNewExpiryDateISO = (
    baseDateStr: string | undefined,
    days: number,
    type: string
  ) => {
    let base = new Date();
    if (baseDateStr) {
      const parsed = new Date(baseDateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) base = parsed;
    }
    const target = new Date(base);
    if (type === "EXTEND") target.setDate(target.getDate() + days);
    else if (type === "REDUCE") target.setDate(target.getDate() - days);
    return target.toISOString().slice(0, 10);
  };

  const handleTargetDateChange = (dateVal: string) => {
    setCustomTargetDate(dateVal);
    if (!dateVal || !selectedBizForModal) return;
    let base = new Date();
    if (selectedBizForModal.rawExpiryDate) {
      const parsed = new Date(selectedBizForModal.rawExpiryDate);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) base = parsed;
    }
    const picked = new Date(dateVal);
    if (!isNaN(picked.getTime())) {
      const diffDays = Math.max(1, Math.round((picked.getTime() - base.getTime()) / 86400000));
      setModalDays(diffDays);
      setModalAdjustmentType("EXTEND");
    }
  };

  const handleOpenValidityModal = (
    bizId: string,
    userName: string,
    currentExpiry: string,
    rawExpiryDate?: string,
    defaultDays = 30
  ) => {
    setSelectedBizForModal({ bizId, userName, currentExpiry, rawExpiryDate });
    setModalAdjustmentType("EXTEND");
    setModalDays(defaultDays);
    setCustomTargetDate(computeNewExpiryDateISO(rawExpiryDate, defaultDays, "EXTEND"));
    setModalReason(`Promotional validity extension for ${userName}`);
    setIsConfirmingValidity(false);
  };

  const handleModalAdjustConfirm = async () => {
    if (!selectedBizForModal) return;
    const res = db.adjustSubscriptionValidity({
      businessId: selectedBizForModal.bizId,
      adminUserId: "u-super-admin-01",
      adminName: "Mani Raja",
      adjustmentType: modalAdjustmentType,
      days: modalDays,
      reason: modalReason.trim() || "Manual adjustment by Super Admin",
    });
    if (res.success) {
      showToast(`Validity updated (+${modalDays}d) for ${selectedBizForModal.userName}!`);
      try { await retryCloudSync(selectedBizForModal.bizId); } catch {}
      setDirectoryMetrics(db.getAllUsersDirectoryMetrics());
      setSelectedBizForModal(null);
      setIsConfirmingValidity(false);
    } else {
      showToast(res.error || "Adjustment failed", true);
    }
  };

  // Platform KPIs
  const realDirectoryMetrics = useMemo(
    () => directoryMetrics.filter((m) => !m.isDemo),
    [directoryMetrics]
  );
  const demoDirectoryMetrics = useMemo(
    () => directoryMetrics.filter((m) => m.isDemo),
    [directoryMetrics]
  );

  const realUsersCount = realDirectoryMetrics.length;
  const realPaidCount = realDirectoryMetrics.filter(
    (m) => m.subscription?.status === "ACTIVE"
  ).length;
  const realPlatformEarnings = realDirectoryMetrics.reduce(
    (acc, cur) => acc + cur.totalEarnings,
    0
  );
  const realBookingsCount = realDirectoryMetrics.reduce(
    (acc, cur) => acc + cur.bookingCount,
    0
  );
  const demoBookingsCount = demoDirectoryMetrics.reduce((acc, cur) => acc + cur.bookingCount, 0);
  const demoPlatformEarnings = demoDirectoryMetrics.reduce(
    (acc, cur) => acc + cur.totalEarnings,
    0
  );

  // Monthly Revenue Trend
  const monthlyRevenueTrend = useMemo(() => {
    const months: { label: string; yearMonth: string; total: number; isCurrent: boolean }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString("en-IN", { month: "short" }),
        yearMonth: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        total: 0,
        isCurrent: i === 0,
      });
    }
    (db.bookings || []).forEach((b) => {
      if (b.status === "CANCELLED") return;
      const bMonth = (b.date || b.createdAt || "").slice(0, 7);
      const match = months.find((m) => m.yearMonth === bMonth);
      if (match) match.total += Number(b.totalAmount) || 0;
    });
    (db.payments || []).forEach((p) => {
      if (p.status !== "SUCCESS") return;
      const pMonth = (p.createdAt || "").slice(0, 7);
      const match = months.find((m) => m.yearMonth === pMonth);
      if (match) match.total += Number(p.amount) || 0;
    });
    const maxVal = Math.max(...months.map((m) => m.total), 1);
    const prevMonthTotal = months.length >= 2 ? months[months.length - 2].total : 0;
    const currMonthTotal = months[months.length - 1].total;
    let growthText = "Real Data";
    if (prevMonthTotal > 0) {
      const diffPct = Math.round(((currMonthTotal - prevMonthTotal) / prevMonthTotal) * 100);
      growthText = diffPct >= 0 ? `+${diffPct}% vs Prev` : `${diffPct}% vs Prev`;
    } else if (currMonthTotal > 0) {
      growthText = "Active Month";
    }
    const bars = months.map((m) => {
      const pct = m.total > 0 ? Math.max(14, Math.round((m.total / maxVal) * 100)) : 8;
      const formattedVal =
        m.total >= 100000
          ? `₹${(m.total / 100000).toFixed(1)}L`
          : m.total >= 1000
            ? `₹${(m.total / 1000).toFixed(1)}k`
            : `₹${m.total}`;
      return { m: m.label, v: formattedVal, raw: m.total, h: `${pct}%`, current: m.isCurrent };
    });
    return { bars, growthText };
  }, [directoryMetrics]);

  // Upcoming Expiries
  const upcomingExpiries = useMemo(() => {
    return [...directoryMetrics]
      .filter((m) => m.subscription?.currentPeriodEnd && m.subscription.status !== "EXPIRED")
      .sort(
        (a, b) =>
          new Date(a.subscription!.currentPeriodEnd!).getTime() -
          new Date(b.subscription!.currentPeriodEnd!).getTime()
      )
      .slice(0, 4);
  }, [directoryMetrics]);

  if (!isMounted) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center text-xl shadow-md animate-pulse">
          🪔
        </div>
        <p className="text-xs text-slate-500 font-medium">Loading Super Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-400/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-extrabold text-amber-900">
              <Shield className="w-3.5 h-3.5 text-amber-700" />
              Super Administrator
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10.5px] font-mono font-bold text-emerald-800">
              <Globe className="w-3 h-3" />
              velvi.date • Live
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10.5px] font-mono font-bold text-blue-800">
              <CreditCard className="w-3 h-3" />
              Cashfree Gateway
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Platform Console
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Admin:{" "}
            <span className="font-mono font-bold text-emerald-800">manirajankg@gmail.com</span>
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isCloudSyncing}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-emerald-700 ${isCloudSyncing ? "animate-spin" : ""}`} />
            <span>{isCloudSyncing ? "Syncing..." : "Cloud Sync"}</span>
          </button>
          <Link
            href="/app"
            className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-2 active:scale-95"
          >
            <span>Open App</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {/* ─── Toasts ──────────────────────────────────────────────────────────── */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess("")}
            className="text-emerald-700 hover:text-emerald-900 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
      {actionError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-700 hover:text-rose-900 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 4 KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 hover:border-amber-300 transition-all shadow-sm group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {realUsersCount}
          </div>
          <div className="mt-2 text-[10.5px] text-amber-800 font-medium truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>{demoDirectoryMetrics.length} demo isolated</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 hover:border-emerald-300 transition-all shadow-sm group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800">Paid Tenants</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
            {realPaidCount}
          </div>
          <div className="mt-2 text-[10.5px] text-emerald-700 font-medium truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {realUsersCount > 0
                ? `${Math.round((realPaidCount / realUsersCount) * 100)}% conversion`
                : "0% conversion"}
            </span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 hover:border-amber-300 transition-all shadow-sm group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-800">Real Bookings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 group-hover:scale-110 transition-transform">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-amber-800 tracking-tight">
            {realBookingsCount}
          </div>
          <div className="mt-2 text-[10.5px] text-slate-500 font-medium truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80" />
            <span>Live devotees scheduled</span>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-200/80 hover:border-emerald-300 transition-all shadow-sm group relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-800">Total Dakshina</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-emerald-800 tracking-tight">
            ₹{realPlatformEarnings.toLocaleString("en-IN")}
          </div>
          <div className="mt-2 text-[10.5px] text-emerald-700 font-medium truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Gross platform volume</span>
          </div>
        </div>
      </div>

      {/* ─── Demo Sandbox Banner ──────────────────────────────────────────────── */}
      <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 shrink-0 animate-pulse" />
          <span className="text-slate-700 font-medium break-words leading-relaxed">
            <strong className="text-indigo-900 font-bold">Demo Sandbox (Ravi Iyer):</strong>{" "}
            {demoBookingsCount} simulated bookings • ₹{demoPlatformEarnings.toLocaleString("en-IN")} demo dakshina
          </span>
        </div>
        <span className="text-[10px] font-bold text-indigo-900 bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
          Isolated Sandbox
        </span>
      </div>

      {/* ─── Revenue Chart + Upcoming Expiries ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-amber-200/80 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Platform Revenue Trend</h3>
              <span className="text-[10.5px] text-slate-500 font-mono">
                Real-time billing & bookings inflow
              </span>
              <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-slate-900 mt-1 tracking-tight">
                ₹{realPlatformEarnings.toLocaleString("en-IN")}
              </div>
            </div>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full font-bold shadow-sm">
              {monthlyRevenueTrend.growthText}
            </span>
          </div>
          <div className="pt-3 border-t border-slate-100">
            <div className="text-[11px] text-slate-500 mb-2 font-medium">Monthly Cashflow Trend</div>
            <div className="flex items-end justify-between h-36 sm:h-40 gap-2.5 pt-2 px-1">
              {monthlyRevenueTrend.bars.map((bar) => (
                <div
                  key={bar.m}
                  className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group cursor-pointer"
                >
                  <span className="text-[9px] text-slate-500 font-mono font-medium group-hover:text-amber-800 transition-colors">
                    {bar.v}
                  </span>
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      bar.current
                        ? "bg-gradient-to-t from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 ring-1 ring-amber-400"
                        : bar.raw > 0
                          ? "bg-gradient-to-t from-amber-300 to-amber-400 group-hover:from-amber-600 group-hover:to-amber-500"
                          : "bg-slate-200 group-hover:bg-slate-300"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-slate-500">{bar.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Expiries */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200/80 space-y-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Expiring Subscriptions</h3>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Accounts needing renewal</p>
            </div>
            <span className="text-[10px] text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full shrink-0">
              Priority Queue
            </span>
          </div>

          <div className="space-y-2.5 flex-1">
            {upcomingExpiries.length === 0 ? (
              <div className="p-4 text-center text-slate-500 text-xs bg-slate-50 rounded-2xl border border-slate-200">
                No expiring subscriptions found.
              </div>
            ) : (
              upcomingExpiries.map((metric) => {
                const sub = metric.subscription;
                const expiryFormatted = sub?.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Trial Period";
                return (
                  <div
                    key={metric.user.id}
                    className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs transition shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900 truncate text-xs">
                          {metric.user.name}
                        </h4>
                        {metric.isDemo && (
                          <span className="text-[8.5px] font-bold px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                            Demo
                          </span>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                        {metric.business?.name || "Service Profile"} •{" "}
                        {sub?.planName || "Pro"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                      <span className="text-[10px] text-amber-800 font-bold font-mono bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                        {expiryFormatted}
                      </span>
                      {metric.business && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenValidityModal(
                              metric.business!.id,
                              metric.user.name,
                              expiryFormatted,
                              sub?.currentPeriodEnd,
                              30
                            )
                          }
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-200 text-amber-800 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0 shadow-sm"
                        >
                          Adjust
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <Link
            href="/admin/users"
            className="w-full mt-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 text-center transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            View Full User Directory →
          </Link>
        </div>
      </div>

      {/* ─── Quick Action Links ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: "/admin/users", icon: Users, label: "Users & Validity", color: "text-amber-700 bg-amber-50 border-amber-200" },
          { href: "/admin/coupons", icon: Tag, label: "Coupons & Promos", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
          { href: "/admin/traffic", icon: BarChart3, label: "Web Traffic", color: "text-sky-700 bg-sky-50 border-sky-200" },
          { href: "/admin/audit", icon: ClipboardList, label: "Audit Logs", color: "text-violet-700 bg-violet-50 border-violet-200" },
        ].map(({ href, icon: Icon, label, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border border-slate-200 hover:border-amber-300 rounded-2xl p-4 flex flex-col items-center gap-2 text-center shadow-sm hover:shadow-md transition group cursor-pointer"
          >
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center group-hover:scale-110 transition-transform ${color}`}>
              <Icon className="w-4.5 h-4.5" />
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
              {label}
            </span>
            <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-600 transition-colors" />
          </Link>
        ))}
      </div>

      {/* ─── Recent Logins ───────────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-amber-200/80 space-y-3.5 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                Live Logins & Telemetry
              </h3>
              <p className="text-[10.5px] text-slate-500 truncate">
                Click any session for detailed IP, origin & device info
              </p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-bold shrink-0">
            Latest 10
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
          {(
            (db.auditLogs || []).filter(
              (a) =>
                a.action.includes("LOGIN") ||
                a.targetType === "AUTH_SESSION" ||
                a.action.includes("GOOGLE") ||
                a.action.includes("DEMO")
            ).length > 0
              ? (db.auditLogs || []).filter(
                  (a) =>
                    a.action.includes("LOGIN") ||
                    a.targetType === "AUTH_SESSION" ||
                    a.action.includes("GOOGLE") ||
                    a.action.includes("DEMO")
                )
              : db.auditLogs || []
          )
            .slice(0, 10)
            .map((log) => {
              const isDemo = log.action === "DEMO_LOGIN" || log.actorName.includes("Ravi");
              const displayIp = log.ipAddress || "Local / Direct";
              const displayLocation = log.city
                ? formatCleanLocation(log.city, log.country)
                : "Location pending";
              const visitSource =
                log.newValue?.source ||
                (log.action.includes("GOOGLE")
                  ? "Google OAuth 2.0"
                  : isDemo
                    ? "Demo Session"
                    : "Direct Web Session (PWA)");

              return (
                <div
                  key={log.id}
                  className="p-3 sm:p-3.5 bg-slate-50 hover:bg-white hover:border-amber-300 rounded-2xl border border-slate-200 space-y-2 text-xs cursor-default transition shadow-sm group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                      <span className="font-extrabold text-slate-900 truncate text-xs group-hover:text-amber-800 transition-colors">
                        {log.actorName}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase shrink-0 border ${
                        isDemo
                          ? "bg-indigo-100 text-indigo-700 border-indigo-200"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {isDemo ? "Demo Login" : log.action.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 gap-2">
                    <span className="flex items-center gap-1.5 font-mono text-amber-800/90 truncate max-w-[150px]">
                      <Globe className="w-3 h-3 text-amber-700 shrink-0" />
                      {displayIp}
                    </span>
                    <span className="flex items-center gap-1.5 text-slate-700 truncate max-w-[160px]">
                      <MapPin className="w-3 h-3 text-emerald-500 shrink-0" />
                      {displayLocation}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between border-t border-slate-100 pt-1.5 gap-2">
                    <span className="truncate text-amber-800 font-sans">
                      Source: {visitSource}
                    </span>
                    <span className="shrink-0 text-slate-400">
                      {new Date(log.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ─── Validity Adjustment Modal ────────────────────────────────────────── */}
      {selectedBizForModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 border border-amber-300 shadow-2xl my-auto">
            {!isConfirmingValidity ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">
                      Adjust Subscription Validity
                    </h3>
                    <p className="text-[11px] text-amber-700 font-medium">
                      {selectedBizForModal.userName} • Current:{" "}
                      {selectedBizForModal.currentExpiry}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBizForModal(null)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form
                  onSubmit={(e) => { e.preventDefault(); setIsConfirmingValidity(true); }}
                  className="space-y-3.5 text-xs"
                >
                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Adjustment Action</label>
                    <select
                      value={modalAdjustmentType}
                      onChange={(e) => setModalAdjustmentType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                    >
                      <option value="EXTEND">EXTEND (Add Days)</option>
                      <option value="REDUCE">REDUCE (Subtract Days)</option>
                      <option value="PAUSE">PAUSE (Temporary Suspension)</option>
                      <option value="ACTIVATE">ACTIVATE (Force Active)</option>
                      <option value="EXPIRE">EXPIRE (Immediate)</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-700 font-bold">Quick Presets</label>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {[7, 30, 90, 365].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => {
                            setModalDays(d);
                            setCustomTargetDate(
                              computeNewExpiryDateISO(selectedBizForModal.rawExpiryDate, d, modalAdjustmentType)
                            );
                          }}
                          className={`py-1.5 rounded-xl font-bold transition cursor-pointer text-xs ${
                            modalDays === d
                              ? "bg-amber-100 text-amber-800 border border-amber-300"
                              : "bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          +{d}d
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-slate-500 block mb-0.5">Days Count</label>
                        <input
                          type="number"
                          min={1}
                          value={modalDays}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setModalDays(val);
                            setCustomTargetDate(
                              computeNewExpiryDateISO(selectedBizForModal.rawExpiryDate, val, modalAdjustmentType)
                            );
                          }}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] text-slate-500 block mb-0.5">Or Target Date</label>
                        <input
                          type="date"
                          value={customTargetDate}
                          onChange={(e) => handleTargetDateChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-700">Calculated Expiry</div>
                      <div className="text-slate-900 font-extrabold text-sm font-mono">
                        {computeNewExpiryDate(selectedBizForModal.rawExpiryDate, modalDays, modalAdjustmentType)}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">
                      {modalAdjustmentType === "REDUCE" ? `-${modalDays}d` : `+${modalDays} days`}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-700 block mb-1 font-bold">Audit Log Reason *</label>
                    <input
                      type="text"
                      required
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="e.g. Customer support courtesy, seasonal bonus"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setSelectedBizForModal(null)}
                      className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-center text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl font-bold transition cursor-pointer active:scale-95 text-center text-xs"
                    >
                      Review & Confirm →
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-slate-900">Confirm Adjustment</h3>
                      <p className="text-[10.5px] text-slate-500">Review before committing</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingValidity(false)}
                    className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5 text-xs">
                  {[
                    { label: "User / Account", value: selectedBizForModal.userName, cls: "text-slate-900 font-bold" },
                    { label: "Adjustment Type", value: modalAdjustmentType, cls: "text-amber-800 font-mono font-bold" },
                    { label: "Day Adjustment", value: `+${modalDays} Days`, cls: "text-emerald-800 font-mono font-extrabold text-sm" },
                    { label: "Previous Expiry", value: selectedBizForModal.currentExpiry, cls: "text-slate-700 font-mono" },
                    { label: "Audit Reason", value: modalReason, cls: "text-slate-700 truncate max-w-[200px] text-right" },
                  ].map(({ label, value, cls }) => (
                    <div key={label} className="flex items-center justify-between border-b border-slate-200 pb-2 last:border-0 last:pb-0">
                      <span className="text-slate-500 font-medium">{label}:</span>
                      <span className={cls}>{value}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-500 font-medium">New Expiry Date:</span>
                    <span className="font-mono font-black text-amber-800 text-sm bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                      {computeNewExpiryDate(selectedBizForModal.rawExpiryDate, modalDays, modalAdjustmentType)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingValidity(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-center text-xs"
                  >
                    ← Back
                  </button>
                  <button
                    type="button"
                    onClick={handleModalAdjustConfirm}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold rounded-xl transition shadow cursor-pointer active:scale-95 text-center text-xs"
                  >
                    Confirm & Commit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
