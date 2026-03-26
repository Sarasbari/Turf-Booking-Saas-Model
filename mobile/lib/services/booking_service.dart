import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/booking.dart';

class BookingService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Create a new booking in Firestore
  Future<String> createBooking({
    required String turfId,
    required String turfName,
    required String userId,
    required String date,
    required List<String> timeSlots,
    required double totalPrice,
    String? paymentId,
    String customerName = '',
    String customerPhone = '',
    String sport = '',
    String paymentMethod = 'online',
    String? razorpayOrderId,
    String? groundId,
    int? startHour,
    int? duration,
  }) async {
    final docRef = await _firestore.collection('bookings').add({
      'turfId': turfId,
      'turfName': turfName,
      'userId': userId,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'sport': sport,
      'bookedDate': date,
      'date': date,
      'timeSlots': timeSlots,
      'totalPrice': totalPrice,
      'status': 'confirmed',
      'paymentMethod': paymentMethod,
      'paymentId': paymentId,
      'razorpayOrderId': razorpayOrderId,
      'emailSent': false,
      'createdAt': FieldValue.serverTimestamp(),
      if (groundId != null) 'groundId': groundId,
      if (startHour != null) 'startHour': startHour,
      if (duration != null) 'duration': duration,
    });
    return docRef.id;
  }

  /// Get booked hour-slots for a turf on a specific date
  Stream<Set<int>> getBookedSlots(String turfId, String date) {
    return _firestore
        .collection('bookings')
        .where('turfId', isEqualTo: turfId)
        .where('date', isEqualTo: date)
        .where('status', isEqualTo: 'confirmed')
        .snapshots()
        .map((snapshot) {
      final Set<int> hours = {};
      for (final doc in snapshot.docs) {
        final data = doc.data();
        // Parse hour from timeSlot strings like "6:00 AM - 7:00 AM"
        final slots = List<String>.from(data['timeSlots'] ?? []);
        for (final slot in slots) {
          final match = RegExp(r'(\d+):').firstMatch(slot);
          if (match != null) {
            int hour = int.parse(match.group(1)!);
            // Handle PM
            if (slot.contains('PM') && hour != 12) hour += 12;
            if (slot.contains('AM') && hour == 12) hour = 0;
            hours.add(hour);
          }
        }
        // Also handle startHour field
        if (data['startHour'] != null) {
          hours.add((data['startHour'] as num).toInt());
        }
      }
      return hours;
    });
  }

  /// Stream user's bookings (real-time)
  Stream<List<Booking>> getUserBookings(String userId) {
    return _firestore
        .collection('bookings')
        .where('userId', isEqualTo: userId)
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Booking.fromFirestore(doc)).toList());
  }

  /// Cancel a booking
  Future<void> cancelBooking(String bookingId) async {
    await _firestore.collection('bookings').doc(bookingId).update({
      'status': 'cancelled',
    });
  }
}
