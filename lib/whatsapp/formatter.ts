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

/**
 * Format a WhatsApp message for Pooja Required Items list
 */
export function formatPoojaItemsWhatsAppMessage(
  booking: Booking,
  business: Business
): string {
  const tamilInfo = getTamilDate(booking.date);

  const itemsList = (booking.items || [])
    .map((item: any, idx) => {
      const name = item.itemTamilName || item.itemEnglishName || item.nameTa || item.nameEn || "Item";
      const unit = formatUnitTamil(item.unit);
      const qty = item.quantity ? ` - ${item.quantity}` : "";
      return `${idx + 1}. ${name}${qty} ${unit}`.trim();
    })
    .join("\n");

  return `🙏 *${booking.poojaEnglishName || booking.poojaTamilName || "Pooja Ceremony"}*
${booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName ? `(${booking.poojaTamilName})\n` : ""}
📅 *${tamilInfo.formattedDualDate}*
🕐 Time: *${booking.startTime}*
👤 Devotee: *${booking.customerName || "Customer"}*
📍 Location: *${booking.location}*

📋 *Required Items:*
${itemsList}

🙏 Please keep all items ready before the ceremony starts.

—
*${business.name}*
Contact: ${business.phone}
${business.showWatermark ? "\n_Powered by Velvi App_" : ""}`;
}

/**
 * Format a WhatsApp message for Booking Confirmation
 */
export function formatBookingConfirmationWhatsAppMessage(
  booking: Booking,
  business: Business
): string {
  const tamilInfo = getTamilDate(booking.date);

  return `🙏 *Booking Confirmed*

🪔 *${booking.poojaEnglishName || booking.poojaTamilName || "Pooja Ceremony"}*
${booking.poojaTamilName && booking.poojaEnglishName && booking.poojaTamilName !== booking.poojaEnglishName ? `(${booking.poojaTamilName})\n` : ""}

📅 Date: *${tamilInfo.formattedDualDate}* (${tamilInfo.dayOfWeekTa})
🕐 Time: *${booking.startTime}*
👤 Customer: *${booking.customerName || "Customer"}*
📍 Location: *${booking.location}*
💰 Total Fee: ₹${booking.totalAmount.toLocaleString("en-IN")} ${
    booking.advanceAmount > 0
      ? `(Advance: ₹${booking.advanceAmount.toLocaleString("en-IN")}, Balance: ₹${booking.balanceAmount.toLocaleString("en-IN")})`
      : ""
  }

Thank you!

—
*${business.name}*
Contact: ${business.phone}
${business.showWatermark ? "\n_Powered by Velvi App_" : ""}`;
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

  // Top 6 essential samagri items preview
  const topItems = (booking.items || []).slice(0, 6);
  const itemsText =
    topItems.length > 0
      ? `\n📋 *முக்கிய சாமக்கிரி பொருட்கள்:*\n` +
        topItems
          .map((item: any) => {
            const name = item.itemTamilName || item.itemEnglishName || item.nameTa || item.nameEn || "பொருள்";
            const qty = item.quantity ? ` (${item.quantity})` : "";
            return `  • ${name}${qty}`;
          })
          .join("\n") +
        (booking.items.length > 6 ? `\n  _(மற்றும் பிற ${booking.items.length - 6} பொருட்கள்)_` : "") +
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
🕐 *நேரம்:* ${booking.startTime}${booking.endTime ? ` – ${booking.endTime}` : ""}
📍 *இடம்:* ${booking.location || "உங்கள் இல்லம்"}
${itemsText}${balanceText}
தயவுசெய்து பூஜை தொடங்குவதற்கு முன் ஏற்பாடுகளை தயார் நிலையில் வைத்திருக்கவும்.
${contactPhone ? `\n📞 *தொடர்புக்கு:* ${contactPhone}` : ""}

—
*${business.name || "வேள்வி வேத பவனம்"}*
_நல்வாழ்த்துகளுடன் • Velvi App_`;
}
