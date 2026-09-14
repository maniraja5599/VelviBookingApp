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
  const bookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  // Compute overall metrics
  const todayBookings = bookings.filter((b) => b.date === todayInfo.dateStr);
  const pendingAmount = bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
  const upcomingCount = bookings.filter((b) => b.date >= todayInfo.dateStr).length;

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

  // Pooja distribution in selected month
  const poojaDistributionMap = new Map<string, { name: string; count: number; amount: number }>();
  selectedMonthBookings.forEach((b) => {
    const key = b.poojaEnglishName || "Special Pooja";
    const existing = poojaDistributionMap.get(key) || { name: key, count: 0, amount: 0 };
    existing.count += 1;
    existing.amount += b.totalAmount;
    poojaDistributionMap.set(key, existing);
  });
  const poojaDistribution = Array.from(poojaDistributionMap.values()).sort((a, b) => b.count - a.count);

  // Team allocation in selected month
  const memberAllocationMap = new Map<string, { name: string; count: number }>();
  selectedMonthBookings.forEach((b) => {
    const key = b.assignedIyerName || "Self";
    const existing = memberAllocationMap.get(key) || { name: key, count: 0 };
    existing.count += 1;
    memberAllocationMap.set(key, existing);
  });
  const memberAllocation = Array.from(memberAllocationMap.values()).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* 1. Header Greeting & Tamil Date Card */}
      <div className="bg-gradient-to-br from-[#0c2b1a] via-[#123e24] to-[#0a2315] text-white rounded-3xl p-4 sm:p-5 shadow-lg border border-emerald-700/30 relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <div className="text-[11px] text-amber-300/90 font-bold tracking-wider uppercase flex items-center gap-1.5">
              <span>🪔</span>
              <span>{todayInfo.tamilYear} வருடம்</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
              {(() => {
                const displayName =
                  (currentBusiness?.iyerName && currentBusiness.iyerName.trim()) ||
                  (currentUser?.name && currentUser.name !== "Ravi Iyer" && currentUser.name !== "New Iyer" && currentUser.name.trim()) ||
                  "";
                return displayName ? `🙏 Vanakkam, ${displayName}` : `🙏 Vanakkam`;
              })()}
            </h2>
            <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
              {todayInfo.formattedFullDay}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="inline-block px-3 py-1 bg-amber-400/20 text-amber-200 rounded-xl text-xs sm:text-sm font-extrabold border border-amber-400/30 shadow-xs">
              {todayInfo.tamilMonth} {todayInfo.tamilDay}
            </span>
          </div>
        </div>

        {/* Auspicious Timings: Nalla Neram & Gowri Nalla Neram */}
        <div className="mt-3.5 pt-3 border-t border-emerald-800/60 space-y-2 relative z-10">
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-emerald-950/70 backdrop-blur-xs px-3 py-2 rounded-2xl border border-emerald-600/40 shadow-xs">
              <div className="text-amber-300 font-extrabold flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>நல்ல நேரம்</span>
              </div>
              <div className="text-emerald-50 text-[10.5px] space-y-0.5 font-medium">
                <div>
                  <span className="text-emerald-300/90">காலை:</span>{" "}
                  <span className="font-bold text-white">{formatTimeRangeTo12H(todayInfo.nallaNeramMorning)}</span>
                </div>
                <div>
                  <span className="text-emerald-300/90">மாலை:</span>{" "}
                  <span className="font-bold text-white">{formatTimeRangeTo12H(todayInfo.nallaNeramEvening)}</span>
                </div>
              </div>
            </div>

            <div className="bg-amber-950/60 backdrop-blur-xs px-3 py-2 rounded-2xl border border-amber-600/40 shadow-xs">
              <div className="text-amber-300 font-extrabold flex items-center gap-1 mb-1">
                <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>கௌரி நல்ல நேரம்</span>
              </div>
              <div className="text-amber-50 text-[10.5px] space-y-0.5 font-medium">
                <div>
                  <span className="text-amber-300/90">காலை:</span>{" "}
                  <span className="font-bold text-white">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramMorning)}</span>
                </div>
                <div>
                  <span className="text-amber-300/90">மாலை:</span>{" "}
                  <span className="font-bold text-white">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramEvening)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Inauspicious Timings: Rahu Kalam & Emakandam */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-red-950/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-red-500/40 flex items-center justify-between shadow-xs">
              <span className="text-red-300 font-bold flex items-center gap-1">
                <span>⚠️</span>
                <span>ராகு காலம்:</span>
              </span>
              <span className="text-white font-extrabold">
                {formatTimeRangeTo12H(todayInfo.rahuKalam)}
              </span>
            </div>

            <div className="bg-orange-950/60 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-orange-500/40 flex items-center justify-between shadow-xs">
              <span className="text-orange-300 font-bold flex items-center gap-1">
                <span>⏳</span>
                <span>எமகண்டம்:</span>
              </span>
              <span className="text-white font-extrabold">
                {formatTimeRangeTo12H(todayInfo.yamagandam)}
              </span>
            </div>
          </div>
        </div>

        {/* Trial Countdown Badge (if in trial) */}
        {subscription?.status === "TRIAL" && (
          <div className="mt-3 bg-amber-400/15 border border-amber-400/30 rounded-2xl px-3 py-1.5 flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-amber-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" /> 30 Days Free Trial Active
            </span>
            <Link
              href="/app/subscription"
              className="text-[11px] font-bold text-amber-300 hover:text-white hover:underline"
            >
              View Plan →
            </Link>
          </div>
        )}
      </div>

      {/* Quick Action Shortcuts Row */}
      <div className="grid grid-cols-4 gap-2">
        <Link
          href="/app/bookings/new"
          className="flex flex-col items-center justify-center p-2.5 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl shadow-sm hover:shadow-md transition active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
          </div>
          <span className="text-[10px] font-bold text-center leading-tight">New Booking</span>
        </Link>

        <Link
          href="/app/calendar"
          className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs transition active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Calendar className="w-4 h-4 text-emerald-800" />
          </div>
          <span className="text-[10px] font-bold text-center leading-tight">Calendar</span>
        </Link>

        <Link
          href="/app/poojas"
          className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs transition active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-[10px] font-bold text-center leading-tight">Poojas</span>
        </Link>

        <Link
          href="/app/payments"
          className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-slate-50 text-slate-800 rounded-2xl border border-slate-200/90 shadow-2xs transition active:scale-95 group"
        >
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
            <CircleDollarSign className="w-4 h-4 text-blue-700" />
          </div>
          <span className="text-[10px] font-bold text-center leading-tight">Receipts</span>
        </Link>
      </div>

      {/* 2. KPI Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-300 transition">
          <div className="flex items-center justify-between text-emerald-700">
            <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-800" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded">Today</span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {todayBookings.length}
            </div>
            <div className="text-[10px] font-medium text-slate-500 leading-tight">
              Today's Bookings
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-amber-300 transition">
          <div className="flex items-center justify-between text-amber-700">
            <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
              <CircleDollarSign className="w-3.5 h-3.5 text-amber-700" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded">Due</span>
          </div>
          <div className="mt-2">
            <div className="text-lg sm:text-xl font-black text-slate-900">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-medium text-slate-500 leading-tight">
              Pending Due
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-indigo-300 transition">
          <div className="flex items-center justify-between text-indigo-700">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-indigo-700" />
            </div>
            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded">Next</span>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-slate-900">
              {upcomingCount}
            </div>
            <div className="text-[10px] font-medium text-slate-500 leading-tight">
              Upcoming Bookings
            </div>
          </div>
        </div>
      </div>

      {/* 3. Earnings & Payments Analytics (Cumulative + All Month Breakdown) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center border border-emerald-200/60 shadow-2xs">
              <Wallet className="w-4.5 h-4.5 text-emerald-800" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Earnings &amp; Payments Overview
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Cumulative &amp; Month-Wise Collections
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
            {bookings.length} {bookings.length === 1 ? "Total Booking" : "Total Bookings"}
          </span>
        </div>

        {/* 3A. Cumulative Lifetime Earnings Hero Card */}
        <div className="bg-gradient-to-br from-slate-50 via-emerald-50/20 to-amber-50/30 p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-bold text-slate-900">
                Cumulative Earnings (All-Time)
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {cumulativeRate}% Realized
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <span className="text-[10px] text-slate-500 block font-medium">Gross Billed</span>
              <span className="text-xs sm:text-sm font-black text-slate-900 block mt-0.5">
                ₹{cumulativeTotalBilled.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 block font-medium">Total Earned</span>
              <span className="text-xs sm:text-sm font-black text-emerald-900 block mt-0.5">
                ₹{cumulativeCollected.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] text-amber-800 block font-medium">Pending Due</span>
              <span className="text-xs sm:text-sm font-black text-amber-950 block mt-0.5">
                ₹{cumulativePending.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10.5px] text-slate-600 font-medium">
              <span>Overall Realization Progress</span>
              <span className="font-bold text-emerald-800">
                ₹{cumulativeCollected.toLocaleString("en-IN")} / ₹{cumulativeTotalBilled.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500 shadow-xs"
                style={{ width: `${Math.min(100, cumulativeRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3B. All Month Payments & Earnings List */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span>All Month Payments &amp; Earnings</span>
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              {allMonthsSummary.length} {allMonthsSummary.length === 1 ? "month" : "months"} recorded
            </span>
          </div>

          <div className="space-y-2">
            {allMonthsSummary.map((m) => {
              const isSelected = m.monthKey === selectedMonthKey;
              return (
                <div
                  key={m.monthKey}
                  onClick={() => setSelectedMonthKey(m.monthKey)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-emerald-50/40 border-emerald-600 shadow-xs ring-1 ring-emerald-600/30"
                      : "bg-white hover:bg-slate-50/90 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {m.englishMonth}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-100/70 text-amber-900 font-semibold border border-amber-200">
                        {m.tamilMonth} மாதம்
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900 text-white font-bold">
                          Selected
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {m.bookingCount} {m.bookingCount === 1 ? "Pooja" : "Poojas"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-2 bg-white rounded-xl border border-slate-200/70 shadow-2xs">
                      <span className="text-[9.5px] text-slate-500 block font-medium">Billed</span>
                      <span className="text-[11px] sm:text-xs font-bold text-slate-900 block mt-0.5">
                        ₹{m.billed.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200/60 shadow-2xs">
                      <span className="text-[9.5px] text-emerald-800 block font-medium">Collected</span>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-900 block mt-0.5">
                        ₹{m.collected.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-2 bg-amber-50/80 rounded-xl border border-amber-200/60 shadow-2xs">
                      <span className="text-[9.5px] text-amber-800 block font-medium">Pending Due</span>
                      <span className="text-[11px] sm:text-xs font-bold text-amber-950 block mt-0.5">
                        ₹{m.pending.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-600 font-medium">
                    <span>Payment Realization</span>
                    <span className="font-bold text-emerald-800">{m.rate}% Paid</span>
                  </div>
                  <div className="w-full bg-slate-200/70 rounded-full h-1.5 overflow-hidden flex mt-1">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, m.rate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3C. Selected Month Deep-Dive */}
        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-slate-900 block">
                {selectedMonthTamil.monthNameEn} {selectedMonthTamil.year} Performance
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {selectedMonthTamil.tamilMonth} மாதம் • Pooja &amp; Team Breakdown
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-700 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedMonthBookings.length} {selectedMonthBookings.length === 1 ? "Pooja" : "Poojas"}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-700 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pooja Breakdown & Team Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Popular Poojas */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-600" />
                <span>Top Poojas (Earnings)</span>
              </span>
              <div className="space-y-1.5">
                {poojaDistribution.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No poojas booked for this month.</p>
                ) : (
                  poojaDistribution.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-[10.5px]">
                      <span className="font-medium text-slate-700 truncate max-w-[130px]" title={p.name}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-900 rounded">
                          {p.count}
                        </span>
                        <span className="font-bold text-slate-900 text-[10px]">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team Member Allocation */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <span className="text-[11px] font-bold text-slate-900 flex items-center gap-1">
                <Users className="w-3 h-3 text-emerald-700" />
                <span>Team Allocation</span>
              </span>
              <div className="space-y-1.5">
                {memberAllocation.length === 0 ? (
                  <p className="text-[10px] text-slate-400">No assignments yet.</p>
                ) : (
                  memberAllocation.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-[10.5px]">
                      <span className="font-medium text-slate-700 truncate max-w-[140px]">
                        {m.name}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                        {m.count} {m.count === 1 ? "seva" : "sevas"}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

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
