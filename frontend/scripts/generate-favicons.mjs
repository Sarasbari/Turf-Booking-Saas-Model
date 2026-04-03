/**
 * Generate professional favicon set from the TurfHub logo.
 * 
 * Extracts ONLY the circular ball logo from the center,
 * removes the dark background to make it transparent,
 * then generates all favicon sizes.
 */
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'logo-original.jpg');

async function generateFavicons() {
  console.log('🎨 Generating TurfHub favicon set (ball only, transparent bg)...\n');

  const metadata = await sharp(SOURCE).metadata();
  console.log(`  Source: ${metadata.width}x${metadata.height} ${metadata.format}`);

  // The ball logo is centered in the image.
  // Image is 1024x682. The ball is approximately 380px diameter, centered.
  // We need to crop a tight square around just the ball.
  const imgW = metadata.width;   // 1024
  const imgH = metadata.height;  // 682
  
  // Ball center is roughly at center of image
  const centerX = Math.round(imgW / 2);
  const centerY = Math.round(imgH / 2);
  
  // Ball diameter is roughly 56% of image height
  const ballDiameter = Math.round(imgH * 0.58);
  const cropSize = ballDiameter + 10; // small padding
  
  const left = Math.round(centerX - cropSize / 2);
  const top = Math.round(centerY - cropSize / 2);

  console.log(`  Cropping ball: ${cropSize}x${cropSize} from (${left}, ${top})`);

  // Step 1: Crop tightly around the ball
  const croppedBuffer = await sharp(SOURCE)
    .extract({ left, top, width: cropSize, height: cropSize })
    .png()
    .toBuffer();

  // Step 2: Remove dark background — make near-black pixels transparent
  // We'll use a threshold approach: convert to raw, make dark pixels transparent
  const cropped = sharp(croppedBuffer);
  const { data, info } = await cropped
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const output = Buffer.alloc(data.length);

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    // Calculate distance from center of the image (for circular mask)
    const px = (i / channels) % width;
    const py = Math.floor((i / channels) / width);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(width, height) / 2 - 4; // slightly inside edges
    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);

    // Outside the circular region → fully transparent
    if (dist > radius) {
      output[i] = 0;
      output[i + 1] = 0;
      output[i + 2] = 0;
      output[i + 3] = 0;
      continue;
    }

    // Soft edge (anti-aliasing) — smooth transition at the edge
    const edgeWidth = 3;
    let alpha = 255;
    if (dist > radius - edgeWidth) {
      alpha = Math.round(255 * (radius - dist) / edgeWidth);
      alpha = Math.max(0, Math.min(255, alpha));
    }

    // Inside the circle: check if pixel is very dark (background leak)
    // Only make transparent if it's dark AND near the edge
    const brightness = (r + g + b) / 3;
    const distFromEdge = radius - dist;
    
    if (brightness < 30 && distFromEdge < 15) {
      // Dark pixel near edge — likely background bleed
      output[i] = 0;
      output[i + 1] = 0;
      output[i + 2] = 0;
      output[i + 3] = 0;
    } else {
      output[i] = r;
      output[i + 1] = g;
      output[i + 2] = b;
      output[i + 3] = alpha;
    }
  }

  const transparentBall = await sharp(output, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();

  console.log('  ✅ Circular ball extracted with transparent background');

  // Step 3: Generate all favicon sizes
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 },
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'mstile-150x150.png', size: 150 },
    { name: 'og-logo.png', size: 512 },
  ];

  for (const { name, size: s } of sizes) {
    await sharp(transparentBall)
      .resize(s, s, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ quality: 100 })
      .toFile(path.join(PUBLIC, name));
    console.log(`  ✅ ${name} (${s}x${s})`);
  }

  // Step 4: Generate favicon.ico
  await sharp(transparentBall)
    .resize(48, 48, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.ico'));
  console.log('  ✅ favicon.ico (48x48)');

  // Step 5: Web app manifest (already exists, just verify)
  const manifest = {
    name: 'TurfHub',
    short_name: 'TurfHub',
    description: "India's Smartest Turf Booking Platform — Book, Play, Repeat.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  fs.writeFileSync(path.join(PUBLIC, 'site.webmanifest'), JSON.stringify(manifest, null, 2));
  console.log('  ✅ site.webmanifest');

  // Step 6: browserconfig.xml
  const browserconfig = `<?xml version="1.0" encoding="utf-8"?>
<browserconfig>
  <msapplication>
    <tile>
      <square150x150logo src="/mstile-150x150.png"/>
      <TileColor>#16a34a</TileColor>
    </tile>
  </msapplication>
</browserconfig>`;
  fs.writeFileSync(path.join(PUBLIC, 'browserconfig.xml'), browserconfig);
  console.log('  ✅ browserconfig.xml');

  console.log('\n🎉 All favicons generated — ball logo only, no black background!');
}

generateFavicons().catch(console.error);
