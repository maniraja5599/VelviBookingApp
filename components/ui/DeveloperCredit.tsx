"use client";

import React from "react";
import { Instagram, Sparkles, MessageCircle, Code2, CheckCircle2 } from "lucide-react";

export const DeveloperCredit: React.FC<{ className?: string; light?: boolean }> = ({
  className = "",
  light = false,
}) => {
  return (
    <div className={`pt-4 pb-2 flex flex-col items-center gap-1.5 text-center ${className}`}>
      {/* Devotional / Professional Tagline */}
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
        <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
        <span>Dedicated ERP for Vedic Purohits & Temples • Designed with Precision</span>
        <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
      </div>

      {/* Smart Developer & Creator Badge */}
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-3.5 py-1.5 rounded-2xl text-[11px] font-medium transition shadow-2xs backdrop-blur-sm ${
          light
            ? "bg-white/10 text-white/95 border border-white/20"
            : "bg-gradient-to-r from-slate-50 via-white to-amber-50/50 text-slate-800 border border-slate-200/90 hover:border-amber-300"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <Code2 className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-slate-600 font-medium">App Developed by</span>
          <strong className="font-black text-slate-900 tracking-tight">Maniraja</strong>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-[9.5px]">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            Verified
          </span>
        </span>

        <span className={light ? "text-white/30" : "text-slate-300"}>•</span>

        {/* WhatsApp Direct Contact */}
        <a
          href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja,%20inquiring%20about%20Velvi%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 transition active:scale-95 group"
          title="WhatsApp / Call: +91-8300030123"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>+91-8300030123</span>
        </a>

        <span className={light ? "text-white/30" : "text-slate-300"}>•</span>

        {/* Instagram Profile */}
        <a
          href="https://instagram.com/maniraja__"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-pink-700 hover:text-pink-900 transition active:scale-95 group"
          title="Instagram: @maniraja__"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>@maniraja__</span>
        </a>
      </div>
    </div>
  );
};
