"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Booking } from "@/lib/types";
import {
  Bell,
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  Sparkles,
  Cloud,
  Search,
  CheckCircle2,
  ChevronRight,
  Flame,
  AlertCircle,
  CreditCard,
} from "lucide-react";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSearch: () => void;
  businessName?: string;
  tomorrowBookings: Booking[];
  isPro: boolean;
  daysToExpiry: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  syncedCount: number;
  lastSyncedTime: string;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  onOpenSearch,
  businessName,
  tomorrowBookings,
  isPro,
  daysToExpiry,
  isExpiringSoon,
  isExpired,
  syncedCount,
  lastSyncedTime,
}) => {
  // Lock background scroll when open
  useEffect(() => {
    if (!isOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSendWhatsAppReminder = (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!b.customerMobile) {
      alert("இந்த பக்தரின் மொபைல் எண் பதிவு செய்யப்படவில்லை (No mobile registered)");
      return;
    }
    const cleanPhone = b.customerMobile.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `வணக்கம் ${b.customerName || "பக்தரே"}!\n\n` +
      `வேள்வி பூஜை நினைவூட்டல் (Booking Reminder):\n` +
      `🪔 பூஜை: ${b.poojaTamilName || b.poojaEnglishName}\n` +
      `📅 தேதி: நாளை (${b.date})\n` +
      `⏰ நேரம்: ${b.startTime || "காலை"}\n` +
      `${b.location ? `📍 இடம்: ${b.location}\n` : ""}` +
      `\nநாளை குறிப்பிட்ட நேரத்தில் பூஜை சிறப்பாக நடைபெறும். தேவையான ஏற்பாடுகளை தயார் நிலையில் வைத்திருக்கவும்.\n\n` +
      `நன்றி,\n*${businessName || "வேள்வி வாத்யார்"}*\n\n` +
      `✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`
    );
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-amber-200/90 overflow-hidden flex flex-col max-h-[calc(100dvh-3rem)] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 via-orange-50/40 to-amber-100/50 border-b border-amber-200/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-xs ring-2 ring-amber-300">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5 flex-wrap">
                <span>வேள்வி அறிவிப்புகள்</span>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-300">
                  Notifications
                </span>
              </h3>
              <p className="text-[11px] text-amber-900/80 font-medium">
                பூஜை நினைவூட்டல்கள் & கணக்கு விபரங்கள்
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/90 hover:bg-slate-100 text-slate-600 flex items-center justify-center transition border border-slate-200/80 cursor-pointer active:scale-95 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto overscroll-contain p-3.5 sm:p-4 space-y-3.5 text-xs text-slate-800">
          {/* Quick Search Bar Shortcut in Notification Modal */}
          <div
            onClick={onOpenSearch}
            className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs group"
          >
            <div className="flex items-center gap-2 text-slate-600 group-hover:text-emerald-950 font-bold min-w-0">
              <div className="w-7 h-7 rounded-xl bg-white border border-slate-200 flex items-center justify-center shrink-0 text-slate-500 group-hover:text-emerald-700">
                <Search className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs truncate">
                பக்தர், பூஜை, அமைப்புகளை தேடுக (Ctrl+K)...
              </span>
            </div>
            <span className="text-[10px] font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-500 group-hover:text-emerald-800 shrink-0">
              தேடுக →
            </span>
          </div>

          {/* Section 1: Tomorrow's Scheduled Poojas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-[11px] text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5 text-amber-700" />
                <span>நாளை நடைபெறும் பூஜைகள் (Tomorrow&apos;s Poojas)</span>
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-950 border border-amber-300">
                {tomorrowBookings.length} {tomorrowBookings.length === 1 ? "பூஜை" : "பூஜைகள்"}
              </span>
            </div>

            {tomorrowBookings.length > 0 ? (
              <div className="space-y-2">
                {tomorrowBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-3 rounded-2xl bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 border border-amber-200/90 shadow-2xs space-y-2 hover:border-amber-400 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300">
                          <Flame className="w-4 h-4 text-amber-700" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {b.poojaTamilName || b.poojaEnglishName}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-600 truncate mt-0.5">
                            {b.customerName || "பக்தர்"}
                            {b.customerMobile && ` • ${b.customerMobile}`}
                          </div>
                          {b.location && (
                            <div className="text-[10.5px] text-slate-500 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>{b.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Clock className="w-3 h-3 text-emerald-700" />
                          {b.startTime || "காலை"}
                        </span>
                      </div>
                    </div>

                    {/* WhatsApp Auspicious Reminder Button */}
                    <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between gap-2">
                      <Link
                        href={`/app/bookings?date=${b.date}`}
                        onClick={onClose}
                        className="text-[10.5px] font-bold text-amber-900 hover:underline"
                      >
                        விவரம் காண்க →
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => handleSendWhatsAppReminder(b, e)}
                        className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-[10.5px] font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-200" />
                        <span>வாட்ஸ்அப் நினைவூட்டல்</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 py-3.5 space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto" />
                <p className="font-semibold text-xs">நாளை எந்த பூஜைகளும் திட்டமிடப்படவில்லை</p>
                <p className="text-[10.5px] text-slate-400">புதிய பதிவுகளை எப்போது வேண்டுமானாலும் உருவாக்கலாம்</p>
              </div>
            )}
          </div>

          {/* Section 2: Subscription Validity & Plan Details */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="font-extrabold text-[11px] text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
                <span>திட்டம் & கணக்கு நிலை (Account Status)</span>
              </span>
            </div>

            {isPro ? (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-amber-50/50 border border-emerald-200/90 shadow-2xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs text-emerald-950 flex items-center gap-1.5 flex-wrap">
                      <span>👑 Velvi Pro Active</span>
                      <span className="text-[9px] font-black bg-emerald-600 text-white px-2 py-0.2 rounded-full uppercase tracking-wider">
                        Unlimited Bookings
                      </span>
                    </div>
                    <p className="text-[10.5px] text-emerald-800 font-medium mt-0.5">
                      {daysToExpiry !== null ? `${daysToExpiry} நாட்கள் செல்லுபடியாகும் (Days Left)` : "வரம்பற்ற முன்பதிவுகள் செயலில் உள்ளன"}
                    </p>
                  </div>
                </div>
                <Link
                  href="/app/subscription"
                  onClick={onClose}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-xl text-[10px] font-black shrink-0 transition shadow-2xs"
                >
                  நிர்வகி
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50/90 via-orange-50/40 to-amber-100/50 border border-amber-300 shadow-2xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-xs text-amber-950 flex items-center gap-1.5 flex-wrap">
                      <span>🚀 டெமோ முறை (Demo Mode)</span>
                      <span className="text-[9px] font-black bg-amber-600 text-white px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                        20 Cap
                      </span>
                    </div>
                    <p className="text-[10.5px] text-amber-900 font-medium mt-0.5">
                      வரம்பற்ற பதிவுகளுக்கு ப்ரோ திட்டத்திற்கு மேம்படுத்தவும்
                    </p>
                  </div>
                </div>
                <Link
                  href="/app/subscription"
                  onClick={onClose}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10.5px] font-black shrink-0 transition shadow-2xs"
                >
                  Upgrade Pro
                </Link>
              </div>
            )}
          </div>

          {/* Section 3: Cloud Sync Status */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <Cloud className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-slate-800 text-[11px] truncate">
                  {syncedCount} முன்பதிவுகள் மேகக்கணியில் பாதுகாப்பாக சேமிக்கப்பட்டுள்ளன
                </div>
                <div className="text-[10px] text-slate-500 font-medium">
                  கடைசி ஒத்திசைவு (Last Sync): {lastSyncedTime}
                </div>
              </div>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-3.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-2xs"
          >
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <span>தேடுதல் (Search)</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl text-xs font-black transition active:scale-95 shadow-xs cursor-pointer"
          >
            சரி, பார்த்தேன் (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
