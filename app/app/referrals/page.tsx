"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import {
  Gift,
  Copy,
  Check,
  Share2,
  Users,
  Award,
  Clock,
  Info,
  CheckCircle2,
  Hourglass,
  ArrowRight,
  MessageCircle,
  Sparkles,
} from "lucide-react";

export default function ReferralsPage() {
  const { currentUser, currentBusiness } = useAuth();
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [filterTab, setFilterTab] = useState<"ALL" | "SIGNUP_ONLY" | "PAID">("ALL");

  const referralCode = currentUser?.referralCode || "VELVI-RAVI123";
  const referralLink = `https://velvi.app/signup?ref=${referralCode}`;

  const referrals = db.referrals.filter(
    (r) => r.referrerUserId === currentUser?.id || r.referrerBusinessId === currentBusiness?.id
  );

  // Separate Counts: Signup only vs Payment completed
  const signedUpOnlyCount = referrals.filter((r) => r.status === "PENDING").length;
  const paidAndRewardedCount = referrals.filter((r) => r.status === "REWARDED").length;
  const totalDaysEarned = paidAndRewardedCount * 30;

  const filteredReferrals = referrals.filter((r) => {
    if (filterTab === "SIGNUP_ONLY") return r.status === "PENDING";
    if (filterTab === "PAID") return r.status === "REWARDED";
    return true;
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = `🙏 Vanakkam! Manage your Pooja & Homam bookings, Tamil calendar, and required items with ease using Velvi App.\n\nSign up with my code *${referralCode}* to get 30 Days Free trial:\n${referralLink}\n\nOnce you subscribe, both of us get +30 extra days free!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleRemindFriend = (refereeName: string) => {
    const text = `🙏 Vanakkam ${refereeName}! You signed up for Velvi App. Activate your first paid plan to unlock Excel data export, unlimited bookings, and get +30 free days for both of us!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-velvi-brownDark">
          Refer & Earn Free Days
        </h2>
        <p className="text-xs text-velvi-brown/60">
          Invite fellow purohits to Velvi & earn 30 free days
        </p>
      </div>

      {/* Hero Gift Card */}
      <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-velvi-gold to-velvi-goldLight text-white mx-auto flex items-center justify-center shadow-md">
          <Gift className="w-7 h-7" />
        </div>

        <div>
          <h3 className="font-extrabold text-lg text-velvi-brownDark">
            Refer a friend and get
          </h3>
          <div className="text-2xl font-black text-velvi-brown mt-0.5">
            +30 Days Free
          </div>
          <p className="text-xs text-velvi-brown/70 mt-1">
            Both of you receive +30 days when they complete their first paid subscription.
          </p>
        </div>

        {/* Referral Code Box */}
        <div className="flex items-center justify-between bg-white rounded-2xl p-3 border border-velvi-gold/40 shadow-sm">
          <span className="font-extrabold text-base tracking-wider text-velvi-brownDark pl-2 font-mono">
            {referralCode}
          </span>
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 bg-velvi-gold/15 hover:bg-velvi-gold/25 text-velvi-brownDark rounded-xl text-xs font-bold flex items-center gap-1 transition"
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* WhatsApp Share Button */}
        <button
          onClick={handleShareWhatsApp}
          className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-[0.99]"
        >
          <Share2 className="w-4 h-4" />
          <span>Share on WhatsApp</span>
        </button>
      </div>

      {/* Explicit Important Rule Box */}
      <div className="bg-amber-50/80 border border-amber-300/80 rounded-2xl p-3.5 text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-950">
          <Info className="w-4 h-4 text-amber-700 shrink-0" />
          <span>How Referral Validity Extension Works:</span>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-[11px] leading-relaxed text-amber-900/90">
          <li>
            <span>
              <strong>Reward triggers on verified payment:</strong> Referral reward is granted{" "}
              <strong>ONLY</strong> after the referred friend completes their first verified paid
              subscription.
            </span>
          </li>
          <li>
            <span>Signup alone or free trial usage does not generate free days.</span>
          </li>
          <li>
            <span>
              If your account is active, +30 days are added to your current expiry. If expired,
              +30 days are calculated from today.
            </span>
          </li>
        </ul>
      </div>

      {/* Clear Metrics Breakdown: Signup Only vs Payment Completed */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-velvi-gold/20 shadow-sm text-center">
          <Users className="w-4 h-4 text-velvi-gold mx-auto mb-1" />
          <div className="text-xl font-bold text-velvi-brownDark">{referrals.length}</div>
          <div className="text-[10px] font-medium text-velvi-brown/70 leading-tight mt-0.5">
            Total Invites
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-amber-200 shadow-sm text-center bg-amber-50/30">
          <Hourglass className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-amber-700">{signedUpOnlyCount}</div>
          <div className="text-[10px] font-medium text-amber-800 leading-tight mt-0.5">
            Signed Up Only
          </div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-green-200 shadow-sm text-center bg-green-50/30">
          <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto mb-1" />
          <div className="text-xl font-bold text-green-700">{paidAndRewardedCount}</div>
          <div className="text-[10px] font-medium text-green-800 leading-tight mt-0.5">
            Paid & Verified
          </div>
        </div>
      </div>

      {/* Free Days Earned Summary Card */}
      <div className="bg-white rounded-2xl p-3 border border-velvi-gold/20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-velvi-gold/20 text-velvi-brown font-bold flex items-center justify-center text-xs">
            🪔
          </div>
          <div>
            <div className="text-xs font-bold text-velvi-brownDark">
              Total Free Validity Earned
            </div>
            <div className="text-[11px] text-velvi-brown/60">
              {paidAndRewardedCount} paid referrals
            </div>
          </div>
        </div>
        <span className="text-base font-black text-velvi-brown bg-velvi-cream px-3 py-1 rounded-xl border border-velvi-gold/30">
          +{totalDaysEarned} Days
        </span>
      </div>

      {/* Filter Tabs for Referred Users */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide">
            Referred Users Tracker ({filteredReferrals.length})
          </h4>
        </div>

        <div className="flex gap-1 bg-velvi-creamDark/60 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setFilterTab("ALL")}
            className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
              filterTab === "ALL"
                ? "bg-white text-velvi-brownDark font-bold shadow-sm"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            All ({referrals.length})
          </button>
          <button
            onClick={() => setFilterTab("SIGNUP_ONLY")}
            className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
              filterTab === "SIGNUP_ONLY"
                ? "bg-white text-amber-800 font-bold shadow-sm"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Signed Up ({signedUpOnlyCount})
          </button>
          <button
            onClick={() => setFilterTab("PAID")}
            className={`flex-1 py-1.5 rounded-lg transition text-[11px] ${
              filterTab === "PAID"
                ? "bg-white text-green-800 font-bold shadow-sm"
                : "text-velvi-brown/70 hover:text-velvi-brown"
            }`}
          >
            Paid & Active ({paidAndRewardedCount})
          </button>
        </div>

        {/* Detailed User List with 2-step lifecycle indicators */}
        <div className="space-y-2.5">
          {filteredReferrals.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-velvi-gold/30">
              <p className="text-xs text-velvi-brown/60">
                No referred users in this category.
              </p>
            </div>
          ) : (
            filteredReferrals.map((r) => {
              const isPaid = r.status === "REWARDED";

              return (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm space-y-2.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-velvi-brown to-velvi-gold text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {r.refereeName?.slice(0, 2).toUpperCase() || "FR"}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-velvi-brownDark">
                          {r.refereeName}
                        </h5>
                        <p className="text-[11px] text-velvi-brown/60">
                          Referred by:{" "}
                          <span className="font-semibold text-velvi-brown">
                            {r.referrerName || currentUser?.name}
                          </span>
                        </p>
                        <p className="text-[10px] text-velvi-brown/50">
                          Joined on: {new Date(r.createdAt).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          isPaid
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>Paid (+30 Days)</span>
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3 h-3 text-amber-600" />
                            <span>Payment Pending</span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Visual 2-Step Progress Indicator */}
                  <div className="bg-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/15 text-[11px] space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-bold text-velvi-brown/70">
                      <span>Step 1: Sign Up With Google</span>
                      <span>Step 2: 1st Paid Subscription</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Step 1 Pill */}
                      <div className="flex-1 py-1 px-2 rounded-lg bg-green-100 border border-green-300 text-green-800 font-bold flex items-center justify-center gap-1 text-[10px]">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Account Created</span>
                      </div>

                      <ArrowRight className="w-3.5 h-3.5 text-velvi-gold shrink-0" />

                      {/* Step 2 Pill */}
                      <div
                        className={`flex-1 py-1 px-2 rounded-lg font-bold flex items-center justify-center gap-1 text-[10px] ${
                          isPaid
                            ? "bg-green-100 border border-green-300 text-green-800"
                            : "bg-amber-50 border border-amber-300 text-amber-800"
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>Payment Done (+30d)</span>
                          </>
                        ) : (
                          <>
                            <Hourglass className="w-3 h-3" />
                            <span>Awaiting Payment</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Footer Status Message */}
                    <div className="pt-1 text-[10px]">
                      {isPaid ? (
                        <p className="text-green-700 font-medium">
                          🎉 First payment verified. 30 days added to your subscription!
                        </p>
                      ) : (
                        <div className="flex items-center justify-between">
                          <p className="text-amber-800">
                            ⏳ +30 days will be added as soon as {r.refereeName} completes their
                            subscription.
                          </p>
                          <button
                            onClick={() => handleRemindFriend(r.refereeName)}
                            className="px-2 py-0.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-md font-bold text-[9px] flex items-center gap-1 shrink-0 ml-1"
                          >
                            <MessageCircle className="w-2.5 h-2.5" /> Remind
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
