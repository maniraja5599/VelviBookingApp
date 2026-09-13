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
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || getLocalDateString();
  const initialPoojaId = searchParams.get("poojaId");
  const initialTime = searchParams.get("time");

  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const poojas = db.getPoojas(businessId);
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

  // Quick Add Customer Modal State
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustNotes, setNewCustNotes] = useState<string>("");
  const [custModalError, setCustModalError] = useState<string>("");
  const [customerAddedSuccess, setCustomerAddedSuccess] = useState<string>("");

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
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <label className="text-xs font-bold text-velvi-brown flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-velvi-gold" /> Pooja / Homam
          </label>
          <select
            value={poojaId}
            onChange={(e) => handlePoojaChange(e.target.value)}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
          >
            {poojas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.englishName} — ₹{p.basePrice}
              </option>
            ))}
          </select>
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
