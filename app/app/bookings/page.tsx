"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Booking } from "@/lib/types";
import { getTamilDate, formatTime12H } from "@/lib/calendar/tamil";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  Calendar,
  Flame,
  ChevronRight,
  Clock,
  Sparkles,
  GitCommitVertical,
  List,
  MessageCircle,
  Phone,
  User,
  X,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  History,
} from "lucide-react";

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDiffDays = (bookingDate: string, todayStr: string) => {
  const todayMs = new Date(todayStr).getTime();
  const bMs = new Date(bookingDate).getTime();
  return Math.max(1, Math.floor((todayMs - bMs) / (1000 * 60 * 60 * 24)));
};

interface MonthTimelineGroup {
  monthKey: string; // e.g. "2026-09"
  englishMonthYear: string; // e.g. "September 2026"
  tamilMonthSpan: string; // e.g. "ஆவணி / புரட்டாசி"
  tamilYear: string; // e.g. "பராபவ"
  bookings: Booking[];
  totalAmount: number;
  totalCollected: number;
  totalPending: number;
}

interface MonthTheme {
  headerBg: string;
  headerBorder: string;
  headerText: string;
  countBadgeBg: string;
  countBadgeText: string;
  nodeBg: string;
  nodeText: string;
  railColor: string;
  accentText: string;
}

const MONTH_THEMES: MonthTheme[] = [
  // 0: Rose / Crimson (e.g. September)
  {
    headerBg: "bg-[#fff1f2]",
    headerBorder: "border-[#fecdd3]",
    headerText: "text-[#9f1239]",
    countBadgeBg: "bg-[#ffe4e6]",
    countBadgeText: "text-[#9f1239]",
    nodeBg: "bg-[#be123c]",
    nodeText: "text-white",
    railColor: "bg-[#be123c]/40",
    accentText: "text-[#be123c]",
  },
  // 1: Sacred Emerald / Green (e.g. October)
  {
    headerBg: "bg-[#f0fdf4]",
    headerBorder: "border-[#bbf7d0]",
    headerText: "text-[#166534]",
    countBadgeBg: "bg-[#dcfce7]",
    countBadgeText: "text-[#166534]",
    nodeBg: "bg-[#15803d]",
    nodeText: "text-white",
    railColor: "bg-[#15803d]/40",
    accentText: "text-[#15803d]",
  },
  // 2: Royal Blue / Indigo (e.g. November)
  {
    headerBg: "bg-[#eff6ff]",
    headerBorder: "border-[#bfdbfe]",
    headerText: "text-[#1e40af]",
    countBadgeBg: "bg-[#dbeafe]",
    countBadgeText: "text-[#1e40af]",
    nodeBg: "bg-[#2563eb]",
    nodeText: "text-white",
    railColor: "bg-[#2563eb]/40",
    accentText: "text-[#2563eb]",
  },
  // 3: Warm Amber / Haldi Gold (e.g. December)
  {
    headerBg: "bg-[#fffbeb]",
    headerBorder: "border-[#fde68a]",
    headerText: "text-[#92400e]",
    countBadgeBg: "bg-[#fef3c7]",
    countBadgeText: "text-[#92400e]",
    nodeBg: "bg-[#d97706]",
    nodeText: "text-white",
    railColor: "bg-[#d97706]/40",
    accentText: "text-[#d97706]",
  },
  // 4: Sacred Purple (e.g. January)
  {
    headerBg: "bg-[#faf5ff]",
    headerBorder: "border-[#e9d5ff]",
    headerText: "text-[#6b21a8]",
    countBadgeBg: "bg-[#f3e8ff]",
    countBadgeText: "text-[#6b21a8]",
    nodeBg: "bg-[#7e22ce]",
    nodeText: "text-white",
    railColor: "bg-[#7e22ce]/40",
    accentText: "text-[#7e22ce]",
  },
];

interface SwipeableTimelineCardProps {
  b: Booking;
  theme: MonthTheme;
  isSelf: boolean;
  todayStr: string;
  onToggleComplete: (b: Booking) => void;
}

