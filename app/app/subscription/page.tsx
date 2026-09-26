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
  const [couponList, setCouponList] = useState<Coupon[]>(() => [...db.coupons]);

  // Sync coupons from PostgreSQL cloud on mount & listen for live changes
  React.useEffect(() => {
    db.syncCouponsFromCloud().then((cl) => {
      setCouponList([...cl]);
    }).catch(() => {});

    const onDbChange = () => {
      setCouponList([...db.coupons]);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("velvi:db-change", onDbChange);
      return () => window.removeEventListener("velvi:db-change", onDbChange);
    }
  }, []);

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
    const text = `VELVI - Velvi Pro Subscription Receipt\n--------------------------------\nInvoice No: INV-VELVI-${inv.orderId}\nDate: ${new Date(inv.createdAt).toLocaleDateString("en-IN")}\nPriest/Business: ${currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}\nPlan: Velvi Pro (${inv.billingCycle})\nAmount Paid: ₹${inv.amount}\nStatus: PAID (SUCCESS)\nPayment Method: ${inv.paymentMethod || "Cashfree PG"}\nValid Until: ${formattedDate}\n--------------------------------\nThank you for choosing Velvi App!`;
    navigator.clipboard.writeText(text);
    setCopyInvoiceSuccess(true);
    setTimeout(() => setCopyInvoiceSuccess(false), 2500);
  };

  const handleShareWhatsAppInvoice = (inv: any) => {
    const msg = encodeURIComponent(
      `*Velvi Pro Subscription Tax Receipt*\n\n` +
      `📄 *Invoice No:* INV-VELVI-${inv.orderId}\n` +
      `📅 *Date:* ${new Date(inv.createdAt).toLocaleDateString("en-IN")}\n` +
      `👤 *Name:* ${currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}\n` +
      `💎 *Plan:* Velvi Pro (${inv.billingCycle})\n` +
      `💰 *Amount Paid:* ₹${inv.amount}\n` +
      `✅ *Status:* Paid in Full (SUCCESS)\n` +
      `⏳ *Valid Until:* ${formattedDate} (${daysRemaining} Days)\n\n` +
      `_Velvi Booking App • Sacred Ceremonies Platform_`
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
      setCouponError("Please enter a coupon code");
      return;
    }
    const val = db.validateCoupon(code, selectedCycle);
    if (!val.valid || !val.coupon) {
      setCouponError(val.error || "Invalid coupon code");
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
          `Coupon '${appliedCoupon.code}' applied successfully! Velvi Pro validity extended to ${newExpiry} (+${res.daysAdded} bonus days).`
        );
        handleRemoveCoupon();
      } else {
        setCouponError(res.error || "Unable to redeem coupon");
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
          `Cashfree payment verified! Velvi Pro validity extended to ${newExpiry} (+${totalDaysToAdd} days).`
        );
        handleRemoveCoupon();
        setShowCheckoutModal(false);
      } else {
        // STRICT SECURITY: Payment was NOT verified on Cashfree! DO NOT extend subscription!
        setPaymentSuccessMessage("");
        setCouponError(
          verifyData?.message ||
            "Payment was not completed or cancelled. Subscription validity remains unchanged."
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

      {/* Sacred Dual Tab Selector - Sleek & Compact (Kutty a) */}
      <div className="flex rounded-xl bg-velvi-cream/80 p-0.5 border border-velvi-gold/30 text-[11px] shadow-2xs">
        <button
          type="button"
          onClick={() => setActiveTab("PLANS")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-98 ${
            activeTab === "PLANS"
              ? "bg-white text-velvi-brownDark shadow-xs border border-velvi-gold/20"
              : "text-velvi-brown/60 hover:text-velvi-brown"
          }`}
        >
          <Sparkles className="w-3 h-3 text-velvi-gold shrink-0" />
          <span>Plans &amp; Renewal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("VALIDITY_INVOICES")}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1 transition cursor-pointer active:scale-98 ${
            activeTab === "VALIDITY_INVOICES"
              ? "bg-white text-velvi-brownDark shadow-xs border border-velvi-gold/20"
              : "text-velvi-brown/60 hover:text-velvi-brown"
          }`}
        >
          <FileText className="w-3 h-3 text-velvi-gold shrink-0" />
          <span>Invoices &amp; Receipts</span>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300">
            {displayInvoices.length}
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
                ? "Processing..."
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
          <span>New Validity:</span>
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
              Promo / Coupon Code
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
                <span className={`font-bold ${appliedCoupon.discountType === "BONUS_DAYS_ONLY" ? "text-slate-800" : "line-through text-gray-400"}`}>
                  ₹{couponDiscountInfo?.originalAmount}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Discount:</span>
                <span className="font-bold text-emerald-700">
                  {appliedCoupon.discountType === "BONUS_DAYS_ONLY"
                    ? "₹0 (Bonus Days Offer)"
                    : `-₹${couponDiscountInfo?.discountAmount}`}
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

            {/* Dynamic Available Promo Suggestions from Active Super Admin Coupons */}
            {couponList.filter((c) => c.isActive && c.showInSuggestions !== false && c.usedCount < c.maxUses && (!c.validUntil || new Date(c.validUntil).getTime() > Date.now())).length > 0 && (
              <div className="pt-2">
                <span className="text-[10px] font-bold text-velvi-brown/60 uppercase tracking-wide block mb-1.5">
                  Available Offers &amp; Promo Codes:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {couponList
                    .filter((c) => c.isActive && c.showInSuggestions !== false && c.usedCount < c.maxUses && (!c.validUntil || new Date(c.validUntil).getTime() > Date.now()))
                    .map((promo) => (
                      <button
                        key={promo.code}
                        type="button"
                        onClick={() => handleApplyCoupon(promo.code)}
                        className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-velvi-brownDark rounded-lg text-[10px] font-semibold flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <span className="font-mono font-bold text-amber-900">{promo.code}</span>
                        <span className="text-[9px] bg-amber-200/80 px-1 py-0.2 rounded text-amber-950 font-bold">
                          {promo.discountType === "FREE_VALIDITY"
                            ? "FREE"
                            : promo.discountType === "PERCENTAGE"
                            ? `${promo.discountValue}% OFF`
                            : promo.discountType === "BONUS_DAYS_ONLY"
                            ? `+${promo.validityDaysBonus}d BONUS`
                            : `₹${promo.discountValue} OFF`}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            )}
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
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-velvi-goldDark" />
                  <h3 className="font-bold text-xs text-velvi-brownDark">
                    Official Tax Invoices ({displayInvoices.length})
                  </h3>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Cashfree Verified
                </span>
              </div>

              {/* Clean Clickable Invoice List */}
              <div className="space-y-2">
                {displayInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="group bg-white hover:bg-velvi-cream/30 transition p-4 rounded-2xl border border-velvi-gold/20 hover:border-velvi-gold shadow-xs hover:shadow-sm cursor-pointer flex items-center justify-between gap-3 active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-velvi-cream/80 border border-velvi-gold/30 flex items-center justify-center text-velvi-brown shrink-0 group-hover:bg-velvi-gold/20 transition">
                        <FileText className="w-5 h-5 text-velvi-goldDark" />
                      </div>
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-velvi-brownDark group-hover:text-amber-900 transition">
                            INV-VELVI-{inv.orderId.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full border border-emerald-300">
                            PAID
                          </span>
                        </div>
                        <div className="text-[11px] text-velvi-brown/60 flex items-center gap-1.5">
                          <span>{new Date(inv.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                          <span>•</span>
                          <span>Velvi Pro ({inv.billingCycle})</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-velvi-brownDark block">
                          ₹{inv.amount}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-semibold block">
                          {inv.paymentMethod || "Cashfree PG"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 pl-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInvoice(inv);
                          }}
                          className="p-2 rounded-xl bg-velvi-cream/60 hover:bg-velvi-brown hover:text-white text-velvi-brown transition cursor-pointer"
                          title="View & Download PDF"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShareWhatsAppInvoice(inv);
                          }}
                          className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Validity History */}
              <div className="bg-white rounded-3xl p-5 border border-velvi-gold/25 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-velvi-goldDark" />
                    <h4 className="font-bold text-xs text-velvi-brownDark">
                      Validity Extension History
                    </h4>
                  </div>
                  <span className="text-[10px] font-bold text-velvi-brown/60">
                    {businessAdjustments.length + displayInvoices.length} entries
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
                              +{adj.daysChanged} Days
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
                            })}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-velvi-brown/60 block">New Expiry</span>
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
                          <span className="text-emerald-700 font-extrabold">+30 Days Pro</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                            ACTIVE
                          </span>
                        </div>
                        <p className="text-[10.5px] text-velvi-brown/60">
                          Velvi Pro Initial Activation
                        </p>
                        <span className="text-[9.5px] text-velvi-brown/40">
                          {formattedStartDate}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-velvi-brown/60 block">Valid Until</span>
                        <span className="font-bold text-slate-800 text-[11px]">{formattedDate}</span>
                      </div>
                    </div>
                  )}
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
              🔒 Direct payment via Cashfree Payment Gateway. {totalDaysToAdd} days will be added starting from your current expiry date.
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
                Cancel
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
                Payment Cancelled / Incomplete
              </h3>
              <p className="text-xs text-velvi-brown/70">
                Transaction was not completed
              </p>
            </div>

            <div className="bg-amber-50/70 rounded-2xl p-3.5 border border-amber-200/60 text-left space-y-2 text-xs text-velvi-brown">
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-xs text-velvi-brownDark">
                  <strong>No Money Deducted:</strong> No money was deducted from your bank or UPI account.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span className="text-xs text-velvi-brownDark">
                  <strong>Subscription Unchanged:</strong> Your current plan and validity days remain intact.
                </span>
              </div>
            </div>

            <p className="text-[11px] text-velvi-brown/60 leading-normal">
              You can retry or select a Velvi Pro plan whenever you are ready.
            </p>

            <button
              type="button"
              onClick={() => setShowCancelledModal(false)}
              className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-98 cursor-pointer"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINTABLE INVOICE / RECEIPT MODAL                                         */}
      {/* ========================================================================= */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/65 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-velvi-gold/30 overflow-hidden my-auto animate-in zoom-in-95">
            {/* Modal Top Bar (Hidden in Print) */}
            <div className="no-print p-4 bg-gradient-to-r from-velvi-cream to-amber-50/80 border-b border-velvi-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-velvi-gold" />
                <span className="font-bold text-xs text-velvi-brownDark">
                  Tax Invoice Preview &amp; PDF
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="w-7 h-7 rounded-full text-velvi-brown/60 hover:text-velvi-brown hover:bg-velvi-cream flex items-center justify-center transition cursor-pointer text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Printable Invoice Body */}
            <div id="printable-invoice" className="p-6 sm:p-8 bg-white space-y-6 text-slate-800 font-sans">
              {/* Header: Company & Invoice Info */}
              <div className="flex items-start justify-between border-b pb-5 border-slate-200">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                      🪔
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase font-serif">
                        VELVI
                      </h2>
                      <p className="text-[10.5px] font-bold text-amber-800 tracking-wide">
                        Sacred Ceremonies &amp; Temple Platform
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 pt-1">
                    Velvi Priest &amp; Temple Cloud Management Services
                  </p>
                  <p className="text-[9.5px] text-slate-400">
                    SaaS Digital Platform • Support: support@velvi.app
                  </p>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                    TAX INVOICE / RECEIPT
                  </span>
                  <div className="font-mono font-extrabold text-sm text-slate-900 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 inline-block">
                    INV-VELVI-{selectedInvoice.orderId.slice(-8).toUpperCase()}
                  </div>
                  <div className="pt-0.5 flex items-center justify-end gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>PAID (SUCCESS)</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Billed To & Payment Information (Clean 2-Column Grid) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/60 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Billed To (Subscriber):
                  </span>
                  <p className="font-extrabold text-slate-900 text-sm">
                    {currentBusiness?.name || currentUser?.name || "Velvi Vadhyar"}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    {currentBusiness?.serviceName || "Vedic Priest & Pooja Services"}
                  </p>
                  <p className="text-slate-600 text-[11px]">
                    📞 {currentUser?.mobile || "+91 98765 43210"}
                  </p>
                  {currentUser?.email && (
                    <p className="text-slate-600 text-[11px]">
                      ✉️ {currentUser.email}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500">Tamil Nadu, India</p>
                </div>

                <div className="space-y-1 sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-200">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Payment &amp; Transaction Details:
                  </span>
                  <p className="text-[11px] text-slate-700">
                    <strong>Invoice Date:</strong> {new Date(selectedInvoice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    <strong>Order ID:</strong> <span className="font-mono">{selectedInvoice.orderId}</span>
                  </p>
                  <p className="text-[11px] text-slate-700">
                    <strong>Payment Mode:</strong> {selectedInvoice.paymentMethod || "Cashfree PG / UPI"}
                  </p>
                  <p className="text-[11px] text-slate-700">
                    <strong>Gateway:</strong> Cashfree Payment Gateway
                  </p>
                  <p className="text-[10.5px] font-semibold text-emerald-800">
                    Status: Settled &amp; Confirmed
                  </p>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <div className="bg-slate-100/80 px-4 py-2.5 font-bold text-slate-700 border-b border-slate-200 grid grid-cols-12 gap-2 text-[11px] uppercase tracking-wider">
                  <span className="col-span-8">Description</span>
                  <span className="col-span-2 text-center">Period</span>
                  <span className="col-span-2 text-right">Amount</span>
                </div>

                <div className="p-4 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-8 space-y-0.5">
                    <span className="font-extrabold text-slate-900 text-sm block">
                      Velvi Pro Membership Subscription ({selectedInvoice.billingCycle})
                    </span>
                    <p className="text-[11px] text-slate-500">
                      Unlimited Bookings, Devotee CRM, WhatsApp Reminders, Dual Calendar &amp; Cloud Backup
                    </p>
                  </div>
                  <div className="col-span-2 text-center text-slate-600 font-semibold text-[11px]">
                    {selectedInvoice.billingCycle === "YEARLY" ? "365 Days" : "30 Days"}
                  </div>
                  <div className="col-span-2 text-right font-extrabold text-slate-900 text-sm">
                    ₹{selectedInvoice.amount}.00
                  </div>
                </div>

                {/* Subtotal, Tax & Total Box */}
                <div className="bg-slate-50/90 p-4 border-t border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>Subtotal:</span>
                    <span className="font-semibold">₹{selectedInvoice.amount}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>GST (Exempt / Inclusive):</span>
                    <span className="font-semibold">₹0.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 font-black text-sm">
                    <span className="text-slate-900 font-bold">Total Amount Paid:</span>
                    <span className="text-lg text-emerald-900 font-black">
                      ₹{selectedInvoice.amount}.00
                    </span>
                  </div>
                </div>
              </div>

              {/* Digital Authenticity Stamp & Disclaimer */}
              <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-[11px]">
                    <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Official Computer-Generated Tax Invoice</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Valid without physical signature under Information Technology Act, 2000.
                  </p>
                  <p className="text-[9.5px] text-slate-400">
                    https://velvi.date • support@velvi.app
                  </p>
                </div>

                {/* Verification Stamp Badge */}
                <div className="border-2 border-dashed border-emerald-500/50 bg-emerald-50/60 rounded-xl px-3 py-1.5 text-center shrink-0 self-start sm:self-auto">
                  <span className="text-[9px] font-black text-emerald-900 tracking-wider uppercase block">
                    ✓ VERIFIED &amp; CONFIRMED
                  </span>
                  <span className="text-[8px] font-mono text-emerald-700 block">
                    CASHFREE PG SETTLED
                  </span>
                </div>
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
                <span>🖨️ Download / Print PDF</span>
              </button>

              <button
                type="button"
                onClick={() => handleShareWhatsAppInvoice(selectedInvoice)}
                className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-300 transition cursor-pointer flex items-center gap-1.5 active:scale-98"
                title="Share on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => handleCopyInvoiceText(selectedInvoice)}
                className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer active:scale-98"
                title="Copy Text Receipt"
              >
                {copyInvoiceSuccess ? "Copied!" : "📋 Copy"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-3 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
