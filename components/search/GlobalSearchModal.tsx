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
} from "lucide-react";
import Link from "next/link";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = "ALL" | "CUSTOMERS" | "BOOKINGS" | "POOJAS" | "ACTIONS";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const [copiedMobile, setCopiedMobile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Direct keyboard open on open (auto-focus synchronously and via RAF)
  useEffect(() => {
    if (isOpen) {
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

  // Data fetching from store
  const customers = useMemo(() => db.getCustomers(businessId), [businessId, isOpen]);
  const bookings = useMemo(() => db.getBookings(businessId), [businessId, isOpen]);
  const poojas = useMemo(() => db.getPoojas(businessId), [businessId, isOpen]);

  // Minimal Common Quick Actions for initial view
  const commonActions = useMemo(
    () => [
      {
        id: "new-booking",
        title: "புதிய பூஜை பதிவு",
        english: "New Booking",
        icon: Sparkles,
        url: "/app/bookings/new",
        bgColor: "bg-amber-500/10 text-amber-900 border-amber-300/80",
        iconColor: "text-amber-700",
      },
      {
        id: "calendar",
        title: "நாட்காட்டி & முகூர்த்தம்",
        english: "Calendar & Timings",
        icon: Calendar,
        url: "/app/calendar",
        bgColor: "bg-emerald-500/10 text-emerald-950 border-emerald-300/80",
        iconColor: "text-emerald-700",
      },
      {
        id: "customers",
        title: "பக்தர்கள் பட்டியல்",
        english: "Devotees List",
        icon: Users,
        url: "/app/customers",
        bgColor: "bg-blue-500/10 text-blue-950 border-blue-300/80",
        iconColor: "text-blue-700",
      },
      {
        id: "poojas",
        title: "பூஜைகள் & கட்டணம்",
        english: "Pooja Catalog",
        icon: Flame,
        url: "/app/poojas",
        bgColor: "bg-orange-500/10 text-orange-950 border-orange-300/80",
        iconColor: "text-orange-700",
      },
      {
        id: "payments",
        title: "வரவு செலவு & கணக்கு",
        english: "Payments & Reports",
        icon: CreditCard,
        url: "/app/payments",
        bgColor: "bg-purple-500/10 text-purple-950 border-purple-300/80",
        iconColor: "text-purple-700",
      },
      {
        id: "settings",
        title: "கோயில் / ஐயர் அமைப்புகள்",
        english: "Settings",
        icon: Settings,
        url: "/app/settings",
        bgColor: "bg-slate-500/10 text-slate-900 border-slate-300/80",
        iconColor: "text-slate-700",
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

  const filteredActions = useMemo(() => {
    if (!cleanQuery) return [];
    return commonActions.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanQuery) ||
        a.english.toLowerCase().includes(cleanQuery)
    );
  }, [commonActions, cleanQuery]);

  const totalResultsCount =
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
      className="fixed inset-0 z-[100] flex items-start justify-center p-3 pt-14 sm:pt-16 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all duration-200 animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Search Header */}
        <div className="p-3 sm:p-3.5 border-b border-slate-200/80 flex items-center gap-2.5 bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 shrink-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-300/80 flex items-center justify-center shrink-0 shadow-2xs">
            <Search className="w-4 h-4 text-emerald-900" />
          </div>
          <input
            ref={inputRef}
            autoFocus
            enterKeyHint="search"
            inputMode="search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தேடுக: பக்தர் பெயர், மொபைல், பூஜை, பதிவு எண்..."
            className="w-full bg-transparent text-sm sm:text-base font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 transition shrink-0 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Close Button - Replaced "ESC" with a proper Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition shrink-0 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Close search"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Close</span>
          </button>
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
              அனைத்தும் ({filteredCustomers.length + filteredBookings.length + filteredPoojas.length + filteredActions.length})
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
              <User className="w-3 h-3" /> பக்தர்கள் ({filteredCustomers.length})
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
              <Calendar className="w-3 h-3" /> பதிவுகள் ({filteredBookings.length})
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
              <Flame className="w-3 h-3" /> பூஜைகள் ({filteredPoojas.length})
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
              <Sparkles className="w-3 h-3" /> விரைவு வழிகள் ({filteredActions.length})
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className={`overflow-y-auto overscroll-contain p-3 sm:p-3.5 space-y-3.5 text-slate-800 scroll-smooth ${cleanQuery ? "max-h-[60vh]" : ""}`}>
          {/* ========================================================================= */}
          {/* 1. INITIAL COMPACT VIEW (When query is empty - small, sleek bar)          */}
          {/* ========================================================================= */}
          {!cleanQuery ? (
            <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
                <span className="text-emerald-700 font-bold">💡 தேடல் குறிப்பு:</span>
                <span>பக்தர் பெயர், தொலைபேசி, பூஜை அல்லது பதிவு எண் தட்டச்சு செய்க.</span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                  எடுத்துக்காட்டு:
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
                    <span>{p.tamilName || p.englishName}</span>
                  </button>
                ))}
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
                    முடிவுகள் எதுவும் கிடைக்கவில்லை (No results found)
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    &quot;{query}&quot; க்கு எந்த வாடிக்கையாளர் அல்லது பூஜையும் பொருந்தவில்லை.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate("/app/bookings/new")}
                      className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> புதிய பூஜை பதிவு செய்க
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
                        <User className="w-3.5 h-3.5 text-blue-600" /> பக்தர்கள் / வாடிக்கையாளர்கள் ({filteredCustomers.length})
                      </span>
                      <Link
                        href="/app/customers"
                        onClick={onClose}
                        className="text-[11px] font-bold text-blue-700 hover:underline"
                      >
                        அனைத்தும் →
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
                                  <span>பதிவு செய்</span>
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
                        <Calendar className="w-3.5 h-3.5 text-amber-700" /> பூஜை முன்பதிவுகள் ({filteredBookings.length})
                      </span>
                      <Link
                        href="/app/bookings"
                        onClick={onClose}
                        className="text-[11px] font-bold text-amber-800 hover:underline"
                      >
                        அனைத்தும் →
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
                        <Flame className="w-3.5 h-3.5 text-orange-600" /> பூஜைகள் & ஹோமங்கள் ({filteredPoojas.length})
                      </span>
                      <Link
                        href="/app/poojas"
                        onClick={onClose}
                        className="text-[11px] font-bold text-orange-700 hover:underline"
                      >
                        அனைத்தும் →
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
                                    📦 {p.items.length} பொருட்கள்
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleNavigate(`/app/bookings/new?poojaId=${p.id}`)}
                              className="px-3 py-1.5 bg-orange-700 hover:bg-orange-800 text-white rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 shadow-2xs active:scale-95"
                            >
                              <span>முன்பதிவு</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* DETAILED: Quick Navigation Actions */}
              {(activeCategory === "ALL" || activeCategory === "ACTIONS") &&
                filteredActions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-950 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600" /> விரைவு வழிகள் ({filteredActions.length})
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
                {filteredCustomers.length + filteredBookings.length + filteredPoojas.length} முடிவுகள்
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>Close</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
