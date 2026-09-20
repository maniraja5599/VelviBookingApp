"use client";

import React, { useState, useEffect, useRef } from "react";
import { RotateCcw, CheckCircle2, X } from "lucide-react";
import { db } from "@/lib/db/store";

interface DeletedItemPayload {
  type: "booking" | "customer" | "pooja";
  name: string;
  id: string;
}

export const GlobalUndoToast: React.FC = () => {
  const [activeItem, setActiveItem] = useState<DeletedItemPayload | null>(null);
  const [restoredName, setRestoredName] = useState<string | null>(null);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleItemDeleted = (e: Event) => {
      const customEvent = e as CustomEvent<DeletedItemPayload>;
      if (customEvent.detail) {
        setActiveItem(customEvent.detail);
        setRestoredName(null);

        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
          setActiveItem(null);
        }, 8000); // 8 seconds auto-dismiss
      }
    };

    window.addEventListener("velvi:deleted-item", handleItemDeleted);
    return () => {
      window.removeEventListener("velvi:deleted-item", handleItemDeleted);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, []);

  const handleUndo = () => {
    const res = db.undoLastDelete();
    if (res.success) {
      setRestoredName(res.name || activeItem?.name || "Item");
      setActiveItem(null);

      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        setRestoredName(null);
      }, 3000);
    }
  };

  const handleDismiss = () => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    setActiveItem(null);
    setRestoredName(null);
  };

  if (!activeItem && !restoredName) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200">
      {restoredName ? (
        <div className="bg-emerald-950 text-white px-4 py-2.5 rounded-2xl shadow-xl border border-emerald-700/80 flex items-center gap-2 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="truncate">{restoredName} மீட்டெடுக்கப்பட்டது (Restored)!</span>
          <button
            onClick={handleDismiss}
            className="p-1 text-slate-400 hover:text-white transition ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : activeItem ? (
        <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl shadow-2xl border border-velvi-gold/50 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base">🗑️</span>
            <span className="truncate font-semibold text-slate-200 text-[11px] sm:text-xs">
              <strong className="text-white font-bold">{activeItem.name}</strong> நீக்கப்பட்டது
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleUndo}
              className="px-2.5 py-1.5 bg-gradient-to-r from-velvi-gold to-amber-400 text-velvi-brownDark rounded-xl text-xs font-black shadow-sm flex items-center gap-1 hover:brightness-105 active:scale-95 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>மீட்டெடு (Undo)</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 text-slate-400 hover:text-white transition rounded-full"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
