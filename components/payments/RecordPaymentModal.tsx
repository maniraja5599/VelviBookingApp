"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Booking } from "@/lib/types";
import { db } from "@/lib/db/store";
import {
  IndianRupee,
  Calendar,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Tag,
  FileText,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { getLocalDateString } from "@/lib/calendar/tamil";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onSuccess?: (updatedBooking: Booking) => void;
  currentUserName?: string;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  booking,
  onSuccess,
  currentUserName = "Priest",
}: RecordPaymentModalProps) {
  const todayStr = getLocalDateString();

  // Controlled form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER" | "CHEQUE">("UPI");
  const [paymentRemark, setPaymentRemark] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form when modal opens or booking changes
  useEffect(() => {
    if (booking && isOpen) {
      setPaymentAmount(booking.balanceAmount || 0);
      setDiscountAmount(0);
      setPaymentDate(todayStr);
      setPaymentMethod((booking.paymentMethod as any) || "UPI");
      setPaymentRemark("");
      setErrorMessage("");
      setIsSubmitting(false);
    }
  }, [booking, isOpen, todayStr]);

  // Dynamic Math Calculations
  const calculations = useMemo(() => {
    if (!booking) {
      return {
        totalAmount: 0,
        alreadyPaid: 0,
        existingDiscount: 0,
        newDiscount: 0,
        totalDiscount: 0,
        netPayable: 0,
        currentPaying: 0,
        newRemainingBalance: 0,
        isFullPaid: false,
        isOverpaid: false,
      };
    }

    const totalAmount = booking.totalAmount || 0;
    const alreadyPaid = booking.advanceAmount || 0;
    const existingDiscount = booking.discountAmount || 0;
    const newDiscount = Math.max(0, discountAmount || 0);
    const totalDiscount = existingDiscount + newDiscount;

    const netPayable = Math.max(0, totalAmount - totalDiscount);
    const currentPaying = Math.max(0, paymentAmount || 0);
    const currentBalanceDue = booking.balanceAmount || 0;

    const newRemainingBalance = Math.max(0, currentBalanceDue - newDiscount - currentPaying);
    const isOverpaid = (currentPaying + newDiscount) > currentBalanceDue;
    const isFullPaid = newRemainingBalance === 0 && (alreadyPaid + currentPaying) > 0;

    return {
      totalAmount,
      alreadyPaid,
      existingDiscount,
      newDiscount,
      totalDiscount,
      netPayable,
      currentPaying,
      newRemainingBalance,
      isFullPaid,
      isOverpaid,
    };
  }, [booking, paymentAmount, discountAmount]);

  if (!isOpen || !booking) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculations.currentPaying <= 0 && calculations.newDiscount <= 0) {
      setErrorMessage("தயவுசெய்து பெறும் தொகை அல்லது தள்ளுபடி தொகையை உள்ளிடவும் (Please enter amount or discount).");
      return;
    }

    if (calculations.isOverpaid) {
      setErrorMessage("செலுத்தும் தொகை மற்றும் தள்ளுபடி, மீதமுள்ள பாக்கியை விட அதிகமாக இருக்கக்கூடாது.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const res = db.recordBookingPayment({
        bookingId: booking.id,
        amount: calculations.currentPaying,
        discount: calculations.newDiscount,
        paymentDate,
        paymentMethod,
        notes: paymentRemark.trim() || undefined,
        recordedBy: currentUserName,
      });

      if (res.success && res.booking) {
        if (onSuccess) {
          onSuccess(res.booking);
        }
        onClose();
      } else {
        setErrorMessage(res.error || "கட்டணத்தைப் பதிவு செய்வதில் பிழை ஏற்பட்டது.");
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to record payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Header (Emerald & Gold Sacred Vedic Theme) */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-inner">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base tracking-tight flex items-center gap-1.5">
                <span>கட்டண வரவு பதிவு</span>
                <span className="text-[10px] font-bold text-emerald-200 uppercase bg-emerald-800/80 px-2 py-0.5 rounded-full border border-emerald-600">
                  Record Payment
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                {booking.customerName} • {booking.bookingNumber}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Quick Info Strip */}
          <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 text-center">
            <div>
              <span className="text-[9.5px] font-bold text-slate-500 block uppercase">மொத்த தட்சணை</span>
              <span className="font-extrabold text-slate-900 text-xs sm:text-sm">
                ₹{booking.totalAmount.toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-emerald-700 block uppercase">பெற்ற முன்பணம்</span>
              <span className="font-extrabold text-emerald-800 text-xs sm:text-sm">
                ₹{(booking.advanceAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
            <div>
              <span className="text-[9.5px] font-bold text-rose-700 block uppercase">தற்போதைய பாக்கி</span>
              <span className="font-black text-rose-700 text-xs sm:text-sm">
                ₹{(booking.balanceAmount || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. PAYMENT DATE (பணம் பெற்ற தேதி) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>பணம் பெற்ற தேதி (Payment Date) *</span>
              </label>
              <div className="flex items-center gap-1 text-[10.5px]">
                <button
                  type="button"
                  onClick={() => setPaymentDate(todayStr)}
                  className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer ${
                    paymentDate === todayStr
                      ? "bg-emerald-800 text-white font-black shadow-xs"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  இன்று (Today)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const yest = new Date();
                    yest.setDate(yest.getDate() - 1);
                    setPaymentDate(yest.toISOString().split("T")[0]);
                  }}
                  className="px-2 py-0.5 rounded-lg font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                >
                  நேற்று (Yesterday)
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none transition"
            />
          </div>

          {/* 2. PAYMENT AMOUNT (பெறும் தொகை) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                <span>பெறும் தொகை (Amount Received) *</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaymentAmount(booking.balanceAmount || 0)}
                  className="px-2 py-0.5 rounded-lg font-extrabold text-[10px] bg-emerald-100 text-emerald-900 hover:bg-emerald-200 border border-emerald-300 transition cursor-pointer"
                >
                  முழு பாக்கி (₹{booking.balanceAmount?.toLocaleString("en-IN")})
                </button>
                {booking.balanceAmount > 100 && (
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(Math.round(booking.balanceAmount / 2))}
                    className="px-2 py-0.5 rounded-lg font-extrabold text-[10px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 transition cursor-pointer"
                  >
                    50%
                  </button>
                )}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                ₹
              </span>
              <input
                type="number"
                min={0}
                max={booking.balanceAmount}
                value={paymentAmount || ""}
                placeholder="0"
                onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl text-sm font-black text-slate-900 focus:outline-none transition"
              />
            </div>
          </div>

          {/* 3. DISCOUNT (தள்ளுபடி) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-amber-600" />
                <span>தள்ளுபடி தொகை (Discount Concession - optional)</span>
              </label>
              {discountAmount > 0 && (
                <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                  -₹{discountAmount.toLocaleString("en-IN")} தள்ளுபடி
                </span>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-amber-600">
                -₹
              </span>
              <input
                type="number"
                min={0}
                max={booking.balanceAmount - paymentAmount}
                value={discountAmount || ""}
                placeholder="0 (எ.கா: ₹500 சிறப்பு தள்ளுபடி)"
                onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-9 pr-3 py-1.5 bg-amber-50/50 border border-amber-200 focus:border-amber-500 focus:bg-white rounded-xl text-xs font-bold text-slate-900 focus:outline-none transition placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 4. PAYMENT METHOD (செலுத்திய முறை) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              <span>செலுத்திய முறை (Payment Method)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-bold">
              {[
                { id: "UPI", label: "GPay / UPI", icon: "📱" },
                { id: "CASH", label: "ரொக்கம் (Cash)", icon: "💵" },
                { id: "BANK_TRANSFER", label: "வங்கி (NEFT)", icon: "🏛️" },
                { id: "CHEQUE", label: "காசோலை", icon: "📑" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id as any)}
                  className={`py-2 px-2 rounded-xl border text-center transition active:scale-95 cursor-pointer flex flex-col items-center gap-0.5 ${
                    paymentMethod === m.id
                      ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-[10px] leading-tight truncate">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. REMARKS / NOTES (குறிப்பு) */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-800 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>குறிப்புரை (Remark / Notes) *</span>
            </label>
            <input
              type="text"
              value={paymentRemark}
              placeholder="எ.கா: GPay advance, மண்டபத்தில் ரொக்கமாகப் பெற்றது..."
              onChange={(e) => setPaymentRemark(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none transition placeholder:text-slate-400"
            />
          </div>

          {/* 6. LIVE DYNAMIC BALANCE BREAKDOWN (கட்டணக் கணக்கீடு நேரலை) */}
          <div className="p-3 bg-gradient-to-r from-emerald-50/80 via-white to-amber-50/60 rounded-2xl border border-emerald-200 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
              <span>மொத்த தட்சணை (Total Fee):</span>
              <span className="text-slate-900 font-extrabold">₹{calculations.totalAmount.toLocaleString("en-IN")}</span>
            </div>
            {calculations.totalDiscount > 0 && (
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-700">
                <span>மொத்த தள்ளுபடி (Discount):</span>
                <span>-₹{calculations.totalDiscount.toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
              <span>முன்பு செலுத்தியது (Already Paid):</span>
              <span>₹{calculations.alreadyPaid.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900 pt-1 border-t border-slate-200">
              <span>இப்போது வரவு வைப்பது (Paying Now):</span>
              <span className="font-black text-emerald-700">+₹{calculations.currentPaying.toLocaleString("en-IN")}</span>
            </div>
            
            {/* Live Remaining Balance Pill */}
            <div className="pt-1.5 border-t border-emerald-200/80 flex items-center justify-between">
              <span className="text-xs font-black text-slate-800">மீதமுள்ள பாக்கி (Balance Due):</span>
              <span
                className={`text-sm font-black px-2.5 py-0.5 rounded-lg ${
                  calculations.isFullPaid
                    ? "bg-emerald-600 text-white"
                    : calculations.newRemainingBalance > 0
                    ? "bg-amber-100 text-amber-950 border border-amber-300"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                ₹{calculations.newRemainingBalance.toLocaleString("en-IN")}
              </span>
            </div>

            {calculations.isFullPaid && (
              <div className="text-[10.5px] font-extrabold text-emerald-800 bg-emerald-100/80 p-1.5 rounded-xl text-center border border-emerald-300">
                ✨ முழு கட்டணமும் நிறைவு செய்யப்படுகிறது (Full Paid)!
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ரத்து செய் (Cancel)
            </button>
            <button
              type="submit"
              disabled={isSubmitting || calculations.isOverpaid || (calculations.currentPaying <= 0 && calculations.newDiscount <= 0)}
              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-black shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{isSubmitting ? "பதிவாகிறது..." : "வரவு உறுதி செய் (Save)"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
