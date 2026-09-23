"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { getTamilDate, formatTimeRangeTo12H, getLocalDateString } from "@/lib/calendar/tamil";
import { db } from "@/lib/db/store";
import { Booking } from "@/lib/types";
import { PoojaSlipModal } from "@/components/bookings/PoojaSlipModal";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Flame,
  Clock,
  MapPin,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarCheck,
  Sun,
  AlertCircle,
  CheckCircle2,
  User,
  Filter,
  ArrowRight,
  Sparkles,
  Info,
  X,
  Share2,
  Phone,
  MessageCircle,
  Search,
  FileText,
  Printer,
} from "lucide-react";

function formatTime12H(t?: string): string {
  if (!t) return "";
  if (t.includes("AM") || t.includes("PM")) return t;
  const [hStr, mStr] = t.split(":");
  let h = parseInt(hStr, 10);
  if (isNaN(h)) return t;
  const period = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr || "00"} ${period}`;
}

export default function CalendarPage() {
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const { t } = useLanguage();

  const todayStr = getLocalDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [activeTab, setActiveTab] = useState<"calendar" | "important_days">("calendar");
  const [showPanchangam, setShowPanchangam] = useState<boolean>(true);
  const [showPanchangamGuide, setShowPanchangamGuide] = useState<boolean>(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState<boolean>(false);
  const [showMonthYearPicker, setShowMonthYearPicker] = useState<boolean>(false);
  const [pickerYear, setPickerYear] = useState<number>(new Date().getFullYear());
  const [filterIyer, setFilterIyer] = useState<"ALL" | "SELF">("ALL");
  const [activeSacredTab, setActiveSacredTab] = useState<string>("muhurtham");
  const [selectedSlipBooking, setSelectedSlipBooking] = useState<Booking | null>(null);

  // Long press timer refs for calendar date buttons
  const longPressTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isLongPressTriggeredRef = React.useRef<boolean>(false);

  // Track double click / double tap to directly open booking page for that date
  const lastClickRef = React.useRef<{ dateStr: string; time: number } | null>(null);

  const handleDateCellClick = (dateStr: string) => {
    if (isLongPressTriggeredRef.current) return;

    const now = Date.now();
    if (
      lastClickRef.current &&
      lastClickRef.current.dateStr === dateStr &&
      now - lastClickRef.current.time < 450
    ) {
      // Double click / double tap detected! Directly open booking page for this date
      lastClickRef.current = null;
      router.push(`/app/bookings/new?date=${dateStr}`);
      return;
    }

    lastClickRef.current = { dateStr, time: now };
    setSelectedDate(dateStr);
  };

  const handleDatePressStart = (dateStr: string) => {
    isLongPressTriggeredRef.current = false;
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    longPressTimeoutRef.current = setTimeout(() => {
      isLongPressTriggeredRef.current = true;
      setSelectedDate(dateStr);
      setShowDayDetailsModal(true);
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        try { navigator.vibrate(45); } catch (_) {}
      }
    }, 420);
  };

  const handleDatePressEnd = () => {
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  // Month navigation
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth()); // 0-11

  const businessId = currentBusiness?.id || "biz-venkateswara-01";
  const [dbVersion, setDbVersion] = React.useState(0);

  React.useEffect(() => {
    const handler = () => setDbVersion((v) => v + 1);
    window.addEventListener("velvi:db-change", handler);
    return () => window.removeEventListener("velvi:db-change", handler);
  }, []);

  const allBookings = React.useMemo(() => db.getBookings(businessId), [businessId, dbVersion]);
  const members = React.useMemo(() => db.getMembers(businessId), [businessId, dbVersion]);
  const ownerMember = React.useMemo(() => members.find((m) => m.role === "OWNER") || members[0], [members]);

  // Filter bookings based on Iyer selection
  const filteredBookings = React.useMemo(() => {
    return allBookings.filter((b) => {
      if (filterIyer === "SELF") {
        return (
          b.assignedIyerId === ownerMember?.id ||
          b.assignedIyerName === currentUser?.name ||
          b.assignedIyerName === "Ravi Iyer"
        );
      }
      return true;
    });
  }, [allBookings, filterIyer, ownerMember?.id, currentUser?.name]);

  // Date info for selected date
  const selectedTamilInfo = React.useMemo(() => getTamilDate(selectedDate), [selectedDate]);
  const selectedDayBookings = React.useMemo(() => filteredBookings.filter((b) => b.date === selectedDate), [filteredBookings, selectedDate]);

  // Calendar month grid generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0-6

  // Calculate monthly statistics and pre-compute day details for fast filtering
  const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;
  
  const currentMonthBookings = React.useMemo(() => {
    return filteredBookings.filter((b) => b.date.startsWith(currentMonthKey));
  }, [filteredBookings, currentMonthKey]);

  const currentMonthRevenue = React.useMemo(() => {
    return currentMonthBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  }, [currentMonthBookings]);

  const monthDayDetails = React.useMemo(() => {
    const map: Record<string, ReturnType<typeof getTamilDate>> = {};
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      map[dateStr] = getTamilDate(dateStr);
    }
    return map;
  }, [currentYear, currentMonth, daysInMonth]);

  // Full Month Sacred & Auspicious Days Summary
  const monthSacredSummary = React.useMemo(() => {
    const allDays = Object.values(monthDayDetails);

    const muhurthamDays = allDays.filter((d) => d.isMuhurtham);
    const pournamiDays = allDays.filter((d) => d.isPournami);
    const amavasaiDays = allDays.filter((d) => d.isAmavasai);
    const pradoshamDays = allDays.filter((d) => d.isPradosham);
    const ekadashiDays = allDays.filter((d) => d.isEkadashi);
    const chaturthiDays = allDays.filter((d) => d.isSankataharaChaturthi);
    const sashtiDays = allDays.filter((d) => d.isSashti);
    const karthigaiDays = allDays.filter((d) => d.isKarthigai);
    const sivarathiriDays = allDays.filter((d) => d.isMaadhaSivarathiri);
    const thiruvonamDays = allDays.filter((d) => d.isThiruvonam);
    const karinaalDays = allDays.filter((d) => d.isKarinaal);
    const festivalDays = allDays.filter((d) => d.festivalName);

    return {
      muhurthamDays,
      pournamiDays,
      amavasaiDays,
      pradoshamDays,
      ekadashiDays,
      chaturthiDays,
      sashtiDays,
      karthigaiDays,
      sivarathiriDays,
      thiruvonamDays,
      karinaalDays,
      festivalDays,
    };
  }, [monthDayDetails]);

  // List of all important festival and sacred days for the current month
  const monthImportantEventsList = React.useMemo(() => {
    const events: Array<{
      day: number;
      dateStr: string;
      name: string;
      icon?: string;
      category: "FESTIVAL" | "MUHURTHAM" | "MOON" | "VRATAM";
      tithi?: string;
      nakshatra?: string;
      tamilDate?: string;
      isGovtHoliday?: boolean;
    }> = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const d = monthDayDetails[dateStr] || getTamilDate(dateStr);
      const tamilDate = `${d.tamilMonth} ${d.tamilDay} (${d.dayOfWeekTa})`;
      const tithi = d.tithiNameTa || d.tithiTa;
      const nakshatra = d.nakshatraNameTa;
      const isGovtHoliday = d.isGovtHoliday;

      if (d.festivalName) {
        events.push({
          day,
          dateStr,
          name: d.festivalName,
          icon: d.specialDayIcon || (isGovtHoliday ? "🏖️" : "⭐"),
          category: "FESTIVAL",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isMuhurtham) {
        events.push({
          day,
          dateStr,
          name: "சுப முகூர்த்தம்",
          icon: "💍",
          category: "MUHURTHAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isPournami && (!d.festivalName || !d.festivalName.includes("பௌர்ணமி"))) {
        events.push({
          day,
          dateStr,
          name: "பௌர்ணமி",
          icon: "🌕",
          category: "MOON",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isAmavasai && (!d.festivalName || !d.festivalName.includes("அமாவாசை"))) {
        events.push({
          day,
          dateStr,
          name: "அமாவாசை",
          icon: "🌑",
          category: "MOON",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isPradosham && (!d.festivalName || !d.festivalName.includes("பிரதோஷம்"))) {
        events.push({
          day,
          dateStr,
          name: "பிரதோஷம்",
          icon: "🔱",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isEkadashi && (!d.festivalName || !d.festivalName.includes("ஏகாதசி"))) {
        events.push({
          day,
          dateStr,
          name: "ஏகாதசி விரதம்",
          icon: "🪷",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isSankataharaChaturthi && (!d.festivalName || !d.festivalName.includes("சதுர்த்தி"))) {
        events.push({
          day,
          dateStr,
          name: "சங்கடஹர சதுர்த்தி",
          icon: "🐘",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isSashti && (!d.festivalName || !d.festivalName.includes("சஷ்டி"))) {
        events.push({
          day,
          dateStr,
          name: "சஷ்டி விரதம்",
          icon: "🦚",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isKarthigai && (!d.festivalName || !d.festivalName.includes("கார்த்திகை"))) {
        events.push({
          day,
          dateStr,
          name: "கார்த்திகை விரதம்",
          icon: "🪔",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isMaadhaSivarathiri && (!d.festivalName || !d.festivalName.includes("சிவராத்திரி"))) {
        events.push({
          day,
          dateStr,
          name: "மாத சிவராத்திரி",
          icon: "🔱",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
      if (d.isThiruvonam && (!d.festivalName || !d.festivalName.includes("திருவோண"))) {
        events.push({
          day,
          dateStr,
          name: "திருவோண விரதம்",
          icon: "🌸",
          category: "VRATAM",
          tithi,
          nakshatra,
          tamilDate,
          isGovtHoliday,
        });
      }
    }

    return events;
  }, [currentYear, currentMonth, daysInMonth, monthDayDetails]);

  // Pre-calculate count of important days & festivals for each of the 12 months of currentYear
  const yearMonthEventsCounts = React.useMemo(() => {
    const counts: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      const days = new Date(currentYear, m + 1, 0).getDate();
      let c = 0;
      for (let day = 1; day <= days; day++) {
        const dateStr = `${currentYear}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const d = getTamilDate(dateStr);
        if (
          d.festivalName ||
          d.isMuhurtham ||
          d.isPournami ||
          d.isAmavasai ||
          d.isPradosham ||
          d.isEkadashi ||
          d.isSashti ||
          d.isSankataharaChaturthi ||
          d.isKarthigai ||
          d.isMaadhaSivarathiri ||
          d.isThiruvonam
        ) {
          c++;
        }
      }
      counts[m] = c;
    }
    return counts;
  }, [currentYear]);

  // List of Moon Phases & Fasting Days with compact, smart date numbers
  const moonAndFastingList = React.useMemo(() => {
    const allDays = Object.values(monthDayDetails);

    const formatDays = (days: typeof allDays) => {
      return days.map((d) => ({
        dayNum: d.dayOfMonth,
        dateStr: d.dateStr,
      }));
    };

    const list = [
      {
        title: "பௌர்ணமி",
        icon: "🌕",
        dates: formatDays(allDays.filter((d) => d.isPournami)),
      },
      {
        title: "அமாவாசை",
        icon: "🌑",
        dates: formatDays(allDays.filter((d) => d.isAmavasai)),
      },
      {
        title: "சங்கடஹர சதுர்த்தி",
        icon: "🐘",
        dates: formatDays(allDays.filter((d) => d.isSankataharaChaturthi)),
      },
      {
        title: "கிருத்திகை",
        icon: "🪔",
        dates: formatDays(allDays.filter((d) => d.isKarthigai)),
      },
      {
        title: "ஏகாதசி",
        icon: "🪷",
        dates: formatDays(allDays.filter((d) => d.isEkadashi)),
      },
      {
        title: "சஷ்டி",
        icon: "🦚",
        dates: formatDays(allDays.filter((d) => d.isSashti)),
      },
      {
        title: "சந்திர தரிசனம்",
        icon: "🌙",
        dates: formatDays(allDays.filter((d) => d.isChandraDarisanam)),
      },
      {
        title: "மாத சிவராத்திரி",
        icon: "🔱",
        dates: formatDays(allDays.filter((d) => d.isMaadhaSivarathiri)),
      },
      {
        title: "திருவோணம்",
        icon: "🌸",
        dates: formatDays(allDays.filter((d) => d.isThiruvonam)),
      },
    ];

    return list.filter((item) => item.dates.length > 0);
  }, [monthDayDetails]);



  const handleShareWhatsApp = () => {
    const dateTitle = `${selectedTamilInfo.formattedFullDay} (${selectedTamilInfo.tamilYear} வருடம்)`;
    let text = `🪔 *வேள்வி - பஞ்சாங்கம் & பூஜைகள்* 🪔\n`;
    text += `📅 *${dateTitle}*\n`;
    text += `✨ *திதி:* ${selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}\n`;
    text += `⭐ *நட்சத்திரம்:* ${selectedTamilInfo.nakshatraNameTa}\n`;
    text += `\n🟢 *நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}\n`;
    text += `\n🟡 *கௌரி நல்ல நேரம்:*\n`;
    text += `• காலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning, true)}\n`;
    text += `• மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening, true)}\n`;
    text += `\n🔴 *ராகு காலம்:* ${formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}\n`;
    text += `🟠 *எமகண்டம்:* ${formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}\n`;

    if (selectedDayBookings.length > 0) {
      text += `\n📋 *இன்றைய பூஜைகள் (${selectedDayBookings.length}):*\n`;
      selectedDayBookings.forEach((b, idx) => {
        text += `${idx + 1}. ${b.poojaEnglishName} (${formatTime12H(b.startTime)}) - ${b.customerName}\n`;
      });
    } else {
      text += `\n📋 *பூஜைகள்:* முன்பதிவு ஏதுமில்லை (Open for Bookings)\n`;
    }

    text += `\n_Shared via Velvi Priest App_`;

    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
  };

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const jumpToToday = () => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateString());
  };

  const stepDay = (delta: number) => {
    const parts = selectedDate.split("-").map((p) => parseInt(p, 10));
    const d = new Date(parts[0], parts[1] - 1, parts[2] + delta, 12, 0, 0);
    const newStr = getLocalDateString(d);
    setSelectedDate(newStr);
    setCurrentYear(d.getFullYear());
    setCurrentMonth(d.getMonth());
  };

  // Auto-centering for scrollable month selector
  const monthPillsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (monthPillsRef.current) {
      const activePill = monthPillsRef.current.querySelector<HTMLElement>(`[data-month="${currentMonth}"]`);
      if (activePill) {
        const container = monthPillsRef.current;
        const scrollLeft = activePill.offsetLeft - container.offsetWidth / 2 + activePill.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
      }
    }
  }, [currentMonth, currentYear]);

  // Touch swipe navigation for calendar month switching (Left: next month, Right: prev month)
  const touchStartXRef = React.useRef<number | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);

  const handleCalendarTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleCalendarTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && touchStartYRef.current !== null) {
      const dx = Math.abs(e.touches[0].clientX - touchStartXRef.current);
      const dy = Math.abs(e.touches[0].clientY - touchStartYRef.current);
      if (dx > 10 || dy > 10) {
        handleDatePressEnd(); // cancel hold timer if swiping
      }
    }
  };

  const handleCalendarTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY) * 1.2) {
      if (diffX < 0) {
        nextMonth(); // swipe left -> next month
      } else {
        prevMonth(); // swipe right -> prev month
      }
    }
  };

  const monthNamesEn = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthNamesUpper = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER",
  ];
  const monthNamesTransTa = [
    "ஜனவரி", "பிப்ரவரி", "மார்ச்", "ஏப்ரல்", "மே", "ஜூன்",
    "ஜூலை", "ஆகஸ்ட்", "செப்டம்பர்", "அக்டோபர்", "நவம்பர்", "டிசம்பர்"
  ];

  const TAMIL_MONTH_EN_MAP: Record<string, string> = {
    "சித்திரை": "CHITHIRAI",
    "வைகாசி": "VAIKASI",
    "ஆனி": "AANI",
    "ஆடி": "AADI",
    "ஆவணி": "AAVANI",
    "புரட்டாசி": "PURATTASI",
    "ஐப்பசி": "AIPPASI",
    "கார்த்திகை": "KARTHIGAI",
    "மார்கழி": "MARGAZHI",
    "தை": "THAI",
    "மாசி": "MAASI",
    "பங்குனி": "PANGUNI",
  };

  const MONTH_PICKER_DATA = [
    { num: 1, en: "Jan", fullEn: "January", ta: "ஜனவரி", tamilSolar: "தை" },
    { num: 2, en: "Feb", fullEn: "February", ta: "பிப்ரவரி", tamilSolar: "மாசி" },
    { num: 3, en: "Mar", fullEn: "March", ta: "மார்ச்", tamilSolar: "பங்குனி" },
    { num: 4, en: "Apr", fullEn: "April", ta: "ஏப்ரல்", tamilSolar: "சித்திரை" },
    { num: 5, en: "May", fullEn: "May", ta: "மே", tamilSolar: "வைகாசி" },
    { num: 6, en: "Jun", fullEn: "June", ta: "ஜூன்", tamilSolar: "ஆனி" },
    { num: 7, en: "Jul", fullEn: "July", ta: "ஜூலை", tamilSolar: "ஆடி" },
    { num: 8, en: "Aug", fullEn: "August", ta: "ஆகஸ்ட்", tamilSolar: "ஆவணி" },
    { num: 9, en: "Sep", fullEn: "September", ta: "செப்டம்பர்", tamilSolar: "புரட்டாசி" },
    { num: 10, en: "Oct", fullEn: "October", ta: "அக்டோபர்", tamilSolar: "ஐப்பசி" },
    { num: 11, en: "Nov", fullEn: "November", ta: "நவம்பர்", tamilSolar: "கார்த்திகை" },
    { num: 12, en: "Dec", fullEn: "December", ta: "டிசம்பர்", tamilSolar: "மார்கழி" },
  ];

  const handleSelectMonth = (monthIndex: number) => {
    setCurrentYear(pickerYear);
    setCurrentMonth(monthIndex);
    const maxDays = new Date(pickerYear, monthIndex + 1, 0).getDate();
    const currentDay = parseInt(selectedDate.split("-")[2] || "1", 10);
    const targetDay = Math.min(currentDay, maxDays);
    setSelectedDate(`${pickerYear}-${String(monthIndex + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`);
    setShowMonthYearPicker(false);
  };

  const handlePickerJumpToday = () => {
    const today = new Date();
    setPickerYear(today.getFullYear());
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(getLocalDateString());
    setShowMonthYearPicker(false);
  };

  const WEEKDAY_SULAM_PARIHARAM = [
    { sulam: "மேற்கு", pariharam: "வெல்லம்" },
    { sulam: "கிழக்கு", pariharam: "பால்" },
    { sulam: "வடக்கு", pariharam: "சுண்ணாம்பு" },
    { sulam: "வடக்கு", pariharam: "பால்" },
    { sulam: "தெற்கு", pariharam: "தயிர்" },
    { sulam: "மேற்கு", pariharam: "வெல்லம்" },
    { sulam: "கிழக்கு", pariharam: "எள்" },
  ];

  const monthStartTamil =
    monthDayDetails[`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`] ||
    getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`);
  const monthEndTamil =
    monthDayDetails[`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`] ||
    getTamilDate(`${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`);
  const dualTamilMonthTa =
    monthStartTamil.tamilMonth === monthEndTamil.tamilMonth
      ? monthStartTamil.tamilMonth
      : `${monthStartTamil.tamilMonth} – ${monthEndTamil.tamilMonth}`;
  const dualTamilMonthEn =
    monthStartTamil.tamilMonth === monthEndTamil.tamilMonth
      ? TAMIL_MONTH_EN_MAP[monthStartTamil.tamilMonth] || monthStartTamil.tamilMonth
      : `${TAMIL_MONTH_EN_MAP[monthStartTamil.tamilMonth] || monthStartTamil.tamilMonth} – ${TAMIL_MONTH_EN_MAP[monthEndTamil.tamilMonth] || monthEndTamil.tamilMonth}`;

  // Leading days from previous month to fill the first week row
  const prevMonthObj =
    currentMonth === 0 ? { year: currentYear - 1, month: 11 } : { year: currentYear, month: currentMonth - 1 };
  const prevMonthTotalDays = new Date(prevMonthObj.year, prevMonthObj.month + 1, 0).getDate();
  const prevMonthLeadingDays = Array.from({ length: firstDayIndex }).map((_, i) => {
    const dayNum = prevMonthTotalDays - firstDayIndex + 1 + i;
    const dateStr = `${prevMonthObj.year}-${String(prevMonthObj.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return {
      dateStr,
      dayNum,
      info: getTamilDate(dateStr),
    };
  });

  // Trailing days from next month to complete the grid (standard 35 or 42 cells)
  const totalGridCells = Math.ceil((firstDayIndex + daysInMonth) / 7) * 7;
  const nextMonthTrailingCount = totalGridCells - (firstDayIndex + daysInMonth);
  const nextMonthObj =
    currentMonth === 11 ? { year: currentYear + 1, month: 0 } : { year: currentYear, month: currentMonth + 1 };
  const nextMonthTrailingDays = Array.from({ length: nextMonthTrailingCount }).map((_, i) => {
    const dayNum = i + 1;
    const dateStr = `${nextMonthObj.year}-${String(nextMonthObj.month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    return {
      dateStr,
      dayNum,
      info: getTamilDate(dateStr),
    };
  });

  // Selected day parsed elements for the vertical date box (matching mockup)
  const selParts = selectedDate.split("-").map(Number);
  const selDayNum = selParts[2];
  const selMonthEn = monthNamesUpper[selParts[1] - 1]?.slice(0, 3) || "SEP";
  const selYear = selParts[0];
  const selDayDateObj = new Date(selYear, selParts[1] - 1, selDayNum);
  const selDayOfWeekEn = selDayDateObj.toLocaleDateString("en-US", { weekday: "long" }).toUpperCase();

  return (
    <div className="space-y-3.5 pb-8 animate-in fade-in duration-200">
      {/* 1. Master Top Month/Year Navigation Bar */}
      <div className="bg-gradient-to-r from-[#0b2b17] via-[#123e24] to-[#0b2b17] text-white p-3 sm:p-4 rounded-3xl shadow-md space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Prev Month, Clickable Month/Year Picker, Next Month */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0 cursor-pointer"
              title="முந்தைய மாதம் (Previous Month)"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            <button
              type="button"
              onClick={() => {
                setPickerYear(currentYear);
                setShowMonthYearPicker(true);
              }}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 rounded-xl hover:bg-white/15 transition active:scale-95 group text-left cursor-pointer border border-transparent hover:border-white/20"
              title="மாதம் / வருடம் மாற்ற (Select Month & Year)"
            >
              <span className="text-lg sm:text-2xl md:text-3xl font-black tracking-wide text-white uppercase">
                {monthNamesUpper[currentMonth]}
              </span>
              <span className="text-lg sm:text-2xl md:text-3xl font-black text-amber-400 ml-1">
                {currentYear}
              </span>
              <ChevronDown className="w-4 h-4 text-amber-300/80 group-hover:text-amber-300 transition-transform group-hover:translate-y-0.5 shrink-0 ml-0.5" />
            </button>

            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition active:scale-95 shrink-0 cursor-pointer"
              title="அடுத்த மாதம் (Next Month)"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* Right: Today Button */}
          <button
            onClick={jumpToToday}
            className="text-xs font-bold px-3 py-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 rounded-full border border-amber-400/40 transition active:scale-95 cursor-pointer shrink-0"
          >
            Today
          </button>
        </div>

        {/* Sub-strip: Tamil solar month and Year */}
        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10 px-1">
          <span className="font-semibold text-amber-200/95 flex items-center gap-1.5">
            <span>🌾 தமிழ் மாதம்:</span>
            <strong className="text-white font-black">{dualTamilMonthTa}</strong>
          </span>
          <span className="text-[11px] font-bold text-emerald-200/90 tracking-wider">
            {selectedTamilInfo.tamilYear} வருடம்
          </span>
        </div>
      </div>

      {/* 2. Smart Horizontal Scrollable Months Strip with Important Sacred Days Counts (Current Month Centered) */}
      <div className="bg-slate-100/90 p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex items-center justify-between gap-1.5 mb-1 px-1">
          <span className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1">
            <span>📅</span>
            <span>மாதங்கள் &amp; முக்கிய நாட்கள்</span>
          </span>

          {/* Compact View Switcher: Calendar vs Important Days */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-slate-200/80 text-[10.5px] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab("calendar")}
              className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                activeTab === "calendar"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="காலண்டர் பார்வை"
            >
              <CalendarIcon className="w-3 h-3" />
              <span>காலண்டர்</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("important_days")}
              className={`px-2 py-0.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 ${
                activeTab === "important_days"
                  ? "bg-emerald-900 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="முக்கிய நாட்கள் பட்டியல்"
            >
              <Sparkles className={`w-3 h-3 ${activeTab === "important_days" ? "text-emerald-200" : "text-emerald-700"}`} />
              <span>முக்கிய நாட்கள்</span>
              {monthImportantEventsList.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                    activeTab === "important_days"
                      ? "bg-white text-emerald-950"
                      : "bg-emerald-100 text-emerald-900 border border-emerald-300/70"
                  }`}
                >
                  {monthImportantEventsList.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Month Pills Container */}
        <div
          ref={monthPillsRef}
          className="flex items-center gap-1.5 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth snap-x select-none"
        >
          {MONTH_PICKER_DATA.map((mItem, mIdx) => {
            const isSelectedMonth = currentMonth === mIdx;
            const mKey = `${currentYear}-${String(mItem.num).padStart(2, "0")}`;
            const bookingsCount = filteredBookings.filter((b) => b.date.startsWith(mKey)).length;

            return (
              <button
                key={mItem.num}
                data-month={mIdx}
                type="button"
                onClick={() => {
                  setCurrentMonth(mIdx);
                  const maxDays = new Date(currentYear, mIdx + 1, 0).getDate();
                  const targetDay = Math.min(parseInt(selectedDate.split("-")[2] || "1", 10), maxDays);
                  setSelectedDate(`${currentYear}-${String(mItem.num).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 snap-center cursor-pointer ${
                  isSelectedMonth
                    ? "bg-gradient-to-r from-emerald-900 to-emerald-950 text-white shadow-sm ring-1 ring-emerald-600 scale-[1.02]"
                    : "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/90 shadow-2xs"
                }`}
              >
                <span className="font-black">{mItem.en}</span>
                <span className={`text-[10px] ${isSelectedMonth ? "text-emerald-200 font-semibold" : "text-slate-400"}`}>
                  {mItem.tamilSolar}
                </span>
                <span
                  className={`text-[9.5px] font-black px-1.5 py-0.2 rounded-full leading-none ${
                    isSelectedMonth
                      ? "bg-white text-emerald-950 shadow-2xs"
                      : bookingsCount > 0
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-300/80"
                      : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {bookingsCount}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MODE 1: TAMIL CALENDAR VIEW */}
      {/* ========================================================= */}
      {activeTab === "calendar" && (
        <div className="space-y-2.5 animate-in fade-in duration-200">
          {/* Cute & Charming Press & Hold Tip Banner */}
          <div className="flex items-center justify-between gap-2 px-3 py-1.5 bg-gradient-to-r from-amber-50/95 via-emerald-50/90 to-amber-50/95 rounded-2xl border border-amber-200/80 text-[10.5px] sm:text-[11px] shadow-2xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs shrink-0 animate-bounce">👆</span>
              <p className="font-bold text-slate-800 leading-tight">
                <span className="text-amber-800 font-extrabold">டிப்ஸ்: </span>
                இருமுறை கிளிக்: <span className="text-emerald-950 font-black">புதிய பதிவு</span> • அழுத்திப் பிடித்தால்: <span className="text-amber-950 font-black">நாள் விவரங்கள்</span>!
              </p>
            </div>
            <span className="shrink-0 text-[9px] sm:text-[9.5px] font-black text-emerald-900 bg-emerald-100/90 px-1.5 py-0.5 rounded-md border border-emerald-300/80 shadow-2xs">
              2x Click / Hold
            </span>
          </div>

          {/* Authentic Tamil Calendar Sheet Card with Left/Right Touch Swipe Navigation */}
          <div
            onTouchStart={handleCalendarTouchStart}
            onTouchMove={handleCalendarTouchMove}
            onTouchEnd={handleCalendarTouchEnd}
            className="rounded-3xl overflow-hidden border border-emerald-950/20 shadow-md bg-white touch-pan-y"
          >
            {/* Weekday Header Bar (Sunday in Crimson Red, Mon-Sat in Forest Green) */}
            <div className="grid grid-cols-7 text-center select-none">
              {/* Sunday (Red) */}
              <div className="bg-[#b91c1c] text-white py-1 sm:py-1.5 px-0.5 border-r border-red-800/40">
                <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider">SUN</div>
                <div className="text-[8px] sm:text-[10px] font-bold text-red-100">ஞாயிறு</div>
              </div>

              {/* Mon to Sat (Forest Green) */}
              {[
                { en: "MON", ta: "திங்கள்" },
                { en: "TUE", ta: "செவ்வாய்" },
                { en: "WED", ta: "புதன்" },
                { en: "THU", ta: "வியாழன்" },
                { en: "FRI", ta: "வெள்ளி" },
                { en: "SAT", ta: "சனி" },
              ].map((item) => (
                <div
                  key={item.en}
                  className="bg-[#123e24] text-white py-1 sm:py-1.5 px-0.5 border-r border-emerald-800/40 last:border-r-0"
                >
                  <div className="text-[10px] sm:text-xs md:text-sm font-black tracking-wider">{item.en}</div>
                  <div className="text-[8px] sm:text-[10px] font-semibold text-emerald-200">{item.ta}</div>
                </div>
              ))}
            </div>

            {/* Calendar Days Grid - Authentic Tamil Calendar with Sacred Indicators & Bookings */}
            <div className="grid grid-cols-7 border-t border-l border-gray-200 bg-white">
              {/* 1. Leading Prev-Month Days */}
              {prevMonthLeadingDays.map((prevDay) => (
                <button
                  key={prevDay.dateStr}
                  onClick={() => {
                    setSelectedDate(prevDay.dateStr);
                    prevMonth();
                  }}
                  className="min-h-[64px] sm:min-h-[76px] md:min-h-[86px] p-1 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-gray-300">
                      {prevDay.dayNum}
                    </span>
                    <span className="text-[7.5px] sm:text-[9px] font-medium text-gray-300 leading-tight">
                      {prevDay.info.tamilDay}
                    </span>
                  </div>
                  <div className="h-3" />
                </button>
              ))}

              {/* 2. Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                const dayTamil = monthDayDetails[dateStr] || getTamilDate(dateStr);
                const dayBookings = filteredBookings.filter((b) => b.date === dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = todayStr === dateStr;
                const dayOfWeekIndex = new Date(currentYear, currentMonth, dayNum).getDay();
                const isSunday = dayOfWeekIndex === 0;
                const hasBookings = dayBookings.length > 0;

                // Prioritized sacred icons for booking decisions (Max 2 icons per cell to keep neat & uncluttered)
                const sacredIcons: Array<{ icon: string; title: string }> = [];
                if (dayTamil.isMuhurtham) sacredIcons.push({ icon: "💍", title: "சுப முகூர்த்தம்" });
                if (dayTamil.isPournami) sacredIcons.push({ icon: "🌕", title: "பௌர்ணமி" });
                if (dayTamil.isAmavasai) sacredIcons.push({ icon: "🌑", title: "அமாவாசை" });
                if (dayTamil.isKarinaal) sacredIcons.push({ icon: "⚠️", title: "கரிநாள்" });
                if (dayTamil.isPradosham) sacredIcons.push({ icon: "🪔", title: "பிரதோஷம்" });
                if (dayTamil.isSankataharaChaturthi) sacredIcons.push({ icon: "🐘", title: "சங்கடஹர சதுர்த்தி" });
                if (dayTamil.isSashti) sacredIcons.push({ icon: "🚩", title: "சஷ்டி" });
                if (dayTamil.isEkadashi) sacredIcons.push({ icon: "🌿", title: "ஏகாதசி" });
                if (dayTamil.isKarthigai) sacredIcons.push({ icon: "🔥", title: "கார்த்திகை" });
                if (dayTamil.festivalName && !dayTamil.isMuhurtham && !dayTamil.isPournami && !dayTamil.isAmavasai) {
                  sacredIcons.push({ icon: "⭐", title: dayTamil.festivalName });
                }

                // Keep only top 2 most important icons per cell
                const cellIcons = sacredIcons.slice(0, 2);

                return (
                  <button
                    key={dateStr}
                    data-calendar-date={dateStr}
                    onPointerDown={() => handleDatePressStart(dateStr)}
                    onPointerUp={handleDatePressEnd}
                    onPointerLeave={handleDatePressEnd}
                    onTouchStart={() => handleDatePressStart(dateStr)}
                    onTouchEnd={handleDatePressEnd}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedDate(dateStr);
                      setShowDayDetailsModal(true);
                    }}
                    onClick={() => handleDateCellClick(dateStr)}
                    onDoubleClick={() => router.push(`/app/bookings/new?date=${dateStr}`)}
                    style={{ touchAction: "manipulation" }}
                    title="இருமுறை கிளிக்: புதிய பதிவு | அழுத்திப் பிடிக்க: நாள் விவரங்கள்"
                    className={`min-h-[66px] sm:min-h-[78px] md:min-h-[90px] p-1 sm:p-1.5 border-r border-b border-gray-200 flex flex-col items-center justify-between text-center transition relative group select-none ${
                      isSelected
                        ? "bg-amber-100/90 ring-2 ring-amber-600 ring-inset z-10 font-bold shadow-2xs"
                        : hasBookings
                        ? "bg-emerald-50/80 hover:bg-emerald-100/80"
                        : isToday
                        ? "bg-slate-100/80 hover:bg-slate-100"
                        : "bg-white hover:bg-gray-50/80"
                    }`}
                  >
                    {/* Top Row: English Day Number (Bigger & Crisp) & Tamil Solar Day Number */}
                    <div className="flex items-center justify-between leading-tight w-full px-0.5">
                      <span
                        className={`text-sm sm:text-lg md:text-xl font-black ${
                          isSunday ? "text-[#b91c1c]" : "text-slate-900"
                        }`}
                      >
                        {dayNum}
                      </span>
                      <span className="text-[8.5px] sm:text-[10px] md:text-xs font-extrabold text-slate-500">
                        {dayTamil.tamilDay}
                      </span>
                    </div>

                    {/* Middle: Authentic Sacred Day Icons ONLY (Top 1-2 important icons, clean & uncluttered) */}
                    {cellIcons.length > 0 ? (
                      <div className="w-full my-0.5 flex items-center justify-center gap-1">
                        {cellIcons.map((si, sIdx) => (
                          <span
                            key={sIdx}
                            title={si.title}
                            className="text-[12px] sm:text-[13.5px] md:text-[15px] leading-none hover:scale-125 transition-transform"
                          >
                            {si.icon}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="h-3" />
                    )}

                    {/* Bottom: Highlighted Booking Badge with Homa Fire Icon & Bold Number */}
                    {hasBookings ? (
                      <div className="w-full mt-0.5 flex justify-center">
                        <span className="text-[9px] sm:text-[10.5px] md:text-[11.5px] px-1.5 sm:px-2 py-0.5 rounded-full font-black inline-flex items-center justify-center gap-1 leading-none bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-amber-300 ring-1 ring-amber-400/60 shadow-xs">
                          <span className="text-[9.5px] sm:text-[11px]">🔥</span>
                          <span className="font-extrabold tracking-tight">{dayBookings.length}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="h-2" />
                    )}
                  </button>
                );
              })}

              {/* 3. Trailing Next-Month Days */}
              {nextMonthTrailingDays.map((nextDay) => (
                <button
                  key={nextDay.dateStr}
                  onClick={() => {
                    setSelectedDate(nextDay.dateStr);
                    nextMonth();
                  }}
                  className="min-h-[64px] sm:min-h-[76px] md:min-h-[86px] p-1 sm:p-1.5 border-r border-b border-gray-200 bg-gray-50/40 flex flex-col items-center justify-between text-center transition hover:bg-gray-100/60"
                >
                  <div className="flex items-center justify-between w-full px-0.5">
                    <span className="text-xs sm:text-sm md:text-base font-bold text-gray-300">
                      {nextDay.dayNum}
                    </span>
                    <span className="text-[7.5px] sm:text-[9px] font-medium text-gray-300 leading-tight">
                      {nextDay.info.tamilDay}
                    </span>
                  </div>
                  <div className="h-3" />
                </button>
              ))}
            </div>
          </div>

          {/* 1. Selected Day Container: Compact & Sleek */}
          <div className="rounded-2xl border border-slate-200/90 shadow-2xs bg-white p-2.5 sm:p-3 space-y-2.5">
            {/* Top Row: Compact Date Box + Tamil Info + Muhurtham Badge */}
            <div className="flex items-center justify-between gap-2 sm:gap-2.5">
              {/* Left Date Box - Compact */}
              <div className="bg-[#eef8f2] border border-emerald-300/80 rounded-xl px-2 py-1 text-center min-w-[54px] sm:min-w-[60px] flex flex-col items-center justify-center shrink-0 shadow-2xs">
                <span className="text-xl sm:text-2xl font-black text-emerald-950 leading-none">
                  {selDayNum}
                </span>
                <span className="text-[8.5px] font-black text-emerald-900 uppercase tracking-tight mt-0.5 leading-tight">
                  {selMonthEn} {selYear}
                </span>
                <span className="text-[7px] font-bold text-emerald-700 uppercase tracking-wider leading-none mt-0.5">
                  {selDayOfWeekEn}
                </span>
              </div>

              {/* Center & Right: Tamil Solar Month, Day, Weekday & Sacred Badges */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-black text-xs sm:text-sm text-slate-900 leading-tight">
                      {selectedTamilInfo.tamilMonth} {selectedTamilInfo.tamilDay}
                    </h3>
                    <span className="font-bold text-slate-500 text-[11px]">
                      ({selectedTamilInfo.dayOfWeekTa})
                    </span>
                  </div>

                  {selectedTamilInfo.isMuhurtham && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-extrabold shadow-2xs">
                      <span>💍</span> சுப முகூர்த்தம்
                    </span>
                  )}
                  {selectedTamilInfo.isPournami && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-extrabold shadow-2xs">
                      <span>🌕</span> பௌர்ணமி
                    </span>
                  )}
                  {selectedTamilInfo.isAmavasai && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-white text-[10px] font-extrabold shadow-2xs">
                      <span>🌑</span> அமாவாசை
                    </span>
                  )}
                  {selectedTamilInfo.isKarinaal && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-300 text-[10px] font-bold shadow-2xs">
                      <span>⚠️</span> கரிநாள்
                    </span>
                  )}
                  {selectedTamilInfo.festivalName && !selectedTamilInfo.isMuhurtham && !selectedTamilInfo.isPournami && !selectedTamilInfo.isAmavasai && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-200 text-[10px] font-bold shadow-2xs">
                      <span>⭐</span> {selectedTamilInfo.festivalName}
                    </span>
                  )}
                </div>

                {/* Sub-line: திதி | நட்சத்திரம் */}
                <div className="text-[10px] text-slate-600 font-medium mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>
                    திதி: <strong className="text-slate-900 font-bold">{selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}</strong>
                  </span>
                  <span className="text-slate-300 font-bold">•</span>
                  <span>
                    நட்சத்திரம்: <strong className="text-slate-900 font-bold">{selectedTamilInfo.nakshatraNameTa}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="px-3 py-1.5 bg-[#134e3a] hover:bg-[#0e3b2c] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>பகிர்</span>
              </button>

              <Link
                href={`/app/bookings/new?date=${selectedDate}`}
                className="px-3 py-1.5 bg-[#fdf6ec] hover:bg-[#faebd7] border border-amber-300/80 text-amber-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-2xs"
              >
                <CalendarDays className="w-3.5 h-3.5 text-amber-800" />
                <span>+ புதிய பதிவு</span>
              </Link>
            </div>

            {/* 2. Day Bookings Card (Dotted Empty State & Diya or Bookings) */}
            <div className="rounded-2xl border border-amber-300/70 bg-[#fffdfa] p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-amber-950 flex items-center gap-1.5">
                  <span>🔥</span>
                  <span>{selectedDate === todayStr ? "இன்றைய பதிவு" : "தேர்ந்தெடுத்த நாள் பதிவு"}</span>
                </h4>
                <span className="w-5 h-5 rounded-full bg-amber-200/80 text-amber-950 text-xs font-black flex items-center justify-center">
                  {selectedDayBookings.length}
                </span>
              </div>

              {selectedDayBookings.length === 0 ? (
                <div className="border border-dashed border-amber-300 rounded-xl p-2.5 sm:p-3 bg-[#fefcf3] flex items-center justify-center gap-2.5 text-center">
                  <span className="text-xl">🪔</span>
                  <div className="text-xs text-slate-700 font-semibold leading-relaxed">
                    <div>இத்தேதியில் முன்பதிவுகள் ஏதுமில்லை</div>
                    <div className="text-slate-500 text-[10.5px] font-normal">(புதிய பதிவு செய்யலாம்)</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {selectedDayBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl p-2.5 border border-amber-200/70 shadow-2xs hover:border-amber-400 transition group"
                    >
                      <Link
                        href={`/app/bookings/${b.id}`}
                        className="block"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-[10px] text-amber-900 bg-amber-100/90 px-1.5 py-0.2 rounded border border-amber-300/60">
                                #{b.bookingNumber?.replace(/^#+/, "")}
                              </span>
                              <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate group-hover:text-emerald-950">
                                👤 {b.customerName}
                              </h5>
                            </div>
                            <div className="text-[11px] text-slate-600 mt-0.5 truncate">
                              <strong className="text-amber-950 font-bold">🪔 {b.poojaEnglishName}</strong>
                              {b.poojaTamilName && <span className="text-slate-500"> ({b.poojaTamilName})</span>}
                            </div>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                              <span>🕒 {formatTime12H(b.startTime)}–{formatTime12H(b.endTime)}</span>
                              <span>•</span>
                              <span>📍 {b.location || "Namakkal"}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0 flex flex-col items-end">
                            <span className="text-xs font-black text-slate-900">
                              ₹{b.totalAmount?.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                                b.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                  : "bg-rose-100 text-rose-900 border border-rose-200"
                              }`}
                            >
                              {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Quick Action Footer: Pooja Slip & Samagri Checklist */}
                      <div className="mt-2 pt-2 border-t border-amber-100/80 flex items-center justify-between gap-2">
                        <Link
                          href={`/app/bookings/${b.id}`}
                          className="text-[10.5px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                        >
                          <span>விவரம்</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                        </Link>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedSlipBooking(b);
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-amber-800" />
                          <span>Pooja Slip (ரசீது & QR)</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Auspicious Timings Card - Compact 2 Lines for Mobile */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-2.5 sm:p-3 space-y-2 shadow-2xs">
              {/* Header: Title & Full details link */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Clock className="w-3 h-3 text-emerald-800" />
                  </div>
                  <h4 className="font-extrabold text-xs text-slate-900">
                    நல்ல நேரங்கள் &amp; காலங்கள்
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDayDetailsModal(true)}
                  className="px-2.5 py-0.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold flex items-center gap-0.5 active:scale-95 transition cursor-pointer"
                >
                  <span>முழு விவரம்</span>
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>

              {/* LINE 1: நல்ல நேரம் (காலை & மாலை) */}
              <div className="bg-emerald-50/80 border border-emerald-200/70 rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-1 text-[11px] flex-wrap">
                <span className="font-bold text-emerald-950 flex items-center gap-1 shrink-0">
                  <span>☀️</span> நல்ல நேரம்:
                </span>
                <div className="flex items-center gap-2 font-black text-emerald-900 text-right shrink-0">
                  <span>காலை: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}</span>
                  <span className="text-emerald-300">•</span>
                  <span>மாலை: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}</span>
                </div>
              </div>

              {/* LINE 2: ராகு காலம், எமகண்டம், குளிகை */}
              <div className="grid grid-cols-3 gap-1.5 text-[10px] text-center">
                <div className="bg-rose-50/80 border border-rose-200/60 rounded-xl py-1 px-1">
                  <span className="font-bold text-rose-800 block text-[9.5px]">ராகு காலம்</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5 leading-none">
                    {formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}
                  </span>
                </div>
                <div className="bg-indigo-50/80 border border-indigo-200/60 rounded-xl py-1 px-1">
                  <span className="font-bold text-indigo-900 block text-[9.5px]">எமகண்டம்</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5 leading-none">
                    {formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}
                  </span>
                </div>
                <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl py-1 px-1">
                  <span className="font-bold text-amber-900 block text-[9.5px]">குளிகை</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5 leading-none">
                    {formatTimeRangeTo12H(selectedTamilInfo.kuligai, true)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Monthly Important Days & Moon Phases / Fasting Days (2-Column Responsive Layout) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Left Card: முக்கிய நாட்கள் */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      முக்கிய நாட்கள்
                    </h4>
                  </div>
                  <span className="text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    {monthImportantEventsList.length} விசேஷங்கள்
                  </span>
                </div>

                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto pr-1 space-y-0.5 mt-1.5 scrollbar-thin">
                  {monthImportantEventsList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-slate-400 font-medium">
                      இம்மாதத்தில் சிறப்பு நாட்கள் ஏதுமில்லை
                    </div>
                  ) : (
                    monthImportantEventsList.map((item, idx) => (
                      <button
                        key={`${item.dateStr}-${idx}`}
                        type="button"
                        onClick={() => setSelectedDate(item.dateStr)}
                        className={`w-full flex items-center gap-2 py-1.5 px-1.5 rounded-lg text-left transition group ${
                          selectedDate === item.dateStr
                            ? "bg-amber-50/90 text-slate-950 font-bold"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <span className="font-black text-red-600 text-xs w-6 shrink-0 tracking-tight">
                          {String(item.day).padStart(2, "0")}
                        </span>
                        <span className="text-slate-300 font-bold">-</span>
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5 truncate">
                          <span className="truncate">{item.name}</span>
                          {item.icon && <span className="shrink-0">{item.icon}</span>}
                        </span>
                        {item.isGovtHoliday && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200 shrink-0 ml-auto">
                            🏖️ விடுமுறை
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Card: சந்திர நிலைகள் & விரத தினங்கள் */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🌙</span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      சந்திர நிலைகள்
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-purple-800">
                    விரத தினங்கள்
                  </span>
                </div>

                <div className="divide-y divide-gray-50 space-y-0.5 mt-1.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                  {moonAndFastingList.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between py-1.5 px-1.5 text-xs rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <span className="text-sm leading-none">{item.icon}</span>
                        <span>{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs">
                        {item.dates.map((dObj, dIdx) => (
                          <button
                            key={dObj.dateStr}
                            type="button"
                            onClick={() => setSelectedDate(dObj.dateStr)}
                            className={`hover:text-emerald-700 transition px-1 py-0.5 rounded hover:bg-emerald-50 ${
                              selectedDate === dObj.dateStr ? "text-emerald-800 underline decoration-2 font-black" : ""
                            }`}
                            title={`தேதி: ${dObj.dayNum}`}
                          >
                            {dObj.dayNum}{dIdx < item.dates.length - 1 ? "," : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* ========================================================= */}
      {/* 4. MODE 2: MONTH-WISE IMPORTANT DAYS & FESTIVALS VIEW (முக்கிய நாட்கள்) */}
      {/* ========================================================= */}
      {activeTab === "important_days" && (
        <div className="space-y-3 animate-in fade-in duration-200">
          {/* Subheader info for the selected month */}
          <div className="flex items-center justify-between px-1.5 py-0.5">
            <div className="flex items-center gap-2">
              <span className="text-base">⭐</span>
              <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                {monthNamesEn[currentMonth]} {currentYear} முக்கிய விசேஷங்கள்
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              🌾 {dualTamilMonthTa}
            </span>
          </div>

          {/* 2-Column Responsive List Grid (Exact match of img -2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Left Card: முக்கிய நாட்கள் */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-2xs">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      முக்கிய நாட்கள்
                    </h4>
                  </div>
                  <span className="text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    {monthImportantEventsList.length} விசேஷங்கள்
                  </span>
                </div>

                <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto pr-1 space-y-0.5 mt-1.5 scrollbar-thin">
                  {monthImportantEventsList.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 font-medium">
                      இம்மாதத்தில் சிறப்பு நாட்கள் ஏதுமில்லை
                    </div>
                  ) : (
                    monthImportantEventsList.map((item, idx) => (
                      <button
                        key={`${item.dateStr}-${item.name}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedDate(item.dateStr);
                          setActiveTab("calendar");
                          if (typeof window !== "undefined") {
                            window.scrollTo({ top: 360, behavior: "smooth" });
                          }
                        }}
                        className={`w-full flex items-center justify-between py-2 px-1.5 rounded-lg text-left transition group cursor-pointer ${
                          selectedDate === item.dateStr
                            ? "bg-emerald-50/90 text-slate-950 font-bold"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                        title="காலண்டரில் பார்க்க தொடுக்கவும்"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-black text-red-600 text-xs sm:text-sm w-6 shrink-0 tracking-tight">
                            {String(item.day).padStart(2, "0")}
                          </span>
                          <span className="text-slate-300 font-bold">-</span>
                          <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5 truncate">
                            <span className="truncate">{item.name}</span>
                            {item.icon && <span className="shrink-0">{item.icon}</span>}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {item.isGovtHoliday && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                              🏖️ விடுமுறை
                            </span>
                          )}
                          {item.category === "MUHURTHAM" && (
                            <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                              💍 முகூர்த்தம்
                            </span>
                          )}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Right Card: சந்திர நிலைகள் & விரத தினங்கள் */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">🌙</span>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      சந்திர நிலைகள்
                    </h4>
                  </div>
                  <span className="text-xs font-bold text-purple-800">
                    விரத தினங்கள்
                  </span>
                </div>

                <div className="divide-y divide-gray-50 space-y-0.5 mt-1.5 max-h-[520px] overflow-y-auto pr-1 scrollbar-thin">
                  {moonAndFastingList.map((item) => (
                    <div
                      key={item.title}
                      className="flex items-center justify-between py-2 px-1.5 text-xs rounded-lg hover:bg-slate-50 transition"
                    >
                      <div className="flex items-center gap-2 text-slate-800 font-semibold">
                        <span className="text-sm leading-none">{item.icon}</span>
                        <span>{item.title}</span>
                      </div>

                      <div className="flex items-center gap-1 text-slate-900 font-extrabold text-xs">
                        {item.dates.map((dObj, dIdx) => (
                          <button
                            key={dObj.dateStr}
                            type="button"
                            onClick={() => {
                              setSelectedDate(dObj.dateStr);
                              setActiveTab("calendar");
                              if (typeof window !== "undefined") {
                                window.scrollTo({ top: 360, behavior: "smooth" });
                              }
                            }}
                            className={`hover:text-emerald-700 transition px-1 py-0.5 rounded hover:bg-emerald-50 cursor-pointer ${
                              selectedDate === dObj.dateStr ? "text-emerald-800 underline decoration-2 font-black" : ""
                            }`}
                            title={`தேதி: ${dObj.dayNum} (காலண்டரில் பார்க்க)`}
                          >
                            {dObj.dayNum}{dIdx < item.dates.length - 1 ? "," : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Panchangam Guide & Rules Modal */}
      {showPanchangamGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-velvi-gold/30 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-velvi-gold/20">
              <div className="flex items-center gap-2 text-velvi-brown">
                <Info className="w-5 h-5 text-velvi-gold" />
                <h3 className="font-bold text-sm">கால அளவு &amp; சாஸ்திர விவரம்</h3>
              </div>
              <button
                onClick={() => setShowPanchangamGuide(false)}
                className="p-1 rounded-full hover:bg-velvi-cream text-velvi-brown/60 hover:text-velvi-brown transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-velvi-brown leading-relaxed">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <strong className="text-emerald-900 block mb-0.5 font-bold">✨ நல்ல நேரம்:</strong>
                <span>ஒரு நாளைக்கு 2 முறை (காலை &amp; மாலை) தலா 1 மணி நேரம் (60 நிமிடங்கள்).</span>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <strong className="text-amber-900 block mb-0.5 font-bold">🔥 கௌரி நல்ல நேரம்:</strong>
                <span>காலை மற்றும் மாலை/இரவில் தலா 1 மணி நேரம். சுப காரியங்கள் தொடங்குவதற்கு உகந்தது.</span>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                <strong className="text-red-900 block mb-0.5 font-bold">⚠️ ராகு காலம் &amp; எமகண்டம்:</strong>
                <span>தலா 1.5 மணி நேரம் (90 நிமிடங்கள்). இந்நேரங்களில் சுப காரியங்கள் தவிர்க்கப்பட வேண்டும்.</span>
              </div>

              <div className="p-3 bg-velvi-cream/60 rounded-xl border border-velvi-gold/20 text-[11px] text-velvi-brown/80">
                இக்கணக்கீடுகள் அனைத்து ஆண்டுகளுக்கும் தினசரி பஞ்சாங்க சாஸ்திர விதிகளின்படி நிரந்தரமாகவும் துல்லியமாகவும் அமைகின்றன.
              </div>
            </div>

            <button
              onClick={() => setShowPanchangamGuide(false)}
              className="w-full py-2.5 bg-velvi-brown text-white font-bold rounded-xl text-xs hover:bg-velvi-brownLight transition active:scale-95 shadow-sm"
            >
              சரி, புரிந்தது (Close)
            </button>
          </div>
        </div>
      )}

      {/* Month & Year Quick Picker Modal */}
      {showMonthYearPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowMonthYearPicker(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-5 border border-emerald-950/20 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white flex items-center justify-center font-bold shadow-xs">
                  <CalendarDays className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-emerald-950">
                    மாதம் &amp; வருடம் தேர்வு
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    விரும்பிய மாதம் மற்றும் வருடத்திற்கு நேரடியாக செல்லலாம்
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-slate-600 flex items-center justify-center transition active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Year Selector Pills */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 tracking-wide">
                  வருடம் (Year)
                </label>
                <span className="text-[11px] font-bold text-emerald-800">
                  தேர்வு: {pickerYear}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setPickerYear(yr)}
                    className={`px-3 py-1.5 rounded-xl font-black text-xs transition active:scale-95 shrink-0 ${
                      pickerYear === yr
                        ? "bg-emerald-800 text-white shadow-xs ring-2 ring-emerald-600"
                        : "bg-gray-100 hover:bg-gray-200/80 text-slate-700 font-bold"
                    }`}
                  >
                    {yr}
                  </button>
                ))}
              </div>
            </div>

            {/* 12 Months Grid */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2 tracking-wide">
                மாதம் (Month) – {pickerYear}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {MONTH_PICKER_DATA.map((m, idx) => {
                  const isSelectedMonth = currentYear === pickerYear && currentMonth === idx;
                  const isCurrentRealMonth =
                    new Date().getFullYear() === pickerYear && new Date().getMonth() === idx;

                  return (
                    <button
                      key={m.num}
                      type="button"
                      onClick={() => handleSelectMonth(idx)}
                      className={`p-2.5 rounded-2xl border text-left transition active:scale-95 flex flex-col justify-between relative group ${
                        isSelectedMonth
                          ? "bg-gradient-to-br from-emerald-50 via-white to-emerald-100/70 border-emerald-600 ring-2 ring-emerald-600 shadow-xs"
                          : "bg-gray-50/70 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30"
                      }`}
                    >
                      {/* Top: English Abbr & Indicator */}
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-black text-xs sm:text-sm tracking-wide uppercase ${
                            isSelectedMonth ? "text-emerald-950" : "text-slate-800"
                          }`}
                        >
                          {m.en}
                        </span>
                        {isCurrentRealMonth && (
                          <span
                            className="w-2 h-2 rounded-full bg-amber-500 shadow-xs"
                            title="Current Month"
                          />
                        )}
                      </div>

                      {/* Transliterated Tamil Month */}
                      <div className="text-[10px] sm:text-[11px] font-semibold text-slate-600 truncate mb-1">
                        {m.ta}
                      </div>

                      {/* Tamil Solar Month Badge */}
                      <div className="mt-0.5">
                        <span
                          className={`text-[9.5px] px-1.5 py-0.2 rounded font-bold inline-block leading-tight ${
                            isSelectedMonth
                              ? "bg-emerald-800 text-white"
                              : "bg-emerald-100/80 text-emerald-900"
                          }`}
                        >
                          {m.tamilSolar}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
              <button
                type="button"
                onClick={handlePickerJumpToday}
                className="flex-1 py-2.5 px-3 bg-amber-100 hover:bg-amber-200/80 text-amber-950 font-bold rounded-xl text-xs transition active:scale-95 border border-amber-300/60"
              >
                இன்றைய தேதி (Current Month)
              </button>
              <button
                type="button"
                onClick={() => setShowMonthYearPicker(false)}
                className="py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Full Day Details Modal (நாள்காட்டி & பஞ்சாங்கம் முழு விவரம் - Opened by Long-Press on Date or "முழு விவரம் >") */}
      {showDayDetailsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
          onClick={() => setShowDayDetailsModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-lg w-full border border-amber-300/60 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Rich Sacred Vedic Header */}
            <div className="bg-gradient-to-br from-emerald-950 via-[#0a2f18] to-emerald-900 text-white p-4 sm:p-5 border-b border-amber-400/40 relative overflow-hidden shrink-0">
              {/* Decorative Subtle Glowing Background Pattern */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -left-6 -top-6 w-24 h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />

              <div className="flex items-start justify-between gap-3 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Glowing Day Number Pill */}
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-emerald-950 flex flex-col items-center justify-center font-black shadow-md shrink-0 ring-2 ring-amber-300/80">
                    <span className="text-xl sm:text-2xl leading-none font-black">{selDayNum}</span>
                    <span className="text-[9px] sm:text-[9.5px] uppercase font-bold tracking-tight mt-0.5">{selMonthEn}</span>
                  </div>

                  {/* Dual Date Headings */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                        {selDayNum} {selMonthEn} {selYear}
                      </h3>
                      <span className="text-amber-400 font-bold">•</span>
                      <span className="text-xs sm:text-sm font-bold text-amber-200">
                        {selectedTamilInfo.dayOfWeekTa}
                      </span>
                    </div>
                    <p className="text-xs sm:text-[13px] font-bold text-amber-300 mt-0.5 truncate">
                      {selectedTamilInfo.tamilMonth} {selectedTamilInfo.tamilDay} ({selectedTamilInfo.dayOfWeekTa}) • {selectedTamilInfo.tamilYear} வருடம்
                    </p>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setShowDayDetailsModal(false)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition active:scale-95 shrink-0 border border-white/20"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Sacred Auspicious Event Chips in Header */}
              <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-white/15 relative z-10">
                {selectedTamilInfo.isMuhurtham && (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/90 text-white text-[11px] font-extrabold shadow-2xs flex items-center gap-1 border border-emerald-300/50">
                    💍 சுப முகூர்த்தம்
                  </span>
                )}
                {selectedTamilInfo.isPournami && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-emerald-950 text-[11px] font-black shadow-2xs flex items-center gap-1">
                    🌕 பௌர்ணமி
                  </span>
                )}
                {selectedTamilInfo.isAmavasai && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-900/90 text-white text-[11px] font-extrabold border border-slate-700 shadow-2xs">
                    🌑 அமாவாசை
                  </span>
                )}
                {selectedTamilInfo.isKarinaal && (
                  <span className="px-2.5 py-0.5 rounded-full bg-rose-500/90 text-white text-[11px] font-extrabold shadow-2xs">
                    ⚠️ கரிநாள்
                  </span>
                )}
                {selectedTamilInfo.festivalName && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-500/90 text-white text-[11px] font-extrabold shadow-2xs">
                    ⭐ {selectedTamilInfo.festivalName}
                  </span>
                )}
                {selectedTamilInfo.isPradosham && (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-600/90 text-white text-[11px] font-extrabold shadow-2xs">
                    🪔 பிரதோஷம்
                  </span>
                )}
                <span className="text-[10px] text-amber-200/90 font-semibold ml-auto flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>வேத பஞ்சாங்கம்</span>
                </span>
              </div>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-[#faf9f5]">
              {/* 1. Complete Panchangam Details Matrix (6 Rich Sacred Cards) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-600">🪔</span>
                    <span>பஞ்சாங்க அங்கங்கள்</span>
                  </h4>
                  <span className="text-[10.5px] font-bold text-slate-500">
                    சாஸ்திர விவரங்கள்
                  </span>
                </div>

                {(() => {
                  const soolamPariharamMap: Record<number, { soolam: string; pariharam: string }> = {
                    0: { soolam: "மேற்கு", pariharam: "வெல்லம்" },
                    1: { soolam: "கிழக்கு", pariharam: "தயிர்" },
                    2: { soolam: "வடக்கு", pariharam: "பால்" },
                    3: { soolam: "வடக்கு", pariharam: "பால்" },
                    4: { soolam: "தெற்கு", pariharam: "தைலம்" },
                    5: { soolam: "மேற்கு", pariharam: "வெல்லம்" },
                    6: { soolam: "கிழக்கு", pariharam: "தயிர்" },
                  };
                  const sp = soolamPariharamMap[selectedTamilInfo.dayOfWeek] || { soolam: "மேற்கு", pariharam: "வெல்லம்" };
                  const yogam = selectedTamilInfo.isKarinaal ? "மரண யோகம்" : (selectedTamilInfo.isMuhurtham ? "அமிர்த யோகம்" : "சித்த யோகம்");

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                      {/* Tithi Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                          <span>🌔</span> திதி (Tithi)
                        </span>
                        <span className="font-black text-slate-900 block mt-1 text-xs sm:text-[13px] leading-tight">
                          {selectedTamilInfo.tithiNameTa || selectedTamilInfo.tithiTa}
                        </span>
                        <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                          {selectedTamilInfo.pakshaTa}
                        </span>
                      </div>

                      {/* Nakshatram Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                          <span>⭐</span> நட்சத்திரம் (Star)
                        </span>
                        <span className="font-black text-slate-900 block mt-1 text-xs sm:text-[13px] leading-tight">
                          {selectedTamilInfo.nakshatraNameTa}
                        </span>
                        <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                          சுப நட்சத்திரம்
                        </span>
                      </div>

                      {/* Yogam Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-amber-900 flex items-center gap-1">
                          <span>🧘</span> யோகம் (Yogam)
                        </span>
                        <span className="font-black text-slate-900 block mt-1 text-xs sm:text-[13px] leading-tight">
                          {yogam}
                        </span>
                        <span className={`text-[10px] font-bold block mt-0.5 ${
                          selectedTamilInfo.isKarinaal ? "text-rose-700" : "text-emerald-700"
                        }`}>
                          {selectedTamilInfo.isKarinaal ? "தவிர்க்கவும்" : "சுப யோகம்"}
                        </span>
                      </div>

                      {/* Karanam Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <span>🏛️</span> கரணம் (Karanam)
                        </span>
                        <span className="font-black text-slate-900 block mt-1 text-xs sm:text-[13px] leading-tight">
                          பாலவம்
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                          சுப கர்மம்
                        </span>
                      </div>

                      {/* Soolam & Pariharam Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <span>🧭</span> சூலம் &amp; பரிகாரம்
                        </span>
                        <span className="font-black text-slate-900 block mt-1 text-xs sm:text-[13px] leading-tight">
                          {sp.soolam}
                        </span>
                        <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                          பரிகாரம்: {sp.pariharam}
                        </span>
                      </div>

                      {/* Chandrashtamam Card */}
                      <div className="bg-white border border-amber-200/80 rounded-2xl p-2.5 shadow-2xs hover:border-amber-400 transition">
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <span>🌓</span> சந்திராஷ்டமம்
                        </span>
                        <span className="font-black text-emerald-800 block mt-1 text-xs sm:text-[13px] leading-tight">
                          சுபம் (இல்லை)
                        </span>
                        <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                          அனைவருக்கும் நன்று
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* 2. Auspicious & Inauspicious Times (Rich Two-Tone Grid) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-amber-600">⏱️</span>
                    <span>நேர அட்டவணை (Daily Timings)</span>
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Auspicious Timings Card */}
                  <div className="bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 border border-emerald-300/80 rounded-2xl p-3 shadow-2xs space-y-2">
                    <span className="text-[11px] font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span>சுப நேரங்கள் (Auspicious Timings)</span>
                    </span>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200/70">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>☀️</span> நல்ல நேரம்
                        </span>
                        <span className="font-black text-emerald-950 text-right">
                          காலை: {formatTimeRangeTo12H(selectedTamilInfo.nallaNeramMorning, true)}
                          {selectedTamilInfo.nallaNeramEvening ? ` • மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.nallaNeramEvening, true)}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200/70">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>✨</span> கௌரி நல்ல நேரம்
                        </span>
                        <span className="font-black text-emerald-950 text-right">
                          காலை: {formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramMorning, true)}
                          {selectedTamilInfo.gowriNallaNeramEvening ? ` • மாலை: ${formatTimeRangeTo12H(selectedTamilInfo.gowriNallaNeramEvening, true)}` : ""}
                        </span>
                      </div>

                      <div className="flex items-center justify-between bg-white/90 p-2 rounded-xl border border-emerald-200/70">
                        <span className="font-extrabold text-slate-900 flex items-center gap-1.5">
                          <span>🪔</span> பிரம்ம முகூர்த்தம்
                        </span>
                        <span className="font-black text-emerald-950 text-right">
                          காலை: 04:30 AM – 06:00 AM
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Avoid Timings (3 Alert Cards) */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 px-0.5">
                      தவிர்க்க வேண்டிய காலங்கள் (Inauspicious Periods):
                    </span>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-rose-50/90 border border-rose-200 rounded-2xl p-2 shadow-2xs">
                        <span className="text-[10px] font-black text-rose-800 uppercase block">
                          ராகு காலம்
                        </span>
                        <span className="text-[11px] font-black text-slate-900 block mt-0.5">
                          {formatTimeRangeTo12H(selectedTamilInfo.rahuKalam, true)}
                        </span>
                      </div>

                      <div className="bg-purple-50/90 border border-purple-200 rounded-2xl p-2 shadow-2xs">
                        <span className="text-[10px] font-black text-purple-800 uppercase block">
                          எமகண்டம்
                        </span>
                        <span className="text-[11px] font-black text-slate-900 block mt-0.5">
                          {formatTimeRangeTo12H(selectedTamilInfo.yamagandam, true)}
                        </span>
                      </div>

                      <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-2 shadow-2xs">
                        <span className="text-[10px] font-black text-amber-800 uppercase block">
                          குளிகை
                        </span>
                        <span className="text-[11px] font-black text-slate-900 block mt-0.5">
                          {formatTimeRangeTo12H(selectedTamilInfo.kuligai, true)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Day's Scheduled Bookings & Pujas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-0.5">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>🔥</span>
                    <span>அன்றைய பூஜைகள் &amp; முன்பதிவுகள் ({selectedDayBookings.length})</span>
                  </h4>
                  <Link
                    href={`/app/bookings/new?date=${selectedDate}`}
                    className="text-[11px] font-bold text-amber-800 hover:text-amber-900 flex items-center gap-0.5"
                  >
                    <span>+ புதிய பதிவு</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {selectedDayBookings.length === 0 ? (
                  <div className="border border-dashed border-amber-300/80 rounded-2xl p-4 text-center text-xs bg-amber-50/50 space-y-2">
                    <p className="font-extrabold text-amber-950">
                      இத்தேதியில் இதுவரை முன்பதிவுகள் ஏதுமில்லை (Open for Bookings)
                    </p>
                    <p className="text-[11px] text-slate-600">
                      பக்தர்களுக்கு புதிய பூஜை முன்பதிவு செய்ய கீழேயுள்ள பட்டனை கிளிக் செய்யவும்.
                    </p>
                    <Link
                      href={`/app/bookings/new?date=${selectedDate}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900 hover:bg-emerald-950 text-white rounded-xl font-bold text-xs shadow-2xs transition active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>பூஜை முன்பதிவு செய்ய</span>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedDayBookings.map((b) => (
                      <div
                        key={b.id}
                        className="p-3 rounded-2xl border border-slate-200/90 bg-white hover:border-amber-400 hover:shadow-xs transition group"
                      >
                        <Link
                          href={`/app/bookings/${b.id}`}
                          className="block"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-[10px] text-amber-950 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200">
                                  {b.bookingNumber}
                                </span>
                                <h5 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-950 truncate">
                                  {b.poojaTamilName || b.poojaEnglishName}
                                </h5>
                              </div>

                              <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2 flex-wrap font-medium">
                                <span className="font-bold text-slate-900">👤 {b.customerName}</span>
                                <span>•</span>
                                <span>🕒 {formatTime12H(b.startTime)}–{formatTime12H(b.endTime)}</span>
                                {b.location && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-500">📍 {b.location}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <div className="font-black text-xs sm:text-sm text-slate-900">
                                ₹{b.totalAmount.toLocaleString("en-IN")}
                              </div>
                              <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded mt-0.5 inline-block ${
                                b.paymentStatus === "PAID"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : "bg-rose-100 text-rose-900"
                              }`}>
                                {b.paymentStatus === "PAID" ? "Paid ✅" : `Due ₹${b.balanceAmount}`}
                              </span>
                            </div>
                          </div>
                        </Link>

                        {/* Quick Action Footer in Day Details Modal */}
                        <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                          <Link
                            href={`/app/bookings/${b.id}`}
                            className="text-[11px] font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                          >
                            <span>முழு விவரம்</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                          </Link>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSlipBooking(b);
                            }}
                            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg text-[10.5px] font-extrabold flex items-center gap-1.5 transition active:scale-95 shadow-2xs cursor-pointer"
                          >
                            <FileText className="w-3 h-3 text-amber-800" />
                            <span>Pooja Slip (ரசீது & QR)</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Smart Action Bar at Bottom */}
            <div className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-2.5 px-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer"
                title="Share Panchangam on WhatsApp"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">வாட்ஸ்அப்</span>
                <span>பகிர்</span>
              </button>

              <Link
                href={`/app/bookings/new?date=${selectedDate}`}
                className="flex-1 py-2.5 px-3 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-700 hover:to-amber-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>இந்த தேதியில் பூஜை பதிவு</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowDayDetailsModal(false)}
                className="py-2.5 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Devotee Pooja Slip & Samagri Checklist Modal with Dynamic UPI QR */}
      {selectedSlipBooking && (
        <PoojaSlipModal
          booking={selectedSlipBooking}
          business={currentBusiness}
          onClose={() => setSelectedSlipBooking(null)}
        />
      )}
    </div>
  );
}
