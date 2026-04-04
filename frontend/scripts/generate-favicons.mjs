import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, '..', 'public');
const SOURCE = path.join(PUBLIC, 'favicon-source.png');

async function generateFavicons() {
  console.log('🎨 Generating favicons from favicon-source.png...\n');

  // 1. Trim all surrounding whitespace tightly
  const trimmed = await sharp(SOURCE)
    .trim({ threshold: 10 })
    .toBuffer();

  const meta = await sharp(trimmed).metadata();
  console.log(`  ✅ Trimmed content: ${meta.width}x${meta.height}`);

  // 2. Generate all sizes — fill 100% of the square, no padding
  const sizes = [
    { name: 'alivehub-fav-16x16.png', size: 16 },
    { name: 'alivehub-fav-32x32.png', size: 32 },
    { name: 'alivehub-fav-48x48.png', size: 48 },
    { name: 'alivehub-fav-apple-touch.png', size: 180 },
    { name: 'alivehub-fav-192x192.png', size: 192 },
    { name: 'alivehub-fav-512x512.png', size: 512 },
  ];

  for (const { name, size: s } of sizes) {
    await sharp(trimmed)
      .resize(s, s, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
      })
      .png()
      .toFile(path.join(PUBLIC, name));
    console.log(`  ✅ ${name} (${s}x${s})`);
  }

  // favicon.ico (48x48 png)
  await sharp(trimmed)
    .resize(48, 48, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    })
    .png()
    .toFile(path.join(PUBLIC, 'favicon.ico'));
  console.log('  ✅ favicon.ico (48x48)');

  console.log('\n🎉 All favicons generated from favicon-source.png!');
}

generateFavicons().catch(console.error);
