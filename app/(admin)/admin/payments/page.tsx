"use client";

import React from "react";
import { db } from "@/lib/db/store";
import { CreditCard, CheckCircle, ShieldCheck } from "lucide-react";

export default function AdminPaymentsPage() {
  const payments = db.payments;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Cashfree Gateway Payments</h1>
        <p className="text-xs text-gray-400">
          Monitor verified payment transactions, webhook signatures, and cashflow
        </p>
      </div>

      <div className="bg-gray-800/60 rounded-3xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-4">Order ID</th>
                <th className="p-4">Gateway Ref</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Method</th>
                <th className="p-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-700/30 transition">
                  <td className="p-4 font-mono font-bold text-white">{p.orderId}</td>
                  <td className="p-4 font-mono text-gray-400">{p.gatewayPaymentId || "cf_test"}</td>
                  <td className="p-4 font-black text-amber-400 text-sm">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </td>
                  <td className="p-4 uppercase text-[11px] text-gray-300">{p.billingCycle}</td>
                  <td className="p-4">
                    <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-green-950 text-green-400 border border-green-800 flex items-center gap-1 w-fit">
                      <ShieldCheck className="w-3 h-3" /> {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-gray-300">{p.paymentMethod || "UPI"}</td>
                  <td className="p-4 text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
