"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useTheme } from "@/components/providers/ThemeContext";
import { db } from "@/lib/db/store";
import { BookingItem } from "@/lib/types";
import { generatePoojaFlyer } from "@/lib/flyer/canvas-generator";
import { formatPoojaItemsWhatsAppMessage } from "@/lib/whatsapp/formatter";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Image as ImageIcon,
  Plus,
  Trash2,
  Check,
  Download,
  Flame,
  FileText,
  Sparkles,
} from "lucide-react";

export default function BookingItemsPage() {
  const params = useParams();
  const { currentBusiness } = useAuth();
  const { theme } = useTheme();

  const bookingId = params.id as string;
  const booking = db.bookings.find((b) => b.id === bookingId) || db.bookings[0];

  const [activeTab, setActiveTab] = useState<"items" | "about" | "procedure">("items");
  const [items, setItems] = useState<BookingItem[]>(booking.items || []);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState("nos");
  const [showAddForm, setShowAddForm] = useState(false);

  // Flyer preview state
  const [flyerDataUrl, setFlyerDataUrl] = useState<string | null>(null);
  const [isGeneratingFlyer, setIsGeneratingFlyer] = useState(false);

  const toggleCheck = (id: string) => {
    const updated = items.map((it) =>
      it.id === id ? { ...it, isChecked: !it.isChecked } : it
    );
    setItems(updated);
    booking.items = updated;
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: BookingItem = {
      id: `bi-${Date.now()}`,
      bookingId: booking.id,
      itemEnglishName: newItemName.trim(),
      itemTamilName: newItemName.trim(),
      quantity: Number(newItemQty),
      unit: newItemUnit,
      isChecked: false,
    };

    const updated = [...items, newItem];
    setItems(updated);
    booking.items = updated;
    setNewItemName("");
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    const updated = items.filter((it) => it.id !== id);
    setItems(updated);
    booking.items = updated;
  };

  const handleShareWhatsApp = () => {
    if (!currentBusiness) return;
    const msg = formatPoojaItemsWhatsAppMessage(booking, currentBusiness);
    const phone = booking.customerMobile ? booking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleGenerateFlyer = async () => {
    if (!currentBusiness) return;
    setIsGeneratingFlyer(true);
    try {
      const dataUrl = await generatePoojaFlyer(booking, currentBusiness, theme.preset);
      setFlyerDataUrl(dataUrl);
    } catch (err) {
      console.error("Failed to render flyer canvas:", err);
    } finally {
      setIsGeneratingFlyer(false);
    }
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/app/bookings/${booking.id}`}
            className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-base font-bold text-velvi-brownDark">
              {booking.poojaEnglishName}
            </h2>
            <p className="text-[11px] text-velvi-brown/60">
              {booking.customerName} • {booking.date}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-velvi-goldDark bg-velvi-gold/15 px-2.5 py-1 rounded-full border border-velvi-gold/30">
          {items.length} items
        </span>
      </div>

      {/* Tabs: About / Required Items / Procedure */}
      <div className="flex bg-velvi-creamDark/60 p-1 rounded-xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab("items")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === "items"
              ? "bg-white text-velvi-brownDark font-bold shadow-sm"
              : "text-velvi-brown/70 hover:text-velvi-brown"
          }`}
        >
          Required Items ({items.length})
        </button>
        <button
          onClick={() => setActiveTab("about")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === "about"
              ? "bg-white text-velvi-brownDark font-bold shadow-sm"
              : "text-velvi-brown/70 hover:text-velvi-brown"
          }`}
        >
          About Pooja
        </button>
        <button
          onClick={() => setActiveTab("procedure")}
          className={`flex-1 py-1.5 rounded-lg transition ${
            activeTab === "procedure"
              ? "bg-white text-velvi-brownDark font-bold shadow-sm"
              : "text-velvi-brown/70 hover:text-velvi-brown"
          }`}
        >
          Mantra / Vidhi
        </button>
      </div>

      {activeTab === "about" && (
        <div className="bg-white p-4 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2 text-xs text-velvi-brown/80 leading-relaxed">
          <h4 className="font-bold text-sm text-velvi-brownDark">Significance & Benefits</h4>
          <p>
            {booking.poojaEnglishName} removes all barriers and obstacles. Performed before any
            auspicious beginning, house-warming, business launch, or annual family welfare.
          </p>
          <div className="pt-2 border-t border-velvi-creamDark">
            <span className="font-bold text-velvi-brown">Standard Duration:</span>{" "}
            {booking.durationMinutes} minutes
          </div>
        </div>
      )}

      {activeTab === "procedure" && (
        <div className="bg-white p-4 rounded-2xl border border-velvi-gold/20 shadow-sm space-y-2 text-xs text-velvi-brown/80 leading-relaxed">
          <h4 className="font-bold text-sm text-velvi-brownDark">Krama / Procedure Steps</h4>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Ganapathi Dhyanam & Achamanam</li>
            <li>Vigneshwara Pooja & Sankalpam</li>
            <li>Kalasa Sthapanam & Varuna Pooja</li>
            <li>Agni Prathishtapana</li>
            <li>Moola Mantra Homam & Ahuti</li>
            <li>Poornahuthi & Maha Deeparadhana</li>
            <li>Prasada Viniyogam & Ashirvadam</li>
          </ol>
        </div>
      )}

      {activeTab === "items" && (
        <div className="space-y-3">
          {/* Items Checklist Card */}
          <div className="bg-white rounded-2xl border border-velvi-gold/20 shadow-sm divide-y divide-velvi-creamDark overflow-hidden">
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between hover:bg-velvi-cream/30 transition group"
              >
                <div
                  onClick={() => toggleCheck(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition ${
                      item.isChecked
                        ? "bg-velvi-sacredGreen border-velvi-sacredGreen text-white"
                        : "border-velvi-gold/40 bg-velvi-cream/20"
                    }`}
                  >
                    {item.isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div>
                    <div
                      className={`text-xs font-semibold ${
                        item.isChecked
                          ? "line-through text-velvi-brown/40"
                          : "text-velvi-brownDark"
                      }`}
                    >
                      {idx + 1}. {item.itemEnglishName || item.itemTamilName}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-velvi-brown bg-velvi-cream px-2 py-0.5 rounded-lg border border-velvi-gold/20">
                    {item.quantity} {item.unit}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Add Custom Item */}
          {showAddForm ? (
            <form
              onSubmit={handleAddItem}
              className="bg-white p-3 rounded-2xl border border-velvi-gold/40 shadow-sm space-y-2 animate-in fade-in"
            >
              <h5 className="font-bold text-xs text-velvi-brown">Add Custom Item</h5>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. Tulasi Leaves, Camphor)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-3 bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-1.5 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-1.5 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  required
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="col-span-2 bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-1.5 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                >
                  <option value="nos">nos (pieces)</option>
                  <option value="kg">kg (kilogram)</option>
                  <option value="g">g (grams)</option>
                  <option value="litre">litre</option>
                  <option value="ml">ml</option>
                  <option value="bundle">bundle</option>
                  <option value="set">set</option>
                  <option value="dozen">dozen</option>
                </select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-1.5 bg-velvi-cream text-velvi-brown rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-1.5 bg-velvi-brown text-white rounded-xl text-xs font-semibold"
                >
                  Add Item
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2 bg-white hover:bg-velvi-cream border border-dashed border-velvi-gold/50 rounded-xl text-xs font-bold text-velvi-brown flex items-center justify-center gap-1 transition"
            >
              <Plus className="w-4 h-4 text-velvi-gold" />
              <span>Add Custom Item</span>
            </button>
          )}

          {/* 2 Primary Actions: Share List & Save as Image */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              onClick={handleShareWhatsApp}
              className="py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition"
            >
              <Share2 className="w-4 h-4" />
              <span>Share List</span>
            </button>

            <button
              onClick={handleGenerateFlyer}
              disabled={isGeneratingFlyer}
              className="py-3 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition"
            >
              <ImageIcon className="w-4 h-4 text-velvi-goldLight" />
              <span>{isGeneratingFlyer ? "Rendering..." : "Save as Image"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Generated Canvas Flyer Preview Modal */}
      {flyerDataUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-3 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 max-w-sm w-full space-y-3 shadow-2xl border border-velvi-gold">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-velvi-brown flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-velvi-gold" /> Generated WhatsApp Flyer
              </h3>
              <button
                onClick={() => setFlyerDataUrl(null)}
                className="text-xs text-velvi-brown/60 hover:text-velvi-brown"
              >
                ✕ Close
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-velvi-gold/30">
              <img
                src={flyerDataUrl}
                alt="Pooja Item List Flyer"
                className="w-full h-auto object-contain rounded-xl"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <a
                href={flyerDataUrl}
                download={`Pooja_Items_${booking.bookingNumber}.png`}
                className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Download className="w-4 h-4 text-velvi-goldLight" />
                <span>Download PNG</span>
              </a>

              <button
                onClick={() => {
                  window.open(flyerDataUrl, "_blank");
                }}
                className="px-3 py-2.5 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown text-xs font-bold rounded-xl border border-velvi-gold/30"
              >
                View Full
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
