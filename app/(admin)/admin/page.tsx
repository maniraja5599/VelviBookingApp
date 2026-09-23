"use client";

import React, { useState, useMemo } from "react";
import { db, PlatformSettings } from "@/lib/db/store";
import {
  Coupon,
  CouponDiscountType,
  UserDirectoryMetric,
} from "@/lib/types";
import {
  Users,
  CreditCard,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Shield,
  Plus,
  CheckCircle,
  Palette,
  Bell,
  Save,
  Radio,
  Search,
  Calendar,
  Gift,
  Tag,
  Trash2,
  Copy,
  Check,
  LayoutDashboard,
  Clock,
  ArrowUpRight,
  Activity,
  Sliders,
  DollarSign,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { VelviLogo } from "@/components/ui/VelviLogo";

export default function SuperAdminDashboardPage() {
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
    "ALL" | "ACTIVE" | "TRIAL" | "EXPIRED"
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

  // Live Directory Metrics
  const directoryMetrics: UserDirectoryMetric[] = useMemo(() => {
    return db.getAllUsersDirectoryMetrics();
  }, [actionSuccess, activeTab]);

  const filteredMetrics = useMemo(() => {
    return directoryMetrics.filter((item) => {
      const q = directorySearch.toLowerCase();
      const matchesSearch =
        item.user.name.toLowerCase().includes(q) ||
        item.user.email.toLowerCase().includes(q) ||
        item.user.mobile.includes(q) ||
        (item.business?.name && item.business.name.toLowerCase().includes(q));

      const subStatus = item.subscription?.status || "TRIAL";
      const matchesFilter =
        directoryFilter === "ALL" ||
        (directoryFilter === "ACTIVE" && subStatus === "ACTIVE") ||
        (directoryFilter === "TRIAL" && subStatus === "TRIAL") ||
        (directoryFilter === "EXPIRED" && subStatus === "EXPIRED");

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
      showToast(`+${days} days added successfully to ${userName}'s subscription!`);
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

  // Platform KPIs
  const totalUsersCount = directoryMetrics.length;
  const activePaidCount = directoryMetrics.filter(
    (m) => m.subscription?.status === "ACTIVE"
  ).length;
  const trialUsersCount = directoryMetrics.filter(
    (m) => (m.subscription?.status || "TRIAL") === "TRIAL"
  ).length;
  const expiredCount = directoryMetrics.filter(
    (m) => m.subscription?.status === "EXPIRED"
  ).length;
  const totalPlatformEarnings = directoryMetrics.reduce(
    (acc, cur) => acc + cur.totalEarnings,
    0
  );
  const totalBookingsCount = directoryMetrics.reduce(
    (acc, cur) => acc + cur.bookingCount,
    0
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 rounded-3xl p-5 md:p-6 text-black shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/15 text-[11px] font-extrabold uppercase tracking-wider text-amber-950">
            <Shield className="w-3.5 h-3.5" /> Super Admin Developer Console
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white drop-shadow-xs">
            Velvi Platform Management
          </h1>
          <p className="text-xs font-semibold text-amber-950/80">
            Developer Account: <strong className="text-black font-mono">manirajankg@gmail.com</strong> • Full tenant control, validity editor &amp; coupons engine
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/app"
            className="px-4 py-2 bg-black text-amber-400 hover:bg-gray-900 text-xs font-bold rounded-2xl shadow transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Open Mobile App</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Notifications Toast */}
      {actionSuccess && (
        <div className="bg-green-950/90 border border-green-700 text-green-300 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
            <span className="font-semibold">{actionSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionSuccess("")}
            className="text-green-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {actionError && (
        <div className="bg-red-950/90 border border-red-700 text-red-300 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-lg animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-semibold">{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError("")}
            className="text-red-400 hover:text-white font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-gray-950/80 border border-gray-800 rounded-2xl p-1.5 flex flex-wrap gap-1 shadow-inner">
        {[
          { id: "overview", label: "Overview & Analytics", icon: LayoutDashboard },
          {
            id: "directory",
            label: "Vadhyars Directory & Earnings",
            icon: Users,
            badge: totalUsersCount,
          },
          {
            id: "coupons",
            label: "Coupons & Promo Engine",
            icon: Tag,
            badge: coupons.length,
          },
          { id: "subscriptions", label: "Subscriptions & Cashfree Ledger", icon: CreditCard },
          { id: "branding", label: "Platform Branding & Updates", icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[130px] sm:min-w-fit px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                isActive
                  ? "bg-amber-500 text-black shadow-md ring-1 ring-amber-400/50"
                  : "text-gray-400 hover:text-white hover:bg-gray-900"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    isActive
                      ? "bg-black/20 text-black"
                      : "bg-gray-800 text-gray-400"
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
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-gray-400 flex items-center justify-between">
                <span>Total Vadhyars</span>
                <Users className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white">{totalUsersCount}</div>
              <div className="text-[11px] text-amber-400 font-medium">Registered priests &amp; admins</div>
            </div>

            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-gray-400 flex items-center justify-between">
                <span>Active Paid Subs</span>
                <CheckCircle className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-black text-green-400">{activePaidCount}</div>
              <div className="text-[11px] text-green-500 font-medium">
                {totalUsersCount > 0
                  ? `${Math.round((activePaidCount / totalUsersCount) * 100)}% conversion`
                  : "0%"}
              </div>
            </div>

            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-gray-400 flex items-center justify-between">
                <span>Total Bookings</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300">{totalBookingsCount}</div>
              <div className="text-[11px] text-amber-400 font-medium">All tenants combined</div>
            </div>

            <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
              <div className="text-xs font-semibold text-gray-400 flex items-center justify-between">
                <span>Total Dakshina GMV</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-black text-emerald-400">
                ₹{totalPlatformEarnings.toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-emerald-500 font-medium">Platform-wide earnings</div>
            </div>
          </div>

          {/* Revenue Chart & Upcoming Expiries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Monthly Cashflow Chart */}
            <div className="lg:col-span-2 bg-gray-800/60 p-5 rounded-3xl border border-gray-700/60 space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Platform Revenue Trend
                  </span>
                  <div className="text-3xl font-black text-white mt-1">₹62,400</div>
                </div>
                <span className="text-xs text-green-400 bg-green-950/60 border border-green-800 px-2.5 py-1 rounded-full font-bold">
                  +24% vs Prev Month
                </span>
              </div>

              <div className="pt-4 border-t border-gray-700/50">
                <div className="text-[11px] text-gray-400 mb-2">Monthly Cashflow Trend</div>
                <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2">
                  {[
                    { m: "Apr", v: "₹28k", h: "45%" },
                    { m: "May", v: "₹34k", h: "55%" },
                    { m: "Jun", v: "₹42k", h: "68%" },
                    { m: "Jul", v: "₹48.5k", h: "78%" },
                    { m: "Aug", v: "₹52k", h: "83%" },
                    { m: "Sep", v: "₹62.4k", h: "100%", current: true },
                  ].map((bar) => (
                    <div
                      key={bar.m}
                      className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <span className="text-[9px] text-gray-400">{bar.v}</span>
                      <div
                        style={{ height: bar.h }}
                        className={`w-full rounded-t-xl transition-all duration-300 ${
                          bar.current
                            ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20"
                            : "bg-gray-700 hover:bg-gray-600"
                        }`}
                      />
                      <span className="text-[10px] font-semibold text-gray-400">{bar.m}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Expiries Panel */}
            <div className="bg-gray-800/60 p-5 rounded-3xl border border-gray-700/60 space-y-3 shadow-md flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-700">
                  <h3 className="font-bold text-sm text-white">Upcoming Expiries</h3>
                  <span className="text-[10px] text-amber-400 font-semibold">Priority Action</span>
                </div>

                <div className="space-y-2.5 mt-3">
                  {directoryMetrics.slice(0, 4).map((metric) => {
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
                        className="p-3 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <h4 className="font-bold text-white">{metric.user.name}</h4>
                          <p className="text-[11px] text-gray-400">
                            {metric.business?.name || "Independent"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-amber-400 font-bold">{expiryDate}</span>
                          {metric.business && (
                            <button
                              type="button"
                              onClick={() =>
                                handleQuickExtend(metric.business!.id, 30, metric.user.name)
                              }
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                              title="Extend 30 Days"
                            >
                              +30d
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("directory")}
                className="w-full mt-3 py-2 bg-gray-800 hover:bg-gray-700 text-amber-400 text-xs font-bold rounded-xl border border-gray-700 text-center transition cursor-pointer"
              >
                View Full Vadhyar Directory →
              </button>
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
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1 sm:max-w-md">
              <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search Vadhyar name, email, phone, business..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex gap-1.5 text-xs font-semibold overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "ACTIVE", "TRIAL", "EXPIRED"].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setDirectoryFilter(f as any)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                    directoryFilter === f
                      ? "bg-amber-500 text-black font-bold shadow-xs"
                      : "bg-gray-800 text-gray-400 hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Vadhyar Directory Table (Responsive, no overflow) */}
          <div className="bg-gray-800/70 rounded-3xl border border-gray-700/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 min-w-[760px]">
                <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
                  <tr>
                    <th className="p-4">Vadhyar &amp; Business</th>
                    <th className="p-4">Joined Date</th>
                    <th className="p-4">Bookings</th>
                    <th className="p-4">Total Dakshina</th>
                    <th className="p-4">Plan Status</th>
                    <th className="p-4">Validity End</th>
                    <th className="p-4 text-right">Validity Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {filteredMetrics.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400">
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
                        <tr key={item.user.id} className="hover:bg-gray-700/25 transition">
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">
                                {item.user.name}
                              </span>
                              {item.isSuperAdmin && (
                                <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-extrabold uppercase">
                                  Super Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-amber-400/90 font-medium">
                              {biz?.name || "Independent Practitioner"}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono">
                              {item.user.mobile} • {item.user.email}
                            </div>
                          </td>

                          <td className="p-4 text-gray-300 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              <span>{joinedFormatted}</span>
                            </div>
                          </td>

                          <td className="p-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-sm">
                                {item.bookingCount}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800">
                                {item.completedBookingsCount} done
                              </span>
                            </div>
                          </td>

                          <td className="p-4">
                            <span className="font-mono font-extrabold text-white text-sm">
                              ₹{item.totalEarnings.toLocaleString("en-IN")}
                            </span>
                          </td>

                          <td className="p-4">
                            <span
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                                subStatus === "ACTIVE"
                                  ? "bg-green-950 text-green-400 border border-green-800"
                                  : subStatus === "TRIAL"
                                  ? "bg-amber-950 text-amber-400 border border-amber-800"
                                  : "bg-red-950 text-red-400 border border-red-800"
                              }`}
                            >
                              {subStatus}
                            </span>
                          </td>

                          <td className="p-4 text-gray-300 whitespace-nowrap font-medium">
                            {expiryFormatted}
                          </td>

                          <td className="p-4 text-right">
                            {biz ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleQuickExtend(biz.id, 30, item.user.name)}
                                  className="px-2 py-1 bg-gray-800 hover:bg-amber-500 hover:text-black border border-gray-700 text-gray-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Add 30 Days"
                                >
                                  +30d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickExtend(biz.id, 90, item.user.name)}
                                  className="px-2 py-1 bg-gray-800 hover:bg-amber-500 hover:text-black border border-gray-700 text-gray-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Add 90 Days"
                                >
                                  +90d
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleQuickExtend(biz.id, 365, item.user.name)}
                                  className="px-2 py-1 bg-gray-800 hover:bg-amber-500 hover:text-black border border-gray-700 text-gray-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                  title="Add 365 Days"
                                >
                                  +365d
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
                                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded-lg text-[10px] font-extrabold transition cursor-pointer shadow-xs"
                                >
                                  Edit Validity
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500">No Business</span>
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
        <div className="space-y-6">
          {/* Coupon Creation Card */}
          <div className="bg-gray-800/80 rounded-3xl border border-amber-500/40 p-5 md:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-700">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Create New Coupon / Promo Pass</h3>
                  <p className="text-xs text-gray-400">
                    Configure 100% free passes, percentage discounts, or festive bonuses
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="text-gray-300 font-bold block mb-1">
                    Coupon Code (Uppercase) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. VELVIPRO100, MANISUPER"
                    value={newCouponCode}
                    onChange={(e) => setNewCouponCode(e.target.value.toUpperCase())}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-gray-300 font-bold block mb-1">
                    Description &amp; Offer Details *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 100% Free Velvi Pro Extension (Special Developer Pass)"
                    value={newCouponDesc}
                    onChange={(e) => setNewCouponDesc(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Discount Type</label>
                  <select
                    value={newCouponDiscountType}
                    onChange={(e) =>
                      setNewCouponDiscountType(e.target.value as CouponDiscountType)
                    }
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="FREE_VALIDITY">FREE_VALIDITY (100% Free Pass)</option>
                    <option value="PERCENTAGE">PERCENTAGE (% Off Price)</option>
                    <option value="FLAT">FLAT (Flat ₹ Off Price)</option>
                  </select>
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">
                    Discount Value ({newCouponDiscountType === "PERCENTAGE" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newCouponDiscountVal}
                    onChange={(e) => setNewCouponDiscountVal(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">
                    Bonus Validity Days (+Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 30, 90, 365"
                    value={newCouponBonusDays}
                    onChange={(e) => setNewCouponBonusDays(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Max Usages Limit</label>
                  <input
                    type="number"
                    min={1}
                    value={newCouponMaxUses}
                    onChange={(e) => setNewCouponMaxUses(Number(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-gray-300 font-bold block mb-1">Valid Until Date</label>
                  <input
                    type="date"
                    value={newCouponValidUntil}
                    onChange={(e) => setNewCouponValidUntil(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-black font-extrabold rounded-xl transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create &amp; Activate Coupon</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Coupons Live List & Usage Tracker */}
          <div className="bg-gray-800/70 rounded-3xl border border-gray-700/60 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-700/80 flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">
                Live Coupons &amp; Usage Counts ({coupons.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                Redeemable in app subscription checkout
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 min-w-[700px]">
                <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
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
                <tbody className="divide-y divide-gray-700/50">
                  {coupons.map((c) => {
                    const usagePercent = Math.min(
                      100,
                      Math.round((c.usedCount / (c.maxUses || 1)) * 100)
                    );
                    const isCopied = copiedCoupon === c.code;

                    return (
                      <tr key={c.id} className="hover:bg-gray-700/25 transition">
                        <td className="p-4">
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg font-mono font-bold text-xs tracking-wider cursor-pointer"
                            title="Click to Copy"
                          >
                            <span>{c.code}</span>
                            {isCopied ? (
                              <Check className="w-3 h-3 text-green-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-amber-400" />
                            )}
                          </button>
                        </td>

                        <td className="p-4 text-gray-200">
                          <div className="font-semibold">{c.description}</div>
                          <div className="text-[10px] text-gray-400">
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
                              <span className="text-gray-400">/ {c.maxUses} max</span>
                            </div>
                            <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
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
                                ? "bg-green-950 text-green-400 border-green-800"
                                : "bg-gray-800 text-gray-400 border-gray-700"
                            }`}
                          >
                            {c.isActive ? "ACTIVE" : "INACTIVE"}
                          </button>
                        </td>

                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.id, c.code)}
                            className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-700/50 transition cursor-pointer"
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
        <div className="space-y-6">
          {/* Cashfree Verified Payments Table */}
          <div className="bg-gray-800/70 rounded-3xl border border-gray-700/60 overflow-hidden shadow-xl">
            <div className="p-4 border-b border-gray-700/80 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white">Cashfree Payments &amp; Audit Log</h3>
                <p className="text-xs text-gray-400">
                  Real-time webhook and verified client payments ({db.payments.length})
                </p>
              </div>
              <span className="px-2.5 py-1 bg-green-950/80 border border-green-800 text-green-300 rounded-full text-[10px] font-bold">
                Cashfree Gateway Verified
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300 min-w-[700px]">
                <thead className="bg-gray-900/90 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
                  <tr>
                    <th className="p-4">Order ID / Payment ID</th>
                    <th className="p-4">Business / Vadhyar</th>
                    <th className="p-4">Cycle</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/50">
                  {db.payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-400">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    db.payments.map((p) => {
                      const biz = db.businesses.find((b) => b.id === p.businessId);
                      const user = db.users.find((u) => u.id === p.userId);
                      return (
                        <tr key={p.id} className="hover:bg-gray-700/25 transition">
                          <td className="p-4 font-mono">
                            <div className="font-bold text-white">{p.orderId}</div>
                            <div className="text-[10px] text-gray-400">{p.gatewayPaymentId}</div>
                          </td>
                          <td className="p-4">
                            <div className="font-semibold text-white">
                              {biz?.name || "Independent"}
                            </div>
                            <div className="text-[10px] text-gray-400">{user?.name}</div>
                          </td>
                          <td className="p-4 font-bold">{p.billingCycle}</td>
                          <td className="p-4 font-mono font-extrabold text-white text-sm">
                            ₹{p.amount}
                          </td>
                          <td className="p-4 text-gray-300">
                            {p.paymentMethod || "Cashfree PG"}
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-950 text-green-400 border border-green-800">
                              {p.status}
                            </span>
                          </td>
                          <td className="p-4 text-right text-gray-400 whitespace-nowrap">
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
        <div className="bg-gray-800/80 rounded-3xl border border-amber-500/30 p-5 md:p-6 space-y-6 shadow-xl">
          <div className="flex items-center gap-3 border-b border-gray-700/60 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Platform Branding &amp; System Updates</h2>
              <p className="text-xs text-gray-400">
                Update App Logo, Brand Identity, System Broadcasts, and Developer Information
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePlatformSettings} className="space-y-6">
            {/* Logo Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-gray-900/90 rounded-2xl p-4 border border-gray-700/70 flex flex-col items-center justify-center text-center space-y-3">
                <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                  Live Logo Preview
                </span>
                <div className="p-3 bg-velvi-cream rounded-2xl border border-velvi-gold/40 flex items-center justify-center shadow-inner">
                  <VelviLogo size="md" variant="full" showTagline={false} />
                </div>
                <div className="text-[11px] text-gray-400">
                  Current App Title: <strong className="text-white">{appName}</strong> (
                  {appTamilName})
                </div>
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-bold text-gray-300 block">
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
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                        logoPreset === preset.id
                          ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                          : "bg-gray-900/60 border-gray-700 text-gray-400 hover:text-white"
                      }`}
                    >
                      <span className="text-base">{preset.icon}</span>
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">
                    Custom Logo Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="/velvi-sacred-flame.png or https://..."
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Names & Taglines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-700/50">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  App Name (English)
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  App Name (Tamil - தமிழ்)
                </label>
                <input
                  type="text"
                  value={appTamilName}
                  onChange={(e) => setAppTamilName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Tagline (English)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Tagline (Tamil - தமிழ்)
                </label>
                <input
                  type="text"
                  value={taglineTamil}
                  onChange={(e) => setTaglineTamil(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Version & Announcement */}
            <div className="pt-2 border-t border-gray-700/50 space-y-4">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  System Broadcast &amp; Version Updates
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-300 block mb-1">
                    Current App Version
                  </label>
                  <input
                    type="text"
                    value={appVersion}
                    onChange={(e) => setAppVersion(e.target.value)}
                    placeholder="v2.4.0"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-gray-300">
                      Broadcast Announcement Message
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementActive}
                        onChange={(e) => setAnnouncementActive(e.target.checked)}
                        className="rounded text-amber-500 focus:ring-amber-500 bg-gray-900 border-gray-700"
                      />
                      <span className="text-[11px] font-semibold text-gray-400">
                        Banner Active
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={announcementMessage}
                    onChange={(e) => setAnnouncementMessage(e.target.value)}
                    placeholder="e.g. All systems running smooth. Happy Vinayagar Chaturthi!"
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Developer Credits */}
            <div className="pt-2 border-t border-gray-700/50 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Developer &amp; Support Credits
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Developer Name
                  </label>
                  <input
                    type="text"
                    value={developerName}
                    onChange={(e) => setDeveloperName(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={developerMobile}
                    onChange={(e) => setDeveloperMobile(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={developerInstagram}
                    onChange={(e) => setDeveloperInstagram(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-3 border-t border-gray-700 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-[0.99] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Settings &amp; Updates</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* CUSTOM VALIDITY ADJUSTMENT MODAL                                      */}
      {/* ===================================================================== */}
      {selectedBizForModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-amber-500/40 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Edit Subscription Validity</h3>
                <p className="text-[11px] text-amber-400 font-medium">
                  {selectedBizForModal.userName} (Current: {selectedBizForModal.currentExpiry})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBizForModal(null)}
                className="text-gray-400 hover:text-white text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleModalAdjustSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-300 block mb-1 font-bold">Adjustment Action</label>
                <select
                  value={modalAdjustmentType}
                  onChange={(e) => setModalAdjustmentType(e.target.value as any)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="EXTEND">EXTEND (Add Days to Expiry)</option>
                  <option value="REDUCE">REDUCE (Subtract Days)</option>
                  <option value="PAUSE">PAUSE (Pause Membership)</option>
                  <option value="ACTIVATE">ACTIVATE (Force Active Status)</option>
                  <option value="EXPIRE">EXPIRE (Mark Immediately Expired)</option>
                </select>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">Days to Adjust</label>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModalDays(d)}
                      className={`py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        modalDays === d
                          ? "bg-amber-500 text-black shadow-xs"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">
                  Mandatory Audit Log Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Developer grant, support resolution"
                  value={modalReason}
                  onChange={(e) => setModalReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBizForModal(null)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold shadow transition cursor-pointer active:scale-95"
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
