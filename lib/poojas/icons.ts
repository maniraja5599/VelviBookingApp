export interface PoojaIconOption {
  icon: string;
  labelEn: string;
  labelTa: string;
  key: string;
}

export const POOJA_ICON_OPTIONS: PoojaIconOption[] = [
  { icon: "🐘", labelEn: "Ganapathi / Vinayagar", labelTa: "மகா கணபதி / விநாயகர்", key: "ganapathi" },
  { icon: "🐚", labelEn: "Sangu / Shankha / Vishnu", labelTa: "108 சங்கு பூஜை / பெருமாள்", key: "sangu" },
  { icon: "🌸", labelEn: "Sri Maha Lakshmi / Lotus", labelTa: "ஸ்ரீ மகா லட்சுமி / தாமரை", key: "lakshmi" },
  { icon: "🌺", labelEn: "Parvathi / Devi / Ambal", labelTa: "பார்வதி / சுயம்வர கலா / அம்பாள்", key: "parvathi" },
  { icon: "🛕", labelEn: "Kumbabishekam / Temple", labelTa: "கும்பாபிஷேகம் / கோவில்", key: "temple" },
  { icon: "🥥", labelEn: "Purna Kumbham / Kalasam", labelTa: "கலச பூஜை / புண்யாகவாசனம்", key: "kalasam" },
  { icon: "🔱", labelEn: "Rudra / Shiva / Chandi", labelTa: "ருத்ரம் / சிவன் / சண்டி", key: "shiva" },
  { icon: "🦚", labelEn: "Murugan / Subramanya", labelTa: "முருகன் / கார்த்திகை / வேல்", key: "murugan" },
  { icon: "🐮", labelEn: "Gomatha / Kamadhenu", labelTa: "கோமாதா / காமதேனு பூஜை", key: "gomatha" },
  { icon: "🪔", labelEn: "Deepam / Vilakku Pooja", labelTa: "விளக்கு பூஜை / தீபம்", key: "deepam" },
  { icon: "🪙", labelEn: "Dhanalakshmi / Kubera", labelTa: "தனலட்சுமி / குபேர பூஜை", key: "wealth" },
  { icon: "🌿", labelEn: "Ayush / Dhanvantari Herbs", labelTa: "ஆயுஷ் / தன்வந்திரி மூலிகை", key: "ayush" },
  { icon: "📐", labelEn: "Vastu Shanthi Mandala", labelTa: "வாஸ்து சாந்தி மண்டலம்", key: "vastu" },
  { icon: "🪐", labelEn: "Navagraha Shanthi", labelTa: "நவகிரக சாந்தி", key: "navagraha" },
  { icon: "💍", labelEn: "Vivaham / Kalyanam", labelTa: "விவாஹம் / திருமணம்", key: "marriage" },
  { icon: "📿", labelEn: "Upanayanam / Japam", labelTa: "உபநயனம் / ஜபம்", key: "upanayanam" },
  { icon: "☀️", labelEn: "Surya / Aditya Hridayam", labelTa: "சூரிய பூஜை / காயத்ரி", key: "surya" },
  { icon: "🕉️", labelEn: "Vedic Parayanam", labelTa: "வேத பாராயணம்", key: "vedic" },
  { icon: "👑", labelEn: "Shashtiabda / Sathabishekam", labelTa: "மணிவிழா / சதாபிஷேகம்", key: "milestone" },
  { icon: "🔥", labelEn: "Homam / Havan / Agni", labelTa: "ஹோமம் / அக்னி ஆஹுதி", key: "homam" },
  { icon: "👶", labelEn: "Namakaranam / Child Blessing", labelTa: "நாமகரணம் / பாலாரிஷ்டம்", key: "child" },
];

/**
 * Intelligent icon resolver for any Pooja.
 * If custom icon is assigned, uses it; otherwise auto-detects by Tamil or English name keywords.
 * Defaults to sacred temple 🛕 instead of generic flame.
 */
