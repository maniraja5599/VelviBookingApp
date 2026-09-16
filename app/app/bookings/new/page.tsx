"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { db } from "@/lib/db/store";
import { Booking, BookingItem, Customer, Pooja, PoojaItemTemplate } from "@/lib/types";
import {
  normalizeIndianMobile,
  cleanPastedIndianMobile,
  inspectIndianMobile,
} from "@/lib/utils/phone";
import {
  ArrowLeft,
  ArrowRight,
  User,
  Flame,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  IndianRupee,
  AlertTriangle,
  Plus,
  Minus,
  CheckCircle2,
  X,
  Sparkles,
  Edit2,
  Trash2,
  Clipboard,
  Search,
  Phone,
  Check,
  ChevronRight,
  ChevronLeft,
  ShieldCheck,
  CheckSquare,
  Square,
  MessageCircle,
  HelpCircle,
  CalendarDays,
  Layers,
  Percent,
  Share2,
  Copy,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import {
  getTamilDate,
  formatTimeRangeTo12H,
  getLocalDateString,
  TamilDateInfo,
} from "@/lib/calendar/tamil";

const TIME_PRESETS = [
  { time: "06:00 AM", label: "06:00 AM", tag: "Brahma Muhurtham" },
  { time: "07:15 AM", label: "07:15 AM", tag: "Morning" },
  { time: "08:30 AM", label: "08:30 AM", tag: "Morning" },
  { time: "09:45 AM", label: "09:45 AM", tag: "Mid-Morning" },
  { time: "11:00 AM", label: "11:00 AM", tag: "Noon" },
  { time: "04:30 PM", label: "04:30 PM", tag: "Evening" },
  { time: "06:00 PM", label: "06:00 PM", tag: "Pradosham / Sandhya" },
  { time: "07:15 PM", label: "07:15 PM", tag: "Night" },
];

const PRESET_POOJA_CATALOG = [
  {
    englishName: "Ganapathi Homam",
    tamilName: "கணபதி ஹோமம்",
    description: "Invokes Lord Ganesha for removing obstacles, auspicious beginnings & family prosperity.",
    durationMinutes: 120,
    basePrice: 5000,
    items: [
      { name: "Cow Ghee (பசு நெய்)", quantity: 1, unit: "kg" },
      { name: "Homa Samithu (சமித்து கட்டுகள்)", quantity: 2, unit: "bundles" },
      { name: "Turmeric & Kumkum (மஞ்சள், குங்குமம்)", quantity: 1, unit: "set" },
      { name: "Betel Leaves & Nuts (வெற்றிலை, பாக்கு)", quantity: 25, unit: "leaves" },
      { name: "Fresh Coconuts (தேங்காய்)", quantity: 5, unit: "nos" },
      { name: "Pooja Flowers & Garland (பூக்கள் & மாலை)", quantity: 1, unit: "set" },
      { name: "Modak / Kozhukattai Prasad (கொழுக்கட்டை)", quantity: 21, unit: "nos" },
    ],
  },
  {
    englishName: "Maha Sudarshana Homam",
    tamilName: "மகா சுதர்சன ஹோமம்",
    description: "Powerful Vedic ritual for protection against negative forces, evil eye, divine health & victory.",
    durationMinutes: 180,
    basePrice: 7500,
    items: [
      { name: "Pure Ghee (சுத்தமான நெய்)", quantity: 2, unit: "kg" },
      { name: "Sudarshana Yantra & Samithu", quantity: 3, unit: "bundles" },
      { name: "Navadhanyam (நவதானியம்)", quantity: 1, unit: "set" },
      { name: "Tulasi Leaves (துளசி மாலை)", quantity: 2, unit: "garlands" },
      { name: "Dry Fruits & Panchamirtham", quantity: 1, unit: "set" },
      { name: "Coconuts & Fruits (தேங்காய், பழங்கள்)", quantity: 7, unit: "nos" },
    ],
  },
  {
    englishName: "Rudrabhishekam & Homam",
    tamilName: "ருத்ராபிஷேகம் & ஹோமம்",
    description: "Sacred abhishekam with Sri Rudram chanting for inner peace, health, moksha and longevity.",
    durationMinutes: 150,
    basePrice: 6000,
    items: [
      { name: "Cow Milk, Curd, Honey & Ghee (பஞ்சாமிர்தம்)", quantity: 1, unit: "set" },
      { name: "Vilvam Leaves (வில்வ இலைகள்)", quantity: 108, unit: "leaves" },
      { name: "Vibhoothi & Sandal Paste (விபூதி, சந்தனம்)", quantity: 1, unit: "set" },
      { name: "Homa Dravyam & Samithu", quantity: 2, unit: "bundles" },
    ],
  },
  {
    englishName: "Gruhapravesam & Vastu Homam",
    tamilName: "கிரகப்பிரவேசம் & வாஸ்து ஹோமம்",
    description: "Traditional house-warming ceremony invoking Vastu Purusha, Ganapathi, Navagraha & Mahalakshmi.",
    durationMinutes: 240,
    basePrice: 12000,
    items: [
      { name: "Navadhanyam & Navaratnam Set", quantity: 1, unit: "set" },
      { name: "Vastu Yantra & Homa Sticks", quantity: 4, unit: "bundles" },
      { name: "Milk for Boiling (பால் காய்ச்சுதல்)", quantity: 2, unit: "litres" },
      { name: "Purnahuti Silk Cloth (பூர்ணாஹுதி பட்டு)", quantity: 1, unit: "piece" },
      { name: "Mango Leaves & Toranam (மாவிலை தோரணம்)", quantity: 2, unit: "sets" },
    ],
  },
  {
    englishName: "Sri Satyanarayana Pooja",
    tamilName: "ஸ்ரீ சத்யநாராயண பூஜை",
    description: "Sacred full-moon / pournami pooja with 5-chapter katha & prasad for family welfare & peace.",
    durationMinutes: 120,
    basePrice: 4000,
    items: [
      { name: "Rava Kesari / Wheat Sheera Prasad", quantity: 1, unit: "bowl" },
      { name: "Satyanarayana Photo / Murti Peedam", quantity: 1, unit: "set" },
      { name: "Tulasi & Betel Leaves", quantity: 50, unit: "leaves" },
      { name: "Pooja Vidhanam & Flowers", quantity: 1, unit: "set" },
    ],
  },
];

function NewBookingWizardForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get("date") || getLocalDateString();
  const initialPoojaId = searchParams.get("poojaId");
  const initialCustomerId = searchParams.get("customerId");
  const initialTime = searchParams.get("time");

  const { currentBusiness } = useAuth();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  // Data store state
  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const members = useMemo(() => db.getMembers(businessId), [businessId]);
  const existingBookings = useMemo(() => db.getBookings(businessId), [businessId]);

  useEffect(() => {
    setPoojas(db.getPoojas(businessId));
    setCustomers(db.getCustomers(businessId));
  }, [businessId]);

  // Multi-step Wizard Navigation (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Devotee State
  const [customerId, setCustomerId] = useState<string>(initialCustomerId || "");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  // Step 2: Pooja & Samagri State
  const [poojaId, setPoojaId] = useState<string>(initialPoojaId || "");
  const [samagriItems, setSamagriItems] = useState<BookingItem[]>([]);
  const [editingSamagriId, setEditingSamagriId] = useState<string | null>(null);
  const [newSamagriNameEn, setNewSamagriNameEn] = useState<string>("");
  const [newSamagriNameTa, setNewSamagriNameTa] = useState<string>("");
  const [newSamagriQty, setNewSamagriQty] = useState<number>(1);
  const [newSamagriUnit, setNewSamagriUnit] = useState<string>("kg");

  // Step 3: Calendar & Time State
  const [date, setDate] = useState<string>(initialDate);
  const [calendarYear, setCalendarYear] = useState<number>(
    new Date(initialDate).getFullYear() || new Date().getFullYear()
  );
  const [calendarMonth, setCalendarMonth] = useState<number>(
    new Date(initialDate).getMonth() || new Date().getMonth()
  ); // 0-11
  const [timeHour, setTimeHour] = useState<string>("07");
  const [timeMinute, setTimeMinute] = useState<string>("00");
  const [timeMeridiem, setTimeMeridiem] = useState<"AM" | "PM">("AM");

  // Step 4: Pricing, Assignment & Notes
  const [amount, setAmount] = useState<number>(5000);
  const [advanceAmount, setAdvanceAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("UPI");
  const [upiRefId, setUpiRefId] = useState<string>("");
  const [assignedIyerId, setAssignedIyerId] = useState<string>("self"); // Default to Self (நானே செய்கிறேன்)
  const [location, setLocation] = useState<string>("Namakkal");
  const [notes, setNotes] = useState<string>("");

  // Tamil Priest Names and Roles Mapping
  const getPriestTamilName = (m: any) => {
    const nameMap: Record<string, string> = {
      "Ravi Iyer": "ரவி சாஸ்திரிகள்",
      "Sundaram": "சுந்தரம் ஐயர்",
      "Sundaram Iyer": "சுந்தரம் ஐயர்",
      "Subramanian": "சுப்பிரமணிய சிவாச்சாரியார்",
      "Venkatesan": "வெங்கடேசன் சாஸ்திரி",
      "Ganesh Iyer": "கணேஷ் ஐயர்",
    };
    return nameMap[m?.name] || m?.name || "குருக்கள்";
  };

  const getPriestTamilRole = (m: any) => {
    return m?.role === "OWNER" || m?.role === "LEAD" ? "தலைமை குருக்கள்" : "உதவி குருக்கள்";
  };

  // Modals & Feedback
  const [stepError, setStepError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Quick Add Devotee Modal
  const [showAddCustomerModal, setShowAddCustomerModal] = useState<boolean>(false);
  const [newCustName, setNewCustName] = useState<string>("");
  const [newCustMobile, setNewCustMobile] = useState<string>("");
  const [newCustCity, setNewCustCity] = useState<string>("Namakkal");
  const [newCustAddress, setNewCustAddress] = useState<string>("");
  const [newCustNotes, setNewCustNotes] = useState<string>("");
  const [custModalError, setCustModalError] = useState<string>("");

  // Add/Edit Pooja Modal
  const [showPoojaModal, setShowPoojaModal] = useState<boolean>(false);
  const [poojaModalNameEn, setPoojaModalNameEn] = useState<string>("");
  const [poojaModalNameTa, setPoojaModalNameTa] = useState<string>("");
  const [poojaModalPrice, setPoojaModalPrice] = useState<number>(5000);
  const [poojaModalDuration, setPoojaModalDuration] = useState<number>(120);
  const [poojaModalDesc, setPoojaModalDesc] = useState<string>("");

  // Selected Objects
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === customerId),
    [customers, customerId]
  );
  const selectedPooja = useMemo(
    () => poojas.find((p) => p.id === poojaId),
    [poojas, poojaId]
  );

  // Constructed Time String (e.g. "07:00 AM")
  const selectedTime = `${timeHour}:${timeMinute} ${timeMeridiem}`;

  // Draft Auto-Save Key
  const DRAFT_STORAGE_KEY = `velvi_booking_draft_${businessId}`;
  const [isDraftRestored, setIsDraftRestored] = useState(false);
  const [hasActiveDraft, setHasActiveDraft] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const prevPoojaIdRef = React.useRef<string>(poojaId);

  // 1. RESTORE DRAFT ON MOUNT (Keeps exact page, step & data where user left off)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (rawDraft) {
          const draft = JSON.parse(rawDraft);
          if (draft && typeof draft === "object") {
            if (draft.currentStep) setCurrentStep(draft.currentStep);
            if (draft.customerId) setCustomerId(draft.customerId);
            if (draft.poojaId) {
              setPoojaId(draft.poojaId);
              prevPoojaIdRef.current = draft.poojaId;
            }
            if (Array.isArray(draft.samagriItems) && draft.samagriItems.length > 0) {
              setSamagriItems(draft.samagriItems);
            }
            if (draft.date) setDate(draft.date);
            if (draft.calendarYear) setCalendarYear(draft.calendarYear);
            if (draft.calendarMonth !== undefined) setCalendarMonth(draft.calendarMonth);
            if (draft.timeHour) setTimeHour(draft.timeHour);
            if (draft.timeMinute) setTimeMinute(draft.timeMinute);
            if (draft.timeMeridiem) setTimeMeridiem(draft.timeMeridiem);
            if (draft.amount !== undefined) setAmount(draft.amount);
            if (draft.advanceAmount !== undefined) setAdvanceAmount(draft.advanceAmount);
            if (draft.paymentMode) setPaymentMode(draft.paymentMode);
            if (draft.upiRefId !== undefined) setUpiRefId(draft.upiRefId);
            if (draft.assignedIyerId) setAssignedIyerId(draft.assignedIyerId);
            if (draft.location !== undefined) setLocation(draft.location);
            if (draft.notes !== undefined) setNotes(draft.notes);
            setHasActiveDraft(true);
          }
        }
      }
    } catch (err) {
      console.error("Error restoring draft:", err);
    } finally {
      setIsDraftRestored(true);
    }
  }, [businessId, DRAFT_STORAGE_KEY]);

  // 2. AUTO-SAVE DRAFT ON ANY EDIT
  useEffect(() => {
    if (!isDraftRestored) return;
    try {
      if (typeof window !== "undefined") {
        const draftPayload = {
          currentStep,
          customerId,
          poojaId,
          samagriItems,
          date,
          calendarYear,
          calendarMonth,
          timeHour,
          timeMinute,
          timeMeridiem,
          amount,
          advanceAmount,
          paymentMode,
          upiRefId,
          assignedIyerId,
          location,
          notes,
          updatedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
        setHasActiveDraft(true);
      }
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  }, [
    isDraftRestored,
    currentStep,
    customerId,
    poojaId,
    samagriItems,
    date,
    calendarYear,
    calendarMonth,
    timeHour,
    timeMinute,
    timeMeridiem,
    amount,
    advanceAmount,
    paymentMode,
    upiRefId,
    assignedIyerId,
    location,
    notes,
    DRAFT_STORAGE_KEY,
  ]);

  // Clear / Reset Draft
  const handleClearDraft = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    } catch (e) {}
    setHasActiveDraft(false);
    setCurrentStep(1);
    setCustomerId("");
    setPoojaId("");
    setSamagriItems([]);
    setDate(getLocalDateString());
    setTimeHour("07");
    setTimeMinute("00");
    setTimeMeridiem("AM");
    setAmount(5000);
    setAdvanceAmount(0);
    setPaymentMode("UPI");
    setUpiRefId("");
    setLocation("Namakkal");
    setNotes("");
  };

  // When pooja selection changes by user, update checklist items
  useEffect(() => {
    if (selectedPooja && isDraftRestored) {
      if (prevPoojaIdRef.current !== selectedPooja.id || samagriItems.length === 0) {
        prevPoojaIdRef.current = selectedPooja.id;
        setAmount(selectedPooja.basePrice || 5000);
        if (selectedPooja.items && selectedPooja.items.length > 0) {
          setSamagriItems(
            selectedPooja.items.map((item, idx) => ({
              id: `item-${Date.now()}-${idx}`,
              bookingId: "",
              itemEnglishName: item.itemEnglishName || "Samagri Item",
              itemTamilName: item.itemTamilName || item.itemEnglishName || "பூஜை பொருள்",
              quantity: item.quantity || 1,
              unit: item.unit || "units",
              isChecked: true,
              sortOrder: idx,
            }))
          );
        } else {
          // Fallback default checklist
          const matchingPreset = PRESET_POOJA_CATALOG.find(
            (p) => p.englishName.toLowerCase() === selectedPooja.englishName.toLowerCase()
          ) || PRESET_POOJA_CATALOG[0];

          setSamagriItems(
            matchingPreset.items.map((item, idx) => ({
              id: `item-def-${Date.now()}-${idx}`,
              bookingId: "",
              itemEnglishName: item.name.split(" (")[0],
              itemTamilName: item.name.includes("(") ? item.name.split("(")[1].replace(")", "") : item.name,
              quantity: item.quantity,
              unit: item.unit,
              isChecked: true,
              sortOrder: idx,
            }))
          );
        }
      }
    }
  }, [selectedPooja, isDraftRestored, samagriItems.length]);

  // Generate WhatsApp Share Message with Devotee, Date, Time & Samagri List
  const generateWhatsAppShareMessage = () => {
    const devoteeName = selectedCustomer?.name || "Devotee (பக்தர்)";
    const poojaName = `${selectedPooja?.englishName || "Pooja"} ${
      selectedPooja?.tamilName ? `(${selectedPooja.tamilName})` : ""
    }`;
    const includedItems = samagriItems.filter((i) => i.isChecked !== false);
    const itemsList = includedItems
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.itemEnglishName}${
            item.itemTamilName && item.itemTamilName !== item.itemEnglishName
              ? ` (${item.itemTamilName})`
              : ""
          }: ${item.quantity} ${item.unit}`
      )
      .join("\n");

    return `🙏 *ஓம் நமோ நாராயணாய | Velvi Pooja Booking*

