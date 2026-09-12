"use client";

import React, { useState } from "react";
import { db } from "@/lib/db/store";
import { Shield, Clock, Search, History } from "lucide-react";

export default function AdminAuditLogsPage() {
  const [search, setSearch] = useState("");
  const logs = db.auditLogs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.reason?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Immutable Audit Logs</h1>
        <p className="text-xs text-gray-400">
          Traceable historical logs of all administrative modifications, validity changes, and reassignment events
        </p>
      </div>

      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Filter by action, actor, or reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500"
        />
      </div>

      <div className="bg-gray-800/60 rounded-3xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Action</th>
                <th className="p-4">Target</th>
                <th className="p-4">Reason / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {logs.map((log) => {
                const dateFormatted = new Date(log.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                });

                return (
                  <tr key={log.id} className="hover:bg-gray-700/30 transition">
                    <td className="p-4 text-gray-400 font-mono text-[11px] whitespace-nowrap">
                      {dateFormatted}
                    </td>
                    <td className="p-4 font-bold text-white">{log.actorName}</td>
                    <td className="p-4">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-950 text-amber-400 border border-amber-800 font-mono">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-gray-300">
                      {log.targetType} ({log.targetId || "Global"})
                    </td>
                    <td className="p-4 text-gray-300 italic">{log.reason || "System event"}</td>
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
