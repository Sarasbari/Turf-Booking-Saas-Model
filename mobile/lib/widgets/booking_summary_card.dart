import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class BookingSummaryCard extends StatelessWidget {
  final String turfName;
  final String date;
  final List<String> timeSlots;
  final double pricePerHour;
  final double totalPrice;
  final bool hasDiscount;
  final int discountPercent;

  const BookingSummaryCard({
    super.key,
    required this.turfName,
    required this.date,
    required this.timeSlots,
    required this.pricePerHour,
    required this.totalPrice,
    this.hasDiscount = false,
    this.discountPercent = 0,
  });

  @override
  Widget build(BuildContext context) {
    final duration = timeSlots.length;
    final originalPrice = pricePerHour * duration;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(AppTheme.radiusL),
        border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(AppTheme.radiusS),
                ),
                child: const Icon(Icons.receipt_long, size: 18, color: AppTheme.primary),
              ),
              const SizedBox(width: 12),
              const Text(
                'Booking Summary',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1),
          const SizedBox(height: 16),

          _row('Turf', turfName),
          const SizedBox(height: 8),
          _row('Date', date),
          const SizedBox(height: 8),
          _row('Time', timeSlots.join(', ')),
          const SizedBox(height: 8),
          _row('Duration', '$duration hour${duration > 1 ? 's' : ''}'),
          const SizedBox(height: 8),
          _row('Rate', '₹${pricePerHour.toInt()}/hr'),

          if (hasDiscount) ...[
            const SizedBox(height: 8),
            _row('Discount', '-$discountPercent%', valueColor: AppTheme.primary),
          ],

          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasDiscount)
                    Text(
                      '₹${originalPrice.toInt()}',
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textMuted,
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                  Text(
                    '₹${totalPrice.toInt()}',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _row(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        Flexible(
          child: Text(
            value,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: valueColor ?? AppTheme.textPrimary,
            ),
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}
