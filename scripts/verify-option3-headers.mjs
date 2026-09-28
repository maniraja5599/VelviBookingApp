import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";

const targetDir = "C:\\Users\\manir\\.gemini\\antigravity\\brain\\42569a36-b3b1-4bf8-bea9-890f98cf5511";

async function verify() {
  console.log("🚀 Launching Headless Chrome via Playwright...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile iPhone 12/13/14 viewport (390 x 844)
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1",
  });

  const page = await context.newPage();
  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));

  // 1. Authenticate via Demo Login
  console.log("Navigating to https://velvi.date/login ...");
  await page.goto("https://velvi.date/login", { waitUntil: "networkidle" });
  await page.click("#instant-demo-login-btn");
  await page.waitForURL("**/app/**", { timeout: 20000 });
  console.log("Logged in! Current page:", page.url());

  // 2. Navigate to https://velvi.date/app/bookings (hard reload / bypass cache)
  console.log("Navigating to https://velvi.date/app/bookings ...");
  await page.goto("https://velvi.date/app/bookings", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });

  console.log("Inspecting Bookings page at:", page.url());
  const bookingsInspection = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : "";
    const h1 = document.querySelector("h1")?.innerText;
    return {
      h1,
      hasDiyaMonogram: Boolean(text.includes("🪔")),
      hasTitleBookings: Boolean(text.includes("Bookings")),
      hasActivityBtn: Boolean(text.includes("Activity")),
      hasNewBtn: Boolean(text.includes("+ New")),
      hasTotalDakshina: Boolean(text.includes("Total Dakshina")),
      hasDueBalance: Boolean(text.includes("Due Balance")),
      hasUpcoming: Boolean(text.includes("Upcoming")),
    };
  });
  console.log("Bookings Inspection:", bookingsInspection);

  // Take screenshot: bookings_option3_header_verified.png
  const bookingsScreenshotPath = path.join(targetDir, "bookings_option3_header_verified.png");
  await page.screenshot({ path: bookingsScreenshotPath });
  console.log("Saved bookings screenshot to:", bookingsScreenshotPath);

  // 3. Navigate to https://velvi.date/app/poojas (hard reload / bypass cache)
  console.log("Navigating to https://velvi.date/app/poojas ...");
  await page.goto("https://velvi.date/app/poojas", { waitUntil: "networkidle" });
  await page.reload({ waitUntil: "networkidle" });

  console.log("Inspecting Poojas page at:", page.url());
  const poojasInspection = await page.evaluate(() => {
    const text = document.body ? document.body.innerText : "";
    const h1 = document.querySelector("h1")?.innerText;
    return {
      h1,
      hasDiyaMonogram: Boolean(text.includes("🪔")),
      hasTitlePoojasHomam: Boolean(text.includes("Poojas & Homam")),
      hasAddPoojaBtn: Boolean(text.includes("+ Add Pooja")),
      hasServicesCard: Boolean(text.includes("Services")),
      hasBookingsCard: Boolean(text.includes("Bookings")),
      hasDakshinaCard: Boolean(text.includes("Dakshina")),
    };
  });
  console.log("Poojas Inspection:", poojasInspection);

  // Take screenshot: poojas_option3_header_verified.png
  const poojasScreenshotPath = path.join(targetDir, "poojas_option3_header_verified.png");
  await page.screenshot({ path: poojasScreenshotPath });
  console.log("Saved poojas screenshot to:", poojasScreenshotPath);

  await browser.close();
  console.log("Done verification!");
}

verify().catch(console.error);
