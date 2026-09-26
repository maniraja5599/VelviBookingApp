// ==============================================================================
// VELVI TAMIL PANCHANGAM — YOGAM & CHANDRASHTAMAM CALCULATION ENGINE
// ==============================================================================

export const TAMIL_NAKSHATRAS = [
  "அஸ்வினி",
  "பரணி",
  "கார்த்திகை",
  "ரோகிணி",
  "மிருகசீரிஷம்",
  "திருவாதிரை",
  "புனர்பூசம்",
  "பூசம்",
  "ஆயில்யம்",
  "மகம்",
  "பூரம்",
  "உத்திரம்",
  "அஸ்தம்",
  "சித்திரை",
  "சுவாதி",
  "விசாகம்",
  "அனுஷம்",
  "கேட்டை",
  "மூலம்",
  "பூராடம்",
  "உத்திராடம்",
  "திருவோணம்",
  "அவிட்டம்",
  "சதயம்",
  "பூரட்டாதி",
  "உத்திரட்டாதி",
  "ரேவதி",
];

// Yogam calculation based on weekday (0=Sun to 6=Sat) and 0-indexed nakshatra
export function getDailyYogam(dayOfWeek: number, nakshatraIndex: number): {
  nameTa: string;
  nameEn: string;
  type: "AMRITHA" | "SIDDHA" | "MARANA";
  descriptionTa: string;
} {
  // Specific Marana Yogam combinations in traditional Tamil Panchangam:
  // Sun: Bharani (1), Karthigai (2), Rohini (3)
  // Mon: Uthiradam (20), Thiruvonam (21)
  // Tue: Rohini (3), Ashwini (0)
  // Wed: Swathi (14), Visakam (15)
  // Thu: Magam (9), Poosam (7)
  // Fri: Revathi (26), Uthirattathi (25)
  // Sat: Revathi (26), Hastham (12)
  const isMarana =
    (dayOfWeek === 0 && (nakshatraIndex === 1 || nakshatraIndex === 2)) ||
    (dayOfWeek === 1 && (nakshatraIndex === 20 || nakshatraIndex === 21)) ||
    (dayOfWeek === 2 && (nakshatraIndex === 3 || nakshatraIndex === 0)) ||
    (dayOfWeek === 3 && (nakshatraIndex === 14 || nakshatraIndex === 15)) ||
    (dayOfWeek === 4 && (nakshatraIndex === 9 || nakshatraIndex === 7)) ||
    (dayOfWeek === 5 && (nakshatraIndex === 26 || nakshatraIndex === 25)) ||
    (dayOfWeek === 6 && (nakshatraIndex === 26 || nakshatraIndex === 12));

  if (isMarana) {
    return {
      nameTa: "மரண யோகம்",
      nameEn: "Marana Yogam",
      type: "MARANA",
      descriptionTa: "புதிய சுப காரியங்களைத் தவிர்க்கவும்",
    };
  }

  // Amritha Yogam combinations:
  // Sun: Hastham (12), Mrigasirsham (4)
  // Mon: Rohini (3), Poosam (7)
  // Tue: Ashwini (0), Uthiram (11)
  // Wed: Thiruvonam (21), Rohini (3)
  // Thu: Poosam (7), Punarpoosam (6)
  // Fri: Revathi (26), Hastham (12)
  // Sat: Hastham (12), Rohini (3)
  const isAmritha =
    (dayOfWeek === 0 && (nakshatraIndex === 12 || nakshatraIndex === 4)) ||
    (dayOfWeek === 1 && (nakshatraIndex === 3 || nakshatraIndex === 7)) ||
    (dayOfWeek === 2 && (nakshatraIndex === 0 || nakshatraIndex === 11)) ||
    (dayOfWeek === 3 && (nakshatraIndex === 21 || nakshatraIndex === 3)) ||
    (dayOfWeek === 4 && (nakshatraIndex === 7 || nakshatraIndex === 6)) ||
    (dayOfWeek === 5 && (nakshatraIndex === 26 || nakshatraIndex === 12)) ||
    (dayOfWeek === 6 && (nakshatraIndex === 12 || nakshatraIndex === 3));

  if (isAmritha) {
    return {
      nameTa: "அமிர்த யோகம்",
      nameEn: "Amritha Yogam",
      type: "AMRITHA",
      descriptionTa: "அனைத்து சுப காரியங்களுக்கும் அதீத உகந்தது",
    };
  }

  return {
    nameTa: "சித்த யோகம்",
    nameEn: "Siddha Yogam",
    type: "SIDDHA",
    descriptionTa: "சுப காரியங்கள், ஹோமங்களுக்கு நன்று",
  };
}

// Chandrashtamam: The 16th nakshatra counting from the current moon transit nakshatra
export function getChandrashtamamNakshatras(nakshatraIndex: number): {
  primaryTa: string;
  secondaryTa?: string;
} {
  const chandraIdx = (nakshatraIndex + 16) % 27;
  const nextChandraIdx = (chandraIdx + 1) % 27;
  return {
    primaryTa: TAMIL_NAKSHATRAS[chandraIdx] || "சுவாதி",
    secondaryTa: TAMIL_NAKSHATRAS[nextChandraIdx] || "விசாகம்",
  };
}
