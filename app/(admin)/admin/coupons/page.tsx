"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db/store";
import { Coupon, CouponDiscountType } from "@/lib/types";
import {
  Tag,
  Plus,
  Copy,
  Check,
  Trash2,
  Eye,
  Pencil,
  X,
  Save,
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Crown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { retryCloudSync } from "@/lib/supabase/sync";
import { useAuth } from "@/components/providers/AuthContext";

export default function CouponsAdminPage() {
  const { currentUser } = useAuth();
  const isSuperAdmin = Boolean(
    currentUser?.role === "SUPER_ADMIN" ||
      currentUser?.email?.trim().toLowerCase() === "manirajankg@gmail.com"
  );

  const [coupons, setCoupons] = useState<Coupon[]>(() => [...db.coupons]);
  const [toast, setToast] = useState("");
  const [toastError, setToastError] = useState("");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  // New coupon form
  const [newCode, setNewCode] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDiscountType, setNewDiscountType] = useState<CouponDiscountType>("FREE_VALIDITY");
  const [newDiscountVal, setNewDiscountVal] = useState(100);
  const [newBonusDays, setNewBonusDays] = useState(30);
  const [newMaxUses, setNewMaxUses] = useState(500);
  const [newValidUntil, setNewValidUntil] = useState("2028-12-31");
  const [newShowInSuggestions, setNewShowInSuggestions] = useState(true);

  // Edit coupon
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editCode, setEditCode] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDiscountType, setEditDiscountType] = useState<CouponDiscountType>("FREE_VALIDITY");
  const [editDiscountVal, setEditDiscountVal] = useState(100);
  const [editBonusDays, setEditBonusDays] = useState(30);
  const [editMaxUses, setEditMaxUses] = useState(500);
  const [editValidUntil, setEditValidUntil] = useState("2028-12-31");
  const [editShowInSuggestions, setEditShowInSuggestions] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);

  // Audit modal & delete confirm & copy
  const [auditCoupon, setAuditCoupon] = useState<Coupon | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; code: string } | null>(null);
  const [copied, setCopied] = useState("");

  const showToast = (msg: string, isError = false) => {
    if (isError) {
      setToastError(msg);
      setTimeout(() => setToastError(""), 4000);
    } else {
      setToast(msg);
      setTimeout(() => setToast(""), 4000);
    }
  };

  useEffect(() => {
    db.syncCouponsFromCloud()
      .then((c) => setCoupons([...c]))
      .catch(() => {});
  }, []);

  const refresh = () => setCoupons([...db.coupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = db.createCoupon({
      code: newCode,
      description: newDesc,
      discountType: newDiscountType,
      discountValue: Number(newDiscountVal) || 0,
      validityDaysBonus: Number(newBonusDays) || 0,
      maxUses: Number(newMaxUses) || 100,
      validUntil: newValidUntil ? `${newValidUntil}T23:59:59Z` : "2030-12-31T23:59:59Z",
      isActive: true,
      showInSuggestions: newShowInSuggestions,
    });
    if (res.success && res.coupon) {
      showToast(`Coupon '${res.coupon.code}' created!`);
      setNewCode("");
      setNewDesc("");
      refresh();
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Failed to create coupon", true);
    }
  };

  const handleToggle = async (id: string) => {
    db.toggleCouponStatus(id);
    refresh();
    try {
      await retryCloudSync("biz-super-admin-01");
    } catch {}
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    db.deleteCoupon(toDelete.id);
    refresh();
    showToast(`Coupon ${toDelete.code} deleted.`);
    setToDelete(null);
    try {
      await retryCloudSync("biz-super-admin-01");
    } catch {}
  };

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(""), 2000);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setEditCode(c.code);
    setEditDesc(c.description);
    setEditDiscountType(c.discountType);
    setEditDiscountVal(c.discountValue);
    setEditBonusDays(c.validityDaysBonus || 0);
    setEditMaxUses(c.maxUses || 100);
    setEditValidUntil(c.validUntil ? c.validUntil.split("T")[0] : "2028-12-31");
    setEditShowInSuggestions(c.showInSuggestions !== false);
    setEditIsActive(c.isActive !== false);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    const res = db.updateCoupon({
      id: editingCoupon.id,
      code: editCode,
      description: editDesc,
      discountType: editDiscountType,
      discountValue: Number(editDiscountVal) || 0,
      validityDaysBonus: Number(editBonusDays) || 0,
      maxUses: Number(editMaxUses) || 100,
      validUntil: editValidUntil ? `${editValidUntil}T23:59:59Z` : "2030-12-31T23:59:59Z",
      showInSuggestions: editShowInSuggestions,
      isActive: editIsActive,
    });
    if (res.success && res.coupon) {
      showToast(`Coupon '${res.coupon.code}' updated!`);
      setEditingCoupon(null);
      refresh();
      try {
        await retryCloudSync("biz-super-admin-01");
      } catch {}
    } else {
      showToast(res.error || "Failed to update", true);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
        {/* Toast Notifications */}
        {toast && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            {toast}
          </div>
        )}
        {toastError && (
          <div className="fixed top-4 right-4 z-50 px-4 py-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl shadow-lg text-sm font-bold flex items-center gap-2 animate-in slide-in-from-top-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            {toastError}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">Coupons & Promos</h1>
              <p className="text-xs text-slate-500">
                Create and manage promotional discount codes
              </p>
            </div>
          </div>
          <span className="text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1.5 rounded-full">
            {coupons.length} Codes
          </span>
        </div>

        {/* Editor Admin restriction notice or Create Form */}
        {!isSuperAdmin ? (
          <div className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-sm flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <Crown className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                  Editor Admin View (Read Only)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Coupon creation and deletion are restricted to Super Admin. You can view and copy
                  promo codes.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">
              View Only
            </span>
          </div>
        ) : (
          /* Create New Coupon Form - Collapsible for mobile screen efficiency */
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-sm p-4 sm:p-6 transition">
            <div
              onClick={() => setIsCreateFormOpen(!isCreateFormOpen)}
              className="flex items-center justify-between cursor-pointer gap-2 select-none"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Create New Coupon Code</h2>
                  <p className="text-[10.5px] text-slate-500">
                    {isCreateFormOpen ? "Fill details to create promo code" : "Click to expand & create new code"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <span>{isCreateFormOpen ? "Close Form" : "+ Create Code"}</span>
                {isCreateFormOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {isCreateFormOpen && (
              <form onSubmit={handleCreate} className="space-y-4 text-xs mt-4 pt-4 border-t border-slate-100 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. VELVI2025"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Discount Type</label>
                  <select
                    value={newDiscountType}
                    onChange={(e) => setNewDiscountType(e.target.value as CouponDiscountType)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                  >
                    <option value="FREE_VALIDITY">100% Free Pass</option>
                    <option value="BONUS_DAYS_ONLY">Bonus Validity Only (+Days)</option>
                    <option value="PERCENTAGE">Percentage Off %</option>
                    <option value="FLAT">Flat ₹ Deduction</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-700 font-bold block mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="e.g. Free 30-day trial for new priests"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Discount Value (
                    {newDiscountType === "PERCENTAGE" ? "%" : "₹"})
                  </label>
                  <input
                    type="number"
                    min={0}
                    disabled={newDiscountType === "BONUS_DAYS_ONLY"}
                    value={newDiscountType === "BONUS_DAYS_ONLY" ? 0 : newDiscountVal}
                    onChange={(e) => setNewDiscountVal(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Bonus Validity (+Days)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={newBonusDays}
                    onChange={(e) => setNewBonusDays(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Max Redemptions</label>
                  <input
                    type="number"
                    min={1}
                    value={newMaxUses}
                    onChange={(e) => setNewMaxUses(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Valid Until</label>
                  <input
                    type="date"
                    value={newValidUntil}
                    onChange={(e) => setNewValidUntil(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="newShowInSugg"
                    checked={newShowInSuggestions}
                    onChange={(e) => setNewShowInSuggestions(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-200 text-amber-500 focus:ring-amber-400 cursor-pointer"
                  />
                  <label
                    htmlFor="newShowInSugg"
                    className="text-xs text-slate-700 font-semibold cursor-pointer"
                  >
                    Show in checkout suggestions
                  </label>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Coupon Code</span>
                </button>
              </div>
            </form>
            )}
          </div>
        )}

        {/* Coupon List */}
        <div className="space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            All Coupon Codes ({coupons.length})
          </h2>
          {coupons.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-10 text-center text-slate-400">
              <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">
                No coupon codes yet. Create your first one above!
              </p>
            </div>
          ) : (
            coupons.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="font-mono font-black text-base text-slate-900 tracking-wider bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl shrink-0">
                      {c.code}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            c.isActive
                              ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                              : "bg-slate-100 text-slate-500 border-slate-200"
                          }`}
                        >
                          {c.isActive ? "Active" : "Disabled"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {c.discountType === "FREE_VALIDITY"
                            ? "100% Free"
                            : c.discountType === "BONUS_DAYS_ONLY"
                              ? `+${c.validityDaysBonus}d Bonus`
                              : c.discountType === "PERCENTAGE"
                                ? `${c.discountValue}% OFF`
                                : `₹${c.discountValue} OFF`}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {c.usedCount || 0}/{c.maxUses} used
                        </span>
                        {c.showInSuggestions && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-700 border border-sky-200">
                            Suggested
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <button
                      type="button"
                      title="Copy code"
                      onClick={() => handleCopy(c.code)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-500 hover:text-amber-700 transition cursor-pointer"
                    >
                      {copied === c.code ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      title="View audit history"
                      onClick={() => setAuditCoupon(c)}
                      className="p-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 text-slate-500 hover:text-sky-700 transition cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {isSuperAdmin && (
                      <>
                        <button
                          type="button"
                          title="Edit coupon"
                          onClick={() => openEdit(c)}
                          className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 border border-slate-200 text-slate-500 hover:text-amber-700 transition cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          title={c.isActive ? "Disable" : "Enable"}
                          onClick={() => handleToggle(c.id)}
                          className={`p-2 rounded-xl border transition cursor-pointer ${
                            c.isActive
                              ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                              : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-400"
                          }`}
                        >
                          {c.isActive ? (
                            <ToggleRight className="w-4 h-4" />
                          ) : (
                            <ToggleLeft className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          title="Delete coupon"
                          onClick={() => setToDelete({ id: c.id, code: c.code })}
                          className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-500 transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {c.validUntil && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>
                      Expires:{" "}
                      {new Date(c.validUntil).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    {c.validityDaysBonus ? (
                      <span className="text-amber-700 font-bold ml-2">
                        +{c.validityDaysBonus} bonus days
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Edit Coupon Modal */}
        {editingCoupon && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white border border-amber-300 rounded-3xl p-4 sm:p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-200 text-amber-700 flex items-center justify-center">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-sm text-slate-900">Edit Coupon Code</h3>
                    <p className="text-[10.5px] text-slate-500 font-mono">ID: {editingCoupon.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Coupon Code *</label>
                    <input
                      type="text"
                      required
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold uppercase tracking-wider focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Discount Type</label>
                    <select
                      value={editDiscountType}
                      onChange={(e) => setEditDiscountType(e.target.value as CouponDiscountType)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                    >
                      <option value="FREE_VALIDITY">100% Free Pass</option>
                      <option value="BONUS_DAYS_ONLY">Bonus Validity Only (+Days)</option>
                      <option value="PERCENTAGE">Percentage Off %</option>
                      <option value="FLAT">Flat ₹ Deduction</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-slate-700 font-bold block mb-1">Description *</label>
                    <input
                      type="text"
                      required
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Discount Value</label>
                    <input
                      type="number"
                      min={0}
                      disabled={editDiscountType === "BONUS_DAYS_ONLY"}
                      value={editDiscountType === "BONUS_DAYS_ONLY" ? 0 : editDiscountVal}
                      onChange={(e) => setEditDiscountVal(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">
                      Bonus Validity (+Days)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={editBonusDays}
                      onChange={(e) => setEditBonusDays(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Max Redemptions</label>
                    <input
                      type="number"
                      min={1}
                      value={editMaxUses}
                      onChange={(e) => setEditMaxUses(Number(e.target.value))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Valid Until</label>
                    <input
                      type="date"
                      value={editValidUntil}
                      onChange={(e) => setEditValidUntil(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="editShowInSugg"
                      checked={editShowInSuggestions}
                      onChange={(e) => setEditShowInSuggestions(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-200 text-amber-500 focus:ring-amber-400 cursor-pointer"
                    />
                    <label
                      htmlFor="editShowInSugg"
                      className="text-xs text-slate-700 font-semibold cursor-pointer"
                    >
                      Show in checkout suggestions
                    </label>
                  </div>
                  <div className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      id="editIsActive"
                      checked={editIsActive}
                      onChange={(e) => setEditIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-200 text-emerald-500 focus:ring-emerald-400 cursor-pointer"
                    />
                    <label
                      htmlFor="editIsActive"
                      className="text-xs text-slate-700 font-semibold cursor-pointer"
                    >
                      Coupon is active and redeemable
                    </label>
                  </div>
                </div>
                <div className="flex gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCoupon(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs shadow transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Audit History Modal */}
        {auditCoupon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-200 flex items-center justify-center text-amber-700">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono font-black text-slate-900 text-base tracking-wider">
                      {auditCoupon.code}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{auditCoupon.description}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAuditCoupon(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-2 p-4 bg-slate-50 border-b border-slate-100 text-center">
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">
                    Redemptions
                  </span>
                  <span className="text-base font-black text-slate-900 block mt-0.5">
                    {auditCoupon.usedCount || 0}{" "}
                    <span className="text-xs text-slate-500 font-normal">
                      / {auditCoupon.maxUses}
                    </span>
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] text-amber-800 font-bold block uppercase tracking-wider">
                    Bonus Days
                  </span>
                  <span className="text-base font-black text-amber-800 block mt-0.5">
                    +{auditCoupon.validityDaysBonus} Days
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200">
                  <span className="text-[10px] font-bold block uppercase tracking-wider text-emerald-700">
                    Status
                  </span>
                  <span
                    className={`text-base font-black block mt-0.5 ${auditCoupon.isActive ? "text-emerald-700" : "text-slate-400"}`}
                  >
                    {auditCoupon.isActive ? "Active" : "Disabled"}
                  </span>
                </div>
              </div>
              <div className="p-4 overflow-y-auto flex-1 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-amber-700" />
                  Redemption Audit History
                </h4>
                {(() => {
                  const redemptions = db.getCouponRedemptions(auditCoupon.code);
                  if (redemptions.length === 0) {
                    return (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 space-y-2">
                        <Clock className="w-8 h-8 mx-auto opacity-40" />
                        <p className="text-xs font-bold text-slate-500">No redemptions yet</p>
                      </div>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {redemptions.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {r.userName}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate">
                              {r.businessName} •{" "}
                              {new Date(r.createdAt).toLocaleString("en-IN", {
                                dateStyle: "medium",
                                timeStyle: "short",
                              })}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-sm text-emerald-700 block">
                              ₹{r.amount.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[10px] text-amber-700 font-bold">
                              +{r.bonusDaysAdded}d
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setAuditCoupon(null)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {toDelete && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full space-y-4 border border-rose-200 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Delete Promo Coupon?</h3>
                  <p className="text-[11px] text-rose-600 font-mono font-bold">{toDelete.code}</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete promo code{" "}
                <strong className="text-slate-900 font-mono">{toDelete.code}</strong>? Users will no
                longer be able to redeem it.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setToDelete(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer text-center text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow cursor-pointer active:scale-95 text-center text-xs"
                >
                  Delete Coupon
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
