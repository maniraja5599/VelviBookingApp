import { NextRequest, NextResponse } from "next/server";
import { Client } from "pg";
import { TrafficSourceType, WebTrafficLog } from "@/lib/types";

export const dynamic = "force-dynamic";

// In-memory cache fallback if DB is temporarily connecting
const memoryTrafficLogs: WebTrafficLog[] = [];

function classifyTrafficSource(
  referrer: string = "",
  utmSource: string = "",
  pagePath: string = ""
): { source: TrafficSourceType; name: string } {
  const ref = (referrer || "").toLowerCase();
  const utm = (utmSource || "").toLowerCase();

  // 1. UTM tag priority
  if (utm.includes("whatsapp") || utm === "wa") {
    return { source: "WHATSAPP", name: "WhatsApp Share Link" };
  }
  if (utm.includes("instagram") || utm === "ig") {
    return { source: "INSTAGRAM", name: "Instagram Bio / Story" };
  }
  if (utm.includes("facebook") || utm === "fb") {
    return { source: "FACEBOOK", name: "Facebook Post / Ad" };
  }
  if (utm.includes("google") || utm.includes("adwords") || utm === "search") {
    return { source: "GOOGLE", name: "Google Search (Organic / Paid)" };
  }
  if (utm.includes("youtube") || utm === "yt") {
    return { source: "YOUTUBE", name: "YouTube Video Link" };
  }
  if (utm.includes("twitter") || utm === "x") {
    return { source: "TWITTER", name: "X / Twitter Link" };
  }

  // 2. Referrer domain checks
  if (ref.includes("whatsapp") || ref.includes("api.whatsapp.com") || ref.includes("web.whatsapp.com")) {
    return { source: "WHATSAPP", name: "WhatsApp Share Link" };
  }
  if (ref.includes("instagram.com")) {
    return { source: "INSTAGRAM", name: "Instagram Social Bio" };
  }
  if (ref.includes("facebook.com") || ref.includes("fb.com") || ref.includes("m.facebook.com")) {
    return { source: "FACEBOOK", name: "Facebook Community Post" };
  }
  if (ref.includes("google.") || ref.includes("googlequicksearchbox")) {
    return { source: "GOOGLE", name: "Google Search (Organic)" };
  }
  if (ref.includes("youtube.com") || ref.includes("youtu.be")) {
    return { source: "YOUTUBE", name: "YouTube Link" };
  }
  if (ref.includes("t.co") || ref.includes("twitter.com") || ref.includes("x.com")) {
    return { source: "TWITTER", name: "X / Twitter Post" };
  }

  // 3. Direct or internal navigation
  if (!ref || ref === "direct" || ref.includes("velvi.date") || ref.includes("localhost")) {
    return { source: "DIRECT", name: "Direct Website (velvi.date)" };
  }

  // 4. External referral site
  try {
    const parsedUrl = new URL(referrer);
    return { source: "REFERRAL", name: `Referral (${parsedUrl.hostname})` };
  } catch {
    return { source: "OTHER", name: "External Web Traffic" };
  }
}

