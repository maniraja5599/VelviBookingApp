"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Flame,
  MessageCircle,
  Sparkles,
  BarChart3,
  TrendingUp,
  CreditCard,
  Users,
  CheckCircle2,
  FileSpreadsheet,
  Calendar,
  Layers,
  Wallet,
  Plus,
} from "lucide-react";

export default function HomeDashboardPage() {
  const { currentUser, currentBusiness, subscription } = useAuth();
  const { t } = useLanguage();

  // Current Tamil Date (Timezone-safe)
  const todayLocalDateStr = getLocalDateString();
  const todayInfo = getTamilDate(todayLocalDateStr);

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const bookings = useMemo(() => db.getBookings(businessId), [businessId]);
  const members = useMemo(() => db.getMembers(businessId), [businessId]);
  const ownerMember = useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  // Compute overall metrics
  const todayBookings = useMemo(() => bookings.filter((b) => b.date === todayInfo.dateStr), [bookings, todayInfo.dateStr]);
  const pendingAmount = useMemo(() => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0), [bookings]);
  const upcomingCount = useMemo(() => bookings.filter((b) => b.date >= todayInfo.dateStr).length, [bookings, todayInfo.dateStr]);

  // Cumulative lifetime earnings calculations across all bookings
  const cumulativeTotalBilled = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    [bookings]
  );
  const cumulativeCollected = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0),
    [bookings]
  );
  const cumulativePending = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0),
    [bookings]
  );
  const cumulativeRate =
    cumulativeTotalBilled > 0
      ? Math.round((cumulativeCollected / cumulativeTotalBilled) * 100)
      : 100;

  // Selected Month for Month-wise deep dive (defaults to current month)
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(todayLocalDateStr.substring(0, 7)); // e.g. "2026-09"

  // All unique month keys from bookings and today, sorted
  const allMonthKeys = useMemo(() => {
    const set = new Set<string>();
    set.add(todayLocalDateStr.substring(0, 7));
    bookings.forEach((b) => {
      if (b.date) set.add(b.date.substring(0, 7));
    });
    return Array.from(set).sort();
  }, [bookings, todayLocalDateStr]);

  // Detailed month-by-month earnings and payment summary
  const allMonthsSummary = useMemo(() => {
    return allMonthKeys.map((mKey) => {
      const mBookings = bookings.filter((b) => b.date && b.date.startsWith(mKey));
      const billed = mBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      const collected = mBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
      const pending = mBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
      const rate = billed > 0 ? Math.round((collected / billed) * 100) : 100;
      const dateInfo = getTamilDate(`${mKey}-01`);
      return {
        monthKey: mKey,
        englishMonth: `${dateInfo.monthNameEn} ${dateInfo.year}`,
        tamilMonth: dateInfo.tamilMonth,
        tamilYear: dateInfo.tamilYear,
        bookingCount: mBookings.length,
        billed,
        collected,
        pending,
        rate,
      };
    });
  }, [allMonthKeys, bookings]);

  // Selected month calculations
  const selectedMonthBookings = useMemo(() => {
    return bookings.filter((b) => b.date.startsWith(selectedMonthKey));
  }, [bookings, selectedMonthKey]);

  const monthTotalBilled = selectedMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const monthCollected = selectedMonthBookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0);
  const monthPending = selectedMonthBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
  const collectionRate = monthTotalBilled > 0 ? Math.round((monthCollected / monthTotalBilled) * 100) : 100;

  const selectedMonthTamil = getTamilDate(`${selectedMonthKey}-01`);

  const handleMonthChange = (delta: number) => {
    const [yStr, mStr] = selectedMonthKey.split("-");
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10) - 1; // 0-11
    const d = new Date(y, m + delta, 1);
    const newY = d.getFullYear();
    const newM = String(d.getMonth() + 1).padStart(2, "0");
    setSelectedMonthKey(`${newY}-${newM}`);
  };

  // Earnings View Mode: "month" or "all"
  const [earningsViewMode, setEarningsViewMode] = useState<"month" | "all">("month");

  const activeBilled = earningsViewMode === "month" ? monthTotalBilled : cumulativeTotalBilled;
  const activeCollected = earningsViewMode === "month" ? monthCollected : cumulativeCollected;
  const activePending = earningsViewMode === "month" ? monthPending : cumulativePending;
  const activeRate = earningsViewMode === "month" ? collectionRate : cumulativeRate;
  const activeBookingsCount = earningsViewMode === "month" ? selectedMonthBookings.length : bookings.length;

  // Active revenue by pooja distribution
  const activePoojas = useMemo(() => {
    const targetBookings = earningsViewMode === "month" ? selectedMonthBookings : bookings;
    const map = new Map<string, { name: string; count: number; amount: number }>();
    targetBookings.forEach((b) => {
      const key = b.poojaEnglishName || "Special Pooja";
      const existing = map.get(key) || { name: key, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += b.totalAmount || 0;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    const total = targetBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 1;
    return list.map((p) => ({
      ...p,
      percent: Math.round((p.amount / total) * 100),
    }));
  }, [earningsViewMode, selectedMonthBookings, bookings]);

  // Active team allocation
  const activeTeamAllocation = useMemo(() => {
    const targetBookings = earningsViewMode === "month" ? selectedMonthBookings : bookings;
    const map = new Map<string, { name: string; count: number }>();
    targetBookings.forEach((b) => {
      const key = b.assignedIyerName || "Self";
      const existing = map.get(key) || { name: key, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [earningsViewMode, selectedMonthBookings, bookings]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Sacred Warm Header Greeting & Tamil Date Card (Styled matching mockup) */}
      <div className="bg-gradient-to-b from-[#fbf8f0] via-[#fffdfa] to-white rounded-3xl p-4 sm:p-5 border border-amber-200/80 shadow-xs relative overflow-hidden">
        {/* Top row: Year & Vanakkam with Tamil Day Badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="text-xs sm:text-[13px] text-amber-900 font-bold tracking-wide flex items-center gap-1.5">
              <span>📍</span>
              <span>{todayInfo.tamilYear} வருடம்</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight mt-1 leading-none">
              Vanakkam
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 font-medium mt-1">
              {todayInfo.dayOfWeekEn}, {todayInfo.dayOfMonth} {todayInfo.monthNameEn} {todayInfo.year}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
              {todayInfo.tamilMonth} {todayInfo.tamilDay}, {todayInfo.tamilYear} வருடம்
            </p>
          </div>

          {/* Right Aavani 28 Day Pill Card */}
          <div className="shrink-0 bg-white rounded-2xl p-2.5 sm:p-3 border border-amber-200/90 shadow-2xs text-center min-w-[82px] sm:min-w-[96px]">
            <span className="block text-[11px] sm:text-xs font-semibold text-slate-500 capitalize">
              {todayInfo.tamilMonthEn || todayInfo.tamilMonth}
            </span>
            <span className="block text-2xl sm:text-3xl font-black text-emerald-900 leading-tight my-0.5">
              {todayInfo.tamilDay}
            </span>
            <span className="block text-[10px] sm:text-[11px] font-semibold text-slate-500">
              Day
            </span>
          </div>
        </div>

        {/* Auspicious Timings: Nalla Neram & Gowri Nalla Neram */}
        <div className="mt-4 pt-3 border-t border-amber-200/60 space-y-2.5">
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            {/* Nalla Neram */}
            <div className="bg-[#f2faf5] rounded-2xl p-3 border border-emerald-200/70 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs sm:text-[13px] font-black text-emerald-950">
                  நல்ல நேரம்
                </span>
                <span className="text-xs">🍃</span>
              </div>
              <div className="text-[10.5px] sm:text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-emerald-900">காலை :</span>
                  <span className="font-bold text-slate-900 text-right">{formatTimeRangeTo12H(todayInfo.nallaNeramMorning)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-emerald-900">மாலை :</span>
                  <span className="font-bold text-slate-900 text-right">{formatTimeRangeTo12H(todayInfo.nallaNeramEvening)}</span>
                </div>
              </div>
            </div>

            {/* Gowri Nalla Neram */}
            <div className="bg-[#fff9f2] rounded-2xl p-3 border border-amber-200/80 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs sm:text-[13px] font-black text-amber-950">
                  கௌரி நல்ல நேரம்
                </span>
                <span className="text-xs">🔥</span>
              </div>
              <div className="text-[10.5px] sm:text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-amber-900">காலை :</span>
                  <span className="font-bold text-slate-900 text-right">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramMorning)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-semibold text-amber-900">மாலை :</span>
                  <span className="font-bold text-slate-900 text-right">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramEvening)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inauspicious Timings: Rahu Kalam & Emakandam */}
          <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
            <div className="bg-[#fdf3f4] px-3 py-2.5 rounded-2xl border border-rose-200/80 flex flex-col justify-center shadow-2xs">
              <span className="text-xs sm:text-[13px] font-black text-rose-800 mb-0.5">
                ராகு காலம்
              </span>
              <span className="text-[11px] sm:text-xs font-black text-slate-900">
                {formatTimeRangeTo12H(todayInfo.rahuKalam)}
              </span>
            </div>

            <div className="bg-[#f4f4fe] px-3 py-2.5 rounded-2xl border border-indigo-200/80 flex flex-col justify-center shadow-2xs">
              <span className="text-xs sm:text-[13px] font-black text-indigo-900 mb-0.5">
                எமகண்டம்
              </span>
              <span className="text-[11px] sm:text-xs font-black text-slate-900">
                {formatTimeRangeTo12H(todayInfo.yamagandam)}
              </span>
            </div>
          </div>
        </div>

        {/* Trial Countdown Badge (if in trial) */}
        {subscription?.status === "TRIAL" && (
          <div className="mt-3.5 bg-amber-100/80 border border-amber-300 rounded-2xl px-3 py-1.5 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-amber-900 flex items-center gap-1.5">
              <span>✨</span> 30 Days Free Trial Active
            </span>
            <Link
              href="/app/subscription"
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 hover:underline"
            >
              View Plan →
            </Link>
          </div>
        )}
      </div>



      {/* 2. KPI Stat Cards (Matching mockup with Dual English + Tamil Subtitles) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {/* Today's Bookings */}
        <div className="bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs">📅</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full">Today</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {todayBookings.length}
            </div>
            <div className="text-[11px] font-bold text-slate-800 leading-tight mt-1">
              Today's Bookings
            </div>
            <div className="text-[10px] font-medium text-slate-400 leading-tight">
              இன்றைய பதிவு
            </div>
          </div>
        </div>

        {/* Pending Due */}
        <div className="bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-xs">🪙</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-full">Due</span>
          </div>
          <div className="mt-3 min-w-0">
            <div className="text-lg sm:text-2xl font-black text-slate-900 leading-none truncate">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[11px] font-bold text-slate-800 leading-tight mt-1 truncate">
              Pending Due
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-medium text-slate-400 leading-tight tracking-tight">
              நிலுவைத் தொகை
            </div>
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-3xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs">🕒</span>
            <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-full">Next</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-none">
              {upcomingCount}
            </div>
            <div className="text-[11px] font-bold text-slate-800 leading-tight mt-1">
              Upcoming Bookings
            </div>
            <div className="text-[10px] font-medium text-slate-400 leading-tight">
              வரவிருக்கும் பதிவு
            </div>
          </div>
        </div>
      </div>

      {/* 3. Earnings & Cashflow Hub */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* Header with Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
              <Wallet className="w-4.5 h-4.5 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Earnings &amp; Cashflow
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {earningsViewMode === "month"
                  ? `${selectedMonthTamil.monthNameEn} ${selectedMonthTamil.year} (${selectedMonthTamil.tamilMonth} மாதம்)`
                  : "All-Time Cumulative Collections"}
              </p>
            </div>
          </div>

          {/* Period Toggle Pills */}
          <div className="bg-slate-100 p-0.5 rounded-xl border border-slate-200 flex items-center text-xs font-bold">
            <button
              onClick={() => setEarningsViewMode("month")}
              className={`px-3 py-1 rounded-lg transition ${
                earningsViewMode === "month"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => setEarningsViewMode("all")}
              className={`px-3 py-1 rounded-lg transition ${
                earningsViewMode === "all"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All-Time
            </button>
          </div>
        </div>

        {/* Main Earnings Card */}
        <div className="bg-gradient-to-br from-emerald-50/40 via-white to-amber-50/40 p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3.5">
          {/* Top Row: Total Collected Highlight & Realization Badge */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                {earningsViewMode === "month" ? "Month Dakshina Collected" : "Total Dakshina Collected"}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-0.5 flex items-baseline gap-1.5">
                <span>₹{activeCollected.toLocaleString("en-IN")}</span>
                <span className="text-xs font-bold text-slate-500">
                  / ₹{activeBilled.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                {activeRate}% Realized
              </span>
              <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                {activeBookingsCount} {activeBookingsCount === 1 ? "Pooja" : "Poojas"}
              </span>
            </div>
          </div>

          {/* Progress Bar with Dual Labels */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, activeRate)}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-emerald-800">
                Collected: ₹{activeCollected.toLocaleString("en-IN")}
              </span>
              <span className="text-rose-700">
                Pending Due: ₹{activePending.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* 3 Metric Breakdown Boxes */}
          <div className="grid grid-cols-3 gap-2 text-center pt-1">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Total Billed</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                ₹{activeBilled.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 block font-medium">Net Received</span>
              <span className="text-xs sm:text-sm font-black text-emerald-900 block mt-0.5">
                ₹{activeCollected.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-rose-50/90 rounded-xl border border-rose-200 shadow-2xs">
              <span className="text-[10px] text-rose-800 block font-medium">Pending Due</span>
              <span className="text-xs sm:text-sm font-black text-rose-950 block mt-0.5">
                ₹{activePending.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Pending Due Follow-up Action Banner */}
          {activePending > 0 && (
            <div className="bg-amber-50 border border-amber-200/90 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <span>⚠️</span>
                <span>₹{activePending.toLocaleString("en-IN")} pending collection</span>
              </div>
              <Link
                href="/app/payments"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] shadow-2xs transition"
              >
                Collect Due →
              </Link>
            </div>
          )}
        </div>

        {/* Month Selector Carousel / Slider (When in month view) */}
        {earningsViewMode === "month" && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                <span>Select Month</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMonthChange(-1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-bold text-slate-700 px-1.5">
                  {selectedMonthTamil.monthNameEn} {selectedMonthTamil.year}
                </span>
                <button
                  onClick={() => handleMonthChange(1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Month Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {allMonthsSummary.map((m) => {
                const isSelected = m.monthKey === selectedMonthKey;
                return (
                  <button
                    key={m.monthKey}
                    onClick={() => setSelectedMonthKey(m.monthKey)}
                    className={`px-3 py-1.5 rounded-xl whitespace-nowrap text-xs transition shrink-0 flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-emerald-900 text-white font-extrabold shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium"
                    }`}
                  >
                    <span>{m.englishMonth}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? "bg-amber-400/20 text-amber-200" : "bg-slate-200 text-slate-700"
                    }`}>
                      {m.bookingCount}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Revenue Contribution by Pooja (Visual Progress Bars) */}
        <div className="space-y-2.5 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-600" />
              <span>Revenue by Pooja Ceremony</span>
            </span>
            <span className="text-[10.5px] text-slate-500 font-medium">
              {activePoojas.length} {activePoojas.length === 1 ? "Ceremony" : "Ceremonies"}
            </span>
          </div>

          {activePoojas.length === 0 ? (
            <p className="text-xs text-slate-400 p-2 bg-slate-50 rounded-xl text-center">
              No ceremony bookings recorded for this period.
            </p>
          ) : (
            <div className="space-y-2">
              {activePoojas.map((p, idx) => (
                <div key={p.name} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-900 truncate max-w-[180px]">
                        {p.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200/70 text-slate-700 rounded-md shrink-0">
                        {p.count} {p.count === 1 ? "seva" : "sevas"}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-black text-slate-900 text-xs">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[10px] text-emerald-800 font-bold ml-1.5">
                        ({p.percent}%)
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden flex">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        idx === 0
                          ? "bg-emerald-600"
                          : idx === 1
                          ? "bg-amber-500"
                          : "bg-indigo-500"
                      }`}
                      style={{ width: `${Math.min(100, p.percent)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team & Seva Contribution Breakdown */}
        {activeTeamAllocation.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-700" />
              <span>Team &amp; Iyer Seva Contribution</span>
            </span>
            <div className="grid grid-cols-2 gap-2">
              {activeTeamAllocation.map((m) => (
                <div key={m.name} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 truncate max-w-[100px]">
                    {m.name}
                  </span>
                  <span className="text-[10.5px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg">
                    {m.count} {m.count === 1 ? "seva" : "sevas"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Report Shortcuts Row */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <Link
            href="/app/payments"
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Receipts &amp; Ledger →</span>
          </Link>
          <Link
            href="/app/bookings"
            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:underline"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>All Bookings Schedule →</span>
          </Link>
        </div>
      </div>

      {/* 4. Today's Booking Schedule */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-amber-600" />
            <span>Today's Schedule ({todayBookings.length})</span>
          </h3>
          <Link
            href="/app/calendar"
            className="text-xs text-emerald-800 font-bold hover:underline"
          >
            Full Calendar →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border border-dashed border-slate-200 shadow-2xs">
            <div className="text-3xl mb-2">🪔</div>
            <h4 className="font-bold text-sm text-slate-800">No Ceremonies Scheduled Today</h4>
            <p className="text-xs text-slate-500 mt-1">
              No ceremonies scheduled for today. View upcoming poojas via Calendar or Bookings.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/app/calendar"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                Calendar
              </Link>
              <Link
                href="/app/bookings"
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition"
              >
                Bookings
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {todayBookings.map((b) => {
              const isSelf =
                b.assignedIyerId === ownerMember?.id ||
                b.assignedIyerName === currentUser?.name ||
                b.assignedIyerName === "Ravi Iyer";

              return (
                <div
                  key={b.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-extrabold text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-200">
                          {b.startTime}
                        </span>
                        {isSelf ? (
                          <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                            <span>🪔</span> Self
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <span>👥</span> {b.assignedIyerName || "Team"}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-black text-base text-slate-900 mt-2">
                        {b.poojaEnglishName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </span>
                      <div className="text-[10.5px] font-bold mt-0.5">
                        {b.paymentStatus === "PAID" ? (
                          <span className="text-emerald-700">Paid ✅</span>
                        ) : (
                          <span className="text-rose-700">Due: ₹{b.balanceAmount}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-700">
                        {b.customerName} • {b.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.customerMobile && (
                        <a
                          href={`https://wa.me/${b.customerMobile.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition border border-emerald-200"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition"
                        title="View Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
