"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  getTamilDate,
  formatTimeRangeTo12H,
  getLocalDateString,
  TamilDateInfo,
} from "@/lib/calendar/tamil";
import {
  TAMIL_NAKSHATRAS,
  getDailyYogam,
  getChandrashtamamNakshatras,
} from "@/lib/calendar/panchangamCalculations";
import {
  CalendarDays,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  CalendarCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface DailyPanchangamWidgetProps {
  initialDate?: string;
  onDateSelect?: (dateStr: string) => void;
  className?: string;
  collapsible?: boolean;
}

export function DailyPanchangamWidget({
  initialDate,
  onDateSelect,
  className = "",
  collapsible = true,
}: DailyPanchangamWidgetProps) {
  const todayStr = getLocalDateString();
  const [currentDateStr, setCurrentDateStr] = useState<string>(initialDate || todayStr);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  // Sync if initialDate prop changes
  React.useEffect(() => {
    if (initialDate && initialDate !== currentDateStr) {
      setCurrentDateStr(initialDate);
    }
  }, [initialDate]);

  const changeDate = (newDateStr: string) => {
    setCurrentDateStr(newDateStr);
    if (onDateSelect) {
      onDateSelect(newDateStr);
    }
  };

  const handlePrevDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() - 1);
    changeDate(getLocalDateString(d));
  };

  const handleNextDay = () => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    changeDate(getLocalDateString(d));
  };

  const handleToday = () => {
    changeDate(todayStr);
  };

  const info: TamilDateInfo = React.useMemo(
    () => getTamilDate(currentDateStr),
    [currentDateStr]
  );

  // Find index of current nakshatra for yogam and chandrashtamam
  const nakshatraIndex = React.useMemo(() => {
    const name = info.nakshatraNameTa || "";
    const idx = TAMIL_NAKSHATRAS.findIndex((n) => name.includes(n));
    return idx >= 0 ? idx : 3; // Default to Rohini (3) if not found
  }, [info.nakshatraNameTa]);

  const yogam = React.useMemo(
    () => getDailyYogam(info.dayOfWeek, nakshatraIndex),
    [info.dayOfWeek, nakshatraIndex]
  );

  const chandrashtamam = React.useMemo(
    () => getChandrashtamamNakshatras(nakshatraIndex),
    [nakshatraIndex]
  );

  const isToday = currentDateStr === todayStr;

  const handleShareWhatsApp = () => {
    const shareText =
      `🪔 *வேள்வி தினசரி பஞ்சாங்கம் & நல்ல நேரம்* 🪔\n\n` +
      `📅 *தேதி*: ${info.formattedTamilFull}\n` +
      `🌾 *தமிழ் மாதம்*: ${info.tamilMonth} ${info.tamilDay} (${info.dayOfWeekTa})\n\n` +
      `🌟 *திதி*: ${info.tithiNameTa || info.tithiTa}\n` +
      `⭐ *நட்சத்திரம்*: ${info.nakshatraNameTa}\n` +
      `✨ *யோகம்*: ${yogam.nameTa} (${yogam.descriptionTa})\n` +
      `⚠️ *சந்திராஷ்டமம்*: ${chandrashtamam.primaryTa}, ${chandrashtamam.secondaryTa}\n\n` +
      `🟢 *நல்ல நேரம்*:\n` +
      `• காலை: ${formatTimeRangeTo12H(info.nallaNeramMorning, true)}\n` +
      `• மாலை: ${formatTimeRangeTo12H(info.nallaNeramEvening, true)}\n\n` +
      `🌸 *கௌரி நல்ல நேரம்*:\n` +
      `• காலை: ${formatTimeRangeTo12H(info.gowriNallaNeramMorning, true)}\n` +
      `• இரவு: ${formatTimeRangeTo12H(info.gowriNallaNeramEvening, true)}\n\n` +
      `🔴 *ராகு காலம்*: ${formatTimeRangeTo12H(info.rahuKalam, true)}\n` +
      `⚠️ *எமகண்டம்*: ${formatTimeRangeTo12H(info.yamagandam, true)}\n` +
      `⌛ *குளிகை*: ${formatTimeRangeTo12H(info.kuligai, true)}\n` +
      (info.festivalName ? `\n🚩 *இன்றைய விசேஷம்*: ${info.festivalName}\n` : "") +
      `\nவாத்தியார்கள் மற்றும் பக்தர்கள் பயன்படுத்த: https://velvi.date`;

    const url = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border-2 border-amber-300/80 shadow-[0_12px_35px_rgba(217,119,6,0.1)] overflow-hidden transition-all ${className}`}
    >
      {/* Sacred Top Banner (Gold Gradient) */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-amber-950 text-white p-3.5 sm:p-4 space-y-2.5 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 opacity-10 text-7xl pointer-events-none select-none">
          🕉️
        </div>

        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/30 border border-amber-400/40 flex items-center justify-center text-base shadow-inner">
              🪔
            </span>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300 block leading-tight">
                வேள்வி பஞ்சாங்கம் • Sacred Daily Almanac
              </span>
              <h3 className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5 mt-0.5">
                <span>{info.formattedTamilFull}</span>
              </h3>
            </div>
          </div>

          {/* Quick Date Switcher */}
          <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1 border border-white/10 shrink-0">
            <button
              type="button"
              onClick={handlePrevDay}
              className="p-1 hover:bg-white/20 text-white rounded-lg transition active:scale-95 cursor-pointer"
              title="முந்தைய நாள்"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className={`px-2 py-0.5 rounded-lg text-[10.5px] font-black transition cursor-pointer active:scale-95 ${
                isToday
                  ? "bg-amber-400 text-slate-950 shadow-2xs"
                  : "text-amber-200 hover:bg-white/15"
              }`}
            >
              இன்று
            </button>
            <button
              type="button"
              onClick={handleNextDay}
              className="p-1 hover:bg-white/20 text-white rounded-lg transition active:scale-95 cursor-pointer"
              title="அடுத்த நாள்"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {collapsible && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 text-amber-300 hover:bg-white/20 rounded-lg ml-0.5 transition cursor-pointer"
                title={isExpanded ? "சுருக்குக" : "விரிவாக்குக"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Tamil Solar Month & Muhurtham Status Strip */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl px-3 py-1.5 border border-white/15 flex items-center justify-between text-xs font-bold text-amber-100 flex-wrap gap-2 relative z-10">
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-amber-300">☀️</span>
            <span>{info.tamilYear} வருடம்</span>
            <span className="text-white/40">•</span>
            <strong className="text-white font-black">
              {info.tamilMonth} {info.tamilDay} ({info.dayOfWeekTa})
            </strong>
          </div>

          <div className="flex items-center gap-1.5">
            {info.isMuhurtham && (
              <span className="text-[10px] font-extrabold bg-emerald-900/80 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1">
                <span>💍</span>
                <span>சுப முகூர்த்தம்</span>
              </span>
            )}
            {info.isPournami && (
              <span className="text-[10px] font-extrabold bg-amber-400/90 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                <span>🌕</span>
                <span>பௌர்ணமி</span>
              </span>
            )}
            {info.isAmavasai && (
              <span className="text-[10px] font-extrabold bg-slate-900 text-slate-100 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                <span>🌑</span>
                <span>அமாவாசை</span>
              </span>
            )}
            {info.isKarinaal && (
              <span className="text-[10px] font-extrabold bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded-full border border-rose-500/40 flex items-center gap-1">
                <span>⚠️</span>
                <span>கரிநாள்</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="p-3.5 sm:p-4 space-y-3.5 animate-in fade-in duration-150">
          {/* 4 Pillars Grid (Thithi, Nakshatram, Yogam, Chandrashtamam) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Thithi */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-0.5">
              <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wider block">
                திதி (Thithi)
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                {info.tithiNameTa || info.tithiTa}
              </span>
              <span className="text-[9.5px] text-slate-500 font-semibold block truncate">
                {info.pakshaTa || "பக்ஷம்"}
              </span>
            </div>

            {/* Nakshatram */}
            <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-0.5">
              <span className="text-[9.5px] font-bold text-amber-800 uppercase tracking-wider block">
                நட்சத்திரம்
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                {info.nakshatraNameTa}
              </span>
              <span className="text-[9.5px] text-slate-500 font-semibold block">
                சுப காரிய உகந்தது
              </span>
            </div>

            {/* Yogam */}
            <div
              className={`p-2.5 rounded-2xl border space-y-0.5 ${
                yogam.type === "AMRITHA"
                  ? "bg-emerald-50/80 border-emerald-200"
                  : yogam.type === "MARANA"
                  ? "bg-rose-50/80 border-rose-200"
                  : "bg-amber-50/70 border-amber-200/80"
              }`}
            >
              <span
                className={`text-[9.5px] font-bold uppercase tracking-wider block ${
                  yogam.type === "AMRITHA"
                    ? "text-emerald-800"
                    : yogam.type === "MARANA"
                    ? "text-rose-800"
                    : "text-amber-800"
                }`}
              >
                யோகம்
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block truncate">
                {yogam.nameTa}
              </span>
              <span className="text-[9.5px] text-slate-500 font-semibold block truncate">
                {yogam.descriptionTa}
              </span>
            </div>

            {/* Chandrashtamam */}
            <div className="p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-0.5">
              <span className="text-[9.5px] font-bold text-rose-800 uppercase tracking-wider block">
                சந்திராஷ்டமம்
              </span>
              <span className="text-xs sm:text-sm font-black text-rose-950 block truncate">
                {chandrashtamam.primaryTa}
              </span>
              <span className="text-[9.5px] text-rose-700 font-semibold block truncate">
                {chandrashtamam.secondaryTa}
              </span>
            </div>
          </div>

          {/* Auspicious Timings & Periods Grid */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-700" />
                <span>நேரக் கணக்குகள் (Timings)</span>
              </span>
              <span className="text-[9.5px] text-slate-400 font-normal">IST +5:30</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Nalla Neram */}
              <div className="p-2.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span>நல்ல நேரம்</span>
                  </span>
                  <span className="text-[9.5px] font-extrabold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                    சுபம்
                  </span>
                </div>
                <div className="space-y-0.5 text-xs font-bold text-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-[11px]">காலை:</span>
                    <span className="font-extrabold text-emerald-950 text-[11.5px]">
                      {formatTimeRangeTo12H(info.nallaNeramMorning, true)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-[11px]">மாலை:</span>
                    <span className="font-extrabold text-emerald-950 text-[11.5px]">
                      {formatTimeRangeTo12H(info.nallaNeramEvening, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Gowri Nalla Neram */}
              <div className="p-2.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <span>கௌரி நல்ல நேரம்</span>
                  </span>
                  <span className="text-[9.5px] font-extrabold bg-amber-200/80 text-amber-950 px-2 py-0.5 rounded-full">
                    விசேஷம்
                  </span>
                </div>
                <div className="space-y-0.5 text-xs font-bold text-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-[11px]">காலை:</span>
                    <span className="font-extrabold text-amber-950 text-[11.5px]">
                      {formatTimeRangeTo12H(info.gowriNallaNeramMorning, true)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium text-[11px]">மாலை/இரவு:</span>
                    <span className="font-extrabold text-amber-950 text-[11.5px]">
                      {formatTimeRangeTo12H(info.gowriNallaNeramEvening, true)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Raghu Kaalam & Emagandam */}
              <div className="p-2.5 bg-rose-50/60 rounded-2xl border border-rose-200/70 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-rose-800 flex items-center gap-1 text-[11px]">
                    <span>⛔</span>
                    <span>ராகு காலம்</span>
                  </span>
                  <span className="font-black text-slate-900 font-mono text-[11px]">
                    {formatTimeRangeTo12H(info.rahuKalam, true)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-rose-100">
                  <span className="font-bold text-rose-800 flex items-center gap-1 text-[11px]">
                    <span>⚠️</span>
                    <span>எமகண்டம்</span>
                  </span>
                  <span className="font-black text-slate-900 font-mono text-[11px]">
                    {formatTimeRangeTo12H(info.yamagandam, true)}
                  </span>
                </div>
              </div>

              {/* Kuligai & Sooriyodhayam */}
              <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px]">
                    <span>⌛</span>
                    <span>குளிகை காலம்</span>
                  </span>
                  <span className="font-black text-slate-900 font-mono text-[11px]">
                    {formatTimeRangeTo12H(info.kuligai, true)}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="font-bold text-slate-600 flex items-center gap-1 text-[11px]">
                    <span>🌅</span>
                    <span>சூரியோதயம்</span>
                  </span>
                  <span className="font-black text-slate-900 font-mono text-[11px]">
                    காலை 06:05 AM
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Festival / Special Day Notice Banner (if any) */}
          {info.festivalName && (
            <div className="p-2.5 bg-gradient-to-r from-amber-500/15 via-amber-400/20 to-yellow-500/15 rounded-2xl border border-amber-300 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                🚩
              </div>
              <div className="min-w-0 flex-1">
                <h5 className="font-black text-xs text-amber-950 leading-tight">
                  இன்றைய விசேஷம்: {info.festivalName}
                </h5>
                <p className="text-[10px] text-amber-900 font-medium truncate mt-0.5">
                  ஹோமங்கள், விசேஷ அர்ச்சனைகள் மற்றும் விரத வழிபாட்டிற்கு உகந்த நாள்.
                </p>
              </div>
            </div>
          )}

          {/* 1-Click Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="w-full py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp-ல் பஞ்சாங்கம் பகிர்க</span>
            </button>

            <Link
              href={`/app/bookings/new?date=${currentDateStr}`}
              className="w-full py-2.5 px-3 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 text-center"
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>இன்றைய முகூர்த்தத்தில் பதிவு</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
