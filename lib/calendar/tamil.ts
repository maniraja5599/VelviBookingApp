// ==============================================================================
// VELVI TAMIL + ENGLISH CALENDAR & PANCHANGAM ENGINE
// ==============================================================================

export interface TamilDateInfo {
  gregorianDate: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  monthNameEn: string;
  monthNameTa: string;
  year: number;
  dayOfWeekEn: string;
  dayOfWeekTa: string;
  tamilYear: string;
  tamilMonth: string;
  tamilMonthEn: string;
  tamilDay: number;
  tithi: string;
  nakshatra: string;
  rahuKalam: string;
  yamagandam: string;
  kuligai: string;
  formattedDualDate: string; // e.g., "12 Sep 2026 • புரட்டாசி 26"
  formattedFullDay: string; // e.g., "Saturday, 12 Sep 2026 / புரட்டாசி 26"
}

export const TAMIL_MONTHS = [
  { en: "Chithirai", ta: "சித்திரை", startMonth: 3, startDay: 14 }, // Apr 14
  { en: "Vaikasi", ta: "வைகாசி", startMonth: 4, startDay: 15 }, // May 15
  { en: "Aani", ta: "ஆனி", startMonth: 5, startDay: 15 }, // Jun 15
  { en: "Aadi", ta: "ஆடி", startMonth: 6, startDay: 16 }, // Jul 16
  { en: "Aavani", ta: "ஆவணி", startMonth: 7, startDay: 17 }, // Aug 17
  { en: "Purattasi", ta: "புரட்டாசி", startMonth: 8, startDay: 17 }, // Sep 17
  { en: "Aippasi", ta: "ஐப்பசி", startMonth: 9, startDay: 18 }, // Oct 18
  { en: "Karthigai", ta: "கார்த்திகை", startMonth: 10, startDay: 17 }, // Nov 17
  { en: "Margazhi", ta: "மார்கழி", startMonth: 11, startDay: 16 }, // Dec 16
  { en: "Thai", ta: "தை", startMonth: 0, startDay: 14 }, // Jan 14
  { en: "Maasi", ta: "மாசி", startMonth: 1, startDay: 13 }, // Feb 13
  { en: "Panguni", ta: "பங்குனி", startMonth: 2, startDay: 15 }, // Mar 15
];

export const TAMIL_WEEKDAYS = [
  { en: "Sunday", ta: "ஞாயிறு", rahu: "16:30 - 18:00", yama: "12:00 - 13:30", kuli: "15:00 - 16:30" },
  { en: "Monday", ta: "திங்கள்", rahu: "07:30 - 09:00", yama: "10:30 - 12:00", kuli: "13:30 - 15:00" },
  { en: "Tuesday", ta: "செவ்வாய்", rahu: "15:00 - 16:30", yama: "09:00 - 10:30", kuli: "12:00 - 13:30" },
  { en: "Wednesday", ta: "புதன்", rahu: "12:00 - 13:30", yama: "07:30 - 09:00", kuli: "10:30 - 12:00" },
  { en: "Thursday", ta: "வியாழன்", rahu: "13:30 - 15:00", yama: "06:00 - 07:30", kuli: "09:00 - 10:30" },
  { en: "Friday", ta: "வெள்ளி", rahu: "10:30 - 12:00", yama: "15:00 - 16:30", kuli: "07:30 - 09:00" },
  { en: "Saturday", ta: "சனி", rahu: "09:00 - 10:30", yama: "13:30 - 15:00", kuli: "06:00 - 07:30" },
];

