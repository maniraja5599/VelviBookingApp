import { chromium } from "playwright-core";
import path from "path";

const ARTIFACT_DIR = "C:/Users/manir/.gemini/antigravity/brain/c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // 1. Settings page footer
  console.log("Navigating to /app/settings...");
  await page.goto("http://127.0.0.1:3000/app/settings", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "devcredit_settings_footer.png") });
  console.log("Captured devcredit_settings_footer.png");

  // 2. More page footer
  console.log("Navigating to /app/more...");
  await page.goto("http://127.0.0.1:3000/app/more", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "devcredit_more_footer.png") });
  console.log("Captured devcredit_more_footer.png");

  // 3. Login page footer
  console.log("Navigating to /login...");
  await page.goto("http://127.0.0.1:3000/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "devcredit_login_footer.png") });
  console.log("Captured devcredit_login_footer.png");

  await browser.close();
  console.log("All developer credit screenshots captured!");
}

main().catch(console.error);
