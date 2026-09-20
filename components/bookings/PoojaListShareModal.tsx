"use client";

import React, { useState, useEffect } from "react";
import { Booking, Business } from "@/lib/types";
import { formatPoojaItemsWhatsAppMessage } from "@/lib/whatsapp/formatter";
import { generatePoojaFlyer } from "@/lib/flyer/canvas-generator";
import { useTheme } from "@/components/providers/ThemeContext";
import {
  X,
  Share2,
  Download,
  Copy,
  Check,
  Sparkles,
  MessageCircle,
  Image as ImageIcon,
  ExternalLink,
  Eye,
} from "lucide-react";

interface PoojaListShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  business: Business;
}

export const PoojaListShareModal: React.FC<PoojaListShareModalProps> = ({
  isOpen,
  onClose,
  booking,
  business,
}) => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<"image" | "text">("image");
  const [flyerDataUrl, setFlyerDataUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate WhatsApp text message
  const whatsappMessage = React.useMemo(() => {
    if (!booking || !business) return "";
    return formatPoojaItemsWhatsAppMessage(booking, business);
  }, [booking, business]);

  // Generate Image Flyer on open or when booking changes
  useEffect(() => {
    if (!isOpen || !booking || !business) return;

    let isMounted = true;
    setIsGenerating(true);

    generatePoojaFlyer(booking, business, theme.preset)
      .then((dataUrl) => {
        if (isMounted) {
          setFlyerDataUrl(dataUrl);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error("Flyer generation error:", err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, booking, business, theme.preset]);

  if (!isOpen) return null;

  const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";

  const handleOpenWhatsApp = () => {
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleDownloadImage = () => {
    if (!flyerDataUrl) return;
    const a = document.createElement("a");
    a.href = flyerDataUrl;
    const cleanNum = booking.bookingNumber ? booking.bookingNumber.replace(/#/g, "") : booking.id;
    a.download = `Pooja_Items_${cleanNum}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNativeShare = async () => {
    if (!flyerDataUrl) {
      handleOpenWhatsApp();
      return;
    }

    // Attempt Web Share API with image file if supported
    try {
      if (navigator.share && navigator.canShare) {
        const res = await fetch(flyerDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `Pooja_Items_${booking.bookingNumber || "list"}.png`, {
          type: "image/png",
        });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `${booking.poojaEnglishName || "Pooja"} Items List`,
            text: whatsappMessage,
            files: [file],
          });
          return;
        }
      }
    } catch (err) {
      console.log("Native share fallback to WhatsApp:", err);
    }

    // Fallback directly to WhatsApp web/app
    handleOpenWhatsApp();
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md w-full max-h-[92vh] flex flex-col shadow-2xl border border-velvi-gold/40 animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center font-bold text-sm shadow-2xs border border-amber-400/40 shrink-0">
              <Share2 className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight truncate">
                பூஜைப் பொருட்கள் பகிர்வு (Share List)
              </h3>
              <p className="text-[10.5px] text-slate-500 font-semibold truncate">
                {booking.poojaEnglishName || booking.poojaTamilName} • {booking.customerName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Image Flyer vs WhatsApp Text */}
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-black my-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "image"
                ? "bg-white text-emerald-950 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-700" />
            <span>பதாகைப் படம் (Flyer Image)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-1.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "text"
                ? "bg-white text-emerald-950 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageCircle className="w-3.5 h-3.5 text-green-600" />
            <span>வாட்ஸ்அப் உரை (WhatsApp Text)</span>
          </button>
        </div>

        {/* Modal Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-0.5">
          {activeTab === "image" ? (
            /* ======================================================== */
            /* 1. FLYER IMAGE PREVIEW VIEW                             */
            /* ======================================================== */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-amber-600" />
                  <span>முழுப் பட முன்னோட்டம் (Preview)</span>
                </span>
                <span className="text-[10px] text-emerald-850 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {booking.items?.length || 0} பொருட்கள்
                </span>
              </div>

              {/* Rendered Canvas Image Card */}
              <div className="bg-[#faf8f5] rounded-2xl border border-amber-200/80 p-2 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold">அழகிய படம் தயாராகிறது...</span>
                  </div>
                ) : flyerDataUrl ? (
                  <div className="w-full flex flex-col items-center">
                    <img
                      src={flyerDataUrl}
                      alt="Pooja Samagri Flyer"
                      className="w-full max-h-[360px] object-contain rounded-xl shadow-md border border-amber-300/60"
                    />
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-xs">
                    படம் உருவாக்க முடியவில்லை
                  </div>
                )}
              </div>

              {/* Action Buttons for Image */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={!flyerDataUrl || isGenerating}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>படத்தைப் பதிவிறக்கு</span>
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  disabled={!flyerDataUrl || isGenerating}
                  className="py-2.5 px-3 bg-gradient-to-r from-emerald-850 to-emerald-900 hover:from-emerald-800 hover:to-emerald-800 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4 text-amber-300" />
                  <span>வாட்ஸ்அப் பகிர்</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* 2. WHATSAPP CHAT MESSAGE PREVIEW VIEW                   */
            /* ======================================================== */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>வாட்ஸ்அப் உரை செய்தி (Chat Preview)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="text-[10.5px] font-extrabold text-emerald-850 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span className="text-emerald-600">நகலெடுக்கப்பட்டது!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>உரையை நகலெடு</span>
                    </>
                  )}
                </button>
              </div>

              {/* Realistic WhatsApp Chat Bubble Container */}
              <div className="bg-[#efeae2] p-3 rounded-2xl border border-slate-200/80 shadow-inner max-h-[320px] overflow-y-auto">
                <div className="bg-white rounded-2xl rounded-tl-none p-3 shadow-xs border border-slate-100 space-y-1.5 max-w-[95%] text-slate-900 leading-relaxed font-sans text-xs select-text">
                  <div className="whitespace-pre-wrap font-medium text-[11.5px]">
                    {whatsappMessage}
                  </div>
                  <div className="text-[9px] text-slate-400 text-right font-mono flex items-center justify-end gap-1 pt-1">
                    <span>Just now</span>
                    <span className="text-blue-500 font-bold">✓✓</span>
                  </div>
                </div>
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied ✅</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>உரையை நகலெடு</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>வாட்ஸ்அப் திறக்க</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[10.5px] text-slate-500 font-semibold">
            பக்தர் எண்: {booking.customerMobile || "N/A"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer active:scale-95"
          >
            மூடு (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
