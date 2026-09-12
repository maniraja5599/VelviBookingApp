"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { getTamilDate } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage } from "@/lib/whatsapp/formatter";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Flame,
  User,
  CheckCircle2,
  Share2,
  Image as ImageIcon,
  Edit,
  IndianRupee,
  AlertCircle,
  UserCheck,
  Users,
  History,
  Trash2,
  Ban,
  AlertTriangle,
} from "lucide-react";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const bookingId = params.id as string;
  const booking = db.bookings.find((b) => b.id === bookingId) || db.bookings[0];

  const members = db.getMembers(businessId);
  const ownerMember = members.find((m) => m.role === "OWNER") || members[0];
  const isSelf =
    booking.assignedIyerId === ownerMember?.id ||
    booking.assignedIyerName === currentUser?.name ||
    booking.assignedIyerName === "Ravi Iyer";

  const assignmentHistory = db.bookingAssignments.filter((a) => a.bookingId === booking.id);

  const dateInfo = getTamilDate(booking.date);

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number>(booking.balanceAmount || 0);

  // Cancellation states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>("Client request");
  const [refundDecision, setRefundDecision] = useState<"REFUNDED" | "RETAINED" | "NO_PAYMENT">(
    booking.advanceAmount > 0 ? "REFUNDED" : "NO_PAYMENT"
  );
  const [refundAmount, setRefundAmount] = useState<number>(booking.advanceAmount || 0);
  const [retainedAmount, setRetainedAmount] = useState<number>(booking.advanceAmount || 0);

  // Deletion state
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Controlled Payment Edit states
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(booking.totalAmount || 0);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState<number>(booking.advanceAmount || 0);
  const [editPaymentReason, setEditPaymentReason] = useState<string>("Payment adjustment");
  const [paymentError, setPaymentError] = useState<string>("");

  const quickCancelReasons = [
    "Client request",
    "Date postponed",
    "Unavoidable conflict",
    "Family emergency",
  ];

  const handleWhatsAppShare = () => {
    if (!currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(booking, currentBusiness);
    const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleRecordPayment = () => {
    if (paymentAmount <= 0) return;
    booking.advanceAmount += paymentAmount;
    booking.balanceAmount = Math.max(0, booking.totalAmount - booking.advanceAmount);
    booking.paymentStatus = booking.balanceAmount === 0 ? "PAID" : "PARTIALLY_PAID";
    booking.updatedAt = new Date().toISOString();
    setShowPaymentModal(false);
  };

  const handleConfirmEditPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    if (editTotalAmount < 0 || editAdvanceAmount < 0) {
      setPaymentError("Amounts cannot be negative.");
      return;
    }

    const res = db.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: editTotalAmount,
      advanceAmount: editAdvanceAmount,
      updatedBy: currentUser?.name || "Ravi Iyer",
      reason: editPaymentReason,
    });

    if (res.success && res.booking) {
      booking.totalAmount = res.booking.totalAmount;
      booking.advanceAmount = res.booking.advanceAmount;
      booking.balanceAmount = res.booking.balanceAmount;
      booking.paymentStatus = res.booking.paymentStatus;
      setShowEditPaymentModal(false);
      router.refresh();
    } else {
      setPaymentError(res.error || "Failed to update payment");
    }
  };

  const handleMarkCompleted = () => {
    booking.status = "COMPLETED";
    booking.updatedAt = new Date().toISOString();
    router.refresh();
  };

  const handleConfirmCancel = () => {
    const res = db.cancelBooking({
      bookingId: booking.id,
      reason: cancelReason,
      refundDecision: booking.advanceAmount > 0 ? refundDecision : "NO_PAYMENT",
      refundAmount: refundDecision === "REFUNDED" ? refundAmount : 0,
      retainedAmount: refundDecision === "RETAINED" ? retainedAmount : 0,
      cancelledBy: currentUser?.name || "Ravi Iyer",
    });

    if (res.success) {
      setShowCancelModal(false);
      router.refresh();
    }
  };

  const handleConfirmDelete = () => {
    const res = db.deleteBooking({
      bookingId: booking.id,
      deletedBy: currentUser?.name || "Ravi Iyer",
      reason: "Manual deletion from booking details screen",
    });
    if (res.success) {
      router.push("/app/bookings");
    }
  };

  const handleRevertToSelf = () => {
    const ownerMember = members.find((m) => m.role === "OWNER");
    if (!ownerMember) return;
    const res = db.reassignBooking({
      bookingId: booking.id,
      newIyerId: ownerMember.id,
      reassignedBy: currentUser?.name || "Ravi Iyer",
      reason: "Perform myself (Taking back to attend personally)",
    });
    if (res.success) {
      router.refresh();
    }
  };

  // Derived balance & status for Payment Edit Preview
  const derivedBalance = Math.max(0, editTotalAmount - editAdvanceAmount);
  const derivedStatus = derivedBalance === 0 ? "PAID" : editAdvanceAmount > 0 ? "PARTIALLY_PAID" : "PENDING";

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Top Bar with Edit & Back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/app/bookings"
            className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <span className="font-bold text-sm text-velvi-brown">
            Booking {booking.bookingNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {booking.status !== "CANCELLED" && (
            <Link
              href={`/app/bookings/${booking.id}/edit`}
              className="p-1.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown rounded-lg text-xs font-bold flex items-center gap-1 border border-velvi-gold/30 transition"
              title="Edit Booking"
            >
              <Edit className="w-3.5 h-3.5 text-velvi-goldDark" />
              <span>Edit</span>
            </Link>
          )}

          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${
              booking.status === "CONFIRMED"
                ? "bg-green-100 text-green-800 border border-green-300"
                : booking.status === "COMPLETED"
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : booking.status === "CANCELLED"
                ? "bg-red-100 text-red-800 border border-red-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            {booking.status}
          </span>
        </div>
      </div>

      {/* Cancelled Banner (If status is CANCELLED) */}
      {booking.status === "CANCELLED" && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 space-y-1.5">
          <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
            <Ban className="w-4 h-4 text-red-600" />
            <span>This booking is Cancelled</span>
          </div>
          <p className="text-xs text-red-700">
            Reason: <span className="font-semibold">{booking.cancellationReason || "Not specified"}</span>
          </p>
          <div className="text-[11px] bg-white/80 p-2 rounded-xl border border-red-100 text-red-900 font-medium">
            {booking.refundDecision === "REFUNDED" ? (
              <span>💰 Advance of ₹{booking.refundAmount?.toLocaleString("en-IN")} refunded to customer.</span>
            ) : booking.refundDecision === "RETAINED" ? (
              <span>💼 Advance of ₹{booking.retainedAmount?.toLocaleString("en-IN")} retained by us.</span>
            ) : (
              <span>Cancelled with zero financial transactions.</span>
            )}
          </div>
        </div>
      )}

      {/* Main Ceremony Card */}
      <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-2xl p-4 border border-velvi-gold/30 shadow-sacred space-y-3">
        <div>
          <div className="text-xs font-semibold text-velvi-goldDark uppercase tracking-wider">
            Pooja / Homam
          </div>
          <h2 className="text-lg font-bold text-velvi-brownDark mt-0.5">
            {booking.poojaEnglishName}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs text-velvi-brown/80 border-t border-velvi-gold/20 pt-2.5">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-velvi-gold" />
            <div>
              <div className="font-bold text-velvi-brownDark">{dateInfo.formattedDualDate}</div>
              <div className="text-[10px] text-velvi-brown/60">{dateInfo.dayOfWeekEn}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-velvi-gold" />
            <div>
              <div className="font-bold text-velvi-brownDark">{booking.startTime}</div>
              <div className="text-[10px] text-velvi-brown/60">{booking.durationMinutes} mins</div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Information Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-velvi-brown/60 uppercase tracking-wide">
            Customer Details
          </span>
          <div className="flex items-center gap-2">
            {booking.customerMobile && (
              <a
                href={`tel:${booking.customerMobile}`}
                className="p-1.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown rounded-lg transition"
                title="Call Customer"
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleWhatsAppShare}
              className="p-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition"
              title="WhatsApp Customer"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm text-velvi-brownDark">{booking.customerName}</h4>
          <p className="text-xs text-velvi-brown/80 flex items-center gap-1 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
            <span>{booking.location}</span>
          </p>
          {booking.customerMobile && (
            <p className="text-xs text-velvi-brown/70 mt-0.5">{booking.customerMobile}</p>
          )}
        </div>
      </div>

      {/* Assigned / Performing Iyer Card (Points 35 & 36 - Self Default vs Delegation) */}
      <div className={`rounded-2xl p-3.5 border shadow-sm space-y-2.5 transition ${
        isSelf
          ? "bg-gradient-to-br from-velvi-creamLight/90 to-velvi-cream border-velvi-gold/40 shadow-sacred"
          : "bg-white border-blue-200"
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-velvi-brown/70 uppercase tracking-wide">
            Pooja Performer
          </span>
          {isSelf ? (
            <span className="text-[10px] font-bold bg-velvi-gold/20 text-velvi-brownDark px-2.5 py-0.5 rounded-full border border-velvi-gold/40 flex items-center gap-1">
              <span>🪔</span> Self
            </span>
          ) : (
            <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
              <Users className="w-3 h-3" /> Delegated Team Member
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-base text-velvi-brownDark flex items-center gap-1.5">
              <span>{isSelf ? "🪔" : "👤"}</span>
              <span>{booking.assignedIyerName || (isSelf ? (currentUser?.name || "Ravi Iyer") : "Unassigned")}</span>
            </div>
            <p className="text-[11px] text-velvi-brown/70 mt-0.5">
              {isSelf
                ? "Standard mode — you will attend and perform this ceremony personally."
                : "Delegated — you are unable to attend, assigned to this team member."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isSelf ? (
          <div className="pt-2 border-t border-velvi-gold/20">
            <Link
              href={`/app/bookings/${booking.id}/assign`}
              className="w-full py-2 px-3 bg-white hover:bg-amber-50 text-velvi-brownDark border border-velvi-gold/40 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span>Cannot Attend? Delegate to Team</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-blue-100">
            <button
              onClick={handleRevertToSelf}
              className="py-2 bg-velvi-gold/15 hover:bg-velvi-gold/25 text-velvi-brownDark rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-velvi-gold/30 transition shadow-sm"
            >
              <span>🪔 Perform Myself</span>
            </button>
            <Link
              href={`/app/bookings/${booking.id}/assign`}
              className="py-2 bg-gray-50 hover:bg-gray-100 text-velvi-brown rounded-xl text-xs font-bold flex items-center justify-center gap-1 border border-gray-200 transition"
            >
              <span>Reassign →</span>
            </Link>
          </div>
        )}

        {/* Reassignment Audit History if any exists */}
        {assignmentHistory.length > 0 && (
          <div className="pt-2 border-t border-velvi-gold/15 space-y-1">
            <span className="text-[10px] font-bold text-velvi-brown/60 uppercase flex items-center gap-1">
              <History className="w-3 h-3 text-velvi-gold" /> Reassignment History ({assignmentHistory.length})
            </span>
            <div className="space-y-1">
              {assignmentHistory.map((hist) => (
                <div
                  key={hist.id}
                  className="text-[10px] bg-white/70 p-2 rounded-lg border border-velvi-gold/15 text-velvi-brown/80"
                >
                  <span className="font-semibold text-velvi-brownDark">
                    {hist.previousIyerName || "Initial"} → {hist.newIyerName}
                  </span>{" "}
                  • Reason: <span className="italic">{hist.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Payment Information Card (Point 40 & Strict Payment Guardrail) */}
      <div className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-velvi-brown/60 uppercase tracking-wide">
            Payment Summary
          </span>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                booking.paymentStatus === "PAID"
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {booking.paymentStatus === "PAID" ? "Paid ✅" : "Pending"}
            </span>

            {/* Controlled Payment Edit Trigger */}
            <button
              onClick={() => {
                setEditTotalAmount(booking.totalAmount);
                setEditAdvanceAmount(booking.advanceAmount);
                setPaymentError("");
                setShowEditPaymentModal(true);
              }}
              className="text-[11px] font-bold text-velvi-brownDark hover:text-velvi-goldDark underline flex items-center gap-1"
              title="Edit Payment Amounts"
            >
              <Edit className="w-3 h-3 text-velvi-gold" />
              <span>Edit Payment</span>
            </button>
          </div>
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xl font-extrabold text-velvi-brownDark">
              ₹{booking.totalAmount.toLocaleString("en-IN")}
            </div>
            {booking.advanceAmount > 0 && (
              <div className="text-xs text-velvi-brown/70">
                Advance: ₹{booking.advanceAmount.toLocaleString("en-IN")} • Balance: ₹
                {booking.balanceAmount.toLocaleString("en-IN")}
              </div>
            )}
          </div>

          {booking.balanceAmount > 0 && booking.status !== "CANCELLED" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="px-3 py-1.5 bg-velvi-brown text-white font-bold rounded-xl text-xs hover:bg-velvi-brownLight transition shadow-sm"
            >
              Record Payment
            </button>
          )}
        </div>
      </div>

      {/* Primary 1-Tap Action Grid (Point 73) */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <Link
          href={`/app/bookings/${booking.id}/items`}
          className="py-3 bg-velvi-cream border border-velvi-gold/30 rounded-xl font-bold text-xs text-velvi-brown flex items-center justify-center gap-1.5 shadow-sm hover:bg-velvi-gold/15 transition"
        >
          <Flame className="w-4 h-4 text-velvi-gold" />
          <span>Items List ({booking.items?.length || 0})</span>
        </Link>

        <button
          onClick={handleWhatsAppShare}
          className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
        >
          <Share2 className="w-4 h-4" />
          <span>Share WhatsApp</span>
        </button>
      </div>

      {/* Secondary & Management Actions */}
      <div className="pt-2 space-y-2">
        {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
          <button
            onClick={handleMarkCompleted}
            className="w-full py-2.5 bg-velvi-sacredGreen hover:bg-velvi-sacredGreenLight text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark Completed</span>
          </button>
        )}

        {/* Cancellation & Deletion Row */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {booking.status !== "CANCELLED" && (
            <button
              onClick={() => {
                setCancelReason("Client request");
                setRefundDecision(booking.advanceAmount > 0 ? "REFUNDED" : "NO_PAYMENT");
                setRefundAmount(booking.advanceAmount || 0);
                setRetainedAmount(booking.advanceAmount || 0);
                setShowCancelModal(true);
              }}
              className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Ban className="w-4 h-4 text-amber-700" />
              <span>Cancel Booking</span>
            </button>
          )}

          <button
            onClick={() => setShowDeleteModal(true)}
            className={`py-2.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition ${
              booking.status === "CANCELLED" ? "col-span-2" : ""
            }`}
          >
            <Trash2 className="w-4 h-4 text-red-600" />
            <span>Delete Booking</span>
          </button>
        </div>
      </div>

      {/* 1. Quick Payment Recording Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-velvi-gold/30">
            <h3 className="font-bold text-base text-velvi-brownDark">Record Payment</h3>
            <p className="text-xs text-velvi-brown/70">
              Enter amount collected from {booking.customerName}.
            </p>

            <div>
              <label className="text-xs font-bold text-velvi-brown block mb-1">
                Payment Amount (₹)
              </label>
              <input
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                max={booking.balanceAmount}
                className="w-full bg-velvi-cream/40 border border-velvi-gold/30 rounded-xl px-3 py-2 text-sm font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-velvi-brown bg-velvi-cream hover:bg-velvi-creamDark"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-velvi-brown hover:bg-velvi-brownLight shadow-sm"
              >
                Save Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Controlled Edit Payment Modal (With Math Integrity) */}
      {showEditPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleConfirmEditPayment}
            className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-velvi-gold/30"
          >
            <div>
              <h3 className="font-bold text-base text-velvi-brownDark flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-velvi-gold" />
                <span>Edit Fee & Advance</span>
              </h3>
              <p className="text-[11px] text-velvi-brown/70 mt-0.5">
                Safely update the total ceremony fee and recorded advance amount.
              </p>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-velvi-brown block mb-1">
                  Total Pooja Fee (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editTotalAmount}
                  onChange={(e) => setEditTotalAmount(Number(e.target.value))}
                  className="w-full bg-velvi-cream/40 border border-velvi-gold/30 rounded-xl px-3 py-2 text-sm font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <label className="font-bold text-velvi-brown block mb-1">
                  Advance Received (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={editAdvanceAmount}
                  onChange={(e) => setEditAdvanceAmount(Number(e.target.value))}
                  className="w-full bg-velvi-cream/40 border border-velvi-gold/30 rounded-xl px-3 py-2 text-sm font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              {/* Live Preview Card */}
              <div className="bg-velvi-cream/50 p-3 rounded-xl border border-velvi-gold/20 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-velvi-brown/70">Calculated Balance:</span>
                  <span className="font-extrabold text-sm text-velvi-brownDark">
                    ₹{derivedBalance.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-velvi-brown/70">New Payment Status:</span>
                  <span
                    className={`font-bold px-2 py-0.2 rounded-full text-[10px] ${
                      derivedStatus === "PAID"
                        ? "bg-green-100 text-green-800"
                        : derivedStatus === "PARTIALLY_PAID"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {derivedStatus === "PAID" ? "PAID" : derivedStatus === "PARTIALLY_PAID" ? "PARTIALLY PAID" : "PENDING"}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-velvi-brown block mb-1">
                  Reason for Change *
                </label>
                <input
                  type="text"
                  required
                  value={editPaymentReason}
                  onChange={(e) => setEditPaymentReason(e.target.value)}
                  placeholder="e.g. Discount offered, balance received in cash"
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEditPaymentModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-velvi-brown bg-velvi-cream hover:bg-velvi-creamDark"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-velvi-brown hover:bg-velvi-brownLight shadow-sm"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Cancellation Modal (With Refund vs. Retained Prompt) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-velvi-gold/30">
            <div>
              <h3 className="font-bold text-base text-velvi-brownDark flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-amber-600" />
                <span>Cancel this Booking?</span>
              </h3>
              <p className="text-xs text-velvi-brown/70 mt-0.5">
                Booking #{booking.bookingNumber} • {booking.poojaEnglishName}
              </p>
            </div>

            {/* Cancellation Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-velvi-brown block">
                Reason for Cancellation
              </label>
              <div className="flex flex-wrap gap-1">
                {quickCancelReasons.map((qr) => (
                  <button
                    key={qr}
                    type="button"
                    onClick={() => setCancelReason(qr)}
                    className={`text-[10px] px-2 py-1 rounded-lg border font-medium transition ${
                      cancelReason === qr
                        ? "bg-velvi-brown text-white border-velvi-brown"
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
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>

            {/* Advance Refund vs Retained Decision */}
            {booking.advanceAmount > 0 ? (
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2 text-xs">
                <div className="font-bold text-amber-900">
                  Advance Amount Received: ₹{booking.advanceAmount.toLocaleString("en-IN")}
                </div>
                <p className="text-[11px] text-amber-800/80">
                  What would you like to do with this advance amount?
                </p>

                <div className="space-y-1.5">
                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="radio"
                      name="refundDecision"
                      value="REFUNDED"
                      checked={refundDecision === "REFUNDED"}
                      onChange={() => setRefundDecision("REFUNDED")}
                      className="accent-velvi-brown mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs text-velvi-brownDark">
                        Refund to Customer
                      </div>
                      <div className="text-[10px] text-velvi-brown/60">
                        Full advance amount has been returned to the customer.
                      </div>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-2 rounded-lg bg-white border border-amber-200 cursor-pointer">
                    <input
                      type="radio"
                      name="refundDecision"
                      value="RETAINED"
                      checked={refundDecision === "RETAINED"}
                      onChange={() => setRefundDecision("RETAINED")}
                      className="accent-velvi-brown mt-0.5"
                    />
                    <div>
                      <div className="font-bold text-xs text-velvi-brownDark">
                        Retained by Us
                      </div>
                      <div className="text-[10px] text-velvi-brown/60">
                        Retained as cancellation fee or dakshina according to policy.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-velvi-brown/70 bg-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/20">
                No advance was received. Cancelling with zero financial impact.
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-velvi-brown bg-velvi-cream hover:bg-velvi-creamDark"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-amber-700 hover:bg-amber-800 shadow-sm"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Safety Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-red-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-red-900">
                Delete Booking Permanently?
              </h3>
              <p className="text-xs text-red-700 leading-relaxed">
                Booking #{booking.bookingNumber} ({booking.poojaEnglishName}) and all its associated items and data will be permanently deleted.
              </p>
              <div className="text-[11px] bg-red-50 p-2 rounded-xl text-red-800 font-semibold border border-red-100">
                ⚠️ Warning: This action cannot be undone!
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-velvi-brown bg-velvi-cream hover:bg-velvi-creamDark"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
