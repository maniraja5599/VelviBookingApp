import { chromium } from "playwright-core";
import path from "path";

const ARTIFACT_DIR = "C:/Users/manir/.gemini/antigravity/brain/c91bc2b0-f874-4145-97f5-cdaee81924b1";

async function run() {
  console.log("Launching Chrome via Playwright...");
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 }, // Mobile iPhone 14
  });
  const page = await context.newPage();

  // 1. Check /login: Ensure NO Super Admin link exists
  console.log("1. Checking /login for absence of Super Admin link...");
  await page.goto("http://localhost:3000/login", { waitUntil: "networkidle" });
  const superAdminLink = await page.$("text=Super Admin Console");
  if (superAdminLink) {
    throw new Error("Super Admin Console link was found on /login but should be removed!");
  }
  console.log("✓ Verified: Super Admin link successfully removed from /login.");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "login_without_superadmin_link.png"),
    fullPage: true,
  });

  // 2. Test /recover: Direct lookup, No OTP, Multi-Account
  console.log("2. Testing /recover with multi-account phone number...");
  await page.click("text=Find Linked Google Mail");
  await page.waitForURL("**/recover");

  await page.fill("input[type='tel']", "+91 98765 43210");
  await page.click("button:has-text('Find Linked Google Accounts')");

  // Verify multi-account results
  await page.waitForSelector("text=Google Accounts Linked");
  const pageContent = await page.content();
  if (!pageContent.includes("ravi.iyer@gmail.com") || !pageContent.includes("ravi.temple@gmail.com")) {
    throw new Error("Multi-account search did not return expected accounts!");
  }
  console.log("✓ Verified: Both accounts (ravi.iyer and ravi.temple) displayed directly with NO OTP!");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "multi_account_recovery_results.png"),
    fullPage: true,
  });

  // 3. Test 1-tap sign-in on one of the multi-accounts
  console.log("3. Testing 1-tap sign in to second account (ravi.temple@gmail.com)...");
  const signInButtons = await page.$$("button:has-text('Sign In with this Account')");
  if (signInButtons.length >= 2) {
    await signInButtons[1].click(); // Click second account
  } else {
    await signInButtons[0].click();
  }
  await page.waitForURL("**/app**", { timeout: 10000 });
  console.log("✓ Successfully signed in to app dashboard via multi-account card!");
  await page.screenshot({
    path: path.join(ARTIFACT_DIR, "dashboard_logged_in_multi_account.png"),
    fullPage: true,
  });

  // 4. Test /admin platform branding and system updates
  console.log("4. Testing /admin Platform Branding & System Updates...");
  const adminContext = await browser.newContext({
    viewport: { width: 1200, height: 900 }, // Desktop view for Admin portal
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto("http://localhost:3000/admin", { waitUntil: "networkidle" });

  await adminPage.waitForSelector("text=Platform Branding & System Updates");
  console.log("✓ Platform Branding & System Updates module is present on /admin!");

  // Change announcement and app name
  await adminPage.fill("input[placeholder*='Happy Vinayagar Chaturthi']", "Vedic Navarathri Homam Bookings Now Open! 🪔");
  await adminPage.click("button:has-text('Save Platform Settings & Updates')");

  await adminPage.waitForSelector("text=Platform Branding, App Logo & System Updates have been saved");
  console.log("✓ Successfully saved platform settings and verified success alert on /admin!");

  await adminPage.screenshot({
    path: path.join(ARTIFACT_DIR, "admin_platform_branding_and_updates.png"),
    fullPage: true,
  });

  console.log("All verifications successfully completed!");
  await browser.close();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
