"use client";

import React, { useState, useMemo, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
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
} from "lucide-react";
import Link from "next/link";
import { getTamilDate, getLocalDateString, formatTime12H } from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage, formatUnitTamil } from "@/lib/whatsapp/formatter";
import { SAMAGRI_CATALOG, SamagriCatalogItem } from "@/lib/samagri/catalog";

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
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // Data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [members, setAllMembers] = useState<BusinessMember[]>([]);

  useEffect(() => {
    setCustomers(db.getCustomers(businessId));
    setPoojas(db.getPoojas(businessId));
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

  const [date, setDate] = useState<string>(searchParams.get("date") || todayStr);
  const [time, setTime] = useState<string>(searchParams.get("time") || "07:00 AM");

  // Generate Upcoming 14 Days for Quick 1-Tap Date Strip
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
    return days;
  }, []);

  // 4. Dakshina & Assignment
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "ADVANCE" | "FULL">("UNPAID");
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

  const showMissingError = (
    section: "devotee" | "pooja" | "priest" | "date",
    message: string
  ) => {
    setFormError(message);
    setHighlightedSection(section);

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
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Preview modal state
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [showStep2ChecklistPreview, setShowStep2ChecklistPreview] = useState<boolean>(true);

  // Sync pooja details & items
  const currentPooja = useMemo(
    () => poojas.find((p) => p.id === selectedPoojaId) || null,
    [poojas, selectedPoojaId]
  );

  const SAMAGRI_CATEGORIES = [
    { id: "all", label: "அனைத்தும்", icon: "✨" },
    { id: "powders", label: "பொடிகள்", icon: "🌿" },
    { id: "ghee_oils", label: "நெய் / எண்ணெய்", icon: "🪔" },
    { id: "essentials", label: "பழங்கள் & பிரசாதம்", icon: "🥥" },
    { id: "homam", label: "சமித்து & ஹோமம்", icon: "🪵" },
    { id: "flowers", label: "மலர்கள் & இலைகள்", icon: "🌺" },
    { id: "vastram", label: "வஸ்திரம்", icon: "🪙" },
  ];

  // Filter catalog items for "Add Item" Checklist Selector
  const filteredCatalogChecklist = useMemo(() => {
    const q = itemSearchQuery.toLowerCase().trim();
    return SAMAGRI_CATALOG.filter((catItem) => {
      const matchesCat = selectedCategory === "all" || catItem.category === selectedCategory;
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
    setSelectedCustomerId(created.id);
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

  // Handle Payment Choice
  const handlePaymentChoiceChange = (choice: "UNPAID" | "ADVANCE" | "FULL") => {
    setPaymentChoice(choice);
    if (choice === "UNPAID") setAdvanceAmount(0);
    else if (choice === "FULL") setAdvanceAmount(amount);
    else if (choice === "ADVANCE" && advanceAmount === 0) setAdvanceAmount(Math.round(amount / 2));
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
    if (!selectedCustomer || !currentPooja) return;

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
      status: "CONFIRMED",
      assignedIyerId: effectivePriestId === "self" ? "m-owner-01" : effectivePriestId,
      assignedIyerName: performingName,
      location: location || selectedCustomer.city || "Namakkal",
      expenseAmount: expenseAmount || 0,
      expenseNotes: expenseNotes || "",
      notes: notes.trim(),
      items: samagriItems,
    });

    setShowPreviewModal(false);
    setCreatedBooking(newBooking);
  };

  const handleShareWhatsApp = () => {
    if (!createdBooking || !currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(createdBooking, currentBusiness);
    const phone = createdBooking.customerMobile ? createdBooking.customerMobile.replace(/\D/g, "") : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-44 animate-in fade-in duration-200">
      {/* Top Header & Mode Toggle Switch */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-1">
        <div className="flex items-center gap-2">
          <Link
            href="/app/bookings"
            className="p-1.5 hover:bg-slate-100 rounded-full text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                New Booking
              </h1>
              <span className="text-[10px] font-extrabold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                ⚡ 2-Step Quick
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Step 1: Devotee &amp; Pooja • Step 2: Date &amp; Dakshina
            </p>
          </div>
        </div>

        <Link
          href="/app/bookings"
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition active:scale-95 shadow-2xs"
        >
          Cancel
        </Link>
      </div>

      <form onSubmit={handleOpenPreview} className="space-y-3.5">
        {/* 2-Step Interactive Segmented Switcher */}
        <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-2xl text-xs font-bold shadow-2xs">
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
              className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs space-y-3 transition-all duration-300 ${
                highlightedSection === "devotee"
                  ? "ring-4 ring-rose-500/50 border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                      highlightedSection === "devotee"
                        ? "bg-rose-600 text-white"
                        : "bg-amber-500 text-white"
                    }`}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-950">
                    1. பக்தர் விவரம் (Devotee)
                  </h2>
                  {highlightedSection === "devotee" && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
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
                      ? "border-rose-400 focus:border-rose-600 ring-1 ring-rose-400"
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
                          onClick={() => setSelectedCustomerId(c.id)}
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
                    onClick={() => setSelectedCustomerId("")}
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
              className={`bg-white rounded-3xl p-4 sm:p-5 border shadow-xs space-y-3 transition-all duration-300 ${
                highlightedSection === "pooja"
                  ? "ring-4 ring-rose-500/50 border-rose-500 shadow-lg shadow-rose-500/20 animate-pulse"
                  : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                      highlightedSection === "pooja"
                        ? "bg-rose-600 text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
                    <Flame className={`w-4 h-4 ${highlightedSection === "pooja" ? "text-white" : "text-emerald-700"}`} />
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    2. பூஜை &amp; சாக்கிரிகள் (Pooja &amp; Samagri)
                  </h2>
                  {highlightedSection === "pooja" && (
                    <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
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
                      onClick={() => setSelectedPoojaId(p.id)}
                      className={`p-2.5 rounded-2xl border text-left transition flex flex-col justify-between shadow-2xs active:scale-95 cursor-pointer ${
                        isSelected
                          ? "bg-gradient-to-r from-emerald-50 to-emerald-100/90 border-emerald-600 ring-2 ring-emerald-500/25 shadow-xs"
                          : "bg-slate-50/70 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-black text-slate-900 truncate">
                          {p.englishName}
                        </div>
                        {p.tamilName && (
                          <div className="text-[10.5px] text-emerald-900 font-bold truncate">
                            {p.tamilName}
                          </div>
                        )}
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
                      <span>{showAddItem ? "மூடுக (Close)" : "+ பொருள் தேர்வு / சேர்க்க"}</span>
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
                                  {catItem.qty} {formatUnitTamil(catItem.unit)}
                                </span>
                                {isAlreadyAdded ? (
                                  <span className="text-[10px] font-bold text-emerald-800">
                                    தேர்வானது ✓
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
                          <span>+ வேறு புதிய தனிப்பயன் பொருள் சேர்க்க (Type Custom Item)</span>
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
                          {/* Left: Checkbox + Number + Tamil Name + English Subtitle */}
                          <div
                            onClick={() => handleToggleItem(it.id)}
                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer select-none"
                          >
                            {isChecked ? (
                              <div className="w-5 h-5 rounded-md bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-md border-2 border-slate-300 bg-white shrink-0 hover:border-emerald-600" />
                            )}
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
                          </div>

                          {/* Right: Stepper [-] [qty] [+] BEFORE Unit, then Unit Badge, then Delete Button */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Stepper with [-] and [+] BEFORE Unit */}
                            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
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
                                className="w-10 text-center text-xs font-black bg-transparent text-slate-900 focus:outline-none"
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

                            {/* Unit Badge (Units ku munadi increment/decrement) */}
                            <span className="text-[11px] font-extrabold text-emerald-950 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              {formatUnitTamil(it.unit) || it.unit || "எண்ணிக்கை"}
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
      <div className="space-y-3.5 animate-in fade-in duration-150">
        {/* Step 2 Back & Devotee Summary Card (Responsive, No Overflow) */}
        <div className="bg-white rounded-3xl p-3.5 sm:p-4 border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setFormError("");
                setTwoStepStage(1);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-slate-600" />
              <span>Back to Step 1</span>
            </button>
            <span className="text-[11px] font-extrabold text-emerald-900 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200">
              Step 2 of 2
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0">
                👤
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Devotee</div>
                <div className="font-extrabold text-slate-900 truncate">{selectedCustomer?.name || "Devotee"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                🔥
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Pooja</div>
                <div className="font-extrabold text-slate-900 truncate">{currentPooja?.englishName || "Pooja"}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200/70 min-w-0">
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold text-xs shrink-0">
                ₹
              </div>
              <div className="min-w-0">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Dakshina</div>
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
                <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {samagriItems.filter((i) => i.isChecked !== false).length} பொருட்கள் உறுதி
                </span>
              </div>

              {/* Full preview in one line each, clean and clear */}
              <div className="bg-slate-50/70 rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 divide-y divide-slate-100 space-y-0.5">
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
                      {it.quantity} {formatUnitTamil(it.unit)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* SECTION 3: DATE, PANCHANGAM & TIME                                */}
        {/* ================================================================= */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <CalendarIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                3. நாள் &amp; சுப நேரம் (Date &amp; Auspicious Time)
              </h2>
            </div>
            <span className="text-[11px] font-black text-emerald-950 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-300">
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

          {/* Selected Date Panchangam Details Card */}
          <div className="bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-3.5 rounded-2xl border border-amber-200/80 space-y-2 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="font-extrabold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                <span>📅 {tamilInfo.formattedFullDay || tamilInfo.formattedDualDate}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {tamilInfo.tithiTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-lg border border-amber-200">
                    🌕 {tamilInfo.tithiTa}
                  </span>
                )}
                {tamilInfo.nakshatraNameTa && (
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    ⭐ {tamilInfo.nakshatraNameTa}
                  </span>
                )}
              </div>
            </div>

            {/* Nalla Neram / Gowri / Rahu kalam formatted in 12-Hour (AM/PM) */}
            <div className="pt-1.5 border-t border-amber-200/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-white/85 p-2 rounded-xl border border-emerald-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-emerald-800 tracking-wider">
                  🪔 நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-emerald-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.nallaNeram)}
                </span>
              </div>

              <div className="bg-white/85 p-2 rounded-xl border border-amber-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  ✨ கௌரி நல்ல நேரம்
                </span>
                <span className="text-[11px] font-bold text-amber-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.gowriNallaNeram)}
                </span>
              </div>

              <div className="bg-white/85 p-2 rounded-xl border border-rose-200/80 flex flex-col justify-between">
                <span className="text-[10px] font-black uppercase text-rose-800 tracking-wider">
                  ⛔ ராகு காலம்
                </span>
                <span className="text-[11px] font-bold text-rose-950 mt-0.5 leading-snug">
                  {formatRangeTo12Hr(tamilInfo.rahuKalam)}
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
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0">
                <IndianRupee className="w-4 h-4 text-emerald-700" />
              </div>
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                4. கட்டணம் &amp; தட்சணை (Dakshina &amp; Payment)
              </h2>
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

          {/* Payment Mode Pills */}
          <div className="space-y-1.5">
            <label className="text-[10.5px] font-bold text-slate-500 uppercase tracking-wider block">
              கட்டண நிலை (Payment Status):
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("UNPAID")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                  paymentChoice === "UNPAID"
                    ? "bg-amber-600 text-white border-amber-600 font-black shadow-xs ring-1 ring-amber-400"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                Pending
              </button>
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("ADVANCE")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                  paymentChoice === "ADVANCE"
                    ? "bg-emerald-700 text-white border-emerald-700 font-black shadow-xs ring-1 ring-emerald-500"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                Advance
              </button>
              <button
                type="button"
                onClick={() => handlePaymentChoiceChange("FULL")}
                className={`py-2 rounded-xl transition border active:scale-95 cursor-pointer ${
                  paymentChoice === "FULL"
                    ? "bg-emerald-800 text-white border-emerald-800 font-black shadow-xs ring-1 ring-emerald-600"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                Paid
              </button>
            </div>
          </div>

          {paymentChoice === "ADVANCE" && (
            <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-1.5 animate-in fade-in">
              <label className="text-[11px] font-bold text-emerald-950 block">
                முன்பணத் தொகை (Advance Amount):
              </label>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-emerald-950">₹</span>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                  className="bg-white border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 focus:outline-none w-32"
                />
                <span className="text-xs text-slate-500 font-bold">
                  மீதி: ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                </span>
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
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-3 sm:px-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="font-black text-xs sm:text-sm truncate flex items-center gap-1.5">
              <span>👤</span>
              <span className={selectedCustomer ? "text-slate-900 font-extrabold" : "text-amber-700 font-bold"}>
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
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition active:scale-95 cursor-pointer shrink-0"
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 py-2.5 px-3 sm:px-4 shadow-2xl">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
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
            className="px-3.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center gap-1.5 shadow-lg shadow-emerald-900/20 transition active:scale-95 cursor-pointer shrink-0"
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
                  <span className="text-[10.5px] font-bold text-slate-500 block">கால அளவு: {currentPooja.durationMinutes || 120} நிமிடம்</span>
                  <span className="text-xs font-black text-emerald-950 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 inline-block mt-0.5">
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
                          {item.quantity} {formatUnitTamil(item.unit)}
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

                {paymentChoice === "ADVANCE" && (
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 pt-1 border-t border-amber-100">
                    <span>முன்பணம்: ₹{advanceAmount.toLocaleString("en-IN")}</span>
                    <span className="text-rose-700">மீதம்: ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}</span>
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
                onClick={handleFinalConfirmBooking}
                className="py-2.5 px-3 bg-gradient-to-r from-emerald-800 to-[#0b2b17] hover:from-emerald-700 hover:to-emerald-900 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 text-center"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Confirm &amp; Book ✨</span>
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
