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
${business.iyerName ? `Priest: ${business.iyerName}\n` : ""}Contact: ${business.phone}
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
${booking.assignedIyerName ? `🪔 Assigned Priest: *${booking.assignedIyerName}*` : ""}

Thank you!

—
*${business.name}*
Contact: ${business.phone}
${business.showWatermark ? "\n_Powered by Velvi App_" : ""}`;
}