export const NAKSHATRAS = [
  "அஸ்வினி (Ashwini)", "பரணி (Bharani)", "கிருத்திகை (Krittika)", "ரோகிணி (Rohini)",
  "மிருகசீரிடம் (Mrigashira)", "திருவாதிரை (Thiruvathirai)", "புனர்பூசம் (Punarpoosam)",
  "பூசம் (Poosam)", "ஆயில்யம் (Ayilyam)", "மகம் (Magam)", "பூரம் (Pooram)",
  "உத்திரம் (Uthiram)", "அஸ்தம் (Hastham)", "சித்திரை (Chithirai)", "சுவாதி (Swathi)",
  "விசாகம் (Visakam)", "அனுஷம் (Anusham)", "கேட்டை (Kettai)", "மூலம் (Moolam)",
  "பூராடம் (Pooradam)", "உத்திராடம் (Uthiradam)", "திருவோணம் (Thiruvonam)",
  "அவிட்டம் (Avittam)", "சதயம் (Sadayam)", "பூரட்டாதி (Poorattathi)",
  "உத்திரட்டாதி (Uthirattathi)", "ரேவதி (Revathi)"
];

export const TITHIS = [
  "பிரதமை (Prathama)", "துவிதியை (Dvitiya)", "திருதியை (Tritiya)", "சதுர்த்தி (Chaturthi)",
  "பஞ்சமி (Panchami)", "சஷ்டி (Shasthi)", "சப்தமி (Saptami)", "அஷ்டமி (Ashtami)",
  "நவமி (Navami)", "தசமி (Dashami)", "ஏகாதசி (Ekadashi)", "துவாதசி (Dvadashi)",
  "திரயோதசி (Trayodashi)", "சதுர்த்தசி (Chaturdashi)", "பௌர்ணமி (Pournami)",
  "அமாவாசை (Amavasya)"
];

export const TAMIL_YEARS_60 = [
  "பிரபவ", "விபவ", "சுக்கில", "பிரமோதூத", "பிரசோற்பத்தி", "ஆங்கீரச", "ஸ்ரீமுக", "பவ",
  "யுவ", "தாது", "ஈஸ்வர", "வெகுதானிய", "பிரமாதி", "விக்ரம", "விஷு", "சித்திரபானு",
  "சுபானு", "தாரண", "பார்த்திப", "விய", "சர்வசித்து", "சர்வதாரி", "विरोதி", "விக்ருதி",
  "கர", "நந்தன", "விஜய", "ஜய", "மன்மத", "துன்முகி", "ஹேவிளம்பி", "விளம்பி",
  "விகாரி", "சார்வரி", "பிலவ", "சுபகிருது", "சோபகிருது", "குரோதி", "விசுவாவசு", "பராபவ"
];

/**
 * Convert any Date or YYYY-MM-DD string into detailed Tamil + English calendar data
 */
