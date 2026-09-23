"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString, formatTime12H } from "@/lib/calendar/tamil";
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
  Trash2,
} from "lucide-react";

export default function HomeDashboardPage() {
  const { currentUser, currentBusiness, subscription } = useAuth();
  const { t } = useLanguage();

  // Current Tamil Date (Timezone-safe)
  const todayLocalDateStr = getLocalDateString();
  const todayInfo = getTamilDate(todayLocalDateStr);

  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  // Reactive DB states
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "payments" | "devotees">("analytics");

  useEffect(() => {
    let animFrame: number;
    const refreshData = () => {
      cancelAnimationFrame(animFrame);
      animFrame = requestAnimationFrame(() => {
        setBookings(db.getBookings(businessId));
        setCustomers(db.getCustomers(businessId));
      });
    };
    refreshData();
    window.addEventListener("velvi:db-change", refreshData);
    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener("velvi:db-change", refreshData);
    };
  }, [businessId]);

  const members = useMemo(() => db.getMembers(businessId), [businessId]);
  const ownerMember = useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  // Pre-indexed booking counts for devotees to ensure 60fps scrolling & instant responsiveness
  const customerBookingCountMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of bookings) {
      if (b.customerId) map.set(b.customerId, (map.get(b.customerId) || 0) + 1);
      if (b.customerMobile) {
        const norm = b.customerMobile.replace(/\D/g, "");
        if (norm) map.set(norm, (map.get(norm) || 0) + 1);
      }
    }
    return map;
  }, [bookings]);

  // Pre-indexed member bookings map to eliminate O(N) array filtering per member in render
  const memberBookingsMap = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const m of members) {
      const isOwner = m.role === "OWNER" || m.id === ownerMember?.id;
      const list = bookings.filter((b) => {
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
      map.set(m.id, list);
    }
    return map;
  }, [bookings, members, ownerMember]);

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
  const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PENDING">("ALL");
  const [pendingDueSubTab, setPendingDueSubTab] = useState<"ALL_DUES" | "OVERDUE" | "UPCOMING">("OVERDUE");
  const [pendingSortBy, setPendingSortBy] = useState<"recent" | "date" | "amount">("recent");
  
  // All Payments Controls (Sort: Recent Changes default, Date & Time wise, Bill wise, Amount wise; Filter: All, Paid, Partial, Pending)
  const [allPaymentSortBy, setAllPaymentSortBy] = useState<"recent" | "datetime" | "bill" | "amount">("recent");
  const [allPaymentStatusFilter, setAllPaymentStatusFilter] = useState<"ALL" | "PAID" | "PARTIAL" | "PENDING">("ALL");
  const [resetPaymentConfirmBooking, setResetPaymentConfirmBooking] = useState<Booking | null>(null);

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

      // 1. Status Filter
      if (allPaymentStatusFilter === "PAID") {
        list = list.filter((b) => b.paymentStatus === "PAID" || b.balanceAmount === 0);
      } else if (allPaymentStatusFilter === "PARTIAL") {
        list = list.filter((b) => (b.advanceAmount || 0) > 0 && (b.balanceAmount || 0) > 0);
      } else if (allPaymentStatusFilter === "PENDING") {
        list = list.filter((b) => (b.advanceAmount || 0) === 0 && (b.balanceAmount || 0) > 0);
      }

      // 2. 4-Way Sorting
      if (allPaymentSortBy === "datetime") {
        // Date & Time wise: compare date, and if same date, compare start time
        list.sort((a, b) => {
          const dateComp = b.date.localeCompare(a.date);
          if (dateComp !== 0) return dateComp;
          return (b.startTime || "").localeCompare(a.startTime || "");
        });
      } else if (allPaymentSortBy === "bill") {
        // Bill / Booking Number wise descending
        list.sort((a, b) => {
          const numA = parseInt(a.bookingNumber?.replace(/\D/g, "") || "0", 10);
          const numB = parseInt(b.bookingNumber?.replace(/\D/g, "") || "0", 10);
          return numB - numA;
        });
      } else if (allPaymentSortBy === "amount") {
        // Bill Amount wise descending
        list.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
      } else {
        // "recent" (Default): Recent Changes first (updatedAt / createdAt / date)
        list.sort((a, b) => (b.updatedAt || b.createdAt || b.date).localeCompare(a.updatedAt || a.createdAt || a.date));
      }
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
    allPaymentSortBy,
    allPaymentStatusFilter,
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

    const res = db.recordBookingPayment({
      bookingId: recordPaymentBooking.id,
      amount: Number(paymentAmountInput),
      paymentMethod: paymentMethodInput,
      recordedBy: currentUser?.name || "Ravi Iyer",
      notes: `Direct collection via ${paymentMethodInput}`,
    });

    if (res.success) {
      setBookings([...db.getBookings(businessId)]);
      setPaymentSuccessMessage(`₹${Number(paymentAmountInput).toLocaleString("en-IN")} கட்டணம் பெறப்பட்டது (${recordPaymentBooking.customerName})!`);
    }

    setRecordPaymentBooking(null);
    setTimeout(() => setPaymentSuccessMessage(""), 4000);
  };

  const handleConfirmResetPayment = () => {
    if (!resetPaymentConfirmBooking) return;

    const res = db.resetBookingPayment({
      bookingId: resetPaymentConfirmBooking.id,
      deletedBy: currentUser?.name || "Ravi Iyer",
      reason: "Payment reset from home payments tab",
    });

    if (res.success) {
      setBookings([...db.getBookings(businessId)]);
      setPaymentSuccessMessage(`பதிவு #${resetPaymentConfirmBooking.bookingNumber} கட்டணம் நீக்கப்பட்டு ₹${resetPaymentConfirmBooking.totalAmount.toLocaleString("en-IN")} நிலுவையாக மாற்றப்பட்டது.`);
    }

    setResetPaymentConfirmBooking(null);
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

  // Selected Year & Month for Analytics drilldown
  interface MonthlyAnalyticsItem {
    id: string;
    month: string;
    fullYear: string;
    year: string;
    billed: number;
    collected: number;
    due: number;
    bookingsCount: number;
    rate: number;
    status: string;
    isCurrent?: boolean;
    cumulative: number;
  }

  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState<"2026" | "2025" | "2024" | "ALL">("2026");
  const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState<string>("Sep");
  const [analyticsHoverIndex, setAnalyticsHoverIndex] = useState<number | null>(null);

  // 2026 Monthly Data (Dynamic live bookings for current month Sep & advance Oct)
  const data2026: MonthlyAnalyticsItem[] = useMemo(() => {
    if (bookings.length === 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];
      return months.map((m, idx) => ({
        id: `2026-${String(idx + 1).padStart(2, "0")}`,
        month: m,
        fullYear: `${m} 2026${m === "Sep" ? " (Current)" : ""}`,
        year: "2026",
        billed: 0,
        collected: 0,
        due: 0,
        bookingsCount: 0,
        rate: 100,
        status: "0% Realized",
        cumulative: 0,
        isCurrent: m === "Sep",
      }));
    }

    const currentBilled = totalBilled > 0 ? totalBilled : 75000;
    const currentCollected = totalCollected > 0 ? totalCollected : 66000;
    const currentDue = totalDue;

    const raw: Omit<MonthlyAnalyticsItem, "cumulative">[] = [
      { id: "2026-01", month: "Jan", fullYear: "Jan 2026", year: "2026", billed: 46000, collected: 46000, due: 0, bookingsCount: 7, rate: 100, status: "100% Realized" },
      { id: "2026-02", month: "Feb", fullYear: "Feb 2026", year: "2026", billed: 52000, collected: 52000, due: 0, bookingsCount: 8, rate: 100, status: "100% Realized" },
      { id: "2026-03", month: "Mar", fullYear: "Mar 2026", year: "2026", billed: 49000, collected: 48000, due: 1000, bookingsCount: 7, rate: 98, status: "98% Realized" },
      { id: "2026-04", month: "Apr", fullYear: "Apr 2026", year: "2026", billed: 58000, collected: 56000, due: 2000, bookingsCount: 9, rate: 96, status: "96% Realized" },
      { id: "2026-05", month: "May", fullYear: "May 2026", year: "2026", billed: 42000, collected: 42000, due: 0, bookingsCount: 6, rate: 100, status: "100% Realized" },
      { id: "2026-06", month: "Jun", fullYear: "Jun 2026", year: "2026", billed: 54000, collected: 54000, due: 0, bookingsCount: 8, rate: 100, status: "100% Realized" },
      { id: "2026-07", month: "Jul", fullYear: "Jul 2026", year: "2026", billed: 48000, collected: 46500, due: 1500, bookingsCount: 7, rate: 97, status: "97% Realized" },
      { id: "2026-08", month: "Aug", fullYear: "Aug 2026", year: "2026", billed: 68000, collected: 65000, due: 3000, bookingsCount: 10, rate: 96, status: "96% Realized" },
      {
        id: "2026-09",
        month: "Sep",
        fullYear: "Sep 2026 (Current)",
        year: "2026",
        billed: currentBilled,
        collected: currentCollected,
        due: currentDue,
        bookingsCount: bookings.length > 0 ? bookings.length : 12,
        rate: collectionRate,
        status: `${collectionRate}% Realized`,
        isCurrent: true,
      },
      {
        id: "2026-10",
        month: "Oct",
        fullYear: "Oct 2026 (Advance)",
        year: "2026",
        billed: 38000,
        collected: 28000,
        due: 10000,
        bookingsCount: 5,
        rate: 74,
        status: "74% Advance",
      },
    ];

    let running = 0;
    return raw.map((item) => {
      running += item.collected;
      return { ...item, cumulative: running };
    });
  }, [totalBilled, totalCollected, totalDue, bookings.length, collectionRate]);

  // 2025 Historical Full Year Data (12 Months)
  const data2025: MonthlyAnalyticsItem[] = useMemo(() => {
    if (bookings.length === 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map((m, idx) => ({
        id: `2025-${String(idx + 1).padStart(2, "0")}`,
        month: m,
        fullYear: `${m} 2025`,
        year: "2025",
        billed: 0,
        collected: 0,
        due: 0,
        bookingsCount: 0,
        rate: 100,
        status: "0% Realized",
        cumulative: 0,
      }));
    }

    const raw: Omit<MonthlyAnalyticsItem, "cumulative">[] = [
      { id: "2025-01", month: "Jan", fullYear: "Jan 2025", year: "2025", billed: 45000, collected: 45000, due: 0, bookingsCount: 7, rate: 100, status: "100% Realized" },
      { id: "2025-02", month: "Feb", fullYear: "Feb 2025", year: "2025", billed: 48000, collected: 48000, due: 0, bookingsCount: 8, rate: 100, status: "100% Realized" },
      { id: "2025-03", month: "Mar", fullYear: "Mar 2025", year: "2025", billed: 52000, collected: 51000, due: 1000, bookingsCount: 8, rate: 98, status: "98% Realized" },
      { id: "2025-04", month: "Apr", fullYear: "Apr 2025", year: "2025", billed: 64000, collected: 62000, due: 2000, bookingsCount: 10, rate: 97, status: "97% Realized" },
      { id: "2025-05", month: "May", fullYear: "May 2025", year: "2025", billed: 40000, collected: 40000, due: 0, bookingsCount: 6, rate: 100, status: "100% Realized" },
      { id: "2025-06", month: "Jun", fullYear: "Jun 2025", year: "2025", billed: 50000, collected: 50000, due: 0, bookingsCount: 8, rate: 100, status: "100% Realized" },
      { id: "2025-07", month: "Jul", fullYear: "Jul 2025", year: "2025", billed: 46000, collected: 45000, due: 1000, bookingsCount: 7, rate: 98, status: "98% Realized" },
      { id: "2025-08", month: "Aug", fullYear: "Aug 2025", year: "2025", billed: 62000, collected: 60000, due: 2000, bookingsCount: 9, rate: 97, status: "97% Realized" },
      { id: "2025-09", month: "Sep", fullYear: "Sep 2025", year: "2025", billed: 58000, collected: 58000, due: 0, bookingsCount: 9, rate: 100, status: "100% Realized" },
      { id: "2025-10", month: "Oct", fullYear: "Oct 2025", year: "2025", billed: 66000, collected: 64000, due: 2000, bookingsCount: 11, rate: 97, status: "97% Realized" },
      { id: "2025-11", month: "Nov", fullYear: "Nov 2025", year: "2025", billed: 42000, collected: 42000, due: 0, bookingsCount: 6, rate: 100, status: "100% Realized" },
      { id: "2025-12", month: "Dec", fullYear: "Dec 2025", year: "2025", billed: 55000, collected: 54000, due: 1000, bookingsCount: 9, rate: 98, status: "98% Realized" },
    ];
    let running = 0;
    return raw.map((item) => {
      running += item.collected;
      return { ...item, cumulative: running };
    });
  }, [bookings.length]);

  // 2024 Historical Full Year Data (12 Months)
  const data2024: MonthlyAnalyticsItem[] = useMemo(() => {
    if (bookings.length === 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      return months.map((m, idx) => ({
        id: `2024-${String(idx + 1).padStart(2, "0")}`,
        month: m,
        fullYear: `${m} 2024`,
        year: "2024",
        billed: 0,
        collected: 0,
        due: 0,
        bookingsCount: 0,
        rate: 100,
        status: "0% Realized",
        cumulative: 0,
      }));
    }

    const raw: Omit<MonthlyAnalyticsItem, "cumulative">[] = [
      { id: "2024-01", month: "Jan", fullYear: "Jan 2024", year: "2024", billed: 38000, collected: 38000, due: 0, bookingsCount: 6, rate: 100, status: "100% Realized" },
      { id: "2024-02", month: "Feb", fullYear: "Feb 2024", year: "2024", billed: 42000, collected: 42000, due: 0, bookingsCount: 7, rate: 100, status: "100% Realized" },
      { id: "2024-03", month: "Mar", fullYear: "Mar 2024", year: "2024", billed: 45000, collected: 44000, due: 1000, bookingsCount: 7, rate: 98, status: "98% Realized" },
      { id: "2024-04", month: "Apr", fullYear: "Apr 2024", year: "2024", billed: 54000, collected: 53000, due: 1000, bookingsCount: 8, rate: 98, status: "98% Realized" },
      { id: "2024-05", month: "May", fullYear: "May 2024", year: "2024", billed: 36000, collected: 36000, due: 0, bookingsCount: 5, rate: 100, status: "100% Realized" },
      { id: "2024-06", month: "Jun", fullYear: "Jun 2024", year: "2024", billed: 44000, collected: 44000, due: 0, bookingsCount: 7, rate: 100, status: "100% Realized" },
      { id: "2024-07", month: "Jul", fullYear: "Jul 2024", year: "2024", billed: 41000, collected: 40000, due: 1000, bookingsCount: 6, rate: 98, status: "98% Realized" },
      { id: "2024-08", month: "Aug", fullYear: "Aug 2024", year: "2024", billed: 52000, collected: 51000, due: 1000, bookingsCount: 8, rate: 98, status: "98% Realized" },
      { id: "2024-09", month: "Sep", fullYear: "Sep 2024", year: "2024", billed: 48000, collected: 47000, due: 1000, bookingsCount: 7, rate: 98, status: "98% Realized" },
      { id: "2024-10", month: "Oct", fullYear: "Oct 2024", year: "2024", billed: 56000, collected: 54000, due: 2000, bookingsCount: 9, rate: 96, status: "96% Realized" },
      { id: "2024-11", month: "Nov", fullYear: "Nov 2024", year: "2024", billed: 38000, collected: 38000, due: 0, bookingsCount: 6, rate: 100, status: "100% Realized" },
      { id: "2024-12", month: "Dec", fullYear: "Dec 2024", year: "2024", billed: 48000, collected: 47000, due: 1000, bookingsCount: 8, rate: 98, status: "98% Realized" },
    ];
    let running = 0;
    return raw.map((item) => {
      running += item.collected;
      return { ...item, cumulative: running };
    });
  }, [bookings.length]);

  // Multi-Year Summary Comparison
  const allYearsSummary = useMemo(() => {
    const sum2026 = data2026.reduce((acc, m) => ({ collected: acc.collected + m.collected, billed: acc.billed + m.billed, count: acc.count + m.bookingsCount }), { collected: 0, billed: 0, count: 0 });
    const sum2025 = data2025.reduce((acc, m) => ({ collected: acc.collected + m.collected, billed: acc.billed + m.billed, count: acc.count + m.bookingsCount }), { collected: 0, billed: 0, count: 0 });
    const sum2024 = data2024.reduce((acc, m) => ({ collected: acc.collected + m.collected, billed: acc.billed + m.billed, count: acc.count + m.bookingsCount }), { collected: 0, billed: 0, count: 0 });

    return [
      { year: "2026" as const, label: "2026 (YTD)", billed: sum2026.billed, collected: sum2026.collected, count: sum2026.count, rate: Math.round((sum2026.collected / sum2026.billed) * 100), monthsCount: data2026.length },
      { year: "2025" as const, label: "2025 (Full Year)", billed: sum2025.billed, collected: sum2025.collected, count: sum2025.count, rate: Math.round((sum2025.collected / sum2025.billed) * 100), monthsCount: 12 },
      { year: "2024" as const, label: "2024 (Full Year)", billed: sum2024.billed, collected: sum2024.collected, count: sum2024.count, rate: Math.round((sum2024.collected / sum2024.billed) * 100), monthsCount: 12 },
    ];
  }, [data2026, data2025, data2024]);

  // Active Monthly Data based on selected year
  const activeYearMonthlyData = useMemo(() => {
    if (selectedAnalyticsYear === "2025") return data2025;
    if (selectedAnalyticsYear === "2024") return data2024;
    return data2026;
  }, [selectedAnalyticsYear, data2026, data2025, data2024]);

  // Memoized SVG Bezier Chart Data for 60fps buttery smooth rendering
  const cumulativeChartConfig = useMemo(() => {
    const chartData = activeYearMonthlyData;
    const maxCumul = chartData[chartData.length - 1]?.cumulative || 500000;
    const roundedMax = Math.ceil(maxCumul / 100000) * 100000 || 500000;
    const svgWidth = 480;
    const svgHeight = 150;
    const padLeft = 48;
    const padRight = 20;
    const padTop = 15;
    const padBottom = 25;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const points = chartData.map((m, idx) => {
      const x = padLeft + (idx / Math.max(1, chartData.length - 1)) * plotW;
      const y = padTop + plotH - (m.cumulative / roundedMax) * plotH;
      return { ...m, x, y };
    });

    const pathD = points.reduce((acc, pt, idx, arr) => {
      if (idx === 0) return `M ${pt.x},${pt.y}`;
      const prev = arr[idx - 1];
      const cp1x = prev.x + (pt.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (pt.x - prev.x) / 2;
      const cp2y = pt.y;
      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
    }, "");

    const areaD =
      points.length > 0
        ? `${pathD} L ${points[points.length - 1].x},${padTop + plotH} L ${points[0].x},${padTop + plotH} Z`
        : "";

    const gridLevels = [
      { pct: 1.0, val: roundedMax },
      { pct: 0.66, val: Math.round(roundedMax * 0.66) },
      { pct: 0.33, val: Math.round(roundedMax * 0.33) },
      { pct: 0.0, val: 0 },
    ];

    return { svgWidth, svgHeight, padLeft, padRight, padTop, plotH, points, pathD, areaD, gridLevels };
  }, [activeYearMonthlyData]);

  // Overall 2026 Stats for Top Pinned Hero
  const monthlyAnalyticsData = data2026;
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

  // Selected Month Object in current active year
  const activeMonthDetail = useMemo(() => {
    const found = activeYearMonthlyData.find((m) => m.month === selectedAnalyticsMonth);
    return found || activeYearMonthlyData[activeYearMonthlyData.length - 1];
  }, [activeYearMonthlyData, selectedAnalyticsMonth]);

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
      {/* 1. Total Collections Box (Pinned at Top of Home Page) */}
      <div className="bg-gradient-to-br from-emerald-950 via-[#0b2b17] to-emerald-900 text-white rounded-3xl p-4 shadow-sm border border-emerald-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10.5px] font-bold text-emerald-200/80 uppercase tracking-wider block">
                Total Collections
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                ₹{multiMonthTotalCollected.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
              {multiMonthTotalBilled > 0 ? `${Math.round((multiMonthTotalCollected / multiMonthTotalBilled) * 100)}% Realized` : "0% Realized"}
            </span>
            <span className="text-[9.5px] text-emerald-300/80 block mt-1">
              {multiMonthTotalBookings} Poojas
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-800/60 text-center">
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200/80 font-bold block">Current Month (Sep)</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
              ₹{totalCollected.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200/80 font-bold block">Total Billed</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
              ₹{multiMonthTotalBilled.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200/80 font-bold block">Balance Due</span>
            <span className="text-xs sm:text-sm font-black text-amber-300 block mt-0.5">
              ₹{totalDue.toLocaleString("en-IN")}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Main Interactive Sub-Tabs Container */}
      <div className="space-y-3 pt-1">
        {/* Sub-Tab Switcher Bar (3 Tabs: Analytics, Payments, Devotees) */}
        <div className="bg-slate-200/90 p-1 rounded-2xl grid grid-cols-3 text-[11px] font-bold gap-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveSubTab("analytics")}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "analytics"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            <span className="whitespace-nowrap">Analytics</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("payments")}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "payments"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet className="w-3.5 h-3.5 shrink-0 text-emerald-700" />
            <span className="whitespace-nowrap">Payments</span>
            {overdueDueBookings.length > 0 ? (
              <span className="text-[8.5px] px-1.5 py-0.2 bg-rose-100 text-rose-800 rounded-full font-black shrink-0">
                {overdueDueBookings.length}
              </span>
            ) : allPendingDueBookings.length > 0 ? (
              <span className="text-[8.5px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full font-black shrink-0">
                {allPendingDueBookings.length}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("devotees")}
            className={`py-2 px-1 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSubTab === "devotees"
                ? "bg-white text-emerald-950 shadow-xs font-black"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5 shrink-0 text-indigo-700" />
            <span className="whitespace-nowrap">Devotees</span>
            <span className="text-[8.5px] px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded-full font-black shrink-0">
              {customers.length}
            </span>
          </button>
        </div>

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
                    <span>Add Devotee</span>
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
                      const cMobile = c.mobile?.replace(/\D/g, "");
                      const poojaCount =
                        (c.id && customerBookingCountMap.get(c.id)) ||
                        (cMobile && customerBookingCountMap.get(cMobile)) ||
                        0;
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
                                <span>{poojaCount} {poojaCount === 1 ? "Pooja" : "Poojas"}</span>
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
                  const memberBookings = memberBookingsMap.get(m.id) || [];

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
                                    🪔 {b.poojaEnglishName} • 📅 {b.date} ({formatTime12H(b.startTime)})
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

            {/* 3. All Payments Controls: Filter by Status & 4-Way Sorting */}
            {paymentFilter === "ALL" && (
              <div className="space-y-2">
                {/* Status Filter Pills */}
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[11px] no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setAllPaymentStatusFilter("ALL")}
                    className={`px-2.5 py-1 rounded-xl font-bold transition shrink-0 ${
                      allPaymentStatusFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-2xs font-black"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    All ({bookings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPaymentStatusFilter("PAID")}
                    className={`px-2.5 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1 ${
                      allPaymentStatusFilter === "PAID"
                        ? "bg-emerald-800 text-white shadow-2xs font-black"
                        : "bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    <span>Full Paid ✅</span>
                    <span>({bookings.filter((b) => b.paymentStatus === "PAID" || b.balanceAmount === 0).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPaymentStatusFilter("PARTIAL")}
                    className={`px-2.5 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1 ${
                      allPaymentStatusFilter === "PARTIAL"
                        ? "bg-amber-800 text-white shadow-2xs font-black"
                        : "bg-white text-amber-800 border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    <span>Advance ⏳</span>
                    <span>({bookings.filter((b) => (b.advanceAmount || 0) > 0 && (b.balanceAmount || 0) > 0).length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAllPaymentStatusFilter("PENDING")}
                    className={`px-2.5 py-1 rounded-xl font-bold transition shrink-0 flex items-center gap-1 ${
                      allPaymentStatusFilter === "PENDING"
                        ? "bg-rose-800 text-white shadow-2xs font-black"
                        : "bg-white text-rose-800 border border-rose-200 hover:bg-rose-50"
                    }`}
                  >
                    <span>Unpaid 🚨</span>
                    <span>({bookings.filter((b) => (b.advanceAmount || 0) === 0 && (b.balanceAmount || 0) > 0).length})</span>
                  </button>
                </div>

                {/* Sorting Controls */}
                <div className="flex items-center justify-between gap-1 text-[11px] pt-0.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1 text-[10.5px]">
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    <span>வரிசை (Sort):</span>
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setAllPaymentSortBy("recent")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] shrink-0 ${
                        allPaymentSortBy === "recent"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Default: Recent Changes first"
                    >
                      🕒 Recent
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllPaymentSortBy("datetime")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] shrink-0 ${
                        allPaymentSortBy === "datetime"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Date wise (If same date, ordered by start time)"
                    >
                      📅 Date & Time
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllPaymentSortBy("bill")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] shrink-0 ${
                        allPaymentSortBy === "bill"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Bill wise / Booking Number order"
                    >
                      🧾 Bill Wise
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllPaymentSortBy("amount")}
                      className={`px-2 py-0.5 rounded-lg font-bold transition text-[10px] shrink-0 ${
                        allPaymentSortBy === "amount"
                          ? "bg-slate-900 text-white shadow-2xs font-black"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                      title="Bill Total Amount wise"
                    >
                      💰 Bill Total
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
                          {(b.advanceAmount || 0) > 0 && (
                            <button
                              type="button"
                              onClick={() => setResetPaymentConfirmBooking(b)}
                              className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                              title="கட்டணத்தை நீக்க/மீட்டமைக்க (Reset Payment)"
                            >
                              <Trash2 className="w-3 h-3 text-rose-600" />
                              <span className="hidden sm:inline">கட்டணம் நீக்கு</span>
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
        {/* SUB-TAB: ANALYTICS (Cumulative Line Chart & Multi-Year Breakdown)         */}
        {/* ========================================================================= */}
        {activeSubTab === "analytics" && (
          <div className="space-y-3 animate-in fade-in duration-150">
            {bookings.length === 0 && (
              <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold min-w-0">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="truncate">Workspace data is cleared (0 bookings). Load sample data from Settings.</span>
                </div>
                <Link
                  href="/app/settings"
                  className="px-2.5 py-1 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-[10.5px] font-black shrink-0 shadow-2xs"
                >
                  Settings
                </Link>
              </div>
            )}

            {/* 0. SMART YEAR SELECTOR */}
            <div className="bg-white rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 w-full">
                {(["2026", "2025", "2024", "ALL"] as const).map((yr) => {
                  const isSelected = selectedAnalyticsYear === yr;
                  const label =
                    yr === "2026"
                      ? "2026 (Live)"
                      : yr === "ALL"
                      ? "All Years"
                      : yr;

                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => {
                        setSelectedAnalyticsYear(yr);
                        if (yr === "2026") setSelectedAnalyticsMonth("Sep");
                        else if (yr === "2025" || yr === "2024") setSelectedAnalyticsMonth("Dec");
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-xl transition text-center font-black text-xs cursor-pointer ${
                        isSelected
                          ? "bg-emerald-900 text-white shadow-2xs"
                          : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedAnalyticsYear !== "ALL" ? (
              <>
                {/* 1. CUMULATIVE COLLECTION TREND LINE CHART */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Cumulative Collection Trend ({selectedAnalyticsYear})
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Progressive cumulative cashflow over the year
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <span>Cumulative Curve</span>
                    </div>
                  </div>

                  {/* Active Tooltip Banner */}
                  {activeMonthDetail && (
                    <div className="bg-emerald-50/70 border border-emerald-200/90 rounded-xl px-3 py-1.5 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600" />
                        <span>Up to {activeMonthDetail.month} {selectedAnalyticsYear}:</span>
                        <span className="font-black text-emerald-900 text-sm">
                          ₹{activeMonthDetail.cumulative.toLocaleString("en-IN")}
                        </span>
                      </span>
                      <span className="text-[10px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs">
                        +{activeMonthDetail.month}: ₹{activeMonthDetail.collected.toLocaleString("en-IN")}
                      </span>
                    </div>
                  )}

                  {/* SVG Bezier Cumulative Line Chart (Memoized for zero lag) */}
                  {(() => {
                    const { svgWidth, svgHeight, padLeft, padRight, padTop, plotH, points, pathD, areaD, gridLevels } = cumulativeChartConfig;

                    return (
                      <div className="relative w-full overflow-hidden">
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-auto overflow-visible select-none"
                        >
                          <defs>
                            <linearGradient id="cumulGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#059669" stopOpacity="0.35" />
                              <stop offset="100%" stopColor="#059669" stopOpacity="0.02" />
                            </linearGradient>
                          </defs>

                          {/* Horizontal Grid lines */}
                          {gridLevels.map((g, i) => {
                            const yPos = padTop + plotH * (1 - g.pct);
                            const label =
                              g.val >= 100000
                                ? `₹${(g.val / 100000).toFixed(1)}L`
                                : `₹${Math.round(g.val / 1000)}k`;

                            return (
                              <g key={i}>
                                <line
                                  x1={padLeft}
                                  y1={yPos}
                                  x2={svgWidth - padRight}
                                  y2={yPos}
                                  stroke="#e2e8f0"
                                  strokeDasharray="3 3"
                                  strokeWidth="1"
                                />
                                <text
                                  x={padLeft - 6}
                                  y={yPos + 3}
                                  textAnchor="end"
                                  fontSize="9"
                                  fontWeight="700"
                                  fill="#94a3b8"
                                >
                                  {label}
                                </text>
                              </g>
                            );
                          })}

                          {/* Gradient Fill under curve */}
                          {areaD && <path d={areaD} fill="url(#cumulGrad)" />}

                          {/* Main Bezier Line */}
                          {pathD && (
                            <path
                              d={pathD}
                              fill="none"
                              stroke="#047857"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}

                          {/* Interactive Points */}
                          {points.map((pt, idx) => {
                            const isSelected = selectedAnalyticsMonth === pt.month;
                            return (
                              <g
                                key={pt.id}
                                className="cursor-pointer group"
                                onClick={() => {
                                  setSelectedAnalyticsMonth(pt.month);
                                  setAnalyticsHoverIndex(idx);
                                }}
                              >
                                {isSelected && (
                                  <circle
                                    cx={pt.x}
                                    cy={pt.y}
                                    r="9"
                                    fill="#059669"
                                    fillOpacity="0.25"
                                  />
                                )}
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r={isSelected ? "5" : "3.5"}
                                  fill={isSelected ? "#047857" : "#ffffff"}
                                  stroke="#047857"
                                  strokeWidth={isSelected ? "2.5" : "2"}
                                  className="transition-all duration-150"
                                />
                                {/* Bottom X-axis Month label */}
                                <text
                                  x={pt.x}
                                  y={svgHeight - 6}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight={isSelected ? "900" : "700"}
                                  fill={isSelected ? "#047857" : "#64748b"}
                                >
                                  {pt.month}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
                </div>

                {/* 2. MONTHLY BREAKDOWN: DUAL BAR CHART */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Monthly Breakdown ({selectedAnalyticsYear})
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Billed vs Collected Amount per month
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[9.5px] font-bold">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block" /> Billed
                      </span>
                      <span className="flex items-center gap-1 text-emerald-800">
                        <span className="w-2 h-2 rounded-xs bg-emerald-600 inline-block" /> Collected
                      </span>
                    </div>
                  </div>

                  {/* Dual Bars Container */}
                  <div className={`grid gap-1 sm:gap-1.5 pt-2 pb-1 border-b border-slate-100 ${
                    activeYearMonthlyData.length > 10 ? "grid-cols-6 sm:grid-cols-12" : "grid-cols-5 sm:grid-cols-10"
                  }`}>
                    {activeYearMonthlyData.map((m, idx) => {
                      const isSelected = selectedAnalyticsMonth === m.month;
                      const maxBarVal = 75000;
                      const billedHeightPct = Math.min(100, Math.round((m.billed / maxBarVal) * 100));
                      const collectedHeightPct = Math.min(100, Math.round((m.collected / maxBarVal) * 100));

                      return (
                        <button
                          key={m.id}
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
                          <span
                            className={`text-[7.5px] font-black px-1 py-0.2 rounded-md ${
                              isSelected
                                ? "bg-emerald-700 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            {m.rate}%
                          </span>

                          <div className="w-full h-20 flex items-end justify-center gap-0.5 sm:gap-1 pt-1 pb-0.5">
                            <div
                              className="w-2 sm:w-2.5 bg-slate-300 rounded-t-md transition-all duration-500 group-hover:bg-slate-400"
                              style={{ height: `${Math.max(10, billedHeightPct)}%` }}
                              title={`${m.month} Billed: ₹${m.billed.toLocaleString("en-IN")}`}
                            />
                            <div
                              className={`w-2 sm:w-2.5 rounded-t-md transition-all duration-500 ${
                                isSelected ? "bg-emerald-700" : "bg-emerald-600 group-hover:bg-emerald-500"
                              }`}
                              style={{ height: `${Math.max(10, collectedHeightPct)}%` }}
                              title={`${m.month} Collected: ₹${m.collected.toLocaleString("en-IN")}`}
                            />
                          </div>

                          <div className="text-center w-full">
                            <span
                              className={`text-[9.5px] font-black block leading-tight ${
                                isSelected ? "text-emerald-950" : "text-slate-700"
                              }`}
                            >
                              {m.month}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* 3. Selected Month Detailed Drilldown Card */}
                  {activeMonthDetail && (
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/90 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          <span className="font-extrabold text-xs text-emerald-950">
                            {activeMonthDetail.fullYear} Details
                          </span>
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white text-emerald-900 border border-emerald-300 shadow-2xs">
                          {activeMonthDetail.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-center text-xs">
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-bold block">Month Collected</span>
                          <span className="font-black text-emerald-900 text-xs block mt-0.5">
                            ₹{activeMonthDetail.collected.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-bold block">Month Billed</span>
                          <span className="font-black text-slate-800 text-xs block mt-0.5">
                            ₹{activeMonthDetail.billed.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-bold block">Remaining Due</span>
                          <span className="font-black text-amber-900 text-xs block mt-0.5">
                            {activeMonthDetail.due > 0
                              ? `₹${activeMonthDetail.due.toLocaleString("en-IN")}`
                              : "₹0 (Fully Paid)"}
                          </span>
                        </div>
                        <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                          <span className="text-[9px] text-slate-500 font-bold block">Cumulative to Date</span>
                          <span className="font-black text-emerald-950 text-xs block mt-0.5">
                            ₹{activeMonthDetail.cumulative.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Month-Wise Collections Breakdown List */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-700" />
                      <span>{selectedAnalyticsYear} Month-by-Month Breakdown</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {activeYearMonthlyData.length} Months
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {activeYearMonthlyData.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => setSelectedAnalyticsMonth(m.month)}
                        className={`p-2.5 rounded-2xl border transition flex items-center justify-between text-xs cursor-pointer ${
                          selectedAnalyticsMonth === m.month
                            ? "bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-200"
                            : "bg-slate-50/70 hover:bg-slate-100/70 border-slate-200/80"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-800 flex flex-col items-center justify-center shrink-0">
                            <span className="font-black text-xs leading-none">{m.month}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <span>{m.fullYear}</span>
                              {m.isCurrent && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  Current
                                </span>
                              )}
                            </div>
                            <div className="text-[10.5px] text-slate-500 font-semibold mt-0.5">
                              {m.bookingsCount} Poojas • Billed: ₹{m.billed.toLocaleString("en-IN")} • Cumul: ₹{m.cumulative.toLocaleString("en-IN")}
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
                            {m.rate}% Realized
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              /* ========================================================================= */
              /* ALL YEARS OVERVIEW & COMPARISON                                           */
              /* ========================================================================= */
              <div className="space-y-3">
                {/* All-Time Grand Summary Card */}
                <div className="bg-gradient-to-br from-emerald-900 to-slate-900 text-white rounded-3xl p-4 shadow-sm space-y-3 border border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/10 text-emerald-300 flex items-center justify-center border border-white/20">
                        <TrendingUp className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-wider block">
                          All-Time Total Collections
                        </span>
                        <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
                          ₹{allYearsSummary.reduce((s, y) => s + y.collected, 0).toLocaleString("en-IN")}
                        </h3>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                        {allYearsSummary.reduce((s, y) => s + y.count, 0)} Total Poojas
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-center">
                    <div className="bg-white/10 p-2 rounded-2xl">
                      <span className="text-[9px] text-emerald-200 font-bold block">2026 YTD</span>
                      <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                        ₹{allYearsSummary[0].collected.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="bg-white/10 p-2 rounded-2xl">
                      <span className="text-[9px] text-emerald-200 font-bold block">2025 Total</span>
                      <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                        ₹{allYearsSummary[1].collected.toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="bg-white/10 p-2 rounded-2xl">
                      <span className="text-[9px] text-emerald-200 font-bold block">2024 Total</span>
                      <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
                        ₹{allYearsSummary[2].collected.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Year-by-Year Comparison Cards with drilldown actions */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-emerald-700" />
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                        Year-over-Year Collections
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-bold">
                      2024 – 2026
                    </span>
                  </div>

                  <div className="space-y-2">
                    {allYearsSummary.map((yr) => (
                      <div
                        key={yr.year}
                        className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900">
                              {yr.label}
                            </span>
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded">
                              {yr.rate}% Realized
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-semibold mt-0.5">
                            {yr.count} Poojas • Billed: ₹{yr.billed.toLocaleString("en-IN")}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <span className="font-black text-emerald-800 text-xs sm:text-sm block">
                              ₹{yr.collected.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedAnalyticsYear(yr.year);
                              if (yr.year === "2026") setSelectedAnalyticsMonth("Sep");
                              else setSelectedAnalyticsMonth("Dec");
                            }}
                            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <span>Months</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
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
              {(() => {
                const drawerMobile = selectedDevoteeDrawer.mobile?.replace(/\D/g, "");
                const devoteeDrawerBookings = bookings.filter(
                  (b) =>
                    (selectedDevoteeDrawer.id && b.customerId === selectedDevoteeDrawer.id) ||
                    (drawerMobile && b.customerMobile?.replace(/\D/g, "") === drawerMobile)
                );
                if (devoteeDrawerBookings.length === 0) {
                  return <p className="text-xs text-slate-400">No bookings recorded yet.</p>;
                }
                return devoteeDrawerBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{b.poojaEnglishName}</div>
                      <div className="text-[10.5px] text-slate-500">
                        {b.date} • {formatTime12H(b.startTime)}
                      </div>
                    </div>
                    <div className="text-right font-black text-slate-900">
                      ₹{b.totalAmount.toLocaleString("en-IN")}
                    </div>
                  </div>
                ));
              })()}
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

      {/* ========================================================================= */}
      {/* MODAL: RESET / DELETE PAYMENT CONFIRMATION                                */}
      {/* ========================================================================= */}
      {resetPaymentConfirmBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-rose-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-base text-slate-900">
                கட்டணத்தை நீக்கவா? (Delete Payment)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                பதிவு <strong>#{resetPaymentConfirmBooking.bookingNumber}</strong> ({resetPaymentConfirmBooking.customerName}) பெற்ற தொகை <strong>₹{(resetPaymentConfirmBooking.advanceAmount || 0).toLocaleString("en-IN")}</strong> நீக்கப்பட்டு, நிலுவைத் தொகை மீண்டும் <strong>₹{resetPaymentConfirmBooking.totalAmount.toLocaleString("en-IN")}</strong> ஆக மாற்றப்படும்.
              </p>
              <div className="text-[11px] bg-rose-50 text-rose-900 font-semibold p-2.5 rounded-xl border border-rose-200">
                ⚠️ நிலைமை "PENDING" (Unpaid) என மீண்டும் மாற்றப்படும்.
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setResetPaymentConfirmBooking(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ரத்து (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPayment}
                className="flex-1 py-2.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold shadow-2xs transition cursor-pointer"
              >
                ஆம், நீக்கு (Delete)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

