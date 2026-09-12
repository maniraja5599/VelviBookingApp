"use client";

import React from "react";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";
import { Settings } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export const MobileHeader: React.FC<{ title?: string; subtitle?: string; backUrl?: string }> = ({
  title,
  subtitle,
}) => {
  const { currentBusiness } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-velvi-cream border-b border-velvi-gold/30 shadow-xs px-4 py-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
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
                  <div className="flex items-center gap-1 leading-none mb-0.5">
                    <span className="text-[10px] font-serif font-bold text-velvi-brownDark uppercase tracking-wide">
                      VELVI
                    </span>
                    <span className="text-velvi-gold text-[9px]">•</span>
                    <span className="text-[10px] font-medium text-velvi-brown/70 truncate max-w-[150px]">
                      {currentBusiness?.name || "Pooja Services"}
                    </span>
                  </div>
                  <h1 className="font-bold text-velvi-brownDark leading-tight text-sm truncate max-w-[220px]">
                    {title}
                  </h1>
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-serif font-black tracking-wider text-velvi-brownDark text-base uppercase">
                      VELVI
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 bg-velvi-gold/20 text-velvi-brownDark rounded border border-velvi-gold/40 leading-none">
                      App
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-velvi-goldDark truncate max-w-[220px] leading-tight mt-1">
                    {subtitle || currentBusiness?.name || "Pooja • Homam • Seva"}
                  </p>
                </div>
              )}
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {/* Settings Shortcut (Clean, No Profile Image, No Tamil/Eng on top) */}
          <Link
            href="/app/settings"
            aria-label="Settings"
            className="w-8 h-8 rounded-full bg-velvi-gold/15 hover:bg-velvi-gold/25 border border-velvi-gold/30 flex items-center justify-center text-velvi-brown transition shadow-sm"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
};
