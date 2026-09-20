"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Booking } from "@/lib/types";
import { getTamilDate } from "@/lib/calendar/tamil";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Flame,
  ChevronRight,
  Clock,
  Sparkles,
  GitCommitVertical,
  List,
  MessageCircle,
  Phone,
  User,
  X,
} from "lucide-react";

interface MonthTimelineGroup {
  monthKey: string; // e.g. "2026-09"
  englishMonthYear: string; // e.g. "September 2026"
  tamilMonthSpan: string; // e.g. "ஆவணி / புரட்டாசி"
  tamilYear: string; // e.g. "பராபவ"
  bookings: Booking[];
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
}

interface MonthTheme {
  headerBg: string;
  headerBorder: string;
  headerText: string;
  countBadgeBg: string;
  countBadgeText: string;
  nodeBg: string;
  nodeText: string;
  railColor: string;
  accentText: string;
}

const MONTH_THEMES: MonthTheme[] = [
  // 0: Rose / Crimson (e.g. September)
  {
    headerBg: "bg-[#fce7ed]/95",
    headerBorder: "border-[#f7bac8]",
    headerText: "text-[#881337]",
    countBadgeBg: "bg-[#881337]/10",
    countBadgeText: "text-[#881337]",
    nodeBg: "bg-[#9f1239]",
    nodeText: "text-white",
    railColor: "bg-[#9f1239]/40",
    accentText: "text-[#9f1239]",
  },
  // 1: Sacred Emerald / Green (e.g. October)
  {
    headerBg: "bg-[#e6f7ec]/95",
    headerBorder: "border-[#bbf0cb]",
    headerText: "text-[#14532d]",
    countBadgeBg: "bg-[#14532d]/10",
    countBadgeText: "text-[#14532d]",
    nodeBg: "bg-[#15803d]",
    nodeText: "text-white",
    railColor: "bg-[#15803d]/40",
    accentText: "text-[#15803d]",
  },
  // 2: Royal Blue / Indigo (e.g. November)
  {
    headerBg: "bg-[#eaf1fb]/95",
    headerBorder: "border-[#c3d8f8]",
    headerText: "text-[#1e3a8a]",
    countBadgeBg: "bg-[#1e3a8a]/10",
    countBadgeText: "text-[#1e3a8a]",
    nodeBg: "bg-[#2563eb]",
    nodeText: "text-white",
    railColor: "bg-[#2563eb]/40",
    accentText: "text-[#2563eb]",
  },
  // 3: Warm Amber / Haldi Gold (e.g. December)
  {
    headerBg: "bg-[#fef3c7]/95",
    headerBorder: "border-[#fde68a]",
    headerText: "text-[#78350f]",
    countBadgeBg: "bg-[#78350f]/10",
    countBadgeText: "text-[#78350f]",
    nodeBg: "bg-[#d97706]",
    nodeText: "text-white",
    railColor: "bg-[#d97706]/40",
    accentText: "text-[#d97706]",
  },
  // 4: Sacred Purple (e.g. January)
  {
    headerBg: "bg-[#f3e8ff]/95",
    headerBorder: "border-[#e9d5ff]",
    headerText: "text-[#581c87]",
    countBadgeBg: "bg-[#581c87]/10",
    countBadgeText: "text-[#581c87]",
    nodeBg: "bg-[#7e22ce]",
    nodeText: "text-white",
    railColor: "bg-[#7e22ce]/40",
    accentText: "text-[#7e22ce]",
  },
];

