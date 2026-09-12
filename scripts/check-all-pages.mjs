import http from "http";

const routes = [
  "/",
  "/login",
  "/recover",
  "/onboarding",
  "/trial-welcome",
  "/app",
  "/app/calendar",
  "/app/bookings",
  "/app/bookings/new",
  "/app/bookings/b-8248",
  "/app/bookings/b-8248/edit",
  "/app/bookings/b-8248/assign",
  "/app/bookings/b-8248/items",
  "/app/poojas",
  "/app/customers",
  "/app/team",
  "/app/payments",
  "/app/subscription",
  "/app/referrals",
  "/app/data-backup",
  "/app/settings",
  "/app/settings/branding",
  "/app/settings/theme",
  "/app/settings/version",
  "/app/more",
  "/admin",
];

function fetchRoute(path) {
  return new Promise((resolve, reject) => {
    const req = http.get(
      `http://localhost:3000${path}`,
      { headers: { "User-Agent": "Mozilla/5.0 (Mobile; Android 12)" } },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          resolve({ status: res.statusCode, body: data });
        });
      }
    );
    req.on("error", reject);
  });
}

async function runCheck() {
  console.log("=== COMPREHENSIVE ROUTE VERIFICATION ===");
  let hasError = false;

  for (const route of routes) {
    try {
      const res = await fetchRoute(route);
      const isErrorOverlay =
        res.body.includes("Unhandled Runtime Error") ||
        res.body.includes("ReferenceError") ||
        res.body.includes("TypeError") ||
        res.body.includes("SyntaxError");

      if (res.status !== 200 || isErrorOverlay) {
        console.error(`❌ FAILED: ${route} [Status: ${res.status}] ${isErrorOverlay ? "(Contains Runtime Error Overlay)" : ""}`);
        // Print snippet of error if overlay
        if (isErrorOverlay) {
          const match = res.body.match(/<h2[^>]*>([^<]+)<\/h2>/) || res.body.match(/Error: [^\n<]+/);
          if (match) console.error(`   Error details: ${match[0]}`);
        }
        hasError = true;
      } else {
        console.log(`✅ OK (200): ${route}`);
      }
    } catch (err) {
      console.error(`❌ CONNECTION ERROR: ${route} -> ${err.message}`);
      hasError = true;
    }
  }

  if (hasError) {
    console.error("\n❌ Some routes failed verification!");
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL ${routes.length} ROUTES VERIFIED SUCCESSFULLY WITH ZERO ERRORS!`);
    process.exit(0);
  }
}

runCheck();
