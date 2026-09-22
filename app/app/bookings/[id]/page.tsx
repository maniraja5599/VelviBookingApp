"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { getTamilDate, formatTime12H } from "@/lib/calendar/tamil";
import {
  formatBookingConfirmationWhatsAppMessage,
  formatPoojaReminderWhatsAppMessage,
  formatUnitTamil,
} from "@/lib/whatsapp/formatter";
import { PoojaListShareModal } from "@/components/bookings/PoojaListShareModal";
import { PoojaSlipModal } from "@/components/bookings/PoojaSlipModal";
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
  CheckSquare,
  Check,
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
  Copy,
  X,
  Send,
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
  const [showResetPaymentModal, setShowResetPaymentModal] = useState(false);

  // Controlled Payment Edit states
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [editTotalAmount, setEditTotalAmount] = useState<number>(booking.totalAmount || 0);
  const [editAdvanceAmount, setEditAdvanceAmount] = useState<number>(booking.advanceAmount || 0);
  const [editPaymentReason, setEditPaymentReason] = useState<string>("Payment adjustment");
  const [paymentError, setPaymentError] = useState<string>("");
  const [showItemsShareModal, setShowItemsShareModal] = useState(false);
  const [showPoojaSlipModal, setShowPoojaSlipModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppType, setWhatsAppType] = useState<"REMINDER" | "CONFIRMATION">("REMINDER");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [editableWhatsAppMsg, setEditableWhatsAppMsg] = useState("");

  const quickCancelReasons = [
    "Client request",
    "Date postponed",
    "Unavoidable conflict",
    "Family emergency",
  ];

  const currentWhatsAppMsg = React.useMemo(() => {
    if (!currentBusiness) return "";
    return whatsAppType === "REMINDER"
      ? formatPoojaReminderWhatsAppMessage(booking, currentBusiness)
      : formatBookingConfirmationWhatsAppMessage(booking, currentBusiness);
  }, [whatsAppType, booking, currentBusiness]);

  useEffect(() => {
    if (currentWhatsAppMsg) {
      setEditableWhatsAppMsg(currentWhatsAppMsg);
    }
  }, [currentWhatsAppMsg]);

  const handleSendWhatsApp = () => {
    const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";
    const msgToSend = editableWhatsAppMsg || currentWhatsAppMsg;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msgToSend)}`, "_blank");
  };

  const handleCopyWhatsApp = async () => {
    try {
      const msgToSend = editableWhatsAppMsg || currentWhatsAppMsg;
      await navigator.clipboard.writeText(msgToSend);
      setCopiedWhatsApp(true);
      setTimeout(() => setCopiedWhatsApp(false), 2000);
    } catch (_) {}
  };

  const handleWhatsAppShare = () => {
    setShowWhatsAppModal(true);
  };

  const handleRecordPayment = () => {
    if (paymentAmount <= 0) return;
    const res = db.recordBookingPayment({
      bookingId: booking.id,
      amount: paymentAmount,
      recordedBy: currentUser?.name || "Ravi Iyer",
      notes: "Direct payment recorded from booking screen",
    });
    if (res.success && res.booking) {
      booking.advanceAmount = res.booking.advanceAmount;
      booking.balanceAmount = res.booking.balanceAmount;
      booking.paymentStatus = res.booking.paymentStatus;
      booking.updatedAt = res.booking.updatedAt;
    }
    setShowPaymentModal(false);
    router.refresh();
  };

  const handleConfirmResetPayment = () => {
    const res = db.resetBookingPayment({
      bookingId: booking.id,
      deletedBy: currentUser?.name || "Ravi Iyer",
      reason: "Manual payment reset from booking details screen",
    });
    if (res.success && res.booking) {
      booking.advanceAmount = res.booking.advanceAmount;
      booking.balanceAmount = res.booking.balanceAmount;
      booking.paymentStatus = res.booking.paymentStatus;
      booking.updatedAt = res.booking.updatedAt;
    }
    setShowResetPaymentModal(false);
    router.refresh();
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

  const [showCreatedBanner, setShowCreatedBanner] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("created") === "true") {
        setShowCreatedBanner(true);
      }
    }
  }, []);

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Celebratory Just Created Banner */}
      {showCreatedBanner && (
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-[#0b2b17] text-white p-4 rounded-2xl shadow-md border border-emerald-600 flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center shrink-0 font-bold shadow-sm">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="font-extrabold text-sm flex items-center gap-1.5 flex-wrap">
                <span>🎉 பூஜை முன்பதிவு வெற்றிகரமாக உறுதியானது!</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.2 rounded-full font-mono text-amber-200">
                  {booking.bookingNumber}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                Pooja is confirmed. You can share confirmation directly with devotee on WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-500" />
              <span className="hidden sm:inline">WhatsApp Share</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreatedBanner(false)}
              className="p-1.5 text-emerald-200 hover:text-white rounded-lg transition"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Bar with Edit & Back */}
      {/* Top Bar with Edit, Pooja Slip & Back */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Link
            href="/app/bookings"
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition border border-slate-200 bg-white shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <span className="font-extrabold text-sm sm:text-base text-slate-900">
            Booking {booking.bookingNumber.startsWith("#") ? booking.bookingNumber : `#${booking.bookingNumber}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowPoojaSlipModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 border border-amber-500/80 shadow-xs ring-2 ring-amber-400/30 transition active:scale-95 cursor-pointer"
            title="Pooja Slip & Samagri"
          >
            <span>📜</span>
            <span>பூஜை ரசீது</span>
          </button>

          {booking.status !== "CANCELLED" && (
            <Link
              href={`/app/bookings/${booking.id}/edit`}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Edit Booking"
            >
              <Edit className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit (திருத்து)</span>
            </Link>
          )}

          {booking.status === "CANCELLED" && (
            <div className="px-2.5 py-1 rounded-xl text-[11px] font-black flex items-center gap-1.5 bg-red-50 text-red-900 border border-red-200 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>CANCELLED</span>
            </div>
          )}
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

      {/* UNIFIED CONTINUOUS SACRED CEREMONY DOCUMENT */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden divide-y divide-slate-100">
        {/* 1. SACRED HERO CEREMONY HEADER */}
        <div className="bg-gradient-to-br from-[#0c331e] via-[#0f4026] to-[#072414] p-5 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-36 h-36 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 block">
                Pooja Ceremony (ஹோமம் / பூஜை)
              </span>
              <h2 className="text-xl font-black text-white mt-0.5 leading-tight">
                {booking.poojaEnglishName || booking.poojaTamilName}
              </h2>
              {booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName && (
                <div className="text-xs font-bold text-emerald-200 mt-0.5">
                  {booking.poojaTamilName}
                </div>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-xl font-black text-white block">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </span>
              <div className="text-[10px] text-emerald-200 font-bold">Total Dakshina</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 mt-3 border-t border-white/15 text-xs relative z-10">
            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/15">
              <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold uppercase">
                <Calendar className="w-3.5 h-3.5" />
                <span>Auspicious Date</span>
              </div>
              <div className="font-black text-white mt-0.5 text-xs">{dateInfo.formattedDualDate}</div>
              <div className="text-[10px] text-emerald-100">{dateInfo.dayOfWeekTa} ({dateInfo.dayOfWeekEn})</div>
            </div>

            <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-2xl border border-white/15">
              <div className="flex items-center gap-1.5 text-amber-300 text-[10px] font-bold uppercase">
                <Clock className="w-3.5 h-3.5" />
                <span>Ceremony Time</span>
              </div>
              <div className="font-black text-white mt-0.5 text-sm">{formatTime12H(booking.startTime)}</div>
              <div className="text-[10px] text-emerald-100">{dateInfo.tithiTa}</div>
            </div>
          </div>
        </div>

        {/* 2. DEVOTEE & VENUE INFORMATION */}
        <div className="p-4 space-y-2.5 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" /> Devotee & Venue (பக்தர் & இடம்)
            </span>

            <div className="flex items-center gap-1.5">
              {booking.customerMobile && (
                <a
                  href={`tel:${booking.customerMobile}`}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                  title="Call Devotee"
                >
                  <Phone className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              <button
                onClick={handleWhatsAppShare}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                title="WhatsApp Devotee"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block">Devotee Name</span>
              <div className="font-black text-slate-900 mt-0.5 text-sm">{booking.customerName}</div>
              {booking.customerMobile && (
                <div className="text-[11px] font-bold text-slate-600 mt-0.5">📱 {booking.customerMobile}</div>
              )}
            </div>

            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-400 font-bold block">Ceremony Location</span>
              <div className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>{booking.location || "Namakkal / Devotee Residence"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FINANCIAL SETTLEMENT & DAKSHINA SUMMARY */}
        <div className="p-4 space-y-3 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold text-xs">
                <IndianRupee className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-black text-slate-900">
                Payment & Dakshina Summary (கட்டண விவரம்)
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                  booking.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                {booking.paymentStatus === "PAID" ? "Full Paid ✓" : "Advance Pending"}
              </span>

              <button
                onClick={() => {
                  setEditTotalAmount(booking.totalAmount);
                  setEditAdvanceAmount(booking.advanceAmount);
                  setPaymentError("");
                  setShowEditPaymentModal(true);
                }}
                className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-0.5"
                title="Edit Payment Amounts"
              >
                <Edit className="w-3 h-3 text-slate-600" />
                <span>Edit</span>
              </button>

              {booking.advanceAmount > 0 && (
                <button
                  onClick={() => setShowResetPaymentModal(true)}
                  className="text-[11px] font-bold text-rose-800 hover:text-rose-950 underline flex items-center gap-0.5 ml-1"
                  title="Reset or Delete Collected Payment"
                >
                  <Trash2 className="w-3 h-3 text-rose-600" />
                  <span>கட்டணம் நீக்கு</span>
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 block">Total Fee</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 block">Advance Paid</span>
              <div className="text-sm font-black text-emerald-900 mt-0.5">
                ₹{booking.advanceAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-600 block">Balance Due</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{booking.balanceAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {booking.balanceAmount > 0 && booking.status !== "CANCELLED" && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>Record Additional Payment (கட்டணம் செலுத்த)</span>
            </button>
          )}
        </div>

        {/* 4. PERFORMING PRIEST ASSIGNMENT */}
        <div className="p-4 space-y-2.5 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
              Performing Priest (செய்து வைக்கும் குருக்கள்)
            </span>
            {isSelf ? (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-900 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                <span>🪔</span> தலைமை குருக்கள் (Self)
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full border border-blue-200 flex items-center gap-1">
                <Users className="w-3 h-3" /> Delegated Team Member
              </span>
            )}
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold shadow-2xs shrink-0 ${
                  isSelf ? "bg-emerald-800 text-white" : "bg-blue-600 text-white"
                }`}
              >
                {isSelf ? "🪔" : "👤"}
              </div>
              <div className="min-w-0">
                <div className="font-black text-xs text-slate-900 truncate">
                  {booking.assignedIyerName || (isSelf ? (currentUser?.name || "Ravi Iyer") : "Unassigned")}
                </div>
                <p className="text-[10.5px] text-slate-500">
                  {isSelf
                    ? "நீங்கள் நேரடியாக சென்று செய்து வைக்கிறீர்கள் (Self Performed)"
                    : "வேறு குருக்களுக்கு ஒப்படைக்கப்பட்டுள்ளது (Delegated)"}
                </p>
              </div>
            </div>

            <div className="shrink-0">
              {isSelf ? (
                <Link
                  href={`/app/bookings/${booking.id}/assign`}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Delegate</span>
                </Link>
              ) : (
                <button
                  onClick={handleRevertToSelf}
                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1 transition"
                >
                  <span>🪔 Take Back</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 5. POOJA ITEMS & SAMAGRI CHECKLIST (Checklist Format 1, 2, 3.. One-Line) */}
        <div className="p-4 space-y-2.5 bg-slate-50/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>சாமக்கிரி பொருட்கள் செக்-லிஸ்ட் ({booking.items?.length || 0})</span>
            </span>

            <div className="flex items-center gap-1.5 flex-wrap">
              <Link
                href={`/app/bookings/${booking.id}/items`}
                className="text-[11px] font-bold text-slate-700 hover:text-emerald-800 bg-white hover:bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 transition shadow-2xs"
              >
                Edit Items →
              </Link>
              <button
                type="button"
                onClick={() => setShowPoojaSlipModal(true)}
                className="text-[11px] font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-lg border border-amber-300 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                title="Pooja Slip & Samagri"
              >
                <span>📜 பூஜை ரசீது</span>
              </button>
              <button
                type="button"
                onClick={() => setShowItemsShareModal(true)}
                className="text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
              >
                <Share2 className="w-3 h-3 text-emerald-600" />
                <span>Share List</span>
              </button>
            </div>
          </div>

          {booking.items && booking.items.length > 0 ? (
            <div className="bg-white rounded-2xl border border-emerald-200/80 divide-y divide-slate-100 max-h-64 overflow-y-auto pr-1 shadow-2xs">
              {booking.items.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-2.5 flex items-center justify-between gap-2 hover:bg-emerald-50/30 transition text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-950 font-black text-[10.5px] flex items-center justify-center shrink-0 border border-emerald-200">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-slate-900 truncate block">
                        {item.itemTamilName || item.itemEnglishName}
                      </span>
                      {item.itemEnglishName && item.itemTamilName && item.itemEnglishName !== item.itemTamilName && (
                        <span className="text-[10px] text-slate-400 font-medium truncate block">
                          {item.itemEnglishName}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-emerald-950 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                    {item.quantity} {formatUnitTamil(item.unit) || item.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">சாமக்கிரி பொருட்கள் எதுவும் பதிவு செய்யப்படவில்லை.</p>
          )}
        </div>

        {/* 6. CEREMONY ACTIONS FOOTER */}
        <div className="p-4 bg-white space-y-2">
          {booking.status !== "COMPLETED" && booking.status !== "CANCELLED" && (
            <button
              onClick={handleMarkCompleted}
              className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Mark Completed (பூஜை நிறைவடைந்தது)</span>
            </button>
          )}

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

              {/* Explicit Payment Impact Warning as requested */}
              {booking.advanceAmount > 0 && (
                <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-xl text-left space-y-1">
                  <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>கட்டண எச்சரிக்கை (Payment Warning):</span>
                  </div>
                  <p className="text-[11px] text-amber-900 leading-tight font-medium">
                    இந்த முன்பதிவில் பெறப்பட்ட கட்டணத் தொகை <strong className="text-amber-950 underline">₹{booking.advanceAmount.toLocaleString("en-IN")}</strong> மற்றும் அனைத்து கணக்கு விவரங்களும் நிரந்தரமாக நீக்கப்படும்!
                  </p>
                  <span className="text-[10px] text-amber-800 block font-semibold">
                    (Associated collected payments of ₹{booking.advanceAmount.toLocaleString("en-IN")} will also be permanently deleted!)
                  </span>
                </div>
              )}
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

      {/* 5. Reset Payment Confirmation Modal */}
      {showResetPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-rose-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-rose-950">
                கட்டணத்தை நீக்கவா? (Delete/Reset Payment)
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                பதிவு #{booking.bookingNumber}-ல் பெறப்பட்ட கட்டணம் <strong>₹{booking.advanceAmount.toLocaleString("en-IN")}</strong> நீக்கப்பட்டு, மீதமுள்ள நிலுவைத் தொகை <strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong> ஆக மாற்றப்படும்.
              </p>
              <div className="text-[11px] bg-amber-50 p-2 rounded-xl text-amber-900 font-semibold border border-amber-200">
                Payment status will change back to PENDING.
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200"
              >
                ரத்து (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPayment}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                ஆம், நீக்கு (Reset Payment)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pooja Samagri Items WhatsApp & Image Preview Modal */}
      {currentBusiness && (
        <PoojaListShareModal
          isOpen={showItemsShareModal}
          onClose={() => setShowItemsShareModal(false)}
          booking={booking}
          business={currentBusiness}
        />
      )}

      {/* Sacred Pooja Slip & Samagri Checklist PDF Modal */}
      {showPoojaSlipModal && (
        <PoojaSlipModal
          booking={booking}
          business={currentBusiness}
          onClose={() => setShowPoojaSlipModal(false)}
        />
      )}

      {/* Devotee WhatsApp Modal (Reminder & Confirmation) */}
      {showWhatsAppModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 leading-tight">
                    வாட்ஸ்அப் செய்தி
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    பக்தருக்கு அனுப்ப வேண்டிய தகவல்
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Type Switcher Pills */}
            <div className="p-4 pb-2">
              <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
                <button
                  type="button"
                  onClick={() => setWhatsAppType("REMINDER")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    whatsAppType === "REMINDER"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  ⏰ பூஜை நினைவூட்டல் (Reminder)
                </button>
                <button
                  type="button"
                  onClick={() => setWhatsAppType("CONFIRMATION")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                    whatsAppType === "CONFIRMATION"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  📩 உறுதிப்படுத்தல் (Confirmation)
                </button>
              </div>
            </div>

            {/* Message Preview & Edit */}
            <div className="px-4 py-2 flex-1 overflow-hidden flex flex-col min-h-0 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1">
                  <span>செய்தி முன்னோட்டம் & திருத்துதல் (Preview & Edit):</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditableWhatsAppMsg(currentWhatsAppMsg)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  title="Reset back to default template message"
                >
                  மீட்டமை (Reset)
                </button>
              </div>
              <textarea
                value={editableWhatsAppMsg}
                onChange={(e) => setEditableWhatsAppMsg(e.target.value)}
                rows={11}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 outline-none resize-none overflow-y-auto leading-relaxed font-sans shadow-inner max-h-[300px]"
                placeholder="வாட்ஸ்அப் செய்தி..."
              />
              <p className="text-[9.5px] text-slate-400 italic">
                💡 அனுப்புவதற்கு முன் இந்தச் செய்தியை உங்கள் விருப்பப்படி திருத்திக் கொள்ளலாம்.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {copiedWhatsApp ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">நகலெடுக்கப்பட்டது!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>நகலெடு (Copy)</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>அனுப்பு (WhatsApp)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
