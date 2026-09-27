"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db, isLegacyObsoletePooja } from "@/lib/db/store";
import { Booking, Customer, Pooja, BookingItem, BusinessMember, PaymentStatus } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  X,
  Check,
  CheckSquare,
  Users,
  UserCheck,
  RotateCcw,
  Trash2,
  Info,
  Save,
  Edit3,
  MessageCircle,
  Share2,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, getLocalDateString, formatTime12H } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage, formatUnitShort } from "@/lib/whatsapp/formatter";
import { getPoojaIcon } from "@/lib/poojas/icons";
import { normalizeIndianMobile } from "@/lib/utils/phone";

function convert12HTo24H(time12H: string): string {
  if (!time12H) return "07:45";
  const match = time12H.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "07:45";
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = (match[3] || "").toUpperCase();
  if (ampm === "PM" && h < 12) h += 12;
  if (ampm === "AM" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${m}`;
}

function QuickBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusiness, currentUser } = useAuth();
  const businessId =
    currentBusiness?.id ||
    (currentUser?.id === "u-ravi-iyer-01"
      ? "biz-venkateswara-01"
      : currentUser?.id
      ? `biz-${currentUser.id}`
      : "");

  // ---------------------------------------------------------------------------
  // Data Loading
  // ---------------------------------------------------------------------------
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [members, setAllMembers] = useState<BusinessMember[]>([]);
  const [existingBookings, setExistingBookings] = useState<Booking[]>([]);

  useEffect(() => {
    setCustomers(db.getCustomers(businessId));
    setPoojas(db.getPoojas(businessId).filter((p) => !isLegacyObsoletePooja(p)));
    setAllMembers(db.getMembers(businessId));
    setExistingBookings(db.getBookings(businessId));
  }, [businessId]);

  // ---------------------------------------------------------------------------
  // 2-Step Stage State (1: Booking, 2: Payment)
  // ---------------------------------------------------------------------------
  const [twoStepStage, setTwoStepStage] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string>("");

  // Enforce top-to-bottom scroll reset whenever user enters Step 2
  useEffect(() => {
    if (twoStepStage === 2 && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [twoStepStage]);

  // ---------------------------------------------------------------------------
  // 1. Devotee State
  // ---------------------------------------------------------------------------
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get("customerId") || ""
  );
  const [devoteeSearch, setDevoteeSearch] = useState<string>("");
  const [showAddDevotee, setShowAddDevotee] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");
  const [duplicateNotice, setDuplicateNotice] = useState<string>("");

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId) || null,
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    const q = devoteeSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.replace(/\D/g, "").includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, devoteeSearch]);

  const [missingField, setMissingField] = useState<"devotee" | "pooja" | "amount" | null>(null);

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setFormError("");
    setDuplicateNotice("");
    if (missingField === "devotee") setMissingField(null);
  };

  const handleClearCustomer = () => {
    setSelectedCustomerId("");
    setDuplicateNotice("");
  };

  // Prevent Duplicate Customer by mobile number
  const handleQuickAddDevotee = () => {
    if (!newCustName.trim()) {
      alert("தயவுசெய்து பக்தர் பெயரை உள்ளிடவும் (Please enter devotee name)");
      return;
    }

    const cleanMobile = newCustMobile.trim() ? normalizeIndianMobile(newCustMobile.trim()) : "";

    // Duplicate Check
    if (cleanMobile) {
      const existing = customers.find(
        (c) => c.mobile && normalizeIndianMobile(c.mobile) === cleanMobile
      );
      if (existing) {
        handleSelectCustomer(existing.id);
        setShowAddDevotee(false);
        setNewCustName("");
        setNewCustMobile("");
        setDuplicateNotice(`ஏற்கனவே உள்ள பக்தர் "${existing.name}" தானாகத் தேர்வு செய்யப்பட்டார் ✓`);
        return;
      }
    }

    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: cleanMobile,
      city: newCustCity.trim() || "Namakkal",
    });

    setCustomers(db.getCustomers(businessId));
    handleSelectCustomer(created.id);
    setShowAddDevotee(false);
    setNewCustName("");
    setNewCustMobile("");
  };

  // ---------------------------------------------------------------------------
  // 2. Pooja & Samagri State (Sorted by Recent Booking at Top)
  // ---------------------------------------------------------------------------
  const [selectedPoojaId, setSelectedPoojaId] = useState<string>(
    searchParams.get("poojaId") || ""
  );
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);

  // Calculate recently booked poojas and sort them to the top
  const { sortedPoojas, recentPoojaIds } = useMemo(() => {
    const recentBookingTimeMap = new Map<string, number>();
    const bookingCountMap = new Map<string, number>();

    existingBookings.forEach((b) => {
      if (!b.poojaId) return;
      const t = new Date(b.date || (b as any).createdAt || 0).getTime();
      const prevT = recentBookingTimeMap.get(b.poojaId) || 0;
      if (t > prevT) recentBookingTimeMap.set(b.poojaId, t);
      bookingCountMap.set(b.poojaId, (bookingCountMap.get(b.poojaId) || 0) + 1);
    });

    const sorted = [...poojas].sort((a, b) => {
      const timeA = recentBookingTimeMap.get(a.id) || 0;
      const timeB = recentBookingTimeMap.get(b.id) || 0;
      if (timeA !== timeB) return timeB - timeA; // Most recently booked first

      const countA = bookingCountMap.get(a.id) || 0;
      const countB = bookingCountMap.get(b.id) || 0;
      if (countA !== countB) return countB - countA;

      return (a.tamilName || a.englishName).localeCompare(b.tamilName || b.englishName);
    });

    const recentIds = new Set(
      Array.from(recentBookingTimeMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([id]) => id)
    );

    return { sortedPoojas: sorted, recentPoojaIds: recentIds };
  }, [poojas, existingBookings]);

  const [poojaSearch, setPoojaSearch] = useState<string>("");
  const [previewPoojaForItems, setPreviewPoojaForItems] = useState<Pooja | null>(null);

  const filteredPoojas = useMemo(() => {
    const q = poojaSearch.trim().toLowerCase();
    if (!q) return sortedPoojas;
    return sortedPoojas.filter(
      (p) =>
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        (p.englishName && p.englishName.toLowerCase().includes(q))
    );
  }, [sortedPoojas, poojaSearch]);

  const currentPooja = useMemo(
    () => poojas.find((p) => p.id === selectedPoojaId) || null,
    [poojas, selectedPoojaId]
  );

  // When pooja changes, load its items and sync base price
  useEffect(() => {
    if (currentPooja) {
      setAmount(currentPooja.basePrice || 5000);
      if (currentPooja.items && currentPooja.items.length > 0) {
        setSamagriItems(
          currentPooja.items.map((it) => ({
            ...it,
            bookingId: "",
            isChecked: true,
          }))
        );
      } else {
        setSamagriItems([]);
      }
    }
  }, [currentPooja]);

  const handleSelectPooja = (poojaId: string) => {
    setSelectedPoojaId(poojaId);
    setFormError("");
    if (missingField === "pooja") setMissingField(null);
  };

  // ---------------------------------------------------------------------------
  // 3. Date & Auspicious Time State
  // ---------------------------------------------------------------------------
  const todayStr = getLocalDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getLocalDateString(tomorrowDate);

  // Compute next Muhurtham date (typically 5 days ahead for quick convenience)
  const nextMuhurthamDate = new Date();
  nextMuhurthamDate.setDate(nextMuhurthamDate.getDate() + 5);
  const nextMuhurthamStr = getLocalDateString(nextMuhurthamDate);

  const [date, setDate] = useState<string>(searchParams.get("date") || todayStr);
  const [time, setTime] = useState<string>(searchParams.get("time") || "07:45 AM");

  const tamilInfo = useMemo(() => getTamilDate(date), [date]);

  const upcomingDates = useMemo(() => {
    const list = [];
    const now = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const tInfo = getTamilDate(dateStr);
      const isMuhurtham = tInfo.isMuhurtham;
      list.push({ dateStr, dayName, isToday, isTomorrow, isMuhurtham });
    }
    return list;
  }, []);

  // ---------------------------------------------------------------------------
  // 4. Venue / Location State
  // ---------------------------------------------------------------------------
  const [location, setLocation] = useState<string>("Namakkal");

  // Keep search params in sync
  useEffect(() => {
    const paramDate = searchParams.get("date");
    if (paramDate) setDate(paramDate);
    const paramTime = searchParams.get("time");
    if (paramTime) setTime(paramTime);
    const paramCustomerId = searchParams.get("customerId");
    if (paramCustomerId) setSelectedCustomerId(paramCustomerId);
    const paramPoojaId = searchParams.get("poojaId");
    if (paramPoojaId) setSelectedPoojaId(paramPoojaId);
  }, [searchParams]);

  // ---------------------------------------------------------------------------
  // 5. Payment & Dakshina State (Step 2)
  // ---------------------------------------------------------------------------
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "ADVANCE" | "FULL">("UNPAID");
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE">("UPI");
  const [paymentRecipient, setPaymentRecipient] = useState<"BUSINESS" | "PRIEST">("BUSINESS");
  const [priestShareAmount, setPriestShareAmount] = useState<number>(0);
  const [adminCommissionAmount, setAdminCommissionAmount] = useState<number>(0);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isEditingPayment, setIsEditingPayment] = useState<boolean>(false);

  // Performing Priest State
  const [priestType, setPriestType] = useState<"self" | "other">("self");
  const [assignedIyerId, setAssignedIyerId] = useState<string>("self");
  const [customPriestName, setCustomPriestName] = useState<string>("");
  const [showAddPriest, setShowAddPriest] = useState<boolean>(false);
  const [newPriestName, setNewPriestName] = useState<string>("");
  const [newPriestMobile, setNewPriestMobile] = useState<string>("");
  const [priestNotice, setPriestNotice] = useState<string>("");

  const handleQuickAddPriest = () => {
    const trimmed = newPriestName.trim();
    if (!trimmed) {
      alert("தயவுசெய்து குருக்கள் பெயரை உள்ளிடவும் (Please enter priest name)");
      return;
    }

    const cleanMobile = newPriestMobile.trim() ? normalizeIndianMobile(newPriestMobile.trim()) : "";

    // Check duplicate by name or mobile across all existing members
    const existing = members.find(
      (m) =>
        m.name.trim().toLowerCase() === trimmed.toLowerCase() ||
        (cleanMobile && m.mobile && normalizeIndianMobile(m.mobile) === cleanMobile)
    );

    if (existing) {
      setPriestType("other");
      setAssignedIyerId(existing.id);
      setCustomPriestName("");
      setShowAddPriest(false);
      setNewPriestName("");
      setNewPriestMobile("");
      setPriestNotice(`ஏற்கனவே உள்ள குருக்கள் "${existing.name}" தானாகத் தேர்வு செய்யப்பட்டார் ✓`);
      setTimeout(() => setPriestNotice(""), 4000);
      return;
    }

    try {
      const created = db.createMember({
        businessId,
        name: trimmed,
        mobile: cleanMobile,
        role: "IYER",
      });
      const updated = db.getMembers(businessId);
      setAllMembers(updated);
      setPriestType("other");
      setAssignedIyerId(created.id);
      setCustomPriestName("");
      setShowAddPriest(false);
      setNewPriestName("");
      setNewPriestMobile("");
      setPriestNotice(`புதிய குருக்கள் "${created.name}" சேர்க்கப்பட்டு தேர்வு செய்யப்பட்டார் ✓`);
      setTimeout(() => setPriestNotice(""), 4000);
    } catch (err) {
      console.error("Error creating priest member:", err);
    }
  };

  // Expenses & Notes State (Preserved defaults)
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState<string>("");
  const [isAmountSaved, setIsAmountSaved] = useState<boolean>(false);
  const [bookingNotes, setBookingNotes] = useState<string>("");

  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Step 1 Validation & Proceed to Step 2 with auto-scroll to missing fields
  const validateAndProceedToStep2 = () => {
    if (!selectedCustomerId) {
      setFormError("தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select a devotee).");
      setMissingField("devotee");
      const el = document.getElementById("devotee-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = document.getElementById("devotee-search-input");
        if (input) input.focus();
      }
      return;
    }
    if (!selectedPoojaId) {
      setFormError("தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select a pooja ritual).");
      setMissingField("pooja");
      const el = document.getElementById("pooja-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setMissingField(null);
    setFormError("");
    setTwoStepStage(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  // Adjust Dakshina Amount (+/-)
  const handleAdjustAmount = (delta: number) => {
    setAmount((prev) => {
      const next = Math.max(0, prev + delta);
      if (paymentChoice === "FULL") setAdvanceAmount(next);
      return next;
    });
    if (missingField === "amount") setMissingField(null);
  };

  // Final Booking Submission
  const handleFinalConfirmBooking = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCustomer) {
      setFormError("பக்தர் விவரம் தேர்வு செய்யப்படவில்லை (Devotee not selected)");
      setTwoStepStage(1);
      setMissingField("devotee");
      setTimeout(() => {
        const el = document.getElementById("devotee-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    if (!currentPooja) {
      setFormError("பூஜை சேவை தேர்வு செய்யப்படவில்லை (Ceremony not selected)");
      setTwoStepStage(1);
      setMissingField("pooja");
      setTimeout(() => {
        const el = document.getElementById("pooja-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 50);
      return;
    }
    if (!amount || amount <= 0) {
      setFormError("தயவுசெய்து தட்சணை தொகையை உள்ளிடவும் (Please enter dakshina amount)");
      setMissingField("amount");
      const el = document.getElementById("amount-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setIsSubmittingBooking(true);

    let effectivePriestId = assignedIyerId;
    let performingName = "Assigned Priest";

    if (priestType === "self") {
      effectivePriestId = "m-owner-01";
      performingName = currentUser?.name || "Ravi Iyer";
    } else {
      if (customPriestName.trim()) {
        performingName = customPriestName.trim();
        const found = members.find(
          (m) => m.name.toLowerCase() === customPriestName.trim().toLowerCase()
        );
        if (found) {
          effectivePriestId = found.id;
        } else {
          try {
            const newMem = db.createMember({
              businessId,
              name: customPriestName.trim(),
              role: "IYER",
            });
            effectivePriestId = newMem.id;
            setAllMembers(db.getMembers(businessId));
          } catch {
            effectivePriestId = `m-${Date.now()}`;
          }
        }
      } else {
        const assignedMember = members.find((m) => m.id === assignedIyerId);
        performingName = assignedMember?.name || "Other Priest";
      }
    }

    // Accurate calculation of advance and balance
    const effectiveAdvance =
      paymentChoice === "FULL"
        ? amount
        : paymentChoice === "ADVANCE"
        ? Math.min(amount, Math.max(0, advanceAmount))
        : 0;
    const effectiveBalance = Math.max(0, amount - effectiveAdvance);
    const effectivePaymentStatus: PaymentStatus =
      paymentChoice === "FULL" || (effectiveBalance === 0 && amount > 0)
        ? "PAID"
        : effectiveAdvance > 0
        ? "PARTIALLY_PAID"
        : "PENDING";

    const isDemoUser = db.isDemoBusiness(businessId);
    const existingBookingsCount = db.getBookings(businessId).length;
    if (isDemoUser && existingBookingsCount >= 20) {
      alert(
        "இலவச டெமோ வரம்பு நிறைவடைந்தது (அதிகபட்சம் 20 முன்பதிவுகள்). புதிய முன்பதிவுகளை தொடர்ந்து உருவாக்க Velvi Pro திட்டத்திற்கு மேம்படுத்தவும்."
      );
      setIsSubmittingBooking(false);
      return;
    }

    try {
      const idempotencyKey = `bk-${businessId}-${selectedCustomer.id}-${currentPooja.id}-${date}-${time.replace(/\s+/g, "")}-${Date.now().toString().slice(0, 8)}`;
      const newBooking = db.createBooking({
        businessId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        customerAddress: selectedCustomer.address || location,
        poojaId: currentPooja.id,
        poojaEnglishName: currentPooja.englishName,
        poojaTamilName: currentPooja.tamilName,
        date,
        startTime: formatTime12H(time),
        endTime: formatTime12H(time),
        durationMinutes: currentPooja.durationMinutes || 120,
        totalAmount: amount,
        advanceAmount: effectiveAdvance,
        balanceAmount: effectiveBalance,
        paymentStatus: effectivePaymentStatus,
        paymentDate: effectiveAdvance > 0 ? (paymentDate || todayStr) : undefined,
        paymentMethod: effectiveAdvance > 0 ? paymentMethod : undefined,
        paymentRecipient: effectiveAdvance > 0 ? paymentRecipient : undefined,
        priestShareAmount: effectiveAdvance > 0 && priestShareAmount > 0 ? priestShareAmount : undefined,
        adminCommissionAmount: effectiveAdvance > 0 && adminCommissionAmount > 0 ? adminCommissionAmount : undefined,
        paymentNotes: bookingNotes.trim() || (effectiveAdvance > 0 && paymentNotes.trim()) ? (bookingNotes.trim() || paymentNotes.trim()) : undefined,
        notes: bookingNotes.trim() || undefined,
        status: "CONFIRMED",
        assignedIyerId: effectivePriestId === "self" ? "m-owner-01" : effectivePriestId,
        assignedIyerName: performingName,
        location: location || selectedCustomer.city || "Namakkal",
        expenseAmount: expenseAmount || 0,
        expenseNotes: expenseNotes.trim() || "",
        items: samagriItems,
        idempotencyKey,
      } as any);

      setCreatedBooking(newBooking);
      setExistingBookings(db.getBookings(businessId));
    } catch (err: any) {
      alert(err.message || "Failed to create booking");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdBooking || !currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(createdBooking, currentBusiness);
    const phone = createdBooking.customerMobile ? createdBooking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-44 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app/bookings"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs transition active:scale-95"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                New Booking
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 bg-slate-900 text-amber-300 rounded-full border border-slate-700/60 shadow-2xs tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                2-Step Quick Booking
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              1. முன்பதிவு (Booking) • 2. கட்டணம் (Payment)
            </p>
          </div>
        </div>

        <Link
          href="/app/bookings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      {/* 2-Step Segmented Switcher (Booking vs Payment) */}
      <div className="grid grid-cols-2 gap-1.5 bg-slate-200/90 p-1 rounded-2xl text-xs font-black shadow-inner">
        <button
          type="button"
          onClick={() => {
            setFormError("");
            setTwoStepStage(1);
          }}
          className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            twoStepStage === 1
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-600/30 font-black"
              : "text-slate-600 hover:text-slate-900 font-bold"
          }`}
        >
          <span>1. முன்பதிவு (Booking)</span>
          {selectedCustomerId && selectedPoojaId && (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
        </button>

        <button
          type="button"
          onClick={validateAndProceedToStep2}
          className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            twoStepStage === 2
              ? "bg-white text-emerald-950 shadow-xs ring-1 ring-emerald-600/30 font-black"
              : "text-slate-600 hover:text-slate-900 font-bold"
          }`}
        >
          <span>2. கட்டணம் (Payment)</span>
          <span className="text-amber-600 font-black">₹</span>
        </button>
      </div>

      {/* Form Error Alert */}
      {formError && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold animate-in fade-in flex items-center justify-between shadow-2xs">
          <span>⚠️ {formError}</span>
          <button
            type="button"
            onClick={() => setFormError("")}
            className="text-rose-600 text-xs font-black cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Duplicate Notice */}
      {duplicateNotice && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-bold animate-in fade-in flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{duplicateNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setDuplicateNotice("")}
            className="text-emerald-700 text-xs font-black cursor-pointer px-1"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleFinalConfirmBooking} className="space-y-4 pb-28 sm:pb-36">
        {/* ============================================================== */}
        {/* STEP 1: BOOKING (DEVOTEE, POOJA, DATE, TIME, VENUE)            */}
        {/* ============================================================== */}
        {twoStepStage === 1 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* 1. Devotee Selection */}
            <div
              id="devotee-section"
              className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3 transition-all duration-300 ${
                missingField === "devotee"
                  ? "border-rose-400 ring-4 ring-rose-400/30 bg-rose-50/20"
                  : "border-slate-200/90"
              }`}
            >
              {missingField === "devotee" && (
                <div className="p-2 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <span>⚠️ தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select a devotee)</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <span>1. பக்தர் (Devotee)</span>
                    {selectedCustomerId && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline ml-1" />
                    )}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDevotee((prev) => !prev)}
                  className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    showAddDevotee
                      ? "text-rose-900 bg-rose-50 hover:bg-rose-100 border-rose-300"
                      : "text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border-amber-300"
                  }`}
                >
                  {showAddDevotee ? (
                    <X className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-amber-700" />
                  )}
                  <span>{showAddDevotee ? "Close" : "Add"}</span>
                </button>
              </div>

              {/* Devotee Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="devotee-search-input"
                  type="text"
                  placeholder="Search devotee by name or mobile..."
                  value={devoteeSearch}
                  onChange={(e) => setDevoteeSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
                />
                {devoteeSearch && (
                  <button
                    type="button"
                    onClick={() => setDevoteeSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Inline Add Devotee Form */}
              {showAddDevotee && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-950 block">
                    புதிய பக்தரை சேர்க்க (Add New Devotee):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="பக்தர் பெயர் (Name) *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="tel"
                      placeholder="மொபைல் எண் (Mobile)"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ஊர் (City)"
                        value={newCustCity}
                        onChange={(e) => setNewCustCity(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddDevotee}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick 1-Tap Devotee Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {filteredCustomers.slice(0, 10).map((c) => {
                  const isSelected = selectedCustomerId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectCustomer(c.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border shadow-2xs active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>{c.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>

              {/* Selected Devotee Compact Info (Kutty a location & mobile) */}
              {selectedCustomer && (
                <div className="flex items-center justify-between text-xs text-slate-600 font-medium pt-1 px-1 border-t border-slate-100">
                  <div className="flex items-center gap-2 truncate">
                    {selectedCustomer.mobile && (
                      <span className="flex items-center gap-1 text-slate-700 font-bold">
                        <span>📞</span>
                        <span>{selectedCustomer.mobile}</span>
                      </span>
                    )}
                    {selectedCustomer.city && (
                      <span className="text-slate-500 truncate">
                        • 📍 {selectedCustomer.city}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="text-[10px] text-slate-400 hover:text-rose-600 font-bold ml-2 shrink-0 cursor-pointer"
                  >
                    மாற்று ✕
                  </button>
                </div>
              )}
            </div>

            {/* 2. Pooja Ritual Selection */}
            <div
              id="pooja-section"
              className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3 transition-all duration-300 ${
                missingField === "pooja"
                  ? "border-rose-400 ring-4 ring-rose-400/30 bg-rose-50/20"
                  : "border-slate-200/90"
              }`}
            >
              {missingField === "pooja" && (
                <div className="p-2 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <span>⚠️ தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select a ceremony below)</span>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs shadow-2xs">
                    🪔
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    2. பூஜை சேவை (Ceremony)
                  </h2>
                </div>

                <div className="text-[11px] text-slate-500 font-bold">
                  <span>Need a new ceremony? </span>
                  <Link
                    href="/app/poojas?returnTo=new-booking"
                    className="text-amber-800 hover:text-amber-950 font-black underline inline-flex items-center gap-0.5 ml-1"
                  >
                    <span>+ Add Pooja in Catalog →</span>
                  </Link>
                </div>
              </div>

              {/* Ceremony Search Input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ceremony / பூஜை தேட..."
                  value={poojaSearch}
                  onChange={(e) => setPoojaSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:border-emerald-600 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
                />
                {poojaSearch && (
                  <button
                    type="button"
                    onClick={() => setPoojaSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Deity Cards Grid (Compact & Scrollable with ~4 Visible Cards) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[295px] overflow-y-auto pr-1">
                {filteredPoojas.map((p) => {
                  const isSelected = selectedPoojaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPooja(p.id)}
                      className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2.5 shadow-2xs active:scale-95 cursor-pointer relative select-none ${
                        isSelected
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30"
                          : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 border ${
                            isSelected
                              ? "bg-emerald-900/60 border-emerald-700 text-white"
                              : "bg-slate-100 border-slate-200 text-slate-900"
                          }`}
                        >
                          {getPoojaIcon(p)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div
                            className={`text-xs font-black truncate ${
                              isSelected ? "text-white" : "text-slate-900"
                            }`}
                          >
                            {p.tamilName || p.englishName}
                          </div>
                          {p.tamilName && p.englishName && (
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? "text-emerald-200" : "text-slate-400"
                              }`}
                            >
                              {p.englishName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 ml-1">
                        <div className="text-right">
                          <span
                            className={`text-xs font-black block ${
                              isSelected ? "text-amber-300" : "text-emerald-800 font-extrabold"
                            }`}
                          >
                            ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* View Items Checklist Eye Button on Far Right */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPreviewPoojaForItems(p);
                          }}
                          className={`p-1.5 rounded-lg border transition cursor-pointer active:scale-90 ${
                            isSelected
                              ? "bg-emerald-900/80 text-emerald-100 border-emerald-700 hover:bg-emerald-900"
                              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-500 hover:text-slate-800"
                          }`}
                          title="சாமக்கிரி பொருட்கள் பட்டியல் விவரம் (View items list)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {isSelected && <Check className="w-4 h-4 text-amber-300 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. DATE & TIME */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <CalendarIcon className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    3. DATE &amp; TIME
                  </h2>
                </div>

                {/* Tamil Month Badge + Quick Date Picker Icon Button */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10.5px] font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                    {tamilInfo.tamilMonth} {tamilInfo.tamilDay}
                  </span>

                  <div className="relative group shrink-0">
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => {
                        if (e.target.value) setDate(e.target.value);
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="Pick Custom Date"
                    />
                    <button
                      type="button"
                      className="w-7 h-7 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center transition shadow-2xs cursor-pointer active:scale-95"
                      title="Select Custom Date 📅"
                    >
                      <CalendarIcon className="w-3.5 h-3.5 text-amber-700" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact Horizontally Scrollable Date Strip + Date Picker Pill */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                {upcomingDates.map((item) => {
                  const isSel = date === item.dateStr;
                  return (
                    <button
                      key={item.dateStr}
                      type="button"
                      onClick={() => setDate(item.dateStr)}
                      className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition border cursor-pointer active:scale-95 flex items-center gap-1 shadow-2xs ${
                        isSel
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-xs font-black"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>{item.dayName}</span>
                      {item.isToday && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isSel ? "bg-emerald-900 text-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          Today
                        </span>
                      )}
                      {item.isTomorrow && (
                        <span
                          className={`text-[9px] px-1 py-0.2 rounded font-semibold ${
                            isSel ? "bg-emerald-900 text-emerald-200" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          Tmrw
                        </span>
                      )}
                      {item.isMuhurtham && <span className="text-[10px]">✨</span>}
                    </button>
                  );
                })}

                {/* Compact Date Picker Pill */}
                <div className="relative shrink-0 group">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      if (e.target.value) setDate(e.target.value);
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Pick Custom Date"
                  />
                  <div
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                      !upcomingDates.some((d) => d.dateStr === date)
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-xs font-black"
                        : "bg-slate-100 group-hover:bg-slate-200 text-slate-700 border-slate-300"
                    }`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {!upcomingDates.some((d) => d.dateStr === date)
                        ? new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Date 📅"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sacred Panchangam Auspicious Timings Card with Straight Clean Alignment */}
              <div className="bg-amber-50/75 rounded-2xl p-2.5 sm:p-3 border border-amber-200/90 shadow-2xs space-y-2">
                {/* Row 1: நல்ல நேரம் (Straight Aligned) */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-amber-950">
                      நல்ல நேரம்:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-800 text-[11px] sm:text-xs text-right">
                    {tamilInfo.nallaNeramMorning && (
                      <span className="inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs">
                        <span className="text-[10px] font-black text-amber-800">காலை</span>
                        <span>{formatTime12H(tamilInfo.nallaNeramMorning)}</span>
                      </span>
                    )}
                    {tamilInfo.nallaNeramEvening && (
                      <span className="inline-flex items-center gap-1 bg-white/95 px-2 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs">
                        <span className="text-[10px] font-black text-amber-800">மாலை</span>
                        <span>{formatTime12H(tamilInfo.nallaNeramEvening)}</span>
                      </span>
                    )}
                    {!tamilInfo.nallaNeramMorning && !tamilInfo.nallaNeramEvening && (
                      <span className="bg-white/95 px-2 py-0.5 rounded-lg border border-amber-200/80 font-black text-emerald-900">
                        {formatTime12H(tamilInfo.nallaNeram) || "07:45 AM - 08:45 AM"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: கௌரி நல்ல நேரம் (Straight Aligned) */}
                <div className="flex items-center justify-between gap-2 text-xs pt-1.5 border-t border-amber-200/60">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-black text-amber-950">
                      கௌரி நல்ல நேரம்:
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 font-bold text-slate-800 text-[11px] sm:text-xs text-right">
                    <span className="bg-white/95 px-2 py-0.5 rounded-lg border border-amber-200/80 shadow-2xs">
                      {formatTime12H(tamilInfo.gowriNallaNeramMorning || tamilInfo.gowriNallaNeram || "10:45 AM - 11:45 AM")}
                    </span>
                    {tamilInfo.isMuhurtham && (
                      <span className="font-black text-amber-950 bg-amber-200/90 px-2 py-0.5 rounded-lg border border-amber-300 text-[10px]">
                        சுப முகூர்த்தம் ✨
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Time Selection: English Only with Edit Icon */}
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-slate-800 font-bold">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Pooja Time:</span>
                    <span className="font-black text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-xs">
                      {time}
                    </span>
                  </div>

                  {/* Manual Time Picker Icon Button */}
                  <div className="relative group shrink-0">
                    <input
                      type="time"
                      value={convert12HTo24H(time)}
                      onChange={(e) => {
                        if (e.target.value) {
                          setTime(formatTime12H(e.target.value));
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      title="Edit Custom Time"
                    />
                    <button
                      type="button"
                      className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs cursor-pointer active:scale-95"
                      title="Edit Custom Time"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span className="text-[11px]">Edit Time</span>
                    </button>
                  </div>
                </div>

                {/* Quick Time Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {!["06:00 AM", "07:30 AM", "07:45 AM", "09:00 AM", "10:30 AM", "05:30 PM", "06:00 PM"].includes(time) && (
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl font-black shrink-0 transition border cursor-pointer bg-emerald-800 text-white border-emerald-800 shadow-2xs flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3 text-amber-300" />
                      <span>{time} (Custom)</span>
                    </button>
                  )}

                  {["06:00 AM", "07:30 AM", "07:45 AM", "09:00 AM", "10:30 AM", "05:30 PM", "06:00 PM"].map((t) => {
                    const isSel = time === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition border cursor-pointer active:scale-95 ${
                          isSel
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs font-black"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Location / Venue */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <MapPin className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    4. நடைபெறும் இடம் (Location / Venue)
                  </h2>
                </div>
              </div>

              {/* 1-Tap Venue Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "இல்லம் (Home)", icon: "🏠", value: "பக்தர் இல்லம்" },
                  { label: "கோவில் (Temple)", icon: "🛕", value: "கோவில் (Temple)" },
                  { label: "மண்டபம் (Hall)", icon: "🏛️", value: "மண்டபம் (Hall)" },
                  { label: "நாமக்கல்", icon: "📍", value: "நாமக்கல் (Namakkal)" },
                ].map((v) => {
                  const isSel = location.includes(v.value) || location === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      onClick={() => setLocation(v.value)}
                      className={`py-2 px-2.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                        isSel
                          ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                          : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold"
                      }`}
                    >
                      <span>{v.icon}</span>
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Custom Address Input */}
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="முகவரி அல்லது இடம் (Address or Venue)..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: PAYMENT (AMOUNT, STATUS, PRIEST, CONFIRMATION)         */}
        {/* ============================================================== */}
        {twoStepStage === 2 && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* Top Recap Summary Pill */}
            <div className="bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 text-white p-3.5 rounded-3xl shadow-md flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black truncate flex items-center gap-1.5 text-amber-200">
                  <span>👤 {selectedCustomer?.name || "Devotee"}</span>
                  <span>•</span>
                  <span>
                    {currentPooja ? getPoojaIcon(currentPooja) : "🪔"}{" "}
                    {currentPooja?.tamilName || currentPooja?.englishName}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-200 font-medium truncate mt-0.5 flex items-center gap-1.5">
                  <span>📅 {date}</span>
                  <span>•</span>
                  <span>⏰ {time}</span>
                  <span>•</span>
                  <span>📍 {location}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTwoStepStage(1)}
                className="text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl border border-white/20 transition active:scale-95 cursor-pointer shrink-0"
              >
                Edit Booking
              </button>
            </div>

            {/* Total Dakshina Amount (Manual Edit + Steppers + Save Tick) */}
            <div
              id="amount-section"
              className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3 transition-all duration-300 ${
                missingField === "amount"
                  ? "border-rose-400 ring-4 ring-rose-400/30 bg-rose-50/20"
                  : "border-slate-200/90"
              }`}
            >
              {missingField === "amount" && (
                <div className="p-2 bg-rose-100 border border-rose-300 text-rose-900 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-bounce">
                  <span>⚠️ தயவுசெய்து தட்சணை தொகையை உள்ளிடவும் (Please enter dakshina amount)</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    மொத்த தட்சணை (Total Dakshina)
                  </h2>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  (நேரடியாக மாற்றலாம்)
                </span>
              </div>

              {/* Direct Manual Input with Steppers & Save Tick */}
              <div className="bg-slate-50/80 p-3 sm:p-4 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-2.5">
                <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                  <span className="text-2xl font-black text-emerald-800">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={amount || ""}
                    onChange={(e) => {
                      const val = Math.max(0, Number(e.target.value) || 0);
                      setAmount(val);
                      if (paymentChoice === "FULL") setAdvanceAmount(val);
                      if (missingField === "amount") setMissingField(null);
                    }}
                    className="w-full max-w-[160px] text-2xl sm:text-3xl font-black text-slate-900 bg-transparent border-b-2 border-slate-300 focus:border-emerald-600 focus:outline-none transition py-0.5 tracking-tight"
                    placeholder="0"
                    title="தட்சணை தொகையை டைப் செய்து மாற்றவும்"
                  />

                  {/* Save / Tick Confirmation Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAmountSaved(true);
                      if (missingField === "amount") setMissingField(null);
                      setTimeout(() => setIsAmountSaved(false), 2000);
                    }}
                    className={`px-2.5 py-1 rounded-xl border flex items-center gap-1 text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs ${
                      isAmountSaved
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                    title="தட்சணை தொகையை சேமிக்க / உறுதிப்படுத்த"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isAmountSaved ? "Saved ✓" : "Save"}</span>
                  </button>
                </div>

                {/* Quick Steppers: -500, -100, 100, 500 */}
                <div className="flex items-center gap-1 shrink-0">
                  {[-500, -100, 100, 500].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleAdjustAmount(delta)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition active:scale-95 cursor-pointer ${
                        delta > 0
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Payment Status & Record Payment (Clean, Compact & English Labels) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>💳</span>
                  <span>Payment Status</span>
                </h2>
                <span className="text-[10.5px] font-extrabold text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {paymentChoice === "FULL"
                    ? "Paid in Full ✓"
                    : paymentChoice === "ADVANCE"
                    ? "Advance Received"
                    : "Pending Payment ⏳"}
                </span>
              </div>

              {/* 3 Status Buttons - Compact Segmented Control with English Labels */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("UNPAID");
                    setAdvanceAmount(0);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentChoice === "UNPAID"
                      ? "bg-amber-600 text-white font-black shadow-xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span>⏳</span>
                  <span>Pending</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("ADVANCE");
                    if (advanceAmount === 0) setAdvanceAmount(Math.round(amount / 2));
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentChoice === "ADVANCE"
                      ? "bg-amber-800 text-white font-black shadow-xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span>🪙</span>
                  <span>Advance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("FULL");
                    setAdvanceAmount(amount);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    paymentChoice === "FULL"
                      ? "bg-emerald-800 text-white font-black shadow-xs"
                      : "text-slate-700 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <span>✅</span>
                  <span>Full Paid</span>
                </button>
              </div>

              {/* Advance Input & Payment Mode when Advance is chosen */}
              {paymentChoice === "ADVANCE" && (
                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-bold text-amber-950">Advance Paid:</span>
                    <div className="flex items-center gap-2">
                      <div className="relative w-28">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-amber-800">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={amount}
                          value={advanceAmount || ""}
                          onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                          className="w-full bg-white border border-amber-300 rounded-lg pl-6 pr-2 py-1 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                          placeholder="0"
                        />
                      </div>
                      <span className="text-[11px] font-bold text-slate-600 shrink-0">
                        (Balance: ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-200/60 text-[11px] flex-wrap">
                    <span className="font-medium text-slate-600">Payment Mode:</span>
                    <div className="flex items-center gap-1">
                      {(["UPI", "CASH", "BANK_TRANSFER"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer text-xs ${
                            paymentMethod === method
                              ? "bg-amber-800 text-white border-amber-800 shadow-2xs"
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          {method === "UPI" ? "📱 UPI" : method === "CASH" ? "💵 Cash" : "🏦 Bank"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Full Paid Confirmation & Payment Mode */}
              {paymentChoice === "FULL" && (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2 text-xs flex-wrap animate-in fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <span>Amount Received:</span>
                    <span className="font-black text-emerald-800 text-sm">₹{amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-slate-500 font-medium text-[11px] mr-1">Payment Mode:</span>
                    {(["UPI", "CASH", "BANK_TRANSFER"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`px-2.5 py-1 rounded-lg font-bold border transition cursor-pointer ${
                          paymentMethod === method
                            ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {method === "UPI" ? "📱 UPI" : method === "CASH" ? "💵 Cash" : "🏦 Bank"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Subtle Note */}
              {paymentChoice === "UNPAID" && (
                <div className="py-1 px-2 text-[11px] text-slate-500 font-medium text-center">
                  ⏳ Full dakshina will be collected after pooja ceremony
                </div>
              )}
            </div>

            {/* Performing Priest (Self vs Other) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    🪔
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    செய்து வைப்பவர் (Priest)
                  </h2>
                </div>

                {/* Clean + Add button with single plus icon toggling to ✕ Close */}
                <button
                  type="button"
                  onClick={() => setShowAddPriest((prev) => !prev)}
                  className={`text-xs font-bold px-3 py-1 rounded-xl border flex items-center gap-1.5 transition cursor-pointer active:scale-95 ${
                    showAddPriest
                      ? "text-rose-900 bg-rose-50 hover:bg-rose-100 border-rose-300"
                      : "text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border-emerald-300"
                  }`}
                >
                  {showAddPriest ? (
                    <X className="w-3.5 h-3.5 text-rose-600" />
                  ) : (
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                  <span>{showAddPriest ? "Close" : "Add"}</span>
                </button>
              </div>

              {/* Inline Add Priest Form */}
              {showAddPriest && (
                <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2 animate-in fade-in">
                  <span className="text-[11px] font-bold text-emerald-950 block">
                    புதிய குருக்களை சேர்க்க (Add New Priest):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="குருக்கள் பெயர் (Priest Name) *"
                      value={newPriestName}
                      onChange={(e) => setNewPriestName(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                      autoFocus
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="tel"
                        placeholder="மொபைல் (Mobile - விருப்பம்)"
                        value={newPriestMobile}
                        onChange={(e) => setNewPriestMobile(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddPriest}
                        className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95 shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Duplicate or Success Alert Notice */}
              {priestNotice && (
                <div className="p-2 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                  <span>✓ {priestNotice}</span>
                </div>
              )}

              {/* Priest Type Selector */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPriestType("self");
                    setAssignedIyerId("self");
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    priestType === "self"
                      ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold"
                  }`}
                >
                  <span>🪔 Self ({currentUser?.name || "Mani Raja"})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPriestType("other");
                    if (assignedIyerId === "self" && members.length > 0) {
                      setAssignedIyerId(members[0].id);
                    }
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 text-xs ${
                    priestType === "other"
                      ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold"
                  }`}
                >
                  <span>👥 Other (வேறு குருக்கள்)</span>
                </button>
              </div>

              {/* If other priest, show quick pick + Instant Add Input */}
              {priestType === "other" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider block">
                      குருக்களைத் தேர்வு செய்க (Select Performing Priest):
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddPriest(true)}
                      className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Priest</span>
                    </button>
                  </div>

                  {members.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {members.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => {
                            setAssignedIyerId(m.id);
                            setCustomPriestName("");
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                            assignedIyerId === m.id && !customPriestName.trim()
                              ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-1 font-medium">
                      வேறு குருக்கள் இல்லை. மேலே உள்ள &apos;+ Add&apos; பொத்தானைக் கிளிக் செய்து புதிய குருக்களைச் சேர்க்கவும்.
                    </div>
                  )}

                  {/* Instant Priest Name Input */}
                  <div className="space-y-1 pt-1 border-t border-slate-200/70">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      அல்லது புதிய குருக்கள் பெயர் (Or Type Name):
                    </span>
                    <div className="flex items-center gap-1.5">
                      <input
                        id="custom-priest-input"
                        type="text"
                        placeholder="குருக்கள் பெயர் (e.g. Anandha Sharma)..."
                        value={customPriestName}
                        onChange={(e) => setCustomPriestName(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                      />
                      {customPriestName.trim() && (
                        <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-300 shrink-0">
                          Assigned ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STICKY BOTTOM CONFIRMATION BAR (ENGLISH ONLY)                  */}
        {/* ============================================================== */}
        {twoStepStage === 1 ? (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3.5 sm:py-4 px-3.5 sm:px-6 shadow-2xl">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1.5">
                  <span>👤</span>
                  <span className={selectedCustomer ? "text-slate-900 font-extrabold" : "text-amber-800 font-bold"}>
                    {selectedCustomer ? selectedCustomer.name : "பக்தரைத் தேர்ந்தெடுக்கவும்"}
                  </span>
                </div>
                <div className="text-[10.5px] sm:text-[11px] font-bold truncate flex items-center gap-1.5 mt-0.5">
                  <span>🪔</span>
                  <span className={currentPooja ? "text-emerald-800 font-black" : "text-slate-500 font-medium"}>
                    {currentPooja
                      ? `${currentPooja.tamilName || currentPooja.englishName} • ₹${amount.toLocaleString("en-IN")}`
                      : "பூஜையைத் தேர்ந்தெடுக்கவும்"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={validateAndProceedToStep2}
                className="px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 hover:from-emerald-950 hover:to-black text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-950/20 transition active:scale-95 cursor-pointer shrink-0"
              >
                <span>Next: Payment</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          </div>
        ) : (
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3.5 sm:py-4 px-3.5 sm:px-6 shadow-2xl">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-black text-xs sm:text-sm text-slate-900 truncate">
                  👤 {selectedCustomer?.name || "Devotee"} • 🪔 {currentPooja?.tamilName || currentPooja?.englishName}
                </div>
                <div className="text-[10.5px] sm:text-[11px] text-emerald-800 font-bold flex items-center gap-1 sm:gap-1.5 truncate mt-0.5">
                  <span>📅 {date}</span>
                  <span>•</span>
                  <span>⏰ {time}</span>
                  <span>•</span>
                  <span className="font-black text-slate-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={isSubmittingBooking}
                onClick={handleFinalConfirmBooking}
                className="px-5 sm:px-7 py-3 sm:py-3.5 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 hover:from-emerald-950 hover:to-black text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg shadow-emerald-950/20 transition active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{isSubmittingBooking ? "Confirming..." : "Confirm Booking ✨"}</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ============================================================== */}
      {/* CELEBRATORY SUCCESS MODAL WITH DIRECT BOOKINGS LINK            */}
      {/* ============================================================== */}
      {createdBooking && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-emerald-200 overflow-hidden text-center space-y-4 p-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                Booking Confirmed ✨
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Ceremony Booked Successfully!
              </h3>
              <div className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 rounded-full font-mono text-xs font-bold text-emerald-900">
                #{createdBooking.bookingNumber.replace(/^#+/, "")}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1.5 text-slate-700 text-left border border-slate-200">
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Devotee:</span>
                <span className="text-slate-900">{createdBooking.customerName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Ceremony:</span>
                <span className="text-slate-900">{createdBooking.poojaTamilName || createdBooking.poojaEnglishName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Date &amp; Time:</span>
                <span className="text-slate-900">{createdBooking.date} ({createdBooking.startTime})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-500">Dakshina:</span>
                <span className="text-emerald-900 font-black">₹{createdBooking.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-200">
                <span className="text-slate-500">Payment Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10.5px] font-black ${
                    createdBooking.paymentStatus === "PAID"
                      ? "bg-emerald-100 text-emerald-900"
                      : createdBooking.paymentStatus === "PARTIALLY_PAID"
                      ? "bg-amber-100 text-amber-900"
                      : "bg-rose-100 text-rose-900"
                  }`}
                >
                  {createdBooking.paymentStatus === "PAID"
                    ? "Full Paid ✅"
                    : createdBooking.paymentStatus === "PARTIALLY_PAID"
                    ? `Advance Paid (Due ₹${createdBooking.balanceAmount})`
                    : "Pending Payment ⏳"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share Confirmation via WhatsApp</span>
              </button>

              <Link
                href="/app/bookings"
                className="w-full py-3 sm:py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs sm:text-sm transition cursor-pointer text-center flex items-center justify-center gap-2 shadow-md active:scale-95"
              >
                <CalendarIcon className="w-4 h-4 text-amber-300" />
                <span>All Bookings (அனைத்து முன்பதிவுகள்)</span>
              </Link>

              <Link
                href={`/app/bookings/${createdBooking.id}`}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer text-center flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                <span>View Details &amp; Edit</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SAMAGRI CHECKLIST PREVIEW MODAL (FULL FIT & UI SETTING)       */}
      {/* ============================================================== */}
      {previewPoojaForItems && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-300 overflow-hidden animate-in zoom-in-95">
            {/* Emerald Gradient Header with Deity Icon */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getPoojaIcon(previewPoojaForItems)}</span>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    {previewPoojaForItems.tamilName || previewPoojaForItems.englishName}
                  </h3>
                  <span className="text-[11px] text-amber-300 font-bold block">
                    சாமக்கிரி பொருட்கள் பட்டியல் ({previewPoojaForItems.items?.length || 0} பொருட்கள்)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPoojaForItems(null)}
                className="w-7 h-7 rounded-full text-white/70 hover:text-white hover:bg-white/10 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Numbered Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-1.5 text-xs">
              {previewPoojaForItems.items && previewPoojaForItems.items.length > 0 ? (
                previewPoojaForItems.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-slate-800 truncate">
                        {(item as any).itemTamilName || (item as any).itemEnglishName || (item as any).nameTamil || (item as any).nameEnglish}
                      </span>
                    </div>
                    <span className="font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px] shrink-0 ml-2">
                      {item.quantity} {formatUnitShort(item.unit)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  இந்தப் பூஜைக்கு பொருட்கள் பட்டியல் சேர்க்கப்படவில்லை.
                </div>
              )}
            </div>

            {/* Reassuring Tip Footer */}
            <div className="p-3 bg-amber-50/70 border-t border-amber-200/60 text-[11px] text-amber-900 font-medium">
              💡 இந்தப் பொருட்களை முன்பதிவு செய்த பிறகும் Booking Edit பக்கத்தில் எப்போது வேண்டுமானாலும் மாற்றிக்கொள்ளலாம்.
            </div>

            {/* Action Buttons */}
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPreviewPoojaForItems(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSelectPooja(previewPoojaForItems.id);
                  setPreviewPoojaForItems(null);
                }}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 cursor-pointer"
              >
                இந்த பூஜையைத் தேர்வு செய் ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuickBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs font-bold text-slate-400">
          Loading Quick Booking...
        </div>
      }
    >
      <QuickBookingContent />
    </Suspense>
  );
}
