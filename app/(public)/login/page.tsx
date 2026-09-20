"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import Link from "next/link";
import { User, Phone, CheckCircle2, AlertCircle, Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithCredentials, loginDemo, loginWithGoogle } = useAuth();

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [confirmMobile, setConfirmMobile] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Clean only numbers
  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobile(digits);
    setError("");
  };

  const handleConfirmMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setConfirmMobile(digits);
    setError("");
  };

  const isMobileTenDigits = mobile.length === 10;
  const isConfirmTenDigits = confirmMobile.length === 10;
  const isMobileMatching = confirmMobile.length > 0 && mobile === confirmMobile;
  const isMobileMismatched = confirmMobile.length > 0 && mobile !== confirmMobile;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("உங்கள் பெயரை உள்ளிடவும் (Please enter your name)");
      return;
    }

    if (mobile.length !== 10) {
      setError("சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (Enter valid 10-digit mobile number)");
      return;
    }

    if (mobile !== confirmMobile) {
      setError("இரண்டு மொபைல் எண்களும் ஒன்றாக இருக்க வேண்டும் (Mobile numbers do not match)");
      return;
    }

    setIsLoading(true);
    try {
      await loginWithCredentials(name.trim(), mobile);
      router.push("/app");
    } catch (err: any) {
      setError(err?.message || "உள்நுழைவதில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);
    setError("");
    try {
      await loginDemo();
      router.push("/app");
    } catch (err: any) {
      setError(err?.message || "டெமோ நுழைவு பிழை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithGoogle("ravi.iyer@gmail.com", "Ravi Iyer");
      router.push("/app");
    } catch (err: any) {
      setError(err?.message || "Google உள்நுழைவு பிழை.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-center px-3 sm:px-4 py-8 sm:py-12">
      <div className="max-w-md w-full mx-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <VelviLogo size="xl" variant="full" showTagline={true} />
          <p className="text-xs text-slate-600 font-bold pt-1">
            வேத ஜோதிட, பூஜை மற்றும் ஹோம முன்பதிவு செயலி
          </p>
        </div>

        {/* 1. INSTANT DEMO LOGIN CARD (முதன்மையான 1-கிளிக் டெமோ நுழைவு) */}
        <div className="bg-gradient-to-br from-amber-500/15 via-amber-100/40 to-emerald-500/15 rounded-3xl p-4 sm:p-5 border-2 border-amber-400 shadow-sm relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-xs">
                <Zap className="w-4 h-4 text-amber-100 fill-amber-100" />
              </div>
              <div>
                <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                  உடனடி டெமோ நுழைவு (Instant Demo Login)
                </h3>
                <p className="text-[10.5px] text-slate-600 font-semibold">
                  எதையும் தட்டச்சு செய்யாமல் 1-கிளிக்கில் செயலியைப் பார்க்க
                </p>
              </div>
            </div>
            <span className="text-[9px] font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
              1-TAP
            </span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-2xl border border-amber-200/80 flex items-center justify-between text-xs">
            <div className="min-w-0">
              <span className="font-black text-slate-900 block truncate">
                ரவி ஐயர் (Ravi Iyer)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                ஸ்ரீ வெங்கடேஸ்வரா வேத சர்வீசஸ் • +91 98765 43210
              </span>
            </div>
          </div>

          <button
            type="button"
            id="instant-demo-login-btn"
            onClick={handleDemoLogin}
            disabled={isDemoLoading || isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md hover:shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>
              {isDemoLoading ? "உள்நுழைகிறது..." : "⚡ நேரடி டெமோ நுழைவு (Instant Demo Login)"}
            </span>
          </button>
        </div>

        {/* 2. REGULAR USER LOGIN & ONBOARDING FORM */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-800" />
              <span>புதிய நுழைவு (User Sign In / Register)</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              உங்கள் பெயர் மற்றும் மொபைல் எண்ணை உள்ளிட்டு தொடரவும்
            </p>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Field 1: User / Vadhyar Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                உங்கள் பெயர் / Vadhyar or Priest Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="எ.கா. சுந்தர சாஸ்திரிகள் (Sundara Sastrigal)"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setError("");
                  }}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  required
                />
              </div>
            </div>

            {/* Field 2: Mobile Number */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                மொபைல் எண் / Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold border-r border-slate-200 pr-2 my-1.5">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="98400 12345"
                  value={mobile}
                  onChange={(e) => handleMobileChange(e.target.value)}
                  maxLength={10}
                  className="w-full pl-16 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-900 tracking-wider placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  required
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500 mt-1 px-1">
                <span>10 இலக்க இந்திய மொபைல் எண்</span>
                <span className={mobile.length === 10 ? "text-emerald-700 font-bold" : ""}>
                  {mobile.length}/10
                </span>
              </div>
            </div>

            {/* Field 3: Confirm Mobile Number (உறுதிப்படுத்தல்) */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                மொபைல் எண்ணை மீண்டும் உள்ளிடவும் / Confirm Mobile Number <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 text-xs font-bold border-r border-slate-200 pr-2 my-1.5">
                  🇮🇳 +91
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="மறுமுறை உள்ளிடவும்"
                  value={confirmMobile}
                  onChange={(e) => handleConfirmMobileChange(e.target.value)}
                  maxLength={10}
                  className={`w-full pl-16 pr-9 py-2.5 bg-slate-50 border rounded-2xl text-xs font-black tracking-wider placeholder:text-slate-400 focus:outline-none focus:bg-white transition ${
                    isMobileMatching
                      ? "border-emerald-500 text-emerald-950 focus:border-emerald-600"
                      : isMobileMismatched
                      ? "border-rose-300 text-rose-900 focus:border-rose-500"
                      : "border-slate-200 text-slate-900 focus:border-emerald-600"
                  }`}
                  required
                />
                {isMobileMatching && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Match Feedback */}
              {isMobileMatching && (
                <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1 px-1 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>மொபைல் எண் பொருந்துகிறது (Mobile numbers match)</span>
                </p>
              )}
              {isMobileMismatched && confirmMobile.length > 3 && (
                <p className="text-[10px] font-bold text-rose-600 mt-1 flex items-center gap-1 px-1 animate-in fade-in">
                  <AlertCircle className="w-3 h-3 text-rose-500" />
                  <span>எண்கள் பொருந்தவில்லை, சரிபார்க்கவும் (Numbers do not match)</span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isDemoLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? "உள்நுழைகிறது..." : "தொடர்க / உள்நுழைக (Continue to App)"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Secondary Google Login Alternative */}
          <div className="pt-3 border-t border-slate-100 text-center space-y-2">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || isDemoLoading}
              className="w-full py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs text-slate-700 flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
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
              <span>Google மூலம் உள்நுழைக (Continue with Google)</span>
            </button>

            <p className="text-[10px] text-slate-400 font-medium">
              கடவுச்சொல் தேவையில்லை • Safe & Instant Sign-in
            </p>
          </div>
        </div>

        {/* Developer Credit */}
        <div className="text-center pt-1">
          <DeveloperCredit />
        </div>
      </div>
    </div>
  );
}
