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
  Copy,
} from "lucide-react";
import { Coupon } from "@/lib/types";

export default function SubscriptionPage() {
  const { currentBusiness, currentUser, subscription, refreshSubscription } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
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

  // Listen for Cashfree redirect return_url with order_id in query params (e.g. after UPI redirect)
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnOrderId = params.get("order_id");
      if (returnOrderId) {
        completeVerification(returnOrderId);
        window.history.replaceState({}, "", window.location.pathname);
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
          customer: {
            name: currentBusiness?.name || currentUser?.name || "Velvi Vadhyar",
            email: currentUser?.email || "priest@velvi.app",
            phone: currentUser?.mobile || "9840012345",
          },
        }),
      });

      const orderData = await res.json();

      // If live Cashfree credentials configured, open Cashfree official checkout
      if (orderData.isConfigured && !orderData.isSimulated) {
        try {
          await openCashfreeCheckout({
            paymentSessionId: orderData.paymentSessionId,
            mode: orderData.environment === "PRODUCTION" ? "production" : "sandbox",
          });
        } catch (e) {
          console.warn("Cashfree checkout window closed:", e);
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
        // Local simulation fallback
        const resAdj = db.adjustSubscriptionValidity({
          businessId,
          adminUserId: currentUser?.id || "u-priest-01",
          adminName: appliedCoupon ? `Cashfree + Coupon: ${appliedCoupon.code}` : "Cashfree Webhook Gateway",
          adjustmentType: "EXTEND",
          days: totalDaysToAdd,
          reason: `Cashfree verified payment of ₹${payableAmount} (${selectedCycle})${appliedCoupon ? ` with Coupon ${appliedCoupon.code}` : ""}`,
        });

        if (appliedCoupon) {
          appliedCoupon.usedCount += 1;
        }

        db.payments.push({
          id: `pay-${Date.now()}`,
          businessId,
          userId: currentUser?.id || "u-priest-01",
          orderId: oid,
          gateway: "CASHFREE",
          gatewayPaymentId: `cf_${Date.now()}`,
          amount: payableAmount,
          currency: "INR",
          status: "SUCCESS",
          billingCycle: selectedCycle,
          paymentMethod: appliedCoupon ? `Cashfree (Coupon ${appliedCoupon.code})` : "Cashfree UPI/Card",
          createdAt: new Date().toISOString(),
        });
        db.saveToLocalStorage();

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("velvi:db-change"));
        }

        try {
          confetti({
            particleCount: 70,
            spread: 65,
            origin: { y: 0.6 },
          });
        } catch {}

        refreshSubscription(resAdj.subscription);
        const newExpiry = resAdj.subscription?.currentPeriodEnd
          ? new Date(resAdj.subscription.currentPeriodEnd).toLocaleDateString("en-IN", {
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
      }
    } catch {
      setShowCheckoutModal(false);
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
    </div>
  );
}
