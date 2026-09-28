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
import { RecordPaymentModal } from "@/components/payments/RecordPaymentModal";
import { getItemIcon } from "@/lib/samagri/icons";
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
  Receipt,
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
  RotateCcw,
  Plus,
} from "lucide-react";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

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

  // Synchronized payment records list for viewing history
  const paymentRecordsList = React.useMemo(() => {
    if (booking.paymentRecords && booking.paymentRecords.length > 0) {
      return booking.paymentRecords;
    }
    if ((booking.advanceAmount || 0) > 0) {
      return [
        {
          id: `pay-${booking.id}-init`,
          bookingId: booking.id,
          amount: booking.advanceAmount,
          date: booking.paymentDate || booking.date || "2026-09-26",
          method: (booking.paymentMethod as any) || "UPI",
          remark: booking.paymentNotes || "Booking Advance Dakshina",
          discount: booking.discountAmount || 0,
          createdAt: booking.createdAt,
        },
      ];
    }
    return [];
  }, [booking, booking.paymentRecords, booking.advanceAmount, booking.discountAmount]);

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
  const [editPaymentStatus, setEditPaymentStatus] = useState<"UNPAID" | "ADVANCE" | "FULL">(() => {
    if (booking.paymentStatus === "PAID") return "FULL";
    if (booking.advanceAmount && booking.advanceAmount > 0) return "ADVANCE";
    return "UNPAID";
  });
  const [editPaymentMethod, setEditPaymentMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [editPaymentDate, setEditPaymentDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [editPaymentReason, setEditPaymentReason] = useState<string>("Payment adjustment");
  const [paymentError, setPaymentError] = useState<string>("");
  const [showItemsShareModal, setShowItemsShareModal] = useState(false);
  const [showPoojaSlipModal, setShowPoojaSlipModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppType, setWhatsAppType] = useState<"REMINDER" | "CONFIRMATION">("REMINDER");
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [editableWhatsAppMsg, setEditableWhatsAppMsg] = useState("");
  const [showPendingPaymentPrompt, setShowPendingPaymentPrompt] = useState(false);

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

    let finalAdvance = 0;
    if (editPaymentStatus === "FULL") {
      finalAdvance = editTotalAmount;
    } else if (editPaymentStatus === "ADVANCE") {
      finalAdvance = Math.min(editTotalAmount, Math.max(0, editAdvanceAmount));
    } else {
      finalAdvance = 0;
    }

    if (editTotalAmount < 0 || finalAdvance < 0) {
      setPaymentError("Amounts cannot be negative.");
      return;
    }

    const res = db.updateBookingPayment({
      bookingId: booking.id,
      totalAmount: editTotalAmount,
      advanceAmount: finalAdvance,
      updatedBy: currentUser?.name || "Ravi Iyer",
      reason: editPaymentReason,
      date: editPaymentDate,
      method: editPaymentMethod,
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
    if (booking.balanceAmount > 0 || booking.paymentStatus !== "PAID") {
      setShowPendingPaymentPrompt(true);
      return;
    }
    executeBookingCompletion(false);
  };

  const executeBookingCompletion = (collectBalance: boolean) => {
    if (collectBalance) {
      const res = db.updateBookingPayment({
        bookingId: booking.id,
        totalAmount: booking.totalAmount,
        advanceAmount: booking.totalAmount,
        updatedBy: currentUser?.name || "Self",
        reason: "Full balance collected upon completion",
      });
      if (res.booking) {
        booking.advanceAmount = res.booking.advanceAmount;
        booking.balanceAmount = res.booking.balanceAmount;
        booking.paymentStatus = res.booking.paymentStatus;
      }
    }
    db.updateBookingStatus(booking.id, "COMPLETED", currentUser?.name || "Self");
    booking.status = "COMPLETED";
    booking.updatedAt = new Date().toISOString();
    setShowPendingPaymentPrompt(false);
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

  const [showPriestPicker, setShowPriestPicker] = useState(false);
  const [showAddPriestInline, setShowAddPriestInline] = useState(false);
  const [quickNewPriestName, setQuickNewPriestName] = useState("");

  const otherMembers = members.filter((m) => m.id !== ownerMember?.id);

  const handleAssignPriest = (memberId: string, memberName: string) => {
    db.reassignBooking({
      bookingId: booking.id,
      newIyerId: memberId,
      reassignedBy: currentUser?.name || "Ravi Iyer",
      reason: `Assigned to ${memberName}`,
    });
    booking.assignedIyerId = memberId;
    booking.assignedIyerName = memberName;
    setShowPriestPicker(false);
    setShowAddPriestInline(false);
    router.refresh();
  };

  const handleQuickAddNewPriest = () => {
    const trimmed = quickNewPriestName.trim();
    if (!trimmed) return;
    const newMember = db.createMember({
      businessId,
      name: trimmed,
      mobile: "",
      role: "IYER",
    });
    handleAssignPriest(newMember.id, newMember.name);
    setQuickNewPriestName("");
    setShowAddPriestInline(false);
  };

  const handleRevertToSelf = () => {
    const owner = members.find((m) => m.role === "OWNER") || members[0];
    if (!owner) return;
    db.reassignBooking({
      bookingId: booking.id,
      newIyerId: owner.id,
      reassignedBy: currentUser?.name || "Ravi Iyer",
      reason: "Perform myself (Taking back to attend personally)",
    });
    booking.assignedIyerId = owner.id;
    booking.assignedIyerName = currentUser?.name || owner.name || "Ravi Iyer";
    setShowPriestPicker(false);
    router.refresh();
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
            <span>Pooja Slip</span>
          </button>

          {booking.status !== "CANCELLED" && (
            <Link
              href={`/app/bookings/${booking.id}/edit`}
              className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-black flex items-center gap-1.5 border border-emerald-300 shadow-2xs transition active:scale-95 cursor-pointer"
              title="Edit Booking"
            >
              <Edit className="w-3.5 h-3.5 text-emerald-700" />
              <span>Edit</span>
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
                Pooja Ceremony
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
              <User className="w-3.5 h-3.5 text-emerald-700" /> Devotee & Venue
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
                Payment
              </h4>
            </div>

            <div className="flex items-center gap-1.5">
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border ${
                  booking.paymentStatus === "PAID"
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-slate-100 text-slate-800 border-slate-300"
                }`}
              >
                {booking.paymentStatus === "PAID" ? "Full Paid ✓" : "Pending"}
              </span>

              <button
                type="button"
                onClick={() => {
                  setEditTotalAmount(booking.totalAmount);
                  setEditAdvanceAmount(booking.advanceAmount);
                  setEditPaymentStatus(booking.paymentStatus === "PAID" ? "FULL" : booking.advanceAmount > 0 ? "ADVANCE" : "UNPAID");
                  setPaymentError("");
                  setShowEditPaymentModal(true);
                }}
                className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                title="Edit Payment"
              >
                <Edit className="w-3.5 h-3.5 text-slate-700" />
              </button>

              {booking.advanceAmount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowResetPaymentModal(true)}
                  className="p-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg transition shadow-2xs cursor-pointer active:scale-95"
                  title="Reset Payment"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
                </button>
              )}
            </div>
          </div>

          {/* Financial Metrics Strip (With Discount Support) */}
          <div className={`grid gap-2 text-xs ${booking.discountAmount && booking.discountAmount > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 block uppercase">Total Fee</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </div>
            </div>

            {booking.discountAmount && booking.discountAmount > 0 ? (
              <div className="bg-amber-50/80 p-2.5 rounded-xl border border-amber-200 text-center shadow-2xs">
                <span className="text-[10px] font-bold text-amber-800 block uppercase">தள்ளுபடி (Discount)</span>
                <div className="text-sm font-black text-amber-900 mt-0.5">
                  -₹{booking.discountAmount.toLocaleString("en-IN")}
                </div>
              </div>
            ) : null}

            <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-emerald-800 block uppercase">Paid Amount</span>
              <div className="text-sm font-black text-emerald-900 mt-0.5">
                ₹{booking.advanceAmount.toLocaleString("en-IN")}
              </div>
            </div>

            <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center shadow-2xs">
              <span className="text-[10px] font-bold text-slate-600 block uppercase">Balance Due</span>
              <div className="text-sm font-black text-slate-900 mt-0.5">
                ₹{booking.balanceAmount.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {/* Recorded Payments History List (கட்டண வரவு பதிவுகள்) */}
          {paymentRecordsList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                  Payment History ({paymentRecordsList.length}):
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">
                  History &amp; Remarks
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-2xs">
                {paymentRecordsList.map((rec, idx) => (
                  <div key={rec.id || idx} className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 transition">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200">
                        {rec.method === "CASH" ? "💵" : rec.method === "BANK_TRANSFER" ? "🏛️" : rec.method === "CHEQUE" ? "📑" : "📱"}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-slate-900 text-xs">
                            +₹{rec.amount.toLocaleString("en-IN")}
                          </span>
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                            {rec.method}
                          </span>
                          {rec.discount && rec.discount > 0 ? (
                            <span className="text-[9.5px] font-black px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              -₹{rec.discount} தள்ளுபடி
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[10.5px] text-slate-500 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                          <span>📅 {rec.date}</span>
                          {rec.remark && <span>• 📝 {rec.remark}</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0">
                      Received ✓
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

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
        <div className="p-4 space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span>Performing Priest</span>
            </span>
            <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
              {isSelf ? "🪔 Self" : `👤 ${booking.assignedIyerName || "Other"}`}
            </span>
          </div>

          {/* Clean Segmented Pill: Self vs Other */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold border border-slate-200/80">
            <button
              type="button"
              onClick={handleRevertToSelf}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                isSelf
                  ? "bg-emerald-800 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              <span>🪔 Self ({currentUser?.name || "Mani Raja"})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPriestPicker(true);
                if (isSelf && otherMembers.length > 0) {
                  handleAssignPriest(otherMembers[0].id, otherMembers[0].name);
                }
              }}
              className={`py-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer text-xs ${
                !isSelf
                  ? "bg-emerald-800 text-white shadow-2xs font-extrabold"
                  : "text-slate-600 hover:text-slate-900 font-semibold"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👥 Other Priest</span>
            </button>
          </div>

          {/* Other Priest Selection: Clean Chips + Inline Add Button */}
          {(!isSelf || showPriestPicker) && (
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                  Select Priest:
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddPriestInline(!showAddPriestInline)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddPriestInline ? "Close" : "Add Priest"}</span>
                </button>
              </div>

              {/* Inline Add Priest Form */}
              {showAddPriestInline && (
                <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2">
                  <span className="text-[10.5px] font-bold text-emerald-950 block">New Priest:</span>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={quickNewPriestName}
                      onChange={(e) => setQuickNewPriestName(e.target.value)}
                      placeholder="Priest Name (e.g. Vignesh Dikshithar)..."
                      className="flex-1 px-3 py-1.5 bg-white rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:border-emerald-600 shadow-2xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleQuickAddNewPriest}
                      className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer active:scale-95 shrink-0"
                    >
                      Save ✓
                    </button>
                  </div>
                </div>
              )}

              {/* Existing Priest Chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {otherMembers.length === 0 && !showAddPriestInline ? (
                  <p className="text-xs text-slate-400 italic">
                    No other priests added yet. Click "+ Add Priest" to add one.
                  </p>
                ) : (
                  otherMembers.map((m) => {
                    const isCurrent = booking.assignedIyerName === m.name;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleAssignPriest(m.id, m.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer active:scale-95 ${
                          isCurrent
                            ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <span>{m.name}</span>
                        {isCurrent && <span className="ml-1 text-amber-300">✓</span>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 5. POOJA ITEMS & SAMAGRI CHECKLIST (Checklist Format 1, 2, 3.. One-Line) */}
        <div className="p-4 space-y-2.5 bg-slate-50/60">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>Samagri Checklist ({booking.items?.length || 0})</span>
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
                className="text-[11px] font-bold text-emerald-800 bg-white hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                title="View & Save Samagri List Image Slip"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
                <span>View Image Slip 📸</span>
              </button>
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="text-[11px] font-bold text-slate-800 bg-emerald-100/80 hover:bg-emerald-200/80 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 cursor-pointer transition active:scale-95 shadow-2xs"
                title="Share WhatsApp Message"
              >
                <MessageCircle className="w-3.5 h-3.5 text-emerald-800" />
                <span>WhatsApp Share</span>
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
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200/70 flex items-center justify-center text-sm shrink-0 shadow-2xs">
                      {getItemIcon(item, item.category)}
                    </div>
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
              <span>Mark Completed</span>
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

      {/* Pending Balance Check on Completion Modal */}
      {showPendingPaymentPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 shadow-2xl border border-amber-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 leading-tight">
                  பூஜை நிறைவு &amp; கட்டண வரவு
                </h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                  Payment Verification on Completion
                </p>
              </div>
            </div>

            {/* Details Box */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>பக்தர் / Client:</span>
                <span className="text-slate-900 font-extrabold truncate max-w-[180px]">
                  {booking.customerName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-700 font-bold">
                <span>பூஜை / Pooja:</span>
                <span className="text-slate-900 font-extrabold truncate max-w-[180px]">
                  {booking.poojaEnglishName || booking.poojaTamilName}
                </span>
              </div>
              <div className="h-px bg-amber-200/70 my-1" />
              <div className="flex justify-between items-center text-slate-600">
                <span>மொத்த கட்டணம் (Total):</span>
                <span className="font-bold">₹{booking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700">
                <span>முன்பணம் பெற்றது (Paid):</span>
                <span className="font-bold">₹{booking.advanceAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-rose-700 font-extrabold text-sm pt-1 border-t border-amber-200/60">
                <span>மீதமுள்ள பாக்கி (Pending):</span>
                <span className="text-base text-rose-600 font-black">
                  ₹{booking.balanceAmount.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              இந்த பூஜையை நிறைவு செய்யும்போது, மீதமுள்ள தொகையை (
              <strong className="text-rose-600 font-extrabold">
                ₹{booking.balanceAmount.toLocaleString("en-IN")}
              </strong>
              ) வசூலித்ததாக வரவு வைக்கவா?
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => executeBookingCompletion(true)}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white rounded-2xl font-extrabold text-xs shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>ஆம், முழுத்தொகை வரவு வைத்து நிறைவு செய்</span>
              </button>

              <button
                type="button"
                onClick={() => executeBookingCompletion(false)}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>பாக்கி அப்படியே இருக்கட்டும் (மட்டும் நிறைவு செய்)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPendingPaymentPrompt(false)}
                className="w-full py-2 text-center text-xs font-bold text-slate-400 hover:text-slate-600 transition cursor-pointer"
              >
                ரத்து செய் (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Quick Universal Payment Recording Modal */}
      <RecordPaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        booking={booking}
        onSuccess={(updatedBooking) => {
          Object.assign(booking, updatedBooking);
          setPaymentAmount(updatedBooking.balanceAmount || 0);
          router.refresh();
        }}
        currentUserName={currentUser?.name || "Priest"}
      />

      {/* 2. Controlled Edit Payment Modal (Matching New Booking Step 2 Method & UI) */}
      {showEditPaymentModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <form
            onSubmit={handleConfirmEditPayment}
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-950 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Edit Payment
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Update dakshina fee &amp; payment status
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditPaymentModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>

            {paymentError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Total Dakshina Amount (Matching New Booking with Steppers) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Total Dakshina (தட்சிணைத் தொகை):</span>
                <span className="text-[10.5px] text-slate-400 font-normal">Direct Manual Input</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    required
                    value={editTotalAmount}
                    onChange={(e) => setEditTotalAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-black text-slate-900 text-base focus:outline-none focus:border-emerald-600 shadow-inner"
                  />
                </div>
                {/* Steppers */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditTotalAmount((v) => Math.max(0, v - 500))}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    -500
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTotalAmount((v) => v + 500)}
                    className="px-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold cursor-pointer"
                  >
                    +500
                  </button>
                </div>
              </div>
            </div>

            {/* Payment Status Segmented Control (3 Options matching New Booking) */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-bold text-slate-700 block">Payment Status:</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditPaymentStatus("UNPAID")}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                    editPaymentStatus === "UNPAID"
                      ? "bg-amber-800 text-white font-black shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <span>⏳ Pending</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditPaymentStatus("ADVANCE");
                    if (editAdvanceAmount <= 0) {
                      setEditAdvanceAmount(Math.round(editTotalAmount * 0.4 / 100) * 100 || 1000);
                    }
                  }}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                    editPaymentStatus === "ADVANCE"
                      ? "bg-slate-900 text-white font-black shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <span>🪙 Advance</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditPaymentStatus("FULL")}
                  className={`py-2 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 text-[11px] ${
                    editPaymentStatus === "FULL"
                      ? "bg-emerald-800 text-white font-black shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 font-semibold"
                  }`}
                >
                  <span>✅ Full Paid</span>
                </button>
              </div>
            </div>

            {/* Advance amount row if status === 'ADVANCE' */}
            {editPaymentStatus === "ADVANCE" && (
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between text-xs font-bold text-amber-950">
                  <span>Advance Received:</span>
                  <span className="text-[11px] font-black text-amber-900">
                    Balance Due: ₹{Math.max(0, editTotalAmount - editAdvanceAmount).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="1"
                    max={editTotalAmount}
                    value={editAdvanceAmount}
                    onChange={(e) => setEditAdvanceAmount(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:border-amber-600 shadow-2xs"
                  />
                </div>
              </div>
            )}

            {/* Payment Mode Selector */}
            {editPaymentStatus !== "UNPAID" && (
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-700 block">Payment Mode:</span>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  {(["UPI", "CASH", "BANK_TRANSFER"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setEditPaymentMethod(mode)}
                      className={`py-1.5 px-2 rounded-xl border transition cursor-pointer text-[11px] font-bold ${
                        editPaymentMethod === mode
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {mode === "UPI" ? "📱 UPI" : mode === "CASH" ? "💵 Cash" : "🏦 Bank"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Date & Reason */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Payment Date (தேதி):
                </label>
                <input
                  type="date"
                  required
                  value={editPaymentDate}
                  onChange={(e) => setEditPaymentDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Remark / Reason:
                </label>
                <input
                  type="text"
                  value={editPaymentReason}
                  onChange={(e) => setEditPaymentReason(e.target.value)}
                  placeholder="e.g. Paid in full"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowEditPaymentModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-800 hover:bg-emerald-900 shadow-md transition cursor-pointer active:scale-95"
              >
                Save Payment ✓
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
                Delete / Reset Payment?
              </h3>
              <p className="text-xs text-rose-800 leading-relaxed">
                The recorded payment of <strong>₹{booking.advanceAmount.toLocaleString("en-IN")}</strong> for booking #{booking.bookingNumber} will be deleted, and the balance due will reset to <strong>₹{booking.totalAmount.toLocaleString("en-IN")}</strong>.
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
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPayment}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm"
              >
                Reset Payment
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
                    WhatsApp Message
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Send update or reminder to devotee
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowWhatsAppModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
                aria-label="Close"
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
                  ⏰ Reminder
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
                  📩 Confirmation
                </button>
              </div>
            </div>

            {/* Message Preview & Edit */}
            <div className="px-4 py-2 flex-1 overflow-hidden flex flex-col min-h-0 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-600 flex items-center justify-between">
                <span className="font-bold flex items-center gap-1">
                  <span>Message Preview & Edit:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setEditableWhatsAppMsg(currentWhatsAppMsg)}
                  className="text-[10px] text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
                  title="Reset back to default template message"
                >
                  Reset
                </button>
              </div>
              <textarea
                value={editableWhatsAppMsg}
                onChange={(e) => setEditableWhatsAppMsg(e.target.value)}
                rows={11}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-2xl p-3 text-xs text-slate-800 focus:bg-white focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/30 outline-none resize-none overflow-y-auto leading-relaxed font-sans shadow-inner max-h-[300px]"
                placeholder="Type WhatsApp message..."
              />
              <p className="text-[9.5px] text-slate-400 italic">
                💡 You can edit and customize this message before sending.
              </p>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-100 flex gap-2.5 bg-slate-50/50">
              <button
                type="button"
                onClick={handleCopyWhatsApp}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer ${
                  copiedWhatsApp
                    ? "bg-emerald-50 border-2 border-emerald-500 text-emerald-800 scale-[1.02] ring-2 ring-emerald-400/80 shadow-md"
                    : "bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm"
                }`}
              >
                {copiedWhatsApp ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-50 duration-200" />
                    <span className="text-emerald-700 font-extrabold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Send to WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
