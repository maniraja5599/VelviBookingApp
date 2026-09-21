"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Pooja, PoojaItemTemplate, Booking } from "@/lib/types";
import {
  Flame,
  Plus,
  Clock,
  IndianRupee,
  ChevronRight,
  Edit2,
  Trash2,
  Search,
  X,
  AlertTriangle,
  CheckCircle2,
  ListChecks,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Eye,
  Check,
  Settings,
  ChevronDown,
  ChevronUp,
  Tag,
  Copy,
  Share2,
  Crown,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { SamagriCategory } from "@/lib/types";
import { CategoryManagerModal } from "@/components/categories/CategoryManagerModal";

const SAMAGRI_UNITS: Array<{
  unit: PoojaItemTemplate["unit"];
  labelTa: string;
  labelEn: string;
  code: string;
}> = [
  { unit: "g", labelTa: "கிராம்", labelEn: "g", code: "g" },
  { unit: "kg", labelTa: "கிலோ", labelEn: "kg", code: "kg" },
  { unit: "nos", labelTa: "எண்ணிக்கை", labelEn: "nos", code: "nos" },
  { unit: "packet", labelTa: "பாக்கெட்", labelEn: "pkt", code: "pkt" },
  { unit: "litre", labelTa: "லிட்டர்", labelEn: "L", code: "L" },
  { unit: "ml", labelTa: "மி.லி", labelEn: "ml", code: "ml" },
  { unit: "bundle", labelTa: "கட்டு", labelEn: "bundle", code: "bundle" },
  { unit: "set", labelTa: "செட்", labelEn: "set", code: "set" },
  { unit: "dozen", labelTa: "டஜன்", labelEn: "dozen", code: "dozen" },
];

export interface SamagriCatalogItem {
  id: string;
  category: string;
  ta: string;
  en: string;
  qty: number;
  unit: PoojaItemTemplate["unit"];
}

const SAMAGRI_CATALOG: SamagriCatalogItem[] = [
  // Powders & Fragrances
  { id: "sc-turmeric", category: "powders", ta: "மஞ்சள் தூள்", en: "Turmeric Powder", qty: 100, unit: "g" },
  { id: "sc-kumkum", category: "powders", ta: "குங்குமம்", en: "Kumkum", qty: 50, unit: "g" },
  { id: "sc-sandal", category: "powders", ta: "சந்தனம்", en: "Sandalwood Paste", qty: 50, unit: "g" },
  { id: "sc-vibhuti", category: "powders", ta: "திருநீறு (விபூதி)", en: "Vibhuti (Sacred Ash)", qty: 100, unit: "g" },
  { id: "sc-camphor", category: "powders", ta: "கற்பூரம்", en: "Camphor", qty: 2, unit: "packet" },
  { id: "sc-agarbatti", category: "powders", ta: "அகர்பத்தி", en: "Agarbatti (Incense)", qty: 1, unit: "packet" },
  { id: "sc-javadhu", category: "powders", ta: "ஜவ்வாது", en: "Javadhu", qty: 1, unit: "packet" },
  { id: "sc-paneer", category: "powders", ta: "பன்னீர்", en: "Rose Water (Paneer)", qty: 100, unit: "ml" },
  { id: "sc-elaichi", category: "powders", ta: "ஏலக்காய், லவங்கம், ஜாதிக்காய்", en: "Cardamom, Clove & Nutmeg", qty: 50, unit: "g" },
  { id: "sc-honey", category: "powders", ta: "தேன்", en: "Pure Honey", qty: 100, unit: "ml" },

  // Ghee & Oils
  { id: "sc-ghee", category: "ghee_oils", ta: "தூய பசு நெய்", en: "Pure Cow Ghee", qty: 500, unit: "ml" },
  { id: "sc-sesame", category: "ghee_oils", ta: "நல்லெண்ணெய்", en: "Sesame Oil", qty: 1, unit: "litre" },
  { id: "sc-deepam-oil", category: "ghee_oils", ta: "பஞ்ச தீப எண்ணெய்", en: "Pancha Deepa Oil", qty: 500, unit: "ml" },
  { id: "sc-milk", category: "ghee_oils", ta: "பசும்பால்", en: "Fresh Cow Milk", qty: 1, unit: "litre" },
  { id: "sc-curd", category: "ghee_oils", ta: "தயிர்", en: "Fresh Curd", qty: 500, unit: "ml" },

  // Basics & Fruits
  { id: "sc-coconut", category: "essentials", ta: "தேங்காய்", en: "Coconuts", qty: 5, unit: "nos" },
  { id: "sc-betel", category: "essentials", ta: "வெற்றிலை பாக்கு", en: "Betel Leaves & Nut", qty: 2, unit: "bundle" },
  { id: "sc-banana", category: "essentials", ta: "வாழைப்பழம்", en: "Banana Fruits", qty: 1, unit: "dozen" },
  { id: "sc-lemon", category: "essentials", ta: "எலுமிச்சம்பழம்", en: "Lemons", qty: 5, unit: "nos" },
  { id: "sc-raw-rice", category: "essentials", ta: "பச்சரிசி", en: "Raw Rice", qty: 2, unit: "kg" },
  { id: "sc-jaggery", category: "essentials", ta: "வெல்லம்", en: "Jaggery (Vellam)", qty: 500, unit: "g" },
  { id: "sc-sugar", category: "essentials", ta: "சர்க்கரை", en: "Sugar", qty: 500, unit: "g" },
  { id: "sc-pori", category: "essentials", ta: "நெல்பொரி (அவல்/பொரி)", en: "Puffed Rice / Pori", qty: 200, unit: "g" },
  { id: "sc-tender-coconut", category: "essentials", ta: "இளநீர்", en: "Tender Coconut", qty: 3, unit: "nos" },
  { id: "sc-nuts", category: "essentials", ta: "முந்திரி & உலர்ந்த திராட்சை", en: "Cashews & Raisins", qty: 100, unit: "g" },

  // Homam Samagri
  { id: "sc-samithu", category: "homam", ta: "சமித்து கட்டை", en: "Homam Wood (Samithu)", qty: 2, unit: "bundle" },
  { id: "sc-navadhanyam", category: "homam", ta: "நவதானியம் (9 தானியங்கள்)", en: "Navadhanyam 9 Grains", qty: 1, unit: "set" },
  { id: "sc-ven-kadugu", category: "homam", ta: "வெண் கடுகு", en: "White Mustard Seeds", qty: 100, unit: "g" },
  { id: "sc-homa-dravyam", category: "homam", ta: "ஹோம திரவிய பொடி", en: "Homa Dravyam Mixture", qty: 200, unit: "g" },
  { id: "sc-kopparai", category: "homam", ta: "கொப்பரை தேங்காய்", en: "Dry Coconut (Kopparai)", qty: 2, unit: "nos" },
  { id: "sc-dharba", category: "homam", ta: "தர்பை புல் & பவித்ரம்", en: "Dharba Grass & Pavithram", qty: 2, unit: "bundle" },
  { id: "sc-navagraha-samithu", category: "homam", ta: "நவகிரக சமித்து செட்", en: "Navagraha Samithu Sticks", qty: 1, unit: "set" },

  // Flowers & Leaves
  { id: "sc-garland", category: "flowers", ta: "பூக்கள் & மாலை", en: "Garlands & Loose Flowers", qty: 2, unit: "nos" },
  { id: "sc-lotus", category: "flowers", ta: "தாமரை மலர்கள்", en: "Lotus Flowers", qty: 8, unit: "nos" },
  { id: "sc-thulasi", category: "flowers", ta: "துளசி தளம்", en: "Thulasi Holy Basil", qty: 2, unit: "bundle" },
  { id: "sc-arugampul", category: "flowers", ta: "அருகம்புல்", en: "Arugampul Grass", qty: 2, unit: "bundle" },
  { id: "sc-vilvam", category: "flowers", ta: "வில்வ இலை", en: "Vilvam Leaves", qty: 2, unit: "bundle" },
  { id: "sc-mavilai", category: "flowers", ta: "மாவிலை", en: "Mango Leaves", qty: 2, unit: "bundle" },

  // Vastram & Sets
  { id: "sc-vastram", category: "vastram", ta: "வேஷ்டி & துண்டு செட்", en: "Dhothi & Angavastram", qty: 1, unit: "set" },
  { id: "sc-navagraha-vastram", category: "vastram", ta: "நவகிரக 9 வண்ண வஸ்திரம்", en: "Navagraha 9 Colors Vastram", qty: 1, unit: "set" },
  { id: "sc-coins-108", category: "vastram", ta: "108 நாணயங்கள் செட்", en: "108 Pooja Coins Set", qty: 1, unit: "set" },
  { id: "sc-kalasa-thread", category: "vastram", ta: "கலச நூல் & வஸ்திரம்", en: "Kalasa Sacred Thread", qty: 1, unit: "nos" },
  { id: "sc-modak", category: "vastram", ta: "மோதகம் / கொழுக்கட்டை", en: "Modak / Kozhukattai", qty: 21, unit: "nos" },
];

const PRESET_POOJA_TEMPLATES = [
  {
    icon: "🐘",
    englishName: "Ganapathi Homam",
    tamilName: "கணபதி ஹோமம்",
    description: "Invokes Lord Ganesha for removing obstacles, beginnings & prosperity.",
    durationMinutes: 120,
    basePrice: 5000,
    items: [
      { itemEnglishName: "Turmeric Powder", itemTamilName: "மஞ்சள் தூள்", quantity: 100, unit: "g" as const },
      { itemEnglishName: "Kumkum", itemTamilName: "குங்குமம்", quantity: 50, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 5, unit: "nos" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 500, unit: "ml" as const },
      { itemEnglishName: "Modak / Kozhukattai", itemTamilName: "மோதகம் / கொழுக்கட்டை", quantity: 21, unit: "nos" as const },
      { itemEnglishName: "Arugampul", itemTamilName: "அருகம்புல்", quantity: 2, unit: "bundle" as const },
      { itemEnglishName: "Betel Leaves & Nut", itemTamilName: "வெற்றிலை பாக்கு", quantity: 2, unit: "bundle" as const },
      { itemEnglishName: "Camphor", itemTamilName: "கற்பூரம்", quantity: 2, unit: "packet" as const },
      { itemEnglishName: "Honey", itemTamilName: "தேன்", quantity: 100, unit: "ml" as const },
    ],
  },
  {
    icon: "🏠",
    englishName: "Gruhapravesam",
    tamilName: "கிரகப்பிரவேசம்",
    description: "Traditional auspicious house-warming ceremony with Gomatha pooja, Paal kaachuthal & Lakshmi blessings.",
    durationMinutes: 240,
    basePrice: 10000,
    items: [
      { itemEnglishName: "Turmeric Powder", itemTamilName: "மஞ்சள் தூள்", quantity: 500, unit: "g" as const },
      { itemEnglishName: "Kumkum", itemTamilName: "குங்குமம்", quantity: 250, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 11, unit: "nos" as const },
      { itemEnglishName: "Raw Rice", itemTamilName: "பச்சரிசி", quantity: 5, unit: "kg" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1000, unit: "ml" as const },
      { itemEnglishName: "Mango Leaves", itemTamilName: "மாவிலை", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "Betel Leaves & Nut", itemTamilName: "வெற்றிலை பாக்கு", quantity: 5, unit: "bundle" as const },
      { itemEnglishName: "Milk for Boiling", itemTamilName: "பால் காய்ச்ச பசும்பால்", quantity: 2, unit: "litre" as const },
      { itemEnglishName: "Banana Fruits", itemTamilName: "வாழைப்பழம்", quantity: 2, unit: "dozen" as const },
      { itemEnglishName: "Camphor", itemTamilName: "கற்பூரம்", quantity: 5, unit: "packet" as const },
    ],
  },
  {
    icon: "📐",
    englishName: "Vastu Homam",
    tamilName: "வாஸ்து ஹோமம்",
    description: "Vedic ceremony invoking Vastu Purusha to eliminate architectural doshas and bless the dwelling with peace.",
    durationMinutes: 180,
    basePrice: 7500,
    items: [
      { itemEnglishName: "Navadhanyam", itemTamilName: "நவதானியம்", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Homam Wood (Samithu)", itemTamilName: "சமித்து கட்டை", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1000, unit: "ml" as const },
      { itemEnglishName: "White Mustard (Kadugu)", itemTamilName: "வெண் கடுகு", quantity: 100, unit: "g" as const },
      { itemEnglishName: "Homa Dravyam Mixture", itemTamilName: "ஹோம திரவிய பொடி", quantity: 200, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 7, unit: "nos" as const },
      { itemEnglishName: "Turmeric & Kumkum", itemTamilName: "மஞ்சள் & குங்குமம்", quantity: 200, unit: "g" as const },
      { itemEnglishName: "Dharba Grass & Pavithram", itemTamilName: "தர்பை புல் & பவித்ரம்", quantity: 2, unit: "bundle" as const },
      { itemEnglishName: "Dry Coconut (Kopparai)", itemTamilName: "கொப்பரை தேங்காய்", quantity: 2, unit: "nos" as const },
      { itemEnglishName: "Betel Leaves & Nut", itemTamilName: "வெற்றிலை பாக்கு", quantity: 3, unit: "bundle" as const },
    ],
  },
  {
    icon: "🪔",
    englishName: "Maha Sudarshana Homam",
    tamilName: "மகா சுதர்சன ஹோமம்",
    description: "Powerful Vedic ritual for protection against negative forces, health & victory.",
    durationMinutes: 180,
    basePrice: 7500,
    items: [
      { itemEnglishName: "Turmeric Powder", itemTamilName: "மஞ்சள் தூள்", quantity: 200, unit: "g" as const },
      { itemEnglishName: "Kumkum", itemTamilName: "குங்குமம்", quantity: 100, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 7, unit: "nos" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1000, unit: "ml" as const },
      { itemEnglishName: "Raw Rice", itemTamilName: "பச்சரிசி", quantity: 3, unit: "kg" as const },
      { itemEnglishName: "Thulasi Leaves", itemTamilName: "துளசி தளம்", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "White Mustard (Kadugu)", itemTamilName: "வெண் கடுகு", quantity: 100, unit: "g" as const },
      { itemEnglishName: "Homam Wood (Samithu)", itemTamilName: "சமித்து கட்டை", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "Camphor & Agarbatti", itemTamilName: "கற்பூரம் & அகர்பத்தி", quantity: 3, unit: "packet" as const },
    ],
  },
  {
    icon: "🌿",
    englishName: "Rudrabhishekam & Homam",
    tamilName: "ருத்ராபிஷேகம் & ஹோமம்",
    description: "Sacred abhishekam with Sri Rudram chanting for inner peace, health and longevity.",
    durationMinutes: 150,
    basePrice: 6000,
    items: [
      { itemEnglishName: "Milk", itemTamilName: "பசும்பால்", quantity: 3, unit: "litre" as const },
      { itemEnglishName: "Curd", itemTamilName: "தயிர்", quantity: 1, unit: "litre" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 500, unit: "ml" as const },
      { itemEnglishName: "Honey", itemTamilName: "தேன்", quantity: 200, unit: "ml" as const },
      { itemEnglishName: "Tender Coconut", itemTamilName: "இளநீர்", quantity: 5, unit: "nos" as const },
      { itemEnglishName: "Vilvam Leaves", itemTamilName: "வில்வ இலை", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "Vibhuti (Sacred Ash)", itemTamilName: "திருநீறு (விபூதி)", quantity: 200, unit: "g" as const },
      { itemEnglishName: "Sandalwood Paste", itemTamilName: "சந்தனம்", quantity: 100, unit: "g" as const },
    ],
  },
  {
    icon: "🪐",
    englishName: "Navagraha Homam",
    tamilName: "நவகிரக ஹோமம்",
    description: "Appeases the nine celestial planetary deities for dosha nivarthi and prosperity.",
    durationMinutes: 180,
    basePrice: 8000,
    items: [
      { itemEnglishName: "Navadhanyam 9 Grains", itemTamilName: "நவதானியம் (9 தானியங்கள்)", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Navagraha Vastram", itemTamilName: "நவகிரக வஸ்திரம்", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Turmeric & Kumkum", itemTamilName: "மஞ்சள் & குங்குமம்", quantity: 200, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 9, unit: "nos" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1000, unit: "ml" as const },
      { itemEnglishName: "Navagraha Samithu", itemTamilName: "நவகிரக சமித்து கட்டை", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Betel Leaves", itemTamilName: "வெற்றிலை பாக்கு", quantity: 3, unit: "bundle" as const },
    ],
  },
  {
    icon: "🪙",
    englishName: "Maha Lakshmi Kubera Pooja",
    tamilName: "மகா லக்ஷ்மி குபேர பூஜை",
    description: "Divine pooja invoking Goddess Lakshmi & Lord Kubera for wealth and debt removal.",
    durationMinutes: 90,
    basePrice: 4500,
    items: [
      { itemEnglishName: "Turmeric & Kumkum", itemTamilName: "மஞ்சள் & குங்குமம்", quantity: 150, unit: "g" as const },
      { itemEnglishName: "Lotus Flowers", itemTamilName: "தாமரை பூக்கள்", quantity: 8, unit: "nos" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 3, unit: "nos" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 500, unit: "ml" as const },
      { itemEnglishName: "108 Coins Set", itemTamilName: "108 நாணயங்கள்", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Betel Leaves", itemTamilName: "வெற்றிலை பாக்கு", quantity: 2, unit: "bundle" as const },
    ],
  },
  {
    icon: "🌸",
    englishName: "Sri Satyanarayana Pooja",
    tamilName: "ஸ்ரீ சத்யநாராயண பூஜை",
    description: "Sacred full-moon / pournami pooja with 5-chapter katha & prasad for family welfare.",
    durationMinutes: 120,
    basePrice: 4000,
    items: [
      { itemEnglishName: "Wheat Rava / Sooji", itemTamilName: "கோதுமை ரவை", quantity: 500, unit: "g" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 500, unit: "ml" as const },
      { itemEnglishName: "Sugar / Jaggery", itemTamilName: "சர்க்கரை / வெல்லம்", quantity: 500, unit: "g" as const },
      { itemEnglishName: "Milk", itemTamilName: "பசும்பால்", quantity: 1, unit: "litre" as const },
      { itemEnglishName: "Bananas", itemTamilName: "வாழைப்பழம்", quantity: 1, unit: "dozen" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 5, unit: "nos" as const },
    ],
  },
  {
    icon: "👶",
    englishName: "Ayush Homam / Sashtiapthapoorthi",
    tamilName: "ஆயுஷ் ஹோமம் / சஷ்டியப்தபூர்த்தி",
    description: "Vedic ceremony for child's 1st birthday or 60th / 80th anniversary for long life & health.",
    durationMinutes: 240,
    basePrice: 10000,
    items: [
      { itemEnglishName: "Turmeric & Kumkum", itemTamilName: "மஞ்சள் & குங்குமம்", quantity: 300, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 9, unit: "nos" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1000, unit: "ml" as const },
      { itemEnglishName: "Raw Rice", itemTamilName: "பச்சரிசி", quantity: 5, unit: "kg" as const },
      { itemEnglishName: "Dhothi & Angavastram", itemTamilName: "வேஷ்டி & துண்டு செட்", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Ayur Devatha Samithu", itemTamilName: "ஆயுர் தேவதை சமித்து", quantity: 2, unit: "bundle" as const },
    ],
  },
];

const getUnitBadgeLabel = (unit: string) => {
  const found = SAMAGRI_UNITS.find((u) => u.unit === unit);
  if (found) {
    return `${found.labelTa} (${found.code})`;
  }
  return unit;
};

function PoojasCatalogueContent() {
  const { currentBusiness } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [poojas, setPoojas] = useState<Pooja[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPooja, setSelectedPooja] = useState<Pooja | null>(null);

  useEffect(() => {
    setPoojas(db.getPoojas(businessId));
    setBookings(db.getBookings(businessId));
    const handleDbChange = () => {
      setPoojas([...db.getPoojas(businessId)]);
      setBookings([...db.getBookings(businessId)]);
    };
    window.addEventListener("velvi:db-change", handleDbChange);
    return () => window.removeEventListener("velvi:db-change", handleDbChange);
  }, [businessId]);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPoojaId, setEditingPoojaId] = useState<string | null>(null);

  // Form states
  const [formEnglishName, setFormEnglishName] = useState("");
  const [formTamilName, setFormTamilName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState<number>(60);
  const [formBasePrice, setFormBasePrice] = useState<number | string>("");
  const [formItems, setFormItems] = useState<PoojaItemTemplate[]>([]);
  const [formError, setFormError] = useState("");

  // New item inline input states
  const [newItemEnglish, setNewItemEnglish] = useState("");
  const [newItemTamil, setNewItemTamil] = useState("");
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<PoojaItemTemplate["unit"]>("nos");
  const [newItemCategory, setNewItemCategory] = useState<string>("essentials");

  // Dynamic Categories and on-demand drawer states
  const [categories, setCategories] = useState<SamagriCategory[]>([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showChecklistDrawer, setShowChecklistDrawer] = useState(false);
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);

  // Detail view (full-page inline view) states
  const [detailItemSearch, setDetailItemSearch] = useState("");
  const [selectedDetailCategory, setSelectedDetailCategory] = useState("all");
  const [copiedToast, setCopiedToast] = useState(false);

  useEffect(() => {
    setCategories(db.getSamagriCategories());
  }, []);

  const handleCategoriesChanged = () => {
    const updated = db.getSamagriCategories();
    setCategories([...updated]);
  };

  const handleCopyChecklist = () => {
    if (!selectedPooja || !selectedPooja.items) return;
    const lines = [
      `🪔 ${selectedPooja.tamilName || selectedPooja.englishName} - பூஜை பொருட்கள் பட்டியல்`,
      `Dakshina / தட்சணை: ₹${selectedPooja.basePrice.toLocaleString("en-IN")}`,
      "",
      "பொருட்கள் (Materials Checklist):",
      ...selectedPooja.items.map((it, idx) => {
        const cat = categories.find((c) => c.id === it.category);
        const icon = cat?.icon || "•";
        const unit = getUnitBadgeLabel(it.unit);
        return `${idx + 1}. ${icon} ${it.itemTamilName || it.itemEnglishName} (${it.itemEnglishName}) - ${it.quantity} ${unit}`;
      }),
      "",
      `மொத்தம்: ${selectedPooja.items.length} பொருட்கள்`,
      "— வேள்வி செயலி (Velvi App)"
    ];
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(lines.join("\n")).then(() => {
        setCopiedToast(true);
        setTimeout(() => setCopiedToast(false), 3000);
      });
    }
  };

  const displayedDetailItems = (selectedPooja?.items || []).filter((it) => {
    const matchesCategory =
      selectedDetailCategory === "all" || it.category === selectedDetailCategory;
    if (!matchesCategory) return false;
    if (!detailItemSearch.trim()) return true;
    const q = detailItemSearch.toLowerCase();
    const cat = categories.find((c) => c.id === it.category);
    return (
      it.itemEnglishName.toLowerCase().includes(q) ||
      it.itemTamilName.toLowerCase().includes(q) ||
      (cat?.labelTa && cat.labelTa.toLowerCase().includes(q)) ||
      (cat?.labelEn && cat.labelEn.toLowerCase().includes(q)) ||
      it.unit.toLowerCase().includes(q)
    );
  });

  // Fast Samagri Library Picker States
  const [samagriSearchQuery, setSamagriSearchQuery] = useState("");
  const [selectedSamagriCategory, setSelectedSamagriCategory] = useState<string>("all");
  const [selectedPresetName, setSelectedPresetName] = useState<string>("");

  // Delete modal state
  const [deletingPooja, setDeletingPooja] = useState<Pooja | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const filteredPoojas = poojas.filter(
    (p) =>
      p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamilName && p.tamilName.includes(searchQuery)) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Booking statistics per pooja and top performed pooja
  const poojaBookingStats = useMemo(() => {
    const stats: Record<
      string,
      {
        count: number;
        completedCount: number;
        totalDakshina: number;
      }
    > = {};

    poojas.forEach((p) => {
      stats[p.id] = { count: 0, completedCount: 0, totalDakshina: 0 };
    });

    bookings.forEach((b) => {
      const matchedPooja =
        poojas.find((p) => p.id === b.poojaId) ||
        poojas.find(
          (p) =>
            b.poojaEnglishName &&
            p.englishName.toLowerCase() === b.poojaEnglishName.toLowerCase()
        );

      const pId = matchedPooja ? matchedPooja.id : b.poojaId;
      if (pId) {
        if (!stats[pId]) {
          stats[pId] = { count: 0, completedCount: 0, totalDakshina: 0 };
        }
        stats[pId].count += 1;
        if (b.status === "COMPLETED") {
          stats[pId].completedCount += 1;
        }
        stats[pId].totalDakshina += b.totalAmount || 0;
      }
    });

    return stats;
  }, [poojas, bookings]);

  // Find top performed pooja (#1 most booked)
  const topPerformedPooja = useMemo<{
    pooja: Pooja;
    count: number;
    stats?: { count: number; completedCount: number; totalDakshina: number };
  } | null>(() => {
    if (poojas.length === 0) return null;
    let maxCount = -1;
    let top: Pooja | null = null;
    for (const p of poojas) {
      const c = poojaBookingStats[p.id]?.count || 0;
      if (c > maxCount) {
        maxCount = c;
        top = p;
      }
    }
    if (!top) return null;
    return {
      pooja: top,
      count: maxCount,
      stats: poojaBookingStats[top.id],
    };
  }, [poojas, poojaBookingStats]);

  const applyPoojaPreset = (preset: (typeof PRESET_POOJA_TEMPLATES)[0]) => {
    setSelectedPresetName(preset.englishName);
    setFormEnglishName(preset.englishName);
    setFormTamilName(preset.tamilName);
    setFormDescription(preset.description);
    setFormDuration(preset.durationMinutes || 60);
    setFormBasePrice(preset.basePrice);
    setFormItems(
      preset.items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx + 1}`,
        poojaId: editingPoojaId || "",
        itemEnglishName: item.itemEnglishName,
        itemTamilName: item.itemTamilName,
        quantity: item.quantity,
        unit: item.unit,
        sortOrder: idx + 1,
      }))
    );
    setFormError("");
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingPoojaId(null);
    setModalStep(1);
    setSelectedPresetName("");
    setFormEnglishName("");
    setFormTamilName("");
    setFormDescription("");
    setFormDuration(60);
    setFormBasePrice("");
    setFormItems([]);
    setFormError("");
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
    setNewItemCategory(categories[0]?.id || "essentials");
    setShowChecklistDrawer(false);
    setShowCustomItemForm(false);
    setSamagriSearchQuery("");
    setSelectedSamagriCategory("all");
    setShowFormModal(true);
  };

  useEffect(() => {
    if (searchParams.get("action") === "new" || searchParams.get("openAdd") === "true") {
      openCreateModal();
    }
  }, [searchParams]);

  const openEditModal = (p: Pooja) => {
    setIsEditing(true);
    setEditingPoojaId(p.id);
    setModalStep(1);
    setSelectedPresetName("");
    setFormEnglishName(p.englishName);
    setFormTamilName(p.tamilName || "");
    setFormDescription(p.description || "");
    setFormDuration(p.durationMinutes || 120);
    setFormBasePrice(p.basePrice || 0);
    setFormItems(p.items ? [...p.items] : []);
    setFormError("");
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
    setNewItemCategory(categories[0]?.id || "essentials");
    setShowChecklistDrawer(false);
    setShowCustomItemForm(false);
    setSamagriSearchQuery("");
    setSelectedSamagriCategory("all");
    setShowFormModal(true);
  };

  const handleNextModalStep = () => {
    setFormError("");
    if (modalStep === 1) {
      if (!formEnglishName.trim() && !formTamilName.trim()) {
        setFormError("ஏதேனும் ஒரு பெயர் உள்ளிடவும் (English or Tamil Name is required)");
        return;
      }
      setModalStep(2);
    } else if (modalStep === 2) {
      setModalStep(3);
    }
  };

  const handlePrevModalStep = () => {
    setFormError("");
    setModalStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : 1));
  };

  const handleAddItemToForm = () => {
    if (!newItemEnglish.trim() && !newItemTamil.trim()) {
      return;
    }
    const finalItemEn = newItemEnglish.trim() || newItemTamil.trim();
    const finalItemTa = newItemTamil.trim() || newItemEnglish.trim();
    const item: PoojaItemTemplate = {
      id: `item-${Date.now()}-${formItems.length + 1}`,
      poojaId: editingPoojaId || "",
      itemEnglishName: finalItemEn,
      itemTamilName: finalItemTa,
      quantity: Number(newItemQty) || 1,
      unit: newItemUnit,
      category: newItemCategory,
      sortOrder: formItems.length + 1,
    };
    setFormItems([...formItems, item]);
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
  };

  const handleRemoveItemFromForm = (itemId: string) => {
    setFormItems(formItems.filter((it) => it.id !== itemId));
  };

  const handleSavePooja = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formEnglishName.trim() && !formTamilName.trim()) {
      setFormError("ஏதேனும் ஒரு பெயர் உள்ளிடவும் (English or Tamil Name is required)");
      return;
    }

    const finalEn = formEnglishName.trim() || formTamilName.trim();
    const finalTa = formTamilName.trim() || formEnglishName.trim();

    if (isEditing && editingPoojaId) {
      const updated = db.updatePooja(editingPoojaId, {
        englishName: finalEn,
        tamilName: finalTa,
        description: formDescription.trim(),
        durationMinutes: Number(formDuration) || 120,
        basePrice: Number(formBasePrice) || 0,
        items: formItems,
      });

      if (updated) {
        setPoojas([...db.getPoojas(businessId)]);
        if (selectedPooja?.id === editingPoojaId) {
          setSelectedPooja(updated);
        }
        setShowFormModal(false);
        setStatusMessage(`Updated "${updated.englishName || updated.tamilName}" successfully!`);
        setTimeout(() => setStatusMessage(""), 4000);
      }
    } else {
      const created = db.createPooja({
        businessId,
        englishName: finalEn,
        tamilName: finalTa,
        description: formDescription.trim(),
        durationMinutes: Number(formDuration) || 120,
        basePrice: Number(formBasePrice) || 0,
        items: formItems,
      });

      setPoojas([...db.getPoojas(businessId)]);
      setShowFormModal(false);
      setStatusMessage(`Created "${created.englishName || created.tamilName}" successfully!`);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  const confirmDelete = () => {
    if (!deletingPooja) return;
    const name = deletingPooja.englishName;
    const success = db.deletePooja(deletingPooja.id);
    if (success) {
      setPoojas([...db.getPoojas(businessId)]);
      if (selectedPooja?.id === deletingPooja.id) {
        setSelectedPooja(null);
      }
      setDeletingPooja(null);
      setStatusMessage(`Deleted "${name}" successfully.`);
      setTimeout(() => setStatusMessage(""), 4000);
    }
  };

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Prominent Glowing Return-to-Booking Banner (Appears ONLY when accessed from New Booking) */}
      {(searchParams.get("returnTo") === "booking" ||
        searchParams.get("returnTo") === "quick-booking" ||
        searchParams.get("returnTo") === "new-booking") && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-600 via-emerald-700 to-[#0b2b17] text-white p-4 rounded-3xl shadow-xl border-2 border-amber-300 animate-in slide-in-from-top-2 duration-300">
          <div className="absolute -right-8 -top-8 w-36 h-36 bg-white/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between gap-3 flex-wrap relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/30 shrink-0">
                🪔
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs sm:text-sm font-black text-amber-100 tracking-wide uppercase">
                    New Booking in Progress
                  </span>
                  <span className="text-[10px] font-black bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full shadow-2xs border border-amber-300">
                    முன்பதிவு வழிகாட்டி
                  </span>
                </div>
                <p className="text-xs font-semibold text-white/95 mt-0.5">
                  பூஜை விவரங்களைச் சரிபார்த்த பின் அல்லது புதிய பூஜை சேர்த்த பின் முன்பதிவுப் பக்கத்திற்குத் திரும்பவும்.
                </p>
              </div>
            </div>

            <Link
              href="/app/bookings/new"
              className="px-4 py-2.5 bg-white hover:bg-amber-50 text-slate-900 text-xs sm:text-sm font-black rounded-2xl shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer shrink-0 border border-white/40 ring-4 ring-white/25"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-800 stroke-[3]" />
              <span>← Return to Booking</span>
              <span className="text-[11px] font-bold text-emerald-800 hidden sm:inline">(முன்பதிவுக்குத் திரும்பு)</span>
            </Link>
          </div>
        </div>
      )}

      {selectedPooja ? (
        /* FULL POOJA & SAMAGRI DETAILS VIEW (NOT A POPUP - NO SCROLL CONSTRAINT) */
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Top Bar: Back button and actions */}
          <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-200/80">
            <button
              onClick={() => {
                setSelectedPooja(null);
                setDetailItemSearch("");
                setSelectedDetailCategory("all");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-2xs border border-slate-200"
            >
              <ArrowLeft className="w-4 h-4 text-emerald-800 stroke-[2.5]" />
              <span>← அனைத்து பூஜைகள் (All Poojas)</span>
            </button>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyChecklist}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition active:scale-95 cursor-pointer border border-emerald-300 shadow-2xs"
                title="Copy formatted checklist for WhatsApp / SMS"
              >
                <Copy className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">பட்டியல் நகலெடு</span>
              </button>
              <button
                onClick={() => openEditModal(selectedPooja)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition active:scale-95 cursor-pointer border border-amber-300 shadow-2xs"
                title="Edit Pooja Details"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-700" />
                <span>திருத்து</span>
              </button>
              <button
                onClick={() => setDeletingPooja(selectedPooja)}
                className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition active:scale-95 cursor-pointer border border-rose-200 shadow-2xs"
                title="Delete Pooja"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Copy Success Notice */}
          {copiedToast && (
            <div className="bg-emerald-900 text-emerald-100 px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-between animate-in fade-in shadow-md">
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                <span>பூஜா பொருட்கள் பட்டியல் வெற்றிகரமாக நகலெடுக்கப்பட்டது! (Copied to clipboard!)</span>
              </span>
            </div>
          )}

          {/* Hero / Overview Card */}
          <div className="bg-gradient-to-br from-amber-50/90 via-white to-amber-100/40 rounded-3xl p-4 sm:p-5 border-2 border-amber-300/80 shadow-xs space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 text-white flex items-center justify-center shrink-0 shadow-md border border-amber-400">
                  <Flame className="w-6 h-6 text-amber-100" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
                      {selectedPooja.tamilName || selectedPooja.englishName}
                    </h2>
                    {selectedPooja.tamilName && selectedPooja.tamilName !== selectedPooja.englishName && (
                      <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-lg border border-amber-300">
                        {selectedPooja.englishName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-semibold mt-0.5">
                    வேத சாஸ்திர முறைப்படியான சடங்கு & பொருட்கள் விபரம்
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  தட்சணை (Dakshina)
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  ₹{selectedPooja.basePrice.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  முன்பதிவுகள் (Bookings)
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-800 flex items-center gap-1">
                  <span>{poojaBookingStats[selectedPooja.id]?.count || 0}</span>
                  <span className="text-xs font-bold text-slate-500">பூஜைகள்</span>
                </span>
              </div>

              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  தேவையான பொருட்கள்
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900">
                  {selectedPooja.items?.length || 0} பொருட்கள்
                </span>
              </div>

              <div className="bg-white/90 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                  கால அளவு (Duration)
                </span>
                <span className="text-xs sm:text-sm font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {selectedPooja.durationMinutes ? `${selectedPooja.durationMinutes} நிமி` : "2-3 மணி"}
                  </span>
                </span>
              </div>
            </div>

            {/* Description / Ritual significance */}
            {selectedPooja.description && (
              <div className="bg-white/85 p-3 rounded-2xl border border-amber-200/70 text-xs text-slate-700 leading-relaxed font-medium">
                <p>{selectedPooja.description}</p>
              </div>
            )}
          </div>

          {/* Full Samagri Checklist Section - FULL LENGTH, NO INNER SCROLL BOX */}
          <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-emerald-700" />
                  <span>பூஜா பொருட்கள் முழுப் பட்டியல் (Materials Checklist)</span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  இந்த பூஜைக்குத் தேவையான அனைத்து மங்கல மற்றும் ஹோமப் பொருட்கள் ({selectedPooja.items?.length || 0} பொருட்கள்)
                </p>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopyChecklist}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 flex items-center gap-1 transition cursor-pointer"
                >
                  <Copy className="w-3 h-3 text-emerald-700" />
                  <span>பட்டியல் நகல்</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Toolbar */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="பொருட்களில் தேடுக... (மஞ்சள், நெய், coconut, gram...)"
                  value={detailItemSearch}
                  onChange={(e) => setDetailItemSearch(e.target.value)}
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                />
                {detailItemSearch && (
                  <button
                    onClick={() => setDetailItemSearch("")}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedDetailCategory("all")}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition border cursor-pointer ${
                    selectedDetailCategory === "all"
                      ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  அனைத்தும் ({selectedPooja.items?.length || 0})
                </button>
                {categories.map((cat) => {
                  const count = (selectedPooja.items || []).filter((it) => it.category === cat.id).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedDetailCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition border flex items-center gap-1 cursor-pointer ${
                        selectedDetailCategory === cat.id
                          ? "bg-emerald-800 text-white border-emerald-800 shadow-2xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.labelTa}</span>
                      <span className="opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* FULL LENGTH ITEMS LIST (NO INNER SCROLL CONTAINER!) */}
            {displayedDetailItems.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                பொருட்கள் எதுவும் பொருந்தவில்லை.
              </div>
            ) : (
              <div className="space-y-1.5 pt-1">
                {displayedDetailItems.map((it, idx) => {
                  const catInfo = categories.find((c) => c.id === it.category);
                  return (
                    <div
                      key={it.id}
                      className="p-3 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl border border-slate-200/80 transition flex items-center justify-between gap-2.5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Sequence number badge */}
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-900 font-black text-[11px] flex items-center justify-center shrink-0 border border-emerald-200/70">
                          #{idx + 1}
                        </div>

                        {/* Category Icon */}
                        <span className="text-base shrink-0" title={catInfo?.labelTa}>
                          {catInfo?.icon || "✨"}
                        </span>

                        {/* Item Names & Category Badge */}
                        <div className="min-w-0">
                          <div className="text-xs font-black text-slate-900 leading-tight">
                            {it.itemTamilName || it.itemEnglishName}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {it.itemEnglishName && it.itemEnglishName !== it.itemTamilName && (
                              <span className="text-[10px] text-slate-500 font-medium truncate">
                                {it.itemEnglishName}
                              </span>
                            )}
                            {catInfo && (
                              <span className="text-[9px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70 inline-flex items-center gap-0.5 shrink-0">
                                <span>{catInfo.icon}</span>
                                <span>{catInfo.labelTa}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quantity & Unit Pill */}
                      <span className="text-xs font-black text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-xl border border-emerald-300 shrink-0">
                        {it.quantity} {getUnitBadgeLabel(it.unit)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="space-y-2 pt-1">
            <Link
              href={`/app/bookings/new?poojaId=${selectedPooja.id}`}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-center font-extrabold text-sm rounded-2xl shadow-md hover:shadow-lg transition active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>இந்த பூஜையை முன்பதிவு செய்ய (Book this Homam)</span>
            </Link>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => openEditModal(selectedPooja)}
                className="py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>விவரங்களைத் திருத்து (Edit)</span>
              </button>

              <button
                type="button"
                onClick={handleCopyChecklist}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-slate-600" />
                <span>பட்டியல் நகலெடு (Copy)</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* NORMAL POOJA CATALOGUE LIST VIEW */
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-200/60">
                  <Flame className="w-4 h-4 text-amber-600" />
                </div>
                <span>{t("pooja") || "Pooja & Homam Services"}</span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {filteredPoojas.length} வேத சடங்குகள் &amp; பொருட்கள் பட்டியல்
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={openCreateModal}
                className="px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
                <span>Add Pooja</span>
              </button>
            </div>
          </div>

          {/* Top Analytics Summary Strip & #1 Most Booked Pooja Card */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            {/* Top Performed Pooja Card */}
            {topPerformedPooja && (
              <div className="sm:col-span-2 bg-gradient-to-br from-amber-500/10 via-amber-100/40 to-emerald-50/50 rounded-3xl p-3.5 sm:p-4 border-2 border-amber-300/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center font-bold text-xl shadow-md border border-amber-300 shrink-0">
                      👑
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2 py-0.5 rounded-full border border-amber-300">
                          ⭐ Top Performed (அதிக முன்பதிவு)
                        </span>
                        {topPerformedPooja.count > 0 && (
                          <span className="text-[10px] font-black text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            🔥 {topPerformedPooja.count} Bookings
                          </span>
                        )}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 mt-1 truncate">
                        {topPerformedPooja.pooja.tamilName || topPerformedPooja.pooja.englishName}
                      </h3>
                      <p className="text-xs text-slate-600 font-medium truncate">
                        {topPerformedPooja.pooja.englishName} • Dakshina: ₹{topPerformedPooja.pooja.basePrice.toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedPooja(topPerformedPooja.pooja)}
                    className="text-xs font-bold text-amber-900 hover:text-amber-950 bg-white hover:bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs transition active:scale-95 shrink-0 cursor-pointer"
                  >
                    விவரம் →
                  </button>
                </div>
              </div>
            )}

            {/* Quick Metrics Column */}
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    மொத்த பூஜைகள்
                  </span>
                  <span className="text-sm sm:text-base font-black text-slate-900">
                    {poojas.length} சேவைகள்
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-sm shrink-0">
                  🪔
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
                    மொத்த முன்பதிவுகள்
                  </span>
                  <span className="text-sm sm:text-base font-black text-emerald-800">
                    {bookings.length} பூஜைகள்
                  </span>
                </div>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-sm font-bold shrink-0">
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Status Notice */}
          {statusMessage && (
            <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 bg-emerald-50 px-3.5 py-2.5 rounded-2xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search pooja, homam, items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 bg-white rounded-2xl border border-slate-200/90 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 transition shadow-2xs font-medium"
            />
          </div>

          {/* Poojas List */}
          <div className="space-y-2.5">
            {filteredPoojas.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-dashed border-slate-200 shadow-2xs">
                <Flame className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <h4 className="font-bold text-sm text-slate-800">No Pooja or Homam found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tap the "+ Add Pooja" button above to create a new ceremony template.
                </p>
              </div>
            ) : (
              filteredPoojas.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPooja(p)}
                  className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 text-amber-700 flex items-center justify-center shrink-0 mt-0.5 border border-amber-200 shadow-2xs group-hover:scale-105 transition-transform">
                      <Flame className="w-5 h-5 text-amber-600" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {p.englishName}
                        </h4>
                        {p.tamilName && p.tamilName !== p.englishName && (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200">
                            {p.tamilName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium mt-1 flex-wrap">
                        <span className="text-slate-600 font-semibold">{p.items?.length || 0} items checklist</span>
                        <span>•</span>
                        {/* Booking Count Badge */}
                        {poojaBookingStats[p.id]?.count > 0 ? (
                          <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                            🔥 <span>{poojaBookingStats[p.id].count} Bookings</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                            0 Bookings
                          </span>
                        )}
                        {topPerformedPooja?.pooja.id === p.id && topPerformedPooja.count > 0 && (
                          <span className="text-[10px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-300 flex items-center gap-1 shadow-2xs">
                            👑 Top Performed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-2 shrink-0">
                    <div>
                      <div className="text-base font-black text-slate-900">
                        ₹{p.basePrice.toLocaleString("en-IN")}
                      </div>
                      <div className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider">Dakshina</div>
                    </div>

                    {/* Quick Action buttons */}
                    <div className="flex items-center gap-1 ml-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                        title="Edit Pooja"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingPooja(p)}
                        className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Delete Pooja"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create / Edit Pooja Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-velvi-gold/30 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shadow-2xs border border-amber-200">
                  <Flame className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900 leading-tight">
                      {isEditing ? "பூஜை திருத்துதல் (Edit Pooja)" : "புதிய பூஜை உருவாக்குதல் (Create Pooja)"}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium">
                      {modalStep === 1
                        ? "பெயர் & தட்சிணைக் கட்டணம்"
                        : modalStep === 2
                        ? `பூஜா பொருட்கள் பட்டியல் (${formItems.length} சேர்க்கப்பட்டது)`
                        : "முழு விவரங்கள் சரிபார்ப்பு & உறுதிப்படுத்தல்"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 3-Step Progress Indicator (Matching Booking Wizard Style) */}
            <div className="bg-slate-50/90 rounded-2xl p-1.5 border border-slate-200/90 shadow-2xs">
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { step: 1, title: "Details", subtitle: "விவரம்" },
                  { step: 2, title: `Items (${formItems.length})`, subtitle: "பொருட்கள்" },
                  { step: 3, title: "Review", subtitle: "சரிபார்ப்பு" },
                ].map((s) => {
                  const isCompleted = modalStep > s.step;
                  const isCurrent = modalStep === s.step;
                  return (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (s.step === 1) {
                          setModalStep(1);
                        } else if (s.step === 2) {
                          if (!formEnglishName.trim() && !formTamilName.trim()) {
                            setFormError("ஏதேனும் ஒரு பெயர் உள்ளிடவும் (English or Tamil Name is required)");
                            return;
                          }
                          setFormError("");
                          setModalStep(2);
                        } else if (s.step === 3) {
                          if (!formEnglishName.trim() && !formTamilName.trim()) {
                            setFormError("ஏதேனும் ஒரு பெயர் உள்ளிடவும் (English or Tamil Name is required)");
                            return;
                          }
                          setFormError("");
                          setModalStep(3);
                        }
                      }}
                      className={`flex flex-col items-center text-center py-2 px-1 rounded-xl transition active:scale-95 cursor-pointer ${
                        isCurrent
                          ? "bg-gradient-to-br from-[#0b2b17] via-[#123e24] to-[#0b2b17] text-white font-black shadow-sm ring-2 ring-emerald-600/40 scale-[1.01]"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-950 border border-emerald-300 font-bold hover:bg-emerald-100/80"
                          : "bg-white text-slate-400 border border-slate-200/70 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-1 text-xs font-black">
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        ) : (
                          <span className={isCurrent ? "text-amber-300" : ""}>{s.step}.</span>
                        )}
                        <span>{s.title}</span>
                      </div>
                      <div
                        className={`text-[9.5px] sm:text-[10px] mt-0.5 font-semibold truncate ${
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

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5 animate-in fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePooja} className="space-y-4">
              {/* ============================================================= */}
              {/* STEP 1: DETAILS & DAKSHINA (பெயர் & கட்டணம்)                  */}
              {/* ============================================================= */}
              {modalStep === 1 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Popular Pooja Presets */}
                  <div className="bg-gradient-to-r from-amber-50/70 via-slate-50 to-amber-50/70 p-3 rounded-2xl border border-amber-200/60 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>குயிக் டெம்ப்ளேட்கள் (Quick Templates):</span>
                      </span>
                      {selectedPresetName && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPresetName("");
                            setFormEnglishName("");
                            setFormTamilName("");
                            setFormDescription("");
                            setFormBasePrice("");
                            setFormItems([]);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-[10px] font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                          title="தேர்வை நீக்கு"
                        >
                          <X className="w-3 h-3 text-rose-600" />
                          <span>தேர்வு நீக்கு</span>
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                      {PRESET_POOJA_TEMPLATES.map((tpl) => {
                        const isSelected = selectedPresetName === tpl.englishName;
                        return (
                          <button
                            key={tpl.englishName}
                            type="button"
                            onClick={() => applyPoojaPreset(tpl)}
                            className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer border shadow-2xs ${
                              isSelected
                                ? "bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-300 font-black"
                                : "bg-white hover:bg-amber-50 text-slate-800 border-slate-200 hover:border-amber-300"
                            }`}
                          >
                            <span className="text-sm">{tpl.icon}</span>
                            <span>{tpl.tamilName}</span>
                            <span className="text-[10px] text-amber-950 bg-amber-50 px-1 py-0.5 rounded font-bold border border-amber-200/60">
                              ₹{tpl.basePrice.toLocaleString()}
                            </span>
                            {isSelected && <Check className="w-3 h-3 text-amber-800" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Names: Either English or Tamil is sufficient */}
                  <div className="space-y-1">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          English Name (ஆங்கிலப் பெயர்)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Ganapathi Homam"
                          value={formEnglishName}
                          onChange={(e) => setFormEnglishName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Tamil Name (தமிழ்ப் பெயர்)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. கணபதி ஹோமம்"
                          value={formTamilName}
                          onChange={(e) => setFormTamilName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-800 font-medium">
                      💡 ஏதேனும் ஒரு பெயர் இருந்தால் போதும் (Either English or Tamil name is sufficient).
                    </p>
                  </div>

                  {/* Base Dakshina Fee */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Base Dakshina (அடிப்படை கட்டணம் ₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">₹</span>
                      <input
                        type="number"
                        min={0}
                        step={100}
                        placeholder="எ.கா: 5000"
                        value={formBasePrice}
                        onChange={(e) =>
                          setFormBasePrice(e.target.value === "" ? "" : Number(e.target.value))
                        }
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-7 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs"
                      />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[2000, 3500, 5000, 7500, 10000, 15000].map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormBasePrice(p)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border cursor-pointer ${
                            formBasePrice === p
                              ? "bg-slate-900 text-amber-300 border-slate-900 shadow-2xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          ₹{p.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Description / Significance (விளக்கம் / பலன்கள்)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Purpose, benefits, deities invoked..."
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:border-emerald-600 focus:bg-white transition shadow-2xs resize-none"
                    />
                  </div>

                  {/* Step 1 Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowFormModal(false)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95"
                    >
                      ரத்து (Cancel)
                    </button>
                    <button
                      type="button"
                      onClick={handleNextModalStep}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>அடுத்த படி: பொருட்கள் பட்டியல்</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 2: SAMAGRI CHECKLIST (பொருட்கள் பட்டியல்)                 */}
              {/* ============================================================= */}
              {modalStep === 2 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Header & Smart Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
                    <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <ListChecks className="w-4 h-4 text-emerald-700" />
                      <span>பூஜா பொருட்கள் பட்டியல் (Selected Items Checklist)</span>
                    </label>
                    <div className="flex items-center gap-1.5">
                      {formItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setFormItems([])}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 text-[10.5px] font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                          title="அனைத்து பொருட்களையும் நீக்கு"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                          <span>அனைத்தும் நீக்கு</span>
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-950 border border-emerald-300 text-[10.5px] font-extrabold shadow-2xs">
                        <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{formItems.length} பொருட்கள்</span>
                      </span>
                    </div>
                  </div>

                  {/* 1. SELECTED ITEMS LIST (முழு நீளக் காட்சி / Full-Length View) */}
                  <div className="bg-slate-50/90 border border-slate-200/90 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between px-1 text-[11px] font-bold text-slate-700">
                      <span>தேர்ந்தெடுக்கப்பட்ட பொருட்கள் ({formItems.length})</span>
                      <span className="text-[10px] text-slate-500 font-medium">அளவு & அலகுகளை மாற்றிக்கொள்ளலாம்</span>
                    </div>

                    {formItems.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-500 space-y-1.5 bg-white rounded-xl border border-dashed border-slate-200">
                        <p className="font-bold text-slate-700">📦 பொருட்கள் எதுவும் இன்னும் சேர்க்கப்படவில்லை.</p>
                        <p className="text-[11px] text-slate-500">
                          கீழேயுள்ள &apos;பொருட்கள் செக்லிஸ்ட்&apos; அல்லது &apos;தனிப்பொருள் சேர்க்க&apos; பட்டனைத் தட்டி தேவையான பொருட்களைச் சேர்க்கலாம்.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-80 overflow-y-auto pr-0.5">
                        {formItems.map((it, idx) => {
                          const catInfo = categories.find((c) => c.id === it.category);
                          return (
                            <div
                              key={it.id}
                              className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-400 flex items-center justify-between gap-2 transition shadow-2xs"
                            >
                              {/* Item Index & Names */}
                              <div className="min-w-0 flex-1 flex items-center gap-2">
                                <span className="text-xs font-black text-emerald-800 bg-emerald-50 border border-emerald-200 w-6 h-6 rounded-lg flex items-center justify-center shrink-0">
                                  #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-xs text-slate-900 leading-tight truncate">
                                    {it.itemTamilName || it.itemEnglishName}
                                  </div>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    {it.itemEnglishName && it.itemEnglishName !== it.itemTamilName && (
                                      <span className="text-[10px] text-slate-500 font-medium truncate">
                                        {it.itemEnglishName}
                                      </span>
                                    )}
                                    {catInfo && (
                                      <span className="text-[9px] font-bold text-amber-900 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/70 inline-flex items-center gap-1 shrink-0">
                                        <span>{catInfo.icon}</span>
                                        <span>{catInfo.labelTa}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Stepper + Unit Selector + Delete */}
                              <div className="flex items-center gap-1.5 shrink-0">
                                {/* Compact Stepper */}
                                <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const step = it.unit === "g" || it.unit === "ml" ? 50 : 1;
                                      setFormItems(
                                        formItems.map((item) =>
                                          item.id === it.id
                                            ? { ...item, quantity: Math.max(1, (Number(item.quantity) || 1) - step) }
                                            : item
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition active:scale-95 text-xs cursor-pointer"
                                    title="Decrease quantity"
                                  >
                                    -
                                  </button>
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => {
                                      const val = Math.max(1, Number(e.target.value) || 1);
                                      setFormItems(
                                        formItems.map((item) =>
                                          item.id === it.id ? { ...item, quantity: val } : item
                                        )
                                      );
                                    }}
                                    className="w-9 text-center font-bold text-slate-900 text-xs bg-transparent focus:outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const step = it.unit === "g" || it.unit === "ml" ? 50 : 1;
                                      setFormItems(
                                        formItems.map((item) =>
                                          item.id === it.id
                                            ? { ...item, quantity: (Number(item.quantity) || 1) + step }
                                            : item
                                        )
                                      );
                                    }}
                                    className="w-5 h-5 rounded-md bg-white hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center transition active:scale-95 text-xs cursor-pointer"
                                    title="Increase quantity"
                                  >
                                    +
                                  </button>
                                </div>

                                {/* Direct Unit Dropdown Badge */}
                                <select
                                  value={it.unit}
                                  onChange={(e) => {
                                    const nextUnit = e.target.value as PoojaItemTemplate["unit"];
                                    setFormItems(
                                      formItems.map((item) =>
                                        item.id === it.id ? { ...item, unit: nextUnit } : item
                                      )
                                    );
                                  }}
                                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 px-1.5 py-1 rounded-lg text-[10px] font-bold focus:outline-none cursor-pointer transition"
                                  title="Change unit"
                                >
                                  {SAMAGRI_UNITS.map((u) => (
                                    <option key={u.unit} value={u.unit}>
                                      {u.code}
                                    </option>
                                  ))}
                                </select>

                                {/* Remove button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItemFromForm(it.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition active:scale-95 cursor-pointer"
                                  title="Remove item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 2. ON-DEMAND ADD ACTION BUTTONS (தேவைப்படும் போது மட்டும் திறக்கும்) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowChecklistDrawer(!showChecklistDrawer);
                        if (!showChecklistDrawer) setShowCustomItemForm(false);
                      }}
                      className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-between border cursor-pointer active:scale-98 shadow-2xs ${
                        showChecklistDrawer
                          ? "bg-emerald-800 text-amber-200 border-emerald-900 ring-2 ring-emerald-600/30"
                          : "bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>பொருட்கள் செக்லிஸ்ட் (Browse Checklist)</span>
                      </div>
                      {showChecklistDrawer ? (
                        <ChevronUp className="w-4 h-4 text-amber-200" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-emerald-700" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomItemForm(!showCustomItemForm);
                        if (!showCustomItemForm) setShowChecklistDrawer(false);
                      }}
                      className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold transition flex items-center justify-between border cursor-pointer active:scale-98 shadow-2xs ${
                        showCustomItemForm
                          ? "bg-slate-900 text-white border-slate-950 ring-2 ring-slate-700/30"
                          : "bg-slate-100/90 hover:bg-slate-200 text-slate-800 border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>தனிப்பொருள் சேர்க்க (Add Custom Item)</span>
                      </div>
                      {showCustomItemForm ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* 3. CHECKLIST DRAWER (ON-DEMAND) */}
                  {showChecklistDrawer && (
                    <div className="bg-white p-3 rounded-2xl border-2 border-emerald-300/80 shadow-md space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          <span>பொருட்கள் செக்லிஸ்ட் (1-கிளிக் சேர்க்கை)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowChecklistDrawer(false)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-lg transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>மடிக்க</span>
                        </button>
                      </div>

                      {/* Search Bar for Samagri */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          placeholder="பொருளைத் தேடுக... (மஞ்சள், நெய், coconut, honey)..."
                          value={samagriSearchQuery}
                          onChange={(e) => setSamagriSearchQuery(e.target.value)}
                          className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white transition"
                        />
                        {samagriSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setSamagriSearchQuery("")}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Category Filter Tabs with Manage Categories Button */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                        <button
                          type="button"
                          onClick={() => setSelectedSamagriCategory("all")}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 border cursor-pointer ${
                            selectedSamagriCategory === "all"
                              ? "bg-emerald-800 text-amber-200 border-emerald-800 shadow-xs"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                          }`}
                        >
                          <span>✨</span>
                          <span>அனைத்தும்</span>
                        </button>

                        {categories.map((cat) => {
                          const isSelected = selectedSamagriCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedSamagriCategory(cat.id)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 border cursor-pointer ${
                                isSelected
                                  ? "bg-emerald-800 text-amber-200 border-emerald-800 shadow-xs"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.labelTa}</span>
                            </button>
                          );
                        })}

                        {/* Quick Category Manager Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setShowCategoryModal(true)}
                          className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition shadow-2xs"
                          title="வகைகள் மேலாண்மை (Manage Categories)"
                        >
                          <Settings className="w-3 h-3 text-amber-700" />
                          <span>வகைகள்</span>
                        </button>
                      </div>

                      {/* Full Checklist Items with Checkbox Toggle */}
                      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                        {SAMAGRI_CATALOG.filter((item) => {
                          const matchesCategory =
                            selectedSamagriCategory === "all" || item.category === selectedSamagriCategory;
                          const q = samagriSearchQuery.toLowerCase().trim();
                          const matchesSearch =
                            !q ||
                            item.ta.toLowerCase().includes(q) ||
                            item.en.toLowerCase().includes(q);
                          return matchesCategory && matchesSearch;
                        }).map((sug) => {
                          const existingItem = formItems.find(
                            (it) => it.itemTamilName === sug.ta || it.itemEnglishName === sug.en
                          );
                          const isAdded = !!existingItem;

                          const toggleOrAddItem = () => {
                            if (isAdded) {
                              handleRemoveItemFromForm(existingItem.id);
                            } else {
                              const item: PoojaItemTemplate = {
                                id: `item-${Date.now()}-${formItems.length + 1}`,
                                poojaId: editingPoojaId || "",
                                itemEnglishName: sug.en,
                                itemTamilName: sug.ta,
                                quantity: sug.qty,
                                unit: sug.unit,
                                category: sug.category,
                                sortOrder: formItems.length + 1,
                              };
                              setFormItems([...formItems, item]);
                            }
                          };

                          const catInfo = categories.find((c) => c.id === sug.category);

                          return (
                            <div
                              key={sug.id}
                              className={`p-2 rounded-xl transition flex items-center justify-between gap-2 border select-none ${
                                isAdded
                                  ? "bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200/80 text-slate-900 shadow-2xs"
                                  : "bg-white hover:bg-slate-50 border-slate-200 text-slate-800"
                              }`}
                            >
                              {/* Checklist Toggle Box + Item Name */}
                              <div
                                onClick={toggleOrAddItem}
                                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                              >
                                {/* Checkbox Icon */}
                                <div
                                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition ${
                                    isAdded
                                      ? "bg-emerald-700 text-white shadow-2xs"
                                      : "border-2 border-slate-300 bg-white hover:border-emerald-600"
                                  }`}
                                >
                                  {isAdded && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                </div>

                                <span className="text-base shrink-0">
                                  {catInfo?.icon || "✨"}
                                </span>

                                <div className="min-w-0">
                                  <div
                                    className={`text-xs font-extrabold truncate ${
                                      isAdded ? "text-emerald-950 font-black" : "text-slate-900"
                                    }`}
                                  >
                                    {sug.ta}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium truncate">
                                    {sug.en}
                                  </div>
                                </div>
                              </div>

                              {/* Standard Default Qty Badge */}
                              <span className="text-[10px] font-bold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200 shrink-0">
                                {sug.qty} {sug.unit}
                              </span>

                              {/* Right Action: Added Status with Stepper OR + சேர் Button */}
                              <div className="shrink-0 flex items-center gap-1">
                                {isAdded ? (
                                  <div className="flex items-center gap-1">
                                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-lg border border-emerald-300">
                                      {existingItem.quantity} {existingItem.unit}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const step = sug.unit === "g" || sug.unit === "ml" ? 50 : 1;
                                        setFormItems(
                                          formItems.map((it) =>
                                            it.id === existingItem.id
                                              ? { ...it, quantity: (Number(it.quantity) || 1) + step }
                                              : it
                                          )
                                        );
                                      }}
                                      className="w-6 h-6 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center justify-center transition active:scale-95 cursor-pointer shadow-2xs"
                                      title="Add more"
                                    >
                                      +
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={toggleOrAddItem}
                                    className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5 text-amber-300" />
                                    <span>சேர்</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4. CUSTOM ITEM FORM (ON-DEMAND) */}
                  {showCustomItemForm && (
                    <div className="bg-slate-50 p-3.5 rounded-2xl border-2 border-slate-300 space-y-2.5 shadow-md animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="flex items-center justify-between">
                        <div className="text-[11px] font-bold text-slate-800 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>பட்டியலில் இல்லாத தனிப்பொருள் சேர்க்க (Add Custom Item)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowCustomItemForm(false)}
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 bg-white hover:bg-slate-200 px-2 py-0.5 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>மடிக்க</span>
                        </button>
                      </div>

                      {/* Category Selection Row */}
                      <div>
                        <div className="flex items-center justify-between mb-0.5">
                          <label className="text-[10px] font-bold text-slate-600 block">
                            பொருளின் வகை (Category):
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowCategoryModal(true)}
                            className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Settings className="w-3 h-3 text-emerald-700" />
                            <span>வகைகள் மேலாண்மை</span>
                          </button>
                        </div>
                        <select
                          value={newItemCategory}
                          onChange={(e) => setNewItemCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600 cursor-pointer shadow-2xs"
                        >
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.icon} {cat.labelTa} ({cat.labelEn})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            பொருள் பெயர் (தமிழ்)
                          </label>
                          <input
                            type="text"
                            placeholder="எ.கா. பஞ்சபாத்திரம்"
                            value={newItemTamil}
                            onChange={(e) => setNewItemTamil(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                            Item Name (English)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Pancha Patram"
                            value={newItemEnglish}
                            onChange={(e) => setNewItemEnglish(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <p className="text-[9.5px] text-emerald-800 font-medium">
                        (தமிழ் அல்லது ஆங்கிலம் — ஏதேனும் ஒரு பெயர் போதுமானது)
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-24">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">அளவு (Qty)</label>
                          <input
                            type="number"
                            min={1}
                            placeholder="Qty"
                            value={newItemQty}
                            onChange={(e) => setNewItemQty(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600 text-center"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <label className="text-[10px] font-bold text-slate-600 block mb-0.5">அலகு / Unit</label>
                          <select
                            value={newItemUnit}
                            onChange={(e) => setNewItemUnit(e.target.value as PoojaItemTemplate["unit"])}
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:border-emerald-600"
                          >
                            {SAMAGRI_UNITS.map((u) => (
                              <option key={u.unit} value={u.unit}>
                                {u.labelTa} ({u.code})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="pt-3.5">
                          <button
                            type="button"
                            id="add-custom-item-submit-btn"
                            onClick={() => {
                              const eng = newItemEnglish.trim() || newItemTamil.trim();
                              const tam = newItemTamil.trim() || newItemEnglish.trim();
                              if (!eng && !tam) return;
                              const item: PoojaItemTemplate = {
                                id: `item-${Date.now()}-${formItems.length + 1}`,
                                poojaId: editingPoojaId || "",
                                itemEnglishName: eng,
                                itemTamilName: tam,
                                quantity: Number(newItemQty) || 1,
                                unit: newItemUnit,
                                category: newItemCategory,
                                sortOrder: formItems.length + 1,
                              };
                              setFormItems([...formItems, item]);
                              setNewItemEnglish("");
                              setNewItemTamil("");
                              setNewItemQty(1);
                            }}
                            className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl transition shrink-0 shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 text-amber-300" />
                            <span>சேர்</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2 Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrevModalStep}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>முந்தைய படி</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextModalStep}
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span>அடுத்த படி: முழு சரிபார்ப்பு</span>
                      <ArrowRight className="w-4 h-4 text-amber-300" />
                    </button>
                  </div>
                </div>
              )}

              {/* ============================================================= */}
              {/* STEP 3: REVIEW & CONFIRM (முழு சரிபார்ப்பு & உறுதிப்படுத்தல்)   */}
              {/* ============================================================= */}
              {modalStep === 3 && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Banner */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-3.5 rounded-2xl text-white shadow-sm flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 text-amber-300 text-xs font-extrabold">
                        <Eye className="w-4 h-4" />
                        <span>படி 3: இறுதி சரிபார்ப்பு (Final Verification)</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        அனைத்து விவரங்களையும் சரிபார்த்து உறுதிப்படுத்தவும்
                      </p>
                    </div>
                    <span className="text-xs bg-amber-400/20 border border-amber-300/40 text-amber-200 px-2.5 py-1 rounded-xl font-bold">
                      தயார்
                    </span>
                  </div>

                  {/* Summary Card */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-3 shadow-2xs">
                    {/* Names and Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/80">
                      <div>
                        <div className="text-base font-black text-slate-900">
                          {formTamilName || formEnglishName || "பூஜை பெயர் இல்லை"}
                        </div>
                        {formEnglishName && formEnglishName !== formTamilName && (
                          <div className="text-xs font-semibold text-slate-500">
                            {formEnglishName}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1 shadow-2xs">
                          <IndianRupee className="w-3.5 h-3.5" />
                          <span>{Number(formBasePrice || 0).toLocaleString()}</span>
                        </span>
                      </div>
                    </div>

                    {/* Description preview */}
                    {formDescription ? (
                      <div className="text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/70">
                        <span className="font-bold text-slate-900 block mb-0.5">விளக்கம் / பலன்கள்:</span>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{formDescription}</p>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">விளக்கம் எதுவும் உள்ளிடப்படவில்லை.</p>
                    )}

                    {/* Items Checklist Summary */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                          <span>பூஜா பொருட்கள் பட்டியல் ({formItems.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalStep(2)}
                          className="text-[11px] font-bold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer"
                        >
                          மாற்றியமைக்க (Edit)
                        </button>
                      </div>

                      {formItems.length === 0 ? (
                        <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-xs text-amber-900">
                          ⚠️ பொருட்கள் எதுவும் சேர்க்கப்படவில்லை. தேவைப்பட்டால் படி 2 சென்று பொருட்களைச் சேர்க்கலாம்.
                        </div>
                      ) : (
                        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 max-h-48 overflow-y-auto shadow-2xs">
                          {formItems.map((item, idx) => (
                            <div key={item.id} className="p-2 px-3 flex items-center justify-between text-xs hover:bg-slate-50">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="w-4 text-center font-bold text-slate-400 text-[10px]">
                                  #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-xs">
                                    {item.itemTamilName || item.itemEnglishName}
                                  </p>
                                  {item.itemEnglishName && item.itemEnglishName !== item.itemTamilName && (
                                    <p className="text-[10px] text-slate-400 truncate font-medium">
                                      {item.itemEnglishName}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className="shrink-0 bg-slate-100 text-slate-800 font-extrabold px-2 py-0.5 rounded-md border border-slate-200 text-[11px]">
                                {item.quantity} {item.unit}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Friendly Confirmation Advice */}
                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <p className="text-[11px] leading-tight">
                      அனைத்து விவரங்களும் சரியாக உள்ளதா என சரிபார்த்து கீழே உள்ள{" "}
                      <strong>&apos;{isEditing ? "மாற்றங்களைச் சேமி" : "பூஜையை உருவாக்கு"}&apos;</strong> பட்டனைத் தட்டவும்.
                    </p>
                  </div>

                  {/* Step 3 Actions */}
                  <div className="flex gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handlePrevModalStep}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>முந்தைய படி</span>
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-2xl text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4 text-amber-300" />
                      <span>{isEditing ? "Save Changes (சேமி)" : "Create Pooja (உருவாக்கு)"}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingPooja && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-red-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-velvi-brownDark">
                  Delete Pooja Service?
                </h3>
                <p className="text-xs text-velvi-brown/60">
                  Are you sure you want to remove &ldquo;{deletingPooja.englishName}&rdquo;?
                </p>
              </div>
            </div>

            <p className="text-xs text-velvi-brown/80 bg-red-50/50 p-2.5 rounded-xl border border-red-100">
              This ceremony and its required item templates will be removed from your active catalogue.
            </p>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDeletingPooja(null)}
                className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Samagri Categories Manager Modal */}
      <CategoryManagerModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        onCategoriesChanged={handleCategoriesChanged}
      />
    </div>
  );
}

export default function PoojasCataloguePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">ஏற்றுகிறது (Loading)...</div>}>
      <PoojasCatalogueContent />
    </Suspense>
  );
}

