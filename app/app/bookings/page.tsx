"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { BookingStatus } from "@/lib/types";
import { getTamilDate } from "@/lib/calendar/tamil";
import Link from "next/link";
import { Plus, Search, MapPin, Calendar, Flame, ChevronRight } from "lucide-react";

export default function BookingsListPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const allBookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  const filteredBookings = allBookings.filter((b) => {
    const matchesFilter = filter === "ALL" || b.status === filter;
    const matchesSearch =
      b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.poojaEnglishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-3 pb-6 animate-in fade-in duration-200">
      {/* Header & New Booking Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">
            {t("bookings")}
          </h2>
          <p className="text-xs text-velvi-brown/60">
            {filteredBookings.length} bookings found
          </p>
        </div>
        <Link
          href="/app/bookings/new"
          className="px-3 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition"
        >
          <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
          <span>New</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-velvi-brown/40 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search customer, pooja, location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-velvi-gold/20 text-xs text-velvi-brownDark placeholder:text-velvi-brown/40 focus:outline-none focus:border-velvi-gold transition"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {["ALL", "CONFIRMED", "PENDING", "COMPLETED"].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              filter === st
                ? "bg-velvi-brown text-white font-bold shadow-sm"
                : "bg-white text-velvi-brown/70 hover:bg-velvi-cream border border-velvi-gold/20"
            }`}
          >
            {st === "ALL" ? "All Bookings" : st}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <div className="space-y-2.5">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-velvi-gold/30">
            <div className="text-3xl mb-2">🪔</div>
            <h4 className="font-bold text-sm text-velvi-brown">No bookings found</h4>
            <p className="text-xs text-velvi-brown/60 mt-1">
              Create a new booking or clear search filters.
            </p>
          </div>
        ) : (
          filteredBookings.map((b) => {
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
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-velvi-gold" />
                      <span className="font-medium">
                        {dateInfo.formattedDualDate} • {b.startTime}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-velvi-brown/70">
                      <MapPin className="w-3.5 h-3.5 text-velvi-gold" />
                      <span>
                        {b.customerName} • {b.location}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center text-velvi-goldDark">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
