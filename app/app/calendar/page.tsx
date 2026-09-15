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
  ChevronDown,
  Plus,
  Flame,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
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

function formatTime12H(t?: string): string {
  if (!t) return "";
  if (t.includes("AM") || t.includes("PM")) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr || "00"} ${period}`;
}

export default function CalendarPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"calendar" | "bookings">("calendar");
  const [showPanchangam, setShowPanchangam] = useState<boolean>(true);
  const [showPanchangamGuide, setShowPanchangamGuide] = useState<boolean>(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [filterIyer, setFilterIyer] = useState<"ALL" | "SELF">("ALL");
  const [activeSacredTab, setActiveSacredTab] = useState<string>("muhurtham");

  // Month navigation
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const allBookings = React.useMemo(() => db.getBookings(businessId), [businessId]);
  const members = React.useMemo(() => db.getMembers(businessId), [businessId]);
  const ownerMember = React.useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  // Filter bookings based on Iyer selection
  const filteredBookings = React.useMemo(() => {
    return allBookings.filter((b) => {
      if (filterIyer === "SELF") {
        return (
          b.assignedIyerId === ownerMember?.id ||
          b.assignedIyerName === currentUser?.name ||
          b.assignedIyerName === "Ravi Iyer"
        );
      }
      return true;
    });
  }, [allBookings, filterIyer, ownerMember?.id, currentUser?.name]);

  // Date info for selected date
  const selectedTamilInfo = React.useMemo(() => getTamilDate(selectedDate), [selectedDate]);
  const selectedDayBookings = React.useMemo(() => filteredBookings.filter((b) => b.date === selectedDate), [filteredBookings, selectedDate]);

  // Calendar month grid generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0-6

  // Calculate monthly statistics and pre-compute day details for fast filtering
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  
  const currentMonthBookings = React.useMemo(() => {
    return filteredBookings.filter((b) => b.date.startsWith(currentMonthKey));
  }, [filteredBookings, currentMonthKey]);

  const currentMonthRevenue = React.useMemo(() => {
    return currentMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [currentMonthBookings]);

  const monthDayDetails = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getTamilDate>> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      map[dateStr] = getTamilDate(dateStr);
    }
    return map;
  }, [currentYear, currentMonth, daysInMonth]);

  // Full Month Sacred & Auspicious Days Summary
  const monthSacredSummary = React.useMemo(() => {
    const allDays = Object.values(monthDayDetails);

    const muhurthamDays = allDays.filter((d) => d.isMuhurtham);
    const pournamiDays = allDays.filter((d) => d.isPournami);
    const amavasaiDays = allDays.filter((d) => d.isAmavasai);
    const pradoshamDays = allDays.filter((d) => d.isPradosham);
    const ekadashiDays = allDays.filter((d) => d.isEkadashi);
    const chaturthiDays = allDays.filter((d) => d.isSankataharaChaturthi);
    const sashtiDays = allDays.filter((d) => d.isSashti);
    const karthigaiDays = allDays.filter((d) => d.isKarthigai);
    const sivarathiriDays = allDays.filter((d) => d.isMaadhaSivarathiri);
    const thiruvonamDays = allDays.filter((d) => d.isThiruvonam);
    const karinaalDays = allDays.filter((d) => d.isKarinaal);
    const festivalDays = allDays.filter((d) => d.festivalName);

    return {
      muhurthamDays,
      pournamiDays,
      amavasaiDays,
      pradoshamDays,
      ekadashiDays,
      chaturthiDays,
      sashtiDays,
      karthigaiDays,
      sivarathiriDays,
      thiruvonamDays,
      karinaalDays,
      festivalDays,
    };
  }, [monthDayDetails]);

  // Grouped booked dates with full Tamil info for instant filtering and list display
  const bookedDatesGrouped = React.useMemo(() => {
    const dates = Array.from(new Set(currentMonthBookings.map((b) => b.date))).sort();
    return dates.map((dateStr) => {
      const dayTamil = monthDayDetails[dateStr] || getTamilDate(dateStr);
      const bookingsOnDay = currentMonthBookings.filter((b) => b.date === dateStr);
      return {
        dateStr,
        dayTamil,
        bookings: bookingsOnDay,
        dayRevenue: bookingsOnDay.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
      };
    });
  }, [currentMonthBookings, monthDayDetails]);

  const handleShareWhatsApp = () => {
    const dateTitle = `${selectedTamilInfo.formattedFullDay} (${selectedTamilInfo.tamilYear} வருடம்)`;
    let text = `🪔 *வேள்வி - பஞ்சாங்கம் & பூஜைகள்* 🪔\n`;
    text += `📅 *${dateTitle}*\n`;
    text += `✨ *திதி:* ${selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}\n`;
    text += `⭐ *நட்சத்திரம்:* ${selectedTamilInfo.nakshatraNameTa}\n`;
    text += `\n🟢 *நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}\n`;
    text += `\n🟡 *கௌரி நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning, true)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening, true)}\n`;
    text += `\n🔴 *ராகு காலம்:* ${formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}\n`;
    text += `🟠 *எமகண்டம்:* ${formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}\n`;

    if (selectedDayBookings.length > 0) {
      text += `\n📋 *இன்றைய பூஜைகள் (${selectedDayBookings.length}):*\n`;
      selectedDayBookings.forEach((b, idx) => {
        text += `${idx + 1}. ${b.poojaEnglishName} (${formatTime12H(b.startTime)}) - ${b.customerName}\n`;
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

  const MONTH_PICKER_DATA = [
    { num: 1, en: "Jan", fullEn: "January", ta: "ஜனவரி", tamilSolar: "தை" },
    { num: 2, en: "Feb", fullEn: "February", ta: "பிப்ரவரி", tamilSolar: "மாசி" },
    { num: 3, en: "Mar", fullEn: "March", ta: "மார்ச்", tamilSolar: "பங்குனி" },
    { num: 4, en: "Apr", fullEn: "April", ta: "ஏப்ரல்", tamilSolar: "சித்திரை" },
    { num: 5, en: "May", fullEn: "May", ta: "மே", tamilSolar: "வைகாசி" },
    { num: 6, en: "Jun", fullEn: "June", ta: "ஜூன்", tamilSolar: "ஆனி" },
    { num: 7, en: "Jul", fullEn: "July", ta: "ஜூலை", tamilSolar: "ஆடி" },
    { num: 8, en: "Aug", fullEn: "August", ta: "ஆகஸ்ட்", tamilSolar: "ஆவணி" },
    { num: 9, en: "Sep", fullEn: "September", ta: "செப்டம்பர்", tamilSolar: "புரட்டாசி" },
    { num: 10, en: "Oct", fullEn: "October", ta: "அக்டோபர்", tamilSolar: "ஐப்பசி" },
    { num: 11, en: "Nov", fullEn: "November", ta: "நவம்பர்", tamilSolar: "கார்த்திகை" },
    { num: 12, en: "Dec", fullEn: "December", ta: "டிசம்பர்", tamilSolar: "மார்கழி" },
  ];

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentYear(pickerYear);
    setCurrentMonth(monthIndex);
    const maxDays = new Date(pickerYear, monthIndex + 1, 0).getDate();
    const currentDay = parseInt(selectedDate.split("-")[2] || "1", 10);
    const targetDay = Math.min(currentDay, maxDays);
    setSelectedDate(`${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`);
    setShowMonthYearPicker(false);
  };

  const handlePickerJumpToday = () => {
    const today = new Date();
    setPickerYear(today.getFullYear());
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateString());
    setShowMonthYearPicker(false);
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



  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* 1. Master Top Month/Year Navigation Bar */}
      <div className="bg-gradient-to-r from-[#0b2b17] via-[#123e24] to-[#0b2b17] text-white p-3 sm:p-4 rounded-3xl shadow-md space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Prev Month, Clickable Month/Year Picker, Next Month */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0 cursor-pointer"
              title="முந்தைய மாதம் (Previous Month)"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPickerYear(currentYear);
                setShowMonthYearPicker(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl hover:bg-white/15 transition active:scale-95 group text-left cursor-pointer border border-transparent hover:border-white/20"
              title="மாதம் / வருடம் மாற்ற (Select Month & Year)"
            >
              <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-wide text-white uppercase">
                {monthNamesUpper[currentMonth]}
              </span>
              <span className="text-lg sm:text-2xl md:text-3xl font-black text-amber-400 ml-1">
                {currentYear}
              </span>
              <ChevronDown className="w-4 h-4 text-amber-300/80 group-hover:text-amber-300 transition-transform group-hover:translate-y-0.5 shrink-0 ml-0.5" />
            </button>

            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0 cursor-pointer"
              title="அடுத்த மாதம் (Next Month)"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Right: Today Button */}
          <button
            onClick={jumpToToday}
            className="text-xs font-bold px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-full border border-amber-400/40 transition active:scale-95 cursor-pointer shrink-0"
          >
            Today
          </button>
        </div>

        {/* Sub-strip: Tamil solar month and Year */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10 px-1">
          <span className="font-semibold text-amber-200/95 flex items-center gap-1.5">
            <span>🌾 தமிழ் மாதம்:</span>
            <strong className="text-white font-black">{dualTamilMonthTa}</strong>
          </span>
          <span className="text-[11px] font-bold text-emerald-200/90 tracking-wider">
            {selectedTamilInfo.tamilYear} வருடம்
          </span>
        </div>
      </div>

      {/* 2. Primary Mode Switcher: Tamil Calendar vs Bookings Only */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("calendar")}
          className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${
            activeTab === "calendar"
              ? "bg-gradient-to-r from-emerald-900 to-emerald-950 text-white shadow-sm ring-1 ring-emerald-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <CalendarIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeTab === "calendar" ? "text-amber-300" : "text-slate-500"}`} />
          <span>தமிழ் காலண்டர்</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("bookings")}
          className={`py-2 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer ${
            activeTab === "bookings"
              ? "bg-gradient-to-r from-emerald-900 to-emerald-950 text-white shadow-sm ring-1 ring-emerald-700"
              : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
          }`}
        >
          <span>🔥 புக்கிங் மட்டும்</span>
          <span
            className={`text-[10px] sm:text-[11px] px-2 py-0.2 rounded-full font-black ${
              activeTab === "bookings"
                ? "bg-amber-400 text-slate-950"
                : "bg-slate-200 text-slate-700"
            }`}
          >
            {currentMonthBookings.length}
          </span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 3. MODE 1: TAMIL CALENDAR VIEW */}
      {/* ========================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          {/* Authentic Tamil Calendar Sheet Card */}
          <div className="rounded-3xl overflow-hidden border border-emerald-950/20 shadow-md bg-white">
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

            {/* Calendar Days Grid - Authentic Tamil Calendar with Sacred Indicators & Bookings */}
            <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-white">
              {/* 1. Leading Prev-Month Days */}
              {prevMonthLeadingDays.map((prevDay) => (
                <button
                  key={prevDay.dateStr}
                  onClick={() => {
                    setSelectedDate(prevDay.dateStr);
                    prevMonth();
                  }}
                  className="min-h-[64px] sm:min-h-[76px] md:min-h-[86px] p-1 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-gray-300">
                      {prevDay.dayNum}
                    </span>
                    <span className="text-[7.5px] sm:text-[9px] font-medium text-gray-300 leading-tight">
                      {prevDay.info.tamilDay}
                    </span>
                  </div>
                  <div className="h-3" />
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
                const hasBookings = dayBookings.length > 0;

                // Prioritized sacred icons for booking decisions (Max 2 icons per cell to keep neat & uncluttered)
                const sacredIcons: Array<{ icon: string; title: string }> = [];
                if (dayTamil.isMuhurtham) sacredIcons.push({ icon: "💍", title: "சுப முகூர்த்தம்" });
                if (dayTamil.isPournami) sacredIcons.push({ icon: "🌕", title: "பௌர்ணமி" });
                if (dayTamil.isAmavasai) sacredIcons.push({ icon: "🌑", title: "அமாவாசை" });
                if (dayTamil.isKarinaal) sacredIcons.push({ icon: "⚠️", title: "கரிநாள்" });
                if (dayTamil.isPradosham) sacredIcons.push({ icon: "🪔", title: "பிரதோஷம்" });
                if (dayTamil.isSankataharaChaturthi) sacredIcons.push({ icon: "🐘", title: "சங்கடஹர சதுர்த்தி" });
                if (dayTamil.isSashti) sacredIcons.push({ icon: "🚩", title: "சஷ்டி" });
                if (dayTamil.isEkadashi) sacredIcons.push({ icon: "🌿", title: "ஏகாதசி" });
                if (dayTamil.isKarthigai) sacredIcons.push({ icon: "🔥", title: "கார்த்திகை" });
                if (dayTamil.festivalName && !dayTamil.isMuhurtham && !dayTamil.isPournami && !dayTamil.isAmavasai) {
                  sacredIcons.push({ icon: "⭐", title: dayTamil.festivalName });
                }

                // Keep only top 2 most important icons per cell
                const cellIcons = sacredIcons.slice(0, 2);

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`min-h-[66px] sm:min-h-[78px] md:min-h-[90px] p-1 sm:p-1.5 border-r border-b border-gray-200 flex flex-col items-center justify-between text-center transition relative group ${
                      isSelected
                        ? "bg-amber-100/90 ring-2 ring-amber-600 ring-inset z-10 font-bold shadow-2xs"
                        : hasBookings
                        ? "bg-emerald-50/80 hover:bg-emerald-100/80"
                        : isToday
                        ? "bg-slate-100/80 hover:bg-slate-100"
                        : "bg-white hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Top Row: English Day Number (Bigger & Crisp) & Tamil Solar Day Number */}
                    <div className="flex items-center justify-between leading-tight w-full px-0.5">
                      <span
                        className={`text-sm sm:text-lg md:text-xl font-black ${
                          isSunday ? "text-[#b91c1c]" : "text-slate-900"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <span className="text-[8.5px] sm:text-[10px] md:text-xs font-extrabold text-slate-500">
                        {dayTamil.tamilDay}
                      </span>
                    </div>

                    {/* Middle: Authentic Sacred Day Icons ONLY (Top 1-2 important icons, clean & uncluttered) */}
                    {cellIcons.length > 0 ? (
                      <div className="w-full my-0.5 flex items-center justify-center gap-1">
                        {cellIcons.map((si, sIdx) => (
                          <span
                            key={sIdx}
                            title={si.title}
                            className="text-[12px] sm:text-[13.5px] md:text-[15px] leading-none hover:scale-125 transition-transform"
                          >
                            {si.icon}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}

                    {/* Bottom: Highlighted Booking Badge with Homa Fire Icon & Bold Number */}
                    {hasBookings ? (
                      <div className="w-full mt-0.5 flex justify-center">
                        <span className="text-[9px] sm:text-[10.5px] md:text-[11.5px] px-1.5 sm:px-2 py-0.5 rounded-full font-black inline-flex items-center justify-center gap-1 leading-none bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-300 ring-1 ring-amber-400/60 shadow-xs">
                          <span className="text-[9.5px] sm:text-[11px]">🔥</span>
                          <span className="font-extrabold tracking-tight">{dayBookings.length}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </button>
                );
              })}

              {/* 3. Trailing Next-Month Days */}
              {nextMonthTrailingDays.map((nextDay) => (
                <button
                  key={nextDay.dateStr}
                  onClick={() => {
                    setSelectedDate(nextDay.dateStr);
                    nextMonth();
                  }}
                  className="min-h-[64px] sm:min-h-[76px] md:min-h-[86px] p-1 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-gray-300">
                      {nextDay.dayNum}
                    </span>
                    <span className="text-[7.5px] sm:text-[9px] font-medium text-gray-300 leading-tight">
                      {nextDay.info.tamilDay}
                    </span>
                  </div>
                  <div className="h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* 1. Selected Day Breakdown & Panchangam Card (Compact & Sleek) */}
          <div className="bg-[#fffdf7] border border-amber-200/90 rounded-2xl p-3 shadow-xs space-y-2.5">
            {/* Header: Date + Sacred Badges + Actions */}
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-amber-200/60 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs sm:text-sm text-emerald-950">
                    {selectedTamilInfo.formattedDualDate}
                  </span>
                  <span className="text-[11px] font-bold text-amber-900/80">
                    ({selectedTamilInfo.dayOfWeekTa})
                  </span>
                  {selectedTamilInfo.isMuhurtham && (
                    <span className="px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                      💍 சுப முகூர்த்தம்
                    </span>
                  )}
                  {selectedTamilInfo.isPournami && (
                    <span className="px-1.5 py-0.2 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                      🌕 பௌர்ணமி
                    </span>
                  )}
                  {selectedTamilInfo.isAmavasai && (
                    <span className="px-1.5 py-0.2 rounded-md bg-slate-800 text-white text-[10px] font-bold">
                      🌑 அமாவாசை
                    </span>
                  )}
                  {selectedTamilInfo.isKarinaal && (
                    <span className="px-1.5 py-0.2 rounded-md bg-rose-100 text-rose-900 text-[10px] font-bold border border-rose-300">
                      ⚠️ கரிநாள்
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-amber-900/70 font-semibold mt-0.5">
                  திதி: <strong className="text-slate-900 font-bold">{selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}</strong> • நட்சத்திரம்: <strong className="text-slate-900 font-bold">{selectedTamilInfo.nakshatraNameTa}</strong>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  title="WhatsApp பகிர்க"
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
                >
                  <Share2 className="w-3 h-3 text-white" />
                  <span>பகிர்</span>
                </button>

                <Link
                  href={`/app/bookings/new?date=${selectedDate}`}
                  className="px-2.5 py-1 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-lg text-[11px] font-bold flex items-center gap-1 shadow-2xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-velvi-goldLight stroke-[3]" />
                  <span>+ புதிய பூஜை</span>
                </Link>
              </div>
            </div>

            {/* Compact Timings Grid (2-column + sub-bar) */}
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              {/* நல்ல நேரம் */}
              <div className="bg-[#f2faf5] rounded-xl px-2.5 py-1.5 border border-emerald-200/80 flex flex-col justify-center">
                <div className="flex items-center justify-between text-emerald-950 font-black text-[10px] mb-0.5">
                  <span className="flex items-center gap-1"><span>☀️</span> நல்ல நேரம்</span>
                </div>
                <div className="text-[10px] text-slate-700 flex items-center justify-between gap-1">
                  <span>காலை: <strong className="text-slate-900 font-bold">{formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}</strong></span>
                </div>
                <div className="text-[10px] text-slate-700 flex items-center justify-between gap-1">
                  <span>மாலை: <strong className="text-slate-900 font-bold">{formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}</strong></span>
                </div>
              </div>

              {/* கௌரி நல்ல நேரம் */}
              <div className="bg-[#fff9f2] rounded-xl px-2.5 py-1.5 border border-amber-200/80 flex flex-col justify-center">
                <div className="flex items-center justify-between text-amber-950 font-black text-[10px] mb-0.5">
                  <span className="flex items-center gap-1"><span>✨</span> கௌரி நல்ல நேரம்</span>
                </div>
                <div className="text-[10px] text-slate-700 flex items-center justify-between gap-1">
                  <span>காலை: <strong className="text-slate-900 font-bold">{formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning, true)}</strong></span>
                </div>
                <div className="text-[10px] text-slate-700 flex items-center justify-between gap-1">
                  <span>மாலை: <strong className="text-slate-900 font-bold">{formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening, true)}</strong></span>
                </div>
              </div>

              {/* ராகு காலம் & எமகண்டம் & குளிகை Bar */}
              <div className="col-span-2 bg-slate-50 rounded-xl px-2.5 py-1.5 border border-slate-200/80 flex items-center justify-between flex-wrap gap-2 text-[10px]">
                <div className="flex items-center gap-1 text-rose-800 font-bold">
                  <span>🌙 ராகு:</span>
                  <span className="text-slate-900 font-black">{formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}</span>
                </div>
                <div className="flex items-center gap-1 text-indigo-900 font-bold">
                  <span>🐍 எமகண்டம்:</span>
                  <span className="text-slate-900 font-black">{formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-900 font-bold">
                  <span>🪐 குளிகை:</span>
                  <span className="text-slate-900 font-black">{formatTimeRangeTo12H(selectedTamilInfo.kuligai, true)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Selected Day Bookings (Compact) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <h4 className="font-bold text-xs text-velvi-brownDark flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-velvi-gold" />
                <span>தேர்ந்தெடுத்த நாள் பூஜைகள் ({selectedDayBookings.length})</span>
              </h4>
              {selectedDayBookings.length > 0 && (
                <Link
                  href={`/app/bookings/new?date=${selectedDate}`}
                  className="text-[11px] font-bold text-velvi-goldDark hover:underline"
                >
                  + புதிய புக்கிங்
                </Link>
              )}
            </div>

            {selectedDayBookings.length === 0 ? (
              <div className="bg-white rounded-xl px-3 py-2 border border-dashed border-velvi-gold/30 flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 text-xs text-velvi-brown/80 font-medium">
                  <span className="text-sm">🪔</span>
                  <span>இத்தேதியில் பூஜைகள் ஏதுமில்லை</span>
                </div>
                <Link
                  href={`/app/bookings/new?date=${selectedDate}`}
                  className="text-[11px] font-bold text-velvi-brownDark bg-velvi-gold/20 hover:bg-velvi-gold/30 px-2.5 py-1 rounded-lg transition active:scale-95"
                >
                  + பூஜை பதிவு செய்
                </Link>
              </div>
            ) : (
              <div className="space-y-1.5">
                {selectedDayBookings.map((b) => {
                  const isSelf =
                    !b.assignedIyerName ||
                    b.assignedIyerName.toLowerCase().includes("self") ||
                    b.assignedIyerName.toLowerCase().includes("maniraja");

                  return (
                    <Link
                      key={b.id}
                      href={`/app/bookings/${b.id}`}
                      className="block bg-white rounded-xl p-2.5 border border-velvi-gold/20 shadow-2xs hover:border-velvi-gold/50 transition group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="font-bold text-xs sm:text-sm text-velvi-brownDark group-hover:text-velvi-goldDark transition truncate">
                              {b.poojaEnglishName}
                            </span>
                            {b.poojaTamilName && (
                              <span className="text-[11px] text-velvi-goldDark font-semibold hidden sm:inline">
                                ({b.poojaTamilName})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-velvi-brown/70 mt-0.5">
                            <span className="font-semibold text-slate-700">
                              {formatTime12H(b.startTime)}–{formatTime12H(b.endTime)}
                            </span>
                            <span>•</span>
                            <span className="truncate">{b.customerName} ({b.location})</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end">
                          <span className="text-xs font-black text-velvi-brownDark">
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md mt-0.5 ${
                              isSelf
                                ? "bg-velvi-gold/15 text-velvi-brownDark"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {isSelf ? "Self" : b.assignedIyerName}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* 3. Monthly Sacred Days Overview (Ultra-Compact Tabbed View) */}
          <div className="bg-[#fcfaf5] border border-amber-300/70 rounded-2xl p-3 shadow-xs space-y-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/60">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">🌾</span>
                <h4 className="font-black text-xs text-emerald-950">
                  இம்மாத விசேஷ தினங்கள்
                </h4>
                <span className="text-[10px] text-amber-900/70 font-semibold">
                  ({monthNamesTransTa[currentMonth]})
                </span>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.2 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                பஞ்சாங்கம்
              </span>
            </div>

            {/* Category Scrollable Horizontal Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: "muhurtham", label: "💍 முகூர்த்தம்", count: monthSacredSummary.muhurthamDays.length },
                { id: "pournami", label: "🌕 பௌர்ணமி", count: monthSacredSummary.pournamiDays.length },
                { id: "amavasai", label: "🌑 அமாவாசை", count: monthSacredSummary.amavasaiDays.length },
                { id: "pradosham", label: "🪔 பிரதோஷம்", count: monthSacredSummary.pradoshamDays.length },
                { id: "ekadashi", label: "🌿 ஏகாதசி", count: monthSacredSummary.ekadashiDays.length },
                { id: "chaturthi", label: "🐘 சதுர்த்தி", count: monthSacredSummary.chaturthiDays.length },
                { id: "sashti", label: "🚩 சஷ்டி", count: monthSacredSummary.sashtiDays.length },
                { id: "karthigai", label: "🔥 கார்த்திகை", count: monthSacredSummary.karthigaiDays.length },
                { id: "karinaal", label: "⚠️ கரிநாட்கள்", count: monthSacredSummary.karinaalDays.length },
                { id: "festivals", label: "⭐ விழாக்கள்", count: monthSacredSummary.festivalDays.length },
              ]
                .filter((cat) => cat.count > 0)
                .map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveSacredTab(cat.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition active:scale-95 shrink-0 flex items-center gap-1 border ${
                      activeSacredTab === cat.id
                        ? "bg-emerald-900 text-amber-300 border-emerald-950 shadow-2xs ring-1 ring-emerald-700"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className="text-[9.5px] opacity-80">({cat.count})</span>
                  </button>
                ))}
            </div>

            {/* Dates corresponding to selected sacred tab */}
            <div className="pt-1 flex flex-wrap gap-1.5 min-h-[30px] items-center">
              {activeSacredTab === "muhurtham" &&
                monthSacredSummary.muhurthamDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-emerald-800 text-white border-emerald-900"
                        : "bg-white text-emerald-950 border-emerald-300 hover:bg-emerald-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]}</span>
                    <span className="text-[9.5px] opacity-75 ml-1">({d.tamilMonth} {d.tamilDay} - {d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "pournami" &&
                monthSacredSummary.pournamiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-amber-800 text-white border-amber-900"
                        : "bg-white text-amber-950 border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                    <span className="text-[9.5px] opacity-75 ml-1">• {d.tamilMonth} {d.tamilDay} ({d.nakshatraNameTa})</span>
                  </button>
                ))}

              {activeSacredTab === "amavasai" &&
                monthSacredSummary.amavasaiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-slate-900 text-white border-slate-950"
                        : "bg-white text-slate-900 border-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                    <span className="text-[9.5px] opacity-75 ml-1">• {d.tamilMonth} {d.tamilDay} ({d.nakshatraNameTa})</span>
                  </button>
                ))}

              {activeSacredTab === "pradosham" &&
                monthSacredSummary.pradoshamDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-orange-800 text-white border-orange-900"
                        : "bg-white text-orange-950 border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "ekadashi" &&
                monthSacredSummary.ekadashiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-lime-800 text-white border-lime-900"
                        : "bg-white text-lime-950 border-lime-300 hover:bg-lime-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "chaturthi" &&
                monthSacredSummary.chaturthiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-purple-800 text-white border-purple-900"
                        : "bg-white text-purple-950 border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "sashti" &&
                monthSacredSummary.sashtiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-red-800 text-white border-red-900"
                        : "bg-white text-red-950 border-red-300 hover:bg-red-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "karthigai" &&
                monthSacredSummary.karthigaiDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-rose-800 text-white border-rose-900"
                        : "bg-white text-rose-950 border-rose-300 hover:bg-rose-50"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "karinaal" &&
                monthSacredSummary.karinaalDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border ${
                      selectedDate === d.dateStr
                        ? "bg-gray-800 text-white border-gray-900"
                        : "bg-white text-gray-900 border-gray-400 hover:bg-gray-100"
                    }`}
                  >
                    <span>{d.dayOfMonth} {monthNamesTransTa[d.monthIndex]} ({d.dayOfWeekTa})</span>
                  </button>
                ))}

              {activeSacredTab === "festivals" &&
                monthSacredSummary.festivalDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDate(d.dateStr)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition active:scale-95 border flex items-center gap-1.5 ${
                      selectedDate === d.dateStr
                        ? "bg-amber-800 text-white border-amber-900"
                        : "bg-white text-amber-950 border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    <span>⭐ {d.festivalName}</span>
                    <span className="text-[10px] text-slate-500">({d.dayOfMonth} {monthNamesTransTa[d.monthIndex]})</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}


      {/* 2. BOOKINGS ONLY VIEW (🪔 புக்கிங் மட்டும்) */}
      {/* ========================================================= */}
      {activeTab === "bookings" && (
        <div className="space-y-4 animate-in fade-in">
          {/* Monthly Bookings KPI Summary */}
          <div className="bg-gradient-to-br from-velvi-cream to-white rounded-2xl p-4 border border-velvi-gold/30 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-velvi-gold/15 border border-velvi-gold/30 flex items-center justify-center text-velvi-brownDark shrink-0 shadow-xs">
                <Flame className="w-5 h-5 text-velvi-goldDark" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-velvi-goldDark uppercase tracking-wider">
                  {monthNamesEn[currentMonth]} {currentYear} • {dualTamilMonthTa}
                </div>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-black text-velvi-brownDark">
                    {currentMonthBookings.length}{" "}
                    <span className="text-xs font-semibold text-velvi-brown/70">
                      {currentMonthBookings.length === 1 ? "பூஜை" : "பூஜைகள்"}
                    </span>
                  </span>
                  <span className="text-xs font-bold text-velvi-goldDark">
                    • ₹{currentMonthRevenue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/app/bookings/new"
              className="px-3.5 py-2 bg-velvi-gold hover:bg-velvi-goldDark text-velvi-brownDark font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>புதிய பூஜை</span>
            </Link>
          </div>

          {/* Iyer Filter Pill Bar */}
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-velvi-gold/20 shadow-xs">
              <button
                type="button"
                onClick={() => setFilterIyer("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterIyer === "ALL"
                    ? "bg-velvi-brown text-white shadow-xs"
                    : "text-velvi-brown/70 hover:text-velvi-brown hover:bg-velvi-cream/60"
                }`}
              >
                அனைத்தும் ({currentMonthBookings.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterIyer("SELF")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  filterIyer === "SELF"
                    ? "bg-velvi-brown text-white shadow-xs"
                    : "text-velvi-brown/70 hover:text-velvi-brown hover:bg-velvi-cream/60"
                }`}
              >
                எனது பூஜைகள் (Self)
              </button>
            </div>

            <div className="text-[11px] font-semibold text-velvi-brown/60">
              {bookedDatesGrouped.length} {bookedDatesGrouped.length === 1 ? "நாள்" : "நாட்கள்"}
            </div>
          </div>

          {/* Bookings List by Date */}
          {bookedDatesGrouped.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-velvi-gold/40 space-y-3.5 shadow-xs">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-velvi-cream flex items-center justify-center text-3xl shadow-inner border border-velvi-gold/20">
                🪔
              </div>
              <div>
                <h4 className="font-bold text-base text-velvi-brownDark">
                  இம்மாதத்தில் புக்கிங் ஏதுமில்லை
                </h4>
                <p className="text-xs text-velvi-brown/70 mt-1 max-w-xs mx-auto leading-relaxed">
                  {monthNamesEn[currentMonth]} {currentYear} ({dualTamilMonthTa}) மாதத்தில் இதுவரை பூஜைகள் எதுவும் பதிவு செய்யப்படவில்லை.
                </p>
              </div>
              <div className="pt-2">
                <Link
                  href="/app/bookings/new"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-2xl text-xs font-bold shadow-md active:scale-95 transition"
                >
                  <Plus className="w-4 h-4 text-velvi-gold" />
                  <span>முதல் பூஜையை பதிவு செய்</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {bookedDatesGrouped.map((group) => {
                const isDateToday = group.dateStr === todayStr;
                const dParts = group.dateStr.split("-").map(Number);
                const dObj = new Date(dParts[0], dParts[1] - 1, dParts[2]);
                const dayNameEn = dObj.toLocaleDateString("en-US", { weekday: "short" });
                const dayMonthEn = dObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div
                    key={group.dateStr}
                    className="bg-white rounded-2xl border border-velvi-gold/20 shadow-xs overflow-hidden transition-all hover:border-velvi-gold/40"
                  >
                    {/* Date Header Strip */}
                    <div
                      className={`px-3.5 py-2.5 flex items-center justify-between border-b ${
                        isDateToday
                          ? "bg-amber-500/10 border-amber-500/20"
                          : group.dayTamil.isMuhurtham
                          ? "bg-emerald-500/10 border-emerald-500/20"
                          : "bg-velvi-cream/70 border-velvi-gold/15"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                            isDateToday
                              ? "bg-amber-500 text-white"
                              : group.dayTamil.isMuhurtham
                              ? "bg-emerald-600 text-white"
                              : "bg-velvi-brown text-white"
                          }`}
                        >
                          <span className="text-[13px] leading-tight">{dParts[2]}</span>
                          <span className="text-[9px] uppercase leading-none opacity-80">{dayNameEn}</span>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs text-velvi-brownDark">
                              {dayMonthEn} {dParts[0]}
                            </span>
                            <span className="text-[11px] font-bold text-velvi-goldDark">
                              • {group.dayTamil.tamilMonth} {group.dayTamil.tamilDay} ({group.dayTamil.dayOfWeekTa})
                            </span>
                            {isDateToday && (
                              <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider">
                                Today
                              </span>
                            )}
                            {group.dayTamil.isMuhurtham && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[9px] font-bold border border-emerald-300">
                                💍 சுப முகூர்த்தம்
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-velvi-brown/65 font-medium flex items-center gap-2 mt-0.5">
                            <span>திதி: {group.dayTamil.tithiTa}</span>
                            <span>•</span>
                            <span>நட்சத்திரம்: {group.dayTamil.nakshatraNameTa}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-velvi-brownDark">
                          ₹{group.dayRevenue.toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] font-semibold text-velvi-goldDark">
                          {group.bookings.length} {group.bookings.length === 1 ? "பூஜை" : "பூஜைகள்"}
                        </div>
                      </div>
                    </div>

                    {/* Bookings under this date */}
                    <div className="divide-y divide-velvi-gold/10 p-2 space-y-1.5">
                      {group.bookings.map((b) => {
                        const isSelf =
                          !b.assignedIyerName ||
                          b.assignedIyerName.toLowerCase().includes("self") ||
                          b.assignedIyerName.toLowerCase().includes("maniraja");

                        return (
                          <Link
                            key={b.id}
                            href={`/app/bookings/${b.id}`}
                            className="block p-3 rounded-xl hover:bg-velvi-cream/50 active:bg-velvi-cream border border-transparent hover:border-velvi-gold/20 transition group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-sm text-velvi-brownDark group-hover:text-velvi-goldDark transition">
                                    {b.poojaEnglishName}
                                  </span>
                                  {b.poojaTamilName && (
                                    <span className="text-xs text-velvi-goldDark font-semibold">
                                      ({b.poojaTamilName})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-velvi-brown/75 font-semibold">
                                  <Clock className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                                  <span>
                                    {formatTime12H(b.startTime)} – {formatTime12H(b.endTime)}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="font-extrabold text-sm text-velvi-brownDark">
                                  ₹{b.totalAmount.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            <div className="mt-2.5 pt-2 border-t border-velvi-gold/10 flex items-center justify-between text-xs text-velvi-brown/70 flex-wrap gap-1.5">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                                <span className="font-medium">{b.customerName}</span>
                                <span>•</span>
                                <span>{b.location}</span>
                              </span>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    isSelf
                                      ? "bg-velvi-gold/15 text-velvi-brownDark border border-velvi-gold/30"
                                      : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                                >
                                  {isSelf ? "🪔 Self" : `👥 ${b.assignedIyerName}`}
                                </span>
                                <span className="text-[11px] font-bold text-velvi-brown group-hover:translate-x-0.5 transition">
                                  விவரம் →
                                </span>
                              </div>
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

      {/* Month & Year Quick Picker Modal */}
      {showMonthYearPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowMonthYearPicker(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 border border-emerald-950/20 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex items-center justify-center font-bold shadow-xs">
                  <CalendarDays className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                    மாதம் &amp; வருடம் தேர்வு
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    விரும்பிய மாதம் மற்றும் வருடத்திற்கு நேரடியாக செல்லலாம்
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600 flex items-center justify-center transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Year Selector Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 tracking-wide">
                  வருடம் (Year)
                </label>
                <span className="text-[11px] font-bold text-emerald-800">
                  தேர்வு: {pickerYear}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setPickerYear(yr)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition active:scale-95 shrink-0 ${
                      pickerYear === yr
                        ? "bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-600"
                        : "bg-gray-100 hover:bg-gray-200/80 text-slate-700 font-bold"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* 12 Months Grid */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 tracking-wide">
                மாதம் (Month) – {pickerYear}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MONTH_PICKER_DATA.map((m, idx) => {
                  const isSelectedMonth = currentYear === pickerYear && currentMonth === idx;
                  const isCurrentRealMonth =
                    new Date().getFullYear() === pickerYear && new Date().getMonth() === idx;

                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`p-2.5 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between relative group ${
                        isSelectedMonth
                          ? "bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 border-emerald-600 ring-2 ring-emerald-600 shadow-xs"
                          : "bg-gray-50/70 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                    >
                      {/* Top: English Abbr & Indicator */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-black text-xs sm:text-sm tracking-wide uppercase ${
                            isSelectedMonth ? "text-emerald-950" : "text-slate-800"
                          }`}
                        >
                          {m.en}
                        </span>
                        {isCurrentRealMonth && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 shadow-xs"
                            title="Current Month"
                          />
                        )}
                      </div>

                      {/* Transliterated Tamil Month */}
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 truncate mb-1">
                        {m.ta}
                      </div>

                      {/* Tamil Solar Month Badge */}
                      <div className="mt-0.5">
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold inline-block leading-tight ${
                            isSelectedMonth
                              ? "bg-emerald-800 text-white"
                              : "bg-emerald-100/80 text-emerald-900"
                          }`}
                        >
                          {m.tamilSolar}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePickerJumpToday}
                className="flex-1 py-2.5 px-3 bg-amber-100 hover:bg-amber-200/80 text-amber-950 font-bold rounded-xl text-xs transition active:scale-95 border border-amber-300/60"
              >
                இன்றைய தேதி (Current Month)
              </button>
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95"
              >
                மூடுக (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
