"use client";

import React from "react";
import { db } from "@/lib/db/store";
import { Sparkles, Clock, CheckCircle, Shield } from "lucide-react";

export default function AdminSubscriptionsPage() {
  const subscriptions = db.subscriptions;
  const businesses = db.businesses;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Subscriptions & Plans</h1>
        <p className="text-xs text-gray-400">
          Monitor plan validity, renewals, and subscription states across all businesses
        </p>
      </div>

      <div className="bg-gray-800/60 rounded-3xl border border-gray-700/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-gray-900/80 text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-700">
              <tr>
                <th className="p-4">Business</th>
                <th className="p-4">Plan Name</th>
                <th className="p-4">Billing Cycle</th>
                <th className="p-4">Status</th>
                <th className="p-4">Period Start</th>
                <th className="p-4">Period End</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {subscriptions.map((sub) => {
                const biz = businesses.find((b) => b.id === sub.businessId) || businesses[0];
                return (
                  <tr key={sub.id} className="hover:bg-gray-700/30 transition">
                    <td className="p-4 font-bold text-white">{biz?.name}</td>
                    <td className="p-4 text-amber-400 font-semibold">{sub.planName}</td>
                    <td className="p-4 uppercase text-[11px] text-gray-300">{sub.billingCycle}</td>
                    <td className="p-4">
                      <span
                        className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
                          sub.status === "ACTIVE"
                            ? "bg-green-950 text-green-400 border border-green-800"
                            : "bg-amber-950 text-amber-400 border border-amber-800"
                        }`}
                      >
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">
                      {new Date(sub.currentPeriodStart).toLocaleDateString("en-IN")}
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN")}
                    </td>
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
