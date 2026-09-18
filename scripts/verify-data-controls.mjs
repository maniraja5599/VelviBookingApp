import { chromium } from "playwright-core";
import path from "path";

const artifactDir = "C:\\Users\\manir\\.gemini\\antigravity\\brain\\42569a36-b3b1-4bf8-bea9-890f98cf5511";

async function run() {
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const context = await browser.newContext({
    viewport: { width: 412, height: 915 },
    userAgent: "Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();

  console.log("Navigating to Settings page...");
  await page.goto("http://localhost:3000/app/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Scroll down to Data Controls
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, "settings_data_controls.png") });
  console.log("Captured settings_data_controls.png");

  // Click Clear All Data button
  console.log("Clicking Clear All Data...");
  const clearBtn = await page.locator("button:has-text('Clear All Data'), button:has-text('முழுமையாக நீக்கு')").first();
  await clearBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, "settings_clear_modal.png") });
  console.log("Captured settings_clear_modal.png");

  // Confirm Clear
  const confirmClearBtn = await page.locator("button:has-text('Yes, Clear'), button:has-text('ஆம், அனைத்தையும் நீக்கு')").first();
  await confirmClearBtn.click();
  await page.waitForTimeout(1000);

  // Navigate to Home page to verify zero data
  console.log("Navigating to Home to check zero data state...");
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(artifactDir, "home_cleared_empty.png") });
  console.log("Captured home_cleared_empty.png");

  // Navigate back to Settings
  console.log("Navigating back to Settings...");
  await page.goto("http://localhost:3000/app/settings", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });
  await page.waitForTimeout(500);

  // Click Load Sample Data button
  console.log("Clicking Load Sample Data...");
  const loadBtn = await page.locator("button:has-text('Load Sample Data')").first();
  await loadBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, "settings_load_modal.png") });
  console.log("Captured settings_load_modal.png");

  // Confirm Load
  const confirmLoadBtn = await page.locator("button:has-text('Yes, Load Data'), button:has-text('ஆம், மாதிரி தரவை ஏற்று')").first();
  await confirmLoadBtn.click();
  await page.waitForTimeout(1000);

  // Navigate to Home page to verify restored data
  console.log("Navigating to Home to check restored state...");
  await page.goto("http://localhost:3000/app", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  await page.screenshot({ path: path.join(artifactDir, "home_reloaded_data.png") });
  console.log("Captured home_reloaded_data.png");

  await browser.close();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Error in verification script:", err);
  process.exit(1);
});
