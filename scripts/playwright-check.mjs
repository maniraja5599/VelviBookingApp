import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pagesToCheck = [
  { path: "/app", name: "Dashboard" },
  { path: "/app/settings", name: "Settings" },
  { path: "/app/settings/branding", name: "Branding" },
  { path: "/app/settings/version", name: "Version & Updates" },
  { path: "/app/settings/theme", name: "Theme" },
  { path: "/app/calendar", name: "Calendar" },
  { path: "/app/bookings", name: "Bookings List" },
  { path: "/app/bookings/new", name: "New Booking" },
  { path: "/app/bookings/b-8248", name: "Booking Details" },
  { path: "/app/bookings/b-8248/edit", name: "Booking Edit" },
  { path: "/app/bookings/b-8248/items", name: "Booking Items & Flyer" },
  { path: "/app/poojas", name: "Pooja Catalog" },
  { path: "/app/customers", name: "Customers" },
  { path: "/app/team", name: "Team" },
  { path: "/app/payments", name: "Payments" },
  { path: "/app/subscription", name: "Subscription" },
  { path: "/app/referrals", name: "Referrals" },
  { path: "/app/data-backup", name: "Data & Backup" },
  { path: "/app/more", name: "More Menu" },
  { path: "/admin", name: "Super Admin" },
  { path: "/", name: "Landing" },
  { path: "/login", name: "Login" },
];

async function runBrowserTests() {
  console.log("🚀 Launching Headless Chrome via Playwright...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile iPhone 12/13/14 viewport
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  let failedPages = [];

  for (const p of pagesToCheck) {
    const url = `http://localhost:3000${p.path}`;
    const pageErrors = [];

    const onPageError = (err) => {
      pageErrors.push(err.message || String(err));
    };
    page.on("pageerror", onPageError);

    try {
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
      await page.waitForTimeout(500); // Allow hydration

      // Check for Next.js error overlay or react crash
      const hasErrorOverlay = await page.evaluate(() => {
        const overlay = document.querySelector("nextjs-portal, [data-nextjs-dialog-overlay]");
        const text = document.body ? document.body.innerText : "";
        const hasText = text.includes("Unhandled Runtime Error") || text.includes("ReferenceError:");
        return Boolean(overlay || hasText);
      });

      if (response.status() !== 200 || hasErrorOverlay || pageErrors.length > 0) {
        console.error(`❌ [FAIL] ${p.name} (${p.path}):`);
        if (response.status() !== 200) console.error(`   HTTP Status: ${response.status()}`);
        if (hasErrorOverlay) console.error(`   Next.js Runtime Error Overlay Detected!`);
        if (pageErrors.length > 0) console.error(`   Errors:`, pageErrors);
        failedPages.push(p);
      } else {
        console.log(`✅ [PASS] ${p.name} (${p.path}) — Status 200, 0 errors, Hydrated!`);
      }
    } catch (err) {
      console.error(`❌ [EXCEPTION] ${p.name} (${p.path}): ${err.message}`);
      failedPages.push(p);
    } finally {
      page.off("pageerror", onPageError);
    }
  }

  // 1. Take a screenshot of /app to verify the updated Top Mobile Header
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  const dashPath = path.join(__dirname, "dashboard-header-verified.png");
  await page.screenshot({ path: dashPath });
  console.log(`📸 Captured dashboard header screenshot: ${dashPath}`);

  // 2. Take a screenshot of /app/settings to verify developer credit & clean footer
  await page.goto("http://localhost:3000/app/settings", { waitUntil: "networkidle" });
  const settingsPath = path.join(__dirname, "settings-verified.png");
  await page.screenshot({ path: settingsPath });
  console.log(`📸 Captured settings verification screenshot: ${settingsPath}`);

  // 3. Take a screenshot of /app/more
  await page.goto("http://localhost:3000/app/more", { waitUntil: "networkidle" });
  const morePath = path.join(__dirname, "more-verified.png");
  await page.screenshot({ path: morePath });
  console.log(`📸 Captured more menu verification screenshot: ${morePath}`);

  await browser.close();

  if (failedPages.length > 0) {
    console.error(`\n❌ ${failedPages.length} pages failed!`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${pagesToCheck.length} PAGES PASSED BROWSER HYDRATION & RUNTIME CHECKS!`);
    process.exit(0);
  }
}

runBrowserTests().catch((err) => {
  console.error("FATAL PLAYWRIGHT RUNNER ERROR:", err);
  process.exit(1);
});
