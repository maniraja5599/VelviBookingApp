import { Booking, Business } from "@/lib/types";
import { getTamilDate } from "@/lib/calendar/tamil";

export function formatUnitTamil(unit?: string): string {
  if (!unit) return "";
  const map: Record<string, string> = {
    g: "கிராம்",
    kg: "கிலோ",
    nos: "எண்ணிக்கை",
    pcs: "எண்ணிக்கை",
    packet: "பாக்கெட்",
    litre: "லிட்டர்",
    ml: "மி.லி",
    bundle: "கட்டு",
    set: "செட்",
    dozen: "டஜன்",
  };
  return map[unit.toLowerCase()] || unit;
}

export function formatUnitShort(unit?: string): string {
  if (!unit) return "nos";
  const u = unit.toLowerCase().trim();
  const map: Record<string, string> = {
    "g": "g",
    "gram": "g",
    "grams": "g",
    "கிராம்": "g",
    "kg": "kg",
    "kilogram": "kg",
    "கிலோ": "kg",
    "nos": "nos",
    "pcs": "nos",
    "no": "nos",
    "numbers": "nos",
    "எண்ணிக்கை": "nos",
    "packet": "pkt",
    "pkt": "pkt",
    "பாக்கெட்": "pkt",
    "bundle": "bunch",
    "bunch": "bunch",
    "கட்டு": "bunch",
    "set": "set",
    "sets": "set",
    "செட்": "set",
    "ml": "ml",
    "மில்லிலிட்டர்": "ml",
    "மி.லி": "ml",
    "l": "L",
    "litre": "L",
    "லிட்டர்": "L",
    "dozen": "doz",
    "டஜன்": "doz",
  };
  return map[u] || u;
}

/**
 * Format a WhatsApp message for Pooja Required Items list
 */
export function formatPoojaItemsWhatsAppMessage(
  booking: Booking,
  business: Business
): string {
  const tamilInfo = getTamilDate(booking.date);

  const itemsList = (booking.items && booking.items.length > 0)
    ? booking.items
        .filter((it: any) => it.isChecked !== false)
        .map((item: any, idx) => {
          const name = item.itemTamilName || item.itemEnglishName || item.nameTa || item.nameEn || "பொருள்";
          const unit = formatUnitTamil(item.unit);
          const qty = item.quantity ? ` — ${item.quantity} ${unit}` : "";
          return `${idx + 1}. ${name}${qty}`.trim();
        })
        .join("\n")
    : "";

  return `🙏 *லோகா: ஸமஸ்தா: ஸுகினோ பவந்து*

🪔 *${booking.poojaEnglishName || booking.poojaTamilName || "பூஜை வழிபாடு"}*
${booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName ? `(${booking.poojaTamilName})\n` : ""}
📅 தேதி: *${tamilInfo.formattedDualDate}* (${tamilInfo.dayOfWeekTa})
⏰ நேரம்: *${booking.startTime}*
👤 பக்தர்: *${booking.customerName || "பக்தர்"}*
📍 இடம்: *${booking.location || "இல்லம்"}*

${itemsList ? `📋 *பூஜை சாமக்கிரி பொருட்கள்:*\n${itemsList}\n\n` : ""}🙏 தயவுசெய்து பூஜை தொடங்குவதற்கு முன் அனைத்து பொருட்களையும் தயார் நிலையில் வைத்திருக்கவும்.

—
*${business.name || "வேள்வி வேத பவனம்"}*
📞 தொடர்புக்கு: ${business.phone || business.whatsapp || ""}

✨ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨
_வேத முறை முன்பதிவு மேலாண்மை_`;
}

/**
 * Format a WhatsApp message for Booking Confirmation
 */
