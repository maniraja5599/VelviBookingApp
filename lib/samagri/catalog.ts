export type SamagriCatalogUnit =
  | "pcs"
  | "nos"
  | "kg"
  | "g"
  | "litre"
  | "ml"
  | "packet"
  | "bundle"
  | "set"
  | "dozen";

export interface SamagriCatalogItem {
  id: string;
  category: string;
  ta: string;
  en: string;
  qty: number;
  unit: SamagriCatalogUnit;
}

export const SAMAGRI_CATALOG: SamagriCatalogItem[] = [
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