async function resolveClientGeo(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip");

  let ip =
    cfConnectingIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    realIp ||
    "127.0.0.1";

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

  // Lightweight geo lookup if public IP and headers missing
  if ((!city || !country) && ip && ip !== "127.0.0.1" && !ip.startsWith("192.168.") && !ip.startsWith("10.")) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,city,country,regionName`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (res.ok) {
        const data = await res.json();
        if (data.status === "success") {
          city = data.city || city;
          country = data.country || country;
          region = data.regionName || region;
        }
      }
    } catch {
      // Ignore lookup timeouts
    }
  }

  if (!city) city = ip === "127.0.0.1" ? "Localhost" : "Chennai";
  if (!country) country = "India";
  if (!region) region = "Tamil Nadu";

  return { ip, city, country, region };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ip, city, country, region } = await resolveClientGeo(req);

    const userAgent = req.headers.get("user-agent") || body.userAgent || "";
    const referrer = body.referrer || req.headers.get("referer") || "direct";
    const utmSource = body.utmSource || "";
    const utmMedium = body.utmMedium || "";
    const utmCampaign = body.utmCampaign || "";
    const pagePath = body.pagePath || "/";
    const pageTitle = body.pageTitle || "Velvi";
    const deviceType = body.deviceType || (userAgent.includes("Mobile") ? "MOBILE" : "DESKTOP");
    const browser = body.browser || (userAgent.includes("Chrome") ? "Chrome" : userAgent.includes("Safari") ? "Safari" : "Browser");
    const os = body.os || (userAgent.includes("Android") ? "Android" : userAgent.includes("iPhone") ? "iOS" : userAgent.includes("Windows") ? "Windows" : "OS");
    const screenResolution = body.screenResolution || "Unknown";
    const language = body.language || req.headers.get("accept-language")?.split(",")[0] || "en-IN";
    const visitorSessionId = body.visitorSessionId || `sess-${Date.now()}`;
    const isLoggedIn = Boolean(body.isLoggedIn);
    const userEmail = body.userEmail || null;

    const { source, name: sourceName } = classifyTrafficSource(referrer, utmSource, pagePath);

    const log: WebTrafficLog = {
      id: `traffic-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ip,
      city,
      region,
      country,
      countryCode: country === "India" ? "IN" : country.slice(0, 2).toUpperCase(),
      referrer,
      trafficSource: source,
      sourceName,
      utmSource: utmSource || undefined,
      utmMedium: utmMedium || undefined,
      utmCampaign: utmCampaign || undefined,
      pagePath,
      pageTitle,
      deviceType,
      browser,
      os,
      screenResolution,
      language,
      visitorSessionId,
      isLoggedIn,
      userEmail: userEmail || undefined,
      createdAt: new Date().toISOString(),
    };

    // Store in memory cache
    memoryTrafficLogs.unshift(log);
    if (memoryTrafficLogs.length > 500) memoryTrafficLogs.pop();

    // Persist to Postgres database if available
    const connectionString = process.env.DATABASE_URL;
    if (connectionString) {
      try {
        const client = new Client({
          connectionString,
          ssl: { rejectUnauthorized: false },
        });
        await client.connect();

        await client.query(`
          CREATE TABLE IF NOT EXISTS web_traffic_logs (
            id VARCHAR(64) PRIMARY KEY,
            ip VARCHAR(64),
            city VARCHAR(100),
            region VARCHAR(100),
            country VARCHAR(100),
            referrer TEXT,
            traffic_source VARCHAR(50),
            source_name VARCHAR(100),
            utm_source VARCHAR(100),
            utm_medium VARCHAR(100),
            utm_campaign VARCHAR(100),
            page_path VARCHAR(255),
            page_title VARCHAR(255),
            device_type VARCHAR(20),
            browser VARCHAR(50),
            os VARCHAR(50),
            screen_resolution VARCHAR(50),
            language VARCHAR(50),
            visitor_session_id VARCHAR(100),
            is_logged_in BOOLEAN DEFAULT FALSE,
            user_email VARCHAR(255),
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `);

        await client.query(
          `INSERT INTO web_traffic_logs (
            id, ip, city, region, country, referrer, traffic_source, source_name,
            utm_source, utm_medium, utm_campaign, page_path, page_title,
            device_type, browser, os, screen_resolution, language,
            visitor_session_id, is_logged_in, user_email, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
          ON CONFLICT (id) DO NOTHING;`,
          [
            log.id,
            log.ip,
            log.city,
            log.region,
            log.country,
            log.referrer,
            log.trafficSource,
            log.sourceName,
            log.utmSource || null,
            log.utmMedium || null,
            log.utmCampaign || null,
            log.pagePath,
            log.pageTitle || null,
            log.deviceType,
            log.browser,
            log.os,
            log.screenResolution || null,
            log.language || null,
            log.visitorSessionId,
            log.isLoggedIn,
            log.userEmail || null,
            log.createdAt,
          ]
        );

        await client.end().catch(() => {});
      } catch (dbErr) {
        console.warn("[API /api/traffic] DB write warning:", dbErr);
      }
    }

    return NextResponse.json({ success: true, log });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to log traffic." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  let dbLogs: WebTrafficLog[] = [];
  const connectionString = process.env.DATABASE_URL;

  if (connectionString) {
    try {
      const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
      });
      await client.connect();

      // Check if table exists
      const tableCheck = await client.query(`
        SELECT to_regclass('public.web_traffic_logs') as tbl;
      `);

      if (tableCheck.rows[0]?.tbl) {
        const res = await client.query(`
          SELECT 
            id, ip, city, region, country, referrer, traffic_source as "trafficSource",
            source_name as "sourceName", utm_source as "utmSource", utm_medium as "utmMedium",
            utm_campaign as "utmCampaign", page_path as "pagePath", page_title as "pageTitle",
            device_type as "deviceType", browser, os, screen_resolution as "screenResolution",
            language, visitor_session_id as "visitorSessionId", is_logged_in as "isLoggedIn",
            user_email as "userEmail", created_at as "createdAt"
          FROM web_traffic_logs
          ORDER BY created_at DESC
          LIMIT 300;
        `);
        dbLogs = res.rows;
      }

      await client.end().catch(() => {});
    } catch (err) {
      console.warn("[API /api/traffic] DB read warning:", err);
    }
  }

  // Combine DB logs with memory logs (deduplicating by ID)
  const combinedMap = new Map<string, WebTrafficLog>();
  for (const log of dbLogs) {
    combinedMap.set(log.id, log);
  }
  for (const log of memoryTrafficLogs) {
    if (!combinedMap.has(log.id)) {
      combinedMap.set(log.id, log);
    }
  }

  const allLogs = Array.from(combinedMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Compute aggregated stats
  const totalViews = allLogs.length;
  const uniqueVisitors = new Set(allLogs.map((l) => l.visitorSessionId || l.ip)).size;

  const sourcesBreakdown: Record<string, number> = {};
  const topPages: Record<string, number> = {};
  const topCities: Record<string, number> = {};
  const devicesBreakdown: Record<string, number> = { MOBILE: 0, DESKTOP: 0, TABLET: 0, BOT: 0 };

  for (const l of allLogs) {
    const src = l.trafficSource || "DIRECT";
    sourcesBreakdown[src] = (sourcesBreakdown[src] || 0) + 1;

    const path = l.pagePath || "/";
    topPages[path] = (topPages[path] || 0) + 1;

    const loc = `${l.city || "Chennai"}, ${l.country || "India"}`;
    topCities[loc] = (topCities[loc] || 0) + 1;

    const dev = (l.deviceType || "MOBILE") as keyof typeof devicesBreakdown;
    if (devicesBreakdown[dev] !== undefined) {
      devicesBreakdown[dev]++;
    } else {
      devicesBreakdown.MOBILE++;
    }
  }

  return NextResponse.json({
    success: true,
    totalViews,
    uniqueVisitors,
    sourcesBreakdown,
    topPages,
    topCities,
    devicesBreakdown,
    logs: allLogs,
    timestamp: new Date().toISOString(),
  });
}
