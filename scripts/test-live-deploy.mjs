import { chromium } from "playwright-core";
import path from "path";

const ARTIFACT_DIR = "C:/Users/manir/.gemini/antigravity/brain/c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function verifyLive() {
  console.log("Launching Chrome to test live deployment: https://velvi-booking-app.vercel.app...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile view
  });
  const page = await context.newPage();

  // Open live root URL
  console.log("Navigating to https://velvi-booking-app.vercel.app...");
  await page.goto("https://velvi-booking-app.vercel.app", { waitUntil: "networkidle" });

  // Wait for /app redirect and dashboard elements
  await page.waitForURL("**/app**", { timeout: 15000 });
  console.log("✓ Successfully auto-redirected to /app without requiring any login!");

  // Wait for user greeting on dashboard
  await page.waitForSelector("text=Ravi Iyer");
  console.log("✓ Live Dashboard loaded with logged-in user Ravi Iyer!");

  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "live_deployed_app_dashboard.png"),
    fullPage: true,
  });

  console.log("Live deployment verification successfully completed!");
  await browser.close();
}

verifyLive().catch((err) => {
  console.error("Live test failed:", err);
  process.exit(1);
});
