export interface SamagriItemDetail {
  titleTa: string;
  titleEn: string;
  categoryTa: string;
  categoryEn: string;
  significance: string;
  preparationTip: string;
  storageOrQuality: string;
}

export const SAMAGRI_DETAILS_MAP: Record<string, Partial<SamagriItemDetail>> = {
  turmeric: {
    titleTa: "மஞ்சள் தூள்",
    titleEn: "Turmeric Powder",
    categoryTa: "மங்கள திரவியம்",
    categoryEn: "Sacred Powders",
    significance: "சகல சுப காரியங்களுக்கும் மங்களகரமான ஆரம்பம். விநாயகர் பிம்ப ஆவாஹனம், கும்ப ஸ்தாபனம் மற்றும் சர்வ மங்கல அர்ச்சனைக்கு முதன்மையானது.",
    preparationTip: "கெமிக்கல் மற்றும் செயற்கை வண்ணம் கலக்காத தூய வாசனை விரலி மஞ்சள் தூள் உகந்தது.",
    storageOrQuality: "தூய நறுமணம் கொண்ட புதிய மஞ்சள் பொடி.",
  },
  kumkum: {
    titleTa: "குங்குமம்",
    titleEn: "Kumkum (Vermilion)",
    categoryTa: "மங்கள திரவியம்",
    categoryEn: "Sacred Powders",
    significance: "அம்பாள், மகாலட்சுமி மற்றும் சர்வ தேவதா ஆகர்ஷண சக்தி கொண்டது. மங்களம் மற்றும் சௌபாக்யத்தை அருளும் தெய்வீக பிரசாதம்.",
    preparationTip: "தாழம்பூ குங்குமம் அல்லது தூய இயற்கை முறையில் தயாரிக்கப்பட்ட சிவந்த குங்குமம் சிறந்தது.",
    storageOrQuality: "ஈரப்பதம் படாத நறுமணமிக்க குங்குமம்.",
  },
  sandal: {
    titleTa: "சந்தனம்",
    titleEn: "Sandalwood Paste / Powder",
    categoryTa: "வாசனை திரவியம்",
    categoryEn: "Aromatic Herbs",
    significance: "தெய்வீக குளிர்ச்சி, மன அமைதி மற்றும் சாத்வீக குணத்தை நல்கும் திரவியம். கும்பம் மற்றும் சுவாமி திருவுருவத்திற்கு அலங்காரம் செய்யப்படுகிறது.",
    preparationTip: "சுத்தமான சந்தனக் கட்டை அரைத்தது அல்லது ஒரிஜினல் சந்தனப் பொடி.",
    storageOrQuality: "தூய சந்தன நறுமணம் கொண்டிருக்க வேண்டும்.",
  },
  vibhuti: {
    titleTa: "திருநீறு (விபூதி)",
    titleEn: "Sacred Vibhuti",
    categoryTa: "மங்கள ரக்ஷை",
    categoryEn: "Sacred Ash",
    significance: "சிவபெருமானின் அம்சம். சர்வ பாவ விமோசனம் மற்றும் தீய சக்திகளில் இருந்து காக்கும் தெய்வீக கவசம்.",
    preparationTip: "தூய நாட்டுப் பசுவின் சாணத்திலிருந்து தயாரிக்கப்பட்ட சுத்தமான விபூதி.",
    storageOrQuality: "மென்மையான வெண்ணிற தூய விபூதி.",
  },
  camphor: {
    titleTa: "கற்பூரம்",
    titleEn: "Camphor",
    categoryTa: "ஜோதி ஆராதனை",
    categoryEn: "Flame Offering",
    significance: "கற்பூரம் எரிந்து சாம்பல் ஏதுமின்றி மறைவது போல், மனிதனின் அகந்தை நீங்கி இறைவனுடன் ஒன்றிணைய வேண்டும் என்ற தத்துவத்தை உணர்த்தும் ஜோதி சமர்ப்பணம்.",
    preparationTip: "பச்சை கற்பூரம் அல்லது தூய படிக கற்பூரம் நன்று.",
    storageOrQuality: "தூய சுடர் தரும் கற்பூரக் கட்டிகள்.",
  },
  ghee: {
    titleTa: "தூய பசு நெய்",
    titleEn: "Pure Cow Ghee",
    categoryTa: "ஹோம திரவியம்",
    categoryEn: "Sacred Clarified Butter",
    significance: "ஹோம அக்னி பகவானுக்கு சமர்ப்பிக்கப்படும் பிரதான ஆஹுதி திரவியம். தேவதா திருப்தி, பிராண சக்தி மற்றும் குடும்பத்திற்கு தீர்க்க ஆயுள் அருளும்.",
    preparationTip: "கலப்படமில்லாத தூய நாட்டுப் பசு நெய் உகந்தது. ஹோமத்திற்கு முன் நெய்யை வெதுவெதுப்பாக உருக்கி வைக்கவும்.",
    storageOrQuality: "மணமும் சுவையும் நிறைந்த நாட்டுப் பசுவின் வெண்ணெய் காய்ச்சிய நெய்.",
  },
  coconut: {
    titleTa: "தேங்காய்",
    titleEn: "Fresh Coconut",
    categoryTa: "மும்மூர்த்தி பழம்",
    categoryEn: "Sacred Fruits",
    significance: "பிரம்மா, விஷ்ணு, சிவன் ஆகிய மும்மூர்த்திகளின் அம்சம். கணபதிக்கு சிதறுகாய் உடைத்தல், கலசத்தின் மீது வைத்தல் மற்றும் பூர்ணாஹுதிக்கு பிரதானம்.",
    preparationTip: "குடுமியுடன் கூடிய, தண்ணீர் ததும்பும் நல்ல நடுத்தர அல்லது பெரிய முழு தேங்காய்கள்.",
    storageOrQuality: "உடையாத, அழுகாத புதிய தேங்காய்கள்.",
  },
  betel: {
    titleTa: "வெற்றிலை பாக்கு",
    titleEn: "Betel Leaves & Areca Nut",
    categoryTa: "மங்கள தாம்பூலம்",
    categoryEn: "Sacred Offering",
    significance: "அஷ்டலட்சுமிகள் வாசம் செய்யும் மங்கள தாம்பூலம். தக்ஷிணை சமர்ப்பணம், சங்கல்பம் மற்றும் சுப காரிய நிறைவுக்கு அத்தியாவசியம்.",
    preparationTip: "காம்புகளுடன் கூடிய, கிழிபடாத கரும்பச்சை வெற்றிலைகள் மற்றும் முழு கொட்டைப்பாக்கு.",
    storageOrQuality: "புதிய பசுமையான வெற்றிலைகள்.",
  },
  banana: {
    titleTa: "வாழைப்பழம்",
    titleEn: "Banana Fruits",
    categoryTa: "நைவேத்திய பழம்",
    categoryEn: "Sacred Offerings",
    significance: "முக்கனிகளில் முதன்மையான மங்கள பழம். பூரண பலன் தரும் தெய்வ நைவேத்தியம் மற்றும் தாம்பூல திரவியம்.",
    preparationTip: "பூவன் பழம், செவ்வாழை அல்லது நாட்டு ரஸ்தாளி பழங்கள் உகந்தது.",
    storageOrQuality: "கனிந்த, கறுக்காத புதிய பழங்கள்.",
  },
  arugampul: {
    titleTa: "அருகம்புல்",
    titleEn: "Arugampul (Holy Bermuda Grass)",
    categoryTa: "கணபதி மூலிகை",
    categoryEn: "Sacred Grass",
    significance: "விநாயகப் பெருமானுக்கு மிகவும் பிரியமான திவ்ய மூலிகை. அனலாசுரனை விழுங்கிய விநாயகரின் உஷ்ணத்தைத் தணித்த அமிர்த மூலிகை.",
    preparationTip: "தூய நீரில் கழுவி, ஈரப்பதம் குறையாமல் பசுமையாக வைத்திருக்கவும்.",
    storageOrQuality: "புதிய தளிரான அருகம்புல் கட்டுகள்.",
  },
  raw_rice: {
    titleTa: "பச்சரிசி",
    titleEn: "Raw Rice",
    categoryTa: "தானியம் / அக்ஷதை",
    categoryEn: "Sacred Grain",
    significance: "கலச ஸ்தாபன தானிய பீடம், கும்ப பூஜை மற்றும் மஞ்சள் கலந்து மங்கள அக்ஷதை தயாரிக்கப் பயன்படுகிறது.",
    preparationTip: "புழுங்கல் அரிசி கூடாது. உடைபடாத சுத்தமான முழு பச்சரிசி நன்று.",
    storageOrQuality: "கல், தூசி நீக்கப்பட்ட தூய பச்சரிசி.",
  },
  navadhanyam: {
    titleTa: "நவதானியம் (9 தானியங்கள்)",
    titleEn: "Navadhanyam (Nine Sacred Grains)",
    categoryTa: "நவகிரக பீடம்",
    categoryEn: "Nine Planetary Grains",
    significance: "சூரியன் முதல் கேது வரையிலான 9 கிரக நாயகர்களின் பிரீதிக்காக சமர்ப்பிக்கப்படும் 9 புனித தானியங்கள். நவக்கிரக தோஷ நிவர்த்தி தரும்.",
    preparationTip: "நெல், துவரை, பாசிப்பயறு, கொண்டைக்கடலை, மொச்சை, எள், உளுந்து, கொள்ளு, கோதுமை அடங்கிய முழுமையான செட்.",
    storageOrQuality: "வண்டு படாத புதிய சுத்தமான தானியங்கள்.",
  },
  samithu: {
    titleTa: "சமித்து கட்டை",
    titleEn: "Homam Wood (Samithu)",
    categoryTa: "ஹோம திரவியம்",
    categoryEn: "Sacred Wood",
    significance: "அரசு, ஆல், அத்தி, பலாசு போன்ற புனித மரக் குச்சிகள். அக்னி குண்டத்தில் தேவதைகளுக்கு ஆஹுதியாக சமர்ப்பிக்கப்படும் பிரதான திரவியம்.",
    preparationTip: "பூச்சி அரிக்காத, காய்ந்த விரல் அளவு தடிமனுள்ள மரக் குச்சிகள்.",
    storageOrQuality: "ஈரமில்லாத காய்ந்த புனித சமித்து கட்டுகள்.",
  },
  honey: {
    titleTa: "தேன்",
    titleEn: "Pure Honey",
    categoryTa: "மதுவர்க்கம்",
    categoryEn: "Sacred Nectar",
    significance: "பஞ்சாமிர்த திரவியம், மதுவர்க்க நைவேத்தியம் மற்றும் ஹோமத்தில் சுவை நல்கும் புனித ஆஹுதி.",
    preparationTip: "சர்க்கரை பாகு கலக்காத தூய மலைத்தேன் அல்லது அடர்ந்த இயற்கை தேன்.",
    storageOrQuality: "தூய இயற்கை தேன்.",
  },
  modak: {
    titleTa: "மோதகம் / கொழுக்கட்டை",
    titleEn: "Modak / Kozhukattai",
    categoryTa: "கணபதி நைவேத்தியம்",
    categoryEn: "Sacred Sweets",
    significance: "விநாயகப் பெருமானுக்கு மிகவும் உகந்த 21 மோதக நைவேத்தியம். குடும்பத்தில் ஆனந்தம், வித்யா அபிவிருத்தி மற்றும் காரிய சித்தி தரும்.",
    preparationTip: "பூஜைக்கு முன் புதியதாக தயாரிக்கப்பட்ட வெல்ல பூரணம் கொண்ட கொழுக்கட்டைகள்.",
    storageOrQuality: "சுத்தமான பாத்திரத்தில் நைவேத்தியமாக சமர்ப்பிக்கவும்.",
  },
  garland: {
    titleTa: "பூக்கள் & மாலை",
    titleEn: "Flowers & Garlands",
    categoryTa: "புஷ்ப அலங்காரம்",
    categoryEn: "Sacred Florals",
    significance: "தெய்வங்களுக்கு அழகும் நறுமணமும் சூட்டும் புஷ்ப சமர்ப்பணம். சர்வ தேவதா பிரீதி தரும்.",
    preparationTip: "வாசனை உள்ள உதிரிப் பூக்கள் (மல்லிகை, செவ்வந்தி, அரளி) மற்றும் சுவாமிக்கு சாற்றும் மாலைகள்.",
    storageOrQuality: "வாடாத, புதிய நறுமண மலர்கள்.",
  },
  lemon: {
    titleTa: "எலுமிச்சம்பழம்",
    titleEn: "Fresh Lemons",
    categoryTa: "மங்கள கனி",
    categoryEn: "Sacred Citrus",
    significance: "துர்கா மற்றும் கணபதி பூஜைக்கு உகந்தது. கண் திருஷ்டி கழித்தல், பில்லி சூன்ய தோஷ நிவாரணம் மற்றும் தீய சக்திகள் விரட்ட உதவும்.",
    preparationTip: "புள்ளிகள் இல்லாத, நல்ல பழுத்த மஞ்சள் நிற எலுமிச்சம்பழங்கள்.",
    storageOrQuality: "காயமில்லாத முழு எலுமிச்சம்பழம்.",
  },
  jaggery: {
    titleTa: "வெல்லம்",
    titleEn: "Jaggery (Vellam)",
    categoryTa: "நைவேத்திய இனிப்பு",
    categoryEn: "Natural Sweetener",
    significance: "இனிமையான பலன்களை அருளும் நைவேத்திய திரவியம். ஹோமத்தில் சமர்ப்பிக்கப்பட்டு நற்பலன்களைத் தரும்.",
    preparationTip: "ரசாயனம் கலக்காத தூய இயற்கை மண்டை வெல்லம் அல்லது உருண்டை வெல்லம்.",
    storageOrQuality: "தூய நாட்டு வெல்லம்.",
  },
  kopparai: {
    titleTa: "கொப்பரை தேங்காய்",
    titleEn: "Dry Coconut (Kopparai)",
    categoryTa: "பூர்ணாஹுதி",
    categoryEn: "Homam Dravyam",
    significance: "ஹோமத்தின் உச்ச கட்டமான பூர்ணாஹுதியில் நெய் மற்றும் பட்டு வஸ்திரத்துடன் அக்னியில் சமர்ப்பிக்கப்படும் மங்கல திரவியம்.",
    preparationTip: "உடைபடாத இரண்டு அரை மூடி காய்ந்த கொப்பரை தேங்காய்கள்.",
    storageOrQuality: "பூஞ்சை இல்லாத காய்ந்த கொப்பரை.",
  },
  vastram: {
    titleTa: "வேஷ்டி & துண்டு செட்",
    titleEn: "Dhothi & Angavastram",
    categoryTa: "வஸ்திர சமர்ப்பணம்",
    categoryEn: "Sacred Clothing",
    significance: "கலசத்திற்கு சாற்றவும் மற்றும் பூஜையை நடத்தி வைக்கும் வேதியருக்கு ஆசிர்வதிக்கப்பட்டு சமர்ப்பிக்கப்படும் வஸ்திரம்.",
    preparationTip: "புதிய நூல் வேஷ்டி மற்றும் துண்டு (அங்கவஸ்திரம்).",
    storageOrQuality: "பயன்படுத்தப்படாத புதிய வஸ்திரம்.",
  },
};

