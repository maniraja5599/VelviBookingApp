"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/store";
import { openCashfreeCheckout } from "@/lib/payments/cashfree-client";
import confetti from "canvas-confetti";
import {
  Check,
  Sparkles,
  Shield,
  CreditCard,
  Clock,
  ArrowRight,
  Lock,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Printer,
  ChevronDown,
  Layers,
  Crown,
} from "lucide-react";

export default function SubscriptionPage() {
  const router = useRouter();
  const { currentBusiness, currentUser, subscription, refreshSubscription } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Success Information & Modal State
  const [successInfo, setSuccessInfo] = useState<{
    orderId: string;
    amount: number;
    daysAdded: number;
    prevExpiry: string;
    newExpiry: string;
    planCycle: "MONTHLY" | "YEARLY";
  } | null>(null);

  // Sandbox simulation fallback modal when Cashfree live/sandbox keys are not set
  const [sandboxSession, setSandboxSession] = useState<{
    orderId: string;
    amount: number;
    planCycle: "MONTHLY" | "YEARLY";
    paymentSessionId: string;
  } | null>(null);

  const businessId =
    currentBusiness?.id ||
    (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "biz-default");

  // 1. Current Plan Expiry & Status
  const now = new Date();
  const currentEndDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : now;
  const isCurrentlyActive = subscription?.status === "ACTIVE" && currentEndDate.getTime() > now.getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((currentEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formattedCurrentExpiry = currentEndDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // 2. Projected New Expiry Date (Add to current plan if active, or from today if expired)
  const baseRenewalDate = isCurrentlyActive ? currentEndDate : now;

  const projectedMonthlyDate = new Date(baseRenewalDate.getTime() + 30 * 24 * 60 * 60 * 1000);
  const projectedYearlyDate = new Date(baseRenewalDate.getTime() + 365 * 24 * 60 * 60 * 1000);

  const formattedProjectedMonthly = projectedMonthlyDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const formattedProjectedYearly = projectedYearlyDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const selectedProjectedDate = selectedCycle === "MONTHLY" ? formattedProjectedMonthly : formattedProjectedYearly;
  const selectedDaysAdded = selectedCycle === "MONTHLY" ? 30 : 365;

  // Past payments from DB
  const [pastPayments, setPastPayments] = useState(
    db.payments.filter((p) => p.businessId === businessId)
  );

  useEffect(() => {
    setPastPayments(db.payments.filter((p) => p.businessId === businessId));
  }, [businessId, successInfo]);

  // Handle Cashfree Payment Initiation
  const handleInitiateCashfreePayment = async () => {
    if (!currentBusiness && !currentUser) {
      setErrorMessage("User or business profile is not loaded.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setProcessingStep("Connecting to Cashfree Payment Gateway...");

      // 1. Create order on backend
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          userId: currentUser?.id || "u-priest-01",
          planCycle: selectedCycle,
          customer: {
            name: currentBusiness?.name || currentUser?.name || "Velvi Vadhyar",
            email: currentUser?.email || "priest@velvi.app",
            phone: currentUser?.mobile || "9840012345",
          },
        }),
      });

      const orderData = await res.json();

      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || "Failed to create Cashfree order");
      }

      // 2. If Cashfree credentials are configured, launch real Cashfree Checkout Modal
      if (orderData.isConfigured && !orderData.isSimulated) {
        setProcessingStep("Opening Cashfree Checkout Modal...");
        try {
          await openCashfreeCheckout({
            paymentSessionId: orderData.paymentSessionId,
            mode: orderData.environment === "PRODUCTION" ? "production" : "sandbox",
          });
        } catch (sdkError: any) {
          console.warn("Cashfree Checkout window closed or redirected:", sdkError);
        }

        // 3. Verify order with backend
        setProcessingStep("Verifying payment with Cashfree servers...");
        await verifyOrder(orderData.orderId, selectedCycle);
      } else {
        // Fallback: Open Sandbox Checkout Simulation
        setIsProcessing(false);
        setSandboxSession({
          orderId: orderData.orderId,
          amount: orderData.orderAmount,
          planCycle: selectedCycle,
          paymentSessionId: orderData.paymentSessionId,
        });
      }
    } catch (err: any) {
      console.error("Cashfree checkout error:", err);
      setErrorMessage(err.message || "Something went wrong while connecting to Cashfree.");
      setIsProcessing(false);
    }
  };

  // Verify payment with backend
  const verifyOrder = async (orderId: string, planCycle: "MONTHLY" | "YEARLY") => {
    try {
      setIsProcessing(true);
      setProcessingStep("Confirming subscription extension with Cashfree...");

      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          businessId,
          userId: currentUser?.id || "u-priest-01",
          planCycle,
        }),
      });

      const verifyData = await res.json();

      if (!res.ok || !verifyData.verified) {
        throw new Error(
          verifyData.message || "Payment verification incomplete. Please contact support."
        );
      }

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ["#10b981", "#f59e0b", "#059669", "#d97706"],
        });
      } catch {}

      refreshSubscription();

      const newExpiry = verifyData.subscription?.currentPeriodEnd
        ? new Date(verifyData.subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : selectedProjectedDate;

      setSuccessInfo({
        orderId,
        amount: verifyData.amount || (planCycle === "MONTHLY" ? 499 : 4999),
        daysAdded: verifyData.daysAdded || (planCycle === "MONTHLY" ? 30 : 365),
        prevExpiry: formattedCurrentExpiry,
        newExpiry,
        planCycle,
      });

      setSandboxSession(null);
    } catch (err: any) {
      setErrorMessage(err.message || "Verification failed");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <div className="space-y-4 pb-24 sm:pb-28 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-1.5">
            <span>✨</span>
            <span>Velvi Pro Subscription (சந்தா &amp; கட்டணம்)</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Cashfree PG நேரடி கட்டண முறை • Instant Automatic Activation
          </p>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs animate-in shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-500 hover:text-rose-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUCCESS MODAL / CELEBRATION CARD (Enhanced Rich & Clean UI)              */}
      {/* ========================================================================= */}
      {successInfo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            {/* Header with Crown & Confetti Badge */}
            <div className="text-center space-y-1.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-emerald-600 to-amber-400 text-white flex items-center justify-center mx-auto shadow-md border-2 border-amber-300">
                <Crown className="w-7 h-7 text-amber-100" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                வேள்வி புரோ கட்டணம் செலுத்தப்பட்டது!
              </h3>
              <p className="text-xs text-emerald-800 font-bold">
                Cashfree PG Verified • Payment Successful
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-[#fbfdfc] p-3.5 rounded-2xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-100">
                <span className="text-slate-500">Plan:</span>
                <span className="font-black text-emerald-950 bg-emerald-100/80 px-2 py-0.5 rounded-md border border-emerald-300">
                  Velvi Pro ({successInfo.planCycle})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">செலுத்தப்பட்ட தொகை (Amount):</span>
                <span className="text-sm font-black text-slate-900">
                  ₹{successInfo.amount.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">கூடுதல் நாட்கள் (Days Added):</span>
                <span className="font-extrabold text-emerald-700">
                  +{successInfo.daysAdded} Days
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-emerald-100">
                <span className="text-slate-600 font-semibold">புதிய முடிவு தேதி (New Expiry):</span>
                <strong className="text-emerald-950 font-black text-xs sm:text-sm bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs">
                  {successInfo.newExpiry}
                </strong>
              </div>
              <div className="flex justify-between items-center pt-1 text-[10.5px]">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono text-slate-600 font-semibold">{successInfo.orderId}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setSuccessInfo(null);
                  router.push("/app");
                }}
                className="w-full py-3 bg-gradient-to-r from-emerald-800 via-emerald-900 to-emerald-950 hover:from-emerald-900 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>முகப்பு பக்கத்திற்குச் செல் (Go to Dashboard)</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-600" />
                  <span>ரசீது அச்சிடு</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSuccessInfo(null)}
                  className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  மூடு (Close)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. CURRENT PLAN HERO CARD (Clean & Rich Aesthetic)                        */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50/95 via-white to-amber-100/40 rounded-3xl p-4 sm:p-5 border border-amber-300/80 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-0.5 rounded-full text-xs font-black tracking-wide ${
                isCurrentlyActive
                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-amber-100 text-amber-900 border border-amber-300"
              }`}
            >
              {isCurrentlyActive ? "VELVI PRO ACTIVE ✅" : "FREE TRIAL"}
            </span>
          </div>

          <span className="text-xs font-bold text-amber-900 flex items-center gap-1 bg-white/90 px-2.5 py-1 rounded-full border border-amber-200 shadow-2xs">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            <span>{daysRemaining} days left</span>
          </span>
        </div>

        <div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
            Velvi Pro Membership
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {isCurrentlyActive ? (
              <>
                செல்லுபடியாகும் தேதி: <strong className="text-slate-900 font-extrabold">{formattedCurrentExpiry}</strong>
              </>
            ) : (
              "உங்கள் இலவச சோதனை அல்லது முந்தைய சந்தா காலம் முடிந்துவிட்டது."
            )}
          </p>
        </div>

        {/* Pro Feature Checklist */}
        <div className="space-y-1.5 pt-2.5 border-t border-amber-200/60 text-xs text-slate-700">
          {[
            "வரம்பற்ற பூஜை & ஹோம முன்பதிவுகள் (Unlimited Pooja Bookings)",
            "தமிழ் பஞ்சாங்கம் & முகூர்த்த காலண்டர் (Tamil Panchangam Calendar)",
            "Excel & CSV தரவு ஏற்றுமதி/இறக்குமதி (Excel Data Backup)",
            "உதவி வாத்தியார்கள் & தட்சணை கணக்கு (Team & Iyer Dakshina Settlements)",
            "ரசீது & WhatsApp நேரடி பகிர்வு (WhatsApp Pooja Slips & QR)",
            "மேகக்கணி ஒத்திசைவு (Real-time Cloud Sync & Safe Backup)",
          ].map((feature, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-200">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
              <span className="font-semibold text-slate-800 text-[11px] sm:text-xs">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHOOSE RENEWAL PLAN & DYNAMIC VALIDITY PROJECTION                       */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
            <span>📅</span>
            <span>சந்தா காலத்தைத் தேர்வு செய்க (Select Renewal Plan)</span>
          </h4>
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Cashfree PG
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Monthly Plan Card */}
          <button
            type="button"
            onClick={() => setSelectedCycle("MONTHLY")}
            className={`p-3.5 rounded-2xl border text-left transition active:scale-98 cursor-pointer relative ${
              selectedCycle === "MONTHLY"
                ? "bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-xs"
                : "bg-slate-50/60 hover:bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                மாதாந்திரம் (Monthly)
              </div>
              <span className="text-[9.5px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
                +30 நாட்கள்
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">₹499</div>
            <div className="text-[10.5px] text-slate-600 font-semibold mt-1">
              செல்லுபடியாகும்: <strong className="text-emerald-950 font-black">{formattedProjectedMonthly}</strong>
            </div>
            {selectedCycle === "MONTHLY" && (
              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-amber-700 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Annual Plan Card (Best Value) */}
          <button
            type="button"
            onClick={() => setSelectedCycle("YEARLY")}
            className={`p-3.5 rounded-2xl border text-left transition active:scale-98 cursor-pointer relative ${
              selectedCycle === "YEARLY"
                ? "bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                : "bg-slate-50/60 hover:bg-slate-50 border-slate-200 text-slate-700"
            }`}
          >
            <span className="absolute -top-2.5 right-2 bg-gradient-to-r from-emerald-700 to-emerald-900 text-amber-300 text-[9px] font-black px-2 py-0.5 rounded-full shadow-2xs border border-amber-300/40">
              Save ₹989 (17% OFF • 2 மாதங்கள் இலவசம்)
            </span>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                வருடாந்திரம் (Annual)
              </div>
              <span className="text-[9.5px] font-black text-emerald-900 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
                +365 நாட்கள்
              </span>
            </div>
            <div className="text-xl font-black text-slate-900 mt-1">₹4,999</div>
            <div className="text-[10.5px] text-emerald-900 font-semibold mt-1">
              செல்லுபடியாகும்: <strong className="text-emerald-950 font-black">{formattedProjectedYearly}</strong>
            </div>
            {selectedCycle === "YEARLY" && (
              <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-700 text-white flex items-center justify-center">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>

        {/* Dynamic Pre-Payment Validity Calculation Summary (Requested by User) */}
        <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/50 to-amber-50/70 rounded-2xl p-3.5 border border-emerald-300/80 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 font-semibold flex items-center gap-1.5">
              <span>📅</span> தற்போதைய சந்தா முடிவு:
            </span>
            <span className="font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
              {isCurrentlyActive ? formattedCurrentExpiry : "முடிந்துவிட்டது (Expired)"}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-emerald-200/60">
            <span className="text-emerald-950 font-black flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>புதிய செல்லுபடியாகும் தேதி (New Validity):</span>
            </span>
            <div className="text-right">
              <span className="font-black text-emerald-950 text-sm sm:text-base bg-white px-2.5 py-1 rounded-xl border border-emerald-400 shadow-xs">
                {selectedProjectedDate}
              </span>
              <span className="block text-[10px] font-extrabold text-emerald-700 mt-0.5">
                (+{selectedDaysAdded} நாட்கள் நீட்டிக்கப்படும்)
              </span>
            </div>
          </div>

          <div className="bg-emerald-100/60 p-2 rounded-xl text-[10.5px] font-semibold text-emerald-900 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>
              {isCurrentlyActive
                ? `உங்கள் நடப்பு சந்தா தேதியிலிருந்து (${formattedCurrentExpiry}) தொடர்ச்சியாக மேலும் ${selectedDaysAdded} நாட்கள் சேர்க்கப்படும். முன்கூட்டியே புதுப்பித்தாலும் ஒரு நாளும் வீணாகாது!`
                : `இன்றிலிருந்து அடுத்த ${selectedDaysAdded} நாட்களுக்கு வேள்வி புரோ முழுமையாகச் செயல்படும்.`}
            </span>
          </div>
        </div>

        {/* Real Cashfree CTA Button */}
        <button
          type="button"
          onClick={handleInitiateCashfreePayment}
          disabled={isProcessing}
          className="w-full py-3.5 bg-gradient-to-r from-amber-700 via-amber-800 to-amber-900 hover:from-amber-800 hover:to-amber-950 text-white rounded-2xl font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-60 cursor-pointer"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{processingStep || "Cashfree இணைக்கப்படுகிறது..."}</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4 text-amber-300" />
              <span>
                Pay ₹{selectedCycle === "MONTHLY" ? "499" : "4,999"} with Cashfree PG
              </span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
            </>
          )}
        </button>

        {/* Payment Methods Trust Badges */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-3 text-[10.5px] text-slate-500 flex-wrap">
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Lock className="w-3 h-3 text-emerald-700" /> 256-Bit SSL Secure
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <Smartphone className="w-3 h-3 text-blue-700" /> UPI / GPay / PhonePe / Paytm
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-slate-700">
            <CreditCard className="w-3 h-3 text-amber-700" /> Cards &amp; NetBanking
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. CASHFREE SANDBOX SIMULATION MODAL (When credentials are unconfigured)   */}
      {/* ========================================================================= */}
      {sandboxSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-amber-300 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-100 flex items-center justify-center text-amber-900 font-bold">
                  <Shield className="w-4 h-4 text-amber-800" />
                </div>
                <h4 className="font-extrabold text-sm text-slate-900">
                  Cashfree PG Checkout
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSandboxSession(null)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Plan:</span>
                <strong className="text-slate-900 font-bold">
                  Velvi Pro ({sandboxSession.planCycle})
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <strong className="text-slate-900 font-extrabold">₹{sandboxSession.amount}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID:</span>
                <span className="text-slate-600 font-mono text-[10px]">{sandboxSession.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mode:</span>
                <span className="text-amber-800 font-bold">Cashfree Test / Sandbox</span>
              </div>
            </div>

            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-950 space-y-1 leading-snug">
              <p className="font-bold flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>உண்மையான Cashfree API Keys இணைப்பு:</span>
              </p>
              <p className="text-slate-600 text-[10.5px]">
                Cashfree Merchant Dashboard-ல் உள்ள Production Keys-ஐ <code className="bg-white px-1 py-0.5 rounded border border-amber-200">.env.local</code>-ல் அமைத்ததும் நேரடி Payment Gateway இயங்கும்.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => verifyOrder(sandboxSession.orderId, sandboxSession.planCycle)}
                disabled={isProcessing}
                className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Complete Cashfree Payment (உடனடி உறுதி)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSandboxSession(null)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ரத்து செய்க (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. REAL CASHFREE SETUP GUIDE (Collapsible Accordion for Admin/Owner)        */}
      {/* ========================================================================= */}
      <div className="bg-[#fbfdfc] rounded-3xl p-4 sm:p-5 border border-emerald-200/90 shadow-xs space-y-2">
        <button
          type="button"
          onClick={() => setIsHelpOpen((prev) => !prev)}
          className="w-full flex items-center justify-between text-left cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <Info className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-emerald-900">
              நேரடி Cashfree PG கணக்கு அமைப்பது எப்படி? (Production Setup Guide)
            </h4>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isHelpOpen ? "rotate-180 text-emerald-700" : ""
            }`}
          />
        </button>

        {isHelpOpen && (
          <div className="pt-2 text-xs text-slate-600 space-y-2.5 animate-in fade-in leading-relaxed border-t border-emerald-100">
            <p>
              Cashfree நேரடி வணிகர் கணக்கைப் பயன்படுத்த, கீழே உள்ள 4 படிகளைப் பின்பற்றவும்:
            </p>
            <ol className="list-decimal pl-4 space-y-1.5 text-[11px] text-slate-700">
              <li>
                <strong>Cashfree Merchant கணக்கில் நுழைக:</strong>{" "}
                <a
                  href="https://merchant.cashfree.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 underline font-bold inline-flex items-center gap-0.5"
                >
                  merchant.cashfree.com <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>
                <strong>Payment Gateway &gt; Developers &gt; API Keys</strong> பகுதிக்குச் செல்லவும்.
              </li>
              <li>
                <strong>Production API Keys</strong>-ஐ உருவாக்கி, <code className="bg-slate-100 px-1 py-0.5 rounded border border-slate-200">.env.local</code> கோப்பில் சேர்க்கவும்:
                <pre className="bg-slate-900 text-amber-300 p-2.5 rounded-xl font-mono text-[10px] mt-1 overflow-x-auto">
{`CASHFREE_APP_ID="your_real_app_id"
CASHFREE_SECRET_KEY="your_real_secret_key"
CASHFREE_WEBHOOK_SECRET="your_real_webhook_secret"
CASHFREE_ENVIRONMENT="PRODUCTION"`}
                </pre>
              </li>
              <li>
                <strong>Webhook URL அமைத்தல்:</strong> Cashfree Webhook பிரிவில் உங்கள் சர்வர் முகவரியை சேர்க்கவும்:
                <code className="block bg-slate-100 p-1.5 rounded-lg border border-slate-200 font-mono text-[10px] mt-0.5 text-slate-800">
                  https://your-domain.com/api/cashfree/webhook
                </code>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. PAYMENT & INVOICE HISTORY TABLE                                        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wide">
          சந்தா கட்டண வரலாறு (Subscription Payment Invoices)
        </h4>

        {pastPayments.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            முந்தைய சந்தா கட்டணங்கள் எதுவும் இல்லை (No past subscription payments)
          </div>
        ) : (
          <div className="space-y-2">
            {pastPayments.map((p) => (
              <div
                key={p.id}
                className="p-3 bg-slate-50 hover:bg-amber-50/40 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {p.gateway || "CASHFREE"}
                    </span>
                    <strong className="text-xs font-black text-slate-900">
                      ₹{p.amount.toLocaleString("en-IN")}
                    </strong>
                    <span className="text-[10px] text-slate-500 font-medium">
                      ({p.billingCycle})
                    </span>
                  </div>
                  <div className="text-[10.5px] text-slate-500 mt-0.5 truncate">
                    Order ID: <span className="font-mono text-slate-700">{p.orderId}</span>
                  </div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>SUCCESS</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
