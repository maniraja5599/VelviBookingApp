"use client";

import React, { useState } from "react";
import { SamagriCategory } from "@/lib/types";
import { db } from "@/lib/db/store";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Sparkles,
  FolderPlus,
  Tag,
  Wand2,
  AlertCircle,
} from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

// 32+ Curated Sacred & Temple Emojis/Icons with Auto-Detect Keywords
export const SACRED_ICON_PRESETS = [
  // Samagri & Offerings
  { icon: "🥥", label: "தேங்காய்", keywords: ["தேங்காய்", "coconut", "fruit", "பழங்கள்", "வாழை"] },
  { icon: "🍎", label: "பழங்கள்", keywords: ["பழம்", "fruit", "ஆப்பிள்", "apple", "கனி"] },
  { icon: "🍌", label: "வாழைப்பழம்", keywords: ["வாழை", "banana"] },
  { icon: "🍋", label: "எலுமிச்சை", keywords: ["எலுமிச்சை", "lemon", "lime"] },
  // Flowers & Garlands
  { icon: "🌺", label: "பூக்கள்", keywords: ["பூ", "மலர்", "flower", "ரோஜா", "rose", "செவ்வரளி"] },
  { icon: "🌸", label: "மலர் மாலை", keywords: ["மாலை", "garland", "மல்லிகை", "jasmine"] },
  { icon: "🪷", label: "தாமரை", keywords: ["தாமரை", "lotus"] },
  // Homam & Sacred Elements
  { icon: "🔥", label: "ஹோமம்", keywords: ["ஹோமம்", "homam", "fire", "அக்னி", "யாகம்", "குண்டம்"] },
  { icon: "🪵", label: "சமித்து", keywords: ["சமித்து", "விறகு", "wood", "stick", "மர"] },
  { icon: "🪔", label: "தீபம் / நெய்", keywords: ["தீபம்", "நெய்", "ghee", "lamp", "விளக்கு", "எண்ணெய்", "oil"] },
  { icon: "🕯️", label: "சூடம் / சாம்பிராணி", keywords: ["சூடம்", "கற்பூரம்", "camphor", "சாம்பிராணி", "அகர்பத்தி", "incense"] },
  // Groceries & Food Offerings
  { icon: "🌾", label: "தானியங்கள்", keywords: ["தானியம்", "grain", "நெல்", "பயறு", "நவதானியம்", "navadhanya"] },
  { icon: "🍚", label: "பச்சரிசி", keywords: ["அரிசி", "rice", "பச்சரிசி", "அட்சதை", "akshata"] },
  { icon: "🍯", label: "தேன் / திரவியம்", keywords: ["தேன்", "honey", "திரவியம்", "சர்க்கரை", "sugar", "வெல்லம்", "jaggery"] },
  { icon: "🥛", label: "பால் / தயிர்", keywords: ["பால்", "milk", "தயிர்", "curd", "பஞ்சாமிர்தம்"] },
  // Sacred Foliage & Items
  { icon: "🌿", label: "துளசி / வில்வம்", keywords: ["துளசி", "வில்வம்", "அருகம்புல்", "மாவிிலை", "herb", "leaf", "வெற்றிலை", "பாக்கு"] },
  { icon: "🪙", label: "நாணயம் / தட்சிணை", keywords: ["நாணயம்", "காசு", "coin", "gold", "தங்கம்", "வெள்ளி", "silver", "தட்சிணை"] },
  { icon: "🧵", label: "வஸ்திரம் / நூல்", keywords: ["வஸ்திரம்", "வேஷ்டி", "துணி", "cloth", "நூல்", "thread", "பூணூல்"] },
  { icon: "📿", label: "ருத்ராட்சம் / மாலை", keywords: ["ருத்ராட்சம்", "rudraksha", "மணி", "ஜபமாலை"] },
  { icon: "🏺", label: "கலசம் / பித்தளை", keywords: ["கலசம்", "பாத்திரம்", "vessel", "pot", "செம்பு", "பித்தளை", "brass"] },
  { icon: "🔔", label: "மணி", keywords: ["மணி", "bell", "பூஜை மணி"] },
  // Deities & Sacred Symbols
  { icon: "🕉️", label: "ஓம்", keywords: ["ஓம்", "om", "வேதம்", "mantra"] },
  { icon: "🛕", label: "கோவில்", keywords: ["கோவில்", "temple", "சன்னிதி"] },
  { icon: "🐘", label: "கணபதி", keywords: ["கணபதி", "விநாயகர்", "ganapathi", "pillaiyar"] },
  { icon: "✨", label: "விசேஷம்", keywords: ["விசேஷம்", "special", "பொது"] },
  { icon: "🚩", label: "கொடி", keywords: ["கொடி", "flag"] },
  { icon: "☀️", label: "சூரியன்", keywords: ["சூரியன்", "sun"] },
  { icon: "🌕", label: "பௌர்ணமி", keywords: ["சந்திரன்", "moon", "பௌர்ணமி"] },
  { icon: "⭐", label: "நட்சத்திரம்", keywords: ["நட்சத்திரம்", "star"] },
  { icon: "🔱", label: "திரிசூலம்", keywords: ["திரிசூலம்", "trishul", "சிவன்", "shiva"] },
  { icon: "📦", label: "தொகுப்பு", keywords: ["பாக்ஸ்", "box", "package", "பேக்கிங்"] },
  { icon: "🏷️", label: "வகை", keywords: ["வகை", "category", "tag"] },
];

