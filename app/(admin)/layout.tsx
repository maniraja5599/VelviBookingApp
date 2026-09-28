"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  CreditCard,
  Gift,
  History,
  ArrowLeft,
  Shield,
  Menu,
  X,
  Lock,
  LogOut,
  AlertTriangle,
  CheckCircle,
  Crown,
  Edit3,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Clock,
  Globe,
  Tag,
  Palette,
  Code2,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, loginWithGoogle, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [adminSessionVerified, setAdminSessionVerified] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccessNotice, setLoginSuccessNotice] = useState("");
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [googleVerifiedProfile, setGoogleVerifiedProfile] = useState<{
    email: string;
    name?: string;
    picture?: string;
  } | null>(null);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "239924321651-f69j4bdmp648o08hg4n31jf46i7re4rj.apps.googleusercontent.com";

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const verified = sessionStorage.getItem("velvi_super_admin_verified") === "true";
      const loginAt = Number(sessionStorage.getItem("velvi_super_admin_login_at") || 0);
      const TEN_MINUTES_MS = 10 * 60 * 1000;

      if (verified && loginAt && Date.now() - loginAt > TEN_MINUTES_MS) {
        // 10 minutes exceeded, force logout
        sessionStorage.removeItem("velvi_super_admin_verified");
        sessionStorage.removeItem("velvi_super_admin_login_at");
        setAdminSessionVerified(false);
      } else {
        setAdminSessionVerified(verified);
      }
    }
  }, []);

  // 10-Minute Auto Logout Inactivity / Session Monitor
  React.useEffect(() => {
    if (!adminSessionVerified) {
      setSecondsRemaining(null);
      return;
    }

    const checkTimeout = () => {
      if (typeof window === "undefined") return;
      const loginAt = Number(sessionStorage.getItem("velvi_super_admin_login_at") || 0);
      if (!loginAt) return;
      const TEN_MINUTES_MS = 10 * 60 * 1000;
      const elapsed = Date.now() - loginAt;
      const remainingMs = TEN_MINUTES_MS - elapsed;

      if (remainingMs <= 0) {
        sessionStorage.removeItem("velvi_super_admin_verified");
        sessionStorage.removeItem("velvi_super_admin_login_at");
        setAdminSessionVerified(false);
        setSecondsRemaining(null);
        setLoginError("Session expired (10 minutes limit reached). Please login again.");
      } else {
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
      }
    };

    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [adminSessionVerified]);

  // Check URL hash for Google OAuth 2.0 access_token redirect callback
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash;
    if (hash && hash.includes("access_token=")) {
      setIsSigningIn(true);
      setLoginError("");
      const params = new URLSearchParams(hash.substring(1));
      const accessToken = params.get("access_token");
      const errorParam = params.get("error");

      if (errorParam) {
        setLoginError(`Google sign-in was cancelled or failed (${errorParam}).`);
        setIsSigningIn(false);
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }

      if (accessToken) {
        window.history.replaceState(null, "", window.location.pathname);
        fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
          .then((res) => {
            if (!res.ok) throw new Error("Failed to verify Google profile.");
            return res.json();
          })
          .then(async (info) => {
            if (!info?.email) throw new Error("Google account did not provide an email.");
            const email = info.email.trim().toLowerCase();
            const isPrimarySuperAdmin = email === "manirajankg@gmail.com";
            const isInvitedAdmin = db.users.some(
              (u) =>
                u.email?.trim().toLowerCase() === email &&
                (u.role === "ADMIN" || u.role === "SUPER_ADMIN")
            );

            if (!isPrimarySuperAdmin && !isInvitedAdmin) {
              setLoginError(
                `Access Denied: (${info.email}) is not authorized. Only manirajankg@gmail.com is authorized as Super Admin.`
              );
              return;
            }

            setAdminEmailInput(email);
            setGoogleVerifiedProfile(info);
            setLoginSuccessNotice(
              `Google profile verified (${info.email}). Please enter your Security PIN to unlock.`
            );
            setLoginError("");
          })
          .catch((err) => {
            console.error("Admin Google OAuth verification error:", err);
            setLoginError(err?.message || "Google sign-in failed. Please try again.");
          })
          .finally(() => {
            setIsSigningIn(false);
          });
      }
    }
  }, []);

  // Pre-fill email if already signed in with primary Super Admin account
  React.useEffect(() => {
    if (currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com" && !adminEmailInput) {
      setAdminEmailInput("manirajankg@gmail.com");
    }
  }, [currentUser, adminEmailInput]);

  const isSuperAdmin = Boolean(
    currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com"
  );

  const isEditorAdmin = Boolean(
    (currentUser?.role === "ADMIN" ||
      db.users.some(
        (u) =>
          u.email?.trim().toLowerCase() === currentUser?.email?.trim().toLowerCase() &&
          u.role === "ADMIN"
      )) &&
      !isSuperAdmin
  );

  const hasAdminAccess = isSuperAdmin || isEditorAdmin;
  const isUnlocked = adminSessionVerified && hasAdminAccess;

  const handleGoogleOAuthRedirect = () => {
    setIsSigningIn(true);
    setLoginError("");
    setLoginSuccessNotice("");

    // Try Google Identity Services (GIS) token client popup mode (authorized Javascript origins, no redirect_uri_mismatch)
    if (typeof window !== "undefined" && (window as any).google?.accounts?.oauth2) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: "email profile openid",
          callback: async (tokenResponse: any) => {
            if (tokenResponse.error) {
              setLoginError(`Google sign-in error: ${tokenResponse.error}`);
              setIsSigningIn(false);
              return;
            }
            try {
              const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              const info = await res.json();
              if (info?.email) {
                const email = info.email.trim().toLowerCase();
                if (email !== "manirajankg@gmail.com") {
                  setLoginError(
                    `Access Denied: (${info.email}) is not authorized as Super Administrator.`
                  );
                  setIsSigningIn(false);
                  return;
                }
                setAdminEmailInput(email);
                setGoogleVerifiedProfile(info);
                setLoginSuccessNotice(`Google profile verified (${info.email}). Please enter your Security PIN to unlock.`);
              }
            } catch (err: any) {
              setLoginError(err?.message || "Failed to verify Google profile");
            } finally {
              setIsSigningIn(false);
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn("GIS token client error:", err);
      }
    }

    // Fallback: Redirect to /login which is an authorized OAuth callback URI
    window.location.href = `/login?admin=1&next=${encodeURIComponent("/admin")}`;
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccessNotice("");

    const targetEmail = adminEmailInput.trim().toLowerCase();
    const targetPin = adminPinInput.trim();

    if (!targetEmail) {
      setLoginError("Super Admin Gmail is required.");
      return;
    }

    if (targetEmail !== "manirajankg@gmail.com") {
      setLoginError(
        "Access Denied: You are not authorized as the Super Administrator."
      );
      return;
    }

    if (targetPin !== "5599") {
      setLoginError("Incorrect Security PIN. Access Denied.");
      return;
    }

    setIsSigningIn(true);
    try {
      await loginWithGoogle(
        "manirajankg@gmail.com",
        googleVerifiedProfile?.name || "Mani Raja",
        googleVerifiedProfile?.picture
      );
      sessionStorage.setItem("velvi_super_admin_verified", "true");
      sessionStorage.setItem("velvi_super_admin_login_at", Date.now().toString());
      setAdminSessionVerified(true);
      setSecondsRemaining(600);
    } catch (err: any) {
      setLoginError(err?.message || "Super Admin authorization failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAdminSignOut = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("velvi_super_admin_verified");
      sessionStorage.removeItem("velvi_super_admin_login_at");
      setAdminSessionVerified(false);
      setAdminPinInput("");
      setAdminEmailInput("");
      setSecondsRemaining(null);
      setGoogleVerifiedProfile(null);
      setLoginSuccessNotice("");
      setLoginError("");
    }
  };

  // Loading state
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-slate-950 flex items-center justify-center text-2xl shadow-md animate-pulse">
          🪔
        </div>
        <p className="text-xs text-slate-600 font-bold">Verifying Administrative Privileges...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GATE 1: SUPER ADMIN LOGIN REQUIRED (MANDATORY EMAIL + PIN 5599 GATE)
  // ---------------------------------------------------------------------------
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 selection:bg-amber-200 selection:text-amber-950 relative overflow-hidden">
        {/* Ambient sacred warm glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-amber-200/40 via-amber-100/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-8 space-y-5 shadow-2xl text-center relative z-10 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center space-y-2">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-3xl shadow-lg ring-4 ring-amber-200">
                🪔
              </div>
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-black text-emerald-950 tracking-tight">Velvi Platform Administration</h1>
              <p className="text-xs text-amber-800 font-bold mt-0.5">Super Admin Executive Console (நிர்வாகி)</p>
            </div>
            
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Security Authorization Gate</span>
            </div>

            <p className="text-xs text-slate-500 max-w-xs pt-1 leading-relaxed">
              Super Admin access is strictly restricted. Enter your authorized administrator email and 4-digit security PIN to proceed.
            </p>
          </div>

          {loginSuccessNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs text-left flex items-start gap-2.5 shadow-2xs animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{loginSuccessNotice}</span>
            </div>
          )}

          {loginError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs text-left flex items-start gap-2.5 shadow-2xs animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold leading-relaxed">{loginError}</span>
            </div>
          )}

          {/* Secure Email + PIN Form */}
          <form onSubmit={handlePinSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Administrator Email</span>
                </span>
                <span className="text-[10px] text-amber-800 font-mono font-bold lowercase">super-admin</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={adminEmailInput}
                  onChange={(e) => {
                    setAdminEmailInput(e.target.value);
                    setLoginError("");
                  }}
                  placeholder="admin@velvi.date"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-slate-900 text-xs font-mono focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Security PIN</span>
                </label>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={adminPinInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                    setAdminPinInput(val);
                    setLoginError("");
                  }}
                  placeholder="••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-slate-900 font-mono text-center text-lg tracking-[0.3em] font-bold focus:outline-none transition shadow-2xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSigningIn || adminPinInput.length !== 4}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-900 hover:to-emerald-950 text-amber-200 font-black text-xs sm:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{isSigningIn ? "Verifying Credentials..." : "Unlock Super Admin Console"}</span>
            </button>
          </form>

          {/* Optional Google Account Switcher */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-400 bg-white px-3">
              Google OAuth Authentication
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleOAuthRedirect}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-2xs"
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
              <span>Authenticate with Google</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <Link href="/app" className="hover:text-emerald-800 flex items-center gap-1.5 transition font-semibold">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to App</span>
            </Link>
            <span className="text-[10px] font-mono font-bold text-emerald-800 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              velvi.date • Secure
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GATE 3: AUTHORIZED ADMIN (SUPER ADMIN OR EDITOR ADMIN) -> FULL CONSOLE
  // ---------------------------------------------------------------------------
  const navItems = [
    { href: "/admin", label: "Dashboard", subLabel: "Executive Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Validity", subLabel: "Tenant Accounts", icon: Users },
    { href: "/admin/coupons", label: "Coupons & Promos", subLabel: "Discount Codes", icon: Tag },
    { href: "/admin/subscriptions", label: "Subscriptions", subLabel: "Plans & Validity", icon: Sparkles },
    { href: "/admin/payments", label: "Cashfree Payments", subLabel: "Gateway Ledger", icon: CreditCard },
    { href: "/admin/referrals", label: "Referrals & Rewards", subLabel: "Affiliate Ledger", icon: Gift },
    { href: "/admin/traffic", label: "Web Traffic", subLabel: "Live Geo Telemetry", icon: Globe },
    { href: "/admin/audit-logs", label: "Audit Logs", subLabel: "Security History", icon: History },
    { href: "/admin/branding", label: "Platform Branding", subLabel: "Brand & Metadata", icon: Palette },
    { href: "/admin/dev", label: "Developer Specs", subLabel: "Tech Architecture", icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-amber-200 selection:text-amber-950">
      {/* Mobile Top Header */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-sm shadow-2xs">
              🪔
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-xs text-slate-900 tracking-tight">Velvi Super Admin</h1>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                velvi.date
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              {isSuperAdmin ? (
                <span className="text-[8.5px] px-1.5 py-0.2 rounded font-black bg-amber-100 text-amber-900 border border-amber-300">
                  👑 Super Admin
                </span>
              ) : (
                <span className="text-[8.5px] px-1.5 py-0.2 rounded font-black bg-blue-100 text-blue-900 border border-blue-300">
                  ✏️ Associate Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {secondsRemaining !== null && (
            <span
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-mono text-[10px] font-bold shadow-2xs"
              title="Console locks automatically after 10 minutes"
            >
              <Clock className="w-3 h-3 text-amber-700 animate-spin" style={{ animationDuration: "12s" }} />
              <span>
                {Math.floor(secondsRemaining / 60)}:
                {String(secondsRemaining % 60).padStart(2, "0")}
              </span>
            </span>
          )}
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 hover:text-rose-700 hover:border-rose-300 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 hover:text-slate-900 transition cursor-pointer"
            title="Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-amber-700" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link
            href="/app"
            className="px-2 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10.5px] font-extrabold transition flex items-center gap-1 active:scale-95 shadow-2xs"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>App</span>
          </Link>
        </div>
      </header>

      {/* Mobile Dropdown Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-xl border-b border-amber-200 p-3.5 space-y-1.5 shadow-xl animate-in slide-in-from-top-2 duration-200">
          <div className="p-3 mb-2 bg-amber-50/70 rounded-2xl border border-amber-200 text-xs flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Active Session:</div>
              <div className="font-mono text-slate-900 text-[11px] truncate font-extrabold">{currentUser?.email || "manirajankg@gmail.com"}</div>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
              Verified
            </span>
          </div>
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-100 to-amber-100/60 text-emerald-950 border border-emerald-300 font-extrabold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-800" : "text-slate-500"}`} />
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{item.label}</div>
                    <div className="text-[10px] text-slate-500">{item.subLabel}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Left Sidebar (Clean Velvi white/cream theme) */}
      <aside className="hidden md:flex w-64 bg-white border-r border-amber-200/80 p-4 flex-col justify-between shrink-0 shadow-2xs min-h-screen sticky top-0">
        <div className="space-y-4">
          {/* Logo & Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-slate-950 font-black flex items-center justify-center text-base shadow-2xs ring-2 ring-amber-200">
                  🪔
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-sm text-slate-900 tracking-tight flex items-center gap-1.5">
                  Velvi Super Admin
                </h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9.5px] text-amber-800 font-mono font-bold">velvi.date</span>
                  <span className="text-[9px] text-emerald-800 font-bold bg-emerald-100 px-1 rounded border border-emerald-200">Production</span>
                </div>
              </div>
            </div>

            <Link
              href="/app"
              className="p-1.5 hover:bg-amber-50 rounded-xl text-slate-500 hover:text-emerald-900 transition cursor-pointer"
              title="Return to User App"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Active Admin Profile Card */}
          <div className="p-3 bg-gradient-to-br from-amber-50/80 via-white to-emerald-50/40 rounded-2xl border border-amber-200/80 text-xs space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Console Access</span>
              {isSuperAdmin ? (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs">
                  👑 Super Admin
                </span>
              ) : (
                <span className="text-[9px] px-2 py-0.5 rounded-full font-black bg-blue-100 text-blue-900 border border-blue-300">
                  ✏️ Associate Admin
                </span>
              )}
            </div>
            <div className="font-mono text-slate-900 text-[11px] truncate font-bold bg-white px-2.5 py-1.5 rounded-xl border border-slate-200 flex items-center gap-1.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="truncate">{currentUser?.email || "manirajankg@gmail.com"}</span>
            </div>
            
            {/* Session countdown */}
            {secondsRemaining !== null && (
              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-700" />
                  <span>Session Lock:</span>
                </span>
                <span className="font-mono font-bold text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded border border-amber-200">
                  {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-100/90 to-amber-100/60 text-emerald-950 border-l-3 border-emerald-700 font-extrabold shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition group-hover:scale-110 shrink-0 ${isActive ? "text-emerald-800" : "text-slate-500"}`} />
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 text-xs truncate leading-snug">{item.label}</div>
                    <div className="text-[9.5px] text-slate-500 truncate leading-snug">{item.subLabel}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="w-full py-2.5 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>

          <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-[11px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-amber-900 font-bold">
              <span className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-700" />
                <span>Security Engine Active</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-600 leading-snug">
              Encrypted Production Console: <strong className="text-slate-800 font-mono">velvi.date</strong>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}



