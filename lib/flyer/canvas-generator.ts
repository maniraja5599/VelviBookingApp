import { Booking, Business, ThemePreset } from "@/lib/types";
import { getTamilDate } from "@/lib/calendar/tamil";

export interface FlyerThemeColors {
  background: string;
  cardBg: string;
  primary: string;
  gold: string;
  textDark: string;
  textMuted: string;
  borderColor: string;
}

export const THEME_COLOR_MAP: Record<ThemePreset, FlyerThemeColors> = {
  traditional: {
    background: "#FAF7F2",
    cardBg: "#FFFFFF",
    primary: "#4A2E18",
    gold: "#C89234",
    textDark: "#2C1810",
    textMuted: "#6E5B4B",
    borderColor: "#D4AF37",
  },
  classic: {
    background: "#F5F8F5",
    cardBg: "#FFFFFF",
    primary: "#1C4A27",
    gold: "#C89234",
    textDark: "#132D19",
    textMuted: "#4B6E52",
    borderColor: "#2D6A4F",
  },
  royal: {
    background: "#FAF5F6",
    cardBg: "#FFFFFF",
    primary: "#6B1724",
    gold: "#D4AF37",
    textDark: "#3A0D14",
    textMuted: "#7E4951",
    borderColor: "#8B1E3F",
  },
  modern: {
    background: "#FFFFFF",
    cardBg: "#FDFDFD",
    primary: "#3D3835",
    gold: "#B8860B",
    textDark: "#1F1C1B",
    textMuted: "#6B6562",
    borderColor: "#DCD5CE",
  },
  custom: {
    background: "#FAF7F2",
    cardBg: "#FFFFFF",
    primary: "#4A2E18",
    gold: "#C89234",
    textDark: "#2C1810",
    textMuted: "#6E5B4B",
    borderColor: "#C89234",
  },
};

/**
 * Draw a decorative sacred temple border on Canvas
 */
