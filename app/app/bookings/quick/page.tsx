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

  useEffect(() => {
    setCustomers(db.getCustomers(businessId));
    setPoojas(db.getPoojas(businessId).filter((p) => !isLegacyObsoletePooja(p)));
    setAllMembers(db.getMembers(businessId));
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

  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setFormError("");
    setDuplicateNotice("");
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
  // 2. Pooja & Samagri State
  // ---------------------------------------------------------------------------
  const [selectedPoojaId, setSelectedPoojaId] = useState<string>(
    searchParams.get("poojaId") || ""
  );
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);
  const [inspectPoojaForModal, setInspectPoojaForModal] = useState<Pooja | null>(null);

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
  };

  // Long-press detection on Pooja Card to view items
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);

  const handlePoojaTouchStart = (pooja: Pooja) => {
    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
      setInspectPoojaForModal(pooja);
    }, 450);
  };

  const handlePoojaTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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

  // Expenses State
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState<string>("");
  const [showExpenses, setShowExpenses] = useState<boolean>(false);

  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // Step 1 Validation & Proceed to Step 2
  const validateAndProceedToStep2 = () => {
    if (!selectedCustomerId) {
      setFormError("தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select a devotee).");
      const el = document.getElementById("devotee-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!selectedPoojaId) {
      setFormError("தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select a pooja ritual).");
      const el = document.getElementById("pooja-section");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
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
  };

  // Final Booking Submission
  const handleFinalConfirmBooking = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!selectedCustomer) {
      setFormError("பக்தர் விவரம் தேர்வு செய்யப்படவில்லை");
      setTwoStepStage(1);
      return;
    }
    if (!currentPooja) {
      setFormError("பூஜை சேவை தேர்வு செய்யப்படவில்லை");
      setTwoStepStage(1);
      return;
    }

    setIsSubmittingBooking(true);

    const effectivePriestId = priestType === "self" ? "self" : assignedIyerId;
    const assignedMember = members.find((m) => m.id === effectivePriestId);
    const performingName =
      priestType === "self"
        ? currentUser?.name || "Ravi Iyer"
        : assignedMember?.name || "Assigned Priest";

    const paymentStatus: PaymentStatus =
      paymentChoice === "FULL"
        ? "PAID"
        : paymentChoice === "ADVANCE"
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
        advanceAmount: paymentChoice === "UNPAID" ? 0 : advanceAmount,
        balanceAmount: Math.max(0, amount - (paymentChoice === "UNPAID" ? 0 : advanceAmount)),
        paymentStatus,
        paymentDate: paymentChoice !== "UNPAID" ? paymentDate : undefined,
        paymentMethod: paymentChoice !== "UNPAID" ? paymentMethod : undefined,
        paymentRecipient: paymentChoice !== "UNPAID" ? paymentRecipient : undefined,
        priestShareAmount: paymentChoice !== "UNPAID" && priestShareAmount > 0 ? priestShareAmount : undefined,
        adminCommissionAmount: paymentChoice !== "UNPAID" && adminCommissionAmount > 0 ? adminCommissionAmount : undefined,
        paymentNotes: paymentChoice !== "UNPAID" && paymentNotes.trim() ? paymentNotes.trim() : undefined,
        status: "CONFIRMED",
        assignedIyerId: effectivePriestId === "self" ? "m-owner-01" : effectivePriestId,
        assignedIyerName: performingName,
        location: location || selectedCustomer.city || "Namakkal",
        expenseAmount: expenseAmount || 0,
        expenseNotes: expenseNotes || "",
        items: samagriItems,
        idempotencyKey,
      } as any);

      setCreatedBooking(newBooking);
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
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3"
            >
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
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showAddDevotee ? "Close" : "+ Add"}</span>
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
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3"
            >
              <div className="flex items-center justify-between flex-wrap gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-800 text-amber-300 flex items-center justify-center font-bold text-xs shadow-2xs">
                    🪔
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    2. பூஜை சேவை (Ceremony)
                  </h2>
                </div>

                <div className="text-[10.5px] text-slate-500 font-bold">
                  <span>1-Tap Select • </span>
                  <span className="text-amber-800">
                    (அழுத்திப் பிடித்தால் பொருட்கள் பட்டியல்)
                  </span>
                </div>
              </div>

              {/* Deity Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {poojas.map((p) => {
                  const isSelected = selectedPoojaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        if (isLongPressActiveRef.current) {
                          isLongPressActiveRef.current = false;
                          return;
                        }
                        handleSelectPooja(p.id);
                      }}
                      onTouchStart={() => handlePoojaTouchStart(p)}
                      onTouchEnd={handlePoojaTouchEnd}
                      onTouchCancel={handlePoojaTouchEnd}
                      onMouseDown={() => handlePoojaTouchStart(p)}
                      onMouseUp={handlePoojaTouchEnd}
                      onMouseLeave={handlePoojaTouchEnd}
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

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-right">
                          <span
                            className={`text-xs font-black block ${
                              isSelected ? "text-amber-300" : "text-emerald-800 font-extrabold"
                            }`}
                          >
                            ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                          </span>
                        </div>

                        {/* Info/Items eye button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectPoojaForModal(p);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? "text-emerald-200 hover:text-white hover:bg-emerald-700"
                              : "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          }`}
                          title="பொருட்கள் பட்டியலைக் காண்க (View Items)"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Date & Auspicious Time */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <CalendarIcon className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    3. நாள் &amp; சுப நேரம் (Date &amp; Time)
                  </h2>
                </div>

                <span className="text-[10.5px] font-black text-amber-950 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-300">
                  {tamilInfo.tamilMonth} {tamilInfo.tamilDay}
                </span>
              </div>

              {/* 1-Tap Date Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDate(todayStr)}
                  className={`p-2.5 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                    date === todayStr
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase block opacity-80">
                    இன்று (Today)
                  </span>
                  <span className="text-xs font-black block mt-0.5">
                    {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(tomorrowStr)}
                  className={`p-2.5 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                    date === tomorrowStr
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase block opacity-80">
                    நாளை (Tmrw)
                  </span>
                  <span className="text-xs font-black block mt-0.5">
                    {tomorrowDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDate(nextMuhurthamStr)}
                  className={`p-2.5 rounded-2xl border text-center transition active:scale-95 cursor-pointer ${
                    date === nextMuhurthamStr
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase block text-amber-600">
                    முகூர்த்தம் ✨
                  </span>
                  <span className="text-xs font-black block mt-0.5">
                    {nextMuhurthamDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </button>
              </div>

              {/* Sacred Panchangam Nalla Neram Box */}
              <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200/90 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🪔</span>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 block">
                      நல்ல நேரம் (Auspicious Time):
                    </span>
                    <span className="text-xs font-black text-emerald-950">
                      {formatTime12H(tamilInfo.nallaNeram) || "07:45 AM - 08:45 AM"}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                  காலை (Morning) ✓
                </span>
              </div>

              {/* Time Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
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

            {/* Total Dakshina Amount */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <IndianRupee className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                    மொத்த தட்சணை (Total Dakshina)
                  </h2>
                </div>
              </div>

              {/* Large Amount Counter with Steppers */}
              <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-emerald-800">₹</span>
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                    {amount.toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Steppers */}
                <div className="flex items-center gap-1.5">
                  {[-500, -100, 100, 500].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => handleAdjustAmount(delta)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-black border transition active:scale-95 cursor-pointer ${
                        delta > 0
                          ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                      }`}
                    >
                      {delta > 0 ? `+${delta}` : delta}
                    </button>
                  ))}
                </div>
              </div>

              {/* Common Presets */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Presets:
                </span>
                {[2500, 5000, 7500, 10000].map((presetAmt) => (
                  <button
                    key={presetAmt}
                    type="button"
                    onClick={() => {
                      setAmount(presetAmt);
                      if (paymentChoice === "FULL") setAdvanceAmount(presetAmt);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                      amount === presetAmt
                        ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs font-black"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    ₹{presetAmt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              {/* KPI Chips */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-center text-xs">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[9.5px] font-bold text-slate-400 uppercase">Gross</div>
                  <div className="text-xs sm:text-sm font-black text-slate-900">
                    ₹{amount.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="p-2 bg-rose-50/60 rounded-xl border border-rose-200">
                  <div className="text-[9.5px] font-bold text-rose-600 uppercase">Expense</div>
                  <div className="text-xs sm:text-sm font-black text-rose-700">
                    {expenseAmount > 0 ? `-₹${expenseAmount.toLocaleString("en-IN")}` : "₹0"}
                  </div>
                </div>
                <div className="p-2 bg-emerald-50/80 rounded-xl border border-emerald-200">
                  <div className="text-[9.5px] font-black text-emerald-800 uppercase">Net</div>
                  <div className="text-xs sm:text-sm font-black text-emerald-950">
                    ₹{Math.max(0, amount - expenseAmount).toLocaleString("en-IN")}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status (3 Clear Buttons) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>💳</span>
                  <span>கட்டண நிலை (Payment Status)</span>
                </h2>
                <span className="text-[10.5px] font-extrabold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  {paymentChoice === "FULL"
                    ? "Paid in Full ✓"
                    : paymentChoice === "ADVANCE"
                    ? "Advance Received"
                    : "நிலுவை (Later)"}
                </span>
              </div>

              {/* 3 Status Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("UNPAID");
                    setAdvanceAmount(0);
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                    paymentChoice === "UNPAID"
                      ? "bg-amber-600 text-white border-amber-600 font-black shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-sm">⏳</span>
                  <span className="text-xs font-black">நிலுவை</span>
                  <span className="text-[9.5px] opacity-80">Later / Unpaid</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("ADVANCE");
                    if (advanceAmount === 0) setAdvanceAmount(Math.round(amount / 2));
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                    paymentChoice === "ADVANCE"
                      ? "bg-amber-800 text-white border-amber-800 font-black shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-sm">🪙</span>
                  <span className="text-xs font-black">முன்பணம்</span>
                  <span className="text-[9.5px] opacity-80">Advance</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("FULL");
                    setAdvanceAmount(amount);
                  }}
                  className={`py-2.5 px-2 rounded-2xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                    paymentChoice === "FULL"
                      ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-sm">✅</span>
                  <span className="text-xs font-black">Full Paid</span>
                  <span className="text-[9.5px] opacity-80">முழுத் தொகை</span>
                </button>
              </div>

              {/* Advance Input when Advance is chosen */}
              {paymentChoice === "ADVANCE" && (
                <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                    <span>பெறப்பட்ட முன்பணம் (Advance Amount):</span>
                    <span>மீதி நிலுவை: ₹{(amount - advanceAmount).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs font-black text-amber-800">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={amount}
                      value={advanceAmount || ""}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-amber-300 rounded-xl pl-7 pr-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Performing Priest (Self vs Other) */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <span>🪔</span>
                  <span>செய்து வைப்பவர் (Priest)</span>
                </h2>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  தலைமை குருக்கள்
                </span>
              </div>

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

              {/* If other priest, show quick pick */}
              {priestType === "other" && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Select Performing Priest:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {members.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setAssignedIyerId(m.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition active:scale-95 cursor-pointer ${
                          assignedIyerId === m.id
                            ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* STICKY BOTTOM CONFIRMATION BAR                                 */}
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
                <span>அடுத்தது: கட்டணம் (Next: Payment)</span>
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
                <span>{isSubmittingBooking ? "பதிவாகிறது..." : "முன்பதிவை உறுதி செய்க ✨ (Confirm Booking)"}</span>
              </button>
            </div>
          </div>
        )}
      </form>

      {/* ============================================================== */}
      {/* POOJA SAMAGRI CHECKLIST PREVIEW MODAL (ON LONG-PRESS OR EYE)   */}
      {/* ============================================================== */}
      {inspectPoojaForModal && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl border border-emerald-300 overflow-hidden animate-in zoom-in-95">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{getPoojaIcon(inspectPoojaForModal)}</span>
                <div>
                  <h3 className="font-black text-sm sm:text-base leading-tight">
                    {inspectPoojaForModal.tamilName || inspectPoojaForModal.englishName}
                  </h3>
                  <span className="text-[11px] text-amber-300 font-bold block">
                    சாமக்கிரி பொருட்கள் பட்டியல் ({inspectPoojaForModal.items?.length || 0} பொருட்கள்)
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectPoojaForModal(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            {/* List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-1.5 text-xs">
              {inspectPoojaForModal.items && inspectPoojaForModal.items.length > 0 ? (
                inspectPoojaForModal.items.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {item.itemTamilName || item.itemEnglishName}
                      </span>
                    </div>
                    <span className="text-[11px] font-black text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 shrink-0">
                      {item.quantity} {formatUnitShort(item.unit)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-slate-400 font-bold">
                  இந்தப் பூஜைக்கு பொருட்கள் பட்டியல் இணைக்கப்படவில்லை.
                </div>
              )}
            </div>

            {/* Footer with note */}
            <div className="p-3 bg-amber-50 border-t border-amber-200 text-[11px] font-semibold text-amber-950 flex flex-col gap-2">
              <div className="flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  இந்தப் பொருட்களை முன்பதிவு செய்த பிறகும் Booking Edit பக்கத்தில் எப்போது வேண்டுமானாலும் மாற்றிக்கொள்ளலாம்.
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleSelectPooja(inspectPoojaForModal.id);
                    setInspectPoojaForModal(null);
                  }}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-black shadow-xs active:scale-95 cursor-pointer"
                >
                  இந்த பூஜையைத் தேர்வு செய் ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CELEBRATORY SUCCESS MODAL WITH 1-TAP WHATSAPP SHARE            */}
      {/* ============================================================== */}
      {createdBooking && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-emerald-200 overflow-hidden text-center space-y-4 p-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                முன்பதிவு உறுதியானது ✨
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                பூஜை வெற்றிகரமாகப் பதிவானது!
              </h3>
              <div className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 rounded-full font-mono text-xs font-bold text-emerald-900">
                #{createdBooking.bookingNumber}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 text-left border border-slate-200">
              <div className="flex justify-between font-bold">
                <span>பக்தர்:</span>
                <span>{createdBooking.customerName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>பூஜை:</span>
                <span>{createdBooking.poojaTamilName || createdBooking.poojaEnglishName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>தேதி:</span>
                <span>{createdBooking.date} ({createdBooking.startTime})</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>தட்சணை:</span>
                <span className="text-emerald-900">₹{createdBooking.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp-ல் உறுதிப்படுத்தல் பகிர்க</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <Link
                  href={`/app/bookings/${createdBooking.id}`}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer text-center"
                >
                  விவரம் / Edit
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedBooking(null);
                    setSelectedCustomerId("");
                    setSelectedPoojaId("");
                    setTwoStepStage(1);
                  }}
                  className="py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition cursor-pointer text-center"
                >
                  புதிய பதிவு
                </button>
              </div>
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
