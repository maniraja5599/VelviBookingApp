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
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Mobile Top Header (Sleek, compact, non-intrusive) */}
      <header className="md:hidden sticky top-0 z-40 bg-[#0c1220]/95 backdrop-blur-md border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-400 text-black font-black flex items-center justify-center text-sm shadow-md">
            🪔
          </div>
          <div>
            <h1 className="font-extrabold text-xs text-white tracking-wide">Velvi Super Admin</h1>
            <p className="text-[9px] text-amber-400/90 font-mono font-medium">Developer Console</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
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
            className="px-2.5 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500 hover:text-black rounded-lg text-[11px] font-bold transition flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>App</span>
          </Link>
        </div>
      </header>

      {/* Mobile Dropdown Nav Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0c1220] border-b border-zinc-800 p-3 space-y-1 animate-in fade-in">
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

        <div className="p-3 bg-zinc-900/80 rounded-2xl border border-zinc-800 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Shield className="w-3.5 h-3.5" /> Platform Security Active
          </div>
          <p className="text-slate-400 leading-tight">
            Multi-tenant Row Level Security, Client IP tracking &amp; HMAC enforced.
          </p>
        </div>
      </aside>

      {/* Main Content Area (Clean padding on mobile and desktop) */}
      <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
