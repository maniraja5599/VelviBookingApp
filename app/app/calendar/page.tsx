"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { getTamilDate, TAMIL_WEEKDAYS } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
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
  Info,
} from "lucide-react";

export default function CalendarPage() {
  const { currentBusiness, currentUser } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState<"month" | "day" | "agenda">("month");
  const [showPanchangam, setShowPanchangam] = useState<boolean>(true);

  // Month navigation
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const allBookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  // Date info for selected date
  const selectedTamilInfo = getTamilDate(selectedDate);
  const selectedDayBookings = allBookings.filter((b) => b.date === selectedDate);

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

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="space-y-3 pb-6 animate-in fade-in duration-200">
      {/* 1. Header & View Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">
            {monthNamesEn[currentMonth]} {currentYear}
          </h2>
          <p className="text-xs text-velvi-goldDark font-semibold">
            {selectedTamilInfo.tamilMonth} - {selectedTamilInfo.tamilYear}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-velvi-creamDark/60 p-0.5 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setViewMode("month")}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === "month"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setViewMode("day")}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === "day"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode("agenda")}
            className={`px-2.5 py-1 rounded-lg transition ${
              viewMode === "agenda"
                ? "bg-white text-velvi-brownDark shadow-sm font-bold"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Agenda
          </button>
        </div>
      </div>

      {/* 2. Month Calendar View */}
      {viewMode === "month" && (
        <div className="bg-white rounded-2xl p-3 border border-velvi-gold/20 shadow-sm">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-velvi-creamDark">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-velvi-cream rounded-lg text-velvi-brown transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-velvi-brown">
              {monthNamesEn[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-velvi-cream rounded-lg text-velvi-brown transition"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Weekday headers in English + Tamil */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-velvi-brown/70 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
              <div key={day} className="py-1">
                <div>{day}</div>
                <div className="text-[9px] text-velvi-goldDark">
                  {TAMIL_WEEKDAYS[i].ta.slice(0, 1)}
                </div>
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty padding cells */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="h-12 p-1 opacity-20" />
            ))}

            {/* Actual day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
              const dayTamil = getTamilDate(dateStr);
              const dayBookings = allBookings.filter((b) => b.date === dateStr);
              const isSelected = selectedDate === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`h-13 p-1 rounded-xl flex flex-col items-center justify-between transition border relative ${
                    isSelected
                      ? "bg-velvi-brown text-white border-velvi-gold font-bold shadow-md scale-105 z-10"
                      : "bg-velvi-cream/40 hover:bg-velvi-cream border-transparent text-velvi-brownDark"
                  }`}
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-xs font-bold leading-tight">{dayNum}</span>
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
                        className={`text-[8px] px-1 py-0.2 rounded-full font-bold inline-block leading-none ${
                          isSelected
                            ? "bg-velvi-gold text-velvi-brownDark"
                            : "bg-velvi-sacredGreen/20 text-velvi-sacredGreen"
                        }`}
                      >
                        {dayBookings.length}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Selected Day Breakdown Card */}
      <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-2xl p-3.5 border border-velvi-gold/30 shadow-sacred">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-velvi-brownDark">
              {selectedTamilInfo.formattedDualDate}
            </h3>
            <p className="text-xs text-velvi-goldDark font-semibold">
              {selectedTamilInfo.dayOfWeekEn} • {selectedTamilInfo.dayOfWeekTa}
            </p>
          </div>

          <Link
            href={`/app/bookings/new?date=${selectedDate}`}
            className="p-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
          >
            <Plus className="w-4 h-4 text-velvi-goldLight" />
            <span>Book</span>
          </Link>
        </div>

        {/* Panchangam Bar (Expandable) */}
        <div className="mt-3 pt-2 border-t border-velvi-gold/20">
          <div className="flex items-center justify-between text-xs text-velvi-brown/80 mb-1">
            <span className="font-bold flex items-center gap-1 text-velvi-brown">
              <Sun className="w-3.5 h-3.5 text-velvi-gold" /> பஞ்சாங்கம் (Panchangam)
            </span>
            <button
              onClick={() => setShowPanchangam(!showPanchangam)}
              className="text-[10px] text-velvi-goldDark font-semibold hover:underline"
            >
              {showPanchangam ? "Hide" : "Show"}
            </button>
          </div>

          {showPanchangam && (
            <div className="grid grid-cols-2 gap-2 mt-2 text-[11px] bg-white/80 p-2.5 rounded-xl border border-velvi-gold/15">
              <div>
                <span className="text-velvi-brown/60">திதி:</span>{" "}
                <span className="font-semibold text-velvi-brownDark">
                  {selectedTamilInfo.tithi.split(" ")[0]}
                </span>
              </div>
              <div>
                <span className="text-velvi-brown/60">நட்சத்திரம்:</span>{" "}
                <span className="font-semibold text-velvi-brownDark">
                  {selectedTamilInfo.nakshatra.split(" ")[0]}
                </span>
              </div>
              <div>
                <span className="text-velvi-brown/60">ராகு காலம்:</span>{" "}
                <span className="font-semibold text-velvi-maroon">
                  {selectedTamilInfo.rahuKalam}
                </span>
              </div>
              <div>
                <span className="text-velvi-brown/60">எமகண்டம்:</span>{" "}
                <span className="font-semibold text-velvi-brownDark">
                  {selectedTamilInfo.yamagandam}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Bookings for Selected Day */}
      <div className="space-y-2">
        <h4 className="font-bold text-xs text-velvi-brown/80 tracking-wide uppercase">
          Bookings for this day ({selectedDayBookings.length})
        </h4>

        {selectedDayBookings.length === 0 ? (
          <div className="bg-white rounded-xl p-5 text-center border border-dashed border-velvi-gold/30">
            <p className="text-xs text-velvi-brown/60">
              No poojas or homams scheduled on this date.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayBookings.map((b) => {
              const isSelf =
                b.assignedIyerId === ownerMember?.id ||
                b.assignedIyerName === currentUser?.name ||
                b.assignedIyerName === "Ravi Iyer";

              return (
                <Link
                  key={b.id}
                  href={`/app/bookings/${b.id}`}
                  className="block bg-white rounded-xl p-3 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/60 transition"
                >
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-velvi-goldDark bg-velvi-gold/10 px-2 py-0.5 rounded">
                        {b.startTime} - {b.endTime}
                      </span>
                      {isSelf ? (
                        <span className="text-[9px] font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded-full border border-velvi-gold/30">
                          🪔 Self
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          👥 {b.assignedIyerName}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-velvi-brownDark">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-velvi-brownDark mt-1.5">
                    {b.poojaEnglishName}
                  </h5>
                  <div className="text-xs text-velvi-brown/70 flex items-center justify-between mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-velvi-gold" />
                      {b.customerName} • {b.location}
                    </span>
                    <span className="font-medium text-velvi-brown text-[11px]">
                      {isSelf ? "Self" : b.assignedIyerName}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
