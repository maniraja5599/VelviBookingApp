"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings,
  ChevronLeft,
  Sparkles,
  Search,
  LogOut,
  User,
  Phone,
  Pencil,
  Palette,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  X,
  Mail,
  Users,
  Flame,
  AlertCircle,
  Clock,
  WifiOff,
  Shield,
  RefreshCw,
  Bell,
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { NotificationModal } from "@/components/mobile/NotificationModal";
import { db } from "@/lib/db/store";
import { getTamilDate } from "@/lib/calendar/tamil";
import { retryCloudSync } from "@/lib/supabase/sync";
import { Booking } from "@/lib/types";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = React.memo(({
  title,
  subtitle,
  backUrl,
}) => {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isBellChiming, setIsBellChiming] = useState(false);
  const [tomorrowBookings, setTomorrowBookings] = useState<Booking[]>([]);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced" | "error">("synced");
  const [lastSyncedTime, setLastSyncedTime] = useState<string>("Just now");
  const [manualSyncMsg, setManualSyncMsg] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);
  const [isRetryingSync, setIsRetryingSync] = useState<boolean>(false);
  const [headerTickerIndex, setHeaderTickerIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Smooth alternating ticker between Subtitle & Today's Date
  useEffect(() => {
    const timer = setInterval(() => {
      setHeaderTickerIndex((prev) => (prev === 0 ? 1 : 0));
    }, 3800);
    return () => clearInterval(timer);
  }, []);

  const todayTamilInfo = React.useMemo(() => {
    const today = new Date();
    const dStr = today.toISOString().split("T")[0];
    const tamilInfo = getTamilDate(dStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${today.getDate()} ${months[today.getMonth()]} • ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay}`;
  }, []);

  const businessId =
    currentBusiness?.id ||
    (currentUser?.id === "u-ravi-iyer-01"
      ? "biz-venkateswara-01"
      : currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com" || currentUser?.id === "u-super-admin-01"
      ? "biz-super-admin-01"
      : currentUser?.id
      ? `biz-${currentUser.id}`
      : "");

  const isSuperAdmin =
    currentUser?.role === "SUPER_ADMIN" ||
    currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com";

  // Calculate Days to Expiry for subscription plan
  const daysToExpiry = React.useMemo(() => {
    if (!subscription?.currentPeriodEnd) return null;
    const diffMs = new Date(subscription.currentPeriodEnd).getTime() - Date.now();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [subscription?.currentPeriodEnd]);

  const isExpired = subscription?.status === "EXPIRED" || (daysToExpiry !== null && daysToExpiry <= 0);
  const isExpiringSoon = !isExpired && daysToExpiry !== null && daysToExpiry <= 5;

  // Tomorrow date string (YYYY-MM-DD) for 1-day before reminders
  const tomorrowStr = React.useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${yr}-${mo}-${day}`;
  }, []);

  const [tomorrowBookingsCount, setTomorrowBookingsCount] = useState<number>(0);
  const [hasDismissedNotice, setHasDismissedNotice] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const seen = localStorage.getItem("velvi_seen_upcoming_notice");
      if (seen === tomorrowStr) {
        setHasDismissedNotice(true);
      } else {
        setHasDismissedNotice(false);
      }
    }
  }, [tomorrowStr]);

  // Listen for notification-dismissed event (e.g. from GlobalSearchModal or NotificationModal)
  useEffect(() => {
    const handleDismissedEvent = () => {
      setHasDismissedNotice(true);
      setIsBellChiming(false);
    };
    window.addEventListener("velvi:notification-dismissed", handleDismissedEvent);
    return () => window.removeEventListener("velvi:notification-dismissed", handleDismissedEvent);
  }, []);

  const hasPendingNotice =
    (tomorrowBookingsCount > 0 && !hasDismissedNotice) ||
    ((isExpiringSoon || isExpired) && !hasDismissedNotice);

  // Periodic chime: plays bell chime animation once every 60 seconds (1 minute) when notification is pending
  useEffect(() => {
    if (!hasPendingNotice) {
      setIsBellChiming(false);
      return;
    }

    // Trigger initial chime
    setIsBellChiming(true);
    const initialTimer = setTimeout(() => {
      setIsBellChiming(false);
    }, 2200);

    // Chime once every 60 seconds (1 minute) - never continuous
    const interval = setInterval(() => {
      setIsBellChiming(true);
      setTimeout(() => {
        setIsBellChiming(false);
      }, 2200);
    }, 60000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [hasPendingNotice]);

  const handleOpenNoticeOrSearch = () => {
    setIsProfileMenuOpen(false); // Guarantee Profile dropdown does NOT open
    if (hasPendingNotice) {
      setIsNotificationModalOpen(true);
      setHasDismissedNotice(true);
      setIsBellChiming(false);
      if (typeof window !== "undefined") {
        localStorage.setItem("velvi_seen_upcoming_notice", tomorrowStr);
      }
      window.dispatchEvent(new CustomEvent("velvi:notification-dismissed"));
    } else {
      setIsSearchOpen(true);
    }
  };

  useEffect(() => {
    if (!businessId) return;
    const checkUpcoming = () => {
      const all = db.getBookings(businessId);
      const tomorrowList = all.filter(
        (b) => b.date === tomorrowStr && b.status !== "CANCELLED"
      );
      setTomorrowBookingsCount(tomorrowList.length);
      setTomorrowBookings(tomorrowList);
    };
    checkUpcoming();
    window.addEventListener("velvi:db-change", checkUpcoming);
    return () => window.removeEventListener("velvi:db-change", checkUpcoming);
  }, [businessId, tomorrowStr]);

  // Global shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsProfileMenuOpen(false); // Guarantee Profile dropdown does NOT open
        setIsSearchOpen(true);
        setHasDismissedNotice(true); // Close the notification icon immediately
        if (typeof window !== "undefined") {
          localStorage.setItem("velvi_seen_upcoming_notice", tomorrowStr);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tomorrowStr]);

  // Listen for real-time cloud sync, online/offline, and database change events
  useEffect(() => {
    // Initial connectivity check
    if (typeof navigator !== "undefined") {
      const online = navigator.onLine;
      setIsOnline(online);
      if (!online) {
        setSyncState("error");
        setSyncErrorMsg("இணைய இணைப்பு இல்லை (Offline)");
      }
    }

    const handleOnline = () => {
      setIsOnline(true);
      setSyncState("syncing");
      setSyncErrorMsg(null);
      if (currentBusiness?.id) {
        retryCloudSync(currentBusiness.id);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncState("error");
      setSyncErrorMsg("இணைய இணைப்பு இல்லை (Offline)");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const handleSyncTrigger = (e?: Event) => {
      const customEvent = e as CustomEvent<{
        state?: "syncing" | "synced" | "idle" | "error";
        error?: string;
        lastSyncedAt?: string;
        bookingsCount?: number;
      }>;
      const explicitState = customEvent?.detail?.state;
      const errorDetail = customEvent?.detail?.error;
      const lastSync = customEvent?.detail?.lastSyncedAt;

      if (lastSync) {
        try {
          const d = new Date(lastSync);
          setLastSyncedTime(d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        } catch (_) {}
      }

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      if (explicitState === "error" || errorDetail) {
        setSyncState("error");
        setSyncErrorMsg(errorDetail || "மேகக்கணி ஒத்திசைவு பிழை");
        return;
      }

      if (explicitState === "syncing") {
        setSyncState("syncing");
        setSyncErrorMsg(null);
        return;
      }

      if (explicitState === "synced") {
        setSyncState("synced");
        setSyncErrorMsg(null);
        return;
      }
    };

    window.addEventListener("velvi:db-change", handleSyncTrigger);
    window.addEventListener("velvi:sync-state", handleSyncTrigger);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("velvi:db-change", handleSyncTrigger);
      window.removeEventListener("velvi:sync-state", handleSyncTrigger);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [currentBusiness?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    if (isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isProfileMenuOpen]);

  // Determine display name
  const rawName =
    (currentBusiness?.iyerName && currentBusiness.iyerName.trim()) ||
    (currentUser?.name && currentUser.name.trim()) ||
    (currentBusiness?.name && currentBusiness.name.trim()) ||
    "";
  const displayName = rawName && rawName.toLowerCase() !== "maniraja" ? rawName : "Vadhyar";
  const initial = displayName ? displayName[0].toUpperCase() : "V";

  const handleLogout = async () => {
    setIsProfileMenuOpen(false);
    await logout();
    router.push("/login");
  };

  // Check if business has an intentional custom logo (not Google profile photo)
  const isCustomBusinessLogo = Boolean(
    currentBusiness?.logoUrl &&
      currentBusiness.logoUrl !== currentUser?.avatarUrl &&
      !currentBusiness.logoUrl.includes("googleusercontent.com") &&
      !currentBusiness.logoUrl.includes("dicebear.com")
  );

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-[0_3px_14px_rgba(0,0,0,0.06)] px-2.5 sm:px-4 py-2 sm:py-2.5 transition-all">
        <div className="flex items-center justify-between gap-1.5 sm:gap-2">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
            {backUrl ? (
              <Link
                href={backUrl}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : null}

            <Link
              href="/app"
              className="flex items-center gap-1.5 sm:gap-2 min-w-0 group bg-slate-50/90 hover:bg-slate-100/90 px-2 py-1 rounded-2xl border border-slate-200/80 shadow-2xs transition-all"
            >
              <BrandLogo
                size="sm"
                variant="icon"
                customLogoUrl={isCustomBusinessLogo ? currentBusiness?.logoUrl : null}
                businessName={currentBusiness?.name}
                className="group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                {title ? (
                  <div>
                    <div className="flex items-center gap-1 leading-none mb-0.5">
                      <span className="text-[9.5px] font-bold text-emerald-900 uppercase tracking-wider">
                        VELVI
                      </span>
                      <span className="text-amber-500 text-[8px]">•</span>
                      <span className="text-[9.5px] font-medium text-slate-500 truncate max-w-[100px] sm:max-w-[130px]">
                        {currentBusiness?.name || "Pooja Services"}
                      </span>
                    </div>
                    <h1 className="font-extrabold text-slate-900 leading-tight text-xs sm:text-sm truncate max-w-[140px] sm:max-w-[180px]">
                      {title}
                    </h1>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-serif font-black tracking-wider text-emerald-950 text-sm sm:text-base uppercase">
                        VELVI
                      </span>
                      <span className="text-[8.5px] font-extrabold px-1.5 py-0.2 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 rounded-md border border-amber-300/80 leading-none">
                        App
                      </span>
                    </div>
                    {/* Smooth Vertical Scroll-up Animated Ticker (Cycles between Subtitle & Today's Date) */}
                    <div className="h-[16px] overflow-hidden relative mt-0.5 max-w-[130px] sm:max-w-[170px]">
                      <div
                        className="transition-transform duration-500 ease-out"
                        style={{
                          transform: headerTickerIndex === 1 ? "translateY(-16px)" : "translateY(0px)",
                        }}
                      >
                        {/* Slot 0: Service / Business Subtitle */}
                        <div className="h-[16px] flex items-center min-w-0">
                          <p className="text-[10px] font-semibold text-emerald-900 truncate leading-none">
                            {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                          </p>
                        </div>

                        {/* Slot 1: Today's Date + Tamil Solar Date */}
                        <div className="h-[16px] flex items-center gap-1 min-w-0 text-amber-900 leading-none">
                          <span className="text-[9.5px]">📅</span>
                          <span className="text-[9.5px] font-black tracking-tight truncate">
                            {todayTamilInfo}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right side: Global Search + Compact User Profile Dropdown Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Search / Bell Notification Morph with 1-min chime / Live Sync Spinning Animation */}
            <button
              type="button"
              onClick={handleOpenNoticeOrSearch}
              className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center transition active:scale-95 group shrink-0 relative cursor-pointer ${
                syncState === "syncing"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-300 shadow-2xs"
                  : hasPendingNotice
                  ? "bg-amber-100/90 hover:bg-amber-200/90 text-amber-900 border border-amber-300 shadow-xs"
                  : "bg-slate-100/90 hover:bg-slate-200/90 text-slate-700"
              }`}
              title={
                syncState === "syncing"
                  ? "மேகக்கணி ஒத்திசைவு நடைபெறுகிறது... (Syncing with Cloud...)"
                  : hasPendingNotice
                  ? `புதிய அறிவிப்புகள் உள்ளன (Notifications: ${tomorrowBookingsCount} பூஜைகள் நாளை)`
                  : "தேடுக / Search (Ctrl+K)"
              }
              aria-label={syncState === "syncing" ? "Syncing with cloud" : hasPendingNotice ? "Notifications" : "Search across app"}
            >
              {syncState === "syncing" ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 animate-spin" />
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                </>
              ) : hasPendingNotice ? (
                <>
                  <Bell
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-800 ${
                      isBellChiming ? "animate-velvi-bell-chime" : ""
                    }`}
                  />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-600 border border-white" />
                </>
              ) : (
                <Search
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:scale-110 transition-transform"
                />
              )}
            </button>

            {/* Profile Dropdown Container (Isolated ref so search never triggers profile) */}
            <div className="relative" ref={menuRef}>
              {/* Profile Button - Clean, Elegant (No cloud icon, no persistent dot) */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl transition active:scale-95 border shrink-0 ${
                  isProfileMenuOpen
                    ? "bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100/90 border-slate-200 text-slate-900 shadow-2xs"
                }`}
                title="Profile & Settings"
                aria-expanded={isProfileMenuOpen}
              >
                {/* Priest Avatar with Google Profile Picture or Sacred Icon Badge */}
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={displayName}
                    className="w-5 h-5 rounded-full object-cover shrink-0 shadow-2xs ring-1 ring-amber-400/60"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-amber-400/50">
                    <User className="w-3 h-3 text-amber-300 stroke-[2.5]" />
                  </div>
                )}

                {/* Display Name */}
                <span className="text-[11px] font-extrabold truncate text-slate-900 max-w-[95px] sm:max-w-[130px] text-left">
                  {displayName}
                </span>

                <ChevronRight
                  className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isProfileMenuOpen ? "rotate-90 text-amber-800" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-amber-200/90 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                  {/* 1. User Info Header - ALWAYS AT THE VERY TOP */}
                  <div className="p-3 bg-gradient-to-br from-amber-50/90 to-amber-100/40 rounded-2xl border border-amber-200/70">
                    <div className="flex items-center gap-2.5">
                      {currentUser?.avatarUrl ? (
                        <img
                          src={currentUser.avatarUrl}
                          alt={displayName}
                          className="w-11 h-11 rounded-2xl object-cover shrink-0 shadow-xs ring-2 ring-amber-300"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-2 ring-amber-300">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate max-w-[140px]">
                            {displayName}
                          </h4>
                          {currentUser?.email && (
                            <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full shrink-0">
                              Google
                            </span>
                          )}
                        </div>
                        {currentUser?.email && (
                          <p className="text-[10.5px] text-slate-500 font-medium truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                            {currentUser.email}
                          </p>
                        )}
                        {currentUser?.mobile && (
                          <p className="text-[11px] text-slate-700 font-bold flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                            {currentUser.mobile}
                          </p>
                        )}
                        <p className="text-[10px] font-medium text-emerald-900 truncate mt-0.5">
                          {currentBusiness?.serviceName || "Pooja • Homam • Seva"}
                        </p>
                      </div>
                    </div>

                    {/* Integrated Velvi Pro Active status row - No extra box, only title & date */}
                    {db.isUnlimitedBookings(businessId) ? (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-black text-[11.5px] text-slate-900 tracking-tight">
                          <span className="text-amber-600 text-xs">👑</span>
                          <span>Velvi Pro Active</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/95 px-2.5 py-0.5 rounded-full border border-emerald-300 text-emerald-950 font-black text-[10px] shadow-2xs shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>
                            {daysToExpiry !== null ? `${daysToExpiry} நாட்கள்` : "Active"}
                          </span>
                        </div>
                      </div>
                    ) : isExpired ? (
                      <div className="mt-2.5 pt-2 border-t border-rose-200 flex items-center justify-between text-xs">
                        <span className="text-[10.5px] font-bold text-rose-800">Plan Expired</span>
                        <Link
                          href="/app/subscription"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                        >
                          Renew
                        </Link>
                      </div>
                    ) : isExpiringSoon ? (
                      <div className="mt-2.5 pt-2 border-t border-amber-300 flex items-center justify-between text-xs">
                        <span className="text-[10.5px] font-bold text-amber-900">{daysToExpiry} Days Left</span>
                        <Link
                          href="/app/subscription"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                        >
                          Renew
                        </Link>
                      </div>
                    ) : (
                      <div className="mt-2.5 pt-2 border-t border-amber-200/80 flex items-center justify-between text-xs">
                        <span className="text-[10.5px] font-bold text-amber-900">
                          Demo Mode ({db.getBookings(businessId).length}/20)
                        </span>
                        <Link
                          href="/app/subscription"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                        >
                          Upgrade Pro
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* 2. Compact Cloud Sync Info - Just Time & Count under Profile Details */}
                  <div className="px-3 py-2 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 transition">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11.5px] font-extrabold text-slate-800">
                          {db.getBookings(businessId).length} Bookings Synced
                        </span>
                        {syncState === "syncing" && (
                          <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin shrink-0" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        Last Sync: {lastSyncedTime}
                      </div>
                    </div>

                    {/* Compact Sync Now button */}
                    <button
                      type="button"
                      disabled={isRetryingSync}
                      onClick={async () => {
                        setIsRetryingSync(true);
                        setSyncState("syncing");
                        setManualSyncMsg(null);
                        if (currentBusiness?.id) {
                          const res = await retryCloudSync(currentBusiness.id);
                          if (res.ok) {
                            setSyncState("synced");
                            setSyncErrorMsg(null);
                            setLastSyncedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                            setManualSyncMsg(`Synced (${res.count ?? db.getBookings(businessId).length})`);
                            setTimeout(() => setManualSyncMsg(null), 3000);
                          } else {
                            setSyncState("error");
                            setSyncErrorMsg(res.message || "Sync failed");
                          }
                        }
                        setIsRetryingSync(false);
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-xl text-[10px] font-extrabold transition active:scale-95 shadow-2xs flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                      title="Sync Now"
                    >
                      <RotateCcw className={`w-3 h-3 ${isRetryingSync ? "animate-spin text-emerald-600" : ""}`} />
                      <span>{isRetryingSync ? "Syncing..." : "Sync Now"}</span>
                    </button>
                  </div>

                  {manualSyncMsg && (
                    <div className="bg-emerald-50 px-2.5 py-1.5 rounded-xl border border-emerald-300 text-[10px] font-bold text-emerald-900 flex items-center gap-1.5 animate-in fade-in">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{manualSyncMsg}</span>
                    </div>
                  )}

                  {(!isOnline || syncState === "error") && syncErrorMsg && (
                    <div className="bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 text-[10px] font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3 text-rose-600 shrink-0" />
                      <span className="truncate">{syncErrorMsg}</span>
                    </div>
                  )}

                  {/* Quick Menu Links - Clean English Actions */}
                <div className="space-y-1 text-xs">
                  {/* Super Admin Console Shortcut */}
                  {isSuperAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsProfileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-950 transition font-bold group mb-1.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center">
                          <Shield className="w-3.5 h-3.5 text-amber-700" />
                        </div>
                        <div>
                          <span className="font-extrabold text-amber-950 text-xs block">
                            Super Admin Console
                          </span>
                          <span className="text-[10px] text-amber-800 font-medium block">
                            Platform Management &amp; Tenants
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  )}

                  {/* Devotees & Priests Shortcut */}
                  <Link
                    href="/app/customers"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                        <Users className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-emerald-950">
                        Devotees &amp; Priests
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700" />
                  </Link>

                  {/* New Booking Direct Shortcut */}
                  <Link
                    href="/app/bookings/new"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-amber-950">
                        New Booking
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  {/* Pooja Catalog Shortcut */}
                  <Link
                    href="/app/poojas"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-orange-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center">
                        <Flame className="w-3.5 h-3.5 text-orange-700" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-orange-950">
                        Poojas &amp; Rates
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  {/* Edit Profile & Logo */}
                  <Link
                    href="/app/settings/branding"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5 text-blue-700" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-blue-950">
                        Edit Profile &amp; Logo
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  {/* Settings */}
                  <Link
                    href="/app/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-slate-950">
                        Settings
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  {/* Sacred Themes */}
                  <Link
                    href="/app/settings/theme"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2 rounded-xl hover:bg-fuchsia-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-fuchsia-100 text-fuchsia-700 flex items-center justify-center">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-900 group-hover:text-fuchsia-950">
                        Sacred Themes
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>
                </div>

                {/* Logout Action */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200/80 active:scale-98 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Rich Notification Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        onOpenSearch={() => {
          setIsNotificationModalOpen(false);
          setIsSearchOpen(true);
        }}
        businessName={currentBusiness?.name}
        tomorrowBookings={tomorrowBookings}
        isPro={db.isUnlimitedBookings(businessId)}
        daysToExpiry={daysToExpiry}
        isExpiringSoon={isExpiringSoon}
        isExpired={isExpired}
        syncedCount={db.getBookings(businessId).length}
        lastSyncedTime={lastSyncedTime}
      />

      {/* Bell Chime Animation Keyframes */}
      <style jsx global>{`
        @keyframes velviBellChime {
          0%, 100% {
            transform: rotate(0deg);
          }
          15% {
            transform: rotate(15deg);
          }
          30% {
            transform: rotate(-15deg);
          }
          45% {
            transform: rotate(10deg);
          }
          60% {
            transform: rotate(-10deg);
          }
          75% {
            transform: rotate(4deg);
          }
          90% {
            transform: rotate(-4deg);
          }
        }
        .animate-velvi-bell-chime {
          animation: velviBellChime 1.8s ease-in-out;
          transform-origin: top center;
        }
      `}</style>
    </>
  );
});

MobileHeader.displayName = "MobileHeader";
