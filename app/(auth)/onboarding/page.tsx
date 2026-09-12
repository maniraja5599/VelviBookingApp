"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { normalizeIndianMobile, isValidIndianMobile, maskEmail } from "@/lib/utils/phone";
import { ArrowLeft, User, Building2, Phone, Check, AlertCircle, Sparkles, Mail } from "lucide-react";
import Link from "next/link";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, completeOnboarding } = useAuth();

  const [role, setRole] = useState<"OWNER" | "IYER">("OWNER");
  const [mobile, setMobile] = useState("");
  const [confirmMobile, setConfirmMobile] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [iyerName, setIyerName] = useState(currentUser?.name || "");
  const [error, setError] = useState("");
  const [alreadyRegisteredUser, setAlreadyRegisteredUser] = useState<{
    mobile: string;
    maskedEmail: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setAlreadyRegisteredUser(null);

    if (!isValidIndianMobile(mobile)) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    const norm1 = normalizeIndianMobile(mobile);
    const norm2 = normalizeIndianMobile(confirmMobile);

    if (norm1 !== norm2) {
      setError("Mobile Number and Confirm Mobile Number do not match.");
      return;
    }

    // Check if mobile is already registered
    const existingUsers = db.findUsersByMobile(norm1);
    const otherUsers = existingUsers.filter((u) => u.id !== currentUser?.id);
    if (otherUsers.length > 0) {
      setAlreadyRegisteredUser({
        mobile: norm1,
        maskedEmail: otherUsers.map((u) => u.email).join(", "),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        mobile: norm1,
        businessName,
        iyerName,
        role,
      });
      router.push("/trial-welcome");
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-velvi-cream flex flex-col justify-center px-4 py-8">
      <div className="max-w-sm w-full mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <div className="text-2xl mb-1">🪔</div>
          <h1 className="text-xl font-black text-velvi-brownDark">How will you use Velvi?</h1>
          <p className="text-xs text-velvi-brown/70">
            Link your mobile number to your Google account ({currentUser?.email || "Google Mail"})
          </p>
        </div>

        {/* Informative Google Account Notice */}
        <div className="bg-white/80 border border-velvi-gold/30 rounded-2xl p-3 shadow-sm text-center flex items-center justify-center gap-2">
          <Mail className="w-3.5 h-3.5 text-velvi-goldDark shrink-0" />
          <p className="text-[11px] text-velvi-brown/80 font-medium">
            Signed in as: <strong className="text-velvi-brownDark">{currentUser?.email || "Google Account"}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Dedicated Already Registered Alert Card with Direct Action */}
        {alreadyRegisteredUser && (
          <div className="bg-amber-50 border border-amber-300 p-4 rounded-3xl space-y-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-4 h-4 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-xs text-amber-900">
                  Mobile Number Already Registered
                </h4>
                <p className="text-[11px] text-amber-800 leading-normal">
                  The mobile number <span className="font-bold">{alreadyRegisteredUser.mobile}</span> is already associated with a Velvi account using Google Mail:
                </p>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-xl border border-amber-200 font-mono font-bold text-xs text-amber-950">
                  <Mail className="w-3 h-3 text-velvi-goldDark" />
                  <span>{alreadyRegisteredUser.maskedEmail}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <Link
                href={`/recover?mobile=${encodeURIComponent(alreadyRegisteredUser.mobile)}`}
                className="block w-full py-2.5 px-3 bg-velvi-brown hover:bg-velvi-brownLight text-white text-center rounded-xl font-bold text-xs transition shadow-sm"
              >
                View Linked Google Account(s) & Sign In →
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobile("");
                  setConfirmMobile("");
                  setAlreadyRegisteredUser(null);
                }}
                className="w-full py-2 text-center text-xs font-semibold text-amber-900 hover:underline"
              >
                Use a Different Mobile Number
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile Choice */}
          <div className="grid grid-cols-1 gap-2">
            <label
              onClick={() => setRole("OWNER")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                role === "OWNER"
                  ? "bg-white border-velvi-gold ring-2 ring-velvi-gold/30 shadow-sm"
                  : "bg-velvi-cream/40 border-velvi-gold/20"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5 text-velvi-goldDark" />
              </div>
              <div>
                <div className="font-bold text-xs text-velvi-brownDark">Business / Owner</div>
                <div className="text-[11px] text-velvi-brown/70">
                  I manage bookings, team and customers
                </div>
              </div>
            </label>

            <label
              onClick={() => setRole("IYER")}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center gap-3 ${
                role === "IYER"
                  ? "bg-white border-velvi-gold ring-2 ring-velvi-gold/30 shadow-sm"
                  : "bg-velvi-cream/40 border-velvi-gold/20"
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center font-bold">
                <User className="w-5 h-5 text-velvi-goldDark" />
              </div>
              <div>
                <div className="font-bold text-xs text-velvi-brownDark">Iyer / Staff</div>
                <div className="text-[11px] text-velvi-brown/70">
                  I only handle my assigned bookings
                </div>
              </div>
            </label>
          </div>

          {/* Mobile Collection & Confirmation */}
          <div className="bg-white p-4 rounded-3xl border border-velvi-gold/30 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-bold text-velvi-brown block mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={mobile}
                onChange={(e) => {
                  setMobile(e.target.value);
                  if (alreadyRegisteredUser) setAlreadyRegisteredUser(null);
                }}
                placeholder="+91 98765 43210"
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
              <p className="text-[10px] text-velvi-brown/60 mt-1">
                Each mobile number is uniquely linked to one Google account.
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-velvi-brown block mb-1">
                Confirm Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={confirmMobile}
                onChange={(e) => {
                  setConfirmMobile(e.target.value);
                  if (alreadyRegisteredUser) setAlreadyRegisteredUser(null);
                }}
                placeholder="+91 98765 43210"
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>
          </div>

          {/* Business & Iyer Details */}
          <div className="bg-white p-4 rounded-3xl border border-velvi-gold/30 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-bold text-velvi-brown block mb-1">
                Business / Mandapam Name
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sri Venkateswara Pooja Services"
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-velvi-brown block mb-1">
                Your Name / Primary Iyer Name
              </label>
              <input
                type="text"
                required
                value={iyerName}
                onChange={(e) => setIyerName(e.target.value)}
                placeholder="e.g. Ravi Iyer"
                className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-gradient-to-r from-velvi-brown to-velvi-brownLight hover:opacity-95 text-white rounded-2xl font-bold text-xs shadow-sacred active:scale-[0.99] transition"
          >
            {isSubmitting ? "Setting up..." : "Continue"}
          </button>
        </form>

        <div className="text-center pt-2">
          <DeveloperCredit />
        </div>
      </div>
    </div>
  );
}
