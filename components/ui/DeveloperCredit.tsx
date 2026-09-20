"use client";

import React from "react";
import { Instagram, Phone, Heart, Sparkles, MessageCircle } from "lucide-react";

export const DeveloperCredit: React.FC<{ className?: string; light?: boolean }> = ({
  className = "",
  light = false,
}) => {
  return (
    <div className={`pt-3 pb-1.5 flex flex-col items-center gap-1.5 text-center ${className}`}>
      {/* Devotional Tagline */}
      <div className="flex items-center gap-1.5 text-[10.5px] font-medium text-amber-900/70">
        <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
        <span>வேத விற்பன்னர்களுக்காக அன்புடன் வடிவமைக்கப்பட்டது</span>
        <Sparkles className="w-3 h-3 text-amber-600 animate-pulse" />
      </div>

      {/* Main Developer & Contact Badge */}
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 px-4 py-2 rounded-2xl text-[11px] font-medium transition shadow-sm ${
          light
            ? "bg-white/10 text-white/90 border border-white/20"
            : "bg-gradient-to-r from-amber-50 via-white to-amber-50 text-slate-800 border border-amber-300/80"
        }`}
      >
        <span className="flex items-center gap-1">
          <span>App Developed by</span>
          <strong className="font-extrabold text-amber-950">Maniraja</strong>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
        </span>

        <span className={light ? "text-white/30" : "text-amber-300"}>•</span>

        {/* WhatsApp / Phone */}
        <a
          href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja,%20inquiring%20about%20Velvi%20App"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-emerald-800 hover:text-emerald-950 transition group"
          title="WhatsApp / Call: +91-8300030123"
        >
          <MessageCircle className="w-3.5 h-3.5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>+91-8300030123</span>
        </a>

        <span className={light ? "text-white/30" : "text-amber-300"}>•</span>

        {/* Instagram */}
        <a
          href="https://instagram.com/maniraja__"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-bold text-pink-700 hover:text-pink-900 transition group"
          title="Instagram: @maniraja__"
        >
          <Instagram className="w-3.5 h-3.5 text-pink-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>@maniraja__</span>
        </a>
      </div>
    </div>
  );
};
