"use client";

import React from "react";
import { Instagram, MessageCircle, Flame, BadgeCheck, ShieldCheck, Heart } from "lucide-react";

export const DeveloperCredit: React.FC<{ className?: string; light?: boolean }> = ({
  className = "",
  light = false,
}) => {
  return (
    <div className={`pt-3 pb-2 flex flex-col items-center gap-2 text-center select-none ${className}`}>
      {/* Devotional / Professional Tagline */}
      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 tracking-wide">
        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400/40 animate-pulse" />
        <span>Vedic ERP for Purohits & Temples • Designed with Precision</span>
        <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400/40 animate-pulse" />
      </div>

      {/* Smart Developer & Creator Badge */}
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2 rounded-2xl text-[11px] font-medium transition shadow-xs backdrop-blur-md ${
          light
            ? "bg-white/10 text-white/95 border border-white/20"
            : "bg-white/90 text-slate-800 border border-amber-200/80 hover:border-amber-400 shadow-amber-950/5"
        }`}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <Flame className="w-3 h-3 text-emerald-700 fill-emerald-600/30" />
          </span>
          <span className="text-slate-500 font-semibold text-[10.5px]">App Developed by</span>
          <strong className="font-extrabold text-slate-900 tracking-tight">Maniraja</strong>
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 font-black text-[9px] shadow-2xs">
            <BadgeCheck className="w-2.5 h-2.5 text-emerald-600 fill-emerald-500/20" />
            Verified
          </span>
        </span>

        <span className={light ? "text-white/30" : "text-slate-300"}>•</span>

        {/* WhatsApp Direct Contact */}
        <a
          href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja,%20inquiring%20about%20Velvi%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-950 transition active:scale-95 group px-2 py-0.5 rounded-lg hover:bg-emerald-50"
          title="WhatsApp / Call: +91-8300030123"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>+91-8300030123</span>
        </a>

        <span className={light ? "text-white/30" : "text-slate-300"}>•</span>

        {/* Instagram Profile */}
        <a
          href="https://instagram.com/maniraja__"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-bold text-pink-700 hover:text-pink-900 transition active:scale-95 group px-2 py-0.5 rounded-lg hover:bg-pink-50"
          title="Instagram: @maniraja__"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>@maniraja__</span>
        </a>
      </div>

      {/* Trust & Security Tag */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          <span>256-Bit SSL Encrypted Cloud</span>
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <span>Made with</span>
          <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" />
          <span>in India</span>
        </span>
      </div>
    </div>
  );
};
