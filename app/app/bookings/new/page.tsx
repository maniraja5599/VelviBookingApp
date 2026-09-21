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
  ChevronDown,
  ChevronUp,
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
  Wallet,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import {
  getTamilDate,
  formatTimeRangeTo12H,
  getLocalDateString,
  TamilDateInfo,
} from "@/lib/calendar/tamil";
import { formatBookingConfirmationWhatsAppMessage } from "@/lib/whatsapp/formatter";
import { BusinessMember } from "@/lib/types";

const TIME_BANDS = [
  {
    period: "காலை (Morning)",
    icon: "🌅",
    slots: [
      { time: "06:00 AM", label: "06:00 AM", tag: "பிரம்ம முகூர்த்தம்" },
      { time: "07:00 AM", label: "07:00 AM", tag: "காலை பூஜை" },
      { time: "07:15 AM", label: "07:15 AM", tag: "சுப வேளை" },
      { time: "08:30 AM", label: "08:30 AM", tag: "நற்பொழுது" },
      { time: "09:30 AM", label: "09:30 AM", tag: "முற்பகல்" },
    ],
  },
  {
    period: "நண்பகல் (Noon)",
    icon: "☀️",
    slots: [
      { time: "10:30 AM", label: "10:30 AM", tag: "நண்பகல்" },
      { time: "11:15 AM", label: "11:15 AM", tag: "உச்சிக்காலம்" },
      { time: "12:00 PM", label: "12:00 PM", tag: "மத்தியானம்" },
    ],
  },
  {
    period: "மாலை (Evening)",
    icon: "🌆",
    slots: [
      { time: "04:30 PM", label: "04:30 PM", tag: "சாயரட்சை" },
      { time: "05:30 PM", label: "05:30 PM", tag: "மாலை பூஜை" },
      { time: "06:00 PM", label: "06:00 PM", tag: "சந்தியா காலம்" },
      { time: "07:15 PM", label: "07:15 PM", tag: "இரவு பூஜை" },
    ],
  },
];

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
  const [allMembers, setAllMembers] = useState<BusinessMember[]>([]);
  const existingBookings = useMemo(() => db.getBookings(businessId), [businessId]);

  useEffect(() => {
    setPoojas(db.getPoojas(businessId));
    setCustomers(db.getCustomers(businessId));
    setAllMembers(db.getMembers(businessId));
  }, [businessId]);

  const members = allMembers.length > 0 ? allMembers : db.getMembers(businessId);

  // Multi-step Wizard Navigation (1, 2, 3, 4)
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Devotee State
  const [customerId, setCustomerId] = useState<string>(initialCustomerId || "");
  const [customerSearchQuery, setCustomerSearchQuery] = useState<string>("");

  // Step 2: Pooja & Samagri State
  const [poojaId, setPoojaId] = useState<string>(initialPoojaId || "");
  const [isMorePoojasOpen, setIsMorePoojasOpen] = useState<boolean>(false);
  const [poojaSearchQuery, setPoojaSearchQuery] = useState<string>("");
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
  const [paymentChoice, setPaymentChoice] = useState<"UNPAID" | "ADVANCE" | "FULL">("UNPAID");
  const [paymentMode, setPaymentMode] = useState<"UPI" | "CASH" | "BANK_TRANSFER">("CASH");
  const [upiRefId, setUpiRefId] = useState<string>("");
  const [assignedIyerId, setAssignedIyerId] = useState<string>("self"); // Default to Self (நானே செய்கிறேன்)
  const [location, setLocation] = useState<string>("Namakkal");
  const [notes, setNotes] = useState<string>("");

  // Step 4 UI toggles & Instant Add Assistant
  const [showPreviewItemsList, setShowPreviewItemsList] = useState<boolean>(false);
  const [isAddingAssistant, setIsAddingAssistant] = useState<boolean>(false);
  const [newAssistantName, setNewAssistantName] = useState<string>("");
  const [newAssistantMobile, setNewAssistantMobile] = useState<string>("");
  const [assistantError, setAssistantError] = useState<string>("");

  // Successful Booking Celebratory Modal State
  const [createdBookingResult, setCreatedBookingResult] = useState<Booking | null>(null);

  const handleCreateAssistant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssistantName.trim()) {
      setAssistantError("Please enter assistant priest name");
      return;
    }
    try {
      const created = db.createMember({
        businessId,
        name: newAssistantName.trim(),
        mobile: newAssistantMobile.trim(),
        role: "IYER",
        specialization: "உதவி குருக்கள் (Assistant Priest)",
      });
      setAllMembers(db.getMembers(businessId));
      setAssignedIyerId(created.id);
      setNewAssistantName("");
      setNewAssistantMobile("");
      setIsAddingAssistant(false);
      setAssistantError("");
    } catch (err: any) {
      setAssistantError(err.message || "Failed to add assistant");
    }
  };

  const handleShareCreatedWhatsApp = () => {
    if (!createdBookingResult || !currentBusiness) return;
    const msg = formatBookingConfirmationWhatsAppMessage(createdBookingResult, currentBusiness);
    const phone = createdBookingResult.customerMobile
      ? createdBookingResult.customerMobile.replace(/\D/g, "")
      : "";
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

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
  const [poojaModalPrice, setPoojaModalPrice] = useState<number | string>("");
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

  // Top Popular Poojas ordered 1, 2, 3...
  const topPoojas = useMemo(() => {
    const priorityKeywords = [
      "ganapathi",
      "navagraha",
      "gruhapravesam",
      "sudarshana",
      "rudra",
      "satyanarayana",
      "ayushya",
    ];

    const sorted = [...poojas].sort((a, b) => {
      const aIndex = priorityKeywords.findIndex((k) =>
        a.englishName.toLowerCase().includes(k)
      );
      const bIndex = priorityKeywords.findIndex((k) =>
        b.englishName.toLowerCase().includes(k)
      );
      const aPos = aIndex === -1 ? 999 : aIndex;
      const bPos = bIndex === -1 ? 999 : bIndex;
      return aPos - bPos;
    });

    return sorted.slice(0, 6);
  }, [poojas]);

  const filteredMorePoojas = useMemo(() => {
    if (!poojaSearchQuery.trim()) return poojas;
    const q = poojaSearchQuery.toLowerCase().trim();
    return poojas.filter(
      (p) =>
        p.englishName.toLowerCase().includes(q) ||
        (p.tamilName && p.tamilName.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
    );
  }, [poojas, poojaSearchQuery]);

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

  // Lock body scroll when any modal is open to prevent screen displacement and jump on mobile keyboard
  useEffect(() => {
    if (showAddCustomerModal || showPoojaModal) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
      };
    }
  }, [showAddCustomerModal, showPoojaModal]);

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
    if (!poojaModalNameEn.trim() && !poojaModalNameTa.trim()) return;

    const finalEn = poojaModalNameEn.trim() || poojaModalNameTa.trim();
    const finalTa = poojaModalNameTa.trim() || poojaModalNameEn.trim();

    const created = db.createPooja({
      businessId,
      englishName: finalEn,
      tamilName: finalTa,
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
          const nextQty = Math.max(1, item.quantity + delta);
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
    if (!newSamagriNameEn.trim() && !newSamagriNameTa.trim()) return;

    const finalEn = newSamagriNameEn.trim() || newSamagriNameTa.trim();
    const finalTa = newSamagriNameTa.trim() || newSamagriNameEn.trim();

    setSamagriItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        bookingId: "",
        itemEnglishName: finalEn,
        itemTamilName: finalTa,
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
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    setStepError("");
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3 | 4);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
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
        poojaEnglishName: selectedPooja?.englishName || selectedPooja?.tamilName || "Pooja",
        poojaTamilName: selectedPooja?.tamilName || selectedPooja?.englishName || "பூஜை",
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

      // Open celebratory confirmation window / modal
      setIsSubmitting(false);
      setCreatedBookingResult(createdBooking);
    } catch (err: any) {
      console.error(err);
      setStepError(err.message || "Failed to create booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-20">
      {/* Top Header with Compact Title & Subtle Auto-Save Indicator */}
      <div className="flex items-center justify-between pt-0.5">
        <div className="flex items-center gap-2">
          <Link
            href="/app/bookings"
            className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-600"
            title="Back to Bookings"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight">
                New Pooja Booking
              </h1>
              {hasActiveDraft && (
                <span className="text-[9px] text-emerald-800 bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.2 rounded-md font-bold inline-flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                  <span>Auto-Saved</span>
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
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
              className="text-xs font-bold text-slate-600 hover:text-rose-600 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 transition flex items-center gap-1 cursor-pointer active:scale-95"
              title="Reset all fields and start fresh"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
              <span>Reset</span>
            </button>
          )}

          <Link
            href="/app/bookings"
            className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition shadow-2xs active:scale-95"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* 4-Step Progress Indicator */}
      <div className="bg-white rounded-3xl p-2 sm:p-2.5 border border-slate-200/90 shadow-2xs">
        <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
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
                className={`flex flex-col items-center text-center py-2 px-1 rounded-2xl transition active:scale-95 ${
                  isCurrent
                    ? "bg-gradient-to-br from-[#0b2b17] via-[#123e24] to-[#0b2b17] text-white font-black shadow-sm ring-2 ring-emerald-600/40 scale-[1.02]"
                    : isCompleted
                    ? "bg-emerald-50 text-emerald-950 border border-emerald-300 font-bold hover:bg-emerald-100/80 cursor-pointer"
                    : "bg-slate-50 text-slate-400 border border-slate-200/60 opacity-70 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-1 text-xs font-black">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <span className={isCurrent ? "text-amber-300" : ""}>{s.step}.</span>
                  )}
                  <span className="hidden sm:inline">{s.title}</span>
                </div>
                <div
                  className={`text-[9.5px] sm:text-[10px] mt-0.5 font-semibold truncate max-w-[70px] ${
                    isCurrent ? "text-emerald-100" : "text-slate-500"
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
              className="px-4 py-2 bg-gradient-to-r from-[#0b2b17] to-[#123e24] hover:from-[#123e24] hover:to-[#1a5332] text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Add Devotee</span>
            </button>
          </div>

          {/* Smart Tip for Step 1 - Cute & Compact */}
          <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 text-xs text-emerald-950 shadow-2xs">
            <span className="text-base shrink-0">💡</span>
            <p className="text-[11px] text-emerald-900 leading-tight">
              <span className="font-bold">பக்தர் குறிப்பு:</span> பக்தரின் மொபைல் எண் சேர்த்தால் வாட்ஸ்அப்பில் பூஜை விவரங்கள் மற்றும் சாமான்கள் பட்டியலை 1-கிளிக்கில் அனுப்பலாம்.
            </p>
          </div>

          {/* If Devotee is Selected: Detailed Showcase Card */}
          {selectedCustomer ? (
            <div className="bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 p-4 rounded-2xl border-2 border-emerald-500/80 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white flex items-center justify-center shrink-0 shadow-sm ring-4 ring-emerald-100">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base text-slate-900 truncate">
                        {selectedCustomer.name}
                      </h3>
                      {devoteePastBookingsCount > 0 && (
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-950 px-2.5 py-0.5 rounded-full">
                          {devoteePastBookingsCount} Past Bookings
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                      {selectedCustomer.mobile ? (
                        <a
                          href={`tel:${selectedCustomer.mobile}`}
                          className="flex items-center gap-1 font-bold text-slate-800 hover:text-emerald-700"
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
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 flex items-center gap-0.5 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-2xs"
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
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shrink-0 transition active:scale-95 cursor-pointer shadow-2xs"
                >
                  Change Devotee
                </button>
              </div>

              {/* Extended Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-emerald-200/60 text-xs">
                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block">City &amp; Address</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    {selectedCustomer.city || "Namakkal"} {selectedCustomer.address ? `• ${selectedCustomer.address}` : ""}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] text-slate-400 font-bold block">Gothram &amp; Kuladeivam Notes</span>
                  <span className="font-semibold text-emerald-950 block mt-0.5 truncate">
                    {selectedCustomer.notes || "No special gothram notes"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Search and Devotee Pick Grid */
            <div className="space-y-3">
              <div className="relative group">
                <Search className="w-4 h-4 text-emerald-600 group-focus-within:text-emerald-800 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition" />
                <input
                  type="text"
                  value={customerSearchQuery}
                  onChange={(e) => setCustomerSearchQuery(e.target.value)}
                  placeholder="Search devotee by name, mobile (+91), city, gothram..."
                  className="w-full pl-10 pr-9 py-3 bg-white border-2 border-emerald-400/80 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-500/15 rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 shadow-xs transition"
                />
                {customerSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setCustomerSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Quick Devotee Chips (When search is empty) */}
              {!customerSearchQuery && customers.length > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="flex items-center justify-between text-[10.5px]">
                    <span className="font-extrabold text-slate-600 flex items-center gap-1">
                      <span>⚡</span>
                      <span>அடிக்கடி வரும் பக்தர்கள் (Quick Pick):</span>
                    </span>
                    <span className="text-slate-400 font-medium">1-Tap Select</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {customers.slice(0, 6).map((c) => (
                      <button
                        key={`chip-${c.id}`}
                        type="button"
                        onClick={() => setCustomerId(c.id)}
                        className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-slate-800 hover:text-emerald-950 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                      >
                        <User className="w-3 h-3 text-emerald-700" />
                        <span className="truncate max-w-[120px]">{c.name}</span>
                        {c.city && <span className="text-[10px] text-slate-400 font-normal">• {c.city}</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 border border-emerald-300 rounded-2xl text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Add &quot;{customerSearchQuery}&quot; as New Devotee</span>
                    </button>
                  </div>
                ) : (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setCustomerId(c.id)}
                      className="bg-white hover:bg-emerald-50/70 p-3 rounded-2xl border border-slate-200 hover:border-emerald-400 transition cursor-pointer flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 transition">
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
                            <p className="text-[10px] text-emerald-900 truncate mt-0.5 font-medium">
                              🔖 {c.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div
                        className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-700 text-slate-400 group-hover:text-white flex items-center justify-center shrink-0 transition shadow-2xs"
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
              className="px-7 py-3 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
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
                <Flame className="w-4 h-4 text-emerald-700" /> 2. Choose Pooja & Samagri Checklist
              </h2>
              <p className="text-xs text-slate-500">
                Select ritual ceremony, review items list, edit or add custom materials.
              </p>
            </div>

            <Link
              href="/app/poojas?action=new&returnTo=new-booking"
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white rounded-2xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition active:scale-95 cursor-pointer"
              title="பூஜைகள் பக்கத்திற்குச் சென்று புதிய பூஜையை முழு பொருட்களுடன் சேர்க்கவும்"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />
              <span>+ Add Pooja (புதிய பூஜை)</span>
            </Link>
          </div>

          {/* Smart & Friendly Explanation for New Users */}
          <div className="bg-gradient-to-r from-amber-50/80 via-white to-emerald-50/60 border border-amber-200/90 rounded-2xl p-3.5 shadow-2xs space-y-1">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-base">🪔</span>
                <span className="font-extrabold text-xs text-amber-950">
                  பூஜை &amp; சாக்கிரிகள் வழிகாட்டி (Pooja Selection Guide)
                </span>
              </div>
              <Link
                href="/app/poojas"
                className="text-[11px] font-bold text-amber-900 hover:text-amber-950 underline flex items-center gap-0.5"
              >
                <span>பூஜைகள் பட்டியல் மேலாண்மை</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              கீழேயுள்ள பட்டியலில் இருந்து இந்த முன்பதிவிற்குரிய பூஜையைத் தேர்ந்தெடுக்கவும். தேர்வு செய்தவுடன் அதற்கான பொருட்கள் பட்டியல் தோன்றும். புதிய பூஜைகளை நிரந்தரமாக உருவாக்க மேலே உள்ள <strong>&apos;+ Add Pooja&apos;</strong> பட்டனைப் பயன்படுத்தலாம்.
            </p>
          </div>

          {/* Popular / Frequent Poojas: Instant 1-Tap Numbered Cards */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span>1-Tap Popular Poojas (அதிகம் பயன்படும் பூஜைகள்):</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-900 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Quick 1, 2, 3...
              </span>
            </div>

            {/* Grid of Numbered 1-Tap Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {topPoojas.map((p, pIdx) => {
                const isSelected = poojaId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setPoojaId(p.id);
                      setIsMorePoojasOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2.5 shadow-2xs group cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-emerald-50 via-white to-emerald-100/80 border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs"
                        : "bg-white hover:bg-emerald-50/30 border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs shrink-0 transition ${
                          isSelected
                            ? "bg-gradient-to-br from-[#0b2b17] to-[#123e24] text-amber-300 shadow-xs"
                            : "bg-emerald-100 text-emerald-950 group-hover:bg-emerald-200"
                        }`}
                      >
                        {pIdx + 1}
                      </div>

                      <div className="min-w-0">
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

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-900 block">
                        ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                      </span>
                      {isSelected ? (
                        <span className="text-[9.5px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-md border border-emerald-300">
                          Selected ✓
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Custom "More Poojas..." Button & Expandable Picker */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsMorePoojasOpen((prev) => !prev)}
                className="w-full py-2.5 px-3.5 bg-white hover:bg-emerald-50/60 border border-slate-200 hover:border-emerald-300 rounded-2xl text-xs font-bold text-slate-800 flex items-center justify-between transition shadow-2xs cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                  <span>மற்ற அனைத்து பூஜைகள் / More Poojas Catalog ({poojas.length})</span>
                </span>
                <span className="text-xs text-emerald-900 font-extrabold">
                  {isMorePoojasOpen ? "Close ▲" : "View All ▼"}
                </span>
              </button>

              {/* Custom Searchable Picker List (No native OS dropdown!) */}
              {isMorePoojasOpen && (
                <div className="mt-2 p-3 bg-white rounded-2xl border-2 border-emerald-300 shadow-md space-y-2.5 animate-in fade-in">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search pooja by Tamil / English name..."
                      value={poojaSearchQuery}
                      onChange={(e) => setPoojaSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
                    />
                    {poojaSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setPoojaSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                    {filteredMorePoojas.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No poojas found matching &quot;{poojaSearchQuery}&quot;
                      </div>
                    ) : (
                      filteredMorePoojas.map((p) => {
                        const isSelected = poojaId === p.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setPoojaId(p.id);
                              setIsMorePoojasOpen(false);
                            }}
                            className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                              isSelected
                                ? "bg-emerald-100/90 border-emerald-500 shadow-2xs"
                                : "bg-slate-50 hover:bg-emerald-50/70 border-slate-200"
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-slate-900 truncate">
                                {p.englishName}
                              </div>
                              {p.tamilName && (
                                <div className="text-[10px] text-emerald-900 font-semibold truncate">
                                  {p.tamilName}
                                </div>
                              )}
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-xs font-black text-slate-900 block">
                                ₹{(p.basePrice || 0).toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* THE PROMINENT SAMAGRI CHECKLIST SECTION */}
          {selectedPooja && (
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-3.5 animate-in fade-in duration-150">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-xs shadow-2xs shrink-0 mt-0.5">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs sm:text-sm font-black text-slate-900">
                        {selectedPooja.englishName}
                      </h3>
                      {selectedPooja.tamilName && selectedPooja.tamilName !== selectedPooja.englishName && (
                        <span className="text-xs font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded-md border border-emerald-300">
                          {selectedPooja.tamilName}
                        </span>
                      )}
                      <span className="text-xs font-black text-emerald-950 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        ₹{(selectedPooja.basePrice || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {selectedPooja.description ? (
                      <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                        {selectedPooja.description}
                      </p>
                    ) : (
                      <p className="text-[10.5px] text-slate-500 mt-0.5">
                        சாக்கிரிகள் பட்டியல் ({samagriItems.length} பொருட்கள்) • தேவையானதை தேர்வு செய்யவும்
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSamagriItems((prev) => prev.map((item) => ({ ...item, isChecked: true })));
                    }}
                    className="text-[10px] font-bold text-emerald-900 hover:bg-emerald-100 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-300 transition active:scale-95 cursor-pointer"
                    title="அனைத்துப் பொருட்களையும் தேர்வு செய்"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSamagriItems((prev) => prev.map((item) => ({ ...item, isChecked: false })));
                    }}
                    className="text-[10px] font-bold text-slate-600 hover:bg-slate-100 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 transition active:scale-95 cursor-pointer"
                    title="அனைத்துப் பொருட்களையும் நீக்கு"
                  >
                    Deselect All
                  </button>
                  <div className="text-[11px] font-bold text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-300">
                    {samagriItems.filter((i) => i.isChecked !== false).length} / {samagriItems.length}
                  </div>
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
                          className="p-0.5 hover:bg-slate-200/50 rounded-lg transition shrink-0 cursor-pointer"
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
                                    ? "text-emerald-900 bg-emerald-100/70 px-1.5 py-0.2 rounded"
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
                        <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => handleUpdateSamagriQty(item.id, -1)}
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
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
                            className="w-10 text-center text-xs font-black text-slate-900 bg-transparent focus:outline-none focus:bg-emerald-50/50 rounded py-0.5"
                          />

                          <button
                            type="button"
                            onClick={() => handleUpdateSamagriQty(item.id, 1)}
                            className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-[11px] font-extrabold text-slate-700 bg-slate-100 px-2 py-1 rounded-xl min-w-[34px] text-center">
                          {item.unit}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveSamagri(item.id)}
                          className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl transition cursor-pointer"
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
                className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2"
              >
                <span className="text-[11px] font-bold text-slate-700 block">
                  + Add Custom Samagri Item (புதிய பொருள் சேர்க்க — ஏதேனும் ஒரு பெயர் போதுமானது):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="English Name (e.g. Honey)"
                    value={newSamagriNameEn}
                    onChange={(e) => setNewSamagriNameEn(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <input
                    type="text"
                    placeholder="Tamil Name (e.g. தேன்)"
                    value={newSamagriNameTa}
                    onChange={(e) => setNewSamagriNameTa(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                  />
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min={1}
                      value={newSamagriQty}
                      onChange={(e) => setNewSamagriQty(Number(e.target.value))}
                      className="w-14 bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-bold text-slate-900 text-center"
                    />
                    <select
                      value={newSamagriUnit}
                      onChange={(e) => setNewSamagriUnit(e.target.value)}
                      className="flex-1 bg-white border border-slate-200 rounded-xl px-1.5 py-1.5 text-xs font-medium text-slate-900"
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
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#0b2b17] to-[#123e24] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-xl text-xs font-bold shrink-0 shadow-xs cursor-pointer active:scale-95"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step2NextBtn"
              onClick={handleNextStep}
              className="px-7 py-3 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
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
              <CalendarIcon className="w-4 h-4 text-emerald-700" /> 3. Schedule Date & Auspicious Time
            </h2>
            <p className="text-xs text-slate-500">
              Interactive Tamil calendar grid, 15-min interval time selector, and collision detection.
            </p>
          </div>

          {/* Auspicious Timings (Nalla Neram) for Selected Date placed right above Calendar */}
          <div className="bg-gradient-to-r from-amber-50 via-emerald-50/40 to-amber-50/70 p-3.5 rounded-2xl border-2 border-amber-300/90 shadow-2xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  🪔
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                    தேர்ந்தெடுத்த நாளின் சுப நேரம் (Auspicious Timings)
                  </span>
                  <div className="font-black text-xs sm:text-sm text-slate-900">
                    {selectedDateInfo.formattedDualDate} ({selectedDateInfo.dayOfWeekEn})
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold text-emerald-900 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                  {selectedDateInfo.tithiTa}
                </span>
                <span className="text-[10px] font-extrabold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs">
                  {selectedDateInfo.nakshatraNameTa}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
              <div className="bg-white/95 p-2 rounded-xl border border-amber-200 shadow-2xs">
                <span className="text-[9.5px] text-amber-800 font-extrabold block">✨ நல்ல நேரம்</span>
                <span className="text-xs font-black text-slate-900">{selectedDateInfo.nallaNeram}</span>
              </div>
              <div className="bg-white/95 p-2 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[9.5px] text-emerald-800 font-extrabold block">🪔 கௌரி நல்ல நேரம்</span>
                <span className="text-xs font-black text-slate-900">{selectedDateInfo.gowriNallaNeram}</span>
              </div>
              <div className="bg-white/95 p-2 rounded-xl border border-rose-200 shadow-2xs">
                <span className="text-[9.5px] text-rose-700 font-extrabold block">⛔ ராகு காலம்</span>
                <span className="text-xs font-bold text-slate-700">{selectedDateInfo.rahuKalam}</span>
              </div>
              <div className="bg-white/95 p-2 rounded-xl border border-purple-200 shadow-2xs">
                <span className="text-[9.5px] text-purple-700 font-extrabold block">⌛ குளிகை</span>
                <span className="text-xs font-bold text-slate-700">{selectedDateInfo.kuligai}</span>
              </div>
            </div>
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
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition cursor-pointer active:scale-95"
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
                  className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-600 border border-slate-200 transition cursor-pointer active:scale-95"
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
                className="text-[11px] font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-xl border border-emerald-300 transition cursor-pointer active:scale-95"
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
                    className={`h-14 p-1 rounded-xl border flex flex-col justify-between items-center text-center transition relative cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-br from-[#0b2b17] via-emerald-800 to-[#0b2b17] text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/40"
                        : isToday
                        ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                        : "bg-white border-slate-100 hover:border-emerald-300 text-slate-800 hover:bg-emerald-50/30"
                    }`}
                  >
                    <span className="text-xs font-black leading-none">{dayNum}</span>
                    <span
                      className={`text-[8.5px] font-semibold truncate max-w-full ${
                        isSelected ? "text-amber-300" : "text-emerald-950 font-bold"
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
                            isSelected ? "bg-amber-300" : "bg-emerald-600"
                          }`}
                        />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* TIME SELECTION WITH FAST TIME-BANDS & 15-MINUTE INTERVALS */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>பூஜை தொடங்கும் நேரம் (Select Ceremony Start Time):</span>
              </label>
              <div className="flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                <span className="text-[10.5px] font-bold text-emerald-950">தேர்ந்தெடுத்த நேரம்:</span>
                <span className="text-xs font-black text-emerald-950">{selectedTime}</span>
              </div>
            </div>

            {/* 3 Fast Time Bands: Morning, Noon, Evening */}
            <div className="space-y-2.5">
              {TIME_BANDS.map((band) => (
                <div key={band.period} className="bg-slate-50/70 p-2.5 rounded-2xl border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-700">
                    <span>{band.icon}</span>
                    <span>{band.period}</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {band.slots.map((s) => {
                      const isMatch = selectedTime === s.time;
                      return (
                        <button
                          key={s.time}
                          type="button"
                          onClick={() => {
                            const [hMin, mer] = s.time.split(" ");
                            const [h, m] = hMin.split(":");
                            setTimeHour(h);
                            setTimeMinute(m);
                            setTimeMeridiem(mer as any);
                          }}
                          className={`p-2 rounded-xl border text-left transition cursor-pointer active:scale-95 ${
                            isMatch
                              ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white border-emerald-900 shadow-xs ring-2 ring-emerald-600/30"
                              : "bg-white hover:bg-emerald-50/50 border-slate-200 text-slate-800 hover:border-emerald-300"
                          }`}
                        >
                          <div className="text-xs font-black">{s.label}</div>
                          <div
                            className={`text-[9px] truncate mt-0.5 ${
                              isMatch ? "text-amber-300 font-bold" : "text-slate-500 font-medium"
                            }`}
                          >
                            {s.tag}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Time Fine-Tuner (Hour, 15-Min Minutes, AM/PM) */}
            <div className="pt-1">
              <span className="text-[10.5px] font-bold text-slate-500 block mb-1.5">
                நேரத்தை மாற்றியமைக்க (Custom Time Adjuster):
              </span>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                {/* Hour */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">Hour</label>
                  <select
                    value={timeHour}
                    onChange={(e) => setTimeHour(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
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

                {/* Minutes (15-min) */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">
                    Minutes (15-min)
                  </label>
                  <select
                    value={timeMinute}
                    onChange={(e) => setTimeMinute(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600 cursor-pointer"
                  >
                    {["00", "15", "30", "45"].map((m) => (
                      <option key={m} value={m}>
                        :{m} mins
                      </option>
                    ))}
                  </select>
                </div>

                {/* AM / PM */}
                <div>
                  <label className="text-[9.5px] font-bold text-slate-500 block mb-0.5">AM / PM</label>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => setTimeMeridiem("AM")}
                      className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer active:scale-95 ${
                        timeMeridiem === "AM"
                          ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      AM
                    </button>
                    <button
                      type="button"
                      onClick={() => setTimeMeridiem("PM")}
                      className={`py-1.5 rounded-lg text-xs font-black transition cursor-pointer active:scale-95 ${
                        timeMeridiem === "PM"
                          ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white shadow-2xs"
                          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      PM
                    </button>
                  </div>
                </div>
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
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <span className="font-bold text-slate-700 block">
                📋 Other Bookings on {date} ({selectedDateBookings.length}):
              </span>
              <div className="space-y-1">
                {selectedDateBookings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-[11px]"
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

          {/* STEP 3 QUICK BOOKING PREVIEW CARD */}
          <div className="bg-gradient-to-r from-emerald-50/80 via-white to-emerald-50/50 p-4 rounded-2xl border-2 border-emerald-300/90 shadow-2xs space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>தேர்ந்தெடுக்கப்பட்ட முன்பதிவு விவரங்கள் (Step 3 Summary)</span>
              </span>
              <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Ready for Review ✓
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">📅 நாள் &amp; முகூர்த்தம்</span>
                <div className="font-black text-slate-900 leading-tight">{selectedDateInfo.formattedDualDate}</div>
                <div className="text-[10.5px] text-emerald-900 font-bold">
                  {selectedDateInfo.tithiTa} • {selectedDateInfo.nakshatraNameTa}
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">⏰ பூஜை தொடங்கும் நேரம்</span>
                <div className="font-black text-emerald-950 text-base leading-tight">{selectedTime}</div>
                <div className="text-[10.5px] text-slate-600 font-bold">
                  {selectedDateInfo.dayOfWeekTa} ({selectedDateInfo.dayOfWeekEn})
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-emerald-200/90 shadow-2xs space-y-1">
                <span className="text-[10px] font-bold text-slate-400 block uppercase">👤 பக்தர் &amp; சடங்கு</span>
                <div className="font-black text-slate-900 truncate leading-tight">
                  {selectedCustomer?.name || "பக்தர் தேர்வு தேவை"}
                </div>
                <div className="text-[10.5px] text-emerald-900 font-extrabold truncate">
                  {selectedPooja?.englishName || "பூஜை தேர்வு தேவை"}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              id="step3NextBtn"
              onClick={handleNextStep}
              className="px-7 py-3 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4 text-amber-300" />
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
              <ShieldCheck className="w-4 h-4 text-emerald-700" /> 4. Review Summary & Payment Setup
            </h2>
            <p className="text-xs text-slate-500">
              Verify ceremony details, set up payment, assign performing priest, and confirm booking.
            </p>
          </div>

          {/* 1. FULL LINE-BY-LINE CEREMONY & DEVOTEE PREVIEW CARD */}
          <div className="bg-white rounded-2xl border-2 border-emerald-300/90 shadow-xs overflow-hidden divide-y divide-slate-100">
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  முன்பதிவு முழு விவரங்கள் (Booking Full Review)
                </span>
              </div>
              <span className="text-[10px] font-black text-emerald-950 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                Ready to Confirm ✓
              </span>
            </div>

            {/* Line 1: Pooja Ceremony */}
            <div className="p-3 flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0">
                <Flame className="w-3.5 h-3.5 text-emerald-700" />
                பூஜை சடங்கு (Pooja):
              </span>
              <div className="text-right font-black text-slate-900">
                <span>{selectedPooja?.englishName}</span>
                {selectedPooja?.tamilName && (
                  <span className="text-emerald-800 font-bold ml-1.5">
                    ({selectedPooja.tamilName})
                  </span>
                )}
                <span className="text-[10.5px] text-slate-400 font-medium ml-1.5">
                  • {selectedPooja?.durationMinutes || 120} mins
                </span>
              </div>
            </div>

            {/* Line 2: Devotee */}
            <div className="p-3 flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0">
                <User className="w-3.5 h-3.5 text-amber-600" />
                பக்தர் (Devotee):
              </span>
              <div className="text-right font-bold text-slate-900">
                <span>{selectedCustomer?.name}</span>
                {selectedCustomer?.mobile && (
                  <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
                    📱 {selectedCustomer.mobile}
                  </span>
                )}
                <span className="text-[11px] text-slate-400 ml-1.5">
                  📍 {selectedCustomer?.city || "Namakkal"}
                </span>
              </div>
            </div>

            {/* Line 3: Date & Auspicious Time */}
            <div className="p-3 flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0">
                <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" />
                நாள் &amp; நேரம்:
              </span>
              <div className="text-right font-black text-slate-900">
                <span>{selectedDateInfo.formattedDualDate}</span>
                <span className="text-emerald-950 font-black ml-2 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  ⏰ {selectedTime} ({selectedDateInfo.dayOfWeekTa})
                </span>
              </div>
            </div>

            {/* Line 4: Venue */}
            <div className="p-3 flex items-center justify-between text-xs gap-3">
              <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                இடம் (Venue):
              </span>
              <div className="text-right font-bold text-slate-800 truncate max-w-[240px]">
                {location || selectedCustomer?.city || "Namakkal"}
              </div>
            </div>

            {/* Line 5: Sankalpam Notes */}
            {notes && (
              <div className="p-3 flex items-center justify-between text-xs gap-3">
                <span className="text-slate-500 font-bold flex items-center gap-1.5 shrink-0">
                  📜 சங்கல்பம்:
                </span>
                <div className="text-right font-semibold text-emerald-950 truncate max-w-[240px]">
                  {notes}
                </div>
              </div>
            )}

            {/* Line 6: Samagri Checklist with Expand/Collapse */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-bold flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-700" />
                  பூஜைப் பொருட்கள் (Samagri Checklist):
                </span>

                <button
                  type="button"
                  onClick={() => setShowPreviewItemsList((prev) => !prev)}
                  className="text-[11px] font-bold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                >
                  <span>
                    {samagriItems.filter((i) => i.isChecked !== false).length} பொருட்கள் சேர்க்கப்பட்டது
                  </span>
                  {showPreviewItemsList ? (
                    <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
                  )}
                </button>
              </div>

              {/* Expandable Line-by-Line Items View */}
              {showPreviewItemsList && (
                <div className="mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1 max-h-52 overflow-y-auto animate-in fade-in duration-150">
                  {samagriItems.filter((i) => i.isChecked !== false).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-slate-100 last:border-0"
                    >
                      <span className="font-semibold text-slate-800">
                        {idx + 1}. {item.itemTamilName || item.itemEnglishName}
                      </span>
                      <span className="font-bold text-emerald-900 bg-white px-2 py-0.2 rounded border border-slate-200 text-[10px]">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. DEDICATED CLEAN & SIMPLE PAYMENT BOX */}
          <div className="bg-white rounded-2xl p-4 border-2 border-emerald-300/90 shadow-2xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0b2b17] to-[#123e24] text-amber-300 flex items-center justify-center font-black shadow-2xs">
                  <IndianRupee className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    கட்டண விவரம் (Pooja Payment Setup)
                  </h4>
                  <p className="text-[10px] text-slate-500">Simple payment and advance recording</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-bold block">மொத்த கட்டணம்</span>
                <span className="text-base font-black text-emerald-950">
                  ₹{Number(amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Total Fee Quick Adjuster */}
            <div className="flex items-center justify-between gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-bold text-[11px]">Pooja Fee Amount:</span>
              <div className="relative w-36">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                <input
                  type="number"
                  min={0}
                  value={amount}
                  onChange={(e) => {
                    const newTotal = Number(e.target.value);
                    setAmount(newTotal);
                    if (paymentChoice === "FULL") {
                      setAdvanceAmount(newTotal);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-6 pr-2 py-1 text-xs font-black text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Simple Advance Payment Choice: Unpaid vs Advance vs Full */}
            <div className="space-y-1.5">
              <label className="text-[10.5px] font-extrabold text-slate-700 block">
                முன்பணம் நிலை (Advance Payment):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("UNPAID");
                    setAdvanceAmount(0);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center ${
                    paymentChoice === "UNPAID" || (advanceAmount === 0 && paymentChoice !== "ADVANCE")
                      ? "bg-slate-800 text-white border-slate-800 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>நிலுவை (Unpaid)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("ADVANCE");
                    if (advanceAmount === 0 || advanceAmount === amount) {
                      setAdvanceAmount(Math.round(amount * 0.25));
                    }
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center ${
                    paymentChoice === "ADVANCE"
                      ? "bg-emerald-700 text-white border-emerald-700 shadow-xs"
                      : "bg-emerald-50 text-emerald-950 border-emerald-200 hover:bg-emerald-100"
                  }`}
                >
                  <span>+ முன்பணம் (Advance)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentChoice("FULL");
                    setAdvanceAmount(amount);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center ${
                    paymentChoice === "FULL" || (advanceAmount === amount && amount > 0)
                      ? "bg-gradient-to-r from-amber-600 to-amber-700 text-white border-amber-700 shadow-xs"
                      : "bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100"
                  }`}
                >
                  <span>முழுவதும் (100% Paid)</span>
                </button>
              </div>
            </div>

            {/* Advance Amount Input & Shortcuts (Shown when ADVANCE is chosen) */}
            {paymentChoice === "ADVANCE" && (
              <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[10.5px] font-extrabold text-emerald-950 block">
                      பெற்ற முன்பணம் (Advance Received ₹):
                    </label>
                    <span className="text-[10px] text-emerald-800">Enter amount received from devotee</span>
                  </div>

                  <div className="relative w-36">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-700">₹</span>
                    <input
                      type="number"
                      min={0}
                      max={amount}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full bg-white border border-emerald-300 rounded-lg pl-6 pr-2 py-1.5 text-xs font-black text-emerald-900 focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Quick Advance % Chips */}
                <div className="flex items-center gap-1.5 text-xs flex-wrap pt-0.5">
                  <span className="text-[10px] text-slate-500 font-bold mr-1">Quick:</span>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(Math.round(amount * 0.25))}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                      advanceAmount === Math.round(amount * 0.25)
                        ? "bg-emerald-800 text-white border-emerald-800"
                        : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    25% (₹{Math.round(amount * 0.25)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdvanceAmount(Math.round(amount * 0.5))}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold border transition cursor-pointer ${
                      advanceAmount === Math.round(amount * 0.5)
                        ? "bg-emerald-800 text-white border-emerald-800"
                        : "bg-white text-emerald-950 border-emerald-200 hover:bg-emerald-50"
                    }`}
                  >
                    50% (₹{Math.round(amount * 0.5)})
                  </button>
                </div>

                {/* Balance Due Display */}
                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/80 text-xs">
                  <span className="font-bold text-emerald-950">மீதமுள்ள தொகை (Balance Due):</span>
                  <span className="font-black text-emerald-950 text-sm">
                    ₹{Math.max(0, amount - advanceAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}

            {/* Payment Method Pills (NO DROPDOWN!) */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100">
              <label className="text-[10.5px] font-extrabold text-slate-700 block">
                செலுத்தும் முறை (Payment Method):
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode("CASH")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 ${
                    paymentMode === "CASH"
                      ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white border-emerald-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>💵 Cash (ரொக்கம்)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("UPI")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 ${
                    paymentMode === "UPI"
                      ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white border-emerald-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>📱 UPI (GPay/PhonePe)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode("BANK_TRANSFER")}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1 ${
                    paymentMode === "BANK_TRANSFER"
                      ? "bg-gradient-to-r from-[#0b2b17] to-[#123e24] text-white border-emerald-900 shadow-xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>🏦 Bank Transfer</span>
                </button>
              </div>

              {/* UPI Reference Input */}
              {paymentMode === "UPI" && (
                <div className="pt-1.5 animate-in fade-in">
                  <input
                    type="text"
                    placeholder="UPI Transaction ID / Ref (e.g. UPI/4098231)"
                    value={upiRefId}
                    onChange={(e) => setUpiRefId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 shadow-2xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 3. ASSIGN PRIEST & ASSISTANT WITH INSTANT ADD */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-black text-slate-900 block">
                  🪔 Assign Priest (செய்து வைக்கும் குருக்கள்)
                </label>
                <p className="text-[10px] text-slate-500">
                  Choose Self or assign to an associate priest
                </p>
              </div>

              <span className="text-[10px] font-bold text-emerald-950 bg-emerald-100/90 px-2.5 py-0.5 rounded-full border border-emerald-300">
                {assignedIyerId === "self" ? "Self (நானே செய்கிறேன்)" : "Assigned to Assistant"}
              </span>
            </div>

            {/* 2 Primary Toggle Buttons: Self vs Assistant */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAssignedIyerId("self");
                  setIsAddingAssistant(false);
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 shadow-2xs cursor-pointer active:scale-95 ${
                  assignedIyerId === "self"
                    ? "bg-gradient-to-r from-emerald-50 via-white to-emerald-100/80 border-emerald-600 ring-2 ring-emerald-500/30 shadow-xs"
                    : "bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      assignedIyerId === "self"
                        ? "bg-gradient-to-br from-[#0b2b17] to-[#123e24] text-amber-300"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    🪔
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Self</div>
                    <div className="text-[10px] text-emerald-950 font-bold truncate">நானே செய்கிறேன்</div>
                  </div>
                </div>
                {assignedIyerId === "self" && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  if (assignedIyerId === "self") {
                    const firstOther = members.find((m) => m.role !== "OWNER") || members[1] || members[0];
                    if (firstOther) setAssignedIyerId(firstOther.id);
                  }
                }}
                className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2 shadow-2xs cursor-pointer active:scale-95 ${
                  assignedIyerId !== "self"
                    ? "bg-gradient-to-r from-slate-100 via-white to-slate-200/80 border-slate-700 ring-2 ring-slate-400/40 shadow-xs"
                    : "bg-slate-50/80 hover:bg-slate-100 border-slate-200 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                      assignedIyerId !== "self" ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    👥
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">Others / Assistant</div>
                    <div className="text-[10px] text-slate-700 font-bold truncate">உதவி குருக்கள்</div>
                  </div>
                </div>
                {assignedIyerId !== "self" && (
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                )}
              </button>
            </div>

            {/* When "Assistant / Others" is Selected: Modern Grid Cards + Instant Add */}
            {assignedIyerId !== "self" && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800">
                    உதவி குருக்கள் பட்டியல் (Select Assistant):
                  </label>

                  <button
                    type="button"
                    onClick={() => setIsAddingAssistant((prev) => !prev)}
                    className="text-[11px] font-extrabold text-emerald-900 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-300 flex items-center gap-1 transition cursor-pointer shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-700" />
                    <span>+ Instant Add</span>
                  </button>
                </div>

                {/* Inline Instant Add Assistant Form */}
                {isAddingAssistant && (
                  <div className="p-3 bg-white rounded-xl border-2 border-emerald-300 shadow-xs space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span>புதிய உதவி குருக்கள் விவரம் (Quick Add Priest):</span>
                      <button
                        type="button"
                        onClick={() => setIsAddingAssistant(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Priest Name (e.g. ஸ்ரீதர் சாஸ்திரி)"
                        value={newAssistantName}
                        onChange={(e) => setNewAssistantName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                      <input
                        type="text"
                        placeholder="Mobile (e.g. 9876543210)"
                        value={newAssistantMobile}
                        onChange={(e) => setNewAssistantMobile(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {assistantError && (
                      <p className="text-[10px] text-rose-600 font-bold">{assistantError}</p>
                    )}

                    <div className="flex justify-end gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingAssistant(false)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateAssistant}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition"
                      >
                        Save &amp; Assign
                      </button>
                    </div>
                  </div>
                )}

                {/* Stylish Assistant Cards Grid (Replacing ugly native select dropdown) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {members.map((m) => {
                    const isSelected = assignedIyerId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setAssignedIyerId(m.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 shadow-2xs ${
                          isSelected
                            ? "bg-white border-slate-800 ring-2 ring-slate-700/30 shadow-xs"
                            : "bg-white/80 hover:bg-white border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            👤
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black text-slate-900 truncate">
                              {getPriestTamilName(m)}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {getPriestTamilRole(m)} {m.specialization ? `• ${m.specialization}` : ""}
                            </div>
                          </div>
                        </div>

                        {isSelected ? (
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                            Selected ✓
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. VENUE & SANKALPAM DETAILS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
              <label className="text-xs font-black text-slate-800 block">
                Ceremony Venue / Location (இடம்)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Namakkal / Devotee Residence"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 space-y-1.5 shadow-2xs">
              <label className="text-xs font-black text-slate-800 block">
                Sankalpam Notes / Gothram / Nakshatram
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Koundinya Gothram, Rohini Nakshatram"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Final Action Buttons */}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={handlePrevStep}
              className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="submit"
              id="confirmAndCreateBookingBtn"
              disabled={isSubmitting}
              className="px-8 py-3.5 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-sm font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? "Creating Booking..." : "Confirm & Create Booking"}</span>
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD DEVOTEE MODAL (Fixed Layout & Mobile Keyboard Safe)             */}
      {/* ========================================================================= */}
      {showAddCustomerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddCustomerModal(false);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
            {/* 1. Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0b2b17] to-[#123e24] text-amber-300 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <User className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Add New Devotee (புதிய பக்தர்)
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Will be instantly selected for this booking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 overscroll-contain">
              {custModalError && (
                <div className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{custModalError}</span>
                </div>
              )}

              <form id="quickDevoteeForm" onSubmit={handleSaveQuickCustomer} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Devotee Name * (பக்தர் பெயர்)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Mobile Number (அலைபேசி எண்)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 select-none">
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="98765 43210"
                      value={newCustMobile}
                      onChange={(e) => setNewCustMobile(cleanPastedIndianMobile(e.target.value))}
                      maxLength={10}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-2xs"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    வாட்ஸ்அப் மூலம் பூஜை விவரங்கள் அனுப்ப இந்த எண் பயன்படும்.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">City (ஊர்)</label>
                    <input
                      type="text"
                      placeholder="Namakkal"
                      value={newCustCity}
                      onChange={(e) => setNewCustCity(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Address (முகவரி)</label>
                    <input
                      type="text"
                      placeholder="Street / Area"
                      value={newCustAddress}
                      onChange={(e) => setNewCustAddress(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Notes (Gothram / Nakshatram / Kuladeivam)
                    </label>
                    <span className="text-[10px] text-amber-800 font-bold">சங்கல்ப குறிப்பு</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Koundinya Gothram, Rohini"
                    value={newCustNotes}
                    onChange={(e) => setNewCustNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white transition shadow-2xs"
                  />

                  {/* Quick Nakshatra Suggestions Chips */}
                  <div className="mt-2 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block">
                      💡 விரைவு நட்சத்திரம் (1-Tap Suggestion):
                    </span>
                    <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto no-scrollbar">
                      {["அஸ்வினி", "பரணி", "கிருத்திகை", "ரோகிணி", "மிருகசீரிஷம்", "திருவாதிரை", "புனர்பூசம்", "பூசம்", "மகம்", "பூரம்", "உத்திரம்", "ஹஸ்தம்", "சுவாதி", "விசாகம்", "அனுஷம்", "கேட்டை", "மூலம்", "உத்திராடம்", "திருவோணம்", "சதயம்"].map((nak) => (
                        <button
                          key={nak}
                          type="button"
                          onClick={() => {
                            setNewCustNotes((prev) => (prev ? `${prev}, ${nak}` : nak));
                          }}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 transition active:scale-95 cursor-pointer"
                        >
                          +{nak}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* 3. Fixed Footer */}
            <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowAddCustomerModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95"
              >
                Cancel (ரத்து)
              </button>
              <button
                type="submit"
                form="quickDevoteeForm"
                className="flex-1 py-3 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs font-black transition shadow-sm cursor-pointer active:scale-95"
              >
                Save &amp; Select (சேமி)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD CUSTOM POOJA MODAL (Fixed Layout & Mobile Keyboard Safe)        */}
      {/* ========================================================================= */}
      {showPoojaModal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPoojaModal(false);
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92dvh] sm:max-h-[85vh] animate-in slide-in-from-bottom-4 duration-200">
            {/* 1. Fixed Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 bg-white rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#0b2b17] to-[#123e24] text-amber-300 flex items-center justify-center font-bold text-sm shadow-2xs">
                  <Flame className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Add Pooja (புதிய பூஜை)
                  </h3>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    Creates ritual ceremony with samagri checklist
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPoojaModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 2. Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 overscroll-contain">
              <form id="quickPoojaForm" onSubmit={handleSavePoojaModal} className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pooja English Name (பூஜை ஆங்கிலப் பெயர்)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dhanvantri Homam"
                    value={poojaModalNameEn}
                    onChange={(e) => setPoojaModalNameEn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Pooja Tamil Name (பூஜை தமிழ்ப் பெயர்)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. தன்வந்திரி ஹோமம்"
                    value={poojaModalNameTa}
                    onChange={(e) => setPoojaModalNameTa(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                  />
                  <p className="text-[10px] text-emerald-800 font-medium mt-1">
                    💡 ஏதேனும் ஒரு பெயர் போதுமானது (Either English or Tamil name is enough).
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Base Fee (அடிப்படை கட்டணம் ₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      placeholder="5000"
                      value={poojaModalPrice}
                      onChange={(e) =>
                        setPoojaModalPrice(e.target.value === "" ? "" : Number(e.target.value))
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Description (விளக்கம் / பலன்கள்)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Vedic significance and auspicious benefits..."
                    value={poojaModalDesc}
                    onChange={(e) => setPoojaModalDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs resize-none"
                  />
                </div>
              </form>
            </div>

            {/* 3. Fixed Footer */}
            <div className="p-4 border-t border-slate-100 bg-white/95 backdrop-blur-xs shrink-0 flex gap-2.5 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setShowPoojaModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95"
              >
                Cancel (ரத்து)
              </button>
              <button
                type="submit"
                form="quickPoojaForm"
                className="flex-1 py-3 bg-gradient-to-r from-[#0b2b17] via-emerald-800 to-[#0b2b17] hover:from-emerald-900 hover:to-emerald-950 text-white rounded-2xl text-xs font-black transition shadow-sm cursor-pointer active:scale-95"
              >
                Save &amp; Select (சேமி)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CELEBRATORY BOOKING CONFIRMATION MODAL / WINDOW                           */}
      {/* ========================================================================= */}
      {createdBookingResult && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-200 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Sacred Celebration Header */}
            <div className="bg-gradient-to-br from-[#0b2b17] via-emerald-800 to-[#0b2b17] p-5 sm:p-6 text-white text-center relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-400/20 rounded-full blur-xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[#0b2b17] flex items-center justify-center mx-auto mb-2.5 shadow-lg ring-4 ring-white/20">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 block mb-0.5">
                முன்பதிவு உறுதியானது • Booking Confirmed
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white">
                பூஜை முன்பதிவு வெற்றிகரமாக முடிந்தது!
              </h2>
              <div className="inline-block mt-2 px-3 py-0.5 bg-white/15 backdrop-blur-md rounded-full border border-white/20 text-xs font-mono font-bold tracking-wider text-amber-200">
                {createdBookingResult.bookingNumber}
              </div>
            </div>

            {/* Content Summary Card */}
            <div className="p-4 sm:p-5 space-y-3.5">
              <div className="bg-emerald-50/70 rounded-2xl p-3.5 border border-emerald-200/90 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-emerald-700" /> பூஜை (Ritual):
                  </span>
                  <span className="font-black text-slate-900 text-right truncate max-w-[200px]">
                    {createdBookingResult.poojaEnglishName}
                    {createdBookingResult.poojaTamilName && ` (${createdBookingResult.poojaTamilName})`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-amber-600" /> பக்தர் (Devotee):
                  </span>
                  <span className="font-bold text-slate-900 text-right">
                    {createdBookingResult.customerName}
                    {createdBookingResult.customerMobile && ` • ${createdBookingResult.customerMobile}`}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5 text-emerald-700" /> நாள் &amp; நேரம்:
                  </span>
                  <span className="font-black text-slate-900 text-right">
                    {createdBookingResult.date} • {createdBookingResult.startTime}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-1.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    🪔 குருக்கள்:
                  </span>
                  <span className="font-bold text-emerald-950 text-right">
                    {createdBookingResult.assignedIyerName}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-slate-500 font-bold flex items-center gap-1">
                    <IndianRupee className="w-3.5 h-3.5 text-slate-700" /> கட்டணம்:
                  </span>
                  <div className="text-right flex items-center gap-1.5">
                    <span className="font-black text-slate-900">
                      ₹{createdBookingResult.totalAmount.toLocaleString("en-IN")}
                    </span>
                    <span
                      className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                        createdBookingResult.paymentStatus === "PAID"
                          ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          : createdBookingResult.paymentStatus === "PARTIALLY_PAID"
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : "bg-slate-100 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {createdBookingResult.paymentStatus === "PAID"
                        ? "Paid ✓"
                        : createdBookingResult.paymentStatus === "PARTIALLY_PAID"
                        ? `Advance ₹${createdBookingResult.advanceAmount}`
                        : "Pending"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleShareCreatedWhatsApp}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-sm transition active:scale-98 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 fill-white text-emerald-600" />
                  <span>பக்தருக்கு வாட்ஸ்அப்பில் உறுதிசெய்தி அனுப்பு</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => router.push(`/app/bookings/${createdBookingResult.id}?created=true`)}
                    className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition active:scale-98 cursor-pointer text-center"
                  >
                    முழு விவரம் பார்க்க
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCreatedBookingResult(null);
                      setCurrentStep(1);
                      setCustomerId("");
                      setPoojaId("");
                      setSamagriItems([]);
                      setAdvanceAmount(0);
                      setPaymentChoice("UNPAID");
                      setNotes("");
                    }}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold transition active:scale-98 cursor-pointer text-center"
                  >
                    + புதிய முன்பதிவு
                  </button>
                </div>
              </div>
            </div>
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
