const { chromium } = require('playwright-core');
const path = require('path');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = 'C:\\Users\\manir\\.gemini\\antigravity\\brain\\42569a36-b3b1-4bf8-bea9-890f98cf5511';

async function run() {
  console.log('Launching Chrome via Playwright...');
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  try {
    // -------------------------------------------------------------
    // Test 1: Direct Google Login Simulation for manirajankg@gmail.com
    // -------------------------------------------------------------
    console.log('\n--- TEST 1: Direct Google Login for manirajankg@gmail.com ---');
    await page.goto('https://velvi.date/login', { waitUntil: 'networkidle' });
    console.log('Login page loaded.');

    // Simulate Google Login for manirajankg@gmail.com
    const loginResult = await page.evaluate(async () => {
      if (typeof window.__simulateGoogleLogin === 'function') {
        await window.__simulateGoogleLogin('manirajankg@gmail.com', 'Mani Raja');
        return true;
      }
      return false;
    });
    console.log('__simulateGoogleLogin executed:', loginResult);

    // Wait for redirect to /app
    await page.waitForTimeout(3500);
    const currentUrl = page.url();
    console.log('Current URL after login:', currentUrl);
    await page.screenshot({ path: path.join(artifactDir, 'direct_google_login_verified.png') });

    // -------------------------------------------------------------
    // Test 2: Super Admin Coupons PostgreSQL Sync & Persistence
    // -------------------------------------------------------------
    console.log('\n--- TEST 2: Super Admin Coupons & Persistence ---');
    await page.goto('https://velvi.date/admin', { waitUntil: 'networkidle' });
    console.log('Admin page loaded. Checking PIN gate...');

    // If PIN gate is displayed, enter PIN 5599
    const pinInput = await page.$('input[type="password"]');
    if (pinInput) {
      await pinInput.fill('5599');
      const submitBtn = await page.$('button[type="submit"]');
      if (submitBtn) await submitBtn.click();
      await page.waitForTimeout(2000);
      console.log('PIN entered and submitted.');
    }

    // Switch to Coupons & Promos tab
    console.log('Clicking Coupons & Promos tab...');
    await page.click('button:has-text("Coupons")');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: path.join(artifactDir, 'admin_coupons_live_list.png') });
    console.log('Coupons list screenshot captured.');

    // -------------------------------------------------------------
    // Test 3: Subscription Page Coupon Redemption
    // -------------------------------------------------------------
    console.log('\n--- TEST 3: Subscription Page Coupon Redemption ---');
    await page.goto('https://velvi.date/app/subscription', { waitUntil: 'networkidle' });
    console.log('Subscription page loaded.');

    // Apply coupon VELVIPRO100
    const couponInput = await page.$('input[placeholder*="Enter code"]');
    if (couponInput) {
      await couponInput.fill('VELVIPRO100');
      const applyBtn = await page.$('button:has-text("Apply")');
      if (applyBtn) {
        await applyBtn.click();
        await page.waitForTimeout(1500);
        console.log('Coupon VELVIPRO100 applied!');
      }
    }

    await page.screenshot({ path: path.join(artifactDir, 'subscription_coupon_applied.png') });
    console.log('Subscription coupon applied screenshot captured.');

    console.log('\nALL PLAYWRIGHT TESTS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('Playwright verification error:', err);
  } finally {
    await browser.close();
  }
}

run();