export default function BookingsListPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const [dbVersion, setDbVersion] = useState(0);

  useEffect(() => {
    const handler = () => setDbVersion((v) => v + 1);
    window.addEventListener("velvi:db-change", handler);
    return () => window.removeEventListener("velvi:db-change", handler);
  }, []);

  const allBookings = useMemo(() => db.getBookings(businessId), [businessId, dbVersion]);
  const members = useMemo(() => db.getMembers(businessId), [businessId, dbVersion]);
  const ownerMember = useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const matchesFilter = filter === "ALL" || b.status === filter;
      const matchesSearch =
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.poojaEnglishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allBookings, filter, searchQuery]);

  // Group bookings by Month into a chronological timeline
  const monthGroups = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    });

    const groupsMap = new Map<string, MonthTimelineGroup>();

    const ENGLISH_MONTHS_FULL = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    sorted.forEach((b) => {
      const monthKey = b.date.slice(0, 7); // "YYYY-MM"
      const dateInfo = getTamilDate(b.date);
      const mIdx = Math.max(0, Math.min(11, parseInt(b.date.slice(5, 7), 10) - 1));
      const fullMonthName = ENGLISH_MONTHS_FULL[mIdx] || dateInfo.monthNameEn;

      if (!groupsMap.has(monthKey)) {
        groupsMap.set(monthKey, {
          monthKey,
          englishMonthYear: `${fullMonthName} ${dateInfo.year}`,
          tamilMonthSpan: `${dateInfo.tamilMonth}`,
          tamilYear: dateInfo.tamilYear,
          bookings: [],
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
        });
      }

      const grp = groupsMap.get(monthKey)!;
      grp.bookings.push(b);
      grp.totalAmount += b.totalAmount || 0;
      grp.totalCollected += b.advanceAmount || 0;
      grp.totalPending += b.balanceAmount || 0;
      if (!grp.tamilMonthSpan.includes(dateInfo.tamilMonth)) {
        grp.tamilMonthSpan += ` / ${dateInfo.tamilMonth}`;
      }
    });

    return Array.from(groupsMap.values());
  }, [filteredBookings]);

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-200 max-w-full">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100/80 flex items-center justify-center border border-amber-300/70 shadow-2xs">
              <Calendar className="w-4 h-4 text-amber-900" />
            </div>
            <span>Pooja Bookings</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {filteredBookings.length} பதிவுகள் • {monthGroups.length} மாதங்கள்
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Switcher */}
          <div className="bg-white rounded-xl border border-slate-200 p-0.5 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode("timeline")}
              title="Month Timeline View"
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                viewMode === "timeline"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GitCommitVertical className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Compact List View"
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-xs font-bold ${
                viewMode === "list"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <Link
            href="/app/bookings/new"
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs hover:shadow-xs active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ New Booking</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="தேடுக: பக்தர் பெயர், பூஜை, ஊர், பதிவு எண்..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {["ALL", "CONFIRMED", "PENDING", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1 rounded-xl whitespace-nowrap transition shrink-0 ${
              filter === st
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            {st === "ALL" ? `அனைத்தும் (${allBookings.length})` : st}
          </button>
        ))}
      </div>

      {/* No Bookings Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 shadow-2xs space-y-3">
          <div className="text-3xl">🪔</div>
          <h4 className="font-bold text-sm text-slate-800">பூஜை பதிவுகள் எதுவும் இல்லை</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            தேடல் சொல்லை மாற்றி முயற்சிக்கவும் அல்லது புதிய பூஜை பதிவு செய்யவும்.
          </p>
          <Link
            href="/app/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>புதிய பதிவு செய்க</span>
          </Link>
        </div>
      ) : viewMode === "timeline" ? (
        /* =================================================================== */
        /* WHATSAPP-STYLE MONTH TIMELINE VIEW                                 */
        /* =================================================================== */
        <div className="pt-1">
          {monthGroups.map((group, groupIdx) => {
            const theme = MONTH_THEMES[groupIdx % MONTH_THEMES.length];

            return (
              <div key={group.monthKey} className="relative pb-6">
                {/* WhatsApp-Style Sticky Floating Month Header - Rock Solid & Stabilized */}
                <div
                  className={`sticky top-[56px] sm:top-[58px] z-20 ${theme.headerBg} backdrop-blur-md rounded-2xl px-3.5 py-2.5 border ${theme.headerBorder} shadow-sm flex items-center justify-between gap-2 mb-3 select-none`}
                >
                  <div className="min-w-0">
                    <h3 className={`font-black text-sm sm:text-base ${theme.headerText} tracking-tight leading-none`}>
                      {group.englishMonthYear}
                    </h3>
                    <p className={`text-[10.5px] font-bold ${theme.accentText} mt-0.5 opacity-90 truncate`}>
                      {group.tamilMonthSpan} ({group.tamilYear} வருடம்)
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-lg ${theme.countBadgeBg} ${theme.countBadgeText} border border-black/5`}
                    >
                      {group.bookings.length} {group.bookings.length === 1 ? "Booking" : "Bookings"}
                    </span>
                  </div>
                </div>

                {/* Timeline Container with Circular Date Nodes & Connecting Rail Line */}
                <div className="space-y-3 relative pl-1">
                  {group.bookings.map((b, bIdx) => {
                    const dateInfo = getTamilDate(b.date);
                    const dayNumber = dateInfo.dayOfMonth < 10 ? `0${dateInfo.dayOfMonth}` : `${dateInfo.dayOfMonth}`;
                    const isLastInMonth = bIdx === group.bookings.length - 1;

                    const isSelf =
                      b.assignedIyerId === ownerMember?.id ||
                      b.assignedIyerName === currentUser?.name ||
                      b.assignedIyerName === "Ravi Iyer" ||
                      !b.assignedIyerName ||
                      b.assignedIyerName.toLowerCase() === "self";

                    return (
                      <div key={b.id} className="relative flex items-start gap-2.5 sm:gap-3 group">
                        {/* Left Rail & Circular Date Node */}
                        <div className="relative flex flex-col items-center shrink-0 pt-1">
                          {/* Clear Date Node with Weekday and Day Number */}
                          <div
                            className={`w-10 rounded-2xl ${theme.nodeBg} ${theme.nodeText} flex flex-col items-center justify-center py-1 shadow-xs border-2 border-white ring-1 ring-black/10 z-10 sm:group-hover:scale-105 transition-transform duration-200 shrink-0`}
                          >
                            <span className="text-[9px] font-black uppercase tracking-wider opacity-85 leading-none">
                              {dateInfo.dayOfWeekEn.slice(0, 3)}
                            </span>
                            <span className="text-sm font-black leading-tight mt-0.5">
                              {dayNumber}
                            </span>
                          </div>

                          {/* Connecting Rail Line below node (only if not last in this month) */}
                          {!isLastInMonth && (
                            <div
                              className={`w-1 sm:w-1.25 ${theme.railColor} absolute top-12 bottom-[-16px] left-1/2 -translate-x-1/2 rounded-full`}
                            />
                          )}
                        </div>

                        {/* Right: Rich Booking Card Aligned Exactly with the Date */}
                        <Link
                          href={`/app/bookings/${b.id}`}
                          className="flex-1 min-w-0 bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-amber-300 hover:shadow-xs transition active:scale-[0.99] space-y-2"
                        >
                          {/* Row 1: Customer / Devotee Name FIRST, Time Badge & Chevron */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 text-xs">👤</span>
                                <h4 className="font-black text-sm sm:text-base text-slate-900 truncate leading-tight group-hover:text-emerald-950 transition-colors">
                                  {b.customerName}
                                </h4>
                              </div>
                              <p className="text-xs font-bold text-amber-900 mt-0.5 truncate flex items-center gap-1">
                                <span>🪔</span>
                                <span>{b.poojaEnglishName || b.poojaTamilName}</span>
                                {b.poojaTamilName && b.poojaEnglishName && b.poojaTamilName !== b.poojaEnglishName && (
                                  <span className="text-slate-500 font-normal">({b.poojaTamilName})</span>
                                )}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 text-[10.5px] font-bold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200">
                                <Clock className="w-3 h-3 text-slate-500" />
                                <span>{b.startTime}</span>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>

                          {/* Row 2: Confirmed Date, Location & Fee */}
                          <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5 gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 truncate min-w-0 text-[11px]">
                              {/* Confirmed Date Badge */}
                              <span className="font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80 flex items-center gap-1 shrink-0">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{dateInfo.dayOfMonth} {dateInfo.monthNameEn} ({dateInfo.dayOfWeekEn.slice(0, 3)})</span>
                              </span>

                              {b.location && (
                                <div className="flex items-center gap-1 font-semibold text-slate-600 truncate">
                                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="truncate">{b.location}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="font-black text-slate-900 text-xs sm:text-sm">
                                ₹{b.totalAmount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-[10px] font-bold ml-1.5 ${
                                  b.paymentStatus === "PAID"
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                              </span>
                            </div>
                          </div>

                          {/* Row 3: Priest Assignment & 1-tap Actions */}
                          <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[10.5px]">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-mono text-[9.5px] text-slate-400">
                                {b.bookingNumber?.startsWith("#") ? b.bookingNumber : `#${b.bookingNumber}`}
                              </span>
                              {isSelf ? (
                                <span className="font-bold text-emerald-900 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-300 flex items-center gap-1">
                                  <span>🪔</span> நானே (Self)
                                </span>
                              ) : (
                                <span className="font-semibold text-blue-900 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200 flex items-center gap-1">
                                  <span>👥</span> {b.assignedIyerName || "Team"}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {b.customerMobile && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.location.href = `tel:${b.customerMobile}`;
                                    }}
                                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                    title="Call Devotee"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      window.open(`https://wa.me/${b.customerMobile?.replace(/\D/g, "")}`, "_blank");
                                    }}
                                    className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-200"
                                    title="WhatsApp Devotee"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================================================================== */
        /* COMPACT LIST VIEW                                                  */
        /* =================================================================== */
        <div className="space-y-2">
          {filteredBookings.map((b) => {
            const dateInfo = getTamilDate(b.date);
            const isSelf =
              b.assignedIyerId === ownerMember?.id ||
              b.assignedIyerName === currentUser?.name ||
              b.assignedIyerName === "Ravi Iyer";

            return (
              <Link
                key={b.id}
                href={`/app/bookings/${b.id}`}
                className="block bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition relative space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/70 px-1.5 py-0.2 rounded border border-amber-200">
                        {b.bookingNumber}
                      </span>
                      {isSelf ? (
                        <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-100 px-2 py-0.2 rounded-full border border-emerald-300 flex items-center gap-1">
                          <span>🪔</span> Self
                        </span>
                      ) : (
                        <span className="text-[9.5px] font-semibold text-blue-800 bg-blue-50 px-2 py-0.2 rounded-full border border-blue-200 flex items-center gap-1">
                          <span>👥</span> {b.assignedIyerName || "Team"}
                        </span>
                      )}
                      <span className="text-[9.5px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                        {b.date} • {b.startTime}
                      </span>
                    </div>
                    <h3 className="font-black text-sm text-slate-900 mt-1 flex items-center gap-1">
                      <span>👤</span>
                      <span>{b.customerName}</span>
                    </h3>
                    <p className="text-[11px] font-bold text-amber-900 mt-0.5 truncate">
                      🪔 {b.poojaEnglishName || b.poojaTamilName} {b.poojaTamilName && b.poojaEnglishName && b.poojaTamilName !== b.poojaEnglishName ? `(${b.poojaTamilName})` : ""}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <div className="text-[10px] font-bold mt-0.5">
                      {b.paymentStatus === "PAID" ? (
                        <span className="text-emerald-700">Paid ✅</span>
                      ) : (
                        <span className="text-rose-700">Due: ₹{b.balanceAmount}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1 text-slate-500 truncate">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {b.location || "Namakkal"}
                    </span>
                  </div>

                  <div className="flex items-center text-slate-400 shrink-0">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

