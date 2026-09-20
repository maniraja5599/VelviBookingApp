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
} from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = React.memo(({
  title,
  subtitle,
  backUrl,
}) => {
  const { currentUser, currentBusiness, subscription, logout } = useAuth();
  const router = useRouter();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Global shortcut (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-4 py-2 transition-all">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Brand Logo & Title */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {backUrl ? (
              <Link
                href={backUrl}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition shrink-0"
                aria-label="Go back"
              >
                <ChevronLeft className="w-4 h-4" />
              </Link>
            ) : null}

            <Link href="/app" className="flex items-center gap-2 min-w-0 group">
              <BrandLogo
                size="sm"
                variant="icon"
                customLogoUrl={currentBusiness?.logoUrl}
                businessName={currentBusiness?.name}
                className="group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                {title ? (
                  <div>
                    <div className="flex items-center gap-1.5 leading-none mb-0.5">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                        VELVI
                      </span>
                      <span className="text-amber-500 text-[9px]">•</span>
                      <span className="text-[10px] font-medium text-slate-500 truncate max-w-[130px]">
                        {currentBusiness?.name || "Pooja Services"}
                      </span>
                    </div>
                    <h1 className="font-extrabold text-slate-900 leading-tight text-sm truncate max-w-[180px]">
                      {title}
                    </h1>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center gap-1 leading-none">
                      <span className="font-serif font-black tracking-wider text-emerald-950 text-base uppercase">
                        VELVI
                      </span>
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 rounded-md border border-amber-300/80 leading-none shadow-2xs">
                        App
                      </span>
                    </div>
                    <p className="text-[10.5px] font-semibold text-emerald-900 truncate max-w-[170px] leading-tight mt-0.5">
                      {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right side: Global Search + User Profile Dropdown Button */}
          <div className="flex items-center gap-1.5 shrink-0 relative" ref={menuRef}>
            {/* Global Search Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="w-8 h-8 rounded-xl bg-amber-50/90 hover:bg-amber-100/90 border border-amber-300/70 text-amber-900 flex items-center justify-center transition active:scale-95 shadow-2xs group"
              title="தேடுக / Search (Ctrl+K)"
              aria-label="Search across app"
            >
              <Search className="w-4 h-4 text-amber-800 group-hover:scale-110 transition-transform" />
            </button>

            {/* Profile Button with User Name & Clearly Visible Sacred Icon */}
            <button
              type="button"
              onClick={() => setIsProfileMenuOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-xl transition active:scale-95 border ${
                isProfileMenuOpen
                  ? "bg-amber-100/90 border-amber-400 text-amber-950 shadow-xs"
                  : "bg-white hover:bg-amber-50/80 border-slate-200 text-slate-800 shadow-2xs"
              }`}
              title="சுயவிவரம் & அமைப்புகள் (User Profile)"
              aria-expanded={isProfileMenuOpen}
            >
              {/* Clearly Visible Priest Avatar Icon Badge with Sacred Colors */}
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs ring-1 ring-amber-400/50">
                <User className="w-3.5 h-3.5 text-amber-300 stroke-[2.5]" />
              </div>

              <span className="text-xs font-black truncate max-w-[85px] sm:max-w-[120px] text-slate-900 text-left">
                {displayName}
              </span>

              <ChevronRight
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isProfileMenuOpen ? "rotate-90 text-amber-800" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-amber-200/90 py-2.5 px-3 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                {/* User Info Header */}
                <div className="p-3 bg-gradient-to-br from-amber-50/90 to-amber-100/40 rounded-2xl border border-amber-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs ring-2 ring-amber-300">
                      {initial}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {displayName}
                      </h4>
                      {currentUser?.mobile && (
                        <p className="text-[11px] text-slate-600 font-semibold flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          {currentUser.mobile}
                        </p>
                      )}
                      <p className="text-[10.5px] font-medium text-emerald-900 truncate mt-0.5">
                        {currentBusiness?.serviceName || "Pooja • Homam • Seva"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Menu Links */}
                <div className="space-y-1 text-xs">
                  <Link
                    href="/app/settings/branding"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
                        <Pencil className="w-3.5 h-3.5 text-amber-800" />
                      </div>
                      <span>சுயவிவரம் & லோகோ (Edit Profile)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  <Link
                    href="/app/settings"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                        <Settings className="w-3.5 h-3.5" />
                      </div>
                      <span>அமைப்புகள் (Settings)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>

                  <Link
                    href="/app/settings/theme"
                    onClick={() => setIsProfileMenuOpen(false)}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-amber-50/80 text-slate-800 transition font-medium group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                      <span>வண்ண தீம்கள் (Sacred Themes)</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700" />
                  </Link>
                </div>

                {/* Logout Action */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition border border-red-200/80 active:scale-98 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>வெளியேறு (Sign Out)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
});

MobileHeader.displayName = "MobileHeader";
