const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

// CRC32 table implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, "ascii");
  data.copy(chunk, 8);
  const toCrc = Buffer.alloc(4 + len);
  chunk.copy(toCrc, 0, 4, 8 + len);
  const crc = crc32(toCrc);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

/**
 * Generate a PNG buffer with a sacred Velvi Deepam lamp & glowing flame
 */
function generatePng(size) {
  const width = size;
  const height = size;
  const rowBytes = 1 + width * 4;
  const rawData = Buffer.alloc(rowBytes * height);

  const cx = width / 2;
  const cy = height / 2;
  const r = size * 0.44;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowBytes;
    rawData[rowOffset] = 0; // Filter: None

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Default background: Sacred deep maroon/brown (#4A2E18)
      let rCol = 74;
      let gCol = 46;
      let bCol = 24;
      let alpha = 255;

      // Rounded container outer check
      if (dist > r) {
        alpha = 0; // transparent outside rounded circle
      } else if (dist > r - 3) {
        // Gold border edge
        rCol = 212;
        gCol = 175;
        bCol = 55;
      } else {
        // Background radial glow
        const glowFactor = Math.max(0, 1 - dist / r);
        rCol = Math.min(255, Math.floor(74 + glowFactor * 40));
        gCol = Math.min(255, Math.floor(46 + glowFactor * 25));
        bCol = Math.min(255, Math.floor(24 + glowFactor * 10));

        // Draw Diya Lamp Vessel (bottom half)
        // Vessel center at cx, cy + size * 0.12
        const lampVy = (y - (cy + size * 0.12)) / (size * 0.16);
        const lampVx = (x - cx) / (size * 0.28);
        if (lampVy >= -0.2 && lampVy <= 0.8 && (lampVx * lampVx + lampVy * lampVy) <= 1.0) {
          // Gold brass diya lamp color (#D4AF37 to #B8860B)
          rCol = 212;
          gCol = 175;
          bCol = 55;
          if (lampVy < 0.1) {
            // Lamp rim highlight
            rCol = 254;
            gCol = 240;
            bCol = 138;
          }
        }

        // Draw Sacred Flame (top half)
        // Flame center at cx, cy - size * 0.10
        const flameY = (y - (cy - size * 0.10)) / (size * 0.22);
        const flameX = (x - cx) / (size * 0.14);
        const flameDist = flameX * flameX + flameY * flameY;

        if (flameY >= -1.0 && flameY <= 0.6 && flameDist <= 1.0) {
          // Flame outer: Golden orange (#F59E0B)
          rCol = 245;
          gCol = 158;
          bCol = 11;

          // Flame inner core: Brilliant white-yellow (#FFFBEB)
          if (flameDist < 0.25 && flameY > -0.7) {
            rCol = 255;
            gCol = 251;
            bCol = 235;
          } else if (flameDist < 0.55) {
            rCol = 254;
            gCol = 215;
            bCol = 170;
          }
        }
      }

      rawData[pixelOffset] = rCol;
      rawData[pixelOffset + 1] = gCol;
      rawData[pixelOffset + 2] = bCol;
      rawData[pixelOffset + 3] = alpha;
    }
  }

  // Header chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter 0
  ihdr[12] = 0; // no interlace

  const compressedData = zlib.deflateSync(rawData, { level: 9 });
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrChunk = createChunk("IHDR", ihdr);
  const idatChunk = createChunk("IDAT", compressedData);
  const iendChunk = createChunk("IEND", Buffer.alloc(0));

  return Buffer.concat([pngSig, ihdrChunk, idatChunk, iendChunk]);
}

const svgLogo = `<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#6B3A1C"/>
      <stop offset="70%" stop-color="#4A2E18"/>
      <stop offset="100%" stop-color="#2D170B"/>
    </radialGradient>
    <linearGradient id="flameGrad" x1="256" y1="90" x2="256" y2="280" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FFFDF0"/>
      <stop offset="30%" stop-color="#FDE047"/>
      <stop offset="65%" stop-color="#F59E0B"/>
      <stop offset="95%" stop-color="#DC2626"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="120" y1="280" x2="392" y2="420" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="50%" stop-color="#D4AF37"/>
      <stop offset="100%" stop-color="#92400E"/>
    </linearGradient>
    <filter id="flameGlow" x="156" y="50" width="200" height="260" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="10" result="glow"/>
      <feComposite in="SourceGraphic" in2="glow" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base Circle with Gold Halo -->
  <circle cx="256" cy="256" r="236" fill="url(#bgGrad)" stroke="#D4AF37" stroke-width="8"/>
  <circle cx="256" cy="256" r="218" stroke="#D4AF37" stroke-width="2" stroke-dasharray="8 6" opacity="0.6"/>

  <!-- Divine Flame Rays -->
  <circle cx="256" cy="180" r="90" fill="#F59E0B" opacity="0.18" filter="url(#flameGlow)"/>

  <!-- Sacred Flame -->
  <path d="M256 90 C280 145, 310 185, 310 230 C310 270, 285 295, 256 295 C227 295, 202 270, 202 230 C202 185, 232 145, 256 90 Z" fill="url(#flameGrad)" filter="url(#flameGlow)"/>
  <path d="M256 150 C268 180, 282 205, 282 230 C282 252, 270 268, 256 268 C242 268, 230 252, 230 230 C230 205, 244 180, 256 150 Z" fill="#FFFDF0"/>

  <!-- Deepam Brass Lamp Bowl -->
  <path d="M120 290 C120 290, 150 370, 256 370 C362 370, 392 290, 392 290 C392 290, 320 318, 256 318 C192 318, 120 290, 120 290 Z" fill="url(#goldGrad)" stroke="#FEF08A" stroke-width="4"/>

  <!-- Lamp Stand & Pedestal -->
  <path d="M226 370 L216 415 L170 435 C170 435, 256 448, 342 435 L296 415 L286 370 Z" fill="url(#goldGrad)" stroke="#D4AF37" stroke-width="3"/>
  <ellipse cx="256" cy="438" rx="100" ry="16" fill="#78350F" stroke="#FEF08A" stroke-width="3"/>

  <!-- Sacred Om Vignette -->
  <circle cx="256" cy="40" r="16" fill="#D4AF37" opacity="0.8"/>
</svg>`;

// Destination directory
const iconsDir = path.join(__dirname, "..", "public", "icons");
const publicDir = path.join(__dirname, "..", "public");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 1. Generate PNGs
console.log("Generating 192x192 icon...");
fs.writeFileSync(path.join(iconsDir, "icon-192.png"), generatePng(192));
fs.writeFileSync(path.join(iconsDir, "icon-maskable-192.png"), generatePng(192));

console.log("Generating 512x512 icon...");
fs.writeFileSync(path.join(iconsDir, "icon-512.png"), generatePng(512));
fs.writeFileSync(path.join(iconsDir, "icon-maskable-512.png"), generatePng(512));

console.log("Generating Apple Touch Icon...");
fs.writeFileSync(path.join(publicDir, "apple-touch-icon.png"), generatePng(180));
fs.writeFileSync(path.join(iconsDir, "apple-touch-icon.png"), generatePng(180));

// 2. Generate SVGs
console.log("Generating SVG assets...");
fs.writeFileSync(path.join(iconsDir, "logo.svg"), svgLogo);
fs.writeFileSync(path.join(publicDir, "favicon.svg"), svgLogo);

console.log("All Velvi icons successfully generated!");