const SwipeableTimelineCard: React.FC<SwipeableTimelineCardProps> = ({
  b,
  theme,
  isSelf,
  todayStr,
  onToggleComplete,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = React.useRef(false);
  const currentOffsetRef = React.useRef(0);

  const dateInfo = getTamilDate(b.date);
  const isCompleted = b.status === "COMPLETED";
  const isOverdue = !isCompleted && b.status !== "CANCELLED" && b.date < todayStr;
  const diffDays = isOverdue ? getDiffDays(b.date, todayStr) : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = e.touches[0].clientX - touchStartRef.current.x;
    const diffY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -6) {
        // Swiping Left
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.max(-140, Math.min(0, diffX));
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      } else if (currentOffsetRef.current < 0 && diffX > 6) {
        // Swiping Right to Close
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.min(0, -140 + diffX);
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentOffsetRef.current <= -45) {
      currentOffsetRef.current = -140;
      setOffsetX(-140);
    } else {
      currentOffsetRef.current = 0;
      setOffsetX(0);
    }
    setIsSwiping(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -6) {
        // Swiping Left
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.max(-140, Math.min(0, diffX));
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      } else if (currentOffsetRef.current < 0 && diffX > 6) {
        // Swiping Right to Close
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.min(0, -140 + diffX);
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      }
    }
  };

  const handleMouseUp = () => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;
    handleTouchEnd();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (currentOffsetRef.current < 0) {
      e.preventDefault();
      e.stopPropagation();
      currentOffsetRef.current = 0;
      setOffsetX(0);
      return;
    }
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl flex-1 min-w-0 select-none shadow-2xs"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background action revealed on left swipe - Only visible when swiping left */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleComplete(b);
          currentOffsetRef.current = 0;
          setOffsetX(0);
        }}
        className={`absolute right-0 top-0 bottom-0 w-[140px] rounded-r-2xl flex items-center justify-center px-3 z-0 cursor-pointer text-right shadow-inner transition-opacity ${
          offsetX < -2 ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        } ${
          isCompleted
            ? "bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 text-white"
            : "bg-gradient-to-l from-emerald-600 via-emerald-500 to-emerald-600 text-white"
        }`}
        style={{
          transition: "opacity 0.15s ease",
        }}
        title={isCompleted ? "Reopen Booking" : "Mark as Complete"}
      >
        <div className="flex items-center gap-2.5">
          {isCompleted ? (
            <>
              <div className="leading-tight text-right">
                <span className="font-black text-xs block text-white">Reopen ↩️</span>
                <span className="text-[10px] text-amber-100 block font-bold">Tap to Reopen</span>
              </div>
              <RotateCcw className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
            </>
          ) : (
            <>
              <div className="leading-tight text-right">
                <span className="font-black text-xs block text-white">Complete ✅</span>
                <span className="text-[10px] text-emerald-100 block font-bold">Tap to Finish</span>
              </div>
              <CheckCircle2 className="w-5 h-5 text-white shrink-0 drop-shadow-xs" />
            </>
          )}
        </div>
      </button>

      {/* Foreground card */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}
        className="relative z-10 bg-white rounded-2xl"
      >
        <Link
          href={`/app/bookings/${b.id}`}
          onClick={handleClick}
          draggable={false}
          className={`relative block p-2.5 sm:px-3 sm:py-2.5 border rounded-2xl transition hover:shadow-2xs space-y-1.5 overflow-hidden ${
            !isSelf ? "pt-3.5 sm:pt-3.5" : ""
          } ${
            isCompleted
              ? "bg-emerald-50/40 border-emerald-300"
              : isOverdue
              ? "bg-gradient-to-r from-rose-50/80 via-amber-50/40 to-white border-rose-300 shadow-2xs hover:border-rose-400 ring-1 ring-rose-200/80"
              : "bg-white border-slate-200/90 hover:border-amber-300 shadow-2xs"
          }`}
        >
          {/* Top-Right Corner Stylish Tag for Vera Priest */}
          {!isSelf && (
            <div className="absolute top-0 right-0 z-20 flex items-center gap-1 bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 text-white text-[8.5px] sm:text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg rounded-tr-2xl shadow-2xs tracking-tight">
              <span className="text-[9px]">🪔</span>
              <span className="truncate max-w-[85px] sm:max-w-[130px]">
                {b.assignedIyerName && b.assignedIyerName !== "Team" && b.assignedIyerName.toLowerCase() !== "self"
                  ? b.assignedIyerName
                  : "Other Priest"}
              </span>
            </div>
          )}

          {/* Row 1: Customer Name, Status Badge, Pooja, and Fee */}
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-slate-400 text-xs shrink-0">👤</span>
              <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate leading-tight group-hover:text-emerald-950 transition-colors">
                {b.customerName}
              </h4>
              {isCompleted && (
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded-full leading-none shrink-0">
                  முடிந்தது ✅
                </span>
              )}
              {isOverdue && (
                <span className="text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-300 px-1.5 py-0.2 rounded-full leading-none flex items-center gap-0.5 shadow-2xs shrink-0">
                  <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                  <span>{diffDays}d Overdue</span>
                </span>
              )}
              <span className="text-[10.5px] sm:text-[11px] font-bold text-amber-900 truncate flex items-center gap-0.5 shrink-0 max-w-[120px] sm:max-w-[200px]">
                <span>🪔</span>
                <span className="truncate">{b.poojaEnglishName || b.poojaTamilName}</span>
              </span>
            </div>

            <div className="text-right shrink-0 flex items-center gap-1.5">
              <div>
                <span className="font-black text-xs sm:text-sm text-slate-900">
                  ₹{b.totalAmount.toLocaleString("en-IN")}
                </span>
                <span
                  className={`text-[9.5px] font-bold ml-1.5 ${
                    b.paymentStatus === "PAID"
                      ? "text-emerald-700"
                      : "text-rose-700"
                  }`}
                >
                  {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                </span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </div>
          </div>

          {/* Row 2: Booking Number, Time, Priest (Self / Other Person), Venue & Actions */}
          <div className="flex items-center justify-between text-[10.5px] text-slate-600 gap-1.5 pt-0.5">
            <div className="flex items-center gap-1.5 truncate min-w-0 flex-wrap">
              <span className="font-mono text-[9px] text-slate-400 shrink-0">
                {b.bookingNumber?.startsWith("#") ? b.bookingNumber : `#${b.bookingNumber}`}
              </span>

              <div className="flex items-center gap-1 font-bold text-slate-700 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200 shrink-0 text-[10px]">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{formatTime12H(b.startTime)}</span>
              </div>

              {isSelf && (
                <span className="font-bold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300 text-[9.5px] shrink-0">
                  Self
                </span>
              )}

              {b.location && (
                <div className="hidden xs:flex items-center gap-0.5 text-slate-500 truncate max-w-[80px] sm:max-w-[130px] shrink-0 text-[10px]">
                  <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.location}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {/* 1-Tap Quick Complete Toggle */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleComplete(b);
                }}
                className={`px-2 py-0.5 rounded-lg text-[9.5px] font-extrabold flex items-center gap-1 transition active:scale-95 cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : isOverdue
                    ? "bg-amber-100 hover:bg-emerald-100 text-amber-900 hover:text-emerald-900 border border-amber-300"
                    : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200"
                }`}
                title={isCompleted ? "முடிந்தது (Click to Reopen)" : "பூஜையை முடித்ததாக குறிக்க"}
              >
                <CheckCircle2 className={`w-3 h-3 ${isCompleted ? "text-emerald-700 fill-emerald-200" : isOverdue ? "text-amber-600" : "text-slate-400"}`} />
                <span>{isCompleted ? "முடிந்தது ✅" : "Complete"}</span>
              </button>

              {b.customerMobile && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `tel:${b.customerMobile}`;
                    }}
                    className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition cursor-pointer"
                    title="Call Devotee"
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.open(`https://wa.me/${b.customerMobile?.replace(/\D/g, "")}`, "_blank");
                    }}
                    className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition border border-emerald-200 cursor-pointer"
                    title="WhatsApp Devotee"
                  >
                    <MessageCircle className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

