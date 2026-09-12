"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { cashfree } from "@/lib/payments/cashfree";
import { db } from "@/lib/db/store";
import { Check, Sparkles, Shield, CreditCard, Clock, ArrowRight } from "lucide-react";

export default function SubscriptionPage() {
  const { currentBusiness, currentUser, subscription, refreshSubscription } = useAuth();
  const [selectedCycle, setSelectedCycle] = useState<"MONTHLY" | "YEARLY">("MONTHLY");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState("");

  const endDate = subscription ? new Date(subscription.currentPeriodEnd) : new Date();
  const now = new Date();
  const daysRemaining = Math.max(
    0,
    Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formattedDate = endDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleStartPayment = async () => {
    setIsProcessing(true);
    setShowCheckoutModal(true);
    setIsProcessing(false);
  };

  // Specification Point 14: Backend Verification required to extend subscription
  const handleSimulateCashfreeWebhook = async () => {
    if (!currentBusiness || !currentUser || !subscription) return;
    setIsProcessing(true);

    const daysToAdd = selectedCycle === "MONTHLY" ? 30 : 365;
    const amount = selectedCycle === "MONTHLY" ? 499 : 4999;

    // Simulate verified webhook from Cashfree backend
    db.adjustSubscriptionValidity({
      businessId: currentBusiness.id,
      adminUserId: "u-super-admin-01",
      adminName: "Cashfree Webhook Gateway",
      adjustmentType: "EXTEND",
      days: daysToAdd,
      reason: `Cashfree verified payment of ₹${amount} (${selectedCycle})`,
    });

    db.payments.push({
      id: `pay-${Date.now()}`,
      businessId: currentBusiness.id,
      userId: currentUser.id,
      orderId: `order_${Date.now()}`,
      gateway: "CASHFREE",
      gatewayPaymentId: `cf_${Date.now()}`,
      amount,
      currency: "INR",
      status: "SUCCESS",
      billingCycle: selectedCycle,
      paymentMethod: "UPI",
      createdAt: new Date().toISOString(),
    });

    refreshSubscription();
    setIsProcessing(false);
    setShowCheckoutModal(false);
    setPaymentSuccessMessage(
      `Payment verified successfully! Subscription extended by ${daysToAdd} days.`
    );
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-velvi-brownDark">Subscription & Billing</h2>
        <p className="text-xs text-velvi-brown/60">Manage your Velvi Pro membership</p>
      </div>

      {paymentSuccessMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-2xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600 shrink-0" />
          <span>{paymentSuccessMessage}</span>
        </div>
      )}

      {/* Main Subscription Card (Matching Mockup Screen 14) */}
      <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-4">
        <div className="flex items-center justify-between">
          <span
            className={`px-3 py-0.5 rounded-full text-xs font-bold ${
              subscription?.status === "ACTIVE"
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-amber-100 text-amber-800 border border-amber-300"
            }`}
          >
            {subscription?.status || "ACTIVE"}
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
            <span>Unlimited Pooja & Homam Bookings</span>
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
            <span>Data Export / Import (Excel & CSV)</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-velvi-sacredGreen/15 text-velvi-sacredGreen flex items-center justify-center">
              <Check className="w-3 h-3 stroke-[3]" />
            </div>
            <span>Team & Iyer Settlements</span>
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
          onClick={handleStartPayment}
          className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
        >
          <Sparkles className="w-4 h-4 text-velvi-goldLight" />
          <span>Extend Validity</span>
        </button>
      </div>

      {/* Plan Pricing Options (Point 13) */}
      <div className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide">
          Choose Renewal Cycle
        </h4>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => setSelectedCycle("MONTHLY")}
            className={`p-3 rounded-2xl border text-left transition ${
              selectedCycle === "MONTHLY"
                ? "bg-velvi-gold/10 border-velvi-gold shadow-sm"
                : "bg-velvi-cream/20 border-velvi-gold/20"
            }`}
          >
            <div className="text-[10px] font-bold text-velvi-brown/60 uppercase">Monthly</div>
            <div className="text-base font-extrabold text-velvi-brownDark mt-0.5">₹499</div>
            <div className="text-[10px] text-velvi-brown/70">Per month billed</div>
          </button>

          <button
            onClick={() => setSelectedCycle("YEARLY")}
            className={`p-3 rounded-2xl border text-left transition relative ${
              selectedCycle === "YEARLY"
                ? "bg-velvi-gold/10 border-velvi-gold shadow-sm"
                : "bg-velvi-cream/20 border-velvi-gold/20"
            }`}
          >
            <span className="absolute -top-2 right-2 bg-velvi-gold text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full shadow-sm">
              Save ₹989
            </span>
            <div className="text-[10px] font-bold text-velvi-brown/60 uppercase">Annual</div>
            <div className="text-base font-extrabold text-velvi-brownDark mt-0.5">₹4,999</div>
            <div className="text-[10px] text-velvi-sacredGreen font-semibold">17% Savings</div>
          </button>
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
                onClick={() => setShowCheckoutModal(false)}
                className="text-xs text-velvi-brown/60"
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
                <span className="text-velvi-brown/60">Gateway:</span>
                <span className="font-semibold text-velvi-goldDark">Cashfree PG (Verified)</span>
              </div>
            </div>

            <p className="text-[11px] text-velvi-brown/60 leading-normal">
              🔒 In accordance with Specification Point 14, frontend success alone never extends
              subscriptions. The button below simulates the signed backend webhook verification
              from Cashfree.
            </p>

            <button
              onClick={handleSimulateCashfreeWebhook}
              disabled={isProcessing}
              className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <CreditCard className="w-4 h-4 text-velvi-goldLight" />
              <span>Simulate Verified Payment Webhook</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
