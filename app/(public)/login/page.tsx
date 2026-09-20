"use client";

import React, { useState } from "react";
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
  Plus,
  Mail,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

interface GoogleAccountOption {
  email: string;
  name: string;
  mobile?: string;
  bizName?: string;
  isExisting?: boolean;
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginDemo, updateUser, updateBusiness } = useAuth();

  const [step, setStep] = useState<"login" | "google_picker" | "mobile_setup">("login");
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccountOption>({
    email: "ravi.iyer@gmail.com",
    name: "Ravi Iyer",
  });

  // Mobile Setup Form State
  const [userName, setUserName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  // Custom Account modal state
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customEmail, setCustomEmail] = useState("");

  const sampleGoogleAccounts: GoogleAccountOption[] = [
    {
      name: "Ravi Iyer",
      email: "ravi.iyer@gmail.com",
      mobile: "+91 98765 43210",
      bizName: "ஸ்ரீ வெங்கடேஸ்வரா வேத சர்வீசஸ்",
      isExisting: true,
    },
    {
      name: "சுந்தர சாஸ்திரிகள் (Sundara Sastrigal)",
      email: "sundara.sastrigal@gmail.com",
      isExisting: false,
    },
  ];

  // Clean only numbers for mobile
  const handleMobileChange = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    setMobileNumber(digits);
    setError("");
  };

  // 1-Tap Instant Demo Login
  const handleInstantDemo = async () => {
    setIsDemoLoading(true);
    setError("");
    try {
      await loginDemo();
      router.push("/app/calendar");
    } catch (err: any) {
      setError(err?.message || "டெமோ நுழைவு பிழை. மீண்டும் முயற்சிக்கவும்.");
    } finally {
      setIsDemoLoading(false);
    }
  };

  // Google Account Select
  const handleSelectGoogleAccount = async (account: GoogleAccountOption) => {
    setIsLoading(true);
    setError("");
    try {
      const loggedInUser = await loginWithGoogle(account.email, account.name);
      setSelectedAccount(account);
      setUserName(account.name);

      // If user already has a mobile number and is existing, go directly to app
      if (loggedInUser.mobile && loggedInUser.mobile.length >= 10 && account.isExisting) {
        router.push("/app/calendar");
        return;
      }

      // Otherwise, proceed to Step 2 (Mobile Number Setup)
      setMobileNumber(loggedInUser.mobile ? loggedInUser.mobile.replace(/\D/g, "").slice(-10) : "");
      setStep("mobile_setup");
    } catch (err: any) {
      setError(err?.message || "Google உள்நுழைவில் பிழை ஏற்பட்டது.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Custom Google Input
  const handleCustomGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customEmail.trim()) {
      setError("பெயர் மற்றும் மின்னஞ்சலை உள்ளிடவும்.");
      return;
    }
    const acc: GoogleAccountOption = {
      name: customName.trim(),
      email: customEmail.trim().toLowerCase(),
      isExisting: false,
    };
    setShowCustomInput(false);
    await handleSelectGoogleAccount(acc);
  };

  // Complete Mobile Number Setup (Step 2 Submit)
  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!userName.trim()) {
      setError("உங்கள் பெயரை உள்ளிடவும் (Please enter name)");
      return;
    }

    if (mobileNumber.length !== 10) {
      setError("சரியான 10 இலக்க மொபைல் எண்ணை உள்ளிடவும் (Enter valid 10-digit mobile number)");
      return;
    }

    setIsLoading(true);
    try {
      const normalizedMobile = `+91${mobileNumber}`;
      updateUser({
        name: userName.trim(),
        mobile: normalizedMobile,
        mobileVerified: true,
      });
      updateBusiness({
        iyerName: userName.trim(),
        name: userName.trim(),
        phone: normalizedMobile,
        whatsapp: normalizedMobile,
      });

      router.push("/app/calendar");
    } catch (err: any) {
      setError(err?.message || "விவரங்களை சேமிப்பதில் பிழை ஏற்பட்டது.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col justify-between px-3 sm:px-4 py-6 sm:py-10">
      <div className="max-w-md w-full mx-auto my-auto space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <VelviLogo size="md" variant="full" showTagline={true} />
          <p className="text-[11.5px] text-slate-600 font-bold pt-0.5">
            வேத ஜோதிட, பூஜை மற்றும் ஹோம முன்பதிவு செயலி
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-800 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ======================================================================= */}
        {/* STEP 1: ELEGANT GOOGLE SIGN-IN SCREEN */}
        {/* ======================================================================= */}
        {step === "login" && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-md shadow-amber-950/5 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
                வரவேற்கிறோம் (Welcome)
              </h2>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                உங்கள் ஆன்மீக சேவைகள் மற்றும் முன்பதிவுகளை எளிதாக நிர்வகிக்க உள்நுழையவும்
              </p>
            </div>

            {/* Primary Google Login Button */}
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setStep("google_picker")}
                disabled={isLoading || isDemoLoading}
                className="w-full py-3.5 px-4 bg-white hover:bg-amber-50/40 text-slate-800 font-extrabold text-xs sm:text-sm rounded-2xl border-2 border-slate-200 hover:border-amber-300 shadow-xs hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official Google G SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                <span>Google மூலம் தொடர்க (Continue with Google)</span>
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10.5px] font-semibold text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>100% பாதுகாப்பானது • Password தேவையில்லை</span>
              </div>
            </div>

            {/* Subtle Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1" />
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                அல்லது (OR)
              </span>
              <div className="h-px bg-slate-200 flex-1" />
            </div>

            {/* 1-Tap Quick Demo Access Button */}
            <button
              type="button"
              id="instant-demo-login-btn"
              onClick={handleInstantDemo}
              disabled={isDemoLoading || isLoading}
              className="w-full p-3 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 hover:from-amber-100 hover:to-amber-100 text-amber-950 font-bold text-xs rounded-2xl border border-amber-300 transition flex items-center justify-between group cursor-pointer shadow-2xs active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-2xs">
                  <Zap className="w-4 h-4 fill-amber-100" />
                </div>
                <div className="text-left">
                  <div className="font-black text-xs text-amber-950 flex items-center gap-1.5">
                    <span>டெமோ கணக்கு (Demo Login)</span>
                    <span className="text-[9px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded font-extrabold">
                      1-TAP
                    </span>
                  </div>
                  <p className="text-[10px] text-amber-800 font-semibold">
                    ரவி ஐயர் (Ravi Iyer) • நேரடி அணுகல்
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-amber-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* STEP: GOOGLE ACCOUNT PICKER MODAL / VIEW */}
        {/* ======================================================================= */}
        {step === "google_picker" && (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center pb-1 border-b border-slate-100">
              <div className="inline-flex p-2 bg-slate-100 rounded-2xl mb-2">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
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
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                Google மூலம் உள்நுழைக
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Velvi Booking App-க்கு செல்ல ஒரு கணக்கைத் தேர்ந்தெடுக்கவும்
              </p>
            </div>

            {/* Account List */}
            <div className="space-y-2">
              {sampleGoogleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleSelectGoogleAccount(acc)}
                  disabled={isLoading}
                  className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 text-left transition flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                      {acc.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 truncate">
                        {acc.name}
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-medium truncate">
                        {acc.email}
                      </div>
                      {acc.isExisting && (
                        <span className="inline-block text-[9px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                          பதிவு செய்யப்பட்ட கணக்கு ✅
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}

              {/* Use Another Account */}
              {!showCustomInput ? (
                <button
                  type="button"
                  onClick={() => setShowCustomInput(true)}
                  className="w-full p-2.5 rounded-2xl border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>மற்றொரு Google கணக்கைப் பயன்படுத்த (Use another account)</span>
                </button>
              ) : (
                <form onSubmit={handleCustomGoogleSubmit} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      உங்கள் பெயர் (Your Name)
                    </label>
                    <input
                      type="text"
                      placeholder="எ.கா. நடராஜ சாஸ்திரிகள்"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-slate-700 mb-0.5">
                      Google மின்னஞ்சல் (Gmail)
                    </label>
                    <input
                      type="email"
                      placeholder="nataraja.iyer@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-2xs"
                  >
                    இணைக்க & தொடர (Connect & Continue)
                  </button>
                </form>
              )}
            </div>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => {
                setStep("login");
                setShowCustomInput(false);
              }}
              className="w-full py-2 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
            >
              ← ரத்து செய்க (Cancel)
            </button>
          </div>
        )}

        {/* ======================================================================= */}
        {/* STEP 2: MOBILE NUMBER & PROFILE SETUP (அடுத்த பக்கம்) */}
        {/* ======================================================================= */}
        {step === "mobile_setup" && (
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-md shadow-amber-950/5 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Connected Google Account Header */}
            <div className="p-3 bg-gradient-to-br from-amber-50/80 to-emerald-50/50 rounded-2xl border border-amber-200/80 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-full bg-emerald-900 text-amber-300 flex items-center justify-center font-black text-sm shrink-0 shadow-2xs ring-1 ring-amber-400">
                  {selectedAccount.name[0]?.toUpperCase() || "V"}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-extrabold text-xs text-slate-900 truncate">
                    {selectedAccount.name}
                  </h4>
                  <p className="text-[10.5px] text-slate-500 font-semibold truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                    {selectedAccount.email}
                  </p>
                </div>
              </div>
              <span className="text-[9.5px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                <span>Google</span>
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-800" />
                <span>மொபைல் எண்ணை உள்ளிடவும் (Mobile Number)</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                முன்பதிவு ரசீதுகள் மற்றும் பக்தர்களின் தொடர்புக்காக உங்கள் மொபைல் எண்ணை உள்ளிடவும்
              </p>
            </div>

            <form onSubmit={handleCompleteSetup} className="space-y-4">
              {/* Field 1: Vadhyar / Priest Name */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  உங்கள் பெயர் / Vadhyar or Priest Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="எ.கா. ரவி ஐயர்"
                    required
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* Field 2: Clean 10-Digit Indian Mobile Number */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  மொபைல் எண் / Mobile Number <span className="text-rose-500">*</span>
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
                  <span>10 இலக்க இந்திய மொபைல் எண்</span>
                  <span className={mobileNumber.length === 10 ? "text-emerald-700 font-bold" : ""}>
                    {mobileNumber.length}/10
                  </span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || mobileNumber.length !== 10}
                className="w-full py-3 px-4 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-sm hover:shadow-md transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer mt-1"
              >
                <span>{isLoading ? "சேமிக்கிறது..." : "செயலியைத் தொடங்குக (Complete Setup & Open App)"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Back to Change Account */}
              <button
                type="button"
                onClick={() => setStep("google_picker")}
                className="w-full py-1.5 text-center text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>மாற்று Google கணக்கு (Switch Account)</span>
              </button>
            </form>
          </div>
        )}

        {/* Developer Credit Footer */}
        <div className="text-center pt-2">
          <DeveloperCredit />
        </div>
      </div>
    </div>
  );
}
