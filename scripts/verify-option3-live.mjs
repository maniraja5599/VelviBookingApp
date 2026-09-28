import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const targetDir = "C:\\Users\\manir\\.gemini\\antigravity\\brain\\42569a36-b3b1-4bf8-bea9-890f98cf5511";

async function verifyLive() {
  console.log("🚀 Launching Headless Chrome via Playwright...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile iPhone dimensions (390 x 844)
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();

  // Step 0: Set user session to authenticated Super Admin in localStorage
  console.log("Navigating to https://velvi.date/login to initialize domain context...");
  await page.goto("https://velvi.date/login", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    localStorage.setItem("velvi_active_user_id", "u-super-admin-01");
  });

  // Step 1: Navigate to https://velvi.date/app/bookings (perform hard reload Ctrl+F5 with cache bypass)
  console.log("Navigating to https://velvi.date/app/bookings (with cache bypass)...");
  await page.goto("https://velvi.date/app/bookings", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  console.log("Current URL:", page.url());

  // Step 2: Detailed verification of Option 3 Header in Pooja Bookings:
  // - Diya flame monogram badge on the left
  // - Title 'Bookings' with gold separator dot and count pill
  // - Integrated capsule control with 'Activity' and '+ New' buttons on the right
  // - 3 floating summary cards:
  //   - 'Total Dakshina' (e.g. ₹... or k) with poojas count
  //   - 'Due Balance' (in red if pending balance, else green)
  //   - 'Upcoming' with overdue count or indicator
  const bookingsVerification = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : "";
    const h1 = document.querySelector("h1")?.innerText;

    // Check Diya flame monogram
    const hasDiyaMonogram = Boolean(document.body.innerHTML.includes("🪔"));

    // Check separator dot
    const goldDot = document.querySelector("span.bg-amber-500.rounded-full");

    // Check count pill
    const countPills = Array.from(document.querySelectorAll("span")).filter(
      (el) => el.className && el.className.includes("bg-amber-100") && el.className.includes("rounded-full")
    );

    // Check Activity and + New buttons inside capsule control
    const capsule = document.querySelector(".flex.items-center.bg-white.p-1.rounded-2xl");
    const hasActivity = Boolean(capsule && capsule.innerText.includes("Activity"));
    const hasNew = Boolean(capsule && capsule.innerText.includes("+ New"));

    // Check 3 floating cards
    const totalDakshinaText = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Total Dakshina"
    );
    const dueBalanceText = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Due Balance"
    );
    const upcomingText = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Upcoming"
    );

    return {
      h1,
      hasDiyaMonogram,
      hasGoldDot: Boolean(goldDot),
      countPillFound: countPills.length > 0,
      countValue: countPills[0]?.innerText,
      hasCapsule: Boolean(capsule),
      hasActivity,
      hasNew,
      hasTotalDakshinaCard: Boolean(totalDakshinaText),
      hasDueBalanceCard: Boolean(dueBalanceText),
      hasUpcomingCard: Boolean(upcomingText),
      cardsSummaryText: text.substring(0, 450),
    };
  });
  console.log("BOOKINGS VERIFICATION RESULT:", JSON.stringify(bookingsVerification, null, 2));

  // Take screenshot: 'bookings_option3_header_verified.png'
  const bookingsScreenshotPath = path.join(targetDir, "bookings_option3_header_verified.png");
  await page.screenshot({ path: bookingsScreenshotPath });
  console.log("📸 Saved bookings screenshot to:", bookingsScreenshotPath);

  // Step 3: Navigate to https://velvi.date/app/poojas (perform hard reload)
  console.log("Navigating to https://velvi.date/app/poojas (with cache bypass)...");
  await page.goto("https://velvi.date/app/poojas", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  console.log("Current URL:", page.url());

  // Step 4: Detailed verification of Option 3 Header in Poojas & Homam Catalogue:
  // - Diya monogram on the left
  // - Title 'Poojas & Homam' with count pill
  // - '+ Add Pooja' button in capsule control
  // - 3 matching summary cards: Services count, Bookings count, Total Dakshina volume
  const poojasVerification = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : "";
    const h1 = document.querySelector("h1")?.innerText;

    // Check Diya monogram
    const hasDiyaMonogram = Boolean(document.body.innerHTML.includes("🪔"));

    // Check separator dot
    const goldDot = document.querySelector("span.bg-amber-500.rounded-full");

    // Check count pill
    const countPills = Array.from(document.querySelectorAll("span")).filter(
      (el) => el.className && el.className.includes("bg-amber-100") && el.className.includes("rounded-full")
    );

    // Check + Add Pooja button inside capsule control
    const addPoojaBtn = Array.from(document.querySelectorAll("button")).find(
      (btn) => btn.innerText && btn.innerText.includes("+ Add Pooja")
    );

    // Check 3 matching summary cards
    const servicesCard = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Services"
    );
    const bookingsCard = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Bookings"
    );
    const dakshinaCard = Array.from(document.querySelectorAll("span, div")).find((el) =>
      el.textContent?.trim() === "Dakshina"
    );

    return {
      h1,
      hasDiyaMonogram,
      hasGoldDot: Boolean(goldDot),
      countPillFound: countPills.length > 0,
      countValue: countPills[0]?.innerText,
      hasAddPoojaBtn: Boolean(addPoojaBtn),
      hasServicesCard: Boolean(servicesCard),
      hasBookingsCard: Boolean(bookingsCard),
      hasDakshinaCard: Boolean(dakshinaCard),
      summaryText: text.substring(0, 450),
    };
  });
  console.log("POOJAS VERIFICATION RESULT:", JSON.stringify(poojasVerification, null, 2));

  // Take screenshot: 'poojas_option3_header_verified.png'
  const poojasScreenshotPath = path.join(targetDir, "poojas_option3_header_verified.png");
  await page.screenshot({ path: poojasScreenshotPath });
  console.log("📸 Saved poojas screenshot to:", poojasScreenshotPath);

  await browser.close();
  console.log("✅ All verifications and screenshots successfully completed!");
}

verifyLive().catch((err) => {
  console.error("FATAL ERROR in verifyLive:", err);
  process.exit(1);
});
