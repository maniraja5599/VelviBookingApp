"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import { Booking, Customer } from "@/lib/types";
import {
  normalizeIndianMobile,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "@/lib/utils/phone";
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
  Calendar,
  Layers,
  Wallet,
  Plus,
  Search,
  Phone,
  Share2,
  IndianRupee,
  AlertCircle,
  X,
  Clipboard,
  User,
  ArrowRight,
} from "lucide-react";

export default function HomeDashboardPage() {
  const { currentUser, currentBusiness, subscription } = useAuth();
  const { t } = useLanguage();

  // Current Tamil Date (Timezone-safe)
  const todayLocalDateStr = getLocalDateString();
  const todayInfo = getTamilDate(todayLocalDateStr);

  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // Reactive DB states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"bookings" | "devotees" | "payments" | "analytics">("bookings");

  useEffect(() => {
    setBookings(db.getBookings(businessId));
    setCustomers(db.getCustomers(businessId));
  }, [businessId]);

  const members = useMemo(() => db.getMembers(businessId), [businessId]);
  const ownerMember = useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  // Overall metrics
  const todayBookings = useMemo(() => bookings.filter((b) => b.date === todayInfo.dateStr), [bookings, todayInfo.dateStr]);
  const upcomingBookings = useMemo(() => bookings.filter((b) => b.date >= todayInfo.dateStr).sort((a, b) => a.date.localeCompare(b.date)), [bookings, todayInfo.dateStr]);
  const pendingAmount = useMemo(() => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0), [bookings]);
  const upcomingCount = upcomingBookings.length;

  // Immediate Next Booking for the Vanakkam Ticker
  const immediateNextBooking = useMemo(() => {
    if (todayBookings.length > 0) {
      return todayBookings[0];
    }
    return upcomingBookings.length > 0 ? upcomingBookings[0] : null;
  }, [todayBookings, upcomingBookings]);

  // Sub-Tab 1: Bookings Filter (Today / Upcoming / All)
  const [bookingFilter, setBookingFilter] = useState<"TODAY" | "UPCOMING" | "ALL">("UPCOMING");
  const filteredBookingsList = useMemo(() => {
    if (bookingFilter === "TODAY") return todayBookings;
    if (bookingFilter === "UPCOMING") return upcomingBookings;
    return bookings;
  }, [bookingFilter, todayBookings, upcomingBookings, bookings]);

  // Sub-Tab 2: Devotee Search & Add
  const [devoteeSearch, setDevoteeSearch] = useState("");
  const [showAddDevoteeModal, setShowAddDevoteeModal] = useState(false);
  const [selectedDevoteeDrawer, setSelectedDevoteeDrawer] = useState<Customer | null>(null);

  // New devotee form state
  const [custName, setCustName] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custCity, setCustCity] = useState("Namakkal");
  const [custAddress, setCustAddress] = useState("");
  const [custNotes, setCustNotes] = useState("");
  const [custError, setCustError] = useState("");

  const custMobileInspection = inspectIndianMobile(custMobile);

  const filteredDevoteesList = useMemo(() => {
    const q = devoteeSearch.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, devoteeSearch]);

  const handleAddDevoteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCustError("");

    if (!custName.trim()) {
      setCustError("பக்தர் பெயர் அவசியம் / Devotee Name is required.");
      return;
    }

    let normalizedMobile = "";
    if (custMobile.trim()) {
      const cleanDigits = custMobile.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        setCustError("சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் அல்லது காலியாக விடவும்.");
        return;
      }
      normalizedMobile = normalizeIndianMobile(cleanDigits);

      if (customers.some((c) => c.mobile && normalizeIndianMobile(c.mobile) === normalizedMobile)) {
        setCustError("இந்த மொபைல் எண்ணுடன் ஏற்கனவே ஒரு பக்தர் உள்ளார்.");
        return;
      }
    }

    const newCust: Customer = {
      id: `c-${Date.now()}`,
      businessId,
      name: custName.trim(),
      mobile: normalizedMobile,
      whatsapp: normalizedMobile,
      address: custAddress.trim(),
      city: custCity.trim(),
      notes: custNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    db.customers.unshift(newCust);
    setCustomers([...db.getCustomers(businessId)]);
    setShowAddDevoteeModal(false);
    setCustName("");
    setCustMobile("");
    setCustAddress("");
    setCustNotes("");
  };

  // Sub-Tab 3: Payments & Receipts Filter & Modal
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "PENDING">("ALL");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [recordPaymentBooking, setRecordPaymentBooking] = useState<Booking | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethodInput, setPaymentMethodInput] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>("");

  const filteredPaymentBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (paymentFilter === "PAID" && b.paymentStatus !== "PAID") return false;
      if (paymentFilter === "PARTIAL" && b.paymentStatus !== "PARTIALLY_PAID") return false;
      if (paymentFilter === "PENDING" && b.paymentStatus !== "PENDING") return false;

      if (!paymentSearch.trim()) return true;
      const q = paymentSearch.toLowerCase();
      return (
        b.customerName?.toLowerCase().includes(q) ||
        (b.customerMobile && b.customerMobile.includes(q)) ||
        b.poojaEnglishName?.toLowerCase().includes(q) ||
        (b.poojaTamilName && b.poojaTamilName.toLowerCase().includes(q)) ||
        b.bookingNumber?.toLowerCase().includes(q)
      );
    });
  }, [bookings, paymentFilter, paymentSearch]);

  const handleOpenRecordPayment = (b: Booking) => {
    setRecordPaymentBooking(b);
    setPaymentAmountInput(b.balanceAmount || 0);
  };

  const handleConfirmRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentBooking || paymentAmountInput <= 0) return;

    const target = db.bookings.find((b) => b.id === recordPaymentBooking.id);
    if (target) {
      target.advanceAmount = (target.advanceAmount || 0) + Number(paymentAmountInput);
      target.balanceAmount = Math.max(0, target.totalAmount - target.advanceAmount);
      target.paymentStatus = target.balanceAmount === 0 ? "PAID" : "PARTIALLY_PAID";
      target.updatedAt = new Date().toISOString();
      setBookings([...db.getBookings(businessId)]);
    }

    setPaymentSuccessMessage(`₹${paymentAmountInput.toLocaleString("en-IN")} கட்டணம் பெறப்பட்டது (${recordPaymentBooking.customerName})!`);
    setRecordPaymentBooking(null);
    setTimeout(() => setPaymentSuccessMessage(""), 4000);
  };

  const handleShareReceiptWhatsApp = (b: Booking) => {
    let msg = `🪔 *வேள்வி - பூஜை கட்டண ரசீது / Payment Receipt* 🪔\n\n`;
    msg += `பக்தர் பெயர்: *${b.customerName}*\n`;
    msg += `பதிவு எண்: *${b.bookingNumber}*\n`;
    msg += `பூஜை: *${b.poojaEnglishName}* ${b.poojaTamilName ? `(${b.poojaTamilName})` : ""}\n`;
    msg += `தேதி: *${b.date}* (${b.startTime})\n`;
    msg += `இடம்: *${b.location || "Namakkal"}*\n\n`;
    msg += `----------------------------\n`;
    msg += `மொத்த பூஜை கட்டணம்: *₹${b.totalAmount?.toLocaleString("en-IN")}*\n`;
    msg += `செலுத்திய தொகை: *₹${b.advanceAmount?.toLocaleString("en-IN")}*\n`;
    msg += `நிலுவைத் தொகை: *₹${b.balanceAmount?.toLocaleString("en-IN")}*\n`;
    msg += `நிலை: *${b.paymentStatus === "PAID" ? "முழுதும் செலுத்தப்பட்டது (PAID ✅)" : "நிலுவை உள்ளது (PARTIAL)"}*\n`;
    msg += `----------------------------\n\n`;
    msg += `நன்றி! இறைவனின் பூரண அருள் கிடைக்க வாழ்த்துகிறோம். 🙏\n_வேள்வி செயலி_`;

    const phone = b.customerMobile ? b.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Sub-Tab 4: Analytics Computations
  const totalBilled = useMemo(() => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [bookings]);
  const totalCollected = useMemo(() => bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0), [bookings]);
  const totalDue = useMemo(() => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0), [bookings]);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const topPoojas = useMemo(() => {
    const map = new Map<string, { name: string; count: number; amount: number }>();
    bookings.forEach((b) => {
      const key = b.poojaEnglishName || "Special Pooja";
      const existing = map.get(key) || { name: key, count: 0, amount: 0 };
      existing.count += 1;
      existing.amount += b.totalAmount || 0;
      map.set(key, existing);
    });
    const list = Array.from(map.values()).sort((a, b) => b.amount - a.amount);
    const total = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 1;
    return list.slice(0, 6).map((p) => ({
      ...p,
      percent: Math.round((p.amount / total) * 100),
    }));
  }, [bookings]);

  const teamAllocation = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    bookings.forEach((b) => {
      const key = b.assignedIyerName || "Self";
      const existing = map.get(key) || { name: key, count: 0 };
      existing.count += 1;
      map.set(key, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [bookings]);

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-200">
      {/* 1. Compact Sacred Panchangam & Vanakkam Hero + Next Booking Ticker */}
      <div className="bg-gradient-to-b from-[#fbf8f0] via-[#fffdfa] to-white rounded-2xl p-3 sm:p-3.5 border border-amber-200/90 shadow-2xs space-y-2.5">
        {/* Top Row: Left Greeting + Right Day Pill */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-xs">🪔</span>
              <span className="text-base sm:text-lg font-black text-emerald-950">Vanakkam</span>
              <span className="text-[11px] font-bold text-amber-900 bg-amber-100/90 px-1.5 py-0.5 rounded-md border border-amber-300/70">
                {todayInfo.tamilYear} வருடம்
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5">
              {todayInfo.dayOfWeekEn}, {todayInfo.dayOfMonth} {todayInfo.monthNameEn} • {todayInfo.tamilMonth} {todayInfo.tamilDay}
            </p>
          </div>

          {/* Compact Day Pill */}
          <div className="shrink-0 bg-white px-2.5 py-1 rounded-xl border border-amber-300/80 shadow-2xs text-center">
            <span className="block text-[9.5px] font-bold text-slate-500 uppercase">
              {todayInfo.tamilMonth}
            </span>
            <span className="block text-base font-black text-emerald-950 leading-tight">
              {todayInfo.tamilDay}
            </span>
          </div>
        </div>

        {/* Compact Auspicious Timings Micro-Bar */}
        <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
          <div className="bg-[#f2faf5] px-2.5 py-1.5 rounded-xl border border-emerald-200/80 flex items-center justify-between text-emerald-950">
            <span className="font-bold flex items-center gap-1">
              <span>🍃</span> நல்ல நேரம்:
            </span>
            <span className="font-extrabold text-slate-900">
              {formatTimeRangeTo12H(todayInfo.nallaNeramMorning)}
            </span>
          </div>

          <div className="bg-[#fff9f2] px-2.5 py-1.5 rounded-xl border border-amber-200/80 flex items-center justify-between text-amber-950">
            <span className="font-bold flex items-center gap-1">
              <span>🔥</span> கௌரி:
            </span>
            <span className="font-extrabold text-slate-900">
              {formatTimeRangeTo12H(todayInfo.gowriNallaNeramMorning)}
            </span>
          </div>
        </div>

        {/* Immediate Upcoming Booking Preview Ticker */}
        {immediateNextBooking ? (
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-emerald-500/10 rounded-xl p-2 sm:p-2.5 border border-amber-300/80 flex items-center justify-between gap-2 shadow-2xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 leading-tight flex-wrap sm:flex-nowrap">
                <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 bg-amber-600 text-white rounded uppercase tracking-wider shrink-0">
                  அடுத்த பூஜை
                </span>
                <span className="text-xs font-black text-slate-900 truncate max-w-[120px] sm:max-w-[160px]">
                  {immediateNextBooking.customerName}
                </span>
                <span className="text-[11px] text-slate-700 truncate max-w-[130px] sm:max-w-[200px]">
                  • {immediateNextBooking.poojaEnglishName}
                </span>
              </div>
              <div className="text-[10px] sm:text-[10.5px] text-slate-600 font-medium flex items-center gap-2 mt-1">
                <span>📅 {immediateNextBooking.date} ({immediateNextBooking.startTime})</span>
                {immediateNextBooking.location && (
                  <span className="truncate">📍 {immediateNextBooking.location}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {immediateNextBooking.customerMobile && (
                <a
                  href={`https://wa.me/${immediateNextBooking.customerMobile.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg transition"
                  title="WhatsApp Devotee"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </a>
              )}
              <Link
                href={`/app/bookings/${immediateNextBooking.id}`}
                className="px-2 py-1 bg-amber-900 hover:bg-amber-950 text-white text-[10.5px] font-bold rounded-lg shadow-2xs transition flex items-center gap-0.5"
              >
                <span>View</span>
                <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Compact 3 KPI Metrics (Today, Due, Upcoming) */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Today's Bookings */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("bookings");
            setBookingFilter("TODAY");
          }}
          className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-2xs text-left hover:border-emerald-300 transition active:scale-95"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs">📅</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-50 text-emerald-800 rounded-full">Today</span>
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black text-slate-900 leading-none">
              {todayBookings.length}
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 leading-tight mt-1 truncate">
              இன்றைய பதிவு
            </div>
          </div>
        </button>

        {/* Pending Due */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("payments");
            setPaymentFilter("PENDING");
          }}
          className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-2xs text-left hover:border-amber-300 transition active:scale-95 min-w-0"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs">🪙</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-50 text-amber-800 rounded-full">Due</span>
          </div>
          <div className="mt-1 min-w-0">
            <div className="text-sm sm:text-base font-black text-amber-950 leading-none truncate">
              ₹{pendingAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 leading-tight mt-1 truncate">
              நிலுவைத் தொகை
            </div>
          </div>
        </button>

        {/* Upcoming Bookings */}
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("bookings");
            setBookingFilter("UPCOMING");
          }}
          className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-2xs text-left hover:border-indigo-300 transition active:scale-95"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs">🕒</span>
            <span className="text-[9px] font-extrabold px-1.5 py-0.2 bg-indigo-50 text-indigo-800 rounded-full">Next</span>
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black text-slate-900 leading-none">
              {upcomingCount}
            </div>
            <div className="text-[9.5px] sm:text-[10px] font-bold text-slate-700 leading-tight mt-1 truncate">
              வரவிருக்கும் பதிவு
            </div>
          </div>
        </button>
      </div>

      {/* 3. Main Interactive Sub-Tabs Container */}
      <div className="space-y-3 pt-1">
        {/* Sub-Tab Switcher Bar */}
        <div className="bg-slate-200/90 p-1 rounded-2xl flex items-center text-xs font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("bookings")}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "bookings"
                ? "bg-white text-emerald-950 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🪔 பதிவுகள்</span>
            <span className="text-[9.5px] px-1.5 py-0.2 bg-slate-100 rounded-full font-black">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("devotees")}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "devotees"
                ? "bg-white text-emerald-950 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>👥 பக்தர்கள்</span>
            <span className="text-[9.5px] px-1.5 py-0.2 bg-slate-100 rounded-full font-black">
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("payments")}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "payments"
                ? "bg-white text-emerald-950 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>🪙 கட்டணம்</span>
            {pendingAmount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("analytics")}
            className={`flex-1 py-1.5 sm:py-2 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "analytics"
                ? "bg-white text-emerald-950 shadow-xs font-extrabold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📊 விவரம்</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TAB 1: BOOKINGS (பதிவுகள்)                                            */}
        {/* ========================================================================= */}
        {activeSubTab === "bookings" && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {/* Filter Pills + Add Booking Button */}
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setBookingFilter("UPCOMING")}
                  className={`px-2.5 py-1 rounded-xl font-bold transition ${
                    bookingFilter === "UPCOMING"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  வரவிருக்கும் ({upcomingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter("TODAY")}
                  className={`px-2.5 py-1 rounded-xl font-bold transition ${
                    bookingFilter === "TODAY"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  இன்று ({todayBookings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setBookingFilter("ALL")}
                  className={`px-2.5 py-1 rounded-xl font-bold transition ${
                    bookingFilter === "ALL"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  அனைத்தும் ({bookings.length})
                </button>
              </div>

              <Link
                href="/app/bookings/new"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </Link>
            </div>

            {/* Bookings List */}
            {filteredBookingsList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-2">
                <div className="text-2xl">🪔</div>
                <p className="text-xs font-semibold">பூஜை பதிவுகள் எதுவும் இல்லை</p>
                <Link
                  href="/app/bookings/new"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> புதிய பூஜை பதிவு செய்க
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredBookingsList.map((b) => {
                  const isSelf =
                    b.assignedIyerId === ownerMember?.id ||
                    b.assignedIyerName === currentUser?.name ||
                    b.assignedIyerName === "Ravi Iyer" ||
                    !b.assignedIyerName ||
                    b.assignedIyerName.toLowerCase() === "self";

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition space-y-2"
                    >
                      {/* Top Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300/70">
                              {b.startTime}
                            </span>
                            {isSelf ? (
                              <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded-md border border-emerald-300">
                                🪔 நானே (Self)
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-200">
                                👥 {b.assignedIyerName}
                              </span>
                            )}
                            <span className="text-[9.5px] font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                              {b.date}
                            </span>
                          </div>

                          <h4 className="font-extrabold text-sm text-slate-900 mt-1 truncate">
                            {b.poojaEnglishName}
                          </h4>
                          <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5">
                            <span className="font-semibold text-slate-900">{b.customerName}</span>
                            {b.location && <span>• 📍 {b.location}</span>}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
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

                      {/* Bottom Actions Bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[10px] font-mono text-slate-400">
                          #{b.bookingNumber}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {b.customerMobile && (
                            <>
                              <a
                                href={`tel:${b.customerMobile}`}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                title="Call Devotee"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${b.customerMobile.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-200"
                                title="WhatsApp Devotee"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                          <Link
                            href={`/app/bookings/${b.id}`}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 font-bold text-[11px] rounded-lg transition flex items-center gap-0.5"
                          >
                            <span>விவரம்</span>
                            <ChevronRight className="w-3 h-3" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 2: DEVOTEES / CUSTOMERS (பக்தர்கள்)                               */}
        {/* ========================================================================= */}
        {activeSubTab === "devotees" && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {/* Search & Add Bar */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="பக்தர் பெயர், ஊர், எண்..."
                  value={devoteeSearch}
                  onChange={(e) => setDevoteeSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
                />
              </div>

              <button
                type="button"
                onClick={() => setShowAddDevoteeModal(true)}
                className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ சேர்</span>
              </button>
            </div>

            {/* Devotees List */}
            {filteredDevoteesList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-1">
                <User className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs font-semibold">பக்தர்கள் யாரும் பொருந்தவில்லை</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDevoteesList.map((c) => {
                  const custBookings = bookings.filter(
                    (b) => b.customerId === c.id || b.customerMobile === c.mobile
                  );
                  const initials = c.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2);

                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedDevoteeDrawer(c)}
                      className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300/70 shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {c.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                            <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>{c.city || "Namakkal"}</span>
                            <span>•</span>
                            <span>{custBookings.length} பூஜைகள்</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.mobile && (
                          <>
                            <a
                              href={`tel:${c.mobile}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                              title="Call"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                            <a
                              href={`https://wa.me/${c.mobile.replace(/\D/g, "")}`}
                              onClick={(e) => e.stopPropagation()}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg transition border border-emerald-200"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 3: PAYMENTS & RECEIPTS (கட்டணம்)                                   */}
        {/* ========================================================================= */}
        {activeSubTab === "payments" && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {paymentSuccessMessage && (
              <div className="bg-green-50 border border-green-200 text-green-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMessage}</span>
              </div>
            )}

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <span className="text-[9.5px] text-slate-500 font-semibold block">மொத்தம்</span>
                <span className="font-extrabold text-slate-900 text-xs block mt-0.5">
                  ₹{totalBilled.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[9.5px] text-emerald-800 font-semibold block">பெற்றவை</span>
                <span className="font-extrabold text-emerald-900 text-xs block mt-0.5">
                  ₹{totalCollected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-rose-50 p-2 rounded-xl border border-rose-200 shadow-2xs">
                <span className="text-[9.5px] text-rose-800 font-semibold block">நிலுவை</span>
                <span className="font-extrabold text-rose-950 text-xs block mt-0.5">
                  ₹{totalDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1 text-xs overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => setPaymentFilter("ALL")}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                  paymentFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-white text-slate-600 border border-slate-200"
                }`}
              >
                அனைத்தும்
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("PENDING")}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                  paymentFilter === "PENDING"
                    ? "bg-rose-800 text-white shadow-2xs"
                    : "bg-white text-rose-800 border border-rose-200"
                }`}
              >
                நிலுவை மட்டும்
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("PARTIAL")}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                  paymentFilter === "PARTIAL"
                    ? "bg-amber-800 text-white shadow-2xs"
                    : "bg-white text-amber-800 border border-amber-200"
                }`}
              >
                முன்பணம் மட்டும்
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter("PAID")}
                className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition ${
                  paymentFilter === "PAID"
                    ? "bg-emerald-800 text-white shadow-2xs"
                    : "bg-white text-emerald-800 border border-emerald-200"
                }`}
              >
                முழுதும் பெற்றது
              </button>
            </div>

            {/* Receipts List */}
            {filteredPaymentBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-400 text-xs">
                கட்டணப் பதிவுகள் எதுவும் பொருந்தவில்லை
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPaymentBookings.map((b) => {
                  const isFullyPaid = b.paymentStatus === "PAID" || b.balanceAmount === 0;

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-[10px] text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300/60">
                              #{b.bookingNumber}
                            </span>
                            <h4 className="font-extrabold text-sm text-slate-900 truncate">
                              {b.customerName}
                            </h4>
                          </div>
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            <span>{b.poojaEnglishName}</span> • <span>📅 {b.date}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`inline-block text-[9.5px] px-2 py-0.5 rounded-full font-black ${
                              isFullyPaid
                                ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                : b.advanceAmount > 0
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-rose-100 text-rose-900 border border-rose-300"
                            }`}
                          >
                            {isFullyPaid ? "Paid ✅" : b.advanceAmount > 0 ? "Partial" : "Due"}
                          </span>
                        </div>
                      </div>

                      {/* Amounts Bar */}
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/70 text-center text-xs">
                        <div>
                          <div className="text-[9.5px] text-slate-500">மொத்தம்</div>
                          <div className="font-extrabold text-slate-900">
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-emerald-800">பெற்றது</div>
                          <div className="font-extrabold text-emerald-900">
                            ₹{(b.advanceAmount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9.5px] text-amber-800">நிலுவை</div>
                          <div className={`font-extrabold ${b.balanceAmount > 0 ? "text-amber-950" : "text-slate-400"}`}>
                            ₹{(b.balanceAmount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <span className="text-[10px] text-slate-500">
                          {b.customerMobile || ""}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {b.balanceAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(b)}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
                            >
                              <IndianRupee className="w-3 h-3" />
                              <span>பணம் பெறுக</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShareReceiptWhatsApp(b)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
                          >
                            <Share2 className="w-3 h-3 text-emerald-700" />
                            <span>WhatsApp ரசீது</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUB-TAB 4: ANALYTICS (புள்ளிவிவரம்)                                        */}
        {/* ========================================================================= */}
        {activeSubTab === "analytics" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {/* Realization Progress Bar */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900">கட்டண வசூல் விகிதம்</span>
                <span className="font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  {collectionRate}% Realized
                </span>
              </div>

              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, collectionRate)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-emerald-800">
                  பெற்றது: ₹{totalCollected.toLocaleString("en-IN")}
                </span>
                <span className="text-rose-700">
                  நிலுவை: ₹{totalDue.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Top Pooja Ceremonies */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-600" />
                  <span>பிரபலமான பூஜைகள் & வருவாய்</span>
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  {topPoojas.length} வகைகள்
                </span>
              </div>

              <div className="space-y-2">
                {topPoojas.map((p, idx) => (
                  <div key={p.name} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-4 h-4 rounded-full bg-white border border-slate-300 text-[9px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate max-w-[170px]">
                          {p.name}
                        </span>
                        <span className="text-[9.5px] px-1.5 bg-slate-200 text-slate-700 rounded">
                          {p.count}
                        </span>
                      </div>
                      <div className="text-right font-black text-slate-900">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full ${
                          idx === 0 ? "bg-emerald-600" : idx === 1 ? "bg-amber-500" : "bg-indigo-500"
                        }`}
                        style={{ width: `${Math.min(100, p.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team Allocation */}
            {teamAllocation.length > 0 && (
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2">
                <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>குருக்கள் பூஜை ஒதுக்கீடு</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {teamAllocation.map((m) => (
                    <div
                      key={m.name}
                      className="p-2 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-slate-800 truncate max-w-[100px]">
                        {m.name}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md">
                        {m.count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD DEVOTEE                                                        */}
      {/* ========================================================================= */}
      {showAddDevoteeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">புதிய பக்தர் சேர்க்க</h3>
              <button
                onClick={() => setShowAddDevoteeModal(false)}
                className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {custError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200 font-bold">
                {custError}
              </div>
            )}

            <form onSubmit={handleAddDevoteeSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பக்தர் பெயர் / Devotee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  அலைபேசி எண் / Mobile (விருப்பத்தேர்வு)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={custMobile}
                    onChange={(e) => setCustMobile(cleanPastedIndianMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ஊர் / City</label>
                  <input
                    type="text"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">முகவரி / Address</label>
                  <input
                    type="text"
                    placeholder="Street"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddDevoteeModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  ரத்து
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  சேமிக்கவும்
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: DEVOTEE PROFILE                                                   */}
      {/* ========================================================================= */}
      {selectedDevoteeDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-amber-300 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {selectedDevoteeDrawer.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedDevoteeDrawer.mobile || "எண் குறிப்பிடப்படவில்லை"}</p>
              </div>
              <button
                onClick={() => setSelectedDevoteeDrawer(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1">
              <div className="text-slate-600">
                <span className="font-bold text-slate-800">ஊர்: </span>
                {selectedDevoteeDrawer.city || "Namakkal"}
              </div>
              {selectedDevoteeDrawer.address && (
                <div className="text-slate-600">
                  <span className="font-bold text-slate-800">முகவரி: </span>
                  {selectedDevoteeDrawer.address}
                </div>
              )}
            </div>

            {/* Devotee's bookings */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                பூஜை வரலாறு
              </h4>
              {bookings.filter(
                (b) =>
                  b.customerId === selectedDevoteeDrawer.id ||
                  b.customerMobile === selectedDevoteeDrawer.mobile
              ).length === 0 ? (
                <p className="text-xs text-slate-400">பதிவுகள் எதுவும் இல்லை.</p>
              ) : (
                bookings
                  .filter(
                    (b) =>
                      b.customerId === selectedDevoteeDrawer.id ||
                      b.customerMobile === selectedDevoteeDrawer.mobile
                  )
                  .map((b) => (
                    <div
                      key={b.id}
                      className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{b.poojaEnglishName}</div>
                        <div className="text-[10.5px] text-slate-500">
                          {b.date} • {b.startTime}
                        </div>
                      </div>
                      <div className="text-right font-black text-slate-900">
                        ₹{b.totalAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                  ))
              )}
            </div>

            <button
              onClick={() => setSelectedDevoteeDrawer(null)}
              className="w-full py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-2xs"
            >
              முடிந்தது (Close)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: RECORD PAYMENT                                                     */}
      {/* ========================================================================= */}
      {recordPaymentBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
                <span>கட்டணம் பெறுதல்</span>
              </h3>
              <button
                type="button"
                onClick={() => setRecordPaymentBooking(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{recordPaymentBooking.customerName}</div>
              <div className="text-slate-600">
                {recordPaymentBooking.poojaEnglishName} • #{recordPaymentBooking.bookingNumber}
              </div>
              <div className="text-amber-950 font-extrabold pt-1">
                மொத்த நிலுவைத் தொகை: ₹{recordPaymentBooking.balanceAmount?.toLocaleString("en-IN")}
              </div>
            </div>

            <form onSubmit={handleConfirmRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பெற்ற தொகை / Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={recordPaymentBooking.balanceAmount}
                  value={paymentAmountInput}
                  onChange={(e) => setPaymentAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  செலுத்திய முறை / Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CASH">ரொக்கம் (Cash in Hand)</option>
                  <option value="BANK_TRANSFER">வங்கிப் பரிவர்த்தனை (Bank Transfer)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRecordPaymentBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  ரத்து
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  பதிவு செய்
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

