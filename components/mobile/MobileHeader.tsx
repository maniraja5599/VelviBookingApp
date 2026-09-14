"use client";

import React from "react";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";
import { Settings, ChevronLeft, Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = ({
  title,
  subtitle,
  backUrl,
}) => {
  const { currentBusiness } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-4 py-2.5 transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          {backUrl ? (
            <Link
              href={backUrl}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition mr-1"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : null}

          <Link href="/app" className="flex items-center gap-2.5 min-w-0 group">
            <BrandLogo
              size="sm"
              variant="icon"
              customLogoUrl={currentBusiness?.logoUrl}
              businessName={currentBusiness?.name}
              className="group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0">
              {title ? (
                <div>
                  <div className="flex items-center gap-1.5 leading-none mb-0.5">
                    <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                      VELVI
                    </span>
                    <span className="text-amber-500 text-[9px]">•</span>
                    <span className="text-[10px] font-medium text-slate-500 truncate max-w-[150px]">
                      {currentBusiness?.name || "Pooja Services"}
                    </span>
                  </div>
                  <h1 className="font-extrabold text-slate-900 leading-tight text-sm truncate max-w-[220px]">
                    {title}
                  </h1>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-serif font-black tracking-wider text-emerald-950 text-base uppercase">
                      VELVI
                    </span>
                    <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 rounded-md border border-amber-300/80 leading-none shadow-2xs flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-amber-700" />
                      App
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-emerald-800 truncate max-w-[220px] leading-tight mt-0.5">
                    {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                  </p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Shortcut */}
          <Link
            href="/app/settings"
            aria-label="Settings"
            className="w-8 h-8 rounded-xl bg-slate-100/90 hover:bg-emerald-50 hover:text-emerald-900 border border-slate-200/80 flex items-center justify-center text-slate-700 transition shadow-2xs"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};

