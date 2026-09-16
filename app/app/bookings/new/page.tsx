"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Booking, BookingItem, Customer, Pooja } from "@/lib/types";
import {
  normalizeIndianMobile,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "@/lib/utils/phone";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Flame,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  IndianRupee,
  AlertTriangle,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Edit2,
  Trash2,
  Clipboard,
  Search,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";
import {
  getTamilDate,
  formatTimeRangeTo12H,
  getLocalDateString,
  TamilDateInfo,
} from "@/lib/calendar/tamil";

const TIME_PRESETS = [
  { time: "06:00 AM", label: "06:00 AM", tag: "Brahma Muhurtham" },
  { time: "07:00 AM", label: "07:00 AM", tag: "Morning" },
  { time: "08:00 AM", label: "08:00 AM", tag: "Morning" },
  { time: "09:30 AM", label: "09:30 AM", tag: "Morning" },
  { time: "11:00 AM", label: "11:00 AM", tag: "Mid-day" },
  { time: "04:30 PM", label: "04:30 PM", tag: "Evening" },
  { time: "06:00 PM", label: "06:00 PM", tag: "Sandhya / Pradosham" },
  { time: "07:30 PM", label: "07:30 PM", tag: "Night" },
];

function NewBookingWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || getLocalDateString();
  const initialPoojaId = searchParams.get("poojaId");
  const initialCustomerId = searchParams.get("customerId");
  const initialTime = searchParams.get("time");

  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // State initialization
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const members = useMemo(() => db.getMembers(businessId), [businessId]);
  const existingBookings = useMemo(() => db.getBookings(businessId), [businessId]);

  useEffect(() => {
    setPoojas(db.getPoojas(businessId));
    setCustomers(db.getCustomers(businessId));
  }, [businessId]);

  // Wizard Step (1: Devotee, 2: Pooja & Samagri, 3: Date & Time, 4: Summary & Confirm)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [customerId, setCustomerId] = useState<string>(initialCustomerId || "");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");
  const [poojaId, setPoojaId] = useState<string>(initialPoojaId || "");
  const [date, setDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>(initialTime || "07:00 AM");
  const [location, setLocation] = useState<string>("Namakkal");
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("UPI");
  const [assignedIyerId, setAssignedIyerId] = useState<string>(members[0]?.id || "");
  const [notes, setNotes] = useState<string>("");
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);
  const [newSamagriName, setNewSamagriName] = useState<string>("");

  // Error & Confirmation feedback
  const [stepError, setStepError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Add Devotee Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustNotes, setNewCustNotes] = useState<string>("");
  const [custModalError, setCustModalError] = useState<string>("");

  // Selected Objects
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );
  const selectedPooja = useMemo(
    () => poojas.find((p) => p.id === poojaId),
    [poojas, poojaId]
  );

  // Set default pooja checklist items whenever pooja is selected
  useEffect(() => {
    if (selectedPooja) {
      setAmount(selectedPooja.basePrice || 5000);
      if (selectedPooja.items && selectedPooja.items.length > 0) {
        setSamagriItems(
          selectedPooja.items.map((item, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            bookingId: "",
            itemEnglishName: item.itemEnglishName || "Samagri Item",
            itemTamilName: item.itemTamilName || item.itemEnglishName || "பூஜை பொருள்",
            quantity: item.quantity || 1,
            unit: item.unit || "units",
            isChecked: false,
            sortOrder: idx,
          }))
        );
      } else {
        // Fallback default Vedic samagri
        setSamagriItems([
          { id: "s-1", bookingId: "", itemEnglishName: "Cow Ghee", itemTamilName: "பசு நெய்", quantity: 1, unit: "kg", isChecked: false },
          { id: "s-2", bookingId: "", itemEnglishName: "Homa Samithu", itemTamilName: "சமித்து கட்டுகள்", quantity: 2, unit: "bundles", isChecked: false },
          { id: "s-3", bookingId: "", itemEnglishName: "Turmeric & Kumkum", itemTamilName: "மஞ்சள், குங்குமம்", quantity: 1, unit: "set", isChecked: false },
          { id: "s-4", bookingId: "", itemEnglishName: "Betel Leaves & Nuts", itemTamilName: "வெற்றிலை, பாக்கு", quantity: 25, unit: "leaves", isChecked: false },
          { id: "s-5", bookingId: "", itemEnglishName: "Fresh Coconuts", itemTamilName: "தேங்காய்", quantity: 5, unit: "nos", isChecked: false },
          { id: "s-6", bookingId: "", itemEnglishName: "Pooja Flowers & Garland", itemTamilName: "பூக்கள் & மாலை", quantity: 1, unit: "set", isChecked: false },
        ]);
      }
    }
  }, [selectedPooja]);

  // Generate 30 scrollable upcoming dates starting from today
  const upcomingDatesList = useMemo(() => {
    const list: { dateStr: string; info: TamilDateInfo }[] = [];
    const baseDate = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${y}-${m}-${day}`;
      const info = getTamilDate(dateStr);
      list.push({ dateStr, info });
    }
    return list;
  }, []);

  // Panchangam for currently selected date
  const selectedDateInfo = useMemo(() => getTamilDate(date), [date]);

  // Double-booking / Conflict detection
  const conflictingBookings = useMemo(() => {
    if (!date || !startTime) return [];
    return existingBookings.filter(
      (b) =>
        b.date === date &&
        b.startTime?.toLowerCase().trim() === startTime.toLowerCase().trim() &&
        b.status !== "CANCELLED"
    );
  }, [existingBookings, date, startTime]);

  // Filtered customer list for search
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Handle Quick Add Customer
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustModalError("");

    if (!newCustName.trim()) {
      setCustModalError("Devotee name is required.");
      return;
    }

    let normalizedMobile = "";
    if (newCustMobile.trim()) {
      const cleanDigits = newCustMobile.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        setCustModalError("Please enter a valid 10-digit mobile number or leave blank.");
        return;
      }
      normalizedMobile = normalizeIndianMobile(cleanDigits);
    }

    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: normalizedMobile,
      city: newCustCity.trim() || "Namakkal",
      address: newCustAddress.trim(),
      notes: newCustNotes.trim(),
    });

    const updated = db.getCustomers(businessId);
    setCustomers(updated);
    setCustomerId(created.id);
    setShowAddCustomerModal(false);
    setNewCustName("");
    setNewCustMobile("");
    setNewCustAddress("");
    setNewCustNotes("");
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setStepError("");
    if (currentStep === 1) {
      if (!customerId) {
        setStepError("Please select a devotee to proceed to the next step.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!poojaId) {
        setStepError("Please choose a Pooja / Homam ritual to proceed.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!date) {
        setStepError("Please select a booking date.");
        return;
      }
      if (!startTime) {
        setStepError("Please select a pooja start time.");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setStepError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Final Booking Creation
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");

    if (!customerId) {
      setStepError("Devotee is missing. Please return to Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!poojaId) {
      setStepError("Pooja is missing. Please return to Step 2.");
      setCurrentStep(2);
      return;
    }
    if (!date || !startTime) {
      setStepError("Date or time is missing. Please return to Step 3.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const balance = Math.max(0, amount - advanceAmount);
      const paymentStatus =
        balance === 0
          ? "PAID"
          : advanceAmount > 0
          ? "PARTIALLY_PAID"
          : "PENDING";

      const createdBooking = db.createBooking({
        businessId,
        customerId,
        customerName: selectedCustomer?.name || "Devotee",
        customerMobile: selectedCustomer?.mobile || "",
        customerAddress: selectedCustomer?.address || "",
        poojaId,
        poojaEnglishName: selectedPooja?.englishName || "Pooja",
        poojaTamilName: selectedPooja?.tamilName || "",
        date,
        startTime,
        endTime: startTime,
        durationMinutes: selectedPooja?.durationMinutes || 120,
        location: location.trim() || selectedCustomer?.city || "Namakkal",
        totalAmount: Number(amount) || 0,
        advanceAmount: Number(advanceAmount) || 0,
        balanceAmount: balance,
        paymentStatus,
        status: "CONFIRMED",
        assignedIyerId: assignedIyerId || members[0]?.id || "u-ravi-iyer-01",
        assignedIyerName:
          members.find((m) => m.id === assignedIyerId)?.name ||
          members[0]?.name ||
          "Ravi Iyer",
        items: samagriItems,
        notes: notes.trim(),
      });

      router.push(`/app/bookings/${createdBooking.id}?created=true`);
    } catch (err: any) {
      console.error(err);
      setStepError(err.message || "Failed to create booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Toggle Samagri check item
  const handleToggleSamagri = (id: string) => {
    setSamagriItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  // Add custom samagri item
  const handleAddCustomSamagri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSamagriName.trim()) return;
    setSamagriItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        bookingId: "",
        itemEnglishName: newSamagriName.trim(),
        itemTamilName: newSamagriName.trim(),
        quantity: 1,
        unit: "items",
        isChecked: false,
      },
    ]);
    setNewSamagriName("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app/bookings"
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-tight">
              New Pooja Booking
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              Step {currentStep} of 4 • {currentStep === 1 && "Select Devotee"}
              {currentStep === 2 && "Choose Pooja & Samagri"}
              {currentStep === 3 && "Date, Time & Muhurtham"}
              {currentStep === 4 && "Summary & Confirmation"}
            </p>
          </div>
        </div>

        <Link
          href="/app/bookings"
          className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
        >
          Cancel
        </Link>
      </div>

      {/* Step Progress Bar (1, 2, 3, 4) */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: "1. Devotee", subtitle: "பக்தர்" },
            { step: 2, title: "2. Pooja", subtitle: "ஹோமம்" },
            { step: 3, title: "3. Schedule", subtitle: "தேதி & நேரம்" },
            { step: 4, title: "4. Confirm", subtitle: "உறுதி செய்" },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  // Allow going back to previous completed steps
                  if (s.step < currentStep) {
                    setCurrentStep(s.step as any);
                  }
                }}
                disabled={s.step > currentStep}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                  isCurrent
                    ? "bg-amber-500 text-white font-black shadow-xs ring-2 ring-amber-400/40"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 cursor-pointer"
                    : "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-black">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span>{s.step}</span>
                  )}
                  <span className="hidden sm:inline">{s.title.split(". ")[1]}</span>
                </div>
                <div className={`text-[10px] mt-0.5 font-medium ${isCurrent ? "text-amber-100" : "text-slate-500"}`}>
                  {s.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Error Banner */}
      {stepError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: DEVOTEE SELECTION                                                 */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-3.5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" /> 1. Select Devotee (பக்தரைத் தேர்வு செய்க)
              </h2>
              <p className="text-xs text-slate-500">
                Pick an existing customer or add a new devotee instantly.
              </p>
            </div>
            <button
              type="button"
              id="quickAddDevoteeBtn"
              onClick={() => {
                setCustModalError("");
                setShowAddCustomerModal(true);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>+ Add Devotee</span>
            </button>
          </div>

          {/* Active Selected Devotee Card */}
          {selectedCustomer ? (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 p-4 rounded-2xl border-2 border-amber-400 shadow-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-slate-900 truncate">
                      {selectedCustomer.name}
                    </h3>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-850 px-2 py-0.2 rounded-full border border-emerald-300">
                      Selected ✓
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                    {selectedCustomer.mobile ? (
                      <span className="flex items-center gap-1 font-semibold text-slate-800">
                        <Phone className="w-3 h-3 text-slate-400" /> {selectedCustomer.mobile}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No phone</span>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3 text-slate-400" /> {selectedCustomer.city || "Namakkal"}
                    </span>
                  </div>
                  {selectedCustomer.notes && (
                    <p className="text-[11px] text-amber-900 mt-1 truncate">
                      🔖 {selectedCustomer.notes}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCustomerId("")}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shrink-0 transition"
              >
                Change
              </button>
            </div>
          ) : (
            /* Search & Select Devotee list */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search devotee by name, phone (+91), city..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Devotees Grid */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredCustomers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500">
                      No devotee found for &quot;{customerSearchQuery}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustName(customerSearchQuery);
                        setCustModalError("");
                        setShowAddCustomerModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Add &quot;{customerSearchQuery}&quot; as New Devotee</span>
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setCustomerId(c.id)}
                      className="bg-white hover:bg-amber-50/70 p-3 rounded-2xl border border-slate-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-amber-200 text-slate-700 group-hover:text-amber-900 flex items-center justify-center font-bold text-sm shrink-0 transition">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {c.mobile ? <span>📱 {c.mobile}</span> : <span className="italic">No phone</span>}
                            <span>•</span>
                            <span>📍 {c.city || "Tamil Nadu"}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1 bg-slate-100 group-hover:bg-amber-500 text-slate-700 group-hover:text-white rounded-lg text-xs font-bold shrink-0 transition"
                      >
                        Select →
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-3">
            <button
              type="button"
              id="step1NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Continue to Step 2: Choose Pooja</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: POOJA & SAMAGRI SELECTION                                         */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" /> 2. Choose Pooja & Samagri (பூஜை & ஹோமம்)
              </h2>
              <p className="text-xs text-slate-500">
                Select ritual ceremony, verify samagri items, or set custom pricing.
              </p>
            </div>
          </div>

          {/* Pooja Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {poojas.map((p) => {
              const isSelected = poojaId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setPoojaId(p.id)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-r from-amber-50 to-amber-100/60 border-2 border-amber-500 shadow-sm"
                      : "bg-white border-slate-200 hover:border-amber-300 shadow-2xs"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-900 leading-snug">
                          {p.englishName}
                        </h3>
                        {p.tamilName && p.tamilName !== p.englishName && (
                          <div className="text-[11px] font-semibold text-amber-800 mt-0.5">
                            {p.tamilName}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-black text-amber-900 shrink-0">
                        ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                      </span>
                    </div>

                    {p.description && (
                      <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                    <span>⏳ {p.durationMinutes || 120} mins</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                        isSelected
                          ? "bg-amber-500 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {isSelected ? "Selected ✓" : "Choose"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Samagri Checklist Section */}
          {selectedPooja && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-extrabold text-slate-900">
                    Samagri Checklist ({samagriItems.length} items for {selectedPooja.englishName})
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  Click to check off
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                {samagriItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleSamagri(item.id)}
                    className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition ${
                      item.isChecked
                        ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 line-through opacity-70"
                        : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.isChecked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className="truncate font-semibold">{item.itemEnglishName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Samagri Input */}
              <form onSubmit={handleAddCustomSamagri} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newSamagriName}
                  onChange={(e) => setNewSamagriName(e.target.value)}
                  placeholder="Add custom item (e.g. 10 Bananas / பழங்கள்)..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0 transition"
                >
                  + Add Item
                </button>
              </form>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step2NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Continue to Step 3: Date & Time</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DATE & TIME + CONFLICT WARNING                                    */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-amber-600" /> 3. Schedule Date & Auspicious Time (தேதி & நேரம்)
            </h2>
            <p className="text-xs text-slate-500">
              Pick date from scroll strip or calendar, choose time slot, and check Panchangam.
            </p>
          </div>

          {/* Horizontal Date Scroll Strip */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-slate-800 block">
              Quick Date Select (அடுத்த 30 நாட்கள்)
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
              {upcomingDatesList.map((item) => {
                const isSelected = date === item.dateStr;
                const isToday = item.dateStr === getLocalDateString();
                const d = new Date(item.dateStr);
                const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
                const dayNumber = d.getDate();
                const monthName = d.toLocaleDateString("en-US", { month: "short" });

                return (
                  <button
                    key={item.dateStr}
                    type="button"
                    onClick={() => setDate(item.dateStr)}
                    className={`min-w-[74px] p-2.5 rounded-2xl border text-center transition shrink-0 flex flex-col items-center justify-between ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40"
                        : "bg-white border-slate-200 hover:border-amber-300 text-slate-800"
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase ${isSelected ? "text-amber-100" : "text-slate-400"}`}>
                      {isToday ? "Today" : dayName}
                    </span>
                    <span className="text-base font-black my-0.5">
                      {dayNumber} {monthName}
                    </span>
                    <div className={`text-[9.5px] font-bold truncate max-w-[66px] ${isSelected ? "text-amber-100" : "text-amber-800"}`}>
                      {item.info.tamilMonth} {item.info.tamilDay}
                    </div>

                    {/* Sacred Event Badge */}
                    {item.info.specialDayIcon && (
                      <span className="text-xs mt-1" title={item.info.specialDayTag || "Sacred Day"}>
                        {item.info.specialDayIcon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standard Date Picker Alternative */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-slate-400" />
              <span>Or Choose Custom Date:</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Time Slot Selection */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Select Start Time (நேரம்):</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_PRESETS.map((t) => {
                const isSelected = startTime === t.time;
                return (
                  <button
                    key={t.time}
                    type="button"
                    onClick={() => setStartTime(t.time)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                    }`}
                  >
                    <span className="font-black text-xs">{t.label}</span>
                    <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? "text-amber-400" : "text-slate-500"}`}>
                      {t.tag}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Time Selector */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500 font-medium">Custom Time:</span>
              <input
                type="text"
                placeholder="e.g. 05:45 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-900 w-32 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* ⚠️ DOUBLE BOOKING / CONFLICT WARNING CARD */}
          {conflictingBookings.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-2xl space-y-2 animate-in shake duration-200">
              <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>⚠️ Time Slot Conflict ({conflictingBookings.length} existing booking scheduled)</span>
              </div>
              <div className="space-y-1 text-xs text-rose-950 bg-white/80 p-2.5 rounded-xl border border-rose-200">
                {conflictingBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      {b.bookingNumber} • {b.customerName} ({b.poojaEnglishName})
                    </span>
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2 py-0.2 rounded">
                      {b.startTime}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-rose-700 leading-tight">
                You can still proceed if multiple priests will attend, or select a different time slot above.
              </p>
            </div>
          )}

          {/* Panchangam & Auspicious Timings Card */}
          <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-amber-50/50 p-3.5 rounded-2xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {selectedDateInfo.formattedDualDate} ({selectedDateInfo.dayOfWeekEn})
              </span>
              <span className="text-[11px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                {selectedDateInfo.tithiTa} • {selectedDateInfo.nakshatraNameTa}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-emerald-700 font-bold block">✨ நல்ல நேரம் (Nalla Neram):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.nallaNeram}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-amber-800 font-bold block">🪔 கௌரி (Gowri Nalla Neram):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.gowriNallaNeram}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-rose-700 font-bold block">⛔ ராகு காலம் (Rahu Kalam):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.rahuKalam}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-purple-700 font-bold block">⌛ குளிகை (Kuligai):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.kuligai}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step3NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Continue to Step 4: Summary & Confirm</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: SUMMARY, PAYMENT & FINAL CONFIRMATION                            */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <form onSubmit={handleCreateBooking} className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 4. Review Summary & Confirm Booking
            </h2>
            <p className="text-xs text-slate-500">
              Verify ceremony details, set advance/balance payments, and assign priest.
            </p>
          </div>

          {/* Booking Overview Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">Pooja Ceremony</span>
                <h3 className="font-black text-sm text-slate-900">
                  {selectedPooja?.englishName} {selectedPooja?.tamilName && `(${selectedPooja.tamilName})`}
                </h3>
              </div>
              <span className="text-base font-black text-amber-900">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Devotee</span>
                <span className="font-bold text-slate-900">{selectedCustomer?.name}</span>
                <span className="text-[11px] text-slate-500 block">📱 {selectedCustomer?.mobile || "No phone"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block">Date & Time</span>
                <span className="font-bold text-slate-900">📅 {date}</span>
                <span className="text-[11px] text-slate-500 block">⏰ {startTime}</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown & Advance Input */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Payment Breakdown
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Total Pooja Fee (₹)
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-emerald-700 block mb-1">
                  Advance Paid (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  max={amount}
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-black text-emerald-800 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <label className="text-[10px] font-bold text-amber-800 block mb-1">
                  Balance Due (₹)
                </label>
                <div className="text-xs font-black text-amber-900 py-1.5">
                  ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-600 font-semibold">Payment Mode:</span>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1 text-xs font-bold text-slate-900 focus:outline-none"
              >
                <option value="UPI">UPI / Google Pay</option>
                <option value="CASH">Cash in Hand</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>
          </div>

          {/* Priest Assignment & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Assign Priest (செய்து வைக்கும் குருக்கள்)
              </label>
              <select
                value={assignedIyerId}
                onChange={(e) => setAssignedIyerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.role === "OWNER" ? "Lead Priest" : "Associate"})
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Ceremony Location / Venue (இடம்)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Namakkal / Devotee Residence"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes & Special Instructions */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Sankalpam Notes / Gothram / Nakshatram (குறிப்புகள்)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Koundinya Gothram, Rohini Nakshatram, 4 family members"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Final Action Buttons */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="confirmAndCreateBookingBtn"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-black shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isSubmitting ? "Creating Booking..." : "Confirm & Create Booking"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD DEVOTEE MODAL                                                   */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Add New Devotee</h3>
                  <p className="text-[10px] text-slate-500">Will be instantly selected for this booking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {custModalError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{custModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Devotee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(cleanPastedIndianMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Namakkal"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Street / Area"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notes (Gothram / Nakshatram)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Koundinya, Rohini"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-medium">
          Loading booking wizard...
        </div>
      }
    >
      <NewBookingWizardForm />
    </Suspense>
  );
}