export function getPoojaIcon(pooja?: {
  icon?: string;
  englishName?: string;
  tamilName?: string;
} | null): string {
  if (!pooja) return "🛕";
  if (pooja.icon && pooja.icon.trim()) return pooja.icon.trim();

  const name = `${pooja.englishName || ""} ${pooja.tamilName || ""}`.toLowerCase();

  // 1. Ganapathi / Vinayagar / Ganesha -> 🐘 Elephant
  if (/ganapath|vinayag|vigneswar|pillayar|விநாயக|கணபதி|பிள்ளையார்/i.test(name)) return "🐘";

  // 2. Sangu / Shankha / Conche Pooja -> 🐚 Conch
  if (/sangu|shankh|shang|சங்கு/i.test(name)) return "🐚";

  // 3. Sri Maha Lakshmi / Wealth / Kamala -> 🌸 Sacred Pink Lotus
  if (/lakshmi|laxmi|kamala|dhanalakshmi|லட்சுமி|லக்ஷ்மி|கமலா/i.test(name)) return "🌸";

  // 4. Parvathi / Devi / Ambal / Swayamvara / Durga -> 🌺 Sacred Devi Flower
  if (/parvath|swayamvar|ambal|devi|durga|chandi|chamundi|பார்வதி|சுயம்வர|அம்பாள்|தேவி|துர்கா|சாமுண்டி|சண்டி/i.test(name)) return "🌺";

  // 5. Murugan / Kartikeya / Skanda / Subramanya / Sashti -> 🦚 Sacred Peacock
  if (/muruga|subramany|karthig|sashti|shasti|வேல்|முருக|சுப்பிரமணிய|கார்த்திக|சஷ்டி/i.test(name)) return "🦚";

  // 6. Kumbabishekam / Temple Consecration -> 🛕 Temple
  if (/kumbabish|kumbabishekam|kovil|temple|கும்பாபிஷேக|கோவில்/i.test(name)) return "🛕";

  // 7. Perumal / Vishnu / Sudarshana -> 🐚 Sacred Conch
  if (/sudarshan|perumal|vishnu|venkateswara|சுதர்சன|பெருமாள்|விஷ்ணு|வெங்கடேச/i.test(name)) return "🐚";

  // 8. Satyanarayana -> 🌸 Sacred Lotus
  if (/satyanarayan|சத்யநாராயண/i.test(name)) return "🌸";

  // 9. Gomatha / Cow Pooja -> 🐮 Gomatha
  if (/gomatha|kamadhenu|pasu|cow|கோமாதா|காமதேனு|பசு/i.test(name)) return "🐮";

  // 10. Rudra / Shiva / Lingam -> 🔱 Trishul
  if (/rudra|shiva|sivan|lingam|ருத்ர|சிவன்|லிங்க/i.test(name)) return "🔱";

  // 11. Sudhi Punyahavachanam / Kalasam / Kumbham -> 🥥 Purna Kalasam
  if (/punyah|punyaha|kalasa|kumbha|theerth|புண்யாக|கலச|கும்ப/i.test(name)) return "🥥";

  // 12. Vastu Shanthi -> 📐 Sacred Vastu Mandala
  if (/vastu|வாஸ்து/i.test(name)) return "📐";

  // 13. Grihapravesam (Sacred Consecration) -> 🛕 Temple or 🥥
  if (/griha|graha\s*praves|veedu|கிரஹ|வீடு|பிரவேச/i.test(name)) return "🛕";

  // 14. Navagraha -> 🪐 Navagraham
  if (/navagraha|graha\s*shanthi|நவகிரக/i.test(name)) return "🪐";

  // 15. Ayush / Health / Longevity / Dhanvantari -> 🌿 Sanjeevani Herbs
  if (/ayush|ayur|mrityunjay|dhanvant|மிருத்யுஞ்சய|ஆயுஷ்|ஆயுர்|தன்வந்திரி/i.test(name)) return "🌿";

  // 16. Marriage / Vivaham -> 💍 Mangalyam
  if (/vivah|kalyan|marriage|திருமண|விவாஹ/i.test(name)) return "💍";

  // 17. Upanayanam / Sacred Thread / Japam -> 📿 Sacred Beads
  if (/upanayan|punool|ஜபம்|உபநயன|பூணூல்/i.test(name)) return "📿";

  // 18. Deepam / Vilakku -> 🪔 Diya
  if (/deepa|vilakku|விளக்கு|தீபம்/i.test(name)) return "🪔";

  // 19. Surya -> ☀️ Sun
  if (/surya|aditya|சூரிய|ஆதித்ய/i.test(name)) return "☀️";

  // 20. Vedic / Gayatri -> 🕉️ Om
  if (/parayan|vedic|gayatri|வேத|காயத்ரி/i.test(name)) return "🕉️";

  // 21. Milestone -> 👑 Crown
  if (/shashti|sathabish|mani\s*vizha|மணிவிழா|சதாபிஷேக/i.test(name)) return "👑";

  // 22. Generic Homam fallback
  if (/homam|havan|யாகம்|ஹோமம்/i.test(name)) return "🔥";

  return "🛕";
}
