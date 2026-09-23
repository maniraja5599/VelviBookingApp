import { normalizeCategoryId } from "./catalog";

export interface ItemIconRule {
  keywords: string[];
  icon: string;
}

export const ITEM_ICON_RULES: ItemIconRule[] = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 1. மங்களப் பொடிகள், நறுமணம் & தீபம் (Sacred Powders, Scents & Camphor)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["குங்குமப்பூ", "saffron"], icon: "🪷" },
  { keywords: ["கற்பூரம்", "சூடம்", "camphor"], icon: "🕯️" },
  { keywords: ["மஞ்சள்", "turmeric"], icon: "🟡" },
  { keywords: ["குங்குமம்", "kumkum", "vermilion"], icon: "🔴" },
  { keywords: ["விபூதி", "திருநீறு", "vibhuti", "sacred ash"], icon: "⚪" },
  { keywords: ["சந்தன", "sandalwood", "sandal"], icon: "🪵" },
  { keywords: ["ஊதுபத்தி", "அகர்பத்தி", "incense", "agarbathi"], icon: "🥢" },
  { keywords: ["சாம்பிராணி", "தசாங்கம்", "sambrani", "dhasangam", "குங்கிலியம்", "மட்டிப்பால்"], icon: "💨" },
  { keywords: ["பன்னீர்", "rose water", "panneer"], icon: "🌹" },
  { keywords: ["புனுகு", "punugu", "அத்தர்", "ஜவ்வாது", "அரகஜா", "கோரோசனை", "கஸ்தூரி", "attar", "javvadhu", "perfume"], icon: "🧴" },
  { keywords: ["தீர்த்தப்பொடி", "theertham"], icon: "💧" },
  { keywords: ["கோலப் பொடி", "கோலப்பொடி", "rangoli"], icon: "🎨" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 2. புனித இலைகள் & மங்கள மூலிகைகள் (Sacred Leaves & Herbs)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["வெற்றிலை", "betel"], icon: "🍃" },
  { keywords: ["தாம்பூலம்", "thamboolam"], icon: "🍃" },
  { keywords: ["மா இலை", "மாவிலை", "மாம்பிலை", "mango leaf"], icon: "🍃" },
  { keywords: ["வாழை இலை", "banana leaf"], icon: "🍃" },
  { keywords: ["பாக்கு", "areca", "supari"], icon: "🌰" },
  { keywords: ["துளசி", "tulsi", "tulasi"], icon: "🌿" },
  { keywords: ["வில்வம்", "bilva", "bael"], icon: "🌿" },
  { keywords: ["அருகம்புல்", "garika", "grass"], icon: "🌾" },
  { keywords: ["விலாமிச்சை", "வெட்டிவேர்", "vettiver"], icon: "🌾" },
  { keywords: ["சீகக்காய்", "shikakai", "சீந்தில்", "நாயுருவி", "தளிர்", "foliage", "herb", "apamarga"], icon: "🌿" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 3. மலர்கள் & மாலைகள் (Flowers & Garlands)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["தாமரை", "lotus"], icon: "🪷" },
  { keywords: ["ரோஜா", "rose"], icon: "🌹" },
  { keywords: ["மல்லிகை", "jasmine"], icon: "🌸" },
  { keywords: ["அரளி", "oleander"], icon: "🌸" },
  { keywords: ["கதம்பம்", "kadambam"], icon: "🌼" },
  { keywords: ["மாலை", "garland"], icon: "💐" },
  { keywords: ["செவ்வந்தி", "சாமந்தி", "மலர்கள்", "மலர்", "பூக்கள்", "உதிரிப்பூ", "உதிரிப் பூ", " பூ", "flower"], icon: "🌺" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 4. ஹோம அக்னி & சமித்துகள் (Homam & Sacred Fire Offerings)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: [
      "ஹோம குச்சிகள்", "ஹோமக்குச்சிகள்", "சமித்து", "மாடா குச்சி", "சிராத்தூள்",
      "அகில்", "தேவதாரு", "புரசு", "அரசு", "ஆல்", "எருக்கு", "வன்னி",
      "samithu", "wood", "palasa", "peepal"
    ],
    icon: "🪵"
  },
  { keywords: ["ஹோம திரவியம்", "ஹோம சாமான்கள்", "homam dravyam"], icon: "🔥" },
  { keywords: ["பூர்ணாஹுதி", "பூர்ணாகுதி", "poornahuthi"], icon: "🔥" },
  { keywords: ["நவதானியம்", "நவக்கிரக", "navadhanya", "navagraha"], icon: "🪐" },
  { keywords: ["தீப்பெட்டி", "matchbox"], icon: "🧨" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 5. பூஜை பாத்திரங்கள் & மங்கள பொருட்கள் (Sacred Vessels & Objects)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["சங்கு", "conch", "sangu"], icon: "🐚" },
  { keywords: ["கலசம்", "kalasam"], icon: "🏺" },
  { keywords: ["பஞ்சபாத்திரம்", "panchapaathiram", "கொவளம்", "kovalam"], icon: "🏺" },
  { keywords: ["உத்தரணி", "கரண்டி", "uddharani", "ladle", "spoon"], icon: "🥄" },
  { keywords: ["கிண்ணம்", "கிண்ணங்கள்", "bowl", "cup"], icon: "🥣" },
  { keywords: ["குடம்", "pot", "kudam"], icon: "🏺" },
  { keywords: ["சொம்பு", "செம்பு", "sombu"], icon: "🏺" },
  { keywords: ["விளக்கு", "தீபக்கால்", "குத்துவிளக்கு", "lamp", "vilakku", "deepam", "தீபம்"], icon: "🪔" },
  { keywords: ["மணி", "bell"], icon: "🔔" },
  { keywords: ["தட்டு", "plate"], icon: "🍽️" },
  { keywords: ["கத்தி", "knife"], icon: "🔪" },
  { keywords: ["முக்காலி", "tripod", "table"], icon: "🪑" },
  { keywords: ["பாய்", "mat"], icon: "🧺" },
  { keywords: ["ஜல்லடை", "sieve"], icon: "🔘" },
  { keywords: ["செங்கல்", "brick"], icon: "🧱" },
  { keywords: ["மணல்", "sand"], icon: "⏳" },
  { keywords: ["சுவாமி படம்", "photo", "frame"], icon: "🖼️" },
  { keywords: ["வாஸ்துபதம்", "vastu"], icon: "🧭" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 6. வஸ்திரம், பட்டு & புனித நூல்கள் (Vastram, Wicks & Sacred Threads)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["வேஷ்டி", "வேட்டி", "dhoti"], icon: "🧣" },
  { keywords: ["ரவிக்கைத் துணி", "ரவிக்கை", "blouse", "துண்டு", "shawl", "angavastram", "வஸ்திரம்", "பட்டு", "silk", "cloth"], icon: "🥻" },
  { keywords: ["திரி", "வத்தி", "wick", "நூல்", "பூணூல்", "thread"], icon: "🧵" },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 7. பழங்கள், இனிப்புகள் & உணவுப் பொருட்கள் (Fruits, Sweets & Foods)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  { keywords: ["பஞ்சாமிர்தம்", "panchamirtham"], icon: "🍯" },
  { keywords: ["தேங்காய்", "கொப்பரை", "coconut", "copra"], icon: "🥥" },
  { keywords: ["எலுமிச்சம்பழம்", "எலுமிச்சை", "lemon", "lime"], icon: "🍋" },
  { keywords: ["பேரீச்சம்பழம்", "பேரீச்சை", "dates"], icon: "🌴" },
  { keywords: ["வாழைப்பழம்", "வாழைக்காய்", "banana"], icon: "🍌" },
  { keywords: ["ஆப்பிள்", "apple"], icon: "🍎" },
  { keywords: ["ஆரஞ்சு", "orange"], icon: "🍊" },
  { keywords: ["திராட்சை", "grapes", "raisin"], icon: "🍇" },
  { keywords: ["மாதுளை", "pomegranate"], icon: "🫐" },
  { keywords: ["கொய்யா", "guava"], icon: "🍐" },
  { keywords: ["பூசணி", "gourd", "ash gourd"], icon: "🎃" },
  { keywords: ["பழங்கள்", "பழம்", "fruits", "fruit"], icon: "🍌" },
  { keywords: ["கடலை", "பொட்டுக்கடலை", "chana", "chickpea", "gram", "முந்திரி", "cashew"], icon: "🥜" },
  { keywords: ["வெல்லம்", "jaggery"], icon: "🍯" },
  { keywords: ["சர்க்கரை பொங்கல்", "பொங்கல்"], icon: "🥣" },
  { keywords: ["கல்கண்டு", "sugar candy", "சர்க்கரை", "sugar"], icon: "🍬" },
  { keywords: ["சாதம்", "rice food"], icon: "🍚" },
  { keywords: ["அரிசி", "பச்சரிசி", "நெல்", "rice", "paddy"], icon: "🍚" },
  { keywords: ["நெற்பொறி", "அவல்", "அவுல்", "puffed", "poha"], icon: "🌾" },
  { keywords: ["பால்", "milk"], icon: "🥛" },
  { keywords: ["தயிர்", "curd", "yogurt"], icon: "🥣" },
  { keywords: ["நெய்", "ghee", "butter"], icon: "🧈" },
  { keywords: ["நல்லெண்ணெய்", "எண்ணெய்", "oil", "sesame"], icon: "🫙" },
  { keywords: ["தேன்", "honey"], icon: "🍯" },
  { keywords: ["கடுகு", "mustard"], icon: "🟡" },
  { keywords: ["கருஞ்சீரகம்", "சீரகம்", "cumin"], icon: "🌱" },
  { keywords: ["ஏலக்காய்", "கிராம்பு", "ஜாதிக்காய்", "ஜாதிபத்திரி", "cardamom", "clove", "nutmeg"], icon: "🌿" },
  { keywords: ["தவிடு", "husk", "bran"], icon: "🌾" },
];

