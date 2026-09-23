"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { exportBusinessData, validateCustomerImport } from "@/lib/export-import/engine";
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
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-velvi-brownDark">Data & Cloud Backup</h2>
        <p className="text-xs text-velvi-brown/60">Export, import, and backup your records</p>
      </div>

      {exportMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-3 rounded-2xl text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
          <span>{exportMessage}</span>
        </div>
      )}

      {/* Cloud Backup Status Banner (Point 54) */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-200 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
          <Cloud className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-xs text-blue-900">Automatic Cloud Backup</h4>
          <p className="text-[11px] text-blue-700 mt-0.5">
            ☁️ Your data is securely backed up and encrypted in the cloud.
          </p>
        </div>
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

      {/* Demo Data Management */}
      <div className="bg-white rounded-3xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-velvi-gold" /> மாதிரி பதிவுகள் மேலாண்மை (Demo Data)
          </h3>
        </div>
        <p className="text-xs text-velvi-brown/70">
          சோதனைக்காக வைக்கப்பட்ட மாதிரி முன்பதிவுகள் மற்றும் மாதிரி பக்தர்களின் விவரங்களை ஒரே கிளிக்கில் நீக்கிவிட்டு புதிய பதிவுகளை தொடங்கலாம்.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button
            onClick={() => {
              if (window.confirm("மாதிரி முன்பதிவுகள் மற்றும் மாதிரி பக்தர்களின் விவரங்களை நீக்கவா?\n(Clear sample demo bookings & devotees?)")) {
                const res = db.clearDemoData();
                setExportMessage(`மாதிரி முன்பதிவுகள் (${res.removedBookings}) மற்றும் பக்தர்கள் (${res.removedCustomers}) நீக்கப்பட்டனர்!`);
                setTimeout(() => setExportMessage(""), 4000);
              }
            }}
            className="flex-1 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-xl text-xs cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <span>மாதிரி பதிவுகளை நீக்கு (Clear Demo Data)</span>
          </button>
          <button
            onClick={() => {
              const res = db.loadSampleData(businessId);
              setExportMessage(`மாதிரி பதிவுகள் ஏற்றப்பட்டன (${res.addedBookings} முன்பதிவுகள்)!`);
              setTimeout(() => setExportMessage(""), 4000);
            }}
            className="py-2.5 px-4 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown font-bold border border-velvi-gold/30 rounded-xl text-xs cursor-pointer transition"
          >
            மாதிரி ஏற்று (Reload Demo)
          </button>
        </div>
      </div>
    </div>
  );
}
