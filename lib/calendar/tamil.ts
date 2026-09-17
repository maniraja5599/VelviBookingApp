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

import { OFFICIAL_TAMIL_PANCHANGAM, SacredEventType } from "./panchangamData";

export interface TamilDateInfo {
  gregorianDate: Date;
  dateStr: string; // YYYY-MM-DD
  dayOfMonth: number;
  monthIndex: number; // 0-11
  monthNameEn: string;
  monthNameTa: string;
  year: number;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
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
  isKarinaal?: boolean;
  isKarthigai?: boolean;
  isChandraDarisanam?: boolean;
  isMaadhaSivarathiri?: boolean;
  isThiruvonam?: boolean;
  festivalName?: string;
  isGovtHoliday?: boolean;
  holidayName?: string;
  amavasaiTiming?: SacredEventTiming;
  pournamiTiming?: SacredEventTiming;
  panchangamEvents?: SacredEventType[];
  specialDayTag?: string;
  specialDayIcon?: string;
}

export interface SacredEventTiming {
  type: "AMAVASAI" | "POURNAMI";
  typeTa: string; // "அமாவாசை" | "பௌர்ணமி"
  icon: string; // "🌑" | "🌕"
  startDateStr: string; // "2026-09-10"
  endDateStr: string; // "2026-09-11"
  startTime12: string; // "10:33 AM"
  endTime12: string; // "08:55 AM"
  startTimeTa: string; // "காலை 10:33"
  endTimeTa: string; // "காலை 08:55"
  startFormattedFull: string; // "10 Sep 2026, 10:33 AM"
  endFormattedFull: string; // "11 Sep 2026, 08:55 AM"
  startFormattedTa: string; // "10 செப், காலை 10:33"
  endFormattedTa: string; // "11 செப், காலை 08:55"
  displaySummary: string;
  displaySummaryTa: string;
  isStartDay: boolean;
  isEndDay: boolean;
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
 * Authentic Tamil Subha Muhurtham Dates (Tamildailycalendar & Drik Panchang)
 * Keyed by Year -> Month (1-12) -> Array of Day numbers (1-31)
 */
export const TAMIL_MUHURTHAM_LOOKUP: Record<number, Record<number, number[]>> = {
  2025: {
    1: [19, 20, 31],
    2: [2, 3, 10, 16, 17, 23, 26],
    3: [2, 3, 9, 10, 12, 16, 17],
    4: [4, 7, 9, 11, 16, 18, 23, 25, 30],
    5: [4, 9, 11, 14, 16, 18, 19, 23, 28],
    6: [5, 6, 8, 16, 27],
    7: [2, 7, 13, 14, 16],
    8: [20, 21, 27, 28, 29],
    9: [4, 14],
    10: [19, 20, 24, 27, 31],
    11: [3, 10, 16, 23, 27, 30],
    12: [1, 8, 10, 14, 15],
  },
  2026: {
    1: [28],
    2: [6, 8, 13, 15, 16, 20],
    3: [5, 6, 8, 15, 16, 25],
    4: [6, 12, 13, 16, 20, 23, 30],
    5: [8, 13, 14, 18, 28, 29],
    6: [4, 7, 17, 18, 24, 25],
    7: [2, 5, 12],
    8: [23, 30, 31],
    9: [7, 13, 17],
    10: [25, 30],
    11: [1, 11, 13, 15, 16, 20, 29],
    12: [4, 6, 10, 13, 14],
  },
  2027: {
    1: [20, 28],
    2: [8, 10, 11, 12, 18, 25, 26],
    3: [4, 10, 11, 12, 15, 17, 18, 24, 25],
    4: [1, 4, 8, 11, 12, 18, 23, 25, 26],
    5: [3, 9, 12, 16, 17, 23, 26, 27, 28],
    6: [7, 10, 13, 14, 23, 24, 25],
    7: [5, 7, 9, 14, 16],
    8: [20, 22, 23, 27, 29],
    9: [3, 5, 12, 13],
    10: [20, 22, 27],
    11: [1, 5, 8, 10, 11, 12, 15, 18, 25],
    12: [2, 5, 8, 9, 10],
  },
};

/**
 * Authentic Major Tamil Festivals (2025 - 2027)
 */
export const TAMIL_FESTIVALS_LOOKUP: Record<string, string> = {
  // 2025
  "2025-01-01": "ஆங்கிலப் புத்தாண்டு",
  "2025-01-10": "வைகுண்ட ஏகாதசி",
  "2025-01-13": "போகிப் பண்டிகை",
  "2025-01-14": "தைப் பொங்கல்",
  "2025-01-15": "மாட்டுப் பொங்கல்",
  "2025-01-16": "காணும் பொங்கல் / உழவர் திருநாள்",
  "2025-01-20": "தை அமாவாசை",
  "2025-01-26": "குடியரசு தினம்",
  "2025-02-04": "ரதசப்தமி",
  "2025-02-11": "தைப்பூசம்",
  "2025-02-26": "மஹா சிவராத்திரி",
  "2025-03-12": "மாசி மகம்",
  "2025-03-13": "ஹோலி பண்டிகை",
  "2025-03-30": "தெலுங்கு வருடப் பிறப்பு",
  "2025-04-06": "ஸ்ரீராம நவமி",
  "2025-04-11": "பங்குனி உத்திரம்",
  "2025-04-14": "தமிழ்ப் புத்தாண்டு (விஸ்வாவசு வருடப் பிறப்பு)",
  "2025-04-30": "அட்சய திருதியை",
  "2025-05-01": "மே தினம் / உழைப்பாளர் தினம்",
  "2025-05-04": "அக்னி நட்சத்திரம் ஆரம்பம்",
  "2025-05-08": "ஸ்ரீமீனாட்சி திருக்கல்யாணம்",
  "2025-05-11": "ஸ்ரீகள்ளழகர் எதிர்ஸேவை",
  "2025-05-12": "ஸ்ரீகள்ளழகர் வைகை எழுந்தருளல்",
  "2025-05-28": "அக்னி நட்சத்திரம் முடிவு",
  "2025-06-09": "வைகாசி விசாகம்",
  "2025-07-02": "ஆனி உத்திர தரிசனம்",
  "2025-07-28": "ஆடிப்பூரம்",
  "2025-08-03": "ஆடிப்பெருக்கு விழா",
  "2025-08-08": "வரலட்சுமி விரதம்",
  "2025-08-09": "ஆவணி அவிட்டம்",
  "2025-08-12": "மகா சங்கடஹர சதுர்த்தி",
  "2025-08-15": "சுதந்திர தினம்",
  "2025-08-16": "கோகுலாஷ்டமி",
  "2025-08-27": "விநாயகர் சதுர்த்தி",
  "2025-09-05": "ஓணம் பண்டிகை",
  "2025-09-21": "மகாளய அமாவாசை",
  "2025-09-22": "நவராத்திரி ஆரம்பம்",
  "2025-10-01": "சரஸ்வதி பூஜை / ஆயுத பூஜை",
  "2025-10-02": "காந்தி ஜெயந்தி / விஜயதசமி",
  "2025-10-20": "தீபாவளி பண்டிகை",
  "2025-10-22": "கந்தசஷ்டி துவக்கம்",
  "2025-10-27": "கந்தசஷ்டி சூரசம்ஹாரம்",
  "2025-12-03": "திருக்கார்த்திகை",
  "2025-12-19": "அனுமன் ஜெயந்தி",
  "2025-12-30": "வைகுண்ட ஏகாதசி",

  // 2026
  "2026-01-01": "ஆங்கிலப் புத்தாண்டு",
  "2026-01-03": "ஆருத்ரா தரிசனம்",
  "2026-01-11": "கெர்போட்ட நிவர்த்தி",
  "2026-01-14": "போகிப் பண்டிகை",
  "2026-01-15": "தைப் பொங்கல்",
  "2026-01-16": "மாட்டுப் பொங்கல்",
  "2026-01-17": "காணும் பொங்கல் / உழவர் திருநாள்",
  "2026-01-18": "தை அமாவாசை",
  "2026-01-25": "ரத சப்தமி",
  "2026-01-26": "குடியரசு தினம்",
  "2026-02-01": "தைப்பூசம்",
  "2026-02-15": "மஹாசிவராத்திரி",
  "2026-03-02": "மாசி மகம்",
  "2026-03-03": "ஹோலி பண்டிகை",
  "2026-03-14": "காரடையான் நோன்பு",
  "2026-03-19": "தெலுங்கு வருடப் பிறப்பு",
  "2026-03-27": "ராமநவமி",
  "2026-04-01": "பங்குனி உத்திரம்",
  "2026-04-14": "தமிழ்ப் புத்தாண்டு (பராபவ வருடப் பிறப்பு)",
  "2026-04-20": "அட்சய திருதியை",
  "2026-04-21": "சங்கர ஜெயந்தி",
  "2026-04-28": "மீனாட்சி திருக்கல்யாணம்",
  "2026-04-30": "கள்ளழகர் எதிர்ஸேவை",
  "2026-05-01": "ஸ்ரீகள்ளழகர் வைகை எழுந்தருளல்",
  "2026-05-04": "அக்னி நட்சத்திரம் துவக்கம்",
  "2026-05-28": "அக்னி நட்சத்திரம் முடிவு",
  "2026-05-30": "வைகாசி விசாகம்",
  "2026-06-22": "ஆனி உத்திர தரிசனம்",
  "2026-07-29": "சங்கரன்கோவில் தபசு",
  "2026-08-03": "ஆடிப்பெருக்கு விழா",
  "2026-08-14": "திருஆடிப்பூரம்",
  "2026-08-17": "கருட பஞ்சமி",
  "2026-08-21": "ஸ்ரீவரலட்சுமி விரதம்",
  "2026-08-26": "ஓணம் பண்டிகை",
  "2026-08-27": "ஆவணி அவிட்டம்",
  "2026-08-28": "ஸ்ரீகாயத்ரி ஜெபம்",
  "2026-08-31": "ஸ்ரீமஹா சங்கடஹர சதுர்த்தி",
  "2026-09-04": "கோகுலாஷ்டமி / கிருஷ்ண ஜெயந்தி",
  "2026-09-14": "ஸ்ரீவிநாயகர் சதுர்த்தி",
  "2026-09-27": "மஹாளய பட்சாரம்பம்",
  "2026-10-10": "மஹாளய அமாவாசை",
  "2026-10-11": "நவராத்திரி துவக்கம்",
  "2026-10-19": "சரஸ்வதி பூஜை / ஆயுத பூஜை",
  "2026-10-20": "விஜயதசமி",
  "2026-11-08": "தீபாவளி பண்டிகை",
  "2026-11-10": "கந்த சஷ்டி துவக்கம்",
  "2026-11-15": "சூரசம்ஹாரம்",
  "2026-11-24": "திருக்கார்த்திகை தீபம்",
  "2026-12-20": "வைகுண்ட ஏகாதசி",
  "2026-12-24": "ஆருத்ரா தரிசனம்",
  "2026-12-29": "கெர்போட்ட ஆரம்பம்",

  // 2027
  "2027-01-14": "போகி பண்டிகை",
  "2027-01-15": "தைப் பொங்கல்",
  "2027-01-16": "மாட்டுப் பொங்கல்",
  "2027-01-17": "காணும் பொங்கல் / உழவர் திருநாள்",
  "2027-01-23": "தைப்பூசம்",
  "2027-02-06": "தை அமாவாசை",
  "2027-02-11": "வசந்த பஞ்சமி",
  "2027-02-13": "ரத சப்தமி",
  "2027-02-21": "மாசி மகம்",
  "2027-03-06": "மஹா சிவராத்திரி",
  "2027-03-15": "காரடையான் நோன்பு",
  "2027-03-22": "பங்குனி உத்திரம்",
  "2027-04-14": "தமிழ்ப் புத்தாண்டு",
  "2027-04-15": "ஸ்ரீராம நவமி",
  "2027-04-20": "சித்ரா பௌர்ணமி",
  "2027-05-09": "அட்சய திருதியை",
  "2027-05-10": "ஆதி சங்கரர் ஜெயந்தி / ராமானுஜர் ஜெயந்தி",
  "2027-05-18": "நரசிம்ம ஜெயந்தி",
  "2027-05-20": "வைகாசி விசாகம்",
  "2027-07-28": "ஆடி கிருத்திகை",
  "2027-08-02": "ஆடி அமாவாசை",
  "2027-08-03": "ஆடிப்பெருக்கு விழா",
  "2027-08-05": "ஆடிப் பூரம்",
  "2027-08-13": "ஸ்ரீவரலட்சுமி விரதம்",
  "2027-08-16": "ஆவணி அவிட்டம்",
  "2027-08-20": "ஸ்ரீமஹா சங்கடஹர சதுர்த்தி",
  "2027-08-23": "பலராம ஜெயந்தி",
  "2027-08-25": "கோகுலாஷ்டமி",
  "2027-09-04": "ஸ்ரீவிநாயகர் சதுர்த்தி",
  "2027-09-29": "மஹாளய அமாவாசை",
  "2027-10-08": "சரஸ்வதி பூஜை / ஆயுத பூஜை",
  "2027-10-09": "விஜயதசமி",
  "2027-10-28": "தீபாவளி பண்டிகை",
  "2027-11-04": "சூரசம்ஹாரம்",
  "2027-11-11": "துளசி கல்யாணம்",
  "2027-12-12": "திருக்கார்த்திகை தீபம்",
  "2027-12-20": "கால பைரவர் அஷ்டமி",
  "2027-12-27": "அனுமன் ஜெயந்தி",
};

/**
 * Official Tamil Nadu Government / Public Holidays (அரசு பொது விடுமுறை நாட்கள்)
 */
export const TN_GOVT_HOLIDAYS: Record<string, string> = {
  // 2025
  "2025-01-01": "ஆங்கிலப் புத்தாண்டு",
  "2025-01-14": "போகிப் பண்டிகை",
  "2025-01-15": "தைப் பொங்கல்",
  "2025-01-16": "மாட்டுப் பொங்கல்",
  "2025-01-17": "உழவர் திருநாள்",
  "2025-01-26": "குடியரசு தினம்",
  "2025-03-30": "தெலுங்கு வருடப் பிறப்பு",
  "2025-03-31": "ரம்ஜான்",
  "2025-04-11": "மகாவீர் ஜெயந்தி",
  "2025-04-14": "தமிழ்ப் புத்தாண்டு / அம்பேத்கர் ஜெயந்தி",
  "2025-04-18": "புனித வெள்ளி",
  "2025-05-01": "மே தினம்",
  "2025-06-07": "பக்ரீத்",
  "2025-07-06": "மொஹரம்",
  "2025-08-15": "சுதந்திர தினம்",
  "2025-08-27": "விநாயகர் சதுர்த்தி",
  "2025-09-05": "மிலாடி நபி",
  "2025-10-01": "ஆயுத பூஜை",
  "2025-10-02": "விஜயதசமி / காந்தி ஜெயந்தி",
  "2025-10-20": "தீபாவளி பண்டிகை",
  "2025-12-25": "கிறிஸ்துமஸ்",

  // 2026
  "2026-01-01": "ஆங்கிலப் புத்தாண்டு",
  "2026-01-14": "போகிப் பண்டிகை",
  "2026-01-15": "தைப் பொங்கல்",
  "2026-01-16": "மாட்டுப் பொங்கல்",
  "2026-01-17": "காணும் பொங்கல் / உழவர் திருநாள்",
  "2026-01-26": "குடியரசு தினம்",
  "2026-03-19": "தெலுங்கு வருடப் பிறப்பு",
  "2026-03-21": "ரம்ஜான்",
  "2026-03-31": "மகாவீர் ஜெயந்தி",
  "2026-04-03": "புனித வெள்ளி",
  "2026-04-14": "தமிழ்ப் புத்தாண்டு / அம்பேத்கர் ஜெயந்தி",
  "2026-05-01": "மே தினம்",
  "2026-05-27": "பக்ரீத்",
  "2026-06-26": "மொஹரம்",
  "2026-08-15": "சுதந்திர தினம்",
  "2026-08-26": "மிலாடி நபி",
  "2026-09-14": "ஸ்ரீவிநாயகர் சதுர்த்தி",
  "2026-10-02": "காந்தி ஜெயந்தி",
  "2026-10-19": "சரஸ்வதி பூஜை / ஆயுத பூஜை",
  "2026-10-20": "விஜயதசமி",
  "2026-11-08": "தீபாவளி பண்டிகை",
  "2026-12-25": "கிறிஸ்துமஸ்",

  // 2027
  "2027-01-01": "ஆங்கிலப் புத்தாண்டு",
  "2027-01-14": "போகிப் பண்டிகை",
  "2027-01-15": "தைப் பொங்கல்",
  "2027-01-16": "மாட்டுப் பொங்கல்",
  "2027-01-17": "உழவர் திருநாள்",
  "2027-01-26": "குடியரசு தினம்",
  "2027-03-10": "ரம்ஜான்",
  "2027-03-26": "புனித வெள்ளி",
  "2027-04-14": "தமிழ்ப் புத்தாண்டு / அம்பேத்கர் ஜெயந்தி",
  "2027-05-01": "மே தினம்",
  "2027-05-17": "பக்ரீத்",
  "2027-06-16": "மொஹரம்",
  "2027-08-15": "சுதந்திர தினம்",
  "2027-09-04": "விநாயகர் சதுர்த்தி",
  "2027-10-02": "காந்தி ஜெயந்தி",
  "2027-10-08": "ஆயுத பூஜை",
  "2027-10-09": "விஜயதசமி",
  "2027-10-28": "தீபாவளி பண்டிகை",
  "2027-12-25": "கிறிஸ்துமஸ்",
};

/**
 * Assign appropriate emoji icon for Tamil festivals
 */
export function getFestivalIcon(name?: string): string {
  if (!name) return "✨";
  if (name.includes("குடியரசு") || name.includes("சுதந்திர")) return "🇮🇳";
  if (name.includes("மாட்டுப் பொங்கல்")) return "🏺";
  if (name.includes("பொங்கல்") || name.includes("போகி") || name.includes("உழவர்")) return "🌾";
  if (name.includes("புத்தாண்டு") || name.includes("பிறப்பு")) return "☀️";
  if (name.includes("விநாயகர்") || name.includes("சதுர்த்தி")) return "🐘";
  if (name.includes("சிவராத்திரி") || name.includes("தரிசனம்") || name.includes("பிரதோஷம்")) return "🔱";
  if (name.includes("சஷ்டி") || name.includes("சூரசம்ஹாரம்") || name.includes("பூசம்") || name.includes("விசாகம்") || name.includes("முருகன்")) return "🦚";
  if (name.includes("தீபாவளி") || name.includes("தீபம்") || name.includes("கார்த்திகை")) return "🪔";
  if (name.includes("கிருஷ்ண") || name.includes("ஜெயந்தி") || name.includes("கோகுலாஷ்டமி")) return "🪈";
  if (name.includes("சரஸ்வதி") || name.includes("பூஜை") || name.includes("தசமி") || name.includes("நவராத்திரி")) return "🌸";
  if (name.includes("ஏகாதசி") || name.includes("வைகுண்ட")) return "🪷";
  if (name.includes("அம்மன்") || name.includes("விரதம்") || name.includes("வரலட்சுமி") || name.includes("பூரம்")) return "🪷";
  if (name.includes("அவிட்டம்")) return "🧵";
  return "✨";
}

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
 * Difference in longitude between Moon and Sun (0 to 360 degrees)
 */
function getMoonSunDiff(date: Date): number {
  const jd = getJulianDay(date);
  const s = getSunLongitude(jd);
  const m = getMoonLongitude(jd);
  return (((m - s) % 360) + 360) % 360;
}

/**
 * Binary search to find exact crossing of Moon-Sun angle to within 1-second precision
 */
function findAngleCrossing(targetDeg: number, startMs: number, endMs: number): Date {
  let low = startMs;
  let high = endMs;
  for (let iter = 0; iter < 32; iter++) {
    const mid = (low + high) / 2;
    const diff = getMoonSunDiff(new Date(mid));
    let err = diff - targetDeg;
    if (err > 180) err -= 360;
    if (err < -180) err += 360;
    if (err < 0) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return new Date((low + high) / 2);
}

/**
 * Standardize any Date to Indian Standard Time (IST) date and time parts
 */
function toIstParts(date: Date) {
  const istOffsetMs = 5.5 * 3600 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);
  const year = istDate.getUTCFullYear();
  const month = istDate.getUTCMonth();
  const day = istDate.getUTCDate();
  const hour = istDate.getUTCHours();
  const minute = istDate.getUTCMinutes();
  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const isPm = hour >= 12;
  const ampm = isPm ? "PM" : "AM";
  let h12 = hour % 12;
  if (h12 === 0) h12 = 12;
  const time12 = `${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
  const periodTa = hour < 12 ? (hour < 5 ? "அதிகாலை" : "காலை") : (hour < 17 ? "பிற்பகல்" : (hour < 20 ? "மாலை" : "இரவு"));
  const timeTa = `${periodTa} ${String(h12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  return { year, month, day, hour, minute, dateStr, time12, timeTa };
}

interface RawSacredEvent {
  type: "AMAVASAI" | "POURNAMI";
  startIst: ReturnType<typeof toIstParts>;
  endIst: ReturnType<typeof toIstParts>;
}

const sacredEventsYearCache = new Map<number, RawSacredEvent[]>();

export function getYearSacredTimings(year: number): RawSacredEvent[] {
  if (sacredEventsYearCache.has(year)) {
    return sacredEventsYearCache.get(year)!;
  }
  const events: RawSacredEvent[] = [];
  const startMs = new Date(Date.UTC(year - 1, 11, 20)).getTime();
  const endMs = new Date(Date.UTC(year + 1, 0, 10)).getTime();
  const stepMs = 6 * 3600 * 1000;
  let prevDiff = getMoonSunDiff(new Date(startMs));

  for (let t = startMs + stepMs; t <= endMs; t += stepMs) {
    const curDiff = getMoonSunDiff(new Date(t));

    // Pournami (crosses 168 -> 180)
    if ((prevDiff < 168 && curDiff >= 168) || (prevDiff > 300 && curDiff < 180 && curDiff >= 168)) {
      const pStart = findAngleCrossing(168, t - stepMs, t);
      const pEnd = findAngleCrossing(180, pStart.getTime(), pStart.getTime() + 30 * 3600 * 1000);
      events.push({
        type: "POURNAMI",
        startIst: toIstParts(pStart),
        endIst: toIstParts(pEnd),
      });
    }

    // Amavasai (crosses 348 -> 0)
    if (prevDiff < 348 && curDiff >= 348) {
      const aStart = findAngleCrossing(348, t - stepMs, t);
      const aEnd = findAngleCrossing(0, aStart.getTime(), aStart.getTime() + 30 * 3600 * 1000);
      events.push({
        type: "AMAVASAI",
        startIst: toIstParts(aStart),
        endIst: toIstParts(aEnd),
      });
    }

    prevDiff = curDiff;
  }

  sacredEventsYearCache.set(year, events);
  return events;
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

  // Astronomical Tithi & Nakshatra at local midday (12:00 PM IST = 06:30 UTC)
  // In Tamil daily calendar tradition, the midday/daytime Tithi governs religious observance and daily designation
  const midDayUtc = new Date(Date.UTC(year, month, day, 6, 30, 0));
  const jd = getJulianDay(midDayUtc);
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

  // Official Tamil Panchangam sacred days from verified Tamil Daily Calendar tables
  const officialEvents = OFFICIAL_TAMIL_PANCHANGAM[dateStr] || [];
  const hasOfficialAmavasai = officialEvents.includes("Amavasai");
  const hasOfficialPournami = officialEvents.includes("Pournami");
  const hasOfficialPradosham = officialEvents.includes("Pradosham");
  const hasOfficialEkadhasi = officialEvents.includes("Ekadhasi");
  const hasOfficialSashti = officialEvents.includes("Sashti");
  const hasOfficialSankatahara = officialEvents.includes("Sankatahara Chathurthi");
  const isKarinaal = officialEvents.includes("Karinaal");
  const isKarthigai = officialEvents.includes("Karthigai");
  const isChandraDarisanam = officialEvents.includes("Chandra Darisanam");
  const isMaadhaSivarathiri = officialEvents.includes("Maadha Sivarathiri");
  const isThiruvonam = officialEvents.includes("Thiruvonam");

  // Find Amavasai & Pournami transitions that START on this date (per user request: only show on start date)
  const sacredEvents = getYearSacredTimings(year);
  const matchedAmav = sacredEvents.find(
    (e) => e.type === "AMAVASAI" && e.startIst.dateStr === dateStr
  );
  const matchedPour = sacredEvents.find(
    (e) => e.type === "POURNAMI" && e.startIst.dateStr === dateStr
  );

  let amavasaiTiming: SacredEventTiming | undefined;
  if (matchedAmav) {
    const isStart = true;
    const isEnd = matchedAmav.startIst.dateStr === matchedAmav.endIst.dateStr;
    const sMonthEn = englishMonthNames[matchedAmav.startIst.month];
    const eMonthEn = englishMonthNames[matchedAmav.endIst.month];
    const sMonthTa = tamilMonthNamesTrans[matchedAmav.startIst.month];
    const eMonthTa = tamilMonthNamesTrans[matchedAmav.endIst.month];

    const sFull = `${matchedAmav.startIst.day} ${sMonthEn} ${matchedAmav.startIst.year}, ${matchedAmav.startIst.time12}`;
    const eFull = `${matchedAmav.endIst.day} ${eMonthEn} ${matchedAmav.endIst.year}, ${matchedAmav.endIst.time12}`;
    const sTa = `${matchedAmav.startIst.day} ${sMonthTa}, ${matchedAmav.startIst.timeTa}`;
    const eTa = `${matchedAmav.endIst.day} ${eMonthTa}, ${matchedAmav.endIst.timeTa}`;

    amavasaiTiming = {
      type: "AMAVASAI",
      typeTa: "அமாவாசை",
      icon: "🌑",
      startDateStr: matchedAmav.startIst.dateStr,
      endDateStr: matchedAmav.endIst.dateStr,
      startTime12: matchedAmav.startIst.time12,
      endTime12: matchedAmav.endIst.time12,
      startTimeTa: matchedAmav.startIst.timeTa,
      endTimeTa: matchedAmav.endIst.timeTa,
      startFormattedFull: sFull,
      endFormattedFull: eFull,
      startFormattedTa: sTa,
      endFormattedTa: eTa,
      displaySummary: `ஆரம்பம்: ${matchedAmav.startIst.day} ${sMonthEn}, ${matchedAmav.startIst.time12} • முடிவு: ${matchedAmav.endIst.day} ${eMonthEn}, ${matchedAmav.endIst.time12}`,
      displaySummaryTa: `ஆரம்பம்: ${sTa} • முடிவு: ${eTa}`,
      isStartDay: true,
      isEndDay: isEnd,
    };
  }

  let pournamiTiming: SacredEventTiming | undefined;
  if (matchedPour) {
    const isStart = true;
    const isEnd = matchedPour.startIst.dateStr === matchedPour.endIst.dateStr;
    const sMonthEn = englishMonthNames[matchedPour.startIst.month];
    const eMonthEn = englishMonthNames[matchedPour.endIst.month];
    const sMonthTa = tamilMonthNamesTrans[matchedPour.startIst.month];
    const eMonthTa = tamilMonthNamesTrans[matchedPour.endIst.month];

    const sFull = `${matchedPour.startIst.day} ${sMonthEn} ${matchedPour.startIst.year}, ${matchedPour.startIst.time12}`;
    const eFull = `${matchedPour.endIst.day} ${eMonthEn} ${matchedPour.endIst.year}, ${matchedPour.endIst.time12}`;
    const sTa = `${matchedPour.startIst.day} ${sMonthTa}, ${matchedPour.startIst.timeTa}`;
    const eTa = `${matchedPour.endIst.day} ${eMonthTa}, ${matchedPour.endIst.timeTa}`;

    pournamiTiming = {
      type: "POURNAMI",
      typeTa: "பௌர்ணமி",
      icon: "🌕",
      startDateStr: matchedPour.startIst.dateStr,
      endDateStr: matchedPour.endIst.dateStr,
      startTime12: matchedPour.startIst.time12,
      endTime12: matchedPour.endIst.time12,
      startTimeTa: matchedPour.startIst.timeTa,
      endTimeTa: matchedPour.endIst.timeTa,
      startFormattedFull: sFull,
      endFormattedFull: eFull,
      startFormattedTa: sTa,
      endFormattedTa: eTa,
      displaySummary: `ஆரம்பம்: ${matchedPour.startIst.day} ${sMonthEn}, ${matchedPour.startIst.time12} • முடிவு: ${matchedPour.endIst.day} ${eMonthEn}, ${matchedPour.endIst.time12}`,
      displaySummaryTa: `ஆரம்பம்: ${sTa} • முடிவு: ${eTa}`,
      isStartDay: true,
      isEndDay: isEnd,
    };
  }

  // Special sacred days calculations
  const is2025to2027 = year >= 2025 && year <= 2027;
  const isAmavasai = sacredEvents.length > 0 ? Boolean(matchedAmav) : (hasOfficialAmavasai || tithiIndex === 29);
  const isPournami = sacredEvents.length > 0 ? Boolean(matchedPour) : (hasOfficialPournami || tithiIndex === 14);
  const isPradosham = false; // Pradosham fully removed per user request
  const isSashti = is2025to2027 ? hasOfficialSashti : (tithiIndex === 5 || tithiIndex === 20); // Shukla & Krishna Sashti
  const isSankataharaChaturthi = is2025to2027 ? hasOfficialSankatahara : (tithiIndex === 18); // Krishna Chaturthi
  const isEkadashi = is2025to2027 ? hasOfficialEkadhasi : (tithiIndex === 10 || tithiIndex === 25); // Shukla & Krishna Ekadasi

  // Check Muhurtham:
  // 1. Authoritative lookup for 2025-2027 matching Tamil Daily Calendar / Panchangam
  const monthLookup = TAMIL_MUHURTHAM_LOOKUP[year]?.[month + 1];
  let isMuhurtham = false;
  if (monthLookup) {
    isMuhurtham = monthLookup.includes(day);
  } else {
    // 2. Astronomical heuristic fallback for other years (strictly exclude Purattasi monthIndex 5 and Margazhi monthIndex 8)
    const isAuspiciousTithi = [1, 2, 4, 6, 9, 10, 12, 16, 17, 19].includes(tithiIndex);
    const isAuspiciousWeekday = [0, 1, 3, 4, 5].includes(dayOfWeek);
    const isAuspiciousNakshatra = [3, 4, 9, 11, 12, 14, 16, 18, 20, 21, 25, 26].includes(nakshatraIndex);
    const isAllowedMonth = tamilMonthIndex !== 5 && tamilMonthIndex !== 8;
    isMuhurtham = isAllowedMonth && isAuspiciousTithi && isAuspiciousWeekday && isAuspiciousNakshatra && !isAmavasai;
  }

  const holidayName = TN_GOVT_HOLIDAYS[dateStr];
  const isGovtHoliday = Boolean(holidayName);
  const festivalName = TAMIL_FESTIVALS_LOOKUP[dateStr] || holidayName;

  let specialDayTag: string | undefined;
  let specialDayIcon: string | undefined;

  if (festivalName) {
    specialDayTag = festivalName;
    specialDayIcon = getFestivalIcon(festivalName);
    if (isMuhurtham) {
      specialDayTag = `சுப முகூர்த்தம் • ${festivalName}`;
      specialDayIcon = "💍";
    }
  } else if (isMuhurtham) {
    specialDayTag = "சுப முகூர்த்தம்";
    specialDayIcon = "💍";
  } else if (isAmavasai) {
    specialDayTag = "அமாவாசை";
    specialDayIcon = "🌑";
  } else if (isPournami) {
    specialDayTag = "பௌர்ணமி";
    specialDayIcon = "🌕";
  } else if (isSankataharaChaturthi) {
    specialDayTag = "சங்கடஹர சதுர்த்தி";
    specialDayIcon = "🐘";
  } else if (isSashti) {
    specialDayTag = "சஷ்டி விரதம்";
    specialDayIcon = "🦚";
  } else if (isEkadashi) {
    specialDayTag = "ஏகாதசி";
    specialDayIcon = "🪷";
  } else if (isKarthigai) {
    specialDayTag = "கார்த்திகை விரதம்";
    specialDayIcon = "🪔";
  } else if (isMaadhaSivarathiri) {
    specialDayTag = "மாத சிவராத்திரி";
    specialDayIcon = "🔱";
  } else if (isChandraDarisanam) {
    specialDayTag = "சந்திர தரிசனம்";
    specialDayIcon = "🌙";
  } else if (isThiruvonam) {
    specialDayTag = "திருவோண விரதம்";
    specialDayIcon = "✨";
  } else if (isKarinaal) {
    specialDayTag = "கரிநாள்";
    specialDayIcon = "☀️";
  }

  return {
    gregorianDate: date,
    dateStr,
    dayOfMonth: day,
    monthIndex: month,
    monthNameEn: englishMonthNames[month],
    monthNameTa: currentTamilMonth.ta,
    year,
    dayOfWeek,
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
    isKarinaal,
    isKarthigai,
    isChandraDarisanam,
    isMaadhaSivarathiri,
    isThiruvonam,
    festivalName,
    isGovtHoliday,
    holidayName,
    amavasaiTiming,
    pournamiTiming,
    panchangamEvents: officialEvents,
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

