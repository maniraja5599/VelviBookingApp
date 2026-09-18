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

  // 1. Check Pooja Create Modal
  console.log("Navigating to Poojas page...");
  await page.goto("http://localhost:3000/app/poojas", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const addPoojaBtn = await page.locator("button:has-text('புதிய பூஜை சேர்க்க'), button:has-text('Add Pooja')").first();
  await addPoojaBtn.click();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, "pooja_form_optional_names.png") });
  console.log("Captured pooja_form_optional_names.png");

  // 2. Check Bookings New Page Quick Add Pooja Modal
  console.log("Navigating to New Booking page...");
  await page.goto("http://localhost:3000/app/bookings/new", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Click on the first devotee in list
  const devoteeItem = await page.locator(".cursor-pointer:has-text('+91')").first();
  if (await devoteeItem.isVisible()) {
    await devoteeItem.click();
    await page.waitForTimeout(500);
  }

  // Click Next Step
  const nextBtn = await page.locator("button:has-text('Next Step'), button:has-text('அடுத்து')").first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(600);
  }

  // Open Quick Add Pooja modal
  console.log("Opening Quick Add Pooja modal...");
  const quickPoojaBtn = await page.locator("button:has-text('Add New Pooja'), button:has-text('புதிய பூஜை')").first();
  if (await quickPoojaBtn.isVisible()) {
    await quickPoojaBtn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(artifactDir, "quick_pooja_optional_names.png") });
    console.log("Captured quick_pooja_optional_names.png");
  }

  // 3. Check Admin Branding / Platform Settings
  console.log("Navigating to Super Admin page...");
  await page.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  const appNameLabel = await page.locator("label:has-text('App Name (English)')").first();
  await appNameLabel.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);

  await page.screenshot({ path: path.join(artifactDir, "admin_optional_app_names.png") });
  console.log("Captured admin_optional_app_names.png");

  await browser.close();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
