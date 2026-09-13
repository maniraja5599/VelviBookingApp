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
          <h2 className="text-base sm:text-lg font-bold text-velvi-brownDark flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-velvi-gold" />
            <span>{t("bookings")}</span>
          </h2>
          <p className="text-xs text-velvi-brown/60">
            {filteredBookings.length} bookings found across {monthGroups.length} month(s)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="bg-white rounded-xl border border-velvi-gold/20 p-0.5 flex items-center shadow-xs">
            <button
              onClick={() => setViewMode("timeline")}
              title="Month Timeline View"
              className={`p-1.5 rounded-lg transition flex items-center gap-1 text-xs font-semibold ${
                viewMode === "timeline"
                  ? "bg-velvi-brown text-white shadow-xs"
                  : "text-velvi-brown/70 hover:bg-velvi-cream"
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
                  ? "bg-velvi-brown text-white shadow-xs"
                  : "text-velvi-brown/70 hover:bg-velvi-cream"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">List</span>
            </button>
          </div>

          <Link
            href="/app/bookings/new"
            className="px-3.5 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 transition"
          >
            <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
            <span>New</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-velvi-brown/40 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search customer, pooja, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-velvi-gold/20 text-xs text-velvi-brownDark placeholder:text-velvi-brown/40 focus:outline-none focus:border-velvi-gold transition shadow-xs"
        />
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {["ALL", "CONFIRMED", "PENDING", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition shrink-0 ${
              filter === st
                ? "bg-velvi-brown text-white font-bold shadow-xs"
                : "bg-white text-velvi-brown/70 hover:bg-velvi-cream border border-velvi-gold/20"
            }`}
          >
            {st === "ALL" ? "All Bookings" : st}
          </button>
        ))}
      </div>

      {/* No Bookings Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-velvi-gold/30 space-y-2">
          <div className="text-3xl">🪔</div>
          <h4 className="font-bold text-sm text-velvi-brown">No bookings found</h4>
          <p className="text-xs text-velvi-brown/60 max-w-xs mx-auto">
            Try clearing your search query or create a new booking using the button above.
          </p>
          <Link
            href="/app/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-velvi-gold text-velvi-brownDark font-bold text-xs rounded-xl hover:bg-velvi-goldLight transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
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
              <div className="bg-gradient-to-r from-velvi-cream to-white rounded-2xl p-3 border border-velvi-gold/30 shadow-xs flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-velvi-gold/20 text-velvi-brownDark">
                    <Calendar className="w-4 h-4 text-velvi-goldDark" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-velvi-brownDark">
                      {group.englishMonthYear}
                    </h3>
                    <p className="text-[11px] text-velvi-goldDark font-semibold">
                      {group.tamilMonthSpan} ({group.tamilYear} வருடம்)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <span className="px-2 py-0.5 rounded-lg bg-white border border-velvi-gold/30 text-[10.5px] font-bold text-velvi-brownDark shadow-2xs">
                    {group.bookings.length} {group.bookings.length === 1 ? "Pooja" : "Poojas"}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-velvi-cream/60 border border-velvi-gold/30 text-[10.5px] font-bold text-velvi-brownDark">
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
              <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-velvi-gold/30 space-y-3">
                {group.bookings.map((b) => {
                  const dateInfo = getTamilDate(b.date);
                  const isSelf =
                    b.assignedIyerId === ownerMember?.id ||
                    b.assignedIyerName === currentUser?.name ||
                    b.assignedIyerName === "Ravi Iyer";

                  return (
                    <div key={b.id} className="relative group">
                      {/* Timeline Node Badge on the rail */}
                      <div className="absolute -left-6 sm:-left-8 top-3.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-white border-2 border-velvi-gold flex items-center justify-center text-[10px] sm:text-[11px] font-extrabold text-velvi-brown shadow-xs group-hover:scale-110 group-hover:border-velvi-brown transition-transform">
                        {dateInfo.dayOfMonth}
                      </div>

                      {/* Date & Weekday pill */}
                      <div className="flex items-center gap-1.5 text-[11px] text-velvi-brown/80 font-semibold mb-1 pl-1">
                        <span className="text-velvi-brownDark font-bold">
                          {dateInfo.dayOfWeekEn}
                        </span>
                        <span>•</span>
                        <span className="text-velvi-goldDark">
                          {dateInfo.tamilMonth} {dateInfo.tamilDay} ({dateInfo.dayOfWeekTa})
                        </span>
                      </div>

                      {/* Booking Card */}
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="block bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/60 hover:shadow-md transition active:scale-[0.99] space-y-2"
                      >
                        {/* Top Line: Booking ID, Self/Team Pill, Status */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] font-bold text-velvi-goldDark">
                              {b.bookingNumber}
                            </span>
                            {isSelf ? (
                              <span className="text-[9.5px] font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded-full border border-velvi-gold/30 flex items-center gap-1">
                                <span>🪔</span> Self
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                                <span>👥</span> {b.assignedIyerName || "Team"}
                              </span>
                            )}
                          </div>

                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              b.status === "CONFIRMED"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : b.status === "COMPLETED"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {b.status}
                          </span>
                        </div>

                        {/* Middle Line: Pooja Name & Time */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
                              <Flame className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                              <span>{b.poojaEnglishName}</span>
                            </h4>
                            {b.poojaTamilName && (
                              <p className="text-[11px] text-velvi-brown/70 font-medium">
                                {b.poojaTamilName}
                              </p>
                            )}
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-bold text-emerald-800 bg-emerald-50/80 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              <span>{b.startTime}</span>
                            </div>
                            <span className="text-[10px] text-velvi-brown/50 block mt-0.5">
                              {b.durationMinutes} mins
                            </span>
                          </div>
                        </div>

                        {/* Customer, Location & Price Footer */}
                        <div className="pt-2 border-t border-velvi-creamDark flex items-center justify-between gap-2 text-xs text-velvi-brown/80">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-1 truncate font-medium">
                              <span>👤</span>
                              <span className="truncate">{b.customerName}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-velvi-brown/60 truncate">
                              <MapPin className="w-3 h-3 text-velvi-gold shrink-0" />
                              <span className="truncate">{b.location}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-xs sm:text-sm font-bold text-velvi-brownDark block">
                                ₹{b.totalAmount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-[10px] font-semibold ${
                                  b.paymentStatus === "PAID"
                                    ? "text-emerald-700"
                                    : "text-amber-700"
                                }`}
                              >
                                {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-velvi-goldDark group-hover:translate-x-0.5 transition-transform" />
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
                className="block bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition relative"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-bold text-velvi-goldDark">
                        {b.bookingNumber}
                      </span>
                      {isSelf ? (
                        <span className="text-[9px] font-bold text-velvi-brownDark bg-velvi-gold/15 px-2 py-0.5 rounded-full border border-velvi-gold/30 flex items-center gap-1">
                          <span>🪔</span> Self
                        </span>
                      ) : (
                        <span className="text-[9px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                          <span>👥</span> {b.assignedIyerName || "Team"}
                        </span>
                      )}
                      <span
                        className={`text-[10px] px-2 py-0.2 rounded-full font-bold uppercase ${
                          b.status === "CONFIRMED"
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : b.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-velvi-brownDark mt-1.5">
                      {b.poojaEnglishName}
                    </h3>
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
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1 truncate">
                      <Calendar className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                      <span className="font-medium truncate">
                        {dateInfo.formattedDualDate} • {b.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-velvi-brown/70 truncate">
                      <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                      <span className="truncate">
                        {b.customerName} • {b.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-velvi-goldDark shrink-0">
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
