"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";
import { Settings, ChevronLeft, Sparkles, Search } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = React.memo(({
  title,
  subtitle,
  backUrl,
}) => {
  const { currentUser, currentBusiness } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 max-w-md sm:max-w-xl md:max-w-2xl lg:max-w-4xl mx-auto w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 sm:px-4 py-2 transition-all">
        <div className="flex items-center justify-between gap-2">
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
                    <p className="text-[10.5px] font-semibold text-emerald-850 truncate max-w-[170px] leading-tight mt-0.5">
                      {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                    </p>
                  </div>
                )}
              </div>
            </Link>
          </div>

          {/* Right side: Global Search + Welcome Priest & Settings */}
          <div className="flex items-center gap-1.5 shrink-0">
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

            {/* Vanakkam / Profile Badge */}
            <Link
              href="/app/settings"
              className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50/80 border border-slate-200/90 text-slate-700 transition active:scale-95"
            >
              {(() => {
                const rawName =
                  (currentBusiness?.iyerName && currentBusiness.iyerName.trim()) ||
                  (currentUser?.name && currentUser.name !== "Ravi Iyer" && currentUser.name !== "New Iyer" && currentUser.name.trim()) ||
                  "";
                // Don't show hardcoded dummy name "Maniraja"
                const displayName = rawName && rawName.toLowerCase() !== "maniraja" ? rawName : "";
                const initial = displayName ? displayName[0].toUpperCase() : "V";

                return (
                  <>
                    <div className="text-right leading-tight">
                      <span className="text-[9px] font-medium text-slate-500 block">Vanakkam</span>
                      {displayName ? (
                        <span className="text-[11px] font-extrabold text-slate-900 block truncate max-w-[85px] sm:max-w-[120px]">
                          {displayName}
                        </span>
                      ) : null}
                    </div>
                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-800 text-white flex items-center justify-center font-bold text-[11px] sm:text-xs">
                      {initial}
                    </div>
                  </>
                );
              })()}
            </Link>
          </div>
        </div>
      </header>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
});

MobileHeader.displayName = "MobileHeader";


