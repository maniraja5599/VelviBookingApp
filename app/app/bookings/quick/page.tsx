"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Booking, Customer, Pooja, BookingItem, BusinessMember, PaymentStatus } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Flame,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  Check,
  CheckSquare,
  Square,
  Users,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, getLocalDateString } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage } from "@/lib/whatsapp/formatter";

const convert24To12 = (timeStr: string): string => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m} ${ampm}`;
};

const formatRangeTo12Hr = (rangeStr: string): string => {
  if (!rangeStr) return "";
  return rangeStr.replace(/\b(\d{1,2}):(\d{2})\b/g, (match, h, m) => {
    return convert24To12(`${h}:${m}`);
  });
};

function QuickBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [members, setAllMembers] = useState<BusinessMember[]>([]);

  useEffect(() => {
    setCustomers(db.getCustomers(businessId));
    setPoojas(db.getPoojas(businessId));
    setAllMembers(db.getMembers(businessId));
  }, [businessId]);

  // Form States - All in ONE page
  // 1. Devotee
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get("customerId") || ""
  );
  const [devoteeSearch, setDevoteeSearch] = useState<string>("");
  const [showAddDevotee, setShowAddDevotee] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");

  // 2. Pooja & Samagri
  const [selectedPoojaId, setSelectedPoojaId] = useState<string>(
    searchParams.get("poojaId") || ""
  );
  const [isItemsExpanded, setIsItemsExpanded] = useState<boolean>(false);
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);

  // 3. Date & Auspicious Time
  const todayStr = getLocalDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];

  const [date, setDate] = useState<string>(searchParams.get("date") || todayStr);
  const [time, setTime] = useState<string>(searchParams.get("time") || "07:00 AM");

  // Generate Upcoming 14 Days for Quick 1-Tap Date Strip
  const upcomingDays = useMemo(() => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      days.push({
        dateStr,
        dayName,
        dayNum,
        monthShort,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }
    return days;
  }, []);

  // 4. Dakshina & Assignment
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "ADVANCE" | "FULL">("UNPAID");
  const [priestType, setPriestType] = useState<"self" | "other">("self");
  const [assignedIyerId, setAssignedIyerId] = useState<string>("self");
  const [showAddPriest, setShowAddPriest] = useState<boolean>(false);
  const [newPriestName, setNewPriestName] = useState<string>("");
  const [newPriestMobile, setNewPriestMobile] = useState<string>("");
  const [newPriestSpec, setNewPriestSpec] = useState<string>("உதவி குருக்கள்");
  const [priestError, setPriestError] = useState<string>("");
  const [location, setLocation] = useState<string>("Namakkal");
  const [notes, setNotes] = useState<string>("");

  // Celebratory modal
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // 2-Step interactive stage (Stage 1: Devotee & Pooja, Stage 2: Date & Dakshina)
  const [twoStepStage, setTwoStepStage] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string>("");

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);

  // Sync pooja details & items
  const currentPooja = useMemo(
    () => poojas.find((p) => p.id === selectedPoojaId) || null,
    [poojas, selectedPoojaId]
  );

  useEffect(() => {
    if (currentPooja) {
      setAmount(currentPooja.basePrice || 5000);
      if (currentPooja.items && currentPooja.items.length > 0) {
        setSamagriItems(
          currentPooja.items.map((it, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            bookingId: "",
            itemEnglishName: it.itemEnglishName,
            itemTamilName: it.itemTamilName,
            quantity: it.quantity,
            unit: it.unit,
            isChecked: true,
            isCustom: false,
          }))
        );
      } else {
        setSamagriItems([]);
      }
    } else {
      setSamagriItems([]);
    }
  }, [currentPooja]);

  // Tamil Date Info
  const tamilInfo = useMemo(() => getTamilDate(date), [date]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!devoteeSearch.trim()) return customers;
    const q = devoteeSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, devoteeSearch]);

  // Quick Add Devotee Inline
  const handleQuickAddDevotee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: newCustMobile.trim(),
      city: newCustCity.trim() || "Namakkal",
    });
    setCustomers(db.getCustomers(businessId));
    setSelectedCustomerId(created.id);
    setShowAddDevotee(false);
    setNewCustName("");
    setNewCustMobile("");
  };

  // Handle Samagri Item Quantity Controls
  const handleItemQuantityChange = (id: string, delta: number) => {
    setSamagriItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const currentQty = typeof it.quantity === "number" ? it.quantity : parseFloat(String(it.quantity)) || 1;
        const nextQty = Math.max(1, currentQty + delta);
        return { ...it, quantity: nextQty };
      })
    );
  };

  const handleItemDirectQuantity = (id: string, newQtyStr: string) => {
    const parsed = parseFloat(newQtyStr);
    setSamagriItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, quantity: isNaN(parsed) ? 1 : Math.max(1, parsed) };
      })
    );
  };

  // 12-Hour Time Parser & Interactive Updaters
  const parsedTime = useMemo(() => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const rawH = parseInt(match[1], 10);
      const h = rawH > 12 ? rawH % 12 : rawH === 0 ? 12 : rawH;
      const hStr = h.toString().padStart(2, "0");
      const m = match[2];
      const p = match[3].toUpperCase() as "AM" | "PM";
      return { hour: hStr, minute: m, period: p };
    }
    return { hour: "07", minute: "00", period: "AM" as "AM" | "PM" };
  }, [time]);

  const updateTimeSlot = (newHour?: string, newMinute?: string, newPeriod?: "AM" | "PM") => {
    const h = newHour !== undefined ? newHour : parsedTime.hour;
    const m = newMinute !== undefined ? newMinute : parsedTime.minute;
    const p = newPeriod !== undefined ? newPeriod : parsedTime.period;
    setTime(`${h}:${m} ${p}`);
  };

  // Toggle Item
  const handleToggleItem = (id: string) => {
    setSamagriItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isChecked: !it.isChecked } : it))
    );
  };

  // Handle Payment Choice
  const handlePaymentChoiceChange = (choice: "UNPAID" | "ADVANCE" | "FULL") => {
    setPaymentChoice(choice);
    if (choice === "UNPAID") setAdvanceAmount(0);
    else if (choice === "FULL") setAdvanceAmount(amount);
    else if (choice === "ADVANCE" && advanceAmount === 0) setAdvanceAmount(Math.round(amount / 2));
  };

  // Quick Add Priest Inline
  const handleQuickAddPriest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPriestName.trim()) {
      setPriestError("தயவுசெய்து குருக்களின் பெயரை உள்ளிடவும் (Please enter priest name)");
      return;
    }
    setPriestError("");
    const created = db.createMember({
      businessId,
      name: newPriestName.trim(),
      mobile: newPriestMobile.trim(),
      role: "IYER",
      specialization: newPriestSpec.trim() || "உதவி குருக்கள் (Assistant Priest)",
    });
    setAllMembers(db.getMembers(businessId));
    setPriestType("other");
    setAssignedIyerId(created.id);
    setShowAddPriest(false);
    setNewPriestName("");
    setNewPriestMobile("");
    setNewPriestSpec("உதவி குருக்கள்");
  };

  // Open Preview Modal
  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setFormError("தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select devotee)");
      setTwoStepStage(1);
      return;
    }
    if (!currentPooja) {
      setFormError("தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select pooja)");
      setTwoStepStage(1);
      return;
    }
    if (priestType === "other" && (!assignedIyerId || assignedIyerId === "self")) {
      // If other is selected, ensure a valid member is assigned if members exist
      if (members.length > 0) {
        setAssignedIyerId(members[0].id);
      }
    }
    setFormError("");
    setShowPreviewModal(true);
  };

  // Final Create Booking Action
  const handleFinalConfirmBooking = () => {
    if (!selectedCustomer || !currentPooja) return;

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
      startTime: time,
      endTime: time,
      durationMinutes: currentPooja.durationMinutes || 120,
      totalAmount: amount,
      advanceAmount: paymentChoice === "UNPAID" ? 0 : advanceAmount,
      balanceAmount: Math.max(0, amount - (paymentChoice === "UNPAID" ? 0 : advanceAmount)),
      paymentStatus,
      status: "CONFIRMED",
      assignedIyerId: effectivePriestId === "self" ? "m-owner-01" : effectivePriestId,
      assignedIyerName: performingName,
      location: location || selectedCustomer.city || "Namakkal",
      notes: notes.trim(),
      items: samagriItems,
    });

    setShowPreviewModal(false);
    setCreatedBooking(newBooking);
  };

  const handleShareWhatsApp = () => {
    if (!createdBooking || !currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(createdBooking, currentBusiness);
    const phone = createdBooking.customerMobile ? createdBooking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-44 animate-in fade-in duration-200">
      {/* Top Header & Mode Toggle Switch */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-2">
          <Link
            href="/app/bookings"
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                New Booking
              </h1>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                ⚡ 2-Step Quick
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Step 1: Devotee &amp; Pooja • Step 2: Date &amp; Dakshina
            </p>
          </div>
        </div>

        <Link
          href="/app/bookings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleOpenPreview} className="space-y-3.5">
        {/* 2-Step Interactive Segmented Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setTwoStepStage(1);
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              twoStepStage === 1
                ? "bg-white text-emerald-950 shadow-xs font-black ring-1 ring-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>1. Devotee &amp; Pooja</span>
            {selectedCustomerId && selectedPoojaId && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              if (!selectedCustomerId) {
                setFormError("Please select a devotee first.");
                return;
              }
              if (!selectedPoojaId) {
                setFormError("Please select a pooja ritual first.");
                return;
              }
              setFormError("");
              setTwoStepStage(2);
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              twoStepStage === 2
                ? "bg-white text-emerald-950 shadow-xs font-black ring-1 ring-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>2. Date &amp; Dakshina</span>
          </button>
        </div>

        {/* Form Validation Error Alert */}
        {formError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in flex items-center justify-between">
            <span>⚠️ {formError}</span>
            <button
              type="button"
              onClick={() => setFormError("")}
              className="text-rose-600 text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1 CONTAINER: DEVOTEE & POOJA                                */}
        {/* ================================================================= */}
        {twoStepStage === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* SECTION 1: DEVOTEE SELECTION */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950">
                    1. பக்தர் விவரம் (Devotee)
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDevotee((prev) => !prev)}
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showAddDevotee ? "Close" : "Add"}</span>
                </button>
              </div>

              {/* Devotee Search Bar with Search Icon */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search devotee by name or mobile..."
                  value={devoteeSearch}
                  onChange={(e) => setDevoteeSearch(e.target.value)}
                  className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition"
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
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-950 block">
                    புதிய பக்தரை விரைவாகச் சேர்க்க:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="பக்தர் பெயர் (Name) *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="tel"
                      placeholder="மொபைல் எண் (Mobile)"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ஊர் (City)"
                        value={newCustCity}
                        onChange={(e) => setNewCustCity(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddDevotee}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Devotee 1-Tap Chips */}
              <div>
                <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                  1-Tap Quick Select {devoteeSearch ? `(Results: ${filteredCustomers.length})` : "(அடிக்கடி வரும் பக்தர்கள்):"}
                </span>
                {filteredCustomers.length > 0 ? (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {filteredCustomers.slice(0, 8).map((c) => {
                      const isSelected = selectedCustomerId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedCustomerId(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border shadow-2xs active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{c.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
                    பக்தர் கிடைக்கவில்லை. புதிய பக்தரைச் சேர்க்க மேலே உள்ள <strong>+ Add</strong> கிளிக் செய்யவும்.
                  </div>
                )}
              </div>

              {/* Selected Customer Active Card (Shown only when a devotee is picked) */}
              {selectedCustomer && (
                <div className="bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-3 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {selectedCustomer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        {selectedCustomer.mobile && <span>📱 {selectedCustomer.mobile}</span>}
                        {selectedCustomer.city && <span>📍 {selectedCustomer.city}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCustomerId("")}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                    title="Change Devotee"
                  >
                    மாற்று ✕
                  </button>
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* SECTION 2: POOJA & SAMAGRI CHECKLIST                              */}
            {/* ================================================================= */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shadow-2xs">
                    <Flame className="w-4 h-4 text-emerald-700" />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    2. பூஜை &amp; சாக்கிரிகள் (Pooja &amp; Samagri)
                  </h2>
                </div>

                <Link
                  href="/app/poojas?action=new&returnTo=booking"
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>Add Pooja</span>
                </Link>
              </div>

              {/* 1-Tap Pooja Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {poojas.slice(0, 6).map((p) => {
                  const isSelected = selectedPoojaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPoojaId(p.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between shadow-2xs active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-50 to-emerald-100/90 border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs"
                          : "bg-slate-50/70 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate">
                          {p.englishName}
                        </div>
                        {p.tamilName && (
                          <div className="text-[10.5px] text-emerald-900 font-bold truncate">
                            {p.tamilName}
                          </div>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-900">
                          ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                        </span>
                        {isSelected && (
                          <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-200/80 px-1 py-0.2 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Full Samagri Checklist with In-Place Quantity Adjustment (No Restricted Inner Scroll) */}
              {samagriItems.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between flex-wrap gap-1.5 py-0.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                      <CheckSquare className="w-4 h-4 text-emerald-700" />
                      <span>
                        சாக்கிரிகள் ({samagriItems.filter((i) => i.isChecked !== false).length} / {samagriItems.length} பொருட்கள் தேர்வு)
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      Click + / - to adjust qty
                    </span>
                  </div>

                  {/* Full List rendered cleanly on page without max-h-56 or overflow */}
                  <div className="space-y-1.5">
                    {samagriItems.map((it, idx) => {
                      const isChecked = it.isChecked !== false;
                      return (
                        <div
                          key={it.id}
                          className={`p-2 sm:p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                            isChecked
                              ? "bg-emerald-50/40 border-emerald-300 text-slate-900"
                              : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                          }`}
                        >
                          {/* Toggle Checkbox & Item Name */}
                          <div
                            onClick={() => handleToggleItem(it.id)}
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                          >
                            {isChecked ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-300 shrink-0" />
                            )}
                            <span className="truncate font-semibold text-xs">
                              {idx + 1}. {it.itemEnglishName} {it.itemTamilName ? `(${it.itemTamilName})` : ""}
                            </span>
                          </div>

                          {/* In-Place Quantity Increase / Decrease Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemQuantityChange(it.id, -1);
                              }}
                              disabled={!isChecked}
                              className="w-6 h-6 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 disabled:opacity-30 text-slate-700 flex items-center justify-center font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                              title="Decrease quantity"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              disabled={!isChecked}
                              value={it.quantity}
                              onChange={(e) => handleItemDirectQuantity(it.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-12 text-center text-xs font-bold bg-white border border-slate-200 rounded-lg py-0.5 text-slate-900 focus:outline-none focus:border-emerald-500 shadow-2xs"
                            />
                            <span className="text-[11px] font-bold text-slate-500 min-w-8 text-left truncate">
                              {it.unit || "nos"}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemQuantityChange(it.id, 1);
                              }}
                              disabled={!isChecked}
                              className="w-6 h-6 rounded-lg bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 disabled:opacity-30 text-emerald-900 flex items-center justify-center font-black text-xs transition cursor-pointer active:scale-95 shadow-2xs"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

    {/* ================================================================= */}
    {/* STEP 2 CONTAINER: DATE, PANCHANGAM & DAKSHINA                     */}
    {/* ================================================================= */}
    {twoStepStage === 2 && (
      <div className="space-y-3.5 animate-in fade-in duration-150">
        {/* Step 2 Back & Devotee Summary Card (Responsive, No Overflow) */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setTwoStepStage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Step 1</span>
            </button>
            <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              Step 2 of 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                👤
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Devotee</div>
                <div className="font-extrabold text-slate-900 truncate">{selectedCustomer?.name || "Devotee"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                🔥
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Pooja</div>
                <div className="font-extrabold text-slate-900 truncate">{currentPooja?.englishName || "Pooja"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Dakshina</div>
                <div className="font-extrabold text-slate-900 truncate">₹{amount.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 3: DATE, PANCHANGAM & TIME                                */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <CalendarIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                3. நாள் &amp; சுப நேரம் (Date &amp; Auspicious Time)
              </h2>
            </div>
            <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
              {tamilInfo.formattedDualDate}
            </span>
          </div>

          {/* Interactive 14-Day Horizontal Date Strip */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                தேதித் தேர்வு (1-Tap Select Date):
              </span>
              <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-amber-50 px-2.5 py-1 rounded-xl border border-slate-200 text-amber-900 transition shadow-2xs">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <label className="cursor-pointer text-xs font-bold flex items-center gap-1">
                  <span>Choose Other Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
              {upcomingDays.map((d) => {
                const isSelected = date === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setDate(d.dateStr)}
                    className={`flex-shrink-0 w-16 p-2 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between gap-1 shadow-2xs ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-amber-400/40"
                        : "bg-slate-50/80 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span
                      className={`text-[9.5px] font-bold uppercase ${
                        isSelected ? "text-amber-300" : "text-slate-400"
                      }`}
                    >
                      {d.isToday ? "Today" : d.isTomorrow ? "Tmrw" : d.dayName}
                    </span>
                    <span
                      className={`text-lg font-black leading-none ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {d.dayNum}
                    </span>
                    <span
                      className={`text-[9.5px] font-extrabold ${
                        isSelected ? "text-amber-300" : "text-slate-500"
                      }`}
                    >
                      {d.monthShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Panchangam Details Card */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-3.5 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>📅 {tamilInfo.formattedFullDay || tamilInfo.formattedDualDate}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tamilInfo.tithiTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-200">
                    🌕 {tamilInfo.tithiTa}
                  </span>
                )}
                {tamilInfo.nakshatraNameTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    ⭐ {tamilInfo.nakshatraNameTa}
                  </span>
                )}
              </div>
            </div>

            {/* Nalla Neram / Gowri / Rahu kalam formatted in 12-Hour (AM/PM) */}
            <div className="pt-1.5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/85 p-2 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  🪔 நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-emerald-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.nallaNeram)}
                </span>
              </div>

              <div className="bg-white/85 p-2 rounded-xl border border-amber-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  ✨ கௌரி நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-amber-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.gowriNallaNeram)}
                </span>
              </div>

              <div className="bg-white/85 p-2 rounded-xl border border-rose-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                  ⛔ ராகு காலம்
                </span>
                <span className="text-[11px] font-bold text-rose-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.rahuKalam)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 12-Hour Auspicious Time Selector */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Time (12-Hour AM/PM):
              </span>
              <div className="flex items-center gap-1.5 bg-slate-900 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-black shadow-xs">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{time}</span>
              </div>
            </div>

            {/* 1. Hours Row (1 to 12) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                Hour (1 - 12):
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-xs font-bold">
                {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((h) => {
                  const isSelected = parsedTime.hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateTimeSlot(h, undefined, undefined)}
                      className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-slate-900 text-amber-300 border-slate-900 font-black shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {parseInt(h, 10)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Minutes (15-min intervals) & AM/PM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {/* 15-Minute Intervals */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Minutes (15-min Intervals):
                </span>
                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  {["00", "15", "30", "45"].map((m) => {
                    const isSelected = parsedTime.minute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateTimeSlot(undefined, m, undefined)}
                        className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        :{m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM / PM Period Selection */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Period:
                </span>
                <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => updateTimeSlot(undefined, undefined, "AM")}
                    className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                      parsedTime.period === "AM"
                        ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🌅 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTimeSlot(undefined, undefined, "PM")}
                    className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                      parsedTime.period === "PM"
                        ? "bg-indigo-700 text-white border-indigo-700 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🌙 PM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 4: DAKSHINA & PAYMENT                                     */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                4. கட்டணம் &amp; தட்சணை (Dakshina &amp; Payment)
              </h2>
            </div>
            <span className="text-sm font-black text-slate-900">
              மொத்த கட்டணம்: ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>

          {/* Payment Mode Pills */}
          <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => handlePaymentChoiceChange("UNPAID")}
              className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                paymentChoice === "UNPAID"
                  ? "bg-slate-900 text-amber-300 border-slate-900 font-black shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => handlePaymentChoiceChange("ADVANCE")}
              className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                paymentChoice === "ADVANCE"
                  ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Advance
            </button>
            <button
              type="button"
              onClick={() => handlePaymentChoiceChange("FULL")}
              className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                paymentChoice === "FULL"
                  ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
              }`}
            >
              Paid
            </button>
          </div>

          {paymentChoice === "ADVANCE" && (
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5 animate-in fade-in">
              <label className="text-[11px] font-bold text-emerald-950 block">
                முன்பணத் தொகை (Advance Amount):
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-950">₹</span>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none w-32"
                />
                <span className="text-xs text-slate-500 font-bold">
                  மீதி: ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SECTION 5: PERFORMING PRIEST & VENUE                              */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                5. செய்து வைப்பவர் &amp; இடம் (Priest &amp; Venue)
              </h2>
            </div>
            {priestType === "other" && (
              <button
                type="button"
                onClick={() => {
                  setShowAddPriest(!showAddPriest);
                  setPriestError("");
                }}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddPriest ? "Close" : "Add Priest"}</span>
              </button>
            )}
          </div>

          {/* Performing Priest: Simple Self vs Other Toggle */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Priest Selection:
            </label>

            {/* Clean Segmented Buttons: Self or Other only */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPriestType("self");
                  setAssignedIyerId("self");
                  setShowAddPriest(false);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-black text-center transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  priestType === "self"
                    ? "bg-slate-900 text-amber-300 border-slate-900 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold"
                }`}
              >
                <span>Self</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPriestType("other");
                  if (assignedIyerId === "self") {
                    setAssignedIyerId(members[0]?.id || "");
                  }
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-black text-center transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  priestType === "other"
                    ? "bg-slate-900 text-amber-300 border-slate-900 shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold"
                }`}
              >
                <span>Other</span>
              </button>
            </div>

            {/* If Self: sleek subtle confirmation note */}
            {priestType === "self" && (
              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-semibold animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Priest: <strong>{currentUser?.name || "Ravi Iyer"} (Self)</strong></span>
                </span>
                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full font-bold text-emerald-900">
                  தலைமை குருக்கள்
                </span>
              </div>
            )}

            {/* When "Other" is selected */}
            {priestType === "other" && (
              <div className="p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Choose Priest:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPriest(!showAddPriest);
                      setPriestError("");
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddPriest ? "Close" : "+ Add Priest"}</span>
                  </button>
                </div>

                {members.length > 0 ? (
                  <select
                    value={assignedIyerId}
                    onChange={(e) => setAssignedIyerId(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                  >
                    <option value="" disabled>Choose Priest...</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        👤 {m.name} {m.specialization ? `(${m.specialization})` : ""} {m.mobile ? `• ${m.mobile}` : ""}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-center py-2.5 px-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                    <p className="font-semibold">No other priests registered yet.</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Click "+ Add Priest" to register one.</p>
                  </div>
                )}

                {/* Inline Add Priest Form */}
                {showAddPriest && (
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-300 space-y-2.5 shadow-xs animate-in zoom-in-95">
                    <div className="flex items-center justify-between border-b border-emerald-100 pb-1.5">
                      <div className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Add New Priest</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddPriest(false);
                          setPriestError("");
                        }}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Priest Name *
                        </label>
                        <input
                          type="text"
                          value={newPriestName}
                          onChange={(e) => setNewPriestName(e.target.value)}
                          placeholder="e.g. Sundara Moorthi Iyer"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Mobile (Optional)
                          </label>
                          <input
                            type="tel"
                            value={newPriestMobile}
                            onChange={(e) => setNewPriestMobile(e.target.value)}
                            placeholder="9876543210"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Specialization
                          </label>
                          <input
                            type="text"
                            value={newPriestSpec}
                            onChange={(e) => setNewPriestSpec(e.target.value)}
                            placeholder="Assistant Priest"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      {priestError && (
                        <p className="text-[11px] font-bold text-red-600 bg-red-50 p-1.5 rounded-lg">
                          {priestError}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPriest(false);
                            setPriestError("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddPriest}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Priest</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pooja Location / Venue */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1 uppercase tracking-wider">
              பூஜை நடைபெறும் இடம் (Location / Venue):
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="எ.கா: நாமக்கல் / பக்தர் இல்லம்"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ================================================================= */}
    {/* STICKY BOTTOM BAR FOR STEP 1                                      */}
    {/* ================================================================= */}
    {twoStepStage === 1 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-3 sm:px-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span>👤</span>
              <span className={selectedCustomer ? "text-slate-900 font-extrabold" : "text-amber-700 font-bold"}>
                {selectedCustomer ? selectedCustomer.name : "பக்தரைத் தேர்ந்தெடுக்கவும்"}
              </span>
            </div>
            <div className="text-[10.5px] sm:text-[11px] font-bold truncate flex items-center gap-1.5 mt-0.5">
              <span>🪔</span>
              <span className={currentPooja ? "text-emerald-800 font-black" : "text-slate-500 font-medium"}>
                {currentPooja
                  ? `${currentPooja.englishName} • ₹${(currentPooja.basePrice || 0).toLocaleString("en-IN")}`
                  : "பூஜையைத் தேர்ந்தெடுக்கவும்"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (!selectedCustomerId) {
                setFormError("தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select devotee).");
                return;
              }
              if (!selectedPoojaId) {
                setFormError("தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select pooja).");
                return;
              }
              setFormError("");
              setTwoStepStage(2);
              if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>Next: Date &amp; Dakshina</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>
    )}

    {/* ================================================================= */}
    {/* STICKY BOTTOM BAR FOR STEP 2                                      */}
    {/* ================================================================= */}
    {twoStepStage === 2 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-3 sm:px-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-black text-xs sm:text-sm text-slate-900 truncate">
              👤 {selectedCustomer?.name || "Devotee"} • 🪔 {currentPooja?.englishName || "Pooja"}
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
            type="submit"
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Confirm Booking ✨</span>
          </button>
        </div>
      </div>
    )}
      </form>

      {/* Short & Sweet Booking Preview Modal */}
      {showPreviewModal && selectedCustomer && currentPooja && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-amber-300 overflow-hidden space-y-3.5 p-4 sm:p-5 animate-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shadow-2xs">
                  🪔
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                    Booking Preview (முன்பதிவு சரிபார்ப்பு)
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    விவரங்களைச் சரிபார்த்து உறுதிப்படுத்தவும்
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Details Cards */}
            <div className="space-y-2 text-xs">
              {/* Devotee Info */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                    👤
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">பக்தர் (Devotee)</span>
                    <span className="font-extrabold text-slate-900 truncate block">{selectedCustomer.name}</span>
                  </div>
                </div>
                {selectedCustomer.mobile && (
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">
                    📱 {selectedCustomer.mobile}
                  </span>
                )}
              </div>

              {/* Pooja & Samagri Info */}
              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                    🪔
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">பூஜை சேவை (Pooja)</span>
                    <span className="font-extrabold text-slate-900 truncate block">
                      {currentPooja.englishName} {currentPooja.tamilName ? `(${currentPooja.tamilName})` : ""}
                    </span>
                  </div>
                </div>
                <span className="text-[10.5px] font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                  {samagriItems.filter((i) => i.isChecked !== false).length} பொருட்கள்
                </span>
              </div>

              {/* Date, Auspicious Time & Dual Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">தேதி (Date)</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5">📅 {date}</span>
                  <span className="text-[10px] font-bold text-amber-800 block mt-0.5 truncate">{tamilInfo.formattedDualDate}</span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">சுப நேரம் (Time)</span>
                  <span className="font-extrabold text-emerald-900 block mt-0.5">⏰ {time}</span>
                  <span className="text-[10px] text-slate-500 font-bold block mt-0.5">12-Hour AM/PM</span>
                </div>
              </div>

              {/* Dakshina & Payment Status */}
              <div className="bg-gradient-to-r from-amber-50 to-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">தட்சணை (Dakshina)</span>
                  <span className="text-base font-black text-slate-900">₹{amount.toLocaleString("en-IN")}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">கட்டண நிலை</span>
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                    {paymentChoice === "FULL"
                      ? "முழுத் தொகை (Paid)"
                      : paymentChoice === "ADVANCE"
                      ? `முன்பணம் ₹${advanceAmount}`
                      : "பிறகு செலுத்தப்படும் (Unpaid)"}
                  </span>
                </div>
              </div>

              {/* Location & Iyer */}
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/80 text-[11px] font-semibold text-slate-600 flex items-center justify-between gap-2 flex-wrap">
                <span>📍 இடம்: <strong className="text-slate-900">{location || selectedCustomer.city || "Namakkal"}</strong></span>
                <span>🪔 குருக்கள்: <strong className="text-slate-900">{priestType === "self" ? currentUser?.name || "Ravi Iyer" : members.find(m => m.id === assignedIyerId)?.name || "Assigned Priest"}</strong></span>
              </div>
            </div>

            {/* Actions: Edit vs Confirm */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer active:scale-95"
              >
                ← Edit (திருத்து)
              </button>
              <button
                type="button"
                onClick={handleFinalConfirmBooking}
                className="py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-[#0b2b17] hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Confirm &amp; Book ✨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Modal */}
      {createdBooking && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-emerald-200 overflow-hidden text-center space-y-4 p-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                முன்பதிவு உறுதியானது
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
                <span>{createdBooking.poojaEnglishName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>நாள் &amp; நேரம்:</span>
                <span>{createdBooking.date} • {createdBooking.startTime}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>செய்து வைப்பவர்:</span>
                <span className="text-amber-900 font-extrabold">{createdBooking.assignedIyerName || "Self"}</span>
              </div>
              <div className="flex justify-between font-black text-emerald-900 pt-1 border-t border-slate-200">
                <span>கட்டணம்:</span>
                <span>₹{createdBooking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Send WhatsApp Slip</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/app/bookings/${createdBooking.id}`)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                View Booking
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">ஏற்றுகிறது (Loading)...</div>}>
      <QuickBookingContent />
    </Suspense>
  );
}