function drawTempleBorder(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  borderColor: string,
  goldColor: string
) {
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(42, 42, width - 84, height - 84);

  // Corner ornaments
  const corners = [
    { x: 30, y: 30 },
    { x: width - 30, y: 30 },
    { x: 30, y: height - 30 },
    { x: width - 30, y: height - 30 },
  ];

  ctx.fillStyle = goldColor;
  for (const c of corners) {
    ctx.beginPath();
    ctx.arc(c.x, c.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Generate a beautiful high-resolution image flyer for WhatsApp sharing
 */
export interface GenerateFlyerOptions {
  themePreset?: ThemePreset;
  customCompanyName?: string;
  customPhone?: string;
}

export async function generatePoojaFlyer(
  booking: Booking,
  business: Business,
  optionsOrPreset: ThemePreset | GenerateFlyerOptions = "traditional"
): Promise<string> {
  const options: GenerateFlyerOptions =
    typeof optionsOrPreset === "string"
      ? { themePreset: optionsOrPreset }
      : optionsOrPreset || {};

  const themePreset = options.themePreset || "traditional";
  const companyName = (options.customCompanyName?.trim() || business.name || "வேள்வி வேத பவனம்").trim();
  const contactPhone = (options.customPhone?.trim() || business.phone || business.whatsapp || "").trim();

  // Extract checked items
  const items = (booking.items && booking.items.length > 0)
    ? booking.items.filter((it: any) => it.isChecked !== false)
    : [];

  const isSingleCol = items.length <= 8;
  const half = Math.ceil(items.length / 2);
  const rowsCount = isSingleCol ? Math.max(1, items.length) : Math.max(1, half);
  const rowHeight = isSingleCol ? 52 : 46;
  const startY = 525;
  const itemsHeight = rowsCount * rowHeight;
  const footerSpace = 240;

  // Dynamic canvas height to avoid giant empty white voids
  const calculatedHeight = startY + itemsHeight + footerSpace;
  const width = 1080;
  const height = Math.max(980, Math.min(1600, calculatedHeight));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const colors = THEME_COLOR_MAP[themePreset] || THEME_COLOR_MAP.traditional;
  const tamilInfo = getTamilDate(booking.date);

  // 1. Background Fill
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);

  // 2. Temple Borders with refined inner hairline
  drawTempleBorder(ctx, width, height, colors.borderColor, colors.gold);

  // 3. Compact "Cute" Logo Badge (logo kutty a - 44px diameter)
  const logoCenterY = 78;
  const logoRadius = 22; // Small & cute!
  const flyerLogoSrc = business.logoUrl || "/icons/velvi-logo.png";
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject();
      logoImg.src = flyerLogoSrc;
    });
    // Draw circular cute logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, logoCenterY, logoRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, width / 2 - logoRadius, logoCenterY - logoRadius, logoRadius * 2, logoRadius * 2);
    ctx.restore();
    // Draw gold outer ring
    ctx.save();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, logoCenterY, logoRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } catch {
    ctx.font = "bold 26px serif";
    ctx.fillStyle = colors.gold;
    ctx.textAlign = "center";
    ctx.fillText("🪔 ॐ 🪔", width / 2, logoCenterY + 8);
  }

  // 4. Company Name (Live custom input from user)
  ctx.textAlign = "center";
  ctx.font = "bold 34px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText(companyName, width / 2, 132);

  // Subtitle Tagline
  ctx.font = "500 19px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = colors.textMuted;
  ctx.fillText("பூஜை சாமக்கிரி பொருட்கள் பட்டியல் (Pooja Required Items List)", width / 2, 162);

  // Subtle Ornamental Divider Line
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(300, 185);
  ctx.lineTo(width - 300, 185);
  ctx.stroke();

  // Small center diamond
  ctx.fillStyle = colors.gold;
  ctx.beginPath();
  ctx.arc(width / 2, 185, 4, 0, Math.PI * 2);
  ctx.fill();

  // 5. Pooja Name Section
  ctx.font = "black 42px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = colors.textDark;
  const poojaTitle = booking.poojaEnglishName || booking.poojaTamilName || "Pooja Ceremony";
  ctx.fillText(poojaTitle, width / 2, 240);

  if (booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName) {
    ctx.font = "bold 26px 'Mukta Malar', 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.primary;
    ctx.fillText(`(${booking.poojaTamilName})`, width / 2, 276);
  }

  // 6. Ceremony Details Card (Devotee, Date, Time, Venue)
  const cardX = 75;
  const cardY = 305;
  const cardW = width - 150;
  const cardH = 145;

  ctx.fillStyle = colors.cardBg;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1.2;
  // Rounded rectangle card
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(cardX, cardY, cardW, cardH, 18) : ctx.rect(cardX, cardY, cardW, cardH);
  ctx.fill();
  ctx.stroke();

  // Card Content
  ctx.textAlign = "left";
  ctx.font = "bold 23px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText(`👤 பக்தர் (Devotee): ${booking.customerName || "Devotee"}`, cardX + 28, cardY + 42);

  ctx.font = "bold 22px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.textDark;
  ctx.fillText(`📅 தேதி (Date): ${tamilInfo.formattedDualDate} (${tamilInfo.dayOfWeekTa})`, cardX + 28, cardY + 84);

  ctx.font = "20px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`⏰ நேரம்: ${booking.startTime}   •   📍 இடம்: ${booking.location || "இல்லம்"}`, cardX + 28, cardY + 122);

  // 7. Checklist Header Strip
  const listHeadingY = 485;
  ctx.textAlign = "center";
  ctx.font = "black 27px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText("📋 தேவையான பூஜை சாமக்கிரி பொருட்கள் (Items Checklist)", width / 2, listHeadingY);

  // 8. Balanced Items Grid (Single column for <=8 items, balanced dual column for >8)
  const col1X = isSingleCol ? 100 : 75;
  const col1W = isSingleCol ? width - 200 : 445;
  const col2X = width / 2 + 20;
  const col2W = 445;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const isCol2 = !isSingleCol && i >= half;
    const colIndex = isSingleCol ? i : isCol2 ? i - half : i;

    const x = isCol2 ? col2X : col1X;
    const w = isCol2 ? col2W : col1W;
    const y = startY + colIndex * rowHeight;

    // Subtle row background pill
    ctx.fillStyle = i % 2 === 0 ? "rgba(200, 146, 52, 0.06)" : "rgba(255, 255, 255, 0.75)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y - 30, w, rowHeight - 8, 10) : ctx.rect(x, y - 30, w, rowHeight - 8);
    ctx.fill();

    // Checkmark / Number
    ctx.textAlign = "left";
    ctx.font = "bold 19px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.primary;
    ctx.fillText(`${i + 1}.`, x + 12, y - 4);

    // Things Name (Bilingual Tamil + English)
    let itemName = "";
    const taName = (item.itemTamilName || "").trim();
    const enName = (item.itemEnglishName || "").trim();
    if (taName && enName && taName !== enName) {
      itemName = `${taName} (${enName})`;
    } else {
      itemName = taName || enName || "பொருள்";
    }

    ctx.font = isSingleCol
      ? "bold 22px 'Mukta Malar', 'Segoe UI', sans-serif"
      : "bold 20px 'Mukta Malar', 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.textDark;

    const maxNameWidth = w - (isSingleCol ? 160 : 130);
    let truncatedName = itemName;
    if (ctx.measureText(truncatedName).width > maxNameWidth) {
      while (truncatedName.length > 4 && ctx.measureText(truncatedName + "...").width > maxNameWidth) {
        truncatedName = truncatedName.slice(0, -1);
      }
      truncatedName += "...";
    }
    ctx.fillText(truncatedName, x + 40, y - 4);

    // Quantity Badge with Explicit Unit (No missing unit!)
    ctx.textAlign = "right";
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.primary;

    const unitRaw = (item.unit || "").trim().toLowerCase();
    let unitDisplay = "nos";
    if (unitRaw === "g" || unitRaw === "grams" || unitRaw === "கிராம்") {
      unitDisplay = "g";
    } else if (unitRaw === "kg" || unitRaw === "கிலோ") {
      unitDisplay = "kg";
    } else if (unitRaw === "ml" || unitRaw === "மில்லி") {
      unitDisplay = "ml";
    } else if (unitRaw === "litre" || unitRaw === "liter" || unitRaw === "l" || unitRaw === "லிட்டர்") {
      unitDisplay = "L";
    } else if (unitRaw === "packet" || unitRaw === "pkt" || unitRaw === "பாக்கெட்") {
      unitDisplay = "pkt";
    } else if (unitRaw === "bundle" || unitRaw === "bdl" || unitRaw === "கட்டு") {
      unitDisplay = "bdl";
    } else if (unitRaw === "set" || unitRaw === "செட்") {
      unitDisplay = "set";
    } else if (unitRaw === "nos" || unitRaw === "count" || unitRaw === "pcs" || unitRaw === "pieces" || unitRaw === "எண்ணிக்கை" || unitRaw === "எண்ணம்") {
      unitDisplay = "nos";
    } else if (item.unit) {
      unitDisplay = item.unit.trim();
    }

    const qtyText = `${item.quantity || 1} ${unitDisplay}`;
    ctx.fillText(qtyText, x + w - 14, y - 4);
  }

  if (items.length === 0) {
    ctx.textAlign = "center";
    ctx.font = "22px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.textMuted;
    ctx.fillText("பொருட்கள் எதுவும் சேர்க்கப்படவில்லை (No items added)", width / 2, startY + 60);
  }

  // 9. Sacred Instruction Note (Dynamically placed above bottom)
  const noteY = height - 150;
  ctx.textAlign = "center";
  ctx.font = "bold 20px 'Mukta Malar', 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.gold;
  ctx.fillText("🙏 தயவுசெய்து பூஜை தொடங்குவதற்கு முன் அனைத்து பொருட்களையும் தயார் நிலையில் வைக்கவும்.", width / 2, noteY);

  // 10. Contact Info
  if (contactPhone) {
    ctx.font = "bold 22px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.primary;
    ctx.fillText(`📞 தொடர்புக்கு (Contact): ${contactPhone}`, width / 2, noteY + 45);
  }

  // 11. Subtle Watermark
  if (business.showWatermark) {
    ctx.font = "16px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.textMuted;
    ctx.fillText("✨ Powered by Velvi App • வேத முறை முன்பதிவு மேலாண்மை ✨", width / 2, height - 45);
  }

  return canvas.toDataURL("image/png");
}
