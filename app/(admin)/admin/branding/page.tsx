"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Palette, Save, Radio, CheckCircle, AlertTriangle } from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import { retryCloudSync } from "@/lib/supabase/sync";

export default function BrandingPage() {
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
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState("");

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setToastError(msg);
      setTimeout(() => setToastError(""), 4000);
    } else {
      setToast(msg);
      setTimeout(() => setToast(""), 4000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
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
    try { await retryCloudSync("biz-super-admin-01"); } catch {}
    showToast("Platform branding saved successfully!");
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
        {/* Toast */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />{toast}
          </div>
        )}
        {toastError && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-rose-600" />{toastError}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900">Platform Branding</h1>
            <p className="text-xs text-slate-500">Application logo, brand identity, broadcasts, and developer credentials</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Logo Management */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 sm:p-6 space-y-5">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">Brand Logo & Symbol</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col items-center justify-center text-center space-y-2">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Live Brand Preview</span>
                <div className="p-3 bg-[#faf8f5] rounded-2xl border border-amber-200/60 flex items-center justify-center">
                  <VelviLogo size="md" variant="full" showTagline={false} />
                </div>
                <div className="text-[11px] text-slate-500">
                  <strong className="text-slate-900">{appName}</strong> ({appTamilName})
                </div>
              </div>
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">Select Brand Symbol Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "flame", label: "Sacred Flame", icon: "🪔" },
                    { id: "kalasam", label: "Vedic Kalasam", icon: "🏺" },
                    { id: "om", label: "Divine Om", icon: "🕉️" },
                    { id: "diya", label: "Brass Diya", icon: "🪔" },
                  ].map(preset => (
                    <button
                      key={preset.id} type="button"
                      onClick={() => setLogoPreset(preset.id)}
                      className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        logoPreset === preset.id
                          ? "bg-amber-500/15 border-amber-400 text-amber-800"
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      <span>{preset.icon}</span>
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Custom Logo URL (Optional)</label>
                  <input
                    type="text" value={customLogoUrl}
                    onChange={e => setCustomLogoUrl(e.target.value)}
                    placeholder="/velvi-sacred-flame.png or https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Names & Taglines */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">App Name & Taglines</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">App Name (English)</label>
                <input type="text" value={appName} onChange={e => setAppName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">App Name (Tamil)</label>
                <input type="text" value={appTamilName} onChange={e => setAppTamilName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Tagline (English)</label>
                <input type="text" value={tagline} onChange={e => setTagline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-slate-700 font-bold block mb-1">Tagline (Tamil)</label>
                <input type="text" value={taglineTamil} onChange={e => setTaglineTamil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          {/* Version & Broadcasts */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Radio className="w-4 h-4 text-amber-700" />
              <h2 className="text-sm font-bold text-amber-800">System Broadcast & Versioning</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Application Version</label>
                <input type="text" value={appVersion} onChange={e => setAppVersion(e.target.value)}
                  placeholder="v2.5.3"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400" />
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-700 font-bold text-xs">Global Announcement Banner</label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={announcementActive} onChange={e => setAnnouncementActive(e.target.checked)}
                      className="rounded text-amber-500 focus:ring-amber-500 bg-slate-50 border-slate-200 cursor-pointer" />
                    <span className="text-[11px] font-semibold text-slate-500">Active Broadcast</span>
                  </label>
                </div>
                <input type="text" value={announcementMessage} onChange={e => setAnnouncementMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          {/* Developer Credits */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-bold text-amber-800 border-b border-slate-100 pb-3">Lead Creator & Architect Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Developer Name</label>
                <input type="text" value={developerName} onChange={e => setDeveloperName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Contact Mobile</label>
                <input type="text" value={developerMobile} onChange={e => setDeveloperMobile(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
              <div>
                <label className="text-slate-700 font-semibold block mb-1">Instagram Handle</label>
                <input type="text" value={developerInstagram} onChange={e => setDeveloperInstagram(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400" />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save Platform Configuration</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
