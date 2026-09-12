"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { ArrowLeft, Phone, Check, AlertCircle, Sparkles, Mail, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";
import { User } from "@/lib/types";

function AccountRecoveryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { lookupAccountsByMobile, loginWithGoogle } = useAuth();

  const queryMobile = searchParams.get("mobile") || "";

  const [mobile, setMobile] = useState(queryMobile || "+91 98765 43210");
  const [matchedUsers, setMatchedUsers] = useState<User[] | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [signingInUserId, setSigningInUserId] = useState<string | null>(null);

  const handleLookup = async (mobileToSearch?: string) => {
    const targetMobile = mobileToSearch || mobile;
    if (!targetMobile.trim()) {
      setError("Please enter a mobile number.");
      return;
    }

    setError("");
    setIsLoading(true);

    const res = await lookupAccountsByMobile(targetMobile);
    setIsLoading(false);

    if (res.success && res.users.length > 0) {
      setMatchedUsers(res.users);
    } else {
      setMatchedUsers([]);
      setError(res.error || "No Google accounts registered with this mobile number.");
    }
  };

  // Auto-search if mobile query param is provided from onboarding
  useEffect(() => {
    if (queryMobile) {
      setMobile(queryMobile);
      handleLookup(queryMobile);
    }
  }, [queryMobile]);

  const handleSignInWithUser = async (user: User) => {
    setSigningInUserId(user.id);
    try {
      await loginWithGoogle(user.email, user.name);
      router.push("/app");
    } finally {
      setSigningInUserId(null);
    }
  };

  return (
    <div className="max-w-sm w-full mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="p-1.5 hover:bg-velvi-creamDark/40 rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Find Linked Google Mail</h2>
          <p className="text-[11px] text-velvi-brown/60">Instant Mobile Lookup • No OTP Required</p>
        </div>
      </div>

      {/* Explanatory Info Card */}
      <div className="bg-white/80 border border-velvi-gold/30 rounded-2xl p-3.5 shadow-sm text-center space-y-1">
        <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full bg-velvi-gold/15 text-velvi-brownDark text-[11px] font-bold">
          <Mail className="w-3 h-3 text-velvi-goldDark" />
          <span>Google Account Finder</span>
        </div>
        <p className="text-xs text-velvi-brown/80 leading-relaxed">
          Enter your registered mobile number to see all Google Mail accounts linked with Velvi.
        </p>
      </div>

      {/* Mobile Input Search Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleLookup();
        }}
        className="bg-white rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-3.5"
      >
        <div>
          <label className="text-xs font-bold text-velvi-brown block mb-1">
            Registered Mobile Number
          </label>
          <div className="relative">
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => {
                setMobile(e.target.value);
                if (error) setError("");
              }}
              placeholder="+91 98765 43210"
              className="w-full bg-velvi-cream/30 border border-velvi-gold/30 rounded-xl px-3 py-2.5 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold pr-10"
            />
            <Phone className="w-4 h-4 text-velvi-goldDark absolute right-3 top-3 pointer-events-none" />
          </div>
          <p className="text-[10px] text-velvi-brown/60 mt-1">
            Demo: Try +91 98765 43210 (Multiple accounts) or +91 98765 43211
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>{isLoading ? "Searching Database..." : "Find Linked Google Accounts"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-2xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* RESULTS DISPLAY: Single or Multiple Accounts Found */}
      {matchedUsers && matchedUsers.length > 0 && (
        <div className="bg-white rounded-3xl p-5 border border-velvi-gold/30 shadow-sacred space-y-4">
          <div className="flex items-center justify-between border-b border-velvi-creamDark/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center font-bold">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
              <div>
                <h3 className="font-bold text-xs text-velvi-brownDark">
                  {matchedUsers.length === 1
                    ? "1 Google Account Linked"
                    : `${matchedUsers.length} Google Accounts Linked`}
                </h3>
                <p className="text-[10px] text-velvi-brown/60">
                  Mobile: {mobile}
                </p>
              </div>
            </div>

            {matchedUsers.length > 1 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold text-[10px]">
                Multi-Account
              </span>
            )}
          </div>

          <p className="text-[11px] text-velvi-brown/80 leading-normal">
            {matchedUsers.length === 1
              ? "Your account was located. Click below to sign in directly:"
              : "Multiple accounts are registered with this mobile number. Choose the account you wish to sign in with:"}
          </p>

          {/* List of Matched Google Accounts */}
          <div className="space-y-2.5">
            {matchedUsers.map((user) => {
              const isCurrentlySigningIn = signingInUserId === user.id;

              return (
                <div
                  key={user.id}
                  className="p-3.5 bg-velvi-cream/40 hover:bg-velvi-cream/70 rounded-2xl border border-velvi-gold/30 transition space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-xs shrink-0">
                        {/* Google G Logo SVG */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                          />
                        </svg>
                      </div>
                      <div>
                        <div className="font-mono font-bold text-xs text-velvi-brownDark tracking-tight">
                          {user.email}
                        </div>
                        <div className="text-[11px] font-semibold text-velvi-brown/80">
                          {user.name}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        user.role === "OWNER"
                          ? "bg-velvi-gold/20 text-velvi-brownDark"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {user.role === "OWNER" ? "Owner" : "Iyer"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSignInWithUser(user)}
                    disabled={isCurrentlySigningIn}
                    className="w-full py-2.5 px-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs shadow-sm transition active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <span>{isCurrentlySigningIn ? "Signing In..." : "Sign In with this Account"}</span>
                    <Sparkles className="w-3.5 h-3.5 text-velvi-gold" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="pt-2 text-center">
            <Link
              href="/login"
              className="text-xs font-semibold text-velvi-brown/70 hover:underline"
            >
              Return to Login Page
            </Link>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="text-center pt-2">
        <DeveloperCredit />
      </div>
    </div>
  );
}

export default function AccountRecoveryPage() {
  return (
    <div className="min-h-screen bg-velvi-cream flex flex-col justify-center px-4 py-12">
      <Suspense
        fallback={
          <div className="text-center text-xs text-velvi-brown/60 py-8">
            Loading Google Account Finder...
          </div>
        }
      >
        <AccountRecoveryContent />
      </Suspense>
    </div>
  );
}
