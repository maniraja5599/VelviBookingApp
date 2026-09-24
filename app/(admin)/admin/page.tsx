"use client";

import React, { useState, useMemo } from "react";
import { db } from "@/lib/db/store";
import {
  Coupon,
  CouponDiscountType,
  UserDirectoryMetric,
} from "@/lib/types";
import {
  Users,
  CreditCard,
  Sparkles,
  Shield,
  Plus,
  CheckCircle,
  Palette,
  Save,
  Radio,
  Search,
  Calendar,
  Tag,
  Trash2,
  Copy,
  Check,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
  Activity,
  DollarSign,
  Globe,
  MapPin,
  Smartphone,
  Mail,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";
import Link from "next/link";
import { VelviLogo } from "@/components/ui/VelviLogo";

export default function SuperAdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "directory" | "coupons" | "subscriptions" | "branding"
  >("overview");

  // Notifications
  const [actionSuccess, setActionSuccess] = useState<string>("");
  const [actionError, setActionError] = useState<string>("");

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg);
      setTimeout(() => setActionError(""), 4000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(""), 4000);
    }
  };

  // ---------------------------------------------------------------------------
  // 1. DIRECTORY & VALIDITY CONTROL STATE
  // ---------------------------------------------------------------------------
  const [directorySearch, setDirectorySearch] = useState("");
  const [directoryFilter, setDirectoryFilter] = useState<
    "ALL" | "ACTIVE" | "TRIAL" | "EXPIRED" | "DEMO"
  >("ALL");

  // Selected Business for custom validity adjustment modal
  const [selectedBizForModal, setSelectedBizForModal] = useState<{
    bizId: string;
    userName: string;
    currentExpiry: string;
  } | null>(null);
  const [modalAdjustmentType, setModalAdjustmentType] = useState<
    "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE"
  >("EXTEND");
  const [modalDays, setModalDays] = useState<number>(30);
  const [modalReason, setModalReason] = useState<string>(
    "Developer promotional extension"
  );

  // Live Directory Metrics with IP Addresses & Geo Locations
  const directoryMetrics: UserDirectoryMetric[] = useMemo(() => {
    return db.getAllUsersDirectoryMetrics();
  }, [actionSuccess, activeTab]);

  const filteredMetrics = useMemo(() => {
    return directoryMetrics.filter((item) => {
      const q = directorySearch.toLowerCase();
      const isDemo =
        item.user.id === "u-ravi-iyer-01" ||
        item.business?.id === "biz-venkateswara-01";

      const matchesSearch =
        item.user.name.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.user.mobile.includes(q) ||
        (item.ipAddress && item.ipAddress.includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        (item.country && item.country.toLowerCase().includes(q)) ||
        (item.business?.name && item.business.name.toLowerCase().includes(q));

      const subStatus = item.subscription?.status || "TRIAL";
      const matchesFilter =
        directoryFilter === "ALL" ||
        (directoryFilter === "ACTIVE" && subStatus === "ACTIVE" && !isDemo) ||
        (directoryFilter === "TRIAL" && subStatus === "TRIAL" && !isDemo) ||
        (directoryFilter === "EXPIRED" && subStatus === "EXPIRED") ||
        (directoryFilter === "DEMO" && isDemo);

      return matchesSearch && matchesFilter;
    });
  }, [directoryMetrics, directorySearch, directoryFilter]);

  // Quick 1-click Validity Extension
  const handleQuickExtend = (bizId: string, days: number, userName: string) => {
    const res = db.adjustSubscriptionValidity({
      businessId: bizId,
      adminUserId: "u-super-admin-01",
      adminName: "Maniraja (Super Admin)",
      adjustmentType: "EXTEND",
      days,
      reason: `Quick +${days}d extension for ${userName}`,
    });

    if (res.success) {
      showToast(`+${days} days added to ${userName}'s subscription!`);
    } else {
      showToast(res.error || "Failed to extend validity", true);
    }
  };

  // Custom Modal Form Submission
  const handleModalAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizForModal) return;

    const res = db.adjustSubscriptionValidity({
      businessId: selectedBizForModal.bizId,
      adminUserId: "u-super-admin-01",
      adminName: "Maniraja (Super Admin)",
      adjustmentType: modalAdjustmentType,
      days: modalDays,
      reason: modalReason.trim() || `Manual adjustment by Super Admin`,
    });

    if (res.success) {
      showToast(
        `Validity adjusted (${modalAdjustmentType} ${modalDays}d) for ${selectedBizForModal.userName}!`
      );
      setSelectedBizForModal(null);
    } else {
      showToast(res.error || "Adjustment failed", true);
    }
  };

  // ---------------------------------------------------------------------------
  // 2. COUPON CODE ENGINE STATE & HANDLERS
  // ---------------------------------------------------------------------------
  const [coupons, setCoupons] = useState<Coupon[]>(() => [...db.coupons]);
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponDesc, setNewCouponDesc] = useState("");
  const [newCouponDiscountType, setNewCouponDiscountType] =
    useState<CouponDiscountType>("FREE_VALIDITY");
  const [newCouponDiscountVal, setNewCouponDiscountVal] = useState<number>(100);
  const [newCouponBonusDays, setNewCouponBonusDays] = useState<number>(30);
  const [newCouponMaxUses, setNewCouponMaxUses] = useState<number>(500);
  const [newCouponValidUntil, setNewCouponValidUntil] = useState<string>("2028-12-31");
  const [copiedCoupon, setCopiedCoupon] = useState<string>("");

  const refreshCoupons = () => {
    setCoupons([...db.coupons]);
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.createCoupon({
      code: newCouponCode,
      description: newCouponDesc,
      discountType: newCouponDiscountType,
      discountValue: Number(newCouponDiscountVal) || 0,
      validityDaysBonus: Number(newCouponBonusDays) || 0,
      maxUses: Number(newCouponMaxUses) || 100,
      validUntil: newCouponValidUntil
        ? `${newCouponValidUntil}T23:59:59Z`
        : "2030-12-31T23:59:59Z",
      isActive: true,
    });

    if (res.success && res.coupon) {
      showToast(`Coupon '${res.coupon.code}' created successfully!`);
      setNewCouponCode("");
      setNewCouponDesc("");
      refreshCoupons();
    } else {
      showToast(res.error || "Failed to create coupon", true);
    }
  };

  const handleToggleCoupon = (couponId: string) => {
    const success = db.toggleCouponStatus(couponId);
    if (success) {
      refreshCoupons();
      showToast("Coupon status updated!");
    }
  };

  const handleDeleteCoupon = (couponId: string, code: string) => {
    if (confirm(`Are you sure you want to delete coupon ${code}?`)) {
      const success = db.deleteCoupon(couponId);
      if (success) {
        refreshCoupons();
        showToast(`Coupon ${code} deleted.`);
      }
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCoupon(code);
    setTimeout(() => setCopiedCoupon(""), 2000);
  };

  // ---------------------------------------------------------------------------
  // 3. PLATFORM BRANDING & SETTINGS STATE
  // ---------------------------------------------------------------------------
  const initialSettings = db.platformSettings;
  const [appName, setAppName] = useState(initialSettings.appName);
  const [appTamilName, setAppTamilName] = useState(initialSettings.appTamilName);
  const [tagline, setTagline] = useState(initialSettings.tagline);
  const [taglineTamil, setTaglineTamil] = useState(initialSettings.taglineTamil);
  const [logoPreset, setLogoPreset] = useState<string>("flame");
  const [customLogoUrl, setCustomLogoUrl] = useState(initialSettings.logoUrl);
  const [appVersion, setAppVersion] = useState(initialSettings.appVersion);
  const [announcementActive, setAnnouncementActive] = useState(
    initialSettings.announcementActive
  );
  const [announcementMessage, setAnnouncementMessage] = useState(
    initialSettings.announcementMessage
  );
  const [developerName, setDeveloperName] = useState(initialSettings.developerName);
  const [developerMobile, setDeveloperMobile] = useState(initialSettings.developerMobile);
  const [developerInstagram, setDeveloperInstagram] = useState(
    initialSettings.developerInstagram
  );

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAppName = appName.trim() || appTamilName.trim() || "Velvi";
    const finalAppTamilName = appTamilName.trim() || appName.trim() || "வேள்வி";

    db.updatePlatformSettings({
      appName: finalAppName,
      appTamilName: finalAppTamilName,
      tagline,
      taglineTamil,
      logoUrl: customLogoUrl,
      appVersion,
      announcementActive,
      announcementMessage,
      developerName,
      developerMobile,
      developerInstagram,
    });

    showToast("Platform branding & system updates saved successfully!");
  };

  // Reset to 100% Real Data
  const handleResetToRealData = () => {
    const res = db.purgeLegacyDummyData();
    db.logAudit({
      actorId: "u-super-admin-01",
      actorName: "Maniraja (Super Admin)",
      action: "RESET_REAL_DATA",
      targetType: "DATABASE_STORE",
      reason: "Purged mock users & synchronized to verified real data",
    });
    showToast(
      res.removedUsers > 0
        ? `Cleaned ${res.removedUsers} mock accounts! Real tenant data synchronized.`
        : "Store already contains 100% verified real data only."
    );
  };

  // Platform KPIs
  const totalUsersCount = directoryMetrics.length;
  const activePaidCount = directoryMetrics.filter(
    (m) => m.subscription?.status === "ACTIVE"
  ).length;
  const totalPlatformEarnings = directoryMetrics.reduce(
    (acc, cur) => acc + cur.totalEarnings,
    0
  );
  const totalBookingsCount = directoryMetrics.reduce(
    (acc, cur) => acc + cur.bookingCount,
    0
  );

  // Dynamic 6-month Platform Revenue Trend from real db.bookings & db.payments
  const monthlyRevenueTrend = useMemo(() => {
    const months: {
      label: string;
      yearMonth: string;
      total: number;
      isCurrent: boolean;
    }[] = [];

    const now = new Date();
    // Build last 6 months list (from 5 months ago to current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString("en-IN", { month: "short" });
      const yearMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        label,
        yearMonth,
        total: 0,
        isCurrent: i === 0,
      });
    }

    // Accumulate actual booking earnings
    (db.bookings || []).forEach((b) => {
      if (b.status === "CANCELLED") return;
      const dateStr = b.date || b.createdAt;
      if (!dateStr) return;
      const bMonth = dateStr.slice(0, 7);
      const match = months.find((m) => m.yearMonth === bMonth);
      if (match) {
        match.total += Number(b.totalAmount) || 0;
      }
    });

    // Accumulate actual Cashfree payments
    (db.payments || []).forEach((p) => {
      if (p.status !== "SUCCESS") return;
      const pMonth = p.createdAt ? p.createdAt.slice(0, 7) : "";
      const match = months.find((m) => m.yearMonth === pMonth);
      if (match) {
        match.total += Number(p.amount) || 0;
      }
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

      return {
        m: m.label,
        v: formattedVal,
        raw: m.total,
        h: `${pct}%`,
        current: m.isCurrent,
      };
    });

    return { bars, growthText };
  }, [actionSuccess, activeTab]);

  // Upcoming Expiries: sorted by currentPeriodEnd ascending
  const upcomingExpiries = useMemo(() => {
    return [...directoryMetrics]
      .filter((m) => m.subscription?.currentPeriodEnd && m.subscription.status !== "EXPIRED")
      .sort((a, b) => {
        const timeA = new Date(a.subscription!.currentPeriodEnd!).getTime();
        const timeB = new Date(b.subscription!.currentPeriodEnd!).getTime();
        return timeA - timeB;
      })
      .slice(0, 4);
  }, [directoryMetrics]);

  if (!isMounted) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xl shadow-md animate-pulse">
          🪔
        </div>
        <p className="text-xs text-slate-400 font-medium">Loading Super Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Refined Luxury Top Header Banner */}
      <div className="bg-gradient-to-br from-[#111726] via-[#0d131f] to-[#080c14] border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-slate-100 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] sm:text-xs font-bold text-amber-400">
            <Shield className="w-3 h-3 text-amber-400" />
            <span>Developer Super Admin</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Velvi Platform Management
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Account: <strong className="text-amber-300 font-mono">manirajankg@gmail.com</strong> • Full tenant control, validity &amp; coupon engine
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto relative z-10 flex-wrap">
          <button
            type="button"
            onClick={handleResetToRealData}
            className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Purge legacy dummy data and synchronize store with verified real records"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Sync Real Data</span>
          </button>
          <Link
            href="/app"
            className="px-3.5 py-2 bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Open Mobile App</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* Notifications Toast */}
      {actionSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-200 p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess("")}
            className="text-emerald-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-rose-950/80 border border-rose-700/80 text-rose-200 p-3 sm:p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-rose-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Responsive Sub-Tabs Bar (Scrollable on mobile) */}
      <div className="bg-[#0c1220] border border-zinc-800 rounded-2xl p-1 flex overflow-x-auto no-scrollbar gap-1 shadow-inner">
        {[
          { id: "overview", label: "Overview", icon: LayoutDashboard },
          {
            id: "directory",
            label: "Vadhyars & Earnings",
            icon: Users,
            badge: totalUsersCount,
          },
          {
            id: "coupons",
            label: "Coupons & Promos",
            icon: Tag,
            badge: coupons.length,
          },
          { id: "subscriptions", label: "Subscriptions & Ledger", icon: CreditCard },
          { id: "branding", label: "Platform Branding", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer whitespace-nowrap shrink-0 ${
                isActive
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-xs"
                  : "text-slate-400 hover:text-slate-200 hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? "bg-amber-500/25 text-amber-200"
                      : "bg-zinc-800 text-slate-400"
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ===================================================================== */}
      {/* SUB-TAB 1: OVERVIEW & ANALYTICS                                      */}
      {/* ===================================================================== */}
      {activeTab === "overview" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Top KPI Cards (Responsive grid) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Total Vadhyars</span>
                <Users className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-white">{totalUsersCount}</div>
              <div className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium">Priests &amp; admins</div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Active Paid</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-emerald-400">{activePaidCount}</div>
              <div className="text-[10px] sm:text-[11px] text-emerald-500 font-medium">
                {totalUsersCount > 0
                  ? `${Math.round((activePaidCount / totalUsersCount) * 100)}% conversion`
                  : "0%"}
              </div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Total Bookings</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-amber-300">{totalBookingsCount}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium">All tenants</div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Total Dakshina</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-emerald-400">
                ₹{totalPlatformEarnings.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-500 font-medium">Platform GMV</div>
            </div>
          </div>

          {/* Revenue Chart & Upcoming Expiries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-[#0f172a]/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-800 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Platform Revenue Trend
                  </span>
                  <div suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-white mt-0.5">
                    ₹{totalPlatformEarnings.toLocaleString("en-IN")}
                  </div>
                </div>
                <span className="text-[10px] sm:text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 sm:px-2.5 py-1 rounded-full font-bold">
                  {monthlyRevenueTrend.growthText}
                </span>
              </div>

              <div className="pt-3 border-t border-zinc-800">
                <div className="text-[10px] sm:text-[11px] text-slate-400 mb-2">Monthly Cashflow Trend</div>
                <div className="flex items-end justify-between h-32 sm:h-36 gap-2 pt-2 px-1">
                  {monthlyRevenueTrend.bars.map((bar) => (
                    <div
                      key={bar.m}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <span className="text-[8px] sm:text-[9px] text-slate-400 font-mono font-medium">{bar.v}</span>
                      <div
                        style={{ height: bar.h }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          bar.current
                            ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-md shadow-amber-500/20"
                            : bar.raw > 0
                            ? "bg-amber-800/50 hover:bg-amber-700/60"
                            : "bg-zinc-800 hover:bg-zinc-700"
                        }`}
                      />
                      <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">{bar.m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Upcoming Expiries */}
            <div className="bg-[#0f172a]/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-800 space-y-3 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <h3 className="font-bold text-xs sm:text-sm text-white">Upcoming Expiries</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">Priority</span>
                </div>

                <div className="space-y-2 mt-2.5">
                  {upcomingExpiries.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs bg-[#090d16] rounded-xl border border-zinc-800/80">
                      No active subscriptions due for expiry.
                    </div>
                  ) : (
                    upcomingExpiries.map((metric) => {
                      const sub = metric.subscription;
                      const expiryDate = sub?.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Trial";
                      return (
                        <div
                          key={metric.user.id}
                          className="p-2.5 bg-[#090d16] rounded-xl border border-zinc-800/80 flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 pr-2">
                            <h4 className="font-bold text-white truncate text-xs">{metric.user.name}</h4>
                            <p className="text-[10px] text-slate-400 truncate">
                              {metric.business?.name || "Independent"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[10px] text-amber-400 font-bold">{expiryDate}</span>
                            {metric.business && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleQuickExtend(metric.business!.id, 30, metric.user.name)
                                }
                                className="px-2 py-0.5 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 rounded text-[10px] font-bold transition cursor-pointer"
                                title="Extend 30 Days"
                              >
                                +30d
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                className="w-full mt-2 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 text-xs font-bold rounded-xl border border-zinc-700/80 text-center transition cursor-pointer"
              >
                View Full Vadhyar Directory →
              </button>
            </div>
          </div>

          {/* Recent Logins & Geo Audit Stream */}
          <div className="bg-[#0f172a]/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-xs sm:text-sm text-white">Live Session Logins &amp; Locations</h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
                Real-Time
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(db.auditLogs || []).slice(0, 6).map((log) => {
                const isDemo = log.action === "DEMO_LOGIN" || log.actorName.includes("Ravi");
                const displayIp = log.ipAddress || "Local / Direct";
                const displayLocation = log.city
                  ? `${log.city}${log.country ? `, ${log.country}` : ""}`
                  : "Location pending";
                return (
                  <div
                    key={log.id}
                    className="p-3 bg-[#090d16] rounded-xl border border-zinc-800/80 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate text-xs">{log.actorName}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                          isDemo
                            ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        }`}
                      >
                        {isDemo ? "🚀 Quick Demo" : log.action.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1 font-mono text-amber-300/90 truncate max-w-[130px]">
                        <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                        {displayIp}
                      </span>
                      <span className="flex items-center gap-1 text-slate-300 truncate max-w-[140px]">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        {displayLocation}
                      </span>
                    </div>

                    <div className="text-[9.5px] text-slate-500 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-1">
                      <span className="truncate max-w-[170px]">{log.reason || "Authenticated Session"}</span>
                      <span className="shrink-0">
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
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 2: VADHYAR DIRECTORY & EARNINGS                                */}
      {/* ===================================================================== */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name, phone, email, IP, city, or country..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#0c1220] border border-zinc-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-1 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
              {["ALL", "ACTIVE", "TRIAL", "EXPIRED", "DEMO"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDirectoryFilter(f as any)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                    directoryFilter === f
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold"
                      : "bg-[#0c1220] text-slate-400 border border-zinc-800 hover:text-white"
                  }`}
                >
                  {f === "DEMO" ? "🚀 DEMO" : f}
                </button>
              ))}
            </div>
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* MOBILE VIEW (< 640px): Clean Cards Layout (No Horizontal Scroll)  */}
          {/* ----------------------------------------------------------------- */}
          <div className="sm:hidden space-y-3">
            {filteredMetrics.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-zinc-800">
                No vadhyars found matching &quot;{directorySearch}&quot;
              </div>
            ) : (
              filteredMetrics.map((item) => {
                const biz = item.business;
                const sub = item.subscription;
                const subStatus = sub?.status || "TRIAL";
                const expiryFormatted = sub?.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                const joinedFormatted = item.joinedDate
                  ? new Date(item.joinedDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "Jan 2026";

                return (
                  <div
                    key={item.user.id}
                    className="bg-[#0f172a]/90 rounded-2xl border border-zinc-800 p-3.5 space-y-3 shadow-md"
                  >
                    {/* Top: Name + Super Admin Badge + Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-white">{item.user.name}</span>
                          {item.isSuperAdmin && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                              Super Admin
                            </span>
                          )}
                          {(item.user.id === "u-ravi-iyer-01" || biz?.id === "biz-venkateswara-01") && (
                            <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-black uppercase">
                              Demo (20 Cap)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-amber-400/90 font-medium">
                          {biz?.name || "Independent Practitioner"}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                          subStatus === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : subStatus === "TRIAL"
                            ? "bg-amber-950 text-amber-400 border border-amber-800"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {subStatus}
                      </span>
                    </div>

                    {/* Contact & IP Address Badge */}
                    <div className="bg-[#090d16] p-2 rounded-xl border border-zinc-800/80 space-y-1 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Smartphone className="w-3 h-3 text-slate-400" />
                          {item.user.mobile}
                        </span>
                        <span className="text-slate-400 text-[10px] truncate max-w-[140px]">
                          {item.user.email}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1 text-[10px] text-amber-400/90 font-mono pt-0.5 border-t border-zinc-800/60 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>IP: {item.ipAddress || "Pending Login"}</span>
                        </span>
                        <span className="flex items-center gap-1 text-slate-300 font-sans">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span>{item.city ? `${item.city}${item.country ? `, ${item.country}` : ""}` : "Location pending"}</span>
                        </span>
                      </div>
                    </div>

                    {/* Stats Grid: Joined Date, Bookings, Total Dakshina */}
                    <div className="grid grid-cols-3 gap-2 text-center bg-[#090d16] p-2 rounded-xl border border-zinc-800/60 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Joined</span>
                        <span className="font-semibold text-slate-200 text-[11px]">{joinedFormatted}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Bookings</span>
                        <span className="font-extrabold text-white text-[11px]">
                          {item.bookingCount} ({item.completedBookingsCount} done)
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase">Dakshina</span>
                        <span className="font-extrabold text-emerald-400 text-[11px]">
                          ₹{item.totalEarnings.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Validity Info & Quick Action Buttons */}
                    <div className="pt-1 flex items-center justify-between gap-1 flex-wrap">
                      <div className="text-[10px] text-slate-400">
                        Valid Until: <strong className="text-slate-200">{expiryFormatted}</strong>
                      </div>

                      {biz && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleQuickExtend(biz.id, 30, item.user.name)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-700 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            +30d
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickExtend(biz.id, 90, item.user.name)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-700 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            +90d
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedBizForModal({
                                bizId: biz.id,
                                userName: item.user.name,
                                currentExpiry: expiryFormatted,
                              })
                            }
                            className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* ----------------------------------------------------------------- */}
          {/* DESKTOP VIEW (>= 640px): Full Table with IP Address Column         */}
          {/* ----------------------------------------------------------------- */}
          <div className="hidden sm:block bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[800px]">
                <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Vadhyar &amp; Business</th>
                    <th className="p-4">IP &amp; Location</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Bookings</th>
                    <th className="p-4">Dakshina Total</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Validity End</th>
                    <th className="p-4 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No vadhyars found matching &quot;{directorySearch}&quot;
                      </td>
                    </tr>
                  ) : (
                    filteredMetrics.map((item) => {
                      const biz = item.business;
                      const sub = item.subscription;
                      const subStatus = sub?.status || "TRIAL";
                      const expiryFormatted = sub?.currentPeriodEnd
                        ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A";

                      const joinedFormatted = item.joinedDate
                        ? new Date(item.joinedDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Jan 2026";

                      return (
                        <tr key={item.user.id} className="hover:bg-zinc-800/30 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white text-sm">
                                {item.user.name}
                              </span>
                              {item.isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                                  Super Admin
                                </span>
                              )}
                              {(item.user.id === "u-ravi-iyer-01" || biz?.id === "biz-venkateswara-01") && (
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[9px] font-black uppercase">
                                  Demo (20 Cap)
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-400/90 font-medium">
                              {biz?.name || "Independent Practitioner"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {item.user.mobile} • {item.user.email}
                            </div>
                          </td>

                          {/* IP Address & Location Column */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-300/90 bg-[#090d16] px-2 py-0.5 rounded-lg border border-zinc-800 w-fit">
                                <Globe className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                <span>{item.ipAddress || "Pending Login"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 pl-0.5">
                                <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                                <span>{item.city ? `${item.city}${item.country ? `, ${item.country}` : ""}` : "—"}</span>
                              </div>
                            </div>
                          </td>

                          <td className="p-4 text-slate-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{joinedFormatted}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">
                                {item.bookingCount}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/80">
                                {item.completedBookingsCount} done
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-extrabold text-emerald-400 text-sm">
                              ₹{item.totalEarnings.toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                subStatus === "ACTIVE"
                                  ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                  : subStatus === "TRIAL"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-rose-950 text-rose-400 border border-rose-800"
                              }`}
                            >
                              {subStatus}
                            </span>
                          </td>

                          <td className="p-4 text-slate-300 whitespace-nowrap font-medium">
                            {expiryFormatted}
                          </td>

                          <td className="p-4 text-right">
                            {biz ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickExtend(biz.id, 30, item.user.name)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-700 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Add 30 Days"
                                >
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickExtend(biz.id, 90, item.user.name)}
                                  className="px-2 py-1 bg-zinc-800 hover:bg-amber-500 hover:text-black border border-zinc-700 text-slate-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Add 90 Days"
                                >
                                  +90d
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSelectedBizForModal({
                                      bizId: biz.id,
                                      userName: item.user.name,
                                      currentExpiry: expiryFormatted,
                                    })
                                  }
                                  className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-extrabold transition cursor-pointer"
                                >
                                  Edit Validity
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-500">No Business</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 3: COUPONS & PROMO CODE ENGINE                                 */}
      {/* ===================================================================== */}
      {activeTab === "coupons" && (
        <div className="space-y-4 sm:space-y-6">
          {/* Coupon Creation Card */}
          <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-amber-500/30 p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-zinc-800">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                <Tag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Create New Promo Pass</h3>
                <p className="text-[11px] text-slate-400">
                  Configure 100% free passes, percentage discounts, or festive bonuses
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Coupon Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VELVIPRO100, MANISUPER"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    Description &amp; Offer Details *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100% Free Velvi Pro Extension (Special Developer Pass)"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Discount Type</label>
                  <select
                    value={newCouponDiscountType}
                    onChange={(e) =>
                      setNewCouponDiscountType(e.target.value as CouponDiscountType)
                    }
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FREE_VALIDITY">FREE_VALIDITY (100% Free Pass)</option>
                    <option value="PERCENTAGE">PERCENTAGE (% Off Price)</option>
                    <option value="FLAT">FLAT (Flat ₹ Off Price)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Discount Value ({newCouponDiscountType === "PERCENTAGE" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponDiscountVal}
                    onChange={(e) => setNewCouponDiscountVal(Number(e.target.value))}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Bonus Validity Days (+Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 30, 90, 365"
                    value={newCouponBonusDays}
                    onChange={(e) => setNewCouponBonusDays(Number(e.target.value))}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Max Usages Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={newCouponValidUntil}
                    onChange={(e) => setNewCouponValidUntil(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold rounded-xl transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create &amp; Activate Coupon</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Coupons List - Responsive Cards on Mobile & Table on Desktop */}
          <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
              <h3 className="font-bold text-xs sm:text-sm text-white">
                Live Coupons &amp; Usage Counts ({coupons.length})
              </h3>
              <span className="text-[10px] sm:text-[11px] text-slate-400">
                Redeemable in subscription checkout
              </span>
            </div>

            {/* Mobile Cards for Coupons */}
            <div className="sm:hidden p-3 space-y-2.5">
              {coupons.map((c) => {
                const isCopied = copiedCoupon === c.code;
                const usagePercent = Math.min(
                  100,
                  Math.round((c.usedCount / (c.maxUses || 1)) * 100)
                );
                return (
                  <div
                    key={c.id}
                    className="bg-[#080c14] p-3 rounded-xl border border-zinc-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => handleCopyCode(c.code)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg font-mono font-bold text-xs"
                      >
                        <span>{c.code}</span>
                        {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-amber-400" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleCoupon(c.id)}
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border transition ${
                            c.isActive
                              ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                              : "bg-zinc-800 text-slate-400 border-zinc-700"
                          }`}
                        >
                          {c.isActive ? "ACTIVE" : "INACTIVE"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="p-1 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-300 font-medium">{c.description}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-zinc-800">
                      <span>Discount: <strong className="text-emerald-400">{c.discountType === "FREE_VALIDITY" ? "100% Free" : c.discountValue}</strong></span>
                      <span>Bonus: <strong className="text-amber-300">+{c.validityDaysBonus}d</strong></span>
                      <span>Used: <strong className="text-white">{c.usedCount}/{c.maxUses}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for Coupons */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
                <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Coupon Code</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">Discount</th>
                    <th className="p-4">Validity Bonus</th>
                    <th className="p-4">Usage Tracker</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {coupons.map((c) => {
                    const usagePercent = Math.min(
                      100,
                      Math.round((c.usedCount / (c.maxUses || 1)) * 100)
                    );
                    const isCopied = copiedCoupon === c.code;

                    return (
                      <tr key={c.id} className="hover:bg-zinc-800/25 transition">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg font-mono font-bold text-xs tracking-wider cursor-pointer"
                            title="Click to Copy"
                          >
                            <span>{c.code}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-amber-400" />
                            )}
                          </button>
                        </td>

                        <td className="p-4 text-slate-200">
                          <div className="font-semibold">{c.description}</div>
                          <div className="text-[10px] text-slate-400">
                            Valid until: {new Date(c.validUntil).toLocaleDateString("en-IN")}
                          </div>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-emerald-400">
                            {c.discountType === "FREE_VALIDITY"
                              ? "100% Free Pass"
                              : c.discountType === "PERCENTAGE"
                              ? `${c.discountValue}% Off`
                              : `₹${c.discountValue} Off`}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="font-bold text-amber-400">
                            +{c.validityDaysBonus} Days
                          </span>
                        </td>

                        <td className="p-4">
                          <div className="space-y-1 min-w-[100px]">
                            <div className="flex justify-between text-[10px] font-mono">
                              <span className="text-white font-bold">{c.usedCount} used</span>
                              <span className="text-slate-400">/ {c.maxUses} max</span>
                            </div>
                            <div className="w-full bg-[#080c14] rounded-full h-1.5 overflow-hidden border border-zinc-800">
                              <div
                                style={{ width: `${usagePercent}%` }}
                                className="bg-amber-400 h-full rounded-full"
                              />
                            </div>
                          </div>
                        </td>

                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition cursor-pointer ${
                              c.isActive
                                ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                                : "bg-zinc-800 text-slate-400 border-zinc-700"
                            }`}
                          >
                            {c.isActive ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 4: SUBSCRIPTIONS & CASHFREE LEDGER                             */}
      {/* ===================================================================== */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Cashfree Ledger &amp; Audit Log</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Transactions &amp; automated validity additions ({db.payments.length})
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-full text-[9px] sm:text-[10px] font-bold">
                Gateway Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
                <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Order ID / Payment ID</th>
                    <th className="p-4">Vadhyar &amp; Business</th>
                    <th className="p-4">Cycle</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {db.payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    db.payments.map((p) => {
                      const biz = db.businesses.find((b) => b.id === p.businessId);
                      const user = db.users.find((u) => u.id === p.userId);
                      return (
                        <tr key={p.id} className="hover:bg-zinc-800/25 transition">
                          <td className="p-4 font-mono">
                            <div className="font-bold text-white">{p.orderId}</div>
                            <div className="text-[10px] text-slate-400">{p.gatewayPaymentId}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">
                              {biz?.name || "Independent"}
                            </div>
                            <div className="text-[10px] text-slate-400">{user?.name}</div>
                          </td>
                          <td className="p-4 font-bold">{p.billingCycle}</td>
                          <td className="p-4 font-mono font-extrabold text-emerald-400 text-sm">
                            ₹{p.amount}
                          </td>
                          <td className="p-4 text-slate-300">
                            {p.paymentMethod || "Cashfree PG"}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right text-slate-400 whitespace-nowrap">
                            {new Date(p.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 5: PLATFORM BRANDING & UPDATES                                */}
      {/* ===================================================================== */}
      {activeTab === "branding" && (
        <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 p-4 sm:p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">Platform Branding &amp; System Updates</h2>
              <p className="text-[11px] text-slate-400">
                Update App Logo, Brand Identity, System Broadcasts, and Developer Information
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePlatformSettings} className="space-y-5 text-xs">
            {/* Logo Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#080c14] rounded-2xl p-4 border border-zinc-800 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                  Live Logo Preview
                </span>
                <div className="p-3 bg-velvi-cream rounded-2xl border border-velvi-gold/40 flex items-center justify-center shadow-inner">
                  <VelviLogo size="md" variant="full" showTagline={false} />
                </div>
                <div className="text-[11px] text-slate-400">
                  <strong className="text-white">{appName}</strong> ({appTamilName})
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Choose App Icon / Logo Preset
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "flame", label: "Sacred Flame", icon: "🪔" },
                    { id: "kalasam", label: "Vedic Kalasam", icon: "🏺" },
                    { id: "om", label: "Divine Om", icon: "🕉️" },
                    { id: "diya", label: "Brass Diya", icon: "🪔" },
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setLogoPreset(preset.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                        logoPreset === preset.id
                          ? "bg-amber-500/15 border-amber-400 text-amber-300"
                          : "bg-[#080c14] border-zinc-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">
                    Custom Logo Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="/velvi-sacred-flame.png or https://..."
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Names & Taglines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  App Name (English)
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  App Name (Tamil - தமிழ்)
                </label>
                <input
                  type="text"
                  value={appTamilName}
                  onChange={(e) => setAppTamilName(e.target.value)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tagline (English)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Tagline (Tamil - தமிழ்)
                </label>
                <input
                  type="text"
                  value={taglineTamil}
                  onChange={(e) => setTaglineTamil(e.target.value)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Version & Broadcasts */}
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Broadcast Updates &amp; Version
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">
                    App Version
                  </label>
                  <input
                    type="text"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="v2.5.3"
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-300">
                      Announcement Banner
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementActive}
                        onChange={(e) => setAnnouncementActive(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500 bg-[#080c14] border-zinc-700"
                      />
                      <span className="text-[11px] font-semibold text-slate-400">Active</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Developer Credits */}
            <div className="pt-2 border-t border-zinc-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Developer Credits
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Developer Name
                  </label>
                  <input
                    type="text"
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={developerMobile}
                    onChange={(e) => setDeveloperMobile(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={developerInstagram}
                    onChange={(e) => setDeveloperInstagram(e.target.value)}
                    className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-zinc-800 flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Settings &amp; Broadcasts</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CUSTOM VALIDITY ADJUSTMENT MODAL                                      */}
      {/* ===================================================================== */}
      {selectedBizForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 border border-amber-500/30 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Validity</h3>
                <p className="text-[11px] text-amber-400 font-medium">
                  {selectedBizForModal.userName} (Expiry: {selectedBizForModal.currentExpiry})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBizForModal(null)}
                className="text-slate-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-bold">Adjustment Action</label>
                <select
                  value={modalAdjustmentType}
                  onChange={(e) => setModalAdjustmentType(e.target.value as any)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="EXTEND">EXTEND (Add Days to Expiry)</option>
                  <option value="REDUCE">REDUCE (Subtract Days)</option>
                  <option value="PAUSE">PAUSE (Pause Membership)</option>
                  <option value="ACTIVATE">ACTIVATE (Force Active Status)</option>
                  <option value="EXPIRE">EXPIRE (Mark Immediately Expired)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">Days to Adjust</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModalDays(d)}
                      className={`py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        modalDays === d
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                          : "bg-[#080c14] border border-zinc-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  value={modalDays}
                  onChange={(e) => setModalDays(Number(e.target.value))}
                  placeholder="Custom days"
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-bold">
                  Mandatory Audit Log Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Developer grant, support resolution"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBizForModal(null)}
                  className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-xl font-bold transition cursor-pointer active:scale-95"
                >
                  Save &amp; Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
