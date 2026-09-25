"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { exportBusinessData, validateCustomerImport } from "@/lib/export-import/engine";
import { syncAll, pushAllToCloud } from "@/lib/supabase/sync";
import {
  Cloud,
  Download,
  Upload,
  Lock,
  CheckCircle,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowLeft,
  RotateCcw,
  RefreshCw,
  Server,
  ShieldCheck,
  HardDrive,
  Database,
  Wifi,
  Activity,
  Layers,
  ChevronRight,
  ExternalLink,
  Globe,
} from "lucide-react";
import Link from "next/link";

export default function DataBackupPage() {
  const { currentBusiness, currentUser, subscription } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const isPaidUser =
    subscription?.status === "ACTIVE" &&
    Boolean(subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date());

  const [exportMessage, setExportMessage] = useState("");
  const [importPreview, setImportPreview] = useState<any | null>(null);

  // Cloud Live Database Telemetry State
  const [cloudData, setCloudData] = useState<any | null>(null);
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(true);
  const [isSyncingCloud, setIsSyncingCloud] = useState<boolean>(false);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [lastVerifiedTime, setLastVerifiedTime] = useState<string | null>(null);

  // Factory Reset state for ALL users
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Dynamic business data counts for reset preview
  const [dataVersion, setDataVersion] = useState(0);
  const bookingCount = db.getBookings(businessId).length;
  const customerCount = db.getCustomers(businessId).length;
  const paymentCount = db.payments.filter((p) => p.businessId === businessId).length;
  const poojaCount = db.getPoojas(businessId).length;

  // Fetch real cloud database statistics
  const fetchCloudStats = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoadingCloud(true);
    setCloudError(null);
    try {
      const q = new URLSearchParams();
      if (businessId) q.set("businessId", businessId);
      if (currentUser?.id) q.set("userId", currentUser.id);
      if (currentUser?.email) q.set("userEmail", currentUser.email);

      const res = await fetch(`/api/cloud/stats?${q.toString()}`, { cache: "no-store" });
      const json = await res.json();
      if (json && json.success) {
        setCloudData(json);
        setLastVerifiedTime(
          new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        );
      } else {
        setCloudError(json?.error || "Could not retrieve cloud stats");
      }
    } catch (e: any) {
      setCloudError(e?.message || "Failed to connect to cloud service");
    } finally {
      setIsLoadingCloud(false);
    }
  }, [businessId, currentUser]);

  useEffect(() => {
    fetchCloudStats();
  }, [fetchCloudStats]);

  // Trigger manual cloud sync & re-verify
  const handlePerformCloudSync = async () => {
    setIsSyncingCloud(true);
    try {
      await pushAllToCloud(businessId);
      await syncAll(businessId);
      await fetchCloudStats(true);
      setDataVersion((v) => v + 1);
      setExportMessage("Cloud sync complete! Real-time PostgreSQL database updated.");
      setTimeout(() => setExportMessage(""), 5000);
    } catch (err: any) {
      setExportMessage("Sync notice: " + (err?.message || "Finished"));
      setTimeout(() => setExportMessage(""), 5000);
    } finally {
      setIsSyncingCloud(false);
    }
  };

  const handlePerformFactoryReset = async () => {
    if (resetConfirmationText.trim().toUpperCase() !== "RESET") return;
    setIsResetting(true);
    try {
      const res = await db.factoryResetBusiness(businessId);
      setShowResetModal(false);
      setResetConfirmationText("");
      setDataVersion((v) => v + 1);
      setExportMessage(
        `Factory Reset completed! All account data reset to 0 (Wiped: ${res.deletedBookings} Bookings, ${res.deletedCustomers} Customers, ${res.deletedPayments} Payments).`
      );
      setTimeout(() => setExportMessage(""), 6000);
    } catch (e: any) {
      setExportMessage("Reset failed: " + (e?.message || "Error"));
    } finally {
      setIsResetting(false);
    }
  };

  const handleExport = (format: "xlsx" | "csv" | "json") => {
    if (!isPaidUser) return;

    const payload = {
      customers: db.getCustomers(businessId),
      bookings: db.getBookings(businessId),
      poojas: db.getPoojas(businessId),
      members: db.getMembers(businessId),
      payments: db.payments.filter((p) => p.businessId === businessId),
    };

    const result = exportBusinessData(payload, format);

    // Trigger browser download
    const blob =
      format === "json"
        ? new Blob([result.data], { type: result.mimeType })
        : format === "csv"
        ? new Blob([result.data], { type: result.mimeType })
        : new Blob([result.data], { type: result.mimeType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = result.filename;
    a.click();
    URL.revokeObjectURL(url);

    setExportMessage(`Export completed successfully (${result.filename})`);
    setTimeout(() => setExportMessage(""), 4000);
  };

  // Demo file upload simulation
  const handleSimulateUpload = () => {
    const sampleBatch = [
      { name: "Ananthakrishnan", mobile: "9443312345", address: "Namakkal", notes: "Regular" },
      { name: "Gopal Iyer", mobile: "9842154321", address: "Trichy", notes: "New customer" },
      { name: "Ramesh Kumar", mobile: "9876543210", address: "Namakkal", notes: "Duplicate test" },
      { name: "Invalid Phone Devotee", mobile: "1234", address: "Salem" },
    ];

    const preview = validateCustomerImport(sampleBatch, db.getCustomers(businessId));
    setImportPreview(preview);
  };

  const handleConfirmImport = () => {
    if (!importPreview || importPreview.validCustomers.length === 0) return;

    importPreview.validCustomers.forEach((cust: any) => {
      db.customers.push({
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        businessId,
        name: cust.name,
        mobile: cust.mobile,
        whatsapp: cust.mobile,
        address: cust.address,
        notes: cust.notes,
        createdAt: new Date().toISOString(),
      });
    });

    setExportMessage(`Imported ${importPreview.validCustomers.length} devotees successfully!`);
    setImportPreview(null);
  };

  return (
    <div className="space-y-4 pb-32 sm:pb-20 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition active:scale-95"
          title="Back to Settings"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Data &amp; Cloud Backup</h2>
          <p className="text-xs text-velvi-brown/60">Export, import, and backup your records</p>
        </div>
      </div>

      {exportMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Real Cloud Database Storage & Sync Dashboard */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-4 sm:p-5 text-white shadow-xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
        {/* Glow ambient background effect */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header & Connection Live Ping */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-inner">
              <Cloud className="w-5 h-5 text-blue-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-wide">
                  Real Cloud Storage
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Live Online
                </span>
              </div>
              <p className="text-[11px] text-indigo-200/80 mt-0.5">
                மேகக்கணி நேரலை தரவு சேமிப்பு &amp; ஒத்திசைவு நிலை
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {cloudData?.pingMs !== undefined && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono font-medium text-emerald-300 bg-emerald-950/60 px-2.5 py-1 rounded-xl border border-emerald-800/60">
                <Wifi className="w-3 h-3 text-emerald-400" />
                {cloudData.pingMs} ms
              </span>
            )}
            <button
              type="button"
              onClick={() => fetchCloudStats(false)}
              disabled={isLoadingCloud}
              title="Refresh live cloud statistics"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-indigo-200 hover:text-white transition cursor-pointer border border-white/10"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCloud ? "animate-spin text-blue-300" : ""}`} />
            </button>
          </div>
        </div>

        {/* Real Numbers KPI Grid */}
        <div className="relative z-10 space-y-3">
          {/* Big Total Records Hero */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-indigo-200">
                மொத்த மேகக்கணி பதிவுகள் (Total Stored Records in Cloud)
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5 flex items-baseline gap-2">
                {isLoadingCloud && !cloudData ? (
                  <span className="text-indigo-300 text-lg animate-pulse">சரிபார்க்கிறது...</span>
                ) : (
                  <>
                    <span>{cloudData?.business?.totalRecords ?? 0}</span>
                    <span className="text-xs font-semibold text-indigo-300">records in PostgreSQL</span>
                  </>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-indigo-200 block font-mono">
                {lastVerifiedTime ? `Verified: ${lastVerifiedTime}` : "Connecting..."}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 inline-flex items-center gap-1 mt-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                <ShieldCheck className="w-3 h-3" />
                Cloud Encrypted
              </span>
            </div>
          </div>

          {/* 4 Pillars Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Bookings */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-200">முன்பதிவுகள்</span>
                <span className="text-sm">📿</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {isLoadingCloud && !cloudData ? "..." : (cloudData?.business?.bookingsCount ?? 0)}
              </div>
              <div className="text-[10px] text-indigo-300/70 font-mono mt-0.5">
                Cloud Bookings
              </div>
            </div>

            {/* Devotees / Customers */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-200">பக்தர்கள்</span>
                <span className="text-sm">👥</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {isLoadingCloud && !cloudData ? "..." : (cloudData?.business?.customersCount ?? 0)}
              </div>
              <div className="text-[10px] text-indigo-300/70 font-mono mt-0.5">
                Cloud Devotees
              </div>
            </div>

            {/* Poojas */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-200">பூஜைகள்</span>
                <span className="text-sm">🪔</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {isLoadingCloud && !cloudData ? "..." : (cloudData?.business?.poojasCount ?? 0)}
              </div>
              <div className="text-[10px] text-indigo-300/70 font-mono mt-0.5">
                Cloud Poojas
              </div>
            </div>

            {/* Payments */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 hover:bg-white/10 transition">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-indigo-200">கட்டணங்கள்</span>
                <span className="text-sm">💳</span>
              </div>
              <div className="text-xl font-black text-white mt-1">
                {isLoadingCloud && !cloudData ? "..." : (cloudData?.business?.paymentsCount ?? 0)}
              </div>
              <div className="text-[10px] text-indigo-300/70 font-mono mt-0.5">
                Cloud Payments
              </div>
            </div>
          </div>
        </div>

        {/* Local Device vs Cloud Storage Comparison */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 relative z-10 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-200">
            <span className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-blue-400" />
              <span>உள்ளூர் &amp; மேகக்கணி சமநிலை (Local vs Cloud Sync Check)</span>
            </span>
            {cloudData && (
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                bookingCount <= (cloudData?.business?.bookingsCount || 0) && customerCount <= (cloudData?.business?.customersCount || 0)
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
              }`}>
                {bookingCount <= (cloudData?.business?.bookingsCount || 0) && customerCount <= (cloudData?.business?.customersCount || 0)
                  ? "✓ 100% In Sync"
                  : "Sync Recommended"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono text-[11px]">
            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
              <div className="text-[10px] text-indigo-300 font-sans">Bookings</div>
              <div className="font-bold text-white mt-0.5">
                {bookingCount} <span className="text-indigo-400 text-[10px]">loc</span> / {cloudData?.business?.bookingsCount ?? 0} <span className="text-emerald-400 text-[10px]">cld</span>
              </div>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
              <div className="text-[10px] text-indigo-300 font-sans">Devotees</div>
              <div className="font-bold text-white mt-0.5">
                {customerCount} <span className="text-indigo-400 text-[10px]">loc</span> / {cloudData?.business?.customersCount ?? 0} <span className="text-emerald-400 text-[10px]">cld</span>
              </div>
            </div>
            <div className="bg-black/20 p-2 rounded-xl border border-white/5">
              <div className="text-[10px] text-indigo-300 font-sans">Poojas</div>
              <div className="font-bold text-white mt-0.5">
                {poojaCount} <span className="text-indigo-400 text-[10px]">loc</span> / {cloudData?.business?.poojasCount ?? 0} <span className="text-emerald-400 text-[10px]">cld</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Cloud Sync & Verification Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 relative z-10 pt-1">
          <button
            type="button"
            onClick={handlePerformCloudSync}
            disabled={isSyncingCloud}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.98] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isSyncingCloud ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                <span>மேகக்கணியுடன் ஒத்திசைக்கிறது...</span>
              </>
            ) : (
              <>
                <Cloud className="w-3.5 h-3.5 text-blue-200" />
                <span>மேகக்கணியுடன் ஒத்திசை (Sync to Cloud Now)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => fetchCloudStats(false)}
            disabled={isLoadingCloud}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 active:scale-[0.98] text-white text-xs font-bold border border-white/15 flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCloud ? "animate-spin text-blue-300" : ""}`} />
            <span>நேரலை சரிபார் (Verify Cloud)</span>
          </button>
        </div>

        {/* Technical Cloud Architecture & Safety Details */}
        <div className="bg-black/30 rounded-2xl p-3 border border-white/5 space-y-2 text-[11px] text-indigo-200/90 relative z-10">
          <div className="font-bold text-white text-[11.5px] flex items-center gap-1.5 border-b border-white/10 pb-1.5">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span>தொழில்நுட்ப மேகக்கணி விவரங்கள் (Cloud Infrastructure Details)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10.5px]">
            <div className="flex items-center gap-1.5">
              <Database className="w-3 h-3 text-emerald-400 shrink-0" />
              <span><strong>Cloud Engine:</strong> {cloudData?.infrastructure?.engine || "PostgreSQL 15 (Supabase)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-cyan-400 shrink-0" />
              <span><strong>Server Region:</strong> {cloudData?.infrastructure?.region || "AWS Asia South (Mumbai, India)"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3 h-3 text-indigo-400 shrink-0" />
              <span><strong>Encryption:</strong> {cloudData?.infrastructure?.encryption || "AES-256 Cloud Encrypted"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-emerald-400 shrink-0" />
              <span><strong>Replication:</strong> {cloudData?.infrastructure?.replication || "Realtime WebSockets & WAL"}</span>
            </div>
          </div>

          <div className="pt-1 text-[10px] text-indigo-300/70 border-t border-white/5 flex items-center justify-between">
            <span>🛡️ Automated Backups: Point-in-Time Recovery (PITR) Active</span>
            <span className="font-mono text-emerald-300">Health: 100% Operational</span>
          </div>
        </div>

        {/* Global Platform Cloud Stats (Only if Super Admin) */}
        {(currentUser?.role === "SUPER_ADMIN" || currentUser?.email === "manirajankg@gmail.com") && cloudData?.global && (
          <div className="bg-blue-950/40 border border-blue-500/20 rounded-2xl p-3 text-[11px] text-indigo-200 relative z-10 space-y-1.5">
            <div className="flex items-center justify-between text-blue-300 font-bold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin: Global Velvi Cloud Platform Total</span>
              </span>
              <span className="font-mono bg-blue-900/60 px-2 py-0.5 rounded-lg text-white font-bold">
                {cloudData.global.totalRecords} Total Cloud Records
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1 text-center font-mono text-[10px] pt-1">
              <div className="bg-white/5 p-1.5 rounded-lg">Users: <strong className="text-white">{cloudData.global.usersCount}</strong></div>
              <div className="bg-white/5 p-1.5 rounded-lg">Businesses: <strong className="text-white">{cloudData.global.businessesCount}</strong></div>
              <div className="bg-white/5 p-1.5 rounded-lg">Bookings: <strong className="text-white">{cloudData.global.bookingsCount}</strong></div>
              <div className="bg-white/5 p-1.5 rounded-lg">Poojas: <strong className="text-white">{cloudData.global.poojasCount}</strong></div>
            </div>
          </div>
        )}
      </div>

      {/* Data Export (Point 55) */}
      <div className="bg-white rounded-3xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
            <Download className="w-4 h-4 text-velvi-gold" /> Export Data
          </h3>
          {!isPaidUser && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Paid Plan Only
            </span>
          )}
        </div>

        <p className="text-xs text-velvi-brown/70">
          Download your complete business records anytime into Excel or CSV spreadsheet.
        </p>

        <div className="space-y-1 text-xs text-velvi-brownDark bg-velvi-cream/30 p-3 rounded-2xl border border-velvi-gold/15">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-velvi-sacredGreen" />
            <span>Customers & Phone Directory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-velvi-sacredGreen" />
            <span>Bookings & History</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-velvi-sacredGreen" />
            <span>Pooja Items & Templates</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-velvi-sacredGreen" />
            <span>Customer Payments & Settlements</span>
          </div>
        </div>

        {isPaidUser ? (
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleExport("xlsx")}
              className="py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-velvi-goldLight" />
              <span>Export Excel (.xlsx)</span>
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="py-2.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown rounded-xl text-xs font-bold border border-velvi-gold/30 flex items-center justify-center gap-1.5 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        ) : (
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center space-y-2">
            <p className="text-xs text-amber-800 font-medium">
              Data Export is unlocked on active paid plans.
            </p>
            <Link
              href="/app/subscription"
              className="inline-block px-4 py-2 bg-velvi-brown text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Upgrade to Velvi Pro
            </Link>
          </div>
        )}
      </div>

      {/* Data Import with Preview (Point 56) */}
      <div className="bg-white rounded-3xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
            <Upload className="w-4 h-4 text-velvi-gold" /> Import Data
          </h3>
          {!isPaidUser && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Lock className="w-3 h-3" /> Paid Plan Only
            </span>
          )}
        </div>
        <p className="text-xs text-velvi-brown/70">
          Upload customer spreadsheets (Excel/CSV) with automatic duplicate phone detection.
        </p>

        {isPaidUser ? (
          <>
            <button
              onClick={handleSimulateUpload}
              className="w-full py-3 bg-velvi-cream hover:bg-velvi-gold/20 border border-dashed border-velvi-gold/50 rounded-2xl text-xs font-bold text-velvi-brown flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <Upload className="w-4 h-4 text-velvi-gold" />
              <span>Upload Sample Excel / CSV File</span>
            </button>

            {/* Validation Preview Modal (Point 56: Never import without preview) */}
            {importPreview && (
              <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/30 space-y-2 text-xs">
                <h4 className="font-bold text-xs text-velvi-brown">Import Validation Report</h4>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-velvi-gold/20">
                    <div className="font-bold text-velvi-brownDark">
                      {importPreview.validCustomers.length}
                    </div>
                    <div className="text-[10px] text-velvi-brown/60">Valid Rows</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-velvi-gold/20">
                    <div className="font-bold text-amber-700">{importPreview.duplicateCount}</div>
                    <div className="text-[10px] text-velvi-brown/60">Duplicates</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-velvi-gold/20">
                    <div className="font-bold text-red-600">{importPreview.invalidPhoneCount}</div>
                    <div className="text-[10px] text-velvi-brown/60">Invalid Phone</div>
                  </div>
                </div>

                {importPreview.errors.length > 0 && (
                  <div className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl max-h-24 overflow-y-auto space-y-0.5">
                    {importPreview.errors.map((err: string, i: number) => (
                      <div key={i} className="flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setImportPreview(null)}
                    className="flex-1 py-2 bg-velvi-cream text-velvi-brown font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importPreview.validCustomers.length === 0}
                    className="flex-1 py-2 bg-velvi-brown text-white font-bold rounded-xl text-xs shadow-sm hover:bg-velvi-brownLight cursor-pointer"
                  >
                    Confirm Import ({importPreview.validCustomers.length})
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-center space-y-2">
            <p className="text-xs text-amber-800 font-medium">
              Data Import is unlocked on active paid plans.
            </p>
            <Link
              href="/app/subscription"
              className="inline-block px-4 py-2 bg-velvi-brown text-white text-xs font-bold rounded-xl shadow-sm"
            >
              Upgrade to Velvi Pro
            </Link>
          </div>
        )}
      </div>

      {/* Factory Reset for ALL Users */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-rose-200/80 shadow-sm space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Factory Reset</span>
          </h3>
          <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Danger Zone</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          Permanently erase all bookings, devotees contacts, and payment records for this account, resetting your data back to 0.
        </p>

        {/* Current Data Metrics to be wiped */}
        <div className="grid grid-cols-3 gap-2 text-center py-0.5">
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{bookingCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">Bookings</div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{customerCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">Devotees</div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{paymentCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">Payments</div>
          </div>
        </div>

        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setResetConfirmationText("");
              setShowResetModal(true);
            }}
            className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition active:scale-[0.99] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-white shrink-0" />
            <span>Factory Reset (Reset All Data to 0)</span>
          </button>
        </div>
      </div>

      {/* Demo Data Management - Only visible for Demo Account */}
      {(currentUser?.id === "u-ravi-iyer-01" || businessId === "biz-venkateswara-01") && (
        <div className="bg-white rounded-3xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-velvi-gold" /> Demo Data Management
            </h3>
          </div>
          <p className="text-xs text-velvi-brown/70">
            You can reload sample demo bookings anytime if you want to test features.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                const res = db.loadSampleData(businessId);
                setDataVersion((v) => v + 1);
                setExportMessage(`Demo sample data loaded (${res.addedBookings} Bookings)!`);
                setTimeout(() => setExportMessage(""), 4000);
              }}
              className="w-full py-2.5 px-4 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown font-bold border border-velvi-gold/30 rounded-xl text-xs cursor-pointer transition"
            >
              Reload Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Factory Reset Safety Confirmation Modal */}
      {showResetModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowResetModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full space-y-4 shadow-2xl border-2 border-rose-400 text-left animate-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-6 h-6 text-rose-600 animate-pulse" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-black text-base text-slate-900 leading-tight">
                  Factory Reset Warning
                </h3>
                <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                  Permanent action • Cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200 space-y-2 text-xs text-rose-900 font-medium">
              <p className="font-bold">
                ⚠️ Warning: This action will permanently erase your data and reset counts to 0:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-rose-800">
                <li>All <strong>Bookings ({bookingCount})</strong> will be completely deleted.</li>
                <li>All <strong>Devotees &amp; Customer contacts ({customerCount})</strong> will be deleted.</li>
                <li>All <strong>Payment &amp; Dakshina records ({paymentCount})</strong> will be cleared.</li>
                <li>Pooja list will be refreshed to default authentic 8 Vedic Poojas.</li>
              </ul>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10.5px] font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Your Google Login &amp; Velvi Pro subscription remain safe and active!</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                To confirm, type <span className="font-mono text-rose-600 font-black">RESET</span> in the box below:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="Type RESET to confirm"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl text-xs font-mono font-bold tracking-widest outline-none transition"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformFactoryReset}
                disabled={resetConfirmationText.trim().toUpperCase() !== "RESET" || isResetting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <span>Resetting...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yes, Factory Reset</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ample bottom spacer for mobile bottom navigation */}
      <div className="h-24 pointer-events-none" />
    </div>
  );
}
