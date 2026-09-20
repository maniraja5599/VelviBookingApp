"use client";

import React, { useState } from "react";
import { useTheme } from "@/components/providers/ThemeContext";
import { ThemePreset } from "@/lib/types";
import { ArrowLeft, Check, Sparkles, Palette } from "lucide-react";
import Link from "next/link";

export default function ThemeSettingsPage() {
  const { theme, setPreset, setCustomColors } = useTheme();
  const [customPrimary, setCustomPrimary] = useState(theme.primary);
  const [customAccent, setCustomAccent] = useState(theme.accent);
  const [saveMessage, setSaveMessage] = useState("");

  const presets: Array<{
    id: ThemePreset;
    name: string;
    tamilName: string;
    colors: string[];
    description: string;
    tagline: string;
  }> = [
    {
      id: "traditional",
      name: "Traditional Vedic",
      tamilName: "வேத பாரம்பரியம் (சந்தனம் & பொன்)",
      colors: ["#FAF7F2", "#4A2E18", "#C89234"],
      description: "Warm Cream + Deep Sacred Brown + Temple Gold",
      tagline: "அமைதியான சாந்தமான மரபுவழி தோற்றம்",
    },
    {
      id: "classic",
      name: "Sacred Bilva Green",
      tamilName: "வில்வ தள பசுமை (புனித பச்சையும் தங்கமும்)",
      colors: ["#F4F7F4", "#1B4324", "#C89234"],
      description: "White + Sacred Bilva Green + Radiant Gold",
      tagline: "மங்கலகரமான பசுமை மற்றும் கோவில் பொன் நிறம்",
    },
    {
      id: "royal",
      name: "Royal Kumkum",
      tamilName: "ராஜ குங்குமம் (மரூன் & பிரகாச தங்கம்)",
      colors: ["#FAF5F6", "#6B1724", "#D4AF37"],
      description: "Cream + Sacred Kumkum Maroon + Deep Gold",
      tagline: "கம்பீரமான திருக்கோவில் திருவிழா தோற்றம்",
    },
    {
      id: "modern",
      name: "Modern Vedic",
      tamilName: "நவீன வேத பாணி (சாம்பல் & பொன்)",
      colors: ["#FFFFFF", "#2D2825", "#B8860B"],
      description: "Crisp Slate White + Earth Charcoal + Ochre Gold",
      tagline: "தெளிவான நவீன வடிவமைப்பு",
    },
  ];

  const handleSelectPreset = (p: ThemePreset) => {
    setPreset(p);
    setSaveMessage(`Applied ${p.toUpperCase()} theme.`);
    setTimeout(() => setSaveMessage(""), 2500);
  };

  const handleApplyCustom = () => {
    setCustomColors(customPrimary, customAccent);
    setSaveMessage("Custom colors saved successfully!");
    setTimeout(() => setSaveMessage(""), 2500);
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/app/settings"
          className="p-1.5 hover:bg-velvi-cream rounded-full text-velvi-brown transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-base font-bold text-velvi-brownDark">Theme & Styling</h2>
          <p className="text-xs text-velvi-brown/60">Choose your brand visual theme</p>
        </div>
      </div>

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-2.5 rounded-xl text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-green-600" />
          <span>{saveMessage}</span>
        </div>
      )}

      {/* Live Preview Card (Point 78) */}
      <div className="bg-white rounded-3xl p-4 border border-velvi-gold/30 shadow-sacred space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-velvi-brown/60 uppercase tracking-wider">
            Live Preview
          </span>
          <span className="text-[10px] font-bold text-velvi-goldDark uppercase">
            Active: {theme.preset}
          </span>
        </div>

        {/* Mini Preview Box styled with current active theme CSS variables */}
        <div className="rounded-2xl p-4 border border-velvi-gold/30 shadow-sm space-y-2.5 bg-velvi-cream">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold text-velvi-goldDark">புரட்டாசி 26</div>
              <h4 className="font-bold text-sm text-velvi-brownDark">🙏 Vanakkam</h4>
            </div>
            <div className="w-6 h-6 rounded-full bg-velvi-gold/20 flex items-center justify-center text-xs">
              🪔
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-velvi-gold/20 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-velvi-brownDark">Ganapathi Homam</span>
              <span className="text-[10px] text-velvi-brown/60 block">12 Sep • 08:00 AM</span>
            </div>
            <span className="font-bold text-velvi-brown">₹5,000</span>
          </div>

          <button className="w-full py-2 bg-velvi-brown text-white rounded-xl text-xs font-bold shadow-sm">
            Sample Action Button
          </button>
        </div>
      </div>

      {/* Theme Presets List */}
      <div className="space-y-2.5">
        <h3 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide">
          Preset Palettes
        </h3>

        {presets.map((p) => {
          const isSelected = theme.preset === p.id;
          return (
            <div
              key={p.id}
              onClick={() => handleSelectPreset(p.id)}
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? "bg-amber-50/80 border-velvi-gold shadow-md ring-2 ring-velvi-gold/40"
                  : "bg-white border-velvi-gold/20 hover:border-velvi-gold/50 shadow-xs"
              }`}
            >
              <div className="space-y-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-extrabold text-xs text-velvi-brownDark">{p.name}</h4>
                  {isSelected && (
                    <span className="px-1.5 py-0.2 bg-velvi-gold text-velvi-brownDark text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" /> Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-bold text-velvi-goldDark">{p.tamilName}</p>
                <p className="text-[10px] text-velvi-brown/70 leading-tight">{p.tagline}</p>
              </div>

              {/* Color Swatch Circles */}
              <div className="flex -space-x-2 shrink-0">
                {p.colors.map((c, idx) => (
                  <div
                    key={idx}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-sm ring-1 ring-black/5"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Theme Color Picker (Point 23) */}
      <div className="bg-white rounded-2xl p-4 border border-velvi-gold/20 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-velvi-gold" />
          <h4 className="font-bold text-xs text-velvi-brownDark">Custom Hex Colors</h4>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-velvi-brown/70 block mb-1 font-semibold">Primary Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customPrimary}
                onChange={(e) => setCustomPrimary(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0"
              />
              <span className="font-mono text-xs">{customPrimary}</span>
            </div>
          </div>

          <div>
            <label className="text-velvi-brown/70 block mb-1 font-semibold">Accent Gold</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={customAccent}
                onChange={(e) => setCustomAccent(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-0"
              />
              <span className="font-mono text-xs">{customAccent}</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleApplyCustom}
          className="w-full py-2 bg-velvi-cream hover:bg-velvi-gold/20 text-velvi-brown font-bold rounded-xl text-xs border border-velvi-gold/30 transition"
        >
          Save Custom Colors
        </button>
      </div>
    </div>
  );
}