export function getSamagriItemDetail(item: {
  id?: string;
  itemTamilName?: string;
  itemEnglishName?: string;
  unit?: string;
  quantity?: number;
}): SamagriItemDetail {
  const tName = (item.itemTamilName || "").toLowerCase();
  const eName = (item.itemEnglishName || "").toLowerCase();
  const idStr = (item.id || "").toLowerCase();

  let matchedKey = "";

  if (tName.includes("மஞ்சள்") || eName.includes("turmeric") || idStr.includes("turmeric")) {
    matchedKey = "turmeric";
  } else if (tName.includes("குங்குமம்") || eName.includes("kumkum") || idStr.includes("kumkum")) {
    matchedKey = "kumkum";
  } else if (tName.includes("சந்தனம்") || eName.includes("sandal") || idStr.includes("sandal")) {
    matchedKey = "sandal";
  } else if (tName.includes("திருநீறு") || tName.includes("விபூதி") || eName.includes("vibhuti") || idStr.includes("vibhuti")) {
    matchedKey = "vibhuti";
  } else if (tName.includes("கற்பூரம்") || eName.includes("camphor") || idStr.includes("camphor")) {
    matchedKey = "camphor";
  } else if (tName.includes("நெய்") || eName.includes("ghee") || idStr.includes("ghee")) {
    matchedKey = "ghee";
  } else if (tName.includes("தேங்காய்") && !tName.includes("கொப்பரை") || eName.includes("coconut") && !eName.includes("dry") || idStr.includes("coconut") && !idStr.includes("kopparai")) {
    matchedKey = "coconut";
  } else if (tName.includes("கொப்பரை") || eName.includes("dry coconut") || eName.includes("kopparai") || idStr.includes("kopparai")) {
    matchedKey = "kopparai";
  } else if (tName.includes("வெற்றிலை") || tName.includes("பாக்கு") || eName.includes("betel") || idStr.includes("betel")) {
    matchedKey = "betel";
  } else if (tName.includes("வாழை") || eName.includes("banana") || idStr.includes("banana")) {
    matchedKey = "banana";
  } else if (tName.includes("அருகம்புல்") || eName.includes("arugampul") || idStr.includes("arugampul")) {
    matchedKey = "arugampul";
  } else if (tName.includes("பச்சரிசி") || tName.includes("அரிசி") || eName.includes("rice") || idStr.includes("raw-rice")) {
    matchedKey = "raw_rice";
  } else if (tName.includes("நவதானியம்") || eName.includes("navadhanyam") || idStr.includes("navadhanyam")) {
    matchedKey = "navadhanyam";
  } else if (tName.includes("சமித்து") || eName.includes("samithu") || idStr.includes("samithu")) {
    matchedKey = "samithu";
  } else if (tName.includes("தேன்") || eName.includes("honey") || idStr.includes("honey")) {
    matchedKey = "honey";
  } else if (tName.includes("மோதகம்") || tName.includes("கொழுக்கட்டை") || eName.includes("modak") || idStr.includes("modak")) {
    matchedKey = "modak";
  } else if (tName.includes("மாலை") || tName.includes("பூ") || eName.includes("flower") || eName.includes("garland") || idStr.includes("garland")) {
    matchedKey = "garland";
  } else if (tName.includes("எலுமிச்சை") || eName.includes("lemon") || idStr.includes("lemon")) {
    matchedKey = "lemon";
  } else if (tName.includes("வெல்லம்") || eName.includes("jaggery") || idStr.includes("jaggery")) {
    matchedKey = "jaggery";
  } else if (tName.includes("வேஷ்டி") || tName.includes("வஸ்திர") || eName.includes("vastram") || idStr.includes("vastram")) {
    matchedKey = "vastram";
  }

  const matched = matchedKey ? SAMAGRI_DETAILS_MAP[matchedKey] : null;

  return {
    titleTa: item.itemTamilName || matched?.titleTa || "பூஜை சாமக்கிரி பொருள்",
    titleEn: item.itemEnglishName || matched?.titleEn || "Pooja Samagri Item",
    categoryTa: matched?.categoryTa || "பூஜை திரவியம்",
    categoryEn: matched?.categoryEn || "Ritual Essential",
    significance:
      matched?.significance ||
      "இப்பூஜை வைபவத்தில் உரிய மந்திர உச்சாடனத்துடன் அக்னி பகவானுக்கும் மூல தேவதைகளுக்கும் சமர்ப்பிக்கப்படும் மங்களகரமான ஆன்மீக பொருள்.",
    preparationTip:
      matched?.preparationTip ||
      "பூஜை தொடங்குவதற்கு முன் தேவையான அளவில் சுத்தமான பாத்திரத்தில் எடுத்து வைக்கவும்.",
    storageOrQuality:
      matched?.storageOrQuality ||
      "தூய்மையான மற்றும் தரமான புதிய பொருள் பயன்பாடு பரிந்துரைக்கப்படுகிறது.",
  };
}
