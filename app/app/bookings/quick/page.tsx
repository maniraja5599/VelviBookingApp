"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db, isLegacyObsoletePooja } from "@/lib/db/store";
import { Booking, Customer, Pooja, BookingItem, BusinessMember, PaymentStatus } from "@/lib/types";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Flame,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  IndianRupee,
  CheckCircle2,
  Sparkles,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  MessageCircle,
  Share2,
  Check,
  CheckSquare,
  Square,
  Users,
  UserCheck,
  RotateCcw,
  Trash2,
  Info,
  Save,
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, getLocalDateString, formatTime12H } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage, formatUnitTamil, formatUnitShort } from "@/lib/whatsapp/formatter";
import { SAMAGRI_CATALOG, SamagriCatalogItem, normalizeCategoryId } from "@/lib/samagri/catalog";
import { getSamagriItemDetail } from "@/lib/samagri/details";
import { getItemIcon } from "@/lib/samagri/icons";
import { getPoojaIcon } from "@/lib/poojas/icons";

const convert24To12 = (timeStr: string): string => {
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return timeStr;
  let h = parseInt(match[1], 10);
  const m = match[2];
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const hStr = h < 10 ? `0${h}` : `${h}`;
  return `${hStr}:${m} ${ampm}`;
};

const formatRangeTo12Hr = (rangeStr: string): string => {
  if (!rangeStr) return "";
  return rangeStr.replace(/\b(\d{1,2}):(\d{2})\b/g, (match, h, m) => {
    return convert24To12(`${h}:${m}`);
  });
};

function QuickBookingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentBusiness, currentUser } = useAuth();
  const businessId = currentBusiness?.id || (currentUser?.id === "u-ravi-iyer-01" ? "biz-venkateswara-01" : currentUser?.id ? `biz-${currentUser.id}` : "");

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [members, setAllMembers] = useState<BusinessMember[]>([]);

  useEffect(() => {
    setCustomers(db.getCustomers(businessId));
    setPoojas(db.getPoojas(businessId).filter((p) => !isLegacyObsoletePooja(p)));
    setAllMembers(db.getMembers(businessId));
  }, [businessId]);

  // Form States - All in ONE page
  // 1. Devotee
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get("customerId") || ""
  );
  const [devoteeSearch, setDevoteeSearch] = useState<string>("");
  const [showAddDevotee, setShowAddDevotee] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");

  // 2. Pooja & Samagri
  const [selectedPoojaId, setSelectedPoojaId] = useState<string>(
    searchParams.get("poojaId") || ""
  );
  const [isItemsExpanded, setIsItemsExpanded] = useState<boolean>(false);
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);

  // 3. Date & Auspicious Time
  const todayStr = getLocalDateString();
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);

  const [date, setDate] = useState<string>(searchParams.get("date") || todayStr);
  const [time, setTime] = useState<string>(searchParams.get("time") || "07:00 AM");

  // Keep route searchParams (e.g. from calendar double-tap or deep links) in sync with component state
  useEffect(() => {
    const paramDate = searchParams.get("date");
    if (paramDate) {
      setDate(paramDate);
      setPaymentDate(paramDate);
    }
    const paramTime = searchParams.get("time");
    if (paramTime) {
      setTime(paramTime);
    }
    const paramCustomerId = searchParams.get("customerId");
    if (paramCustomerId) {
      setSelectedCustomerId(paramCustomerId);
    }
    const paramPoojaId = searchParams.get("poojaId");
    if (paramPoojaId) {
      setSelectedPoojaId(paramPoojaId);
    }
  }, [searchParams]);

  // Generate Upcoming 14 Days for Quick 1-Tap Date Strip (and include selected date if outside window)
  const upcomingDays = useMemo(() => {
    const days = [];
    const base = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNum = d.getDate();
      const monthShort = d.toLocaleDateString("en-US", { month: "short" });
      days.push({
        dateStr,
        dayName,
        dayNum,
        monthShort,
        isToday: i === 0,
        isTomorrow: i === 1,
      });
    }

    // If selected date is outside the 14-day window (e.g. chosen from calendar or date picker)
    if (date && !days.some((d) => d.dateStr === date)) {
      const [y, m, day] = date.split("-").map(Number);
      if (y && m && day) {
        const d = new Date(y, m - 1, day);
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dayNum = d.getDate();
        const monthShort = d.toLocaleDateString("en-US", { month: "short" });
        const customDay = {
          dateStr: date,
          dayName,
          dayNum,
          monthShort,
          isToday: false,
          isTomorrow: false,
        };
        if (date < days[0].dateStr) {
          days.unshift(customDay);
        } else {
          days.push(customDay);
        }
      }
    }

    return days;
  }, [date]);

  // 4. Dakshina & Payment
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "ADVANCE" | "FULL">("UNPAID");
  const [paymentDate, setPaymentDate] = useState<string>(todayStr);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "BANK_TRANSFER" | "CHEQUE">("UPI");
  const [paymentRecipient, setPaymentRecipient] = useState<"BUSINESS" | "PRIEST">("BUSINESS");
  const [priestShareAmount, setPriestShareAmount] = useState<number>(0);
  const [adminCommissionAmount, setAdminCommissionAmount] = useState<number>(0);
  const [splitPreset, setSplitPreset] = useState<"100_PRIEST" | "80_20" | "70_30" | "50_50" | "CUSTOM">("100_PRIEST");
  const [showSplitCard, setShowSplitCard] = useState<boolean>(false);
  const [paymentNotes, setPaymentNotes] = useState<string>("");
  const [isPaymentSaved, setIsPaymentSaved] = useState<boolean>(false);
  const [paymentSavedFeedback, setPaymentSavedFeedback] = useState<string>("");
  const [priestType, setPriestType] = useState<"self" | "other">("self");
  const [assignedIyerId, setAssignedIyerId] = useState<string>("self");
  const [showAddPriest, setShowAddPriest] = useState<boolean>(false);
  const [newPriestName, setNewPriestName] = useState<string>("");
  const [newPriestMobile, setNewPriestMobile] = useState<string>("");
  const [newPriestSpec, setNewPriestSpec] = useState<string>("உதவி குருக்கள்");
  const [priestError, setPriestError] = useState<string>("");
  const [location, setLocation] = useState<string>("Namakkal");
  const [notes, setNotes] = useState<string>("");

  // 5. Booking Expenses State
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState<string>("");
  const [showExpenses, setShowExpenses] = useState<boolean>(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState<boolean>(false);

  // Amount Customization: 1-Click (±100) & Long-Press (±500) Logic
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const justLongPressedRef = useRef<boolean>(false);

  const startAdjustLongPress = (deltaLong: number) => {
    isLongPressActiveRef.current = false;
    justLongPressedRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    if (longPressIntervalRef.current) clearInterval(longPressIntervalRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      justLongPressedRef.current = true;
      setAmount((prev) => Math.max(0, prev + deltaLong));
      longPressIntervalRef.current = setInterval(() => {
        setAmount((prev) => Math.max(0, prev + deltaLong));
      }, 180);
    }, 380);
  };

  const endAdjustLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (longPressIntervalRef.current) {
      clearInterval(longPressIntervalRef.current);
      longPressIntervalRef.current = null;
    }
    setTimeout(() => {
      isLongPressActiveRef.current = false;
      justLongPressedRef.current = false;
    }, 60);
  };

  const handleAdjustClick = (deltaShort: number) => {
    if (isLongPressActiveRef.current || justLongPressedRef.current) {
      return;
    }
    setAmount((prev) => Math.max(0, prev + deltaShort));
  };

  // Samagri Item Management (Checklist Selector & Custom Add)
  const [showAddItem, setShowAddItem] = useState<boolean>(false);
  const [itemSearchQuery, setItemSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCustomItemForm, setShowCustomItemForm] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>("");
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState<string>("nos");

  // Priest Search & Recent Selection State
  const [priestSearch, setPriestSearch] = useState<string>("");
  const [recentPriestIds, setRecentPriestIds] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("velvi_recent_priest_ids");
        return saved ? JSON.parse(saved) : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const saveRecentPriest = (id: string) => {
    if (!id || id === "self") return;
    setRecentPriestIds((prev) => {
      const updated = [id, ...prev.filter((x) => x !== id)].slice(0, 4);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("velvi_recent_priest_ids", JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });
  };

  // Priests eligible for "Other" selection (exclude self if owner/currentUser)
  const otherPriests = useMemo(() => {
    const list = members.filter(
      (m) => m.userId !== currentUser?.id && m.name !== (currentUser?.name || "Ravi Iyer")
    );
    return list.length > 0 ? list : members;
  }, [members, currentUser]);

  // Recent Priests list with auto-backfill from active priests
  const recentPriests = useMemo(() => {
    const list: BusinessMember[] = [];
    recentPriestIds.forEach((id) => {
      const found = otherPriests.find((p) => p.id === id);
      if (found && !list.some((x) => x.id === found.id)) {
        list.push(found);
      }
    });
    if (list.length < 3) {
      const sortedByUsage = [...otherPriests].sort(
        (a, b) => (b.bookingCount || 0) - (a.bookingCount || 0)
      );
      sortedByUsage.forEach((p) => {
        if (list.length < 3 && !list.some((x) => x.id === p.id)) {
          list.push(p);
        }
      });
    }
    return list;
  }, [otherPriests, recentPriestIds]);

  // Filtered priests based on search query (name, mobile, specialization)
  const filteredPriests = useMemo(() => {
    const q = priestSearch.trim().toLowerCase();
    if (!q) return otherPriests;
    return otherPriests.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.mobile && p.mobile.replace(/\D/g, "").includes(q)) ||
        (p.specialization && p.specialization.toLowerCase().includes(q))
    );
  }, [otherPriests, priestSearch]);

  // Celebratory modal
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);

  // 2-Step interactive stage (Stage 1: Devotee & Pooja, Stage 2: Date & Dakshina)
  const [twoStepStage, setTwoStepStage] = useState<1 | 2>(1);
  const [formError, setFormError] = useState<string>("");

  const [highlightedSection, setHighlightedSection] = useState<
    "devotee" | "pooja" | "priest" | "date" | null
  >(null);
  const [highlightPulse, setHighlightPulse] = useState<boolean>(false);
  const poojaHighlightTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Guided step onboarding: As soon as page opens, guide to select devotee with animation then steady light ring
  useEffect(() => {
    if (twoStepStage === 1 && !selectedCustomerId) {
      setHighlightedSection("devotee");
      setHighlightPulse(true);
      const t = setTimeout(() => {
        setHighlightPulse(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (poojaHighlightTimerRef.current) {
        clearTimeout(poojaHighlightTimerRef.current);
      }
    };
  }, []);

  // Handler: When devotee is selected, clear highlight, and 2 seconds later highlight Pooja section
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerId(customerId);
    if (poojaHighlightTimerRef.current) {
      clearTimeout(poojaHighlightTimerRef.current);
    }
    // Clear devotee highlight immediately
    setHighlightedSection(null);
    setHighlightPulse(false);

    // After 2 seconds, highlight pooja if not yet selected
    poojaHighlightTimerRef.current = setTimeout(() => {
      setSelectedPoojaId((currentPooja) => {
        if (!currentPooja) {
          setHighlightedSection("pooja");
          setHighlightPulse(true);
          setTimeout(() => setHighlightPulse(false), 1500);
          const el = document.getElementById("pooja-section");
          if (el) {
            el.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
        return currentPooja;
      });
    }, 2000);
  };

  // Handler: When devotee is changed / cleared, re-highlight devotee
  const handleClearCustomer = () => {
    setSelectedCustomerId("");
    if (poojaHighlightTimerRef.current) {
      clearTimeout(poojaHighlightTimerRef.current);
    }
    setHighlightedSection("devotee");
    setHighlightPulse(true);
    setTimeout(() => setHighlightPulse(false), 1500);
  };

  // Handler: When pooja is selected, clear pooja highlight
  const handleSelectPooja = (poojaId: string) => {
    setSelectedPoojaId(poojaId);
    if (poojaHighlightTimerRef.current) {
      clearTimeout(poojaHighlightTimerRef.current);
    }
    if (highlightedSection === "pooja") {
      setHighlightedSection(null);
      setHighlightPulse(false);
    }
  };

  const showMissingError = (
    section: "devotee" | "pooja" | "priest" | "date",
    message: string
  ) => {
    setFormError(message);
    setHighlightedSection(section);
    setHighlightPulse(true);

    // Instant smooth scroll to the exact missing element
    setTimeout(() => {
      const el = document.getElementById(`${section}-section`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        if (section === "devotee") {
          const input = document.getElementById("devotee-search-input");
          if (input) (input as HTMLElement).focus();
        }
      }
    }, 50);

    // Auto-clear highlight ring after 3.5 seconds
    setTimeout(() => {
      setHighlightPulse(false);
      setHighlightedSection(null);
    }, 3500);
  };

  const validateAndProceedToStep2 = () => {
    if (!selectedCustomerId) {
      showMissingError(
        "devotee",
        "தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select devotee)."
      );
      return;
    }
    if (!selectedPoojaId) {
      showMissingError(
        "pooja",
        "தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select pooja)."
      );
      return;
    }
    setFormError("");
    setHighlightedSection(null);
    setTwoStepStage(2);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  };

  // Enforce top-to-bottom scroll reset whenever user enters Step 2
  useEffect(() => {
    if (twoStepStage === 2 && typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const mainEl = document.querySelector("main");
        if (mainEl) mainEl.scrollTop = 0;
      });
    }
  }, [twoStepStage]);

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showStep2ChecklistPreview, setShowStep2ChecklistPreview] = useState<boolean>(true);

  // Tap & Hold (Long-press) extra details state
  const [activeDetailItemId, setActiveDetailItemId] = useState<string | null>(null);
  const itemLongPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isItemLongPressTriggeredRef = useRef<boolean>(false);

  const activeDetailItem = useMemo(() => {
    if (!activeDetailItemId) return null;
    return samagriItems.find((it) => it.id === activeDetailItemId) || null;
  }, [samagriItems, activeDetailItemId]);

  const handleItemPressStart = (itemId: string) => {
    isItemLongPressTriggeredRef.current = false;
    if (itemLongPressTimerRef.current) clearTimeout(itemLongPressTimerRef.current);
    itemLongPressTimerRef.current = setTimeout(() => {
      isItemLongPressTriggeredRef.current = true;
      if (typeof window !== "undefined" && navigator.vibrate) {
        navigator.vibrate(40);
      }
      setActiveDetailItemId(itemId);
    }, 450);
  };

  const handleItemPressEnd = () => {
    if (itemLongPressTimerRef.current) {
      clearTimeout(itemLongPressTimerRef.current);
      itemLongPressTimerRef.current = null;
    }
  };

  // Sync pooja details & items
  const currentPooja = useMemo(
    () => poojas.find((p) => p.id === selectedPoojaId) || null,
    [poojas, selectedPoojaId]
  );

  const categories = useMemo(() => db.getSamagriCategories(), []);

  const SAMAGRI_CATEGORIES = useMemo(
    () => [
      { id: "all", label: "அனைத்தும்", icon: "✨" },
      ...categories.map((c) => ({
        id: c.id,
        label: c.labelTa,
        icon: c.icon,
      })),
    ],
    [categories]
  );

  // Filter catalog items for "Add Item" Checklist Selector
  const filteredCatalogChecklist = useMemo(() => {
    const q = itemSearchQuery.toLowerCase().trim();
    return SAMAGRI_CATALOG.filter((catItem) => {
      const normCat = normalizeCategoryId(catItem.category);
      const matchesCat =
        selectedCategory === "all" ||
        catItem.category === selectedCategory ||
        normCat === selectedCategory;
      if (!matchesCat) return false;
      if (!q) return true;
      return (
        catItem.ta.toLowerCase().includes(q) ||
        catItem.en.toLowerCase().includes(q)
      );
    });
  }, [itemSearchQuery, selectedCategory]);

  useEffect(() => {
    if (currentPooja) {
      setAmount(currentPooja.basePrice || 5000);
      if (currentPooja.items && currentPooja.items.length > 0) {
        setSamagriItems(
          currentPooja.items.map((it, idx) => ({
            id: `item-${Date.now()}-${idx}`,
            bookingId: "",
            itemEnglishName: it.itemEnglishName,
            itemTamilName: it.itemTamilName,
            quantity: it.quantity,
            unit: it.unit,
            isChecked: true,
            isCustom: false,
          }))
        );
      } else {
        setSamagriItems([]);
      }
    } else {
      setSamagriItems([]);
    }
  }, [currentPooja]);

  // Tamil Date Info
  const tamilInfo = useMemo(() => getTamilDate(date), [date]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedCustomerId),
    [customers, selectedCustomerId]
  );

  const filteredCustomers = useMemo(() => {
    if (!devoteeSearch.trim()) return customers;
    const q = devoteeSearch.toLowerCase().trim();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q))
    );
  }, [customers, devoteeSearch]);

  // Quick Add Devotee Inline
  const handleQuickAddDevotee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName.trim()) return;
    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: newCustMobile.trim(),
      city: newCustCity.trim() || "Namakkal",
    });
    setCustomers(db.getCustomers(businessId));
    handleSelectCustomer(created.id);
    setShowAddDevotee(false);
    setNewCustName("");
    setNewCustMobile("");
  };

  // Smart Step Detector (100 for grams/ml, 1 for counts/pieces)
  const getItemStep = (unit?: string): number => {
    const u = (unit || "").toLowerCase();
    const isWeightOrVolume =
      u.includes("g") ||
      u.includes("கிராம்") ||
      u.includes("ml") ||
      u.includes("மில்லி") ||
      u.includes("gram");
    return isWeightOrVolume ? 100 : 1;
  };

  // Handle Samagri Item Quantity Controls (Supports 100-step decrement/increment)
  const handleItemQuantityChange = (id: string, direction: number) => {
    setSamagriItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const currentQty =
          typeof it.quantity === "number" ? it.quantity : parseFloat(String(it.quantity)) || 1;
        const step = getItemStep(it.unit);
        const delta = direction * step;
        const minQty = step === 100 ? (currentQty <= 100 && currentQty > 50 ? 50 : step === 100 && currentQty <= 50 ? 25 : 50) : 1;
        const nextQty = Math.max(minQty, currentQty + delta);
        return { ...it, quantity: nextQty };
      })
    );
  };

  const handleItemDirectQuantity = (id: string, newQtyStr: string) => {
    const parsed = parseFloat(newQtyStr);
    setSamagriItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        return { ...it, quantity: isNaN(parsed) ? 1 : Math.max(1, parsed) };
      })
    );
  };

  // 12-Hour Time Parser & Interactive Updaters
  const parsedTime = useMemo(() => {
    const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (match) {
      const rawH = parseInt(match[1], 10);
      const h = rawH > 12 ? rawH % 12 : rawH === 0 ? 12 : rawH;
      const hStr = h.toString().padStart(2, "0");
      const m = match[2];
      const p = match[3].toUpperCase() as "AM" | "PM";
      return { hour: hStr, minute: m, period: p };
    }
    return { hour: "07", minute: "00", period: "AM" as "AM" | "PM" };
  }, [time]);

  const updateTimeSlot = (newHour?: string, newMinute?: string, newPeriod?: "AM" | "PM") => {
    const h = newHour !== undefined ? newHour : parsedTime.hour;
    const m = newMinute !== undefined ? newMinute : parsedTime.minute;
    const p = newPeriod !== undefined ? newPeriod : parsedTime.period;
    setTime(`${h}:${m} ${p}`);
  };

  // Toggle Item checked/unchecked
  const handleToggleItem = (id: string) => {
    setSamagriItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isChecked: !it.isChecked } : it))
    );
  };

  // Toggle Catalog Item in/out of Booking (Checklist Selector)
  const handleToggleCatalogItem = (catalogItem: SamagriCatalogItem) => {
    const existing = samagriItems.find(
      (it) =>
        it.itemTamilName?.toLowerCase() === catalogItem.ta.toLowerCase() ||
        it.itemEnglishName?.toLowerCase() === catalogItem.en.toLowerCase()
    );

    if (existing) {
      // If already in list: remove from list
      setSamagriItems((prev) => prev.filter((it) => it.id !== existing.id));
    } else {
      // Add to list, checked by default
      const newItem: BookingItem = {
        id: `item-${Date.now()}-${samagriItems.length + 1}`,
        bookingId: "",
        itemEnglishName: catalogItem.en,
        itemTamilName: catalogItem.ta,
        quantity: catalogItem.qty,
        unit: catalogItem.unit,
        category: catalogItem.category,
        isChecked: true, // Selected by default
        isCustom: false,
      };
      setSamagriItems((prev) => [...prev, newItem]);
    }
  };

  // Add New Custom Item
  const handleAddCustomItem = () => {
    const name = (customItemName.trim() || itemSearchQuery.trim());
    if (!name) return;
    const newItem: BookingItem = {
      id: `custom-${Date.now()}`,
      bookingId: "",
      itemEnglishName: name,
      itemTamilName: name,
      quantity: customItemQty > 0 ? customItemQty : 1,
      unit: customItemUnit.trim() || "nos",
      isChecked: true, // Selected by default
      isCustom: true,
    };
    setSamagriItems((prev) => [...prev, newItem]);
    setCustomItemName("");
    setItemSearchQuery("");
    setCustomItemQty(1);
    setCustomItemUnit("nos");
    setShowCustomItemForm(false);
  };

  // Remove Item
  const handleRemoveItem = (id: string) => {
    setSamagriItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Current Paid Amount Calculation
  const currentPaidAmount = useMemo(() => {
    if (paymentChoice === "FULL") return amount;
    if (paymentChoice === "ADVANCE") return advanceAmount;
    return 0;
  }, [paymentChoice, amount, advanceAmount]);

  const applySplitPreset = (
    preset: "100_PRIEST" | "80_20" | "70_30" | "50_50" | "CUSTOM",
    total: number = currentPaidAmount
  ) => {
    setSplitPreset(preset);
    setIsPaymentSaved(false);
    if (preset === "100_PRIEST") {
      setPriestShareAmount(total);
      setAdminCommissionAmount(0);
    } else if (preset === "80_20") {
      const pShare = Math.round(total * 0.8);
      setPriestShareAmount(pShare);
      setAdminCommissionAmount(total - pShare);
    } else if (preset === "70_30") {
      const pShare = Math.round(total * 0.7);
      setPriestShareAmount(pShare);
      setAdminCommissionAmount(total - pShare);
    } else if (preset === "50_50") {
      const pShare = Math.round(total * 0.5);
      setPriestShareAmount(pShare);
      setAdminCommissionAmount(total - pShare);
    }
  };

  const handlePriestShareChange = (val: number) => {
    setSplitPreset("CUSTOM");
    setPriestShareAmount(val);
    setAdminCommissionAmount(Math.max(0, currentPaidAmount - val));
    setIsPaymentSaved(false);
  };

  const handleAdminCommissionChange = (val: number) => {
    setSplitPreset("CUSTOM");
    setAdminCommissionAmount(val);
    setPriestShareAmount(Math.max(0, currentPaidAmount - val));
    setIsPaymentSaved(false);
  };

  // Keep priest share and admin commission synchronized when total paid changes
  useEffect(() => {
    if (currentPaidAmount > 0) {
      if (splitPreset !== "CUSTOM") {
        applySplitPreset(splitPreset, currentPaidAmount);
      } else if (priestShareAmount === 0 && adminCommissionAmount === 0) {
        if (paymentRecipient === "PRIEST") {
          setPriestShareAmount(currentPaidAmount);
          setAdminCommissionAmount(0);
        } else {
          setAdminCommissionAmount(currentPaidAmount);
          setPriestShareAmount(0);
        }
      }
    }
  }, [currentPaidAmount, splitPreset, paymentRecipient]);

  // Handle Payment Choice
  const handlePaymentChoiceChange = (choice: "UNPAID" | "ADVANCE" | "FULL") => {
    setPaymentChoice(choice);
    setIsPaymentSaved(false);
    setPaymentSavedFeedback("");
    if (choice === "UNPAID") {
      setAdvanceAmount(0);
    } else if (choice === "FULL") {
      setAdvanceAmount(amount);
    } else if (choice === "ADVANCE" && advanceAmount === 0) {
      setAdvanceAmount(Math.round(amount / 2));
    }
  };

  // Save / Record Payment Details in New Booking
  const handleSavePaymentDetails = () => {
    setIsPaymentSaved(true);
    if (paymentChoice === "UNPAID") {
      setPaymentSavedFeedback("கட்டண நிலை: நிலுவை (Pending) என உறுதி செய்யப்பட்டது.");
    } else {
      const amt = paymentChoice === "FULL" ? amount : advanceAmount;
      const methodLabel =
        paymentMethod === "UPI"
          ? "GPay / UPI"
          : paymentMethod === "CASH"
          ? "ரொக்கம்"
          : paymentMethod === "BANK_TRANSFER"
          ? "வங்கி"
          : "காசோலை";
      const recipientLabel = paymentRecipient === "PRIEST" ? "வாத்யாரிடம் நேரடி" : "நிர்வாகக் கணக்கு";
      
      let splitInfo = "";
      if (paymentRecipient === "PRIEST" || showSplitCard || priestShareAmount > 0 || adminCommissionAmount > 0) {
        splitInfo = ` (👤 வாத்யார்: ₹${priestShareAmount.toLocaleString("en-IN")} • 🏛️ கமிஷன்: ₹${adminCommissionAmount.toLocaleString("en-IN")})`;
      }

      setPaymentSavedFeedback(
        `✓ ₹${amt.toLocaleString("en-IN")} • ${recipientLabel}${splitInfo} • ${methodLabel} — ${paymentDate} அன்று பதிவு செய்யப்பட்டது!`
      );
    }
  };

  // Quick Add Priest Inline
  const handleQuickAddPriest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newPriestName.trim()) {
      setPriestError("தயவுசெய்து குருக்களின் பெயரை உள்ளிடவும் (Please enter priest name)");
      return;
    }
    setPriestError("");
    const created = db.createMember({
      businessId,
      name: newPriestName.trim(),
      mobile: newPriestMobile.trim(),
      role: "IYER",
      specialization: newPriestSpec.trim() || "உதவி குருக்கள் (Assistant Priest)",
    });
    setAllMembers(db.getMembers(businessId));
    setPriestType("other");
    setAssignedIyerId(created.id);
    saveRecentPriest(created.id);
    setShowAddPriest(false);
    setNewPriestName("");
    setNewPriestMobile("");
    setNewPriestSpec("உதவி குருக்கள்");
  };

  // Open Preview Modal
  const handleOpenPreview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      setTwoStepStage(1);
      showMissingError(
        "devotee",
        "தயவுசெய்து ஒரு பக்தரைத் தேர்ந்தெடுக்கவும் (Please select devotee)."
      );
      return;
    }
    if (!currentPooja) {
      setTwoStepStage(1);
      showMissingError(
        "pooja",
        "தயவுசெய்து ஒரு பூஜையைத் தேர்ந்தெடுக்கவும் (Please select pooja)."
      );
      return;
    }
    if (priestType === "other" && (!assignedIyerId || assignedIyerId === "self")) {
      const fallbackPick = recentPriests[0]?.id || otherPriests[0]?.id || members[0]?.id;
      if (fallbackPick) {
        setAssignedIyerId(fallbackPick);
        saveRecentPriest(fallbackPick);
      }
    }
    setFormError("");
    setShowPreviewModal(true);
  };

  // Final Create Booking Action
  const handleFinalConfirmBooking = () => {
    if (!selectedCustomer || !currentPooja || isSubmittingBooking) return;
    setIsSubmittingBooking(true);

    const effectivePriestId = priestType === "self" ? "self" : assignedIyerId;
    const assignedMember = members.find((m) => m.id === effectivePriestId);
    const performingName =
      priestType === "self"
        ? currentUser?.name || "Ravi Iyer"
        : assignedMember?.name || "Assigned Priest";

    const paymentStatus: PaymentStatus =
      paymentChoice === "FULL"
        ? "PAID"
        : paymentChoice === "ADVANCE"
        ? "PARTIALLY_PAID"
        : "PENDING";

    const isDemoUser = db.isDemoBusiness(businessId);
    const existingBookingsCount = db.getBookings(businessId).length;
    if (isDemoUser && existingBookingsCount >= 20) {
      alert("இலவச மாதிரி வரம்பு நிறைவடைந்தது (அதிகபட்சம் 20 முன்பதிவுகள் மட்டுமே அனுமதிக்கப்படும்). புதிய முன்பதிவுகளை தொடர்ந்து உருவாக்க Velvi Pro திட்டத்திற்கு மேம்படுத்தவும். (Free Demo limit reached: Maximum 20 bookings allowed. Please upgrade to Velvi Pro for unlimited bookings.)");
      setIsSubmittingBooking(false);
      return;
    }

    try {
      const idempotencyKey = `bk-${businessId}-${selectedCustomer.id}-${currentPooja.id}-${date}-${time.replace(/\s+/g, "")}-${Date.now().toString().slice(0, 8)}`;
      const newBooking = db.createBooking({
        businessId,
        customerId: selectedCustomer.id,
        customerName: selectedCustomer.name,
        customerMobile: selectedCustomer.mobile,
        customerAddress: selectedCustomer.address || location,
        poojaId: currentPooja.id,
        poojaEnglishName: currentPooja.englishName,
        poojaTamilName: currentPooja.tamilName,
        date,
        startTime: formatTime12H(time),
        endTime: formatTime12H(time),
        durationMinutes: currentPooja.durationMinutes || 120,
        totalAmount: amount,
        advanceAmount: paymentChoice === "UNPAID" ? 0 : advanceAmount,
        balanceAmount: Math.max(0, amount - (paymentChoice === "UNPAID" ? 0 : advanceAmount)),
        paymentStatus,
        paymentDate: paymentChoice !== "UNPAID" ? paymentDate : undefined,
        paymentMethod: paymentChoice !== "UNPAID" ? paymentMethod : undefined,
        paymentRecipient: paymentChoice !== "UNPAID" ? paymentRecipient : undefined,
        priestShareAmount: paymentChoice !== "UNPAID" ? (paymentRecipient === "PRIEST" || showSplitCard || priestShareAmount > 0 ? priestShareAmount : 0) : undefined,
        adminCommissionAmount: paymentChoice !== "UNPAID" ? (paymentRecipient === "PRIEST" || showSplitCard || adminCommissionAmount > 0 ? adminCommissionAmount : (paymentRecipient === "BUSINESS" ? currentPaidAmount : 0)) : undefined,
        paymentNotes: paymentChoice !== "UNPAID" && paymentNotes.trim() ? paymentNotes.trim() : undefined,
        status: "CONFIRMED",
        assignedIyerId: effectivePriestId === "self" ? "m-owner-01" : effectivePriestId,
        assignedIyerName: performingName,
        location: location || selectedCustomer.city || "Namakkal",
        expenseAmount: expenseAmount || 0,
        expenseNotes: expenseNotes || "",
        notes: notes.trim(),
        items: samagriItems,
        idempotencyKey,
      } as any);

      setShowPreviewModal(false);
      setCreatedBooking(newBooking);
    } catch (err: any) {
      alert(err.message || "Failed to create booking");
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!createdBooking || !currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(createdBooking, currentBusiness);
    const phone = createdBooking.customerMobile ? createdBooking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-44 animate-in fade-in duration-200">
      {/* Top Header & Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app/bookings"
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200 shadow-2xs transition active:scale-95"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                New Booking
              </h1>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 bg-slate-900 text-amber-300 rounded-full border border-slate-700/60 shadow-2xs tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                2-Step Quick Booking
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Step 1: Devotee &amp; Pooja • Step 2: Date &amp; Dakshina
            </p>
          </div>
        </div>

        <Link
          href="/app/bookings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      {/* Demo User Limit Counter (Only shown when demo limit is reached) */}
      {db.isDemoBusiness(businessId) && (() => {
        const count = db.getBookings(businessId).length;
        const isLimitReached = count >= 20;
        if (!isLimitReached) return null;
        return (
          <div className="p-3 sm:p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 shadow-2xs bg-rose-50 border-rose-200 text-rose-950">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-rose-200 text-rose-800">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="font-extrabold flex items-center gap-1.5 flex-wrap">
                  <span>இலவச டெமோ வரம்பு நிறைவடைந்தது (20/20 முன்பதிவுகள்)</span>
                  <span className="text-[9.5px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider bg-rose-600 text-white">
                    Limit Reached
                  </span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  புதிய முன்பதிவுகளை தொடர்ந்து பதிவு செய்ய Velvi Pro திட்டத்திற்கு மேம்படுத்தவும்.
                </p>
              </div>
            </div>

            <Link
              href="/app/subscription"
              className="px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl font-bold text-xs shrink-0 shadow-2xs transition active:scale-95 whitespace-nowrap"
            >
              Upgrade Pro →
            </Link>
          </div>
        );
      })()}

      <form onSubmit={handleOpenPreview} className="space-y-4">
        {/* 2-Step Segmented Switcher (Clean Home Page Subtab Aesthetic) */}
        <div className="grid grid-cols-2 gap-1 bg-slate-200/90 p-1 rounded-2xl text-xs font-bold shadow-2xs">
          <button
            type="button"
            onClick={() => {
              setFormError("");
              setTwoStepStage(1);
            }}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              twoStepStage === 1
                ? "bg-white text-emerald-950 shadow-xs font-black ring-1 ring-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>1. Devotee &amp; Pooja</span>
            {selectedCustomerId && selectedPoojaId && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
          </button>
          <button
            type="button"
            onClick={validateAndProceedToStep2}
            className={`py-2 px-3 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              twoStepStage === 2
                ? "bg-white text-emerald-950 shadow-xs font-black ring-1 ring-emerald-600/20"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>2. Date &amp; Dakshina</span>
          </button>
        </div>

        {/* Form Validation Error Alert */}
        {formError && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold animate-in fade-in flex items-center justify-between">
            <span>⚠️ {formError}</span>
            <button
              type="button"
              onClick={() => setFormError("")}
              className="text-rose-600 text-xs font-black cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1 CONTAINER: DEVOTEE & POOJA                                */}
        {/* ================================================================= */}
        {twoStepStage === 1 && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* SECTION 1: DEVOTEE SELECTION */}
            <div
              id="devotee-section"
              className={`animate-section-1 bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3.5 transition-all duration-300 ${
                highlightedSection === "devotee"
                  ? highlightPulse
                    ? "ring-4 ring-rose-400/80 border-2 border-rose-500 shadow-xl shadow-rose-500/25 animate-pulse"
                    : "ring-4 ring-rose-200/80 border-2 border-rose-400 shadow-md shadow-rose-200/30"
                  : "border-slate-200/90"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                      highlightedSection === "devotee"
                        ? "bg-rose-500 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950">
                    1. பக்தர் விவரம் (Devotee)
                  </h2>
                  {highlightedSection === "devotee" && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 animate-in fade-in">
                      தேர்வு தேவை ⚠️
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDevotee((prev) => !prev)}
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>{showAddDevotee ? "Close" : "Add"}</span>
                </button>
              </div>

              {/* Devotee Search Bar with Search Icon */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="devotee-search-input"
                  type="text"
                  placeholder="Search devotee by name or mobile..."
                  value={devoteeSearch}
                  onChange={(e) => setDevoteeSearch(e.target.value)}
                  className={`w-full pl-8 pr-8 py-1.5 bg-slate-50 border rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition ${
                    highlightedSection === "devotee"
                      ? "border-rose-400 focus:border-rose-600 ring-2 ring-rose-200/70"
                      : "border-slate-200 focus:border-amber-500"
                  }`}
                />
                {devoteeSearch && (
                  <button
                    type="button"
                    onClick={() => setDevoteeSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Inline Add Devotee Form */}
              {showAddDevotee && (
                <div className="p-3 bg-amber-50/60 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
                  <span className="text-[11px] font-bold text-amber-950 block">
                    புதிய பக்தரை விரைவாகச் சேர்க்க:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="பக்தர் பெயர் (Name) *"
                      value={newCustName}
                      onChange={(e) => setNewCustName(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="tel"
                      placeholder="மொபைல் எண் (Mobile)"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="ஊர் (City)"
                        value={newCustCity}
                        onChange={(e) => setNewCustCity(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={handleQuickAddDevotee}
                        className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Devotee 1-Tap Chips */}
              <div>
                <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5 uppercase tracking-wider">
                  1-Tap Quick Select {devoteeSearch ? `(Results: ${filteredCustomers.length})` : "(அடிக்கடி வரும் பக்தர்கள்):"}
                </span>
                {filteredCustomers.length > 0 ? (
                  <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {filteredCustomers.slice(0, 8).map((c) => {
                      const isSelected = selectedCustomerId === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => handleSelectCustomer(c.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 border shadow-2xs active:scale-95 cursor-pointer ${
                            isSelected
                              ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>{c.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 text-center font-medium">
                    பக்தர் கிடைக்கவில்லை. புதிய பக்தரைச் சேர்க்க மேலே உள்ள <strong>+ Add</strong> கிளிக் செய்யவும்.
                  </div>
                )}
              </div>

              {/* Selected Customer Active Card (Shown only when a devotee is picked) */}
              {selectedCustomer && (
                <div className="bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-3 rounded-2xl border border-emerald-300 flex items-center justify-between text-xs animate-in fade-in">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {selectedCustomer.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="font-extrabold text-slate-900 text-xs sm:text-sm">
                        {selectedCustomer.name}
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2">
                        {selectedCustomer.mobile && <span>📱 {selectedCustomer.mobile}</span>}
                        {selectedCustomer.city && <span>📍 {selectedCustomer.city}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearCustomer}
                    className="text-[10px] font-bold text-slate-400 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition cursor-pointer"
                    title="Change Devotee"
                  >
                    மாற்று ✕
                  </button>
                </div>
              )}
            </div>

            {/* ================================================================= */}
            {/* SECTION 2: POOJA & SAMAGRI CHECKLIST                              */}
            {/* ================================================================= */}
            <div
              id="pooja-section"
              className={`animate-section-2 bg-white rounded-3xl p-4 sm:p-5 border shadow-2xs space-y-3.5 transition-all duration-300 ${
                highlightedSection === "pooja"
                  ? highlightPulse
                    ? "ring-4 ring-rose-400/80 border-2 border-rose-500 shadow-xl shadow-rose-500/25 animate-pulse"
                    : "ring-4 ring-rose-200/80 border-2 border-rose-400 shadow-md shadow-rose-200/30"
                  : "border-slate-200/90"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs transition-colors ${
                      highlightedSection === "pooja"
                        ? "bg-rose-500 text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${highlightedSection === "pooja" ? "text-white" : "text-emerald-700"}`} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    2. பூஜை &amp; சாக்கிரிகள் (Pooja &amp; Samagri)
                  </h2>
                  {highlightedSection === "pooja" && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full border border-rose-300 animate-in fade-in">
                      தேர்வு தேவை ⚠️
                    </span>
                  )}
                </div>

                <Link
                  href="/app/poojas?action=new&returnTo=booking"
                  className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-xl border border-amber-300 flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-700" />
                  <span>Add Pooja</span>
                </Link>
              </div>

              {/* 1-Tap Pooja Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {poojas.slice(0, 6).map((p) => {
                  const isSelected = selectedPoojaId === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleSelectPooja(p.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between shadow-2xs active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-50 to-emerald-100/90 border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs"
                          : "bg-slate-50/70 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="text-base shrink-0 p-1 bg-white rounded-lg border border-slate-200/80 shadow-2xs">
                          {getPoojaIcon(p)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-slate-900 truncate">
                            {p.englishName}
                          </div>
                          {p.tamilName && (
                            <div className="text-[10.5px] text-emerald-900 font-bold truncate">
                              {p.tamilName}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-extrabold text-slate-900">
                          ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                        </span>
                        {isSelected && (
                          <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-200/80 px-1 py-0.2 rounded">
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Step 1 Dakshina Customizer (Current Booking Only) */}
              {currentPooja && (
                <div className="p-3 bg-gradient-to-r from-emerald-50/70 via-white to-amber-50/50 rounded-2xl border border-emerald-200/80 space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-black text-slate-800">
                        தட்சணை தொகை (Dakshina Amount)
                      </span>
                      <span className="text-[9.5px] font-extrabold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full border border-amber-200">
                        இந்தப் பதிவுக்கு மட்டும்
                      </span>
                    </div>

                    {amount !== currentPooja.basePrice && (
                      <button
                        type="button"
                        onClick={() => setAmount(currentPooja.basePrice || 0)}
                        className="text-[10px] font-bold text-slate-500 hover:text-emerald-700 bg-white hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-slate-200 transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                        title="Reset to base price"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span>இயல்பு நிலை: ₹{(currentPooja.basePrice || 0).toLocaleString("en-IN")}</span>
                      </button>
                    )}
                  </div>

                  {/* Increment / Decrement & Manual Number Edit Controls */}
                  <div className="flex items-center gap-2">
                    {/* Decrement Button: 1-click (-100) & Long Press (-500) */}
                    <button
                      type="button"
                      onClick={() => handleAdjustClick(-100)}
                      onMouseDown={() => startAdjustLongPress(-500)}
                      onMouseUp={endAdjustLongPress}
                      onMouseLeave={endAdjustLongPress}
                      onTouchStart={() => startAdjustLongPress(-500)}
                      onTouchEnd={endAdjustLongPress}
                      onTouchCancel={endAdjustLongPress}
                      className="w-10 h-10 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-800 hover:text-rose-700 flex items-center justify-center font-black text-lg shadow-2xs active:scale-95 transition cursor-pointer select-none shrink-0"
                      title="1-கிளிக்: -₹100 | அழுத்திப் பிடித்தால்: -₹500"
                    >
                      -
                    </button>

                    {/* Direct Manual Number Input */}
                    <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="50"
                        value={amount}
                        onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-xl pl-8 pr-3 py-2 text-base font-black text-slate-900 text-center focus:outline-none shadow-2xs transition"
                      />
                    </div>

                    {/* Increment Button: 1-click (+100) & Long Press (+500) */}
                    <button
                      type="button"
                      onClick={() => handleAdjustClick(100)}
                      onMouseDown={() => startAdjustLongPress(500)}
                      onMouseUp={endAdjustLongPress}
                      onMouseLeave={endAdjustLongPress}
                      onTouchStart={() => startAdjustLongPress(500)}
                      onTouchEnd={endAdjustLongPress}
                      onTouchCancel={endAdjustLongPress}
                      className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-black text-lg shadow-2xs active:scale-95 transition cursor-pointer select-none shrink-0"
                      title="1-கிளிக்: +₹100 | அழுத்திப் பிடித்தால்: +₹500"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold px-1">
                    <span>💡 1-கிளிக்: ₹100 | அழுத்திப் பிடித்தால்: ₹500</span>
                    {amount !== currentPooja.basePrice && (
                      <span className="text-emerald-700">
                        வேறுபாடு: {(amount - (currentPooja.basePrice || 0)) > 0 ? "+" : ""}
                        ₹{(amount - (currentPooja.basePrice || 0)).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Inline Samagri Checklist (Always Shown, All Selected by Default, No Select-All button) */}
              {samagriItems.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  {/* Header: Title, Live Count & Add Item Button */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                        <CheckSquare className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                          சாமக்கிரி பொருட்கள் ({samagriItems.filter((i) => i.isChecked !== false).length} / {samagriItems.length} தேர்வு)
                        </h3>
                        <span className="text-[10px] text-emerald-800 font-bold">
                          அனைத்தும் தேர்வாகியுள்ளன (வரிசையைத் தொட்டு மாற்றலாம்)
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAddItem(!showAddItem);
                        setItemSearchQuery("");
                        setSelectedCategory("all");
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black transition active:scale-95 shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-300" />
                      <span>{showAddItem ? "மூடுக (Close)" : "பொருள் தேர்வு / சேர்க்க"}</span>
                    </button>
                  </div>

                  {/* Smart Checklist Selector: Category Tabs + Live Search + Tick/Untick Items */}
                  {showAddItem && (
                    <div className="p-3.5 bg-gradient-to-br from-amber-50/90 via-white to-emerald-50/60 rounded-2xl border border-amber-300 shadow-xs space-y-2.5 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-950">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                          <span>சாமக்கிரி தேர்வு செக்-லிஸ்ட் (Checklist Selector)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAddItem(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* 1. Search Bar */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={itemSearchQuery}
                          onChange={(e) => setItemSearchQuery(e.target.value)}
                          placeholder="பொருளைத் தேடுக... (மஞ்சள், நெய், தேங்காய், சந்தனம், camphor)..."
                          className="w-full pl-9 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition shadow-2xs"
                        />
                        {itemSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setItemSearchQuery("")}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Category Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                        {SAMAGRI_CATEGORIES.map((cat) => {
                          const isCatActive = selectedCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedCategory(cat.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 border cursor-pointer ${
                                isCatActive
                                  ? "bg-emerald-800 text-amber-200 border-emerald-900 shadow-2xs"
                                  : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Quick Custom Item Add If Search Doesn't Match Exactly */}
                      {itemSearchQuery.trim() &&
                        !SAMAGRI_CATALOG.some(
                          (c) =>
                            c.ta.toLowerCase() === itemSearchQuery.toLowerCase() ||
                            c.en.toLowerCase() === itemSearchQuery.toLowerCase()
                        ) && (
                          <div className="p-2 bg-amber-100/70 border border-amber-300 rounded-xl flex items-center justify-between gap-2 text-xs">
                            <span className="font-extrabold text-amber-950 truncate">
                              &quot;{itemSearchQuery.trim()}&quot; பட்டியலில் இல்லை
                            </span>
                            <button
                              type="button"
                              onClick={handleAddCustomItem}
                              className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-black text-xs transition active:scale-95 shrink-0 shadow-2xs flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>புதிய பொருளாக சேர்</span>
                            </button>
                          </div>
                        )}

                      {/* The Master Checklist (Tick/Untick to Add/Remove from Booking) */}
                      <div className="max-h-56 overflow-y-auto space-y-1 pr-0.5">
                        {filteredCatalogChecklist.map((catItem) => {
                          const isAlreadyAdded = samagriItems.some(
                            (it) =>
                              it.itemTamilName?.toLowerCase() === catItem.ta.toLowerCase() ||
                              it.itemEnglishName?.toLowerCase() === catItem.en.toLowerCase()
                          );

                          return (
                            <div
                              key={catItem.id}
                              onClick={() => handleToggleCatalogItem(catItem)}
                              className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition cursor-pointer select-none ${
                                isAlreadyAdded
                                  ? "bg-emerald-100/80 border-emerald-400 text-emerald-950 shadow-2xs font-bold"
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                {isAlreadyAdded ? (
                                  <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white shrink-0 hover:border-emerald-600" />
                                )}
                                <span className="text-base shrink-0">
                                  {getItemIcon({ itemTamilName: catItem.ta, itemEnglishName: catItem.en, category: catItem.category })}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <span className="text-xs font-black truncate block">
                                    {catItem.ta}
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-medium truncate block">
                                    {catItem.en}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                  {catItem.qty} {formatUnitShort(catItem.unit)}
                                </span>
                                {isAlreadyAdded ? (
                                  <span className="text-[10px] font-bold text-emerald-800">
                                    Done ✓
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-xs font-black">
                                    + சேர்
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expandable Manual Custom Item Form */}
                      <div className="pt-2 border-t border-amber-200/60">
                        <button
                          type="button"
                          onClick={() => setShowCustomItemForm(!showCustomItemForm)}
                          className="text-[11px] font-bold text-amber-900 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-amber-700" />
                          <span>வேறு புதிய தனிப்பயன் பொருள் சேர்க்க (Type Custom Item)</span>
                        </button>

                        {showCustomItemForm && (
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-1.5 mt-2 animate-in fade-in">
                            <input
                              type="text"
                              value={customItemName}
                              onChange={(e) => setCustomItemName(e.target.value)}
                              placeholder="பொருளின் பெயர் (எ.கா: பன்னீர் ரோஜா)"
                              className="sm:col-span-6 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                            />
                            <div className="sm:col-span-6 flex items-center gap-1">
                              <input
                                type="number"
                                min="1"
                                value={customItemQty}
                                onChange={(e) => setCustomItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-14 bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-black text-center text-slate-900 focus:outline-none shadow-2xs"
                                placeholder="அளவு"
                                title="அளவு"
                              />
                              <input
                                type="text"
                                value={customItemUnit}
                                onChange={(e) => setCustomItemUnit(e.target.value)}
                                placeholder="அலகு"
                                className="w-16 bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-bold text-center text-slate-900 focus:outline-none shadow-2xs"
                                title="அலகு"
                              />
                              <button
                                type="button"
                                onClick={handleAddCustomItem}
                                className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
                              >
                                சேர்
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* The Booking Items Checklist rendered in ONE SINGLE LINE (1, 2, 3.. செக்-லிஸ்ட் வடிவம்) */}
                  <div className="space-y-1.5">
                    {samagriItems.map((it, idx) => {
                      const isChecked = it.isChecked !== false;
                      const step = getItemStep(it.unit);
                      return (
                        <div
                          key={it.id}
                          className={`p-2 sm:p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 transition ${
                            isChecked
                              ? "bg-white hover:bg-emerald-50/30 border-emerald-300/80 shadow-2xs"
                              : "bg-slate-50 border-slate-200 text-slate-400 opacity-60"
                          }`}
                        >
                          {/* Left: Checkbox + Number + Tamil Name + English Subtitle + Tap & Hold Trigger */}
                          <div
                            onTouchStart={() => handleItemPressStart(it.id)}
                            onTouchEnd={handleItemPressEnd}
                            onTouchMove={handleItemPressEnd}
                            onMouseDown={() => handleItemPressStart(it.id)}
                            onMouseUp={handleItemPressEnd}
                            onMouseLeave={handleItemPressEnd}
                            onClick={() => {
                              if (isItemLongPressTriggeredRef.current) {
                                isItemLongPressTriggeredRef.current = false;
                                return;
                              }
                              handleToggleItem(it.id);
                            }}
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                            title="தொட்டு தேர்வு செய்க / அழுத்திப் பிடித்தால் (Tap & Hold) கூடுதல் விவரம்"
                          >
                            {isChecked ? (
                              <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white shrink-0 hover:border-emerald-600" />
                            )}
                            <span className="text-base shrink-0">
                              {getItemIcon(it, it.category)}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-black text-slate-900 truncate">
                                {idx + 1}. {it.itemTamilName || it.itemEnglishName}
                              </div>
                              {it.itemEnglishName && it.itemTamilName && it.itemEnglishName !== it.itemTamilName && (
                                <div className="text-[10px] text-slate-400 font-medium truncate">
                                  {it.itemEnglishName}
                                </div>
                              )}
                            </div>
                            {it.isCustom && (
                              <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                                புதியது
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveDetailItemId(it.id);
                              }}
                              className="w-5 h-5 rounded-full text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 transition flex items-center justify-center shrink-0 cursor-pointer"
                              title="கூடுதல் விவரங்கள் (Extra Details)"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Right: Fixed-width Uniform Controls (Stepper w-[84px] + Unit w-11 + Trash w-6) */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Stepper with [-] and [+] strictly fixed width w-[88px] */}
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs w-[88px] justify-between">
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(it.id, -1)}
                                disabled={!isChecked}
                                className="w-6 h-6 rounded bg-white hover:bg-slate-100 disabled:opacity-30 text-slate-700 flex items-center justify-center font-black text-xs transition active:scale-95 shadow-2xs cursor-pointer"
                                title={`குறைக்க (-${step})`}
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                disabled={!isChecked}
                                value={it.quantity}
                                onChange={(e) => handleItemDirectQuantity(it.id, e.target.value)}
                                className="w-9 text-center text-xs font-black bg-transparent text-slate-900 focus:outline-none"
                                title="அளவு"
                              />
                              <button
                                type="button"
                                onClick={() => handleItemQuantityChange(it.id, 1)}
                                disabled={!isChecked}
                                className="w-6 h-6 rounded bg-emerald-700 hover:bg-emerald-800 disabled:opacity-30 text-white flex items-center justify-center font-black text-xs transition active:scale-95 shadow-2xs cursor-pointer"
                                title={`அதிகரிக்க (+${step})`}
                              >
                                +
                              </button>
                            </div>

                            {/* Fixed-Width Unit Badge: English short abbreviations g, nos, ml, kg, pkt, bunch */}
                            <span className="w-12 py-1 rounded-md text-[11px] font-black text-emerald-950 bg-emerald-50 border border-emerald-200 text-center shrink-0">
                              {formatUnitShort(it.unit)}
                            </span>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveItem(it.id);
                              }}
                              className="w-6 h-6 rounded-lg hover:bg-rose-50 text-slate-300 hover:text-rose-600 transition flex items-center justify-center shrink-0 cursor-pointer active:scale-95 ml-0.5"
                              title="பொருளை நீக்குக"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

    {/* ================================================================= */}
    {/* STEP 2 CONTAINER: DATE, PANCHANGAM & DAKSHINA                     */}
    {/* ================================================================= */}
    {twoStepStage === 2 && (
      <div className="space-y-4">
        {/* SECTION 1: DEVOTEE & POOJA SUMMARY CARD WITH OPTIONAL SAMAGRI PREVIEW */}
        <div className="animate-section-1 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setTwoStepStage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Step 1</span>
            </button>
            <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/90 px-3 py-1 rounded-full border border-emerald-300 shadow-2xs">
              Step 2 of 2: Date &amp; Dakshina
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80 min-w-0 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xs shrink-0 border border-amber-300">
                👤
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Devotee</div>
                <div className="font-extrabold text-slate-900 truncate">{selectedCustomer?.name || "Devotee"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80 min-w-0 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-black text-sm shrink-0 border border-emerald-300">
                {currentPooja ? getPoojaIcon(currentPooja) : "🪔"}
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Pooja</div>
                <div className="font-extrabold text-slate-900 truncate">{currentPooja?.englishName || "Pooja"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 bg-slate-50/80 p-2.5 rounded-2xl border border-slate-200/80 min-w-0 shadow-2xs">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-900 flex items-center justify-center font-black text-sm shrink-0 border border-indigo-300">
                ₹
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Dakshina</div>
                <div className="font-extrabold text-slate-900 truncate">₹{amount.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </div>

          {/* Samagri Checklist Full Preview in Step 2 */}
          {samagriItems.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10.5px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  <span>சாமக்கிரி பொருட்கள் ({samagriItems.filter((i) => i.isChecked !== false).length})</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowStep2ChecklistPreview(!showStep2ChecklistPreview)}
                  className="text-[10.5px] font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 transition cursor-pointer flex items-center gap-1"
                >
                  <span>{showStep2ChecklistPreview ? "Hide Items" : `Show Items (${samagriItems.filter((i) => i.isChecked !== false).length})`}</span>
                  {showStep2ChecklistPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Collapsible preview in one line each, clean and clear */}
              {showStep2ChecklistPreview && (
                <div className="bg-slate-50/70 rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 divide-y divide-slate-100 space-y-0.5 animate-in fade-in duration-150">
                  {samagriItems.filter((i) => i.isChecked !== false).map((it, idx) => (
                    <div
                      key={it.id || idx}
                      className="flex items-center justify-between text-xs py-1.5 px-1.5 hover:bg-white rounded-lg transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-black shrink-0 border border-emerald-300">
                          ✓
                        </span>
                        <span className="font-extrabold text-slate-800 truncate">
                          {idx + 1}. {it.itemTamilName || it.itemEnglishName}
                        </span>
                        {it.itemEnglishName && it.itemTamilName && it.itemEnglishName !== it.itemTamilName && (
                          <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
                            ({it.itemEnglishName})
                          </span>
                        )}
                        {it.isCustom && (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                            புதியது
                          </span>
                        )}
                      </div>
                      <span className="font-bold text-emerald-900 bg-white px-2 py-0.5 rounded-md border border-slate-200 text-[11px] shrink-0 ml-2 shadow-2xs">
                        {it.quantity} {formatUnitShort(it.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SECTION 2: DATE, PANCHANGAM & TIME                                */}
        {/* ================================================================= */}
        <div className="animate-section-2 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <CalendarIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                2. நாள் &amp; சுப நேரம் (Date &amp; Auspicious Time)
              </h2>
            </div>
            <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300 shadow-2xs">
              {tamilInfo.formattedDualDate}
            </span>
          </div>

          {/* Interactive 14-Day Horizontal Date Strip */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                தேதித் தேர்வு (1-Tap Select Date):
              </span>
              <div className="flex items-center gap-1.5 bg-slate-50 hover:bg-amber-50 px-2.5 py-1 rounded-xl border border-slate-200 text-amber-900 transition shadow-2xs">
                <CalendarIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <label className="cursor-pointer text-xs font-bold flex items-center gap-1">
                  <span>Choose Other Date</span>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 pt-0.5 no-scrollbar">
              {upcomingDays.map((d) => {
                const isSelected = date === d.dateStr;
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setDate(d.dateStr)}
                    className={`flex-shrink-0 min-w-[58px] py-2 px-1.5 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between gap-1 shadow-2xs ${
                      isSelected
                        ? "bg-gradient-to-b from-emerald-800 to-emerald-950 text-white border-emerald-700 shadow-md ring-2 ring-emerald-400/40"
                        : "bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-emerald-700/80 text-amber-200"
                          : d.isToday
                          ? "bg-amber-100 text-amber-900"
                          : "text-slate-400"
                      }`}
                    >
                      {d.isToday ? "Today" : d.isTomorrow ? "Tmrw" : d.dayName}
                    </span>
                    <span
                      className={`text-base font-black leading-tight ${
                        isSelected ? "text-white" : "text-slate-900"
                      }`}
                    >
                      {d.dayNum}
                    </span>
                    <span
                      className={`text-[9.5px] font-bold ${
                        isSelected ? "text-emerald-200" : "text-slate-400"
                      }`}
                    >
                      {d.monthShort}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Sacred Panchangam Details Card (Home Page Gold Theme) */}
          <div className="bg-gradient-to-r from-amber-50/95 via-orange-50/90 to-amber-100/90 text-amber-950 p-3.5 rounded-2xl border border-amber-200/90 space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>📅 {tamilInfo.formattedFullDay || tamilInfo.formattedDualDate}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tamilInfo.tithiTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                    🌕 {tamilInfo.tithiTa}
                  </span>
                )}
                {tamilInfo.nakshatraNameTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-950 bg-amber-200/80 px-2 py-0.5 rounded-md border border-amber-300">
                    ⭐ {tamilInfo.nakshatraNameTa}
                  </span>
                )}
              </div>
            </div>

            {/* Nalla Neram / Gowri / Rahu kalam formatted in 12-Hour (AM/PM) */}
            <div className="pt-2 border-t border-amber-200/80 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  🪔 நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-emerald-950 mt-0.5 leading-snug">
                  {formatTime12H(tamilInfo.nallaNeram)}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-amber-300 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider">
                  ✨ கௌரி நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-amber-950 mt-0.5 leading-snug">
                  {formatTime12H(tamilInfo.gowriNallaNeram)}
                </span>
              </div>

              <div className="bg-white/90 p-2.5 rounded-xl border border-rose-200 shadow-2xs flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                  ⛔ ராகு காலம்
                </span>
                <span className="text-[11px] font-bold text-rose-950 mt-0.5 leading-snug">
                  {formatTime12H(tamilInfo.rahuKalam)}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive 12-Hour Auspicious Time Selector */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Time (12-Hour AM/PM):
              </span>
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-900 to-emerald-800 text-amber-200 px-3 py-1 rounded-xl text-xs font-black shadow-xs border border-emerald-700/60">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{time}</span>
              </div>
            </div>

            {/* 1. Hours Row (1 to 12) */}
            <div>
              <span className="text-[10px] font-bold text-slate-500 block mb-1">
                Hour (1 - 12):
              </span>
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 text-xs font-bold">
                {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map((h) => {
                  const isSelected = parsedTime.hour === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      onClick={() => updateTimeSlot(h, undefined, undefined)}
                      className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-emerald-800 text-amber-200 border-emerald-800 font-black shadow-xs ring-1 ring-emerald-600"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {parseInt(h, 10)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Minutes (15-min intervals) & AM/PM */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
              {/* 15-Minute Intervals */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Minutes (15-min Intervals):
                </span>
                <div className="grid grid-cols-4 gap-1 text-xs font-bold">
                  {["00", "15", "30", "45"].map((m) => {
                    const isSelected = parsedTime.minute === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => updateTimeSlot(undefined, m, undefined)}
                        className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer ${
                          isSelected
                            ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs"
                            : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        :{m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* AM / PM Period Selection */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 block mb-1">
                  Period:
                </span>
                <div className="grid grid-cols-2 gap-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => updateTimeSlot(undefined, undefined, "AM")}
                    className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                      parsedTime.period === "AM"
                        ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🌅 AM</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateTimeSlot(undefined, undefined, "PM")}
                    className={`py-1.5 rounded-xl border text-center transition active:scale-95 cursor-pointer flex items-center justify-center gap-1 ${
                      parsedTime.period === "PM"
                        ? "bg-indigo-700 text-white border-indigo-700 font-black shadow-xs"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    <span>🌙 PM</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 4: DAKSHINA & PAYMENT                                     */}
        {/* ================================================================= */}
        <div className="animate-section-3 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
              </div>
              <div>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  4. கட்டணம் &amp; தட்சணை (Dakshina &amp; Payment)
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  தட்சணை, முன்பணம், பணம் பெற்ற தேதி &amp; முறை பதிவு
                </p>
              </div>
            </div>
            {isPaymentSaved && (
              <span className="text-[10.5px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                <span>Saved ✓</span>
              </span>
            )}
          </div>

          {/* Total Dakshina Amount Customizer */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                மொத்த தட்சணைத் தொகை (Total Dakshina):
              </label>
              <div className="flex items-center gap-1">
                {[1000, 2500, 5000, 10000].map((quickAmt) => (
                  <button
                    key={quickAmt}
                    type="button"
                    onClick={() => {
                      setAmount(quickAmt);
                      if (paymentChoice === "FULL") setAdvanceAmount(quickAmt);
                      else if (paymentChoice === "ADVANCE") setAdvanceAmount(Math.round(quickAmt / 2));
                      setIsPaymentSaved(false);
                    }}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition active:scale-95 cursor-pointer ${
                      amount === quickAmt
                        ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                        : "bg-slate-50 hover:bg-emerald-50 text-slate-600 border-slate-200"
                    }`}
                  >
                    ₹{quickAmt.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2 text-sm font-black text-slate-400">₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount || ""}
                  onChange={(e) => {
                    const newAmt = Math.max(0, Number(e.target.value) || 0);
                    setAmount(newAmt);
                    if (paymentChoice === "FULL") setAdvanceAmount(newAmt);
                    else if (paymentChoice === "ADVANCE" && advanceAmount > newAmt) setAdvanceAmount(newAmt);
                    setIsPaymentSaved(false);
                  }}
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl pl-7 pr-3 py-1.5 text-sm font-black text-slate-900 focus:outline-none shadow-2xs transition"
                />
              </div>

              {/* Quick Stepper Buttons (-500, -100, +100, +500) */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const newAmt = Math.max(0, amount - 500);
                    setAmount(newAmt);
                    if (paymentChoice === "FULL") setAdvanceAmount(newAmt);
                    setIsPaymentSaved(false);
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition active:scale-95 cursor-pointer"
                  title="₹500 கழிக்க"
                >
                  -500
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newAmt = Math.max(0, amount - 100);
                    setAmount(newAmt);
                    if (paymentChoice === "FULL") setAdvanceAmount(newAmt);
                    setIsPaymentSaved(false);
                  }}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black border border-slate-200 transition active:scale-95 cursor-pointer"
                  title="₹100 கழிக்க"
                >
                  -100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newAmt = amount + 100;
                    setAmount(newAmt);
                    if (paymentChoice === "FULL") setAdvanceAmount(newAmt);
                    setIsPaymentSaved(false);
                  }}
                  className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black border border-emerald-200 transition active:scale-95 cursor-pointer"
                  title="₹100 கூட்ட"
                >
                  +100
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newAmt = amount + 500;
                    setAmount(newAmt);
                    if (paymentChoice === "FULL") setAdvanceAmount(newAmt);
                    setIsPaymentSaved(false);
                  }}
                  className="px-2 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-xl text-xs font-black border border-emerald-300 transition active:scale-95 cursor-pointer"
                  title="₹500 கூட்ட"
                >
                  +500
                </button>
              </div>
            </div>
          </div>

          {/* Quick Payment Overview Card (Gross, Expense, Net) */}
          <div className="p-3 bg-gradient-to-r from-emerald-50/90 via-slate-50 to-amber-50/60 rounded-2xl border border-emerald-200/90 shadow-2xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  தட்சணை (Gross)
                </div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  ₹{amount.toLocaleString("en-IN")}
                </div>
              </div>

              <div className="p-2 bg-white rounded-xl border border-rose-200/80 shadow-2xs">
                <div className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                  செலவு (Expense)
                </div>
                <div className="text-sm font-black text-rose-700 mt-0.5">
                  {expenseAmount > 0 ? `-₹${expenseAmount.toLocaleString("en-IN")}` : "₹0"}
                </div>
              </div>

              <div className="p-2 bg-emerald-100/80 rounded-xl border border-emerald-300 shadow-2xs">
                <div className="text-[10px] font-black text-emerald-900 uppercase tracking-wider">
                  நிகரம் (Net)
                </div>
                <div className="text-sm font-black text-emerald-950 mt-0.5">
                  ₹{Math.max(0, amount - expenseAmount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Tabs (Pending, Advance, Full Paid) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
                கட்டண நிலை (Payment Status):
              </label>
              <span className="text-[10px] text-slate-400 font-semibold">
                {paymentChoice === "UNPAID" ? "நிலுவை (Pending)" : paymentChoice === "ADVANCE" ? "முன்பணம் (Advance)" : "முழுத் தொகை (Paid)"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("UNPAID")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentChoice === "UNPAID"
                    ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs ring-1 ring-amber-400"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>⏳ Pending</span>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("ADVANCE")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentChoice === "ADVANCE"
                    ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs ring-1 ring-emerald-500"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>🪙 Advance</span>
              </button>
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("FULL")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  paymentChoice === "FULL"
                    ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-xs ring-1 ring-emerald-600"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <span>✅ Full Paid</span>
              </button>
            </div>
          </div>

          {/* ADVANCE & FULL PAID EXPANDED PAYMENT FORM */}
          {paymentChoice !== "UNPAID" && (
            <div className="p-3.5 bg-gradient-to-b from-emerald-50/70 to-slate-50 rounded-2xl border border-emerald-200/90 space-y-3 animate-in fade-in">
              {/* Advance Amount Calculation & Percentage Chips */}
              {paymentChoice === "ADVANCE" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-black text-emerald-950 block">
                      முன்பணத் தொகை (Advance Amount):
                    </label>
                    <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                      மீதி (Balance): ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Quick Percentage Presets */}
                  <div className="flex items-center gap-1.5">
                    {[
                      { label: "25%", val: Math.round(amount * 0.25) },
                      { label: "50%", val: Math.round(amount * 0.5) },
                      { label: "75%", val: Math.round(amount * 0.75) },
                    ].map((p) => {
                      const isSel = advanceAmount === p.val;
                      return (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => {
                            setAdvanceAmount(p.val);
                            setIsPaymentSaved(false);
                          }}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
                            isSel
                              ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs font-black"
                              : "bg-white hover:bg-emerald-50 text-slate-700 border-slate-300"
                          }`}
                        >
                          {p.label} (₹{p.val.toLocaleString("en-IN")})
                        </button>
                      );
                    })}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-black text-emerald-900">₹</span>
                    <input
                      type="number"
                      min="0"
                      max={amount}
                      value={advanceAmount || ""}
                      onChange={(e) => {
                        setAdvanceAmount(Number(e.target.value) || 0);
                        setIsPaymentSaved(false);
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-emerald-300 focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-7 pr-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              )}

              {paymentChoice === "FULL" && (
                <div className="p-2.5 bg-emerald-100/70 rounded-xl border border-emerald-300 text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span>முழுத் தட்சணைத் தொகை:</span>
                  <span className="font-black text-sm text-emerald-900">₹{amount.toLocaleString("en-IN")} (மீதம்: ₹0)</span>
                </div>
              )}

              {/* PAYMENT DATE TRACKER: "entha date la payement update aguthu nu vechuko" */}
              <div className="space-y-1.5 pt-1 border-t border-emerald-100/90">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                    <span>பணம் பெற்ற / புதுப்பிக்கப்பட்ட தேதி (Payment Date):</span>
                  </label>
                  {paymentDate === todayStr && (
                    <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-300">
                      இன்று (Today)
                    </span>
                  )}
                </div>

                {/* Quick Date Chips: Today, Yesterday, Custom */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDate(todayStr);
                      setIsPaymentSaved(false);
                    }}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer shrink-0 ${
                      paymentDate === todayStr
                        ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    📅 இன்று (Today)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentDate(yesterdayStr);
                      setIsPaymentSaved(false);
                    }}
                    className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer shrink-0 ${
                      paymentDate === yesterdayStr
                        ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs"
                        : "bg-white hover:bg-slate-100 text-slate-700 border-slate-300"
                    }`}
                  >
                    நேற்று (Yesterday)
                  </button>
                  <div className="relative flex-1 min-w-0">
                    <input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => {
                        setPaymentDate(e.target.value);
                        setIsPaymentSaved(false);
                      }}
                      className="w-full bg-white border border-slate-300 focus:border-emerald-600 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* PAYMENT RECIPIENT SELECTOR - Business vs Priest */}
              <div className="space-y-1.5 pt-1 border-t border-emerald-100/90">
                <div className="flex items-center justify-between">
                  <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                    தொகை யாரிடம் பெறப்பட்டது? (Payment Received By):
                  </label>
                  {paymentRecipient === "PRIEST" && (
                    <span className="text-[9.5px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                      நேரடி தட்சணை
                    </span>
                  )}
                </div>

                {/* Overflow-Safe Responsive 2-Option Card Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRecipient("BUSINESS");
                      setIsPaymentSaved(false);
                    }}
                    className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer flex items-center justify-between gap-2 ${
                      paymentRecipient === "BUSINESS"
                        ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs ring-2 ring-emerald-500/20"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">🏛️</span>
                      <div className="min-w-0 text-left leading-snug">
                        <div className="text-xs font-black truncate">நிர்வாகம் / கணக்கு</div>
                        <div
                          className={`text-[9.5px] truncate ${
                            paymentRecipient === "BUSINESS" ? "text-emerald-200" : "text-slate-400"
                          }`}
                        >
                          Business / Temple Account
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentRecipient === "BUSINESS"
                          ? "border-emerald-300 bg-emerald-700 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {paymentRecipient === "BUSINESS" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentRecipient("PRIEST");
                      setIsPaymentSaved(false);
                      if (priestShareAmount === 0 && adminCommissionAmount === 0 && currentPaidAmount > 0) {
                        setPriestShareAmount(currentPaidAmount);
                        setAdminCommissionAmount(0);
                      }
                    }}
                    className={`p-2.5 rounded-xl border transition active:scale-95 cursor-pointer flex items-center justify-between gap-2 ${
                      paymentRecipient === "PRIEST"
                        ? "bg-amber-700 text-white border-amber-700 font-black shadow-2xs ring-2 ring-amber-500/20"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">👤</span>
                      <div className="min-w-0 text-left leading-snug">
                        <div className="text-xs font-black truncate">வாத்யாரிடம் நேரடியாக</div>
                        <div
                          className={`text-[9.5px] truncate ${
                            paymentRecipient === "PRIEST" ? "text-amber-200" : "text-slate-400"
                          }`}
                        >
                          Directly to Priest
                        </div>
                      </div>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        paymentRecipient === "PRIEST"
                          ? "border-amber-300 bg-amber-800 text-white"
                          : "border-slate-300 bg-white"
                      }`}
                    >
                      {paymentRecipient === "PRIEST" && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </div>
                  </button>
                </div>
              </div>

              {/* COMMISSION & DAKSHINA SPLIT CARD (Manual Enter & Presets) */}
              {(paymentRecipient === "PRIEST" || showSplitCard) && (
                <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">⚖️</span>
                      <span className="text-xs font-black text-amber-950">
                        கட்டணப் பகிர்வு & கமிஷன் (Dakshina & Commission Split):
                      </span>
                    </div>
                    <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300">
                      மொத்தம்: ₹{currentPaidAmount.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <p className="text-[10.5px] text-amber-900/80 font-medium leading-relaxed">
                    வாத்யாரிடம் முழுத் தொகையும் செல்லாது எனில், வாத்யார் தட்சணை மற்றும் நிர்வாகக் கமிஷனை கீழே மாற்றிக்கொள்ளலாம்.
                  </p>

                  {/* Quick Presets */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {[
                      { key: "100_PRIEST", label: "100% வாத்யார்" },
                      { key: "80_20", label: "80% / 20%" },
                      { key: "70_30", label: "70% / 30%" },
                      { key: "50_50", label: "50% / 50%" },
                      { key: "CUSTOM", label: "✏️ சொந்த தொகை" },
                    ].map((p) => {
                      const isSel = splitPreset === p.key;
                      return (
                        <button
                          key={p.key}
                          type="button"
                          onClick={() => applySplitPreset(p.key as any)}
                          className={`text-[10.5px] font-bold px-2 py-1 rounded-lg border transition active:scale-95 cursor-pointer ${
                            isSel
                              ? "bg-amber-800 text-white border-amber-800 font-black shadow-2xs"
                              : "bg-white hover:bg-amber-100 text-amber-950 border-amber-200"
                          }`}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Two Manual Inputs: Priest Share & Admin Commission */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {/* Priest Share */}
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-amber-300 shadow-2xs">
                      <div className="text-[10.5px] font-black text-amber-950 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>👤</span>
                          <span>வாத்யார் பங்கு / தட்சணை</span>
                        </span>
                        {currentPaidAmount > 0 && (
                          <span className="text-[9.5px] font-extrabold text-amber-700">
                            {Math.round((priestShareAmount / currentPaidAmount) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-amber-800">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={currentPaidAmount}
                          value={priestShareAmount || ""}
                          onChange={(e) => handlePriestShareChange(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-amber-50/50 border border-amber-300 focus:border-amber-600 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Admin Commission */}
                    <div className="space-y-1 bg-white p-2.5 rounded-xl border border-emerald-300 shadow-2xs">
                      <div className="text-[10.5px] font-black text-emerald-950 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <span>🏛️</span>
                          <span>நிர்வாகக் கமிஷன் / பங்கு</span>
                        </span>
                        {currentPaidAmount > 0 && (
                          <span className="text-[9.5px] font-extrabold text-emerald-700">
                            {Math.round((adminCommissionAmount / currentPaidAmount) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1.5 text-xs font-black text-emerald-800">₹</span>
                        <input
                          type="number"
                          min="0"
                          max={currentPaidAmount}
                          value={adminCommissionAmount || ""}
                          onChange={(e) => handleAdminCommissionChange(Number(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full bg-emerald-50/50 border border-emerald-300 focus:border-emerald-600 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculation Balance Status */}
                  <div className="flex items-center justify-between text-[10px] font-bold pt-0.5">
                    {priestShareAmount + adminCommissionAmount === currentPaidAmount ? (
                      <span className="text-emerald-800 font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>தொகை சரியாகப் பிரிக்கப்பட்டுள்ளது (₹{priestShareAmount} + ₹{adminCommissionAmount} = ₹{currentPaidAmount})</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-extrabold flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-rose-500" />
                        <span>கூட்டுத் தொகை வேறுபடுகிறது (மொத்தம்: ₹{priestShareAmount + adminCommissionAmount} / பெறப்பட்டது: ₹{currentPaidAmount})</span>
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Optional Toggle if paymentRecipient is BUSINESS but owner wants to allocate priest share */}
              {paymentRecipient === "BUSINESS" && !showSplitCard && (
                <button
                  type="button"
                  onClick={() => {
                    setShowSplitCard(true);
                    applySplitPreset("80_20", currentPaidAmount);
                  }}
                  className="text-[10.5px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 py-0.5 cursor-pointer underline underline-offset-2"
                >
                  + குருக்கள் தட்சணை / கமிஷன் கணக்கிட (Set Priest Dakshina & Commission)
                </button>
              )}

              {/* PAYMENT METHOD SELECTOR */}
              <div className="space-y-1.5 pt-1 border-t border-emerald-100/90">
                <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider block">
                  கட்டண முறை (Payment Mode):
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs font-bold">
                  {[
                    { key: "UPI", label: "GPay / UPI", sub: "Online", icon: "📱" },
                    { key: "CASH", label: "ரொக்கம்", sub: "Cash", icon: "💵" },
                    { key: "BANK_TRANSFER", label: "வங்கி", sub: "Bank", icon: "🏦" },
                    { key: "CHEQUE", label: "காசோலை", sub: "Cheque", icon: "📝" },
                  ].map((m) => {
                    const isSel = paymentMethod === m.key;
                    return (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(m.key as any);
                          setIsPaymentSaved(false);
                        }}
                        className={`py-2 px-2 rounded-xl border transition active:scale-95 cursor-pointer flex items-center gap-1.5 ${
                          isSel
                            ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-2xs ring-2 ring-emerald-500/20"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        <span className="text-sm shrink-0">{m.icon}</span>
                        <div className="min-w-0 text-left leading-tight">
                          <div className="text-[11px] truncate">{m.label}</div>
                          <div className={`text-[9px] ${isSel ? "text-emerald-200" : "text-slate-400"}`}>{m.sub}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PAYMENT NOTES / TRANSACTION REF */}
              <div className="space-y-1 pt-1 border-t border-emerald-100/90">
                <label className="text-[10px] font-bold text-slate-600 block">
                  பரிவர்த்தனை குறிப்பு (Transaction Reference / Notes - Optional):
                </label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => {
                    setPaymentNotes(e.target.value);
                    setIsPaymentSaved(false);
                  }}
                  placeholder="எ.கா: GPay Ref #981245 / ரொக்கமாக கைமாறியது"
                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                />
              </div>

              {/* SAVE PAYMENT BUTTON */}
              <div className="pt-2 border-t border-emerald-200/90">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSavePaymentDetails}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                      isPaymentSaved
                        ? "bg-emerald-700 text-white border border-emerald-700"
                        : "bg-gradient-to-r from-emerald-800 to-[#0b2b17] hover:from-emerald-700 hover:to-emerald-900 text-amber-200 border border-emerald-900"
                    }`}
                  >
                    <Save className="w-4 h-4 text-amber-300" />
                    <span>{isPaymentSaved ? "✓ கட்டண விவரங்கள் பதிவு செய்யப்பட்டன (Saved)" : "💾 கட்டணத்தைப் பதிவு செய் (Save Payment Record)"}</span>
                  </button>

                  {isPaymentSaved && (
                    <button
                      type="button"
                      onClick={() => setIsPaymentSaved(false)}
                      className="px-3 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-xl transition cursor-pointer shadow-2xs"
                      title="Edit payment"
                    >
                      மாற்று / Edit
                    </button>
                  )}
                </div>

                {/* Instant Feedback Banner */}
                {isPaymentSaved && paymentSavedFeedback && (
                  <div className="mt-2.5 p-3 bg-emerald-100/90 text-emerald-950 rounded-xl border border-emerald-300 text-xs font-bold flex items-start gap-2 animate-in fade-in shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{paymentSavedFeedback}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Expense Tracker Section */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setShowExpenses(!showExpenses)}
                className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5 py-1 cursor-pointer transition"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-700" />
                <span>பூஜை செலவு சேர்க்க (Add Pooja Expenses)</span>
                {expenseAmount > 0 && (
                  <span className="text-[10px] font-extrabold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                    ₹{expenseAmount.toLocaleString("en-IN")}
                  </span>
                )}
              </button>

              {expenseAmount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setExpenseAmount(0);
                    setExpenseNotes("");
                  }}
                  className="text-[10px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
                >
                  Clear Expense ✕
                </button>
              )}
            </div>

            {/* Collapsible or Active Expense Form */}
            {(showExpenses || expenseAmount > 0) && (
              <div className="mt-2.5 p-3 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                {/* Quick Expense Category Tags */}
                <div className="space-y-1">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    செலவு வகை (Category Presets):
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {[
                      { label: "சாக்கிரிகள்", icon: "📦" },
                      { label: "மலர் & மாலை", icon: "🌸" },
                      { label: "வாகனம் / Travel", icon: "🚗" },
                      { label: "உதவி குருக்கள்", icon: "👤" },
                      { label: "பிற செலவுகள்", icon: "📝" },
                    ].map((cat) => (
                      <button
                        key={cat.label}
                        type="button"
                        onClick={() => {
                          setExpenseNotes((prev) =>
                            prev ? `${prev}, ${cat.label}` : cat.label
                          );
                        }}
                        className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 border border-slate-200 hover:border-emerald-300 rounded-lg transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount and Notes inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      செலவுத் தொகை (Expense Amount):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-black text-slate-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={expenseAmount || ""}
                        onChange={(e) => setExpenseAmount(Math.max(0, Number(e.target.value) || 0))}
                        placeholder="0"
                        className="w-full bg-white border border-slate-200 rounded-xl pl-7 pr-3 py-1.5 text-xs font-black text-rose-700 focus:outline-none focus:border-rose-400 shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      குறிப்பு (Expense Details / Notes):
                    </label>
                    <input
                      type="text"
                      value={expenseNotes}
                      onChange={(e) => setExpenseNotes(e.target.value)}
                      placeholder="எ.கா: மலர் மாலை, சாக்கிரிகள்"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 shadow-2xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ================================================================= */}
        {/* SECTION 5: PERFORMING PRIEST & VENUE                              */}
        {/* ================================================================= */}
        <div className="animate-section-4 bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-2xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <UserCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                5. செய்து வைப்பவர் &amp; இடம் (Priest &amp; Venue)
              </h2>
            </div>
          </div>

          {/* Performing Priest: Simple Self vs Other Toggle */}
          <div className="space-y-2">
            <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              Priest Selection:
            </label>

            {/* Clean Segmented Buttons: Self or Other only */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPriestType("self");
                  setAssignedIyerId("self");
                  setShowAddPriest(false);
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-black text-center transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  priestType === "self"
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-amber-200 border-emerald-800 shadow-xs ring-2 ring-emerald-500/20"
                    : "bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-200 font-bold shadow-2xs"
                }`}
              >
                <span>🪔 Self (நான்)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPriestType("other");
                  if (assignedIyerId === "self" || !assignedIyerId) {
                    const defaultPick = recentPriests[0]?.id || otherPriests[0]?.id || members[0]?.id || "";
                    if (defaultPick) {
                      setAssignedIyerId(defaultPick);
                      saveRecentPriest(defaultPick);
                    }
                  }
                }}
                className={`py-2.5 px-4 rounded-xl text-xs font-black text-center transition border active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 ${
                  priestType === "other"
                    ? "bg-gradient-to-r from-emerald-800 to-emerald-700 text-amber-200 border-emerald-800 shadow-xs ring-2 ring-emerald-500/20"
                    : "bg-white hover:bg-emerald-50/50 text-slate-700 border-slate-200 font-bold shadow-2xs"
                }`}
              >
                <span>👥 Other (வேறு குருக்கள்)</span>
              </button>
            </div>

            {/* If Self: sleek subtle confirmation note */}
            {priestType === "self" && (
              <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 font-semibold animate-in fade-in">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Priest: <strong>{currentUser?.name || "Ravi Iyer"} (Self)</strong></span>
                </span>
                <span className="text-[10px] bg-emerald-200/80 px-2 py-0.5 rounded-full font-bold text-emerald-900">
                  தலைமை குருக்கள்
                </span>
              </div>
            )}

            {/* When "Other" is selected */}
            {priestType === "other" && (
              <div className="p-3 sm:p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
                {/* Header with Title & Add Priest Button */}
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[10.5px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Choose Priest (குருக்கள் தேர்வு):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddPriest(!showAddPriest);
                      setPriestError("");
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-100/70 hover:bg-emerald-200/70 px-2.5 py-1 rounded-xl border border-emerald-300/80 transition flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddPriest ? "Close" : "Add Priest"}</span>
                  </button>
                </div>

                {/* 1. Recent Selection (Quick Pick Pills) */}
                {recentPriests.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>சமீபத்திய தேர்வு (Recent):</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {recentPriests.map((p) => {
                        const isSelected = assignedIyerId === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setAssignedIyerId(p.id);
                              saveRecentPriest(p.id);
                            }}
                            className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 flex items-center gap-1.5 border cursor-pointer ${
                              isSelected
                                ? "bg-emerald-800 text-white border-emerald-800 shadow-xs ring-2 ring-emerald-400/40"
                                : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs"
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-amber-400 text-slate-950"
                                  : "bg-emerald-100 text-emerald-900"
                              }`}
                            >
                              {p.name.charAt(0)}
                            </span>
                            <span className="truncate max-w-[120px] sm:max-w-[150px]">{p.name}</span>
                            {isSelected && <Check className="w-3 h-3 text-amber-300 shrink-0 stroke-[3]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Search Option */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={priestSearch}
                    onChange={(e) => setPriestSearch(e.target.value)}
                    placeholder="குருக்களை தேட... (Search priest by name, mobile)"
                    className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-emerald-600 shadow-2xs transition"
                  />
                  {priestSearch && (
                    <button
                      type="button"
                      onClick={() => setPriestSearch("")}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* 3. Priests Card List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                  {filteredPriests.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400 font-medium">
                      குருக்கள் யாரும் கிடைக்கவில்லை (No priests found)
                    </div>
                  ) : (
                    filteredPriests.map((p) => {
                      const isSelected = assignedIyerId === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setAssignedIyerId(p.id);
                            saveRecentPriest(p.id);
                          }}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                            isSelected
                              ? "bg-emerald-50/70 border-emerald-400 ring-1 ring-emerald-300 shadow-2xs"
                              : "bg-white hover:bg-slate-50 border-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isSelected
                                  ? "bg-emerald-700 text-white"
                                  : "bg-slate-100 text-slate-700"
                              }`}
                            >
                              {p.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-extrabold text-xs text-slate-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {p.specialization || "குருக்கள்"} {p.mobile ? `• ${p.mobile}` : ""}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            <span
                              className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Inline Add Priest Modal */}
                {showAddPriest && (
                  <div className="p-3 bg-white rounded-xl border border-emerald-300 space-y-2.5 shadow-xs animate-in zoom-in-95">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="text-xs font-extrabold text-emerald-950">
                        + புதிய குருக்களை சேர்க்க (Add New Priest)
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddPriest(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                          Priest Name *
                        </label>
                        <input
                          type="text"
                          value={newPriestName}
                          onChange={(e) => setNewPriestName(e.target.value)}
                          placeholder="எ.கா: வெங்கடேஷ் ஐயர்"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Mobile (Optional)
                          </label>
                          <input
                            type="tel"
                            value={newPriestMobile}
                            onChange={(e) => setNewPriestMobile(e.target.value)}
                            placeholder="9876543210"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Specialization
                          </label>
                          <input
                            type="text"
                            value={newPriestSpec}
                            onChange={(e) => setNewPriestSpec(e.target.value)}
                            placeholder="Assistant Priest"
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      {priestError && (
                        <p className="text-[11px] font-bold text-red-600 bg-red-50 p-1.5 rounded-lg">
                          {priestError}
                        </p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddPriest(false);
                            setPriestError("");
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleQuickAddPriest}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Save Priest</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Pooja Location / Venue */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-[10.5px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                <span>பூஜை நடைபெறும் இடம் (Location / Venue):</span>
              </label>
              {location && (
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 truncate max-w-[150px]">
                  {location}
                </span>
              )}
            </div>

            {/* Modern Venue Selection Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  label: "பக்தர் இல்லம்",
                  sub: "Home",
                  icon: "🏠",
                  match: () =>
                    location.includes("இல்லம்") ||
                    location.includes("Home") ||
                    Boolean(selectedCustomer?.address && location === selectedCustomer.address),
                  onClick: () => {
                    const homeLoc =
                      selectedCustomer?.address ||
                      (selectedCustomer?.city ? `${selectedCustomer.name} இல்லம், ${selectedCustomer.city}` : "பக்தர் இல்லம்");
                    setLocation(homeLoc);
                  },
                },
                {
                  label: "கோவில்",
                  sub: "Temple",
                  icon: "🛕",
                  match: () => location.includes("கோவில்") || location.includes("Temple"),
                  onClick: () => setLocation("கோவில் (Temple)"),
                },
                {
                  label: "மண்டபம்",
                  sub: "Hall",
                  icon: "🏛️",
                  match: () => location.includes("மண்டபம்") || location.includes("Hall"),
                  onClick: () => setLocation("மண்டபம் (Hall)"),
                },
                {
                  label: "நாமக்கல்",
                  sub: "Namakkal",
                  icon: "📍",
                  match: () => location.includes("நாமக்கல்") || location === "Namakkal",
                  onClick: () => setLocation("நாமக்கல் (Namakkal)"),
                },
              ].map((v) => {
                const isSelected = v.match();
                return (
                  <button
                    key={v.label}
                    type="button"
                    onClick={v.onClick}
                    className={`py-2 px-2.5 rounded-xl text-left transition active:scale-95 border cursor-pointer flex items-center gap-2 ${
                      isSelected
                        ? "bg-emerald-50 border-2 border-emerald-600 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20 font-black"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200 font-bold shadow-2xs"
                    }`}
                  >
                    <span className="text-base shrink-0">{v.icon}</span>
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="text-xs truncate">{v.label}</div>
                      <div
                        className={`text-[9.5px] truncate ${
                          isSelected ? "text-emerald-700 font-extrabold" : "text-slate-400 font-normal"
                        }`}
                      >
                        {v.sub}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Clear, highly visible Text Input */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="எ.கா: பக்தர் இல்ல முகவரி / கோவில் பெயர் / நாமக்கல்"
                className="w-full bg-white border-2 border-slate-200 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal shadow-2xs transition"
              />
            </div>
          </div>
        </div>
      </div>
    )}

    {/* ================================================================= */}
    {/* STICKY BOTTOM BAR FOR STEP 1                                      */}
    {/* ================================================================= */}
    {twoStepStage === 1 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-3 sm:px-4 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span>👤</span>
              <span className={selectedCustomer ? "text-slate-900 font-extrabold" : "text-amber-800 font-bold"}>
                {selectedCustomer ? selectedCustomer.name : "பக்தரைத் தேர்ந்தெடுக்கவும்"}
              </span>
            </div>
            <div className="text-[10.5px] sm:text-[11px] font-bold truncate flex items-center gap-1.5 mt-0.5">
              <span>🪔</span>
              <span className={currentPooja ? "text-emerald-800 font-black" : "text-slate-500 font-medium"}>
                {currentPooja
                  ? `${currentPooja.englishName} • ₹${amount.toLocaleString("en-IN")}`
                  : "பூஜையைத் தேர்ந்தெடுக்கவும்"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={validateAndProceedToStep2}
            className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 hover:from-emerald-950 hover:to-black text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>Next: Date &amp; Dakshina</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>
    )}

    {/* ================================================================= */}
    {/* STICKY BOTTOM BAR FOR STEP 2                                      */}
    {/* ================================================================= */}
    {twoStepStage === 2 && (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 py-3 px-3 sm:px-4 shadow-xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-black text-xs sm:text-sm text-slate-900 truncate">
              👤 {selectedCustomer?.name || "Devotee"} • 🪔 {currentPooja?.englishName || "Pooja"}
            </div>
            <div className="text-[10.5px] sm:text-[11px] text-emerald-800 font-bold flex items-center gap-1 sm:gap-1.5 truncate mt-0.5">
              <span>📅 {date}</span>
              <span>•</span>
              <span>⏰ {time}</span>
              <span>•</span>
              <span className="font-black text-slate-900">₹{amount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <button
            type="submit"
            className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-emerald-900 via-[#0b2b17] to-emerald-950 hover:from-emerald-950 hover:to-black text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition active:scale-95 cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>Confirm Booking ✨</span>
          </button>
        </div>
      </div>
    )}
      </form>

      {/* Full Booking Preview Modal (முன்பதிவு முழு சரிபார்ப்பு & செக்-லிஸ்ட்) */}
      {showPreviewModal && selectedCustomer && currentPooja && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl border border-amber-300 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 pb-3 border-b border-slate-100 bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-base shadow-2xs">
                  🪔
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-slate-900 leading-tight">
                    Booking Full Preview (முன்பதிவு முழு சரிபார்ப்பு)
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-bold">
                    அனைத்து விவரங்களையும் சரிபார்த்து உறுதி செய்யவும்
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 text-xs">
              {/* 1. Devotee Info */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm shrink-0">
                    👤
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">பக்தர் (Devotee)</span>
                    <span className="font-black text-sm text-slate-900 truncate block">{selectedCustomer.name}</span>
                    <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-2 mt-0.5">
                      {selectedCustomer.mobile && <span>📱 {selectedCustomer.mobile}</span>}
                      <span>📍 {selectedCustomer.city || "Namakkal"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Pooja Ceremony */}
              <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm shrink-0">
                    🪔
                  </span>
                  <div className="min-w-0">
                    <span className="text-[10px] text-emerald-800 font-bold uppercase block">பூஜை சேவை (Pooja Ritual)</span>
                    <span className="font-black text-sm text-slate-900 truncate block">
                      {currentPooja.englishName}
                    </span>
                    {currentPooja.tamilName && (
                      <span className="text-xs text-emerald-800 font-bold truncate block">
                        {currentPooja.tamilName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 inline-block">
                    ₹{(currentPooja.basePrice || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              {/* 3. Date, Auspicious Time & Tamil Panchangam */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">தேதி (Date)</span>
                    <span className="font-black text-slate-900 text-sm block mt-0.5">📅 {date}</span>
                    <span className="text-[10.5px] font-bold text-amber-800 block mt-0.5 truncate">{tamilInfo.formattedDualDate}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">சுப நேரம் (Time)</span>
                    <span className="font-black text-emerald-900 text-sm block mt-0.5">⏰ {time}</span>
                    <span className="text-[10px] text-slate-500 font-bold block mt-0.5">12-Hour AM/PM</span>
                  </div>
                </div>

                {/* Compact Panchangam Strip */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10.5px] font-bold text-slate-700 flex-wrap gap-1">
                  <span className="text-emerald-900">🪔 நல்ல நேரம்: {tamilInfo.nallaNeram}</span>
                  <span className="text-amber-900">✨ கௌரி: {tamilInfo.gowriNallaNeram}</span>
                  <span className="text-rose-700">⛔ ராகு: {tamilInfo.rahuKalam}</span>
                </div>
              </div>

              {/* 4. Priest & Venue */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">தலைமை குருக்கள் (Priest)</span>
                  <span className="font-black text-slate-900 block mt-0.5 truncate">
                    🪔 {priestType === "self" ? `${currentUser?.name || "Ravi Iyer"} (Self)` : members.find(m => m.id === assignedIyerId)?.name || "Assigned Priest"}
                  </span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">பூஜை நடைபெறும் இடம் (Venue)</span>
                  <span className="font-black text-slate-900 block mt-0.5 truncate">
                    📍 {location || selectedCustomer.city || "Namakkal"}
                  </span>
                </div>
              </div>

              {/* 5. Complete Samagri Checklist in One-Line (முன்னாடி இருந்த மாதிரி & ஒன்-லைன் / இன்-லைன்) */}
              <div className="bg-white rounded-2xl border-2 border-emerald-300/80 p-3 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckSquare className="w-4 h-4 text-emerald-700" />
                    <span className="font-black text-slate-900 uppercase tracking-wider text-xs">
                      சாமக்கிரி பொருட்கள் செக்-லிஸ்ட் (Samagri Checklist)
                    </span>
                  </div>
                  <span className="text-[10.5px] font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                    {samagriItems.filter((i) => i.isChecked !== false).length} பொருட்கள் உறுதி ✓
                  </span>
                </div>

                {/* Line-by-Line Items View (Full Preview, One Line per Item) */}
                <div className="divide-y divide-slate-100 space-y-0.5">
                  {samagriItems.filter((i) => i.isChecked !== false).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-xs py-1.5 px-1 hover:bg-emerald-50/40 rounded-lg transition"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] font-black shrink-0">
                          ✓
                        </span>
                        <span className="font-black text-slate-900 truncate">
                          {idx + 1}. {item.itemTamilName || item.itemEnglishName}
                        </span>
                        {item.itemEnglishName && item.itemTamilName && item.itemEnglishName !== item.itemTamilName && (
                          <span className="text-[10px] text-slate-400 font-medium truncate hidden sm:inline">
                            ({item.itemEnglishName})
                          </span>
                        )}
                        {item.isCustom && (
                          <span className="text-[9px] font-black text-amber-800 bg-amber-100 px-1 py-0.2 rounded border border-amber-200 shrink-0">
                            புதியது
                          </span>
                        )}
                      </div>
                      <div className="shrink-0 ml-2">
                        <span className="text-[11px] font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {item.quantity} {formatUnitShort(item.unit)}
                        </span>
                      </div>
                    </div>
                  ))}

                  {samagriItems.filter((i) => i.isChecked !== false).length === 0 && (
                    <div className="py-3 text-center text-slate-400 text-xs font-bold">
                      பொருட்கள் எதுவும் சேர்க்கப்படவில்லை
                    </div>
                  )}
                </div>

                {samagriItems.filter((i) => i.isChecked === false).length > 0 && (
                  <div className="text-[10px] text-slate-400 font-bold pt-1 border-t border-slate-100">
                    * {samagriItems.filter((i) => i.isChecked === false).length} பொருட்கள் பட்டியலில் இருந்து தவிர்க்கப்பட்டுள்ளன
                  </div>
                )}
              </div>

              {/* 6. Dakshina, Payment Status & Expenses */}
              <div className="bg-gradient-to-r from-amber-50 to-white p-3 rounded-2xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase block">தட்சணை (Dakshina Amount)</span>
                    <span className="text-lg font-black text-slate-900">₹{amount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">கட்டண நிலை</span>
                    <span className="text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-300 inline-block">
                      {paymentChoice === "FULL"
                        ? "முழுத் தொகை பெறப்பட்டது (Paid ✓)"
                        : paymentChoice === "ADVANCE"
                        ? `முன்பணம்: ₹${advanceAmount.toLocaleString("en-IN")}`
                        : "பிறகு செலுத்தப்படும் (Unpaid)"}
                    </span>
                  </div>
                </div>

                {paymentChoice !== "UNPAID" && (
                  <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-950">
                      <span>செலுத்தப்பட்ட தொகை: ₹{(paymentChoice === "FULL" ? amount : advanceAmount).toLocaleString("en-IN")}</span>
                      <span className="text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md font-black text-[10.5px] border border-emerald-200">
                        {paymentMethod === "UPI"
                          ? "📱 GPay / UPI"
                          : paymentMethod === "CASH"
                          ? "💵 ரொக்கம் (Cash)"
                          : paymentMethod === "BANK_TRANSFER"
                          ? "🏦 வங்கி (Bank)"
                          : "📝 காசோலை (Cheque)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-600 font-semibold pt-1 border-t border-emerald-100">
                      <span>📅 பணம் பெற்ற தேதி: <strong className="text-slate-900">{paymentDate}</strong></span>
                      <span className={paymentRecipient === "PRIEST" ? "text-amber-800 font-black" : "text-emerald-800 font-black"}>
                        {paymentRecipient === "PRIEST" ? "👤 வாத்யாரிடம் நேரடியாக" : "🏛️ நிர்வாகக் கணக்கு"}
                      </span>
                    </div>

                    {(paymentRecipient === "PRIEST" || showSplitCard || priestShareAmount > 0 || adminCommissionAmount > 0) && (
                      <div className="p-2 bg-amber-100/70 rounded-lg border border-amber-200/80 flex items-center justify-between text-[11px] font-bold text-amber-950">
                        <span>👤 வாத்யார் தட்சணை: ₹{priestShareAmount.toLocaleString("en-IN")}</span>
                        <span>🏛️ நிர்வாகக் கமிஷன்: ₹{adminCommissionAmount.toLocaleString("en-IN")}</span>
                      </div>
                    )}

                    {paymentNotes && (
                      <div className="text-[10.5px] text-slate-600 font-medium truncate pt-1 border-t border-emerald-100">
                        குறிப்பு / Ref: <span className="font-bold text-slate-800">{paymentNotes}</span>
                      </div>
                    )}
                  </div>
                )}

                {expenseAmount > 0 && (
                  <div className="pt-1.5 border-t border-amber-200/60 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-rose-700 font-bold">
                      செலவு: -₹{expenseAmount.toLocaleString("en-IN")} {expenseNotes ? `(${expenseNotes})` : ""}
                    </span>
                    <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-200">
                      நிகர தட்சணை: ₹{Math.max(0, amount - expenseAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>

              {/* 7. Sankalpam / Notes */}
              {notes.trim() && (
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">📜 சங்கல்ப குறிப்பு (Sankalpam / Notes)</span>
                  <p className="font-bold text-slate-800 mt-0.5">{notes.trim()}</p>
                </div>
              )}
            </div>

            {/* Modal Actions: Edit vs Confirm */}
            <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50/70 grid grid-cols-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition cursor-pointer active:scale-95 shadow-2xs text-center"
              >
                ← Edit (திருத்து)
              </button>
              <button
                type="button"
                disabled={isSubmittingBooking}
                onClick={handleFinalConfirmBooking}
                className="py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-[#0b2b17] hover:from-emerald-700 hover:to-emerald-900 disabled:opacity-50 disabled:pointer-events-none text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>{isSubmittingBooking ? "பதிவாகிறது..." : "Confirm & Book ✨"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Celebratory Modal */}
      {createdBooking && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-emerald-200 overflow-hidden text-center space-y-4 p-5 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">
                முன்பதிவு உறுதியானது
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                பூஜை வெற்றிகரமாகப் பதிவானது!
              </h3>
              <div className="inline-block mt-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-300 rounded-full font-mono text-xs font-bold text-emerald-900">
                #{createdBooking.bookingNumber}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl text-xs space-y-1 text-slate-700 text-left border border-slate-200">
              <div className="flex justify-between font-bold">
                <span>பக்தர்:</span>
                <span>{createdBooking.customerName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>பூஜை:</span>
                <span>{createdBooking.poojaEnglishName}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>நாள் &amp; நேரம்:</span>
                <span>{createdBooking.date} • {formatTime12H(createdBooking.startTime)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>செய்து வைப்பவர்:</span>
                <span className="text-amber-900 font-extrabold">{createdBooking.assignedIyerName || "Self"}</span>
              </div>
              <div className="flex justify-between font-black text-emerald-900 pt-1 border-t border-slate-200">
                <span>கட்டணம்:</span>
                <span>₹{createdBooking.totalAmount.toLocaleString("en-IN")}</span>
              </div>
              {createdBooking.expenseAmount && createdBooking.expenseAmount > 0 ? (
                <>
                  <div className="flex justify-between font-bold text-rose-700">
                    <span>செலவு:</span>
                    <span>-₹{createdBooking.expenseAmount.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-950 pt-0.5 border-t border-slate-200">
                    <span>நிகர வருமானம்:</span>
                    <span>₹{(createdBooking.totalAmount - (createdBooking.expenseAmount || 0)).toLocaleString("en-IN")}</span>
                  </div>
                </>
              ) : null}
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                <span>Send WhatsApp Slip</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/app/bookings/${createdBooking.id}`)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer"
              >
                View Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SAMAGRI ITEM DETAILS MODAL (Tap & Hold விவரம்)                   */}
      {/* ================================================================= */}
      {activeDetailItem && (() => {
        const detail = getSamagriItemDetail(activeDetailItem);
        const isChecked = activeDetailItem.isChecked !== false;
        const step = getItemStep(activeDetailItem.unit);
        return (
          <div className="fixed inset-0 z-[70] bg-black/65 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-emerald-300 overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-5">
              {/* Mobile drag handle */}
              <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mt-2.5 mb-1 block sm:hidden" />

              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/50 flex items-start justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-black text-lg shadow-2xs shrink-0">
                    🪔
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-300/80">
                        {detail.categoryTa}
                      </span>
                      <span className="text-[10px] font-extrabold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300/80">
                        {activeDetailItem.quantity} {formatUnitShort(activeDetailItem.unit)}
                      </span>
                    </div>
                    <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight mt-1 truncate">
                      {detail.titleTa}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium truncate">
                      {detail.titleEn}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveDetailItemId(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
                {/* 1. Spiritual Significance */}
                <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-50/40 p-3.5 rounded-2xl border border-amber-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs uppercase tracking-wider">
                    <span>✨</span>
                    <span>பூஜை பயன்பாடு &amp; ஆன்மீக முக்கியத்துவம்:</span>
                  </div>
                  <p className="text-slate-800 font-semibold leading-relaxed text-[12.5px]">
                    {detail.significance}
                  </p>
                </div>

                {/* 2. Devotee Preparation Tips */}
                <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/90 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-emerald-900 font-black text-xs uppercase tracking-wider">
                    <span>📋</span>
                    <span>பக்தர் தயாரிப்பு &amp; தரக் குறிப்புகள்:</span>
                  </div>
                  <p className="text-emerald-950 font-semibold leading-relaxed text-[12px]">
                    {detail.preparationTip}
                  </p>
                  <div className="pt-2 border-t border-emerald-200/60 text-[11px] text-slate-600 font-medium flex items-center gap-1.5">
                    <span className="font-bold text-emerald-900">பராமரிப்பு / தரம்:</span>
                    <span>{detail.storageOrQuality}</span>
                  </div>
                </div>

                {/* 3. In-Modal Quantity Stepper & Quick Adjustment */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                      தேவையான அளவு (Adjust Quantity):
                    </span>
                    <span className="text-xs font-black text-slate-900">
                      {activeDetailItem.quantity} {formatUnitShort(activeDetailItem.unit)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    <div className="flex items-center bg-white border border-slate-300 rounded-xl p-1 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(activeDetailItem.id, -1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
                        title={`குறைக்க (-${step})`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="1"
                        value={activeDetailItem.quantity}
                        onChange={(e) => handleItemDirectQuantity(activeDetailItem.id, e.target.value)}
                        className="w-16 text-center font-black text-sm text-slate-900 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleItemQuantityChange(activeDetailItem.id, 1)}
                        className="w-8 h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center transition active:scale-95 cursor-pointer"
                        title={`அதிகரிக்க (+${step})`}
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[10, 50, 100].map((inc) => (
                        <button
                          key={inc}
                          type="button"
                          onClick={() => {
                            const newQty = (activeDetailItem.quantity || 0) + inc;
                            handleItemDirectQuantity(activeDetailItem.id, String(newQty));
                          }}
                          className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer shadow-2xs"
                        >
                          +{inc}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Item Inclusion & Delete Toggle */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleToggleItem(activeDetailItem.id)}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                      isChecked
                        ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>{isChecked ? "பட்டியலில் உள்ளது (Included)" : "விலக்கப்பட்டது (Excluded)"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleRemoveItem(activeDetailItem.id);
                      setActiveDetailItemId(null);
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition flex items-center gap-1 cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>நீக்குக</span>
                  </button>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveDetailItemId(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <span>சரி (Done)</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function QuickBookingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">ஏற்றுகிறது (Loading)...</div>}>
      <QuickBookingContent />
    </Suspense>
  );
}
