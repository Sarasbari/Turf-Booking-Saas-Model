/**
 * Worker Entry Point
 *
 * Starts all BullMQ workers as a long-running process.
 * Run with: npm run worker
 *
 * This is SEPARATE from the Express server — workers need a persistent
 * process, whereas the API can run on Vercel serverless.
 *
 * In production, deploy this to Railway/Render/VPS alongside the API.
 */

import dotenv from 'dotenv';
dotenv.config();

// Import workers — they self-register on import
import emailWorker from './workers/emailWorker.js';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  aLiveHub — BullMQ Workers');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`  Email worker: ${emailWorker ? '✅ active' : '❌ disabled'}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Keep process alive
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down workers...');
  if (emailWorker) await emailWorker.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down workers...');
  if (emailWorker) await emailWorker.close();
  process.exit(0);
});
