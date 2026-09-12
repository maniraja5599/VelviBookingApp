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
  }> = [
    {
      id: "traditional",
      name: "Traditional",
      tamilName: "பாரம்பரியம்",
      colors: ["#FAF7F2", "#4A2E18", "#C89234"],
      description: "Warm Cream + Deep Brown + Temple Gold",
    },
    {
      id: "classic",
      name: "Classic",
      tamilName: "செம்மொழி பசுமை",
      colors: ["#F4F7F4", "#1B4324", "#C89234"],
      description: "White + Sacred Bilva Green + Gold",
    },
    {
      id: "royal",
      name: "Royal",
      tamilName: "ராஜகம்பீரம்",
      colors: ["#FAF5F6", "#6B1724", "#D4AF37"],
      description: "Cream + Sacred Kumkum Maroon + Gold",
    },
    {
      id: "modern",
      name: "Modern",
      tamilName: "நவீன வடிவம்",
      colors: ["#FFFFFF", "#3D3835", "#B8860B"],
      description: "Crisp White + Earth Brown + Soft Gold",
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
              <h4 className="font-bold text-sm text-velvi-brownDark">🙏 Vanakkam, Ravi Iyer</h4>
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
              className={`p-3.5 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                isSelected
                  ? "bg-velvi-gold/10 border-velvi-gold shadow-sm ring-2 ring-velvi-gold/30"
                  : "bg-white border-velvi-gold/20 hover:border-velvi-gold/50"
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-velvi-brownDark">{p.name}</h4>
                  {isSelected && <Check className="w-4 h-4 text-velvi-gold stroke-[3]" />}
                </div>
                <p className="text-[11px] text-velvi-brown/60">{p.description}</p>
              </div>

              {/* Color Swatch Circles */}
              <div className="flex -space-x-1.5 shrink-0">
                {p.colors.map((c, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
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
