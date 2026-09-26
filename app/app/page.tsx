"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString, formatTime12H } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import { Booking, Customer, BusinessMember } from "@/lib/types";
import {
  normalizeIndianMobile,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "@/lib/utils/phone";
import Link from "next/link";
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
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
  Eye,
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

  // Sub-Tab 2: Devotee & Priest Search, Filter & Add
  const [devoteeSubTab, setDevoteeSubTab] = useState<"devotees" | "assigned">("devotees");
  const [devoteeFilter, setDevoteeFilter] = useState<"ALL" | "TOP">("ALL");
  const [devoteeSearch, setDevoteeSearch] = useState("");
  const [showAddDevoteeModal, setShowAddDevoteeModal] = useState(false);
  const [selectedDevoteeDrawer, setSelectedDevoteeDrawer] = useState<Customer | null>(null);

  // Priest Tab States
  const [priestFilter, setPriestFilter] = useState<"ALL" | "TOP">("ALL");
  const [priestSearch, setPriestSearch] = useState("");
  const [selectedPriestDrawer, setSelectedPriestDrawer] = useState<BusinessMember | null>(null);
  const [showAddPriestModal, setShowAddPriestModal] = useState(false);
  const [newPriestName, setNewPriestName] = useState("");
  const [newPriestMobile, setNewPriestMobile] = useState("");
  const [newPriestSpec, setNewPriestSpec] = useState("உதவி குருக்கள் (Assistant Priest)");
  const [priestModalError, setPriestModalError] = useState("");

  // New devotee form state
  const [custName, setCustName] = useState("");
  const [custMobile, setCustMobile] = useState("");
  const [custCity, setCustCity] = useState("Namakkal");
  const [custAddress, setCustAddress] = useState("");
  const [custNotes, setCustNotes] = useState("");
  const [custError, setCustError] = useState("");

  const custMobileInspection = inspectIndianMobile(custMobile);

  // 1. Deduplicate Priest Members (by ID and normalized mobile)
  const uniqueMembers = useMemo(() => {
    const seen = new Set<string>();
    return members.filter((m) => {
      const cleanMobile = m.mobile ? normalizeIndianMobile(m.mobile) : "";
      const key = cleanMobile ? `m:${cleanMobile}` : `id:${m.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [members]);

  // 2. Index priest mobiles & names to eliminate any duplicate/mismatch with devotees
  const priestMemberMobiles = useMemo(() => {
    const set = new Set<string>();
    for (const m of uniqueMembers) {
      if (m.mobile) set.add(normalizeIndianMobile(m.mobile));
      if (m.name) set.add(m.name.trim().toLowerCase());
    }
    return set;
  }, [uniqueMembers]);

  // 3. Deduplicate Devotees / Customers and filter out any priest entries to avoid duplicate/mismatch
  const uniqueCustomers = useMemo(() => {
    const seen = new Set<string>();
    return customers.filter((c) => {
      const cleanMobile = c.mobile ? normalizeIndianMobile(c.mobile) : "";
      // Exclude if customer mobile or name is an assigned priest member
      if (cleanMobile && priestMemberMobiles.has(cleanMobile)) return false;
      if (c.name && priestMemberMobiles.has(c.name.trim().toLowerCase())) return false;
      const key = cleanMobile ? `m:${cleanMobile}` : `id:${c.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [customers, priestMemberMobiles]);

  const filteredDevoteesList = useMemo(() => {
    let list = uniqueCustomers;
    const q = devoteeSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.mobile.includes(q) ||
          (c.city && c.city.toLowerCase().includes(q))
      );
    }
    if (devoteeFilter === "TOP") {
      list = [...list].sort((a, b) => {
        const aMobile = a.mobile?.replace(/\D/g, "");
        const bMobile = b.mobile?.replace(/\D/g, "");
        const aCount = (a.id && customerBookingCountMap.get(a.id)) || (aMobile && customerBookingCountMap.get(aMobile)) || 0;
        const bCount = (b.id && customerBookingCountMap.get(b.id)) || (bMobile && customerBookingCountMap.get(bMobile)) || 0;
        return bCount - aCount;
      });
    }
    return list;
  }, [uniqueCustomers, devoteeSearch, devoteeFilter, customerBookingCountMap]);

  const filteredPriestsList = useMemo(() => {
    let list = uniqueMembers;
    const q = priestSearch.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          (m.mobile && m.mobile.includes(q)) ||
          (m.specialization && m.specialization.toLowerCase().includes(q))
      );
    }
    if (priestFilter === "TOP") {
      list = [...list].sort((a, b) => {
        const aBookings = memberBookingsMap.get(a.id) || [];
        const bBookings = memberBookingsMap.get(b.id) || [];
        const aCollections = aBookings.reduce((sum, bk) => sum + (bk.totalAmount || 0), 0);
        const bCollections = bBookings.reduce((sum, bk) => sum + (bk.totalAmount || 0), 0);
        if (bBookings.length !== aBookings.length) {
          return bBookings.length - aBookings.length;
        }
        return bCollections - aCollections;
      });
    }
    return list;
  }, [uniqueMembers, priestSearch, priestFilter, memberBookingsMap]);

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

  const handleAddPriestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriestName.trim()) {
      setPriestModalError("தயவுசெய்து குருக்கள் பெயரை உள்ளிடவும் / Name is required.");
      return;
    }
    setPriestModalError("");
    db.createMember({
      businessId,
      name: newPriestName.trim(),
      mobile: newPriestMobile.trim(),
      role: "IYER",
      specialization: newPriestSpec.trim() || "உதவி குருக்கள் (Assistant Priest)",
    });
    setNewPriestName("");
    setNewPriestMobile("");
    setNewPriestSpec("உதவி குருக்கள் (Assistant Priest)");
    setShowAddPriestModal(false);
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
  const [paymentDateInput, setPaymentDateInput] = useState<string>(todayLocalDateStr);
  const [paymentMethodInput, setPaymentMethodInput] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string>("");

  // Overdue / Completed Dues: Pooja date has passed or is today (<= today) OR booking is COMPLETED, with balanceAmount > 0
  const overdueDueBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status !== "CANCELLED" &&
        (b.balanceAmount || 0) > 0 &&
        (b.date <= todayInfo.dateStr || b.status === "COMPLETED")
    );
  }, [bookings, todayInfo.dateStr]);

  // Upcoming Booking Dues: Pooja date is in the future (> today) AND NOT completed, with balanceAmount > 0
  const upcomingDueBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status !== "CANCELLED" &&
        b.status !== "COMPLETED" &&
        (b.balanceAmount || 0) > 0 &&
        b.date > todayInfo.dateStr
    );
  }, [bookings, todayInfo.dateStr]);

  // All Pending Dues
  const allPendingDueBookings = useMemo(() => {
    return bookings.filter((b) => (b.balanceAmount || 0) > 0);
  }, [bookings]);

  // When switching to Payments tab, if there are pending dues, automatically show pending dues first!
  useEffect(() => {
    if (activeSubTab === "payments" && allPendingDueBookings.length > 0) {
      setPaymentFilter("PENDING");
    }
  }, [activeSubTab, allPendingDueBookings.length]);

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
    setPaymentDateInput(todayLocalDateStr);
  };

  const handleConfirmRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordPaymentBooking || paymentAmountInput <= 0) return;

    const res = db.recordBookingPayment({
      bookingId: recordPaymentBooking.id,
      amount: Number(paymentAmountInput),
      paymentMethod: paymentMethodInput,
      paymentDate: paymentDateInput || todayLocalDateStr,
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
      msg += `தயவுசெய்து இந்நிலுவைத் தொகையை விரைவில் செலுத்துமாறு பணிவன்புடன் கேட்டுக்கொள்கிறோம். 🙏\n\n✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`;
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
      msg += `நன்றி! இறைவனின் பூரண அருள் கிடைக்க வாழ்த்துகிறோம். 🙏\n\n✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`;
    }

    const phone = b.customerMobile ? b.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  // Sub-Tab 4: Analytics Computations & Mini Collection Graph Data
  const totalBilled = useMemo(() => bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0), [bookings]);
  const totalCollected = useMemo(
    () =>
      bookings.reduce((sum, b) => {
        if (b.paymentStatus === "PAID" || (b.balanceAmount === 0 && (b.totalAmount || 0) > 0)) {
          return sum + (b.totalAmount || 0);
        }
        return sum + (b.advanceAmount || 0);
      }, 0),
    [bookings]
  );
  const totalDue = useMemo(
    () =>
      bookings.reduce((sum, b) => {
        if (b.paymentStatus === "PAID") return sum;
        return sum + (b.balanceAmount || 0);
      }, 0),
    [bookings]
  );
  const collectionRate = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 100;

  const currentMonthPrefix = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const currentMonthCollected = useMemo(() => {
    return bookings
      .filter((b) => b.date && b.date.startsWith(currentMonthPrefix) && b.status !== "CANCELLED")
      .reduce((sum, b) => {
        if (b.paymentStatus === "PAID" || (b.balanceAmount === 0 && (b.totalAmount || 0) > 0)) {
          return sum + (b.totalAmount || 0);
        }
        return sum + (b.advanceAmount || 0);
      }, 0);
  }, [bookings, currentMonthPrefix]);

  // Selected Year & Month for Analytics drilldown
  interface MonthlyAnalyticsItem {
    id: string;
    month: string;
    monthKey?: string;
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
    bookings?: Booking[];
  }

  const [selectedAnalyticsYear, setSelectedAnalyticsYear] = useState<"2026" | "2025" | "2024" | "ALL">("2026");
  const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState<string>("Sep");
  const [analyticsHoverIndex, setAnalyticsHoverIndex] = useState<number | null>(null);
  const [selectedMonthModal, setSelectedMonthModal] = useState<MonthlyAnalyticsItem | null>(null);

  const monthsMeta = useMemo(
    () => [
      { key: "01", name: "Jan" },
      { key: "02", name: "Feb" },
      { key: "03", name: "Mar" },
      { key: "04", name: "Apr" },
      { key: "05", name: "May" },
      { key: "06", name: "Jun" },
      { key: "07", name: "Jul" },
      { key: "08", name: "Aug" },
      { key: "09", name: "Sep" },
      { key: "10", name: "Oct" },
      { key: "11", name: "Nov" },
      { key: "12", name: "Dec" },
    ],
    []
  );

  const buildYearMonthlyData = React.useCallback(
    (year: string): MonthlyAnalyticsItem[] => {
      let running = 0;
      const now = new Date();
      const curYear = String(now.getFullYear());
      const curMo = String(now.getMonth() + 1).padStart(2, "0");

      // For current year, show up to current month + 1 future month (or min up to Oct)
      const list =
        year === curYear
          ? monthsMeta.filter((m) => parseInt(m.key, 10) <= Math.max(10, parseInt(curMo, 10) + 1))
          : monthsMeta;

      return list.map((m) => {
        const prefix = `${year}-${m.key}`;
        const mBookings = bookings.filter(
          (b) => b.date && b.date.startsWith(prefix) && b.status !== "CANCELLED"
        );
        const billed = mBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const collected = mBookings.reduce((sum, b) => {
          if (b.paymentStatus === "PAID" || (b.balanceAmount === 0 && (b.totalAmount || 0) > 0)) {
            return sum + (b.totalAmount || 0);
          }
          return sum + (b.advanceAmount || 0);
        }, 0);
        const due = mBookings.reduce((sum, b) => {
          if (b.paymentStatus === "PAID") return sum;
          return sum + (b.balanceAmount || 0);
        }, 0);
        const bookingsCount = mBookings.length;
        const rate = billed > 0 ? Math.round((collected / billed) * 100) : 100;
        const isCurrent = year === curYear && m.key === curMo;
        running += collected;

        return {
          id: `${year}-${m.key}`,
          month: m.name,
          monthKey: m.key,
          fullYear: `${m.name} ${year}${isCurrent ? " (Current)" : ""}`,
          year,
          billed,
          collected,
          due,
          bookingsCount,
          rate,
          status: billed > 0 ? `${rate}% Realized` : "0% Realized",
          isCurrent,
          cumulative: running,
          bookings: mBookings,
        };
      });
    },
    [bookings, monthsMeta]
  );

  // Dynamic Monthly Data derived 100% from actual bookings
  const data2026: MonthlyAnalyticsItem[] = useMemo(() => buildYearMonthlyData("2026"), [buildYearMonthlyData]);
  const data2025: MonthlyAnalyticsItem[] = useMemo(() => buildYearMonthlyData("2025"), [buildYearMonthlyData]);
  const data2024: MonthlyAnalyticsItem[] = useMemo(() => buildYearMonthlyData("2024"), [buildYearMonthlyData]);

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

  // All Years SVG Bezier Chart Data for continuous trend line across 2024 - 2026
  const allYearsChartConfig = useMemo(() => {
    const yr2024 = allYearsSummary.find((y) => y.year === "2024")?.collected || 0;
    const yr2025 = allYearsSummary.find((y) => y.year === "2025")?.collected || 0;
    const yr2026 = allYearsSummary.find((y) => y.year === "2026")?.collected || 0;

    const dataPoints = [
      { id: "2024", label: "2024", fullYear: "2024 Full Year", collected: yr2024, cumulative: yr2024, count: allYearsSummary.find((y) => y.year === "2024")?.count || 0 },
      { id: "2025", label: "2025", fullYear: "2025 Full Year", collected: yr2025, cumulative: yr2024 + yr2025, count: allYearsSummary.find((y) => y.year === "2025")?.count || 0 },
      { id: "2026", label: "2026 (YTD)", fullYear: "2026 YTD", collected: yr2026, cumulative: yr2024 + yr2025 + yr2026, count: allYearsSummary.find((y) => y.year === "2026")?.count || 0 },
    ];

    const maxCumul = dataPoints[dataPoints.length - 1].cumulative || 1000000;
    const roundedMax = Math.ceil(maxCumul / 100000) * 100000 || 1000000;
    const svgWidth = 480;
    const svgHeight = 150;
    const padLeft = 48;
    const padRight = 30;
    const padTop = 20;
    const padBottom = 25;
    const plotW = svgWidth - padLeft - padRight;
    const plotH = svgHeight - padTop - padBottom;

    const points = dataPoints.map((pt, idx) => {
      const x = padLeft + (idx / Math.max(1, dataPoints.length - 1)) * plotW;
      const y = padTop + plotH - (pt.cumulative / roundedMax) * plotH;
      return { ...pt, x, y };
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
  }, [allYearsSummary]);

  // Selected Month Object in current active year
  const activeMonthDetail = useMemo(() => {
    const found = activeYearMonthlyData.find((m) => m.month === selectedAnalyticsMonth);
    return found || activeYearMonthlyData[activeYearMonthlyData.length - 1];
  }, [activeYearMonthlyData, selectedAnalyticsMonth]);

  // Month-over-Month (MoM) and Year-over-Year (YoY) metrics for activeMonthDetail
  const monthComparison = useMemo(() => {
    if (!activeMonthDetail) return null;
    const currentIdx = activeYearMonthlyData.findIndex((m) => m.month === activeMonthDetail.month);
    const prevMonth = currentIdx > 0 ? activeYearMonthlyData[currentIdx - 1] : null;

    let momPercent: number | null = null;
    if (prevMonth && prevMonth.collected > 0) {
      momPercent = Math.round(((activeMonthDetail.collected - prevMonth.collected) / prevMonth.collected) * 100);
    } else if (prevMonth && prevMonth.collected === 0 && activeMonthDetail.collected > 0) {
      momPercent = 100;
    }

    // YoY comparison: compare against same month in previous year
    let yoyPercent: number | null = null;
    const prevYearData = activeMonthDetail.year === "2026" ? data2025 : activeMonthDetail.year === "2025" ? data2024 : null;
    if (prevYearData) {
      const sameMonthLastYear = prevYearData.find((m) => m.month === activeMonthDetail.month);
      if (sameMonthLastYear && sameMonthLastYear.collected > 0) {
        yoyPercent = Math.round(((activeMonthDetail.collected - sameMonthLastYear.collected) / sameMonthLastYear.collected) * 100);
      } else if (sameMonthLastYear && sameMonthLastYear.collected === 0 && activeMonthDetail.collected > 0) {
        yoyPercent = 100;
      }
    }

    return { momPercent, yoyPercent, prevMonthName: prevMonth?.month };
  }, [activeMonthDetail, activeYearMonthlyData, data2025, data2024]);

  // Helper for Monthly Highlights & Top Performers
  interface MonthTopPerformers {
    topPooja: { name: string; count: number; amount: number } | null;
    topDevotee: { name: string; count: number; amount: number } | null;
    highestDakshinaBooking: Booking | null;
  }

  const getMonthTopPerformers = (mBookings: Booking[]): MonthTopPerformers | null => {
    if (!mBookings || mBookings.length === 0) return null;

    // 1. Most Booked Pooja
    const poojaMap = new Map<string, { name: string; count: number; amount: number }>();
    mBookings.forEach((b) => {
      const name = b.poojaEnglishName || "Special Ceremony";
      const cur = poojaMap.get(name) || { name, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += b.totalAmount || 0;
      poojaMap.set(name, cur);
    });
    const topPooja = Array.from(poojaMap.values()).sort((a, b) => b.count - a.count || b.amount - a.amount)[0] || null;

    // 2. Top Devotee
    const devoteeMap = new Map<string, { name: string; count: number; amount: number }>();
    mBookings.forEach((b) => {
      const name = b.customerName || "Devotee";
      const cur = devoteeMap.get(name) || { name, count: 0, amount: 0 };
      cur.count += 1;
      cur.amount += b.totalAmount || 0;
      devoteeMap.set(name, cur);
    });
    const topDevotee = Array.from(devoteeMap.values()).sort((a, b) => b.amount - a.amount || b.count - a.count)[0] || null;

    // 3. Highest Dakshina Booking & Priest
    const highestDakshinaBooking = [...mBookings].sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))[0] || null;

    return {
      topPooja,
      topDevotee,
      highestDakshinaBooking,
    };
  };

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

  // Overall Stats for Top Pinned Hero
  const monthlyAnalyticsData = data2026;
  const multiMonthTotalCollected = totalCollected;
  const multiMonthTotalBilled = totalBilled;
  const multiMonthTotalBookings = bookings.length;

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-200">
      {/* 0. High-Impact Pending Dakshina Dues Alert Banner (Only for overdue ceremony dates or completed bookings) */}
      {overdueDueTotal > 0 && overdueDueBookings.length > 0 && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-rose-950 text-white rounded-2xl p-3 border border-rose-700/80 shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-rose-500/30 text-rose-200 flex items-center justify-center shrink-0 border border-rose-400/40 animate-pulse">
              <AlertCircle className="w-4 h-4 text-rose-300" />
            </div>
            <div className="min-w-0">
              <div className="font-black text-white text-xs sm:text-[13px] truncate">
                ₹{overdueDueTotal.toLocaleString("en-IN")} Pending Dues ({overdueDueBookings.length} {overdueDueBookings.length === 1 ? "Booking" : "Bookings"})
              </div>
              <p className="text-[10.5px] sm:text-[11px] text-rose-200/90 truncate">
                Payment pending for completed poojas. Follow up to collect.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveSubTab("payments");
              setPaymentFilter("PENDING");
              setPendingDueSubTab("OVERDUE");
            }}
            className="px-2.5 py-1.5 bg-white text-rose-950 hover:bg-rose-50 rounded-xl text-[11px] font-black shrink-0 transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
          >
            <span>Collect Dues</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

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
                ₹{totalCollected.toLocaleString("en-IN")}
              </h3>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
              {totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}% Realized` : "0% Realized"}
            </span>
            <span className="text-[9.5px] text-emerald-300/80 block mt-1">
              {bookings.length} {bookings.length === 1 ? "Pooja" : "Poojas"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-800/60 text-center">
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200/80 font-bold block">Current Month ({todayInfo.tamilMonth || "Sep"})</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
              ₹{currentMonthCollected.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="bg-white/10 p-2 rounded-2xl backdrop-blur-xs">
            <span className="text-[9px] text-emerald-200/80 font-bold block">Total Billed</span>
            <span className="text-xs sm:text-sm font-black text-white block mt-0.5">
              ₹{totalBilled.toLocaleString("en-IN")}
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

      {/* 2. Sacred Daily Panchangam & Nalla Neram Ribbon (Relocated Below Collections • Light Elegant Sacred Gold Theme) */}
      <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-100/90 text-amber-950 rounded-2xl px-3.5 py-2.5 shadow-2xs border border-amber-200/90 flex items-center justify-between gap-2.5 text-xs transition">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 border border-amber-400/40 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-extrabold text-amber-950 text-xs sm:text-[13px] truncate">
                {todayInfo.tamilYear} • {todayInfo.tamilMonth} {todayInfo.tamilDay}
              </span>
              <span className="text-[10.5px] text-amber-800 font-bold">
                ({todayInfo.dayOfWeekTa})
              </span>
              {todayInfo.nallaNeram && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-200/80 text-amber-950 text-[10px] font-black border border-amber-300">
                  நல்ல நேரம்: {formatTime12H(todayInfo.nallaNeram)}
                </span>
              )}
            </div>
            <div className="text-[11px] text-amber-900/80 flex items-center gap-1.5 mt-0.5 truncate font-medium">
              <span className="font-bold truncate">{todayInfo.tithiNameTa || todayInfo.tithi || "சதுர்தசி"}</span>
              <span>•</span>
              <span className="font-bold truncate">{todayInfo.nakshatraNameTa || todayInfo.nakshatra || "பூரட்டாதி"}</span>
              {todayInfo.isPournami && <span className="text-amber-800 font-black">• பௌர்ணமி</span>}
              {todayInfo.isAmavasai && <span className="text-purple-800 font-black">• அமாவாசை</span>}
              {todayInfo.isPradosham && <span className="text-emerald-800 font-black">• பிரதோஷம்</span>}
            </div>
          </div>
        </div>
        <Link
          href="/app/calendar"
          className="px-2.5 py-1.5 bg-amber-600/15 hover:bg-amber-600/25 text-amber-900 border border-amber-300/80 rounded-xl text-[11px] font-extrabold shrink-0 transition flex items-center gap-1 active:scale-95 shadow-2xs"
        >
          <span>Panchangam</span>
          <ChevronRight className="w-3 h-3" />
        </Link>
      </div>

      {/* 3. Quick Action Navigation Grid for Longterm Daily Operations (Clean English) */}
      <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
        <Link
          href="/app/bookings/new"
          className="p-2 bg-emerald-900/10 hover:bg-emerald-900/20 text-emerald-950 rounded-2xl border border-emerald-900/20 transition flex flex-col items-center justify-center gap-1 shadow-2xs"
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-800 text-white flex items-center justify-center">
            <Plus className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold">New Booking</span>
        </Link>
        <Link
          href="/app/calendar"
          className="p-2 bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 rounded-2xl border border-amber-900/20 transition flex flex-col items-center justify-center gap-1 shadow-2xs"
        >
          <div className="w-6 h-6 rounded-lg bg-amber-700 text-white flex items-center justify-center">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold">Calendar</span>
        </Link>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("payments");
            if (allPendingDueBookings.length > 0) setPaymentFilter("PENDING");
          }}
          className="p-2 bg-indigo-900/10 hover:bg-indigo-900/20 text-indigo-950 rounded-2xl border border-indigo-900/20 transition flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-indigo-700 text-white flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold">Payments</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveSubTab("devotees");
            setShowAddDevoteeModal(true);
          }}
          className="p-2 bg-slate-900/10 hover:bg-slate-900/20 text-slate-950 rounded-2xl border border-slate-900/20 transition flex flex-col items-center justify-center gap-1 shadow-2xs cursor-pointer"
        >
          <div className="w-6 h-6 rounded-lg bg-slate-800 text-white flex items-center justify-center">
            <Users className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-bold">+ Devotee</span>
        </button>
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
            onClick={() => {
              setActiveSubTab("payments");
              if (allPendingDueBookings.length > 0) {
                setPaymentFilter("PENDING");
              }
            }}
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
              {uniqueCustomers.length}
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
                👥 All Devotees ({uniqueCustomers.length})
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
                🪔 Assigned Priests ({uniqueMembers.length})
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

                {/* Devotees Filter: All vs ⭐ Top */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setDevoteeFilter("ALL")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      devoteeFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    அனைத்தும் ({uniqueCustomers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setDevoteeFilter("TOP")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                      devoteeFilter === "TOP"
                        ? "bg-amber-600 text-white shadow-2xs font-extrabold"
                        : "bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200"
                    }`}
                  >
                    <span>⭐ முக்கிய பக்தர்கள் (Top Devotees)</span>
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
                    {filteredDevoteesList.map((c, idx) => {
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
                            <div className="relative">
                              <div className="w-9 h-9 rounded-xl bg-amber-100/80 text-amber-900 font-black text-xs flex items-center justify-center border border-amber-300/70 shrink-0">
                                {initials}
                              </div>
                              {devoteeFilter === "TOP" && idx < 3 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
                                  {idx + 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <h4 className="font-extrabold text-sm text-slate-900 truncate">
                                  {c.name}
                                </h4>
                                {devoteeFilter === "TOP" && poojaCount >= 3 && (
                                  <span className="text-[9px] font-black bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded border border-amber-300">
                                    ⭐ VIP
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                                <MapPin className="w-3 h-3 text-amber-600 shrink-0" />
                                <span>{c.city || "Namakkal"}</span>
                                <span>•</span>
                                <span className="font-bold text-slate-700">{poojaCount} {poojaCount === 1 ? "Pooja" : "Poojas"}</span>
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
              <div className="space-y-2.5">
                {/* Search & Cute Compact Add Priest Button */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search priest name, mobile, spec..."
                      value={priestSearch}
                      onChange={(e) => setPriestSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>

                  {/* Cute Compact Add Priest Button */}
                  <button
                    type="button"
                    onClick={() => setShowAddPriestModal(true)}
                    className="h-8 px-2.5 bg-gradient-to-r from-emerald-800 to-[#0c3116] hover:from-emerald-700 hover:to-emerald-900 text-amber-300 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs transition active:scale-95 shrink-0 border border-emerald-950/30 cursor-pointer"
                    title="புதிய குருக்கள் சேர் / Add Priest"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span className="text-[11px]">Add Priest</span>
                  </button>
                </div>

                {/* Priests Filter Tabs: All vs ⭐ Top Priests */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setPriestFilter("ALL")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                      priestFilter === "ALL"
                        ? "bg-slate-900 text-white shadow-2xs"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                    }`}
                  >
                    அனைத்து குருக்கள் ({uniqueMembers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPriestFilter("TOP")}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer flex items-center gap-1 ${
                      priestFilter === "TOP"
                        ? "bg-emerald-800 text-white shadow-2xs font-extrabold"
                        : "bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200"
                    }`}
                  >
                    <span>⭐ சிறந்த குருக்கள் (Top Priests)</span>
                  </button>
                </div>

                {filteredPriestsList.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 text-slate-500 space-y-1">
                    <User className="w-6 h-6 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold">No priests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPriestsList.map((m, idx) => {
                      const isOwner = m.role === "OWNER" || m.id === ownerMember?.id;
                      const memberBookings = memberBookingsMap.get(m.id) || [];
                      const totalCollections = memberBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
                      const directPriestAmount = memberBookings.reduce((sum, b) => {
                        if (b.priestShareAmount !== undefined && b.priestShareAmount > 0) {
                          return sum + b.priestShareAmount;
                        }
                        if (b.paymentRecipient === "PRIEST") {
                          return sum + (b.advanceAmount || (b.paymentStatus === "PAID" ? b.totalAmount : 0));
                        }
                        return sum;
                      }, 0);

                      return (
                        <div
                          key={m.id}
                          onClick={() => setSelectedPriestDrawer(m)}
                          className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/90 shadow-2xs space-y-2.5 hover:border-emerald-500/80 transition cursor-pointer group"
                        >
                          {/* Priest Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="relative">
                                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-950 font-black text-sm flex items-center justify-center border border-emerald-300 shrink-0">
                                  {isOwner ? "🪔" : "👥"}
                                </div>
                                {priestFilter === "TOP" && idx < 3 && (
                                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-700 text-white rounded-full text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
                                    {idx + 1}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <h4 className="font-extrabold text-sm text-slate-900 truncate group-hover:text-emerald-950">
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

                            <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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

                          {/* Quick Collections & Pooja Metrics */}
                          <div className="flex items-center justify-between bg-slate-50/80 px-2.5 py-1.5 rounded-xl border border-slate-100 text-[11px]">
                            <span className="font-bold text-slate-700">
                              🪔 {memberBookings.length} {memberBookings.length === 1 ? "Pooja" : "Poojas"}
                            </span>
                            <div className="flex items-center gap-2">
                              {directPriestAmount > 0 && (
                                <span className="text-[9.5px] font-extrabold text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300" title="Directly Collected by Priest">
                                  👤 நேரடி: ₹{directPriestAmount.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="font-black text-emerald-950">
                                வசூல்: ₹{totalCollections.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>

                          {/* Assigned Bookings Preview (Max 2 items) */}
                          <div className="pt-1.5 border-t border-slate-100 space-y-1">
                            {memberBookings.length === 0 ? (
                              <p className="text-[11px] text-slate-400 italic">
                                No upcoming poojas assigned currently.
                              </p>
                            ) : (
                              <div className="space-y-1">
                                {memberBookings.slice(0, 2).map((b) => (
                                  <div
                                    key={b.id}
                                    className="p-2 bg-slate-50/70 hover:bg-amber-50/50 rounded-xl border border-slate-200/60 flex items-center justify-between gap-2 text-xs transition"
                                  >
                                    <div className="min-w-0">
                                      <div className="font-black text-slate-900 truncate">
                                        👤 {b.customerName}
                                      </div>
                                      <div className="text-[10px] text-slate-600 truncate">
                                        🪔 {b.poojaEnglishName} • 📅 {b.date}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="font-extrabold text-slate-900 text-xs block">
                                        ₹{b.totalAmount.toLocaleString("en-IN")}
                                      </span>
                                      <span
                                        className={`text-[9px] font-bold ${
                                          b.paymentRecipient === "PRIEST"
                                            ? "text-amber-800"
                                            : b.paymentStatus === "PAID"
                                            ? "text-emerald-700"
                                            : "text-rose-700"
                                        }`}
                                      >
                                        {b.paymentRecipient === "PRIEST" ? "வாத்யாரிடம் நேரடி" : b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* View Full History Click Hint */}
                            <div className="flex items-center justify-between text-[10.5px] font-bold text-emerald-900 pt-1">
                              <span>விவரங்கள் & வசூல் கணக்கு (View Details)</span>
                              <span>→</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
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
                  const maxMiniVal = Math.max(...monthlyAnalyticsData.slice(-3).map((item) => Math.max(item.billed, item.collected)), 1000);
                  const colPct = Math.round((m.collected / (m.billed || 1)) * 100);
                  const hPct = Math.min(100, Math.round((m.billed / maxMiniVal) * 100));
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
                            <span>•</span>
                            <span>📅 {b.date}</span>
                            {b.paymentDate && (
                              <>
                                <span>•</span>
                                <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 text-[10px]">
                                  💳 Paid on: {b.paymentDate}
                                </span>
                              </>
                            )}
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
              <div className="p-3.5 bg-gradient-to-r from-amber-50 via-amber-100/50 to-orange-50 border border-amber-200/90 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-800 flex items-center justify-center shrink-0 text-base">
                    💡
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-amber-950 block text-[12px]">
                      Tip: Your booking schedule is empty!
                    </span>
                    <span className="text-[11px] text-amber-800/90 block">
                      Tap &apos;+ New Booking&apos; or &apos;Quick Booking&apos; to schedule your first pooja ceremony.
                    </span>
                  </div>
                </div>
                <Link
                  href="/app/bookings/quick"
                  className="px-3 py-1.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl text-[11px] font-bold shrink-0 shadow-xs flex items-center gap-1 active:scale-95 transition"
                >
                  <span>Book Now</span>
                  <span>→</span>
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

                {/* 2. MONTHLY BREAKDOWN: DUAL BAR CHART (Billed ₹ vs Bookings Count) */}
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
                        Billed Amount (₹) vs Bookings Count (Qty) per month
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[9.5px] font-bold">
                      <span className="flex items-center gap-1 text-slate-500">
                        <span className="w-2 h-2 rounded-xs bg-slate-300 inline-block" /> Billed (₹)
                      </span>
                      <span className="flex items-center gap-1 text-indigo-800">
                        <span className="w-2 h-2 rounded-xs bg-indigo-600 inline-block" /> Bookings Count
                      </span>
                    </div>
                  </div>

                  {/* Dual Bars Container */}
                  <div className={`grid gap-1 sm:gap-1.5 pt-2 pb-1 border-b border-slate-100 ${
                    activeYearMonthlyData.length > 10 ? "grid-cols-6 sm:grid-cols-12" : "grid-cols-5 sm:grid-cols-10"
                  }`}>
                    {activeYearMonthlyData.map((m, idx) => {
                      const isSelected = selectedAnalyticsMonth === m.month;
                      const maxBilledVal = Math.max(...activeYearMonthlyData.map((item) => item.billed), 1000);
                      const maxBookingsVal = Math.max(...activeYearMonthlyData.map((item) => item.bookingsCount), 1);
                      const billedHeightPct = Math.min(100, Math.round((m.billed / maxBilledVal) * 100));
                      const bookingsHeightPct = Math.min(100, Math.round((m.bookingsCount / maxBookingsVal) * 100));

                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setSelectedAnalyticsMonth(m.month);
                            setAnalyticsHoverIndex(idx);
                            setSelectedMonthModal(m);
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
                                ? "bg-indigo-700 text-white"
                                : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                            }`}
                          >
                            {m.bookingsCount} Qty
                          </span>

                          <div className="w-full h-20 flex items-end justify-center gap-0.5 sm:gap-1 pt-1 pb-0.5">
                            <div
                              className="w-2 sm:w-2.5 bg-slate-300 rounded-t-md transition-all duration-500 group-hover:bg-slate-400"
                              style={{ height: `${Math.max(10, billedHeightPct)}%` }}
                              title={`${m.month} Billed: ₹${m.billed.toLocaleString("en-IN")}`}
                            />
                            <div
                              className={`w-2 sm:w-2.5 rounded-t-md transition-all duration-500 ${
                                isSelected ? "bg-indigo-700" : "bg-indigo-600 group-hover:bg-indigo-500"
                              }`}
                              style={{ height: `${Math.max(10, bookingsHeightPct)}%` }}
                              title={`${m.month} Bookings: ${m.bookingsCount}`}
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
                    <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200/90 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          <span className="font-extrabold text-xs text-emerald-950">
                            {activeMonthDetail.fullYear} Details
                          </span>

                          {/* MoM & YoY Badges */}
                          {monthComparison && (
                            <div className="flex items-center gap-1">
                              {monthComparison.momPercent !== null && (
                                <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full border ${
                                  monthComparison.momPercent >= 0
                                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                    : "bg-rose-100 text-rose-800 border-rose-300"
                                }`}>
                                  {monthComparison.momPercent >= 0 ? `▲ +${monthComparison.momPercent}% MoM` : `▼ ${monthComparison.momPercent}% MoM`}
                                </span>
                              )}
                              {monthComparison.yoyPercent !== null && (
                                <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full border ${
                                  monthComparison.yoyPercent >= 0
                                    ? "bg-amber-100 text-amber-900 border-amber-300"
                                    : "bg-slate-100 text-slate-700 border-slate-300"
                                }`}>
                                  {monthComparison.yoyPercent >= 0 ? `★ +${monthComparison.yoyPercent}% YoY` : `★ ${monthComparison.yoyPercent}% YoY`}
                                </span>
                              )}
                            </div>
                          )}
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
                          <span className="text-[9px] text-slate-500 font-bold block">Bookings Count</span>
                          <span className="font-black text-indigo-900 text-xs block mt-0.5">
                            {activeMonthDetail.bookingsCount} {activeMonthDetail.bookingsCount === 1 ? "Pooja" : "Poojas"}
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
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedMonthModal(activeMonthDetail)}
                        className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer active:scale-98"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>View Month Report &amp; Top Performers</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
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
                        onClick={() => {
                          setSelectedAnalyticsMonth(m.month);
                          setSelectedMonthModal(m);
                        }}
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
                              {m.bookingsCount} {m.bookingsCount === 1 ? "Pooja" : "Poojas"} • Billed: ₹{m.billed.toLocaleString("en-IN")} • Cumul: ₹{m.cumulative.toLocaleString("en-IN")}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-emerald-800 text-xs block">
                            ₹{m.collected.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1 mt-0.5 ${
                              m.rate === 100
                                ? "bg-emerald-100 text-emerald-800"
                                : m.rate >= 90
                                ? "bg-blue-50 text-blue-800"
                                : "bg-amber-50 text-amber-800"
                            }`}
                          >
                            <span>{m.rate}% Realized</span>
                            <Eye className="w-2.5 h-2.5 opacity-70" />
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

                {/* 1. ALL YEARS CUMULATIVE COLLECTION TREND LINE CHART */}
                <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200/90 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-700" />
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">
                          Multi-Year Cumulative Trend (2024 - 2026)
                        </h4>
                      </div>
                      <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                        Continuous cumulative progression across all recorded years
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-[9.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <span>All-Time Curve</span>
                    </div>
                  </div>

                  {/* SVG Bezier Cumulative Line Chart for All Years */}
                  {(() => {
                    const { svgWidth, svgHeight, padLeft, padRight, padTop, plotH, points, pathD, areaD, gridLevels } = allYearsChartConfig;

                    return (
                      <div className="relative w-full overflow-hidden">
                        <svg
                          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                          className="w-full h-auto overflow-visible select-none"
                        >
                          <defs>
                            <linearGradient id="cumulAllYearsGrad" x1="0" y1="0" x2="0" y2="1">
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
                          {areaD && <path d={areaD} fill="url(#cumulAllYearsGrad)" />}

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
                          {points.map((pt) => {
                            return (
                              <g
                                key={pt.id}
                                className="cursor-pointer group"
                                onClick={() => {
                                  setSelectedAnalyticsYear(pt.id as any);
                                  if (pt.id === "2026") setSelectedAnalyticsMonth("Sep");
                                  else setSelectedAnalyticsMonth("Dec");
                                }}
                              >
                                <circle
                                  cx={pt.x}
                                  cy={pt.y}
                                  r="5"
                                  fill="#ffffff"
                                  stroke="#047857"
                                  strokeWidth="2.5"
                                  className="transition-all duration-150 group-hover:scale-125"
                                />
                                <text
                                  x={pt.x}
                                  y={pt.y - 8}
                                  textAnchor="middle"
                                  fontSize="8.5"
                                  fontWeight="800"
                                  fill="#047857"
                                >
                                  ₹{pt.cumulative >= 100000 ? `${(pt.cumulative / 100000).toFixed(1)}L` : `${Math.round(pt.cumulative / 1000)}k`}
                                </text>
                                <text
                                  x={pt.x}
                                  y={svgHeight - 6}
                                  textAnchor="middle"
                                  fontSize="9"
                                  fontWeight="800"
                                  fill="#334155"
                                >
                                  {pt.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    );
                  })()}
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
      {/* MODAL: ADD PRIEST                                                         */}
      {/* ========================================================================= */}
      {showAddPriestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-1.5">
                <span>🪔</span>
                <span>புதிய குருக்கள் சேர்க்க / Add Priest</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPriestModal(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {priestModalError && (
              <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200">
                {priestModalError}
              </div>
            )}

            <form onSubmit={handleAddPriestSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  குருக்கள் பெயர் (Priest Name) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="எ.கா: சுந்தரமூர்த்தி வாத்யார் / Sundar Iyer"
                  value={newPriestName}
                  onChange={(e) => setNewPriestName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  மொபைல் எண் (Mobile - Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2 py-2 text-xs font-bold text-slate-700 flex items-center gap-1 shrink-0">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={newPriestMobile}
                    onChange={(e) => setNewPriestMobile(cleanPastedIndianMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பொறுப்பு / சிறப்பு (Specialization)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா: உதவி குருக்கள் / ஹோமம் & பூஜா"
                  value={newPriestSpec}
                  onChange={(e) => setNewPriestSpec(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddPriestModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  ரத்து / Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                >
                  ✓ சேமி / Save Priest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: PRIEST PROFILE & FULL COLLECTIONS                                 */}
      {/* ========================================================================= */}
      {selectedPriestDrawer && (() => {
        const isOwner = selectedPriestDrawer.role === "OWNER" || selectedPriestDrawer.id === ownerMember?.id;
        const priestBookings = memberBookingsMap.get(selectedPriestDrawer.id) || [];
        const totalBilled = priestBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const directPriestAmount = priestBookings.reduce((sum, b) => {
          if (b.priestShareAmount !== undefined && b.priestShareAmount > 0) {
            return sum + b.priestShareAmount;
          }
          if (b.paymentRecipient === "PRIEST") {
            return sum + (b.advanceAmount || (b.paymentStatus === "PAID" ? b.totalAmount : 0));
          }
          return sum;
        }, 0);
        const businessAccountAmount = totalBilled - directPriestAmount;
        const totalPending = priestBookings.reduce((sum, b) => sum + (b.balanceAmount || 0), 0);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto space-y-4 shadow-2xl border-t-2 border-emerald-500 animate-in slide-in-from-bottom duration-200">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-950 font-black text-xl flex items-center justify-center border border-emerald-300 shrink-0 shadow-2xs">
                    {isOwner ? "🪔" : "👥"}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-black text-lg text-slate-900 leading-tight">
                        {selectedPriestDrawer.name}
                      </h3>
                      <span
                        className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                          isOwner
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : "bg-blue-50 text-blue-900 border-blue-200"
                        }`}
                      >
                        {isOwner ? "தலைமை குருக்கள்" : "உதவி குருக்கள்"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-semibold mt-0.5">
                      {selectedPriestDrawer.specialization || "Vedic Rituals & Pooja"}
                    </p>
                    {selectedPriestDrawer.mobile && (
                      <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>+91 {selectedPriestDrawer.mobile}</span>
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPriestDrawer(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Communication Actions */}
              {selectedPriestDrawer.mobile && (
                <div className="flex items-center gap-2">
                  <a
                    href={`tel:${selectedPriestDrawer.mobile}`}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Priest</span>
                  </a>
                  <a
                    href={`https://wa.me/${selectedPriestDrawer.mobile.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              )}

              {/* Financial & Collection Summary Breakdown */}
              <div className="bg-gradient-to-br from-slate-900 to-emerald-950 text-white p-3.5 rounded-2xl space-y-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-200 flex items-center gap-1">
                    <span>📊 மொத்த வசூல் & கணக்கு (Total Collections)</span>
                  </span>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-emerald-800/80 rounded-full text-emerald-200 border border-emerald-700">
                    {priestBookings.length} பூஜைகள்
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-300 block">மொத்த தட்சணை (Billed)</span>
                    <span className="text-base font-black text-white">₹{totalBilled.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="bg-white/10 p-2 rounded-xl">
                    <span className="text-[10px] text-rose-300 block">மீதி நிலுவை (Pending)</span>
                    <span className="text-base font-black text-rose-200">₹{totalPending.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Distinct Breakdown: Business Received vs Directly to Priest */}
                <div className="space-y-1.5 pt-1 border-t border-white/10 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-emerald-200 flex items-center gap-1">
                      <span>🏛️</span>
                      <span>நிர்வாகக் கணக்கு (Business Account):</span>
                    </span>
                    <span className="font-black text-emerald-300">
                      ₹{businessAccountAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-amber-200 flex items-center gap-1">
                      <span>👤</span>
                      <span>வாத்யாரிடம் நேரடி வசூல் (Direct to Priest):</span>
                    </span>
                    <span className="font-black text-amber-300">
                      ₹{directPriestAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* List of All Poojas Done by this Priest */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1">
                    <span>🪔</span>
                    <span>பூஜைகள் பட்டியல் ({priestBookings.length})</span>
                  </h4>
                </div>

                {priestBookings.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">இவருக்கு இன்னும் எந்த பூஜையும் ஒதுக்கப்படவில்லை.</p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-0.5">
                    {priestBookings.map((b) => (
                      <Link
                        key={b.id}
                        href={`/app/bookings/${b.id}`}
                        className="p-2.5 bg-slate-50 hover:bg-emerald-50/50 rounded-xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition block group"
                      >
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate group-hover:text-emerald-950">
                            👤 {b.customerName}
                          </div>
                          <div className="text-[10.5px] text-slate-600 truncate mt-0.5">
                            🪔 {b.poojaTamilName || b.poojaEnglishName}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            📅 {b.date} • {formatTime12H(b.startTime)}
                          </div>
                        </div>

                        <div className="text-right shrink-0 space-y-1">
                          <div className="font-black text-slate-900 text-xs">
                            ₹{b.totalAmount.toLocaleString("en-IN")}
                          </div>
                          <div>
                            {b.paymentRecipient === "PRIEST" ? (
                              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-[9.5px] font-bold border border-amber-300 block">
                                👤 நேரடி
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[9.5px] font-bold border border-emerald-300 block">
                                🏛️ நிர்வாகம்
                              </span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedPriestDrawer(null)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer"
              >
                மூடுக / Close
              </button>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* UNIFIED MODAL: RECORD PAYMENT                                             */}
      {/* ========================================================================= */}
      <RecordPaymentModal
        isOpen={!!recordPaymentBooking}
        onClose={() => setRecordPaymentBooking(null)}
        booking={recordPaymentBooking}
        currentUserName={currentUser?.name || "Ravi Iyer"}
        onSuccess={(updatedBooking) => {
          setBookings([...db.getBookings(businessId)]);
          setPaymentSuccessMessage(`₹${(updatedBooking.advanceAmount || 0).toLocaleString("en-IN")} கட்டணம் வெற்றிகரமாக பதிவு செய்யப்பட்டது! (${updatedBooking.customerName})`);
          setRecordPaymentBooking(null);
          setTimeout(() => setPaymentSuccessMessage(""), 4000);
        }}
      />

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

      {/* ========================================================================= */}
      {/* MODAL: ENHANCED MONTHLY BREAKDOWN & TOP PERFORMERS                       */}
      {/* ========================================================================= */}
      {selectedMonthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-200">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center font-black text-sm shrink-0">
                  {selectedMonthModal.month}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-slate-900 truncate">
                      {selectedMonthModal.fullYear}
                    </h3>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {selectedMonthModal.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    {selectedMonthModal.bookingsCount} {selectedMonthModal.bookingsCount === 1 ? "Booking" : "Bookings"} • Monthly Performance Breakdown
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedMonthModal(null)}
                className="w-8 h-8 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Financial Tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 sm:p-4 bg-slate-50/50 border-b border-slate-100 text-center text-xs">
              <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-[9.5px] text-slate-500 font-bold block">Total Billed</span>
                <span className="font-black text-slate-900 text-sm block mt-0.5">
                  ₹{selectedMonthModal.billed.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-emerald-50/80 p-2.5 rounded-2xl border border-emerald-200 shadow-2xs">
                <span className="text-[9.5px] text-emerald-800 font-bold block">Collected</span>
                <span className="font-black text-emerald-950 text-sm block mt-0.5">
                  ₹{selectedMonthModal.collected.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-amber-50/80 p-2.5 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[9.5px] text-amber-800 font-bold block">Pending Due</span>
                <span className="font-black text-amber-950 text-sm block mt-0.5">
                  ₹{selectedMonthModal.due.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="bg-indigo-50/80 p-2.5 rounded-2xl border border-indigo-200 shadow-2xs">
                <span className="text-[9.5px] text-indigo-800 font-bold block">Bookings Qty</span>
                <span className="font-black text-indigo-950 text-sm block mt-0.5">
                  {selectedMonthModal.bookingsCount} Poojas
                </span>
              </div>
            </div>

            {/* Top Performers & Highlights Card */}
            {(() => {
              const topData = getMonthTopPerformers(selectedMonthModal.bookings || []);
              if (!topData) return null;

              return (
                <div className="p-3 sm:p-4 bg-amber-50/40 border-b border-amber-100 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Monthly Highlights &amp; Top Performers</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    {/* Top Booked Pooja */}
                    <div className="p-2.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block">
                        👑 Top Booked Pooja
                      </span>
                      <strong className="text-slate-900 text-xs block truncate mt-0.5">
                        {topData.topPooja?.name || "None"}
                      </strong>
                      <span className="text-[10.5px] text-emerald-700 font-bold">
                        {topData.topPooja ? `${topData.topPooja.count} Bookings • ₹${topData.topPooja.amount.toLocaleString("en-IN")}` : "0"}
                      </span>
                    </div>

                    {/* Top Devotee */}
                    <div className="p-2.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block">
                        ⭐ Top Devotee
                      </span>
                      <strong className="text-slate-900 text-xs block truncate mt-0.5">
                        {topData.topDevotee?.name || "None"}
                      </strong>
                      <span className="text-[10.5px] text-emerald-700 font-bold">
                        {topData.topDevotee ? `${topData.topDevotee.count} Poojas • ₹${topData.topDevotee.amount.toLocaleString("en-IN")}` : "0"}
                      </span>
                    </div>

                    {/* Highest Single Dakshina Booking */}
                    <div className="p-2.5 bg-white rounded-2xl border border-amber-200/80 shadow-2xs">
                      <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-800 block">
                        💎 Highest Dakshina
                      </span>
                      <strong className="text-slate-900 text-xs block truncate mt-0.5">
                        {topData.highestDakshinaBooking?.poojaEnglishName || "None"}
                      </strong>
                      <span className="text-[10.5px] text-emerald-700 font-bold">
                        {topData.highestDakshinaBooking ? `₹${topData.highestDakshinaBooking.totalAmount.toLocaleString("en-IN")} • ${topData.highestDakshinaBooking.assignedIyerName || "Chief Priest"}` : "₹0"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Contributing Poojas List */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Contributing Poojas ({selectedMonthModal.bookings?.length || 0})
              </h4>

              {(!selectedMonthModal.bookings || selectedMonthModal.bookings.length === 0) ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-semibold">
                  No poojas recorded in {selectedMonthModal.fullYear}.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedMonthModal.bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/90 rounded-2xl border border-slate-200 transition flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 truncate">
                            {b.customerName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{b.bookingNumber?.replace(/^#+/, "")}
                          </span>
                          <span className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-md ${
                            b.paymentStatus === "PAID"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : (b.balanceAmount || 0) > 0
                              ? "bg-rose-100 text-rose-800 border border-rose-300"
                              : "bg-slate-100 text-slate-700"
                          }`}>
                            {b.paymentStatus === "PAID" ? "PAID" : `Due ₹${b.balanceAmount}`}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 truncate mt-0.5">
                          🪔 {b.poojaEnglishName} • 📅 {b.date} ({b.startTime})
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-slate-900 block text-xs">
                          ₹{b.totalAmount.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[9.5px] text-slate-500 font-bold block">
                          Paid: ₹{(b.advanceAmount || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/80 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedMonthModal(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

