"use client";

import React, { useEffect, useState, useRef } from "react";
import { Booking, Business } from "@/lib/types";
import { VelviLogo } from "@/components/ui/VelviLogo";
import QRCode from "qrcode";
import {
  Printer,
  Share2,
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Flame,
  Sparkles,
  ShieldCheck,
  IndianRupee,
  Layers,
} from "lucide-react";
import { getTamilDate } from "@/lib/calendar/tamil";

interface PoojaSlipModalProps {
  booking: Booking;
  business?: Business | null;
  onClose: () => void;
}

export function PoojaSlipModal({ booking, business, onClose }: PoojaSlipModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const tamilDate = getTamilDate(booking.date);
  const contactPhone = business?.phone || business?.whatsapp || "+91-9840012345";
  const paymentUpi = business?.whatsapp
    ? `${business.whatsapp.replace(/\D/g, "").slice(-10)}@upi`
    : "priest@okaxis";

  // Dynamic UPI Payment Link for Balance Dakshina
  const balanceToPay = booking.balanceAmount || 0;
  const upiLink = `upi://pay?pa=${encodeURIComponent(paymentUpi)}&pn=${encodeURIComponent(
    business?.name || "Velvi Pooja Services"
  )}&am=${balanceToPay}&cu=INR&tn=${encodeURIComponent(
    `Velvi-${booking.bookingNumber}-${booking.poojaEnglishName}`
  )}`;

  useEffect(() => {
    // Generate high-resolution QR code
    QRCode.toDataURL(upiLink, {
      width: 160,
      margin: 1,
      color: {
        dark: "#064e3b",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.warn("QR code generation:", err));
  }, [upiLink]);

  // Extract samagri checklist items (fallback to default auspicious items if none configured)
  const samagriList = (booking.items && booking.items.length > 0)
    ? booking.items.map((it) => ({
        id: it.id,
        name: it.itemTamilName || it.itemEnglishName,
        english: it.itemEnglishName,
        qty: `${it.quantity} ${it.unit}`,
        category: it.category || "சாமக்கிரி",
      }))
    : [
        { id: "s-1", name: "தேங்காய் (மட்டை உரித்தது)", english: "Coconuts (Peeled)", qty: "5 எண்ணம்", category: "அடிப்படை" },
        { id: "s-2", name: "தூய பசு நெய்", english: "Pure Cow Ghee", qty: "500 கிராம்", category: "நெய் & எண்ணெய்" },
        { id: "s-3", name: "ஹோம சமித்து கட்டு & தர்பை", english: "Samithu Bundle & Darbha", qty: "1 செட்", category: "ஹோமம்" },
        { id: "s-4", name: "நவதானியம் செட்", english: "Navadhanyam 9 Grains", qty: "1 பாக்கெட்", category: "தானியங்கள்" },
        { id: "s-5", name: "மஞ்சள் தூள், குங்குமம், சந்தனம்", english: "Turmeric, Kumkum, Sandal", qty: "தலா 50g", category: "பொடிகள்" },
        { id: "s-6", name: "மல்லி பூ, உதிரி பூ மாலை", english: "Fresh Flowers & Garlands", qty: "2 முழம் + 2 மாலை", category: "பூக்கள்" },
        { id: "s-7", name: "வெற்றிலை பாக்கு, வாழைப்பழம்", english: "Betel Leaves & Bananas", qty: "20 இலை + 1 சீப்பு", category: "பழங்கள்" },
        { id: "s-8", name: "வஸ்திரம் (வேஷ்டி துண்டு செட்)", english: "Vastram Cotton Dhoti Set", qty: "1 செட்", category: "வஸ்திரம்" },
      ];

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let msg = `🪔 *வேள்வி — பூஜை ரசீது & சாமக்கிரி பட்டியல்* 🪔\n\n`;
    msg += `பக்தர் பெயர்: *${booking.customerName}*\n`;
    msg += `பதிவு எண்: *${booking.bookingNumber}*\n`;
    msg += `பூஜை: *${booking.poojaEnglishName}* (${booking.poojaTamilName})\n`;
    msg += `தேதி: *${booking.date}* (${tamilDate.tamilMonth} ${tamilDate.tamilDay} - ${booking.startTime})\n`;
    msg += `இடம்: *${booking.location || "Namakkal"}*\n\n`;
    msg += `📦 *பக்தர்கள் வாங்கி வைக்க வேண்டிய சாமக்கிரி பொருட்கள்:*\n`;
    samagriList.forEach((it, i) => {
      msg += `${i + 1}. ${it.name} — *${it.qty}*\n`;
    });
    msg += `\n💰 *தட்சிணை கணக்கு விபரம்:*\n`;
    msg += `• மொத்த தட்சிணை: ₹${booking.totalAmount?.toLocaleString("en-IN")}\n`;
    msg += `• முன்பணம்: ₹${(booking.advanceAmount || 0).toLocaleString("en-IN")}\n`;
    msg += `• மீதமுள்ள நிலுவை: *₹${(booking.balanceAmount || 0).toLocaleString("en-IN")}*\n\n`;
    msg += `_இறைவனின் பூரண அருள் கிடைக்க மனமார்ந்த வாழ்த்துகள்!_ 🙏\n_வேள்வி செயலி_`;

    const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleCopyText = () => {
    let msg = `வேள்வி — பூஜை சாமக்கிரி பட்டியல் (${booking.customerName} - ${booking.poojaTamilName}):\n\n`;
    samagriList.forEach((it, i) => {
      msg += `${i + 1}. ${it.name} - ${it.qty}\n`;
    });
    msg += `\nதேதி: ${booking.date} (${booking.startTime}) | இடம்: ${booking.location || "Namakkal"}`;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-amber-200">
        {/* Sticky Action Toolbar (Hidden during Print) */}
        <div className="sticky top-0 z-20 bg-emerald-950 text-white px-4 py-3 flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm">Pooja Slip & Samagri List</h3>
              <p className="text-[10px] text-emerald-200/80">பதிவு {booking.bookingNumber}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95 shadow-xs cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* PRINTABLE SLIP CONTAINER (What prints out on A4 or 80mm thermal receipt) */}
        {/* ======================================================================= */}
        <div className="p-4 sm:p-6 space-y-5 bg-[#faf8f5] text-slate-900 print:p-8 print:bg-white print:space-y-4">
          {/* Sacred Brand Header */}
          <div className="text-center pb-3 border-b-2 border-dashed border-amber-200/90 space-y-1">
            <div className="flex justify-center">
              <VelviLogo size="md" variant="full" showTagline={true} />
            </div>
            <h2 className="font-black text-base sm:text-lg text-emerald-950 tracking-tight">
              {business?.name || "வேள்வி வேத பவன பூஜை சேவைகள்"}
            </h2>
            <p className="text-[11px] text-slate-600 font-semibold flex items-center justify-center gap-3 flex-wrap">
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
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Devotee / பக்தர்
                </span>
                <h4 className="font-black text-base text-slate-900 leading-tight">
                  {booking.customerName}
                </h4>
                {booking.customerMobile && (
                  <p className="text-[11px] text-slate-500 font-bold">{booking.customerMobile}</p>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Booking No
                </span>
                <span className="text-sm font-black text-emerald-900 font-mono bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                  {booking.bookingNumber}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Pooja / பூஜை:</span>
                <span className="font-extrabold text-slate-900 block leading-tight">
                  {booking.poojaTamilName || booking.poojaEnglishName}
                </span>
                <span className="text-[10.5px] text-slate-500 block">
                  {booking.poojaEnglishName}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">Date & Muhurtham:</span>
                <span className="font-black text-slate-900 block flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  {booking.date}
                </span>
                <span className="text-[10.5px] text-amber-800 font-bold block">
                  {tamilDate.tamilMonth} {tamilDate.tamilDay} ({booking.startTime})
                </span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-semibold">{booking.customerAddress || booking.location || "Namakkal"}</span>
              </div>
            </div>
          </div>

          {/* Pooja Samagri Items Checklist */}
          <div className="bg-white rounded-2xl p-4 border border-amber-200/80 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <h4 className="font-black text-xs sm:text-sm text-slate-900">
                  சாமக்கிரி பொருட்கள் பட்டியல் (Items to Arrange)
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[10.5px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 transition print:hidden cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy List"}</span>
              </button>
            </div>

            <div className="space-y-1.5 divide-y divide-slate-100 text-xs">
              {samagriList.map((item, idx) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`pt-1.5 flex items-center justify-between gap-2 cursor-pointer transition select-none ${
                    checkedItems[item.id] ? "opacity-50 line-through" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-md border border-slate-300 flex items-center justify-center shrink-0">
                      {checkedItems[item.id] && <Check className="w-3 h-3 text-emerald-700 stroke-[3]" />}
                    </span>
                    <span className="font-bold text-slate-800">{idx + 1}. {item.name}</span>
                  </div>
                  <span className="font-extrabold text-emerald-950 font-mono text-[11px] bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 shrink-0">
                    {item.qty}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 italic text-center pt-1 print:hidden">
              Tip: Click on items to mark them as purchased/arranged.
            </p>
          </div>

          {/* Dakshina & Dynamic UPI QR Section */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/60 rounded-2xl p-4 border border-amber-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1">
                  <IndianRupee className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Dakshina / கட்டண விபரம்</span>
                </h4>
                <p className="text-[10.5px] text-slate-500 font-semibold">
                  Status: {booking.paymentStatus === "PAID" ? "முழுதும் செலுத்தப்பட்டது ✅" : "நிலுவை உள்ளது"}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">Balance Due:</span>
                <span className="text-base sm:text-lg font-black text-rose-700">
                  ₹{(booking.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs py-2 bg-white/80 rounded-xl border border-amber-100">
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">Total Dakshina</span>
                <span className="font-black text-slate-900 block mt-0.5">
                  ₹{(booking.totalAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">Advance Paid</span>
                <span className="font-black text-emerald-700 block mt-0.5">
                  ₹{(booking.advanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-[9.5px] text-slate-400 block font-bold">Balance Due</span>
                <span className="font-black text-rose-700 block mt-0.5">
                  ₹{(booking.balanceAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* UPI QR Code for Instant Devotee Scan & Pay */}
            {qrDataUrl && (
              <div className="pt-2 flex items-center justify-between gap-3 border-t border-amber-100/80">
                <div className="space-y-1 max-w-[200px] sm:max-w-xs">
                  <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                    {balanceToPay > 0 ? "Scan & Pay Balance via UPI" : "Scan to Pay / Offer Dakshina via UPI"}
                  </span>
                  <p className="text-[11px] font-black text-slate-900 leading-tight">
                    {balanceToPay > 0
                      ? `Scan to pay ₹${balanceToPay.toLocaleString("en-IN")} directly via GPay / PhonePe / Paytm`
                      : "Scan to pay or offer dakshina directly via GPay / PhonePe / Paytm"}
                  </p>
                  <p className="text-[10px] font-mono text-slate-500 font-semibold">{paymentUpi}</p>
                </div>
                <div className="p-2 bg-white rounded-xl border-2 border-emerald-800/80 shadow-xs shrink-0">
                  <img src={qrDataUrl} alt="UPI QR Code" className="w-24 h-24 sm:w-28 sm:h-28 object-contain" />
                </div>
              </div>
            )}
          </div>

          {/* Sacred Footer Blessing */}
          <div className="text-center pt-2 text-[10.5px] text-slate-500 space-y-1 border-t border-dashed border-amber-200/80">
            <p className="font-extrabold text-emerald-950">
              🙏 லோகா: ஸமஸ்தா: ஸுகினோ பவந்து — நல்லதே நம் நோக்கம் 🙏
            </p>
            <p className="text-[9.5px] text-slate-400">
              Printed via Velvi App • {new Date().toLocaleDateString("en-IN")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
