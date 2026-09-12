import { chromium } from "playwright-core";
import path from "path";

const ARTIFACT_DIR = "C:/Users/manir/.gemini/antigravity/brain/c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function run() {
  console.log("Launching Chrome...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // iPhone 14 mobile viewport
  });
  const page = await context.newPage();

  console.log("1. Visiting /login...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_1_login.png"), fullPage: true });

  console.log("2. Clicking 'Find My Google Mail'...");
  await page.click("text=Find My Google Mail");
  await page.waitForURL("**/recover");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_2_step1.png"), fullPage: true });

  console.log("3. Submitting mobile number for OTP...");
  await page.fill("input[type='tel']", "+91 98765 43210");
  await page.click("button:has-text('Send OTP')");
  await page.waitForSelector("text=Enter Verification Code");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_3_step2_otp.png"), fullPage: true });

  console.log("4. Entering OTP 123456...");
  await page.fill("input[placeholder='123456']", "123456");
  await page.click("button:has-text('Verify OTP')");
  await page.waitForSelector("text=Google Mail Located!");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_4_step3_revealed.png"), fullPage: true });

  console.log("5. Clicking 'Sign In with this Google Account'...");
  await page.click("text=Sign In with this Google Account");
  await page.waitForURL("**/app**", { timeout: 10000 });
  console.log("Successfully logged in to app via recovered Google Mail!");

  console.log("6. Testing Onboarding with already-registered number...");
  // Simulate a fresh user needing onboarding
  await page.evaluate(() => {
    const newUser = {
      id: "u-test-new-google-user",
      googleId: "google-new-9999",
      email: "newuser@gmail.com",
      name: "New User",
      mobile: "",
      mobileVerified: false,
      role: "OWNER",
      referralCode: "VELVI-TEST99",
      createdAt: new Date().toISOString(),
    };
    window.velviDb.users.push(newUser);
    localStorage.setItem("velvi_active_user_id", newUser.id);
  });
  await page.goto("http://localhost:3000/onboarding", { waitUntil: "networkidle" });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_5_onboarding_fresh.png"), fullPage: true });

  // Enter an already-registered phone number (+91 98765 43211 belongs to Suresh Iyer)
  const mobileInputs = await page.$$("input[type='tel']");
  await mobileInputs[0].fill("+91 98765 43211");
  await mobileInputs[1].fill("+91 98765 43211");
  await page.fill("input[placeholder*='Sri Venkateswara']", "Om Sakthi Poojas");
  await page.fill("input[placeholder*='Ravi Iyer']", "Sundar Iyer");

  await page.click("button:has-text('Continue')");
  await page.waitForSelector("text=Mobile Number Already Registered");
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_6_onboarding_already_registered_alert.png"), fullPage: true });

  console.log("7. Clicking 'Find & Sign In with Linked Google Mail'...");
  await page.click("text=Find & Sign In with Linked Google Mail");
  await page.waitForURL("**/recover?mobile=*", { timeout: 5000 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, "google_recovery_7_prefilled_recover.png"), fullPage: true });

  console.log("All verifications complete!");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
