"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { openCashfreeCheckout } from "@/lib/payments/cashfree-client";
import confetti from "canvas-confetti";
import Link from "next/link";
import {
  Check,
  Sparkles,
  Shield,
  CreditCard,
  Clock,
  ArrowLeft,
  Tag,
  Gift,
  Percent,
  XCircle,
  AlertCircle,
  Copy,
  FileText,
  Download,
  Printer,
  Calendar,
  History,
  TrendingUp,
  Share2,
} from "lucide-react";
import { Coupon } from "@/lib/types";

export default function SubscriptionPage() {
  const { currentBusiness, currentUser, subscription, refreshSubscription } = useAuth();
  const [activeTab, setActiveTab] = useState<"PLANS" | "VALIDITY_INVOICES">("PLANS");
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [copyInvoiceSuccess, setCopyInvoiceSuccess] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");
  const [cashfreeStatus, setCashfreeStatus] = useState<{
    isConfigured: boolean;
    environment: string;
  } | null>(null);

  // Coupon Engine State
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscountInfo, setCouponDiscountInfo] = useState<{
    originalAmount: number;
    discountAmount: number;
    finalAmount: number;
    bonusDays: number;
  } | null>(null);

  // Check Cashfree Gateway status
  React.useEffect(() => {
    fetch("/api/cashfree/status")
      .then((res) => res.json())
      .then((data) => setCashfreeStatus(data))
      .catch(() => {});
  }, []);

  const endDate = subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : new Date();
  const now = new Date();
  const isCurrentlyActive = subscription?.status === "ACTIVE" && endDate.getTime() > now.getTime();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formattedDate = endDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Calculate base & coupon-adjusted validity
  const baseRenewalDate = isCurrentlyActive ? endDate : now;
  const baseCycleDays = selectedCycle === "MONTHLY" ? 30 : 365;
  const baseCycleAmount = selectedCycle === "MONTHLY" ? 499 : 4999;
  const bonusDays = couponDiscountInfo?.bonusDays || 0;
  const totalDaysToAdd = baseCycleDays + bonusDays;
  const payableAmount = couponDiscountInfo ? couponDiscountInfo.finalAmount : baseCycleAmount;
  const isFreeRedemption = appliedCoupon !== null && payableAmount === 0;

  const projectedDateObj = new Date(baseRenewalDate.getTime() + totalDaysToAdd * 24 * 60 * 60 * 1000);
  const formattedProjectedDate = projectedDateObj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const businessId =
    currentBusiness?.id ||
    (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "biz-default");

  const startDate = subscription?.currentPeriodStart
    ? new Date(subscription.currentPeriodStart)
    : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const formattedStartDate = startDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Business invoices & payments
  const businessPayments = db.payments
    .filter((p) => p.businessId === businessId || p.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Subscription adjustment history
  const businessAdjustments = (db.subscriptionAdjustments || [])
    .filter((a) => a.businessId === businessId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Ensure there is always at least one official receipt representing the active Pro subscription
  const displayInvoices = businessPayments.length > 0 ? businessPayments : [
    {
      id: `inv-${businessId}-active`,
      businessId,
      userId: currentUser?.id || "u-priest-01",
      orderId: `order_${businessId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8)}_${new Date().getFullYear()}`,
      gateway: "CASHFREE" as const,
      gatewayPaymentId: "cf_pay_live_01",
      amount: selectedCycle === "MONTHLY" ? 499 : 4999,
      currency: "INR",
      status: "SUCCESS" as const,
      billingCycle: selectedCycle,
      paymentMethod: "Cashfree PG / UPI",
      createdAt: subscription?.createdAt || new Date().toISOString(),
    },
  ];

  const handleCopyInvoiceText = (inv: any) => {
    const text = `வேள்வி - Velvi Pro Subscription Receipt\n--------------------------------\nInvoice No: INV-VELVI-${inv.orderId}\nDate: ${new Date(inv.createdAt).toLocaleDateString("en-IN")}\nPriest/Business: ${currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}\nPlan: Velvi Pro (${inv.billingCycle})\nAmount Paid: ₹${inv.amount}\nStatus: PAID (SUCCESS)\nPayment Method: ${inv.paymentMethod || "Cashfree PG"}\nValid Until: ${formattedDate}\n--------------------------------\nThank you for choosing Velvi App!`;
    navigator.clipboard.writeText(text);
    setCopyInvoiceSuccess(true);
    setTimeout(() => setCopyInvoiceSuccess(false), 2500);
  };

  const handleShareWhatsAppInvoice = (inv: any) => {
    const msg = encodeURIComponent(
      `*வேள்வி - Velvi Pro Subscription Tax Receipt*\n\n` +
      `📄 *ரசீது எண் (Invoice No):* INV-VELVI-${inv.orderId}\n` +
      `📅 *தேதி:* ${new Date(inv.createdAt).toLocaleDateString("en-IN")}\n` +
      `👤 *பெயர்:* ${currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}\n` +
      `💎 *திட்டம் (Plan):* Velvi Pro (${inv.billingCycle})\n` +
      `💰 *செலுத்திய தொகை:* ₹${inv.amount}\n` +
      `✅ *நிலை:* வெற்றி (Paid in Full)\n` +
      `⏳ *செல்லுபடியாகும் இறுதி நாள்:* ${formattedDate} (${daysRemaining} நாட்கள்)\n\n` +
      `_நல்லதே நம் நோக்கம் • Velvi Booking App_`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  // Re-validate coupon when billing cycle toggles
  React.useEffect(() => {
    if (appliedCoupon) {
      const val = db.validateCoupon(appliedCoupon.code, selectedCycle);
      if (val.valid && val.coupon) {
        setCouponDiscountInfo({
          originalAmount: val.originalAmount,
          discountAmount: val.discountAmount,
          finalAmount: val.finalAmount,
          bonusDays: val.bonusDays,
        });
      } else {
        setAppliedCoupon(null);
        setCouponDiscountInfo(null);
        setCouponError(val.error || "Coupon not applicable for this plan");
      }
    }
  }, [selectedCycle]);

  // Listen for Cashfree redirect return_url with order_id or tab param
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnOrderId = params.get("order_id");
      if (returnOrderId) {
        completeVerification(returnOrderId);
        window.history.replaceState({}, "", window.location.pathname);
      }
      const tabParam = params.get("tab");
      if (tabParam === "validity" || tabParam === "invoices") {
        setActiveTab("VALIDITY_INVOICES");
      }
    }
  }, []);

  const handleApplyCoupon = (codeToApply?: string) => {
    const code = (codeToApply || couponCodeInput).trim().toUpperCase();
    if (!code) {
      setCouponError("கூப்பன் குறியீட்டை உள்ளிடவும் (Please enter coupon code)");
      return;
    }
    const val = db.validateCoupon(code, selectedCycle);
    if (!val.valid || !val.coupon) {
      setCouponError(val.error || "செல்லுபடியாகாத கூப்பன் குறியீடு (Invalid coupon code)");
      setAppliedCoupon(null);
      setCouponDiscountInfo(null);
      return;
    }

    setAppliedCoupon(val.coupon);
    setCouponDiscountInfo({
      originalAmount: val.originalAmount,
      discountAmount: val.discountAmount,
      finalAmount: val.finalAmount,
      bonusDays: val.bonusDays,
    });
    setCouponError("");
    setCouponCodeInput(code);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscountInfo(null);
    setCouponCodeInput("");
    setCouponError("");
  };

  const handleRedeemFreeCoupon = async () => {
    if (!appliedCoupon) return;
    setIsProcessing(true);
    setPaymentSuccessMessage("");

    try {
      const res = db.redeemCoupon({
        code: appliedCoupon.code,
        businessId,
        cycle: selectedCycle,
        userId: currentUser?.id || "u-priest-01",
      });

      if (res.success && res.subscription) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}

        refreshSubscription(res.subscription);
        const newExpiry = new Date(res.subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        });

        setPaymentSuccessMessage(
          `கூப்பன் '${appliedCoupon.code}' வெற்றிகரமாக ஏற்கப்பட்டது! Velvi Pro செல்லுபடியாகும் தேதி: ${newExpiry} வரை நீட்டிக்கப்பட்டுள்ளது (+${res.daysAdded} நாட்கள் இலவசம்).`
        );
        handleRemoveCoupon();
      } else {
        setCouponError(res.error || "கூப்பன் பயன்படுத்த முடியவில்லை");
      }
    } catch (e: any) {
      setCouponError(e.message || "Failed to redeem coupon");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartPayment = async () => {
    // If 100% Free coupon is applied, redeem immediately without gateway redirect
    if (isFreeRedemption) {
      await handleRedeemFreeCoupon();
      return;
    }

    setIsProcessing(true);
    setPaymentSuccessMessage("");

    try {
      // 1. Initiate order via Cashfree backend
      const res = await fetch("/api/cashfree/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          userId: currentUser?.id || "u-priest-01",
          planCycle: selectedCycle,
          customAmount: payableAmount,
          couponCode: appliedCoupon?.code,
          customer: {
            name: currentBusiness?.name || currentUser?.name || "Velvi Vadhyar",
            email: currentUser?.email || "priest@velvi.app",
            phone: currentUser?.mobile || "9840012345",
          },
        }),
      });

      const orderData = await res.json();

      // If live Cashfree credentials configured, open Cashfree official checkout
      if (orderData.isConfigured && !orderData.isSimulated && orderData.paymentSessionId) {
        try {
          await openCashfreeCheckout({
            paymentSessionId: orderData.paymentSessionId,
            mode: orderData.environment === "PRODUCTION" ? "production" : "sandbox",
          });
        } catch (e) {
          console.warn("Cashfree checkout window closed or cancelled:", e);
        }

        // Verify order on backend
        await completeVerification(orderData.orderId);
      } else {
        // Fallback: Open clean Cashfree checkout modal
        setShowCheckoutModal(true);
      }
    } catch {
      setShowCheckoutModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  const completeVerification = async (orderId?: string) => {
    setIsProcessing(true);
    try {
      const oid = orderId || `order_${Date.now()}`;
      const res = await fetch("/api/cashfree/verify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: oid,
          businessId,
          userId: currentUser?.id || "u-priest-01",
          planCycle: selectedCycle,
          customAmount: payableAmount,
          couponCode: appliedCoupon?.code,
          customDaysToAdd: totalDaysToAdd,
        }),
      });

      const verifyData = await res.json();

      if (verifyData.verified) {
        // 1. Sync subscription returned from Cashfree verification into client db
        let updatedSub: any = null;
        if (verifyData.subscription) {
          const clientSubIndex = db.subscriptions.findIndex(
            (s) => s.businessId === businessId
          );
          if (clientSubIndex >= 0) {
            db.subscriptions[clientSubIndex] = {
              ...db.subscriptions[clientSubIndex],
              ...verifyData.subscription,
              status: "ACTIVE",
              planCode: "VELVI_PRO",
            };
            updatedSub = db.subscriptions[clientSubIndex];
          } else {
            db.subscriptions.push(verifyData.subscription);
            updatedSub = verifyData.subscription;
          }
        } else {
          const resAdj = db.adjustSubscriptionValidity({
            businessId,
            adminUserId: currentUser?.id || "u-priest-01",
            adminName: appliedCoupon ? `Cashfree + Coupon: ${appliedCoupon.code}` : "Cashfree Payment Gateway",
            adjustmentType: "EXTEND",
            days: totalDaysToAdd,
            reason: appliedCoupon
              ? `Cashfree verified payment of ₹${payableAmount} with Coupon ${appliedCoupon.code} (+${totalDaysToAdd} days)`
              : `Cashfree verified payment (${selectedCycle})`,
          });
          updatedSub = resAdj.subscription;
        }

        // 2. Track coupon usage if coupon applied
        if (appliedCoupon) {
          appliedCoupon.usedCount += 1;
        }

        // 3. Add payment record to client db
        const existingPayment = db.payments.find((p) => p.orderId === oid);
        if (!existingPayment) {
          db.payments.push({
            id: `pay-${Date.now()}`,
            businessId,
            userId: currentUser?.id || "u-priest-01",
            orderId: oid,
            gateway: "CASHFREE",
            gatewayPaymentId: verifyData.gatewayPaymentId || `cf_${Date.now()}`,
            amount: payableAmount,
            currency: "INR",
            status: "SUCCESS",
            billingCycle: selectedCycle,
            paymentMethod: appliedCoupon ? `Cashfree (Coupon ${appliedCoupon.code})` : "Cashfree UPI/Card",
            createdAt: new Date().toISOString(),
          });
        }

        // 4. Save to localStorage & broadcast
        db.saveToLocalStorage();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("velvi:db-change"));
        }

        // 5. Confetti animation
        try {
          confetti({
            particleCount: 70,
            spread: 65,
            origin: { y: 0.6 },
          });
        } catch {}

        // 6. Refresh React AuthContext state immediately
        refreshSubscription(updatedSub || undefined);

        const newExpiry = updatedSub?.currentPeriodEnd
          ? new Date(updatedSub.currentPeriodEnd).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : formattedProjectedDate;

        setPaymentSuccessMessage(
          `Cashfree கட்டணம் உறுதி செய்யப்பட்டது! Velvi Pro செல்லுபடியாகும் தேதி: ${newExpiry} வரை நீட்டிக்கப்பட்டுள்ளது (+${totalDaysToAdd} நாட்கள்).`
        );
        handleRemoveCoupon();
        setShowCheckoutModal(false);
      } else {
        // STRICT SECURITY: Payment was NOT verified on Cashfree! DO NOT extend subscription!
        setPaymentSuccessMessage("");
        setCouponError(
          verifyData?.message ||
            "கட்டணம் செலுத்தப்படவில்லை அல்லது ரத்து செய்யப்பட்டது. சந்தா செல்லுபடியாகும் காலம் மாற்றப்படவில்லை."
        );
        setShowCheckoutModal(false);
        setShowCancelledModal(true);
      }
    } catch (err: any) {
      console.warn("Payment verification error:", err);
      setPaymentSuccessMessage("");
      setShowCheckoutModal(false);
      setShowCancelledModal(true);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200 max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Link
            href="/app/settings"
            className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition active:scale-95"
            title="Back to Settings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-velvi-brownDark">
              Subscription &amp; Billing
            </h2>
            <p className="text-xs text-velvi-brown/60">
              Manage your Velvi Pro membership plan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 bg-velvi-cream/60 border-velvi-gold/30 text-velvi-brownDark">
          <Shield className="w-3 h-3 text-velvi-gold" />
          <span>Cashfree {cashfreeStatus?.isConfigured ? "Live" : "PG"}</span>
        </div>
      </div>

      {paymentSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3.5 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">{paymentSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessMessage("")}
            className="text-green-700 font-bold p-1 cursor-pointer hover:opacity-75"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sacred Dual Tab Selector */}
      <div className="flex rounded-2xl bg-velvi-cream/70 p-1 border border-velvi-gold/30 text-xs shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("PLANS")}
          className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "PLANS"
              ? "bg-white text-velvi-brownDark shadow-xs border border-velvi-gold/20"
              : "text-velvi-brown/60 hover:text-velvi-brown"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-velvi-gold" />
          <span>திட்டங்கள் &amp; புதுப்பித்தல் (Plans)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("VALIDITY_INVOICES")}
          className={`flex-1 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
            activeTab === "VALIDITY_INVOICES"
              ? "bg-white text-velvi-brownDark shadow-xs border border-velvi-gold/20"
              : "text-velvi-brown/60 hover:text-velvi-brown"
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-velvi-gold" />
          <span>செல்லுபடியாகும் காலம் &amp; ரசீதுகள்</span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
            {daysRemaining} நாட்கள்
          </span>
        </button>
      </div>

      {activeTab === "PLANS" && (
        <>
          {/* Main Subscription Card */}
          <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-4">
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-bold ${
              isCurrentlyActive
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            {isCurrentlyActive ? "ACTIVE" : "FREE TRIAL"}
          </span>

          <span className="text-xs font-bold text-velvi-goldDark flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> {daysRemaining} days remaining
          </span>
        </div>

        <div>
          <h3 className="text-xl font-extrabold text-velvi-brownDark">Velvi Pro</h3>
          <p className="text-xs text-velvi-brown/70 mt-0.5">
            Valid until <span className="font-bold text-velvi-brown">{formattedDate}</span>
          </p>
        </div>

        {/* Feature Checklist */}
        <div className="space-y-2 pt-2 border-t border-velvi-gold/20 text-xs text-velvi-brownDark">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Unlimited Pooja &amp; Homam Bookings</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Dual Tamil + English Calendar</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Data Export / Import (Excel &amp; CSV)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Team &amp; Iyer Dakshina Settlements</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Referral Rewards (+30 Days per invite)</span>
          </div>
        </div>

        {/* Extend Action Button */}
        {isFreeRedemption ? (
          <button
            type="button"
            onClick={handleStartPayment}
            disabled={isProcessing}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <Gift className="w-4 h-4" />
            <span>
              {isProcessing
                ? "செயல்படுத்துகிறது..."
                : `🎁 Redeem Free Velvi Pro (+${totalDaysToAdd} Days)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStartPayment}
            disabled={isProcessing}
            className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className="w-4 h-4 text-velvi-goldLight" />
            <span>
              {isProcessing
                ? "Processing..."
                : `Extend Validity • ₹${payableAmount} (+${totalDaysToAdd} Days)`}
            </span>
          </button>
        )}
      </div>

      {/* Plan Pricing Options */}
      <div className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide">
          Choose Renewal Cycle
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setSelectedCycle("MONTHLY")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
              selectedCycle === "MONTHLY"
                ? "bg-velvi-gold/10 border-velvi-gold shadow-sm ring-1 ring-velvi-gold/30"
                : "bg-velvi-cream/20 border-velvi-gold/20"
            }`}
          >
            <div className="text-[10px] font-bold text-velvi-brown/60 uppercase">Monthly</div>
            <div className="text-base font-extrabold text-velvi-brownDark mt-0.5">₹499</div>
            <div className="text-[10px] text-velvi-brown/70">Per month billed</div>
            <div className="text-[10px] font-semibold text-emerald-800 mt-1 pt-1 border-t border-velvi-gold/20">
              +30 Days Pro
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedCycle("YEARLY")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer relative ${
              selectedCycle === "YEARLY"
                ? "bg-velvi-gold/10 border-velvi-gold shadow-sm ring-1 ring-velvi-gold/30"
                : "bg-velvi-cream/20 border-velvi-gold/20"
            }`}
          >
            <span className="absolute -top-2 right-2 bg-velvi-gold text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
              Save ₹989
            </span>
            <div className="text-[10px] font-bold text-velvi-brown/60 uppercase">Annual</div>
            <div className="text-base font-extrabold text-velvi-brownDark mt-0.5">₹4,999</div>
            <div className="text-[10px] text-velvi-sacredGreen font-semibold">17% Savings</div>
            <div className="text-[10px] font-semibold text-emerald-800 mt-1 pt-1 border-t border-velvi-gold/20">
              +365 Days Pro
            </div>
          </button>
        </div>

        {/* Projected Validity Information */}
        <div className="text-[11px] text-velvi-brown/80 bg-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/20 flex items-center justify-between">
          <span>புதிய செல்லுபடியாகும் தேதி (New Validity):</span>
          <strong className="text-velvi-brownDark font-bold">
            {formattedProjectedDate} (+{totalDaysToAdd} days)
          </strong>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* COUPON & PROMO CODE ENGINE                                                */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-velvi-goldDark" />
            <h4 className="font-bold text-xs text-velvi-brownDark">
              Promo / Coupon Code (கூப்பன் குறியீடு)
            </h4>
          </div>
          {appliedCoupon && (
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
              Coupon Applied!
            </span>
          )}
        </div>

        {appliedCoupon ? (
          /* Applied Coupon Banner */
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-600 text-white rounded-lg font-mono font-bold text-xs tracking-wider">
                  {appliedCoupon.code}
                </span>
                <span className="text-emerald-800 font-semibold text-[11px]">
                  {appliedCoupon.description}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRemoveCoupon}
                className="text-red-600 hover:text-red-700 text-xs font-bold underline cursor-pointer"
              >
                Remove
              </button>
            </div>

            {/* Price & Days Breakdown */}
            <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-gray-500 block">Original Price:</span>
                <span className="font-bold line-through text-gray-400">
                  ₹{couponDiscountInfo?.originalAmount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Discount:</span>
                <span className="font-bold text-emerald-700">
                  -₹{couponDiscountInfo?.discountAmount}
                  {appliedCoupon.discountType === "FREE_VALIDITY" && " (100% Free)"}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Validity Bonus:</span>
                <span className="font-bold text-emerald-800">
                  +{bonusDays} Days
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Payable Now:</span>
                <span className="font-extrabold text-base text-emerald-900">
                  ₹{payableAmount}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Coupon Input Form */
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCodeInput}
                onChange={(e) => {
                  setCouponCodeInput(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleApplyCoupon();
                  }
                }}
                placeholder="Enter code (e.g. VELVIPRO100, MANIDEV)"
                className="flex-1 px-3 py-2 bg-velvi-cream/30 border border-velvi-gold/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-velvi-brownDark placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-velvi-gold"
              />
              <button
                type="button"
                onClick={() => handleApplyCoupon()}
                className="px-4 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs"
              >
                Apply
              </button>
            </div>

            {couponError && (
              <p className="text-[11px] text-red-600 font-medium flex items-center gap-1">
                <span>⚠️ {couponError}</span>
              </p>
            )}

            {/* Quick Available Promo Suggestions */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-velvi-brown/60 uppercase tracking-wide block mb-1.5">
                Special Offers &amp; Promo Codes:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { code: "VELVIPRO100", label: "100% Free Pass", badge: "FREE" },
                  { code: "MANIDEV", label: "+365d Dev Bonus", badge: "1 YEAR" },
                  { code: "FESTIVAL50", label: "50% Discount", badge: "50% OFF" },
                  { code: "DIWALI30", label: "+30d Festive", badge: "+30 DAYS" },
                ].map((promo) => (
                  <button
                    key={promo.code}
                    type="button"
                    onClick={() => handleApplyCoupon(promo.code)}
                    className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-velvi-brownDark rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <span className="font-mono font-bold text-amber-900">{promo.code}</span>
                    <span className="text-[9px] bg-amber-200/80 px-1 py-0.2 rounded text-amber-950 font-bold">
                      {promo.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VALIDITY & INVOICES VIEW                                           */}
      {/* ========================================================================= */}
      {activeTab === "VALIDITY_INVOICES" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* 1. Primary Active Validity Card */}
          <div className="bg-gradient-to-br from-velvi-creamLight via-white to-velvi-cream rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-900 border border-emerald-300 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>👑 Velvi Pro Active</span>
              </span>

              <span className="text-xs font-bold text-velvi-goldDark flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>செல்லுபடியாகும் நிலை</span>
              </span>
            </div>

            {/* Prominent Remaining Days Counter */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-emerald-900/70 uppercase tracking-wider block">
                  மீதமுள்ள நாட்கள் (Days Remaining)
                </span>
                <div className="text-3xl font-black text-emerald-950 flex items-baseline gap-1.5">
                  <span>{daysRemaining}</span>
                  <span className="text-sm font-bold text-emerald-800">நாட்கள் (Days)</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white border border-emerald-300/80 shadow-2xs flex items-center justify-center text-emerald-700">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Validity Details Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20">
                <span className="text-[10.5px] text-velvi-brown/60 block">தொடக்க தேதி (Start Date)</span>
                <span className="font-bold text-velvi-brownDark">{formattedStartDate}</span>
              </div>
              <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20">
                <span className="text-[10.5px] text-velvi-brown/60 block">முடிவடையும் நாள் (Expiry Date)</span>
                <span className="font-extrabold text-emerald-900">{formattedDate}</span>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="pt-2 border-t border-velvi-gold/20 space-y-1.5 text-xs text-velvi-brownDark">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>வரம்பற்ற பூஜா முன்பதிவுகள் &amp; பக்தர் தரவுத்தளம்</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>வாட்ஸ்அப் ஆட்டோமேஷன், பில் &amp; நினைவூட்டல் ரசீதுகள்</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>மேகக்கணி காப்புப்பிரதி &amp; எக்செல் ஏற்றுமதி வசதி</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% விளம்பரமற்ற அசல் வாட்டர்மார்க் இல்லாத சேவை</span>
              </div>
            </div>
          </div>

          {/* 2. Upcoming / Queued Validity Indicator Card */}
          <div className="bg-white rounded-3xl p-5 border border-velvi-gold/25 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-velvi-brownDark">
                  வரவிருக்கும் நீட்டிப்பு நிலை (Upcoming &amp; Queued Validity)
                </h4>
                <p className="text-[10.5px] text-velvi-brown/60">
                  சந்தா காலம் எவ்வாறு சேர்க்கப்படுகிறது?
                </p>
              </div>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/70 text-xs text-velvi-brown space-y-2">
              <p className="leading-relaxed text-[11.5px]">
                🛡️ <strong>முந்தைய நாட்கள் இழக்கப்படாது:</strong> உங்கள் சந்தா இப்போது செயலில் இருக்கும் போதே நீங்கள் புதுப்பித்தாலோ அல்லது ப்ரோமோ கோட் உள்ளிட்டாலோ, புதிய நாட்கள் தற்போதைய முடிவு தேதியான <strong>{formattedDate}</strong>-லிருந்து தானாகவே அடுத்தடுத்து வரிசையில் சேர்க்கப்படும்.
              </p>
              <div className="flex items-center justify-between text-[11px] bg-white/90 p-2.5 rounded-xl border border-amber-200">
                <span>இப்போது புதுப்பித்தால் புதிய இறுதி நாள்:</span>
                <strong className="text-emerald-900 font-black">
                  {formattedProjectedDate} (+{totalDaysToAdd} நாட்கள்)
                </strong>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("PLANS")}
              className="w-full py-2.5 bg-velvi-cream hover:bg-velvi-creamDark text-velvi-brownDark rounded-xl text-xs font-bold border border-velvi-gold/30 transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Sparkles className="w-3.5 h-3.5 text-velvi-gold" />
              <span>புதிய திட்டத்தை சேர்க்க / புதுப்பிக்க (Extend Plan Now →)</span>
            </button>
          </div>

          {/* 3. Validity History / Adjustments */}
          <div className="bg-white rounded-3xl p-5 border border-velvi-gold/25 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-velvi-goldDark" />
                <h4 className="font-bold text-xs text-velvi-brownDark">
                  செல்லுபடியாகும் கால நீட்டிப்பு வரலாறு (Validity History)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-velvi-brown/60">
                {businessAdjustments.length + displayInvoices.length} பதிவுகள்
              </span>
            </div>

            <div className="space-y-2">
              {businessAdjustments.length > 0 ? (
                businessAdjustments.slice(0, 5).map((adj) => (
                  <div
                    key={adj.id}
                    className="p-3 bg-velvi-cream/30 rounded-2xl border border-velvi-gold/20 flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5 min-w-0 pr-2">
                      <div className="font-bold text-velvi-brownDark flex items-center gap-1.5">
                        <span className="text-emerald-700 font-extrabold">
                          +{adj.daysChanged} நாட்கள்
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                          {adj.adjustmentType}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-velvi-brown/60 truncate max-w-[220px]">
                        {adj.reason}
                      </p>
                      <span className="text-[9.5px] text-velvi-brown/40 block">
                        {new Date(adj.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-velvi-brown/60 block">புதிய முடிவு நாள்</span>
                      <span className="font-bold text-slate-800 text-[11px]">
                        {new Date(adj.newEndDate).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 bg-velvi-cream/30 rounded-2xl border border-velvi-gold/20 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-bold text-velvi-brownDark flex items-center gap-1.5">
                      <span className="text-emerald-700 font-extrabold">+30 நாட்கள் Pro</span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                        ACTIVE
                      </span>
                    </div>
                    <p className="text-[10.5px] text-velvi-brown/60">
                      Velvi Pro Initial Activation • Unlimited Bookings
                    </p>
                    <span className="text-[9.5px] text-velvi-brown/40">
                      {formattedStartDate}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-velvi-brown/60 block">செல்லுபடியாகும் நாள்</span>
                    <span className="font-bold text-slate-800 text-[11px]">{formattedDate}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Invoices & Receipts with Simple Download */}
          <div className="bg-white rounded-3xl p-5 border border-velvi-gold/25 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-velvi-goldDark" />
                <h4 className="font-bold text-xs text-velvi-brownDark">
                  கட்டண ரசீதுகள் &amp; பதிவிறக்கம் (Invoices &amp; Receipts)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Official Receipts
              </span>
            </div>

            <p className="text-[11px] text-velvi-brown/60">
              உங்கள் Velvi Pro சந்தாவுக்கான வரி ரசீதை (Tax Invoice) எளிதாகப் பார்க்கவும், பதிவிறக்கவும் செய்யலாம்.
            </p>

            <div className="space-y-2.5">
              {displayInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className="bg-velvi-cream/30 hover:bg-velvi-cream/60 transition p-3.5 rounded-2xl border border-velvi-gold/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-xs text-velvi-brownDark">
                        INV-VELVI-{inv.orderId.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 px-1.5 py-0.2 rounded-full">
                        {inv.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-velvi-brown/70">
                      <span>{new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                      <span>•</span>
                      <span>Velvi Pro ({inv.billingCycle})</span>
                    </div>

                    <div className="text-xs font-black text-emerald-950">
                      தொகை: ₹{inv.amount}
                    </div>
                  </div>

                  {/* Invoice Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-3 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      title="Download or Print Invoice"
                    >
                      <Download className="w-3.5 h-3.5 text-velvi-goldLight" />
                      <span>ரசீதை பதிவிறக்கு</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleShareWhatsAppInvoice(inv)}
                      className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-300 transition cursor-pointer"
                      title="Share on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cashfree Checkout Modal */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl border border-velvi-gold">
            <div className="flex items-center justify-between pb-2 border-b border-velvi-creamDark">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-velvi-gold" />
                <span className="font-bold text-sm text-velvi-brownDark">Cashfree Secure Pay</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="text-xs text-velvi-brown/60 cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Plan:</span>
                <span className="font-bold text-velvi-brownDark">
                  Velvi Pro ({selectedCycle})
                </span>
              </div>

              {appliedCoupon && (
                <div className="flex justify-between text-emerald-800">
                  <span>Coupon ({appliedCoupon.code}):</span>
                  <span className="font-bold">-₹{couponDiscountInfo?.discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between pt-1 border-t border-velvi-gold/20">
                <span className="text-velvi-brown/60">Total Payable:</span>
                <span className="font-extrabold text-base text-velvi-brownDark">
                  ₹{payableAmount}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-velvi-brown/60">New Validity:</span>
                <span className="font-bold text-emerald-800">
                  {formattedProjectedDate} (+{totalDaysToAdd} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Gateway:</span>
                <span className="font-semibold text-velvi-goldDark">Cashfree PG (Verified)</span>
              </div>
            </div>

            <p className="text-[11px] text-velvi-brown/60 leading-normal">
              🔒 Cashfree நேரடி Payment Gateway வழி செலுத்துதல். தற்போதைய சந்தா முடிவடைந்த நாளிலிருந்து மேலும் {totalDaysToAdd} நாட்கள் நீட்டிக்கப்படும்.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => completeVerification()}
                disabled={isProcessing}
                className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4 text-velvi-goldLight" />
                <span>
                  {isProcessing ? "Verifying..." : `Confirm & Pay ₹${payableAmount} via Cashfree`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ரத்து செய்க (Cancel)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Cancelled / Incomplete Notification Popup Modal */}
      {showCancelledModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-amber-200 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center text-amber-600 shadow-inner">
              <AlertCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-velvi-brownDark">
                கட்டணம் ரத்து செய்யப்பட்டது
              </h3>
              <p className="text-xs font-semibold text-amber-700">
                Payment Cancelled / Incomplete
              </p>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/60 text-left space-y-2 text-xs text-velvi-brown">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-xs text-velvi-brownDark">
                  <strong>பணம் கழிக்கப்படவில்லை:</strong> உங்கள் வங்கி அல்லது UPI கணக்கிலிருந்து பணம் எதுவும் பிடிக்கப்படவில்லை.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-xs text-velvi-brownDark">
                  <strong>சந்தா காலம் மாறவில்லை:</strong> உங்கள் தற்போதைய Velvi Pro சந்தா காலம் மாற்றமின்றி பாதுகாப்பாக உள்ளது.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-velvi-brown/60 leading-normal">
              நீங்கள் எப்போது வேண்டுமானாலும் மீண்டும் Velvi Pro திட்டத்தை தேர்வு செய்து பாதுகாப்பாக பணம் செலுத்தலாம்.
            </p>

            <button
              type="button"
              onClick={() => setShowCancelledModal(false)}
              className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
            >
              சரி, புரிந்தது (Got it)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE INVOICE / RECEIPT MODAL                                         */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-amber-200 overflow-hidden my-auto animate-in zoom-in-95">
            {/* Modal Top Bar (Hidden in Print) */}
            <div className="no-print p-4 bg-velvi-cream/70 border-b border-velvi-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-velvi-gold" />
                <span className="font-bold text-xs text-velvi-brownDark">
                  ரசீது முன்னோட்டம் (Tax Invoice Preview)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="p-1 rounded-full text-velvi-brown/60 hover:bg-velvi-cream transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Printable Invoice Body */}
            <div id="printable-invoice" className="p-6 bg-white space-y-5 text-velvi-brownDark">
              {/* Header with App Logo & Sacred Tag */}
              <div className="flex items-start justify-between border-b pb-4 border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🪔</span>
                    <div>
                      <h2 className="text-xl font-black text-velvi-brownDark tracking-tight font-serif uppercase">
                        வேள்வி (VELVI)
                      </h2>
                      <p className="text-[10px] font-bold text-amber-800">
                        நல்லதே நம் நோக்கம் • Sacred Platform
                      </p>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-slate-500 mt-1">
                    Velvi Priest &amp; Temple Ceremony Management
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    TAX INVOICE / ரசீது
                  </span>
                  <div className="font-mono font-bold text-sm text-slate-900 mt-0.5">
                    INV-VELVI-{selectedInvoice.orderId.slice(-8).toUpperCase()}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300">
                    PAID (வெற்றி)
                  </span>
                </div>
              </div>

              {/* Billed To and Meta Info */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    பெறுநர் (Billed To):
                  </span>
                  <p className="font-bold text-slate-900 text-sm">
                    {currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {currentBusiness?.serviceName || "Pooja • Homam • Seva"}
                  </p>
                  {currentUser?.mobile && (
                    <p className="text-slate-600 text-[11px]">📞 {currentUser.mobile}</p>
                  )}
                  {currentUser?.email && (
                    <p className="text-slate-600 text-[11px]">✉️ {currentUser.email}</p>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    கட்டண விவரம் (Payment Info):
                  </span>
                  <p className="text-[11px] text-slate-700">
                    <strong>தேதி:</strong> {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    <strong>Order ID:</strong> <span className="font-mono">{selectedInvoice.orderId}</span>
                  </p>
                  <p className="text-[11px] text-slate-700">
                    <strong>Gateway:</strong> {selectedInvoice.paymentMethod || "Cashfree PG"}
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-slate-50 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 flex justify-between">
                  <span>சேவை விவரம் (Service Description)</span>
                  <span>தொகை (Amount)</span>
                </div>
                <div className="p-4 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        Velvi Pro Membership Subscription ({selectedInvoice.billingCycle})
                      </span>
                      <p className="text-[11px] text-slate-500">
                        Unlimited Bookings, Devotee CRM, WhatsApp automation, Dual Tamil-English Calendar, Priority Cloud Backup
                      </p>
                      <p className="text-[11px] font-semibold text-emerald-800 mt-1">
                        செல்லுபடியாகும் காலம்: {formattedDate} வரை ({daysRemaining} நாட்கள்)
                      </p>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      ₹{selectedInvoice.amount}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-between items-center text-sm font-black">
                  <span>மொத்த தொகை (Total Paid):</span>
                  <span className="text-base text-emerald-900">₹{selectedInvoice.amount}</span>
                </div>
              </div>

              {/* Disclaimer / Note */}
              <div className="text-[10.5px] text-slate-500 space-y-1 border-t pt-3 border-slate-100">
                <p>
                  🔒 இது கணினியால் உருவாக்கப்பட்ட அதிகாரப்பூர்வ வரி ரசீது (Computer generated tax invoice). கையொப்பம் தேவையில்லை.
                </p>
                <p>
                  மின்னஞ்சல்: support@velvi.app • இணையதளம்: https://velvi-booking-app.vercel.app
                </p>
              </div>
            </div>

            {/* Modal Action Buttons (Hidden in Print) */}
            <div className="no-print p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer active:scale-98"
              >
                <Printer className="w-4 h-4 text-velvi-goldLight" />
                <span>🖨️ PDF / பிரிண்ட் செய்க</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyInvoiceText(selectedInvoice)}
                className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer active:scale-98"
                title="Copy Text Receipt"
              >
                {copyInvoiceSuccess ? "நகலெடுக்கப்பட்டது!" : "📋 Copy"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
              >
                மூடுக
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
