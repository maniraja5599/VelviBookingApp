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
  ArrowLeft,
  RotateCcw,
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

  // Factory Reset state for ALL users
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetConfirmationText, setResetConfirmationText] = useState("");
  const [isResetting, setIsResetting] = useState(false);

  // Dynamic business data counts for reset preview
  const [dataVersion, setDataVersion] = useState(0);
  const bookingCount = db.getBookings(businessId).length;
  const customerCount = db.getCustomers(businessId).length;
  const paymentCount = db.payments.filter((p) => p.businessId === businessId).length;

  const handlePerformFactoryReset = () => {
    if (resetConfirmationText.trim().toUpperCase() !== "RESET") return;
    setIsResetting(true);
    try {
      const res = db.factoryResetBusiness(businessId);
      setShowResetModal(false);
      setResetConfirmationText("");
      setDataVersion((v) => v + 1);
      setExportMessage(
        `தொழிற்சாலை மீட்டமைப்பு முடிந்தது! நீக்கப்பட்டவை: ${res.deletedBookings} முன்பதிவுகள், ${res.deletedCustomers} பக்தர்கள், ${res.deletedPayments} கட்டணங்கள். ஆரம்பநிலை 8 வேத பூஜைகள் மீட்டமைக்கப்பட்டன.`
      );
      setTimeout(() => setExportMessage(""), 6000);
    } catch (e: any) {
      setExportMessage("மீட்டமைப்பு தோல்வியுற்றது: " + (e?.message || "Error"));
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

      {/* Factory Reset / தொழிற்சாலை மீட்டமைப்பு for ALL Users */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-rose-200/80 shadow-sm space-y-3.5 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-600 shrink-0" />
            <span>தொழிற்சாலை மீட்டமைப்பு (Factory Reset)</span>
          </h3>
          <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2.5 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 shrink-0">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
            <span>Danger Zone</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          உங்கள் கணக்கின் அனைத்து முன்பதிவுகள், பக்தர்கள் பதிவுகள் மற்றும் கட்டண கணக்குகளை முழுமையாக அழித்து புத்தம் புதிய ஆரம்ப நிலைக்கு (Clean Slate) கொண்டுவரலாம்.
        </p>

        {/* Current Data Metrics to be wiped */}
        <div className="grid grid-cols-3 gap-2 text-center py-0.5">
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{bookingCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">முன்பதிவுகள்</div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{customerCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">பக்தர்கள்</div>
          </div>
          <div className="bg-rose-50/70 p-2.5 rounded-2xl border border-rose-100">
            <div className="text-base font-black text-rose-900">{paymentCount}</div>
            <div className="text-[10px] font-bold text-rose-700/80">கட்டணங்கள்</div>
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
            <span>தொழிற்சாலை மீட்டமைப்பைத் தொடங்கு (Reset All Data)</span>
          </button>
        </div>
      </div>

      {/* Demo Data Management - Only visible for Demo Account */}
      {(currentUser?.id === "u-ravi-iyer-01" || businessId === "biz-venkateswara-01") && (
        <div className="bg-white rounded-3xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-velvi-brownDark flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-velvi-gold" /> மாதிரி பதிவுகள் மேலாண்மை (Demo Data)
            </h3>
          </div>
          <p className="text-xs text-velvi-brown/70">
            மாதிரி முன்பதிவுகளை மீண்டும் ஏற்ற வேண்டுமானால் கீழே உள்ள பட்டனை பயன்படுத்தலாம்.
          </p>
          <div className="pt-1">
            <button
              onClick={() => {
                const res = db.loadSampleData(businessId);
                setDataVersion((v) => v + 1);
                setExportMessage(`மாதிரி பதிவுகள் ஏற்றப்பட்டன (${res.addedBookings} முன்பதிவுகள்)!`);
                setTimeout(() => setExportMessage(""), 4000);
              }}
              className="w-full py-2.5 px-4 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown font-bold border border-velvi-gold/30 rounded-xl text-xs cursor-pointer transition"
            >
              மாதிரி ஏற்று (Reload Demo)
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
                  தொழிற்சாலை மீட்டமைப்பு எச்சரிக்கை
                </h3>
                <p className="text-[11px] font-bold text-rose-600 mt-0.5">
                  Factory Reset Warning • Cannot be undone
                </p>
              </div>
            </div>

            <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200 space-y-2 text-xs text-rose-900 font-medium">
              <p className="font-bold">
                ⚠️ எச்சரிக்கை: இந்த செயல்முறை உங்கள் கணக்கின் அனைத்து தரவுகளையும் நிரந்தரமாக நீக்கும்:
              </p>
              <ul className="list-disc pl-4 space-y-1 text-[11.5px] text-rose-800">
                <li>அனைத்து <strong>முன்பதிவுகள் ({bookingCount})</strong> முழுமையாக அழிக்கப்படும்.</li>
                <li>அனைத்து <strong>பக்தர்கள் தொடர்பு எண்கள் ({customerCount})</strong> அழிக்கப்படும்.</li>
                <li>அனைத்து <strong>வரவு-செலவு மற்றும் தக்ஷிணை பதிவுகள் ({paymentCount})</strong> நீக்கப்படும்.</li>
                <li>பூஜைகள் பட்டியல் ஆரம்பநிலை <strong>8 வேத பூஜைகளாக</strong> மீட்டமைக்கப்படும்.</li>
              </ul>
              <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[10.5px] font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>உங்கள் Google லாகின் &amp; Velvi Pro சந்தா பத்திரமாக இருக்கும்!</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700">
                உறுதிப்படுத்த கீழே உள்ள பெட்டியில் <span className="font-mono text-rose-600 font-black">RESET</span> என தட்டச்சு செய்யவும்:
              </label>
              <input
                type="text"
                value={resetConfirmationText}
                onChange={(e) => setResetConfirmationText(e.target.value)}
                placeholder="RESET என டைப் செய்யவும்"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:border-rose-500 focus:bg-white rounded-xl text-xs font-mono font-bold tracking-widest outline-none transition"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                ரத்து செய் (Cancel)
              </button>
              <button
                type="button"
                onClick={handlePerformFactoryReset}
                disabled={resetConfirmationText.trim().toUpperCase() !== "RESET" || isResetting}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isResetting ? (
                  <span>மீட்டமைக்கப்படுகிறது...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>ஆம், மீட்டமை (Reset)</span>
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
