/**
 * Universal Location & City Sanitizer for Velvi
 *
 * Resolves encoding anomalies, Vercel/Cloudflare URL-encoded headers (e.g. "N%C4%81makkal"),
 * strips diacritics (e.g. "Nāmakkal" -> "Namakkal"), and eliminates corrupted unicode glyphs
 * so that location text renders cleanly and consistently across all mobile devices and desktop browsers.
 */

export function cleanCityName(raw?: string | null): string {
  if (!raw) return "";

  let str = String(raw).trim();

  // 1. Decode URI-encoded characters safely (e.g. N%C4%81makkal)
  try {
    str = decodeURIComponent(str);
  } catch {
    // If malformed, try decoding percent sequences safely
    str = str.replace(/%([0-9A-Fa-f]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return "";
      }
    });
  }

  // 2. Normalize unicode diacritics to standard Latin ASCII (e.g. ā -> a, ē -> e, ī -> i, etc.)
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  // 3. Remove corrupt unicode replacement chars or mojibake glyphs
  str = str.replace(/[\uFFFD\u0000-\u001F\u007F-\u009F]/g, "");
  str = str.replace(/[ÃÂâ\?]+/g, "");

  // 4. Known Tamil Nadu & Indian City Canonicalization (eliminates odd edge-case spellings)
  const lower = str.toLowerCase();

  if (/n.*makkal/i.test(lower)) return "Namakkal";
  if (/chennai|madras/i.test(lower)) return "Chennai";
  if (/coimbatore|kovai/i.test(lower)) return "Coimbatore";
  if (/madurai/i.test(lower)) return "Madurai";
  if (/trichy|tiruch/i.test(lower)) return "Tiruchirappalli";
  if (/salem/i.test(lower)) return "Salem";
  if (/erode/i.test(lower)) return "Erode";
  if (/tiruppur|tirupur/i.test(lower)) return "Tiruppur";
  if (/karur/i.test(lower)) return "Karur";
  if (/thanjavur|tanjore/i.test(lower)) return "Thanjavur";
  if (/vellore/i.test(lower)) return "Vellore";
  if (/tirunelveli|nellai/i.test(lower)) return "Tirunelveli";
  if (/bengaluru|bangalore/i.test(lower)) return "Bengaluru";
  if (/hyderabad/i.test(lower)) return "Hyderabad";
  if (/mumbai|bombay/i.test(lower)) return "Mumbai";
  if (/delhi|new\s*delhi/i.test(lower)) return "New Delhi";

  // Clean trailing spaces and return
  return str.trim();
}

export function cleanCountryName(raw?: string | null): string {
  if (!raw) return "India";
  let str = String(raw).trim();
  try {
    str = decodeURIComponent(str);
  } catch {}
  str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (/^in$|^ind$|india/i.test(str)) return "India";
  return str || "India";
}

export function formatCleanLocation(
  city?: string | null,
  country?: string | null,
  region?: string | null
): string {
  const c = cleanCityName(city);
  const co = cleanCountryName(country);

  if (!c && !co) return "India";
  if (!c) return co;
  if (!co || co === "India") return `${c}, India`;
  return `${c}, ${co}`;
}
