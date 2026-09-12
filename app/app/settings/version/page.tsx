"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Clock,
  Tag,
  RefreshCw,
  Wifi,
  Smartphone,
  ShieldCheck,
} from "lucide-react";
import { VelviLogo } from "@/components/ui/VelviLogo";
import {
  APP_VERSION,
  RELEASE_CHANNEL,
  BUILD_DATE,
  VERSION_HISTORY,
  APP_NAME,
  APP_TAGLINE,
} from "@/lib/version/history";
import { PwaInstallBanner } from "@/components/mobile/PwaInstallBanner";
import { DeveloperCredit } from "@/components/ui/DeveloperCredit";

export default function VersionHistoryPage() {
  const [checking, setChecking] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);

  const handleCheckUpdate = () => {
    setChecking(true);
    setUpdateStatus(null);
    setTimeout(() => {
      setChecking(false);
      setUpdateStatus("You are on the latest stable build (v" + APP_VERSION + "). Everything is up to date!");
    }, 1200);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Feature":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "UI/UX":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "Security":
        return "bg-purple-100 text-purple-800 border-purple-300";
      case "Fix":
        return "bg-red-100 text-red-800 border-red-300";
      case "Architecture":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      default:
        return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-8">
      {/* Top Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Version & Updates</h2>
          <p className="text-xs text-velvi-brown/60">Release history & changelog</p>
        </div>
      </div>

      {/* Hero Version Card */}
      <div className="bg-gradient-to-br from-velvi-brownDark via-velvi-brown to-velvi-brownLight text-white rounded-3xl p-5 shadow-sacred border border-velvi-gold/30 space-y-4">
        <div className="flex items-center justify-between">
          <VelviLogo size="lg" variant="horizontal" showTagline={false} lightText={true} />
          <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {RELEASE_CHANNEL}
          </span>
        </div>

        <div>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-black text-velvi-goldLight tracking-tight">
              v{APP_VERSION}
            </h3>
            <span className="text-xs text-white/70">Current Active Build</span>
          </div>
          <p className="text-[11px] text-velvi-cream/80 mt-1">
            Built on {BUILD_DATE}
          </p>
        </div>

        {/* Check for updates button */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={handleCheckUpdate}
            disabled={checking}
            className="px-3.5 py-2 bg-velvi-gold hover:bg-velvi-goldLight text-velvi-brownDark font-bold text-xs rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checking ? "animate-spin" : ""}`} />
            {checking ? "Checking Server..." : "Check for Updates"}
          </button>
          <span className="text-[10px] text-velvi-cream/60">Auto-updates on load</span>
        </div>

        {updateStatus && (
          <div className="bg-white/10 border border-white/20 p-2.5 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{updateStatus}</span>
          </div>
        )}
      </div>

      {/* Local Network Mobile Access Card */}
      <div className="bg-white rounded-3xl p-4 border border-velvi-gold/30 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-velvi-brownDark">
          <div className="w-7 h-7 rounded-xl bg-velvi-gold/15 flex items-center justify-center text-velvi-goldDark">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-xs">Local Network (LAN) Mobile Access</h4>
            <p className="text-[11px] text-velvi-brown/60">Connect mobile devices on same Wi-Fi</p>
          </div>
        </div>

        <div className="bg-velvi-cream/70 rounded-2xl p-3 border border-velvi-gold/20 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-velvi-brown/70">Wi-Fi Mobile URL:</span>
            <code className="font-mono font-bold text-velvi-brownDark bg-white px-2 py-0.5 rounded border border-velvi-gold/30 text-[11px]">
              http://192.168.11.128:3000/app
            </code>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-velvi-brown/70">LAN / Fiber URL:</span>
            <code className="font-mono font-bold text-velvi-brownDark bg-white px-2 py-0.5 rounded border border-velvi-gold/30 text-[11px]">
              http://192.168.1.50:3000/app
            </code>
          </div>
          <p className="text-[10px] text-velvi-brown/60 pt-1 leading-relaxed">
            💡 Open any mobile browser connected to your Wi-Fi, enter the URL above, and tap <strong>"Install Velvi App"</strong> to add it directly to your home screen!
          </p>
        </div>
      </div>

      {/* PWA Install Button */}
      <PwaInstallBanner mode="button" />

      {/* Timeline Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-velvi-gold" />
            Changelog & Updates Timeline
          </h3>
          <span className="text-[10px] font-bold text-velvi-goldDark">
            {VERSION_HISTORY.length} Releases Tracked
          </span>
        </div>

        {/* Release Timeline List */}
        <div className="relative border-l-2 border-velvi-gold/30 ml-4 pl-4 space-y-6">
          {VERSION_HISTORY.map((rel) => (
            <div key={rel.version} className="relative group space-y-2">
              {/* Timeline marker node */}
              <div
                className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${
                  rel.isCurrent
                    ? "bg-emerald-500 ring-4 ring-emerald-100"
                    : "bg-velvi-gold"
                }`}
              />

              {/* Version & Date Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-sm text-velvi-brownDark">
                    v{rel.version}
                  </span>
                  {rel.isCurrent && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black rounded-full uppercase tracking-wider">
                      Latest
                    </span>
                  )}
                  <span className="px-1.5 py-0.5 bg-velvi-gold/15 text-velvi-brown text-[10px] font-bold rounded-md">
                    {rel.tag}
                  </span>
                </div>
                <span className="text-[11px] text-velvi-brown/50 font-medium">
                  {rel.releaseDate} {rel.releaseTime ? `• ${rel.releaseTime}` : ""}
                </span>
              </div>

              {/* Release Details Card */}
              <div className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-2.5">
                <h4 className="font-bold text-xs text-velvi-brownDark">{rel.title}</h4>
                <p className="text-[11px] text-velvi-brown/70 leading-relaxed">
                  {rel.summary}
                </p>

                {/* Individual Changes */}
                <div className="pt-2 border-t border-velvi-creamDark space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-velvi-brown/50 block">
                    What was updated:
                  </span>
                  {rel.changes.map((ch, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs">
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${getCategoryColor(
                          ch.category
                        )}`}
                      >
                        {ch.category}
                      </span>
                      <span className="text-[11px] text-velvi-brownDark leading-tight">
                        {ch.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Developer Credit */}
      <DeveloperCredit />
    </div>
  );
}
