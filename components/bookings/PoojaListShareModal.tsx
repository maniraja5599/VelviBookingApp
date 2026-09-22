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
  Building2,
  RotateCcw,
  CheckCircle2,
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
  const [imageCopied, setImageCopied] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>(
    business?.name || "வேள்வி வேத பவனம்"
  );

  // Generate WhatsApp text message
  const whatsappMessage = React.useMemo(() => {
    if (!booking || !business) return "";
    return formatPoojaItemsWhatsAppMessage(booking, business);
  }, [booking, business]);

  // Editable WhatsApp message
  const [customWhatsAppMsg, setCustomWhatsAppMsg] = useState("");

  useEffect(() => {
    if (whatsappMessage) {
      setCustomWhatsAppMsg(whatsappMessage);
    }
  }, [whatsappMessage]);

  // Generate Image Flyer on open or when booking / companyName changes
  useEffect(() => {
    if (!isOpen || !booking || !business) return;

    let isMounted = true;
    setIsGenerating(true);

    const timer = setTimeout(() => {
      generatePoojaFlyer(booking, business, {
        themePreset: theme.preset,
        customCompanyName: companyName,
      })
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
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isOpen, booking, business, theme.preset, companyName]);

  if (!isOpen) return null;

  const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";

  const handleOpenWhatsApp = () => {
    const textToSend = customWhatsAppMsg || whatsappMessage;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(textToSend)}`;
    window.open(url, "_blank");
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(customWhatsAppMsg || whatsappMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  const handleResetText = () => {
    setCustomWhatsAppMsg(whatsappMessage);
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

  const handleCopyImage = async () => {
    if (!flyerDataUrl) return;
    try {
      const res = await fetch(flyerDataUrl);
      const blob = await res.blob();
      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setImageCopied(true);
        setShareNotice("Image copied to clipboard! You can paste (Ctrl+V) directly in WhatsApp.");
        setTimeout(() => {
          setImageCopied(false);
          setShareNotice(null);
        }, 4000);
      } else {
        setShareNotice("Browser does not support direct image copying. Please use Download.");
        setTimeout(() => setShareNotice(null), 3000);
      }
    } catch (err) {
      console.error("Copy image failed:", err);
      setShareNotice("Failed to copy image. Please try downloading.");
      setTimeout(() => setShareNotice(null), 3000);
    }
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
            text: customWhatsAppMsg || whatsappMessage,
            files: [file],
          });
          return;
        }
      }
    } catch (err) {
      if ((err as any)?.name !== "AbortError") {
        console.log("Native share error:", err);
      } else {
        return;
      }
    }

    // Fallback: Copy image to clipboard without downloading!
    await handleCopyImage();
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
                Share Pooja Items List
              </h3>
              <p className="text-[11px] text-slate-500 font-semibold truncate">
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
        <div className="flex bg-slate-100 p-1 rounded-2xl text-xs font-bold my-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("image")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "image"
                ? "bg-white text-emerald-950 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Flyer Image</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === "text"
                ? "bg-white text-emerald-950 shadow-2xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageCircle className="w-4 h-4 text-green-600 shrink-0" />
            <span>WhatsApp Text</span>
          </button>
        </div>

        {/* Share / Copy Toast Notice */}
        {shareNotice && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0 shadow-xs mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{shareNotice}</span>
          </div>
        )}

        {/* Modal Body - Scrollable Content */}
        <div className="flex-1 overflow-y-auto space-y-3 min-h-0 pr-0.5">
          {activeTab === "image" ? (
            /* ======================================================== */
            /* 1. FLYER IMAGE PREVIEW VIEW                             */
            /* ======================================================== */
            <div className="space-y-3">
              {/* Live Company Name Input (company name input la kudukurathu) */}
              <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-2.5 space-y-1 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-amber-950 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Temple / Business Name:</span>
                  </label>
                  {companyName !== (business?.name || "வேள்வி வேத பவனம்") && (
                    <button
                      type="button"
                      onClick={() => setCompanyName(business?.name || "வேள்வி வேத பவனம்")}
                      className="text-[10px] text-amber-800 hover:text-amber-950 underline font-semibold cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Sri Karpaga Vinayagar Temple"
                  className="w-full bg-white border border-amber-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <p className="text-[9.5px] text-amber-800/80 font-medium">
                  💡 Name entered here updates the flyer image in real-time.
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Flyer Image Preview</span>
                </span>
                <span className="text-[10px] text-emerald-850 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  {booking.items?.length || 0} Items
                </span>
              </div>

              {/* Rendered Canvas Image Card */}
              <div className="bg-[#faf8f5] rounded-2xl border border-amber-200/80 p-2 flex items-center justify-center relative min-h-[260px] shadow-inner overflow-hidden">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center gap-2 text-slate-500 py-12">
                    <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
                    <span className="text-xs font-bold">Rendering High-Res Flyer...</span>
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
                    Could not render flyer image
                  </div>
                )}
              </div>

              {/* Action Buttons for Image: Copy Image, Direct Share (No download), and Save PNG */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleCopyImage}
                    disabled={!flyerDataUrl || isGenerating}
                    className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                    title="Copy image to clipboard for WhatsApp Web pasting (Ctrl+V)"
                  >
                    {imageCopied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600 shrink-0" />
                        <span>Copy Image</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleNativeShare}
                    disabled={!flyerDataUrl || isGenerating}
                    className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                    title="Direct Share via App or Clipboard (No Download)"
                  >
                    <Share2 className="w-4 h-4 text-amber-300 shrink-0" />
                    <span>Share Image</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadImage}
                  disabled={!flyerDataUrl || isGenerating}
                  className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer disabled:opacity-50"
                  title="Download and save PNG file to your computer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Download Image (PNG)</span>
                </button>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* 2. WHATSAPP CHAT MESSAGE PREVIEW & EDIT VIEW            */
            /* ======================================================== */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
                <span className="flex items-center gap-1.5 text-emerald-950 font-black">
                  <MessageCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                  <span>WhatsApp Message (Preview & Edit)</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetText}
                    className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                    title="Reset back to default template message"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyText}
                    className="text-[10.5px] font-extrabold text-emerald-850 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-600">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Editable Textarea Panel */}
              <div className="space-y-1">
                <textarea
                  value={customWhatsAppMsg}
                  onChange={(e) => setCustomWhatsAppMsg(e.target.value)}
                  rows={10}
                  className="w-full bg-[#faf9f6] rounded-2xl border border-slate-300 p-3 text-xs text-slate-900 leading-relaxed font-sans shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
                  placeholder="Type or edit your WhatsApp message..."
                />
                <p className="text-[10px] text-slate-400 italic">
                  💡 You can edit and customize this message before sending to devotee.
                </p>
              </div>

              {/* WhatsApp Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-slate-600" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Send to WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-semibold">
            Devotee Mobile: {booking.customerMobile || "N/A"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
