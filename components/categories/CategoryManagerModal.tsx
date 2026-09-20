"use client";

import React, { useState } from "react";
import { SamagriCategory } from "@/lib/types";
import { db } from "@/lib/db/store";
import { X, Plus, Edit2, Trash2, Check, Sparkles, FolderPlus, Tag } from "lucide-react";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged?: () => void;
}

const EMOJI_PRESETS = [
  "🥥", "🪔", "🪵", "🌿", "🌺", "🪙", "🍎", "🏺", "🌾", "🔔", "🍯", "🧵", "🍚", "🥛", "🍋"
];

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

  // New Category form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabelTa, setNewLabelTa] = useState("");
  const [newLabelEn, setNewLabelEn] = useState("");
  const [newIcon, setNewIcon] = useState("✨");
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
    setShowAddForm(false);
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
    if (window.confirm(`"${name}" வகையை நீக்க விரும்புகிறீர்களா?`)) {
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
    setFormError("");
    setShowAddForm(false);
    refreshCategories();
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-lg w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border border-velvi-gold/40 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-sm shadow-2xs border border-emerald-200">
              <Tag className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                பொருட்கள் வகைகள் மேலாண்மை
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Samagri Categories Manager (Create, Edit & Delete)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Action / New Category Button */}
        {!showAddForm && (
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setEditingId(null);
            }}
            className="w-full py-2 px-3 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-2xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <FolderPlus className="w-4 h-4 text-amber-300" />
            <span>+ புதிய வகை சேர்க்க (Add New Category)</span>
          </button>
        )}

        {/* Add New Category Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3 bg-slate-50 rounded-2xl border border-emerald-300 space-y-2.5 animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                <span>புதிய வகை உருவாக்குதல்</span>
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-xs text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
              >
                ✕ ரத்து
              </button>
            </div>

            {/* Icon picker / Emojis */}
            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                சின்னம் / Icon (Emoji):
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {EMOJI_PRESETS.map((em) => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setNewIcon(em)}
                    className={`w-7 h-7 rounded-lg text-base flex items-center justify-center border cursor-pointer transition ${
                      newIcon === em
                        ? "bg-emerald-100 border-emerald-500 scale-110 shadow-2xs"
                        : "bg-white border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  வகைப் பெயர் (தமிழ்)
                </label>
                <input
                  type="text"
                  placeholder="எ.கா: பழ வகைகள்"
                  value={newLabelTa}
                  onChange={(e) => setNewLabelTa(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                  Category Name (English)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fresh Fruits"
                  value={newLabelEn}
                  onChange={(e) => setNewLabelEn(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {formError && (
              <p className="text-[10px] text-rose-600 font-bold">{formError}</p>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition cursor-pointer"
              >
                ரத்து
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>உருவாக்கு (Create)</span>
              </button>
            </div>
          </form>
        )}

        {/* Categories List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 px-1">
            <span>தற்போதுள்ள வகைகள் ({categories.length})</span>
            <span className="text-[10px] text-slate-400 font-medium">திருத்த / நீக்கலாம்</span>
          </div>

          <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
            {categories.map((cat) => {
              const isEditing = editingId === cat.id;

              if (isEditing) {
                return (
                  <div
                    key={cat.id}
                    className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-300 space-y-2 animate-in fade-in"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editIcon}
                        onChange={(e) => setEditIcon(e.target.value)}
                        className="w-10 text-center py-1 bg-white border border-slate-200 rounded-lg text-sm"
                        title="Emoji"
                      />
                      <input
                        type="text"
                        value={editLabelTa}
                        onChange={(e) => setEditLabelTa(e.target.value)}
                        placeholder="பெயர் (தமிழ்)"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                      />
                      <input
                        type="text"
                        value={editLabelEn}
                        onChange={(e) => setEditLabelEn(e.target.value)}
                        placeholder="Name (English)"
                        className="flex-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 rounded-lg bg-white text-slate-600 text-[11px] font-bold border border-slate-200 hover:bg-slate-100 cursor-pointer"
                      >
                        ரத்து
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(cat.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                        <span>சேமி</span>
                      </button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={cat.id}
                  className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 flex items-center justify-between gap-2 transition shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span className="text-base shrink-0">{cat.icon}</span>
                    <div className="min-w-0">
                      <div className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                        {cat.labelTa}
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {cat.labelEn}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition active:scale-95 cursor-pointer"
                      title="பெயர் / சின்னம் மாற்று"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat.id, cat.labelTa || cat.labelEn)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer"
                      title="வகையை நீக்கு"
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
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            முடிந்தது (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
