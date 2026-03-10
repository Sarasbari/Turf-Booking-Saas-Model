import { adminDb } from './src/config/firebaseAdmin.js';

async function test() {
  try {
    const doc = await adminDb.collection('turf').limit(1).get();
    console.log('SUCCESS: Firestore fetched', doc.size, 'docs');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

test();
