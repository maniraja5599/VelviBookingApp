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
  Mail,
  KeyRound,
  Clock,
  Globe,
  Tag,
  Palette,
  Code2,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { VelviLogo } from "@/components/ui/VelviLogo";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, loginWithGoogle, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [adminSessionVerified, setAdminSessionVerified] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccessNotice, setLoginSuccessNotice] = useState("");
  // Email field — NEVER pre-filled from session
  const [adminEmailInput, setAdminEmailInput] = useState("");
  const [adminPinInput, setAdminPinInput] = useState("");
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [googleVerifiedProfile, setGoogleVerifiedProfile] = useState<{
    email: string;
    name?: string;
    picture?: string;
  } | null>(null);
  // Whether Google has verified the email (shows PIN step)
  const [googleVerified, setGoogleVerified] = useState(false);

  const googleClientId =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "239924321651-f69j4bdmp648o08hg4n31jf46i7re4rj.apps.googleusercontent.com";

  // ── Session persistence & auto-unlock if already logged in as Super Admin ──
  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const userEmail = currentUser?.email?.trim().toLowerCase();
      const isAlreadySuperAdmin = userEmail === "manirajankg@gmail.com" || currentUser?.role === "SUPER_ADMIN";

      if (isAlreadySuperAdmin) {
        // Automatically grant and persist admin session without prompting again!
        sessionStorage.setItem("velvi_super_admin_verified", "true");
        sessionStorage.setItem("velvi_super_admin_login_at", Date.now().toString());
        setAdminSessionVerified(true);
        return;
      }

      const verified = sessionStorage.getItem("velvi_super_admin_verified") === "true";
      const loginAt = Number(sessionStorage.getItem("velvi_super_admin_login_at") || 0);
      const THIRTY_MINUTES_MS = 30 * 60 * 1000;
      if (verified && loginAt && Date.now() - loginAt > THIRTY_MINUTES_MS) {
        sessionStorage.removeItem("velvi_super_admin_verified");
        sessionStorage.removeItem("velvi_super_admin_login_at");
        setAdminSessionVerified(false);
      } else {
        setAdminSessionVerified(verified);
      }
    }
  }, [currentUser]);

  // ── 30-minute session countdown ──────────────────────────────────────────────
  React.useEffect(() => {
    if (!adminSessionVerified) {
      setSecondsRemaining(null);
      return;
    }
    const checkTimeout = () => {
      if (typeof window === "undefined") return;
      const loginAt = Number(sessionStorage.getItem("velvi_super_admin_login_at") || 0);
      if (!loginAt) return;
      const remaining = 30 * 60 * 1000 - (Date.now() - loginAt);
      if (remaining <= 0) {
        sessionStorage.removeItem("velvi_super_admin_verified");
        sessionStorage.removeItem("velvi_super_admin_login_at");
        setAdminSessionVerified(false);
        setSecondsRemaining(null);
        setLoginError("Session expired (30 minutes). Please sign in again.");
      } else {
        setSecondsRemaining(Math.ceil(remaining / 1000));
      }
    };
    checkTimeout();
    const interval = setInterval(checkTimeout, 1000);
    return () => clearInterval(interval);
  }, [adminSessionVerified]);

  // ── Internal helper: grant session access ───────────────────────────────────
  const grantAdminAccess = async (profile: { email: string; name?: string; picture?: string }) => {
    await loginWithGoogle(
      profile.email,
      profile.name || "Mani Raja",
      profile.picture
    );
    sessionStorage.setItem("velvi_super_admin_verified", "true");
    sessionStorage.setItem("velvi_super_admin_login_at", Date.now().toString());
    setAdminSessionVerified(true);
    setSecondsRemaining(1800);
  };

  // ── Google OAuth callback (hash token from redirect) ────────────────────────
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || !hash.includes("access_token=")) return;

    setIsSigningIn(true);
    setLoginError("");
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    const errorParam = params.get("error");
    window.history.replaceState(null, "", window.location.pathname);

    if (errorParam) {
      setLoginError(`Google sign-in was cancelled or failed (${errorParam}).`);
      setIsSigningIn(false);
      return;
    }

    if (accessToken) {
      fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error("Failed to verify Google profile.");
          return r.json();
        })
        .then(async (info) => {
          if (!info?.email) throw new Error("Google account did not provide email.");
          const email = info.email.trim().toLowerCase();
          const isAuthorized =
            email === "manirajankg@gmail.com" ||
            db.users.some(
              (u) =>
                u.email?.trim().toLowerCase() === email &&
                (u.role === "ADMIN" || u.role === "SUPER_ADMIN")
            );
          if (!isAuthorized) {
            setLoginError(
              `Access Denied: (${info.email}) is not authorized as Super Admin.`
            );
            return;
          }
          // ✅ Google verified → auto-unlock, NO PIN needed
          await grantAdminAccess(info);
          setLoginSuccessNotice(`Signed in as ${info.email} ✓`);
        })
        .catch((err) => {
          setLoginError(err?.message || "Google sign-in failed. Please try again.");
        })
        .finally(() => setIsSigningIn(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // ── Google OAuth popup (GIS token client) ───────────────────────────────────
  const handleGoogleOAuthRedirect = () => {
    setIsSigningIn(true);
    setLoginError("");
    setLoginSuccessNotice("");

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
              if (!info?.email) throw new Error("No email from Google.");
              const email = info.email.trim().toLowerCase();
              const isAuthorized =
                email === "manirajankg@gmail.com" ||
                db.users.some(
                  (u) =>
                    u.email?.trim().toLowerCase() === email &&
                    (u.role === "ADMIN" || u.role === "SUPER_ADMIN")
                );
              if (!isAuthorized) {
                setLoginError(`Access Denied: (${info.email}) is not authorized.`);
                setIsSigningIn(false);
                return;
              }
              // ✅ Auto-unlock without PIN
              await grantAdminAccess(info);
              setLoginSuccessNotice(`Signed in as ${info.email} ✓`);
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

    // Fallback redirect
    window.location.href = `/login?admin=1&next=${encodeURIComponent("/admin")}`;
  };

  // ── Manual PIN submit (email + PIN 5599) ─────────────────────────────────────
  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    const targetEmail = adminEmailInput.trim().toLowerCase();
    const targetPin = adminPinInput.trim();

    if (!targetEmail) {
      setLoginError("Super Admin Gmail is required.");
      return;
    }
    if (targetEmail !== "manirajankg@gmail.com") {
      setLoginError("Access Denied: Only manirajankg@gmail.com is authorized.");
      return;
    }
    if (targetPin !== "5599") {
      setLoginError("Incorrect Security PIN. Access Denied.");
      return;
    }

    setIsSigningIn(true);
    try {
      await grantAdminAccess({
        email: "manirajankg@gmail.com",
        name: googleVerifiedProfile?.name || "Mani Raja",
        picture: googleVerifiedProfile?.picture,
      });
    } catch (err: any) {
      setLoginError(err?.message || "Authorization failed.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAdminSignOut = () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("velvi_super_admin_verified");
      sessionStorage.removeItem("velvi_super_admin_login_at");
    }
    setAdminSessionVerified(false);
    setAdminPinInput("");
    setAdminEmailInput("");
    setSecondsRemaining(null);
    setGoogleVerifiedProfile(null);
    setGoogleVerified(false);
    setLoginSuccessNotice("");
    setLoginError("");
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center space-y-3 p-4">
        <VelviLogo size="sm" showTagline={false} />
        <p className="text-xs text-slate-500 font-semibold">Verifying administrative access...</p>
      </div>
    );
  }

  // ── Lock Screen ──────────────────────────────────────────────────────────────
  if (!isUnlocked) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center p-4 selection:bg-amber-200 selection:text-amber-950 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[460px] h-[460px] bg-gradient-to-tr from-amber-200/30 via-amber-100/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-[400px] bg-white rounded-3xl border border-amber-200/90 p-6 sm:p-7 space-y-5 shadow-xl relative z-10 animate-in zoom-in-95 duration-200">
          {/* Logo + Title */}
          <div className="flex flex-col items-center space-y-3 text-center">
            <VelviLogo size="md" showTagline={false} />
            <div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Super Admin Console</h1>
              <p className="text-[11px] text-amber-800 font-bold mt-0.5">நிர்வாகி • velvi.date</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Secure Authorization Gate</span>
            </div>
          </div>

          {/* Notices */}
          {loginSuccessNotice && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-start gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{loginSuccessNotice}</span>
            </div>
          )}
          {loginError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{loginError}</span>
            </div>
          )}

          {/* Google Sign In — PRIMARY */}
          <div className="space-y-2">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleOAuthRedirect}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 text-slate-800 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {isSigningIn ? (
                <span className="text-xs text-slate-500">Verifying...</span>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign in with Google</span>
                </>
              )}
            </button>
            <p className="text-center text-[10.5px] text-slate-400 font-medium">
              Google sign-in grants instant access — no PIN required
            </p>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 text-[10px] font-bold text-slate-400 bg-white uppercase tracking-wide">
                or enter PIN manually
              </span>
            </div>
          </div>

          {/* Manual Email + PIN */}
          <form onSubmit={handlePinSubmit} className="space-y-3 text-left">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                Administrator Email
              </label>
              <input
                type="email"
                required
                value={adminEmailInput}
                onChange={(e) => { setAdminEmailInput(e.target.value); setLoginError(""); }}
                placeholder="Enter administrator email..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-xl text-slate-900 text-xs font-mono focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1.5 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                Security PIN
              </label>
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
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-xl text-slate-900 font-mono text-center text-lg tracking-[0.35em] font-bold focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={isSigningIn || adminPinInput.length !== 4}
              className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-amber-200 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <Crown className="w-4 h-4 text-amber-300" />
              <span>{isSigningIn ? "Verifying..." : "Unlock Console"}</span>
            </button>
          </form>

          <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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

  // ── Nav Items ────────────────────────────────────────────────────────────────
  const navItems = [
    { href: "/admin", label: "Dashboard", subLabel: "Overview", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Validity", subLabel: "Tenant Accounts", icon: Users },
    { href: "/admin/coupons", label: "Coupons & Promos", subLabel: "Discount Codes", icon: Tag },
    { href: "/admin/subscriptions", label: "Subscriptions", subLabel: "Plans & Validity", icon: Sparkles },
    { href: "/admin/payments", label: "Payments", subLabel: "Gateway Ledger", icon: CreditCard },
    { href: "/admin/referrals", label: "Referrals", subLabel: "Affiliate Ledger", icon: Gift },
    { href: "/admin/traffic", label: "Web Traffic", subLabel: "Geo Telemetry", icon: Globe },
    { href: "/admin/audit-logs", label: "Audit Logs", subLabel: "Security History", icon: History },
    { href: "/admin/branding", label: "Branding", subLabel: "Brand & Metadata", icon: Palette },
    { href: "/admin/dev", label: "Dev Specs", subLabel: "Tech Architecture", icon: Code2 },
  ];

  return (
    <div className="min-h-screen bg-[#faf8f5] text-slate-900 flex flex-col md:flex-row antialiased selection:bg-amber-200 selection:text-amber-950">

      {/* ── Mobile Top Header ──────────────────────────────────────────────── */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-amber-200/80 px-4 py-2.5 flex items-center justify-between gap-2 shadow-sm">
        {/* Left: Logo + title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <VelviLogo size="xs" showTagline={false} />
          <div className="text-xs font-extrabold text-slate-900 truncate leading-tight">
            Super Admin Console
          </div>
        </div>

        {/* Right: SignOut + Menu + App link */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 hover:text-rose-700 hover:border-rose-300 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-slate-100 border border-slate-200 rounded-lg text-slate-700 transition cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 text-amber-700" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link
            href="/app"
            className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-[10.5px] font-extrabold transition flex items-center gap-1 active:scale-95"
          >
            <ArrowLeft className="w-3 h-3" />
            App
          </Link>
        </div>
      </header>

      {/* ── Mobile Dropdown Nav ────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-amber-200 p-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 mb-1 bg-amber-50 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
            <span className="font-mono text-slate-900 text-[11px] truncate font-bold">
              {currentUser?.email || "manirajankg@gmail.com"}
            </span>
            <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0 ml-2">
              Active
            </span>
          </div>
          {navItems.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-amber-50 text-amber-900 border border-amber-200 font-extrabold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-amber-700" : "text-slate-400"}`} />
                <div>
                  <div className="font-bold text-slate-900 text-xs leading-tight">{item.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{item.subLabel}</div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ── Desktop Left Sidebar ───────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-white border-r border-amber-200/80 flex-col justify-between shrink-0 min-h-screen sticky top-0">
        <div className="flex flex-col gap-3 p-4">
          {/* Logo header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <VelviLogo size="sm" showTagline={false} />
            <Link
              href="/app"
              className="p-1.5 hover:bg-amber-50 rounded-lg text-slate-400 hover:text-emerald-800 transition cursor-pointer"
              title="Return to App"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Profile pill */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-3 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Session</span>
              {isSuperAdmin ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-amber-100 text-amber-900 border border-amber-300">👑 Super</span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black bg-blue-100 text-blue-900 border border-blue-300">✏️ Admin</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200 px-2.5 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
              <span className="font-mono text-[10.5px] text-slate-900 truncate font-semibold">
                {currentUser?.email || "manirajankg@gmail.com"}
              </span>
            </div>
            {secondsRemaining !== null && (
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Lock in:
                </span>
                <span className="font-mono font-bold text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {Math.floor(secondsRemaining / 60)}:{String(secondsRemaining % 60).padStart(2, "0")}
                </span>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? "bg-amber-50 text-amber-900 border border-amber-200 font-bold shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 group-hover:scale-105 transition-transform ${isActive ? "text-amber-700" : "text-slate-400"}`} />
                  <div className="min-w-0">
                    <div className="text-slate-900 font-bold text-xs truncate leading-snug">{item.label}</div>
                    <div className="text-[9.5px] text-slate-500 truncate leading-snug">{item.subLabel}</div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-4 space-y-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="w-full py-2 px-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
          <div className="flex items-center justify-between text-[10px] text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span className="font-bold text-emerald-800">Security Active</span>
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────────────── */}
      <main className="flex-1 px-2.5 py-3 sm:p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
