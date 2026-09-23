"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { ArrowLeft, Check, AlertTriangle, Clock, UserCheck, Users, Sparkles } from "lucide-react";
import Link from "next/link";

export default function AssignIyerPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const bookingId = params.id as string;
  const booking = db.bookings.find((b) => b.id === bookingId) || db.bookings[0];
  const members = db.getMembers(businessId);

  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];
  const staffMembers = members.filter((m) => m.role !== "OWNER");

  const [selectedIyerId, setSelectedIyerId] = useState<string>(
    booking.assignedIyerId || ownerMember?.id || members[0]?.id || ""
  );
  const [reason, setReason] = useState<string>("Routine assignment");
  const [error, setError] = useState<string>("");

  const quickReasons = [
    "Traveling out of town",
    "Schedule clash",
    "Busy schedule",
    "Health reasons",
  ];

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedIyerId) {
      setError("Please select an Iyer to assign.");
      return;
    }

    const isSelectingOwner = selectedIyerId === ownerMember?.id;

    if (booking.assignedIyerId && booking.assignedIyerId !== selectedIyerId) {
      // Reassignment flow with history log
      const res = db.reassignBooking({
        bookingId: booking.id,
        newIyerId: selectedIyerId,
        reassignedBy: currentUser?.name || "Ravi Iyer",
        reason: isSelectingOwner
          ? "Perform myself (Personal attendance by owner)"
          : (reason || "Delegated due to inability to attend"),
      });

      if (!res.success) {
        setError(res.error || "Conflict detected.");
        return;
      }
    } else {
      // First-time assignment conflict check
      const conflict = db.checkIyerConflict({
        businessId,
        iyerId: selectedIyerId,
        date: booking.date,
        startTime: booking.startTime,
        durationMinutes: booking.durationMinutes,
        excludeBookingId: booking.id,
      });

      if (conflict.hasConflict) {
        setError(conflict.reason || "This Iyer is already booked during this time.");
        return;
      }

      const assignedIyer = members.find((m) => m.id === selectedIyerId);
      booking.assignedIyerId = selectedIyerId;
      booking.assignedIyerName = assignedIyer?.name;
      booking.updatedAt = new Date().toISOString();
    }

    router.push(`/app/bookings/${booking.id}`);
  };

  // Conflict check for owner
  const ownerConflict = ownerMember
    ? db.checkIyerConflict({
        businessId,
        iyerId: ownerMember.id,
        date: booking.date,
        startTime: booking.startTime,
        durationMinutes: booking.durationMinutes,
        excludeBookingId: booking.id,
      })
    : { hasConflict: false };

  const isOwnerSelected = selectedIyerId === ownerMember?.id;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/app/bookings/${booking.id}`}
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Assign Ceremony Responsibility</h2>
          <p className="text-xs text-velvi-brown/60 flex items-center gap-1">
            <Clock className="w-3 h-3 text-velvi-gold" />
            <span>
              {booking.date} • {booking.startTime}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Philosophy banner */}
      <div className="bg-velvi-cream/60 border border-velvi-gold/25 p-3 rounded-2xl text-xs text-velvi-brown/80 space-y-1">
        <div className="font-bold text-velvi-brownDark flex items-center gap-1.5">
          <span>🪔</span>
          <span>Pooja Assignment Policy:</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          You normally attend and perform all booked poojas directly. Delegate to a team member only when you are genuinely unable to attend.
        </p>
      </div>

      <form onSubmit={handleAssign} className="space-y-4">
        {/* SECTION 1: Self Attendance (Default / Primary) */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-velvi-goldDark uppercase tracking-wider block">
            1. Primary / Attend Myself
          </span>

          {ownerMember && (
            <label
              className={`block p-3.5 rounded-2xl border transition cursor-pointer relative ${
                isOwnerSelected
                  ? "bg-gradient-to-r from-velvi-gold/15 to-velvi-cream border-velvi-gold shadow-sm ring-1 ring-velvi-gold/40"
                  : ownerConflict.hasConflict
                  ? "bg-amber-50/50 border-amber-200 opacity-80"
                  : "bg-white border-velvi-gold/20 hover:border-velvi-gold/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="assignedIyer"
                    value={ownerMember.id}
                    checked={isOwnerSelected}
                    onChange={() => setSelectedIyerId(ownerMember.id)}
                    className="accent-velvi-brown w-4 h-4"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-velvi-brownDark">
                        Perform Myself ({ownerMember.name})
                      </h4>
                      <span className="text-[10px] font-bold bg-velvi-gold/20 text-velvi-brownDark px-2 py-0.2 rounded-full border border-velvi-gold/30">
                        Self
                      </span>
                    </div>
                    <p className="text-[11px] text-velvi-brown/70 mt-0.5">
                      I will attend and perform this ceremony in person.
                    </p>
                  </div>
                </div>

                {ownerConflict.hasConflict ? (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Schedule Clash
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Available
                  </span>
                )}
              </div>
            </label>
          )}
        </div>

        {/* SECTION 2: Delegation to Team (Only if unable to go) */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-velvi-brown/70 uppercase tracking-wider block">
              2. Cannot Attend? Delegate to Team Member
            </span>
          </div>
          <p className="text-[11px] text-velvi-brown/60">
            Select an active team member to conduct the ceremony on your behalf:
          </p>

          <div className="space-y-2">
            {staffMembers.map((iyer) => {
              const conflict = db.checkIyerConflict({
                businessId,
                iyerId: iyer.id,
                date: booking.date,
                startTime: booking.startTime,
                durationMinutes: booking.durationMinutes,
                excludeBookingId: booking.id,
              });

              const isSelected = selectedIyerId === iyer.id;
              const isConflicted = conflict.hasConflict;

              return (
                <label
                  key={iyer.id}
                  className={`block p-3.5 rounded-2xl border transition cursor-pointer relative ${
                    isSelected
                      ? "bg-blue-50/80 border-blue-400 shadow-sm ring-1 ring-blue-300"
                      : isConflicted
                      ? "bg-amber-50/40 border-amber-200 opacity-70"
                      : "bg-white border-velvi-gold/20 hover:border-velvi-gold/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="assignedIyer"
                        value={iyer.id}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedIyerId(iyer.id);
                          if (!reason || reason === "Routine assignment") {
                            setReason("Traveling out of town");
                          }
                        }}
                        className="accent-velvi-brown w-4 h-4"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-sm text-velvi-brownDark">{iyer.name}</h4>
                          <span className="text-[10px] font-semibold bg-gray-100 text-gray-700 px-1.5 py-0.2 rounded">
                            Team Staff
                          </span>
                        </div>
                        <p className="text-[11px] text-velvi-brown/60">{iyer.specialization}</p>
                        <p className="text-[10px] text-velvi-brown/50">
                          Working hours: {iyer.workingHours} ({iyer.workingDays})
                        </p>
                      </div>
                    </div>

                    {isConflicted ? (
                      <div className="text-right">
                        <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Already booked
                        </span>
                        <span className="text-[10px] text-amber-800/80 block mt-0.5">
                          {conflict.conflictingBooking?.startTime} -{" "}
                          {conflict.conflictingBooking?.endTime}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> Available
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* Reason for change (if delegating to staff or changing) */}
        {!isOwnerSelected && (
          <div className="bg-white p-3.5 rounded-2xl border border-blue-200 shadow-sm space-y-2">
            <label className="text-xs font-bold text-velvi-brownDark block">
              Reason for Delegation (Required)
            </label>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5">
              {quickReasons.map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition ${
                    reason === qr
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-velvi-cream/40 text-velvi-brown border-velvi-gold/20 hover:bg-velvi-cream"
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>

            <input
              type="text"
              required
              placeholder="e.g. Traveling out of town, schedule clash, health reasons"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-blue-400"
            />
          </div>
        )}

        <button
          type="submit"
          className="w-full py-3.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-sm shadow-sacred active:scale-[0.99] transition mt-3"
        >
          {isOwnerSelected ? "🪔 Confirm Perform Myself" : "Confirm Delegation"}
        </button>
      </form>
    </div>
  );
}
