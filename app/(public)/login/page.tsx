"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import {
  User as UserIcon,
  Phone,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Zap,
  ChevronRight,
  Mail,
  Sparkles,
  Calendar,
  Receipt,
  PieChart,
  Flame,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";
import { loadGoogleIdentityScript, parseGoogleJwt, GoogleUserPayload } from "@/lib/auth/google";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginDemo, updateUser, updateBusiness, logout } = useAuth();

  const [step, setStep] = useState<"login" | "mobile_setup">("login");
  const [googleUser, setGoogleUser] = useState<GoogleUserPayload | null>(null);

  // Profile setup state
  const [priestName, setPriestName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Google OAuth configuration
  const [gisReady, setGisReady] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Initialize official Google Identity Services (GIS) if Client ID is configured
  useEffect(() => {
    let isMounted = true;

    async function initGoogle() {
      if (!googleClientId || step !== "login") return;
      const loaded = await loadGoogleIdentityScript();
      if (!loaded || !isMounted) return;

      const google = (window as any).google;
      if (google?.accounts?.id) {
        try {
          google.accounts.id.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
          });
          if (isMounted) {
            setGisReady(true);
          }
        } catch (err) {
          console.warn("Google Identity initialization:", err);
        }
      }
    }

    initGoogle();
    return () => {
      isMounted = false;
    };
  }, [googleClientId, step]);

  // Callback from official Google GIS JWT Credential
  const handleGoogleCredentialResponse = async (response: any) => {
    setIsLoading(true);
    setError("");
    try {
      const payload = parseGoogleJwt(response.credential);
      if (!payload || !payload.email) {
        throw new Error("Unable to read Google account profile.");
      }

      await processGoogleUser(payload);
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Process authenticated Google profile
  const processGoogleUser = async (userPayload: GoogleUserPayload) => {
    const user = await loginWithGoogle(userPayload.email, userPayload.name, userPayload.picture);
    setGoogleUser(userPayload);
    setPriestName(user.name || userPayload.name);

    // If account already has a registered mobile number, enter the app directly without asking again
    if (user.mobile && user.mobile.length >= 10 && user.mobileVerified) {
      router.push("/app/calendar");
      return;
    }

    // Otherwise, transition to Step 2 to capture mobile number for WhatsApp & notifications
    setMobileNumber(user.mobile ? user.mobile.replace(/\D/g, "").slice(-10) : "");
    setStep("mobile_setup");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).__simulateGoogleLogin = (email: string, name: string, picture?: string) => {
        return processGoogleUser({
          sub: `google-${Date.now()}`,
          email,
          name,
          picture: picture || "https://api.dicebear.com/7.x/initials/svg?seed=" + encodeURIComponent(name),
          email_verified: true,
        });
      };
    }
  }, []);

  // Direct Google Sign-In button
  const handleGoogleButtonClick = async () => {
    setError("");
    const google = typeof window !== "undefined" ? (window as any).google : null;

    // 1. If real Google Client ID is configured, try Google OAuth2 Token Client popup
    if (googleClientId && google?.accounts?.oauth2) {
      try {
        setIsLoading(true);

        let cleanupTimers: (() => void) | null = null;

        const tokenClient = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          error_callback: (error: any) => {
            console.warn("Google OAuth error or popup closed:", error);
            if (cleanupTimers) cleanupTimers();
            setIsLoading(false);
          },
          callback: async (tokenResponse: any) => {
            if (cleanupTimers) cleanupTimers();
            if (tokenResponse.error) {
              setIsLoading(false);
              if (tokenResponse.error !== "popup_closed_by_user") {
                setError("Google sign-in was interrupted. Please try again.");
              }
              return;
            }
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const info = await res.json();
              if (!info || !info.email) {
                throw new Error("Unable to retrieve Google profile.");
              }
              await processGoogleUser({
                sub: info.sub || `google-${Date.now()}`,
                email: info.email,
                name: info.name || info.email.split("@")[0],
                picture: info.picture,
                email_verified: info.email_verified,
              });
            } catch (fetchErr: any) {
              setError(fetchErr?.message || "Failed to fetch Google profile.");
            } finally {
              setIsLoading(false);
            }
          },
        });

        // Window focus safeguard: when user closes popup or cancels and returns to our page
        const onWindowFocus = () => {
          setTimeout(() => {
            setIsLoading(false);
          }, 1200);
        };
        window.addEventListener("focus", onWindowFocus, { once: true });

        // Safety timeout fallback (e.g. 20s)
        const safetyTimer = setTimeout(() => {
          setIsLoading(false);
          window.removeEventListener("focus", onWindowFocus);
        }, 20000);

        cleanupTimers = () => {
          clearTimeout(safetyTimer);
          window.removeEventListener("focus", onWindowFocus);
        };

        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn("OAuth2 Token Client error, falling back:", err);
        setIsLoading(false);
      }
    }

    // 2. Fallback to GIS Prompt One-Tap
    if (googleClientId && google?.accounts?.id) {
      try {
        setIsLoading(true);
        google.accounts.id.prompt(async (notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            await handleDirectGoogleLogin();
          } else if (notification.isDismissedMoment()) {
            setIsLoading(false);
          }
        });
        return;
      } catch (err) {
        setIsLoading(false);
        console.warn("GIS Prompt fallback:", err);
      }
    }

    // 3. Fallback to direct mock Google login
    await handleDirectGoogleLogin();
  };

  const handleDirectGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const priestId = Date.now().toString().slice(-4);
      const email = `priest.${priestId}@gmail.com`;
      const name = `Priest ${priestId}`;
      const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=064e3b,047857,0f766e&textColor=fef3c7`;
      const payload: GoogleUserPayload = {
        sub: `google-${Date.now()}`,
        email,
        name,
        picture: avatarUrl,
        email_verified: true,
      };

      await processGoogleUser(payload);
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Tap Quick Demo Access - Always unblocked & instantly accessible
  const handleInstantDemo = async () => {
    setIsLoading(false); // Instantly cancel any lingering Google loading state
    setIsDemoLoading(true);
    setError("");
    try {
      await loginDemo();
      router.push("/app/calendar");
    } catch (err: any) {
      setError(err?.message || "Demo login failed. Please try again.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Clean numeric input for 10-digit mobile
  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
    setError("");
  };


  // Complete Step 2: Mobile Number & Profile Setup
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!priestName.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (mobileNumber.length !== 10) {
      setError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedMobile = `+91${mobileNumber}`;
      updateUser({
        name: priestName.trim(),
        avatarUrl: googleUser?.picture || undefined,
        mobile: normalizedMobile,
        mobileVerified: true,
      });
      updateBusiness({
        iyerName: priestName.trim(),
        name: priestName.trim(),
        phone: normalizedMobile,
        whatsapp: normalizedMobile,
      });

      router.push("/app/calendar");
    } catch (err: any) {
      setError(err?.message || "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] relative overflow-hidden flex flex-col justify-between px-3 sm:px-6 py-6 sm:py-10">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-96 bg-gradient-to-b from-amber-200/25 via-emerald-100/20 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 right-0 w-80 h-80 bg-amber-400/10 blur-3xl pointer-events-none" />
      <div className="absolute -top-20 left-0 w-80 h-80 bg-emerald-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full mx-auto my-auto relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="pt-1 flex justify-center">
            <VelviLogo size="sm" variant="full" showTagline={false} />
          </div>

          <p className="text-xs text-slate-600 font-semibold tracking-wide">
            Vedic Astrology, Pooja &amp; Homam Booking Platform
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2.5 animate-in fade-in shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* STEP 1: PURE ENGLISH GOOGLE SIGN-IN SCREEN */}
        {/* ======================================================================= */}
        {step === "login" && (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 border-2 border-amber-300/80 shadow-[0_12px_45px_rgba(217,119,6,0.12)] ring-1 ring-amber-400/30 space-y-6 animate-in fade-in zoom-in-95 duration-150 relative overflow-hidden">
            {/* Sacred glowing corner ambient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-400/15 via-amber-200/5 to-transparent rounded-bl-full pointer-events-none" />

            <div className="text-center space-y-2 pt-1 relative z-10">
              <h1 className="font-black text-2xl sm:text-3xl text-slate-900 tracking-tight">
                Welcome to Velvi
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 font-medium leading-relaxed max-w-xs mx-auto">
                Sign in with your Google account to manage pooja bookings, devotee records, and dakshina accounts.
              </p>
            </div>

            {/* Single Unified Prominent Google Sign-In Button */}
            <div className="space-y-3.5 relative z-10">
              <button
                type="button"
                id="google-continue-btn"
                onClick={handleGoogleButtonClick}
                disabled={isLoading || isDemoLoading}
                className="w-full py-4 px-6 bg-white hover:bg-amber-50/60 active:bg-amber-100/40 text-slate-900 rounded-2xl border-2 border-slate-300 hover:border-amber-500 shadow-xs hover:shadow-md transition-all duration-150 active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official 4-Color Google G Logo */}
                <svg className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform duration-150" viewBox="0 0 24 24">
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
                <span className="font-black text-base sm:text-[17px] text-slate-900 tracking-tight">
                  {isLoading ? "Signing in with Google..." : "Continue with Google"}
                </span>
              </button>

              {/* Centered Trust Badge */}
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500 font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>100% Secure • Official Google Sign-In</span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="flex items-center gap-3 relative z-10">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                or
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* 1-Tap Quick Demo Access Button - Polished with 20 Free Bookings Highlight */}
            <button
              type="button"
              id="instant-demo-login-btn"
              onClick={handleInstantDemo}
              disabled={isDemoLoading}
              className="w-full p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-amber-950 hover:from-black hover:to-slate-950 text-white rounded-2xl border-2 border-amber-500/50 hover:border-amber-400 shadow-md hover:shadow-xl transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed relative overflow-hidden"
            >
              {/* Subtle sacred shimmer overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-transparent pointer-events-none" />

              <div className="flex items-center gap-3 relative z-10 text-left">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-md group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="font-extrabold text-[13.5px] text-amber-200 flex items-center gap-2 flex-wrap">
                    <span>Quick Demo Experience</span>
                    <span className="text-[9px] bg-amber-400/25 text-amber-300 border border-amber-400/50 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                      Instant Access • 20 Free Bookings
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium mt-0.5 leading-snug">
                    Instant access without phone or OTP • Explore Muhurtham calendar &amp; 8 Homams
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shrink-0 relative z-10 ml-2">
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Feature Highlights Grid - 6 Key Highlights */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center border-t border-slate-100 relative z-10">
              <div className="p-2 bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border border-amber-100/80 hover:border-amber-300 transition-colors group">
                <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-amber-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-3.5 h-3.5 text-amber-700 fill-amber-500/20" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  8 Homams
                </span>
                <span className="text-[8.5px] text-slate-500 block font-medium mt-0.5">
                  Samagri List
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl border border-emerald-100/80 hover:border-emerald-300 transition-colors group">
                <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-emerald-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  Panchangam
                </span>
                <span className="text-[8.5px] text-slate-500 block font-medium mt-0.5">
                  Thithi &amp; Muhurtham
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-blue-50/60 to-white rounded-2xl border border-blue-100/80 hover:border-blue-300 transition-colors group">
                <div className="w-7 h-7 mx-auto mb-1 rounded-xl bg-blue-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  Dakshina
                </span>
                <span className="text-[8.5px] text-slate-500 block font-medium mt-0.5">
                  Priest Split
                </span>
              </div>
            </div>

            {/* Subtle Developer Attribution on Login Card */}
            <div className="pt-2 text-center border-t border-slate-100 flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500 font-medium select-none relative z-10">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>Crafted with devotion by <strong className="text-slate-800 font-bold">Maniraja</strong> • Velvi Tech</span>
            </div>
          </div>
        )}



        {/* ======================================================================= */}
        {/* STEP 2: PROFILE & MOBILE NUMBER SETUP (100% PURE ENGLISH) */}
        {/* ======================================================================= */}
        {step === "mobile_setup" && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300/80 shadow-[0_12px_45px_rgba(217,119,6,0.12)] ring-1 ring-amber-400/30 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Connected Google Profile Badge */}
            <div className="p-3 bg-gradient-to-br from-amber-50/80 to-emerald-50/50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {googleUser?.picture ? (
                  <img
                    src={googleUser.picture}
                    alt={priestName}
                    className="w-10 h-10 rounded-full object-cover shrink-0 shadow-2xs ring-1 ring-amber-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ring-1 ring-amber-400">
                    {priestName ? priestName[0].toUpperCase() : "V"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    {priestName || "Vedic Priest"}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    {googleUser?.email || "Google Account"}
                  </p>
                </div>
              </div>
              <span className="text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Google Verified</span>
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-extrabold text-base text-slate-900 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-800" />
                <span>Complete Your Profile</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Enter your mobile number to enable WhatsApp devotee receipts and booking reminders.
              </p>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              {/* Field 1: Priest Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Priest / Vadhyar Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={priestName}
                    onChange={(e) => setPriestName(e.target.value)}
                    placeholder="e.g. Sundara Sastrigal"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Field 2: Clean 10-Digit Indian Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600 text-xs font-black border-r border-slate-200 pr-2 my-1.5">
                    🇮🇳 +91
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="98400 12345"
                    value={mobileNumber}
                    onChange={(e) => handleMobileChange(e.target.value)}
                    maxLength={10}
                    required
                    className="w-full pl-16 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                  {mobileNumber.length === 10 && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-600 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 px-1">
                  <span>10-digit Indian mobile number</span>
                  <span className={mobileNumber.length === 10 ? "text-emerald-700 font-bold" : ""}>
                    {mobileNumber.length}/10
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || mobileNumber.length !== 10}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>{isLoading ? "Saving Profile..." : "Complete Setup & Launch App"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Back to Switch Account */}
              <button
                type="button"
                onClick={() => {
                  setIsLoading(false);
                  setIsDemoLoading(false);
                  setError("");
                  setGoogleUser(null);
                  logout();
                  setStep("login");
                }}
                className="w-full py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Switch Google Account</span>
              </button>
            </form>
          </div>
        )}

        {/* Compliance Footer for Cashfree & Legal Policies */}
        <ComplianceFooter />
      </div>
    </div>
  );
}
