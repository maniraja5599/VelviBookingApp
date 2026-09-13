"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Pooja, PoojaItemTemplate } from "@/lib/types";
import {
  Flame,
  Plus,
  Clock,
  IndianRupee,
  ChevronRight,
  Edit2,
  Trash2,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import Link from "next/link";

const DEFAULT_UNITS: Array<PoojaItemTemplate["unit"]> = [
  "nos",
  "pcs",
  "kg",
  "g",
  "litre",
  "ml",
  "packet",
  "bundle",
  "set",
  "dozen",
];

export default function PoojasCataloguePage() {
  const { currentBusiness } = useAuth();
  const { t } = useLanguage();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [poojas, setPoojas] = useState<Pooja[]>(db.getPoojas(businessId));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPooja, setSelectedPooja] = useState<Pooja | null>(null);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPoojaId, setEditingPoojaId] = useState<string | null>(null);

  // Form states
  const [formEnglishName, setFormEnglishName] = useState("");
  const [formTamilName, setFormTamilName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState<number>(120);
  const [formBasePrice, setFormBasePrice] = useState<number>(5000);
  const [formItems, setFormItems] = useState<PoojaItemTemplate[]>([]);
  const [formError, setFormError] = useState("");

  // New item inline input states
  const [newItemEnglish, setNewItemEnglish] = useState("");
  const [newItemTamil, setNewItemTamil] = useState("");
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<PoojaItemTemplate["unit"]>("nos");

  // Delete modal state
  const [deletingPooja, setDeletingPooja] = useState<Pooja | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const filteredPoojas = poojas.filter(
    (p) =>
      p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamilName && p.tamilName.includes(searchQuery)) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingPoojaId(null);
    setFormEnglishName("");
    setFormTamilName("");
    setFormDescription("");
    setFormDuration(120);
    setFormBasePrice(5000);
    setFormItems([
      {
        id: `item-${Date.now()}-1`,
        poojaId: "",
        itemEnglishName: "Turmeric Powder",
        itemTamilName: "மஞ்சள் தூள்",
        quantity: 100,
        unit: "g",
        sortOrder: 1,
      },
      {
        id: `item-${Date.now()}-2`,
        poojaId: "",
        itemEnglishName: "Coconuts",
        itemTamilName: "தேங்காய்",
        quantity: 5,
        unit: "nos",
        sortOrder: 2,
      },
      {
        id: `item-${Date.now()}-3`,
        poojaId: "",
        itemEnglishName: "Pure Ghee",
        itemTamilName: "தூய பசு நெய்",
        quantity: 500,
        unit: "ml",
        sortOrder: 3,
      },
    ]);
    setFormError("");
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
    setShowFormModal(true);
  };

  const openEditModal = (p: Pooja) => {
    setIsEditing(true);
    setEditingPoojaId(p.id);
    setFormEnglishName(p.englishName);
    setFormTamilName(p.tamilName || "");
    setFormDescription(p.description || "");
    setFormDuration(p.durationMinutes || 120);
    setFormBasePrice(p.basePrice || 0);
    setFormItems(p.items ? [...p.items] : []);
    setFormError("");
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
    setShowFormModal(true);
  };

  const handleAddItemToForm = () => {
    if (!newItemEnglish.trim()) {
      return;
    }
    const item: PoojaItemTemplate = {
      id: `item-${Date.now()}-${formItems.length + 1}`,
      poojaId: editingPoojaId || "",
      itemEnglishName: newItemEnglish.trim(),
      itemTamilName: newItemTamil.trim() || newItemEnglish.trim(),
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit,
      sortOrder: formItems.length + 1,
    };
    setFormItems([...formItems, item]);
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setFormItems(formItems.filter((it) => it.id !== itemId));
  };

  const handleSavePooja = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formEnglishName.trim()) {
      setFormError("Pooja English Name is required.");
      return;
    }

    if (isEditing && editingPoojaId) {
      const updated = db.updatePooja(editingPoojaId, {
        englishName: formEnglishName.trim(),
        tamilName: formTamilName.trim() || formEnglishName.trim(),
        description: formDescription.trim(),
        durationMinutes: Number(formDuration) || 120,
        basePrice: Number(formBasePrice) || 0,
        items: formItems,
      });

      if (updated) {
        setPoojas([...db.getPoojas(businessId)]);
        if (selectedPooja?.id === editingPoojaId) {
          setSelectedPooja(updated);
        }
        setShowFormModal(false);
        setStatusMessage(`Updated "${updated.englishName}" successfully!`);
        setTimeout(() => setStatusMessage(""), 4000);
      }
    } else {
      const created = db.createPooja({
        businessId,
        englishName: formEnglishName.trim(),
        tamilName: formTamilName.trim() || formEnglishName.trim(),
        description: formDescription.trim(),
        durationMinutes: Number(formDuration) || 120,
        basePrice: Number(formBasePrice) || 0,
        items: formItems,
      });

      setPoojas([...db.getPoojas(businessId)]);
      setShowFormModal(false);
      setStatusMessage(`Created "${created.englishName}" successfully!`);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const confirmDelete = () => {
    if (!deletingPooja) return;
    const name = deletingPooja.englishName;
    const success = db.deletePooja(deletingPooja.id);
    if (success) {
      setPoojas([...db.getPoojas(businessId)]);
      if (selectedPooja?.id === deletingPooja.id) {
        setSelectedPooja(null);
      }
      setDeletingPooja(null);
      setStatusMessage(`Deleted "${name}" successfully.`);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">
            {t("pooja") || "Pooja & Homam Services"}
          </h2>
          <p className="text-xs text-velvi-brown/60">
            {filteredPoojas.length} Vedic ceremonies & item templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-3 py-1.5 bg-velvi-brown hover:bg-velvi-brownLight text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-sm transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-velvi-goldLight stroke-[3]" />
            <span>Add Pooja</span>
          </button>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className="text-xs font-bold text-velvi-sacredGreen flex items-center gap-1.5 bg-green-50 px-3 py-2 rounded-xl border border-green-200 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-velvi-brown/40 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Search pooja, homam, items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-velvi-gold/20 text-xs text-velvi-brownDark placeholder:text-velvi-brown/40 focus:outline-none focus:border-velvi-gold transition"
        />
      </div>

      {/* Poojas List */}
      <div className="space-y-2.5">
        {filteredPoojas.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-velvi-gold/30">
            <Flame className="w-8 h-8 text-velvi-gold mx-auto mb-2" />
            <h4 className="font-bold text-sm text-velvi-brown">No Pooja or Homam found</h4>
            <p className="text-xs text-velvi-brown/60 mt-1">
              Tap the "+ Add Pooja" button above to create a new ceremony template.
            </p>
          </div>
        ) : (
          filteredPoojas.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPooja(p)}
              className="bg-white rounded-2xl p-3.5 border border-velvi-gold/20 shadow-sm hover:border-velvi-gold/50 transition cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-velvi-gold/15 text-velvi-brown flex items-center justify-center shrink-0 mt-0.5 border border-velvi-gold/30">
                  <Flame className="w-5 h-5 text-velvi-gold" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-sm text-velvi-brownDark truncate">
                      {p.englishName}
                    </h4>
                    {p.tamilName && p.tamilName !== p.englishName && (
                      <span className="text-[10px] font-semibold text-velvi-goldDark bg-velvi-gold/15 px-1.5 py-0.5 rounded">
                        {p.tamilName}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-velvi-brown/60 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-velvi-gold" /> {p.durationMinutes} mins
                    </span>
                    <span>•</span>
                    <span>{p.items?.length || 0} items</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex items-center gap-2 shrink-0">
                <div>
                  <div className="text-sm font-extrabold text-velvi-brownDark">
                    ₹{p.basePrice.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[10px] text-velvi-brown/50">Dakshina</div>
                </div>

                {/* Quick Action buttons */}
                <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditModal(p)}
                    className="p-1.5 text-velvi-brown/60 hover:text-velvi-brown hover:bg-velvi-cream rounded-lg transition"
                    title="Edit Pooja"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPooja(p)}
                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Delete Pooja"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Selected Pooja Details Drawer */}
      {selectedPooja && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-4 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-velvi-gold animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-velvi-brownDark">
                  {selectedPooja.englishName}
                </h3>
                {selectedPooja.tamilName && (
                  <p className="text-xs font-semibold text-velvi-goldDark">
                    {selectedPooja.tamilName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPooja(null)}
                className="text-xs text-velvi-brown/60 hover:text-velvi-brown p-1 rounded-full hover:bg-velvi-cream"
              >
                ✕ Close
              </button>
            </div>

            {selectedPooja.description && (
              <p className="text-xs text-velvi-brown/80 leading-relaxed bg-velvi-cream/20 p-3 rounded-xl border border-velvi-gold/15">
                {selectedPooja.description}
              </p>
            )}

            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 flex justify-between text-xs">
              <div>
                <span className="text-velvi-brown/60 block">Base Dakshina</span>
                <span className="font-extrabold text-velvi-brownDark text-sm">
                  ₹{selectedPooja.basePrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-velvi-brown/60 block">Standard Duration</span>
                <span className="font-bold text-velvi-brownDark text-sm">
                  {selectedPooja.durationMinutes} Minutes
                </span>
              </div>
            </div>

            {/* Standard Required Items Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-velvi-gold" />
                  <span>Required Items Checklist ({selectedPooja.items?.length || 0})</span>
                </h4>
              </div>

              {(!selectedPooja.items || selectedPooja.items.length === 0) ? (
                <div className="p-4 text-center text-xs text-velvi-brown/60 bg-velvi-cream/20 rounded-xl border border-dashed border-velvi-gold/30">
                  No default items listed for this pooja.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-velvi-gold/20 divide-y divide-velvi-creamDark max-h-48 overflow-y-auto">
                  {selectedPooja.items?.map((it, idx) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="text-velvi-brownDark font-medium">
                        {idx + 1}. {it.itemEnglishName}
                        {it.itemTamilName && it.itemTamilName !== it.itemEnglishName && (
                          <span className="text-velvi-brown/50 ml-1">({it.itemTamilName})</span>
                        )}
                      </span>
                      <span className="font-bold text-velvi-brown bg-velvi-cream px-2 py-0.5 rounded text-[11px]">
                        {it.quantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/app/bookings/new?poojaId=${selectedPooja.id}`}
                className="block w-full py-3 bg-velvi-brown text-white text-center font-bold text-xs rounded-xl shadow-sm hover:bg-velvi-brownLight transition active:scale-[0.99]"
              >
                Book this Homam
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openEditModal(selectedPooja);
                  }}
                  className="py-2.5 bg-velvi-gold/15 hover:bg-velvi-gold/25 text-velvi-brown font-bold text-xs rounded-xl border border-velvi-gold/30 flex items-center justify-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => {
                    setDeletingPooja(selectedPooja);
                  }}
                  className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Pooja</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Pooja Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-velvi-gold/30 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-velvi-gold/20 text-velvi-brownDark flex items-center justify-center font-bold text-sm">
                  <Flame className="w-4 h-4 text-velvi-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-velvi-brownDark leading-tight">
                    {isEditing ? "Edit Pooja / Homam" : "Create New Pooja / Homam"}
                  </h3>
                  <p className="text-[10px] text-velvi-brown/60">
                    Define Dakshina, duration, and required items template
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePooja} className="space-y-3.5">
              {/* Names */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">
                    English Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ganapathi Homam"
                    value={formEnglishName}
                    onChange={(e) => setFormEnglishName(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">
                    Tamil Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. கணபதி ஹோமம்"
                    value={formTamilName}
                    onChange={(e) => setFormTamilName(e.target.value)}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
              </div>

              {/* Price & Duration */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">
                    Base Dakshina (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={100}
                    placeholder="5000"
                    value={formBasePrice}
                    onChange={(e) => setFormBasePrice(Number(e.target.value))}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-velvi-brown block mb-1">
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    required
                    min={15}
                    step={15}
                    placeholder="120"
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Description / Significance
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose, benefits, deities invoked..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              {/* Items Checklist Template Manager */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-velvi-brown flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5 text-velvi-gold" />
                    <span>Checklist Items ({formItems.length})</span>
                  </label>
                  <span className="text-[10px] text-velvi-brown/60">
                    Template items for devotees
                  </span>
                </div>

                {/* Items List */}
                <div className="bg-velvi-cream/20 border border-velvi-gold/20 rounded-xl divide-y divide-velvi-gold/15 max-h-40 overflow-y-auto">
                  {formItems.length === 0 ? (
                    <div className="p-3 text-center text-xs text-velvi-brown/50">
                      No items added yet. Add items below.
                    </div>
                  ) : (
                    formItems.map((it, idx) => (
                      <div key={it.id} className="p-2 flex items-center justify-between text-xs">
                        <div className="truncate mr-2">
                          <span className="font-semibold text-velvi-brownDark">
                            {idx + 1}. {it.itemEnglishName}
                          </span>
                          {it.itemTamilName && it.itemTamilName !== it.itemEnglishName && (
                            <span className="text-[11px] text-velvi-brown/60 ml-1">
                              ({it.itemTamilName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="bg-white border border-velvi-gold/30 px-2 py-0.5 rounded text-[11px] font-bold text-velvi-brown">
                            {it.quantity} {it.unit}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromForm(it.id)}
                            className="p-1 text-red-500 hover:text-red-700 rounded transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick Add Item Row */}
                <div className="bg-white p-2.5 rounded-xl border border-velvi-gold/30 space-y-2">
                  <div className="text-[11px] font-bold text-velvi-brownDark">
                    + Add Item to Template
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="Item name (English) *"
                      value={newItemEnglish}
                      onChange={(e) => setNewItemEnglish(e.target.value)}
                      className="bg-velvi-cream/30 border border-velvi-gold/20 rounded-lg px-2 py-1.5 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                    />
                    <input
                      type="text"
                      placeholder="Tamil name (Optional)"
                      value={newItemTamil}
                      onChange={(e) => setNewItemTamil(e.target.value)}
                      className="bg-velvi-cream/30 border border-velvi-gold/20 rounded-lg px-2 py-1.5 text-xs text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(Number(e.target.value))}
                      className="w-20 bg-velvi-cream/30 border border-velvi-gold/20 rounded-lg px-2 py-1.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
                    />
                    <select
                      value={newItemUnit}
                      onChange={(e) => setNewItemUnit(e.target.value as PoojaItemTemplate["unit"])}
                      className="flex-1 bg-velvi-cream/30 border border-velvi-gold/20 rounded-lg px-2 py-1.5 text-xs text-velvi-brownDark font-semibold focus:outline-none focus:border-velvi-gold"
                    >
                      {DEFAULT_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddItemToForm}
                      className="px-3 py-1.5 bg-velvi-gold/20 hover:bg-velvi-gold/30 text-velvi-brownDark font-bold text-xs rounded-lg transition shrink-0"
                    >
                      Add Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {isEditing ? "Save Changes" : "Create Pooja"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPooja && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-red-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-velvi-brownDark">
                  Delete Pooja Service?
                </h3>
                <p className="text-xs text-velvi-brown/60">
                  Are you sure you want to remove &ldquo;{deletingPooja.englishName}&rdquo;?
                </p>
              </div>
            </div>

            <p className="text-xs text-velvi-brown/80 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
              This ceremony and its required item templates will be removed from your active catalogue.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingPooja(null)}
                className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