export function autoDetectCategoryIcon(text: string): string | null {
  if (!text) return null;
  const lower = text.toLowerCase().trim();
  for (const preset of SACRED_ICON_PRESETS) {
    for (const kw of preset.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return preset.icon;
      }
    }
  }
  return null;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  onCategoriesChanged,
}) => {
  const [categories, setCategories] = useState<SamagriCategory[]>(() => db.getSamagriCategories());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabelTa, setEditLabelTa] = useState("");
  const [editLabelEn, setEditLabelEn] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [editManualIconChanged, setEditManualIconChanged] = useState(false);

  // New Category form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabelTa, setNewLabelTa] = useState("");
  const [newLabelEn, setNewLabelEn] = useState("");
  const [newIcon, setNewIcon] = useState("✨");
  const [newManualIconChanged, setNewManualIconChanged] = useState(false);
  const [formError, setFormError] = useState("");

  if (!isOpen) return null;

  const refreshCategories = () => {
    const updated = db.getSamagriCategories();
    setCategories([...updated]);
    if (onCategoriesChanged) {
      onCategoriesChanged();
    }
  };

  const handleStartEdit = (cat: SamagriCategory) => {
    setEditingId(cat.id);
    setEditLabelTa(cat.labelTa);
    setEditLabelEn(cat.labelEn);
    setEditIcon(cat.icon);
    setEditManualIconChanged(false);
    setShowAddForm(false);
  };

  // Auto-detect icon when typing category name (unless user explicitly picked an icon)
  const handleCreateNameChange = (valTa: string, valEn: string) => {
    setNewLabelTa(valTa);
    setNewLabelEn(valEn);
    if (!newManualIconChanged) {
      const suggested = autoDetectCategoryIcon(valTa) || autoDetectCategoryIcon(valEn);
      if (suggested) {
        setNewIcon(suggested);
      }
    }
  };

  const handleEditNameChange = (valTa: string, valEn: string) => {
    setEditLabelTa(valTa);
    setEditLabelEn(valEn);
    if (!editManualIconChanged) {
      const suggested = autoDetectCategoryIcon(valTa) || autoDetectCategoryIcon(valEn);
      if (suggested) {
        setEditIcon(suggested);
      }
    }
  };

  const handleSaveEdit = (id: string) => {
    if (!editLabelTa.trim() && !editLabelEn.trim()) {
      return;
    }
    db.updateSamagriCategory(id, {
      labelTa: editLabelTa.trim() || editLabelEn.trim(),
      labelEn: editLabelEn.trim() || editLabelTa.trim(),
      icon: editIcon.trim() || "✨",
    });
    setEditingId(null);
    refreshCategories();
  };

  const handleDelete = (id: string, name: string) => {
    if (categories.length <= 1) {
      alert("குறைந்தது ஒரு வகை இருக்க வேண்டும். இதை நீக்க முடியாது.");
      return;
    }
    if (window.confirm(`"${name}" வகையை நீக்க விரும்புகிறீர்களா?\n(Are you sure you want to delete this category?)`)) {
      db.deleteSamagriCategory(id);
      refreshCategories();
    }
  };

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabelTa.trim() && !newLabelEn.trim()) {
      setFormError("வகையின் பெயரை உள்ளிடவும் (தமிழ் அல்லது ஆங்கிலம்)");
      return;
    }

    db.addSamagriCategory({
      labelTa: newLabelTa.trim() || newLabelEn.trim(),
      labelEn: newLabelEn.trim() || newLabelTa.trim(),
      icon: newIcon.trim() || "✨",
    });

    setNewLabelTa("");
    setNewLabelEn("");
    setNewIcon("✨");
    setNewManualIconChanged(false);
    setFormError("");
    setShowAddForm(false);
    refreshCategories();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full max-h-[88vh] overflow-y-auto space-y-4 shadow-2xl border border-velvi-gold/40 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-amber-300 flex items-center justify-center font-bold text-sm shadow-2xs border border-amber-400/40">
              <Tag className="w-4 h-4 text-amber-300" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                பொருட்கள் வகைகள் மேலாண்மை
              </h3>
              <p className="text-[10.5px] text-slate-500 font-semibold">
                Samagri Categories Manager • Icon Selection & Edit
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action / New Category Button */}
        {!showAddForm && !editingId && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <FolderPlus className="w-4 h-4 text-amber-300" />
            <span>+ புதிய வகை சேர்க்க (Add New Category)</span>
          </button>
        )}

        {/* 1. ADD NEW CATEGORY FORM */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3.5 bg-gradient-to-br from-emerald-50/90 via-white to-amber-50/50 rounded-2xl border-2 border-emerald-400/80 space-y-3 animate-in fade-in shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>புதிய வகை உருவாக்குதல் (New Category)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕ ரத்து
              </button>
            </div>

            {/* Live Preview Pill */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200/80 shadow-2xs">
              <span className="text-[10.5px] font-bold text-slate-500">முன்னோட்டம்:</span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-950 border border-amber-300 font-extrabold text-xs shadow-2xs">
                <span className="text-sm">{newIcon}</span>
                <span>{newLabelTa || newLabelEn || "வகையின் பெயர்"}</span>
                {newLabelEn && newLabelTa && (
                  <span className="text-[10px] text-slate-500 font-normal">({newLabelEn})</span>
                )}
              </div>
            </div>

            {/* Category Names Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">
                  வகைப் பெயர் (தமிழ்) *
                </label>
                <input
                  type="text"
                  placeholder="எ.கா: பழ வகைகள், பூக்கள்"
                  value={newLabelTa}
                  onChange={(e) => handleCreateNameChange(e.target.value, newLabelEn)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">
                  Category Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Fruits, Flowers"
                  value={newLabelEn}
                  onChange={(e) => handleCreateNameChange(newLabelTa, e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>
            </div>

            {/* Rich Curated Icon / Emoji Grid */}
            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                  <span>சின்னம் தேர்ந்தெடு (Select Icon):</span>
                  <span className="text-base">{newIcon}</span>
                </label>
                <span className="text-[9.5px] text-emerald-800 font-bold flex items-center gap-0.5 bg-emerald-100/80 px-1.5 py-0.2 rounded">
                  <Wand2 className="w-2.5 h-2.5" />
                  <span>தானியங்கி பரிந்துரை உண்டு</span>
                </span>
              </div>

              <div className="grid grid-cols-8 gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                {SACRED_ICON_PRESETS.map((p) => {
                  const isSelected = newIcon === p.icon;
                  return (
                    <button
                      key={p.icon}
                      type="button"
                      onClick={() => {
                        setNewIcon(p.icon);
                        setNewManualIconChanged(true);
                      }}
                      title={`${p.label} (${p.icon})`}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-amber-100 border-amber-500 scale-110 shadow-xs ring-2 ring-amber-400"
                          : "bg-slate-50/80 hover:bg-emerald-50 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      {p.icon}
                    </button>
                  );
                })}
              </div>
            </div>

            {formError && (
              <p className="text-[10.5px] text-rose-600 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{formError}</span>
              </p>
            )}

            <div className="flex justify-end gap-2 pt-1 border-t border-emerald-200/60">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                ரத்து
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-850 hover:bg-emerald-900 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>வகை சேர் (Save Category)</span>
              </button>
            </div>
          </form>
        )}

        {/* 2. CATEGORIES LIST WITH OVERHAULED INLINE EDIT CARD */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
            <span>தற்போதுள்ள பொருட்கள் வகைகள் ({categories.length})</span>
            <span className="text-[10px] text-slate-400 font-medium">சின்னம் & பெயர் மாற்றலாம்</span>
          </div>

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/40 border-2 border-amber-400 shadow-sm space-y-3 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                        <span>வகையை திருத்துதல் (Edit Category)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                      >
                        ✕ ரத்து
                      </button>
                    </div>

                    {/* Live Preview Pill */}
                    <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-amber-200/80 shadow-2xs">
                      <span className="text-[10.5px] font-bold text-slate-500">மாதிரி:</span>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-300 font-extrabold text-xs shadow-2xs">
                        <span className="text-sm">{editIcon}</span>
                        <span>{editLabelTa || editLabelEn || cat.labelTa}</span>
                        {editLabelEn && editLabelTa && (
                          <span className="text-[10px] text-slate-500 font-normal">({editLabelEn})</span>
                        )}
                      </div>
                    </div>

                    {/* Inputs */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">
                          வகைப் பெயர் (தமிழ்)
                        </label>
                        <input
                          type="text"
                          value={editLabelTa}
                          onChange={(e) => handleEditNameChange(e.target.value, editLabelEn)}
                          placeholder="பெயர் (தமிழ்)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10.5px] font-bold text-slate-700 block mb-0.5">
                          Category Name (English)
                        </label>
                        <input
                          type="text"
                          value={editLabelEn}
                          onChange={(e) => handleEditNameChange(editLabelTa, e.target.value)}
                          placeholder="Name (English)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
                        />
                      </div>
                    </div>

                    {/* Rich Curated Icon Grid Picker in Edit Mode */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-bold text-slate-700 flex items-center gap-1">
                          <span>சின்னம் தேர்ந்தெடு (Select Icon):</span>
                          <span className="text-base">{editIcon}</span>
                        </label>
                        <span className="text-[9.5px] text-amber-800 font-bold bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-200">
                          1-டேப் சின்னத் தேர்வு
                        </span>
                      </div>

                      <div className="grid grid-cols-8 gap-1.5 p-2 bg-white rounded-xl border border-slate-200 max-h-32 overflow-y-auto">
                        {SACRED_ICON_PRESETS.map((p) => {
                          const isSelected = editIcon === p.icon;
                          return (
                            <button
                              key={p.icon}
                              type="button"
                              onClick={() => {
                                setEditIcon(p.icon);
                                setEditManualIconChanged(true);
                              }}
                              title={`${p.label} (${p.icon})`}
                              className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition active:scale-95 cursor-pointer ${
                                isSelected
                                  ? "bg-amber-100 border-amber-500 scale-110 shadow-xs ring-2 ring-amber-400"
                                  : "bg-slate-50/80 hover:bg-amber-50 border-slate-200 hover:border-amber-300"
                              }`}
                            >
                              {p.icon}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex justify-end gap-2 pt-1 border-t border-amber-200/80">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-xl bg-white text-slate-600 text-xs font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        ரத்து
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-800 to-emerald-900 hover:opacity-95 text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>சேமி (Save Changes)</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 flex items-center justify-between gap-2.5 transition shadow-2xs hover:shadow-xs group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100/80 border border-amber-200 flex items-center justify-center text-lg shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-black text-xs sm:text-sm text-slate-900 leading-tight truncate">
                        {cat.labelTa}
                      </div>
                      <div className="text-[10.5px] text-slate-500 font-semibold truncate mt-0.5">
                        {cat.labelEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="px-2.5 py-1.5 text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition active:scale-95 cursor-pointer flex items-center gap-1 text-[11px] font-bold shadow-2xs"
                      title="பெயர் / சின்னம் மாற்று"
                    >
                      <Edit2 className="w-3 h-3 text-amber-700" />
                      <span>திருத்து</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.labelTa || cat.labelEn)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition active:scale-95 cursor-pointer border border-transparent hover:border-rose-200"
                      title="வகையை நீக்கு"
                      aria-label={`Delete ${cat.labelTa}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer active:scale-95"
          >
            முடிந்தது (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
