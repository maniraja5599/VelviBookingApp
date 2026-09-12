"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Language = "en" | "ta";

interface Dictionary {
  [key: string]: {
    en: string;
    ta: string;
  };
}

export const DICTIONARY: Dictionary = {
  appName: { en: "Velvi", ta: "வேள்வி" },
  appTagline: { en: "Pooja • Homam • Seva Management", ta: "பூஜை • ஹோமம் • சேவா மேலாண்மை" },
  vanakkam: { en: "Vanakkam", ta: "வணக்கம்" },
  today: { en: "Today", ta: "இன்று" },
  todaysBookings: { en: "Today's Bookings", ta: "இன்றைய முன்பதிவு" },
  pendingAmount: { en: "Pending Amount", ta: "நிலுவைத் தொகை" },
  upcomingBookings: { en: "Upcoming (7 days)", ta: "வரவிருக்கும் முன்பதிவுகள்" },
  newBooking: { en: "+ New Booking", ta: "+ புதிய முன்பதிவு" },
  home: { en: "Home", ta: "முகப்பு" },
  calendar: { en: "Calendar", ta: "நாட்காட்டி" },
  bookings: { en: "Bookings", ta: "முன்பதிவு" },
  pooja: { en: "Pooja & Items", ta: "பூஜை & பொருட்கள்" },
  customers: { en: "Customers", ta: "வாடிக்கையாளர்" },
  more: { en: "More", ta: "கூடுதல்" },
  requiredItems: { en: "Required Items", ta: "தேவையான பொருட்கள்" },
  payment: { en: "Payment", ta: "பணம்" },
  balance: { en: "Balance", ta: "மீதம்" },
  advance: { en: "Advance", ta: "முன்பணம்" },
  assignedIyer: { en: "Assigned Iyer", ta: "ஒதுக்கப்பட்ட ஐயர்" },
  shareWhatsApp: { en: "Share on WhatsApp", ta: "வாட்ஸ்அப்பில் பகிர்" },
  saveAsImage: { en: "Save as Image", ta: "படமாக சேமி" },
  team: { en: "Team & Iyers", ta: "ஐயர்கள் & குழு" },
  subscription: { en: "Subscription", ta: "சந்தா" },
  referral: { en: "Refer & Earn", ta: "பரிந்துரை & இலவச நாட்கள்" },
  dataBackup: { en: "Data & Backup", ta: "தரவு & காப்புப்பிரதி" },
  settings: { en: "Settings", ta: "அமைப்புகள்" },
  adminPanel: { en: "Super Admin", ta: "நிர்வாக குழு" },
  available: { en: "Available", ta: "கிடைக்கிறார்" },
  alreadyBooked: { en: "Already booked", ta: "முன்பதிவு செய்யப்பட்டுள்ளது" },
  reassign: { en: "Reassign", ta: "மாற்றி ஒதுக்கு" },
  completed: { en: "Completed", ta: "நிறைவுற்றது" },
  confirmed: { en: "Confirmed", ta: "உறுதியானது" },
  paid: { en: "Paid", ta: "செலுத்தப்பட்டது" },
  pending: { en: "Pending", ta: "நிலுவையில்" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("velvi_lang") as Language;
    if (saved && (saved === "en" || saved === "ta")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("velvi_lang", lang);
  };

  const t = (key: string): string => {
    const entry = DICTIONARY[key];
    if (!entry) return key;
    return entry[language] || entry.en;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