வணக்கம் *${devoteeName}*,

தங்களின் பூஜை முன்பதிவு மற்றும் தேவையான பூஜை சாமான்கள் பட்டியல்:

🪔 *பூஜை / Pooja:* ${poojaName}
📅 *தேதி / Date:* ${date}
⏰ *நேரம் / Auspicious Time:* ${selectedTime}
📍 *இடம் / Venue:* ${location || selectedCustomer?.city || "Namakkal"}
${notes ? `📝 *சங்கல்பக் குறிப்பு / Notes:* ${notes}\n` : ""}
📋 *தேவையான பூஜை சாமான்கள் பட்டியல் (${includedItems.length} பொருட்கள்):*
${itemsList || "அனைத்து பொருட்களும் குருக்கள் ஏற்பாடு செய்வார்."}

தயவுசெய்து பூஜை தொடங்குவதற்கு முன் மேற்கண்ட பொருட்களைத் தயார் செய்து வைக்கவும்.

நன்றி & சுபமஸ்து! ✨
_Velvi Booking App_`;
  };

  // Send WhatsApp Direct to Devotee
  const handleShareWhatsApp = () => {
    const text = generateWhatsAppShareMessage();
    const rawMobile = selectedCustomer?.mobile ? selectedCustomer.mobile.replace(/\D/g, "") : "";
    const cleanPhone =
      rawMobile.length === 10 ? `91${rawMobile}` : rawMobile.length === 12 ? rawMobile : "";
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
  };

  // Copy Formatted Text to Clipboard
  const handleCopyShareText = () => {
    const text = generateWhatsAppShareMessage();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2500);
    }
  };

  // Calculate devotee past bookings count
  const devoteePastBookingsCount = useMemo(() => {
    if (!selectedCustomer) return 0;
    return existingBookings.filter(
      (b) => b.customerId === selectedCustomer.id || b.customerMobile === selectedCustomer.mobile
    ).length;
  }, [existingBookings, selectedCustomer]);

  // Calendar Grid for Selected Month/Year
  const calendarDaysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const calendarFirstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay(); // 0-6 (Sun-Sat)
  const calendarMonthNameEn = new Date(calendarYear, calendarMonth, 1).toLocaleDateString("en-US", {
    month: "long",
  });

  // Selected date info
  const selectedDateInfo = useMemo(() => getTamilDate(date), [date]);

  // Existing bookings on selected date
  const selectedDateBookings = useMemo(() => {
    return existingBookings.filter((b) => b.date === date && b.status !== "CANCELLED");
  }, [existingBookings, date]);

  // Double-booking / Collision conflict detection for selected date & time
  const conflictingBookings = useMemo(() => {
    if (!date || !selectedTime) return [];
    return existingBookings.filter(
      (b) =>
        b.date === date &&
        b.startTime?.toLowerCase().trim() === selectedTime.toLowerCase().trim() &&
        b.status !== "CANCELLED"
    );
  }, [existingBookings, date, selectedTime]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    if (!customerSearchQuery.trim()) return customers;
    const q = customerSearchQuery.trim().toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.mobile && c.mobile.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q)) ||
        (c.notes && c.notes.toLowerCase().includes(q))
    );
  }, [customers, customerSearchQuery]);

  // Handle Quick Add Devotee
  const handleSaveQuickCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustModalError("");

    if (!newCustName.trim()) {
      setCustModalError("Devotee name is required.");
      return;
    }

    let normalizedMobile = "";
    if (newCustMobile.trim()) {
      const cleanDigits = newCustMobile.replace(/\D/g, "");
      if (cleanDigits.length !== 10) {
        setCustModalError("Please enter a valid 10-digit mobile number or leave blank.");
        return;
      }
      normalizedMobile = normalizeIndianMobile(cleanDigits);
    }

    const created = db.createCustomer({
      businessId,
      name: newCustName.trim(),
      mobile: normalizedMobile,
      city: newCustCity.trim() || "Namakkal",
      address: newCustAddress.trim(),
      notes: newCustNotes.trim(),
    });

    const updated = db.getCustomers(businessId);
    setCustomers(updated);
    setCustomerId(created.id);
    setShowAddCustomerModal(false);
    setNewCustName("");
    setNewCustMobile("");
    setNewCustAddress("");
    setNewCustNotes("");
  };

  // Handle Quick Add Pooja
  const handleSavePoojaModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poojaModalNameEn.trim()) return;

    const created = db.createPooja({
      businessId,
      englishName: poojaModalNameEn.trim(),
      tamilName: poojaModalNameTa.trim() || poojaModalNameEn.trim(),
      basePrice: Number(poojaModalPrice) || 5000,
      durationMinutes: Number(poojaModalDuration) || 120,
      description: poojaModalDesc.trim(),
    });

    const updated = db.getPoojas(businessId);
    setPoojas(updated);
    setPoojaId(created.id);
    setShowPoojaModal(false);
    setPoojaModalNameEn("");
    setPoojaModalNameTa("");
    setPoojaModalDesc("");
  };

  // Toggle Samagri Item checkbox
  const handleToggleSamagri = (id: string) => {
    setSamagriItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isChecked: !item.isChecked } : item))
    );
  };

  // Adjust Samagri Quantity (+1 or -1)
  const handleUpdateSamagriQty = (id: string, delta: number) => {
    setSamagriItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(1, (Number(item.quantity) || 1) + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  // Direct Set Samagri Quantity
  const handleSetSamagriQty = (id: string, val: number) => {
    const nextQty = Math.max(1, isNaN(val) ? 1 : val);
    setSamagriItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: nextQty } : item))
    );
  };

  // Remove Samagri Item
  const handleRemoveSamagri = (id: string) => {
    setSamagriItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Add Custom Samagri Item
  const handleAddCustomSamagri = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSamagriNameEn.trim()) return;

    setSamagriItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        bookingId: "",
        itemEnglishName: newSamagriNameEn.trim(),
        itemTamilName: newSamagriNameTa.trim() || newSamagriNameEn.trim(),
        quantity: Number(newSamagriQty) || 1,
        unit: newSamagriUnit || "units",
        isChecked: true,
        sortOrder: prev.length + 1,
      },
    ]);
    setNewSamagriNameEn("");
    setNewSamagriNameTa("");
    setNewSamagriQty(1);
  };

  // Step Validation & Navigation
  const handleNextStep = () => {
    setStepError("");
    if (currentStep === 1) {
      if (!customerId) {
        setStepError("Please select a devotee to continue.");
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!poojaId) {
        setStepError("Please select a Pooja ritual ceremony.");
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (!date) {
        setStepError("Please choose a booking date.");
        return;
      }
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    setStepError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
    }
  };

  // Final Booking Creation
  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setStepError("");

    if (!customerId) {
      setStepError("Devotee is missing. Please return to Step 1.");
      setCurrentStep(1);
      return;
    }
    if (!poojaId) {
      setStepError("Pooja is missing. Please return to Step 2.");
      setCurrentStep(2);
      return;
    }
    if (!date || !selectedTime) {
      setStepError("Date or time is missing. Please return to Step 3.");
      setCurrentStep(3);
      return;
    }

    setIsSubmitting(true);

    try {
      const balance = Math.max(0, amount - advanceAmount);
      const paymentStatus =
        balance === 0 ? "PAID" : advanceAmount > 0 ? "PARTIALLY_PAID" : "PENDING";

      const createdBooking = db.createBooking({
        businessId,
        customerId,
        customerName: selectedCustomer?.name || "Devotee",
        customerMobile: selectedCustomer?.mobile || "",
        customerAddress: selectedCustomer?.address || "",
        poojaId,
        poojaEnglishName: selectedPooja?.englishName || "Pooja",
        poojaTamilName: selectedPooja?.tamilName || "",
        date,
        startTime: selectedTime,
        endTime: selectedTime,
        durationMinutes: selectedPooja?.durationMinutes || 120,
        location: location.trim() || selectedCustomer?.city || "Namakkal",
        totalAmount: Number(amount) || 0,
        advanceAmount: Number(advanceAmount) || 0,
        balanceAmount: balance,
        paymentStatus,
        status: "CONFIRMED",
        assignedIyerId:
          assignedIyerId === "self" || !assignedIyerId
            ? members.find((m) => m.role === "OWNER")?.id || members[0]?.id || "u-ravi-iyer-01"
            : assignedIyerId,
        assignedIyerName:
          assignedIyerId === "self" || !assignedIyerId
            ? `${getPriestTamilName(members.find((m) => m.role === "OWNER") || members[0])} (தலைமை குருக்கள்)`
            : `${getPriestTamilName(members.find((m) => m.id === assignedIyerId) || members[0])} (${getPriestTamilRole(members.find((m) => m.id === assignedIyerId) || members[0])})`,
        items: samagriItems.filter((i) => i.isChecked !== false),
        notes: notes.trim(),
      });

      // Clear auto-saved draft upon successful booking creation
      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch (e) {}

      router.push(`/app/bookings/${createdBooking.id}?created=true`);
    } catch (err: any) {
      console.error(err);
      setStepError(err.message || "Failed to create booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* Top Header with Auto-Save Indicator */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/app/bookings"
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-600"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 leading-tight">
                New Pooja Booking
              </h1>
              {hasActiveDraft && (
                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-black flex items-center gap-1 shadow-2xs">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Draft Auto-Saved</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Step {currentStep} of 4 • {currentStep === 1 && "Select Devotee"}
              {currentStep === 2 && "Pooja & Samagri Checklist"}
              {currentStep === 3 && "Date, Calendar & Auspicious Time"}
              {currentStep === 4 && "Review, Payment & Confirm"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {hasActiveDraft && (
            <button
              type="button"
              onClick={handleClearDraft}
              className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 transition flex items-center gap-1"
              title="Reset all fields and start fresh"
            >
              <RotateCcw className="w-3 h-3 text-slate-400 group-hover:text-rose-600" />
              <span>Reset</span>
            </button>
          )}

          <Link
            href="/app/bookings"
            className="text-xs font-bold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
        <div className="grid grid-cols-4 gap-2">
          {[
            { step: 1, title: "Devotee", subtitle: "பக்தர்" },
            { step: 2, title: "Pooja", subtitle: "ஹோமம் & சாமான்கள்" },
            { step: 3, title: "Date & Time", subtitle: "தேதி & நேரம்" },
            { step: 4, title: "Review", subtitle: "கட்டணம் & உறுதி" },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step < currentStep) {
                    setCurrentStep(s.step as any);
                  }
                }}
                disabled={s.step > currentStep}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition ${
                  isCurrent
                    ? "bg-amber-500 text-white font-black shadow-xs ring-2 ring-amber-400/40"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-900 border border-emerald-200 cursor-pointer"
                    : "bg-slate-50 text-slate-400 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-black">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span>{s.step}.</span>
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                <div
                  className={`text-[10px] mt-0.5 font-medium truncate max-w-[70px] ${
                    isCurrent ? "text-amber-100" : "text-slate-500"
                  }`}
                >
                  {s.subtitle}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {stepError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs px-3.5 py-2.5 rounded-xl font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{stepError}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: DEVOTEE SEARCH & SELECTION                                        */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-amber-600" /> 1. Select Devotee (பக்தர் விவரம்)
              </h2>
              <p className="text-xs text-slate-500">
                Search devotee by name, phone (+91), city, or create a new devotee card.
              </p>
            </div>

            <button
              type="button"
              id="addDevoteeBtn"
              onClick={() => {
                setCustModalError("");
                setShowAddCustomerModal(true);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Devotee</span>
            </button>
          </div>

          {/* If Devotee is Selected: Detailed Showcase Card */}
          {selectedCustomer ? (
            <div className="bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 p-4 rounded-2xl border-2 border-amber-400 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-amber-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base text-slate-900 truncate">
                        {selectedCustomer.name}
                      </h3>
                      {devoteePastBookingsCount > 0 && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
                          {devoteePastBookingsCount} Past Bookings
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                      {selectedCustomer.mobile ? (
                        <a
                          href={`tel:${selectedCustomer.mobile}`}
                          className="flex items-center gap-1 font-bold text-slate-800 hover:text-amber-700"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{selectedCustomer.mobile}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400 italic">No phone registered</span>
                      )}

                      {selectedCustomer.mobile && (
                        <a
                          href={`https://wa.me/${selectedCustomer.mobile.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-0.5 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCustomerId("")}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shrink-0 transition"
                >
                  Change Devotee
                </button>
              </div>

              {/* Extended Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-amber-200/60 text-xs">
                <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">City & Address</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    {selectedCustomer.city || "Namakkal"} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ""}
                  </span>
                </div>

                <div className="bg-white/80 p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold block">Gothram & Kuladeivam Notes</span>
                  <span className="font-semibold text-amber-900 block mt-0.5 truncate">
                    {selectedCustomer.notes || "No special gothram notes"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Search and Devotee Pick Grid */
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search devotee by name, mobile, city, gothram..."
                  className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Devotee Results */}
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                {filteredCustomers.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-500">
                      No devotee found matching &quot;{customerSearchQuery}&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setNewCustName(customerSearchQuery);
                        setCustModalError("");
                        setShowAddCustomerModal(true);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Add &quot;{customerSearchQuery}&quot; as New Devotee</span>
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setCustomerId(c.id)}
                      className="bg-white hover:bg-amber-50/70 p-3 rounded-2xl border border-slate-200 hover:border-amber-300 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 group-hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 transition">
                          <User className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-extrabold text-xs text-slate-900 truncate">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                            {c.mobile ? <span>📱 {c.mobile}</span> : <span className="italic">No phone</span>}
                            <span>•</span>
                            <span>📍 {c.city || "Tamil Nadu"}</span>
                          </div>
                          {c.notes && (
                            <p className="text-[10px] text-amber-800 truncate mt-0.5">
                              🔖 {c.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-500 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition shadow-2xs"
                        title="Select Devotee"
                      >
                        <Check className="w-4 h-4 font-black" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-3">
            <button
              type="button"
              id="step1NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: POOJA SELECTION & SAMAGRI CHECKLIST OVERHAUL                     */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-600" /> 2. Choose Pooja & Samagri Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Select ritual ceremony, review items list, edit or add custom materials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowPoojaModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <Plus className="w-3.5 h-3.5 text-amber-700" />
              <span>Add Custom Pooja</span>
            </button>
          </div>

          {/* Compact Pooja Selection Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Select Pooja / Homam (பூஜை தேர்வு செய்க):
            </label>
            <select
              value={poojaId}
              onChange={(e) => setPoojaId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:border-amber-500"
            >
              <option value="">-- Choose Pooja from Catalog --</option>
              {poojas.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.englishName} {p.tamilName && p.tamilName !== p.englishName ? `(${p.tamilName})` : ""} — ₹{(p.basePrice || 0).toLocaleString()} ({p.durationMinutes || 120} mins)
                </option>
              ))}
            </select>
          </div>

          {/* Selected Pooja Full Details Card */}
          {selectedPooja && (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50 p-4 rounded-2xl border-2 border-amber-400 shadow-sm space-y-2.5 animate-in fade-in">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-900">
                      {selectedPooja.englishName}
                    </h3>
                    {selectedPooja.tamilName && (
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                        {selectedPooja.tamilName}
                      </span>
                    )}
                  </div>
                  {selectedPooja.description && (
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {selectedPooja.description}
                    </p>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-base font-black text-amber-900">
                    ₹{(selectedPooja.basePrice || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    ⏳ {selectedPooja.durationMinutes || 120} mins
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* THE PROMINENT SAMAGRI CHECKLIST SECTION */}
          {selectedPooja && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-850 flex items-center justify-center font-bold text-xs">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900">
                      Pooja Samagri Checklist ({samagriItems.length} Total Materials)
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      Tick to include/exclude. Change quantity using - / + or direct number.
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {samagriItems.filter((i) => i.isChecked !== false).length} of {samagriItems.length} Selected
                </div>
              </div>

              {/* Samagri Items List with Left Numbering & Right Aligned Quantities */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {samagriItems.map((item, idx) => {
                  const isIncluded = item.isChecked !== false;
                  return (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between gap-2.5 ${
                        isIncluded
                          ? "bg-emerald-50/40 border-emerald-300 text-slate-900 shadow-2xs"
                          : "bg-slate-50/70 border-slate-200 text-slate-400 opacity-60"
                      }`}
                    >
                      {/* Left Side: 1, 2, 3 Number + Tick Mark + Item Names */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-xs font-black text-slate-400 w-5 shrink-0 text-center select-none">
                          {idx + 1}.
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleSamagri(item.id)}
                          className="p-0.5 hover:bg-slate-200/50 rounded-lg transition shrink-0"
                          title={isIncluded ? "Click to exclude" : "Click to include"}
                        >
                          {isIncluded ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 fill-emerald-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300" />
                          )}
                        </button>

                        <div
                          onClick={() => handleToggleSamagri(item.id)}
                          className="min-w-0 flex-1 cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`font-black text-xs ${
                                isIncluded ? "text-slate-900" : "text-slate-400 line-through"
                              }`}
                            >
                              {item.itemEnglishName}
                            </span>
                            {item.itemTamilName && item.itemTamilName !== item.itemEnglishName && (
                              <span
                                className={`text-[11px] font-semibold ${
                                  isIncluded
                                    ? "text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded"
                                    : "text-slate-400"
                                }`}
                              >
                                ({item.itemTamilName})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side: Straight Aligned Easy Quantity Stepper + Unit + Delete */}
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateSamagriQty(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              handleSetSamagriQty(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-10 text-center text-xs font-black text-slate-900 bg-transparent focus:outline-none focus:bg-amber-50/50 rounded py-0.5"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateSamagriQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2 py-1 rounded-md min-w-[34px] text-center">
                          {item.unit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveSamagri(item.id)}
                          className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Samagri Form */}
              <form
                onSubmit={handleAddCustomSamagri}
                className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2"
              >
                <span className="text-[11px] font-bold text-slate-700 block">
                  + Add Custom Samagri Item (புதிய பொருள் சேர்க்க):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="English Name (e.g. Honey)"
                    value={newSamagriNameEn}
                    onChange={(e) => setNewSamagriNameEn(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="text"
                    placeholder="Tamil Name (e.g. தேன்)"
                    value={newSamagriNameTa}
                    onChange={(e) => setNewSamagriNameTa(e.target.value)}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={1}
                      value={newSamagriQty}
                      onChange={(e) => setNewSamagriQty(Number(e.target.value))}
                      className="w-14 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs font-bold text-slate-900 text-center"
                    />
                    <select
                      value={newSamagriUnit}
                      onChange={(e) => setNewSamagriUnit(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-lg px-1.5 py-1.5 text-xs font-medium text-slate-900"
                    >
                      <option value="kg">kg</option>
                      <option value="g">g</option>
                      <option value="litre">litre</option>
                      <option value="nos">nos</option>
                      <option value="bundle">bundle</option>
                      <option value="packet">packet</option>
                      <option value="set">set</option>
                    </select>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shrink-0 shadow-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>

              {/* DEDICATED LIVE SELECTED SAMAGRI PREVIEW BOX (FULL DISPLAY & WHATSAPP SHARE) */}
              <div className="bg-amber-50/70 rounded-2xl p-4 border-2 border-amber-300 shadow-sm space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-amber-700 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        Selected Items Preview (தேர்வு செய்யப்பட்ட பொருட்கள்)
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        Complete list of materials to prepare before pooja ceremony.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs">
                    ✨ {samagriItems.filter((i) => i.isChecked !== false).length} Materials Selected
                  </span>
                </div>

                {/* Devotee & Pooja Confirmation Header Bar */}
                <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200 text-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-slate-900 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-600" />
                      {selectedCustomer?.name || "Devotee"}
                    </span>
                    {selectedCustomer?.mobile && (
                      <span className="text-[11px] text-slate-500 font-bold">
                        📱 {selectedCustomer.mobile}
                      </span>
                    )}
                    <span className="text-slate-300">•</span>
                    <span className="text-amber-800 font-black">
                      📅 {date} ({selectedTime})
                    </span>
                  </div>

                  {/* WhatsApp Direct Share & Copy Text Buttons */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleCopyShareText}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[11px] font-bold flex items-center gap-1 transition shadow-2xs"
                      title="Copy complete pooja & samagri text"
                    >
                      {copiedShare ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Copy List</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-xs transition active:scale-95"
                      title="Send full details and samagri list directly to customer WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>Send to Devotee</span>
                    </button>
                  </div>
                </div>

                {/* FULL ITEMS DISPLAY (No scroll - all items clearly visible) */}
                {samagriItems.filter((i) => i.isChecked !== false).length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
                    {samagriItems
                      .filter((i) => i.isChecked !== false)
                      .map((i, pIdx) => (
                        <div
                          key={i.id}
                          className="bg-white p-2.5 rounded-xl border border-amber-200/90 text-xs shadow-2xs flex items-center justify-between gap-2 hover:border-amber-400 transition"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-black text-amber-900 bg-amber-100/80 w-5 h-5 rounded-md flex items-center justify-center shrink-0">
                              {pIdx + 1}
                            </span>
                            <span className="font-extrabold text-slate-900 truncate">
                              {i.itemEnglishName}
                            </span>
                            {i.itemTamilName && i.itemTamilName !== i.itemEnglishName && (
                              <span className="text-[10px] text-amber-800 truncate font-semibold">
                                ({i.itemTamilName})
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md shrink-0 border border-slate-200">
                            {i.quantity} {i.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-amber-800 italic bg-white/70 p-3 rounded-xl border border-amber-200">
                    No items selected yet. Click any tick mark in the checklist above to include materials.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step2NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DATE, RICH CALENDAR & TIME (15-MIN INTERVALS) + CONFLICT WARNING   */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <CalendarIcon className="w-4 h-4 text-amber-600" /> 3. Schedule Date & Auspicious Time
            </h2>
            <p className="text-xs text-slate-500">
              Interactive Tamil calendar grid, 15-min interval time selector, and collision detection.
            </p>
          </div>

          {/* FULL INTERACTIVE CALENDAR GRID WITH MONTH/YEAR PICKER */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3">
            {/* Month & Year Header Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear((y) => y - 1);
                    } else {
                      setCalendarMonth((m) => m - 1);
                    }
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <h3 className="font-black text-sm text-slate-900">
                  {calendarMonthNameEn} {calendarYear}
                </h3>

                <button
                  type="button"
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear((y) => y + 1);
                    } else {
                      setCalendarMonth((m) => m + 1);
                    }
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Today Shortcut */}
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCalendarYear(now.getFullYear());
                  setCalendarMonth(now.getMonth());
                  setDate(getLocalDateString());
                }}
                className="text-[11px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
              >
                Today
              </button>
            </div>

            {/* Calendar Weekday Header */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-100">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Days Matrix */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty leading padding slots */}
              {Array.from({ length: calendarFirstDayIndex }).map((_, idx) => (
                <div key={`empty-${idx}`} className="h-14 rounded-xl bg-slate-50/40" />
              ))}

              {/* Day Cells */}
              {Array.from({ length: calendarDaysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const cellDateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(
                  2,
                  "0"
                )}-${String(dayNum).padStart(2, "0")}`;
                const cellInfo = getTamilDate(cellDateStr);
                const isSelected = date === cellDateStr;
                const isToday = cellDateStr === getLocalDateString();
                const dayBookingsCount = existingBookings.filter(
                  (b) => b.date === cellDateStr && b.status !== "CANCELLED"
                ).length;

                return (
                  <button
                    key={cellDateStr}
                    type="button"
                    onClick={() => setDate(cellDateStr)}
                    className={`h-14 p-1 rounded-xl border flex flex-col justify-between items-center text-center transition relative ${
                      isSelected
                        ? "bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-400/40"
                        : isToday
                        ? "bg-amber-50/60 border-amber-300 text-slate-900"
                        : "bg-white border-slate-100 hover:border-amber-300 text-slate-800 hover:bg-amber-50/30"
                    }`}
                  >
                    <span className="text-xs font-black leading-none">{dayNum}</span>
                    <span
                      className={`text-[8.5px] font-semibold truncate max-w-full ${
                        isSelected ? "text-amber-100" : "text-amber-800"
                      }`}
                    >
                      {cellInfo.tamilDay}
                    </span>

                    {/* Sacred Day or Booking Dot Indicator */}
                    <div className="flex items-center gap-0.5 mt-0.5">
                      {cellInfo.specialDayIcon ? (
                        <span className="text-[10px] leading-none">{cellInfo.specialDayIcon}</span>
                      ) : dayBookingsCount > 0 ? (
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? "bg-white" : "bg-emerald-600"
                          }`}
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME SELECTION WITH 15-MINUTE INTERVALS & AM/PM */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>Select Start Time (15-Min Intervals):</span>
            </label>

            {/* Structured Time Picker (Hours, Minutes, Meridiem) */}
            <div className="grid grid-cols-3 gap-2.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Hour Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Hour</label>
                <select
                  value={timeHour}
                  onChange={(e) => setTimeHour(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"].map(
                    (h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* 15-Minute Interval Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">
                  Minutes (15-min)
                </label>
                <select
                  value={timeMinute}
                  onChange={(e) => setTimeMinute(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500"
                >
                  {["00", "15", "30", "45"].map((m) => (
                    <option key={m} value={m}>
                      :{m} mins
                    </option>
                  ))}
                </select>
              </div>

              {/* AM / PM Toggle */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">AM / PM</label>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={() => setTimeMeridiem("AM")}
                    className={`py-2 rounded-lg text-xs font-black transition ${
                      timeMeridiem === "AM"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setTimeMeridiem("PM")}
                    className={`py-2 rounded-lg text-xs font-black transition ${
                      timeMeridiem === "PM"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200"
                    }`}
                  >
                    PM
                  </button>
                </div>
              </div>
            </div>

            {/* Quick 1-Tap Preset Chips */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Quick Preset Chips
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {TIME_PRESETS.map((p) => {
                  const isMatch = selectedTime === p.time;
                  return (
                    <button
                      key={p.time}
                      type="button"
                      onClick={() => {
                        const [hMin, mer] = p.time.split(" ");
                        const [h, m] = hMin.split(":");
                        setTimeHour(h);
                        setTimeMinute(m);
                        setTimeMeridiem(mer as any);
                      }}
                      className={`p-2 rounded-xl border text-left transition ${
                        isMatch
                          ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
                          : "bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xs font-black">{p.label}</div>
                      <div
                        className={`text-[9.5px] truncate ${
                          isMatch ? "text-amber-400 font-bold" : "text-slate-500"
                        }`}
                      >
                        {p.tag}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ⚠️ DOUBLE BOOKING / TIME SLOT COLLISION WARNING */}
          {conflictingBookings.length > 0 && (
            <div className="bg-rose-50 border-2 border-rose-300 p-3.5 rounded-2xl space-y-2 animate-in shake duration-200">
              <div className="flex items-center gap-2 text-rose-800 font-black text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  ⚠️ Time Slot Conflict ({conflictingBookings.length} existing booking scheduled)
                </span>
              </div>
              <div className="space-y-1 text-xs text-rose-950 bg-white/90 p-2.5 rounded-xl border border-rose-200">
                {conflictingBookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between gap-2">
                    <span className="font-bold">
                      {b.bookingNumber} • {b.customerName} ({b.poojaEnglishName})
                    </span>
                    <span className="text-[11px] font-medium text-rose-700 bg-rose-100 px-2 py-0.2 rounded">
                      ⏰ {b.startTime}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-rose-700 leading-tight">
                You can proceed if multiple priests will attend, or choose a different 15-minute slot.
              </p>
            </div>
          )}

          {/* Existing Bookings for Selected Date at a Glance */}
          {selectedDateBookings.length > 0 && conflictingBookings.length === 0 && (
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 block">
                📋 Other Bookings on {date} ({selectedDateBookings.length}):
              </span>
              <div className="space-y-1">
                {selectedDateBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-bold text-slate-800 truncate">
                      {b.customerName} ({b.poojaEnglishName})
                    </span>
                    <span className="text-slate-500 font-semibold">{b.startTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rich Panchangam Card for Selected Date */}
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-amber-50/60 p-3.5 rounded-2xl border border-amber-300 space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-slate-900">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                {selectedDateInfo.formattedDualDate} ({selectedDateInfo.dayOfWeekEn})
              </span>
              <span className="text-[11px] text-amber-900 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                {selectedDateInfo.tithiTa} • {selectedDateInfo.nakshatraNameTa}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-emerald-700 font-bold block">✨ நல்ல நேரம் (Nalla Neram):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.nallaNeram}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-amber-800 font-bold block">🪔 கௌரி (Gowri Nalla Neram):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.gowriNallaNeram}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-rose-700 font-bold block">⛔ ராகு காலம் (Rahu Kalam):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.rahuKalam}</span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-200">
                <span className="text-purple-700 font-bold block">⌛ குளிகை (Kuligai):</span>
                <span className="font-semibold text-slate-800">{selectedDateInfo.kuligai}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step3NextBtn"
              onClick={handleNextStep}
              className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: REVIEW SUMMARY & REVAMPED PAYMENT SECTION                         */}
      {/* ========================================================================= */}
      {currentStep === 4 && (
        <form onSubmit={handleCreateBooking} className="space-y-4 animate-in fade-in duration-150">
          <div>
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> 4. Review Summary & Payment Setup
            </h2>
            <p className="text-xs text-slate-500">
              Verify all details, configure advance payment shortcuts, and confirm booking.
            </p>
          </div>

          {/* Master Review Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Pooja Ceremony
                </span>
                <h3 className="font-black text-base text-slate-900 mt-0.5">
                  {selectedPooja?.englishName}{" "}
                  {selectedPooja?.tamilName && (
                    <span className="text-amber-800">({selectedPooja.tamilName})</span>
                  )}
                </h3>
                <span className="text-xs text-slate-500">⏳ Duration: {selectedPooja?.durationMinutes || 120} mins</span>
              </div>
              <span className="text-lg font-black text-amber-900">
                ₹{Number(amount || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Devotee Details</span>
                <div className="font-extrabold text-slate-900 mt-0.5">{selectedCustomer?.name}</div>
                <div className="text-[11px] text-slate-600">📱 {selectedCustomer?.mobile || "No phone"}</div>
                <div className="text-[11px] text-slate-500">📍 {selectedCustomer?.city || "Namakkal"}</div>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold block">Date & Auspicious Time</span>
                <div className="font-extrabold text-slate-900 mt-0.5">📅 {date}</div>
                <div className="text-[11px] text-slate-800 font-bold">⏰ {selectedTime}</div>
                <div className="text-[10px] text-amber-800">{selectedDateInfo.tithiTa}</div>
              </div>
            </div>

            <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200 text-xs flex items-center justify-between flex-wrap gap-2">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                {samagriItems.filter((i) => i.isChecked !== false).length} Samagri Checklist Items Included
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center gap-1 transition shadow-2xs"
                  title="Share details with devotee on WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                  <span>WhatsApp List</span>
                </button>

                <span className="text-[11px] font-bold text-emerald-800 hidden sm:inline">
                  Ready for Pooja ✓
                </span>
              </div>
            </div>
          </div>

          {/* REVAMPED PAYMENT SECTION WITH CLEAN LIGHT THEME */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700">
                  <IndianRupee className="w-3.5 h-3.5" />
                </div>
                <span>Payment & Fee Calculation (கட்டண விவரம்)</span>
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Direct Settlement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Total Pooja Fee (மொத்த கட்டணம் ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    required
                    min={0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/70">
                <label className="text-[10px] font-bold text-emerald-800 block mb-1">
                  Advance Received (முன்பணம் ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600">₹</span>
                  <input
                    type="number"
                    min={0}
                    max={amount}
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                    className="w-full bg-white border border-emerald-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-emerald-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/80 flex flex-col justify-between">
                <label className="text-[10px] font-bold text-amber-900 block">
                  Balance Due (மீதமுள்ள தொகை)
                </label>
                <div className="text-base font-black text-amber-900 py-0.5">
                  ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                </div>
              </div>
            </div>

            {/* Quick Advance Percentage Shortcuts */}
            <div className="flex items-center gap-1.5 text-xs flex-wrap pt-0.5">
              <span className="text-[11px] text-slate-500 font-bold mr-1">Advance Quick:</span>
              <button
                type="button"
                onClick={() => setAdvanceAmount(0)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  advanceAmount === 0
                    ? "bg-slate-800 text-white border-slate-800 shadow-2xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                }`}
              >
                ₹0 (Nil)
              </button>
              <button
                type="button"
                onClick={() => setAdvanceAmount(Math.round(amount * 0.25))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  advanceAmount === Math.round(amount * 0.25) && amount > 0
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                }`}
              >
                25% (₹{Math.round(amount * 0.25)})
              </button>
              <button
                type="button"
                onClick={() => setAdvanceAmount(Math.round(amount * 0.5))}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  advanceAmount === Math.round(amount * 0.5) && amount > 0
                    ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                    : "bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200"
                }`}
              >
                50% (₹{Math.round(amount * 0.5)})
              </button>
              <button
                type="button"
                onClick={() => setAdvanceAmount(amount)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                  advanceAmount === amount && amount > 0
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-2xs"
                    : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                }`}
              >
                100% Full Paid
              </button>
            </div>

            {/* Payment Method & Reference */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1.5 border-t border-slate-100">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Payment Method (செலுத்தும் முறை)
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                  <option value="CASH">Cash in Hand (ரொக்கம்)</option>
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT / IMPS)</option>
                </select>
              </div>

              {paymentMode === "UPI" && (
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    UPI Ref / UTR (விருப்பத் தேர்வு)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI/4098231"
                    value={upiRefId}
                    onChange={(e) => setUpiRefId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Priest Assignment & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  Assign Priest (செய்து வைக்கும் குருக்கள்)
                </label>
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                  {assignedIyerId === "self" ? "Self (நானே)" : "Assigned"}
                </span>
              </div>
              <select
                value={assignedIyerId}
                onChange={(e) => setAssignedIyerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              >
                <option value="self">
                  ✨ நானே செய்து வைக்கிறேன் (தலைமை குருக்கள் / Self)
                </option>
                {members.length > 0 && (
                  <optgroup label="வேறு குருக்களை நியமிக்க (Assign Other Priests):">
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {getPriestTamilName(m)} — {getPriestTamilRole(m)}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Ceremony Venue / Location (இடம்)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Namakkal / Devotee Residence"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Sankalpam Notes */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">
              Sankalpam Notes / Gothram / Nakshatram (சங்கல்பக் குறிப்புகள்)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Koundinya Gothram, Rohini Nakshatram, Family Welfare"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Final Action Buttons */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="confirmAndCreateBookingBtn"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-xl text-sm font-black shadow-md transition active:scale-95 flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>{isSubmitting ? "Creating Booking..." : "Confirm & Create Booking"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD DEVOTEE MODAL                                                   */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Add New Devotee</h3>
                  <p className="text-[10px] text-slate-500">Will be instantly selected for this booking</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {custModalError && (
              <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{custModalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveQuickCustomer} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Devotee Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Mobile Number (Optional)
                </label>
                <div className="flex items-center gap-1.5">
                  <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    value={newCustMobile}
                    onChange={(e) => setNewCustMobile(cleanPastedIndianMobile(e.target.value))}
                    maxLength={10}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Namakkal"
                    value={newCustCity}
                    onChange={(e) => setNewCustCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="Street / Area"
                    value={newCustAddress}
                    onChange={(e) => setNewCustAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Notes (Gothram / Nakshatram / Kuladeivam)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Koundinya Gothram, Rohini"
                  value={newCustNotes}
                  onChange={(e) => setNewCustNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD CUSTOM POOJA MODAL                                             */}
      {/* ========================================================================= */}
      {showPoojaModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-sm text-slate-900">Add Custom Pooja</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPoojaModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePoojaModal} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pooja English Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dhanvantri Homam"
                  value={poojaModalNameEn}
                  onChange={(e) => setPoojaModalNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Pooja Tamil Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. தன்வந்திரி ஹோமம்"
                  value={poojaModalNameTa}
                  onChange={(e) => setPoojaModalNameTa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Base Fee (₹)</label>
                  <input
                    type="number"
                    value={poojaModalPrice}
                    onChange={(e) => setPoojaModalPrice(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={poojaModalDuration}
                    onChange={(e) => setPoojaModalDuration(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Vedic significance..."
                  value={poojaModalDesc}
                  onChange={(e) => setPoojaModalDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPoojaModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-slate-500 font-medium">
          Loading booking wizard...
        </div>
      }
    >
      <NewBookingWizardForm />
    </Suspense>
  );
}
