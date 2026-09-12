"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { IyerSettlement } from "@/lib/types";
import { IndianRupee, CheckCircle2, Clock, AlertCircle, Plus, X } from "lucide-react";

export default function PaymentsPage() {
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [activeTab, setActiveTab] = useState<"customer" | "settlement">("customer");
  const bookings = db.getBookings(businessId);
  const members = db.getMembers(businessId);

  // Settlement Recording Modal
  const [selectedIyerForSettlement, setSelectedIyerForSettlement] = useState<string | null>(null);
  const [settlementAmount, setSettlementAmount] = useState<number>(5000);
  const [settlementMethod, setSettlementMethod] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [settlementRef, setSettlementRef] = useState<string>("");

  const handleRecordSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIyerForSettlement || settlementAmount <= 0) return;

    const iyer = members.find((m) => m.id === selectedIyerForSettlement);
    const newSettlement: IyerSettlement = {
      id: `set-${Date.now()}`,
      businessId,
      iyerId: selectedIyerForSettlement,
      iyerName: iyer?.name || "Iyer",
      amount: Number(settlementAmount),
      paymentMethod: settlementMethod,
      reference: settlementRef || `SET/${Date.now().toString().slice(-6)}`,
      settlementDate: new Date().toISOString().split("T")[0],
      createdAt: new Date().toISOString(),
    };

    db.settlements.push(newSettlement);
    setSelectedIyerForSettlement(null);
    setSettlementRef("");
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-velvi-brownDark">Payments & Accounts</h2>
        <p className="text-xs text-velvi-brown/60">
          Track customer receipts & Iyer settlements
        </p>
      </div>

      {/* 2 Tabs: Customer vs Iyer Settlement */}
      <div className="flex bg-velvi-creamDark/60 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab("customer")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === "customer"
              ? "bg-white text-velvi-brownDark font-bold shadow-sm"
              : "text-velvi-brown/70 hover:text-velvi-brown"
          }`}
        >
          Customer Receipts
        </button>
        <button
          onClick={() => setActiveTab("settlement")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === "settlement"
              ? "bg-white text-velvi-brownDark font-bold shadow-sm"
              : "text-velvi-brown/70 hover:text-velvi-brown"
          }`}
        >
          Iyer Settlements
        </button>
      </div>

      {/* 1. Customer Receipts Tab */}
      {activeTab === "customer" && (
        <div className="space-y-2.5">
          {bookings.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm flex items-center justify-between"
            >
              <div>
                <h4 className="font-bold text-sm text-velvi-brownDark">{b.customerName}</h4>
                <div className="text-xs text-velvi-brown/70 mt-0.5">
                  {b.poojaEnglishName} • {b.date}
                </div>
                {b.advanceAmount > 0 && b.balanceAmount > 0 && (
                  <div className="text-[11px] text-velvi-brown/60 mt-0.5">
                    Adv: ₹{b.advanceAmount} | Due: ₹{b.balanceAmount}
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-velvi-brownDark">
                  ₹{b.totalAmount.toLocaleString("en-IN")}
                </div>
                <span
                  className={`inline-block text-[11px] px-2.5 py-0.5 rounded-full font-bold mt-1 ${
                    b.paymentStatus === "PAID"
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {b.paymentStatus === "PAID" ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Iyer Settlement Tab (Point 41, 42, 43) */}
      {activeTab === "settlement" && (
        <div className="space-y-3">
          <div className="bg-gradient-to-br from-velvi-creamLight to-velvi-cream p-3.5 rounded-2xl border border-velvi-gold/30 shadow-sacred">
            <h4 className="text-xs font-bold text-velvi-brown uppercase tracking-wider">
              Settlement Model
            </h4>
            <p className="text-xs text-velvi-brown/80 mt-1">
              Fixed fee or % commission recorded per completed homam.
            </p>
          </div>

          <div className="space-y-2.5">
            {members.map((iyer) => {
              const iyerBookings = bookings.filter((b) => b.assignedIyerId === iyer.id);
              const totalValue = iyerBookings.reduce((sum, b) => sum + b.totalAmount, 0);
              // Estimated Iyer share: 40%
              const estimatedShare = Math.round(totalValue * 0.4);
              const settlements = db.settlements.filter((s) => s.iyerId === iyer.id);
              const paidAmount = settlements.reduce((sum, s) => sum + s.amount, 0);
              const pendingBalance = Math.max(0, estimatedShare - paidAmount);

              return (
                <div
                  key={iyer.id}
                  className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-velvi-brownDark">{iyer.name}</h4>
                      <p className="text-xs text-velvi-brown/60">
                        {iyerBookings.length} bookings • Total Value: ₹
                        {totalValue.toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedIyerForSettlement(iyer.id);
                        setSettlementAmount(pendingBalance > 0 ? pendingBalance : 2000);
                      }}
                      className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold shadow-sm transition"
                    >
                      Pay Settlement
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-velvi-cream/40 p-2.5 rounded-xl border border-velvi-gold/15 text-center text-xs">
                    <div>
                      <div className="text-[10px] text-velvi-brown/60">Earned</div>
                      <div className="font-bold text-velvi-brownDark">
                        ₹{estimatedShare.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-velvi-brown/60">Paid</div>
                      <div className="font-bold text-green-700">
                        ₹{paidAmount.toLocaleString("en-IN")}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-velvi-brown/60">Pending</div>
                      <div className="font-bold text-amber-700">
                        ₹{pendingBalance.toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pay Settlement Modal */}
      {selectedIyerForSettlement && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-velvi-gold/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-velvi-brownDark">Record Iyer Settlement</h3>
              <button
                onClick={() => setSelectedIyerForSettlement(null)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSettlement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Settlement Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(Number(e.target.value))}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-sm font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Payment Method
                </label>
                <select
                  value={settlementMethod}
                  onChange={(e) => setSettlementMethod(e.target.value as any)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                >
                  <option value="UPI">UPI / Google Pay / PhonePe</option>
                  <option value="CASH">Cash in Hand</option>
                  <option value="BANK_TRANSFER">NEFT / IMPS Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Reference / UTR / Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. UPI/39482710/GPay"
                  value={settlementRef}
                  onChange={(e) => setSettlementRef(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIyerForSettlement(null)}
                  className="flex-1 py-2.5 bg-velvi-cream text-velvi-brown rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