interface LineByLineBookingRowProps {
  b: Booking;
  isSelf: boolean;
  todayStr: string;
  onToggleComplete: (b: Booking) => void;
}

const LineByLineBookingRow: React.FC<LineByLineBookingRowProps> = ({
  b,
  isSelf,
  todayStr,
  onToggleComplete,
}) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = React.useRef(false);
  const currentOffsetRef = React.useRef(0);

  const isCompleted = b.status === "COMPLETED";
  const isOverdue = !isCompleted && b.status !== "CANCELLED" && b.date < todayStr;
  const diffDays = isOverdue ? getDiffDays(b.date, todayStr) : 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const diffX = e.touches[0].clientX - touchStartRef.current.x;
    const diffY = e.touches[0].clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -6) {
        // Swiping Left
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.max(-140, Math.min(0, diffX));
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      } else if (currentOffsetRef.current < 0 && diffX > 6) {
        // Swiping Right to Close
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.min(0, -140 + diffX);
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      }
    }
  };

  const handleTouchEnd = () => {
    if (currentOffsetRef.current <= -45) {
      currentOffsetRef.current = -140;
      setOffsetX(-140);
    } else {
      currentOffsetRef.current = 0;
      setOffsetX(0);
    }
    setIsSwiping(false);
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 150);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!touchStartRef.current) return;
    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;
    if (Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < -6) {
        // Swiping Left
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.max(-140, Math.min(0, diffX));
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      } else if (currentOffsetRef.current < 0 && diffX > 6) {
        // Swiping Right to Close
        isDraggingRef.current = true;
        setIsSwiping(true);
        const nextX = Math.min(0, -140 + diffX);
        currentOffsetRef.current = nextX;
        setOffsetX(nextX);
      }
    }
  };

  const handleMouseUp = () => {
    if (!touchStartRef.current) return;
    touchStartRef.current = null;
    handleTouchEnd();
  };

  const handleClick = (e: React.MouseEvent) => {
    if (currentOffsetRef.current < 0) {
      e.preventDefault();
      e.stopPropagation();
      currentOffsetRef.current = 0;
      setOffsetX(0);
      return;
    }
    if (isDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <div
      className="relative overflow-hidden rounded-xl select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background action revealed on left swipe - Only visible when swiping left */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleComplete(b);
          currentOffsetRef.current = 0;
          setOffsetX(0);
        }}
        className={`absolute right-0 top-0 bottom-0 w-[140px] rounded-r-xl flex items-center justify-center px-3 z-0 cursor-pointer text-right shadow-inner transition-opacity ${
          offsetX < -2 ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        } ${
          isCompleted
            ? "bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 text-white"
            : "bg-gradient-to-l from-emerald-600 via-emerald-500 to-emerald-600 text-white"
        }`}
        style={{
          transition: "opacity 0.15s ease",
        }}
        title={isCompleted ? "Reopen Booking" : "Mark as Complete"}
      >
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <>
              <div className="leading-tight text-right">
                <span className="font-extrabold text-xs block text-white">Reopen ↩️</span>
                <span className="text-[9.5px] text-amber-100 block font-bold">Tap to Reopen</span>
              </div>
              <RotateCcw className="w-4 h-4 text-white shrink-0 drop-shadow-xs" />
            </>
          ) : (
            <>
              <div className="leading-tight text-right">
                <span className="font-extrabold text-xs block text-white">Complete ✅</span>
                <span className="text-[9.5px] text-emerald-100 block font-bold">Tap to Finish</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-white shrink-0 drop-shadow-xs" />
            </>
          )}
        </div>
      </button>

      {/* Foreground compact row */}
      <div
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? "none" : "transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)",
        }}
        className="relative z-10 bg-white rounded-xl"
      >
        <Link
          href={`/app/bookings/${b.id}`}
          onClick={handleClick}
          draggable={false}
          className={`relative block p-2.5 sm:px-3.5 sm:py-2.5 border rounded-xl transition hover:shadow-2xs overflow-hidden ${
            !isSelf ? "pt-3.5 sm:pt-3" : ""
          } ${
            isCompleted
              ? "bg-emerald-50/30 border-emerald-200"
              : isOverdue
              ? "bg-gradient-to-r from-rose-50/70 via-amber-50/30 to-white border-rose-300 ring-1 ring-rose-200/80"
              : "bg-white border-slate-200 hover:border-slate-300"
          }`}
        >
          {/* Top-Right Corner Stylish Tag for Vera Priest */}
          {!isSelf && (
            <div className="absolute top-0 right-0 z-20 flex items-center gap-1 bg-gradient-to-l from-amber-600 via-amber-500 to-amber-600 text-white text-[8.5px] sm:text-[9px] font-black px-2.5 py-0.5 rounded-bl-lg rounded-tr-xl shadow-2xs tracking-tight">
              <span className="text-[9px]">🪔</span>
              <span className="truncate max-w-[85px] sm:max-w-[130px]">
                {b.assignedIyerName && b.assignedIyerName !== "Team" && b.assignedIyerName.toLowerCase() !== "self"
                  ? b.assignedIyerName
                  : "Other Priest"}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            {/* Left: Booking info line */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-mono text-[10px] font-extrabold text-slate-500 bg-slate-100 px-1 py-0.2 rounded border border-slate-200 shrink-0">
                  {b.bookingNumber}
                </span>
                <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                  {b.customerName}
                </span>
                {isCompleted && (
                  <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded-full leading-none shrink-0">
                    முடிந்தது ✅
                  </span>
                )}
                {isOverdue && (
                  <span className="text-[9px] font-black bg-rose-100 text-rose-900 border border-rose-300 px-1.5 py-0.2 rounded-full leading-none flex items-center gap-1 shrink-0">
                    <AlertTriangle className="w-2.5 h-2.5 text-rose-600 shrink-0" />
                    <span>{diffDays}d Overdue</span>
                  </span>
                )}
                {isSelf && (
                  <span className="text-[9px] font-bold text-emerald-900 bg-emerald-100/80 px-1.5 py-0.2 rounded border border-emerald-300 shrink-0">
                    Self
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10.5px] text-slate-500 mt-0.5 truncate">
                <span className="font-bold text-amber-900 truncate">
                  🪔 {b.poojaEnglishName || b.poojaTamilName}
                </span>
                <span>•</span>
                <span className="font-semibold text-slate-700 shrink-0">
                  {b.date} • {formatTime12H(b.startTime)}
                </span>
                {b.location && (
                  <>
                    <span className="hidden xs:inline">•</span>
                    <span className="hidden xs:inline text-slate-600 truncate">{b.location}</span>
                  </>
                )}
              </div>
            </div>

            {/* Right: Amount & Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <div className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
                  ₹{b.totalAmount.toLocaleString("en-IN")}
                </div>
                <div className={`text-[9.5px] font-bold leading-none mt-0.5 ${b.paymentStatus === "PAID" ? "text-emerald-700" : "text-rose-700"}`}>
                  {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                </div>
              </div>

              {/* Complete Toggle Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggleComplete(b);
                }}
                className={`p-1.5 rounded-lg transition active:scale-95 cursor-pointer ${
                  isCompleted
                    ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                    : isOverdue
                    ? "bg-amber-100 hover:bg-emerald-100 text-amber-900 border border-amber-300"
                    : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200"
                }`}
                title={isCompleted ? "முடிந்தது (Click to Reopen)" : "பூஜையை முடிக்க"}
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isCompleted ? "text-emerald-700 fill-emerald-200" : isOverdue ? "text-amber-600" : "text-slate-400"}`} />
              </button>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default function BookingsListPage() {
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();
  const [filter, setFilter] = useState<string>("PENDING");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"timeline" | "list">("timeline");

  const todayStr = useMemo(() => getTodayStr(), []);
  const [showRecentChanges, setShowRecentChanges] = useState(false);
  const [recentChangesTab, setRecentChangesTab] = useState<"completed" | "activity">("completed");

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const [dbVersion, setDbVersion] = useState(0);
  const [completeToast, setCompleteToast] = useState<{
    booking: Booking;
    action: "completed" | "reopened";
  } | null>(null);

  const handleToggleComplete = (b: Booking) => {
    const nextStatus = b.status === "COMPLETED" ? "CONFIRMED" : "COMPLETED";
    db.updateBookingStatus(b.id, nextStatus, currentUser?.name || "Self");
    setCompleteToast({
      booking: b,
      action: nextStatus === "COMPLETED" ? "completed" : "reopened",
    });
    setTimeout(() => {
      setCompleteToast(null);
    }, 4500);
  };

  useEffect(() => {
    const handler = () => setDbVersion((v) => v + 1);
    window.addEventListener("velvi:db-change", handler);
    return () => window.removeEventListener("velvi:db-change", handler);
  }, []);

  const allBookings = useMemo(() => db.getBookings(businessId), [businessId, dbVersion]);
  const members = useMemo(() => db.getMembers(businessId), [businessId, dbVersion]);
  const ownerMember = useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  const recentCompletedBookings = useMemo(() => {
    return allBookings
      .filter((b) => b.status === "COMPLETED")
      .sort((a, b) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt));
  }, [allBookings]);

  const bookingAuditLogs = useMemo(() => {
    return (db.auditLogs || [])
      .filter((log) => log.targetType === "BOOKING")
      .slice(-25)
      .reverse();
  }, [dbVersion]);

  const pendingCount = useMemo(
    () => allBookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED").length,
    [allBookings]
  );
  const confirmedCount = useMemo(
    () => allBookings.filter((b) => b.status === "CONFIRMED").length,
    [allBookings]
  );
  const completedCount = useMemo(
    () => allBookings.filter((b) => b.status === "COMPLETED").length,
    [allBookings]
  );
  const overdueCount = useMemo(
    () => allBookings.filter((b) => b.status !== "COMPLETED" && b.status !== "CANCELLED" && b.date < todayStr).length,
    [allBookings, todayStr]
  );

  const filteredBookings = useMemo(() => {
    return allBookings.filter((b) => {
      const matchesFilter =
        filter === "ALL"
          ? true
          : filter === "PENDING"
          ? b.status !== "COMPLETED" && b.status !== "CANCELLED"
          : b.status === filter;
      const matchesSearch =
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.poojaEnglishName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [allBookings, filter, searchQuery]);

  // Group bookings by Month into a chronological timeline
  const monthGroups = useMemo(() => {
    const sorted = [...filteredBookings].sort((a, b) => {
      return a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime);
    });

    const groupsMap = new Map<string, MonthTimelineGroup>();

    const ENGLISH_MONTHS_FULL = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    sorted.forEach((b) => {
      const monthKey = b.date.slice(0, 7); // "YYYY-MM"
      const dateInfo = getTamilDate(b.date);
      const mIdx = Math.max(0, Math.min(11, parseInt(b.date.slice(5, 7), 10) - 1));
      const fullMonthName = ENGLISH_MONTHS_FULL[mIdx] || dateInfo.monthNameEn;

      if (!groupsMap.has(monthKey)) {
        groupsMap.set(monthKey, {
          monthKey,
          englishMonthYear: `${fullMonthName} ${dateInfo.year}`,
          tamilMonthSpan: `${dateInfo.tamilMonth}`,
          tamilYear: dateInfo.tamilYear,
          bookings: [],
          totalAmount: 0,
          totalCollected: 0,
          totalPending: 0,
        });
      }

      const grp = groupsMap.get(monthKey)!;
      grp.bookings.push(b);
      grp.totalAmount += b.totalAmount || 0;
      grp.totalCollected += b.advanceAmount || 0;
      grp.totalPending += b.balanceAmount || 0;
      if (!grp.tamilMonthSpan.includes(dateInfo.tamilMonth)) {
        grp.tamilMonthSpan += ` / ${dateInfo.tamilMonth}`;
      }
    });

    return Array.from(groupsMap.values());
  }, [filteredBookings]);

  return (
    <div className="space-y-3 pb-8 animate-in fade-in duration-200 max-w-full">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl bg-amber-100/80 flex items-center justify-center border border-amber-300/70 shadow-2xs">
              <Calendar className="w-4 h-4 text-amber-900" />
            </div>
            <span>Pooja Bookings</span>
          </h2>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            {filteredBookings.length} பதிவுகள் • {monthGroups.length} மாதங்கள்
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-white rounded-xl border border-slate-200 p-0.5 flex items-center shadow-2xs">
            <button
              onClick={() => setViewMode("timeline")}
              title="Month Timeline View"
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                viewMode === "timeline"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <GitCommitVertical className="w-3.5 h-3.5" />
              <span>Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="Line-by-Line List View"
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 text-xs font-bold cursor-pointer ${
                viewMode === "list"
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          {/* Recent Button */}
          <button
            type="button"
            onClick={() => setShowRecentChanges(true)}
            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs hover:shadow-xs active:scale-95 transition cursor-pointer"
            title="Recent Changes & Completed Bookings"
          >
            <History className="w-3.5 h-3.5 text-amber-700" />
            <span>Recent</span>
          </button>

          <Link
            href="/app/bookings/new"
            className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-2xs hover:shadow-xs active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>Book</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          placeholder="தேடுக: பக்தர் பெயர், பூஜை, ஊர், பதிவு எண்..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-8 py-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 transition shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
        {[
          { id: "PENDING", label: "PENDING", count: pendingCount },
          { id: "ALL", label: "ALL", count: allBookings.length },
          { id: "CONFIRMED", label: "CONFIRMED", count: confirmedCount },
          { id: "COMPLETED", label: "COMPLETED", count: completedCount },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1 rounded-xl whitespace-nowrap transition shrink-0 flex items-center gap-1.5 ${
              filter === tab.id
                ? "bg-slate-900 text-white shadow-2xs"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            <span>{tab.label} ({tab.count})</span>
            {tab.id === "PENDING" && overdueCount > 0 && (
              <span className="text-[9px] bg-rose-500 text-white font-black px-1.5 py-0.2 rounded-full shadow-2xs">
                {overdueCount} overdue
              </span>
            )}
          </button>
        ))}
      </div>


      {/* Swipe Tip Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 rounded-2xl p-2.5 px-3 flex items-center justify-between gap-2 text-xs shadow-2xs">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base shrink-0">👈</span>
          <p className="text-[11px] sm:text-xs text-emerald-950 font-bold leading-tight">
            <span className="text-emerald-800 font-extrabold">Tip:</span> Swipe left on any booking card to mark <span className="underline decoration-emerald-500 font-extrabold">&apos;Complete ✅&apos;</span>!
          </p>
        </div>
        <span className="shrink-0 text-[10px] font-black bg-emerald-700 text-white px-2 py-0.5 rounded-full shadow-2xs">
          Swipe 👈
        </span>
      </div>

      {/* No Bookings Empty State */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 shadow-2xs space-y-3">
          <div className="text-3xl">🪔</div>
          <h4 className="font-bold text-sm text-slate-800">பூஜை பதிவுகள் எதுவும் இல்லை</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            தேடல் சொல்லை மாற்றி முயற்சிக்கவும் அல்லது புதிய பூஜை பதிவு செய்யவும்.
          </p>
          <Link
            href="/app/bookings/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-2xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>புதிய பதிவு செய்க</span>
          </Link>
        </div>
      ) : viewMode === "timeline" ? (
        /* =================================================================== */
        /* WHATSAPP-STYLE MONTH TIMELINE VIEW                                 */
        /* =================================================================== */
        <div className="pt-1">
          {monthGroups.map((group, groupIdx) => {
            const theme = MONTH_THEMES[groupIdx % MONTH_THEMES.length];

            return (
              <div key={group.monthKey} className="relative">
                {/* Month Section Header - Sticky Edge-to-Edge Shelf (Zero Shake, 100% Solid) */}
                <div
                  style={{ transform: "translateZ(0)" }}
                  className={`sticky top-[56px] sm:top-[57px] z-20 ${theme.headerBg} -mx-3 sm:-mx-5 px-3.5 sm:px-5 py-2 border-b ${theme.headerBorder} shadow-2xs flex items-center justify-between gap-2 select-none transition-colors`}
                >
                  <div className="min-w-0">
                    <h3 className={`font-black text-sm sm:text-base ${theme.headerText} tracking-tight leading-none`}>
                      {group.englishMonthYear}
                    </h3>
                    <p className={`text-[10.5px] font-bold ${theme.accentText} mt-0.5 opacity-90 truncate`}>
                      {group.tamilMonthSpan} ({group.tamilYear} வருடம்)
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span
                      className={`text-[10.5px] font-black px-2.5 py-0.5 rounded-lg ${theme.countBadgeBg} ${theme.countBadgeText} border border-black/5`}
                    >
                      {group.bookings.length} {group.bookings.length === 1 ? "Booking" : "Bookings"}
                    </span>
                  </div>
                </div>

                {/* Timeline Container with Circular Date Nodes & Connecting Rail Line */}
                <div className="space-y-2 relative pl-1 pt-2.5 pb-6">
                  {group.bookings.map((b, bIdx) => {
                    const dateInfo = getTamilDate(b.date);
                    const dayNumber = dateInfo.dayOfMonth < 10 ? `0${dateInfo.dayOfMonth}` : `${dateInfo.dayOfMonth}`;
                    const isLastInMonth = bIdx === group.bookings.length - 1;

                    const isSelf =
                      b.assignedIyerId === ownerMember?.id ||
                      b.assignedIyerName === currentUser?.name ||
                      b.assignedIyerName === "Ravi Iyer" ||
                      !b.assignedIyerName ||
                      b.assignedIyerName.toLowerCase() === "self";

                    return (
                      <div key={b.id} className="relative flex items-start gap-2 sm:gap-2.5 group">
                        {/* Left Rail & Circular Date Node */}
                        <div className="relative flex flex-col items-center shrink-0 pt-0.5">
                          {/* Clear Date Node with Weekday and Day Number */}
                          <div
                            className={`w-9 sm:w-10 rounded-xl ${theme.nodeBg} ${theme.nodeText} flex flex-col items-center justify-center py-0.5 sm:py-1 shadow-xs border-2 border-white ring-1 ring-black/10 z-10 sm:group-hover:scale-105 transition-transform duration-200 shrink-0`}
                          >
                            <span className="text-[8.5px] sm:text-[9px] font-black uppercase tracking-wider opacity-85 leading-none">
                              {dateInfo.dayOfWeekEn.slice(0, 3)}
                            </span>
                            <span className="text-xs sm:text-sm font-black leading-tight mt-0.5">
                              {dayNumber}
                            </span>
                          </div>

                          {/* Connecting Rail Line below node (only if not last in this month) */}
                          {!isLastInMonth && (
                            <div
                              className={`w-1 sm:w-1.25 ${theme.railColor} absolute top-10 bottom-[-10px] left-1/2 -translate-x-1/2 rounded-full`}
                            />
                          )}
                        </div>

                        {/* Right: Rich Swipeable Booking Card Aligned Exactly with the Date */}
                        <SwipeableTimelineCard
                          b={b}
                          theme={theme}
                          isSelf={isSelf}
                          todayStr={todayStr}
                          onToggleComplete={handleToggleComplete}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* =================================================================== */
        /* COMPACT LINE-BY-LINE LIST VIEW                                     */
        /* =================================================================== */
        <div className="space-y-1.5 bg-white p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 shadow-2xs">
          {filteredBookings.map((b) => {
            const isSelf =
              b.assignedIyerId === ownerMember?.id ||
              b.assignedIyerName === currentUser?.name ||
              b.assignedIyerName === "Ravi Iyer" ||
              !b.assignedIyerName ||
              b.assignedIyerName.toLowerCase() === "self";

            return (
              <LineByLineBookingRow
                key={b.id}
                b={b}
                isSelf={isSelf}
                todayStr={todayStr}
                onToggleComplete={handleToggleComplete}
              />
            );
          })}
        </div>
      )}

      {/* Recent Changes & Completed Bookings Modal */}
      {showRecentChanges && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl p-5 space-y-4 max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-300 shadow-2xs">
                  <History className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Recent Changes
                  </h3>
                  <p className="text-[11px] font-bold text-slate-500">
                    Completed Bookings & Activity Logs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRecentChanges(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs: Completed vs All Activity Logs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setRecentChangesTab("completed")}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  recentChangesTab === "completed"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Completed ({recentCompletedBookings.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setRecentChangesTab("activity")}
                className={`flex-1 py-1.5 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  recentChangesTab === "activity"
                    ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Activity Logs ({bookingAuditLogs.length})</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 space-y-2.5 pr-0.5">
              {recentChangesTab === "completed" ? (
                recentCompletedBookings.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No completed bookings yet
                  </div>
                ) : (
                  recentCompletedBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-2xl transition space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-[10px] font-bold text-slate-600 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                              {b.bookingNumber}
                            </span>
                            <span className="font-black text-xs sm:text-sm text-slate-900 truncate">
                              {b.customerName}
                            </span>
                            <span className="text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                              Completed ✅
                            </span>
                          </div>
                          <p className="text-[11px] font-bold text-amber-900 mt-0.5 truncate">
                            🪔 {b.poojaEnglishName || b.poojaTamilName}
                          </p>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            📅 {b.date} • {formatTime12H(b.startTime)} • ₹{b.totalAmount.toLocaleString("en-IN")}
                          </p>
                        </div>

                        {/* Revert & Edit Action Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Revert to Booking Button */}
                          <button
                            type="button"
                            onClick={() => {
                              db.updateBookingStatus(b.id, "CONFIRMED", currentUser?.name || "Self");
                              setCompleteToast({ booking: b, action: "reopened" });
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-black flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                            title="Revert to Active Booking"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                            <span>Revert ↩️</span>
                          </button>

                          {/* Edit Link */}
                          <Link
                            href={`/app/bookings/${b.id}`}
                            onClick={() => setShowRecentChanges(false)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition active:scale-95"
                            title="View or Edit Booking"
                          >
                            <span>View / Edit ✏️</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                )
              ) : (
                /* Activity Log Tab */
                bookingAuditLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs font-medium">
                    No recent activity logs
                  </div>
                ) : (
                  bookingAuditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-slate-500 text-[10.5px]">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <span>👤</span> {log.actorName || "User"}
                        </span>
                        <span>{new Date(log.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <p className="font-semibold text-slate-800 text-[11px]">
                        {log.reason || log.action}
                      </p>
                      {log.targetId && (
                        <div className="flex items-center justify-between text-[10.5px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                          <span className="font-mono">{log.targetId}</span>
                          <Link
                            href={`/app/bookings/${log.targetId}`}
                            onClick={() => setShowRecentChanges(false)}
                            className="text-amber-800 font-bold hover:underline"
                          >
                            View ↗
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )
              )}
            </div>

            {/* Footer Notice */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
              <span>Accidentally completed bookings can be restored via &apos;Revert ↩️&apos;.</span>
              <button
                type="button"
                onClick={() => setShowRecentChanges(false)}
                className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete/Reopen Toast with Undo Action */}
      {completeToast && (
        <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto">
          <div className="bg-slate-900/95 text-white rounded-2xl p-3 shadow-2xl border border-slate-700 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  completeToast.action === "completed" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                }`}
              >
                {completeToast.action === "completed" ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold leading-tight truncate">
                  {completeToast.booking.customerName} -{" "}
                  {completeToast.action === "completed"
                    ? "பூஜை முடிந்தது! ✅"
                    : "மீண்டும் திறக்கப்பட்டது (Reopened)"}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {completeToast.booking.poojaEnglishName || completeToast.booking.poojaTamilName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const revertStatus =
                    completeToast.action === "completed" ? "CONFIRMED" : "COMPLETED";
                  db.updateBookingStatus(
                    completeToast.booking.id,
                    revertStatus,
                    currentUser?.name || "Self"
                  );
                  setCompleteToast(null);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold rounded-lg border border-slate-600 transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                type="button"
                onClick={() => setCompleteToast(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

