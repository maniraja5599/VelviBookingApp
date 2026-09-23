"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { IyerSettlement, Booking } from "@/lib/types";
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  X,
  Share2,
  Phone,
  Search,
  Users,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Check,
  Sparkles,
  ArrowUpDown,
} from "lucide-react";
import { getLocalDateString } from "@/lib/calendar/tamil";

export default function PaymentsPage() {
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [activeTab, setActiveTab] = useState<"customer" | "settlement">("customer");
  // 2 Clean Filter Options: ALL or PENDING (as requested by user)
  const [receiptFilter, setReceiptFilter] = useState<"ALL" | "PENDING">("PENDING");
  const [pendingDueSubTab, setPendingDueSubTab] = useState<"ALL_DUES" | "OVERDUE" | "UPCOMING">("OVERDUE");
  const [pendingSortBy, setPendingSortBy] = useState<"recent" | "date" | "amount">("recent");
  const [searchQuery, setSearchQuery] = useState("");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settlements, setSettlements] = useState<IyerSettlement[]>([]);
  const [mounted, setMounted] = useState(false);

  const todayLocalDateStr = getLocalDateString();

  React.useEffect(() => {
    setMounted(true);
    setBookings(db.getBookings(businessId));
    setSettlements(db.settlements.filter((s) => s.businessId === businessId));
  }, [businessId]);

  const members = useMemo(() => db.getMembers(businessId), [businessId]);

  // Quick Payment Recording Modal
  const [paymentBooking, setPaymentBooking] = useState<Booking | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string>("");

  // Settlement Recording Modal
  const [selectedIyerForSettlement, setSelectedIyerForSettlement] = useState<string | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(5000);
  const [settlementMethod, setSettlementMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [settlementRef, setSettlementRef] = useState<string>("");

  // Overdue Dues: Pooja date has passed or is today (<= today) and balanceAmount > 0
  const overdueDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0 && b.date <= todayLocalDateStr);
  }, [bookings, todayLocalDateStr]);

  // Upcoming Booking Dues: Pooja date is in the future (> today) and balanceAmount > 0
  const upcomingDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0 && b.date > todayLocalDateStr);
  }, [bookings, todayLocalDateStr]);

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

  // Summary Metrics
  const totalRevenueExpected = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    [bookings]
  );
  const totalReceived = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.advanceAmount || 0), 0),
    [bookings]
  );
  const totalPendingDues = useMemo(
    () => bookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0),
    [bookings]
  );
  // Unique devotees who owe pending dues
  const pendingDevoteesCount = useMemo(() => {
    const uniqueCustIds = new Set(allPendingDueBookings.map((b) => b.customerId || b.customerName));
    return uniqueCustIds.size;
  }, [allPendingDueBookings]);
  const totalIyerSettled = useMemo(
    () => settlements.reduce((sum, s) => sum + (s.amount || 0), 0),
    [settlements]
  );
  const collectionRate = totalRevenueExpected > 0 ? Math.round((totalReceived / totalRevenueExpected) * 100) : 100;

  // Monthly Collection Trend for Visual Graph
  const monthlyCollectionTrend = useMemo(() => {
    return [
      { month: "Jul", billed: 45000, collected: 45000, heightPct: 50 },
      { month: "Aug", billed: 70000, collected: 66000, heightPct: 75 },
      { month: "Sep", billed: totalRevenueExpected, collected: totalReceived, heightPct: 100 },
    ];
  }, [totalRevenueExpected, totalReceived]);

  // Filtered Customer Receipts
  const filteredBookings = useMemo(() => {
    let list: Booking[] = [];

    if (receiptFilter === "ALL") {
      list = [...bookings];
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
        // Date wise: chronological (earliest date first)
        list.sort((a, b) => a.date.localeCompare(b.date));
      } else if (pendingSortBy === "amount") {
        // Amount wise: highest pending balance first
        list.sort((a, b) => (b.balanceAmount || 0) - (a.balanceAmount || 0));
      } else {
        // Recent: newest booking creation / date first
        list.sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date));
      }
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (b) =>
        b.customerName?.toLowerCase().includes(q) ||
        (b.customerMobile && b.customerMobile.includes(q)) ||
        b.poojaEnglishName?.toLowerCase().includes(q) ||
        (b.poojaTamilName && b.poojaTamilName.toLowerCase().includes(q)) ||
        b.bookingNumber?.toLowerCase().includes(q) ||
        b.date?.includes(q)
    );
  }, [
    bookings,
    receiptFilter,
    pendingDueSubTab,
    pendingSortBy,
    overdueDueBookings,
    upcomingDueBookings,
    allPendingDueBookings,
    searchQuery,
  ]);

  const handleOpenRecordPayment = (b: Booking) => {
    setPaymentBooking(b);
    setPaymentAmount(b.balanceAmount || 0);
  };

  const handleConfirmRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentBooking || paymentAmount <= 0) return;

    const target = db.bookings.find((b) => b.id === paymentBooking.id);
    if (target) {
      target.advanceAmount = (target.advanceAmount || 0) + Number(paymentAmount);
      target.balanceAmount = Math.max(0, target.totalAmount - target.advanceAmount);
      target.paymentStatus = target.balanceAmount === 0 ? "PAID" : "PARTIALLY_PAID";
      target.updatedAt = new Date().toISOString();
      setBookings([...db.getBookings(businessId)]);
    }

    setPaymentSuccessMsg(`₹${paymentAmount.toLocaleString("en-IN")} received from ${paymentBooking.customerName}!`);
    setPaymentBooking(null);
    setTimeout(() => setPaymentSuccessMsg(""), 4000);
  };

  const handleShareReceiptWhatsApp = (b: Booking) => {
    let msg = "";
    const isOverdue = (b.balanceAmount || 0) > 0 && b.date <= todayLocalDateStr;

    if (isOverdue) {
      msg = `🪔 *வேள்வி - பூஜை கட்டண நிலுவை நினைவூட்டல் / Payment Due Reminder* 🪔\n\n`;
      msg += `வணக்கம் *${b.customerName}* அவர்களே,\n`;
      msg += `தங்களுக்கு நடைபெற்ற *${b.poojaEnglishName}* (${b.date}) பூஜையின் மீதமுள்ள நிலுவைத் தொகை விபரம்:\n\n`;
      msg += `பதிவு எண்: *#${b.bookingNumber?.replace(/^#+/, "")}*\n`;
      msg += `மொத்த பூஜை கட்டணம்: *₹${b.totalAmount?.toLocaleString("en-IN")}*\n`;
      msg += `செலுத்திய முன்பணம்: *₹${(b.advanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `*செலுத்த வேண்டிய நிலுவைத் தொகை: ₹${(b.balanceAmount || 0).toLocaleString("en-IN")}*\n\n`;
      msg += `தயவுசெய்து இந்நிலுவைத் தொகையை விரைவில் செலுத்துமாறு பணிவன்புடன் கேட்டுக்கொள்கிறோம். 🙏\n\n✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`;
    } else {
      msg = `🪔 *வேள்வி - பூஜை கட்டண ரசீது / Payment Receipt* 🪔\n\n`;
      msg += `பக்தர் பெயர்: *${b.customerName}*\n`;
      msg += `பதிவு எண்: *#${b.bookingNumber?.replace(/^#+/, "")}*\n`;
      msg += `பூஜை: *${b.poojaEnglishName}* ${b.poojaTamilName ? `(${b.poojaTamilName})` : ""}\n`;
      msg += `தேதி: *${b.date}* (${b.startTime})\n`;
      msg += `இடம்: *${b.location || "Namakkal"}*\n\n`;
      msg += `----------------------------\n`;
      msg += `மொத்த பூஜை கட்டணம்: *₹${b.totalAmount?.toLocaleString("en-IN")}*\n`;
      msg += `செலுத்திய தொகை (Advance / Paid): *₹${(b.advanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `நிலுவைத் தொகை (Balance Due): *₹${(b.balanceAmount || 0).toLocaleString("en-IN")}*\n`;
      msg += `நிலை: *${b.paymentStatus === "PAID" ? "முழுதும் செலுத்தப்பட்டது (PAID ✅)" : "நிலுவை உள்ளது (PARTIAL)"}*\n`;
      msg += `----------------------------\n\n`;
      msg += `நன்றி! இறைவனின் பூரண அருள் கிடைக்க வாழ்த்துகிறோம். 🙏\n\n✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`;
    }

    const phone = b.customerMobile ? b.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIyerForSettlement || settlementAmount <= 0) return;

    const iyer = members.find((m) => m.id === selectedIyerForSettlement);
    const newSettlement: IyerSettlement = {
      id: `set-${Date.now()}`,
      businessId,
      iyerId: selectedIyerForSettlement,
      iyerName: iyer?.name || "Iyer",
      amount: Number(settlementAmount),
      paymentMethod: settlementMethod,
      reference: settlementRef || `SET/${Date.now().toString().slice(-6)}`,
      settlementDate: getLocalDateString(),
      createdAt: new Date().toISOString(),
    };

    db.settlements.push(newSettlement);
    setSettlements([...db.settlements.filter((s) => s.businessId === businessId)]);
    setSelectedIyerForSettlement(null);
    setSettlementRef("");
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-velvi-brownDark flex items-center gap-1.5">
            <Wallet className="w-5 h-5 text-velvi-gold" />
            <span>வரவு செலவு & கணக்குகள்</span>
          </h2>
          <p className="text-xs text-velvi-brown/70">
            Payments, Devotee Receipts & Iyer Settlements
          </p>
        </div>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Total Expected */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wide block">
            மொத்த வரவு (Total)
          </span>
          <div className="text-base sm:text-lg font-black text-slate-900 leading-tight">
            ₹{totalRevenueExpected.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-slate-400 font-medium block">
            {bookings.length} பூஜைகள் மதிப்பு
          </span>
        </div>

        {/* Received Amount */}
        <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-emerald-900 uppercase tracking-wide flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-700" /> பெற்றது (Received)
          </span>
          <div className="text-base sm:text-lg font-black text-emerald-900 leading-tight">
            ₹{totalReceived.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-emerald-700 font-medium block">
            முன்பணம் & கட்டணம்
          </span>
        </div>

        {/* Pending Balance */}
        <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-200/80 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-amber-900 uppercase tracking-wide flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-700" /> நிலுவை (Due)
          </span>
          <div className="text-base sm:text-lg font-black text-amber-950 leading-tight">
            ₹{totalPendingDues.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-amber-800 font-medium block">
            வசூலிக்க வேண்டியவை
          </span>
        </div>

        {/* Iyer Settled */}
        <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-200/80 shadow-2xs space-y-1">
          <span className="text-[10.5px] font-bold text-purple-900 uppercase tracking-wide flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-700" /> குருக்கள் பகிர்வு
          </span>
          <div className="text-base sm:text-lg font-black text-purple-950 leading-tight">
            ₹{totalIyerSettled.toLocaleString("en-IN")}
          </div>
          <span className="text-[10px] text-purple-800 font-medium block">
            செலுத்தப்பட்ட பகிர்வு
          </span>
        </div>
      </div>

      {paymentSuccessMsg && (
        <div className="bg-green-50 border border-green-200 text-green-900 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{paymentSuccessMsg}</span>
        </div>
      )}

      {/* Main Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-bold">
        <button
          onClick={() => setActiveTab("customer")}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "customer"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👤 பக்தர்கள் ரசீது & நிலுவை</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full font-black">
            {bookings.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === "settlement"
              ? "bg-white text-slate-900 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <span>👥 குருக்கள் பகிர்வு கணக்கு</span>
          <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 rounded-full font-black">
            {members.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. CUSTOMER RECEIPTS TAB                                                 */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 1. CUSTOMER RECEIPTS TAB                                                 */}
      {/* ========================================================================= */}
      {activeTab === "customer" && (
        <div className="space-y-3">
          {/* 1. Total Collection Visual Graph & Cashflow Card */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5">
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
                  ₹{totalRevenueExpected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] text-slate-600 font-bold block">Collected</span>
                <span className="font-black text-emerald-800 text-xs block mt-0.5">
                  ₹{totalReceived.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                <span className="text-[9.5px] text-slate-500 font-bold block">Total Due</span>
                <span className="font-black text-slate-900 text-xs block mt-0.5">
                  ₹{totalPendingDues.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Visual Segmented Progress Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-600 h-full transition-all duration-500 rounded-l-full"
                  style={{ width: `${Math.min(100, Math.round((totalReceived / (totalRevenueExpected || 1)) * 100))}%` }}
                  title={`Collected: ₹${totalReceived.toLocaleString("en-IN")}`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((upcomingDueTotal / (totalRevenueExpected || 1)) * 100))}%` }}
                  title={`Upcoming Due: ₹${upcomingDueTotal.toLocaleString("en-IN")}`}
                />
                <div
                  className="bg-slate-400 h-full transition-all duration-500 rounded-r-full"
                  style={{ width: `${Math.min(100, Math.round((overdueDueTotal / (totalRevenueExpected || 1)) * 100))}%` }}
                  title={`Overdue: ₹${overdueDueTotal.toLocaleString("en-IN")}`}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 px-0.5">
                <span className="flex items-center gap-1 text-emerald-800">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Collected ({collectionRate}%)
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Upcoming (₹{upcomingDueTotal.toLocaleString("en-IN")})
                </span>
                <span className="flex items-center gap-1 text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> Overdue (₹{overdueDueTotal.toLocaleString("en-IN")})
                </span>
              </div>
            </div>

            {/* Monthly Trend Mini Graph */}
            <div className="pt-2 border-t border-slate-100 flex items-end justify-between gap-2 h-14 px-2.5 bg-slate-50/70 rounded-xl">
              {monthlyCollectionTrend.map((m) => {
                const colPct = Math.round((m.collected / (m.billed || 1)) * 100);
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-0.5">
                    <div className="w-full flex items-end justify-center gap-1 h-8">
                      <div
                        className="w-3 bg-slate-300 rounded-t-sm"
                        style={{ height: `${m.heightPct}%` }}
                        title={`${m.month} Billed: ₹${m.billed.toLocaleString("en-IN")}`}
                      />
                      <div
                        className="w-3 bg-emerald-600 rounded-t-sm"
                        style={{ height: `${Math.max(10, Math.round(m.heightPct * (colPct / 100)))}%` }}
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
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold border border-slate-200/80 shadow-2xs">
            <button
              type="button"
              onClick={() => setReceiptFilter("PENDING")}
              className={`flex-1 py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                receiptFilter === "PENDING"
                  ? "bg-slate-900 text-white shadow-2xs font-black"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              <span>நிலுவைத் தொகை (Pending Dues)</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                  receiptFilter === "PENDING"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {allPendingDueBookings.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setReceiptFilter("ALL")}
              className={`flex-1 py-2 rounded-xl transition text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                receiptFilter === "ALL"
                  ? "bg-slate-900 text-white shadow-2xs font-black"
                  : "text-slate-600 hover:text-slate-900 font-bold"
              }`}
            >
              <span>அனைத்து கட்டணங்கள் (All)</span>
              <span
                className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-black ${
                  receiptFilter === "ALL"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {bookings.length}
              </span>
            </button>
          </div>

          {/* 3. Pending Dues Controls (Smart Devotee Analysis + Calm Separation) */}
          {receiptFilter === "PENDING" && (
            <div className="space-y-2.5">
              {/* Smart Devotee Pending Dues Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/90 space-y-2.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-slate-700" />
                    <span className="font-extrabold text-xs text-slate-900">
                      நிலுவைத் தொகை பகுப்பாய்வு (Pending Breakdown)
                    </span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-slate-800 border border-slate-200 shadow-2xs">
                    {pendingDevoteesCount} பக்தர்கள் நிலுவை
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">பூஜை முடிந்தவை (Overdue)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                        {overdueDueBookings.length} பூஜைகள்
                      </span>
                    </div>
                    <div className="font-black text-slate-900 text-sm mt-1">
                      ₹{overdueDueTotal.toLocaleString("en-IN")}
                    </div>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">வரவிருப்பவை (Upcoming)</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded">
                        {upcomingDueBookings.length} பூஜைகள்
                      </span>
                    </div>
                    <div className="font-black text-slate-900 text-sm mt-1">
                      ₹{upcomingDueTotal.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-Pills: Overdue vs Upcoming Dues */}
              <div className="flex items-center justify-between gap-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPendingDueSubTab("ALL_DUES")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      pendingDueSubTab === "ALL_DUES"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    அனைத்தும் ({allPendingDueBookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDueSubTab("OVERDUE")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      pendingDueSubTab === "OVERDUE"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block" />
                    <span>முடிந்தவை ({overdueDueBookings.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDueSubTab("UPCOMING")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      pendingDueSubTab === "UPCOMING"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                    <span>வரவிருப்பவை ({upcomingDueBookings.length})</span>
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

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search devotee name, mobile, booking #..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 shadow-2xs"
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

          {/* Receipts List */}
          <div className="space-y-2.5">
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2 border border-dashed border-slate-200">
                <Wallet className="w-8 h-8 text-slate-300 mx-auto" />
                <p>ரசீதுகள் எதுவும் பொருந்தவில்லை</p>
              </div>
            ) : (
              filteredBookings.map((b) => {
                const isOverdue = (b.balanceAmount || 0) > 0 && b.date <= todayLocalDateStr;
                const isUpcomingDue = (b.balanceAmount || 0) > 0 && b.date > todayLocalDateStr;
                const isFullyPaid = b.paymentStatus === "PAID" || b.balanceAmount === 0;

                return (
                  <div
                    key={b.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 transition hover:border-slate-300"
                  >
                    {/* Top Row: Devotee & Booking ID */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        {/* Status Badge Tag */}
                        <div>
                          {isOverdue ? (
                            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span>பூஜை முடிந்தது • நிலுவை ({b.date})</span>
                            </span>
                          ) : isUpcomingDue ? (
                            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                              <span>வரவிருக்கும் பூஜை ({b.date})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-[9.5px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-emerald-800 border border-slate-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                              <span>முழுதும் செலுத்தப்பட்டது ✅</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[10.5px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            #{b.bookingNumber?.replace(/^#+/, "")}
                          </span>
                          <h4 className="font-black text-sm text-slate-900 truncate">
                            👤 {b.customerName}
                          </h4>
                          {b.location && (
                            <span className="text-[10px] text-slate-500 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200">
                              📍 {b.location}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-800">🪔 {b.poojaEnglishName}</span>
                          {b.poojaTamilName && (
                            <span className="text-slate-500">({b.poojaTamilName})</span>
                          )}
                          <span>•</span>
                          <span>📅 {b.date}</span>
                        </div>
                      </div>

                      {/* Payment Status / Due Badge */}
                      <div className="shrink-0 text-right">
                        <span
                          className={`font-black text-sm block ${
                            b.balanceAmount > 0 ? "text-slate-900" : "text-emerald-700"
                          }`}
                        >
                          {b.balanceAmount > 0 ? `நிலுவை: ₹${b.balanceAmount.toLocaleString("en-IN")}` : "Paid ✅"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          மொத்தம்: ₹{b.totalAmount.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    {/* Financial Numbers Strip */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-center text-xs">
                      <div>
                        <div className="text-[9.5px] text-slate-500 font-semibold">மொத்தக் கட்டணம்</div>
                        <div className="font-extrabold text-slate-900 mt-0.5">
                          ₹{b.totalAmount?.toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9.5px] text-slate-500 font-semibold">செலுத்தியது</div>
                        <div className="font-extrabold text-emerald-800 mt-0.5">
                          ₹{(b.advanceAmount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9.5px] text-slate-500 font-semibold">மீதமுள்ள நிலுவை</div>
                        <div className={`font-black mt-0.5 ${b.balanceAmount > 0 ? "text-slate-900 font-black" : "text-slate-400"}`}>
                          ₹{(b.balanceAmount || 0).toLocaleString("en-IN")}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div className="text-[11px] text-slate-500 font-medium">
                        {b.customerMobile ? (
                          <a
                            href={`tel:${b.customerMobile}`}
                            className="flex items-center gap-1 hover:text-slate-900 font-semibold"
                          >
                            <Phone className="w-3 h-3 text-slate-400" /> {b.customerMobile}
                          </a>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {b.balanceAmount > 0 && (
                          <button
                            type="button"
                            onClick={() => handleOpenRecordPayment(b)}
                            className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            <span>கட்டணம் பதிவு</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleShareReceiptWhatsApp(b)}
                          className="px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 border bg-white hover:bg-slate-50 text-slate-700 border-slate-200 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{isOverdue ? "நினைவூட்டல்" : "ரசீது"}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IYER SETTLEMENT TAB                                                   */}
      {/* ========================================================================= */}
      {activeTab === "settlement" && (
        <div className="space-y-3">
          {/* Explanation Banner */}
          <div className="bg-gradient-to-r from-purple-50 via-amber-50 to-purple-50 p-3.5 rounded-2xl border border-purple-200 shadow-2xs space-y-1">
            <h4 className="text-xs font-extrabold text-purple-950 uppercase tracking-wider flex items-center gap-1.5">
              <span>🤝</span> குருக்கள் கட்டண பகிர்வு முறை (40% Standard Settlement)
            </h4>
            <p className="text-xs text-purple-900/80 leading-relaxed">
              உதவி குருக்கள் மற்றும் குழு உறுப்பினர்களுக்கு அவர்கள் செய்த பூஜைகளுக்கான தொகையை ரொக்கமாகவோ அல்லது UPI மூலமாகவோ வழங்கி கணக்கில் பதிவு செய்யலாம்.
            </p>
          </div>

          {/* Members Settlement List */}
          <div className="space-y-3">
            {members.map((iyer) => {
              const iyerBookings = bookings.filter((b) => b.assignedIyerId === iyer.id);
              const totalValue = iyerBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
              const estimatedShare = Math.round(totalValue * 0.4);
              const iyerSettlements = settlements.filter((s) => s.iyerId === iyer.id);
              const paidAmount = iyerSettlements.reduce((sum, s) => sum + (s.amount || 0), 0);
              const pendingBalance = Math.max(0, estimatedShare - paidAmount);

              return (
                <div
                  key={iyer.id}
                  className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-3 transition hover:border-purple-300"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-black text-xs shrink-0 border border-purple-200">
                        {iyer.name ? iyer.name[0].toUpperCase() : "👤"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{iyer.name}</h4>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                              iyer.role === "OWNER"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-blue-100 text-blue-900 border border-blue-300"
                            }`}
                          >
                            {iyer.role === "OWNER" ? "முதன்மை குருக்கள்" : "குழு குருக்கள்"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {iyerBookings.length} பூஜைகள் • மொத்த மதிப்பு: ₹
                          {totalValue.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedIyerForSettlement(iyer.id);
                        setSettlementAmount(pendingBalance > 0 ? pendingBalance : 2500);
                      }}
                      className="px-3 py-1.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 flex items-center gap-1 shrink-0"
                    >
                      <span>பகிர்வு வழங்கு</span>
                    </button>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold">பங்கு (40%)</div>
                      <div className="font-extrabold text-slate-900 mt-0.5">
                        ₹{estimatedShare.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-700 font-semibold">வழங்கியது</div>
                      <div className="font-extrabold text-emerald-800 mt-0.5">
                        ₹{paidAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-amber-800 font-semibold">நிலுவை</div>
                      <div className={`font-extrabold mt-0.5 ${pendingBalance > 0 ? "text-amber-900" : "text-slate-400"}`}>
                        ₹{pendingBalance.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>

                  {/* Settlement History Logs for this Iyer */}
                  {iyerSettlements.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                        சமீபத்திய பரிவர்த்தனைகள் ({iyerSettlements.length})
                      </span>
                      <div className="space-y-1">
                        {iyerSettlements.map((st) => (
                          <div
                            key={st.id}
                            className="text-[11px] bg-slate-50/80 px-2.5 py-1.5 rounded-lg border border-slate-200/60 flex items-center justify-between text-slate-700"
                          >
                            <span>📅 {st.settlementDate} ({st.paymentMethod})</span>
                            <span className="font-bold text-slate-900">₹{st.amount.toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 1. Modal: Record Customer Payment */}
      {paymentBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
                <span>கட்டணம் பெறுதல் / Record Payment</span>
              </h3>
              <button
                type="button"
                onClick={() => setPaymentBooking(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200 text-xs space-y-1">
              <div className="font-bold text-slate-900">{paymentBooking.customerName}</div>
              <div className="text-slate-600">{paymentBooking.poojaEnglishName} • {paymentBooking.bookingNumber}</div>
              <div className="text-amber-900 font-extrabold pt-1">
                மொத்த நிலுவைத் தொகை: ₹{paymentBooking.balanceAmount?.toLocaleString("en-IN")}
              </div>
            </div>

            <form onSubmit={handleConfirmRecordPayment} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பெற்ற தொகை / Amount Received (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={paymentBooking.balanceAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  செலுத்திய முறை / Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
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
                  onClick={() => setPaymentBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  ரத்து
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  கட்டணம் பதிவு செய்
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Record Iyer Settlement */}
      {selectedIyerForSettlement && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">குருக்கள் பகிர்வு தொகை பதிவு</h3>
              <button
                type="button"
                onClick={() => setSelectedIyerForSettlement(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  வழங்கிய தொகை (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={100}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  வழங்கிய முறை / Payment Method
                </label>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-600"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CASH">ரொக்கம் (Cash in Hand)</option>
                  <option value="BANK_TRANSFER">வங்கிப் பரிவர்த்தனை (NEFT / IMPS)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  குறிப்பு / UTR Reference (விருப்பத்தேர்வு)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/39482710/GPay"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedIyerForSettlement(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  ரத்து
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-800 hover:bg-purple-900 text-white rounded-xl text-xs font-bold shadow-sm transition"
                >
                  உறுதி செய்க (Confirm)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
