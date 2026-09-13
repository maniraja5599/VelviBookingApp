// ==============================================================================
// VELVI TAMIL + ENGLISH CALENDAR & PANCHANGAM ENGINE
// ==============================================================================

export function getLocalDateString(input?: Date | string): string {
  if (!input) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof input === "string") {
    const cleanStr = input.split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
  }
  const d = new Date(input);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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
  tithiTa: string; // e.g., "துவிதியை (வளர்பிறை)"
  tithiNameTa: string; // e.g., "துவிதியை"
  pakshaTa: string; // e.g., "வளர்பிறை"
  nakshatra: string;
  nakshatraNameTa: string; // e.g., "ஹஸ்தம்"
  rahuKalam: string;
  yamagandam: string;
  kuligai: string;
  nallaNeram: string;
  nallaNeramMorning: string;
  nallaNeramEvening: string;
  gowriNallaNeram: string;
  gowriNallaNeramMorning: string;
  gowriNallaNeramEvening: string;
  formattedDualDate: string; // e.g., "13 Sep 2026 • ஆவணி 28"
  formattedFullDay: string; // e.g., "Sunday, 13 Sep 2026 / ஆவணி 28"
  formattedTamilFull: string; // e.g., "ஞாயிறு, 13 செப்டம்பர் 2026 • ஆவணி 28 (பராபவ வருடம்)"
  formattedEnglishFull: string; // e.g., "Sunday, 13 September 2026 • Aavani 28 (Parabhava)"
  isAmavasai?: boolean;
  isPournami?: boolean;
  isPradosham?: boolean;
  isSashti?: boolean;
  isSankataharaChaturthi?: boolean;
  isEkadashi?: boolean;
  isMuhurtham?: boolean;
  specialDayTag?: string;
  specialDayIcon?: string;
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
  {
    en: "Sunday",
    ta: "ஞாயிறு",
    rahu: "16:30 - 18:00",
    yama: "12:00 - 13:30",
    kuli: "15:00 - 16:30",
    nallaMorning: "07:45 - 08:45",
    nallaEvening: "15:15 - 16:15",
    gowriMorning: "10:45 - 11:45",
    gowriEvening: "13:30 - 14:30",
  },
  {
    en: "Monday",
    ta: "திங்கள்",
    rahu: "07:30 - 09:00",
    yama: "10:30 - 12:00",
    kuli: "13:30 - 15:00",
    nallaMorning: "06:15 - 07:15",
    nallaEvening: "16:45 - 17:45",
    gowriMorning: "09:15 - 10:15",
    gowriEvening: "19:30 - 20:30",
  },
  {
    en: "Tuesday",
    ta: "செவ்வாய்",
    rahu: "15:00 - 16:30",
    yama: "09:00 - 10:30",
    kuli: "12:00 - 13:30",
    nallaMorning: "07:45 - 08:45",
    nallaEvening: "16:45 - 17:45",
    gowriMorning: "10:45 - 11:45",
    gowriEvening: "19:30 - 20:30",
  },
  {
    en: "Wednesday",
    ta: "புதன்",
    rahu: "12:00 - 13:30",
    yama: "07:30 - 09:00",
    kuli: "10:30 - 12:00",
    nallaMorning: "09:15 - 10:15",
    nallaEvening: "16:45 - 17:45",
    gowriMorning: "10:45 - 11:45",
    gowriEvening: "18:30 - 19:30",
  },
  {
    en: "Thursday",
    ta: "வியாழன்",
    rahu: "13:30 - 15:00",
    yama: "06:00 - 07:30",
    kuli: "09:00 - 10:30",
    nallaMorning: "10:45 - 11:45",
    nallaEvening: "12:15 - 13:15",
    gowriMorning: "12:30 - 13:30",
    gowriEvening: "18:30 - 19:30",
  },
  {
    en: "Friday",
    ta: "வெள்ளி",
    rahu: "10:30 - 12:00",
    yama: "15:00 - 16:30",
    kuli: "07:30 - 09:00",
    nallaMorning: "09:15 - 10:15",
    nallaEvening: "16:45 - 17:45",
    gowriMorning: "12:15 - 13:15",
    gowriEvening: "18:30 - 19:30",
  },
  {
    en: "Saturday",
    ta: "சனி",
    rahu: "09:00 - 10:30",
    yama: "13:30 - 15:00",
    kuli: "06:00 - 07:30",
    nallaMorning: "07:45 - 08:45",
    nallaEvening: "16:45 - 17:45",
    gowriMorning: "12:15 - 13:15",
    gowriEvening: "21:30 - 22:30",
  },
];

