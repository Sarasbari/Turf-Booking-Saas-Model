import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../models/turf.dart';
import '../services/booking_service.dart';

import '../widgets/time_slot_grid.dart';
import '../widgets/booking_summary_card.dart';

class BookingScreen extends StatefulWidget {
  final Turf turf;
  const BookingScreen({super.key, required this.turf});

  @override
  State<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  final BookingService _bookingService = BookingService();


  DateTime _selectedDate = DateTime.now();
  final Set<int> _selectedHours = {};
  bool _isProcessing = false;

  void _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: now,
      lastDate: now.add(const Duration(days: 30)),
      builder: (context, child) {
        return Theme(
          data: ThemeData.dark().copyWith(
            colorScheme: const ColorScheme.dark(
              primary: AppTheme.primary,
              surface: AppTheme.surface,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        _selectedHours.clear();
      });
    }
  }

  String get _formattedDate => DateFormat('yyyy-MM-dd').format(_selectedDate);
  String get _displayDate => DateFormat('EEEE, MMM d, y').format(_selectedDate);

  double get _effectivePrice {
    final turf = widget.turf;
    if (turf.isDiscountActive && turf.discountPercent > 0) {
      return turf.pricePerHour * (1 - turf.discountPercent / 100);
    }
    return turf.pricePerHour;
  }

  double get _totalPrice => _effectivePrice * _selectedHours.length;

  List<String> get _timeSlotLabels {
    final sorted = _selectedHours.toList()..sort();
    return sorted.map((h) {
      final start = h % 12 == 0 ? 12 : h % 12;
      final end = (h + 1) % 12 == 0 ? 12 : (h + 1) % 12;
      final amPm = h < 12 ? 'AM' : 'PM';
      final endAmPm = (h + 1) < 12 ? 'AM' : 'PM';
      return '$start:00 $amPm - $end:00 $endAmPm';
    }).toList();
  }

  void _handleSlotTap(int hour) {
    setState(() {
      if (_selectedHours.contains(hour)) {
        _selectedHours.remove(hour);
      } else {
        _selectedHours.add(hour);
      }
    });
  }

  Future<void> _handleBooking() async {
    if (_selectedHours.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one time slot')),
      );
      return;
    }

    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    setState(() => _isProcessing = true);

    try {
      // Create booking directly (in a production app, integrate Razorpay here)
      await _bookingService.createBooking(
        turfId: widget.turf.id,
        userId: user.uid,
        turfName: widget.turf.name,
        date: _formattedDate,
        timeSlots: _timeSlotLabels,
        totalPrice: _totalPrice,
        paymentId: 'DIRECT_${DateTime.now().millisecondsSinceEpoch}',
      );

      if (mounted) {
        _showSuccessDialog();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Booking failed: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  void _showSuccessDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => Dialog(
        backgroundColor: AppTheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppTheme.radiusL),
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primary.withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, size: 48, color: AppTheme.primary),
              ),
              const SizedBox(height: 16),
              const Text(
                'Booking Confirmed! 🎉',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Your slot at ${widget.turf.name} has been booked.',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop(); // close dialog
                    Navigator.of(context).pop(); // go back
                  },
                  child: const Text('Done'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final turf = widget.turf;
    final hasDiscount = turf.isDiscountActive && turf.discountPercent > 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Turf'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: StreamBuilder<Set<int>>(
        stream: _bookingService.getBookedSlots(turf.id, _formattedDate),
        builder: (context, bookedSnap) {
          final bookedSlots = bookedSnap.data ?? {};
          final Set<int> blockedSlots = {};

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ── Turf Name ─────────────────────────────────
                Text(
                  turf.name,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 16),

                // ── Date Picker ───────────────────────────────
                GestureDetector(
                  onTap: _pickDate,
                  child: Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: AppTheme.surface,
                      borderRadius: BorderRadius.circular(AppTheme.radiusM),
                      border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.calendar_today, size: 18, color: AppTheme.primary),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Select Date',
                                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                _displayDate,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppTheme.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.chevron_right, color: AppTheme.textMuted),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // ── Time Slots ────────────────────────────────
                const Text(
                  'Select Time Slots',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 12),
                TimeSlotGrid(
                  openHour: AppTheme.parseHour(turf.openTime),
                  closeHour: AppTheme.parseHour(turf.closeTime),
                  bookedHours: bookedSlots,
                  blockedHours: blockedSlots,
                  selectedHours: _selectedHours,
                  onSlotTap: _handleSlotTap,
                ),

                if (_selectedHours.isNotEmpty) ...[
                  const SizedBox(height: 24),

                  // ── Booking Summary ─────────────────────────
                  BookingSummaryCard(
                    turfName: turf.name,
                    date: _displayDate,
                    timeSlots: _timeSlotLabels,
                    pricePerHour: turf.pricePerHour,
                    totalPrice: _totalPrice,
                    hasDiscount: hasDiscount,
                    discountPercent: turf.discountPercent,
                  ),
                ],

                const SizedBox(height: 100),
              ],
            ),
          );
        },
      ),

      // ── Bottom Book & Pay ──────────────────────────────
      bottomNavigationBar: _selectedHours.isNotEmpty
          ? Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.background,
                border: Border(
                  top: BorderSide(color: AppTheme.surfaceBorder.withValues(alpha: 0.5)),
                ),
              ),
              child: SafeArea(
                child: SizedBox(
                  height: 52,
                  child: ElevatedButton(
                    onPressed: _isProcessing ? null : _handleBooking,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppTheme.radiusM),
                      ),
                    ),
                    child: _isProcessing
                        ? const SizedBox(
                            width: 22,
                            height: 22,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.white,
                            ),
                          )
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.payment, size: 18),
                              const SizedBox(width: 8),
                              Text(
                                'Pay ₹${_totalPrice.toInt()}',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            )
          : null,
    );
  }
}
