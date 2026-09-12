"use client";

import React from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import Link from "next/link";
import {
  CalendarDays,
  CircleDollarSign,
  Clock,
  Plus,
  ChevronRight,
  MapPin,
  Flame,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";

export default function HomeDashboardPage() {
  const { currentUser, currentBusiness, subscription } = useAuth();
  const { t } = useLanguage();

  // Current Tamil Date
  const todayInfo = getTamilDate(new Date());

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const bookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  // Compute metrics
  const todayBookings = bookings.filter((b) => b.date === todayInfo.dateStr);
  const pendingAmount = bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
  const upcomingCount = bookings.filter((b) => b.date >= todayInfo.dateStr).length;

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
              🙏 {t("vanakkam")}, {currentUser?.name || "Ravi Iyer"}
            </h2>
          </div>
          <div className="text-right">
            <span className="inline-block px-2.5 py-0.5 bg-velvi-gold/20 text-velvi-brownDark rounded-full text-xs font-bold border border-velvi-gold/40">
              {todayInfo.tamilMonth} {todayInfo.tamilDay}
            </span>
          </div>
        </div>

        <div className="mt-2 text-xs text-velvi-brown/80 flex items-center justify-between border-t border-velvi-gold/15 pt-2">
          <span>{todayInfo.formattedFullDay}</span>
          <span className="text-[11px] text-velvi-goldDark font-medium">
            ராகு: {todayInfo.rahuKalam.split(" - ")[0]}
          </span>
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

      {/* 2. KPI Stat Cards */}
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
              {t("todaysBookings")}
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
              {t("pendingAmount")}
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
              {t("upcomingBookings")}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Touch Action: + New Booking */}
      <Link
        href="/app/bookings/new"
        className="w-full py-3.5 bg-gradient-to-r from-velvi-brown to-velvi-brownLight hover:opacity-95 text-white rounded-xl font-bold text-center flex items-center justify-center gap-2 shadow-sacred active:scale-[0.99] transition"
      >
        <Plus className="w-5 h-5 text-velvi-goldLight stroke-[3]" />
        <span>{t("newBooking")}</span>
      </Link>

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
            <h4 className="font-bold text-sm text-velvi-brown">No bookings for today</h4>
            <p className="text-xs text-velvi-brown/60 mt-1">
              Tap the button above to quickly schedule a Pooja or Homam.
            </p>
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
