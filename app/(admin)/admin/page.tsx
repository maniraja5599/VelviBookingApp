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
  Terminal,
  Cpu,
  Database,
  Server,
  Layers,
  ExternalLink,
  Lock,
  Laptop,
  PhoneCall,
  Flame,
  Workflow,
  GitBranch,
  Crown,
  UserCheck,
  UserX,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { retryCloudSync } from "@/lib/supabase/sync";
import { useAuth } from "@/components/providers/AuthContext";

export default function SuperAdminDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { currentUser } = useAuth();

  const isSuperAdmin = Boolean(
    currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com"
  );
  const isEditorAdmin = Boolean(currentUser?.role === "ADMIN" && !isSuperAdmin);

  React.useEffect(() => {
    setIsMounted(true);
    // Auto-enrich client IP and location for Super Admin and tenants
    fetch("/api/auth/client-ip")
      .then((r) => r.json())
      .then((data) => {
        if (data?.ip) {
          let updated = false;
          const superAdmin = db.users.find(
            (u) => u.email.toLowerCase() === "manirajankg@gmail.com" || u.role === "SUPER_ADMIN"
          );
          if (superAdmin) {
            superAdmin.lastLoginIp = data.ip;
            superAdmin.registrationIp = superAdmin.registrationIp || data.ip;
            if (data.city) {
              superAdmin.lastLoginCity = data.city;
              superAdmin.registrationCity = superAdmin.registrationCity || data.city;
            }
            if (data.country) {
              superAdmin.lastLoginCountry = data.country;
              superAdmin.registrationCountry = superAdmin.registrationCountry || data.country;
            }
            updated = true;
          }
          if (updated) {
            db.saveToLocalStorage();
          }
        }
      })
      .catch(() => {});
  }, []);

  // Navigation Sub-Tabs
  const [activeTab, setActiveTab] = useState<
    "overview" | "directory" | "coupons" | "subscriptions" | "branding" | "dev-info"
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
    rawExpiryDate?: string;
  } | null>(null);
  const [modalAdjustmentType, setModalAdjustmentType] = useState<
    "EXTEND" | "REDUCE" | "PAUSE" | "ACTIVATE" | "EXPIRE" | "RESTORE"
  >("EXTEND");
  const [modalDays, setModalDays] = useState<number>(30);
  const [modalReason, setModalReason] = useState<string>(
    "Developer promotional extension"
  );
  const [isConfirmingValidity, setIsConfirmingValidity] = useState<boolean>(false);

  // Live session detail modal state
  const [selectedSessionLog, setSelectedSessionLog] = useState<any | null>(null);

  // Coupon deletion confirmation modal state
  const [couponToDelete, setCouponToDelete] = useState<{ id: string; code: string } | null>(null);

  // Ledger / Subscription detail modal state
  const [selectedLedgerEntry, setSelectedLedgerEntry] = useState<{
    payment?: any;
    user?: any;
    biz?: any;
    subscription?: any;
  } | null>(null);

  // Admin Access & Role Management States (Super Admin Only)
  const [inviteAdminEmail, setInviteAdminEmail] = useState("");
  const [inviteAdminReason, setInviteAdminReason] = useState("");
  const [adminToDemote, setAdminToDemote] = useState<{ id: string; name: string } | null>(null);
  const [userToPromote, setUserToPromote] = useState<{ id: string; name: string } | null>(null);

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteAdminEmail.trim()) return;
    const res = db.promoteUserToAdmin({
      email: inviteAdminEmail.trim(),
      promotedBy: currentUser?.id || "u-super-admin-01",
      adminName: currentUser?.name || "Maniraja (Super Admin)",
      reason: inviteAdminReason.trim() || "Promoted to Editor Admin by Super Admin",
    });
    if (res.success && res.user) {
      showToast(`Editor Admin role granted to ${res.user.email}!`);
      setInviteAdminEmail("");
      setInviteAdminReason("");
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Failed to grant admin access", true);
    }
  };

  const handlePromoteUser = async (userId: string, userName: string) => {
    const res = db.promoteUserToAdmin({
      userId,
      promotedBy: currentUser?.id || "u-super-admin-01",
      adminName: currentUser?.name || "Maniraja (Super Admin)",
      reason: `Promoted ${userName} to Editor Admin`,
    });
    if (res.success) {
      showToast(`${userName} promoted to Editor Admin (Edit Only)!`);
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Promotion failed", true);
    }
    setUserToPromote(null);
  };

  const handleRemoveAdmin = async (userId: string, userName: string) => {
    const res = db.removeUserAdminAccess({
      userId,
      removedBy: currentUser?.id || "u-super-admin-01",
      adminName: currentUser?.name || "Maniraja (Super Admin)",
      reason: `Revoked admin privileges from ${userName}`,
    });
    if (res.success) {
      showToast(`Admin access revoked for ${userName}.`);
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Failed to revoke admin", true);
    }
    setAdminToDemote(null);
  };

  // Helper: Live calculation of new expiry date
  const computeNewExpiryDate = (baseDateStr: string | undefined, days: number, type: string) => {
    let base = new Date();
    if (baseDateStr) {
      const parsed = new Date(baseDateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) {
        base = parsed;
      }
    }
    const target = new Date(base);
    if (type === "EXTEND") {
      target.setDate(target.getDate() + days);
    } else if (type === "REDUCE") {
      target.setDate(target.getDate() - days);
    }
    return target.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const computeNewExpiryDateISO = (baseDateStr: string | undefined, days: number, type: string) => {
    let base = new Date();
    if (baseDateStr) {
      const parsed = new Date(baseDateStr);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) {
        base = parsed;
      }
    }
    const target = new Date(base);
    if (type === "EXTEND") {
      target.setDate(target.getDate() + days);
    } else if (type === "REDUCE") {
      target.setDate(target.getDate() - days);
    }
    return target.toISOString().slice(0, 10);
  };

  const [customTargetDate, setCustomTargetDate] = useState<string>("");

  const handleTargetDateChange = (dateVal: string) => {
    setCustomTargetDate(dateVal);
    if (!dateVal || !selectedBizForModal) return;
    let base = new Date();
    if (selectedBizForModal.rawExpiryDate) {
      const parsed = new Date(selectedBizForModal.rawExpiryDate);
      if (!isNaN(parsed.getTime()) && parsed.getTime() > base.getTime()) {
        base = parsed;
      }
    }
    const picked = new Date(dateVal);
    if (!isNaN(picked.getTime())) {
      const diffMs = picked.getTime() - base.getTime();
      const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
      setModalDays(diffDays);
      setModalAdjustmentType("EXTEND");
    }
  };

  // Live Directory Metrics with IP Addresses & Geo Locations
  const directoryMetrics: UserDirectoryMetric[] = useMemo(() => {
    return db.getAllUsersDirectoryMetrics();
  }, [actionSuccess, activeTab]);

  const filteredMetrics = useMemo(() => {
    return directoryMetrics.filter((item) => {
      const q = directorySearch.toLowerCase();
      const isDemo =
        item.isDemo ||
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

  // Quick Validity Extension (Opens Modal for Verification & Confirmation)
  const handleOpenValidityModal = (
    bizId: string,
    userName: string,
    currentExpiry: string,
    rawExpiryDate?: string,
    defaultDays = 30
  ) => {
    setSelectedBizForModal({
      bizId,
      userName,
      currentExpiry,
      rawExpiryDate,
    });
    setModalAdjustmentType("EXTEND");
    setModalDays(defaultDays);
    setCustomTargetDate(computeNewExpiryDateISO(rawExpiryDate, defaultDays, "EXTEND"));
    setModalReason(`Promotional validity extension for ${userName}`);
    setIsConfirmingValidity(false);
  };

  // Step 1: Validate & prompt confirmation
  const handleModalAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizForModal) return;
    setIsConfirmingValidity(true);
  };

  // Step 2: Confirmation execution with Cloud Sync
  const handleModalAdjustConfirm = async () => {
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
        `Validity updated (${modalAdjustmentType} +${modalDays}d) for ${selectedBizForModal.userName}!`
      );
      // Cloud sync
      try {
        await retryCloudSync(selectedBizForModal.bizId);
      } catch {}
      setSelectedBizForModal(null);
      setIsConfirmingValidity(false);
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

  const handleCreateCoupon = async (e: React.FormEvent) => {
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
      showToast(`Coupon '${res.coupon.code}' created & saved!`);
      setNewCouponCode("");
      setNewCouponDesc("");
      refreshCoupons();
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Failed to create coupon", true);
    }
  };

  const handleToggleCoupon = async (couponId: string) => {
    const success = db.toggleCouponStatus(couponId);
    if (success) {
      refreshCoupons();
      showToast("Coupon status updated!");
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    }
  };

  const requestDeleteCoupon = (couponId: string, code: string) => {
    setCouponToDelete({ id: couponId, code });
  };

  const confirmDeleteCoupon = async () => {
    if (!couponToDelete) return;
    const { id, code } = couponToDelete;
    const success = db.deleteCoupon(id);
    if (success) {
      refreshCoupons();
      showToast(`Coupon ${code} deleted.`);
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    }
    setCouponToDelete(null);
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

  const handleSavePlatformSettings = async (e: React.FormEvent) => {
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

    try {
      await retryCloudSync("biz-super-admin-01");
    } catch {}

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

  // Platform KPIs - Real vs Demo Separation
  const realDirectoryMetrics = useMemo(
    () => directoryMetrics.filter((m) => !m.isDemo),
    [directoryMetrics]
  );
  const demoDirectoryMetrics = useMemo(
    () => directoryMetrics.filter((m) => m.isDemo),
    [directoryMetrics]
  );

  const totalUsersCount = directoryMetrics.length;
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

  const demoPlatformEarnings = demoDirectoryMetrics.reduce(
    (acc, cur) => acc + cur.totalEarnings,
    0
  );
  const demoBookingsCount = demoDirectoryMetrics.reduce(
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
          { id: "dev-info", label: "App Development Specs", icon: Terminal, badge: "v2.5.3" },
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
          {/* Top KPI Cards (Responsive grid - Isolating Real Users) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Total Vadhyars</span>
                <Users className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-white">{realUsersCount}</div>
              <div className="text-[10px] sm:text-[11px] text-amber-400/90 font-medium truncate">
                Real Priests ({demoDirectoryMetrics.length} Demo)
              </div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Active Paid</span>
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-emerald-400">{realPaidCount}</div>
              <div className="text-[10px] sm:text-[11px] text-emerald-500 font-medium truncate">
                {realUsersCount > 0
                  ? `${Math.round((realPaidCount / realUsersCount) * 100)}% conversion`
                  : "0%"}
              </div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Real Bookings</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-amber-300">{realBookingsCount}</div>
              <div className="text-[10px] sm:text-[11px] text-slate-400 font-medium truncate">Real Priests data</div>
            </div>

            <div className="bg-[#0f172a]/70 p-3.5 sm:p-4 rounded-2xl border border-zinc-800 shadow-sm space-y-1">
              <div className="text-[11px] sm:text-xs font-medium text-slate-400 flex items-center justify-between">
                <span>Real Dakshina</span>
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-emerald-400">
                ₹{realPlatformEarnings.toLocaleString("en-IN")}
              </div>
              <div className="text-[10px] sm:text-[11px] text-emerald-500 font-medium truncate">Verified Real Accounts</div>
            </div>
          </div>

          {/* Demo User Data Isolation Banner */}
          <div className="p-3 sm:p-3.5 bg-[#0a0f1d] border border-zinc-800/90 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
              <span className="text-slate-300 font-medium text-xs break-words">
                <strong className="text-indigo-300">Demo Account (Ravi Iyer):</strong> {demoBookingsCount} Sample Bookings • ₹{demoPlatformEarnings.toLocaleString("en-IN")} Dakshina
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
              Isolated from Real Overview
            </span>
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
                    ₹{realPlatformEarnings.toLocaleString("en-IN")}
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
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-white">Upcoming Expiries</h3>
                    <p className="text-[10px] text-slate-400">Accounts nearing validity renewal</p>
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                    Priority Review
                  </span>
                </div>

                <div className="space-y-2 mt-2.5">
                  {upcomingExpiries.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs bg-[#090d16] rounded-xl border border-zinc-800/80">
                      No active subscriptions due for expiry.
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
                          className="p-3 bg-[#090d16] rounded-xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:border-zinc-700 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-bold text-white truncate text-xs">{metric.user.name}</h4>
                              {metric.isDemo && (
                                <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                                  Demo
                                </span>
                              )}
                            </div>
                            <p className="text-[10.5px] text-slate-400 truncate mt-0.5">
                              {metric.business?.name || "Independent"} • {sub?.planName || "Pro"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                            <span className="text-[10.5px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/25 px-2 py-1 rounded-lg">
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
                                className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer active:scale-95 whitespace-nowrap shrink-0"
                              >
                                Edit Validity
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
                className="w-full mt-3 py-2 bg-zinc-800/80 hover:bg-zinc-700 text-amber-300 text-xs font-bold rounded-xl border border-zinc-700/80 text-center transition cursor-pointer"
              >
                View Full Vadhyar Directory →
              </button>
            </div>
          </div>

          {/* Recent Logins & Geo Audit Stream (Recent 10, Scrollable, Detailed Click Modal) */}
          <div className="bg-[#0f172a]/70 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-zinc-800 space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="min-w-0">
                  <h3 className="font-bold text-xs sm:text-sm text-white truncate">Live Session Logins &amp; Locations</h3>
                  <p className="text-[10px] text-slate-400 truncate">Click any session to view complete visit source &amp; telemetry</p>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold shrink-0">
                Recent 10 Logins
              </span>
            </div>

            {/* Scrollable container for recent 10 logins */}
            <div className="max-h-80 overflow-y-auto pr-1 space-y-2">
              {((db.auditLogs || []).filter(
                (a) => a.action.includes("LOGIN") || a.targetType === "AUTH_SESSION" || a.action.includes("GOOGLE") || a.action.includes("DEMO")
              ).length > 0
                ? (db.auditLogs || []).filter(
                    (a) => a.action.includes("LOGIN") || a.targetType === "AUTH_SESSION" || a.action.includes("GOOGLE") || a.action.includes("DEMO")
                  )
                : db.auditLogs || []
              )
                .slice(0, 10)
                .map((log) => {
                  const isDemo = log.action === "DEMO_LOGIN" || log.actorName.includes("Ravi");
                  const displayIp = log.ipAddress || "Local / Direct";
                  const displayLocation = log.city
                    ? `${log.city}${log.country ? `, ${log.country}` : ""}`
                    : "Location pending";
                  const visitSource =
                    log.newValue?.source ||
                    (log.action.includes("GOOGLE")
                      ? "Google OAuth 2.0 Direct Redirect"
                      : isDemo
                      ? "Instant Demo Session Access"
                      : "Direct Web Session (PWA)");

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedSessionLog({ ...log, visitSource })}
                      className="p-3 bg-[#090d16] hover:bg-[#11192b] hover:border-amber-500/40 rounded-xl border border-zinc-800/80 space-y-1.5 text-xs cursor-pointer transition shadow-xs"
                      title="Click for full session details"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <span className="font-bold text-white truncate text-xs">{log.actorName}</span>
                        </div>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase shrink-0 ${
                            isDemo
                              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {isDemo ? "🚀 Demo Login" : log.action.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5 gap-2">
                        <span className="flex items-center gap-1 font-mono text-amber-300/90 truncate max-w-[130px]">
                          <Globe className="w-3 h-3 text-amber-400 shrink-0" />
                          {displayIp}
                        </span>
                        <span className="flex items-center gap-1 text-slate-300 truncate max-w-[140px]">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          {displayLocation}
                        </span>
                      </div>

                      <div className="text-[9.5px] text-slate-400 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-1 gap-2">
                        <span className="truncate text-amber-400/90 font-sans">
                          Source: {visitSource}
                        </span>
                        <span className="shrink-0 text-slate-500">
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

          {/* Super Admin Team & Role Access Control Section */}
          {isSuperAdmin && (
            <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-amber-500/30 p-4 sm:p-5 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                      Administrator Team &amp; Access Controls
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-black uppercase">
                        Super Admin Exclusive
                      </span>
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Super Admin has full access. Promoted team members have Edit-Only access to assist priests and manage validity.
                    </p>
                  </div>
                </div>
              </div>

              {/* Invite / Promote by Gmail Form */}
              <form onSubmit={handleInviteAdmin} className="bg-[#080c14] p-3.5 rounded-2xl border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200">Promote or Invite Team Member via Gmail</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="sm:col-span-1">
                    <input
                      type="email"
                      placeholder="team_member@gmail.com"
                      value={inviteAdminEmail}
                      onChange={(e) => setInviteAdminEmail(e.target.value)}
                      className="w-full bg-[#0c1220] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div className="sm:col-span-1">
                    <input
                      type="text"
                      placeholder="Reason / Department (e.g. Operations)"
                      value={inviteAdminReason}
                      onChange={(e) => setInviteAdminReason(e.target.value)}
                      className="w-full bg-[#0c1220] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-1 flex items-center">
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Grant Editor Admin</span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Active Admins Quick List */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Administrators ({directoryMetrics.filter(m => m.isAdmin || m.isSuperAdmin).length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {directoryMetrics
                    .filter((m) => m.isAdmin || m.isSuperAdmin)
                    .map((admin) => {
                      const isRoot = admin.isSuperAdmin;
                      return (
                        <div
                          key={admin.user.id}
                          className="flex items-center justify-between p-2.5 bg-[#080c14] border border-zinc-800 rounded-xl text-xs gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-white truncate text-xs">{admin.user.name}</span>
                              <span
                                className={`text-[9px] px-1.5 py-0.2 rounded font-black uppercase ${
                                  isRoot
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                    : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                                }`}
                              >
                                {isRoot ? "👑 Super Admin" : "✏️ Editor Admin"}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{admin.user.email}</div>
                          </div>

                          {!isRoot && (
                            <button
                              type="button"
                              onClick={() => setAdminToDemote({ id: admin.user.id, name: admin.user.name })}
                              className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-rose-300 rounded-lg text-[10px] font-bold transition cursor-pointer shrink-0"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

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
                    {/* Top: Name + Super Admin / Editor Admin / Priest Badge + Status Pill */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-sm text-white">{item.user.name}</span>
                          {item.isSuperAdmin ? (
                            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                              👑 Super Admin
                            </span>
                          ) : item.isAdmin ? (
                            <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase">
                              ✏️ Editor Admin
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-slate-400 border border-zinc-700 text-[9px] font-medium uppercase">
                              🪔 Priest
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

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isSuperAdmin && !item.isSuperAdmin && (
                          item.isAdmin ? (
                            <button
                              type="button"
                              onClick={() => setAdminToDemote({ id: item.user.id, name: item.user.name })}
                              className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-rose-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              Revoke Admin
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setUserToPromote({ id: item.user.id, name: item.user.name })}
                              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              + Make Admin
                            </button>
                          )
                        )}

                        {biz && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenValidityModal(
                                biz.id,
                                item.user.name,
                                expiryFormatted,
                                sub?.currentPeriodEnd,
                                30
                              )
                            }
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                          >
                            Edit Validity
                          </button>
                        )}
                      </div>
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
                              {item.isSuperAdmin ? (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase">
                                  👑 Super Admin
                                </span>
                              ) : item.isAdmin ? (
                                <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[9px] font-black uppercase">
                                  ✏️ Editor Admin
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-slate-400 border border-zinc-700 text-[9px] font-medium uppercase">
                                  🪔 Priest
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
                            <div className="flex items-center justify-end gap-1.5">
                              {isSuperAdmin && !item.isSuperAdmin && (
                                item.isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => setAdminToDemote({ id: item.user.id, name: item.user.name })}
                                    className="px-2 py-1 bg-rose-500/20 hover:bg-rose-500 hover:text-white border border-rose-500/40 text-rose-300 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap"
                                    title="Revoke Admin Access"
                                  >
                                    Revoke Admin
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setUserToPromote({ id: item.user.id, name: item.user.name })}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer whitespace-nowrap"
                                    title="Promote to Editor Admin"
                                  >
                                    + Make Admin
                                  </button>
                                )
                              )}

                              {biz ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenValidityModal(
                                      biz.id,
                                      item.user.name,
                                      expiryFormatted,
                                      sub?.currentPeriodEnd,
                                      30
                                    )
                                  }
                                  className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-lg text-[10.5px] font-extrabold transition cursor-pointer whitespace-nowrap"
                                >
                                  Edit Validity
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-500">No Business</span>
                              )}
                            </div>
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
          {/* Coupon Creation Card (Super Admin Exclusive) */}
          {!isSuperAdmin ? (
            <div className="bg-[#0c1220] rounded-2xl border border-cyan-500/30 p-4 sm:p-5 shadow-xl flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Editor Admin Mode (Read-Only Promo Pass Controls)</h3>
                  <p className="text-[11px] text-slate-400">
                    Promo code creation and deletion are restricted to Super Admin. You can view all live coupons and copy codes.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                ✏️ Edit Only
              </span>
            </div>
          ) : (
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
          )}

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
                        {isSuperAdmin && (
                          <button
                            type="button"
                            onClick={() => requestDeleteCoupon(c.id, c.code)}
                            className="p-1 text-slate-400 hover:text-rose-400"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
                          {isSuperAdmin ? (
                            <button
                              type="button"
                              onClick={() => requestDeleteCoupon(c.id, c.code)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition cursor-pointer"
                              title="Delete Coupon"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500">—</span>
                          )}
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
          {/* Active Subscriptions Overview */}
          <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Active Vadhyar Subscriptions</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Plan tiers, validity periods, and membership status ({db.subscriptions.length})
                </p>
              </div>
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-full text-[9px] sm:text-[10px] font-bold">
                Tier Engine
              </span>
            </div>

            {/* Mobile Cards for Subscriptions */}
            <div className="sm:hidden p-3 space-y-2.5">
              {db.subscriptions.map((sub) => {
                const biz = db.businesses.find((b) => b.id === sub.businessId) || db.businesses[0];
                const user = db.users.find((u) => u.id === biz?.ownerId);
                const payment = db.payments.find((p) => p.businessId === sub.businessId);
                const expiryFormatted = sub.currentPeriodEnd
                  ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <div
                    key={sub.id}
                    className="p-3 bg-[#080c14] rounded-xl border border-zinc-800/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{biz?.name || "Independent"}</div>
                        <div className="text-[10.5px] text-slate-400">{user?.name || "Priest"}</div>
                      </div>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                          sub.status === "ACTIVE"
                            ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                            : "bg-amber-950 text-amber-400 border-amber-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10.5px] text-slate-400 pt-1 border-t border-zinc-800/60">
                      <span>Plan: <strong className="text-amber-400">{sub.planName} ({sub.billingCycle})</strong></span>
                      <span>Valid until: <strong className="text-white">{expiryFormatted}</strong></span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setSelectedLedgerEntry({ payment, user, biz, subscription: sub })}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
                      >
                        View User Details
                      </button>
                      {biz && (
                        <button
                          type="button"
                          onClick={() =>
                            handleOpenValidityModal(
                              biz.id,
                              user?.name || biz.name,
                              expiryFormatted,
                              sub.currentPeriodEnd,
                              30
                            )
                          }
                          className="flex-1 py-1.5 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 rounded-lg text-[10px] font-bold transition text-center cursor-pointer"
                        >
                          Edit Validity
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table for Subscriptions */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
                <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-zinc-800">
                  <tr>
                    <th className="p-4">Business &amp; Priest</th>
                    <th className="p-4">Plan Name</th>
                    <th className="p-4">Cycle</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Period Start</th>
                    <th className="p-4">Period End</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {db.subscriptions.map((sub) => {
                    const biz = db.businesses.find((b) => b.id === sub.businessId) || db.businesses[0];
                    const user = db.users.find((u) => u.id === biz?.ownerId);
                    const payment = db.payments.find((p) => p.businessId === sub.businessId);
                    const expiryFormatted = sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "N/A";

                    return (
                      <tr key={sub.id} className="hover:bg-zinc-800/25 transition">
                        <td className="p-4">
                          <div className="font-bold text-white">{biz?.name || "Independent"}</div>
                          <div className="text-[10px] text-slate-400">{user?.name}</div>
                        </td>
                        <td className="p-4 text-amber-400 font-semibold">{sub.planName}</td>
                        <td className="p-4 font-bold uppercase text-[10.5px] text-slate-300">{sub.billingCycle}</td>
                        <td className="p-4">
                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                              sub.status === "ACTIVE"
                                ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                                : "bg-amber-950 text-amber-400 border border-amber-800"
                            }`}
                          >
                            {sub.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-400">
                          {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")}
                        </td>
                        <td className="p-4 font-semibold text-white">{expiryFormatted}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setSelectedLedgerEntry({ payment, user, biz, subscription: sub })}
                            className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                          >
                            Details
                          </button>
                          {biz && (
                            <button
                              type="button"
                              onClick={() =>
                                handleOpenValidityModal(
                                  biz.id,
                                  user?.name || biz.name,
                                  expiryFormatted,
                                  sub.currentPeriodEnd,
                                  30
                                )
                              }
                              className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 rounded-lg text-[10.5px] font-bold transition cursor-pointer"
                            >
                              Edit Validity
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cashfree Ledger & Transactions */}
          <div className="bg-[#0c1220] rounded-2xl sm:rounded-3xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-3.5 sm:p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-white">Cashfree Ledger &amp; Audit Log</h3>
                <p className="text-[10px] sm:text-xs text-slate-400">
                  Transactions &amp; automated validity additions ({db.payments.length}) • Click any entry for full dossier
                </p>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded-full text-[9px] sm:text-[10px] font-bold">
                Gateway Verified
              </span>
            </div>

            {/* Mobile Cards for Payments */}
            <div className="sm:hidden p-3 space-y-2.5">
              {db.payments.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
              ) : (
                db.payments.map((p) => {
                  const biz = db.businesses.find((b) => b.id === p.businessId);
                  const user = db.users.find((u) => u.id === p.userId);
                  const sub = db.subscriptions.find((s) => s.businessId === p.businessId);
                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedLedgerEntry({ payment: p, user, biz, subscription: sub })}
                      className="p-3 bg-[#080c14] hover:bg-[#11192b] border border-zinc-800/80 hover:border-amber-500/40 rounded-xl space-y-2 text-xs cursor-pointer transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-bold text-white text-xs">{biz?.name || "Independent"}</div>
                        <span className="font-mono font-black text-emerald-400 text-sm">₹{p.amount}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Order: <strong className="text-slate-300 font-mono">{p.orderId}</strong></span>
                        <span className="px-2 py-0.2 rounded-full font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px]">
                          {p.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-zinc-800/60">
                        <span>{user?.name || "Priest"} • {p.billingCycle}</span>
                        <span className="text-amber-400 font-semibold">Tap for user details →</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table for Payments */}
            <div className="hidden sm:block overflow-x-auto">
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
                      const sub = db.subscriptions.find((s) => s.businessId === p.businessId);
                      return (
                        <tr
                          key={p.id}
                          onClick={() => setSelectedLedgerEntry({ payment: p, user, biz, subscription: sub })}
                          className="hover:bg-zinc-800/40 hover:border-amber-500/30 cursor-pointer transition"
                          title="Click to view full user & payment dossier"
                        >
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
          {!isSuperAdmin && (
            <div className="bg-[#080c14] rounded-2xl border border-cyan-500/30 p-4 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-white">Super Admin Exclusive Settings</h3>
                  <p className="text-[11px] text-slate-400">
                    Editor Admins have read-only visibility for platform branding, logo presets, and system broadcast banners.
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase">
                Read Only
              </span>
            </div>
          )}
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

            {/* Save Button (Super Admin Only) */}
            {isSuperAdmin && (
              <div className="pt-3 border-t border-zinc-800 flex justify-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 font-extrabold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Settings &amp; Broadcasts</span>
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SUB-TAB 6: APP ARCHITECTURE & DEVELOPER DETAILS                     */}
      {/* ===================================================================== */}
      {activeTab === "dev-info" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Hero Developer Card */}
          <div className="bg-gradient-to-br from-[#131c31] via-[#0d1525] to-[#080d18] border-2 border-amber-500/40 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg ring-4 ring-amber-400/20 shrink-0">
                  M
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Maniraja
                    </h2>
                    <span className="text-[10px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Lead Architect &amp; Creator
                    </span>
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Root Super Admin
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 font-semibold">
                    Velvi Tech (வேள்வி டெக்னாலஜிஸ்) • Tamil Nadu, India
                  </p>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Account: <strong className="text-white font-mono">manirajankg@gmail.com</strong> • ID: <strong className="text-white font-mono">u-super-admin-01</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <a
                  href="tel:+918300030123"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Call +91 83000 30123</span>
                </a>
                <a
                  href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja,%20Velvi%20Super%20Admin%20Inquiry"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-black flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <span>WhatsApp Message</span>
                </a>
                <a
                  href="mailto:manirajankg@gmail.com"
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 border border-zinc-700 rounded-xl text-xs font-bold flex items-center gap-2 transition active:scale-95 cursor-pointer"
                >
                  <Mail className="w-4 h-4 text-amber-400" />
                  <span>Send Email</span>
                </a>
              </div>
            </div>
          </div>

          {/* Grid of Technical Specifications */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Box 1: Core Framework & Stack */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <Laptop className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-white">Full-Stack Framework</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Next.js 14.2</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Core Runtime:</span>
                  <span className="font-bold text-white">Next.js 14.2.35 (React 18.3.1)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Type System:</span>
                  <span className="font-bold text-white">TypeScript 5.9.3 (Strict Mode)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">CSS &amp; Styling:</span>
                  <span className="font-bold text-white">Tailwind CSS 3.4.19 + Sacred Tokens</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Iconography:</span>
                  <span className="font-bold text-white">Lucide React v0.453.0</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Excel / Reporting:</span>
                  <span className="font-bold text-white">SheetJS (xlsx v0.18.5)</span>
                </li>
              </ul>
            </div>

            {/* Box 2: Cloud Database & Supabase PostgreSQL */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-white">Supabase PostgreSQL</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">AWS ap-south-1</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Cloud Provider:</span>
                  <span className="font-bold text-emerald-300">Supabase Cloud (PostgreSQL 15)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Project Reference:</span>
                  <span className="font-mono text-white text-[11px]">yyvcmfjqbeixlxcjnohn</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Core Tables:</span>
                  <span className="font-bold text-white">9 Tables (users, bookings, etc.)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Client Store:</span>
                  <span className="font-bold text-white">Reactive Store (velvi_db_state_v2)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Sync Architecture:</span>
                  <span className="font-bold text-white">Hybrid Local-First + Cloud Pooler</span>
                </li>
              </ul>
            </div>

            {/* Box 3: Authentication & Security */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-blue-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-white">Auth &amp; Security</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">Google OAuth 2.0</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Auth Flow:</span>
                  <span className="font-bold text-white">Direct OAuth 2.0 Redirect</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">OAuth Client ID:</span>
                  <span className="font-mono text-slate-300 text-[10px] truncate max-w-[140px]" title="239924321651-f69j4bdmp648o08hg4n31jf46i7re4rj.apps.googleusercontent.com">239924321651...</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Role Engine:</span>
                  <span className="font-bold text-white">SUPER_ADMIN, OWNER, IYER</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Audit Logging:</span>
                  <span className="font-bold text-white">Client IP &amp; Geolocation Auditing</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Root Account:</span>
                  <span className="font-bold text-amber-300">manirajankg@gmail.com</span>
                </li>
              </ul>
            </div>

            {/* Box 4: Hosting & Infrastructure */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-purple-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Server className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-white">Deployment &amp; Hosting</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">Vercel Edge</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Production URL:</span>
                  <a href="https://velvi-booking-app.vercel.app" target="_blank" rel="noopener noreferrer" className="font-mono text-amber-300 hover:underline flex items-center gap-1 text-[11px]">
                    velvi-booking-app.vercel.app
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">GitHub Repository:</span>
                  <a href="https://github.com/maniraja5599/VelviBookingApp" target="_blank" rel="noopener noreferrer" className="font-mono text-slate-200 hover:text-white flex items-center gap-1 text-[11px]">
                    maniraja5599/VelviBookingApp
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Continuous Deploy:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Automated on git push
                  </span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Vercel CLI:</span>
                  <span className="font-bold text-white">CLI 59.23.2</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Application Version:</span>
                  <span className="font-bold text-amber-400 font-mono">v2.5.3 Enterprise Pro</span>
                </li>
              </ul>
            </div>

            {/* Box 5: Payment Gateway & Monetization */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-amber-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-sm text-white">Payment &amp; Billing</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">Cashfree SDK</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Gateway Provider:</span>
                  <span className="font-bold text-white">Cashfree Payments (v2023-08-01)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Supported Methods:</span>
                  <span className="font-bold text-white">UPI, GPay, PhonePe, Cards, NetBanking</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Pricing Plans:</span>
                  <span className="font-bold text-white">Monthly (₹499) / Annual (₹4,999)</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Developer Promo:</span>
                  <span className="font-mono text-emerald-400 font-bold">VELVIPRO100 (100% Free Pass)</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Trial Quota:</span>
                  <span className="font-bold text-white">20 Free Devotee Bookings</span>
                </li>
              </ul>
            </div>

            {/* Box 6: Vedic Ritual & Astrology Engines */}
            <div className="bg-[#0f172a]/80 p-5 rounded-3xl border border-zinc-800 space-y-3 shadow-md hover:border-rose-500/40 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                    <Flame className="w-4 h-4 text-rose-400" />
                  </div>
                  <h3 className="font-black text-sm text-white">Vedic Domain Engines</h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">8 Homams</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 font-medium pt-1">
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Panchangam Engine:</span>
                  <span className="font-bold text-white">Thithi, Nakshatram, Rahu Kalam, Yamagandam</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Homam Templates:</span>
                  <span className="font-bold text-white">Ganapathi, Navagraha, Sudarshana, etc.</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Samagri Checklists:</span>
                  <span className="font-bold text-white">30+ items per homam with Tamil names</span>
                </li>
                <li className="flex items-center justify-between border-b border-zinc-800/80 pb-1.5">
                  <span className="text-slate-400">Devotee Slips:</span>
                  <span className="font-bold text-white">1-Tap WhatsApp Receipts &amp; Dakshina Slips</span>
                </li>
                <li className="flex items-center justify-between">
                  <span className="text-slate-400">Factory Reset:</span>
                  <span className="font-bold text-emerald-400">Clean Slate Reset with Safety Confirmation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Database Tables Schema Breakdown Card */}
          <div className="bg-[#0f172a]/80 p-5 sm:p-6 rounded-3xl border border-zinc-800 space-y-4 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <h3 className="font-black text-sm sm:text-base text-white">
                  Supabase PostgreSQL 9 Core Tables Schema
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Managed AWS ap-south-1</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { name: "users", desc: "Vadhyars, priests, super admin accounts, IP address & location telemetry" },
                { name: "businesses", desc: "Vadhyar booking enterprise profiles, phone, whatsapp, logo branding" },
                { name: "subscriptions", desc: "Plan codes, trial periods, renewal cycles, validity dates" },
                { name: "poojas", desc: "8 Authentic Vedic Homams + custom user poojas + samagri item checklists" },
                { name: "bookings", desc: "Devotee appointments, date/time, muhurtham slots, priest assignments" },
                { name: "customers", desc: "Devotee directory with gothram, rasi, nakshatram & family records" },
                { name: "payments", desc: "Dakshina accounts, advance settlements, Cashfree transaction IDs" },
                { name: "members", desc: "Assistant priests & vadhyar team members with role access" },
                { name: "audit_logs", desc: "Tamper-evident Super Admin security audit trail with client IPs" },
              ].map((tbl, i) => (
                <div key={tbl.name} className="p-3 bg-[#080d18] rounded-2xl border border-zinc-800/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black text-amber-300">
                      {i + 1}. {tbl.name}
                    </span>
                    <span className="text-[9px] font-bold bg-zinc-800 text-slate-400 px-1.5 py-0.5 rounded">
                      Table
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-snug">
                    {tbl.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 1. CUSTOM VALIDITY ADJUSTMENT & CONFIRMATION MODAL                    */}
      {/* ===================================================================== */}
      {selectedBizForModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 border border-amber-500/30 shadow-2xl text-white my-auto">
            {!isConfirmingValidity ? (
              // Step 1: Configuration Form
              <>
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-white">Edit Plan Validity</h3>
                    <p className="text-[11px] text-amber-400 font-medium">
                      {selectedBizForModal.userName} • Expiry: {selectedBizForModal.currentExpiry}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedBizForModal(null)}
                    className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-300 font-bold">Quick Presets</label>
                      <span className="text-[10px] text-slate-400">Click to choose days</span>
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
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-[#080c14] border border-zinc-800 text-slate-400 hover:text-white"
                          }`}
                        >
                          +{d}d
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] text-slate-400 block mb-0.5">Days Count</label>
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
                          placeholder="e.g. 30"
                          className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10.5px] text-slate-400 block mb-0.5">Or Choose Target Date</label>
                        <input
                          type="date"
                          value={customTargetDate}
                          onChange={(e) => handleTargetDateChange(e.target.value)}
                          className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Live Calculation Preview Banner */}
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-amber-400">Calculated New Expiry</div>
                      <div className="text-white font-extrabold text-sm font-mono">
                        {computeNewExpiryDate(selectedBizForModal.rawExpiryDate, modalDays, modalAdjustmentType)}
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-amber-300 bg-amber-500/20 px-2 py-1 rounded-lg">
                      {modalAdjustmentType === "REDUCE" ? `-${modalDays}d` : `+${modalDays} Days`}
                    </span>
                  </div>

                  <div>
                    <label className="text-slate-300 block mb-1 font-bold">
                      Mandatory Audit Log Reason *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Support resolution, festival extension"
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setSelectedBizForModal(null)}
                      className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl font-bold transition cursor-pointer text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-amber-500/20 hover:bg-amber-500 hover:text-black border border-amber-500/40 text-amber-300 rounded-xl font-bold transition cursor-pointer active:scale-95 text-center"
                    >
                      Review &amp; Confirm →
                    </button>
                  </div>
                </form>
              </>
            ) : (
              // Step 2: Confirmation Screen
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base text-white">Confirm Validity Extension</h3>
                      <p className="text-[10.5px] text-slate-400">Please review changes before writing to database</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingValidity(false)}
                    className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-[#080c14] rounded-2xl p-4 border border-amber-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-slate-400 font-medium">Vadhyar / Account:</span>
                    <span className="font-bold text-white text-right">{selectedBizForModal.userName}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-slate-400 font-medium">Adjustment Action:</span>
                    <span className="font-bold text-amber-400 font-mono">{modalAdjustmentType}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-slate-400 font-medium">Days to Add:</span>
                    <span className="font-mono font-extrabold text-emerald-400 text-sm">
                      +{modalDays} Days
                    </span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-slate-400 font-medium">Previous Expiry:</span>
                    <span className="text-slate-300 font-mono">{selectedBizForModal.currentExpiry}</span>
                  </div>

                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-slate-400 font-medium">New Expiry Date:</span>
                    <span className="font-mono font-black text-amber-300 text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      {computeNewExpiryDate(selectedBizForModal.rawExpiryDate, modalDays, modalAdjustmentType)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-0.5">
                    <span className="text-slate-400 font-medium">Audit Reason:</span>
                    <span className="text-slate-200 text-right truncate max-w-[200px]">{modalReason}</span>
                  </div>
                </div>

                <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingValidity(false)}
                    className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl font-bold transition cursor-pointer text-center"
                  >
                    ← Back &amp; Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleModalAdjustConfirm}
                    className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl transition shadow-lg shadow-emerald-500/20 cursor-pointer active:scale-95 text-center"
                  >
                    Confirm &amp; Apply Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 2. COUPON DELETION CONFIRMATION MODAL                                 */}
      {/* ===================================================================== */}
      {couponToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 border border-rose-500/40 shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-white">Delete Coupon Code?</h3>
                <p className="text-[11px] text-rose-300 font-mono font-bold">{couponToDelete.code}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete coupon code{" "}
              <strong className="text-white font-mono">{couponToDelete.code}</strong>? Devotees and Vadhyars will no longer be able to redeem this discount code in checkout.
            </p>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCouponToDelete(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl font-bold transition cursor-pointer text-center text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCoupon}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-lg shadow-rose-600/30 cursor-pointer active:scale-95 text-center text-xs"
              >
                Yes, Delete Coupon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. LIVE SESSION LOGIN & TELEMETRY DETAIL MODAL                        */}
      {/* ===================================================================== */}
      {selectedSessionLog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 border border-zinc-800 shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <Globe className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Live Session Details</h3>
                  <p className="text-[10.5px] text-slate-400">Complete login telemetry &amp; visit source</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSessionLog(null)}
                className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#080c14] rounded-2xl p-4 border border-zinc-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">User / Vadhyar:</span>
                <span className="font-bold text-white text-right">{selectedSessionLog.actorName}</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">Action Type:</span>
                <span className="font-mono text-emerald-400 font-bold">{selectedSessionLog.action}</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">Visit Source:</span>
                <span className="font-bold text-amber-300 text-right">
                  {selectedSessionLog.visitSource || "Direct Web / PWA Session"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">Client IP Address:</span>
                <span className="font-mono text-white">{selectedSessionLog.ipAddress || "Direct / Localhost"}</span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">Location:</span>
                <span className="text-slate-300">
                  {selectedSessionLog.city
                    ? `${selectedSessionLog.city}${selectedSessionLog.country ? `, ${selectedSessionLog.country}` : ""}`
                    : "Location pending"}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                <span className="text-slate-400 font-medium">Device / User Agent:</span>
                <span className="text-slate-300 font-mono text-[11px] truncate max-w-[200px]" title={selectedSessionLog.userAgent}>
                  {selectedSessionLog.userAgent || "Velvi Mobile PWA / Chrome Client"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-0.5">
                <span className="text-slate-400 font-medium">Login Timestamp:</span>
                <span className="text-slate-300 font-mono">
                  {new Date(selectedSessionLog.createdAt).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedSessionLog(null)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl font-bold transition cursor-pointer text-center text-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. SUBSCRIPTION & PAYMENT DOSSIER DETAIL MODAL                        */}
      {/* ===================================================================== */}
      {selectedLedgerEntry && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-[#0f172a] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 border border-zinc-800 shadow-2xl text-white my-auto">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">Vadhyar Subscription &amp; Payment Dossier</h3>
                  <p className="text-[10.5px] text-slate-400">Complete user contact, business info &amp; gateway details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLedgerEntry(null)}
                className="text-slate-400 hover:text-white text-base p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              {/* User & Contact Information */}
              <div className="bg-[#080c14] rounded-2xl p-4 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  1. Vadhyar Profile &amp; Contact
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Priest Name:</span>
                    <strong className="text-white font-semibold">
                      {selectedLedgerEntry.user?.name || selectedLedgerEntry.biz?.name || "Independent"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Email Address:</span>
                    <strong className="text-amber-300 font-mono text-[11px] truncate block">
                      {selectedLedgerEntry.user?.email || "Not registered"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Mobile / WhatsApp:</span>
                    <strong className="text-white font-mono">
                      {selectedLedgerEntry.user?.phone || selectedLedgerEntry.biz?.phone || "Not recorded"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Business / Temple:</span>
                    <strong className="text-white font-semibold">
                      {selectedLedgerEntry.biz?.name || "Independent Priest Service"}
                    </strong>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[10.5px] block">Address / Location:</span>
                    <strong className="text-slate-200">
                      {selectedLedgerEntry.biz?.address
                        ? `${selectedLedgerEntry.biz.address}, ${selectedLedgerEntry.biz.city || ""}`
                        : "Chennai, Tamil Nadu, India"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Subscription & Validity Information */}
              <div className="bg-[#080c14] rounded-2xl p-4 border border-zinc-800 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                  2. Plan &amp; Validity Breakdown
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Plan Tier:</span>
                    <strong className="text-amber-300 font-bold">
                      {selectedLedgerEntry.subscription?.planName || "Pro Enterprise"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Billing Cycle:</span>
                    <strong className="text-white uppercase font-bold">
                      {selectedLedgerEntry.payment?.billingCycle || selectedLedgerEntry.subscription?.billingCycle || "MONTHLY"}
                    </strong>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Membership Status:</span>
                    <span className="inline-block px-2 py-0.2 rounded-full font-bold text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                      {selectedLedgerEntry.subscription?.status || "ACTIVE"}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 text-[10.5px] block">Period End (Expiry):</span>
                    <strong className="text-white font-mono">
                      {selectedLedgerEntry.subscription?.currentPeriodEnd
                        ? new Date(selectedLedgerEntry.subscription.currentPeriodEnd).toLocaleDateString("en-IN")
                        : "Ongoing"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Payment Transaction Details */}
              {selectedLedgerEntry.payment && (
                <div className="bg-[#080c14] rounded-2xl p-4 border border-zinc-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                    3. Cashfree Gateway Transaction
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10.5px] block">Amount Paid:</span>
                      <strong className="text-emerald-400 font-mono font-black text-sm">
                        ₹{selectedLedgerEntry.payment.amount}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10.5px] block">Payment Gateway:</span>
                      <strong className="text-white">
                        {selectedLedgerEntry.payment.paymentMethod || "Cashfree PG"}
                      </strong>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-400 text-[10.5px] block">Order ID:</span>
                      <strong className="text-white font-mono text-[11px] block truncate">
                        {selectedLedgerEntry.payment.orderId}
                      </strong>
                    </div>

                    <div className="col-span-2">
                      <span className="text-slate-400 text-[10.5px] block">Gateway Payment ID:</span>
                      <strong className="text-slate-300 font-mono text-[11px] block truncate">
                        {selectedLedgerEntry.payment.gatewayPaymentId || "Auto-settled via Webhook"}
                      </strong>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10.5px] block">Status:</span>
                      <span className="inline-block px-2 py-0.2 rounded-full font-bold text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {selectedLedgerEntry.payment.status}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 text-[10.5px] block">Transaction Time:</span>
                      <span className="text-slate-300 font-mono text-[11px]">
                        {new Date(selectedLedgerEntry.payment.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedLedgerEntry(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl font-bold transition cursor-pointer text-center text-xs"
              >
                Close Dossier
              </button>

              {(selectedLedgerEntry.user?.phone || selectedLedgerEntry.biz?.phone) && (
                <a
                  href={`https://wa.me/91${(selectedLedgerEntry.user?.phone || selectedLedgerEntry.biz?.phone || "").replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-1.5 text-xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>WhatsApp Contact</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
      {/* ===================================================================== */}
      {/* MODAL: REVOKE ADMIN ACCESS CONFIRMATION                                */}
      {/* ===================================================================== */}
      {adminToDemote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-rose-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Revoke Admin Privileges?</h3>
                <p className="text-[11px] text-slate-400">Demote account back to regular Priest role</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to remove Editor Admin privileges from <strong className="text-rose-400 font-bold">{adminToDemote.name}</strong>?
              They will immediately lose access to the administrative console.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setAdminToDemote(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleRemoveAdmin(adminToDemote.id, adminToDemote.name)}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Revoke Privileges
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: PROMOTE TO EDITOR ADMIN CONFIRMATION                           */}
      {/* ===================================================================== */}
      {userToPromote && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#0f172a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-white">Promote to Editor Admin?</h3>
                <p className="text-[11px] text-slate-400">Grant Edit-Only Admin Console Access</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Grant Editor Admin access to <strong className="text-amber-300 font-bold">{userToPromote.name}</strong>?
              They will be able to log in to the Admin Console using their Google/Gmail account, inspect priest directories, and assist with bookings &amp; validity adjustments.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setUserToPromote(null)}
                className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-200 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePromoteUser(userToPromote.id, userToPromote.name)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs shadow-lg shadow-amber-500/30 transition cursor-pointer"
              >
                Grant Admin Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
