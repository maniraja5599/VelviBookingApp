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
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser, loginWithGoogle, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const isSuperAdmin = Boolean(
    currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com"
  );

  const isEditorAdmin = Boolean(currentUser?.role === "ADMIN" && !isSuperAdmin);

  const hasAdminAccess = isSuperAdmin || isEditorAdmin;

  const handleGoogleLogin = async (email?: string, name?: string) => {
    setIsSigningIn(true);
    setLoginError("");
    try {
      await loginWithGoogle(
        email || "manirajankg@gmail.com",
        name || (email === "manirajankg@gmail.com" ? "Maniraja (Super Admin)" : undefined)
      );
    } catch (err: any) {
      setLoginError(err?.message || "Google authentication failed. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleCustomEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    setIsSigningIn(true);
    setLoginError("");
    try {
      await loginWithGoogle(customEmail.trim());
    } catch (err: any) {
      setLoginError(err?.message || "Authentication failed. Please verify your email.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleAdminSignOut = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("velvi_active_user_id", "LOGGED_OUT");
      window.location.href = "/admin";
    }
  };

  // Loading state
  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center space-y-3 p-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-2xl shadow-lg animate-pulse">
          🪔
        </div>
        <p className="text-xs text-slate-400 font-medium">Verifying Administrative Privileges...</p>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GATE 1: USER NOT SIGNED IN -> SHOW GOOGLE (GMAIL) LOGIN SCREEN
  // ---------------------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4 selection:bg-amber-500 selection:text-black">
        <div className="w-full max-w-md bg-[#0c1220] border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col items-center space-y-2 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black font-black flex items-center justify-center text-2xl shadow-lg shadow-amber-500/20">
              🪔
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">Velvi Platform Console</h1>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Google (Gmail) Authentication Required</span>
            </div>
            <p className="text-xs text-slate-400 max-w-xs pt-1 leading-relaxed">
              Sign in with your verified Google account. Only the Super Admin and invited Editor Admins can access this portal.
            </p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Primary Google Login Button */}
          <div className="space-y-3 relative z-10">
            <button
              type="button"
              disabled={isSigningIn}
              onClick={() => handleGoogleLogin("manirajankg@gmail.com", "Maniraja (Super Admin)")}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition shadow-lg shadow-white/10 active:scale-95 cursor-pointer disabled:opacity-50"
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
              <span>{isSigningIn ? "Signing In..." : "Sign In with Super Admin (Maniraja)"}</span>
            </button>

            {/* Custom Google Email Option */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500 bg-[#0c1220] px-2">
                Or Enter Invited Admin Gmail
              </div>
            </div>

            <form onSubmit={handleCustomEmailSubmit} className="space-y-2">
              <input
                type="email"
                required
                placeholder="e.g. associate.priest@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="w-full bg-[#080c14] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono text-center"
              />
              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-2 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                Sign In with Gmail
              </button>
            </form>
          </div>

          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs text-slate-400 relative z-10">
            <Link href="/app" className="hover:text-amber-400 flex items-center gap-1 transition">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Devotee App</span>
            </Link>
            <span className="text-[10px] font-mono text-slate-500">v2.5.3 Secure Gate</span>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GATE 2: SIGNED IN USER IS NOT SUPER_ADMIN AND NOT ADMIN -> ACCESS DENIED
  // ---------------------------------------------------------------------------
  if (!hasAdminAccess) {
    return (
      <div className="min-h-screen bg-[#070b14] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0c1220] border border-rose-500/40 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <Shield className="w-7 h-7 text-rose-400" />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Access Denied</h2>
            <p className="text-xs text-rose-400 font-medium mt-0.5">
              Administrative Privileges Required
            </p>
          </div>

          <div className="bg-[#080c14] p-3.5 rounded-xl border border-zinc-800 text-xs text-slate-300 space-y-1">
            <div className="text-[10px] uppercase font-bold text-slate-500">Signed In As:</div>
            <div className="font-mono text-amber-300 font-bold break-all">
              {currentUser.email || currentUser.name}
            </div>
            <div className="text-[10.5px] text-slate-400 pt-1 border-t border-zinc-800/60 mt-2">
              This Google Account is registered as a regular practitioner and does not have administrative access.
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            If you need access to this console, please contact the primary Super Admin (
            <strong className="text-amber-300 font-mono">manirajankg@gmail.com</strong>) to grant you an Editor Admin role.
          </p>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="w-full py-2.5 bg-rose-600/20 hover:bg-rose-600 hover:text-white border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Sign Out &amp; Switch Account
            </button>
            <Link
              href="/app"
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-slate-300 rounded-xl text-xs font-bold transition text-center"
            >
              Return to Devotee App
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // GATE 3: AUTHORIZED ADMIN (SUPER ADMIN OR EDITOR ADMIN) -> FULL CONSOLE
  // ---------------------------------------------------------------------------
  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Validity", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Sparkles },
    { href: "/admin/payments", label: "Cashfree Payments", icon: CreditCard },
    { href: "/admin/referrals", label: "Referrals & Rewards", icon: Gift },
    { href: "/admin/audit-logs", label: "Immutable Audit Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header (Sleek, compact, with Admin Role & Logout) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black font-black flex items-center justify-center text-sm shadow-md">
            🪔
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-white tracking-wide">Velvi Super Admin</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isSuperAdmin ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  👑 Super Admin
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  ✏️ Editor Admin
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-slate-400 hover:text-rose-400 transition"
            title="Sign Out of Admin Console"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-slate-300 hover:text-white transition"
            title="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <Link
            href="/app"
            className="px-2 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg text-[10.5px] font-bold transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>App</span>
          </Link>
        </div>
      </header>

      {/* Mobile Dropdown Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c1220] border-b border-zinc-800 p-3 space-y-1 animate-in fade-in">
          <div className="p-2.5 mb-2 bg-[#080c14] rounded-xl border border-zinc-800 text-xs">
            <div className="text-[10px] text-slate-500">Logged in Admin:</div>
            <div className="font-mono text-white text-[11px] truncate font-bold">{currentUser.email}</div>
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
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-zinc-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Sidebar (Only visible on md+ screens) */}
      <aside className="hidden md:flex w-64 bg-[#0c1220] border-r border-zinc-800 p-4 space-y-6 flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black font-black flex items-center justify-center text-sm shadow-md">
                🪔
              </div>
              <div>
                <h1 className="font-bold text-sm text-white">Velvi Super Admin</h1>
                <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider">
                  Platform Console
                </p>
              </div>
            </div>

            <Link
              href="/app"
              className="p-1.5 hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Return to Mobile App"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </div>

          {/* Active Admin Profile Card */}
          <div className="p-3 bg-[#080c14] rounded-2xl border border-zinc-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-500">Active Admin</span>
              {isSuperAdmin ? (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  👑 All Access
                </span>
              ) : (
                <span className="text-[9px] px-1.5 py-0.2 rounded font-black bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  ✏️ Edit Only
                </span>
              )}
            </div>
            <div className="font-mono text-white text-[11px] truncate font-bold">
              {currentUser.email}
            </div>
            <div className="text-[10px] text-slate-400">
              {isSuperAdmin ? "Primary Super Administrator" : "Platform Editor Administrator"}
            </div>
          </div>

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
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-zinc-900/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAdminSignOut}
            className="w-full py-2 px-3 bg-zinc-900 hover:bg-rose-950/60 border border-zinc-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out Admin</span>
          </button>

          <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-[11px] space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Shield className="w-3.5 h-3.5" /> Platform Security Active
            </div>
            <p className="text-slate-400 leading-tight">
              Multi-tenant Row Level Security, Client IP tracking &amp; HMAC enforced.
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area (Clean padding on mobile and desktop) */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
