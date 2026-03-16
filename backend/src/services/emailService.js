/**
 * Email Service — Brevo (formerly Sendinblue)
 *
 * Sends booking-confirmation emails via the Brevo transactional API.
 * Called fire-and-forget from paymentController after a booking is stored.
 *
 * Uses the new @getbrevo/brevo v3+ BrevoClient API.
 */

import { BrevoClient } from "@getbrevo/brevo";

const brevoClient = new BrevoClient({ apiKey: process.env.BREVO_API_KEY });

/**
 * @typedef {Object} BookingEmailData
 * @property {string} toEmail
 * @property {string} userName
 * @property {string} bookingId
 * @property {string} turfName
 * @property {string} turfAddress
 * @property {string} ownerContact
 * @property {string} bookedDate
 * @property {string[]} timeSlots
 * @property {number} totalAmount
 * @property {string} paymentId
 */

/**
 * Sends the booking confirmation email asynchronously.
 * @param {BookingEmailData} data
 * @returns {Promise<void>}
 */
export async function sendBookingConfirmation(data) {
  if (!data.toEmail) {
    console.warn(`[Email Service] No toEmail for booking ${data.bookingId}`);
    return;
  }

  try {
    if (!process.env.BREVO_API_KEY) throw new Error("Missing BREVO_API_KEY");
    if (!process.env.BREVO_SENDER_EMAIL) throw new Error("Missing BREVO_SENDER_EMAIL");

    const response = await brevoClient.transactionalEmails.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL,
        name: process.env.BREVO_SENDER_NAME || "BookMyTurf",
      },
      to: [{ email: data.toEmail, name: data.userName || "Player" }],
      subject: `🏟️ Booking Confirmed — ${data.turfName} on ${data.bookedDate}`,
      htmlContent: `
    <div style="font-family: sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; width: 100%;">
      <table align="center" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-collapse: collapse;">
        <!-- Header -->
        <tr>
          <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">BookMyTurf</h2>
            <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">Booking Confirmed ✓</h1>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding: 30px 20px;">
            <h2 style="font-size: 20px; color: #111827; margin: 0 0 20px 0;">Hello ${data.userName}! Your turf is booked.</h2>

            <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>📍 Turf:</strong> ${data.turfName} — ${data.turfAddress}
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>📅 Date:</strong> ${data.bookedDate}
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>⏰ Time:</strong> ${data.timeSlots.join(' → ')} (${data.timeSlots.length} hour/s)
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>💰 Total Paid:</strong> ₹${data.totalAmount}
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>🏷 Booking ID:</strong> ${data.bookingId}
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                <strong>📞 Owner Contact:</strong> ${data.ownerContact}
              </p>
              <p style="font-size: 15px; color: #374151; margin: 0;">
                <strong>💳 Payment Ref:</strong> ${data.paymentId}
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background-color: #f3f4f6; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #4b5563; font-size: 15px; font-weight: bold; margin: 0 0 10px 0;">
              See you on the turf! — BookMyTurf Team
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated email. Do not reply.
            </p>
          </td>
        </tr>
      </table>
    </div>`,
    });

    console.log(`✅ Brevo email sent for booking ${data.bookingId}:`, response?.messageId || "");
    return true;
  } catch (error) {
    console.error(`❌ Brevo email error for booking ${data.bookingId}:`, error?.message || error);
    throw error;
  }
}