"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Booking, BookingItem } from "@/lib/types";
import { ArrowLeft, User, Flame, Calendar, Clock, MapPin, IndianRupee, AlertTriangle } from "lucide-react";
import Link from "next/link";

function NewBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const poojas = db.getPoojas(businessId);
  const customers = db.getCustomers(businessId);
  const members = db.getMembers(businessId);

  // Form State
  const [customerId, setCustomerId] = useState<string>(customers[0]?.id || "");
  const [poojaId, setPoojaId] = useState<string>(poojas[0]?.id || "");
  const [date, setDate] = useState<string>(initialDate);
  const [startTime, setStartTime] = useState<string>("08:00 AM");
  const [location, setLocation] = useState<string>("Namakkal");
  const [amount, setAmount] = useState<number>(poojas[0]?.basePrice || 5000);
  const [assignedIyerId, setAssignedIyerId] = useState<string>(members[0]?.id || "");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

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
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <label className="text-xs font-bold text-velvi-brown flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-velvi-gold" /> Customer
          </label>
          <select
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
          >
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.mobile}) - {c.city || "Tamil Nadu"}
              </option>
            ))}
          </select>
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
              <option value="06:00 AM">06:00 AM</option>
              <option value="07:00 AM">07:00 AM</option>
              <option value="08:00 AM">08:00 AM</option>
              <option value="09:00 AM">09:00 AM</option>
              <option value="10:00 AM">10:00 AM</option>
              <option value="11:30 AM">11:30 AM</option>
              <option value="04:00 PM">04:00 PM</option>
              <option value="06:00 PM">06:00 PM</option>
            </select>
          </div>
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
