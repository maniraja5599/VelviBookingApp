export interface PoojaIconOption {
  icon: string;
  labelEn: string;
  labelTa: string;
  key: string;
}

export const POOJA_ICON_OPTIONS: PoojaIconOption[] = [
  { icon: "🐘", labelEn: "Ganapathi / Vinayagar", labelTa: "கணபதி / விநாயகர்", key: "ganapathi" },
  { icon: "🔥", labelEn: "Homam / Havan / Agni", labelTa: "ஹோமம் / அக்னி", key: "homam" },
  { icon: "🏡", labelEn: "Grihapravesam / Vastu", labelTa: "கிரஹப்பிரவேசம் / வாஸ்து", key: "house" },
  { icon: "🪐", labelEn: "Navagraha Shanthi", labelTa: "நவகிரக சாந்தி", key: "navagraha" },
  { icon: "💍", labelEn: "Vivaham / Kalyanam", labelTa: "விவாஹம் / திருமணம்", key: "marriage" },
  { icon: "📿", labelEn: "Upanayanam / Japam", labelTa: "உபநயனம் / ஜபம்", key: "upanayanam" },
  { icon: "👶", labelEn: "Ayush / Namakaranam", labelTa: "ஆயுஷ் / நாமகரணம்", key: "child" },
  { icon: "🔱", labelEn: "Rudra / Shiva / Chandi", labelTa: "ருத்ரம் / சிவன் / சண்டி", key: "shiva" },
  { icon: "🐚", labelEn: "Sudarshana / Perumal", labelTa: "சுதர்சனம் / பெருமாள்", key: "vishnu" },
  { icon: "🪔", labelEn: "Deepam / Vilakku Pooja", labelTa: "விளக்கு பூஜை / தீபம்", key: "deepam" },
  { icon: "🌸", labelEn: "Satyanarayana / Archana", labelTa: "சத்யநாராயணா / அர்ச்சனை", key: "archana" },
  { icon: "☀️", labelEn: "Surya / Gayatri", labelTa: "சூரிய பூஜை / காயத்ரி", key: "surya" },
  { icon: "🥥", labelEn: "Purna Kumbham / Kalasam", labelTa: "கலச பூஜை / பூர்ணகும்பம்", key: "kalasam" },
  { icon: "👑", labelEn: "Shashtiabda / Sathabishekam", labelTa: "மணிவிழா / சதாபிஷேகம்", key: "milestone" },
  { icon: "🌿", labelEn: "Mrityunjaya / Herbs", labelTa: "மிருத்யுஞ்சய / மூலிகை", key: "herbs" },
  { icon: "📐", labelEn: "Vastu Shanthi", labelTa: "வாஸ்து சாந்தி", key: "vastu" },
  { icon: "🔔", labelEn: "Temple Seva / Kovil", labelTa: "கோவில் சேவை", key: "temple" },
  { icon: "🕉️", labelEn: "Vedic Parayanam", labelTa: "வேத பாராயணம்", key: "vedic" },
];

/**
 * Intelligent icon resolver for any Pooja.
 * If custom icon is assigned, uses it; otherwise auto-detects by Tamil or English name keywords.
 */
export function getPoojaIcon(pooja?: {
  icon?: string;
  englishName?: string;
  tamilName?: string;
} | null): string {
  if (!pooja) return "🔥";
  if (pooja.icon && pooja.icon.trim()) return pooja.icon.trim();

  const name = `${pooja.englishName || ""} ${pooja.tamilName || ""}`.toLowerCase();

  if (/ganapath|vinayag|vigneswar|விநாயக|கணபதி|பிள்ளையார்/i.test(name)) return "🐘";
  if (/vastu|வாஸ்து/i.test(name)) return "📐";
  if (/griha|graha\s*praves|veedu|house|கிரஹ|வீடு|பிரவேச/i.test(name)) return "🏡";
  if (/navagraha|graha\s*shanthi|நவகிரக/i.test(name)) return "🪐";
  if (/sudarshan|perumal|vishnu|சுதர்சன|பெருமாள்|விஷ்ணு/i.test(name)) return "🐚";
  if (/ayush|namakaran|punyavachan|ஆயுஷ்|நாமகரண|புண்யாவாக/i.test(name)) return "👶";
  if (/vivah|kalyan|marriage|திருமண|விவாஹ/i.test(name)) return "💍";
  if (/mrityunjay|மிருத்யுஞ்சய/i.test(name)) return "🌿";
  if (/rudra|shiva|sivan|chandi|durga|ருத்ர|சிவன்|சாமுண்டி|சண்டி|துர்கா/i.test(name)) return "🔱";
  if (/satyanarayan|சத்யநாராயண/i.test(name)) return "🌸";
  if (/upanayan|punool|உபநயன|பூணூல்/i.test(name)) return "📿";
  if (/shashti|sathabish|mani\s*vizha|மணிவிழா|சதாபிஷேக/i.test(name)) return "👑";
  if (/deepa|vilakku|விளக்கு|தீபம்/i.test(name)) return "🪔";
  if (/surya|சூரிய/i.test(name)) return "☀️";
  if (/kalasa|kumbha|கலச|கும்ப/i.test(name)) return "🥥";
  if (/parayan|வேத/i.test(name)) return "🕉️";

  return "🔥";
}
