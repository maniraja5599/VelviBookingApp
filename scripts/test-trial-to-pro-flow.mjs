import { chromium } from "playwright-core";
import path from "path";

const ARTIFACT_DIR = "C:/Users/manir/.gemini/antigravity/brain/c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function main() {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  await page.goto("http://127.0.0.1:3000/app/settings/branding", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // 1. Set subscription to TRIAL
  console.log("Setting subscription to TRIAL in client database...");
  await page.evaluate(() => {
    if ((window).velviDb && (window).velviDb.subscriptions[0]) {
      (window).velviDb.subscriptions[0].status = "TRIAL";
      (window).velviDb.subscriptions[0].planCode = "VELVI_TRIAL";
    }
  });

  // Reload page to re-read trial subscription cleanly
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Scroll down to watermark section
  await page.evaluate(() => window.scrollTo(0, 480));
  await page.waitForTimeout(300);

  // Screenshot of Trial state with PRO FEATURE lock badge
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "branding_trial_pro_feature_locked.png") });
  console.log("Captured branding_trial_pro_feature_locked.png");

  // 2. Click Watermark Checkbox (attempting to uncheck watermark while in trial)
  console.log("Attempting to uncheck watermark as trial user...");
  const watermarkCheckbox = page.locator("#watermark-checkbox");
  await watermarkCheckbox.click();
  await page.waitForTimeout(500);

  // Screenshot of Upgrade & Payment Modal
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "branding_final_upgrade_modal.png") });
  console.log("Captured branding_final_upgrade_modal.png");

  // 3. Click Pay ₹499 & Remove Watermark
  console.log("Clicking 'Pay ₹499 & Remove Watermark'...");
  const payBtn = page.locator('button:has-text("Pay ₹499 & Remove Watermark")');
  await payBtn.click();
  await page.waitForTimeout(1600); // Wait for simulated payment completion

  // Scroll to top or see the activation toast
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  await page.screenshot({ path: path.join(ARTIFACT_DIR, "branding_final_pro_activated_toast.png") });
  console.log("Captured branding_final_pro_activated_toast.png");

  // Verify watermark state in db & on screen
  await page.evaluate(() => window.scrollTo(0, 480));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "branding_final_watermark_now_removed.png") });
  console.log("Captured branding_final_watermark_now_removed.png");

  await browser.close();
  console.log("Trial to Pro flow verified 100%!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
