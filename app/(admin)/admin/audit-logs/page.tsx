"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Shield, Clock, Search, History, ArrowUpRight, Activity, UserCheck } from "lucide-react";
import Link from "next/link";

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const logs = (db.auditLogs || []).filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.reason?.toLowerCase().includes(search.toLowerCase())
  );

  const totalLogs = (db.auditLogs || []).length;
  const loginEvents = (db.auditLogs || []).filter((l) => l.action.includes("LOGIN")).length;
  const validityEvents = (db.auditLogs || []).filter(
    (l) => l.action.includes("VALIDITY") || l.action.includes("EXTEND")
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#040710] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-[11px] font-bold text-amber-300 shadow-xs">
            <History className="w-3.5 h-3.5 text-amber-400" />
            <span>பாதுகாப்பு & தணிக்கை பதிவு • Immutable Audit Trail</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            பாதுகாப்பு தணிக்கை பதிவுகள் (Audit Logs)
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            நிர்வாகிகள் மேற்கொண்ட அனைத்து மாற்றங்கள், வேலிடிட்டி நீட்டிப்புகள் மற்றும் பாதுகாப்பு அமர்வு பதிவுகள்
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>முதன்மை பலகை (Super Console)</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>மொத்த தணிக்கை செயல்கள் (Actions)</span>
            <History className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalLogs}</div>
          <div className="text-[10.5px] text-slate-400">வரலாற்று நிகழ்வு பதிவுகள்</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>உள்நுழைவு அமர்வுகள் (Auth Logins)</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{loginEvents}</div>
          <div className="text-[10.5px] text-emerald-500">கூகிள் & பின் சரிபார்ப்புகள்</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>வேலிடிட்டி மாற்றங்கள் (Validity Events)</span>
            <Activity className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">{validityEvents}</div>
          <div className="text-[10.5px] text-amber-400/90">மேனுவல் & கூப்பன் நீட்டிப்புகள்</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="செயல், நிர்வாகி பெயர் அல்லது காரணம் தேட..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-[#080d19] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner"
        />
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-slate-800">
            தேடலுக்கு ஏற்ற தணிக்கை பதிவுகள் எதுவும் இல்லை &quot;{search}&quot;
          </div>
        ) : (
          logs.map((log) => {
            const dateFormatted = new Date(log.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <div
                key={log.id}
                className="p-4 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] rounded-2xl border border-slate-800/90 space-y-2 text-xs shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-white text-xs">{log.actorName}</span>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                    {log.action}
                  </span>
                </div>

                <div className="text-[11px] bg-[#060a14] p-2 rounded-xl border border-slate-800/80 text-slate-300">
                  <div className="text-slate-400 text-[10px] uppercase">இலக்கு (Target)</div>
                  <div className="font-semibold text-white truncate">{log.targetType} ({log.targetId || "Global"})</div>
                  {log.reason && (
                    <div className="text-slate-400 text-[10.5px] italic mt-1 pt-1 border-t border-slate-800/60">
                      &quot;{log.reason}&quot;
                    </div>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 font-mono text-right">
                  {dateFormatted}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-[#0c1220]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[700px]">
            <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/90">
              <tr>
                <th className="p-4">நேரம் (Timestamp)</th>
                <th className="p-4">நிர்வாகி (Actor)</th>
                <th className="p-4">செயல் (Action)</th>
                <th className="p-4">இலக்கு (Target)</th>
                <th className="p-4">காரணம் / குறிப்பு (Reason)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => {
                const dateFormatted = new Date(log.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition">
                    <td className="p-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="p-4 font-extrabold text-white">{log.actorName}</td>
                    <td className="p-4">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">
                      {log.targetType} ({log.targetId || "Global"})
                    </td>
                    <td className="p-4 text-slate-300 italic">{log.reason || "System event"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
