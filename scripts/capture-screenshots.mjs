import { chromium } from "playwright-core";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const artifactDir = "C:\\Users\\manir\\.gemini\\antigravity\\brain\\c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function capture() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15",
  });
  const page = await context.newPage();

  // 1. Version page
  await page.goto("http://localhost:3000/app/settings/version", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "version_verified.png") });

  // 2. Branding page
  await page.goto("http://localhost:3000/app/settings/branding", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "branding_verified.png") });

  // 3. Dashboard
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(artifactDir, "dashboard_verified.png") });

  await browser.close();
  console.log("Captured all key screenshots to artifacts directory!");
}

capture().catch(console.error);
