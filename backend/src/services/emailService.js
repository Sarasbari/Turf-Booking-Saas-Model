/**
 * Email Service
 * 
 * Flow:
 * 1. Takes BookingEmailData from the payment controller after successful booking confirmation.
 * 2. Generates a QR Code referencing the frontend booking URL.
 * 3. Constructs a fully inline responsive HTML template for clients.
 * 4. Submits the email via Resend API.
 * 5. Errors are caught internally as this operates asynchronously in a fire-and-forget manner.
 */

import { Resend } from 'resend';
import QRCode from 'qrcode';
import { config } from '../config/index.js';

let resendClient = null;

export function getResendClient() {
    if (!resendClient) {
        resendClient = new Resend(config.resend.apiKey);
    }
    return resendClient;
}

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
        console.warn(`[Email Service] Cannot send email, no toEmail provided for booking ${data.bookingId}`);
        return;
    }

    try {
        const resend = getResendClient();

        // 1. Generate QR Code
        const verificationUrl = `${config.frontend.url}/booking/${data.bookingId}`;
        const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
            width: 200,
            margin: 2
        });

        // 2. Build HTML email template
        const htmlTemplate = `
        <div style="font-family: sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px 10px; width: 100%;">
            <table align="center" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; margin: 0 auto; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-collapse: collapse;">
                <!-- Header -->
                <tr>
                    <td style="background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); padding: 30px 20px; text-align: center;">
                        <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: bold; letter-spacing: 1px;">BookMyTurf</h2>
                        <h1 style="color: #ffffff; margin: 10px 0 0 0; font-size: 24px;">Booking Confirmed ✓</h1>
                    </td>
                </tr>

                <!-- Body Sections -->
                <tr>
                    <td style="padding: 30px 20px;">
                        <h2 style="font-size: 20px; color: #111827; margin: 0 0 20px 0;">Hello ${data.userName}! Your turf is booked.</h2>
                        
                        <!-- Booking Details Card -->
                        <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
                            <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                                <strong>📍 Turf:</strong> ${data.turfName} — ${data.turfAddress}
                            </p>
                            <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                                <strong>📅 Date:</strong> ${data.bookedDate}
                            </p>
                            <p style="font-size: 15px; color: #374151; margin: 0 0 12px 0;">
                                <strong>⏰ Time:</strong> ${data.timeSlots.join(' &rarr; ')} (${data.timeSlots.length} hour/s)
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

                        <!-- QR Code Section -->
                        <div style="text-align: center; margin-bottom: 30px;">
                            <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 0 0 15px 0;">Show this at the venue</p>
                            <img src="${qrDataUrl}" width="160" height="160" alt="Booking QR Code" style="border: 1px solid #e5e7eb; border-radius: 8px;" />
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
        </div>
        `;

        // 3. Send via Resend
// 3. Send via Resend
const response = await resend.emails.send({
    from: config.resend.fromEmail,
    to: data.toEmail,
    subject: `✅ Booking Confirmed — ${data.turfName} on ${data.bookedDate}`,
    html: htmlTemplate,
});

// ✅ FIX: Check for Resend API errors (newer SDK returns { data, error })
if (response.error) {
    throw new Error(`Resend API error: ${response.error.message} (name: ${response.error.name})`);
}

console.log(`[Email Service] Email sent successfully for booking ${data.bookingId} (Resend ID: ${response.data?.id})`);
    } catch (error) {
        console.error(`[Email Service] Failed to send email for booking ${data.bookingId}:`, error);
    }
}
