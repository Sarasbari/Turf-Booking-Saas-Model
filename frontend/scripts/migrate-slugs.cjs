/**
 * migrate-slugs.js
 * ────────────────
 * One-time migration script to add a 'slug' field to every turf
 * document in Firestore. Run this ONCE from your local machine:
 *
 * Prerequisites:
 *   1. Install firebase-admin:  npm install firebase-admin
 *   2. Place serviceAccountKey.json in the project root
 *      (or set GOOGLE_APPLICATION_CREDENTIALS env var)
 *   3. Run:  node scripts/migrate-slugs.js
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// ── Initialize Firebase Admin ──────────────────────────────────────
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  || path.join(__dirname, '..', '..', 'backend', 'service-account.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error(
    '❌ Service account key not found at:', serviceAccountPath,
    '\n   Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccountKey.json in project root.',
    '\n\n   Also make sure you have firebase-admin installed:',
    '\n     npm install firebase-admin'
  );
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// ── Slug generator ─────────────────────────────────────────────────
function generateSlug(name, city) {
  return `${name} ${city}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ── Migration ──────────────────────────────────────────────────────
async function migrate() {
  console.log('🔄 Fetching all turf documents...');
  const snapshot = await db.collection('turf').get();

  if (snapshot.empty) {
    console.log('⚠️  No turf documents found.');
    return;
  }

  console.log(`📦 Found ${snapshot.size} turfs. Generating slugs...`);

  const seenSlugs = new Set();
  let updated = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Skip if slug already exists
    if (data.slug) {
      console.log(`  ⏭️  ${data.name} — already has slug: ${data.slug}`);
      skipped++;
      continue;
    }

    let slug = generateSlug(data.name || 'unnamed', data.city || 'unknown');

    // Handle duplicates by appending a counter
    let finalSlug = slug;
    let counter = 2;
    while (seenSlugs.has(finalSlug)) {
      finalSlug = `${slug}-${counter}`;
      counter++;
    }
    seenSlugs.add(finalSlug);

    await doc.ref.update({ slug: finalSlug });
    console.log(`  ✅ ${data.name} → ${finalSlug}`);
    updated++;
  }

  console.log(`\n🎉 Migration complete: ${updated} updated, ${skipped} skipped.`);
}

migrate().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
