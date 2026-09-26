import { NextRequest, NextResponse } from "next/server";
import { cleanCityName, cleanCountryName } from "@/lib/utils/location";

export async function GET(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  let ip =
    cfConnectingIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    realIp ||
    "";

  const isLoopback = !ip || ip === "::1" || ip === "127.0.0.1" || ip === "localhost";
  if (isLoopback) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data?.ip) ip = data.ip;
      }
    } catch {
      ip = "127.0.0.1";
    }
  }

  // Header-based geo resolution (Vercel / Cloudflare edge)
  let city =
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("cf-ipcity") ||
    "";
  let country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "";
  let region =
    req.headers.get("x-vercel-ip-country-region") ||
    req.headers.get("cf-region") ||
    "";

  // If geo headers are missing and we have a valid public IP, do a lightweight lookup
  if ((!city || !country) && ip && ip !== "127.0.0.1") {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,regionName`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          city = geoData.city || city;
          country = geoData.country || country;
          region = geoData.regionName || region;
        }
      }
    } catch {
      // Fallback gracefully on timeout/offline
    }
  }

  // Clean and sanitize city and country names
  city = cleanCityName(city);
  country = cleanCountryName(country);

  // Defaults if still empty
  if (!city) city = ip === "127.0.0.1" ? "Localhost" : "Namakkal";
  if (!country) country = "India";
  if (!region) region = "Tamil Nadu";

  return NextResponse.json({
    ip: ip || "127.0.0.1",
    city,
    country,
    region,
  });
}
