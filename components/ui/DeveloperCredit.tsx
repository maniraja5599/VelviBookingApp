"use client";

import React from "react";
import { Instagram, Phone } from "lucide-react";

export const DeveloperCredit: React.FC<{ className?: string; light?: boolean }> = ({
  className = "",
  light = false,
}) => {
  return (
    <div className={`pt-2.5 pb-1.5 flex flex-col items-center gap-1 text-center ${className}`}>
      <div
        className={`inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-3.5 py-1.5 rounded-2xl text-[11px] font-medium transition shadow-2xs ${
          light
            ? "bg-white/10 text-white/90 border border-white/20"
            : "bg-gradient-to-r from-amber-50/90 via-velvi-cream to-amber-50/90 text-velvi-brownDark border border-velvi-gold/30"
        }`}
      >
        <span className={light ? "text-white/80" : "text-velvi-brown/80"}>
          App Developed by{" "}
          <strong className={light ? "text-white font-bold" : "text-velvi-brownDark font-bold"}>
            Maniraja
          </strong>
        </span>

        <span className={light ? "text-white/30" : "text-velvi-gold/50"}>•</span>

        <a
          href="tel:+918300030123"
          className={`inline-flex items-center gap-1 font-bold transition group ${
            light ? "text-emerald-300 hover:text-white" : "text-velvi-brownDark hover:text-emerald-700"
          }`}
          title="Call / WhatsApp: +91-8300030123"
        >
          <Phone className="w-3 h-3 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>+91-8300030123</span>
        </a>

        <span className={light ? "text-white/30" : "text-velvi-gold/50"}>•</span>

        <a
          href="https://instagram.com/maniraja__"
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1 font-bold transition group ${
            light ? "text-pink-300 hover:text-white" : "text-pink-700 hover:text-pink-900"
          }`}
          title="Instagram: @maniraja__"
        >
          <Instagram className="w-3 h-3 text-pink-600 group-hover:scale-110 transition-transform shrink-0" />
          <span>@maniraja__</span>
        </a>
      </div>
    </div>
  );
};
