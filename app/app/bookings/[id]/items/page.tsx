"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useTheme } from "@/components/providers/ThemeContext";
import { db } from "@/lib/db/store";
import { BookingItem } from "@/lib/types";
import { generatePoojaFlyer } from "@/lib/flyer/canvas-generator";
import { formatPoojaItemsWhatsAppMessage } from "@/lib/whatsapp/formatter";
import { PoojaListShareModal } from "@/components/bookings/PoojaListShareModal";
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

  // Share preview modal state
  const [showShareModal, setShowShareModal] = useState(false);
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
                className="p-3 flex items-center justify-between hover:bg-velvi-cream/30 transition group gap-2"
              >
                <div
                  onClick={() => toggleCheck(item.id)}
                  className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition ${
                      item.isChecked
                        ? "bg-velvi-sacredGreen border-velvi-sacredGreen text-white"
                        : "border-velvi-gold/40 bg-velvi-cream/20"
                    }`}
                  >
                    {item.isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>

                  <div className="min-w-0">
                    <div
                      className={`text-xs font-bold leading-tight truncate ${
                        item.isChecked
                          ? "line-through text-velvi-brown/40"
                          : "text-velvi-brownDark"
                      }`}
                    >
                      {idx + 1}. {item.itemTamilName || item.itemEnglishName}
                    </div>
                    {item.itemEnglishName && item.itemEnglishName !== item.itemTamilName && (
                      <div
                        className={`text-[10px] pl-4 font-medium truncate ${
                          item.isChecked
                            ? "line-through text-velvi-brown/30"
                            : "text-velvi-brown/65"
                        }`}
                      >
                        {item.itemEnglishName}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center bg-velvi-cream/40 border border-velvi-gold/30 rounded-lg p-0.5 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => {
                        const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
                        const updated = items.map((it) =>
                          it.id === item.id ? { ...it, quantity: Math.max(1, (Number(it.quantity) || 1) - step) } : it
                        );
                        setItems(updated);
                        booking.items = updated;
                      }}
                      className="w-5 h-5 rounded bg-white hover:bg-velvi-cream text-velvi-brown font-bold flex items-center justify-center text-[11px] active:scale-95"
                    >
                      -
                    </button>
                    <span className="font-bold text-velvi-brownDark text-xs px-1.5 min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const step = item.unit === "g" || item.unit === "ml" ? 50 : 1;
                        const updated = items.map((it) =>
                          it.id === item.id ? { ...it, quantity: (Number(it.quantity) || 1) + step } : it
                        );
                        setItems(updated);
                        booking.items = updated;
                      }}
                      className="w-5 h-5 rounded bg-white hover:bg-velvi-cream text-velvi-brown font-bold flex items-center justify-center text-[11px] active:scale-95"
                    >
                      +
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-velvi-brown bg-amber-50 px-2 py-1 rounded-lg border border-velvi-gold/30">
                    {item.unit}
                  </span>

                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                    title="Delete item"
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
              className="bg-white p-3.5 rounded-2xl border border-velvi-gold/40 shadow-sm space-y-2.5 animate-in fade-in"
            >
              <h5 className="font-bold text-xs text-velvi-brownDark flex items-center gap-1">
                <Plus className="w-3.5 h-3.5 text-velvi-gold" />
                <span>புதிய பொருள் சேர்க்க / Add Custom Item</span>
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Item Name (e.g. குங்குமம், சந்தனம்)"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="col-span-2 bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  required
                />
                <input
                  type="number"
                  min={1}
                  placeholder="Qty"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(Number(e.target.value))}
                  className="bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold text-center"
                  required
                />
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="bg-velvi-cream/40 border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                >
                  <option value="g">கிராம் (g)</option>
                  <option value="kg">கிலோ (kg)</option>
                  <option value="nos">எண்ணிக்கை (nos)</option>
                  <option value="packet">பாக்கெட் (pkt)</option>
                  <option value="litre">லிட்டர் (L)</option>
                  <option value="ml">மி.லி (ml)</option>
                  <option value="bundle">கட்டு (bundle)</option>
                  <option value="set">செட் (set)</option>
                  <option value="dozen">டஜன் (dozen)</option>
                </select>
              </div>

              {/* Quick Unit Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {[
                  { u: "g", label: "கிராம் (g)", defQty: 100 },
                  { u: "kg", label: "கிலோ (kg)", defQty: 1 },
                  { u: "nos", label: "nos", defQty: 5 },
                  { u: "packet", label: "பாக்கெட்", defQty: 2 },
                  { u: "litre", label: "லிட்டர்", defQty: 1 },
                  { u: "ml", label: "மி.லி (ml)", defQty: 500 },
                  { u: "bundle", label: "கட்டு", defQty: 2 },
                ].map((pill) => (
                  <button
                    key={pill.u}
                    type="button"
                    onClick={() => {
                      setNewItemUnit(pill.u);
                      setNewItemQty(pill.defQty);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                      newItemUnit === pill.u
                        ? "bg-velvi-brown text-amber-200 border-velvi-brown"
                        : "bg-velvi-cream/50 text-velvi-brownDark border-velvi-gold/20"
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2 bg-velvi-cream text-velvi-brown rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-semibold shadow-sm"
                >
                  Add to Checklist
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 bg-white hover:bg-velvi-cream border border-dashed border-velvi-gold/50 rounded-2xl text-xs font-bold text-velvi-brown flex items-center justify-center gap-1.5 transition active:scale-95 shadow-xs"
            >
              <Plus className="w-4 h-4 text-velvi-gold" />
              <span>+ பொருள் சேர்க்க / Add Custom Item</span>
            </button>
          )}

          {/* 2 Primary Actions: Share List & Save as Image */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="py-3 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-300" />
              <span>வாட்ஸ்அப் பகிர் (Share)</span>
            </button>

            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="py-3 bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 rounded-2xl font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs active:scale-[0.99] transition cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-800" />
              <span>படம் பதிவிறக்கம் (PNG)</span>
            </button>
          </div>
        </div>
      )}

      {/* Pooja List WhatsApp & Image Preview Modal */}
      {currentBusiness && (
        <PoojaListShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          booking={booking}
          business={currentBusiness}
        />
      )}
    </div>
  );
}
