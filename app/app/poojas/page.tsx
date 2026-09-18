"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useLanguage } from "@/components/providers/LanguageContext";
import { db } from "@/lib/db/store";
import { Pooja, PoojaItemTemplate } from "@/lib/types";
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
} from "lucide-react";
import Link from "next/link";

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
  category: "essentials" | "ghee_oils" | "homam" | "powders" | "flowers" | "vastram";
  ta: string;
  en: string;
  qty: number;
  unit: PoojaItemTemplate["unit"];
}

const SAMAGRI_CATEGORIES = [
  { id: "all", labelTa: "அனைத்தும்", labelEn: "All", icon: "✨" },
  { id: "essentials", labelTa: "அடிப்படை & பழங்கள்", labelEn: "Basics & Fruits", icon: "🥥" },
  { id: "ghee_oils", labelTa: "நெய் & எண்ணெய்கள்", labelEn: "Ghee & Oils", icon: "🪔" },
  { id: "homam", labelTa: "சமித்து & ஹோம திரவியம்", labelEn: "Homam Samagri", icon: "🪵" },
  { id: "powders", labelTa: "பொடிகள் & நறுமணம்", labelEn: "Powders & Fragrance", icon: "🌿" },
  { id: "flowers", labelTa: "பூக்கள் & இலைகள்", labelEn: "Flowers & Leaves", icon: "🌺" },
  { id: "vastram", labelTa: "வஸ்திரம் & செட்", labelEn: "Vastram & Sets", icon: "🪙" },
] as const;

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
    icon: "🏠",
    englishName: "Gruhapravesam & Vastu Homam",
    tamilName: "கிரகப்பிரவேசம் & வாஸ்து ஹோமம்",
    description: "Traditional house-warming ritual invoking Vastu Purusha, Ganapathi & Lakshmi.",
    durationMinutes: 240,
    basePrice: 12000,
    items: [
      { itemEnglishName: "Turmeric Powder", itemTamilName: "மஞ்சள் தூள்", quantity: 500, unit: "g" as const },
      { itemEnglishName: "Kumkum", itemTamilName: "குங்குமம்", quantity: 250, unit: "g" as const },
      { itemEnglishName: "Coconuts", itemTamilName: "தேங்காய்", quantity: 11, unit: "nos" as const },
      { itemEnglishName: "Raw Rice", itemTamilName: "பச்சரிசி", quantity: 5, unit: "kg" as const },
      { itemEnglishName: "Pure Cow Ghee", itemTamilName: "தூய பசு நெய்", quantity: 1500, unit: "ml" as const },
      { itemEnglishName: "Navadhanyam", itemTamilName: "நவதானியம்", quantity: 1, unit: "set" as const },
      { itemEnglishName: "Mango Leaves", itemTamilName: "மாவிலை", quantity: 3, unit: "bundle" as const },
      { itemEnglishName: "Betel Leaves & Nut", itemTamilName: "வெற்றிலை பாக்கு", quantity: 5, unit: "bundle" as const },
      { itemEnglishName: "Milk for Boiling", itemTamilName: "பால் காய்ச்ச பசும்பால்", quantity: 2, unit: "litre" as const },
      { itemEnglishName: "Banana Fruits", itemTamilName: "வாழைப்பழம்", quantity: 2, unit: "dozen" as const },
      { itemEnglishName: "Camphor", itemTamilName: "கற்பூரம்", quantity: 5, unit: "packet" as const },
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

export default function PoojasCataloguePage() {
  const { currentBusiness } = useAuth();
  const { t } = useLanguage();
  const businessId = currentBusiness?.id || "biz-venkateswara-01";

  const [poojas, setPoojas] = useState<Pooja[]>(db.getPoojas(businessId));
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPooja, setSelectedPooja] = useState<Pooja | null>(null);

  // Modal states
  const [showFormModal, setShowFormModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPoojaId, setEditingPoojaId] = useState<string | null>(null);

  // Form states
  const [formEnglishName, setFormEnglishName] = useState("");
  const [formTamilName, setFormTamilName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState<number>(120);
  const [formBasePrice, setFormBasePrice] = useState<number>(5000);
  const [formItems, setFormItems] = useState<PoojaItemTemplate[]>([]);
  const [formError, setFormError] = useState("");

  // New item inline input states
  const [newItemEnglish, setNewItemEnglish] = useState("");
  const [newItemTamil, setNewItemTamil] = useState("");
  const [newItemQty, setNewItemQty] = useState<number>(1);
  const [newItemUnit, setNewItemUnit] = useState<PoojaItemTemplate["unit"]>("nos");

  // Fast Samagri Library Picker States
  const [samagriSearchQuery, setSamagriSearchQuery] = useState("");
  const [selectedSamagriCategory, setSelectedSamagriCategory] = useState<string>("all");

  // Delete modal state
  const [deletingPooja, setDeletingPooja] = useState<Pooja | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const filteredPoojas = poojas.filter(
    (p) =>
      p.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tamilName && p.tamilName.includes(searchQuery)) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const applyPoojaPreset = (preset: (typeof PRESET_POOJA_TEMPLATES)[0]) => {
    setFormEnglishName(preset.englishName);
    setFormTamilName(preset.tamilName);
    setFormDescription(preset.description);
    setFormDuration(preset.durationMinutes);
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
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setEditingPoojaId(null);
    const defaultPreset = PRESET_POOJA_TEMPLATES[0];
    setFormEnglishName(defaultPreset.englishName);
    setFormTamilName(defaultPreset.tamilName);
    setFormDescription(defaultPreset.description);
    setFormDuration(defaultPreset.durationMinutes);
    setFormBasePrice(defaultPreset.basePrice);
    setFormItems(
      defaultPreset.items.map((item, idx) => ({
        id: `item-${Date.now()}-${idx + 1}`,
        poojaId: "",
        itemEnglishName: item.itemEnglishName,
        itemTamilName: item.itemTamilName,
        quantity: item.quantity,
        unit: item.unit,
        sortOrder: idx + 1,
      }))
    );
    setFormError("");
    setNewItemEnglish("");
    setNewItemTamil("");
    setNewItemQty(1);
    setNewItemUnit("nos");
    setSamagriSearchQuery("");
    setSelectedSamagriCategory("all");
    setShowFormModal(true);
  };

  const openEditModal = (p: Pooja) => {
    setIsEditing(true);
    setEditingPoojaId(p.id);
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
    setSamagriSearchQuery("");
    setSelectedSamagriCategory("all");
    setShowFormModal(true);
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
            {filteredPoojas.length} Vedic ceremonies & item templates
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openCreateModal}
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm hover:shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[3]" />
            <span>Add Pooja</span>
          </button>
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

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-500 font-medium mt-1">
                    <span className="text-slate-600 font-semibold">{p.items?.length || 0} items checklist</span>
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
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
                    title="Edit Pooja"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingPooja(p)}
                    className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
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

      {/* Selected Pooja Details Drawer */}
      {selectedPooja && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-3xl p-4 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl border-t border-velvi-gold animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-velvi-brownDark">
                  {selectedPooja.englishName}
                </h3>
                {selectedPooja.tamilName && (
                  <p className="text-xs font-semibold text-velvi-goldDark">
                    {selectedPooja.tamilName}
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedPooja(null)}
                className="text-xs text-velvi-brown/60 hover:text-velvi-brown p-1 rounded-full hover:bg-velvi-cream"
              >
                ✕ Close
              </button>
            </div>

            {selectedPooja.description && (
              <p className="text-xs text-velvi-brown/80 leading-relaxed bg-velvi-cream/20 p-3 rounded-xl border border-velvi-gold/15">
                {selectedPooja.description}
              </p>
            )}

            <div className="bg-velvi-cream/40 p-3 rounded-2xl border border-velvi-gold/20 flex justify-between text-xs">
              <div>
                <span className="text-velvi-brown/60 block">Base Dakshina</span>
                <span className="font-extrabold text-velvi-brownDark text-sm">
                  ₹{selectedPooja.basePrice.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right">
                <span className="text-velvi-brown/60 block">Checklist Items</span>
                <span className="font-bold text-velvi-brownDark text-sm">
                  {selectedPooja.items?.length || 0} Materials
                </span>
              </div>
            </div>

            {/* Standard Required Items Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-velvi-brown/80 uppercase tracking-wide flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-velvi-gold" />
                  <span>Required Items Checklist ({selectedPooja.items?.length || 0})</span>
                </h4>
              </div>

              {(!selectedPooja.items || selectedPooja.items.length === 0) ? (
                <div className="p-4 text-center text-xs text-velvi-brown/60 bg-velvi-cream/20 rounded-xl border border-dashed border-velvi-gold/30">
                  No default items listed for this pooja.
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-velvi-gold/20 divide-y divide-velvi-creamDark max-h-48 overflow-y-auto">
                  {selectedPooja.items?.map((it, idx) => (
                    <div key={it.id} className="p-2.5 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-velvi-brownDark font-bold text-xs leading-tight flex items-center gap-1.5">
                          <span className="text-velvi-maroon text-[11px] font-black">{idx + 1}.</span>
                          <span>{it.itemTamilName || it.itemEnglishName}</span>
                        </div>
                        {it.itemEnglishName && it.itemEnglishName !== it.itemTamilName && (
                          <div className="text-[10px] text-velvi-brown/65 font-medium pl-4 mt-0.5 truncate">
                            {it.itemEnglishName}
                          </div>
                        )}
                      </div>
                      <span className="font-bold text-velvi-brown bg-velvi-cream px-2 py-0.5 rounded text-[11px] shrink-0 border border-velvi-gold/20">
                        {it.quantity} {getUnitBadgeLabel(it.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Row */}
            <div className="space-y-2 pt-2">
              <Link
                href={`/app/bookings/new?poojaId=${selectedPooja.id}`}
                className="block w-full py-3 bg-velvi-brown text-white text-center font-bold text-xs rounded-xl shadow-sm hover:bg-velvi-brownLight transition active:scale-[0.99]"
              >
                Book this Homam
              </Link>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    openEditModal(selectedPooja);
                  }}
                  className="py-2.5 bg-velvi-gold/15 hover:bg-velvi-gold/25 text-velvi-brown font-bold text-xs rounded-xl border border-velvi-gold/30 flex items-center justify-center gap-1.5 transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Details</span>
                </button>

                <button
                  onClick={() => {
                    setDeletingPooja(selectedPooja);
                  }}
                  className="py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Pooja</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Pooja Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-4 sm:p-5 max-w-md sm:max-w-xl md:max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl border border-velvi-gold/30 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-velvi-gold/20 text-velvi-brownDark flex items-center justify-center font-bold text-sm">
                  <Flame className="w-4 h-4 text-velvi-gold" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-velvi-brownDark leading-tight">
                    {isEditing ? "Edit Pooja / Homam" : "Create New Pooja / Homam"}
                  </h3>
                  <p className="text-[10px] text-velvi-brown/60">
                    Define Dakshina, duration, and required items template
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="p-1 hover:bg-velvi-cream rounded-full text-velvi-brown/60 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSavePooja} className="space-y-3.5">
              {/* 1-Tap Popular Pooja Presets */}
              <div className="bg-gradient-to-r from-amber-50/80 via-velvi-cream/70 to-amber-50/80 p-3 rounded-2xl border border-velvi-gold/35 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                    <span>பிரபலமான பூஜை டெம்ப்ளேட்கள் (1-Tap Fast Fill)</span>
                  </span>
                  <span className="text-[10px] text-velvi-maroon font-bold bg-white px-2 py-0.5 rounded-full border border-velvi-gold/20">
                    1-கிளிக் தேர்வு
                  </span>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                  {PRESET_POOJA_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.englishName}
                      type="button"
                      onClick={() => applyPoojaPreset(tpl)}
                      className="shrink-0 bg-white hover:bg-amber-100/70 border border-velvi-gold/30 hover:border-velvi-gold rounded-xl px-2.5 py-1.5 text-xs font-bold text-velvi-brownDark flex items-center gap-1.5 shadow-2xs transition active:scale-95"
                    >
                      <span className="text-sm">{tpl.icon}</span>
                      <span>{tpl.tamilName}</span>
                      <span className="text-[10px] text-velvi-maroon bg-amber-50 px-1 py-0.5 rounded font-bold">
                        ₹{tpl.basePrice.toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Names: Either English or Tamil is sufficient */}
              <div className="space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-velvi-brown block mb-1">
                      English Name (ஆங்கிலப் பெயர்)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ganapathi Homam"
                      value={formEnglishName}
                      onChange={(e) => setFormEnglishName(e.target.value)}
                      className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-velvi-brown block mb-1">
                      Tamil Name (தமிழ்ப் பெயர்)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. கணபதி ஹோமம்"
                      value={formTamilName}
                      onChange={(e) => setFormTamilName(e.target.value)}
                      className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800/80 font-medium">
                  💡 ஏதேனும் ஒரு பெயர் இருந்தால் போதும் (Either English or Tamil name is sufficient).
                </p>
              </div>

              {/* Price with Quick Chips */}
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Base Dakshina (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step={100}
                  placeholder="5000"
                  value={formBasePrice}
                  onChange={(e) => setFormBasePrice(Number(e.target.value))}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-bold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[3000, 4500, 5000, 7500, 10000, 12000].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setFormBasePrice(p)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition border ${
                        formBasePrice === p
                          ? "bg-velvi-brown text-amber-200 border-velvi-brown"
                          : "bg-velvi-cream/60 hover:bg-velvi-cream text-velvi-brownDark border-velvi-gold/20"
                      }`}
                    >
                      ₹{p.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-velvi-brown block mb-1">
                  Description / Significance
                </label>
                <textarea
                  rows={2}
                  placeholder="Purpose, benefits, deities invoked..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl px-3 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                />
              </div>

              {/* Items Checklist Template Manager (Pooja Samagri) */}
              <div className="space-y-3 pt-2 border-t border-velvi-gold/20">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-velvi-brownDark flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-velvi-gold" />
                    <span>பூஜா பொருட்கள் செக்லிஸ்ட் / Samagri Items</span>
                  </label>
                  <span className="text-[11px] font-bold text-velvi-maroon bg-velvi-cream/80 px-2.5 py-0.5 rounded-full border border-velvi-gold/30 shadow-2xs">
                    {formItems.length} பொருட்கள் சேர்க்கப்பட்டுள்ளன
                  </span>
                </div>

                {/* Selected Items List with Stepper, Inline Unit Changer & Tamil-on-top English-underneath */}
                <div className="bg-velvi-cream/25 border border-velvi-gold/30 rounded-2xl p-2.5 divide-y divide-velvi-gold/15 max-h-56 overflow-y-auto space-y-1.5 shadow-2xs">
                  {formItems.length === 0 ? (
                    <div className="py-6 text-center text-xs text-velvi-brown/60 space-y-1">
                      <p className="font-semibold">பொருட்கள் எதுவும் இன்னும் சேர்க்கப்படவில்லை.</p>
                      <p className="text-[11px]">கீழே உள்ள பொருட்கள் நூலகத்திலிருந்து (Catalog) 1-கிளிக்கில் சேர்க்கலாம்.</p>
                    </div>
                  ) : (
                    formItems.map((it, idx) => (
                      <div key={it.id} className="pt-2 first:pt-0 flex items-center justify-between gap-2 text-xs">
                        {/* Item Name: Tamil on top, English underneath */}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-velvi-brownDark text-xs leading-tight flex items-center gap-1.5">
                            <span className="text-velvi-maroon text-[11px] font-black shrink-0">{idx + 1}.</span>
                            <span className="truncate">{it.itemTamilName || it.itemEnglishName}</span>
                          </div>
                          {it.itemEnglishName && it.itemEnglishName !== it.itemTamilName && (
                            <div className="text-[10px] text-velvi-brown/70 font-medium pl-4 mt-0.5 truncate">
                              {it.itemEnglishName}
                            </div>
                          )}
                        </div>

                        {/* Quantity Stepper & Inline Unit Changer */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Stepper */}
                          <div className="flex items-center bg-white border border-velvi-gold/30 rounded-xl p-0.5 shadow-2xs">
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
                              className="w-5 h-5 rounded-lg bg-velvi-cream/60 hover:bg-velvi-gold/20 text-velvi-brownDark font-black flex items-center justify-center transition active:scale-95 text-[11px]"
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
                              className="w-10 text-center font-bold text-velvi-brownDark text-xs bg-transparent focus:outline-none"
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
                              className="w-5 h-5 rounded-lg bg-velvi-cream/60 hover:bg-velvi-gold/20 text-velvi-brownDark font-black flex items-center justify-center transition active:scale-95 text-[11px]"
                              title="Increase quantity"
                            >
                              +
                            </button>
                          </div>

                          {/* Direct Inline Unit Dropdown Selector */}
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
                            className="bg-amber-50 hover:bg-amber-100 text-velvi-brownDark border border-velvi-gold/40 px-2 py-1 rounded-xl text-[10.5px] font-bold focus:outline-none focus:border-velvi-gold cursor-pointer transition shadow-2xs"
                            title="Change unit"
                          >
                            {SAMAGRI_UNITS.map((u) => (
                              <option key={u.unit} value={u.unit}>
                                {u.labelTa} ({u.code})
                              </option>
                            ))}
                          </select>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromForm(it.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition active:scale-95"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Fast Searchable Samagri Library (1-Click Picker) */}
                <div className="bg-white p-3 rounded-2xl border border-velvi-gold/30 shadow-xs space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>பொருட்கள் நூலகம் (1-கிளிக் தேர்வு / Quick Pick Catalog)</span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-medium">
                      கிளிக் செய்து சேர்க்கவும்
                    </span>
                  </div>

                  {/* Search Bar for Samagri */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="தேடுக (எ.கா: மஞ்சள், ghee, தேங்காய், மாலை, rice)..."
                      value={samagriSearchQuery}
                      onChange={(e) => setSamagriSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1.5 bg-velvi-cream/30 border border-velvi-gold/20 rounded-xl text-xs font-semibold text-velvi-brownDark placeholder:text-gray-400 focus:outline-none focus:border-velvi-gold"
                    />
                    {samagriSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setSamagriSearchQuery("")}
                        className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Category Filter Tabs */}
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                    {SAMAGRI_CATEGORIES.map((cat) => {
                      const isSelected = selectedSamagriCategory === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedSamagriCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold shrink-0 transition flex items-center gap-1 border ${
                            isSelected
                              ? "bg-velvi-brown text-amber-200 border-velvi-brown shadow-xs"
                              : "bg-velvi-cream/50 hover:bg-velvi-cream text-velvi-brownDark border-velvi-gold/20"
                          }`}
                        >
                          <span>{cat.icon}</span>
                          <span>{cat.labelTa}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Samagri Item Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
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

                      return (
                        <button
                          key={sug.id}
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              // Increase quantity if clicked again
                              const step = sug.unit === "g" || sug.unit === "ml" ? 50 : 1;
                              setFormItems(
                                formItems.map((it) =>
                                  it.id === existingItem.id
                                    ? { ...it, quantity: (Number(it.quantity) || 1) + step }
                                    : it
                                )
                              );
                            } else {
                              const item: PoojaItemTemplate = {
                                id: `item-${Date.now()}-${formItems.length + 1}`,
                                poojaId: editingPoojaId || "",
                                itemEnglishName: sug.en,
                                itemTamilName: sug.ta,
                                quantity: sug.qty,
                                unit: sug.unit,
                                sortOrder: formItems.length + 1,
                              };
                              setFormItems([...formItems, item]);
                            }
                          }}
                          className={`p-2 rounded-xl text-left transition flex flex-col justify-between border relative group active:scale-[0.98] ${
                            isAdded
                              ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 shadow-2xs"
                              : "bg-amber-50/50 hover:bg-amber-100/60 border-velvi-gold/25 text-velvi-brownDark hover:border-velvi-gold/50 shadow-2xs"
                          }`}
                        >
                          <div className="min-w-0 w-full">
                            <div className="text-[11px] font-bold leading-tight truncate">
                              {sug.ta}
                            </div>
                            <div className="text-[9.5px] opacity-75 font-medium truncate mt-0.5">
                              {sug.en}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/5 w-full">
                            <span className="text-[9.5px] font-bold text-velvi-maroon bg-white/80 px-1.5 py-0.5 rounded border border-velvi-gold/20">
                              {sug.qty} {sug.unit}
                            </span>
                            {isAdded ? (
                              <span className="text-[9.5px] font-black text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                ✓ {existingItem.quantity} {existingItem.unit}
                              </span>
                            ) : (
                              <span className="text-[9.5px] font-bold text-velvi-brown bg-amber-100/80 px-1.5 py-0.5 rounded">
                                + சேர்
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Custom Item Form */}
                <div className="bg-velvi-cream/20 p-3 rounded-2xl border border-velvi-gold/25 space-y-2">
                  <div className="text-[11px] font-bold text-velvi-brownDark flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5 text-velvi-gold" />
                    <span>பட்டியலில் இல்லாத தனிப்பொருள் சேர்க்க / Add Custom Item</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-velvi-brown block mb-0.5">
                        பொருள் பெயர் (தமிழ்)
                      </label>
                      <input
                        type="text"
                        placeholder="எ.கா. பஞ்சபாத்திரம்"
                        value={newItemTamil}
                        onChange={(e) => setNewItemTamil(e.target.value)}
                        className="w-full bg-white border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-velvi-brown block mb-0.5">
                        Item Name (English)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Pancha Patram"
                        value={newItemEnglish}
                        onChange={(e) => setNewItemEnglish(e.target.value)}
                        className="w-full bg-white border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs font-semibold text-velvi-brownDark focus:outline-none focus:border-velvi-gold"
                      />
                    </div>
                  </div>
                  <p className="text-[9.5px] text-amber-800/80 font-medium">
                    (தமிழ் அல்லது ஆங்கிலம் — ஏதேனும் ஒரு பெயர் போதுமானது / Either is sufficient)
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <label className="text-[10px] font-bold text-velvi-brown block mb-0.5">அளவு (Qty)</label>
                      <input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={newItemQty}
                        onChange={(e) => setNewItemQty(Number(e.target.value))}
                        className="w-full bg-white border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs text-velvi-brownDark font-bold focus:outline-none focus:border-velvi-gold text-center"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <label className="text-[10px] font-bold text-velvi-brown block mb-0.5">அலகு / Unit</label>
                      <select
                        value={newItemUnit}
                        onChange={(e) => setNewItemUnit(e.target.value as PoojaItemTemplate["unit"])}
                        className="w-full bg-white border border-velvi-gold/20 rounded-xl px-2.5 py-2 text-xs text-velvi-brownDark font-bold focus:outline-none focus:border-velvi-gold"
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
                            sortOrder: formItems.length + 1,
                          };
                          setFormItems([...formItems, item]);
                          setNewItemEnglish("");
                          setNewItemTamil("");
                          setNewItemQty(1);
                        }}
                        className="px-3.5 py-2 bg-velvi-brown hover:bg-velvi-brownLight text-white font-bold text-xs rounded-xl transition shrink-0 shadow-sm active:scale-95 flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-300" />
                        <span>சேர்</span>
                      </button>
                    </div>
                  </div>

                  {/* 1-Click Unit Selection Pills */}
                  <div className="space-y-1 pt-1">
                    <span className="text-[10px] font-bold text-velvi-brown/80">அலகுகள் (Quick Unit Pick):</span>
                    <div className="flex flex-wrap gap-1">
                      {SAMAGRI_UNITS.map((u) => {
                        const isSelected = newItemUnit === u.unit;
                        return (
                          <button
                            key={u.unit}
                            type="button"
                            onClick={() => {
                              setNewItemUnit(u.unit);
                              if (u.unit === "g" && newItemQty === 1) setNewItemQty(100);
                              if (u.unit === "ml" && newItemQty === 1) setNewItemQty(500);
                              if (u.unit === "kg" && newItemQty === 100) setNewItemQty(1);
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition active:scale-95 border ${
                              isSelected
                                ? "bg-velvi-brown text-amber-200 border-velvi-brown shadow-xs"
                                : "bg-white hover:bg-velvi-cream text-velvi-brownDark border-velvi-gold/20"
                            }`}
                          >
                            {u.labelTa} <span className="opacity-75">({u.code})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="flex-1 py-2.5 bg-velvi-cream hover:bg-velvi-creamDark/30 text-velvi-brown rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-velvi-brown hover:bg-velvi-brownLight text-white rounded-xl text-xs font-bold transition shadow-md"
                >
                  {isEditing ? "Save Changes" : "Create Pooja"}
                </button>
              </div>
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
    </div>
  );
}
