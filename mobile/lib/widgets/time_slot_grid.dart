import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class TimeSlotGrid extends StatelessWidget {
  final int openHour;
  final int closeHour;
  final Set<int> bookedHours;
  final Set<int> blockedHours;
  final Set<int> selectedHours;
  final ValueChanged<int> onSlotTap;

  const TimeSlotGrid({
    super.key,
    required this.openHour,
    required this.closeHour,
    required this.bookedHours,
    required this.blockedHours,
    required this.selectedHours,
    required this.onSlotTap,
  });

  String _formatHour(int hour) {
    final h = hour % 12 == 0 ? 12 : hour % 12;
    final amPm = hour < 12 ? 'AM' : 'PM';
    return '$h $amPm';
  }

  @override
  Widget build(BuildContext context) {
    final hours = List.generate(closeHour - openHour, (i) => openHour + i);
    final now = DateTime.now();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Legend
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              _legend(AppTheme.surfaceLight, 'Available'),
              const SizedBox(width: 12),
              _legend(AppTheme.primary, 'Selected'),
              const SizedBox(width: 12),
              _legend(AppTheme.error.withValues(alpha: 0.4), 'Booked'),
              const SizedBox(width: 12),
              _legend(AppTheme.textMuted.withValues(alpha: 0.3), 'Blocked'),
            ],
          ),
        ),
        // Grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            childAspectRatio: 2.2,
            crossAxisSpacing: 8,
            mainAxisSpacing: 8,
          ),
          itemCount: hours.length,
          itemBuilder: (context, index) {
            final hour = hours[index];
            final isBooked = bookedHours.contains(hour);
            final isBlocked = blockedHours.contains(hour);
            final isSelected = selectedHours.contains(hour);
            final isPast = DateTime(now.year, now.month, now.day, hour).isBefore(now);
            final isDisabled = isBooked || isBlocked || isPast;

            Color bgColor;
            Color textColor;
            Color borderColor;

            if (isSelected) {
              bgColor = AppTheme.primary;
              textColor = Colors.white;
              borderColor = AppTheme.primary;
            } else if (isBooked) {
              bgColor = AppTheme.error.withValues(alpha: 0.15);
              textColor = AppTheme.error.withValues(alpha: 0.6);
              borderColor = AppTheme.error.withValues(alpha: 0.3);
            } else if (isBlocked || isPast) {
              bgColor = AppTheme.textMuted.withValues(alpha: 0.1);
              textColor = AppTheme.textMuted.withValues(alpha: 0.4);
              borderColor = AppTheme.textMuted.withValues(alpha: 0.2);
            } else {
              bgColor = AppTheme.surfaceLight;
              textColor = AppTheme.textPrimary;
              borderColor = AppTheme.surfaceBorder;
            }

            return GestureDetector(
              onTap: isDisabled ? null : () => onSlotTap(hour),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                curve: Curves.easeOut,
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(AppTheme.radiusS),
                  border: Border.all(color: borderColor, width: isSelected ? 1.5 : 0.8),
                ),
                alignment: Alignment.center,
                child: Text(
                  _formatHour(hour),
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                    color: textColor,
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _legend(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(3),
          ),
        ),
        const SizedBox(width: 4),
        Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
      ],
    );
  }
}
