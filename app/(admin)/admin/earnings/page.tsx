"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { Booking, UserDirectoryMetric } from "@/lib/types";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Phone,
  MapPin,
  Flame,
  X,
  ArrowUpRight,
  Eye,
  FileText,
  Building2,
  Sparkles,
  ChevronRight,
  Layers,
  Receipt,
  Users,
  Activity,
  Award,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function AdminEarningsPage() {
  const [activeViewTab, setActiveViewTab] = useState<"USERS" | "BOOKINGS">("USERS");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PAID" | "PARTIALLY_PAID" | "PENDING">("ALL");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string | null>(null);

  // Retrieve raw data
  const bookings = db.bookings || [];
  const businesses = db.businesses || [];
  const rawUsers = db.users || [];

  // Metrics calculations for users
  const directoryMetrics: UserDirectoryMetric[] = useMemo(() => {
    return db.getAllUsersDirectoryMetrics();
  }, [rawUsers, businesses, bookings]);

  // Exclude demo accounts for clean calculation unless requested
  const realUserMetrics = useMemo(() => {
    return directoryMetrics.filter((m) => !m.isDemo);
  }, [directoryMetrics]);

  // Overall platform metrics
  const totalVolume = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  }, [bookings]);

  const totalAdvance = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.advanceAmount) || 0), 0);
  }, [bookings]);

  const totalBalance = useMemo(() => {
    return bookings.reduce((sum, b) => sum + (Number(b.balanceAmount) || 0), 0);
  }, [bookings]);

  const paidCount = useMemo(() => {
    return bookings.filter((b) => b.paymentStatus === "PAID").length;
  }, [bookings]);

  const partialCount = useMemo(() => {
    return bookings.filter((b) => b.paymentStatus === "PARTIALLY_PAID").length;
  }, [bookings]);

  const pendingCount = useMemo(() => {
    return bookings.filter((b) => b.paymentStatus === "PENDING").length;
  }, [bookings]);

  // Filtered Userwise Metrics
  const filteredUserMetrics = useMemo(() => {
    const q = search.trim().toLowerCase();
    return directoryMetrics.filter((m) => {
      const matchQuery =
        !q ||
        m.user.name?.toLowerCase().includes(q) ||
        m.user.email?.toLowerCase().includes(q) ||
        m.user.mobile?.includes(q) ||
        m.business?.name?.toLowerCase().includes(q);
      return matchQuery;
    });
  }, [directoryMetrics, search]);

  // Filtered Bookings List
  const filteredBookings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus =
        statusFilter === "ALL" ? true : b.paymentStatus === statusFilter;

      const matchUser = selectedUserFilter
        ? b.businessId === selectedUserFilter || b.assignedIyerId === selectedUserFilter
        : true;

      const customerName = b.customerName?.toLowerCase() || "";
      const devoteePhone = b.customerMobile?.toLowerCase() || "";
      const poojaTa = b.poojaTamilName?.toLowerCase() || "";
      const poojaEn = b.poojaEnglishName?.toLowerCase() || "";
      const bookingNo = b.bookingNumber?.toLowerCase() || "";
      const priestName = b.assignedIyerName?.toLowerCase() || "";

      const matchQuery =
        !q ||
        customerName.includes(q) ||
        devoteePhone.includes(q) ||
        poojaTa.includes(q) ||
        poojaEn.includes(q) ||
        bookingNo.includes(q) ||
        priestName.includes(q);

      return matchStatus && matchUser && matchQuery;
    });
  }, [bookings, search, statusFilter, selectedUserFilter]);

  // Helper to get Business & Owner info
  const getBusinessInfo = (businessId: string) => {
    const biz = businesses.find((b) => b.id === businessId);
    const owner = rawUsers.find((u) => u.id === biz?.ownerId);
    return {
      bizName: biz?.name || "Independent Priest",
      ownerName: owner?.name || biz?.iyerName || "Priest Account",
      ownerMobile: owner?.mobile || biz?.phone || "",
    };
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* ── Page Header Banner ── */}
      <div className="bg-white border border-amber-200/80 rounded-3xl p-4 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-extrabold text-amber-900">
              <DollarSign className="w-3.5 h-3.5 text-amber-700" />
              Platform Bookings &amp; Earnings
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[10.5px] font-mono font-bold text-emerald-800">
              <Users className="w-3 h-3" />
              {realUserMetrics.length} Real Tenants
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[10.5px] font-mono font-bold text-purple-800">
              <Receipt className="w-3 h-3" />
              {bookings.length} Total Bookings
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Tenant Bookings &amp; Dakshina Earnings
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            User-wise booking counts, total Dakshina generated, individual transactions, and collection status
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Overview</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {/* ── 4 Compact KPI Summary Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Total Gross Volume */}
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-amber-200/90 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600">Total Dakshina</span>
            <div className="w-7 h-7 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 group-hover:scale-105 transition-transform shadow-2xs">
              <DollarSign className="w-3.5 h-3.5" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-amber-700 tracking-tight">
            ₹{totalVolume.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[10px] text-amber-800 font-semibold truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Across all {bookings.length} ceremonies</span>
          </div>
        </div>

        {/* Collected / Paid */}
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-emerald-200/90 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600">Full Paid</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 group-hover:scale-105 transition-transform shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-emerald-700 tracking-tight">
            {paidCount} Bookings
          </div>
          <div className="mt-1 text-[10px] text-emerald-700 font-semibold truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Dakshina settled</span>
          </div>
        </div>

        {/* Advance Received */}
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-blue-200/90 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600">Advance Paid</span>
            <div className="w-7 h-7 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform shadow-2xs">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-blue-700 tracking-tight">
            ₹{totalAdvance.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[10px] text-blue-700 font-semibold truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            <span>{partialCount} partial advances</span>
          </div>
        </div>

        {/* Pending Balance */}
        <div className="bg-white/95 backdrop-blur-xl p-3 sm:p-3.5 rounded-2xl border border-rose-200/90 shadow-2xs hover:shadow-xs transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600">Pending Balance</span>
            <div className="w-7 h-7 rounded-xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 group-hover:scale-105 transition-transform shadow-2xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div suppressHydrationWarning className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
            ₹{totalBalance.toLocaleString("en-IN")}
          </div>
          <div className="mt-1 text-[10px] text-rose-700 font-semibold truncate flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>{pendingCount} awaiting collection</span>
          </div>
        </div>
      </div>

      {/* ── View Switcher: User-wise Earnings vs Detailed Bookings ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveViewTab("USERS")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeViewTab === "USERS"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-600" />
            <span>User-wise Bookings &amp; Earnings ({filteredUserMetrics.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewTab("BOOKINGS")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeViewTab === "BOOKINGS"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
            <span>All Bookings Ledger ({filteredBookings.length})</span>
          </button>
        </div>

        {/* Selected User Filter Badge (if any) */}
        {selectedUserFilter && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-xl text-xs font-bold text-amber-900">
            <span>Filtered by User: {selectedUserFilter}</span>
            <button
              onClick={() => setSelectedUserFilter(null)}
              className="text-amber-700 hover:text-rose-700 font-bold ml-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-2xl border border-amber-200/80 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeViewTab === "USERS"
                ? "Search user by name, email, mobile, or business..."
                : "Search devotee, ceremony, phone, booking #..."
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:bg-white transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter (Only in Bookings view) */}
        {activeViewTab === "BOOKINGS" && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-amber-500 text-slate-950 shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-emerald-600 text-white shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              Full Paid ({paidCount})
            </button>
            <button
              onClick={() => setStatusFilter("PARTIALLY_PAID")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === "PARTIALLY_PAID"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              Advance ({partialCount})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              Pending ({pendingCount})
            </button>
          </div>
        )}
      </div>

      {/* ── VIEW 1: USER-WISE EARNINGS & BOOKINGS ── */}
      {activeViewTab === "USERS" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-2xs overflow-hidden">
            <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-700" />
                <h3 className="font-extrabold text-sm text-slate-900">
                  User Performance &amp; Dakshina Generated ({filteredUserMetrics.length})
                </h3>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                Click user to filter their individual bookings
              </span>
            </div>

            {filteredUserMetrics.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">No users found</p>
                <p className="text-xs text-slate-500">Try adjusting your search criteria</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUserMetrics.map((metric) => {
                  const isFiltered =
                    selectedUserFilter === metric.business?.id ||
                    selectedUserFilter === metric.user.id;

                  return (
                    <div
                      key={metric.user.id}
                      className={`p-4 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isFiltered
                          ? "bg-amber-50/70 border-l-4 border-l-amber-500"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Left: User Info */}
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shrink-0 shadow-2xs">
                          {metric.user.name?.charAt(0) || "U"}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {metric.user.name}
                            </h4>
                            {metric.isSuperAdmin && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                                Super Admin
                              </span>
                            )}
                            {metric.isDemo && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Demo Sandbox
                              </span>
                            )}
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              {metric.subscription?.planName || "Pro Plan"}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                            <span className="font-semibold text-slate-700">
                              {metric.business?.name || "Independent Temple / Priest"}
                            </span>
                            {metric.user.mobile && (
                              <span className="flex items-center gap-1 font-mono">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {metric.user.mobile}
                              </span>
                            )}
                            <span className="text-slate-400 font-mono text-[10.5px]">
                              {metric.user.email}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Booking Count & Earnings Metric Pills */}
                      <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                        <div className="flex items-center gap-2.5">
                          {/* Bookings Count Pill */}
                          <div className="bg-purple-50/80 border border-purple-200 px-3.5 py-2 rounded-2xl text-center min-w-[95px]">
                            <span className="text-[9.5px] font-bold text-purple-700 uppercase tracking-wider block">
                              Bookings
                            </span>
                            <span className="text-base font-black text-purple-900">
                              {metric.bookingCount}{" "}
                              <span className="text-[10px] font-normal text-purple-700">poojas</span>
                            </span>
                          </div>

                          {/* Earnings Pill */}
                          <div className="bg-emerald-50/80 border border-emerald-200 px-3.5 py-2 rounded-2xl text-center min-w-[110px]">
                            <span className="text-[9.5px] font-bold text-emerald-700 uppercase tracking-wider block">
                              Total Dakshina
                            </span>
                            <span className="text-base font-black text-emerald-800 font-mono">
                              ₹{metric.totalEarnings.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        {/* Filter Bookings Action Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const targetId = metric.business?.id || metric.user.id;
                            setSelectedUserFilter(targetId);
                            setActiveViewTab("BOOKINGS");
                          }}
                          className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl transition flex items-center gap-1 active:scale-95 cursor-pointer shadow-2xs whitespace-nowrap"
                        >
                          <span>View Bookings</span>
                          <ChevronRight className="w-3.5 h-3.5 text-amber-700" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: ALL BOOKINGS LEDGER ── */}
      {activeViewTab === "BOOKINGS" && (
        <div className="bg-white rounded-3xl border border-amber-200/80 shadow-2xs overflow-hidden">
          <div className="px-4 sm:px-6 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt className="w-4 h-4 text-amber-700" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Booking Revenue Records ({filteredBookings.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Click any row for full breakdown</span>
          </div>

          {filteredBookings.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-800">No booking records found</p>
              <p className="text-xs text-slate-500">Try adjusting your search terms or filters</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredBookings.map((b) => {
                const bizInfo = getBusinessInfo(b.businessId);
                const isPaid = b.paymentStatus === "PAID";
                const isPartial = b.paymentStatus === "PARTIALLY_PAID";
                const isPending = b.paymentStatus === "PENDING";

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBooking(b)}
                    className="p-3.5 sm:p-4 hover:bg-amber-50/40 transition-colors cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* Left: Devotee & Ceremony */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-50 to-amber-100/80 border border-amber-200 text-amber-800 flex items-center justify-center font-black text-sm shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                        <Flame className="w-5 h-5 text-amber-600" />
                      </div>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-slate-900 text-sm hover:text-amber-800 transition">
                            {b.customerName || "Devotee"}
                          </span>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold border border-slate-200">
                            #{b.bookingNumber}
                          </span>
                          {b.isSample && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Demo
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-amber-900 truncate">
                          {b.poojaTamilName || b.poojaEnglishName || "Pooja Ceremony"}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {b.date}
                          </span>
                          {b.customerMobile && (
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {b.customerMobile}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-slate-700 font-semibold">
                            <Building2 className="w-3 h-3 text-amber-600" />
                            {bizInfo.bizName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Amounts & Payment Badge */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                          ₹{Number(b.totalAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10.5px] font-medium text-slate-500">
                          {isPaid && (
                            <span className="text-emerald-700 font-bold">100% Received</span>
                          )}
                          {isPartial && (
                            <span className="text-blue-700 font-bold">
                              Adv: ₹{Number(b.advanceAmount || 0).toLocaleString("en-IN")} • Bal: ₹{Number(b.balanceAmount || 0).toLocaleString("en-IN")}
                            </span>
                          )}
                          {isPending && (
                            <span className="text-rose-600 font-bold">Awaiting Dakshina</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                            isPaid
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : isPartial
                              ? "bg-blue-50 text-blue-800 border-blue-300"
                              : "bg-rose-50 text-rose-800 border-rose-300"
                          }`}
                        >
                          {isPaid ? "Full Paid" : isPartial ? "Advance" : "Pending"}
                        </span>

                        <div className="w-7 h-7 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-amber-800 group-hover:bg-amber-100/60 transition shadow-2xs">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Detailed Modal when clicking a Booking row ── */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-amber-300 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 p-5 sm:p-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-900 flex items-center justify-center font-black">
                  <Flame className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-slate-900 text-base">
                      {selectedBooking.customerName || "Devotee"}
                    </h3>
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                      #{selectedBooking.bookingNumber}
                    </span>
                  </div>
                  <p className="text-xs text-amber-900 font-semibold">
                    {selectedBooking.poojaTamilName || selectedBooking.poojaEnglishName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Breakdown Card */}
            <div className="bg-[#fffdfa] rounded-2xl border border-amber-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-100 pb-2">
                <span className="text-xs font-bold text-slate-700">Total Dakshina Agreed</span>
                <span className="text-lg font-black text-slate-900">
                  ₹{Number(selectedBooking.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Advance Paid</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    ₹{Number(selectedBooking.advanceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-bold block">Balance Pending</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    ₹{Number(selectedBooking.balanceAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-500">Payment Status:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                    selectedBooking.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                      : selectedBooking.paymentStatus === "PARTIALLY_PAID"
                      ? "bg-blue-100 text-blue-900 border border-blue-300"
                      : "bg-rose-100 text-rose-900 border border-rose-300"
                  }`}
                >
                  {selectedBooking.paymentStatus === "PAID"
                    ? "Full Paid ✓"
                    : selectedBooking.paymentStatus === "PARTIALLY_PAID"
                    ? "Advance Received"
                    : "Payment Pending"}
                </span>
              </div>

              {selectedBooking.paymentMethod && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Payment Mode:</span>
                  <span className="font-bold text-slate-800">{selectedBooking.paymentMethod}</span>
                </div>
              )}

              {selectedBooking.expenseAmount ? (
                <div className="flex items-center justify-between pt-2 border-t border-amber-100 text-xs text-amber-900">
                  <span>Expense / Samagri Deduction:</span>
                  <span className="font-mono font-bold">₹{selectedBooking.expenseAmount}</span>
                </div>
              ) : null}
            </div>

            {/* Devotee & Ceremony Details */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-700" />
                Devotee &amp; Schedule
              </h4>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Phone:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {selectedBooking.customerMobile || "Not provided"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Date &amp; Time:</span>
                  <span className="font-bold text-slate-900">
                    {selectedBooking.date} • {selectedBooking.startTime || "Morning"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Performing Priest:</span>
                  <span className="font-bold text-amber-900">
                    {selectedBooking.assignedIyerName || "Head Priest"}
                  </span>
                </div>
                {selectedBooking.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Location:</span>
                    <span className="font-medium text-slate-900">{selectedBooking.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Tenant / Organization Info */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-700" />
                Tenant / Provider
              </h4>
              {(() => {
                const biz = getBusinessInfo(selectedBooking.businessId);
                return (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Business / Iyer:</span>
                      <span className="font-bold text-slate-900">{biz.bizName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Owner Contact:</span>
                      <span className="font-mono text-slate-800">{biz.ownerMobile || "—"}</span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Samagri Checklist Count */}
            {selectedBooking.items && selectedBooking.items.length > 0 && (
              <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
                <span className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  Samagri Items List:
                </span>
                <span className="font-bold font-mono">
                  {selectedBooking.items.length} items checklist
                </span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedBooking(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