export const NAKSHATRAS = [
  "அஸ்வினி (Ashwini)", "பரணி (Bharani)", "கிருத்திகை (Krittika)", "ரோகிணி (Rohini)",
  "மிருகசீரிஷம் (Mrigashira)", "திருவாதிரை (Thiruvathirai)", "புனர்பூசம் (Punarpoosam)",
  "பூசம் (Poosam)", "ஆயில்யம் (Ayilyam)", "மகம் (Magam)", "பூரம் (Pooram)",
  "உத்திரம் (Uthiram)", "ஹஸ்தம் (Hastham)", "சித்திரை (Chithirai)", "சுவாதி (Swathi)",
  "விசாகம் (Visakam)", "அனுஷம் (Anusham)", "கேட்டை (Kettai)", "மூலம் (Moolam)",
  "பூராடம் (Pooradam)", "உத்திராடம் (Uthiradam)", "திருவோணம் (Thiruvonam)",
  "அவிட்டம் (Avittam)", "சதயம் (Sadayam)", "பூரட்டாதி (Poorattathi)",
  "உத்திரட்டாதி (Uthirattathi)", "ரேவதி (Revathi)"
];

export const NAKSHATRA_NAMES_TA = [
  "அஸ்வினி", "பரணி", "கிருத்திகை", "ரோகிணி",
  "மிருகசீரிஷம்", "திருவாதிரை", "புனர்பூசம்",
  "பூசம்", "ஆயில்யம்", "மகம்", "பூரம்",
  "உத்திரம்", "ஹஸ்தம்", "சித்திரை", "சுவாதி",
  "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்",
  "பூராடம்", "உத்திராடம்", "திருவோணம்",
  "அவிட்டம்", "சதயம்", "பூரட்டாதி",
  "உத்திரட்டாதி", "ரேவதி"
];

export const TITHI_BASE_NAMES_TA = [
  "பிரதமை", "துவிதியை", "திருதியை", "சதுர்த்தி",
  "பஞ்சமி", "சஷ்டி", "சப்தமி", "அஷ்டமி",
  "நவமி", "தசமி", "ஏகாதசி", "துவாதசி",
  "திரயோதசி", "சதுர்த்தசி", "பௌர்ணமி",
  "பிரதமை", "துவிதியை", "திருதியை", "சதுர்த்தி",
  "பஞ்சமி", "சஷ்டி", "சப்தமி", "அஷ்டமி",
  "நவமி", "தசமி", "ஏகாதசி", "துவாதசி",
  "திரயோதசி", "சதுர்த்தசி", "அமாவாசை"
];

export const TITHIS = [
  "வளர்பிறை பிரதமை (Shukla Prathama)", "துவிதியை (Dvitiya)", "திருதியை (Tritiya)", "சதுர்த்தி (Chaturthi)",
  "பஞ்சமி (Panchami)", "சஷ்டி (Shasthi)", "சப்தமி (Saptami)", "அஷ்டமி (Ashtami)",
  "நவமி (Navami)", "தசமி (Dashami)", "ஏகாதசி (Ekadashi)", "துவாதசி (Dvadashi)",
  "திரயோதசி (Trayodashi)", "சதுர்த்தசி (Chaturdashi)", "பௌர்ணமி (Pournami)",
  "தேய்பிறை பிரதமை (Krishna Prathama)", "துவிதியை (Dvitiya)", "திருதியை (Tritiya)", "சதுர்த்தி (Chaturthi)",
  "பஞ்சமி (Panchami)", "சஷ்டி (Shasthi)", "சப்தமி (Saptami)", "அஷ்டமி (Ashtami)",
  "நவமி (Navami)", "தசமி (Dashami)", "ஏகாதசி (Ekadashi)", "துவாதசி (Dvadashi)",
  "திரயோதசி (Trayodashi)", "சதுர்த்தசி (Chaturdashi)", "அமாவாசை (Amavasya)"
];

