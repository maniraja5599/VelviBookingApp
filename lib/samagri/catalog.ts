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
  category:
    | "pooja_items"
    | "homam_items"
    | "navagraha_items"
    | "flowers_garlands"
    | "fruits_food"
    | "vessels_utensils"
    | "vastram_clothes"
    | "grihapravesam_items"
    | string;
  ta: string;
  en: string;
  qty: number;
  unit: SamagriCatalogUnit;
}

export const CATEGORY_ALIAS_MAP: Record<string, string> = {
  essentials: "pooja_items",
  powders: "pooja_items",
  ghee_oils: "homam_items",
  homam: "homam_items",
  navagraha: "navagraha_items",
  flowers: "flowers_garlands",
  fruits_prasad: "fruits_food",
  vessels_items: "vessels_utensils",
  vastram: "vastram_clothes",
};

export function normalizeCategoryId(catId?: string): string {
  if (!catId) return "pooja_items";
  return CATEGORY_ALIAS_MAP[catId] || catId;
}

export const SAMAGRI_CATALOG: SamagriCatalogItem[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. பூஜைப் பொருட்கள் (Pooja Items)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-manjal-kombu", category: "pooja_items", ta: "மஞ்சள் கொம்பு", en: "Turmeric Sticks (Manjal Kombu)", qty: 100, unit: "g" },
  { id: "sc-kumkum", category: "pooja_items", ta: "குங்குமம்", en: "Kumkum (Sacred Vermilion)", qty: 100, unit: "g" },
  { id: "sc-vellai-karpooram", category: "pooja_items", ta: "வெள்ளைக் கற்பூரம்", en: "White Camphor", qty: 2, unit: "packet" },
  { id: "sc-katti-karpooram", category: "pooja_items", ta: "கட்டி கற்பூரம்", en: "Block Camphor (Katti Karpooram)", qty: 1, unit: "packet" },
  { id: "sc-oothupathi", category: "pooja_items", ta: "ஊதுபத்தி", en: "Incense Sticks (Oothupathi)", qty: 2, unit: "packet" },
  { id: "sc-vibhuti", category: "pooja_items", ta: "விபூதி", en: "Sacred Ash (Vibhuti)", qty: 100, unit: "g" },
  { id: "sc-sandanam-podi", category: "pooja_items", ta: "சந்தனப் பொடி", en: "Sandalwood Powder", qty: 50, unit: "g" },
  { id: "sc-sandana-villai", category: "pooja_items", ta: "சந்தன வில்லை", en: "Sandalwood Tablets", qty: 1, unit: "packet" },
  { id: "sc-athar", category: "pooja_items", ta: "அத்தர்", en: "Attar (Fragrant Essence)", qty: 1, unit: "nos" },
  { id: "sc-pattu-nool", category: "pooja_items", ta: "பட்டு நூல்", en: "Silk Sacred Thread", qty: 1, unit: "bundle" },
  { id: "sc-vellai-noolkandu", category: "pooja_items", ta: "வெள்ளை நூல்கண்டு", en: "White Cotton Thread Reel", qty: 2, unit: "nos" },
  { id: "sc-poonool", category: "pooja_items", ta: "பூணூல்", en: "Sacred Thread (Poonool)", qty: 5, unit: "set" },
  { id: "sc-muppuri-nool", category: "pooja_items", ta: "முப்புரி நூல்", en: "Muppuri Thread", qty: 2, unit: "bundle" },
  { id: "sc-sambrani", category: "pooja_items", ta: "சாம்பிராணி", en: "Sambrani (Benzoin Resin)", qty: 100, unit: "g" },
  { id: "sc-dhasangam", category: "pooja_items", ta: "தசாங்கம்", en: "Dasangam Dhoop Powder", qty: 1, unit: "packet" },
  { id: "sc-perichampazham", category: "pooja_items", ta: "பேரிச்சம்பழம்", en: "Dates (Perichampazham)", qty: 250, unit: "g" },
  { id: "sc-drakshai", category: "pooja_items", ta: "திராட்சை", en: "Dry Raisins (Drakshai)", qty: 100, unit: "g" },
  { id: "sc-diamond-kalkandu", category: "pooja_items", ta: "டை கல்கண்டு", en: "Diamond Sugar Candy", qty: 200, unit: "g" },
  { id: "sc-ketti-kalkandu", category: "pooja_items", ta: "கெட்டி கல்கண்டு", en: "Hard Block Sugar Candy", qty: 200, unit: "g" },
  { id: "sc-paaku", category: "pooja_items", ta: "பாக்கு", en: "Betel Nuts (Paaku)", qty: 100, unit: "g" },
  { id: "sc-mundhiri", category: "pooja_items", ta: "முந்திரி", en: "Cashew Nuts (Mundhiri)", qty: 100, unit: "g" },
  { id: "sc-krambu", category: "pooja_items", ta: "கிராம்பு", en: "Cloves (Krambu)", qty: 25, unit: "g" },
  { id: "sc-elakkai", category: "pooja_items", ta: "ஏலக்காய்", en: "Cardamom (Elakkai)", qty: 25, unit: "g" },
  { id: "sc-jathikkai", category: "pooja_items", ta: "ஜாதிக்காய்", en: "Nutmeg (Jathikkai)", qty: 5, unit: "nos" },
  { id: "sc-jathipathiri", category: "pooja_items", ta: "ஜாதிபத்திரி", en: "Mace (Jathipathiri)", qty: 25, unit: "g" },
  { id: "sc-pachai-karpooram", category: "pooja_items", ta: "பச்சைக் கற்பூரம்", en: "Edible Green Camphor", qty: 25, unit: "g" },
  { id: "sc-theertha-podi", category: "pooja_items", ta: "தீர்த்தப்பொடி", en: "Theertha Podi", qty: 1, unit: "packet" },
  { id: "sc-kungumapoo", category: "pooja_items", ta: "குங்குமப்பூ", en: "Pure Saffron (Kungumapoo)", qty: 1, unit: "g" },
  { id: "sc-agil", category: "pooja_items", ta: "அகில்", en: "Agil Wood", qty: 50, unit: "g" },
  { id: "sc-devadaru", category: "pooja_items", ta: "தேவதாரு", en: "Devadaru Wood", qty: 50, unit: "g" },
  { id: "sc-karunjeeragam", category: "pooja_items", ta: "கருஞ்சீரகம்", en: "Black Cumin Seeds", qty: 50, unit: "g" },
  { id: "sc-punugu", category: "pooja_items", ta: "புனுகு", en: "Punugu", qty: 1, unit: "nos" },
  { id: "sc-javadhu", category: "pooja_items", ta: "ஜவ்வாது", en: "Javadhu Fragrant Paste", qty: 1, unit: "packet" },
  { id: "sc-arakaja", category: "pooja_items", ta: "அரகஜா", en: "Arakaja Paste", qty: 1, unit: "packet" },
  { id: "sc-korosanai", category: "pooja_items", ta: "கோரோசனை", en: "Gorochana (Korosanai)", qty: 1, unit: "g" },
  { id: "sc-kasthuri", category: "pooja_items", ta: "கஸ்தூரி", en: "Kasthuri Powder", qty: 10, unit: "g" },
  { id: "sc-pachari-maavu", category: "pooja_items", ta: "பச்சை அரிசி மாவு", en: "Raw Rice Flour", qty: 500, unit: "g" },
  { id: "sc-paneer", category: "pooja_items", ta: "பன்னீர்", en: "Rose Water (Paneer)", qty: 200, unit: "ml" },
  { id: "sc-thaen", category: "pooja_items", ta: "தேன்", en: "Pure Natural Honey", qty: 250, unit: "ml" },
  { id: "sc-nelpori", category: "pooja_items", ta: "நெற்பொறி", en: "Nel Pori (Puffed Paddy)", qty: 250, unit: "g" },
  { id: "sc-kopparai-thengai", category: "pooja_items", ta: "கொப்பரைத் தேங்காய்", en: "Dry Coconut (Kopparai)", qty: 2, unit: "nos" },
  { id: "sc-aval", category: "pooja_items", ta: "அவல்", en: "Flattened Rice (Aval)", qty: 500, unit: "g" },
  { id: "sc-kadalai", category: "pooja_items", ta: "கடலை", en: "Brown Chickpeas (Kadalai)", qty: 250, unit: "g" },
  { id: "sc-sarkarai", category: "pooja_items", ta: "சர்க்கரை", en: "White Sugar", qty: 500, unit: "g" },
  { id: "sc-nattu-sarkarai", category: "pooja_items", ta: "நாட்டு சர்க்கரை", en: "Country Cane Sugar", qty: 500, unit: "g" },
  { id: "sc-achu-vellam", category: "pooja_items", ta: "அச்சு வெல்லம்", en: "Block Jaggery (Achu Vellam)", qty: 500, unit: "g" },
  { id: "sc-mattippal", category: "pooja_items", ta: "மட்டிப்பால்", en: "Matti Paal Dhoop", qty: 100, unit: "g" },
  { id: "sc-pottukadalai", category: "pooja_items", ta: "பொட்டுக்கடலை", en: "Roasted Chana Dal", qty: 250, unit: "g" },
  { id: "sc-poolankizhangu", category: "pooja_items", ta: "பூலாங்கிழங்கு", en: "White Turmeric (Poolankizhangu)", qty: 50, unit: "g" },
  { id: "sc-ven-kadugu", category: "pooja_items", ta: "வெண் கடுகு", en: "White Mustard Seeds", qty: 100, unit: "g" },
  { id: "sc-kungiliyam", category: "pooja_items", ta: "குங்கிலியம்", en: "Kungiliyam (Guggulu)", qty: 100, unit: "g" },
  { id: "sc-ellu", category: "pooja_items", ta: "எள்ளு", en: "Black Sesame Seeds", qty: 100, unit: "g" },
  { id: "sc-kolappodi", category: "pooja_items", ta: "கோலப்பொடி", en: "Kolam Rangoli Powder", qty: 1, unit: "kg" },
  { id: "sc-nel", category: "pooja_items", ta: "நெல்", en: "Paddy Grains (Nel)", qty: 1, unit: "kg" },
  { id: "sc-pacharisi", category: "pooja_items", ta: "பச்சரிசி", en: "Raw Rice (Pacharisi)", qty: 2, unit: "kg" },
  { id: "sc-nallennai", category: "pooja_items", ta: "நல்லெண்ணெய்", en: "Sesame Oil (Nallennai)", qty: 500, unit: "ml" },
  { id: "sc-thiri", category: "pooja_items", ta: "திரி", en: "Cotton Lamp Wicks", qty: 2, unit: "packet" },
  { id: "sc-theepetti", category: "pooja_items", ta: "தீப்பெட்டி", en: "Match Boxes", qty: 2, unit: "nos" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. ஹோமப் பொருட்கள் (Homam Items)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-homa-dravyam", category: "homam_items", ta: "ஹோம திரவியம்", en: "Homa Dravyam Mixture", qty: 500, unit: "g" },
  { id: "sc-homa-samithu-varieties", category: "homam_items", ta: "ஹோம சமித்து – 27 / 54 / 108 வகைகள்", en: "Homam Samithu 27/54/108 Types", qty: 1, unit: "set" },
  { id: "sc-dhanvantri-samankal", category: "homam_items", ta: "தன்வந்திரி சாமான்கள்", en: "Dhanvantri Homam Herbs Set", qty: 1, unit: "set" },
  { id: "sc-nava-samithu", category: "homam_items", ta: "நவ சமித்து", en: "Nava Samithu (9 Sacred Woods)", qty: 1, unit: "set" },
  { id: "sc-samithu-bundle", category: "homam_items", ta: "சமித்து", en: "Samithu Wood Bundle", qty: 2, unit: "bundle" },
  { id: "sc-dharbai", category: "homam_items", ta: "தர்ப்பை", en: "Dharba Grass", qty: 2, unit: "bundle" },
  { id: "sc-arugampul", category: "homam_items", ta: "அருகம்புல்", en: "Durva Grass (Arugampul)", qty: 2, unit: "bundle" },
  { id: "sc-vilamichai-ver", category: "homam_items", ta: "விலாமிச்சை வேர்", en: "Vilamicchai Root", qty: 50, unit: "g" },
  { id: "sc-vettiver", category: "homam_items", ta: "வெட்டிவேர்", en: "Vettiver Root", qty: 50, unit: "g" },
  { id: "sc-nayuruvi", category: "homam_items", ta: "நாயுருவி", en: "Nayuruvi Samithu Herb", qty: 1, unit: "bundle" },
  { id: "sc-homam-agil", category: "homam_items", ta: "அகில்", en: "Agil Wood Pieces", qty: 100, unit: "g" },
  { id: "sc-homam-devadaru", category: "homam_items", ta: "தேவதாரு", en: "Devadaru Wood Pieces", qty: 100, unit: "g" },
  { id: "sc-purasu", category: "homam_items", ta: "புரசு", en: "Purasu (Palasa) Wood", qty: 1, unit: "bundle" },
  { id: "sc-arasu", category: "homam_items", ta: "அரசு", en: "Arasu (Peepal) Wood", qty: 1, unit: "bundle" },
  { id: "sc-aal", category: "homam_items", ta: "ஆல்", en: "Aal (Banyan) Wood", qty: 1, unit: "bundle" },
  { id: "sc-erukku", category: "homam_items", ta: "எருக்கு", en: "Erukku Wood", qty: 1, unit: "bundle" },
  { id: "sc-vanni", category: "homam_items", ta: "வன்னி", en: "Vanni Wood", qty: 1, unit: "bundle" },
  { id: "sc-thalir", category: "homam_items", ta: "தளிர்", en: "Tender Sacred Foliage", qty: 1, unit: "bundle" },
  { id: "sc-sandana-kattai", category: "homam_items", ta: "சந்தனக் கட்டை", en: "Sandalwood Sticks/Log", qty: 100, unit: "g" },
  { id: "sc-sandana-thailam", category: "homam_items", ta: "சந்தனத் தைலம்", en: "Sandalwood Sacred Oil", qty: 50, unit: "ml" },
  { id: "sc-seenthil-pudi", category: "homam_items", ta: "சீந்தில் புடி", en: "Seenthil Kodi Powder (Guduchi)", qty: 100, unit: "g" },
  { id: "sc-seekakkai-thool", category: "homam_items", ta: "சீகக்காய் தூள்", en: "Shikakai Powder", qty: 100, unit: "g" },
  { id: "sc-mada-kucchi", category: "homam_items", ta: "மாடா குச்சி", en: "Mada Kucchi (Sacred Sticks)", qty: 4, unit: "nos" },
  { id: "sc-thavidu", category: "homam_items", ta: "தவிடு", en: "Rice Bran (Thavidu)", qty: 250, unit: "g" },
  { id: "sc-poornahuthi-samankal", category: "homam_items", ta: "பூர்ணாகுதி சாமான்கள்", en: "Poornahuthi Complete Samagri Set", qty: 1, unit: "set" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. நவக்கிரகப் பொருட்கள் (Navagraha Items)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-navagraha-navadhanyam", category: "navagraha_items", ta: "நவக்கிரக நவதானியங்கள்", en: "Navagraha 9 Grains Set", qty: 1, unit: "set" },
  { id: "sc-navagraha-samithu", category: "navagraha_items", ta: "நவக்கிரக சமித்து", en: "Navagraha 9 Wood Samithu", qty: 1, unit: "set" },
  { id: "sc-navagraha-porutkal", category: "navagraha_items", ta: "நவக்கிரகப் பொருட்கள்", en: "Navagraha Pooja Samagri Set", qty: 1, unit: "set" },
  { id: "sc-navagraha-pidi", category: "navagraha_items", ta: "நவக்கிரக பிடி", en: "Navagraha Pidi Offerings", qty: 1, unit: "set" },
  { id: "sc-navagraha-poornahuthi-pattu", category: "navagraha_items", ta: "பூர்ணாகுதி பட்டுத் துணி", en: "Poornahuthi Silk Vastram", qty: 1, unit: "nos" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. பூ மற்றும் மாலை வகைகள் (Flowers & Garlands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-color-kolappodi-5", category: "flowers_garlands", ta: "கலர் கோலப்பொடி – 5 கலர்", en: "5-Color Rangoli Powders", qty: 1, unit: "set" },
  { id: "sc-malligai-poo", category: "flowers_garlands", ta: "மல்லிகைப் பூ", en: "Jasmine Flowers", qty: 250, unit: "g" },
  { id: "sc-kadambam", category: "flowers_garlands", ta: "கதம்பம்", en: "Kadambam Mixed Flowers", qty: 250, unit: "g" },
  { id: "sc-arali-poo", category: "flowers_garlands", ta: "அரளிப் பூ", en: "Arali Flowers (Oleander)", qty: 250, unit: "g" },
  { id: "sc-thamarai-poo", category: "flowers_garlands", ta: "தாமரைப் பூ", en: "Lotus Flowers (Thamarai)", qty: 8, unit: "nos" },
  { id: "sc-sevvanthi", category: "flowers_garlands", ta: "செவ்வந்தி", en: "Sevvanthi (Chrysanthemum)", qty: 250, unit: "g" },
  { id: "sc-poomaalai", category: "flowers_garlands", ta: "பூமாலை", en: "Flower Garlands", qty: 2, unit: "nos" },
  { id: "sc-maalai-vagaigal", category: "flowers_garlands", ta: "மாலை வகைகள்", en: "Assorted Sacred Garlands", qty: 2, unit: "nos" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. பழங்கள் மற்றும் உணவுப் பொருட்கள் (Fruits & Food Offerings)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-fruit-coconut", category: "fruits_food", ta: "தேங்காய்", en: "Fresh Coconuts", qty: 5, unit: "nos" },
  { id: "sc-fruit-kopparai", category: "fruits_food", ta: "கொப்பரைத் தேங்காய்", en: "Dry Coconuts (Kopparai)", qty: 2, unit: "nos" },
  { id: "sc-fruit-banana", category: "fruits_food", ta: "வாழைப்பழம்", en: "Bananas (Poovan/Rastali)", qty: 1, unit: "dozen" },
  { id: "sc-fruit-apple", category: "fruits_food", ta: "ஆப்பிள்", en: "Apples", qty: 6, unit: "nos" },
  { id: "sc-fruit-orange", category: "fruits_food", ta: "ஆரஞ்சு", en: "Oranges", qty: 6, unit: "nos" },
  { id: "sc-fruit-guava", category: "fruits_food", ta: "கொய்யாப்பழம்", en: "Guavas", qty: 6, unit: "nos" },
  { id: "sc-fruit-grapes", category: "fruits_food", ta: "திராட்சை", en: "Fresh Grapes", qty: 500, unit: "g" },
  { id: "sc-fruit-dates", category: "fruits_food", ta: "பேரிச்சம்பழம்", en: "Quality Dates", qty: 250, unit: "g" },
  { id: "sc-fruit-lemon", category: "fruits_food", ta: "எலுமிச்சை", en: "Lemons", qty: 10, unit: "nos" },
  { id: "sc-food-aval", category: "fruits_food", ta: "அவல்", en: "Poha / Flattened Rice", qty: 500, unit: "g" },
  { id: "sc-food-pottukadalai", category: "fruits_food", ta: "பொட்டுக்கடலை", en: "Roasted Gram", qty: 250, unit: "g" },
  { id: "sc-food-kadalai", category: "fruits_food", ta: "கடலை", en: "Chickpeas (Kadalai)", qty: 250, unit: "g" },
  { id: "sc-food-nelpori", category: "fruits_food", ta: "நெற்பொறி", en: "Puffed Rice (Nel Pori)", qty: 250, unit: "g" },
  { id: "sc-food-sugar", category: "fruits_food", ta: "சர்க்கரை", en: "Sugar", qty: 500, unit: "g" },
  { id: "sc-food-vellam", category: "fruits_food", ta: "வெல்லம்", en: "Jaggery (Vellam)", qty: 500, unit: "g" },
  { id: "sc-food-nattu-sarkarai", category: "fruits_food", ta: "நாட்டு சர்க்கரை", en: "Country Brown Sugar", qty: 500, unit: "g" },
  { id: "sc-food-thaen", category: "fruits_food", ta: "தேன்", en: "Pure Honey", qty: 250, unit: "ml" },
  { id: "sc-food-milk", category: "fruits_food", ta: "பால்", en: "Fresh Cow Milk", qty: 2, unit: "litre" },
  { id: "sc-food-curd", category: "fruits_food", ta: "தயிர்", en: "Fresh Curd", qty: 500, unit: "ml" },
  { id: "sc-food-ghee", category: "fruits_food", ta: "நெய்", en: "Pure Cow Ghee", qty: 1, unit: "litre" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. பூஜை உபகரணங்கள் (Pooja Utensils & Vessels)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-brass-kudam", category: "vessels_utensils", ta: "புதிய பித்தளை குடம்", en: "New Brass Pot (Kudam)", qty: 1, unit: "nos" },
  { id: "sc-brass-sombu", category: "vessels_utensils", ta: "புதிய பித்தளை சொம்பு", en: "New Brass Sombu", qty: 2, unit: "nos" },
  { id: "sc-brass-kinnam", category: "vessels_utensils", ta: "பித்தளை கிண்ணம்", en: "Brass Bowls", qty: 4, unit: "nos" },
  { id: "sc-kalasam-vessel", category: "vessels_utensils", ta: "கலசம்", en: "Kalasa Vessel", qty: 1, unit: "nos" },
  { id: "sc-panchapaathiram", category: "vessels_utensils", ta: "பஞ்சபாத்திரம்", en: "Pancha Paathiram", qty: 1, unit: "set" },
  { id: "sc-utharani", category: "vessels_utensils", ta: "உத்தரணி", en: "Uddharani Spoon", qty: 1, unit: "nos" },
  { id: "sc-pooja-thattu", category: "vessels_utensils", ta: "பூஜைத் தட்டு", en: "Pooja Plates", qty: 3, unit: "nos" },
  { id: "sc-thambalam", category: "vessels_utensils", ta: "தாம்பாளம்", en: "Brass Thambalam (Large Plate)", qty: 2, unit: "nos" },
  { id: "sc-kinnangal", category: "vessels_utensils", ta: "கிண்ணங்கள்", en: "Assorted Small Cups", qty: 6, unit: "nos" },
  { id: "sc-nei-karandi", category: "vessels_utensils", ta: "நெய்க் கரண்டி", en: "Ghee Ladle (Sruk Sruvam)", qty: 1, unit: "set" },
  { id: "sc-karandi", category: "vessels_utensils", ta: "கரண்டி", en: "General Brass Ladle", qty: 2, unit: "nos" },
  { id: "sc-kathi", category: "vessels_utensils", ta: "கத்தி", en: "Fruit Knife", qty: 1, unit: "nos" },
  { id: "sc-kovalam", category: "vessels_utensils", ta: "கொவளம்", en: "Kovalam Brass Vessel", qty: 1, unit: "nos" },
  { id: "sc-kuthuvilakku", category: "vessels_utensils", ta: "குத்துவிளக்கு", en: "Kuthu Vilakku Brass Lamps", qty: 2, unit: "nos" },
  { id: "sc-deepam", category: "vessels_utensils", ta: "தீபம்", en: "Clay/Brass Diya (Deepam)", qty: 5, unit: "nos" },
  { id: "sc-ves-thiri", category: "vessels_utensils", ta: "திரி", en: "Cotton Wicks", qty: 2, unit: "packet" },
  { id: "sc-ves-theepetti", category: "vessels_utensils", ta: "தீப்பெட்டி", en: "Safety Matches", qty: 2, unit: "nos" },
  { id: "sc-aarathi-thattu", category: "vessels_utensils", ta: "ஆரத்தித் தட்டு", en: "Aarthi Plate", qty: 1, unit: "nos" },
  { id: "sc-mani", category: "vessels_utensils", ta: "மணி", en: "Pooja Bell (Mani)", qty: 1, unit: "nos" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. வஸ்திரம் / துணி வகைகள் (Vastram / Clothes)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-veshti", category: "vastram_clothes", ta: "வேஷ்டி", en: "Traditional Dhoti", qty: 2, unit: "nos" },
  { id: "sc-angavastram", category: "vastram_clothes", ta: "அங்கவஸ்திரம்", en: "Angavastram (Upper Cloth)", qty: 2, unit: "nos" },
  { id: "sc-thundu", category: "vastram_clothes", ta: "துண்டு", en: "Cotton Towel (Thundu)", qty: 2, unit: "nos" },
  { id: "sc-ravikkai-thuni", category: "vastram_clothes", ta: "ரவிக்கைத் துணி", en: "Blouse Piece (Ravikkai)", qty: 2, unit: "nos" },
  { id: "sc-vastram-poonool", category: "vastram_clothes", ta: "பூணூல்", en: "Sacred Threads", qty: 3, unit: "set" },
  { id: "sc-vellai-thuni", category: "vastram_clothes", ta: "வெள்ளைத் துணி", en: "White Cotton Cloth (1m)", qty: 2, unit: "nos" },
  { id: "sc-manjal-thuni", category: "vastram_clothes", ta: "மஞ்சள் துணி", en: "Yellow Sacred Cloth (1m)", qty: 2, unit: "nos" },
  { id: "sc-pachai-thuni", category: "vastram_clothes", ta: "பச்சைத் துணி", en: "Green Sacred Cloth (1m)", qty: 2, unit: "nos" },
  { id: "sc-poornahuthi-pattu-thuni", category: "vastram_clothes", ta: "பூர்ணாகுதி பட்டுத் துணி", en: "Poornahuthi Red Silk Cloth", qty: 1, unit: "nos" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 8. கிரகப்பிரவேசப் பொருட்கள் (Grihapravesam Special Items)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { id: "sc-gp-paal", category: "grihapravesam_items", ta: "பால்", en: "Fresh Cow Milk (Paal Kaichuthal)", qty: 2, unit: "litre" },
  { id: "sc-gp-thayir", category: "grihapravesam_items", ta: "தயிர்", en: "Fresh Curd", qty: 500, unit: "ml" },
  { id: "sc-gp-nei", category: "grihapravesam_items", ta: "நெய்", en: "Pure Cow Ghee", qty: 500, unit: "ml" },
  { id: "sc-gp-panchamirtham", category: "grihapravesam_items", ta: "பஞ்சாமிர்தம்", en: "Panchamirtham", qty: 1, unit: "set" },
  { id: "sc-gp-sarkarai", category: "grihapravesam_items", ta: "சர்க்கரை", en: "Sugar for Milk Boiling", qty: 500, unit: "g" },
  { id: "sc-gp-vellam", category: "grihapravesam_items", ta: "வெல்லம்", en: "Jaggery", qty: 500, unit: "g" },
  { id: "sc-gp-thengai", category: "grihapravesam_items", ta: "தேங்காய்", en: "Auspicious Coconuts", qty: 5, unit: "nos" },
  { id: "sc-gp-vettilai", category: "grihapravesam_items", ta: "வெற்றிலை", en: "Fresh Betel Leaves", qty: 2, unit: "bundle" },
  { id: "sc-gp-paaku", category: "grihapravesam_items", ta: "பாக்கு", en: "Betel Nuts", qty: 100, unit: "g" },
  { id: "sc-gp-mambilai", category: "grihapravesam_items", ta: "மாம்பிலை", en: "Fresh Mango Leaves (Thoranam)", qty: 2, unit: "bundle" },
  { id: "sc-gp-kalasam", category: "grihapravesam_items", ta: "கலசம்", en: "Grihapravesa Kalasam", qty: 1, unit: "set" },
  { id: "sc-gp-puthiya-kudam", category: "grihapravesam_items", ta: "புதிய குடம்", en: "New Milk Boiling Brass Kudam", qty: 1, unit: "nos" },
  { id: "sc-gp-puthiya-sombu", category: "grihapravesam_items", ta: "புதிய சொம்பு", en: "New Brass Sombu", qty: 1, unit: "nos" },
  { id: "sc-gp-kolappodi", category: "grihapravesam_items", ta: "கோலப்பொடி", en: "Threshold Rangoli Kolam Powder", qty: 1, unit: "kg" },
  { id: "sc-gp-malargal", category: "grihapravesam_items", ta: "மலர்கள்", en: "Fresh Fragrant Flowers", qty: 500, unit: "g" },
  { id: "sc-gp-maalai", category: "grihapravesam_items", ta: "மாலை", en: "Entrance Door Welcoming Garlands", qty: 2, unit: "nos" },
  { id: "sc-gp-thamboolam", category: "grihapravesam_items", ta: "தாம்பூலம்", en: "Thamboolam Sets for Guests", qty: 25, unit: "set" },
];
