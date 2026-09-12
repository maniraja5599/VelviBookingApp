"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Pooja } from "@/lib/types";
import { Flame, Plus, Clock, IndianRupee, ChevronRight, Check } from "lucide-react";
import Link from "next/link";

export default function PoojasCataloguePage() {
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const [poojas, setPoojas] = useState<Pooja[]>(db.getPoojas(businessId));
  const [selectedPooja, setSelectedPooja] = useState<Pooja | null>(null);

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Pooja & Homam Services</h2>
          <p className="text-xs text-velvi-brown/60">
            {poojas.length} Vedic ceremonies & item templates
          </p>
        </div>

        <Link
          href="/app/bookings/new"
          className="px-3 py-1.5 bg-velvi-brown text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm"
        >
          <Plus className="w-4 h-4 text-velvi-goldLight" />
          <span>Book</span>
        </Link>
      </div>

      {/* Poojas List */}
      <div className="space-y-2.5">
        {poojas.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelectedPooja(p)}
            className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center shrink-0 mt-0.5">
                <Flame className="w-5 h-5 text-velvi-gold" />
              </div>

              <div>
                <h4 className="font-bold text-sm text-velvi-brownDark">{p.englishName}</h4>
                <div className="flex items-center gap-3 text-[11px] text-velvi-brown/60 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-velvi-gold" /> {p.durationMinutes} mins
                  </span>
                  <span>•</span>
                  <span>{p.items?.length || 0} required items</span>
                </div>
              </div>
            </div>

            <div className="text-right flex items-center gap-2">
              <div className="text-sm font-extrabold text-velvi-brownDark">
                ₹{p.basePrice.toLocaleString("en-IN")}
              </div>
              <ChevronRight className="w-4 h-4 text-velvi-brown/40" />
            </div>
          </div>
        ))}
      </div>

      {/* Selected Pooja Details Drawer */}
      {selectedPooja && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-velvi-gold animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-velvi-brownDark">
                  {selectedPooja.englishName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedPooja(null)}
                className="text-xs text-velvi-brown/60 hover:text-velvi-brown"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-velvi-brown/80 leading-relaxed">
              {selectedPooja.description}
            </p>

            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 flex justify-between text-xs">
              <div>
                <span className="text-velvi-brown/60 block">Base Dakshina</span>
                <span className="font-extrabold text-velvi-brownDark">
                  ₹{selectedPooja.basePrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="text-velvi-brown/60 block">Duration</span>
                <span className="font-bold text-velvi-brownDark">
                  {selectedPooja.durationMinutes} Minutes
                </span>
              </div>
            </div>

            {/* Standard Required Items Template */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide">
                Default Required Items Checklist ({selectedPooja.items?.length || 0})
              </h4>
              <div className="bg-white rounded-xl border border-velvi-gold/20 divide-y divide-velvi-creamDark max-h-48 overflow-y-auto">
                {selectedPooja.items?.map((it, idx) => (
                  <div key={it.id} className="p-2.5 flex items-center justify-between text-xs">
                    <span>
                      {idx + 1}. {it.itemEnglishName || it.itemTamilName}
                    </span>
                    <span className="font-bold text-velvi-brown bg-velvi-cream px-2 py-0.5 rounded text-[11px]">
                      {it.quantity} {it.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href={`/app/bookings/new`}
              className="block w-full py-3 bg-velvi-brown text-white text-center font-bold text-xs rounded-xl shadow-sm hover:bg-velvi-brownLight"
            >
              Book this Homam
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
