"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { useTheme } from "@/components/providers/ThemeContext";
import { Shield, Smartphone, Globe, Palette, ChevronUp, ChevronDown } from "lucide-react";
import Link from "next/link";
import { ThemePreset } from "@/lib/types";

export const DevRoleSwitcher: React.FC = () => {
  const { currentUser, switchRole, subscription } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { theme, setPreset } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-20 right-3 z-50 print:hidden">
      {isOpen ? (
        <div className="bg-velvi-brown text-white p-3 rounded-2xl shadow-2xl border border-velvi-gold max-w-xs text-xs space-y-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-1 border-b border-velvi-gold/30">
            <span className="font-bold tracking-wide flex items-center gap-1 text-velvi-goldLight">
              🪔 Dev Quick Switcher
            </span>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Role Switching */}
          <div>
            <div className="text-white/70 mb-1">Simulate Role:</div>
            <div className="grid grid-cols-3 gap-1">
              <button
                onClick={() => switchRole("OWNER")}
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition ${
                  currentUser?.role === "OWNER"
                    ? "bg-velvi-gold text-velvi-brownDark font-bold"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Owner
              </button>
              <button
                onClick={() => switchRole("IYER")}
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition ${
                  currentUser?.role === "IYER"
                    ? "bg-velvi-gold text-velvi-brownDark font-bold"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Staff/Iyer
              </button>
              <button
                onClick={() => switchRole("SUPER_ADMIN")}
                className={`px-2 py-1.5 rounded text-[11px] font-medium transition ${
                  currentUser?.role === "SUPER_ADMIN"
                    ? "bg-velvi-gold text-velvi-brownDark font-bold"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                Admin
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex gap-2">
            <Link
              href="/app"
              className="flex-1 text-center py-1.5 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center gap-1 text-[11px]"
            >
              <Smartphone className="w-3.5 h-3.5" /> Mobile App
            </Link>
            <Link
              href="/admin"
              className="flex-1 text-center py-1.5 bg-velvi-gold/20 hover:bg-velvi-gold/30 text-velvi-goldLight border border-velvi-gold/40 rounded flex items-center justify-center gap-1 text-[11px] font-semibold"
            >
              <Shield className="w-3.5 h-3.5" /> Admin Panel
            </Link>
          </div>

          {/* Language Toggle */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="flex items-center gap-1 text-white/80">
              <Globe className="w-3.5 h-3.5 text-velvi-gold" /> Lang:
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setLanguage("en")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  language === "en" ? "bg-velvi-gold text-black font-bold" : "bg-white/10"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("ta")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  language === "ta" ? "bg-velvi-gold text-black font-bold" : "bg-white/10"
                }`}
              >
                தமிழ்
              </button>
            </div>
          </div>

          {/* Theme Preset Selector */}
          <div className="flex items-center justify-between pt-1 border-t border-white/10">
            <span className="flex items-center gap-1 text-white/80">
              <Palette className="w-3.5 h-3.5 text-velvi-gold" /> Theme:
            </span>
            <select
              value={theme.preset}
              onChange={(e) => setPreset(e.target.value as ThemePreset)}
              className="bg-black/40 text-white rounded px-1.5 py-0.5 border border-white/20 text-[10px]"
            >
              <option value="traditional">Traditional</option>
              <option value="classic">Classic</option>
              <option value="royal">Royal</option>
              <option value="modern">Modern</option>
            </select>
          </div>

          {/* Subscription Status Tag */}
          <div className="text-[10px] text-white/60 text-center pt-1 border-t border-white/10">
            Plan: {subscription?.planName} • {subscription?.status}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-velvi-brown/95 hover:bg-velvi-brown text-velvi-goldLight px-3 py-2 rounded-full shadow-lg border border-velvi-gold/50 flex items-center gap-1.5 text-xs font-semibold backdrop-blur"
        >
          <span>🪔 Dev Switcher</span>
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
