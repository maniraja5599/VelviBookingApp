"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Booking, BookingItem, Customer } from "@/lib/types";
import { normalizeIndianMobile } from "@/lib/utils/phone";
import {
  ArrowLeft,
  User,
  Flame,
  Calendar,
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
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";

const PRESET_POOJA_TEMPLATES = [
  {
    icon: "🐘",
    englishName: "Ganapathi Homam",
    tamilName: "கணபதி ஹோமம்",
    description: "Invokes Lord Ganesha for removing obstacles, beginnings & prosperity.",
    durationMinutes: 120,
    basePrice: 5000,
  },
  {
    icon: "🪔",
    englishName: "Maha Sudarshana Homam",
    tamilName: "மகா சுதர்சன ஹோமம்",
    description: "Powerful Vedic ritual for protection against negative forces, health & victory.",
    durationMinutes: 180,
    basePrice: 7500,
  },
  {
    icon: "🌿",
    englishName: "Rudrabhishekam & Homam",
    tamilName: "ருத்ராபிஷேகம் & ஹோமம்",
    description: "Sacred abhishekam with Sri Rudram chanting for inner peace, health and longevity.",
    durationMinutes: 150,
    basePrice: 6000,
  },
  {
    icon: "🏠",
    englishName: "Gruhapravesam & Vastu Homam",
    tamilName: "கிரகப்பிரவேசம் & வாஸ்து ஹோமம்",
    description: "Traditional house-warming ritual invoking Vastu Purusha, Ganapathi & Lakshmi.",
    durationMinutes: 240,
    basePrice: 12000,
  },
  {
    icon: "🪐",
    englishName: "Navagraha Homam",
    tamilName: "நவகிரக ஹோமம்",
    description: "Appeases the nine celestial planetary deities for dosha nivarthi and prosperity.",
    durationMinutes: 180,
    basePrice: 8000,
  },
  {
    icon: "🪙",
    englishName: "Maha Lakshmi Kubera Pooja",
    tamilName: "மகா லக்ஷ்மி குபேர பூஜை",
    description: "Divine pooja invoking Goddess Lakshmi & Lord Kubera for wealth and debt removal.",
    durationMinutes: 90,
    basePrice: 4500,
  },
  {
    icon: "🌸",
    englishName: "Sri Satyanarayana Pooja",
    tamilName: "ஸ்ரீ சத்யநாராயண பூஜை",
    description: "Sacred full-moon / pournami pooja with 5-chapter katha & prasad for family welfare.",
    durationMinutes: 120,
    basePrice: 4000,
  },
  {
    icon: "👶",
    englishName: "Ayush Homam / Sashtiapthapoorthi",
    tamilName: "ஆயுஷ் ஹோமம் / சஷ்டியப்தபூர்த்தி",
    description: "Vedic ceremony for child's 1st birthday or 60th / 80th anniversary for long life & health.",
    durationMinutes: 240,
    basePrice: 10000,
  },
];

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || getLocalDateString();
  const initialPoojaId = searchParams.get("poojaId");
  const initialTime = searchParams.get("time");

  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [poojas, setPoojas] = useState(db.getPoojas(businessId));
  const [customers, setCustomers] = useState<Customer[]>(db.getCustomers(businessId));
  const members = db.getMembers(businessId);

  // Initial selected pooja
  const selectedInitialPooja =
    (initialPoojaId ? poojas.find((p) => p.id === initialPoojaId) : null) || poojas[0];

  // Form State
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || "");
  const [poojaId, setPoojaId] = useState<string>(selectedInitialPooja?.id || "");
  const [date, setDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>(initialTime || "08:00 AM");
  const [location, setLocation] = useState<string>("Namakkal");
  const [amount, setAmount] = useState<number>(selectedInitialPooja?.basePrice || 5000);
  const [assignedIyerId, setAssignedIyerId] = useState<string>(members[0]?.id || "");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  // Instant Pooja Add/Edit/Delete States
  const [showPoojaModal, setShowPoojaModal] = useState<boolean>(false);
  const [isEditingPooja, setIsEditingPooja] = useState<boolean>(false);
  const [poojaFormId, setPoojaFormId] = useState<string>("");
  const [poojaFormEnglish, setPoojaFormEnglish] = useState<string>("");
  const [poojaFormTamil, setPoojaFormTamil] = useState<string>("");
  const [poojaFormPrice, setPoojaFormPrice] = useState<number>(5000);
  const [poojaFormDuration, setPoojaFormDuration] = useState<number>(120);
  const [poojaFormDesc, setPoojaFormDesc] = useState<string>("");
  const [poojaModalError, setPoojaModalError] = useState<string>("");
  const [poojaSuccessMessage, setPoojaSuccessMessage] = useState<string>("");
  const [poojaToDelete, setPoojaToDelete] = useState<typeof poojas[0] | null>(null);

  // Quick Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustNotes, setNewCustNotes] = useState<string>("");
  const [custModalError, setCustModalError] = useState<string>("");
  const [customerAddedSuccess, setCustomerAddedSuccess] = useState<string>("");

  const applyInstantPoojaPreset = (preset: (typeof PRESET_POOJA_TEMPLATES)[0]) => {
    setPoojaFormEnglish(preset.englishName);
    setPoojaFormTamil(preset.tamilName);
    setPoojaFormPrice(preset.basePrice);
    setPoojaFormDuration(preset.durationMinutes);
    setPoojaFormDesc(preset.description);
  };

  const handleOpenAddPooja = () => {
    setIsEditingPooja(false);
    setPoojaFormId("");
    const def = PRESET_POOJA_TEMPLATES[0];
    setPoojaFormEnglish(def.englishName);
    setPoojaFormTamil(def.tamilName);
    setPoojaFormPrice(def.basePrice);
    setPoojaFormDuration(def.durationMinutes);
    setPoojaFormDesc(def.description);
    setPoojaModalError("");
    setShowPoojaModal(true);
  };

  const handleOpenEditPooja = (p: typeof poojas[0]) => {
    setIsEditingPooja(true);
    setPoojaFormId(p.id);
    setPoojaFormEnglish(p.englishName);
    setPoojaFormTamil(p.tamilName || "");
    setPoojaFormPrice(p.basePrice || 0);
    setPoojaFormDuration(p.durationMinutes || 120);
    setPoojaFormDesc(p.description || "");
    setPoojaModalError("");
    setShowPoojaModal(true);
  };

  const handleSavePooja = (e: React.FormEvent) => {
    e.preventDefault();
    setPoojaModalError("");

    if (!poojaFormEnglish.trim()) {
      setPoojaModalError("Pooja English Name is required.");
      return;
    }

    if (isEditingPooja && poojaFormId) {
      db.updatePooja(poojaFormId, {
        englishName: poojaFormEnglish.trim(),
        tamilName: poojaFormTamil.trim() || poojaFormEnglish.trim(),
        basePrice: Number(poojaFormPrice) || 0,
        durationMinutes: Number(poojaFormDuration) || 120,
        description: poojaFormDesc.trim(),
      });
      const updatedList = db.getPoojas(businessId);
      setPoojas(updatedList);
      setAmount(Number(poojaFormPrice) || 0);
      setShowPoojaModal(false);
      setPoojaSuccessMessage(`Updated "${poojaFormEnglish.trim()}"!`);
    } else {
      const created = db.createPooja({
        businessId,
        englishName: poojaFormEnglish.trim(),
        tamilName: poojaFormTamil.trim() || poojaFormEnglish.trim(),
        basePrice: Number(poojaFormPrice) || 0,
        durationMinutes: Number(poojaFormDuration) || 120,
        description: poojaFormDesc.trim(),
      });
      const updatedList = db.getPoojas(businessId);
      setPoojas(updatedList);
      setPoojaId(created.id);
      setAmount(created.basePrice);
      setShowPoojaModal(false);
      setPoojaSuccessMessage(`Added & selected "${created.englishName}"!`);
    }

    setTimeout(() => setPoojaSuccessMessage(""), 4000);
  };

  const handleConfirmDeletePooja = () => {
    if (!poojaToDelete) return;
    db.deletePooja(poojaToDelete.id);
    const updatedList = db.getPoojas(businessId);
    setPoojas(updatedList);
    if (poojaId === poojaToDelete.id) {
      const nextPooja = updatedList[0];
      if (nextPooja) {
        setPoojaId(nextPooja.id);
        setAmount(nextPooja.basePrice);
      } else {
        setPoojaId("");
        setAmount(0);
      }
    }
    setPoojaSuccessMessage(`Deleted "${poojaToDelete.englishName}"!`);
    setPoojaToDelete(null);
    setTimeout(() => setPoojaSuccessMessage(""), 4000);
  };

  const handleQuickAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustModalError("");

    if (!newCustName.trim() || !newCustMobile.trim()) {
      setCustModalError("Name and Mobile number are required.");
      return;
    }

    const normalizedMobile = normalizeIndianMobile(newCustMobile);
    if (customers.some((c) => normalizeIndianMobile(c.mobile) === normalizedMobile)) {
      setCustModalError("A customer with this phone number already exists.");
      return;
    }

    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: normalizedMobile,
      city: newCustCity.trim() || "Namakkal",
      address: newCustAddress.trim(),
      notes: newCustNotes.trim(),
    });

    const updatedList = db.getCustomers(businessId);
    setCustomers(updatedList);
    setCustomerId(created.id);
    setShowAddCustomerModal(false);
    setCustomerAddedSuccess(`Added & selected "${created.name}"!`);
    setNewCustName("");
    setNewCustMobile("");
    setNewCustAddress("");
    setNewCustNotes("");
    setTimeout(() => setCustomerAddedSuccess(""), 4000);
  };

  const handlePoojaChange = (newPoojaId: string) => {
    if (newPoojaId === "__NEW_POOJA__") {
      handleOpenAddPooja();
      return;
    }
    setPoojaId(newPoojaId);
    const selectedPooja = poojas.find((p) => p.id === newPoojaId);
    if (selectedPooja) {
      setAmount(selectedPooja.basePrice);
    }
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const selectedPooja = poojas.find((p) => p.id === poojaId);
    const selectedCustomer = customers.find((c) => c.id === customerId);
    const selectedIyer = members.find((m) => m.id === assignedIyerId);

    if (!selectedPooja || !selectedCustomer) {
      setError("Please select both a Pooja and a Customer.");
      return;
    }

    // Conflict Check (Point 33)
    if (assignedIyerId) {
      const conflict = db.checkIyerConflict({
        businessId,
        iyerId: assignedIyerId,
        date,
        startTime,
        durationMinutes: selectedPooja.durationMinutes || 120,
      });

      if (conflict.hasConflict) {
        setError(conflict.reason || "This Iyer already has a booking during this time.");
        return;
      }
    }

    // Inherit default items from pooja template
    const bookingItems: BookingItem[] = (selectedPooja.items || []).map((item, idx) => ({
      id: `bi-${Date.now()}-${idx}`,
      bookingId: `b-${Date.now()}`,
      itemEnglishName: item.itemEnglishName,
      itemTamilName: item.itemTamilName,
      quantity: item.quantity,
      unit: item.unit,
      isChecked: false,
    }));

    const newBooking: Booking = {
      id: `b-${Date.now()}`,
      bookingNumber: `#${Math.floor(8000 + Math.random() * 1999)}`,
      businessId,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      customerMobile: selectedCustomer.mobile,
      customerAddress: selectedCustomer.address,
      poojaId: selectedPooja.id,
      poojaEnglishName: selectedPooja.englishName,
      poojaTamilName: selectedPooja.tamilName,
      assignedIyerId: selectedIyer?.id,
      assignedIyerName: selectedIyer?.name,
      date,
      startTime,
      endTime: "10:30 AM",
      durationMinutes: selectedPooja.durationMinutes,
      location,
      status: "CONFIRMED",
      totalAmount: Number(amount),
      advanceAmount: 0,
      balanceAmount: Number(amount),
      paymentStatus: "PENDING",
      notes,
      items: bookingItems,
      createdBy: currentUser?.id || "u-ravi-iyer-01",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.bookings.unshift(newBooking);

    // Record audit
    db.auditLogs.push({
      id: `audit-${Date.now()}`,
      businessId,
      actorName: currentUser?.name || "Ravi Iyer",
      action: "BOOKING_CREATED",
      targetType: "BOOKING",
      targetId: newBooking.id,
      newValue: { bookingNumber: newBooking.bookingNumber, pooja: newBooking.poojaEnglishName },
      reason: "Created via quick booking screen",
      createdAt: new Date().toISOString(),
    });

    router.push(`/app/bookings/${newBooking.id}`);
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/bookings"
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-base font-bold text-velvi-brownDark">New Booking</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCreateBooking} className="space-y-3.5">
        {/* Customer Selector */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-velvi-gold" /> Customer
            </label>
            <button
              type="button"
              onClick={() => {
                setCustModalError("");
                setShowAddCustomerModal(true);
              }}
              className="px-2.5 py-1 bg-velvi-gold/15 hover:bg-velvi-gold/25 text-velvi-brownDark border border-velvi-gold/30 rounded-lg text-xs font-bold flex items-center gap-1 transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 text-velvi-goldDark stroke-[3]" />
              <span>Add Customer</span>
            </button>
          </div>

          <select
            value={customerId}
            onChange={(e) => {
              if (e.target.value === "__NEW__") {
                setCustModalError("");
                setShowAddCustomerModal(true);
              } else {
                setCustomerId(e.target.value);
              }
            }}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobile}) - {c.city || "Tamil Nadu"}
              </option>
            ))}
            <option value="__NEW__">+ Add New Customer...</option>
          </select>

          {customerAddedSuccess && (
            <div className="text-[11px] font-bold text-velvi-sacredGreen flex items-center gap-1 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{customerAddedSuccess}</span>
            </div>
          )}
        </div>

        {/* Pooja Selector */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-velvi-gold" /> Pooja / Homam (பூஜை / ஹோமம்)
            </label>
            <button
              type="button"
              onClick={handleOpenAddPooja}
              className="text-[11px] font-bold text-velvi-maroon hover:text-velvi-gold flex items-center gap-1 bg-velvi-cream/70 hover:bg-velvi-cream px-2 py-0.5 rounded-lg border border-velvi-gold/20 transition active:scale-95"
            >
              <Plus className="w-3 h-3" /> புதிய பூஜை சேர்
            </button>
          </div>

          <select
            value={poojaId}
            onChange={(e) => handlePoojaChange(e.target.value)}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
          >
            {poojas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.englishName} {p.tamilName && p.tamilName !== p.englishName ? `(${p.tamilName})` : ""} — ₹{p.basePrice?.toLocaleString()}
              </option>
            ))}
            <option value="__NEW_POOJA__">+ Add New Pooja / புதிய பூஜை சேர்...</option>
          </select>

          {/* Active Selected Pooja Details & Instant Actions */}
          {(() => {
            const activePooja = poojas.find((p) => p.id === poojaId);
            if (!activePooja) return null;
            return (
              <div className="bg-gradient-to-r from-velvi-cream/60 via-amber-50/40 to-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/30 flex items-center justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-velvi-brownDark truncate flex items-center gap-1.5">
                    <span>{activePooja.englishName}</span>
                    {activePooja.tamilName && activePooja.tamilName !== activePooja.englishName && (
                      <span className="text-[11px] font-medium text-velvi-maroon truncate">({activePooja.tamilName})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-velvi-brown mt-0.5">
                    <span className="font-bold text-velvi-maroon">₹{activePooja.basePrice?.toLocaleString()}</span>
                    <span>•</span>
                    <span className="text-gray-500">⏳ {activePooja.durationMinutes || 120} mins</span>
                    {activePooja.description && (
                      <>
                        <span>•</span>
                        <span className="text-gray-500 truncate max-w-[120px]">{activePooja.description}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditPooja(activePooja)}
                    className="p-1.5 bg-white hover:bg-velvi-cream border border-velvi-gold/30 rounded-lg text-velvi-brown hover:text-velvi-maroon font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95"
                    title="Edit this Pooja"
                  >
                    <Edit2 className="w-3 h-3 text-velvi-gold" />
                    <span>மாற்று</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPoojaToDelete(activePooja)}
                    className="p-1.5 bg-white hover:bg-red-50 border border-red-200 rounded-lg text-red-600 font-bold text-[11px] flex items-center gap-1 shadow-sm transition active:scale-95"
                    title="Delete this Pooja"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>நீக்கு</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {poojaSuccessMessage && (
            <div className="text-[11px] font-bold text-velvi-sacredGreen flex items-center gap-1 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-200 animate-in fade-in">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{poojaSuccessMessage}</span>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-velvi-brown flex items-center gap-1">
                <Calendar className="w-3 h-3 text-velvi-gold" /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                required
              />
            </div>

            <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
              <label className="text-[11px] font-bold text-velvi-brown flex items-center gap-1">
                <Clock className="w-3 h-3 text-velvi-gold" /> Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              >
                <option value="06:00 AM">06:00 AM (Brahma Muhurtham)</option>
                <option value="07:00 AM">07:00 AM</option>
                <option value="07:30 AM">07:30 AM</option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="10:30 AM">10:30 AM (Muhurtham)</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="12:00 PM">12:00 PM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="06:00 PM">06:00 PM (Sandhya)</option>
                <option value="07:30 PM">07:30 PM</option>
                {![
                  "06:00 AM",
                  "07:00 AM",
                  "07:30 AM",
                  "08:00 AM",
                  "09:00 AM",
                  "10:00 AM",
                  "10:30 AM",
                  "11:30 AM",
                  "12:00 PM",
                  "02:30 PM",
                  "04:00 PM",
                  "04:30 PM",
                  "06:00 PM",
                  "07:30 PM",
                ].includes(startTime) && <option value={startTime}>{startTime}</option>}
              </select>
            </div>
          </div>

          {/* Auspicious Timings Indicator for chosen date */}
          {(() => {
            const chosenDateInfo = getTamilDate(date);
            return (
              <div className="bg-white/90 p-2.5 rounded-xl border border-velvi-gold/30 text-[11px] space-y-1 shadow-2xs">
                <div className="flex items-center justify-between flex-wrap gap-1 text-velvi-brownDark font-semibold">
                  <span>📅 {chosenDateInfo.formattedDualDate} ({chosenDateInfo.dayOfWeekTa})</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-red-700 font-bold text-[10px] bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                      ராகு காலம்: {formatTimeRangeTo12H(chosenDateInfo.rahuKalam)}
                    </span>
                    <span className="text-orange-800 font-bold text-[10px] bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      எமகண்டம்: {formatTimeRangeTo12H(chosenDateInfo.yamagandam)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10.5px] bg-emerald-50/80 text-emerald-950 px-2 py-1 rounded-lg border border-emerald-200/70">
                  <span>
                    ✨ <strong>நல்ல நேரம்:</strong> காலை: {formatTimeRangeTo12H(chosenDateInfo.nallaNeramMorning)} | மாலை: {formatTimeRangeTo12H(chosenDateInfo.nallaNeramEvening)}
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Who will perform the Pooja (Self vs Delegate) */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2.5">
          <div>
            <label className="text-xs font-bold text-velvi-brown block">
              Who will perform the Pooja?
            </label>
            <p className="text-[11px] text-velvi-brown/60">
              Normally you perform directly; assign a team member only if you cannot attend.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                const ownerMember = members.find((m) => m.role === "OWNER") || members[0];
                setAssignedIyerId(ownerMember?.id || "");
              }}
              className={`p-2.5 rounded-xl border text-left transition ${
                members.find((m) => m.id === assignedIyerId)?.role === "OWNER"
                  ? "bg-velvi-gold/15 border-velvi-gold shadow-sm ring-1 ring-velvi-gold/40"
                  : "bg-velvi-cream/30 border-velvi-gold/20 hover:bg-velvi-cream"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brownDark">
                <span>🪔</span>
                <span>Perform Myself</span>
              </div>
              <p className="text-[10px] text-velvi-brown/70 mt-0.5">
                ({currentUser?.name || "Ravi Iyer"} - Self)
              </p>
            </button>

            <button
              type="button"
              onClick={() => {
                const staffMember = members.find((m) => m.role !== "OWNER") || members[1] || members[0];
                setAssignedIyerId(staffMember?.id || "");
              }}
              className={`p-2.5 rounded-xl border text-left transition ${
                members.find((m) => m.id === assignedIyerId)?.role !== "OWNER"
                  ? "bg-velvi-gold/15 border-velvi-gold shadow-sm ring-1 ring-velvi-gold/40"
                  : "bg-velvi-cream/30 border-velvi-gold/20 hover:bg-velvi-cream"
              }`}
            >
              <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brownDark">
                <span>👥</span>
                <span>Assign Team Member</span>
              </div>
              <p className="text-[10px] text-velvi-brown/70 mt-0.5">
                (Delegate to Staff)
              </p>
            </button>
          </div>

          {/* Show dropdown only if assigning to another staff member */}
          {members.find((m) => m.id === assignedIyerId)?.role !== "OWNER" && (
            <div className="pt-2 border-t border-velvi-creamDark space-y-1 animate-in fade-in">
              <label className="text-[11px] font-bold text-velvi-brown block">
                Select Team Member:
              </label>
              <select
                value={assignedIyerId}
                onChange={(e) => setAssignedIyerId(e.target.value)}
                className="w-full bg-velvi-cream/40 border border-velvi-gold/30 rounded-xl px-3 py-2 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
              >
                {members
                  .filter((m) => m.role !== "OWNER")
                  .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.active ? "✅ Available" : "⚠️ Inactive"} ({m.specialization || "Vedic"})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* Location & Amount */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
            <label className="text-[11px] font-bold text-velvi-brown flex items-center gap-1">
              <MapPin className="w-3 h-3 text-velvi-gold" /> Location
            </label>
            <input
              type="text"
              placeholder="e.g. Namakkal"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              required
            />
          </div>

          <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
            <label className="text-[11px] font-bold text-velvi-brown flex items-center gap-1">
              <IndianRupee className="w-3 h-3 text-velvi-gold" /> Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              required
            />
          </div>
        </div>

        {/* Optional Notes */}
        <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <label className="text-[11px] font-bold text-velvi-brown">
            Notes (Optional)
          </label>
          <input
            type="text"
            placeholder="Special instructions, family gothram, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
          />
        </div>

        {/* Primary Action */}
        <button
          type="submit"
          className="w-full py-3.5 bg-gradient-to-r from-velvi-brown to-velvi-brownLight text-white rounded-xl font-bold text-sm shadow-sacred active:scale-[0.99] transition mt-2"
        >
          Create Booking
        </button>
      </form>

      {/* Quick Add Customer Modal */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 sm:p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-velvi-gold/30 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-velvi-gold/20 text-velvi-brownDark flex items-center justify-center font-bold text-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-velvi-brownDark leading-tight">
                    Add New Customer
                  </h3>
                  <p className="text-[10px] text-velvi-brown/60">
                    Will be instantly selected for this booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {custModalError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{custModalError}</span>
              </div>
            )}

            <form onSubmit={handleQuickAddCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Mobile Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={newCustMobile}
                  onChange={(e) => setNewCustMobile(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="e.g. Namakkal"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Street / Area"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Notes (Gothram / Nakshatram)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Koundinya, Rohini"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add / Edit Pooja Modal */}
      {showPoojaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-velvi-gold/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-velvi-gold/10 pb-3">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-velvi-gold" />
                <h3 className="font-bold text-sm text-velvi-brownDark">
                  {isEditingPooja ? "பூஜை விவரங்களை மாற்று / Edit Pooja" : "புதிய பூஜை சேர் / Add New Pooja"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPoojaModal(false)}
                className="p-1 text-gray-400 hover:text-velvi-brown rounded-full hover:bg-velvi-cream transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {poojaModalError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{poojaModalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePooja} className="space-y-3">
              {/* 1-Tap Popular Pooja Presets */}
              <div className="bg-gradient-to-r from-amber-50/80 via-velvi-cream/70 to-amber-50/80 p-2.5 rounded-2xl border border-velvi-gold/35 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>பிரபலமான டெம்ப்ளேட்கள் (1-Tap Fill)</span>
                  </span>
                  <span className="text-[9px] text-velvi-maroon font-bold bg-white px-1.5 py-0.5 rounded-full border border-velvi-gold/20">
                    1-கிளிக்
                  </span>
                </div>
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                  {PRESET_POOJA_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.englishName}
                      type="button"
                      onClick={() => applyInstantPoojaPreset(tpl)}
                      className="shrink-0 bg-white hover:bg-amber-100/70 border border-velvi-gold/30 hover:border-velvi-gold rounded-xl px-2 py-1 text-xs font-bold text-velvi-brownDark flex items-center gap-1 shadow-2xs transition active:scale-95"
                    >
                      <span>{tpl.icon}</span>
                      <span>{tpl.tamilName}</span>
                      <span className="text-[9px] text-velvi-maroon bg-amber-50 px-1 py-0.2 rounded font-bold">
                        ₹{tpl.basePrice.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Pooja Name (English) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ganapathi Homam / Sudarshana Homam"
                  value={poojaFormEnglish}
                  onChange={(e) => setPoojaFormEnglish(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  பூஜை பெயர் (தமிழ்)
                </label>
                <input
                  type="text"
                  placeholder="e.g. கணபதி ஹோமம்"
                  value={poojaFormTamil}
                  onChange={(e) => setPoojaFormTamil(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="500"
                    value={poojaFormPrice}
                    onChange={(e) => setPoojaFormPrice(Number(e.target.value))}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[3000, 5000, 7500, 10000, 12000].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPoojaFormPrice(p)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition border ${
                          poojaFormPrice === p
                            ? "bg-velvi-brown text-amber-200 border-velvi-brown"
                            : "bg-velvi-cream/60 hover:bg-velvi-cream text-velvi-brownDark border-velvi-gold/20"
                        }`}
                      >
                        ₹{p.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={poojaFormDuration}
                    onChange={(e) => setPoojaFormDuration(Number(e.target.value))}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                  <div className="flex flex-wrap gap-1 mt-1">
                    {[
                      { mins: 60, label: "1h" },
                      { mins: 90, label: "1.5h" },
                      { mins: 120, label: "2h" },
                      { mins: 180, label: "3h" },
                      { mins: 240, label: "4h" },
                    ].map((d) => (
                      <button
                        key={d.mins}
                        type="button"
                        onClick={() => setPoojaFormDuration(d.mins)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition border ${
                          poojaFormDuration === d.mins
                            ? "bg-velvi-brown text-amber-200 border-velvi-brown"
                            : "bg-velvi-cream/60 hover:bg-velvi-cream text-velvi-brownDark border-velvi-gold/20"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Description / குறிப்புகள் (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes pooja samagri & sankalpam"
                  value={poojaFormDesc}
                  onChange={(e) => setPoojaFormDesc(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoojaModal(false)}
                  className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {isEditingPooja ? "சேமி / Save" : "சேர் & தேர்ந்தெடு / Add & Select"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Pooja Confirmation Modal */}
      {poojaToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm border border-red-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-velvi-brownDark">பூஜையை நீக்கவா?</h3>
                <p className="text-[11px] text-gray-500">Delete Pooja from catalogue?</p>
              </div>
            </div>

            <p className="text-xs text-velvi-brownDark bg-red-50/70 p-3 rounded-xl border border-red-100 leading-relaxed">
              <span className="font-bold text-red-700">{poojaToDelete.englishName}</span> {poojaToDelete.tamilName && `(${poojaToDelete.tamilName})`} பூஜையை நீக்க விரும்புகிறீர்களா? இது உங்கள் பூஜை பட்டியலிலிருந்து நீக்கப்படும்.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPoojaToDelete(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-velvi-brown rounded-xl text-xs font-bold transition"
              >
                Cancel / வேண்டாம்
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePooja}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-md"
              >
                நீக்கு / Confirm Delete
              </button>
            </div>
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
        <div className="p-8 text-center text-xs text-velvi-brown/60">
          Loading booking form...
        </div>
      }
    >
      <NewBookingForm />
    </Suspense>
  );
}
