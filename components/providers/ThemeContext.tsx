"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ThemePreset } from "@/lib/types";

export interface ThemeConfig {
  preset: ThemePreset;
  cream: string;
  creamLight: string;
  creamDark: string;
  brown: string;
  brownDark: string;
  brownLight: string;
  gold: string;
  goldLight: string;
  goldDark: string;
  primary: string;
  accent: string;
}

export const THEME_PRESETS: Record<ThemePreset, ThemeConfig> = {
  traditional: {
    preset: "traditional",
    cream: "#FAF7F2",
    creamLight: "#FFFDF9",
    creamDark: "#F0E9DF",
    brown: "#4A2E18",
    brownDark: "#2C1810",
    brownLight: "#6E4729",
    gold: "#C89234",
    goldLight: "#E6B865",
    goldDark: "#9E6E1B",
    primary: "#4A2E18",
    accent: "#C89234",
  },
  classic: {
    preset: "classic",
    cream: "#F4F7F4",
    creamLight: "#FFFFFF",
    creamDark: "#E2ECE2",
    brown: "#1B4324",
    brownDark: "#0F2815",
    brownLight: "#2D683A",
    gold: "#C89234",
    goldLight: "#DFB35A",
    goldDark: "#9A6D1C",
    primary: "#1B4324",
    accent: "#C89234",
  },
  royal: {
    preset: "royal",
    cream: "#FAF5F6",
    creamLight: "#FFFDFD",
    creamDark: "#F2E2E6",
    brown: "#6B1724",
    brownDark: "#420C15",
    brownLight: "#8F2435",
    gold: "#D4AF37",
    goldLight: "#E6C65A",
    goldDark: "#A6861D",
    primary: "#6B1724",
    accent: "#D4AF37",
  },
  modern: {
    preset: "modern",
    cream: "#FDFDFD",
    creamLight: "#FFFFFF",
    creamDark: "#F0EFEF",
    brown: "#3D3835",
    brownDark: "#23201E",
    brownLight: "#5A534F",
    gold: "#B8860B",
    goldLight: "#D4A32D",
    goldDark: "#8B6507",
    primary: "#3D3835",
    accent: "#B8860B",
  },
  custom: {
    preset: "custom",
    cream: "#FAF7F2",
    creamLight: "#FFFDF9",
    creamDark: "#F0E9DF",
    brown: "#4A2E18",
    brownDark: "#2C1810",
    brownLight: "#6E4729",
    gold: "#C89234",
    goldLight: "#E6B865",
    goldDark: "#9E6E1B",
    primary: "#4A2E18",
    accent: "#C89234",
  },
};

interface ThemeContextType {
  theme: ThemeConfig;
  setPreset: (preset: ThemePreset) => void;
  setCustomColors: (primary: string, accent: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: THEME_PRESETS.traditional,
  setPreset: () => {},
  setCustomColors: () => {},
});

function hexToRgb(hex: string): string {
  try {
    const cleanHex = hex.replace("#", "");
    if (cleanHex.length === 3) {
      const r = parseInt(cleanHex[0] + cleanHex[0], 16);
      const g = parseInt(cleanHex[1] + cleanHex[1], 16);
      const b = parseInt(cleanHex[2] + cleanHex[2], 16);
      return `${r} ${g} ${b}`;
    }
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `${r} ${g} ${b}`;
  } catch {
    return "250 247 242";
  }
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeConfig>(THEME_PRESETS.traditional);

  useEffect(() => {
    const savedPreset = localStorage.getItem("velvi_theme_preset") as ThemePreset;
    if (savedPreset && THEME_PRESETS[savedPreset]) {
      setTheme(THEME_PRESETS[savedPreset]);
    }
  }, []);

  useEffect(() => {
    // Apply CSS variables to root (both hex and space-separated RGB triplets for Tailwind alpha support)
    const root = document.documentElement;
    root.style.setProperty("--velvi-cream", theme.cream);
    root.style.setProperty("--velvi-cream-light", theme.creamLight);
    root.style.setProperty("--velvi-cream-dark", theme.creamDark);
    root.style.setProperty("--velvi-brown", theme.brown);
    root.style.setProperty("--velvi-brown-dark", theme.brownDark);
    root.style.setProperty("--velvi-brown-light", theme.brownLight);
    root.style.setProperty("--velvi-gold", theme.gold);
    root.style.setProperty("--velvi-gold-light", theme.goldLight);
    root.style.setProperty("--velvi-gold-dark", theme.goldDark);

    root.style.setProperty("--velvi-cream-rgb", hexToRgb(theme.cream));
    root.style.setProperty("--velvi-cream-light-rgb", hexToRgb(theme.creamLight));
    root.style.setProperty("--velvi-cream-dark-rgb", hexToRgb(theme.creamDark));
    root.style.setProperty("--velvi-brown-rgb", hexToRgb(theme.brown));
    root.style.setProperty("--velvi-brown-dark-rgb", hexToRgb(theme.brownDark));
    root.style.setProperty("--velvi-brown-light-rgb", hexToRgb(theme.brownLight));
    root.style.setProperty("--velvi-gold-rgb", hexToRgb(theme.gold));
    root.style.setProperty("--velvi-gold-light-rgb", hexToRgb(theme.goldLight));
    root.style.setProperty("--velvi-gold-dark-rgb", hexToRgb(theme.goldDark));
  }, [theme]);

  const setPreset = (preset: ThemePreset) => {
    const config = THEME_PRESETS[preset] || THEME_PRESETS.traditional;
    setTheme(config);
    localStorage.setItem("velvi_theme_preset", preset);
  };

  const setCustomColors = (primary: string, accent: string) => {
    const customConfig: ThemeConfig = {
      ...THEME_PRESETS.custom,
      brown: primary,
      primary,
      gold: accent,
      accent,
    };
    setTheme(customConfig);
    localStorage.setItem("velvi_theme_preset", "custom");
  };

  return (
    <ThemeContext.Provider value={{ theme, setPreset, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
