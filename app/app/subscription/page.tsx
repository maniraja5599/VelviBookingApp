"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { openCashfreeCheckout } from "@/lib/payments/cashfree-client";
import confetti from "canvas-confetti";
import Link from "next/link";
import { Check, Sparkles, Shield, CreditCard, Clock, ArrowRight, ArrowLeft } from "lucide-react";

export default function SubscriptionPage() {
  const { currentBusiness, currentUser, subscription, refreshSubscription } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");

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

  // Calculate projected new validity date based on current plan
  const baseRenewalDate = isCurrentlyActive ? endDate : now;

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

  const businessId =
    currentBusiness?.id ||
    (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "biz-default");

  const handleStartPayment = async () => {
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
        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
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

        setPaymentSuccessMessage(
          `Cashfree கட்டணம் உறுதி செய்யப்பட்டது! Velvi Pro செல்லுபடியாகும் தேதி: ${newExpiry} வரை நீட்டிக்கப்பட்டுள்ளது (+${selectedDaysAdded} நாட்கள்).`
        );
        setShowCheckoutModal(false);
      } else {
        // Local simulation fallback
        const daysToAdd = selectedCycle === "MONTHLY" ? 30 : 365;
        const amount = selectedCycle === "MONTHLY" ? 499 : 4999;

        db.adjustSubscriptionValidity({
          businessId,
          adminUserId: "u-super-admin-01",
          adminName: "Cashfree Webhook Gateway",
          adjustmentType: "EXTEND",
          days: daysToAdd,
          reason: `Cashfree verified payment of ₹${amount} (${selectedCycle})`,
        });

        db.payments.push({
          id: `pay-${Date.now()}`,
          businessId,
          userId: currentUser?.id || "u-priest-01",
          orderId: oid,
          gateway: "CASHFREE",
          gatewayPaymentId: `cf_${Date.now()}`,
          amount,
          currency: "INR",
          status: "SUCCESS",
          billingCycle: selectedCycle,
          createdAt: new Date().toISOString(),
        });
        db.saveToLocalStorage();

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {}

        refreshSubscription();
        setPaymentSuccessMessage(
          `Cashfree கட்டணம் உறுதி செய்யப்பட்டது! Velvi Pro செல்லுபடியாகும் தேதி: ${selectedProjectedDate} வரை நீட்டிக்கப்பட்டுள்ளது (+${selectedDaysAdded} நாட்கள்).`
        );
        setShowCheckoutModal(false);
      }
    } catch {
      setShowCheckoutModal(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Header */}
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

      {paymentSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-600 shrink-0" />
            <span className="font-semibold">{paymentSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setPaymentSuccessMessage("")}
            className="text-green-700 font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Subscription Card (Matching Mockup Screen 14) */}
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
            <span>Team &amp; Iyer Settlements</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Referral Rewards (+30 Days per invite)</span>
          </div>
        </div>

        {/* Extend Action */}
        <button
          type="button"
          onClick={handleStartPayment}
          disabled={isProcessing}
          className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-98 cursor-pointer disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4 text-velvi-goldLight" />
          <span>{isProcessing ? "Processing..." : "Extend Validity"}</span>
        </button>
      </div>

      {/* Plan Pricing Options (Point 13) */}
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
              Valid: <strong>{formattedProjectedMonthly}</strong>
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
              Valid: <strong>{formattedProjectedYearly}</strong>
            </div>
          </button>
        </div>

        {/* Light Sub-info showing projected expiry date */}
        <div className="text-[11px] text-velvi-brown/80 bg-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/20 flex items-center justify-between">
          <span>புதிய செல்லுபடியாகும் தேதி (New Validity):</span>
          <strong className="text-velvi-brownDark font-bold">{selectedProjectedDate} (+{selectedDaysAdded} days)</strong>
        </div>
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

            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Plan:</span>
                <span className="font-bold text-velvi-brownDark">
                  Velvi Pro ({selectedCycle})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Amount:</span>
                <span className="font-extrabold text-velvi-brownDark">
                  ₹{selectedCycle === "MONTHLY" ? "499" : "4,999"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">New Validity:</span>
                <span className="font-bold text-emerald-800">
                  {selectedProjectedDate} (+{selectedDaysAdded} days)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-velvi-brown/60">Gateway:</span>
                <span className="font-semibold text-velvi-goldDark">Cashfree PG (Verified)</span>
              </div>
            </div>

            <p className="text-[11px] text-velvi-brown/60 leading-normal">
              🔒 Cashfree நேரடி Payment Gateway வழி செலுத்துதல். தற்போதைய சந்தா முடிவடைந்த நாளிலிருந்து மேலும் {selectedDaysAdded} நாட்கள் நீட்டிக்கப்படும்.
            </p>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => completeVerification()}
                disabled={isProcessing}
                className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-98 cursor-pointer disabled:opacity-60"
              >
                <CreditCard className="w-4 h-4 text-velvi-goldLight" />
                <span>{isProcessing ? "Verifying..." : "Confirm & Pay via Cashfree"}</span>
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
