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
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { db } from "@/lib/db/store";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = React.memo(({
  title,
  subtitle,
  backUrl,
}) => {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "synced">("idle");
  const menuRef = useRef<HTMLDivElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

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

  // Listen for notification-dismissed event (e.g. from GlobalSearchModal)
  useEffect(() => {
    const handleDismissedEvent = () => {
      setHasDismissedNotice(true);
    };
    window.addEventListener("velvi:notification-dismissed", handleDismissedEvent);
    return () => window.removeEventListener("velvi:notification-dismissed", handleDismissedEvent);
  }, []);

  const handleOpenSearch = () => {
    setIsProfileMenuOpen(false); // Guarantee Profile dropdown does NOT open
    setIsSearchOpen(true);
    setHasDismissedNotice(true); // Close the notification icon immediately
    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_seen_upcoming_notice", tomorrowStr);
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

  // Listen for real-time cloud sync / database change events to trigger animated status ticker
  useEffect(() => {
    const handleSyncTrigger = (e?: Event) => {
      const customEvent = e as CustomEvent<{ state?: "syncing" | "synced" | "idle" }>;
      const explicitState = customEvent?.detail?.state;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      if (explicitState === "synced") {
        setSyncState("synced");
        syncTimeoutRef.current = setTimeout(() => {
          setSyncState("idle");
        }, 2200);
        return;
      }

      // Default animated cycle: Syncing... -> Cloud Synced -> Return to Name
      setSyncState("syncing");
      syncTimeoutRef.current = setTimeout(() => {
        setSyncState("synced");
        syncTimeoutRef.current = setTimeout(() => {
          setSyncState("idle");
        }, 2200);
      }, 750);
    };

    window.addEventListener("velvi:db-change", handleSyncTrigger);
    window.addEventListener("velvi:sync-state", handleSyncTrigger);

    return () => {
      window.removeEventListener("velvi:db-change", handleSyncTrigger);
      window.removeEventListener("velvi:sync-state", handleSyncTrigger);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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
      <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-100 px-2.5 sm:px-4 py-2 transition-all">
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

            <Link href="/app" className="flex items-center gap-1.5 sm:gap-2 min-w-0 group">
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
                    <p className="text-[10px] font-semibold text-emerald-900 truncate max-w-[130px] sm:max-w-[170px] leading-tight mt-0.5">
                      {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right side: Global Search + Compact User Profile Dropdown Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Global Search Icon Button with 1-Day Before & Notification Pulse */}
            <button
              type="button"
              onClick={handleOpenSearch}
              className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-slate-100/90 hover:bg-slate-200/90 text-slate-700 flex items-center justify-center transition active:scale-95 group shrink-0 relative cursor-pointer"
              title={
                tomorrowBookingsCount > 0 && !hasDismissedNotice
                  ? `நாளை ${tomorrowBookingsCount} பூஜைகள் உள்ளன (1 Day Before Reminders)`
                  : "தேடுக / Search (Ctrl+K)"
              }
              aria-label="Search across app"
            >
              <Search
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 group-hover:scale-110 transition-transform ${
                  tomorrowBookingsCount > 0 && !hasDismissedNotice ? "text-amber-800" : ""
                }`}
              />
              {tomorrowBookingsCount > 0 && !hasDismissedNotice && (
                <>
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-amber-600 border border-white" />
                </>
              )}
            </button>

            {/* Profile Dropdown Container (Isolated ref so search never triggers profile) */}
            <div className="relative" ref={menuRef}>
              {/* Profile Button with User Name & Real-time Animated Cloud Sync Ticker */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-xl transition active:scale-95 border max-w-[115px] sm:max-w-[145px] shrink-0 ${
                  isProfileMenuOpen
                    ? "bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs"
                    : syncState === "syncing"
                    ? "bg-amber-50 border-amber-300 text-amber-950 shadow-2xs"
                    : syncState === "synced"
                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 shadow-2xs"
                  : "bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-800 shadow-2xs"
              }`}
              title="User Profile & Sync Status"
              aria-expanded={isProfileMenuOpen}
            >
              {/* Priest Avatar with Google Profile Picture or Sacred Icon Badge */}
              {currentUser?.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={displayName}
                  className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full object-cover shrink-0 shadow-2xs ring-1 ring-amber-400/60"
                />
              ) : (
                <div className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-amber-400/50">
                  <User className="w-3 h-3 text-amber-300 stroke-[2.5]" />
                </div>
              )}

              {/* Smooth Vertical Scroll-up Animated Ticker (Compact & No Screen Overflow) */}
              <div className="flex-1 min-w-0 h-[18px] overflow-hidden relative">
                <div
                  className="transition-transform duration-300 ease-out"
                  style={{
                    transform:
                      syncState === "syncing"
                        ? "translateY(-18px)"
                        : syncState === "synced"
                        ? "translateY(-36px)"
                        : "translateY(0px)",
                  }}
                >
                  {/* Slot 0: Priest Display Name with Live Online Pulse */}
                  <div className="h-[18px] flex items-center gap-1 min-w-0">
                    <span className="text-[10.5px] sm:text-[11px] font-bold truncate text-slate-900 text-left">
                      {displayName}
                    </span>
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"
                      title="Cloud connected"
                    />
                  </div>

                  {/* Slot 1: Syncing State (Spinning indicator) */}
                  <div className="h-[18px] flex items-center gap-1 min-w-0 text-amber-800">
                    <svg
                      className="animate-spin w-2.5 h-2.5 text-amber-700 shrink-0"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    <span className="text-[9.5px] font-extrabold truncate leading-none">
                      Syncing
                    </span>
                  </div>

                  {/* Slot 2: Cloud Synced State (Emerald Checkmark) */}
                  <div className="h-[18px] flex items-center gap-1 min-w-0 text-emerald-800">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 shrink-0 stroke-[2.5]" />
                    <span className="text-[9.5px] font-extrabold truncate leading-none">
                      Synced
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight
                className={`w-3 h-3 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isProfileMenuOpen ? "rotate-90 text-amber-800" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-amber-200/90 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-2.5">
                {/* User Info Header */}
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
                </div>

                {/* Compact Days to Expiry & Proactive Notice */}
                {daysToExpiry !== null && (
                  <div>
                    {isExpired ? (
                      <div className="p-2.5 bg-rose-50 border border-rose-300 rounded-2xl flex items-center justify-between text-xs text-rose-950 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 animate-pulse" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-[11px] block text-rose-900 leading-tight">சந்தா முடிவடைந்தது (Plan Expired)</span>
                            <span className="text-[10px] text-rose-700">புதுப்பிக்க தட்டவும்</span>
                          </div>
                        </div>
                        <Link
                          href="/app/subscription"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-[10.5px] font-black shrink-0 transition shadow-2xs"
                        >
                          Renew Now
                        </Link>
                      </div>
                    ) : isExpiringSoon ? (
                      <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-950 shadow-2xs">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-4 h-4 text-amber-700 shrink-0 animate-pulse" />
                          <div className="min-w-0">
                            <span className="font-extrabold text-[11px] block text-amber-900 leading-tight">
                              இன்னும் {daysToExpiry} நாட்களில் முடிகிறது!
                            </span>
                            <span className="text-[10px] text-amber-700">தடையின்றி தொடர புதுப்பிக்கவும்</span>
                          </div>
                        </div>
                        <Link
                          href="/app/subscription"
                          onClick={() => setIsProfileMenuOpen(false)}
                          className="px-2.5 py-1 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-[10.5px] font-black shrink-0 transition shadow-2xs"
                        >
                          Renew
                        </Link>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 bg-gradient-to-r from-amber-50/70 via-white to-emerald-50/40 border border-amber-200/80 rounded-2xl flex items-center justify-between text-xs shadow-2xs">
                        <span className="text-[10.5px] font-semibold text-slate-600 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>வேள்வி Pro செல்லுபடி:</span>
                        </span>
                        <span className="text-[10.5px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300">
                          இன்னும் {daysToExpiry} நாட்கள்
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Menu Links - Including Devotees & Important Actions */}
                <div className="space-y-1 text-xs">
                  {/* Devotees / Customers Direct Button (Requested) */}
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
                        பக்தர்கள் / Devotees
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
                      <span>புதிய பதிவு / New Booking</span>
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
                      <span>பூஜைகள் &amp; கட்டணம்</span>
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
                      <span>Edit Profile &amp; Logo</span>
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
                      <span>Settings</span>
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
                      <span>Sacred Themes</span>
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
    </>
  );
});

MobileHeader.displayName = "MobileHeader";
