"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Search, History, ArrowUpRight, Activity, UserCheck, ChevronDown, ChevronUp, Globe, MapPin, X } from "lucide-react";
import Link from "next/link";

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const [selectedModalLog, setSelectedModalLog] = useState<any | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
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
      <div className="bg-white border border-amber-200/90 rounded-3xl p-5 sm:p-7 text-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-[11px] font-bold text-amber-900 shadow-2xs">
            <History className="w-3.5 h-3.5 text-amber-700" />
            <span>SECURITY &amp; COMPLIANCE • IMMUTABLE AUDIT TRAIL</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Security Audit Logs &amp; Telemetry
          </h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Administrative modifications, validity adjustments, and authenticated session records
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10">
          <Link
            href="/admin"
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Super Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-700" />
          </Link>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Total Logged Events</span>
            <History className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalLogs}</div>
          <div className="text-[10.5px] text-slate-500">Immutable Record Entries</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Authenticated Sessions</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
          </div>
          <div className="text-2xl font-black text-emerald-800">{loginEvents}</div>
          <div className="text-[10.5px] text-emerald-700 font-medium">Google &amp; PIN Authorizations</div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-amber-200/80 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between">
            <span>Validity Interventions</span>
            <Activity className="w-3.5 h-3.5 text-amber-700" />
          </div>
          <div className="text-2xl font-black text-amber-800">{validityEvents}</div>
          <div className="text-[10.5px] text-amber-700 font-medium">Manual &amp; Promo Adjustments</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by action, administrator, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-200 focus:border-emerald-500 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none transition shadow-2xs"
        />
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-2.5">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
            No audit records found matching &quot;{search}&quot;
          </div>
        ) : (
          logs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const dateFormatted = new Date(log.createdAt).toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            });

            return (
              <div
                key={log.id}
                className="p-3.5 bg-white rounded-2xl border border-amber-200/80 space-y-2.5 text-xs shadow-2xs transition"
              >
                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="flex items-center justify-between cursor-pointer gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <span className="font-extrabold text-slate-900 text-xs truncate block">{log.actorName}</span>
                    <span className="text-[10px] text-slate-500 font-mono truncate block mt-0.5">{dateFormatted}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                      {log.action}
                    </span>
                    <button
                      type="button"
                      aria-label="Toggle details"
                      className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-200 text-slate-700 cursor-pointer"
                >
                  <div className="text-slate-500 text-[9.5px] uppercase font-semibold">Target Entity</div>
                  <div className="font-bold text-slate-900 truncate">{log.targetType} ({log.targetId || "Global"})</div>
                  {log.reason && (
                    <div className="text-slate-600 text-[10.5px] italic mt-1 pt-1 border-t border-slate-200">
                      &quot;{log.reason}&quot;
                    </div>
                  )}
                </div>

                {/* Collapsible Details */}
                {isExpanded && (
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/70 space-y-2 text-[11px] animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Actor User ID</span>
                        <span className="font-mono text-slate-700 text-[10px] truncate block">{log.actorId || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Log Entry ID</span>
                        <span className="font-mono text-slate-700 text-[10px] truncate block">{log.id}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/50">
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">IP Address</span>
                        <span className="font-mono text-amber-800 text-[10.5px]">{log.ipAddress || "Local / Direct"}</span>
                      </div>
                      <div>
                        <span className="text-[9.5px] text-slate-500 uppercase block font-semibold">Location</span>
                        <span className="text-slate-800 font-medium">
                          {log.city ? `${log.city}, ${log.country || "IN"}` : "Direct"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  {isExpanded ? "Hide Details" : "View Audit Trail Details"}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-white rounded-3xl border border-amber-200/80 overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 min-w-[700px]">
            <thead className="bg-amber-50/80 text-slate-700 uppercase text-[10px] tracking-wider border-b border-amber-200">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor / Admin</th>
                <th className="p-4">Action Taken</th>
                <th className="p-4">Target Entity</th>
                <th className="p-4">Audit Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const dateFormatted = new Date(log.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <tr key={log.id} className="hover:bg-amber-50/30 transition">
                    <td className="p-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="p-4 font-bold text-slate-900">{log.actorName}</td>
                    <td className="p-4">
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-700">
                      {log.targetType} ({log.targetId || "Global"})
                    </td>
                    <td className="p-4 text-slate-600 italic">{log.reason || "System event"}</td>
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
