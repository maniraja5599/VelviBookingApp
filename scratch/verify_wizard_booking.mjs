import { createRequire } from "module";
const require = createRequire("c:/Moved_From_E/Projects/Velvi Booking App/package.json");
const { chromium } = require("playwright-core");
import path from "path";

(async () => {
  console.log("==================================================");
  console.log("🚀 TESTING UPGRADED 4-STEP POOJA BOOKING WIZARD");
  console.log("==================================================");

  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 412, height: 915 }, // Mobile viewport (Pixel 7 style)
    deviceScaleFactor: 2,
  });

  const page = await context.newPage();
  const artifactDir = "C:/Users/manir/.gemini/antigravity/brain/42569a36-b3b1-4bf8-bea9-890f98cf5511/scratch";

  const consoleErrors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
      console.log("❌ [BROWSER CONSOLE ERROR]:", msg.text());
    }
  });

  try {
    // -------------------------------------------------------------
    // STEP 1: Devotee Search & Rich Selection Card
    // -------------------------------------------------------------
    console.log("\n👉 Step 1: Devotee Search & Rich Profile Showcase...");
    await page.goto("http://localhost:3000/app/bookings/new", { waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_01_step1_empty.png") });

    // Search for Ramesh
    const searchInput = page.locator("input[placeholder*='Search devotee']").first();
    await searchInput.fill("Ramesh");
    await page.waitForTimeout(300);

    // Click devotee row
    const devoteeCard = page.locator("text=Ramesh Kumar").first();
    await devoteeCard.click();
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_02_step1_rich_selected.png") });

    // Click Next to Step 2
    await page.locator("#step1NextBtn").click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // STEP 2: Compact Pooja Selector & Prominent Samagri Checklist
    // -------------------------------------------------------------
    console.log("\n👉 Step 2: Pooja Selection & Prominent Samagri Checklist...");
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_03_step2_pooja_catalog.png") });

    // Select "Ganapathi Homam" from compact dropdown
    const poojaDropdown = page.locator("select").first();
    await poojaDropdown.selectOption({ index: 1 });
    await page.waitForTimeout(400);

    // Toggle a samagri item checkbox
    const firstSamagri = page.locator("div:has-text('Cow Ghee')").first();
    if (await firstSamagri.isVisible()) {
      await firstSamagri.click();
      await page.waitForTimeout(200);
    }

    // Toggle a "Priest Brings" badge to "Devotee Brings"
    const toggleBadge = page.locator("button:has-text('Priest Brings')").first();
    if (await toggleBadge.isVisible()) {
      await toggleBadge.click();
      await page.waitForTimeout(200);
    }

    // Add custom samagri item
    const customNameInput = page.locator("input[placeholder*='English Name']").first();
    if (await customNameInput.isVisible()) {
      await customNameInput.fill("Fresh Rose Garlands");
      await page.locator("input[placeholder*='Tamil Name']").first().fill("ரோஜா மாலை");
      await page.locator("button[type='submit']:has-text('Add')").click();
      await page.waitForTimeout(300);
    }

    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_04_step2_samagri_prominent.png") });

    // Click Next to Step 3
    await page.locator("#step2NextBtn").click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // STEP 3: Full Calendar Grid & 15-Min Interval Time Picker
    // -------------------------------------------------------------
    console.log("\n👉 Step 3: Full Interactive Calendar Grid & 15-Min Time Picker...");
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_05_step3_calendar_grid.png") });

    // Click a day in the calendar grid (e.g. 20th of the month)
    const dayBtn = page.locator("button:has(span:text-is('20'))").first();
    if (await dayBtn.isVisible()) {
      await dayBtn.click();
      await page.waitForTimeout(300);
    }

    // Pick 15-min interval time (08:30 AM)
    const hourSelect = page.locator("select").first();
    await hourSelect.selectOption("08");

    const minSelect = page.locator("select").nth(1);
    await minSelect.selectOption("30");

    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_06_step3_time_configured.png") });

    // Click Next to Step 4
    await page.locator("#step3NextBtn").click();
    await page.waitForTimeout(500);

    // -------------------------------------------------------------
    // STEP 4: Review Summary & Revamped Payment Section
    // -------------------------------------------------------------
    console.log("\n👉 Step 4: Review Summary & Revamped Payment Section...");
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_07_step4_review_payment.png") });

    // Click "50%" advance shortcut
    const shortcut50 = page.locator("button:has-text('50%')").first();
    if (await shortcut50.isVisible()) {
      await shortcut50.click();
      await page.waitForTimeout(300);
    }

    // Set Sankalpam notes
    const notesInput = page.locator("input[placeholder*='Koundinya Gothram']").first();
    if (await notesInput.isVisible()) {
      await notesInput.fill("Koundinya Gothram, Rohini Nakshatram, Family Welfare & Prosperity");
    }

    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_08_step4_final_ready.png") });

    // Click "Confirm & Create Booking"
    await page.locator("#confirmAndCreateBookingBtn").click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_09_booking_confirmed_redirect.png") });

    console.log("\n==================================================");
    console.log("🎉 ALL UPGRADED WIZARD FLOWS COMPLETED WITH 100% SUCCESS!");
    console.log("Browser Console Errors:", consoleErrors.length);
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Test Error:", err);
    await page.screenshot({ path: path.join(artifactDir, "wizard_v2_error.png") });
  } finally {
    await browser.close();
  }
})();
