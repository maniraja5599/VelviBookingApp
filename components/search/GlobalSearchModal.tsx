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
} from "lucide-react";
import Link from "next/link";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchCategory = "ALL" | "CUSTOMERS" | "BOOKINGS" | "POOJAS" | "ACTIONS";

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<SearchCategory>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery("");
      setActiveCategory("ALL");
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

  // Data fetching
  const customers = useMemo(() => db.getCustomers(businessId), [businessId, isOpen]);
  const bookings = useMemo(() => db.getBookings(businessId), [businessId, isOpen]);
  const poojas = useMemo(() => db.getPoojas(businessId), [businessId, isOpen]);

  const quickActions = useMemo(
    () => [
      {
        id: "new-booking",
        title: "புதிய பூஜை பதிவு (New Booking)",
        subtitle: "Create a new pooja or homam booking for a devotee",
        icon: Sparkles,
        url: "/app/bookings/new",
        color: "text-amber-600 bg-amber-50 border-amber-200",
      },
      {
        id: "calendar",
        title: "நாட்காட்டி & முகூர்த்தம் (Calendar)",
        subtitle: "View calendar, auspicious days, rahu kalam & events",
        icon: Calendar,
        url: "/app/calendar",
        color: "text-emerald-700 bg-emerald-50 border-emerald-200",
      },
      {
        id: "customers",
        title: "வாடிக்கையாளர்கள் (Devotees / Customers)",
        subtitle: "Manage devotee list, history & contacts",
        icon: Users,
        url: "/app/customers",
        color: "text-blue-700 bg-blue-50 border-blue-200",
      },
      {
        id: "poojas",
        title: "பூஜைகள் & கட்டணம் (Pooja Catalog)",
        subtitle: "Manage pooja types, samagri items & rates",
        icon: Flame,
        url: "/app/poojas",
        color: "text-orange-700 bg-orange-50 border-orange-200",
      },
      {
        id: "payments",
        title: "வரவு செலவு & கணக்குகள் (Payments & Reports)",
        subtitle: "Track payments, advance, balances & billing",
        icon: CreditCard,
        url: "/app/payments",
        color: "text-purple-700 bg-purple-50 border-purple-200",
      },
      {
        id: "settings",
        title: "அமைப்புகள் (Settings & Profile)",
        subtitle: "Temple branding, team, language & notifications",
        icon: Settings,
        url: "/app/settings",
        color: "text-slate-700 bg-slate-50 border-slate-200",
      },
    ],
    []
  );

  const cleanQuery = query.trim().toLowerCase();

  // Filtered results
  const filteredCustomers = useMemo(() => {
    if (!cleanQuery) return customers.slice(0, 4);
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(cleanQuery) ||
        (c.mobile && c.mobile.includes(cleanQuery)) ||
        (c.city && c.city.toLowerCase().includes(cleanQuery)) ||
        (c.address && c.address.toLowerCase().includes(cleanQuery))
    );
  }, [customers, cleanQuery]);

  const filteredBookings = useMemo(() => {
    if (!cleanQuery) return bookings.slice(0, 4);
    return bookings.filter(
      (b) =>
        b.bookingNumber?.toLowerCase().includes(cleanQuery) ||
        b.customerName?.toLowerCase().includes(cleanQuery) ||
        b.poojaEnglishName?.toLowerCase().includes(cleanQuery) ||
        (b.poojaTamilName && b.poojaTamilName.toLowerCase().includes(cleanQuery)) ||
        b.date?.includes(cleanQuery) ||
        b.location?.toLowerCase().includes(cleanQuery) ||
        b.status?.toLowerCase().includes(cleanQuery)
    );
  }, [bookings, cleanQuery]);

  const filteredPoojas = useMemo(() => {
    if (!cleanQuery) return poojas.slice(0, 4);
    return poojas.filter(
      (p) =>
        p.englishName.toLowerCase().includes(cleanQuery) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(cleanQuery)) ||
        (p.description && p.description.toLowerCase().includes(cleanQuery))
    );
  }, [poojas, cleanQuery]);

  const filteredActions = useMemo(() => {
    if (!cleanQuery) return quickActions;
    return quickActions.filter(
      (a) =>
        a.title.toLowerCase().includes(cleanQuery) ||
        a.subtitle.toLowerCase().includes(cleanQuery)
    );
  }, [quickActions, cleanQuery]);

  const totalResultsCount =
    (activeCategory === "ALL" || activeCategory === "CUSTOMERS" ? filteredCustomers.length : 0) +
    (activeCategory === "ALL" || activeCategory === "BOOKINGS" ? filteredBookings.length : 0) +
    (activeCategory === "ALL" || activeCategory === "POOJAS" ? filteredPoojas.length : 0) +
    (activeCategory === "ALL" || activeCategory === "ACTIONS" ? filteredActions.length : 0);

  const handleNavigate = (url: string) => {
    onClose();
    router.push(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-3 sm:p-6 sm:pt-16 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center gap-2.5 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/30">
          <Search className="w-5 h-5 text-amber-700 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="தேடுக: பக்தர் பெயர், போன், பூஜை, பதிவு எண்..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 rounded-full hover:bg-slate-200/80 text-slate-500 transition"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Chips */}
        <div className="px-3.5 py-2 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-slate-50/70 text-xs">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition ${
              activeCategory === "ALL"
                ? "bg-emerald-800 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            அனைத்தும் (All)
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("CUSTOMERS")}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 ${
              activeCategory === "CUSTOMERS"
                ? "bg-blue-800 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <User className="w-3 h-3" /> வாடிக்கையாளர்கள் ({filteredCustomers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("BOOKINGS")}
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 ${
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
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 ${
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
            className={`px-3 py-1 rounded-full font-bold whitespace-nowrap transition flex items-center gap-1 ${
              activeCategory === "ACTIONS"
                ? "bg-purple-800 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            }`}
          >
            <Sparkles className="w-3 h-3" /> விரைவு வழிகள்
          </button>
        </div>

        {/* Search Results Body */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-slate-800 divide-y divide-slate-100">
          {totalResultsCount === 0 ? (
            <div className="text-center py-10 px-4">
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
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" /> புதிய பதிவு செய்க
                </button>
              </div>
            </div>
          ) : null}

          {/* Section: Customers */}
          {(activeCategory === "ALL" || activeCategory === "CUSTOMERS") &&
            filteredCustomers.length > 0 && (
              <div className="pt-2 first:pt-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> பக்தர்கள் / வாடிக்கையாளர்கள் ({filteredCustomers.length})
                  </span>
                  <Link
                    href="/app/customers"
                    onClick={onClose}
                    className="text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    அனைத்தும் பார்க்க →
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-300 transition flex items-center justify-between gap-3 group"
                    >
                      <div
                        onClick={() => handleNavigate(`/app/customers`)}
                        className="min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-blue-900 flex items-center gap-1.5">
                          <span>{c.name}</span>
                          {c.city && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              {c.city}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                          {c.mobile ? (
                            <span className="flex items-center gap-0.5 font-medium">
                              <Phone className="w-3 h-3 text-slate-400" /> {c.mobile}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">எண் இல்லை (No phone)</span>
                          )}
                          {c.address && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[150px]">{c.address}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleNavigate(`/app/bookings/new`)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-850 hover:text-emerald-950 border border-emerald-300/80 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1 shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>பதிவு</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Section: Bookings */}
          {(activeCategory === "ALL" || activeCategory === "BOOKINGS") &&
            filteredBookings.length > 0 && (
              <div className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> பூஜை முன்பதிவுகள் ({filteredBookings.length})
                  </span>
                  <Link
                    href="/app/bookings"
                    onClick={onClose}
                    className="text-[11px] font-bold text-amber-800 hover:underline"
                  >
                    அனைத்தும் பார்க்க →
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  {filteredBookings.map((b) => (
                    <div
                      key={b.id}
                      onClick={() => handleNavigate(`/app/bookings/${b.id}`)}
                      className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-amber-900 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-300/60">
                            {b.bookingNumber}
                          </span>
                          <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                            {b.poojaEnglishName}
                          </span>
                          {b.poojaTamilName && b.poojaTamilName !== b.poojaEnglishName && (
                            <span className="text-[11px] text-amber-800 font-medium hidden sm:inline truncate">
                              ({b.poojaTamilName})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                          <span className="font-semibold text-slate-900">👤 {b.customerName}</span>
                          <span>•</span>
                          <span>📅 {b.date} ({b.startTime})</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-800">₹{b.totalAmount?.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1 text-slate-400 group-hover:text-amber-700">
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Section: Poojas */}
          {(activeCategory === "ALL" || activeCategory === "POOJAS") &&
            filteredPoojas.length > 0 && (
              <div className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-orange-900 flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5" /> பூஜைகள் & ஹோமங்கள் ({filteredPoojas.length})
                  </span>
                  <Link
                    href="/app/poojas"
                    onClick={onClose}
                    className="text-[11px] font-bold text-orange-800 hover:underline"
                  >
                    அனைத்தும் பார்க்க →
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredPoojas.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => handleNavigate(`/app/bookings/new?poojaId=${p.id}`)}
                      className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-orange-50/60 border border-slate-200/80 hover:border-orange-300 transition cursor-pointer flex items-center justify-between gap-2 group"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate group-hover:text-orange-950">
                          {p.englishName}
                        </div>
                        {p.tamilName && (
                          <div className="text-[11px] font-medium text-amber-800 truncate">
                            {p.tamilName}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-emerald-800 mt-0.5">
                          <span>₹{p.basePrice?.toLocaleString()}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 font-normal">⏳ {p.durationMinutes || 120}m</span>
                        </div>
                      </div>

                      <span className="text-[10px] font-bold text-orange-800 bg-white px-2 py-1 rounded-lg border border-orange-200 shrink-0 group-hover:bg-orange-600 group-hover:text-white transition">
                        பதிவு →
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Section: Quick Navigation Actions */}
          {(activeCategory === "ALL" || activeCategory === "ACTIONS") &&
            filteredActions.length > 0 && (
              <div className="pt-3 first:pt-0 space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> விரைவு வழிகள் (Quick Actions)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {filteredActions.map((act) => {
                    const IconComponent = act.icon;
                    return (
                      <div
                        key={act.id}
                        onClick={() => handleNavigate(act.url)}
                        className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-purple-50/60 border border-slate-200/80 hover:border-purple-300 transition cursor-pointer flex items-center gap-2.5 group"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${act.color}`}
                        >
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 group-hover:text-purple-950 truncate">
                            {act.title}
                          </div>
                          <div className="text-[10.5px] text-slate-500 truncate">
                            {act.subtitle}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Velvi Smart Search</span>
            <span>•</span>
            <span>பக்தர் / பூஜை / பதிவு எண் தேடலாம்</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-bold"
          >
            மூடு (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
