/**
 * BookingSuccessPopup — The "hero moment" after successful payment.
 *
 * Shows a gorgeous animated modal with:
 *  - Confetti burst 🎉
 *  - Animated green checkmark
 *  - Complete booking details in a card layout
 *  - QR code for venue check-in
 *  - Tap-to-copy booking ID
 *  - CTA buttons to view bookings or book another turf
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { ModalOverlay } from '../ui/ModalOverlay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BookingResult {
  bookingId: string;
  success: boolean;
  message?: string;
}

interface TurfInfo {
  name: string;
  address?: string;
  city?: string;
  ownerPhone?: string;
  ownerName?: string;
  ownerContact?: string;
  images?: string[];
}

interface BookingSuccessPopupProps {
  booking: BookingResult;
  turf: TurfInfo;
  selectedSlot: {
    label: string;
    startHour: number;
  };
  selectedDate: string;
  totalPrice: number;
  duration: number;
  onClose: () => void;
  onBookAgain: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BookingSuccessPopup({
  booking,
  turf,
  selectedSlot,
  selectedDate,
  totalPrice,
  duration,
  onClose,
  onBookAgain,
}: BookingSuccessPopupProps) {
  const [copied, setCopied] = useState(false);

  // 🎉 Confetti burst on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#ea580c', '#16a34a', '#f59e0b', '#3b82f6'],
      });
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Format the booking date nicely
  const formattedDate = (() => {
    try {
      return new Date(selectedDate).toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  })();

  // Build the time range label
  const timeRange = selectedSlot?.label || '';

  // QR code value — deep link to the booking
  const qrValue = `https://turfhub-psi.vercel.app/booking/${booking.bookingId}`;

  // Owner contact info
  const ownerContact = turf.ownerPhone || turf.ownerContact || turf.ownerName || 'See email';

  // Copy booking ID to clipboard
  const handleCopyId = () => {
    if (booking.bookingId) {
      navigator.clipboard.writeText(booking.bookingId).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <ModalOverlay>
      <div className="bg-white rounded-3xl shadow-2xl w-[360px] max-w-[95vw] max-h-[90vh] overflow-y-auto mx-4">

        {/* ── Green Header ── */}
        <div
          className="rounded-t-3xl p-6 flex flex-col items-center"
          style={{
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
          }}
        >
          {/* Animated checkmark circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1, damping: 15 }}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg mb-4"
          >
            <motion.svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              initial="hidden"
              animate="visible"
            >
              <motion.path
                d="M8 20 L17 29 L32 12"
                fill="none"
                stroke="#16a34a"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                variants={{
                  hidden: { pathLength: 0 },
                  visible: {
                    pathLength: 1,
                    transition: {
                      duration: 0.5,
                      delay: 0.3,
                      ease: 'easeOut',
                    },
                  },
                }}
              />
            </motion.svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-white text-2xl font-bold"
          >
            Booking Confirmed!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-green-100 text-sm mt-1"
          >
            Your turf is locked in 🎉
          </motion.p>
        </div>

        {/* ── Booking Details ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-5 space-y-3"
        >
          {/* Turf info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <p className="font-bold text-gray-900 text-lg leading-tight">
              {turf.name}
            </p>
            {(turf.address || turf.city) && (
              <p className="text-gray-500 text-sm flex items-center gap-1">
                📍 {[turf.address, turf.city].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Booking details 2×2 grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-orange-50 rounded-xl p-3">
              <p className="text-xs text-orange-600 font-medium mb-1">📅 Date</p>
              <p className="text-sm font-semibold text-gray-800 leading-tight">
                {formattedDate}
              </p>
            </div>
            <div className="bg-blue-50 rounded-xl p-3">
              <p className="text-xs text-blue-600 font-medium mb-1">⏰ Time</p>
              <p className="text-sm font-semibold text-gray-800">
                {timeRange}
              </p>
              <p className="text-xs text-gray-500">
                {duration} hour{duration > 1 ? 's' : ''}
              </p>
            </div>
            <div className="bg-green-50 rounded-xl p-3">
              <p className="text-xs text-green-600 font-medium mb-1">💰 Paid</p>
              <p className="text-lg font-bold text-green-700">
                ₹{totalPrice.toLocaleString('en-IN')}
              </p>
            </div>
            <div className="bg-purple-50 rounded-xl p-3">
              <p className="text-xs text-purple-600 font-medium mb-1">📞 Owner</p>
              <p className="text-sm font-semibold text-gray-800">
                {ownerContact}
              </p>
            </div>
          </div>

          {/* Booking ID — tap to copy */}
          <button
            onClick={handleCopyId}
            className="w-full bg-gray-50 rounded-xl p-3 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="text-xs text-gray-500">Booking ID</span>
            <span className="text-xs font-mono text-gray-700 flex items-center gap-1">
              {booking.bookingId?.length > 12
                ? `${booking.bookingId.slice(0, 12)}...`
                : booking.bookingId}
              <span className="text-gray-400">{copied ? '✅' : '📋'}</span>
            </span>
          </button>

          {/* Email notice */}
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
            <span className="text-lg">📧</span>
            <p className="text-xs text-blue-700">
              Confirmation sent to your email
            </p>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center bg-gray-50 rounded-2xl p-4 gap-2">
            <p className="text-xs text-gray-500 font-medium">
              Show this at the venue
            </p>
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <QRCodeSVG
                value={qrValue}
                size={130}
                bgColor="#ffffff"
                fgColor="#1f2937"
                level="M"
              />
            </div>
            <p className="text-xs text-gray-400 text-center">
              Scan to verify booking
            </p>
          </div>
        </motion.div>

        {/* ── Action Buttons ── */}
        <div className="px-5 pb-6 space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3.5 rounded-2xl transition-colors"
          >
            View My Bookings
          </button>
          <button
            onClick={onBookAgain}
            className="w-full border border-gray-200 text-gray-600 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Book Another Turf
          </button>
        </div>

      </div>
    </ModalOverlay>
  );
}
