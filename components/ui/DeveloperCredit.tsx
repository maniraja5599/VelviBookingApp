"use client";

import React, { useState } from "react";
import {
  Instagram,
  MessageCircle,
  Flame,
  BadgeCheck,
  ShieldCheck,
  Heart,
  Phone,
  X,
} from "lucide-react";

export const DeveloperCredit: React.FC<{ className?: string; light?: boolean }> = ({
  className = "",
  light = false,
}) => {
  const [showContactModal, setShowContactModal] = useState(false);

  return (
    <div className={`pt-2 pb-2 flex flex-col items-center gap-2 text-center select-none ${className}`}>
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
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="font-extrabold text-slate-900 hover:text-emerald-700 tracking-tight underline decoration-amber-400 decoration-2 underline-offset-2 hover:scale-105 transition-all cursor-pointer inline-flex items-center gap-0.5 group"
            title="Click to view Maniraja's mobile number & contact"
          >
            <span>Maniraja</span>
            <Phone className="w-2.5 h-2.5 text-emerald-600 group-hover:animate-bounce shrink-0" />
          </button>
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
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
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

      {/* Developer Contact Modal Popup */}
      {showContactModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowContactModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-xs w-full space-y-4 shadow-2xl border-2 border-amber-300 text-left animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Flame className="w-5 h-5 text-amber-700 fill-amber-500/20" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                    Maniraja
                  </h4>
                  <p className="text-[10.5px] text-emerald-700 font-bold mt-0.5">
                    App Developer &amp; Creator
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowContactModal(false)}
                className="w-7 h-7 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Direct Mobile Number
              </span>
              <a
                href="tel:+918300030123"
                className="text-base font-black text-slate-900 hover:text-emerald-700 tracking-wider block"
              >
                +91 83000 30123
              </a>
              <span className="text-[10px] text-emerald-800 font-semibold block">
                Tap to call or message directly
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <a
                href="tel:+918300030123"
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Now</span>
              </a>

              <a
                href="https://wa.me/918300030123?text=Vanakkam%20Mani%20Raja,%20inquiring%20about%20Velvi%20App"
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
