"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Customer, Booking, Pooja } from "@/lib/types";
import {
  Search,
  X,
  User,
  Calendar,
  Flame,
  ArrowRight,
  Plus,
  CreditCard,
  Settings,
  Users,
  Clock,
  Sparkles,
  Phone,
  MapPin,
  Tag,
  CheckCircle2,
  FileText,
  Copy,
  ExternalLink,
  ChevronRight,
  Bookmark,
  Bell,
  MessageCircle,
  AlertCircle,
  Building2,
  Download,
  Shield,
  Gift,
  Globe,
  BookOpen,
  Info,
  RotateCcw,
  Palette,
  Cloud,
} from "lucide-react";
import Link from "next/link";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = "ALL" | "SETTINGS" | "BOOKINGS" | "CUSTOMERS" | "POOJAS" | "ACTIONS";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search open: dismiss notification icon and focus input gracefully on desktop
  useEffect(() => {
    if (isOpen) {
      if (typeof window !== "undefined") {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split("T")[0];
        localStorage.setItem("velvi_seen_upcoming_notice", tomorrowStr);
        window.dispatchEvent(new CustomEvent("velvi:notification-dismissed"));
      }

      // Avoid aggressive auto-focus on mobile touch devices so the virtual keyboard doesn't abruptly pop up over cards
      const isTouchDevice =
        typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0);

      if (!isTouchDevice) {
        if (inputRef.current) {
          inputRef.current.focus();
        }
        const raf = requestAnimationFrame(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        });
        const timer = setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 30);
        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(timer);
        };
      }
    } else {
      setQuery("");
      setActiveCategory("ALL");
      setCopiedMobile(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background body/html scroll when search modal is open so page behind does not scroll
  useEffect(() => {
    if (!isOpen) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isOpen]);

  // Data fetching from store
  const customers = useMemo(() => db.getCustomers(businessId), [businessId, isOpen]);
  const bookings = useMemo(() => db.getBookings(businessId), [businessId, isOpen]);
  const poojas = useMemo(() => db.getPoojas(businessId), [businessId, isOpen]);

  // Upcoming date calculations (today & tomorrow for 1-day before reminders)
  const { todayStr, tomorrowStr } = useMemo(() => {
    const now = new Date();
    const yr = now.getFullYear();
    const mo = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const tStr = `${yr}-${mo}-${day}`;

    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tyr = d.getFullYear();
    const tmo = String(d.getMonth() + 1).padStart(2, "0");
    const tday = String(d.getDate()).padStart(2, "0");
    const tmStr = `${tyr}-${tmo}-${tday}`;
    return { todayStr: tStr, tomorrowStr: tmStr };
  }, []);

  const tomorrowBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.date === tomorrowStr && b.status !== "CANCELLED"
    );
  }, [bookings, tomorrowStr]);

  const todayBookings = useMemo(() => {
    return bookings.filter(
      (b) => b.date === todayStr && b.status !== "CANCELLED"
    );
  }, [bookings, todayStr]);

  const handleSendReminderWhatsApp = (b: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!b.customerMobile) {
      alert("இந்த பக்தரின் மொபைல் எண் பதிவு செய்யப்படவில்லை (No mobile registered)");
      return;
    }
    const cleanPhone = b.customerMobile.replace(/\D/g, "");
    const msg = encodeURIComponent(
      `வணக்கம் ${b.customerName || "பக்தரே"}!\n\n` +
      `வேள்வி பூஜை நினைவூட்டல் (Booking Reminder):\n` +
      `🪔 பூஜை: ${b.poojaTamilName || b.poojaEnglishName}\n` +
      `📅 தேதி: நாளை (${b.date})\n` +
      `⏰ நேரம்: ${b.startTime || "காலை"}\n` +
      `${b.location ? `📍 இடம்: ${b.location}\n` : ""}` +
      `\nநாளை குறிப்பிட்ட நேரத்தில் பூஜை சிறப்பாக நடைபெறும். தேவையான ஏற்பாடுகளை தயார் நிலையில் வைத்திருக்கவும்.\n\n` +
      `நன்றி,\n*${currentBusiness?.name || "வேள்வி வாத்யார்"}*\n\n` +
      `✨ _Powered by_ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨\n_வேத முறை முன்பதிவு மேலாண்மை_`
    );
    window.open(`https://wa.me/91${cleanPhone.slice(-10)}?text=${msg}`, "_blank");
  };

  // Minimal Common Quick Actions for initial view
  const commonActions = useMemo(
    () => [
      {
        id: "new-booking",
        title: "New Booking",
        english: "Create Booking",
        icon: Sparkles,
        url: "/app/bookings/new",
        bgColor: "bg-amber-500/10 text-amber-900 border-amber-300/80",
        iconColor: "text-amber-700",
      },
      {
        id: "calendar",
        title: "Calendar & Timings",
        english: "Panchangam & Muhurtham",
        icon: Calendar,
        url: "/app/calendar",
        bgColor: "bg-emerald-500/10 text-emerald-950 border-emerald-300/80",
        iconColor: "text-emerald-700",
      },
      {
        id: "customers",
        title: "Devotees & Clients",
        english: "Client Directory",
        icon: Users,
        url: "/app/customers",
        bgColor: "bg-blue-500/10 text-blue-950 border-blue-300/80",
        iconColor: "text-blue-700",
      },
      {
        id: "poojas",
        title: "Ceremonies & Poojas",
        english: "Pooja Catalog",
        icon: Flame,
        url: "/app/poojas",
        bgColor: "bg-orange-500/10 text-orange-950 border-orange-300/80",
        iconColor: "text-orange-700",
      },
      {
        id: "payments",
        title: "Payments & Reports",
        english: "Dakshina & Accounts",
        icon: CreditCard,
        url: "/app/payments",
        bgColor: "bg-purple-500/10 text-purple-950 border-purple-300/80",
        iconColor: "text-purple-700",
      },
      {
        id: "settings",
        title: "Settings & Profile",
        english: "App Configuration",
        icon: Settings,
        url: "/app/settings",
        bgColor: "bg-slate-500/10 text-slate-900 border-slate-300/80",
        iconColor: "text-slate-700",
      },
    ],
    []
  );

  // Deep Settings Search Dictionary (Everything inside settings, branding, backup, theme, language, etc.)
  const deepSettingsList = useMemo(
    () => [
      {
        id: "set-profile",
        title: "Priest & Business Profile",
        english: "Business Profile & Contact Info",
        section: "Profile",
        desc: "Manage priest name, temple or business title, address, WhatsApp and contact details",
        icon: Building2,
        bgColor: "bg-blue-500/10 text-blue-900 border-blue-300/80",
        iconColor: "text-blue-700",
        url: "/app/settings/branding",
        keywords: "profile priest name temple business gotram address phone mobile email vadhyar",
      },
      {
        id: "set-logo",
        title: "Custom Logo & Signature",
        english: "Custom Logo & Signature Upload",
        section: "Branding",
        desc: "Upload custom logo and digital signature to display on devotee receipts",
        icon: Sparkles,
        bgColor: "bg-amber-500/10 text-amber-900 border-amber-300/80",
        iconColor: "text-amber-700",
        url: "/app/settings/branding",
        keywords: "logo brand upload photo image avatar icon signature",
      },
      {
        id: "set-watermark",
        title: "Receipt Watermark & Branding",
        english: "Receipt Watermark & Branding",
        section: "Branding",
        desc: "Toggle Velvi branding watermark visibility on generated PDF receipts",
        icon: Tag,
        bgColor: "bg-rose-500/10 text-rose-900 border-rose-300/80",
        iconColor: "text-rose-700",
        url: "/app/settings/branding",
        keywords: "watermark receipt hide show branding pdf signature",
      },
      {
        id: "set-subscription",
        title: "Velvi Pro Plan & Validity",
        english: "Velvi Pro Plan & Validity",
        section: "Subscription",
        desc: "View remaining validity days, renew membership, apply promo codes, and unlock features",
        icon: CreditCard,
        bgColor: "bg-emerald-500/10 text-emerald-900 border-emerald-300/80",
        iconColor: "text-emerald-700",
        url: "/app/subscription",
        keywords: "subscription plan pro validity renew upgrade coupon cashfree upi payment",
      },
      {
        id: "set-referrals",
        title: "Referrals & +30 Days Bonus",
        english: "Referrals & Earn Free Days",
        section: "Referrals",
        desc: "Invite fellow priests and receive +30 days bonus free validity for every referral",
        icon: Gift,
        bgColor: "bg-pink-500/10 text-pink-900 border-pink-300/80",
        iconColor: "text-pink-700",
        url: "/app/referrals",
        keywords: "referral invite friend earn free days bonus code",
      },
      {
        id: "set-theme",
        title: "Appearance & Sacred Themes",
        english: "Sacred Themes & Color Palettes",
        section: "Appearance",
        desc: "Traditional Gold, Kumkum, Bilva Green, and Dark Mode color themes",
        icon: Palette,
        bgColor: "bg-fuchsia-500/10 text-fuchsia-900 border-fuchsia-300/80",
        iconColor: "text-fuchsia-700",
        url: "/app/settings/theme",
        keywords: "theme color dark mode light mode traditional gold saffron kumkum bilva green",
      },
      {
        id: "set-backup",
        title: "Data Backup & Excel Export",
        english: "Data Backup & Excel Export",
        section: "Backup",
        desc: "Download all bookings, devotees, and poojas as Excel (.xlsx) and JSON files",
        icon: Download,
        bgColor: "bg-cyan-500/10 text-cyan-900 border-cyan-300/80",
        iconColor: "text-cyan-700",
        url: "/app/data-backup",
        keywords: "backup export excel xlsx csv json download data restore",
      },
      {
        id: "set-cloud",
        title: "Cloud Sync & Offline Mode",
        english: "Supabase Cloud Sync & Offline PWA",
        section: "Cloud Sync",
        desc: "Live Supabase cloud sync status, offline local storage, and instant manual sync",
        icon: Cloud,
        bgColor: "bg-teal-500/10 text-teal-900 border-teal-300/80",
        iconColor: "text-teal-700",
        url: "/app/data-backup",
        keywords: "cloud sync supabase live backup offline pwa internet",
      },
      {
        id: "set-trash",
        title: "Recycle Bin & Restore",
        english: "Recycle Bin & Restore Log",
        section: "Recycle Bin",
        desc: "Recover accidentally deleted bookings, customers, or pooja records",
        icon: RotateCcw,
        bgColor: "bg-red-500/10 text-red-900 border-red-300/80",
        iconColor: "text-red-700",
        url: "/app/settings",
        keywords: "trash recycle bin restore undo deleted audit log recover",
      },
      {
        id: "set-poojas",
        title: "Pooja Catalog & Dakshina Rates",
        english: "Pooja Catalog & Dakshina Rates",
        section: "Services",
        desc: "Homams, poojas, suggested dakshina pricing, and duration management",
        icon: Flame,
        bgColor: "bg-orange-500/10 text-orange-900 border-orange-300/80",
        iconColor: "text-orange-700",
        url: "/app/poojas",
        keywords: "pooja catalog homam seva dakshina fee rate duration",
      },
      {
        id: "set-samagri",
        title: "Samagri Categories & Items",
        english: "Samagri Categories & Items",
        section: "Samagri",
        desc: "Fruits, flowers, ghee, vastram and ritual store checklist management",
        icon: Tag,
        bgColor: "bg-indigo-500/10 text-indigo-900 border-indigo-300/80",
        iconColor: "text-indigo-700",
        url: "/app/settings",
        keywords: "samagri checklist items fruits flowers ghee vastram dravyam",
      },
      {
        id: "set-team",
        title: "Assistant Priests & Settlements",
        english: "Assistant Priests & Settlements",
        section: "Team",
        desc: "Appoint assistant priests, manage ritual shares, and track dakshina settlements",
        icon: Users,
        bgColor: "bg-violet-500/10 text-violet-900 border-violet-300/80",
        iconColor: "text-violet-700",
        url: "/app/team",
        keywords: "team purohit assistant iyer dakshina split settlement purohits",
      },
      {
        id: "set-language",
        title: "App Language Toggle",
        english: "App Language Toggle",
        section: "Preferences",
        desc: "Switch the application user interface between English and Tamil",
        icon: Globe,
        bgColor: "bg-lime-500/10 text-lime-900 border-lime-300/80",
        iconColor: "text-lime-700",
        url: "/app/settings",
        keywords: "language switch tamil english",
      },
      {
        id: "set-guide",
        title: "App Walkthrough & Documentation",
        english: "App Walkthrough & Documentation",
        section: "Guide",
        desc: "Complete step-by-step documentation for bookings, WhatsApp receipts, and calendars",
        icon: BookOpen,
        bgColor: "bg-yellow-500/10 text-yellow-900 border-yellow-300/80",
        iconColor: "text-yellow-700",
        url: "/app/settings/guide",
        keywords: "guide manual help documentation faq how to use walkthrough",
      },
      {
        id: "set-version",
        title: "Version History & Updates (v2.5.3)",
        english: "Version History & Release Notes",
        section: "Version",
        desc: "Velvi v2.5.3 release notes, offline PWA features, and latest system upgrades",
        icon: Info,
        bgColor: "bg-slate-500/10 text-slate-900 border-slate-300/80",
        iconColor: "text-slate-700",
        url: "/app/settings/version",
        keywords: "version update changelog release notes v2.5.3 pwa",
      },
      {
        id: "set-admin",
        title: "Super Admin Management Console",
        english: "Super Admin Management Console",
        section: "Super Admin",
        desc: "User directory, coupon management engine, validity control, and telemetry",
        icon: Shield,
        bgColor: "bg-amber-500/15 text-amber-950 border-amber-400/90",
        iconColor: "text-amber-800",
        url: "/admin",
        keywords: "super admin master console telemetry coupon users directory validity increase",
      },
    ],
    []
  );

  const cleanQuery = query.trim().toLowerCase();

  // Filtered results when query is typed
  const filteredCustomers = useMemo(() => {
    if (!cleanQuery) return [];
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        (c.mobile && c.mobile.includes(cleanQuery)) ||
        (c.city && c.city.toLowerCase().includes(cleanQuery)) ||
        (c.address && c.address.toLowerCase().includes(cleanQuery)) ||
        (c.notes && c.notes.toLowerCase().includes(cleanQuery))
    );
  }, [customers, cleanQuery]);

  const filteredBookings = useMemo(() => {
    if (!cleanQuery) return [];
    return bookings.filter(
      (b) =>
        b.bookingNumber?.toLowerCase().includes(cleanQuery) ||
        b.customerName?.toLowerCase().includes(cleanQuery) ||
        (b.customerMobile && b.customerMobile.includes(cleanQuery)) ||
        b.poojaEnglishName?.toLowerCase().includes(cleanQuery) ||
        (b.poojaTamilName && b.poojaTamilName.toLowerCase().includes(cleanQuery)) ||
        b.date?.includes(cleanQuery) ||
        b.location?.toLowerCase().includes(cleanQuery) ||
        b.status?.toLowerCase().includes(cleanQuery) ||
        (b.assignedIyerName && b.assignedIyerName.toLowerCase().includes(cleanQuery))
    );
  }, [bookings, cleanQuery]);

  const filteredPoojas = useMemo(() => {
    if (!cleanQuery) return [];
    return poojas.filter(
      (p) =>
        p.englishName?.toLowerCase().includes(cleanQuery) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(cleanQuery)) ||
        (p.description && p.description.toLowerCase().includes(cleanQuery))
    );
  }, [poojas, cleanQuery]);

  const filteredSettings = useMemo(() => {
    if (!cleanQuery) return activeCategory === "SETTINGS" ? deepSettingsList : [];
    return deepSettingsList.filter(
      (s) =>
        s.title.toLowerCase().includes(cleanQuery) ||
        s.english.toLowerCase().includes(cleanQuery) ||
        s.section.toLowerCase().includes(cleanQuery) ||
        s.desc.toLowerCase().includes(cleanQuery) ||
        s.keywords.toLowerCase().includes(cleanQuery)
    );
  }, [deepSettingsList, cleanQuery, activeCategory]);

  const filteredActions = useMemo(() => {
    if (!cleanQuery) return [];
    return commonActions.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanQuery) ||
        a.english.toLowerCase().includes(cleanQuery)
    );
  }, [commonActions, cleanQuery]);

  const totalResultsCount =
    (activeCategory === "ALL" || activeCategory === "SETTINGS" ? filteredSettings.length : 0) +
    (activeCategory === "ALL" || activeCategory === "CUSTOMERS" ? filteredCustomers.length : 0) +
    (activeCategory === "ALL" || activeCategory === "BOOKINGS" ? filteredBookings.length : 0) +
    (activeCategory === "ALL" || activeCategory === "POOJAS" ? filteredPoojas.length : 0) +
    (activeCategory === "ALL" || activeCategory === "ACTIONS" ? filteredActions.length : 0);

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  const handleCopyMobile = (mobile: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(mobile);
    setCopiedMobile(mobile);
    setTimeout(() => setCopiedMobile(null), 2000);
  };

  // Helper for customer booking count
  const getCustomerBookingsCount = (custId: string) => {
    return bookings.filter((b) => b.customerId === custId).length;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 pt-14 sm:pt-16 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-hidden overscroll-none"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100dvh-4.5rem)] transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Search Header with Highlighted Search Box */}
        <div className="p-3 sm:p-3.5 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/50 shrink-0">
          <div className="flex items-center gap-2">
            {/* Highlighted Search Input Box Container */}
            <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-white rounded-2xl border-2 border-emerald-500 shadow-[0_2px_14px_rgba(16,185,129,0.18)] ring-3 ring-emerald-500/15 focus-within:ring-4 focus-within:ring-emerald-500/25 focus-within:border-emerald-600 transition-all duration-200">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-amber-300 flex items-center justify-center shrink-0 shadow-2xs">
                <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300 stroke-[2.5]" />
              </div>
              <input
                ref={inputRef}
                enterKeyHint="search"
                inputMode="search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search devotees, phone, poojas, bookings, settings..."
                className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition shrink-0 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Close Button - Only X icon (No text) */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition shrink-0 flex items-center justify-center cursor-pointer active:scale-95 shadow-2xs"
              aria-label="Close search"
              title="Close (Esc)"
            >
              <X className="w-5 h-5 text-slate-600 stroke-[2.2]" />
            </button>
          </div>
        </div>

        {/* Category Filter Chips (Shown only when searching) */}
        {cleanQuery.length > 0 && (
          <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/80 text-xs shrink-0">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition cursor-pointer ${
                activeCategory === "ALL"
                  ? "bg-emerald-900 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              All ({filteredCustomers.length + filteredBookings.length + filteredPoojas.length + filteredSettings.length + filteredActions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("SETTINGS")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                activeCategory === "SETTINGS"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Settings className="w-3 h-3" /> Settings ({filteredSettings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("CUSTOMERS")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                activeCategory === "CUSTOMERS"
                  ? "bg-blue-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <User className="w-3 h-3" /> Devotees ({filteredCustomers.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("BOOKINGS")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                activeCategory === "BOOKINGS"
                  ? "bg-amber-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Calendar className="w-3 h-3" /> Bookings ({filteredBookings.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("POOJAS")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                activeCategory === "POOJAS"
                  ? "bg-orange-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Flame className="w-3 h-3" /> Poojas ({filteredPoojas.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory("ACTIONS")}
              className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 cursor-pointer ${
                activeCategory === "ACTIONS"
                  ? "bg-purple-800 text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Sparkles className="w-3 h-3" /> Actions ({filteredActions.length})
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-3.5 text-slate-800 scroll-smooth max-h-[calc(85vh-7.5rem)] sm:max-h-[calc(80vh-8.5rem)]">
          {/* ========================================================================= */}
          {/* 1. INITIAL COMPACT VIEW (When query is empty - small, sleek bar)          */}
          {/* ========================================================================= */}
          {!cleanQuery ? (
            <div className="space-y-3">
              {/* 1. Dedicated 1-Day Before Upcoming Notification Banner */}
              {tomorrowBookings.length > 0 && (
                <div className="p-3 bg-gradient-to-br from-amber-50 via-amber-100/40 to-orange-50/50 rounded-2xl border border-amber-300 shadow-2xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                      <Bell className="w-4 h-4 text-amber-700 animate-bounce" />
                      <span>நாளை பூஜை நினைவூட்டல் (1 Day Before Reminder)</span>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-[76px] h-[22px] px-2 rounded-full bg-amber-200/90 text-amber-950 font-black text-[10px] tracking-tight shrink-0 select-none shadow-2xs pointer-events-none text-center leading-none">
                      {tomorrowBookings.length} {tomorrowBookings.length === 1 ? "நிகழ்வு" : "நிகழ்வுகள்"}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {tomorrowBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleNavigate(`/app/bookings/${b.id}`)}
                        className="p-2.5 bg-white rounded-xl border border-amber-200/90 shadow-2xs flex items-center justify-between gap-2.5 hover:border-amber-400 transition cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-950 truncate">
                              {b.poojaTamilName || b.poojaEnglishName}
                            </h4>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                              ⏰ {b.startTime || "காலை"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-0.5 flex-wrap">
                            <span className="font-semibold text-slate-800">👤 {b.customerName}</span>
                            {b.location && <span>• 📍 {b.location}</span>}
                            <span>• ₹{b.totalAmount?.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.customerMobile && (
                            <button
                              type="button"
                              onClick={(e) => handleSendReminderWhatsApp(b, e)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10.5px] font-bold flex items-center gap-1 transition shadow-2xs active:scale-95 cursor-pointer"
                              title="WhatsApp நினைவூட்டல் செய்தி அனுப்பவும்"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WhatsApp Remind</span>
                            </button>
                          )}
                          <div className="p-1 rounded-lg text-slate-400 group-hover:text-amber-900 transition">
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Today's Events (if any) */}
              {todayBookings.length > 0 && (
                <div className="p-3 bg-gradient-to-br from-emerald-50/80 to-emerald-100/30 rounded-2xl border border-emerald-300 shadow-2xs space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                      <Flame className="w-4 h-4 text-emerald-700" />
                      <span>Today&apos;s Bookings &amp; Events</span>
                    </div>
                    <span className="inline-flex items-center justify-center min-w-[76px] h-[22px] px-2 rounded-full bg-emerald-200/90 text-emerald-950 font-black text-[10px] tracking-tight shrink-0 select-none shadow-2xs pointer-events-none text-center leading-none">
                      {todayBookings.length} {todayBookings.length === 1 ? "Event" : "Events"}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {todayBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleNavigate(`/app/bookings/${b.id}`)}
                        className="p-2.5 bg-white rounded-xl border border-emerald-200 shadow-2xs flex items-center justify-between gap-2 hover:border-emerald-400 transition cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-950 truncate">
                            {b.poojaEnglishName || b.poojaTamilName}
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            👤 {b.customerName} • ⏰ {b.startTime || "Today"} • ₹{b.totalAmount?.toLocaleString()}
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status if no upcoming events today or tomorrow */}
              {tomorrowBookings.length === 0 && todayBookings.length === 0 && (
                <div className="px-3 py-2 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold text-[11px]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No ceremonies scheduled for today or tomorrow</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNavigate("/app/bookings/new")}
                    className="text-[10.5px] font-bold text-emerald-800 hover:underline flex items-center gap-0.5"
                  >
                    + New Booking
                  </button>
                </div>
              )}

              {/* 3. Search Tips & Examples */}
              <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                  <span className="text-emerald-700 font-bold">💡 Quick Search:</span>
                  <span>Type devotee name, phone number, ceremony, or booking ID.</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                    Examples:
                  </span>
                  {customers.slice(0, 2).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setQuery(c.name)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <User className="w-3 h-3 text-emerald-700" />
                      <span>{c.name}</span>
                    </button>
                  ))}
                  {poojas.slice(0, 2).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setQuery(p.englishName || p.tamilName || "")}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
                    >
                      <Flame className="w-3 h-3 text-amber-700" />
                      <span>{p.englishName || p.tamilName}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Common Quick Actions */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider px-1">
                  Quick Shortcuts
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {commonActions.slice(0, 4).map((act) => {
                    const ActionIcon = act.icon;
                    return (
                      <button
                        key={act.id}
                        type="button"
                        onClick={() => handleNavigate(act.url)}
                        className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 transition text-left cursor-pointer active:scale-98 shadow-2xs group"
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${act.bgColor}`}>
                          <ActionIcon className={`w-3.5 h-3.5 ${act.iconColor}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h5 className="font-extrabold text-[11.5px] text-slate-800 group-hover:text-slate-950 truncate">
                            {act.title}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate">{act.english}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* 2. SEARCHED VIEW (When query is typed) - MORE DETAILS                      */
            /* ========================================================================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              {totalResultsCount === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3 border border-amber-200">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    No results found
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    No devotee, ceremony, or setting matches &quot;{query}&quot;.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate("/app/bookings/new")}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> + New Booking
                    </button>
                  </div>
                </div>
              ) : null}

              {/* DETAILED: Customers Section */}
              {(activeCategory === "ALL" || activeCategory === "CUSTOMERS") &&
                filteredCustomers.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" /> Devotees &amp; Clients ({filteredCustomers.length})
                      </span>
                      <Link
                        href="/app/customers"
                        onClick={onClose}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {filteredCustomers.map((c) => {
                        const bCount = getCustomerBookingsCount(c.id);
                        return (
                          <div
                            key={c.id}
                            className="p-3 rounded-2xl bg-white hover:bg-blue-50/40 border border-slate-200/90 hover:border-blue-300 shadow-2xs transition space-y-2.5 group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-black text-xs shrink-0 border border-blue-200">
                                  {c.name ? c.name[0].toUpperCase() : "👤"}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-blue-950">
                                      {c.name}
                                    </h4>
                                    {c.city && (
                                      <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                        📍 {c.city}
                                      </span>
                                    )}
                                    {bCount > 0 && (
                                      <span className="text-[9.5px] font-semibold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                        ✨ {bCount} முன்பதிவுகள்
                                      </span>
                                    )}
                                  </div>

                                  {/* Phone & Address Details */}
                                  <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                                    {c.mobile ? (
                                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                                        <Phone className="w-3 h-3 text-slate-400" />
                                        <span>{c.mobile}</span>
                                        <button
                                          type="button"
                                          onClick={(e) => handleCopyMobile(c.mobile, e)}
                                          className={`p-1 rounded transition-all duration-150 cursor-pointer ${
                                            copiedMobile === c.mobile
                                              ? "bg-emerald-100 text-emerald-700 scale-110 ring-1 ring-emerald-400"
                                              : "hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                                          }`}
                                          title="Copy number"
                                        >
                                          {copiedMobile === c.mobile ? (
                                            <CheckCircle2 className="w-3 h-3 text-emerald-600 animate-in zoom-in-50 duration-200" />
                                          ) : (
                                            <Copy className="w-3 h-3" />
                                          )}
                                        </button>
                                      </div>
                                    ) : (
                                      <span className="text-slate-400 italic text-[11px]">எண் பதிவு செய்யப்படவில்லை</span>
                                    )}

                                    {c.address && (
                                      <span className="text-[11px] text-slate-500 truncate max-w-[200px]">
                                        🏡 {c.address}
                                      </span>
                                    )}
                                  </div>

                                  {c.notes && (
                                    <p className="text-[10.5px] text-slate-500 italic mt-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-150 line-clamp-1">
                                      💬 &quot;{c.notes}&quot;
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Direct Actions */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleNavigate(`/app/bookings/new?customerId=${c.id}`)}
                                  className="px-2.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95"
                                >
                                  <Sparkles className="w-3 h-3 text-amber-300" />
                                  <span>Book</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* DETAILED: Bookings Section */}
              {(activeCategory === "ALL" || activeCategory === "BOOKINGS") &&
                filteredBookings.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-700" /> Bookings ({filteredBookings.length})
                      </span>
                      <Link
                        href="/app/bookings"
                        onClick={onClose}
                        className="text-[11px] font-bold text-amber-800 hover:underline"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {filteredBookings.map((b) => (
                        <div
                          key={b.id}
                          onClick={() => handleNavigate(`/app/bookings/${b.id}`)}
                          className="p-3 rounded-2xl bg-white hover:bg-amber-50/40 border border-slate-200/90 hover:border-amber-300 shadow-2xs transition cursor-pointer space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-black text-[11px] text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md border border-amber-300/80">
                                  {b.bookingNumber}
                                </span>
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-amber-950 truncate">
                                  {b.poojaEnglishName}
                                </h4>
                                {b.poojaTamilName && b.poojaTamilName !== b.poojaEnglishName && (
                                  <span className="text-[11px] text-amber-800 font-medium truncate">
                                    ({b.poojaTamilName})
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 text-[11.5px] text-slate-600 mt-1 flex-wrap">
                                <span className="font-semibold text-slate-900 flex items-center gap-1">
                                  👤 {b.customerName}
                                </span>
                                <span>•</span>
                                <span className="text-slate-700">📅 {b.date} ({b.startTime})</span>
                                {b.location && (
                                  <>
                                    <span>•</span>
                                    <span className="text-slate-500">📍 {b.location}</span>
                                  </>
                                )}
                              </div>

                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  ₹{b.totalAmount?.toLocaleString()}
                                </span>
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                                    b.status === "CONFIRMED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : b.status === "COMPLETED"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  {b.status}
                                </span>
                                {b.assignedIyerName && (
                                  <span className="text-[10px] text-slate-500 font-medium">
                                    🪔 {b.assignedIyerName}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-amber-100 text-slate-400 group-hover:text-amber-900 transition shrink-0">
                              <ArrowRight className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* DETAILED: Poojas Section */}
              {(activeCategory === "ALL" || activeCategory === "POOJAS") &&
                filteredPoojas.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-950 flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-orange-600" /> Ceremonies &amp; Poojas ({filteredPoojas.length})
                      </span>
                      <Link
                        href="/app/poojas"
                        onClick={onClose}
                        className="text-[11px] font-bold text-orange-700 hover:underline"
                      >
                        View All →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {filteredPoojas.map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-white hover:bg-orange-50/40 border border-slate-200/90 hover:border-orange-300 shadow-2xs transition space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 group-hover:text-orange-950">
                                  {p.englishName || p.tamilName}
                                </h4>
                                {p.tamilName && p.tamilName !== p.englishName && p.englishName && (
                                  <span className="text-xs font-bold text-amber-800">
                                    ({p.tamilName})
                                  </span>
                                )}
                              </div>

                              {p.description && (
                                <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                  {p.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <span className="font-extrabold text-xs text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                  ₹{p.basePrice?.toLocaleString()}
                                </span>
                                {p.items && p.items.length > 0 && (
                                  <span className="text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                    📦 {p.items.length} items
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleNavigate(`/app/bookings/new?poojaId=${p.id}`)}
                              className="px-3 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 shadow-2xs active:scale-95"
                            >
                              <span>Book</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* DETAILED: Deep Settings Section */}
              {(activeCategory === "ALL" || activeCategory === "SETTINGS") &&
                filteredSettings.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                        <Settings className="w-3.5 h-3.5 text-slate-600" /> Settings &amp; Preferences ({filteredSettings.length})
                      </span>
                      <Link
                        href="/app/settings"
                        onClick={onClose}
                        className="text-[11px] font-bold text-slate-700 hover:underline"
                      >
                        All Settings →
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredSettings.map((set) => {
                        const IconComponent = set.icon;
                        return (
                          <div
                            key={set.id}
                            onClick={() => handleNavigate(set.url)}
                            className="p-3 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/90 hover:border-emerald-400 shadow-2xs transition cursor-pointer flex items-start gap-3 group"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${set.bgColor}`}
                            >
                              <IconComponent className={`w-4 h-4 ${set.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-slate-900 group-hover:text-emerald-950 truncate">
                                  {set.title}
                                </span>
                                <span className="text-[9.5px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0">
                                  {set.section}
                                </span>
                              </div>
                              <div className="text-[10.5px] font-semibold text-slate-600 truncate mt-0.5">
                                {set.english}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                                {set.desc}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 shrink-0 mt-2" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* DETAILED: Quick Navigation Actions */}
              {(activeCategory === "ALL" || activeCategory === "ACTIONS") &&
                filteredActions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Quick Actions ({filteredActions.length})
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {filteredActions.map((act) => {
                        const IconComponent = act.icon;
                        return (
                          <div
                            key={act.id}
                            onClick={() => handleNavigate(act.url)}
                            className="p-3 rounded-2xl bg-white hover:bg-purple-50/60 border border-slate-200/90 hover:border-purple-300 shadow-2xs transition cursor-pointer flex items-center gap-3 group"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${act.bgColor}`}
                            >
                              <IconComponent className={`w-4 h-4 ${act.iconColor}`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-slate-900 group-hover:text-purple-950 truncate">
                                {act.title}
                              </div>
                              <div className="text-[10.5px] text-slate-500 truncate">
                                {act.english}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 shrink-0" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>

        {/* Sticky Footer (Only shown when searching) */}
        {cleanQuery.length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Velvi Search</span>
              <span>•</span>
              <span className="text-slate-500">
                {filteredCustomers.length + filteredBookings.length + filteredPoojas.length + filteredSettings.length} results
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition flex items-center justify-center cursor-pointer active:scale-95"
              aria-label="Close search"
              title="Close (Esc)"
            >
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
