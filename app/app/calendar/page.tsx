"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import { Booking } from "@/lib/types";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Flame,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  Sun,
  AlertCircle,
  CheckCircle2,
  User,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Share2,
} from "lucide-react";

export default function CalendarPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<"month" | "day" | "agenda">("month");
  const [showPanchangam, setShowPanchangam] = useState<boolean>(true);
  const [showPanchangamGuide, setShowPanchangamGuide] = useState<boolean>(false);
  const [filterIyer, setFilterIyer] = useState<"ALL" | "SELF">("ALL");

  // Month navigation
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const allBookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  // Filter bookings based on Iyer selection
  const filteredBookings = allBookings.filter((b) => {
    if (filterIyer === "SELF") {
      return (
        b.assignedIyerId === ownerMember?.id ||
        b.assignedIyerName === currentUser?.name ||
        b.assignedIyerName === "Ravi Iyer"
      );
    }
    return true;
  });

  // Date info for selected date
  const selectedTamilInfo = getTamilDate(selectedDate);
  const selectedDayBookings = filteredBookings.filter((b) => b.date === selectedDate);

  // Sacred Day Filter State
  const [sacredFilter, setSacredFilter] = useState<
    "ALL" | "MUHURTHAM" | "POURNAMI_AMAVASAI" | "BOOKED"
  >("ALL");

  // Calendar month grid generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0-6

  // Calculate monthly statistics and pre-compute day details for fast filtering
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  const currentMonthBookings = filteredBookings.filter((b) => b.date.startsWith(currentMonthKey));
  const currentMonthRevenue = currentMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const monthDayDetails = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getTamilDate>> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      map[dateStr] = getTamilDate(dateStr);
    }
    return map;
  }, [currentYear, currentMonth, daysInMonth]);

  const monthMuhurthamDaysCount = Object.values(monthDayDetails).filter((d) => d.isMuhurtham).length;

  const handleShareWhatsApp = () => {
    const dateTitle = `${selectedTamilInfo.formattedFullDay} (${selectedTamilInfo.tamilYear} வருடம்)`;
    let text = `🪔 *வேள்வி - பஞ்சாங்கம் & பூஜைகள்* 🪔\n`;
    text += `📅 *${dateTitle}*\n`;
    text += `✨ *திதி:* ${selectedTamilInfo.tithiTa}\n`;
    text += `⭐ *நட்சத்திரம்:* ${selectedTamilInfo.nakshatraNameTa}\n`;
    if (selectedTamilInfo.isMuhurtham) {
      text += `💍 *சுப முகூர்த்த நாள் (Subha Muhurtham)*\n`;
    }
    if (selectedTamilInfo.festivalName) {
      text += `🌟 *விசேஷம்:* ${selectedTamilInfo.specialDayIcon || "✨"} ${selectedTamilInfo.festivalName}\n`;
    } else if (selectedTamilInfo.specialDayTag && !selectedTamilInfo.isMuhurtham) {
      text += `🌟 *விசேஷம்:* ${selectedTamilInfo.specialDayIcon || "✨"} ${selectedTamilInfo.specialDayTag}\n`;
    }
    if (selectedTamilInfo.isKarinaal) {
      text += `⚠️ *கரிநாள் - சுபகாரியங்கள் தவிர்க்கவும்*\n`;
    }
    text += `\n🟢 *நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening)}\n`;
    text += `\n🟡 *கௌரி நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening)}\n`;
    text += `\n🔴 *ராகு காலம்:* ${formatTimeRangeTo12H(selectedTamilInfo.rahuKalam)}\n`;
    text += `🟠 *எமகண்டம்:* ${formatTimeRangeTo12H(selectedTamilInfo.yamagandam)}\n`;

    if (selectedDayBookings.length > 0) {
      text += `\n📋 *இன்றைய பூஜைகள் (${selectedDayBookings.length}):*\n`;
      selectedDayBookings.forEach((b, idx) => {
        text += `${idx + 1}. ${b.poojaEnglishName} (${b.startTime}) - ${b.customerName}\n`;
      });
    } else {
      text += `\n📋 *பூஜைகள்:* முன்பதிவு ஏதுமில்லை (Open for Bookings)\n`;
    }

    text += `\n_Shared via Velvi Priest App_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateString());
  };

  const stepDay = (delta: number) => {
    const parts = selectedDate.split("-").map((p) => parseInt(p, 10));
    const d = new Date(parts[0], parts[1] - 1, parts[2] + delta, 12, 0, 0);
    const newStr = getLocalDateString(d);
    setSelectedDate(newStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthNamesUpper = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const monthNamesTransTa = [
    "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
    "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
  ];

  const TAMIL_MONTH_EN_MAP: Record<string, string> = {
    "சித்திரை": "CHITHIRAI",
    "வைகாசி": "VAIKASI",
    "ஆனி": "AANI",
    "ஆடி": "AADI",
    "ஆவணி": "AAVANI",
    "புரட்டாசி": "PURATTASI",
    "ஐப்பசி": "AIPPASI",
    "கார்த்திகை": "KARTHIGAI",
    "மார்கழி": "MARGAZHI",
    "தை": "THAI",
    "மாசி": "MAASI",
    "பங்குனி": "PANGUNI",
  };

  const WEEKDAY_SULAM_PARIHARAM = [
    { sulam: "மேற்கு", pariharam: "வெல்லம்" },
    { sulam: "கிழக்கு", pariharam: "பால்" },
    { sulam: "வடக்கு", pariharam: "சுண்ணாம்பு" },
    { sulam: "வடக்கு", pariharam: "பால்" },
    { sulam: "தெற்கு", pariharam: "தயிர்" },
    { sulam: "மேற்கு", pariharam: "வெல்லம்" },
    { sulam: "கிழக்கு", pariharam: "எள்" },
  ];

  const monthStartTamil =
    monthDayDetails[`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`] ||
    getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`);
  const monthEndTamil =
    monthDayDetails[`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`] ||
    getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`);
  const dualTamilMonthTa =
    monthStartTamil.tamilMonth === monthEndTamil.tamilMonth
      ? monthStartTamil.tamilMonth
      : `${monthStartTamil.tamilMonth} – ${monthEndTamil.tamilMonth}`;
  const dualTamilMonthEn =
    monthStartTamil.tamilMonth === monthEndTamil.tamilMonth
      ? TAMIL_MONTH_EN_MAP[monthStartTamil.tamilMonth] || monthStartTamil.tamilMonth
      : `${TAMIL_MONTH_EN_MAP[monthStartTamil.tamilMonth] || monthStartTamil.tamilMonth} – ${TAMIL_MONTH_EN_MAP[monthEndTamil.tamilMonth] || monthEndTamil.tamilMonth}`;

  // Leading days from previous month to fill the first week row
  const prevMonthObj =
    currentMonth === 0 ? { year: currentYear - 1, month: 11 } : { year: currentYear, month: currentMonth - 1 };
  const prevMonthTotalDays = new Date(prevMonthObj.year, prevMonthObj.month + 1, 0).getDate();
  const prevMonthLeadingDays = Array.from({ length: firstDayIndex }).map((_, i) => {
    const dayNum = prevMonthTotalDays - firstDayIndex + 1 + i;
    const dateStr = `${prevMonthObj.year}-${String(prevMonthObj.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return {
      dateStr,
      dayNum,
      info: getTamilDate(dateStr),
    };
  });

  // Trailing days from next month to complete the grid (standard 35 or 42 cells)
  const totalGridCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const nextMonthTrailingCount = totalGridCells - (firstDayIndex + daysInMonth);
  const nextMonthObj =
    currentMonth === 11 ? { year: currentYear + 1, month: 0 } : { year: currentYear, month: currentMonth + 1 };
  const nextMonthTrailingDays = Array.from({ length: nextMonthTrailingCount }).map((_, i) => {
    const dayNum = i + 1;
    const dateStr = `${nextMonthObj.year}-${String(nextMonthObj.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return {
      dateStr,
      dayNum,
      info: getTamilDate(dateStr),
    };
  });

  // List of important festivals in this month for Card 2
  const monthFestivals = React.useMemo(() => {
    const list: { dayNum: number; name: string; icon?: string }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayTamil = monthDayDetails[dateStr];
      if (!dayTamil) continue;
      if (dayTamil.festivalName) {
        list.push({ dayNum: day, name: dayTamil.festivalName, icon: dayTamil.specialDayIcon });
      } else if (dayTamil.specialDayTag && !dayTamil.isMuhurtham) {
        list.push({ dayNum: day, name: dayTamil.specialDayTag, icon: dayTamil.specialDayIcon });
      }
    }
    return list;
  }, [currentYear, currentMonth, daysInMonth, monthDayDetails]);

  // List of sacred moon phases & observances in this month for Card 3
  const monthSacredPhases = React.useMemo(() => {
    const pournamiDays: number[] = [];
    const amavasaiDays: number[] = [];
    const chaturthiDays: number[] = [];
    const karthigaiDays: number[] = [];
    const ekadashiDays: number[] = [];
    const sashtiDays: number[] = [];
    const muhurthamDays: number[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = monthDayDetails[dateStr];
      if (!d) continue;
      if (d.isPournami) pournamiDays.push(day);
      if (d.isAmavasai) amavasaiDays.push(day);
      if (d.isSankataharaChaturthi) chaturthiDays.push(day);
      if (d.isKarthigai) karthigaiDays.push(day);
      if (d.isEkadashi) ekadashiDays.push(day);
      if (d.isSashti) sashtiDays.push(day);
      if (d.isMuhurtham) muhurthamDays.push(day);
    }
    return {
      pournamiDays,
      amavasaiDays,
      chaturthiDays,
      karthigaiDays,
      ekadashiDays,
      sashtiDays,
      muhurthamDays,
    };
  }, [currentYear, currentMonth, daysInMonth, monthDayDetails]);

  // Standard Day View Time Slots
  const DAY_SLOTS = [
    { label: "06:00 AM", sub: "Brahma Muhurtham" },
    { label: "07:30 AM", sub: "Morning Pooja" },
    { label: "09:00 AM", sub: "Morning Homam" },
    { label: "10:30 AM", sub: "Auspicious Muhurtham" },
    { label: "12:00 PM", sub: "Madhyahnikam" },
    { label: "02:30 PM", sub: "Afternoon" },
    { label: "04:30 PM", sub: "Sayaratchai Pooja" },
    { label: "06:00 PM", sub: "Sandhya Kaalam" },
    { label: "07:30 PM", sub: "Night Seva" },
  ];

  const isSlotInNallaNeram = (slotLabel: string) => {
    const [slotTime, slotPeriod] = slotLabel.split(" ");
    let [sH] = slotTime.split(":").map(Number);
    if (slotPeriod === "PM" && sH < 12) sH += 12;
    if (slotPeriod === "AM" && sH === 12) sH = 0;

    // Morning check against Nalla Neram
    const mRange = selectedTamilInfo.nallaNeramMorning;
    if (mRange) {
      const [mStart] = mRange.split("-").map((s) => s.trim());
      const [mH] = mStart.split(":").map(Number);
      if (Math.abs(sH - mH) <= 1) return true;
    }

    // Evening check against Nalla Neram
    const eRange = selectedTamilInfo.nallaNeramEvening;
    if (eRange) {
      const [eStart] = eRange.split("-").map((s) => s.trim());
      const [eH] = eStart.split(":").map(Number);
      if (Math.abs(sH - eH) <= 1) return true;
    }

    return false;
  };

  // Agenda view grouped by date
  const sortedAgendaDates = Array.from(
    new Set(filteredBookings.map((b) => b.date))
  ).sort();

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* 1. Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-velvi-brownDark">
              {monthNamesEn[currentMonth]} {currentYear}
            </h2>
            <button
              onClick={jumpToToday}
              className="text-[10px] font-bold px-2 py-0.5 bg-velvi-gold/20 hover:bg-velvi-gold/30 text-velvi-brownDark rounded-full border border-velvi-gold/40 transition active:scale-95"
            >
              Today
            </button>
          </div>
          <p className="text-xs text-velvi-goldDark font-semibold">
            {selectedTamilInfo.tamilMonth} • {selectedTamilInfo.tamilYear} வருடம்
          </p>
        </div>

        {/* View Switcher Tabs (Month, Day, Agenda) */}
        <div className="flex bg-velvi-creamDark/60 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === "month"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === "day"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`px-3 py-1.5 rounded-lg transition ${
              viewMode === "agenda"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* Filter by Self / All Team */}
      <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-xl border border-velvi-gold/20 text-xs">
        <div className="flex items-center gap-1.5 text-velvi-brown font-medium">
          <Filter className="w-3.5 h-3.5 text-velvi-gold" />
          <span>Filter:</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterIyer("ALL")}
            className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
              filterIyer === "ALL"
                ? "bg-velvi-brown text-white shadow-xs"
                : "text-velvi-brown/60 hover:text-velvi-brown"
            }`}
          >
            All Bookings ({allBookings.length})
          </button>
          <button
            onClick={() => setFilterIyer("SELF")}
            className={`px-2 py-0.5 rounded-lg font-bold transition text-[11px] ${
              filterIyer === "SELF"
                ? "bg-velvi-brown text-white shadow-xs"
                : "text-velvi-brown/60 hover:text-velvi-brown"
            }`}
          >
            🪔 Self Only
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MONTH VIEW */}
      {/* ========================================================= */}
      {viewMode === "month" && (
        <div className="space-y-3.5">
          {/* Month Summary Overview Strip */}
          <div className="grid grid-cols-3 gap-2 bg-gradient-to-r from-velvi-cream to-velvi-creamLight p-2.5 rounded-2xl border border-velvi-gold/30 text-xs shadow-2xs">
            <div className="text-center p-2 bg-white/85 rounded-xl border border-velvi-gold/20">
              <span className="text-[10px] text-velvi-brown/70 block font-medium">Month Sevas</span>
              <span className="font-extrabold text-velvi-brownDark text-xs sm:text-sm">
                {currentMonthBookings.length} Booked
              </span>
            </div>
            <div className="text-center p-2 bg-white/85 rounded-xl border border-velvi-gold/20">
              <span className="text-[10px] text-velvi-brown/70 block font-medium">Booked Revenue</span>
              <span className="font-extrabold text-emerald-800 text-xs sm:text-sm">
                ₹{currentMonthRevenue.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="text-center p-2 bg-white/85 rounded-xl border border-velvi-gold/20">
              <span className="text-[10px] text-velvi-brown/70 block font-medium">சுப முகூர்த்தம்</span>
              <span className="font-extrabold text-amber-700 text-xs sm:text-sm flex items-center justify-center gap-1">
                <span>💍</span>
                <span>{monthMuhurthamDaysCount} Days</span>
              </span>
            </div>
          </div>

          {/* Sacred Day Filter Chips Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
            <button
              onClick={() => setSacredFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-[11px] ${
                sacredFilter === "ALL"
                  ? "bg-velvi-brown text-white shadow-xs"
                  : "bg-white text-velvi-brown/70 border border-velvi-gold/20 hover:bg-velvi-cream"
              }`}
            >
              All Days ({daysInMonth})
            </button>
            <button
              onClick={() => setSacredFilter("MUHURTHAM")}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-[11px] flex items-center gap-1 ${
                sacredFilter === "MUHURTHAM"
                  ? "bg-amber-700 text-white shadow-xs"
                  : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
              }`}
            >
              <span>💍</span>
              <span>சுப முகூர்த்தம் ({monthMuhurthamDaysCount})</span>
            </button>
            <button
              onClick={() => setSacredFilter("POURNAMI_AMAVASAI")}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-[11px] flex items-center gap-1 ${
                sacredFilter === "POURNAMI_AMAVASAI"
                  ? "bg-indigo-800 text-white shadow-xs"
                  : "bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100"
              }`}
            >
              <span>🌕</span>
              <span>பௌர்ணமி / அமாவாசை</span>
            </button>
            <button
              onClick={() => setSacredFilter("BOOKED")}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-[11px] flex items-center gap-1 ${
                sacredFilter === "BOOKED"
                  ? "bg-emerald-800 text-white shadow-xs"
                  : "bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              <span>🪔</span>
              <span>Booked ({currentMonthBookings.length})</span>
            </button>
          </div>

          {/* Authentic Tamil Calendar Sheet Card */}
          <div className="rounded-3xl overflow-hidden border border-emerald-950/20 shadow-md bg-white">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0b2b17] via-[#123e24] to-[#0b2b17] text-white px-3 py-2.5 sm:p-4 flex items-center justify-between gap-2">
              {/* Left: Nav Buttons & English Month Year */}
              <div className="flex items-center gap-1.5 sm:gap-2.5">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <div className="flex items-baseline gap-1 sm:gap-2">
                  <span className="text-base sm:text-2xl md:text-3xl font-black tracking-wide text-white uppercase">
                    {monthNamesUpper[currentMonth]}
                  </span>
                  <span className="text-base sm:text-2xl md:text-3xl font-black text-amber-400">
                    {currentYear}
                  </span>
                </div>

                <button
                  onClick={nextMonth}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                <button
                  onClick={jumpToToday}
                  className="hidden sm:inline-block ml-1 text-[10px] font-bold px-2 py-0.5 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-full border border-amber-400/40 transition active:scale-95"
                >
                  Today
                </button>
              </div>

              {/* Right: Dual Tamil Month Range & Brand Seal */}
              <div className="flex items-center gap-2 sm:gap-3 text-right">
                <div>
                  <div className="text-xs sm:text-base md:text-lg font-black tracking-wide text-white">
                    {dualTamilMonthTa}
                  </div>
                  <div className="text-[8px] sm:text-[10px] md:text-xs font-bold tracking-widest text-emerald-200/90 uppercase">
                    {dualTamilMonthEn}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 pl-3 border-l border-emerald-600/50 text-[9px] leading-tight font-semibold text-emerald-200">
                  <span className="text-xl">🌿</span>
                  <div>
                    <span className="block">TRADITION</span>
                    <span className="block text-emerald-300">CULTURE</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekday Header Bar (Sunday in Crimson Red, Mon-Sat in Forest Green) */}
            <div className="grid grid-cols-7 text-center select-none">
              {/* Sunday (Red) */}
              <div className="bg-[#b91c1c] text-white py-1 sm:py-1.5 px-0.5 border-r border-red-800/40">
                <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider">SUN</div>
                <div className="text-[8px] sm:text-[10px] font-bold text-red-100">ஞாயிறு</div>
              </div>

              {/* Mon to Sat (Forest Green) */}
              {[
                { en: "MON", ta: "திங்கள்" },
                { en: "TUE", ta: "செவ்வாய்" },
                { en: "WED", ta: "புதன்" },
                { en: "THU", ta: "வியாழன்" },
                { en: "FRI", ta: "வெள்ளி" },
                { en: "SAT", ta: "சனி" },
              ].map((item) => (
                <div
                  key={item.en}
                  className="bg-[#123e24] text-white py-1 sm:py-1.5 px-0.5 border-r border-emerald-800/40 last:border-r-0"
                >
                  <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider">{item.en}</div>
                  <div className="text-[8px] sm:text-[10px] font-semibold text-emerald-200">{item.ta}</div>
                </div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-white">
              {/* 1. Leading Prev-Month Days (shown in muted gray like reference) */}
              {prevMonthLeadingDays.map((prevDay) => (
                <button
                  key={prevDay.dateStr}
                  onClick={() => {
                    setSelectedDate(prevDay.dateStr);
                    prevMonth();
                  }}
                  className="min-h-[56px] sm:min-h-[72px] md:min-h-[82px] p-0.5 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-300">
                    {prevDay.dayNum}
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-medium text-gray-300 leading-tight">
                    {prevDay.info.tamilDay}
                  </span>
                  <div className="h-2" />
                </button>
              ))}

              {/* 2. Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayTamil = monthDayDetails[dateStr] || getTamilDate(dateStr);
                const dayBookings = filteredBookings.filter((b) => b.date === dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;
                const dayOfWeekIndex = new Date(currentYear, currentMonth, dayNum).getDay();
                const isSunday = dayOfWeekIndex === 0;

                const hasSpecialHoliday =
                  !!dayTamil.festivalName ||
                  !!dayTamil.isMuhurtham ||
                  !!dayTamil.isAmavasai ||
                  !!dayTamil.isPournami;
                const isRedDay = isSunday || hasSpecialHoliday;

                const matchesFilter = (() => {
                  if (sacredFilter === "ALL") return true;
                  if (sacredFilter === "MUHURTHAM") return !!dayTamil.isMuhurtham;
                  if (sacredFilter === "POURNAMI_AMAVASAI") return !!dayTamil.isPournami || !!dayTamil.isAmavasai;
                  if (sacredFilter === "BOOKED") return dayBookings.length > 0;
                  return true;
                })();

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[56px] sm:min-h-[72px] md:min-h-[82px] p-0.5 sm:p-1.5 border-r border-b border-gray-200 flex flex-col items-center justify-between text-center transition relative group ${
                      isSelected
                        ? "bg-amber-50/80 ring-2 ring-amber-500 ring-inset z-10 font-bold"
                        : isToday
                        ? "bg-emerald-50/50 hover:bg-emerald-50"
                        : "bg-white hover:bg-gray-50/80"
                    } ${!matchesFilter ? "opacity-35 hover:opacity-90" : ""}`}
                  >
                    {/* Top Date Number + Special Icon */}
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1 leading-tight w-full">
                      <span
                        className={`text-sm sm:text-lg md:text-xl font-black ${
                          isRedDay ? "text-[#b91c1c]" : "text-slate-900"
                        }`}
                      >
                        {dayNum}
                      </span>
                      {dayTamil.specialDayIcon && (
                        <span className="text-[9px] sm:text-xs md:text-sm shrink-0">
                          {dayTamil.specialDayIcon}
                        </span>
                      )}
                    </div>

                    {/* Tamil Day Number */}
                    <div className="text-[8.5px] sm:text-[10px] md:text-xs font-semibold text-slate-600 leading-tight">
                      {dayTamil.tamilDay}
                    </div>

                    {/* Festival / Special Name Label (in red bold) */}
                    <div className="w-full px-0.5">
                      {dayTamil.festivalName ? (
                        <div className="text-[7.5px] sm:text-[9.5px] font-black text-[#b91c1c] leading-tight truncate">
                          {dayTamil.festivalName}
                        </div>
                      ) : dayTamil.specialDayTag ? (
                        <div className="text-[7.5px] sm:text-[9.5px] font-black text-[#b91c1c] leading-tight truncate">
                          {dayTamil.specialDayTag}
                        </div>
                      ) : (
                        <div className="h-2 sm:h-2.5" />
                      )}
                    </div>

                    {/* Booking Indicator Badge */}
                    {dayBookings.length > 0 && (
                      <div className="w-full mt-0.5">
                        <span className="text-[7px] sm:text-[8.5px] px-1 py-0.2 rounded-full font-bold inline-block leading-none truncate max-w-full bg-emerald-800 text-white shadow-2xs">
                          ● {dayBookings.length} {dayBookings.length === 1 ? "seva" : "sevas"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}

              {/* 3. Trailing Next-Month Days (shown in muted gray like reference) */}
              {nextMonthTrailingDays.map((nextDay) => (
                <button
                  key={nextDay.dateStr}
                  onClick={() => {
                    setSelectedDate(nextDay.dateStr);
                    nextMonth();
                  }}
                  className="min-h-[56px] sm:min-h-[72px] md:min-h-[82px] p-0.5 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <span className="text-sm sm:text-lg md:text-xl font-bold text-gray-300">
                    {nextDay.dayNum}
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-medium text-gray-300 leading-tight">
                    {nextDay.info.tamilDay}
                  </span>
                  <div className="h-2" />
                </button>
              ))}
            </div>
          </div>

          {/* The 3 Bottom Summary Cards Matching Traditional Tamil Calendar Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. நல்ல நேரம் (Timings Card) */}
            <div className="bg-[#fffdf7] border border-amber-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-amber-200/70">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shadow-xs">
                      ☀️
                    </div>
                    <h4 className="font-extrabold text-sm text-amber-950">நல்ல நேரம்</h4>
                  </div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md">
                    {selectedTamilInfo.dayOfMonth} {monthNamesEn[selectedTamilInfo.monthIndex ?? currentMonth]}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-amber-950">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">ராகு காலம்</span>
                    <span className="font-bold">: {formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">எமகண்டம்</span>
                    <span className="font-bold">: {formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">குளிகை</span>
                    <span className="font-bold">: {formatTimeRangeTo12H(selectedTamilInfo.kuligai, true)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">காலை ந.நேரம்</span>
                    <span className="font-bold text-emerald-800">: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">மாலை ந.நேரம்</span>
                    <span className="font-bold text-emerald-800">: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">சூலம்</span>
                    <span className="font-bold">: {WEEKDAY_SULAM_PARIHARAM[selectedTamilInfo.dayOfWeek]?.sulam || "வடக்கு"}</span>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-amber-900/80">பரிகாரம்</span>
                    <span className="font-bold">: {WEEKDAY_SULAM_PARIHARAM[selectedTamilInfo.dayOfWeek]?.pariharam || "பால்"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-amber-200/50 flex items-center justify-between text-[11px]">
                <span className="text-amber-800/80 font-medium">திதி: {selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}</span>
                <span className="text-amber-900 font-semibold">{selectedTamilInfo.nakshatraNameTa}</span>
              </div>
            </div>

            {/* 2. முக்கிய நாட்கள் (Important Days of Month Card) */}
            <div className="bg-[#f8fdfa] border border-emerald-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-emerald-200/70">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs shadow-xs">
                      📅
                    </div>
                    <h4 className="font-extrabold text-sm text-emerald-950">முக்கிய நாட்கள்</h4>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    {monthFestivals.length} விசேஷங்கள்
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-emerald-950 max-h-52 overflow-y-auto pr-1">
                  {monthFestivals.length === 0 ? (
                    <div className="py-6 text-center text-emerald-800/60 font-medium text-xs">
                      இம்மாத சிறப்பு தினங்கள்
                    </div>
                  ) : (
                    monthFestivals.map((fest, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 py-0.5 leading-snug">
                        <span className="font-black text-red-600 shrink-0 w-5">
                          {String(fest.dayNum).padStart(2, "0")}
                        </span>
                        <span className="text-emerald-900/60 font-bold shrink-0">–</span>
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <span>{fest.name}</span>
                          {fest.icon && <span className="text-xs">{fest.icon}</span>}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-emerald-200/50 text-[11px] text-emerald-800 font-medium">
                சுப முகூர்த்த நாட்கள்: <span className="font-bold text-amber-700">{monthMuhurthamDaysCount} நாட்கள்</span>
              </div>
            </div>

            {/* 3. சந்திர நிலைகள் (Sacred Moon Phases Card) */}
            <div className="bg-[#f8faff] border border-indigo-200/90 rounded-2xl p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-indigo-200/70">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-indigo-800 text-white flex items-center justify-center text-xs shadow-xs">
                      🌙
                    </div>
                    <h4 className="font-extrabold text-sm text-indigo-950">சந்திர நிலைகள்</h4>
                  </div>
                  <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                    விரத தினங்கள்
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-indigo-950">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🌕</span>
                      <span>பௌர்ணமி</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.pournamiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.pournamiDays.join(", ")}`
                        : "இம்மாதம் இல்லை"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🌑</span>
                      <span>அமாவாசை</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.amavasaiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.amavasaiDays.join(", ")}`
                        : "இம்மாதம் இல்லை"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🐘</span>
                      <span>சங்கடஹர சதுர்த்தி</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.chaturthiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.chaturthiDays.join(", ")}`
                        : "–"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🪔</span>
                      <span>கிருத்திகை</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.karthigaiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.karthigaiDays.join(", ")}`
                        : "–"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🪷</span>
                      <span>ஏகாதசி</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.ekadashiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.ekadashiDays.join(", ")}`
                        : "–"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-0.5">
                    <span className="font-semibold text-indigo-900/80 flex items-center gap-1">
                      <span>🦚</span>
                      <span>சஷ்டி</span>
                    </span>
                    <span className="font-bold text-slate-900">
                      {monthSacredPhases.sashtiDays.length > 0
                        ? `${monthNamesTransTa[currentMonth]} ${monthSacredPhases.sashtiDays.join(", ")}`
                        : "–"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-indigo-200/50 text-[11px] text-indigo-800 font-medium">
                துல்லிய ஜோதிடக் கணிப்பு • ஆரம்ப நாள் குறிப்பு
              </div>
            </div>
          </div>

          {/* Selected Day Breakdown Card */}
          <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-2xl p-4 border border-velvi-gold/30 shadow-sacred space-y-3">
            {/* Auspicious Day Festive Banner (if applicable) */}
            {(selectedTamilInfo.specialDayTag || selectedTamilInfo.isMuhurtham || selectedTamilInfo.festivalName) && (
              <div className="bg-gradient-to-r from-amber-500/15 via-velvi-gold/25 to-amber-500/15 border border-velvi-gold/40 px-3 py-1.5 rounded-xl flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-950 flex-wrap">
                  <span className="text-base">{selectedTamilInfo.specialDayIcon || (selectedTamilInfo.isMuhurtham ? "💍" : "✨")}</span>
                  <span>{selectedTamilInfo.specialDayTag || (selectedTamilInfo.isMuhurtham ? "சுப முகூர்த்தம்" : selectedTamilInfo.festivalName)}</span>
                  {selectedTamilInfo.isMuhurtham && selectedTamilInfo.isEkadashi && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100/90 text-amber-900 rounded-md border border-amber-300 font-semibold">🪷 ஏகாதசி</span>
                  )}
                  {selectedTamilInfo.isMuhurtham && selectedTamilInfo.isSashti && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-amber-100/90 text-amber-900 rounded-md border border-amber-300 font-semibold">🦚 சஷ்டி</span>
                  )}
                </div>
                <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
                  {selectedTamilInfo.isMuhurtham ? "சுப முகூர்த்தம்" : selectedTamilInfo.festivalName ? "Festive Day" : "Sacred Day"}
                </span>
              </div>
            )}

            {selectedTamilInfo.isKarinaal && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-2.5 flex items-center gap-2 text-xs shadow-xs">
                <span className="text-base">⚠️</span>
                <div>
                  <span className="font-bold block">கரிநாள் (Karinaal)</span>
                  <span className="text-[11px] text-amber-800">கரிநாள் அன்று திருமணம் போன்ற சுபகாரியங்கள் செய்வதைத் தவிர்க்கவும்.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-velvi-gold" />
                  <span>{selectedTamilInfo.formattedDualDate}</span>
                </h3>
                <p className="text-xs text-velvi-goldDark font-semibold mt-0.5">
                  {selectedTamilInfo.dayOfWeekEn} • {selectedTamilInfo.dayOfWeekTa} ({selectedTamilInfo.tamilYear} வருடம்)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  title="Share Panchangam & Schedule on WhatsApp"
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition active:scale-95 shrink-0"
                >
                  <Share2 className="w-3.5 h-3.5 text-white" />
                  <span className="text-[11px]">WhatsApp</span>
                </button>

                <Link
                  href={`/app/bookings/new?date=${selectedDate}`}
                  className="px-3.5 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
                  <span>Book Pooja</span>
                </Link>
              </div>
            </div>

            {/* Panchangam Bar */}
            <div className="pt-2 border-t border-velvi-gold/20">
              <div className="flex items-center justify-between text-xs text-velvi-brown/80 mb-1.5">
                <span className="font-bold flex items-center gap-1.5 text-velvi-brown">
                  <Sun className="w-3.5 h-3.5 text-velvi-gold" /> பஞ்சாங்கம் (Panchangam)
                </span>
                <button
                  onClick={() => setShowPanchangam(!showPanchangam)}
                  className="text-[11px] text-velvi-goldDark font-semibold hover:underline"
                >
                  {showPanchangam ? "Hide" : "Show"}
                </button>
              </div>

              {showPanchangam && (
                <div className="space-y-2">
                  {/* Auspicious Timings: Nalla Neram & Gowri Nalla Neram */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="bg-emerald-50/90 border border-emerald-200 p-2.5 rounded-xl space-y-1 shadow-xs">
                      <div className="flex items-center gap-1 text-emerald-900 font-bold text-xs">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>நல்ல நேரம் (Nalla Neram)</span>
                      </div>
                      <div className="text-[11px] text-emerald-950 space-y-0.5 font-medium">
                        <div>
                          <span className="text-emerald-700 text-[10px]">காலை:</span>{" "}
                          <span className="font-bold">{formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning)}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 text-[10px]">மாலை:</span>{" "}
                          <span className="font-bold">{formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-amber-50/90 border border-amber-200 p-2.5 rounded-xl space-y-1 shadow-xs">
                      <div className="flex items-center gap-1 text-amber-900 font-bold text-xs">
                        <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>கௌரி நல்ல நேரம்</span>
                      </div>
                      <div className="text-[11px] text-amber-950 space-y-0.5 font-medium">
                        <div>
                          <span className="text-amber-700 text-[10px]">காலை:</span>{" "}
                          <span className="font-bold">{formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning)}</span>
                        </div>
                        <div>
                          <span className="text-amber-700 text-[10px]">மாலை:</span>{" "}
                          <span className="font-bold">{formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Planetary Inauspicious & Astrological Timings */}
                  <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-white/90 p-2.5 rounded-xl border border-velvi-gold/20">
                    <div className="space-y-0.5">
                      <span className="text-velvi-brown/60 block text-[10px]">திதி (Tithi):</span>
                      <span className="font-bold text-velvi-brownDark truncate block" title={selectedTamilInfo.tithi}>
                        {selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithi.split(" ")[0]}
                      </span>
                      {selectedTamilInfo.pakshaTa && (
                        <span className="text-[9.5px] text-velvi-goldDark block font-medium">
                          {selectedTamilInfo.pakshaTa}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-velvi-brown/60 block text-[10px]">நட்சத்திரம்:</span>
                      <span className="font-bold text-velvi-brownDark truncate block" title={selectedTamilInfo.nakshatra}>
                        {selectedTamilInfo.nakshatraNameTa || selectedTamilInfo.nakshatra.split(" ")[0]}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-velvi-brown/60 block text-[10px]">குளிகை (Kuligai):</span>
                      <span className="font-bold text-velvi-brownDark block">
                        {formatTimeRangeTo12H(selectedTamilInfo.kuligai)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-red-50/80 p-2 rounded-xl border border-red-200/70 space-y-0.5">
                      <span className="text-red-700 block text-[10px] font-bold">
                        ⚠️ ராகு காலம்:
                      </span>
                      <span className="font-bold text-red-900">
                        {formatTimeRangeTo12H(selectedTamilInfo.rahuKalam)}
                      </span>
                    </div>
                    <div className="bg-orange-50/80 p-2 rounded-xl border border-orange-200/70 space-y-0.5">
                      <span className="text-orange-800 block text-[10px] font-bold">
                        ⏳ எமகண்டம்:
                      </span>
                      <span className="font-bold text-orange-950">
                        {formatTimeRangeTo12H(selectedTamilInfo.yamagandam)}
                      </span>
                    </div>
                  </div>

                  {/* On-demand Panchangam Guide & Rules Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowPanchangamGuide(true)}
                    className="w-full py-2 px-3 bg-velvi-cream/60 hover:bg-velvi-gold/15 rounded-xl border border-velvi-gold/30 text-[11px] font-semibold text-velvi-brown flex items-center justify-between transition group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                      <span>கால அளவு &amp; பஞ்சாங்க சாஸ்திர விளக்கம்</span>
                    </div>
                    <span className="text-[10px] text-velvi-goldDark font-bold group-hover:underline">
                      விவரம் →
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bookings for Selected Day */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-velvi-brown/80 tracking-wide uppercase flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-velvi-gold" />
                <span>Bookings for this day ({selectedDayBookings.length})</span>
              </h4>
              <Link
                href={`/app/bookings/new?date=${selectedDate}`}
                className="text-xs font-bold text-velvi-goldDark hover:underline"
              >
                + New Booking
              </Link>
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-velvi-gold/30 space-y-2">
                <div className="text-3xl">🪔</div>
                <h5 className="font-bold text-sm text-velvi-brown">No poojas scheduled</h5>
                <p className="text-xs text-velvi-brown/60 max-w-xs mx-auto">
                  No ceremonies booked on this date yet. Tap Book above to schedule a Homam or Seva.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {selectedDayBookings.map((b) => {
                  const isSelf =
                    b.assignedIyerId === ownerMember?.id ||
                    b.assignedIyerName === currentUser?.name ||
                    b.assignedIyerName === "Ravi Iyer";

                  return (
                    <Link
                      key={b.id}
                      href={`/app/bookings/${b.id}`}
                      className="block bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/60 transition group"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-velvi-goldDark bg-velvi-gold/10 px-2 py-0.5 rounded">
                            {b.startTime} - {b.endTime}
                          </span>
                          {isSelf ? (
                            <span className="text-[10px] font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded-full border border-velvi-gold/30">
                              🪔 Self
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              👥 {b.assignedIyerName}
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-velvi-sacredGreen bg-green-50 px-2 py-0.5 rounded">
                            {b.status}
                          </span>
                        </div>
                        <span className="text-sm font-extrabold text-velvi-brownDark">
                          ₹{b.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <h5 className="font-bold text-sm text-velvi-brownDark mt-1.5 group-hover:text-velvi-goldDark transition">
                        {b.poojaEnglishName}
                      </h5>
                      <div className="text-xs text-velvi-brown/70 flex items-center justify-between mt-1">
                        <span className="flex items-center gap-1 truncate max-w-[220px]">
                          <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                          {b.customerName} • {b.location}
                        </span>
                        <span className="font-bold text-[11px] text-velvi-brown group-hover:translate-x-0.5 transition">
                          View →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. DAY VIEW (Hourly Time-Slot Schedule) */}
      {/* ========================================================= */}
      {viewMode === "day" && (
        <div className="space-y-3.5">
          {/* Day Stepper Bar */}
          <div className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm flex items-center justify-between">
            <button
              onClick={() => stepDay(-1)}
              className="p-1.5 hover:bg-velvi-cream rounded-xl text-velvi-brown transition flex items-center gap-1 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Day</span>
            </button>

            <div className="text-center">
              <h3 className="text-sm font-bold text-velvi-brownDark">
                {selectedTamilInfo.dayOfWeekEn}, {selectedTamilInfo.dayOfMonth}{" "}
                {selectedTamilInfo.monthNameEn} {selectedTamilInfo.year}
              </h3>
              <p className="text-xs text-velvi-goldDark font-semibold">
                {selectedTamilInfo.tamilMonth} {selectedTamilInfo.tamilDay} ({selectedTamilInfo.dayOfWeekTa}) • {selectedTamilInfo.tamilYear} வருடம்
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                title="Share Schedule on WhatsApp"
                className="p-1.5 hover:bg-emerald-50 text-emerald-700 rounded-xl transition flex items-center gap-1 text-xs font-bold"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                onClick={() => stepDay(1)}
                className="p-1.5 hover:bg-velvi-cream rounded-xl text-velvi-brown transition flex items-center gap-1 text-xs font-semibold"
              >
                <span>Next Day</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auspicious Day Festive Banner (if applicable) */}
          {selectedTamilInfo.specialDayTag && (
            <div className="bg-gradient-to-r from-amber-500/15 via-velvi-gold/25 to-amber-500/15 border border-velvi-gold/40 px-3 py-1.5 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-950">
                <span className="text-base">{selectedTamilInfo.specialDayIcon || "✨"}</span>
                <span>{selectedTamilInfo.specialDayTag}</span>
              </div>
              <span className="text-[10px] font-bold text-amber-900 uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-md border border-amber-200">
                Auspicious Day
              </span>
            </div>
          )}

          {/* Quick Panchangam Banner with Nalla Neram & Gowri Nalla Neram */}
          <div className="bg-white rounded-2xl p-3 border border-velvi-gold/30 shadow-xs space-y-2">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50/80 border border-emerald-200/70 p-2 rounded-xl">
                <span className="text-emerald-900 font-bold text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" /> நல்ல நேரம்:
                </span>
                <div className="text-[11px] font-semibold text-emerald-950 mt-0.5">
                  காலை: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning)}
                </div>
                <div className="text-[11px] font-semibold text-emerald-950">
                  மாலை: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening)}
                </div>
              </div>

              <div className="bg-amber-50/80 border border-amber-200/70 p-2 rounded-xl">
                <span className="text-amber-900 font-bold text-[11px] flex items-center gap-1">
                  <Flame className="w-3 h-3 text-amber-600 shrink-0" /> கௌரி நல்ல நேரம்:
                </span>
                <div className="text-[11px] font-semibold text-amber-950 mt-0.5">
                  காலை: {formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning)}
                </div>
                <div className="text-[11px] font-semibold text-amber-950">
                  மாலை: {formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening)}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-1.5 text-[11px] pt-1 border-t border-velvi-creamDark text-velvi-brown/80">
              <span className="truncate mr-2">
                திதி: <strong className="text-velvi-brownDark">{selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithi.split(" ")[0]}</strong> • 
                நட்சத்திரம்: <strong className="text-velvi-brownDark">{selectedTamilInfo.nakshatraNameTa || selectedTamilInfo.nakshatra.split(" ")[0]}</strong>
              </span>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-red-700 font-bold">
                  ராகு காலம்: {formatTimeRangeTo12H(selectedTamilInfo.rahuKalam)}
                </span>
                <span className="text-orange-800 font-bold">
                  • எமகண்டம்: {formatTimeRangeTo12H(selectedTamilInfo.yamagandam)}
                </span>
              </div>
            </div>
          </div>

          {/* Hourly Slots Breakdown */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-velvi-brown/80 tracking-wide uppercase">
                Schedule Slots ({selectedDayBookings.length} booked)
              </h4>
              <span className="text-[11px] text-velvi-brown/60">
                Tap an open slot to schedule
              </span>
            </div>

            <div className="space-y-2">
              {DAY_SLOTS.map((slot) => {
                // Find matching booking for this slot
                const matchedBooking = selectedDayBookings.find((b) => {
                  const bStart = b.startTime.replace(/^0/, "");
                  const sLabel = slot.label.replace(/^0/, "");
                  return bStart.startsWith(sLabel.split(":")[0]);
                });

                if (matchedBooking) {
                  const isSelf =
                    matchedBooking.assignedIyerId === ownerMember?.id ||
                    matchedBooking.assignedIyerName === currentUser?.name ||
                    matchedBooking.assignedIyerName === "Ravi Iyer";

                  return (
                    <Link
                      key={slot.label}
                      href={`/app/bookings/${matchedBooking.id}`}
                      className="block bg-white rounded-2xl p-3.5 border-l-4 border-l-velvi-gold border-y border-r border-velvi-gold/20 shadow-sm hover:border-velvi-gold transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded">
                            {matchedBooking.startTime}
                          </span>
                          <span className="font-bold text-sm text-velvi-brownDark">
                            {matchedBooking.poojaEnglishName}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-velvi-brownDark">
                          ₹{matchedBooking.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-velvi-brown/70">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-velvi-gold" />
                          {matchedBooking.customerName} ({matchedBooking.customerMobile})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-velvi-cream rounded">
                          {isSelf ? "🪔 Self" : `👥 ${matchedBooking.assignedIyerName}`}
                        </span>
                      </div>
                    </Link>
                  );
                }

                return (
                  <div
                    key={slot.label}
                    className="bg-white/60 hover:bg-white rounded-xl p-2.5 border border-dashed border-velvi-gold/30 flex items-center justify-between transition"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-velvi-brown/70 min-w-[65px]">
                        {slot.label}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-velvi-brown/50">
                          {slot.sub} • Available
                        </span>
                        {isSlotInNallaNeram(slot.label) && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-0.5">
                            ✨ சுப நேரம்
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/app/bookings/new?date=${selectedDate}&time=${encodeURIComponent(slot.label)}`}
                      className="px-2.5 py-1 bg-velvi-gold/15 hover:bg-velvi-gold/30 text-velvi-brownDark rounded-lg text-xs font-bold flex items-center gap-1 transition"
                    >
                      <Plus className="w-3 h-3 text-velvi-goldDark stroke-[3]" />
                      <span>Schedule</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. AGENDA VIEW (Chronological Timeline) */}
      {/* ========================================================= */}
      {viewMode === "agenda" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-velvi-gold" />
              <span>Upcoming Seva Schedule ({filteredBookings.length})</span>
            </h3>

            <Link
              href="/app/bookings/new"
              className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition"
            >
              <Plus className="w-4 h-4 text-velvi-goldLight" />
              <span>Book</span>
            </Link>
          </div>

          {sortedAgendaDates.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-velvi-gold/30 space-y-2">
              <div className="text-3xl">🪔</div>
              <h4 className="font-bold text-sm text-velvi-brown">No bookings found</h4>
              <p className="text-xs text-velvi-brown/60">
                You do not have any scheduled ceremonies yet. Tap Book to create your first reservation.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedAgendaDates.map((dateStr) => {
                const dayTamil = getTamilDate(dateStr);
                const dayBookings = filteredBookings.filter((b) => b.date === dateStr);
                const isDateToday = dateStr === todayStr;

                return (
                  <div key={dateStr} className="space-y-2">
                    {/* Date Header Pill */}
                    <div className="flex items-center justify-between bg-gradient-to-r from-velvi-cream to-velvi-creamLight px-3 py-1.5 rounded-xl border border-velvi-gold/30">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-velvi-brownDark">
                          {dayTamil.formattedDualDate}
                        </span>
                        {isDateToday && (
                          <span className="text-[10px] font-bold px-2 py-0.2 bg-velvi-gold text-velvi-brownDark rounded-full">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-semibold text-velvi-goldDark">
                        {dayTamil.dayOfWeekTa}
                      </span>
                    </div>

                    {/* Bookings under this date */}
                    <div className="space-y-2">
                      {dayBookings.map((b) => {
                        const isSelf =
                          b.assignedIyerId === ownerMember?.id ||
                          b.assignedIyerName === currentUser?.name ||
                          b.assignedIyerName === "Ravi Iyer";

                        return (
                          <Link
                            key={b.id}
                            href={`/app/bookings/${b.id}`}
                            className="block bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/60 transition group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-velvi-goldDark bg-velvi-gold/10 px-2 py-0.5 rounded">
                                  {b.startTime}
                                </span>
                                <h5 className="font-bold text-sm text-velvi-brownDark group-hover:text-velvi-goldDark transition">
                                  {b.poojaEnglishName}
                                </h5>
                              </div>
                              <span className="text-xs font-extrabold text-velvi-brownDark">
                                ₹{b.totalAmount.toLocaleString("en-IN")}
                              </span>
                            </div>

                            <div className="mt-2 flex items-center justify-between text-xs text-velvi-brown/70">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                                {b.customerName} • {b.location}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isSelf
                                    ? "bg-velvi-gold/15 text-velvi-brownDark border border-velvi-gold/30"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                                }`}
                              >
                                {isSelf ? "🪔 Self" : `👥 ${b.assignedIyerName}`}
                              </span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Panchangam Guide & Rules Modal */}
      {showPanchangamGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-velvi-gold/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-velvi-gold/20">
              <div className="flex items-center gap-2 text-velvi-brown">
                <Info className="w-5 h-5 text-velvi-gold" />
                <h3 className="font-bold text-sm">கால அளவு &amp; சாஸ்திர விவரம்</h3>
              </div>
              <button
                onClick={() => setShowPanchangamGuide(false)}
                className="p-1 rounded-full hover:bg-velvi-cream text-velvi-brown/60 hover:text-velvi-brown transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-velvi-brown leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <strong className="text-emerald-900 block mb-0.5 font-bold">✨ நல்ல நேரம்:</strong>
                <span>ஒரு நாளைக்கு 2 முறை (காலை &amp; மாலை) தலா 1 மணி நேரம் (60 நிமிடங்கள்).</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <strong className="text-amber-900 block mb-0.5 font-bold">🔥 கௌரி நல்ல நேரம்:</strong>
                <span>காலை மற்றும் மாலை/இரவில் தலா 1 மணி நேரம். சுப காரியங்கள் தொடங்குவதற்கு உகந்தது.</span>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <strong className="text-red-900 block mb-0.5 font-bold">⚠️ ராகு காலம் &amp; எமகண்டம்:</strong>
                <span>தலா 1.5 மணி நேரம் (90 நிமிடங்கள்). இந்நேரங்களில் சுப காரியங்கள் தவிர்க்கப்பட வேண்டும்.</span>
              </div>

              <div className="p-3 bg-velvi-cream/60 rounded-xl border border-velvi-gold/20 text-[11px] text-velvi-brown/80">
                இக்கணக்கீடுகள் அனைத்து ஆண்டுகளுக்கும் தினசரி பஞ்சாங்க சாஸ்திர விதிகளின்படி நிரந்தரமாகவும் துல்லியமாகவும் அமைகின்றன.
              </div>
            </div>

            <button
              onClick={() => setShowPanchangamGuide(false)}
              className="w-full py-2.5 bg-velvi-brown text-white font-bold rounded-xl text-xs hover:bg-velvi-brownLight transition active:scale-95 shadow-sm"
            >
              சரி, புரிந்தது (Close)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