export function formatBookingConfirmationWhatsAppMessage(
  booking: Booking,
  business: Business
): string {
  const tamilInfo = getTamilDate(booking.date);

  const itemsList = (booking.items && booking.items.length > 0)
    ? `\n📋 *பூஜை சாமக்கிரி பொருட்கள்:*\n` +
      booking.items
        .filter((it: any) => it.isChecked !== false)
        .map((item: any, idx) => {
          const name = item.itemTamilName || item.itemEnglishName || item.nameTa || item.nameEn || "பொருள்";
          const unit = formatUnitTamil(item.unit);
          const qty = item.quantity ? ` — ${item.quantity} ${unit}` : "";
          return `${idx + 1}. ${name}${qty}`.trim();
        })
        .join("\n") + "\n"
    : "";

  const paymentDetails = booking.advanceAmount > 0
    ? `💰 தட்சணை: ₹${booking.totalAmount.toLocaleString("en-IN")} (முன்பணம்: ₹${booking.advanceAmount.toLocaleString("en-IN")}, மீதம்: ₹${booking.balanceAmount.toLocaleString("en-IN")})`
    : `💰 தட்சணை: ₹${booking.totalAmount.toLocaleString("en-IN")}`;

  return `🙏 *சுப முகூர்த்த பூஜை முன்பதிவு உறுதியானது* 🙏

🪔 *${booking.poojaEnglishName || booking.poojaTamilName || "பூஜை வழிபாடு"}*
${booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName ? `(${booking.poojaTamilName})\n` : ""}
📅 தேதி: *${tamilInfo.formattedDualDate}* (${tamilInfo.dayOfWeekTa})
⏰ சுப நேரம்: *${booking.startTime}*
👤 பக்தர்: *${booking.customerName || "பக்தர்"}*
📍 இடம்: *${booking.location || "இல்லம்"}*
${paymentDetails}
${itemsList}
இறைவனின் பூரண அருள் கிடைக்க மனமார்ந்த வாழ்த்துகள்! 🙏

—
*${business.name || "வேள்வி வேத பவனம்"}*
📞 தொடர்புக்கு: ${business.phone || business.whatsapp || ""}

✨ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨
_வேத முறை முன்பதிவு மேலாண்மை_`;
}

/**
 * Format a clean, respectful WhatsApp message for Tomorrow's Pooja Reminder
 */
export function formatPoojaReminderWhatsAppMessage(
  booking: Booking,
  business: Business
): string {
  const tamilInfo = getTamilDate(booking.date);
  const contactPhone = business.phone || business.whatsapp || "";

  // All checked samagri items in numbered format
  const activeItems = (booking.items || []).filter((it: any) => it.isChecked !== false);
  const itemsText =
    activeItems.length > 0
      ? `\n📋 *பூஜை சாமக்கிரி பொருட்கள்:*\n` +
        activeItems
          .map((item: any, idx: number) => {
            const name = item.itemTamilName || item.itemEnglishName || item.nameTa || item.nameEn || "பொருள்";
            const unit = formatUnitTamil(item.unit);
            const qty = item.quantity ? ` — ${item.quantity} ${unit}` : "";
            return `${idx + 1}. ${name}${qty}`.trim();
          })
          .join("\n") +
        "\n"
      : "";

  const balanceText =
    booking.balanceAmount > 0
      ? `\n💰 *மீதமுள்ள தட்சணை:* ₹${booking.balanceAmount.toLocaleString("en-IN")}\n`
      : "";

  return `🙏 *லோகா: ஸமஸ்தா: ஸுகினோ பவந்து*

அன்புள்ள *${booking.customerName || "பக்தர்"}* அவர்களுக்கு,

நாளை உங்கள் இல்லத்தில் நடைபெற உள்ள சுப முகூர்த்த பூஜை நினைவூட்டல்:

🪔 *பூஜை:* ${booking.poojaTamilName || booking.poojaEnglishName}
📅 *தேதி:* ${tamilInfo.tamilMonth} ${tamilInfo.tamilDay} (${tamilInfo.dayOfWeekTa}) • ${booking.date}
⏰ *நேரம்:* ${booking.startTime}${booking.endTime ? ` – ${booking.endTime}` : ""}
📍 *இடம்:* ${booking.location || "உங்கள் இல்லம்"}
${itemsText}${balanceText}
தயவுசெய்து பூஜை தொடங்குவதற்கு முன் ஏற்பாடுகளை தயார் நிலையில் வைத்திருக்கவும்.
${contactPhone ? `\n📞 *தொடர்புக்கு:* ${contactPhone}` : ""}

—
*${business.name || "வேள்வி வேத பவனம்"}*
✨ 𝓥𝓮𝓵𝓿𝓲 𝓐𝓹𝓹 ✨
_வேத முறை முன்பதிவு மேலாண்மை_`;
}
