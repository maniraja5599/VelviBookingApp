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
export async function generatePoojaFlyer(
  booking: Booking,
  business: Business,
  themePreset: ThemePreset = "traditional"
): Promise<string> {
  const canvas = document.createElement("canvas");
  const width = 1080;
  const height = 1500;
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  const colors = THEME_COLOR_MAP[themePreset] || THEME_COLOR_MAP.traditional;
  const tamilInfo = getTamilDate(booking.date);

  // 1. Background Fill
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, width, height);

  // 2. Temple Borders
  drawTempleBorder(ctx, width, height, colors.borderColor, colors.gold);

  // 3. Header Logo (Customer Custom Logo or Master Velvi Logo)
  const flyerLogoSrc = business.logoUrl || "/icons/velvi-logo.png";
  try {
    const logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      logoImg.onload = () => resolve();
      logoImg.onerror = () => reject();
      logoImg.src = flyerLogoSrc;
    });
    // Draw circular logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(width / 2, 88, 38, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImg, width / 2 - 38, 88 - 38, 76, 76);
    ctx.restore();
    // Draw gold border around logo
    ctx.save();
    ctx.strokeStyle = colors.gold;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(width / 2, 88, 38, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  } catch {
    ctx.font = "bold 38px serif";
    ctx.fillStyle = colors.gold;
    ctx.textAlign = "center";
    ctx.fillText("🪔 ॐ ஸ்ரீம் 🪔", width / 2, 90);
  }

  // 4. Business Branding
  ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText(business.name, width / 2, 155);

  // Divider Line
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(250, 205);
  ctx.lineTo(width - 250, 205);
  ctx.stroke();

  // 5. Pooja Name Section
  ctx.font = "bold 46px 'Segoe UI', Arial, sans-serif";
  ctx.fillStyle = colors.textDark;
  ctx.fillText(booking.poojaEnglishName || "Pooja Ceremony", width / 2, 280);

  // 6. Ceremony Schedule Card
  const cardX = 80;
  const cardY = 330;
  const cardW = width - 160;
  const cardH = 150;

  ctx.fillStyle = colors.cardBg;
  ctx.strokeStyle = colors.gold;
  ctx.lineWidth = 1;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Info items in Card
  ctx.textAlign = "left";
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText(`👤 Customer: ${booking.customerName || "Customer"}`, cardX + 30, cardY + 45);

  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.textDark;
  ctx.fillText(`📅 ${tamilInfo.formattedDualDate} (${tamilInfo.dayOfWeekTa})`, cardX + 30, cardY + 90);

  ctx.font = "22px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.textMuted;
  ctx.fillText(`🕐 Time: ${booking.startTime}   📍 Location: ${booking.location}`, cardX + 30, cardY + 130);

  // 7. Required Items Heading
  ctx.textAlign = "center";
  ctx.font = "bold 30px 'Mukta Malar', 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText("Required Items Checklist", width / 2, 530);

  // 8. Items Table Grid (2 columns for compact, clean layout)
  const items = booking.items || [];
  const col1X = 90;
  const col2X = width / 2 + 30;
  const startY = 580;
  const rowHeight = 44;
  const maxRows = 14;

  ctx.textAlign = "left";
  for (let i = 0; i < Math.min(items.length, maxRows * 2); i++) {
    const item = items[i];
    const isCol2 = i >= maxRows;
    const x = isCol2 ? col2X : col1X;
    const y = startY + (i % maxRows) * rowHeight;

    // Bullet & Item Name
    ctx.font = "600 22px 'Mukta Malar', 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.textDark;
    const displayName = `${i + 1}. ${item.itemEnglishName || item.itemTamilName}`;
    ctx.fillText(displayName, x, y);

    // Quantity Badge
    ctx.textAlign = "right";
    ctx.font = "bold 20px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.primary;
    const qtyText = `${item.quantity} ${item.unit}`;
    const qtyX = isCol2 ? width - 90 : width / 2 - 30;
    ctx.fillText(qtyText, qtyX, y);
    ctx.textAlign = "left";

    // Row divider dotted line
    ctx.strokeStyle = "#ECE6DE";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + 8);
    ctx.lineTo(qtyX, y + 8);
    ctx.stroke();
  }

  // 9. Sacred Instruction Note
  const noteY = height - 190;
  ctx.textAlign = "center";
  ctx.font = "italic 22px 'Mukta Malar', 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.gold;
  ctx.fillText("🙏 Please keep all items ready before the ceremony starts.", width / 2, noteY);

  // 10. Contact Footer
  ctx.font = "bold 24px 'Segoe UI', sans-serif";
  ctx.fillStyle = colors.primary;
  ctx.fillText(`Contact: ${business.phone}`, width / 2, noteY + 50);

  // 11. Watermark
  if (business.showWatermark) {
    ctx.font = "16px 'Segoe UI', sans-serif";
    ctx.fillStyle = colors.textMuted;
    ctx.fillText("Powered by Velvi App • Pooja & Seva Management", width / 2, height - 50);
  }

  return canvas.toDataURL("image/png");
}
