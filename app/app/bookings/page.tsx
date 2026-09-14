"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Booking, BookingStatus } from "@/lib/types";
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

export default function BookingsListPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const allBookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

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

    sorted.forEach((b) => {
      const monthKey = b.date.slice(0, 7); // "YYYY-MM"
      const dateInfo = getTamilDate(b.date);

      if (!groupsMap.has(monthKey)) {
        groupsMap.set(monthKey, {
          monthKey,
          englishMonthYear: `${dateInfo.monthNameEn} ${dateInfo.year}`,
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
    <div className="space-y-4 pb-8 animate-in fade-in duration-200 max-w-full">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200/60">
              <Calendar className="w-4 h-4 text-emerald-800" />
            </div>
            <span>{t("bookings")}</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {filteredBookings.length} bookings found across {monthGroups.length} month(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-0.5 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode("timeline")}
              title="Month Timeline View"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === "timeline"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GitCommitVertical className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Compact List View"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === "list"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">List</span>
            </button>
          </div>

          <Link
            href="/app/bookings/new"
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
            <span>New</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search customer, pooja, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-white rounded-2xl border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {["ALL", "CONFIRMED", "PENDING", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 ${
              filter === st
                ? "bg-emerald-900 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200/90"
            }`}
          >
            {st === "ALL" ? "All Bookings" : st}
          </button>
        ))}
      </div>

      {/* No Bookings Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 shadow-2xs space-y-3">
          <div className="text-3xl">🪔</div>
          <h4 className="font-bold text-sm text-slate-800">No bookings found</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Try clearing your search query or create a new booking using the button above.
          </p>
          <Link
            href="/app/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Create New Booking</span>
          </Link>
        </div>
      ) : viewMode === "timeline" ? (
        /* =================================================================== */
        /* MONTH-WISE TIMELINE VIEW                                           */
        /* =================================================================== */
        <div className="space-y-6">
          {monthGroups.map((group) => (
            <div key={group.monthKey} className="space-y-3">
              {/* Month Header Banner */}
              <div className="bg-gradient-to-r from-emerald-50/60 via-slate-50 to-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100/70 text-emerald-900 border border-emerald-200">
                    <Calendar className="w-4 h-4 text-emerald-800" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">
                      {group.englishMonthYear}
                    </h3>
                    <p className="text-[11px] text-emerald-800 font-semibold">
                      {group.tamilMonthSpan} ({group.tamilYear} வருடம்)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-lg bg-white border border-slate-200 text-[10.5px] font-bold text-slate-800 shadow-2xs">
                    {group.bookings.length} {group.bookings.length === 1 ? "Pooja" : "Poojas"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[10.5px] font-bold text-slate-700">
                    Billed: ₹{group.totalAmount.toLocaleString("en-IN")}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[10.5px] font-bold text-emerald-800">
                    Collected: ₹{group.totalCollected.toLocaleString("en-IN")}
                  </span>
                  {group.totalPending > 0 && (
                    <span className="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-[10.5px] font-bold text-amber-900">
                      Due: ₹{group.totalPending.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>
              </div>

              {/* Month's Vertical Timeline Track */}
              <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 space-y-3">
                {group.bookings.map((b) => {
                  const dateInfo = getTamilDate(b.date);
                  const isSelf =
                    b.assignedIyerId === ownerMember?.id ||
                    b.assignedIyerName === currentUser?.name ||
                    b.assignedIyerName === "Ravi Iyer";

                  return (
                    <div key={b.id} className="relative group">
                      {/* Timeline Node Badge on the rail */}
                      <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-emerald-700 flex items-center justify-center text-[10px] sm:text-[11px] font-black text-emerald-950 shadow-2xs group-hover:scale-110 group-hover:border-emerald-900 transition-transform">
                        {dateInfo.dayOfMonth}
                      </div>

                      {/* Date & Weekday pill */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-semibold mb-1.5 pl-1">
                        <span className="text-slate-900 font-bold">
                          {dateInfo.dayOfWeekEn}
                        </span>
                        <span>•</span>
                        <span className="text-amber-800 font-bold">
                          {dateInfo.tamilMonth} {dateInfo.tamilDay} ({dateInfo.dayOfWeekTa})
                        </span>
                      </div>

                      {/* Booking Card */}
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="block bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition active:scale-[0.99] space-y-2.5"
                      >
                        {/* Top Line: Booking ID, Self/Team Pill, Status */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                              {b.bookingNumber}
                            </span>
                            {isSelf ? (
                              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                <span>🪔</span> Self
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-blue-800 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                <span>👥</span> {b.assignedIyerName || "Team"}
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                              b.status === "CONFIRMED"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : b.status === "COMPLETED"
                                ? "bg-blue-50 text-blue-800 border border-blue-200"
                                : "bg-amber-50 text-amber-900 border border-amber-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        {/* Middle Line: Pooja Name & Time */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                              <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                              <span>{b.poojaEnglishName}</span>
                            </h4>
                            {b.poojaTamilName && (
                              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                                {b.poojaTamilName}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-extrabold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-700" />
                              <span>{b.startTime}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {b.durationMinutes} mins
                            </span>
                          </div>
                        </div>

                        {/* Customer, Location & Price Footer */}
                        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-medium text-slate-800">
                              <span>👤</span>
                              <span className="truncate">{b.customerName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{b.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-black text-slate-900 block">
                                ₹{b.totalAmount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-[10px] font-bold ${
                                  b.paymentStatus === "PAID"
                                    ? "text-emerald-700"
                                    : "text-rose-700"
                                }`}
                              >
                                {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* =================================================================== */
        /* COMPACT LIST VIEW                                                  */
        /* =================================================================== */
        <div className="space-y-2.5">
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
                className="block bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 transition relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-extrabold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                        {b.bookingNumber}
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
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : b.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : "bg-amber-50 text-amber-900 border border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-sm text-slate-900 mt-2">
                      {b.poojaEnglishName}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <div className="text-[10.5px] font-bold mt-0.5">
                      {b.paymentStatus === "PAID" ? (
                        <span className="text-emerald-700">Paid ✅</span>
                      ) : (
                        <span className="text-rose-700">Due: ₹${b.balanceAmount}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {dateInfo.formattedDualDate} • {b.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate text-slate-600">
                        {b.customerName} • {b.location}
                      </span>
                    </div>
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
