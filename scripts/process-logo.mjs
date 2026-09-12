import { chromium } from "playwright-core";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const masterPath = path.join(__dirname, "..", "public", "icons", "velvi-logo.png");
const masterBase64 = fs.readFileSync(masterPath).toString("base64");
const dataUrl = `data:image/png;base64,${masterBase64}`;

async function generateAllSizes() {
  console.log("Processing master Velvi logo into all PWA icon sizes...");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  const sizes = [
    { name: "icon-512.png", size: 512, dir: "public/icons", padding: 0 },
    { name: "icon-192.png", size: 192, dir: "public/icons", padding: 0 },
    { name: "icon-maskable-512.png", size: 512, dir: "public/icons", padding: 40 },
    { name: "icon-maskable-192.png", size: 192, dir: "public/icons", padding: 16 },
    { name: "apple-touch-icon.png", size: 180, dir: "public", padding: 10 },
    { name: "apple-touch-icon.png", size: 180, dir: "public/icons", padding: 10 },
    { name: "favicon.png", size: 64, dir: "public", padding: 0 },
  ];

  for (const item of sizes) {
    const b64 = await page.evaluate(
      async ({ dataUrl, size, padding }) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext("2d");

            // Optional background for maskable
            if (padding > 0) {
              ctx.fillStyle = "#FAF7F2";
              ctx.fillRect(0, 0, size, size);
            }

            // Draw image with padding
            ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
            resolve(canvas.toDataURL("image/png"));
          };
          img.src = dataUrl;
        });
      },
      { dataUrl, size: item.size, padding: item.padding }
    );

    const buf = Buffer.from(b64.replace(/^data:image\/png;base64,/, ""), "base64");
    const outPath = path.join(__dirname, "..", item.dir, item.name);
    fs.writeFileSync(outPath, buf);
    console.log(`✅ Generated ${outPath} (${item.size}x${item.size})`);
  }

  await browser.close();
  console.log("🎉 All PWA icons generated from master Velvi artwork!");
}

generateAllSizes().catch(console.error);
