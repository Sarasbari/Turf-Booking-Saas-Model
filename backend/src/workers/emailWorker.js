/**
 * Email Worker — BullMQ Consumer
 *
 * Processes jobs from the 'emails' queue.
 * Handles: booking-confirmation, booking-reminder, booking-cancelled
 *
 * ⚠️  This worker MUST run as a persistent process:
 *   - Dev:  `npm run worker`
 *   - Prod: Deploy to Railway/Render/VPS (NOT Vercel serverless)
 *
 * Job retry: 3 attempts with exponential backoff (2s → 4s → 8s)
 * Concurrency: 5 parallel email sends
 */

import { Worker } from 'bullmq';
import { connection } from '../queues/index.js';
import { sendBookingConfirmation } from '../services/emailService.js';
import { markEmailSent } from '../services/bookingService.js';

let emailWorker = null;

if (connection) {
  emailWorker = new Worker(
    'emails',
    async (job) => {
      const startTime = Date.now();
      console.log(`📧 Processing email job: ${job.id} [${job.name}]`);

      switch (job.name) {
        // ── Booking confirmation ─────────────────────────────────────────
        case 'booking-confirmation': {
          await sendBookingConfirmation(job.data);
          await markEmailSent(job.data.bookingId);
          console.log(`✅ Confirmation email sent for booking: ${job.data.bookingId} (${Date.now() - startTime}ms)`);
          break;
        }

        // ── Booking reminder (scheduled 2h before slot) ──────────────────
        case 'booking-reminder': {
          // Re-use the confirmation template for now — swap later
          // with a dedicated reminder template
          await sendBookingConfirmation({
            ...job.data,
            // Override subject line in the email service later
          });
          console.log(`⏰ Reminder email sent for booking: ${job.data.bookingId} (${Date.now() - startTime}ms)`);
          break;
        }

        // ── Booking cancellation ─────────────────────────────────────────
        case 'booking-cancelled': {
          // TODO: implement sendCancellationEmail() in emailService.js
          console.log(`🚫 Cancellation email for booking: ${job.data.bookingId} (not yet implemented)`);
          break;
        }

        default:
          console.warn(`⚠️  Unknown email job name: ${job.name}`);
      }
    },
    {
      connection,
      concurrency: 5, // process 5 emails in parallel
    },
  );

  // ── Worker event handlers ──────────────────────────────────────────────
  emailWorker.on('completed', (job) => {
    console.log(`✅ Email job ${job.id} [${job.name}] completed`);
  });

  emailWorker.on('failed', (job, err) => {
    console.error(
      `❌ Email job ${job?.id} [${job?.name}] failed (attempt ${job?.attemptsMade}/${job?.opts?.attempts}):`,
      err.message,
    );
  });

  emailWorker.on('error', (err) => {
    console.error('❌ Email worker error:', err.message);
  });

  console.log('✅ Email worker started (concurrency: 5)');
} else {
  console.warn('⚠️  Email worker not started — no Redis connection');
}

export default emailWorker;
