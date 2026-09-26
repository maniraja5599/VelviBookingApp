"use client";

import React, { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/db/store";
import { WebTrafficLog } from "@/lib/types";
import {
  Globe,
  Search,
  RotateCcw,
  Smartphone,
  Monitor,
  Tablet,
  Share2,
  ExternalLink,
  MapPin,
  Clock,
  Shield,
  Layers,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  CheckCircle,
  Eye,
  X,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function AdminTrafficPage() {
  const [trafficLogs, setTrafficLogs] = useState<WebTrafficLog[]>(db.webTrafficLogs || []);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");
  const [selectedLog, setSelectedLog] = useState<WebTrafficLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const fetchTrafficData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/traffic");
      if (res.ok) {
        const data = await res.json();
        if (data?.logs && Array.isArray(data.logs)) {
          // Merge with local db
          for (const l of data.logs) {
            if (!db.webTrafficLogs.some((existing) => existing.id === l.id)) {
              db.webTrafficLogs.unshift(l);
            }
          }
          if (db.webTrafficLogs.length > 500) {
            db.webTrafficLogs = db.webTrafficLogs.slice(0, 500);
          }
          db.saveToLocalStorage();
          setTrafficLogs([...db.webTrafficLogs]);
        }
      }
    } catch (_) {
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setTrafficLogs([...db.webTrafficLogs]);
    fetchTrafficData();

    const handleTrafficChange = (e: any) => {
      setTrafficLogs([...db.webTrafficLogs]);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("velvi:traffic-change", handleTrafficChange);
    }

    const timer = setInterval(() => {
      fetchTrafficData();
    }, 12000);

    return () => {
      clearInterval(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("velvi:traffic-change", handleTrafficChange);
      }
    };
  }, [fetchTrafficData]);

  // Calculations & Analytics
  const totalViews = trafficLogs.length;
  const uniqueVisitors = new Set(trafficLogs.map((l) => l.visitorSessionId || l.ip)).size;

  // Source counts
  const sourceCounts: Record<string, number> = {};
  trafficLogs.forEach((l) => {
    const s = l.trafficSource || "DIRECT";
    sourceCounts[s] = (sourceCounts[s] || 0) + 1;
  });

  const topSourceEntry = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0];
  const topSourceName = topSourceEntry
    ? `${topSourceEntry[0]} (${Math.round((topSourceEntry[1] / (totalViews || 1)) * 100)}%)`
    : "Direct";

  // City counts
  const cityCounts: Record<string, number> = {};
  trafficLogs.forEach((l) => {
    const loc = `${l.city || "Chennai"}, ${l.countryCode || "IN"}`;
    cityCounts[loc] = (cityCounts[loc] || 0) + 1;
  });
  const topCityEntry = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0];
  const topCityName = topCityEntry ? topCityEntry[0] : "Chennai, IN";

  // Filtered list
  const filtered = trafficLogs.filter((log) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (log.ip && log.ip.toLowerCase().includes(q)) ||
      (log.city && log.city.toLowerCase().includes(q)) ||
      (log.region && log.region.toLowerCase().includes(q)) ||
      (log.country && log.country.toLowerCase().includes(q)) ||
      (log.pagePath && log.pagePath.toLowerCase().includes(q)) ||
      (log.sourceName && log.sourceName.toLowerCase().includes(q)) ||
      (log.browser && log.browser.toLowerCase().includes(q)) ||
      (log.os && log.os.toLowerCase().includes(q)) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q));

    const matchesSource =
      sourceFilter === "ALL" ||
      (sourceFilter === "DIRECT" && log.trafficSource === "DIRECT") ||
      (sourceFilter === "WHATSAPP" && log.trafficSource === "WHATSAPP") ||
      (sourceFilter === "INSTAGRAM" && log.trafficSource === "INSTAGRAM") ||
      (sourceFilter === "GOOGLE" && log.trafficSource === "GOOGLE") ||
      (sourceFilter === "SOCIAL" &&
        ["WHATSAPP", "INSTAGRAM", "FACEBOOK", "TWITTER", "YOUTUBE"].includes(log.trafficSource)) ||
      (sourceFilter === "MOBILE" && log.deviceType === "MOBILE");

    return matchesSearch && matchesSource;
  });

  const getSourceBadge = (source: string) => {
    switch (source) {
      case "WHATSAPP":
        return "bg-emerald-950/80 text-emerald-400 border-emerald-800";
      case "INSTAGRAM":
        return "bg-pink-950/80 text-pink-400 border-pink-800";
      case "GOOGLE":
        return "bg-sky-950/80 text-sky-400 border-sky-800";
      case "FACEBOOK":
        return "bg-blue-950/80 text-blue-400 border-blue-800";
      case "TWITTER":
        return "bg-slate-900 text-slate-200 border-slate-700";
      case "YOUTUBE":
        return "bg-rose-950/80 text-rose-400 border-rose-800";
      case "DIRECT":
      default:
        return "bg-amber-950/80 text-amber-300 border-amber-800";
    }
  };

  const getDeviceIcon = (dev: string) => {
    switch (dev) {
      case "DESKTOP":
        return <Monitor className="w-3.5 h-3.5 text-slate-400" />;
      case "TABLET":
        return <Tablet className="w-3.5 h-3.5 text-slate-400" />;
      case "MOBILE":
      default:
        return <Smartphone className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-[#0c1424] via-[#080d19] to-[#040710] border border-amber-500/25 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[11px] font-bold text-emerald-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE VISITOR TELEMETRY • VELVI.DATE ANALYTICS</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            <Globe className="w-7 h-7 text-amber-400 inline" />
            <span>Web Traffic, Visitors &amp; Geo Telemetry</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time visitor origin tracking, acquisition channels (Direct, WhatsApp, Instagram, Google), and device telemetry for velvi.date
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 flex-wrap">
          <button
            type="button"
            onClick={fetchTrafficData}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshing ? "animate-spin" : ""}`} />
            <span>{isRefreshing ? "Refreshing..." : "Live Sync"}</span>
          </button>

          <Link
            href="/admin"
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 active:scale-95"
          >
            <span>Super Console</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/90 border border-emerald-700/80 text-emerald-200 p-3.5 rounded-2xl text-xs flex items-center gap-2.5 shadow-xl animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Page Views</span>
            <Eye className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">{totalViews}</div>
          <div className="text-[10.5px] text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live traffic recorded
          </div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Unique Visitors</span>
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">{uniqueVisitors}</div>
          <div className="text-[10.5px] text-slate-400">Deduplicated sessions &amp; IPs</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Top Acquisition</span>
            <Share2 className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-lg font-black text-amber-300 truncate">{topSourceName}</div>
          <div className="text-[10.5px] text-slate-400">Leading traffic source</div>
        </div>

        <div className="bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] p-4 rounded-2xl border border-slate-800/90 shadow-xl space-y-1">
          <div className="text-xs font-semibold text-slate-400 flex items-center justify-between">
            <span>Primary Location</span>
            <MapPin className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-lg font-black text-white truncate">{topCityName}</div>
          <div className="text-[10.5px] text-slate-400">Highest visitor density</div>
        </div>
      </div>

      {/* Visual Acquisition Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Source Channels */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Acquisition Channels</span>
            </h3>
            <span className="text-[10.5px] text-slate-400 font-mono font-bold">{totalViews} hits</span>
          </div>

          <div className="space-y-2">
            {[
              { id: "DIRECT", label: "Direct Website (velvi.date)", color: "bg-amber-400" },
              { id: "WHATSAPP", label: "WhatsApp Share / Chat", color: "bg-emerald-400" },
              { id: "GOOGLE", label: "Google Organic Search", color: "bg-sky-400" },
              { id: "INSTAGRAM", label: "Instagram Bio / Story", color: "bg-pink-400" },
              { id: "FACEBOOK", label: "Facebook Post", color: "bg-blue-400" },
              { id: "TWITTER", label: "X / Twitter", color: "bg-slate-300" },
            ].map((channel) => {
              const count = sourceCounts[channel.id] || 0;
              const percent = Math.round((count / (totalViews || 1)) * 100);
              return (
                <div key={channel.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium truncate">{channel.label}</span>
                    <span className="font-mono text-[11px] text-slate-400 font-bold">
                      {count} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${channel.color} rounded-full transition-all duration-500`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Pages Visited */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Top Visited Landing Pages</span>
            </h3>
            <span className="text-[10.5px] text-slate-400 font-mono font-bold">Paths</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {Object.entries(
              trafficLogs.reduce((acc, curr) => {
                acc[curr.pagePath || "/"] = (acc[curr.pagePath || "/"] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([path, count]) => {
                const percent = Math.round((count / (totalViews || 1)) * 100);
                return (
                  <div
                    key={path}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#080d19] border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-amber-300 font-bold">{path}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px] font-bold">
                      {count} visits ({percent}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Top Visitor Locations */}
        <div className="bg-[#0c1220]/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-4 space-y-3 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-sky-400" />
              <span>Geographic Distribution</span>
            </h3>
            <span className="text-[10.5px] text-slate-400 font-mono font-bold">Cities</span>
          </div>

          <div className="space-y-2 text-xs">
            {Object.entries(cityCounts)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([city, count]) => {
                const percent = Math.round((count / (totalViews || 1)) * 100);
                return (
                  <div
                    key={city}
                    className="flex items-center justify-between p-2 rounded-xl bg-[#080d19] border border-slate-800/80"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">🇮🇳</span>
                      <span className="text-white font-semibold">{city}</span>
                    </div>
                    <span className="text-emerald-400 font-mono text-[11px] font-bold">
                      {count} ({percent}%)
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by IP, city, source, path, device..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3 py-2.5 bg-[#080d19] border border-slate-800 focus:border-amber-400 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none transition shadow-inner"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar text-xs font-semibold">
          {[
            { id: "ALL", label: `All Traffic (${totalViews})` },
            { id: "DIRECT", label: `Direct (${sourceCounts.DIRECT || 0})` },
            { id: "WHATSAPP", label: `WhatsApp (${sourceCounts.WHATSAPP || 0})` },
            { id: "INSTAGRAM", label: `Instagram (${sourceCounts.INSTAGRAM || 0})` },
            { id: "GOOGLE", label: `Google Search (${sourceCounts.GOOGLE || 0})` },
            { id: "MOBILE", label: `Mobile Users` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSourceFilter(f.id)}
              className={`px-3 py-2 rounded-xl transition cursor-pointer shrink-0 text-xs ${
                sourceFilter === f.id
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-xs"
                  : "bg-[#0c1220] text-slate-400 border border-slate-800 hover:text-white"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card View (< 640px) */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-[#0c1220] rounded-2xl border border-slate-800">
            No visitor logs found matching &quot;{search}&quot;.
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className="p-4 bg-gradient-to-br from-[#0c1424] via-[#090e1a] to-[#050811] rounded-2xl border border-slate-800/90 space-y-2.5 text-xs shadow-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {getDeviceIcon(log.deviceType)}
                  <span className="font-mono font-bold text-white text-xs">{log.ip}</span>
                </div>
                <span
                  className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${getSourceBadge(
                    log.trafficSource
                  )}`}
                >
                  {log.trafficSource}
                </span>
              </div>

              <div className="flex items-center justify-between text-[11px] bg-[#060a14] p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-300 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-sky-400" />
                  {log.city}, {log.country}
                </span>
                <span className="font-mono text-amber-300 font-bold">{log.pagePath}</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="truncate max-w-[200px]">{log.sourceName}</span>
                <span className="font-mono">{new Date(log.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(log)}
                className="w-full py-1.5 bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl font-bold text-xs transition cursor-pointer"
              >
                Inspect Telemetry
              </button>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View (>= 640px) */}
      <div className="hidden sm:block bg-[#0c1220]/90 backdrop-blur-xl rounded-3xl border border-slate-800/90 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 min-w-[750px]">
            <thead className="bg-[#080c14] text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800/90">
              <tr>
                <th className="p-4">Visitor IP &amp; Device</th>
                <th className="p-4">Location (City / Country)</th>
                <th className="p-4">Acquisition Channel</th>
                <th className="p-4">Page Visited</th>
                <th className="p-4">Visitor Status</th>
                <th className="p-4 text-right">Timestamp</th>
                <th className="p-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(log.deviceType)}
                      <div>
                        <div className="font-mono font-bold text-white text-xs">{log.ip}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.browser} • {log.os}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 font-medium text-white">
                      <span className="text-sm">📍</span>
                      <span>
                        {log.city}, {log.region ? `${log.region}, ` : ""}
                        {log.country}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`text-[9.5px] px-2.5 py-0.5 rounded-full font-bold uppercase border inline-flex items-center gap-1 ${getSourceBadge(
                        log.trafficSource
                      )}`}
                    >
                      <span>{log.sourceName || log.trafficSource}</span>
                    </span>
                  </td>
                  <td className="p-4 font-mono font-bold text-amber-300">{log.pagePath}</td>
                  <td className="p-4">
                    {log.isLoggedIn ? (
                      <span className="text-[9.5px] px-2 py-0.5 rounded-full font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                        {log.userEmail || "Logged In"}
                      </span>
                    ) : (
                      <span className="text-[9.5px] px-2 py-0.5 rounded-full font-medium bg-slate-800 text-slate-400 border border-slate-700">
                        Guest Visitor
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-right font-mono text-[11px] whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      className="px-2.5 py-1 bg-amber-500/15 hover:bg-amber-500 hover:text-black border border-amber-500/30 text-amber-300 rounded-lg font-bold text-xs transition cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Telemetry Dossier Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0c1424] rounded-3xl p-6 max-w-lg w-full space-y-4 border border-amber-500/40 shadow-2xl text-white relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-base text-white">Visitor Telemetry Dossier</h3>
                  <p className="text-xs text-slate-400">IP: {selectedLog.ip}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#060a14] p-3 rounded-2xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Geographic Location</span>
                  <span className="font-bold text-white">
                    {selectedLog.city}, {selectedLog.region}, {selectedLog.country}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Acquisition Channel</span>
                  <span className="font-bold text-amber-300">{selectedLog.sourceName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Landing Path</span>
                  <span className="font-mono font-bold text-white">{selectedLog.pagePath}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Device &amp; OS</span>
                  <span className="font-bold text-slate-300">
                    {selectedLog.deviceType} • {selectedLog.os}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Browser &amp; Display</span>
                  <span className="font-mono text-slate-300">
                    {selectedLog.browser} ({selectedLog.screenResolution || "Unknown"})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Language</span>
                  <span className="font-mono text-slate-300">{selectedLog.language || "en"}</span>
                </div>
              </div>

              <div className="bg-[#060a14] p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Referrer URL</span>
                <div className="font-mono text-slate-300 text-[11px] break-all bg-slate-900 p-2 rounded-xl border border-slate-800">
                  {selectedLog.referrer || "direct"}
                </div>
              </div>

              {selectedLog.utmSource && (
                <div className="bg-[#060a14] p-3 rounded-2xl border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block uppercase">Campaign UTM Tags</span>
                  <div className="grid grid-cols-3 gap-1 font-mono text-[10.5px]">
                    <div>Source: {selectedLog.utmSource}</div>
                    <div>Medium: {selectedLog.utmMedium || "none"}</div>
                    <div>Campaign: {selectedLog.utmCampaign || "none"}</div>
                  </div>
                </div>
              )}

              <div className="bg-[#060a14] p-3 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase">Session ID &amp; Timestamp</span>
                <div className="flex justify-between font-mono text-slate-400 text-[10.5px]">
                  <span>{selectedLog.visitorSessionId}</span>
                  <span>{new Date(selectedLog.createdAt).toLocaleString("en-IN")}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition cursor-pointer"
            >
              Close Dossier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