export function getTamilDate(inputDate: Date | string): TamilDateInfo {
  const date = typeof inputDate === "string" ? new Date(inputDate + "T00:00:00") : new Date(inputDate);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const day = date.getDate();
  const dayOfWeek = date.getDay(); // 0-6

  // Determine Tamil Month and Day
  // Transition logic for 12 Tamil Solar Months
  let tamilMonthIndex = 0;
  let tamilDay = 1;

  if (month === 0) { // Jan
    if (day < 14) {
      tamilMonthIndex = 8; // Margazhi
      tamilDay = day + 16;
    } else {
      tamilMonthIndex = 9; // Thai
      tamilDay = day - 13;
    }
  } else if (month === 1) { // Feb
    if (day < 13) {
      tamilMonthIndex = 9; // Thai
      tamilDay = day + 17;
    } else {
      tamilMonthIndex = 10; // Maasi
      tamilDay = day - 12;
    }
  } else if (month === 2) { // Mar
    if (day < 15) {
      tamilMonthIndex = 10; // Maasi
      tamilDay = day + 16;
    } else {
      tamilMonthIndex = 11; // Panguni
      tamilDay = day - 14;
    }
  } else if (month === 3) { // Apr
    if (day < 14) {
      tamilMonthIndex = 11; // Panguni
      tamilDay = day + 17;
    } else {
      tamilMonthIndex = 0; // Chithirai
      tamilDay = day - 13;
    }
  } else if (month === 4) { // May
    if (day < 15) {
      tamilMonthIndex = 0; // Chithirai
      tamilDay = day + 17;
    } else {
      tamilMonthIndex = 1; // Vaikasi
      tamilDay = day - 14;
    }
  } else if (month === 5) { // Jun
    if (day < 15) {
      tamilMonthIndex = 1; // Vaikasi
      tamilDay = day + 17;
    } else {
      tamilMonthIndex = 2; // Aani
      tamilDay = day - 14;
    }
  } else if (month === 6) { // Jul
    if (day < 16) {
      tamilMonthIndex = 2; // Aani
      tamilDay = day + 16;
    } else {
      tamilMonthIndex = 3; // Aadi
      tamilDay = day - 15;
    }
  } else if (month === 7) { // Aug
    if (day < 17) {
      tamilMonthIndex = 3; // Aadi
      tamilDay = day + 16;
    } else {
      tamilMonthIndex = 4; // Aavani
      tamilDay = day - 16;
    }
  } else if (month === 8) { // Sep
    // Purattasi begins mid-September (approx 17th or around 12-17)
    if (day < 17) {
      tamilMonthIndex = 4; // Aavani
      tamilDay = day + 15;
    } else {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = day - 16;
    }
  } else if (month === 9) { // Oct
    if (day < 18) {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = day + 14;
    } else {
      tamilMonthIndex = 6; // Aippasi
      tamilDay = day - 17;
    }
  } else if (month === 10) { // Nov
    if (day < 17) {
      tamilMonthIndex = 6; // Aippasi
      tamilDay = day + 14;
    } else {
      tamilMonthIndex = 7; // Karthigai
      tamilDay = day - 16;
    }
  } else { // Dec
    if (day < 16) {
      tamilMonthIndex = 7; // Karthigai
      tamilDay = day + 14;
    } else {
      tamilMonthIndex = 8; // Margazhi
      tamilDay = day - 15;
    }
  }

  const currentTamilMonth = TAMIL_MONTHS[tamilMonthIndex];
  const weekdayInfo = TAMIL_WEEKDAYS[dayOfWeek];

  // Tamil 60-year cycle calculation (2026 is குரோதி / விசுவாவசு)
  const tamilYearOffset = (year - 1987 + 60) % 60;
  const tamilYear = TAMIL_YEARS_60[tamilYearOffset] || "குரோதி";

  // Pseudo-astronomical tithi & nakshatra determinism based on lunar cycle day
  const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 0).getTime()) / (1000 * 60 * 60 * 24));
  const nakshatraIndex = (dayOfYear + 5) % NAKSHATRAS.length;
  const tithiIndex = (dayOfYear + 2) % TITHIS.length;

  const englishMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateStr = date.toISOString().split("T")[0];

  return {
    gregorianDate: date,
    dateStr,
    dayOfMonth: day,
    monthNameEn: englishMonthNames[month],
    monthNameTa: currentTamilMonth.ta,
    year,
    dayOfWeekEn: weekdayInfo.en,
    dayOfWeekTa: weekdayInfo.ta,
    tamilYear,
    tamilMonth: currentTamilMonth.ta,
    tamilMonthEn: currentTamilMonth.en,
    tamilDay,
    tithi: TITHIS[tithiIndex],
    nakshatra: NAKSHATRAS[nakshatraIndex],
    rahuKalam: weekdayInfo.rahu,
    yamagandam: weekdayInfo.yama,
    kuligai: weekdayInfo.kuli,
    formattedDualDate: `${day} ${englishMonthNames[month]} ${year} • ${currentTamilMonth.ta} ${tamilDay}`,
    formattedFullDay: `${weekdayInfo.en}, ${day} ${englishMonthNames[month]} ${year} / ${currentTamilMonth.ta} ${tamilDay}`,
  };
}
