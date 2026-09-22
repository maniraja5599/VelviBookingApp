"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { Booking, Business } from "@/lib/types";
import { VelviLogo } from "@/components/ui/VelviLogo";
import {
  X,
  Phone,
  MapPin,
  Calendar,
  Check,
  Flame,
  Copy,
  IndianRupee,
  Layers,
  Download,
  MessageCircle,
  RotateCcw,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { getTamilDate } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage, formatUnitTamil } from "@/lib/whatsapp/formatter";
import { copyToClipboard } from "@/lib/utils/clipboard";

interface PoojaSlipModalProps {
  booking: Booking;
  business?: Business | null;
  onClose: () => void;
}

export function PoojaSlipModal({ booking, business, onClose }: PoojaSlipModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [shareNotice, setShareNotice] = useState<string | null>(null);
  const [showWhatsAppEditor, setShowWhatsAppEditor] = useState(false);
  const [editableWhatsAppText, setEditableWhatsAppText] = useState("");
  const [copiedWhatsAppText, setCopiedWhatsAppText] = useState(false);
  const slipRef = useRef<HTMLDivElement>(null);

  const tamilDate = getTamilDate(booking.date);
  const contactPhone = business?.phone || business?.whatsapp || "+91-9840012345";

  // Extract samagri checklist items
  const samagriList = useMemo(() => {
    return (booking.items && booking.items.length > 0)
      ? booking.items.map((it) => ({
          id: it.id,
          name: it.itemTamilName || it.itemEnglishName,
          qty: `${it.quantity} ${formatUnitTamil(it.unit || "nos") || it.unit}`,
        }))
      : [
          { id: "1", name: "மஞ்சள் தூள் (Turmeric Powder)", qty: "100 கிராம்" },
          { id: "2", name: "குங்குமம் (Kumkum)", qty: "50 கிராம்" },
          { id: "3", name: "சந்தனம் (Sandal Powder)", qty: "1 பாக்கெட்" },
          { id: "4", name: "கற்பூரம் (Camphor)", qty: "1 பாக்கெட்" },
          { id: "5", name: "ஊதுபத்தி (Agarbathi)", qty: "1 பாக்கெட்" },
          { id: "6", name: "வெற்றிலை பாக்கு (Betel Leaves & Nuts)", qty: "10 செட்" },
          { id: "7", name: "தேங்காய் (Coconuts)", qty: "3 எண்ணிக்கை" },
          { id: "8", name: "பூக்கள் மாலை மற்றும் உதிரி (Flowers)", qty: "1 முழம் & உதிரி" },
        ];
  }, [booking.items]);

  // All items ticked (checked) by default as requested
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    samagriList.forEach((it) => {
      initial[it.id] = true;
    });
    return initial;
  });

  useEffect(() => {
    setCheckedItems((prev) => {
      const updated = { ...prev };
      samagriList.forEach((it) => {
        if (updated[it.id] === undefined) {
          updated[it.id] = true;
        }
      });
      return updated;
    });
  }, [samagriList]);

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: prev[id] === false ? true : false }));
  };

  // 1. Save Image (Explicit Download PNG)
  const handleSaveImage = async () => {
    if (!slipRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(slipRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#faf8f5",
      });
      const cleanNum = (booking.bookingNumber || booking.id).replace(/#/g, "");
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `Velvi_Pooja_Slip_${cleanNum}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Save image failed:", err);
    } finally {
      setIsCapturing(false);
    }
  };

  // Default WhatsApp confirmation message
  const defaultWhatsAppMsg = useMemo(() => {
    const biz = business || {
      id: "biz-venkateswara-01",
      name: "வேள்வி வேத பவனம்",
      phone: contactPhone,
      showWatermark: true,
    };
    return formatBookingConfirmationWhatsAppMessage(booking, biz as Business);
  }, [booking, business, contactPhone]);

  // Open Preview & Edit panel before WhatsApp send
  const handleOpenWhatsAppPreview = () => {
    setEditableWhatsAppText(defaultWhatsAppMsg);
    setShowWhatsAppEditor(true);
  };

  const handleSendCustomWhatsApp = () => {
    const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";
    const msg = editableWhatsAppText || defaultWhatsAppMsg;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCopyCustomWhatsApp = async () => {
    const success = await copyToClipboard(editableWhatsAppText || defaultWhatsAppMsg);
    if (success) {
      setCopiedWhatsAppText(true);
      setTimeout(() => setCopiedWhatsAppText(false), 2000);
    }
  };

  const handleShareWhatsApp = handleOpenWhatsAppPreview;

  const handleCopyText = async () => {
    let msg = `வேள்வி — பூஜை சாமக்கிரி பொருட்கள் (${booking.customerName} - ${booking.poojaTamilName || booking.poojaEnglishName}):\n\n`;
    samagriList.forEach((it, i) => {
      const isChecked = checkedItems[it.id] !== false;
      msg += `${i + 1}. ${isChecked ? "✅" : "⬜"} ${it.name} - ${it.qty}\n`;
    });
    msg += `\n📅 நாள்: ${booking.date} (${booking.startTime}) | 📍 இடம்: ${booking.customerAddress || booking.location || "Namakkal"}`;
    if (business?.name) {
      msg += `\n🙏 ${business.name} • ${contactPhone}`;
    }

    const success = await copyToClipboard(msg);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-amber-200">
        {/* Modern Action Toolbar */}
        <div className="sticky top-0 z-20 bg-emerald-950 text-white px-3 sm:px-4 py-2.5 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm">Pooja Slip & Samagri</h3>
              <p className="text-[10px] text-emerald-200/80">பதிவு {booking.bookingNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Save Image Button (Direct PNG) */}
            <button
              type="button"
              onClick={handleSaveImage}
              disabled={isCapturing}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
              title="Save Image (PNG)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isCapturing ? "Saving..." : "Save Image"}</span>
            </button>

            {/* Dedicated WhatsApp Text Button */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1 transition active:scale-95 shadow-xs cursor-pointer"
              title="Send WhatsApp Text Slip"
            >
              <MessageCircle className="w-3.5 h-3.5 fill-white text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-emerald-200 hover:text-white hover:bg-white/10 rounded-lg transition cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Share Notice Banner */}
        {shareNotice && (
          <div className="bg-emerald-50 border-b border-emerald-300 text-emerald-950 px-4 py-2 text-xs font-bold flex items-center justify-between animate-in fade-in shrink-0">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shareNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setShareNotice(null)}
              className="text-emerald-700 hover:text-emerald-950 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {showWhatsAppEditor ? (
          /* ======================================================================= */
          /* WHATSAPP MESSAGE PREVIEW & EDIT PANEL                                   */
          /* ======================================================================= */
          <div className="p-4 sm:p-5 space-y-3.5 bg-white text-slate-900 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                type="button"
                onClick={() => setShowWhatsAppEditor(false)}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Slip</span>
              </button>

              <button
                type="button"
                onClick={() => setEditableWhatsAppText(defaultWhatsAppMsg)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-semibold cursor-pointer"
                title="Reset to default template"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5 text-emerald-950 font-black">
                  <MessageCircle className="w-4 h-4 text-green-600" />
                  <span>WhatsApp Message (Preview & Edit)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  {booking.customerName} ({booking.customerMobile})
                </span>
              </div>
              <textarea
                value={editableWhatsAppText}
                onChange={(e) => setEditableWhatsAppText(e.target.value)}
                rows={13}
                className="w-full bg-[#faf9f6] rounded-2xl border border-slate-300 p-3.5 text-xs text-slate-900 leading-relaxed font-sans shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white resize-none"
                placeholder="Type or edit your WhatsApp message..."
              />
              <p className="text-[10px] text-slate-500 italic">
                💡 You can edit and customize this message before sending to devotee.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleCopyCustomWhatsApp}
                className="py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-95 transition cursor-pointer"
              >
                {copiedWhatsAppText ? (
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
                onClick={handleSendCustomWhatsApp}
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Send to WhatsApp</span>
              </button>
            </div>
          </div>
        ) : (
          /* ======================================================================= */
          /* CAPTUREABLE SACRED SLIP CONTAINER                                       */
          /* ======================================================================= */
          <div
            ref={slipRef}
            id="pooja-slip-card"
            className="p-4 sm:p-6 space-y-4 bg-[#faf8f5] text-slate-900"
          >
          {/* Sacred Brand Header (Kutty Smart Logo) */}
          <div className="text-center pb-3 border-b-2 border-dashed border-amber-200/90 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <VelviLogo size="xs" variant="icon" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-900 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                VELVI
              </span>
            </div>
            <h2 className="font-black text-base sm:text-lg text-emerald-950 tracking-tight mt-0.5">
              {business?.name || "வேள்வி வேத பவன பூஜை சேவைகள்"}
            </h2>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-700" />
                {contactPhone}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-700" />
                {business?.address || "தமிழ்நாடு, இந்தியா"}
              </span>
            </p>
          </div>

          {/* Devotee & Pooja Details Card */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Devotee / பக்தர்
                </span>
                <h4 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                  {booking.customerName}
                </h4>
                {booking.customerMobile && (
                  <p className="text-[10.5px] text-slate-500 font-bold">{booking.customerMobile}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Booking No
                </span>
                <span className="text-xs sm:text-sm font-black text-emerald-900 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {booking.bookingNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[9.5px] text-slate-400 font-bold block">Pooja / பூஜை:</span>
                <span className="font-extrabold text-slate-900 block leading-tight">
                  {booking.poojaTamilName || booking.poojaEnglishName}
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {booking.poojaEnglishName}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 font-bold block">Date & Muhurtham:</span>
                <span className="font-black text-slate-900 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  {booking.date}
                </span>
                <span className="text-[10px] text-amber-800 font-bold block">
                  {tamilDate.tamilMonth} {tamilDate.tamilDay} ({booking.startTime})
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold truncate">{booking.customerAddress || booking.location || "Namakkal"}</span>
              </div>
            </div>
          </div>

          {/* Pooja Samagri Items Checklist */}
          <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-amber-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Layers className="w-4 h-4 text-amber-600 shrink-0" />
                <h4 className="font-black text-xs sm:text-sm text-slate-900 truncate">
                  சாமக்கிரி பொருட்கள் பட்டியல் (Items to Arrange)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300/80 rounded-xl text-[11px] font-black flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer shrink-0"
                title="சாமக்கிரி பட்டியலை காபி செய் (Copy List)"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                    <span className="text-emerald-800 font-black">Copied! ✓</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Copy List</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-1 divide-y divide-slate-100 text-xs max-h-60 overflow-y-auto pr-1">
              {samagriList.map((item, idx) => {
                const isChecked = checkedItems[item.id] !== false; // Default true (ticked)
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCheck(item.id)}
                    className={`pt-1.5 pb-1 flex items-center justify-between gap-2 cursor-pointer transition select-none hover:bg-amber-50/50 rounded-lg px-1.5 ${
                      !isChecked ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? "bg-emerald-600 border border-emerald-700 text-white shadow-2xs"
                            : "border-2 border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                      <span className={`font-bold truncate ${isChecked ? "text-slate-900" : "text-slate-400"}`}>
                        {idx + 1}. {item.name}
                      </span>
                    </div>
                    <span className="font-extrabold text-emerald-950 font-mono text-[10.5px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                      {item.qty}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[9.5px] text-slate-500 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1 text-emerald-800 font-bold">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>டீஃபால்டாக அனைத்து பொருட்களும் உறுதி செய்யப்பட்டன (All items confirmed)</span>
              </span>
              <span className="text-slate-400">கிளிக் செய்து மாற்றலாம்</span>
            </div>
          </div>

          {/* Clean Dakshina Details Section (No UPI QR Code) */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 rounded-2xl p-3.5 sm:p-4 border border-amber-200/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Dakshina / கட்டண விபரம்</span>
                </h4>
                <p className="text-[10.5px] text-slate-500 font-semibold">
                  நிலை: {booking.paymentStatus === "PAID" ? "முழுதும் செலுத்தப்பட்டது ✅" : "நிலுவை உள்ளது"}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[9.5px] text-slate-400 font-bold block">மீதமுள்ள தொகை:</span>
                <span className="text-base sm:text-lg font-black text-rose-700">
                  ₹{(booking.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white/80 rounded-xl border border-amber-100">
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">மொத்த தட்சணை</span>
                <span className="font-black text-slate-900 block mt-0.5">
                  ₹{(booking.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">முன்பணம்</span>
                <span className="font-black text-emerald-700 block mt-0.5">
                  ₹{(booking.advanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">மீதம்</span>
                <span className="font-black text-rose-700 block mt-0.5">
                  ₹{(booking.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>

          {/* Sacred Footer Blessing */}
          <div className="text-center pt-2 text-[10.5px] text-slate-500 space-y-1 border-t border-dashed border-amber-200/80">
            <p className="font-extrabold text-emerald-950">
              🙏 லோகா: ஸமஸ்தா: ஸுகினோ பவந்து — நல்லதே நம் நோக்கம் 🙏
            </p>
            <p className="text-[9.5px] text-slate-400">
              ✨ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨ • {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      )}
    </div>
  </div>
);
}
