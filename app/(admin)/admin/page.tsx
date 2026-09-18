"use client";

import React, { useState } from "react";
import { db, PlatformSettings } from "@/lib/db/store";
import {
  Users,
  CreditCard,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Shield,
  Plus,
  CheckCircle,
  Palette,
  Bell,
  Image as ImageIcon,
  Save,
  Smartphone,
  Globe,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { VelviLogo } from "@/components/ui/VelviLogo";

export default function SuperAdminDashboardPage() {
  const users = db.users;
  const subscriptions = db.subscriptions;
  const auditLogs = db.auditLogs;
  const payments = db.payments;

  // Selected User for fast validity adjustment
  const [selectedBizId, setSelectedBizId] = useState<string | null>(null);
  const [adjustDays, setAdjustDays] = useState<number>(30);
  const [reason, setReason] = useState<string>("Admin promotional extension");
  const [actionSuccess, setActionSuccess] = useState<string>("");

  // Platform Branding & App Updates State (Point 1: First page admin la logo and all other updates panikalam)
  const initialSettings = db.platformSettings;
  const [appName, setAppName] = useState(initialSettings.appName);
  const [appTamilName, setAppTamilName] = useState(initialSettings.appTamilName);
  const [tagline, setTagline] = useState(initialSettings.tagline);
  const [taglineTamil, setTaglineTamil] = useState(initialSettings.taglineTamil);
  const [logoPreset, setLogoPreset] = useState<string>("flame");
  const [customLogoUrl, setCustomLogoUrl] = useState(initialSettings.logoUrl);
  const [appVersion, setAppVersion] = useState(initialSettings.appVersion);
  const [announcementActive, setAnnouncementActive] = useState(initialSettings.announcementActive);
  const [announcementMessage, setAnnouncementMessage] = useState(initialSettings.announcementMessage);
  const [developerName, setDeveloperName] = useState(initialSettings.developerName);
  const [developerMobile, setDeveloperMobile] = useState(initialSettings.developerMobile);
  const [developerInstagram, setDeveloperInstagram] = useState(initialSettings.developerInstagram);
  const [platformSaveSuccess, setPlatformSaveSuccess] = useState(false);

  const handleQuickAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId) return;

    const res = db.adjustSubscriptionValidity({
      businessId: selectedBizId,
      adminUserId: "u-super-admin-01",
      adminName: "Velvi Super Admin",
      adjustmentType: "EXTEND",
      days: adjustDays,
      reason,
    });

    if (res.success) {
      setActionSuccess(`Extended validity by ${adjustDays} days for business!`);
      setSelectedBizId(null);
      setTimeout(() => setActionSuccess(""), 4000);
    }
  };

  const handleSavePlatformSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAppName = appName.trim() || appTamilName.trim() || "Velvi";
    const finalAppTamilName = appTamilName.trim() || appName.trim() || "வேள்வி";

    db.updatePlatformSettings({
      appName: finalAppName,
      appTamilName: finalAppTamilName,
      tagline,
      taglineTamil,
      logoUrl: customLogoUrl,
      appVersion,
      announcementActive,
      announcementMessage,
      developerName,
      developerMobile,
      developerInstagram,
    });

    setPlatformSaveSuccess(true);
    setTimeout(() => setPlatformSaveSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Platform Dashboard</h1>
          <p className="text-xs text-gray-400">
            Real-time multi-tenant health, cashflow, and system-wide configurations
          </p>
        </div>

        <Link
          href="/admin/users"
          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl shadow transition self-start"
        >
          Manage All Users
        </Link>
      </div>

      {actionSuccess && (
        <div className="bg-green-950 border border-green-800 text-green-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {platformSaveSuccess && (
        <div className="bg-green-950 border border-green-700 text-green-200 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-lg animate-fade-in">
          <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          <div className="font-semibold">
            Platform Branding, App Logo & System Updates have been saved and applied across Velvi!
          </div>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400">Total Users</div>
          <div className="text-2xl font-black text-white">126</div>
          <div className="text-[11px] text-amber-400 font-medium">+8 this week</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400">Active Paid</div>
          <div className="text-2xl font-black text-green-400">108</div>
          <div className="text-[11px] text-green-500 font-medium">85.7% conversion</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400">Trial Users</div>
          <div className="text-2xl font-black text-amber-400">14</div>
          <div className="text-[11px] text-amber-500 font-medium">30-day active window</div>
        </div>

        <div className="bg-gray-800/80 p-4 rounded-2xl border border-gray-700/60 shadow-sm space-y-1">
          <div className="text-xs font-semibold text-gray-400">Expired Accounts</div>
          <div className="text-2xl font-black text-red-400">4</div>
          <div className="text-[11px] text-gray-500 font-medium">Data safely preserved</div>
        </div>
      </div>

      {/* Revenue & Expiries Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Monthly Revenue Chart Card */}
        <div className="lg:col-span-2 bg-gray-800/60 p-5 rounded-3xl border border-gray-700/60 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                Revenue (This Month)
              </span>
              <div className="text-3xl font-black text-white mt-1">₹62,400</div>
            </div>
            <span className="text-xs text-green-400 bg-green-950/60 border border-green-800 px-2.5 py-1 rounded-full font-bold">
              +24% vs Aug
            </span>
          </div>

          {/* Simulated Monthly Bar Chart */}
          <div className="pt-4 border-t border-gray-700/50">
            <div className="text-[11px] text-gray-400 mb-2">Monthly Cashflow Trend</div>
            <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2">
              {[
                { m: "Apr", v: 28000, h: "45%" },
                { m: "May", v: 34000, h: "55%" },
                { m: "Jun", v: 42000, h: "68%" },
                { m: "Jul", v: 48500, h: "78%" },
                { m: "Aug", v: 52000, h: "83%" },
                { m: "Sep", v: 62400, h: "100%", current: true },
              ].map((bar) => (
                <div key={bar.m} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: bar.h }}
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      bar.current
                        ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-lg shadow-amber-500/20"
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                  />
                  <span className="text-[10px] font-semibold text-gray-400">{bar.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Expiries Card */}
        <div className="bg-gray-800/60 p-5 rounded-3xl border border-gray-700/60 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-white">Upcoming Expiries</h3>
            <span className="text-[10px] text-amber-400 font-semibold">Next 14 days</span>
          </div>

          <div className="space-y-2.5">
            {[
              { name: "Ravi Iyer", bizId: "biz-venkateswara-01", date: "20 Sep", plan: "Velvi Pro" },
              { name: "Suresh Iyer", bizId: "biz-suresh-99", date: "24 Sep", plan: "Velvi Pro" },
              { name: "Kumar Iyer", bizId: "biz-kumar-99", date: "28 Sep", plan: "Velvi Pro" },
              { name: "Mani Iyer", bizId: "biz-mani-99", date: "02 Oct", plan: "Velvi Pro" },
            ].map((exp, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-white">{exp.name}</h4>
                  <p className="text-[11px] text-gray-400">{exp.plan}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-amber-400 font-bold">{exp.date}</span>
                  <button
                    onClick={() => {
                      setSelectedBizId(exp.bizId);
                      setAdjustDays(30);
                    }}
                    className="p-1 text-gray-400 hover:text-amber-400"
                    title="Manual Extend"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* POINT 1: FIRST PAGE ADMIN LA LOGO AND ALL OTHER UPDATES PANIKALAM        */}
      {/* ========================================================================= */}
      <div className="bg-gray-800/80 rounded-3xl border border-amber-500/30 p-5 md:p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-700/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Platform Branding & System Updates</h2>
              <p className="text-xs text-gray-400">
                Update App Logo, Brand Identity, System Broadcasts, and Developer Information
              </p>
            </div>
          </div>

          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-full text-[11px] font-bold self-start">
            Super Admin Controls
          </span>
        </div>

        <form onSubmit={handleSavePlatformSettings} className="space-y-6">
          {/* Section 1: Logo Management & Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Live Logo Preview */}
            <div className="bg-gray-900/90 rounded-2xl p-4 border border-gray-700/70 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider">
                Live Logo Preview
              </span>
              <div className="p-3 bg-velvi-cream rounded-2xl border border-velvi-gold/40 flex items-center justify-center shadow-inner">
                <VelviLogo size="md" variant="full" showTagline={false} />
              </div>
              <div className="text-[11px] text-gray-400">
                Current App Title: <strong className="text-white">{appName}</strong> (
                {appTamilName})
              </div>
            </div>

            {/* Logo Presets & Custom Input */}
            <div className="md:col-span-2 space-y-3">
              <label className="text-xs font-bold text-gray-300 block">
                Choose App Icon / Logo Preset
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "flame", label: "Sacred Flame", icon: "🪔" },
                  { id: "kalasam", label: "Vedic Kalasam", icon: "🏺" },
                  { id: "om", label: "Divine Om", icon: "🕉️" },
                  { id: "diya", label: "Brass Diya", icon: "🪔" },
                ].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      setLogoPreset(preset.id);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      logoPreset === preset.id
                        ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/40"
                        : "bg-gray-900/60 border-gray-700 text-gray-400 hover:text-white"
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">
                  Custom Logo Image URL (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="/velvi-sacred-flame.png or https://..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: App Name & Tagline Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-700/50">
            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                App Name (English)
              </label>
              <input
                type="text"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                App Name (Tamil - தமிழ்)
              </label>
              <input
                type="text"
                value={appTamilName}
                onChange={(e) => setAppTamilName(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <p className="text-[10px] text-amber-400/80 font-medium sm:col-span-2">
              💡 ஏதேனும் ஒரு பெயர் உள்ளிடலாம் (Either English or Tamil name is sufficient).
            </p>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Tagline (English)
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">
                Tagline (Tamil - தமிழ்)
              </label>
              <input
                type="text"
                value={taglineTamil}
                onChange={(e) => setTaglineTamil(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Section 3: App Version & System Broadcast Updates */}
          <div className="pt-2 border-t border-gray-700/50 space-y-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                System Broadcast & Version Updates
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Current App Version
                </label>
                <input
                  type="text"
                  value={appVersion}
                  onChange={(e) => setAppVersion(e.target.value)}
                  placeholder="v1.2.0"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-300">
                    Broadcast Announcement Message
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 bg-gray-900 border-gray-700"
                    />
                    <span className="text-[11px] font-semibold text-gray-400">
                      Banner Active
                    </span>
                  </label>
                </div>
                <input
                  type="text"
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="e.g. All systems running smooth. Happy Vinayagar Chaturthi!"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Developer & Support Credits */}
          <div className="pt-2 border-t border-gray-700/50 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Developer & Support Credits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Developer Name
                </label>
                <input
                  type="text"
                  value={developerName}
                  onChange={(e) => setDeveloperName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  value={developerMobile}
                  onChange={(e) => setDeveloperMobile(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Instagram Handle
                </label>
                <input
                  type="text"
                  value={developerInstagram}
                  onChange={(e) => setDeveloperInstagram(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-3 border-t border-gray-700 flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:opacity-95 text-black font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 active:scale-[0.99]"
            >
              <Save className="w-4 h-4" />
              <span>Save Platform Settings & Updates</span>
            </button>
          </div>
        </form>
      </div>

      {/* Manual Validity Adjustment Modal */}
      {selectedBizId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-3xl p-6 max-w-sm w-full space-y-4 border border-amber-500/40 shadow-2xl text-white">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">Super Admin Validity Control</h3>
              <button
                onClick={() => setSelectedBizId(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Manual validity modifications are recorded in the immutable audit log.
            </p>

            <form onSubmit={handleQuickAdjust} className="space-y-3 text-xs">
              <div>
                <label className="text-gray-300 block mb-1 font-bold">Days to Extend</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {[7, 30, 90, 365].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAdjustDays(d)}
                      className={`py-1.5 rounded-xl font-bold transition ${
                        adjustDays === d
                          ? "bg-amber-500 text-black"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      +{d}d
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-gray-300 block mb-1 font-bold">
                  Mandatory Audit Reason *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Customer support compensation, offer"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBizId(null)}
                  className="flex-1 py-2.5 bg-gray-800 text-gray-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-black rounded-xl font-bold shadow"
                >
                  Save & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
