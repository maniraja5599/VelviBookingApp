"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { getTamilDate, getLocalDateString } from "@/lib/calendar/tamil";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  AlertTriangle,
  Lock,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const bookingId = params.id as string;
  const booking = db.bookings.find((b) => b.id === bookingId) || db.bookings[0];

  const [poojas, setPoojas] = useState(db.getPoojas(businessId));
  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];

  // Form states
  const [customerName, setCustomerName] = useState<string>(booking.customerName || "");
  const [customerMobile, setCustomerMobile] = useState<string>(booking.customerMobile || "");
  const [location, setLocation] = useState<string>(booking.location || "");
  const [poojaId, setPoojaId] = useState<string>(booking.poojaId || poojas[0]?.id || "");
  const [date, setDate] = useState<string>(booking.date || getLocalDateString());
  const [startTime, setStartTime] = useState<string>(booking.startTime || "08:00 AM");
  const [durationMinutes, setDurationMinutes] = useState<number>(booking.durationMinutes || 120);
  const [assignedIyerId, setAssignedIyerId] = useState<string>(
    booking.assignedIyerId || ownerMember?.id || ""
  );
  const [notes, setNotes] = useState<string>(booking.notes || "");
  const [error, setError] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const selectedPooja = poojas.find((p) => p.id === poojaId);
  const dateInfo = getTamilDate(date);
  const isOwnerSelected = assignedIyerId === ownerMember?.id;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const selectedIyer = members.find((m) => m.id === assignedIyerId);

    const res = db.updateBooking({
      bookingId: booking.id,
      updatedBy: currentUser?.name || "Ravi Iyer",
      updates: {
        customerName,
        customerMobile,
        location,
        poojaId,
        poojaEnglishName: selectedPooja?.englishName || booking.poojaEnglishName,
        poojaTamilName: selectedPooja?.tamilName || booking.poojaTamilName,
        date,
        startTime,
        durationMinutes,
        assignedIyerId: selectedIyer?.id || assignedIyerId,
        assignedIyerName: selectedIyer?.name || (isOwnerSelected ? currentUser?.name || "Ravi Iyer" : booking.assignedIyerName),
        notes,
      },
    });

    setIsSaving(false);

    if (!res.success) {
      setError(res.error || "Failed to update booking.");
      return;
    }

    router.push(`/app/bookings/${booking.id}`);
  };

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/bookings/${booking.id}`}
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">
            Edit Ceremony Details
          </h2>
          <p className="text-xs text-velvi-brown/60">
            Booking {booking.bookingNumber} • {booking.poojaEnglishName}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-2xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* 1. Customer Information Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brown">
            <User className="w-3.5 h-3.5 text-velvi-gold" />
            <span>Customer Details</span>
          </div>

          <div>
            <label className="text-[11px] font-bold text-velvi-brown/80 block mb-1">
              Customer Name
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-velvi-brown/80 block mb-1">
                Mobile Number
              </label>
              <input
                type="tel"
                required
                value={customerMobile}
                onChange={(e) => setCustomerMobile(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-velvi-brown/80 block mb-1">
                Location / Address
              </label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>
          </div>
        </div>

        {/* 2. Pooja Selection Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brown">
            <Flame className="w-3.5 h-3.5 text-velvi-gold" />
            <span>Ceremony Selection</span>
          </div>

          <select
            value={poojaId}
            onChange={(e) => setPoojaId(e.target.value)}
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
          >
            {poojas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.tamilName || p.englishName} {p.tamilName && p.englishName && p.tamilName !== p.englishName ? `(${p.englishName})` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Date & Time Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2.5">
          <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brown">
            <Calendar className="w-3.5 h-3.5 text-velvi-gold" />
            <span>Date & Time</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-bold text-velvi-brown/80 block mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-velvi-brown/80 block mb-1">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-2 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              >
                <option value="06:00 AM">06:00 AM</option>
                <option value="07:00 AM">07:00 AM</option>
                <option value="08:00 AM">08:00 AM</option>
                <option value="08:30 AM">08:30 AM</option>
                <option value="09:00 AM">09:00 AM</option>
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="04:00 PM">04:00 PM</option>
                <option value="05:00 PM">05:00 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          {/* Tamil Date Helper info (Preserved Tamil calendar names as requested) */}
          <div className="text-[11px] bg-velvi-cream/40 p-2 rounded-xl text-velvi-brown/80 flex items-center justify-between border border-velvi-gold/15">
            <span>Tamil Date: <span className="font-semibold text-velvi-brownDark">{dateInfo.tamilMonth} {dateInfo.tamilDay} ({dateInfo.dayOfWeekTa})</span></span>
            <span>Rahu Kalam: <span className="font-semibold text-velvi-brownDark">{dateInfo.rahuKalam.split(" - ")[0]}</span></span>
          </div>


        </div>

        {/* 4. Performer (Self vs Delegated Staff) */}
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
              onClick={() => setAssignedIyerId(ownerMember?.id || "")}
              className={`p-2.5 rounded-xl border text-left transition ${
                isOwnerSelected
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
                !isOwnerSelected
                  ? "bg-blue-50 border-blue-400 shadow-sm ring-1 ring-blue-300"
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

          {!isOwnerSelected && (
            <div className="pt-1">
              <label className="text-[11px] font-bold text-velvi-brown block mb-1">
                Select Team Member:
              </label>
              <select
                value={assignedIyerId}
                onChange={(e) => setAssignedIyerId(e.target.value)}
                className="w-full bg-blue-50/50 border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-blue-400"
              >
                {members
                  .filter((m) => m.role !== "OWNER")
                  .map((iyer) => (
                    <option key={iyer.id} value={iyer.id}>
                      {iyer.name} ({iyer.specialization})
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* 5. Notes */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <label className="text-xs font-bold text-velvi-brown block">
            Ceremony Notes / Muhurtham Timings
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Muhurtham starts at 8:15 AM sharp"
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl p-2.5 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold resize-none"
          />
        </div>

        {/* 6. Strict Payment Guardrail Notice */}
        <div className="bg-gradient-to-br from-velvi-creamLight/80 to-velvi-cream p-3.5 rounded-2xl border border-velvi-gold/30 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-xs text-velvi-brownDark">
              <Lock className="w-3.5 h-3.5 text-velvi-gold" />
              <span>Protected Financials</span>
            </div>
            <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2 py-0.2 rounded-full">
              {booking.paymentStatus}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center bg-white/80 p-2.5 rounded-xl border border-velvi-gold/15 text-xs">
            <div>
              <div className="text-[10px] text-velvi-brown/60">Total Fee</div>
              <div className="font-extrabold text-velvi-brownDark">₹{booking.totalAmount.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-[10px] text-velvi-brown/60">Advance</div>
              <div className="font-extrabold text-green-700">₹{booking.advanceAmount.toLocaleString("en-IN")}</div>
            </div>
            <div>
              <div className="text-[10px] text-velvi-brown/60">Balance</div>
              <div className="font-extrabold text-amber-700">₹{booking.balanceAmount.toLocaleString("en-IN")}</div>
            </div>
          </div>

          <p className="text-[11px] text-velvi-brown/70 leading-relaxed">
            🔒 To prevent accounting errors, total fee and advance amounts can only be updated via the <span className="font-bold text-velvi-brownDark">"Edit Payment"</span> dialog on the Booking Details page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5 pt-2">
          <Link
            href={`/app/bookings/${booking.id}`}
            className="flex-1 py-3 bg-velvi-cream hover:bg-velvi-creamDark text-velvi-brown text-center font-bold text-xs rounded-xl transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white font-bold text-xs rounded-xl shadow-sacred active:scale-[0.99] transition disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
