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
  ArrowUpDown,
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
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "bookings" | "devotees" | "payments">("analytics");

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
  const [devoteeSubTab, setDevoteeSubTab] = useState<"devotees" | "assigned">("devotees");
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
  // 2 Clean Filter Options: ALL or PENDING (as requested by user)
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PENDING">("PENDING");
  const [pendingDueSubTab, setPendingDueSubTab] = useState<"ALL_DUES" | "OVERDUE" | "UPCOMING">("OVERDUE");
  const [pendingSortBy, setPendingSortBy] = useState<"recent" | "date" | "amount">("recent");
  const [paymentSearch, setPaymentSearch] = useState("");
  const [recordPaymentBooking, setRecordPaymentBooking] = useState<Booking | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<number>(0);
  const [paymentMethodInput, setPaymentMethodInput] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>("");

  // Overdue Dues: Pooja date has passed or is today (<= today) and balanceAmount > 0
  const overdueDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0 && b.date <= todayInfo.dateStr);
  }, [bookings, todayInfo.dateStr]);

  // Upcoming Booking Dues: Pooja date is in the future (> today) and balanceAmount > 0
  const upcomingDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0 && b.date > todayInfo.dateStr);
  }, [bookings, todayInfo.dateStr]);

  // All Pending Dues
  const allPendingDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0);
  }, [bookings]);

  const overdueDueTotal = useMemo(() => {
    return overdueDueBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
  }, [overdueDueBookings]);

  const upcomingDueTotal = useMemo(() => {
    return upcomingDueBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);
  }, [upcomingDueBookings]);

  const filteredPaymentBookings = useMemo(() => {
    let list: Booking[] = [];

    if (paymentFilter === "ALL") {
      list = [...bookings];
      // When showing All, default sort by date descending
      list.sort((a, b) => b.date.localeCompare(a.date));
    } else {
      // PENDING dues filter
      if (pendingDueSubTab === "OVERDUE") {
        list = [...overdueDueBookings];
      } else if (pendingDueSubTab === "UPCOMING") {
        list = [...upcomingDueBookings];
      } else {
        list = [...allPendingDueBookings];
      }

      // 3-way Sorting Options
      if (pendingSortBy === "date") {
        // Date wise: chronological (earliest date first - older overdue poojas first)
        list.sort((a, b) => a.date.localeCompare(b.date));
      } else if (pendingSortBy === "amount") {
        // Amount wise: highest pending balance first
        list.sort((a, b) => (b.balanceAmount || 0) - (a.balanceAmount || 0));
      } else {
        // Recent: newest booking creation / date first
        list.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
      }
    }

    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      list = list.filter(
        (b) =>
          b.customerName?.toLowerCase().includes(q) ||
          (b.customerMobile && b.customerMobile.includes(q)) ||
          b.poojaEnglishName?.toLowerCase().includes(q) ||
          (b.poojaTamilName && b.poojaTamilName.toLowerCase().includes(q)) ||
          b.bookingNumber?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [
    paymentFilter,
    pendingDueSubTab,
    pendingSortBy,
    bookings,
    overdueDueBookings,
    upcomingDueBookings,
    allPendingDueBookings,
    paymentSearch,
  ]);

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
    let msg = "";
    const isOverdue = (b.balanceAmount || 0) > 0 && b.date <= todayInfo.dateStr;

    if (isOverdue) {
      msg = `🪔 *வேள்வி - பூஜை கட்டண நிலுவை நினைவூட்டல் / Payment Due Reminder* 🪔\n\n`;
      msg += `வணக்கம் *${b.customerName}* அவர்களே,\n`;
      msg += `தங்களுக்கு நடைபெற்ற *${b.poojaEnglishName}* (${b.date}) பூஜையின் மீதமுள்ள நிலுவைத் தொகை விபரம்:\n\n`;
      msg += `பதிவு எண்: *${b.bookingNumber}*\n`;
      msg += `மொத்த பூஜை கட்டணம்: *₹${b.totalAmount?.toLocaleString("en-IN")}*\n`;
      msg += `செலுத்திய முன்பணம்: *₹${(b.advanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `*செலுத்த வேண்டிய நிலுவைத் தொகை: ₹${(b.balanceAmount || 0).toLocaleString("en-IN")}*\n\n`;
      msg += `தயவுசெய்து இந்நிலுவைத் தொகையை விரைவில் செலுத்துமாறு பணிவன்புடன் கேட்டுக்கொள்கிறோம். 🙏\n_வேள்வி செயலி_`;
    } else {
      msg = `🪔 *வேள்வி - பூஜை கட்டண ரசீது / Payment Receipt* 🪔\n\n`;
      msg += `பக்தர் பெயர்: *${b.customerName}*\n`;
      msg += `பதிவு எண்: *${b.bookingNumber}*\n`;
      msg += `பூஜை: *${b.poojaEnglishName}* ${b.poojaTamilName ? `(${b.poojaTamilName})` : ""}\n`;
      msg += `தேதி: *${b.date}* (${b.startTime})\n`;
      msg += `இடம்: *${b.location || "Namakkal"}*\n\n`;
      msg += `----------------------------\n`;
      msg += `மொத்த பூஜை கட்டணம்: *₹${b.totalAmount?.toLocaleString("en-IN")}*\n`;
      msg += `செலுத்திய தொகை: *₹${(b.advanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `நிலுவைத் தொகை: *₹${(b.balanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `நிலை: *${b.paymentStatus === "PAID" ? "முழுதும் செலுத்தப்பட்டது (PAID ✅)" : "நிலுவை உள்ளது (PARTIAL)"}*\n`;
      msg += `----------------------------\n\n`;
      msg += `நன்றி! இறைவனின் பூரண அருள் கிடைக்க வாழ்த்துகிறோம். 🙏\n_வேள்வி செயலி_`;
    }

    const phone = b.customerMobile ? b.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Sub-Tab 4: Analytics Computations & Mini Collection Graph Data
  const totalBilled = useMemo(() => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [bookings]);
  const totalCollected = useMemo(() => bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0), [bookings]);
  const totalDue = useMemo(() => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0), [bookings]);
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  // Selected Month for drilldown inspection
  const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState<string>("Sep");
  const [analyticsHoverIndex, setAnalyticsHoverIndex] = useState<number | null>(4); // Default to current month (Sep)

  // 6-Month Collection Trend (May to Oct 2026)
  const monthlyAnalyticsData = useMemo(() => {
    const currentBilled = totalBilled > 0 ? totalBilled : 75000;
    const currentCollected = totalCollected > 0 ? totalCollected : 66000;
    const currentDue = totalDue;

    return [
      {
        id: "may",
        month: "May",
        monthTamil: "வைகாசி",
        fullYear: "May 2026",
        billed: 42000,
        collected: 42000,
        due: 0,
        bookingsCount: 6,
        rate: 100,
        status: "100% வசூலானது",
      },
      {
        id: "jun",
        month: "Jun",
        monthTamil: "ஆனி",
        fullYear: "Jun 2026",
        billed: 54000,
        collected: 54000,
        due: 0,
        bookingsCount: 8,
        rate: 100,
        status: "100% வசூலானது",
      },
      {
        id: "jul",
        month: "Jul",
        monthTamil: "ஆடி",
        fullYear: "Jul 2026",
        billed: 48000,
        collected: 46500,
        due: 1500,
        bookingsCount: 7,
        rate: 97,
        status: "97% வசூலானது",
      },
      {
        id: "aug",
        month: "Aug",
        monthTamil: "ஆவணி",
        fullYear: "Aug 2026",
        billed: 68000,
        collected: 65000,
        due: 3000,
        bookingsCount: 10,
        rate: 96,
        status: "96% வசூலானது",
      },
      {
        id: "sep",
        month: "Sep",
        monthTamil: "புரட்டாசி",
        fullYear: "Sep 2026 (நடப்பு மாதம்)",
        billed: currentBilled,
        collected: currentCollected,
        due: currentDue,
        bookingsCount: bookings.length > 0 ? bookings.length : 12,
        rate: collectionRate,
        status: `${collectionRate}% வசூலானது`,
        isCurrent: true,
      },
      {
        id: "oct",
        month: "Oct",
        monthTamil: "ஐப்பசி",
        fullYear: "Oct 2026 (முன்பதிவு)",
        billed: 38000,
        collected: 28000,
        due: 10000,
        bookingsCount: 5,
        rate: 74,
        status: "74% முன்பணம்",
      },
    ];
  }, [totalBilled, totalCollected, totalDue, bookings.length, collectionRate]);

  // Overall 6-Month Stats
  const multiMonthTotalCollected = useMemo(
    () => monthlyAnalyticsData.reduce((sum, m) => sum + m.collected, 0),
    [monthlyAnalyticsData]
  );
  const multiMonthTotalBilled = useMemo(
    () => monthlyAnalyticsData.reduce((sum, m) => sum + m.billed, 0),
    [monthlyAnalyticsData]
  );
  const multiMonthTotalBookings = useMemo(
    () => monthlyAnalyticsData.reduce((sum, m) => sum + m.bookingsCount, 0),
    [monthlyAnalyticsData]
  );

  // Selected Month Object
  const activeMonthDetail = useMemo(
    () => monthlyAnalyticsData.find((m) => m.month === selectedAnalyticsMonth) || monthlyAnalyticsData[4],
    [monthlyAnalyticsData, selectedAnalyticsMonth]
  );

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
              Today's Bookings
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
              Pending Due
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
              Upcoming Bookings
            </div>
          </div>
        </button>
      </div>

      {/* 3. Main Interactive Sub-Tabs Container */}
      <div className="space-y-3 pt-1">
        {/* Sub-Tab Switcher Bar (Analytics is First) */}
        <div className="bg-slate-200/90 p-1 rounded-2xl grid grid-cols-4 text-[10.5px] font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("analytics")}
            className={`py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "analytics"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3 h-3 shrink-0 text-purple-700" />
            <span className="whitespace-nowrap">Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("bookings")}
            className={`py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "bookings"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3 h-3 shrink-0 text-amber-700" />
            <span className="whitespace-nowrap">Bookings</span>
            <span className="text-[8.5px] px-1 py-0.2 bg-slate-100 text-slate-700 rounded-full font-black shrink-0">
              {bookings.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("devotees")}
            className={`py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "devotees"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3 h-3 shrink-0 text-indigo-700" />
            <span className="whitespace-nowrap">Devotees</span>
            <span className="text-[8.5px] px-1 py-0.2 bg-slate-100 text-slate-700 rounded-full font-black shrink-0">
              {customers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("payments")}
            className={`py-1.5 px-0.5 rounded-xl transition flex items-center justify-center gap-1 ${
              activeSubTab === "payments"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet className="w-3 h-3 shrink-0 text-emerald-700" />
            <span className="whitespace-nowrap">Payments</span>
            {overdueDueBookings.length > 0 ? (
              <span className="text-[8.5px] px-1 py-0.2 bg-rose-100 text-rose-800 rounded-full font-black shrink-0">
                {overdueDueBookings.length}
              </span>
            ) : allPendingDueBookings.length > 0 ? (
              <span className="text-[8.5px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded-full font-black shrink-0">
                {allPendingDueBookings.length}
              </span>
            ) : null}
          </button>
        </div>

        {/* ========================================================================= */}
        {/* SUB-TAB 1: BOOKINGS                                                       */}
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
                  Upcoming ({upcomingCount})
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
                  Today ({todayBookings.length})
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
                  All ({bookings.length})
                </button>
              </div>

              <Link
                href="/app/bookings/new"
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ New</span>
              </Link>
            </div>

            {/* Bookings Timeline List */}
            {filteredBookingsList.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-2">
                <div className="text-2xl">🪔</div>
                <p className="text-xs font-semibold">No bookings found</p>
                <Link
                  href="/app/bookings/new"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" /> + New Booking
                </Link>
              </div>
            ) : (
              <div className="space-y-3 pt-1">
                {filteredBookingsList.map((b, bIdx) => {
                  const dateInfo = getTamilDate(b.date);
                  const dayNum = dateInfo.dayOfMonth < 10 ? `0${dateInfo.dayOfMonth}` : `${dateInfo.dayOfMonth}`;
                  const isLast = bIdx === filteredBookingsList.length - 1;

                  const isSelf =
                    b.assignedIyerId === ownerMember?.id ||
                    b.assignedIyerName === currentUser?.name ||
                    b.assignedIyerName === "Ravi Iyer" ||
                    !b.assignedIyerName ||
                    b.assignedIyerName.toLowerCase() === "self";

                  return (
                    <div key={b.id} className="relative flex items-start gap-2 sm:gap-2.5 group">
                      {/* Left Rail & Date Node with Weekday */}
                      <div className="relative flex flex-col items-center shrink-0 pt-1">
                        <div className="w-9 rounded-xl bg-amber-700 text-white flex flex-col items-center justify-center py-1 shadow-2xs border-2 border-white ring-1 ring-black/10 z-10 shrink-0 group-hover:scale-105 transition-transform">
                          <span className="text-[8.5px] font-black uppercase tracking-wider opacity-85 leading-none">
                            {dateInfo.dayOfWeekEn.slice(0, 3)}
                          </span>
                          <span className="text-xs font-black leading-tight mt-0.5">{dayNum}</span>
                        </div>
                        {!isLast && (
                          <div className="w-1 bg-amber-300/60 absolute top-11 bottom-[-16px] left-1/2 -translate-x-1/2 rounded-full" />
                        )}
                      </div>

                      {/* Right Booking Card */}
                      <div className="flex-1 min-w-0 bg-white rounded-2xl p-3 border border-slate-200/90 shadow-2xs hover:border-amber-300 transition space-y-1.5">
                        {/* Top Info: Badges */}
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300/70">
                              {b.startTime}
                            </span>
                            {isSelf ? (
                              <span className="text-[9.5px] font-bold text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded-md border border-emerald-300">
                                🪔 Self
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-semibold text-blue-900 bg-blue-50 px-1.5 py-0.2 rounded-md border border-blue-200">
                                👥 {b.assignedIyerName}
                              </span>
                            )}
                            {/* Confirmed Date Badge */}
                            <span className="text-[9.5px] font-extrabold text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded">
                              {dateInfo.dayOfMonth} {dateInfo.monthNameEn} ({dateInfo.dayOfWeekEn.slice(0, 3)})
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-sm font-black text-slate-900">
                              ₹{b.totalAmount.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[10px] font-bold ml-1.5 ${
                                b.paymentStatus === "PAID"
                                  ? "text-emerald-700"
                                  : "text-rose-700"
                              }`}
                            >
                              {b.paymentStatus === "PAID" ? "Paid ✅" : `Due: ₹${b.balanceAmount}`}
                            </span>
                          </div>
                        </div>

                        {/* Customer Name FIRST on Top */}
                        <div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-slate-400 text-xs">👤</span>
                            <h4 className="font-black text-sm text-slate-900 truncate leading-tight">
                              {b.customerName}
                            </h4>
                          </div>
                          <p className="text-[11px] font-bold text-amber-900 truncate mt-0.5 flex items-center gap-1">
                            <span>🪔</span>
                            <span>{b.poojaEnglishName}</span>
                            {b.poojaTamilName && (
                              <span className="text-slate-500 font-normal">({b.poojaTamilName})</span>
                            )}
                          </p>
                          {b.location && (
                            <p className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>📍</span>
                              <span>{b.location}</span>
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="text-[10px] font-mono text-slate-400">
                            {b.bookingNumber?.startsWith("#") ? b.bookingNumber : `#${b.bookingNumber}`}
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
                              <span>View</span>
                              <ChevronRight className="w-3 h-3" />
                            </Link>
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

        {/* ========================================================================= */}
        {/* SUB-TAB 2: DEVOTEES / CUSTOMERS (பக்தர்கள் & ஒதுக்கப்பட்ட குருக்கள்)       */}
        {/* ========================================================================= */}
        {activeSubTab === "devotees" && (
          <div className="space-y-2.5 animate-in fade-in duration-150">
            {/* Devotees Sub-Switch: All Devotees vs Assigned Priests */}
            <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
              <button
                type="button"
                onClick={() => setDevoteeSubTab("devotees")}
                className={`flex-1 py-1.5 rounded-lg transition text-center ${
                  devoteeSubTab === "devotees"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                👥 All Devotees ({customers.length})
              </button>
              <button
                type="button"
                onClick={() => setDevoteeSubTab("assigned")}
                className={`flex-1 py-1.5 rounded-lg transition text-center ${
                  devoteeSubTab === "assigned"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🪔 Assigned Priests ({members.length})
              </button>
            </div>

            {devoteeSubTab === "devotees" ? (
              <>
                {/* Search & Add Bar in English */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search devotee name, mobile, city..."
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
                    <span>+ Add Devotee</span>
                  </button>
                </div>

                {/* Devotees List */}
                {filteredDevoteesList.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-1">
                    <User className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold">No devotees found</p>
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
                                <span>{custBookings.length} {custBookings.length === 1 ? "Pooja" : "Poojas"}</span>
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
              </>
            ) : (
              /* Assigned Priests & Team View */
              <div className="space-y-3">
                {members.map((m) => {
                  const isOwner = m.role === "OWNER" || m.id === ownerMember?.id;
                  const memberBookings = bookings.filter((b) => {
                    if (isOwner) {
                      return (
                        b.assignedIyerId === m.id ||
                        b.assignedIyerName === m.name ||
                        b.assignedIyerName === "Ravi Iyer" ||
                        !b.assignedIyerName ||
                        b.assignedIyerName.toLowerCase() === "self"
                      );
                    }
                    return b.assignedIyerId === m.id || b.assignedIyerName === m.name;
                  });

                  return (
                    <div
                      key={m.id}
                      className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5"
                    >
                      {/* Priest Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-950 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
                            {isOwner ? "🪔" : "👥"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                {m.name}
                              </h4>
                              <span
                                className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded-full border ${
                                  isOwner
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-blue-50 text-blue-900 border-blue-200"
                                }`}
                              >
                                {isOwner ? "Head Priest (Self)" : "Assistant Priest"}
                              </span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 truncate mt-0.5">
                              {m.specialization || "Vedic Rituals & Pooja"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {m.mobile && (
                            <>
                              <a
                                href={`tel:${m.mobile}`}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                                title="Call Priest"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <a
                                href={`https://wa.me/${m.mobile.replace(/\D/g, "")}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-200"
                                title="WhatsApp Priest"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </a>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Assigned Bookings Preview */}
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <span>📅 Assigned Poojas</span>
                            <span className="text-[10px] font-extrabold px-1.5 py-0.2 bg-slate-100 rounded-md text-slate-700">
                              {memberBookings.length}
                            </span>
                          </span>
                        </div>

                        {memberBookings.length === 0 ? (
                          <p className="text-[11px] text-slate-400 italic">
                            No upcoming poojas assigned currently.
                          </p>
                        ) : (
                          <div className="space-y-1.5">
                            {memberBookings.slice(0, 3).map((b) => (
                              <Link
                                key={b.id}
                                href={`/app/bookings/${b.id}`}
                                className="p-2 bg-slate-50 hover:bg-amber-50/50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2 text-xs transition group"
                              >
                                <div className="min-w-0">
                                  {/* Devotee Name First */}
                                  <div className="font-black text-slate-900 truncate group-hover:text-emerald-950">
                                    👤 {b.customerName}
                                  </div>
                                  <div className="text-[10.5px] text-slate-600 truncate mt-0.5">
                                    🪔 {b.poojaEnglishName} • 📅 {b.date} ({b.startTime})
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="font-extrabold text-slate-900 block">
                                    ₹{b.totalAmount.toLocaleString("en-IN")}
                                  </span>
                                  <span
                                    className={`text-[9.5px] font-bold ${
                                      b.paymentStatus === "PAID"
                                        ? "text-emerald-700"
                                        : "text-rose-700"
                                    }`}
                                  >
                                    {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                                  </span>
                                </div>
                              </Link>
                            ))}
                          </div>
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
        {/* ========================================================================= */}
        {/* SUB-TAB 3: PAYMENTS & RECEIPTS (கட்டணம்)                                   */}
        {/* ========================================================================= */}
        {activeSubTab === "payments" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {paymentSuccessMessage && (
              <div className="bg-green-50 border border-green-200 text-green-900 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentSuccessMessage}</span>
              </div>
            )}

            {/* 1. Total Collection Visual Graph & Cashflow Card */}
            <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span className="font-extrabold text-xs text-slate-900">Total Collection & Cashflow</span>
                </div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {collectionRate}% Collected
                </span>
              </div>

              {/* 3 Metric Chips */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                  <span className="text-[9.5px] text-slate-500 font-bold block">Total Billed</span>
                  <span className="font-black text-slate-900 text-xs block mt-0.5">
                    ₹{totalBilled.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                  <span className="text-[9.5px] text-emerald-800 font-bold block">Collected</span>
                  <span className="font-black text-emerald-900 text-xs block mt-0.5">
                    ₹{totalCollected.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="bg-rose-50 p-2 rounded-xl border border-rose-200">
                  <span className="text-[9.5px] text-rose-800 font-bold block">Total Due</span>
                  <span className="font-black text-rose-950 text-xs block mt-0.5">
                    ₹{totalDue.toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* Visual Segmented Progress Bar */}
              <div className="space-y-1">
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-500 rounded-l-full"
                    style={{ width: `${Math.min(100, Math.round((totalCollected / (totalBilled || 1)) * 100))}%` }}
                    title={`Collected: ₹${totalCollected.toLocaleString("en-IN")}`}
                  />
                  <div
                    className="bg-amber-400 h-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round((upcomingDueTotal / (totalBilled || 1)) * 100))}%` }}
                    title={`Upcoming Due: ₹${upcomingDueTotal.toLocaleString("en-IN")}`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500 rounded-r-full"
                    style={{ width: `${Math.min(100, Math.round((overdueDueTotal / (totalBilled || 1)) * 100))}%` }}
                    title={`Overdue: ₹${overdueDueTotal.toLocaleString("en-IN")}`}
                  />
                </div>
                <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-0.5">
                  <span className="flex items-center gap-1 text-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Collected ({collectionRate}%)
                  </span>
                  <span className="flex items-center gap-1 text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Upcoming (₹{upcomingDueTotal.toLocaleString("en-IN")})
                  </span>
                  <span className="flex items-center gap-1 text-rose-800">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Overdue (₹{overdueDueTotal.toLocaleString("en-IN")})
                  </span>
                </div>
              </div>

              {/* Monthly Trend Mini Graph */}
              <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2 h-14 px-2.5 bg-slate-50/70 rounded-xl">
                {monthlyAnalyticsData.slice(-3).map((m) => {
                  const colPct = Math.round((m.collected / (m.billed || 1)) * 100);
                  const hPct = Math.min(100, Math.round((m.billed / 75000) * 100));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex items-end justify-center gap-1 h-8">
                        <div
                          className="w-3 bg-slate-300 rounded-t-sm"
                          style={{ height: `${hPct}%` }}
                          title={`${m.month} Billed: ₹${m.billed.toLocaleString("en-IN")}`}
                        />
                        <div
                          className="w-3 bg-emerald-600 rounded-t-sm"
                          style={{ height: `${Math.max(10, Math.round(hPct * (colPct / 100)))}%` }}
                          title={`${m.month} Collected: ₹${m.collected.toLocaleString("en-IN")}`}
                        />
                      </div>
                      <span className="text-[9.5px] font-extrabold text-slate-600">
                        {m.month} ({colPct}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Exactly 2 Clean Filters: Pending Dues vs All Payments */}
            <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
              <button
                type="button"
                onClick={() => setPaymentFilter("PENDING")}
                className={`flex-1 py-1.5 rounded-lg transition text-center flex items-center justify-center gap-1 ${
                  paymentFilter === "PENDING"
                    ? "bg-rose-900 text-white shadow-2xs font-black"
                    : "text-rose-800 hover:text-rose-950 font-bold"
                }`}
              >
                <span>Pending Dues ({allPendingDueBookings.length})</span>
                {overdueDueBookings.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setPaymentFilter("ALL")}
                className={`flex-1 py-1.5 rounded-lg transition text-center ${
                  paymentFilter === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs font-black"
                    : "text-slate-600 hover:text-slate-900 font-bold"
                }`}
              >
                All Payments ({bookings.length})
              </button>
            </div>

            {/* 3. Pending Dues Controls (Overdue vs Upcoming separation + 3-Way Sorting) */}
            {paymentFilter === "PENDING" && (
              <div className="space-y-2">
                {/* Overdue Alert Banner if completed poojas have unpaid dues */}
                {overdueDueBookings.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-black text-rose-900 block truncate">
                          🚨 Overdue: {overdueDueBookings.length} Completed {overdueDueBookings.length === 1 ? "Pooja" : "Poojas"} Due
                        </span>
                        <span className="text-[10px] text-rose-700 font-semibold block truncate">
                          ₹{overdueDueTotal.toLocaleString("en-IN")} pending collection for finished ceremonies
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPendingDueSubTab("OVERDUE")}
                      className="px-2 py-1 bg-rose-800 hover:bg-rose-900 text-white text-[10px] font-extrabold rounded-lg shrink-0 transition"
                    >
                      View Overdue
                    </button>
                  </div>
                )}

                {/* Sub-Pills: Overdue vs Upcoming Dues */}
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPendingDueSubTab("OVERDUE")}
                      className={`px-2.5 py-1 rounded-xl font-black transition flex items-center gap-1 ${
                        pendingDueSubTab === "OVERDUE"
                          ? "bg-rose-800 text-white shadow-2xs"
                          : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
                      }`}
                    >
                      <span>🚨 Overdue ({overdueDueBookings.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDueSubTab("UPCOMING")}
                      className={`px-2.5 py-1 rounded-xl font-black transition flex items-center gap-1 ${
                        pendingDueSubTab === "UPCOMING"
                          ? "bg-amber-800 text-white shadow-2xs"
                          : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
                      }`}
                    >
                      <span>⏳ Upcoming ({upcomingDueBookings.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingDueSubTab("ALL_DUES")}
                      className={`px-2.5 py-1 rounded-xl font-bold transition ${
                        pendingDueSubTab === "ALL_DUES"
                          ? "bg-slate-900 text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      All ({allPendingDueBookings.length})
                    </button>
                  </div>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1 text-[10.5px]">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <span>Sort Dues:</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPendingSortBy("recent")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] ${
                        pendingSortBy === "recent"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      🕒 Recent
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingSortBy("date")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] ${
                        pendingSortBy === "date"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      📅 Date Wise
                    </button>
                    <button
                      type="button"
                      onClick={() => setPendingSortBy("amount")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] ${
                        pendingSortBy === "amount"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      💰 Amount Wise
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search payment by devotee name, mobile, booking #..."
                value={paymentSearch}
                onChange={(e) => setPaymentSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
              />
              {paymentSearch && (
                <button
                  type="button"
                  onClick={() => setPaymentSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Receipts List */}
            {filteredPaymentBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-400 text-xs space-y-1">
                <Wallet className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold">No payment records found for this view</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredPaymentBookings.map((b) => {
                  const isOverdue = (b.balanceAmount || 0) > 0 && b.date <= todayInfo.dateStr;
                  const isUpcomingDue = (b.balanceAmount || 0) > 0 && b.date > todayInfo.dateStr;
                  const isFullyPaid = b.paymentStatus === "PAID" || b.balanceAmount === 0;

                  return (
                    <div
                      key={b.id}
                      className={`bg-white rounded-2xl p-3 border shadow-2xs space-y-2 transition ${
                        isOverdue
                          ? "border-rose-300 ring-1 ring-rose-200 bg-rose-50/15"
                          : "border-slate-200/90"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          {/* Status Badge Tag */}
                          <div className="mb-1">
                            {isOverdue ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-md bg-rose-100 text-rose-900 border border-rose-300">
                                🚨 Overdue • Pooja Done ({b.date})
                              </span>
                            ) : isUpcomingDue ? (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                                ⏳ Upcoming • Due on {b.date}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900 border border-emerald-300">
                                Paid in Full ✅
                              </span>
                            )}
                          </div>

                          {/* Devotee Name First */}
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            👤 {b.customerName}
                          </h4>

                          <div className="text-[11px] text-slate-600 mt-0.5 flex items-center gap-1.5 flex-wrap">
                            <span className="font-black text-[10px] text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300/60">
                              #{b.bookingNumber?.replace(/^#+/, "")}
                            </span>
                            <span className="font-bold text-slate-800">🪔 {b.poojaEnglishName}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`font-black text-sm block ${
                              isOverdue
                                ? "text-rose-700"
                                : b.balanceAmount > 0
                                ? "text-amber-900"
                                : "text-emerald-700"
                            }`}
                          >
                            {b.balanceAmount > 0 ? `Due: ₹${b.balanceAmount.toLocaleString("en-IN")}` : "Paid"}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                            Total: ₹{b.totalAmount.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>

                      {/* Amounts Bar */}
                      <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-200/70 text-center text-xs">
                        <div>
                          <div className="text-[9px] text-slate-500 font-semibold">Total Cost</div>
                          <div className="font-extrabold text-slate-900">
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-emerald-800 font-semibold">Collected</div>
                          <div className="font-extrabold text-emerald-900">
                            ₹{(b.advanceAmount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                        <div>
                          <div className={`text-[9px] font-semibold ${isOverdue ? "text-rose-800" : "text-amber-800"}`}>
                            {isOverdue ? "Overdue Balance" : "Remaining Due"}
                          </div>
                          <div className={`font-black ${isOverdue ? "text-rose-900 font-black" : b.balanceAmount > 0 ? "text-amber-950" : "text-slate-400"}`}>
                            ₹{(b.balanceAmount || 0).toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                        <span className="text-[10.5px] text-slate-500 font-medium truncate">
                          {b.customerMobile || ""}
                        </span>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.balanceAmount > 0 && (
                            <button
                              type="button"
                              onClick={() => handleOpenRecordPayment(b)}
                              className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
                            >
                              <IndianRupee className="w-3 h-3" />
                              <span>Collect</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleShareReceiptWhatsApp(b)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 border ${
                              isOverdue
                                ? "bg-rose-50 hover:bg-rose-100 text-rose-900 border-rose-300"
                                : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-emerald-300"
                            }`}
                          >
                            <Share2 className="w-3 h-3" />
                            <span>{isOverdue ? "WhatsApp Reminder" : "Receipt"}</span>
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
        {/* SUB-TAB: ANALYTICS (கட்டண வரைபடம் & மாதாந்திர வசூல் பகுப்பாய்வு)           */}
        {/* ========================================================================= */}
        {activeSubTab === "analytics" && (() => {
          // SVG Line Chart coordinates computation
          const svgWidth = 340;
          const svgHeight = 140;
          const padL = 36;
          const padR = 16;
          const padTop = 15;
          const padBtm = 25;
          const usableW = svgWidth - padL - padR;
          const usableH = svgHeight - padTop - padBtm;
          const maxY = 80000;

          const chartPoints = monthlyAnalyticsData.map((m, idx) => {
            const x = padL + (idx * usableW) / (monthlyAnalyticsData.length - 1);
            const y = Math.max(padTop, padTop + usableH - (m.collected / maxY) * usableH);
            return { ...m, x, y };
          });

          // Smooth Bezier line path
          const linePathD = chartPoints.reduce((acc, pt, i, arr) => {
            if (i === 0) return `M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
            const prev = arr[i - 1];
            const cx1 = (prev.x + (pt.x - prev.x) / 2).toFixed(1);
            const cy1 = prev.y.toFixed(1);
            const cx2 = (prev.x + (pt.x - prev.x) / 2).toFixed(1);
            const cy2 = pt.y.toFixed(1);
            return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
          }, "");

          const areaPathD = `${linePathD} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(padTop + usableH).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(padTop + usableH).toFixed(1)} Z`;

          const activePoint = analyticsHoverIndex !== null ? chartPoints[analyticsHoverIndex] : chartPoints[4];

          return (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* 1. Overall Collections KPI Summary */}
              <div className="bg-gradient-to-br from-emerald-950 via-[#0b2b17] to-emerald-900 text-white rounded-3xl p-4 shadow-sm border border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10.5px] font-bold text-emerald-200/80 uppercase tracking-wider block">
                        மொத்த வசூல் சாதனை (Total Collections)
                      </span>
                      <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                        ₹{multiMonthTotalCollected.toLocaleString("en-IN")}
                      </h3>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                      {Math.round((multiMonthTotalCollected / multiMonthTotalBilled) * 100)}% வசூல்
                    </span>
                    <span className="text-[9.5px] text-emerald-300/80 block mt-1">
                      {multiMonthTotalBookings} பூஜைகள்
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-800/60 text-center">
                  <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
                    <span className="text-[9px] text-emerald-200/80 font-bold block">நடப்பு மாதம் (Sep)</span>
                    <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                      ₹{totalCollected.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
                    <span className="text-[9px] text-emerald-200/80 font-bold block">மொத்த பில் (Billed)</span>
                    <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                      ₹{multiMonthTotalBilled.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
                    <span className="text-[9px] text-emerald-200/80 font-bold block">மீத நிலுவை (Due)</span>
                    <span className="text-xs sm:text-sm font-black text-amber-300 block mt-0.5">
                      ₹{totalDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. SMART LINE CHART: Payments Received Trend */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        வசூல் போக்கு வரைபடம் (Payment Received Trend)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      மாத வாரியாகப் பெறப்பட்ட கட்டணம் (Line Chart)
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    📈 உயர்வுப் போக்கு
                  </span>
                </div>

                {/* Interactive Tooltip Card for hovered point */}
                {activePoint && (
                  <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-ping" />
                      <div>
                        <span className="font-black text-slate-900">
                          {activePoint.monthTamil} ({activePoint.month} 2026)
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          பில்: ₹{activePoint.billed.toLocaleString("en-IN")} • {activePoint.bookingsCount} பூஜைகள்
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-emerald-800 text-xs sm:text-sm block">
                        ₹{activePoint.collected.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[9.5px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                        {activePoint.status}
                      </span>
                    </div>
                  </div>
                )}

                {/* SVG Line Chart */}
                <div className="w-full overflow-hidden">
                  <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    className="w-full h-auto select-none"
                  >
                    <defs>
                      <linearGradient id="emeraldAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" stopOpacity="0.32" />
                        <stop offset="85%" stopColor="#10b981" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="shadowPoint" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25" />
                      </filter>
                    </defs>

                    {/* Horizontal Dotted Gridlines & Y-Axis labels */}
                    {[
                      { val: 75000, label: "75k", y: padTop + usableH - (75000 / maxY) * usableH },
                      { val: 50000, label: "50k", y: padTop + usableH - (50000 / maxY) * usableH },
                      { val: 25000, label: "25k", y: padTop + usableH - (25000 / maxY) * usableH },
                      { val: 0, label: "0", y: padTop + usableH },
                    ].map((grid) => (
                      <g key={grid.val}>
                        <line
                          x1={padL}
                          y1={grid.y}
                          x2={svgWidth - padR}
                          y2={grid.y}
                          stroke="#e2e8f0"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={padL - 6}
                          y={grid.y + 3.5}
                          textAnchor="end"
                          fontSize="8.5"
                          fontWeight="700"
                          fill="#94a3b8"
                        >
                          ₹{grid.label}
                        </text>
                      </g>
                    ))}

                    {/* Area Fill Under Curve */}
                    <path d={areaPathD} fill="url(#emeraldAreaGrad)" />

                    {/* Line Stroke */}
                    <path
                      d={linePathD}
                      fill="none"
                      stroke="#047857"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Interactive Data Points & Month Labels */}
                    {chartPoints.map((pt, idx) => {
                      const isSelected = analyticsHoverIndex === idx;
                      return (
                        <g
                          key={pt.month}
                          className="cursor-pointer"
                          onClick={() => {
                            setAnalyticsHoverIndex(idx);
                            setSelectedAnalyticsMonth(pt.month);
                          }}
                        >
                          {/* Invisible touch target */}
                          <circle cx={pt.x} cy={pt.y} r="18" fill="transparent" />

                          {/* Outer pulse when selected */}
                          {isSelected && (
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="8"
                              fill="#a7f3d0"
                              opacity="0.7"
                            />
                          )}

                          {/* Data Circle */}
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r={isSelected ? "5" : "3.5"}
                            fill={isSelected ? "#064e3b" : "#059669"}
                            stroke="#ffffff"
                            strokeWidth="2"
                            filter="url(#shadowPoint)"
                          />

                          {/* X-Axis Month Label */}
                          <text
                            x={pt.x}
                            y={svgHeight - 8}
                            textAnchor="middle"
                            fontSize="8.5"
                            fontWeight={isSelected ? "900" : "700"}
                            fill={isSelected ? "#064e3b" : "#64748b"}
                          >
                            {pt.month}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* 3. SMART BAR CHART: Month-Wise Collection Breakdown */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-purple-700" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        மாதாந்திர வசூல் ஒப்பீடு (Month-Wise Collection)
                      </h4>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                      பில் தொகை vs வசூலான தொகை (Bar Chart)
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[9.5px] font-bold">
                    <span className="flex items-center gap-1 text-slate-500">
                      <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block" /> பில்
                    </span>
                    <span className="flex items-center gap-1 text-emerald-800">
                      <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" /> வசூல்
                    </span>
                  </div>
                </div>

                {/* Bars Container */}
                <div className="grid grid-cols-6 gap-1.5 sm:gap-2 pt-2 pb-1 border-b border-slate-100">
                  {monthlyAnalyticsData.map((m, idx) => {
                    const isSelected = selectedAnalyticsMonth === m.month;
                    const maxBarVal = 75000;
                    const billedHeightPct = Math.min(100, Math.round((m.billed / maxBarVal) * 100));
                    const collectedHeightPct = Math.min(100, Math.round((m.collected / maxBarVal) * 100));

                    return (
                      <button
                        key={m.month}
                        type="button"
                        onClick={() => {
                          setSelectedAnalyticsMonth(m.month);
                          setAnalyticsHoverIndex(idx);
                        }}
                        className={`flex flex-col items-center gap-1 p-1 rounded-2xl transition group cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/90 ring-1.5 ring-emerald-600 shadow-2xs"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Rate Badge on Top */}
                        <span
                          className={`text-[8px] font-black px-1 py-0.2 rounded-md ${
                            isSelected
                              ? "bg-emerald-700 text-white"
                              : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                          }`}
                        >
                          {m.rate}%
                        </span>

                        {/* Dual Bars */}
                        <div className="w-full h-24 flex items-end justify-center gap-1 pt-1 pb-0.5">
                          {/* Billed Bar (Slate) */}
                          <div
                            className="w-2.5 sm:w-3.5 bg-slate-300 rounded-t-md transition-all duration-500 group-hover:bg-slate-400"
                            style={{ height: `${Math.max(12, billedHeightPct)}%` }}
                            title={`${m.month} Billed: ₹${m.billed.toLocaleString("en-IN")}`}
                          />
                          {/* Collected Bar (Emerald) */}
                          <div
                            className={`w-2.5 sm:w-3.5 rounded-t-md transition-all duration-500 ${
                              isSelected ? "bg-emerald-700" : "bg-emerald-600 group-hover:bg-emerald-500"
                            }`}
                            style={{ height: `${Math.max(12, collectedHeightPct)}%` }}
                            title={`${m.month} Collected: ₹${m.collected.toLocaleString("en-IN")}`}
                          />
                        </div>

                        {/* Month Info Below Bar */}
                        <div className="text-center w-full">
                          <span
                            className={`text-[10px] font-black block leading-tight ${
                              isSelected ? "text-emerald-950" : "text-slate-800"
                            }`}
                          >
                            {m.month}
                          </span>
                          <span className="text-[8.5px] text-slate-600 font-semibold block leading-tight truncate">
                            {m.monthTamil}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* 4. Drilldown: Selected Month Detailed Card */}
                {activeMonthDetail && (
                  <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                        <span className="font-extrabold text-xs text-emerald-950">
                          {activeMonthDetail.fullYear} • {activeMonthDetail.monthTamil} மாத விவரம்
                        </span>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-emerald-900 border border-emerald-300 shadow-2xs">
                        {activeMonthDetail.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[9px] text-slate-500 font-bold block">வசூலானது</span>
                        <span className="font-black text-emerald-900 text-xs block mt-0.5">
                          ₹{activeMonthDetail.collected.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[9px] text-slate-500 font-bold block">மொத்த பில்</span>
                        <span className="font-black text-slate-800 text-xs block mt-0.5">
                          ₹{activeMonthDetail.billed.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                        <span className="text-[9px] text-slate-500 font-bold block">நிலுவை</span>
                        <span className="font-black text-amber-900 text-xs block mt-0.5">
                          {activeMonthDetail.due > 0
                            ? `₹${activeMonthDetail.due.toLocaleString("en-IN")}`
                            : "₹0 (முழுதும்)"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Month-Wise Summary List */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <span>மாதாந்திர வசூல் பட்டியல் சுருக்கம் (All Months)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    6 மாதங்கள்
                  </span>
                </div>

                <div className="space-y-1.5">
                  {monthlyAnalyticsData.map((m) => (
                    <div
                      key={m.month}
                      onClick={() => setSelectedAnalyticsMonth(m.month)}
                      className={`p-2.5 rounded-2xl border transition flex items-center justify-between text-xs cursor-pointer ${
                        selectedAnalyticsMonth === m.month
                          ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200"
                          : "bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-800 flex flex-col items-center justify-center shrink-0">
                          <span className="font-black text-[10px] leading-none">{m.month}</span>
                          <span className="text-[7.5px] text-slate-600 leading-none mt-0.5 font-bold">
                            {m.monthTamil.slice(0, 3)}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                            <span>{m.fullYear}</span>
                            {m.isCurrent && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                நடப்பு மாதம்
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                            {m.bookingsCount} பூஜைகள் • பில்: ₹{m.billed.toLocaleString("en-IN")}
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-emerald-800 text-xs block">
                          ₹{m.collected.toLocaleString("en-IN")}
                        </span>
                        <span
                          className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded inline-block mt-0.5 ${
                            m.rate === 100
                              ? "bg-emerald-100 text-emerald-800"
                              : m.rate >= 90
                              ? "bg-blue-50 text-blue-800"
                              : "bg-amber-50 text-amber-800"
                          }`}
                        >
                          {m.rate}% வசூல்
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 6. Top Pooja Ceremonies by Revenue */}
              <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>அதிக வருவாய் தரும் பூஜைகள் (Top Poojas)</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    {topPoojas.length} பிரிவுகள்
                  </span>
                </div>

                <div className="space-y-2">
                  {topPoojas.map((p, idx) => (
                    <div key={p.name} className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200/70 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-4 h-4 rounded-full bg-white border border-slate-300 text-[9px] font-bold text-slate-700 flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-slate-900 truncate max-w-[170px]">
                            {p.name}
                          </span>
                          <span className="text-[9.5px] px-1.5 bg-slate-200 text-slate-700 rounded font-semibold">
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

              {/* 7. Priest & Team Allocation */}
              {teamAllocation.length > 0 && (
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-700" />
                    <span>குருக்கள் பணி ஒதுக்கீடு (Priest Allocation)</span>
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {teamAllocation.map((m) => (
                      <div
                        key={m.name}
                        className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-slate-800 truncate max-w-[100px]">
                          {m.name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-lg">
                          {m.count} பூஜைகள்
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD DEVOTEE                                                        */}
      {/* ========================================================================= */}
      {showAddDevoteeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-amber-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">Add New Devotee</h3>
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
                  Devotee Full Name *
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
                  Mobile Number (Optional)
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">City / Town</label>
                  <input
                    type="text"
                    value={custCity}
                    onChange={(e) => setCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="Street / Area"
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  Save Devotee
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
                <p className="text-xs text-slate-500 font-semibold">{selectedDevoteeDrawer.mobile || "No mobile specified"}</p>
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
                <span className="font-bold text-slate-800">City: </span>
                {selectedDevoteeDrawer.city || "Namakkal"}
              </div>
              {selectedDevoteeDrawer.address && (
                <div className="text-slate-600">
                  <span className="font-bold text-slate-800">Address: </span>
                  {selectedDevoteeDrawer.address}
                </div>
              )}
            </div>

            {/* Devotee's bookings */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider">
                Pooja Booking History
              </h4>
              {bookings.filter(
                (b) =>
                  b.customerId === selectedDevoteeDrawer.id ||
                  b.customerMobile === selectedDevoteeDrawer.mobile
              ).length === 0 ? (
                <p className="text-xs text-slate-400">No bookings recorded yet.</p>
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
              Close
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
                <span>Record Payment</span>
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
              <div className="font-bold text-slate-900">👤 {recordPaymentBooking.customerName}</div>
              <div className="text-slate-600">
                🪔 {recordPaymentBooking.poojaEnglishName} • {recordPaymentBooking.bookingNumber?.startsWith("#") ? recordPaymentBooking.bookingNumber : `#${recordPaymentBooking.bookingNumber}`}
              </div>
              <div className="text-amber-950 font-extrabold pt-1">
                Total Due Amount: ₹{recordPaymentBooking.balanceAmount?.toLocaleString("en-IN")}
              </div>
            </div>

            <form onSubmit={handleConfirmRecordPayment} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Amount Received (₹) *
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
                  Payment Method
                </label>
                <select
                  value={paymentMethodInput}
                  onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRecordPaymentBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-2xs transition"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

