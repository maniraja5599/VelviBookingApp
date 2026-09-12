"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Sparkles,
  CreditCard,
  Gift,
  History,
  Settings,
  ArrowLeft,
  Shield,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Users & Validity", icon: Users },
    { href: "/admin/subscriptions", label: "Subscriptions", icon: Sparkles },
    { href: "/admin/payments", label: "Cashfree Payments", icon: CreditCard },
    { href: "/admin/referrals", label: "Referrals & Rewards", icon: Gift },
    { href: "/admin/audit-logs", label: "Immutable Audit Logs", icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col md:flex-row">
      {/* Sidebar for Desktop / Tablet */}
      <aside className="w-full md:w-64 bg-gray-950 border-r border-gray-800 p-4 space-y-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-black font-black flex items-center justify-center text-sm shadow-md">
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
              className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition"
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
                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      : "text-gray-400 hover:text-gray-200 hover:bg-gray-900"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-3 bg-gray-900 rounded-2xl border border-gray-800 text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Shield className="w-3.5 h-3.5" /> Platform Security Active
          </div>
          <p className="text-gray-400 leading-tight">
            Multi-tenant Row Level Security & HMAC signatures enforced.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
