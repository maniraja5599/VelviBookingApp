"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import {
  ArrowLeft,
  Check,
  Building2,
  Upload,
  Phone,
  MapPin,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Info,
  Lock,
  MessageCircle,
  Plus,
  X,
  CreditCard,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function BrandingSettingsPage() {
  const router = useRouter();
  const { currentUser, currentBusiness, updateBusiness, updateUser, subscription, refreshSubscription } = useAuth();
  const business = currentBusiness || db.businesses[0];

  // Form states with business / user defaults
  const [name, setName] = useState(business.name || currentUser?.name || "");
  const [serviceName, setServiceName] = useState(business.serviceName || "Pooja • Homam • Seva");
  const [iyerName, setIyerName] = useState(business.iyerName || currentUser?.name || "");
  const [phone, setPhone] = useState(business.phone || currentUser?.mobile || "");
  const [hasSeparateWhatsapp, setHasSeparateWhatsapp] = useState(
    Boolean(business.whatsapp && business.whatsapp !== business.phone)
  );
  const [whatsapp, setWhatsapp] = useState(business.whatsapp || "");
  const [address, setAddress] = useState(business.address || "");
  const isInitialGoogleLogo = Boolean(
    business.logoUrl &&
      (business.logoUrl === currentUser?.avatarUrl ||
        business.logoUrl.includes("googleusercontent.com") ||
        business.logoUrl.includes("dicebear.com"))
  );
  const [logoUrl, setLogoUrl] = useState<string>(isInitialGoogleLogo ? "" : business.logoUrl || "");
  const [showWatermark, setShowWatermark] = useState(business.showWatermark ?? true);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [planActivatedSuccess, setPlanActivatedSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const handleOpenModal = () => setShowUpgradeModal(true);
    window.addEventListener("velvi-open-upgrade-modal", handleOpenModal);
    return () => window.removeEventListener("velvi-open-upgrade-modal", handleOpenModal);
  }, []);

  useEffect(() => {
    if (currentBusiness) {
      setName(currentBusiness.name || currentUser?.name || "");
      setServiceName(currentBusiness.serviceName || "Pooja • Homam • Seva");
      setIyerName(currentBusiness.iyerName || currentUser?.name || "");
      setPhone(currentBusiness.phone || currentUser?.mobile || "");
      setHasSeparateWhatsapp(
        Boolean(currentBusiness.whatsapp && currentBusiness.whatsapp !== currentBusiness.phone)
      );
      setWhatsapp(currentBusiness.whatsapp || "");
      setAddress(currentBusiness.address || "");
      const isGoogleLogo = Boolean(
        currentBusiness.logoUrl &&
          (currentBusiness.logoUrl === currentUser?.avatarUrl ||
            currentBusiness.logoUrl.includes("googleusercontent.com") ||
            currentBusiness.logoUrl.includes("dicebear.com"))
      );
      setLogoUrl(isGoogleLogo ? "" : currentBusiness.logoUrl || "");
      setShowWatermark(currentBusiness.showWatermark ?? true);
    }
  }, [currentBusiness, currentUser]);

  // Check if user has an active paid Velvi Pro plan (guarded by mounted for SSR safety)
  const isPlanActive =
    mounted &&
    subscription?.status === "ACTIVE" &&
    subscription?.planCode === "VELVI_PRO" &&
    new Date(subscription.currentPeriodEnd) > new Date();

  // Handle local image file upload (PNG/JPG up to 10MB)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert("Please choose an image under 10MB (10MB-க்குள் உள்ள படத்தைத் தேர்ந்தெடுக்கவும்).");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setLogoUrl(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetToDefaultLogo = () => {
    setLogoUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Watermark toggle logic:
  // "watermark remove pananum na plan pay pantra option kattu incase already plan active la iruntha remove panikalam"
  const handleWatermarkToggle = (checked: boolean) => {
    if (!checked) {
      // User is attempting to REMOVE the watermark
      if (isPlanActive) {
        setShowWatermark(false);
      } else {
        // Show Upgrade Plan / Payment Option
        setShowUpgradeModal(true);
      }
    } else {
      // Re-enabling watermark is always permitted
      setShowWatermark(true);
    }
  };

  // Upgrade to Velvi Pro via official subscription page
  const handleActivatePlanAndRemoveWatermark = () => {
    setShowUpgradeModal(false);
    router.push("/app/subscription");
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWhatsapp = hasSeparateWhatsapp && whatsapp.trim() ? whatsapp.trim() : phone.trim();

    const updates = {
      name: name.trim(),
      serviceName: serviceName.trim(),
      iyerName: iyerName.trim(),
      phone: phone.trim(),
      whatsapp: finalWhatsapp,
      address: address.trim(),
      logoUrl: logoUrl.trim(),
      showWatermark,
    };

    updateBusiness(updates);
    if (iyerName.trim()) {
      updateUser({ name: iyerName.trim() });
    }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Business Branding & Profile</h2>
          <p className="text-xs text-velvi-brown/60">Logo, business name, service title & live preview</p>
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span>Branding & Profile updated successfully!</span>
        </div>
      )}

      {planActivatedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-xl text-xs flex items-center gap-2 shadow-sm animate-fade-in">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Velvi Pro Activated!</span> Watermark has been removed from all your flyers and receipts.
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-3.5">
        {/* 1. LOGO MANAGEMENT SECTION */}
        <div className="bg-white p-4 rounded-3xl border border-velvi-gold/30 shadow-sacred space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brownDark flex items-center gap-1.5 uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5 text-velvi-gold" />
              Business Logo / Emblem
            </label>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                logoUrl
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-emerald-100 text-emerald-900 border border-emerald-300"
              }`}
            >
              {logoUrl ? "Custom Logo Active" : "Default Velvi Logo"}
            </span>
          </div>

          {/* Live Logo Preview Box */}
          <div className="bg-velvi-cream/60 rounded-2xl p-3.5 border border-velvi-gold/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <BrandLogo
                size="lg"
                variant="icon"
                customLogoUrl={logoUrl}
                businessName={name || "Velvi"}
              />
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-velvi-brownDark truncate">
                  {name || "Velvi App Default"}
                </h4>
                <p className="text-[11px] text-velvi-brown/60">
                  {logoUrl
                    ? "Custom logo will be used in Header, Flyers & Receipts (10MB Max)"
                    : "Using official sacred Velvi Deepam logo"}
                </p>
              </div>
            </div>

            {logoUrl && (
              <button
                type="button"
                onClick={handleResetToDefaultLogo}
                className="p-2 text-velvi-brown/60 hover:text-red-600 transition shrink-0"
                title="Reset to default logo"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Upload Controls */}
          <div className="space-y-2 pt-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="logo-file-input"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-2 px-3 bg-velvi-gold/15 hover:bg-velvi-gold/25 border border-velvi-gold/40 text-velvi-brownDark rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-velvi-brown" />
                Upload New Image (Up to 10MB)
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={handleResetToDefaultLogo}
                  className="py-2 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-bold transition"
                >
                  Use Default Logo
                </button>
              )}
            </div>

            <p className="text-[10px] text-velvi-brown/60 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
              JPEG, PNG, WebP allowed up to 10MB. If empty, Velvi sacred Deepam logo is used.
            </p>
          </div>
        </div>

        {/* 2. BUSINESS NAME (Default to Vadhyar/User Name) */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown block">
              Business Name
            </label>
            <span className="text-[10px] text-velvi-goldDark font-semibold">User Name by default</span>
          </div>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sri Venkateswara Vaidheeka Services"
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
          />
          <p className="text-[10px] text-velvi-brown/50">
            Defaults to your user/priest name. You can customize with your Mandapam or Trust name anytime.
          </p>
        </div>

        {/* 3. SERVICE NAME (Default to 'Pooja • Homam • Seva') */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown block">
              Service Name / Subtitle
            </label>
            <span className="text-[10px] text-velvi-goldDark font-semibold">Default: Pooja • Homam • Seva</span>
          </div>
          <input
            type="text"
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            placeholder="e.g. Pooja • Homam • Seva"
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
          />
          <p className="text-[10px] text-velvi-brown/50">
            This subtitle appears right beneath your business name on receipts and devotee booking flyers.
          </p>
        </div>

        {/* 4. VADHYAR / IYER NAME */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown block">
              Vadhyar / Purohit Name
            </label>
            <span className="text-[10px] text-velvi-brown/50">Optional</span>
          </div>
          <input
            type="text"
            value={iyerName}
            onChange={(e) => setIyerName(e.target.value)}
            placeholder="e.g. Ravi Iyer"
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
          />
        </div>

        {/* 4. CONTACTS: SINGLE MOBILE NUMBER WITH OPTIONAL WHATSAPP */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2">
          <div>
            <label className="text-xs font-bold text-velvi-brown block">
              Primary Mobile Number *
            </label>
            <div className="mt-1 relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
              />
            </div>
            <p className="text-[10px] text-velvi-brown/50 mt-1">
              Used for devotee calls and WhatsApp confirmations.
            </p>
          </div>

          {/* Optional separate WhatsApp toggle */}
          <div className="pt-1 border-t border-velvi-creamDark/60">
            {!hasSeparateWhatsapp ? (
              <button
                type="button"
                onClick={() => setHasSeparateWhatsapp(true)}
                className="text-xs font-semibold text-velvi-goldDark hover:text-velvi-brown flex items-center gap-1.5 transition py-1"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span>Add different WhatsApp number (if not same as mobile)</span>
              </button>
            ) : (
              <div className="space-y-1 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-velvi-brown flex items-center gap-1">
                    <MessageCircle className="w-3 h-3 text-emerald-600" />
                    Separate WhatsApp Number
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setHasSeparateWhatsapp(false);
                      setWhatsapp("");
                    }}
                    className="text-[10px] font-bold text-red-600 hover:underline"
                  >
                    Remove (Use Mobile)
                  </button>
                </div>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+91 98765 43211"
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. OFFICE / TEMPLE ADDRESS (Default empty) */}
        <div className="bg-white p-3.5 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-velvi-brown block">
              Office / Temple Address
            </label>
            <span className="text-[10px] text-velvi-brown/50">Optional</span>
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. Sannathi Street, Namakkal (Optional)"
            className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold placeholder:text-velvi-brown/35"
          />
        </div>

        {/* 6. WATERMARK REMOVAL (PRO PLAN INTEGRATION) */}
        <div className="bg-white p-4 rounded-3xl border border-velvi-gold/30 shadow-sm space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs text-velvi-brownDark">
                "Powered by Velvi" Watermark
              </h4>
              {isPlanActive ? (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" /> PRO ACTIVE
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-700" /> PRO FEATURE
                </span>
              )}
            </div>

            <input
              type="checkbox"
              id="watermark-checkbox"
              checked={showWatermark}
              onChange={(e) => handleWatermarkToggle(e.target.checked)}
              className="w-4 h-4 accent-velvi-brown rounded cursor-pointer"
            />
          </div>

          <p className="text-[11px] text-velvi-brown/70 leading-relaxed">
            Show subtle small footer on WhatsApp flyers & confirmations.
          </p>

          <div className="pt-2 border-t border-velvi-creamDark/60 flex items-center justify-between text-xs">
            {isPlanActive ? (
              <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Active Pro Plan: You can toggle watermark on/off anytime.
              </span>
            ) : (
              <div className="flex items-center justify-between w-full">
                <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                  <Lock className="w-3 h-3 text-amber-600 shrink-0" />
                  Watermark removal requires Velvi Pro.
                </span>
                <button
                  type="button"
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-2.5 py-1 bg-velvi-gold hover:bg-velvi-goldLight text-velvi-brownDark rounded-lg font-bold text-[10px] shadow-2xs transition"
                >
                  Pay & Remove →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 7. HELPFUL PRIEST TIPS */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Helpful Branding Tips</span>
          </div>
          <div className="space-y-1.5 text-[11px] text-amber-900/85 leading-relaxed">
            <p className="flex items-start gap-1.5">
              <span className="shrink-0">💡</span>
              <span><strong>Business &amp; Service Name:</strong> Your business name and service title will appear prominently on receipts and WhatsApp reminders.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="shrink-0">💡</span>
              <span><strong>High Quality Logo:</strong> Upload your temple tower, deity image, or custom emblem up to 10MB.</span>
            </p>
            <p className="flex items-start gap-1.5">
              <span className="shrink-0">💡</span>
              <span><strong>Velvi Watermark:</strong> Velvi Pro subscribers enjoy 100% white-label branding with no watermark.</span>
            </p>
          </div>
        </div>

        {/* 8. LIVE SAMPLE PREVIEW CARD */}
        <div className="bg-gradient-to-b from-[#FFFDF8] to-[#FFF8EC] border-2 border-velvi-gold/40 rounded-3xl p-4 shadow-sacred space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-velvi-goldDark flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-velvi-gold" /> Live Sample Preview
            </span>
            <span className="text-[10px] bg-velvi-gold/20 text-velvi-brownDark px-2 py-0.5 rounded-full font-bold">
              Devotee View Preview
            </span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-velvi-gold/30 shadow-xs space-y-3">
            {/* Header: Logo + Business Name + Service Name */}
            <div className="flex items-center gap-3">
              <BrandLogo
                size="md"
                variant="icon"
                customLogoUrl={logoUrl}
                businessName={name || currentUser?.name || "Vedic Purohit"}
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-extrabold text-sm text-velvi-brownDark truncate leading-tight">
                  {name || currentUser?.name || "Sri Venkateswara Vaidheeka Services"}
                </h3>
                <p className="text-[11px] font-bold text-velvi-goldDark truncate">
                  {serviceName || "Pooja • Homam • Seva"}
                </p>
                {iyerName && (
                  <p className="text-[10px] text-velvi-brown/60 truncate">
                    Purohit: {iyerName}
                  </p>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="h-[1px] bg-gradient-to-r from-transparent via-velvi-gold/30 to-transparent" />

            {/* Contacts & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-velvi-brown/80">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                <span className="font-semibold">{phone || "+91 98765 43210"}</span>
                {hasSeparateWhatsapp && whatsapp && (
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">
                    WA: {whatsapp}
                  </span>
                )}
              </div>
              {address && (
                <div className="flex items-center gap-1.5 text-velvi-brown/70">
                  <MapPin className="w-3.5 h-3.5 text-velvi-gold shrink-0" />
                  <span className="truncate">{address}</span>
                </div>
              )}
            </div>

            {/* Live Watermark Display */}
            <div className="pt-2 border-t border-velvi-creamDark/60 flex items-center justify-between text-[10px]">
              {showWatermark ? (
                <div className="flex items-center gap-1.5 text-velvi-brown/60 bg-velvi-cream/60 px-2.5 py-1 rounded-lg w-full justify-center font-medium">
                  <span>⚡ Powered by</span>
                  <span className="font-black text-velvi-brownDark tracking-wider">VELVI</span>
                  <span className="text-[9px] text-velvi-brown/50">• www.velvi.app</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg w-full justify-center font-bold">
                  <span>✨ 100% Custom Branding (No Velvi Watermark)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          type="submit"
          className="w-full py-3.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sacred active:scale-[0.99] transition mt-2"
        >
          Save Branding & Profile
        </button>
      </form>

      {/* WATERMARK REMOVAL & PLAN PAYMENT MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-velvi-gold/30 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-velvi-brownDark">
                    Unlock Watermark Removal
                  </h3>
                  <span className="text-[10px] font-bold text-velvi-goldDark uppercase tracking-wider">
                    Velvi Pro Exclusive
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 rounded-full text-velvi-brown/50 hover:bg-velvi-cream"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream p-3.5 rounded-2xl border border-velvi-gold/30 space-y-2 text-xs text-velvi-brown/80">
              <p className="font-semibold text-velvi-brownDark text-xs">
                Send 100% white-labeled flyers and booking confirmations to devotees:
              </p>
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Removes <strong>"Powered by Velvi"</strong> footer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Devotees only see your name & mobile</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Clean unbranded WhatsApp confirmations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Priority Cloud Backup & Excel export</span>
                </div>
              </div>
            </div>

            {/* Price Card */}
            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-velvi-brownDark block">Velvi Pro Plan</span>
                <span className="text-[10px] text-velvi-brown/60">30 days validity • Cancel anytime</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-velvi-brownDark">₹499</span>
                <span className="text-[10px] text-velvi-brown/60"> / mo</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleActivatePlanAndRemoveWatermark}
                disabled={isProcessingPayment}
                className="w-full py-3 bg-gradient-to-r from-velvi-brown to-velvi-brownLight hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-sacred flex items-center justify-center gap-2 transition disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4 text-velvi-goldLight" />
                {isProcessingPayment ? "Processing UPI Payment..." : "Pay ₹499 & Remove Watermark"}
              </button>

              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="w-full py-2 text-velvi-brown/60 hover:text-velvi-brown font-semibold text-xs transition"
              >
                Keep Free Trial (Keep Watermark)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
