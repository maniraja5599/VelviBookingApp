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
      <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream border border-velvi-gold/30 rounded-2xl p-4 shadow-sacred">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-velvi-goldDark font-semibold tracking-wide uppercase">
              {todayInfo.tamilYear} வருடம்
            </div>
            <h2 className="text-lg font-bold text-velvi-brownDark">
              🙏 Vanakkam, {currentUser?.name || "Ravi Iyer"}
            </h2>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 bg-velvi-gold/20 text-velvi-brownDark rounded-full text-xs font-bold border border-velvi-gold/40">
              {todayInfo.tamilMonth} {todayInfo.tamilDay}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-velvi-brown/80 border-t border-velvi-gold/15 pt-2 space-y-2">
          {/* Dual Inauspicious Timings: Rahu Kalam & Emakandam in Tamil */}
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <span className="font-bold text-velvi-brownDark">{todayInfo.formattedFullDay}</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] text-red-700 font-bold bg-red-50/90 px-2 py-0.5 rounded-lg border border-red-200/70">
                ராகு காலம்: {formatTimeRangeTo12H(todayInfo.rahuKalam)}
              </span>
              <span className="text-[11px] text-orange-800 font-bold bg-orange-50/90 px-2 py-0.5 rounded-lg border border-orange-200/70">
                எமகண்டம்: {formatTimeRangeTo12H(todayInfo.yamagandam)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="bg-white/85 px-2.5 py-2 rounded-xl border border-emerald-300 shadow-2xs">
              <div className="text-emerald-900 font-bold flex items-center gap-1 mb-1">
                <Sparkles className="w-3 h-3 text-emerald-600 shrink-0" />
                <span>நல்ல நேரம்</span>
              </div>
              <div className="text-emerald-950 text-[10.5px] space-y-0.5">
                <div>
                  <span className="text-emerald-700 font-medium">காலை:</span>{" "}
                  <span className="font-bold">{formatTimeRangeTo12H(todayInfo.nallaNeramMorning)}</span>
                </div>
                <div>
                  <span className="text-emerald-700 font-medium">மாலை:</span>{" "}
                  <span className="font-bold">{formatTimeRangeTo12H(todayInfo.nallaNeramEvening)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white/85 px-2.5 py-2 rounded-xl border border-amber-300 shadow-2xs">
              <div className="text-amber-900 font-bold flex items-center gap-1 mb-1">
                <Flame className="w-3 h-3 text-amber-600 shrink-0" />
                <span>கௌரி நல்ல நேரம்</span>
              </div>
              <div className="text-amber-950 text-[10.5px] space-y-0.5">
                <div>
                  <span className="text-amber-700 font-medium">காலை:</span>{" "}
                  <span className="font-bold">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramMorning)}</span>
                </div>
                <div>
                  <span className="text-amber-700 font-medium">மாலை:</span>{" "}
                  <span className="font-bold">{formatTimeRangeTo12H(todayInfo.gowriNallaNeramEvening)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trial Countdown Badge (if in trial) */}
        {subscription?.status === "TRIAL" && (
          <div className="mt-2.5 bg-velvi-gold/15 border border-velvi-gold/40 rounded-xl px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs font-semibold text-velvi-brownDark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-velvi-gold" /> 30 Days Free Trial Active
            </span>
            <Link
              href="/app/subscription"
              className="text-[11px] font-bold text-velvi-brown hover:underline"
            >
              View Plan →
            </Link>
          </div>
        )}
      </div>

      {/* 2. KPI Stat Cards (Clean English) */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-xl p-3 border border-velvi-gold/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-velvi-gold">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-velvi-brownDark">
              {todayBookings.length}
            </div>
            <div className="text-[10px] font-medium text-velvi-brown/60 leading-tight">
              Today's Bookings
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-velvi-gold/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-velvi-goldDark">
            <CircleDollarSign className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-bold text-velvi-brownDark">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[10px] font-medium text-velvi-brown/60 leading-tight">
              Pending Due
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-velvi-gold/20 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-velvi-sacredGreen">
            <Clock className="w-4 h-4" />
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-velvi-brownDark">
              {upcomingCount}
            </div>
            <div className="text-[10px] font-medium text-velvi-brown/60 leading-tight">
              Upcoming Bookings
            </div>
          </div>
        </div>
      </div>

      {/* 3. Earnings & Payments Analytics (Cumulative + All Month Breakdown) */}
      <div className="bg-white rounded-2xl p-4 border border-velvi-gold/25 shadow-sm space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-velvi-gold/15 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center">
              <Wallet className="w-4 h-4 text-velvi-goldDark" />
            </div>
            <div>
              <h3 className="font-bold text-xs sm:text-sm text-velvi-brownDark">
                Earnings &amp; Payments Overview
              </h3>
              <p className="text-[10.5px] text-velvi-brown/60">
                Cumulative &amp; Month-Wise Collections
              </p>
            </div>
          </div>

          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-velvi-gold/20 text-velvi-brownDark border border-velvi-gold/30">
            {bookings.length} {bookings.length === 1 ? "Total Booking" : "Total Bookings"}
          </span>
        </div>

        {/* 3A. Cumulative Lifetime Earnings Hero Card */}
        <div className="bg-gradient-to-br from-velvi-creamLight via-velvi-cream/60 to-white p-3.5 rounded-2xl border border-velvi-gold/35 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-velvi-goldDark" />
              <span className="text-xs font-bold text-velvi-brownDark">
                Cumulative Earnings (All-Time)
              </span>
            </div>
            <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
              {cumulativeRate}% Realized
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-white/90 rounded-xl border border-velvi-gold/20 shadow-2xs">
              <span className="text-[10px] text-velvi-brown/60 block font-medium">Gross Billed</span>
              <span className="text-xs sm:text-sm font-bold text-velvi-brownDark block mt-0.5">
                ₹{cumulativeTotalBilled.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-emerald-50/90 rounded-xl border border-emerald-200 shadow-2xs">
              <span className="text-[10px] text-emerald-800 block font-medium">Total Earned</span>
              <span className="text-xs sm:text-sm font-bold text-emerald-900 block mt-0.5">
                ₹{cumulativeCollected.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="p-2.5 bg-amber-50/90 rounded-xl border border-amber-200 shadow-2xs">
              <span className="text-[10px] text-amber-800 block font-medium">Pending Due</span>
              <span className="text-xs sm:text-sm font-bold text-amber-950 block mt-0.5">
                ₹{cumulativePending.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-velvi-brown/70 font-medium">
              <span>Overall Realization Progress</span>
              <span className="font-bold text-emerald-700">
                ₹{cumulativeCollected.toLocaleString("en-IN")} / ₹{cumulativeTotalBilled.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden flex">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, cumulativeRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3B. All Month Payments & Earnings List */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-velvi-brownDark flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-velvi-gold" />
              <span>All Month Payments &amp; Earnings</span>
            </span>
            <span className="text-[10px] text-velvi-brown/60">
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
                  className={`p-3 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? "bg-gradient-to-r from-velvi-cream/70 to-white border-velvi-gold shadow-xs ring-1 ring-velvi-gold/40"
                      : "bg-velvi-cream/20 hover:bg-velvi-cream/40 border-velvi-gold/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-velvi-brownDark">
                        {m.englishMonth}
                      </span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-velvi-gold/15 text-velvi-brownDark font-semibold">
                        {m.tamilMonth} மாதம்
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-velvi-brown text-white font-bold">
                          Selected
                        </span>
                      )}
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {m.bookingCount} {m.bookingCount === 1 ? "Pooja" : "Poojas"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                    <div className="p-1.5 bg-white/90 rounded-xl border border-velvi-gold/15">
                      <span className="text-[9.5px] text-velvi-brown/60 block font-medium">Billed</span>
                      <span className="text-[11px] sm:text-xs font-bold text-velvi-brownDark block mt-0.5">
                        ₹{m.billed.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-1.5 bg-emerald-50/90 rounded-xl border border-emerald-200/60">
                      <span className="text-[9.5px] text-emerald-800 block font-medium">Collected</span>
                      <span className="text-[11px] sm:text-xs font-bold text-emerald-900 block mt-0.5">
                        ₹{m.collected.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="p-1.5 bg-amber-50/90 rounded-xl border border-amber-200/60">
                      <span className="text-[9.5px] text-amber-800 block font-medium">Pending Due</span>
                      <span className="text-[11px] sm:text-xs font-bold text-amber-950 block mt-0.5">
                        ₹{m.pending.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[10px] text-velvi-brown/70 font-medium">
                    <span>Payment Realization</span>
                    <span className="font-bold text-emerald-700">{m.rate}% Paid</span>
                  </div>
                  <div className="w-full bg-amber-100/70 rounded-full h-1.5 overflow-hidden flex mt-0.5">
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
        <div className="pt-2 border-t border-velvi-gold/15 space-y-2.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <span className="text-xs font-bold text-velvi-brownDark block">
                {selectedMonthTamil.monthNameEn} {selectedMonthTamil.year} Performance
              </span>
              <span className="text-[10px] text-velvi-brown/60">
                {selectedMonthTamil.tamilMonth} மாதம் • Pooja &amp; Team Breakdown
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => handleMonthChange(-1)}
                className="p-1 hover:bg-velvi-cream rounded-lg text-velvi-brown transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {selectedMonthBookings.length} {selectedMonthBookings.length === 1 ? "Pooja" : "Poojas"}
              </span>
              <button
                onClick={() => handleMonthChange(1)}
                className="p-1 hover:bg-velvi-cream rounded-lg text-velvi-brown transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pooja Breakdown & Team Allocation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Popular Poojas */}
            <div className="p-2.5 bg-velvi-cream/30 rounded-xl border border-velvi-gold/15 space-y-2">
              <span className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1">
                <Flame className="w-3 h-3 text-velvi-gold" />
                <span>Top Poojas (Earnings)</span>
              </span>
              <div className="space-y-1.5">
                {poojaDistribution.length === 0 ? (
                  <p className="text-[10px] text-velvi-brown/50">No poojas booked for this month.</p>
                ) : (
                  poojaDistribution.map((p) => (
                    <div key={p.name} className="flex items-center justify-between text-[10.5px]">
                      <span className="font-medium text-velvi-brown truncate max-w-[130px]" title={p.name}>
                        {p.name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-velvi-gold/20 text-velvi-brownDark rounded">
                          {p.count}
                        </span>
                        <span className="font-bold text-velvi-brownDark text-[10px]">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Team Member Allocation */}
            <div className="p-2.5 bg-velvi-cream/30 rounded-xl border border-velvi-gold/15 space-y-2">
              <span className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1">
                <Users className="w-3 h-3 text-velvi-gold" />
                <span>Team Allocation</span>
              </span>
              <div className="space-y-1.5">
                {memberAllocation.length === 0 ? (
                  <p className="text-[10px] text-velvi-brown/50">No assignments yet.</p>
                ) : (
                  memberAllocation.map((m) => (
                    <div key={m.name} className="flex items-center justify-between text-[10.5px]">
                      <span className="font-medium text-velvi-brown truncate max-w-[140px]">
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
        <div className="pt-2 border-t border-velvi-gold/15 flex items-center justify-between flex-wrap gap-2 text-xs">
          <Link
            href="/app/payments"
            className="flex items-center gap-1 text-[11px] font-bold text-velvi-goldDark hover:underline"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Receipts &amp; Ledger →</span>
          </Link>
          <Link
            href="/app/bookings"
            className="flex items-center gap-1 text-[11px] font-bold text-velvi-brown hover:underline"
          >
            <Calendar className="w-3.5 h-3.5 text-velvi-gold" />
            <span>All Bookings Schedule →</span>
          </Link>
        </div>
      </div>

      {/* 4. Today's Booking Schedule */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-velvi-gold" />
            <span>Today's Schedule ({todayBookings.length})</span>
          </h3>
          <Link
            href="/app/calendar"
            className="text-xs text-velvi-goldDark font-semibold hover:underline"
          >
            Full Calendar →
          </Link>
        </div>

        {todayBookings.length === 0 ? (
          <div className="bg-white/80 rounded-2xl p-6 text-center border border-dashed border-velvi-gold/30">
            <div className="text-3xl mb-2">🪔</div>
            <h4 className="font-bold text-sm text-velvi-brown">No Ceremonies Scheduled Today</h4>
            <p className="text-xs text-velvi-brown/60 mt-1">
              No ceremonies scheduled for today. View upcoming poojas via Calendar or Bookings.
            </p>
            <div className="mt-3 flex items-center justify-center gap-2">
              <Link
                href="/app/calendar"
                className="px-3 py-1.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown text-xs font-semibold rounded-xl border border-velvi-gold/30 transition"
              >
                Calendar
              </Link>
              <Link
                href="/app/bookings"
                className="px-3 py-1.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown text-xs font-semibold rounded-xl border border-velvi-gold/30 transition"
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
                  className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-velvi-goldDark bg-velvi-gold/10 px-2 py-0.5 rounded">
                          {b.startTime}
                        </span>
                        {isSelf ? (
                          <span className="text-[10px] font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded-full border border-velvi-gold/30 flex items-center gap-1">
                            <span>🪔</span> Self
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                            <span>👥</span> {b.assignedIyerName || "Team"}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-velvi-sacredGreen bg-velvi-sacredGreen/10 px-1.5 py-0.5 rounded">
                          {b.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-base text-velvi-brownDark mt-1.5">
                        {b.poojaEnglishName}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-velvi-brownDark">
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </span>
                      <div className="text-[10px] font-medium text-velvi-brown/60">
                        {b.paymentStatus === "PAID" ? "Paid ✅" : `Due: ₹${b.balanceAmount}`}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-velvi-creamDark flex items-center justify-between text-xs text-velvi-brown/80">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3.5 h-3.5 text-velvi-gold" />
                      <span>
                        {b.customerName} • {b.location}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.customerMobile && (
                        <a
                          href={`https://wa.me/${b.customerMobile.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg transition"
                          title="WhatsApp Customer"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="p-1.5 bg-velvi-gold/15 text-velvi-brown hover:bg-velvi-gold/25 rounded-lg transition"
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