export const CATEGORY_FALLBACK_ICONS: Record<string, string> = {
  pooja_items: "🪔",
  homam_items: "🔥",
  navagraha_items: "🪐",
  flowers_garlands: "🌺",
  fruits_food: "🍌",
  vessels_utensils: "🏺",
  vastram_clothes: "🧣",
  grihapravesam_items: "🏠",
};

/**
 * Returns a vivid, authentic, colorful icon suited for a given pooja samagri item.
 * Searches item Tamil name, English name, and falls back to category icon or ✨.
 */
export function getItemIcon(
  item:
    | {
        itemTamilName?: string;
        itemEnglishName?: string;
        category?: string;
      }
    | string,
  categoryFallback?: string
): string {
  const tName = typeof item === "string" ? item : item.itemTamilName || "";
  const eName = typeof item === "string" ? "" : item.itemEnglishName || "";
  const cat = typeof item === "string" ? categoryFallback : item.category || categoryFallback;

  const targetText = `${tName} ${eName}`.toLowerCase();

  for (const rule of ITEM_ICON_RULES) {
    for (const kw of rule.keywords) {
      if (targetText.includes(kw.toLowerCase())) {
        return rule.icon;
      }
    }
  }

  // Fallback to category icon
  if (cat) {
    const norm = normalizeCategoryId(cat);
    if (CATEGORY_FALLBACK_ICONS[norm]) {
      return CATEGORY_FALLBACK_ICONS[norm];
    }
  }

  return "✨";
}