export const TAMIL_YEARS_60 = [
  "பிரபவ", "விபவ", "சுக்கில", "பிரமோதூத", "பிரசோற்பத்தி", "ஆங்கீரச", "ஸ்ரீமுக", "பவ",
  "யுவ", "தாது", "ஈஸ்வர", "வெகுதானிய", "பிரமாதி", "விக்ரம", "விஷு", "சித்திரபானு",
  "சுபானு", "தாரண", "பார்த்திப", "விய", "சர்வசித்து", "சர்வதாரி", "விரோதி", "விக்ருதி",
  "கர", "நந்தன", "விஜய", "ஜய", "மன்மத", "துன்முகி", "ஹேவிளம்பி", "விளம்பி",
  "விகாரி", "சார்வரி", "பிலவ", "சுபகிருது", "சோபகிருது", "குரோதி", "விசுவாவசு", "பராபவ",
  "பிலவங்க", "கீலக", "சௌமிய", "சாதாரண", "விரோதகிருது", "பரிதாபி", "பிரமாதீச", "ஆனந்த",
  "ராட்சச", "நள", "பிங்கள", "காளயுக்தி", "சித்தார்த்தி", "ரௌத்திரி", "துன்மதி", "துந்துபி",
  "ருத்ரோத்காரி", "ரக்தாட்சி", "குரோதன", "அட்சய"
];

/**
 * Astronomical calculation of Julian Day
 */
function getJulianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;
  let Y = y;
  let M = m;
  if (m <= 2) {
    Y = y - 1;
    M = m + 12;
  }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + d + B - 1524.5;
}

/**
 * Lahiri Ayanamsa approximation
 */
function getLahiriAyanamsa(jd: number): number {
  return 23.85 + (50.29 / 3600) * (jd - 2451545.0) / 365.25;
}

/**
 * Jean Meeus solar longitude (degrees)
 */
function getSunLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const Mrad = (M * Math.PI) / 180;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mrad)
          + (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad)
          + 0.000289 * Math.sin(3 * Mrad);
  const trueLong = L0 + C;
  return ((trueLong % 360) + 360) % 360;
}

/**
 * Jean Meeus lunar longitude with periodic terms (degrees)
 */
function getMoonLongitude(jd: number): number {
  const T = (jd - 2451545.0) / 36525;
  const L_prime = 218.3164477 + 481267.88123421 * T - 0.0015786 * T * T;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T * T;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T * T;
  const M_prime = 134.9633964 + 477198.8675055 * T + 0.0087414 * T * T;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T * T;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const periodic = 6.288774 * Math.sin(toRad(M_prime))
    + 1.274027 * Math.sin(toRad(2 * D - M_prime))
    + 0.658314 * Math.sin(toRad(2 * D))
    + 0.213618 * Math.sin(toRad(2 * M_prime))
    - 0.185116 * Math.sin(toRad(M))
    - 0.114332 * Math.sin(toRad(2 * F))
    + 0.058793 * Math.sin(toRad(2 * D - 2 * M_prime))
    + 0.057066 * Math.sin(toRad(2 * D - M - M_prime))
    + 0.053322 * Math.sin(toRad(2 * D + M_prime))
    + 0.045758 * Math.sin(toRad(2 * D - M))
    - 0.040923 * Math.sin(toRad(M - M_prime))
    - 0.034720 * Math.sin(toRad(D))
    - 0.030383 * Math.sin(toRad(M + M_prime));

  const trueLong = L_prime + periodic;
  return ((trueLong % 360) + 360) % 360;
}

/**
 * Convert any Date or YYYY-MM-DD string into detailed Tamil + English calendar data
 */
