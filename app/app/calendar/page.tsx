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

  // Calendar month grid generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0-6

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
          <div className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm">
            {/* Month Navigation Row */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-velvi-creamDark">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-velvi-cream rounded-xl text-velvi-brown transition"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <span className="text-sm font-bold text-velvi-brownDark">
                  {monthNamesEn[currentMonth]} {currentYear}
                </span>
                <span className="text-[11px] text-velvi-goldDark block font-semibold">
                  {(() => {
                    const startInfo = getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`);
                    const endInfo = getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`);
                    return startInfo.tamilMonth === endInfo.tamilMonth
                      ? `${startInfo.tamilMonth} மாதம்`
                      : `${startInfo.tamilMonth} / ${endInfo.tamilMonth} மாதம்`;
                  })()}
                </span>
              </div>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-velvi-cream rounded-xl text-velvi-brown transition"
                aria-label="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Weekday headers in English */}
            <div className="grid grid-cols-7 text-center text-xs font-bold text-velvi-brown/70 mb-2 py-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                <div key={day} className={`${i === 0 ? "text-amber-800" : ""}`}>
                  {day}
                </div>
              ))}
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Empty padding cells */}
              {Array.from({ length: firstDayIndex }).map((_, i) => (
                <div key={`empty-${i}`} className="h-13 p-1 opacity-20" />
              ))}

              {/* Actual day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayTamil = getTamilDate(dateStr);
                const dayBookings = filteredBookings.filter((b) => b.date === dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-14 p-1 rounded-xl flex flex-col items-center justify-between transition border relative ${
                      isSelected
                        ? "bg-velvi-brown text-white border-velvi-gold font-bold shadow-md scale-105 z-10"
                        : isToday
                        ? "bg-velvi-gold/15 border-velvi-gold/50 text-velvi-brownDark font-bold"
                        : "bg-velvi-cream/30 hover:bg-velvi-cream border-transparent text-velvi-brownDark"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full px-0.5">
                      <span className="text-xs font-bold leading-tight flex items-center gap-0.5">
                        {dayNum}
                        {isToday && (
                          <span
                            className={`w-1.5 h-1.5 rounded-full inline-block ${
                              isSelected ? "bg-velvi-goldLight" : "bg-amber-600"
                            }`}
                          />
                        )}
                      </span>
                      <span
                        className={`text-[9px] leading-tight font-semibold ${
                          isSelected ? "text-velvi-goldLight" : "text-velvi-goldDark"
                        }`}
                      >
                        {dayTamil.tamilDay}
                      </span>
                    </div>

                    {dayBookings.length > 0 && (
                      <div className="w-full mt-0.5">
                        <span
                          className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold inline-block leading-none ${
                            isSelected
                              ? "bg-velvi-gold text-velvi-brownDark"
                              : "bg-velvi-sacredGreen text-white shadow-xs"
                          }`}
                        >
                          {dayBookings.length} {dayBookings.length === 1 ? "seva" : "sevas"}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Day Breakdown Card */}
          <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-2xl p-4 border border-velvi-gold/30 shadow-sacred space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-velvi-gold" />
                  <span>{selectedTamilInfo.formattedDualDate}</span>
                </h3>
                <p className="text-xs text-velvi-goldDark font-semibold mt-0.5">
                  {selectedTamilInfo.dayOfWeekEn} • {selectedTamilInfo.dayOfWeekTa} ({selectedTamilInfo.tamilYear} வருடம்)
                </p>
              </div>

              <Link
                href={`/app/bookings/new?date=${selectedDate}`}
                className="px-3.5 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition active:scale-95 shrink-0"
              >
                <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
                <span>Book Pooja</span>
              </Link>
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

            <button
              onClick={() => stepDay(1)}
              className="p-1.5 hover:bg-velvi-cream rounded-xl text-velvi-brown transition flex items-center gap-1 text-xs font-semibold"
            >
              <span>Next Day</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

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
                      <span className="text-[11px] text-velvi-brown/50">
                        {slot.sub} • Available
                      </span>
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
