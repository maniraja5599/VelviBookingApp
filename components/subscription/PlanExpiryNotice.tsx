"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { AlertCircle, ArrowRight, Sparkles, X, Check, RefreshCw } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db/store";

export const PlanExpiryNotice: React.FC = () => {
  const { currentBusiness, subscription, refreshSubscription } = useAuth();
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [renewedSuccess, setRenewedSuccess] = useState(false);

  if (!subscription) return null;

  // Check expiration status
  const now = new Date();
  const isExpired =
    subscription.status === "EXPIRED" ||
    (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) <= now);

  if (!isExpired) return null;

  const handleInstantRenew = () => {
    if (!currentBusiness) return;
    setIsRenewing(true);

    setTimeout(() => {
      db.adjustSubscriptionValidity({
        businessId: currentBusiness.id,
        adminUserId: "u-super-admin-01",
        adminName: "Cashfree Payment Gateway",
        adjustmentType: "EXTEND",
        days: 30,
        reason: "Velvi Pro Monthly Renewal ₹499 via UPI/Card",
      });

      const sub = db.subscriptions.find((s) => s.businessId === currentBusiness.id);
      if (sub) {
        sub.status = "ACTIVE";
        sub.planCode = "VELVI_PRO";
        sub.planName = "Velvi Pro";
      }

      refreshSubscription();
      setIsRenewing(false);
      setRenewedSuccess(true);
      setTimeout(() => {
        setRenewedSuccess(false);
        setShowRenewalModal(false);
      }, 2500);
    }, 1000);
  };

  return (
    <>
      {/* Sticky Expiry Warning Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-700 text-white px-3 sm:px-4 py-2 text-xs font-semibold shadow-md flex items-center justify-between gap-2 animate-in fade-in">
        <div className="flex items-center gap-2 min-w-0">
          <AlertCircle className="w-4 h-4 text-amber-200 shrink-0 animate-pulse" />
          <span className="truncate">
            உங்கள் வேள்வி சந்தா முடிவடைந்தது (Plan Expired). சேவை தடையின்றி தொடர புதுப்பிக்கவும்.
          </span>
        </div>

        <button
          onClick={() => setShowRenewalModal(true)}
          className="px-2.5 py-1 bg-white text-rose-900 rounded-lg text-[11px] font-black hover:bg-amber-50 active:scale-95 transition shrink-0 flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <span>புதுப்பிக்க (Renew)</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Renewal Modal */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-4 border border-velvi-gold/40 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-velvi-brownDark">
                    வேள்வி Pro புதுப்பித்தல் (Renewal)
                  </h3>
                  <p className="text-[11px] text-velvi-brown/60">
                    Unlimited Bookings &amp; Complete Automation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRenewalModal(false)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renewedSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-center space-y-1.5">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-sm text-emerald-950">
                  வெற்றிகரமாக புதுப்பிக்கப்பட்டது!
                </h4>
                <p className="text-xs text-emerald-800">
                  Velvi Pro +30 days extended. All services are active.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-velvi-cream/60 p-3.5 rounded-2xl border border-velvi-gold/30 space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-velvi-gold/20 font-bold text-velvi-brownDark">
                    <span>Velvi Pro (1 Month)</span>
                    <span className="text-base text-emerald-800 font-extrabold">₹499</span>
                  </div>
                  <ul className="space-y-1.5 text-[11px] text-velvi-brown/80">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>வரம்பற்ற பூஜா முன்பதிவுகள் &amp; வாட்ஸ்அப் ரசீதுகள்</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Excel / CSV தரவு ஏற்றுமதி மற்றும் இறக்குமதி</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>தானியங்கி கிளவுட் பேக்கப் &amp; வாட்டர்மார்க் நீக்கம்</span>
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <button
                    onClick={handleInstantRenew}
                    disabled={isRenewing}
                    className="w-full py-3 bg-gradient-to-r from-velvi-gold to-amber-400 hover:brightness-105 text-velvi-brownDark rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer disabled:opacity-60"
                  >
                    {isRenewing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>செயலாக்கப்படுகிறது (Processing)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>UPI மூலம் உடனே புதுப்பிக்க (Pay ₹499 via UPI)</span>
                      </>
                    )}
                  </button>

                  <Link
                    href="/app/subscription"
                    onClick={() => setShowRenewalModal(false)}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold text-center transition"
                  >
                    View All Plans &amp; Billing Details
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