export function getTamilDate(inputDate: Date | string): TamilDateInfo {
  let year: number;
  let month: number; // 0-11
  let day: number;
  let dayOfWeek: number;
  let date: Date;

  if (typeof inputDate === "string") {
    const cleanStr = inputDate.split("T")[0];
    const parts = cleanStr.split("-").map((p) => parseInt(p, 10));
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      year = parts[0];
      month = parts[1] - 1;
      day = parts[2];
      // Use noon (12:00) so timezone shift never crosses day boundaries
      date = new Date(year, month, day, 12, 0, 0);
      dayOfWeek = date.getDay();
    } else {
      date = new Date(inputDate);
      year = date.getFullYear();
      month = date.getMonth();
      day = date.getDate();
      dayOfWeek = date.getDay();
    }
  } else {
    date = new Date(inputDate);
    year = date.getFullYear();
    month = date.getMonth();
    day = date.getDate();
    dayOfWeek = date.getDay();
  }

  // Determine Tamil Month and Day
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
      tamilDay = day + 18;
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
    if (day < 18) {
      tamilMonthIndex = 3; // Aadi
      tamilDay = day + 16;
    } else {
      tamilMonthIndex = 4; // Aavani
      tamilDay = day - 17;
    }
  } else if (month === 8) { // Sep
    if (day < 18) {
      tamilMonthIndex = 4; // Aavani
      tamilDay = day + 14;
    } else {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = day - 17;
    }
  } else if (month === 9) { // Oct
    if (day < 18) {
      tamilMonthIndex = 5; // Purattasi
      tamilDay = day + 13;
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

  // Tamil 60-year cycle calculation (Changes on Chithirai 1 / Apr 14)
  const effectiveYear = (month < 3 || (month === 3 && day < 14)) ? year - 1 : year;
  const tamilYearOffset = (effectiveYear - 1987 + 60) % 60;
  const tamilYear = TAMIL_YEARS_60[tamilYearOffset] || "பராபவ";

  // Astronomical Tithi & Nakshatra at local sunrise (06:00 AM IST = 00:30 UTC)
  const sunriseUtc = new Date(Date.UTC(year, month, day, 0, 30, 0));
  const jd = getJulianDay(sunriseUtc);
  const ayanamsa = getLahiriAyanamsa(jd);
  const sunLong = getSunLongitude(jd);
  const moonLong = getMoonLongitude(jd);

  const siderealMoon = (((moonLong - ayanamsa) % 360) + 360) % 360;
  const nakshatraIndex = Math.floor(siderealMoon / (360 / 27));
  const diffLong = (((moonLong - sunLong) % 360) + 360) % 360;
  const tithiIndex = Math.floor(diffLong / 12);

  const isShukla = tithiIndex < 15;
  const pakshaTa = isShukla ? "வளர்பிறை" : "தேய்பிறை";
  const tithiNameTa = TITHI_BASE_NAMES_TA[tithiIndex];
  const nakshatraNameTa = NAKSHATRA_NAMES_TA[nakshatraIndex];
  const tithiFormatted = (tithiIndex === 14 || tithiIndex === 29)
    ? tithiNameTa
    : `${tithiNameTa} (${pakshaTa})`;

  const englishMonthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const englishMonthNamesFull = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const tamilMonthNamesTrans = [
    "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
    "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
  ];

  // Guaranteed local timezone-safe string YYYY-MM-DD
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  // Special sacred days calculations
  const isAmavasai = tithiIndex === 29;
  const isPournami = tithiIndex === 14;
  const isPradosham = tithiIndex === 12 || tithiIndex === 27; // Trayodashi
  const isSashti = tithiIndex === 5 || tithiIndex === 20; // Shukla & Krishna Sashti
  const isSankataharaChaturthi = tithiIndex === 18; // Krishna Chaturthi
  const isEkadashi = tithiIndex === 10 || tithiIndex === 25; // Shukla & Krishna Ekadasi

  // Muhurtham calculation:
  // Favorable tithis: Shukla Dvitiya (1), Tritiya (2), Panchami (4), Saptami (6), Dashami (9), Ekadasi (10), Trayodasi (12)
  // or Krishna Dvitiya (16), Tritiya (17), Panchami (19)
  const isAuspiciousTithi = [1, 2, 4, 6, 9, 10, 12, 16, 17, 19].includes(tithiIndex);
  // Favorable weekdays: Monday (1), Wednesday (3), Thursday (4), Friday (5), Sunday (0)
  const isAuspiciousWeekday = [0, 1, 3, 4, 5].includes(dayOfWeek);
  // Favorable Nakshatras: Rohini (3), Mrigashira (4), Magam (9), Uthiram (11), Hastham (12), Swathi (14), Anusham (16), Moolam (18), Uthiradam (20), Thiruvonam (21), Uthirattathi (25), Revathi (26)
  const isAuspiciousNakshatra = [3, 4, 9, 11, 12, 14, 16, 18, 20, 21, 25, 26].includes(nakshatraIndex);

  const isMuhurtham = isAuspiciousTithi && isAuspiciousWeekday && isAuspiciousNakshatra && !isAmavasai;

  let specialDayTag: string | undefined;
  let specialDayIcon: string | undefined;

  if (isPournami) {
    specialDayTag = "பௌர்ணமி";
    specialDayIcon = "🌕";
  } else if (isAmavasai) {
    specialDayTag = "அமாவாசை";
    specialDayIcon = "🌑";
  } else if (isPradosham) {
    specialDayTag = "பிரதோஷம்";
    specialDayIcon = "🐂";
  } else if (isSankataharaChaturthi) {
    specialDayTag = "சங்கடஹர சதுர்த்தி";
    specialDayIcon = "🐘";
  } else if (isSashti) {
    specialDayTag = "சஷ்டி விரதம்";
    specialDayIcon = "🦚";
  } else if (isEkadashi) {
    specialDayTag = "ஏகாதசி";
    specialDayIcon = "🪷";
  } else if (isMuhurtham) {
    specialDayTag = "சுப முகூர்த்தம்";
    specialDayIcon = "💍";
  }

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
    tithiTa: tithiFormatted,
    tithiNameTa,
    pakshaTa,
    nakshatra: NAKSHATRAS[nakshatraIndex],
    nakshatraNameTa,
    rahuKalam: weekdayInfo.rahu,
    yamagandam: weekdayInfo.yama,
    kuligai: weekdayInfo.kuli,
    nallaNeram: `காலை: ${weekdayInfo.nallaMorning} | மாலை: ${weekdayInfo.nallaEvening}`,
    nallaNeramMorning: weekdayInfo.nallaMorning,
    nallaNeramEvening: weekdayInfo.nallaEvening,
    gowriNallaNeram: `காலை: ${weekdayInfo.gowriMorning} | மாலை: ${weekdayInfo.gowriEvening}`,
    gowriNallaNeramMorning: weekdayInfo.gowriMorning,
    gowriNallaNeramEvening: weekdayInfo.gowriEvening,
    formattedDualDate: `${day} ${englishMonthNames[month]} ${year} • ${currentTamilMonth.ta} ${tamilDay}`,
    formattedFullDay: `${weekdayInfo.en}, ${day} ${englishMonthNames[month]} ${year} / ${currentTamilMonth.ta} ${tamilDay}`,
    formattedTamilFull: `${weekdayInfo.ta}, ${day} ${tamilMonthNamesTrans[month]} ${year} • ${currentTamilMonth.ta} ${tamilDay} (${tamilYear} வருடம்)`,
    formattedEnglishFull: `${weekdayInfo.en}, ${day} ${englishMonthNamesFull[month]} ${year} • ${currentTamilMonth.en} ${tamilDay} (${tamilYear})`,
    isAmavasai,
    isPournami,
    isPradosham,
    isSashti,
    isSankataharaChaturthi,
    isEkadashi,
    isMuhurtham,
    specialDayTag,
    specialDayIcon,
  };
}

/**
 * Format a 24-hour time range (e.g. "16:30 - 17:30") to standard Tamil calendar 12-hour format ("04:30 - 05:30")
 */
export function formatTimeRangeTo12H(rangeStr?: string, includeAmPm: boolean = false): string {
  if (!rangeStr) return "";
  return rangeStr
    .split("-")
    .map((part) => {
      const trimmed = part.trim();
      const [hStr, mStr] = trimmed.split(":");
      if (!hStr || !mStr) return trimmed;
      let h = parseInt(hStr, 10);
      const isPm = h >= 12;
      const ampm = isPm ? "PM" : "AM";
      if (h > 12) h -= 12;
      if (h === 0) h = 12;
      const formattedTime = `${String(h).padStart(2, "0")}:${mStr}`;
      return includeAmPm ? `${formattedTime} ${ampm}` : formattedTime;
    })
    .join(" - ");
}

