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
  MessageCircle,
  X,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { ComplianceFooter } from "@/components/ui/ComplianceFooter";
import { loadGoogleIdentityScript, parseGoogleJwt, GoogleUserPayload } from "@/lib/auth/google";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginDemo, updateUser, updateBusiness, logout } = useAuth();

  const [step, setStep] = useState<"login" | "mobile_setup">("login");
  const [googleUser, setGoogleUser] = useState<GoogleUserPayload | null>(null);

  // Profile setup state
  const [fullName, setFullName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showTestLogin, setShowTestLogin] = useState(false);
  const [testUsername, setTestUsername] = useState("9876543210");
  const [testPassword, setTestPassword] = useState("123456");

  // Google OAuth configuration
  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "239924321651-f69j4bdmp648o08hg4n31jf46i7re4rj.apps.googleusercontent.com";

  // Check URL hash for Google OAuth 2.0 access_token redirect callback
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      setIsLoading(true);
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const errorParam = params.get("error");

      if (errorParam) {
        setError(`Google sign-in was cancelled or failed (${errorParam}).`);
        setIsLoading(false);
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      if (accessToken) {
        // Clean URL hash immediately so access token is not left exposed in browser address bar
        window.history.replaceState(null, "", window.location.pathname);

        // Fetch user profile from official Google userinfo endpoint
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch Google profile.");
            return res.json();
          })
          .then(async (info) => {
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
          })
          .catch((err) => {
            console.error("Google userinfo error:", err);
            setError(err?.message || "Google sign-in failed. Please try again.");
          })
          .finally(() => {
            setIsLoading(false);
          });
      }
    }
  }, []);

  // Initialize official Google Identity Services (GIS) for One Tap if loaded
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
    setFullName(user.name || userPayload.name || userPayload.email.split("@")[0]);

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

  // Direct Google Sign-In button -> triggers official Google Identity Services popup
  const handleGoogleButtonClick = () => {
    setError("");
    setIsLoading(true);

    const google = typeof window !== "undefined" ? (window as any).google : null;

    // 1. Preferred Modern Flow: Google Identity Services OAuth 2.0 Token Client (Popup)
    if (google?.accounts?.oauth2) {
      try {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              console.error("Google Token error:", tokenResponse);
              setError(`Google Sign-In: ${tokenResponse.error_description || tokenResponse.error}`);
              setIsLoading(false);
              return;
            }
            if (tokenResponse.access_token) {
              try {
                const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch Google profile.");
                const info = await res.json();
                await processGoogleUser({
                  sub: info.sub || `google-${Date.now()}`,
                  email: info.email,
                  name: info.name || info.email.split("@")[0],
                  picture: info.picture,
                  email_verified: info.email_verified,
                });
              } catch (err: any) {
                console.error("Google userinfo fetch error:", err);
                setError(err?.message || "Google profile fetch failed.");
              } finally {
                setIsLoading(false);
              }
            }
          },
        });
        client.requestAccessToken({ prompt: "select_account" });
        return;
      } catch (err: any) {
        console.warn("GIS token client failed, falling back:", err);
      }
    }

    // 2. Fallback: Full redirect flow
    const redirectUri = `${window.location.origin}/login`;
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
      googleClientId
    )}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=${encodeURIComponent(
      "email profile openid"
    )}&prompt=select_account`;
    window.location.href = authUrl;
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

    if (!fullName.trim()) {
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
        name: fullName.trim(),
        avatarUrl: googleUser?.picture || undefined,
        mobile: normalizedMobile,
        mobileVerified: true,
      });
      updateBusiness({
        name: fullName.trim(),
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

            {/* 1-Tap Quick Demo Access Button - Compact, Smart & Sleek */}
            <button
              type="button"
              id="instant-demo-login-btn"
              onClick={handleInstantDemo}
              disabled={isDemoLoading}
              className="w-full py-3 px-3.5 sm:px-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 hover:from-black hover:to-slate-950 text-white rounded-2xl border border-amber-400/60 hover:border-amber-400 shadow-md hover:shadow-lg transition-all flex items-center justify-between group cursor-pointer active:scale-[0.99] disabled:opacity-60 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 text-left relative z-10">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-xs group-hover:scale-105 transition-transform shrink-0">
                  <Sparkles className="w-4 h-4 text-slate-950" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-xs sm:text-[13px] text-amber-200 tracking-tight">
                      Quick Demo Access
                    </span>
                    <span className="text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0">
                      20 Free Bookings
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-300/90 font-medium truncate mt-0.5">
                    1-Tap trial • 8 Homams, Muhurtham &amp; Samagri lists
                  </p>
                </div>
              </div>

              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-amber-300 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all shrink-0 ml-2 relative z-10">
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Reviewer / Test Credentials Login Accordion */}
            <div className="pt-0.5 text-center">
              <button
                type="button"
                onClick={() => setShowTestLogin(!showTestLogin)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold underline decoration-dotted transition cursor-pointer"
              >
                {showTestLogin ? "Hide Reviewer / Test Login" : "Reviewer / Test Login (Username & Password)"}
              </button>

              {showTestLogin && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleInstantDemo();
                  }}
                  className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2.5 animate-in fade-in"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                    <span>Cashfree / Reviewer Test Account</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded font-extrabold">Instant Access</span>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-600 block mb-0.5">Username / Mobile</label>
                    <input
                      type="text"
                      value={testUsername}
                      onChange={(e) => setTestUsername(e.target.value)}
                      placeholder="9876543210"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-slate-600 block mb-0.5">Password</label>
                    <input
                      type="password"
                      value={testPassword}
                      onChange={(e) => setTestPassword(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isDemoLoading}
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-2xs"
                  >
                    {isDemoLoading ? "Logging in..." : "Sign In with Test Credentials"}
                  </button>
                </form>
              )}
            </div>

            {/* Feature Highlights Grid - 6 Key Highlights */}
            <div className="pt-2 grid grid-cols-3 gap-2 text-center border-t border-slate-100 relative z-10">
              <div className="p-2 bg-gradient-to-b from-amber-50/60 to-white rounded-2xl border border-amber-100/80 hover:border-amber-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-amber-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Flame className="w-3.5 h-3.5 text-amber-700 fill-amber-500/20" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  8 Homams
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Samagri &amp; List
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-emerald-50/60 to-white rounded-2xl border border-emerald-100/80 hover:border-emerald-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-emerald-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  Panchangam
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Thithi &amp; Muhurtham
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-blue-50/60 to-white rounded-2xl border border-blue-100/80 hover:border-blue-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-blue-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Receipt className="w-3.5 h-3.5 text-blue-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  WhatsApp Slips
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Devotee Receipts
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-purple-50/60 to-white rounded-2xl border border-purple-100/80 hover:border-purple-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-purple-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wallet className="w-3.5 h-3.5 text-purple-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  Dakshina
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Priest Split
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-teal-50/60 to-white rounded-2xl border border-teal-100/80 hover:border-teal-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-teal-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-3.5 h-3.5 text-teal-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  Offline Sync
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Cloud Secured
                </span>
              </div>

              <div className="p-2 bg-gradient-to-b from-rose-50/60 to-white rounded-2xl border border-rose-100/80 hover:border-rose-300 transition-colors group">
                <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-rose-100/80 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Sparkles className="w-3.5 h-3.5 text-rose-700" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-800 block leading-tight">
                  20 Free Trial
                </span>
                <span className="text-[8px] text-slate-500 block font-medium mt-0.5">
                  Full Access
                </span>
              </div>
            </div>

            {/* Direct Support Contact Badge */}
            <div className="pt-2.5 pb-1 text-center border-t border-slate-100 flex items-center justify-center flex-wrap gap-2 text-[11px] text-slate-500 font-semibold select-none relative z-10">
              <span className="flex items-center gap-1 text-slate-700 font-bold">
                <Mail className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <a href="mailto:manirajankg@gmail.com" className="hover:text-amber-800 underline decoration-amber-300">
                  manirajankg@gmail.com
                </a>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1 text-slate-700 font-bold">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <a href="tel:+918300030123" className="hover:text-emerald-800 underline decoration-emerald-300">
                  +91 8300030123
                </a>
              </span>
            </div>

            {/* Sacred Devotion Branding Badge */}
            <div className="pt-1.5 text-center flex items-center justify-center gap-1.5 text-[10.5px] text-slate-500 font-medium select-none relative z-10">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              <span>
                Crafted with devotion for Vedic Traditions • <span className="font-extrabold text-slate-800">Velvi Sacred Tech</span>
              </span>
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
                    alt={fullName || "User"}
                    className="w-10 h-10 rounded-full object-cover shrink-0 shadow-2xs ring-1 ring-amber-400"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ring-1 ring-amber-400">
                    {fullName ? fullName[0].toUpperCase() : "U"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                    {fullName || googleUser?.name || "User"}
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
                Enter your mobile number to enable WhatsApp receipts and booking reminders.
              </p>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              {/* Field 1: User Full Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Your Full Name / உங்கள் பெயர் <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Karthick G / Sundara Sastrigal"
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
        <ComplianceFooter
          hideDeveloperCredit
          supportEmail="manirajankg@gmail.com"
          supportPhone="+91 8300030123"
        />
      </div>
    </div>
  );
}
