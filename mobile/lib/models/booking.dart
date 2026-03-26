import 'package:cloud_firestore/cloud_firestore.dart';

class Booking {
  final String id;
  final String turfId;
  final String turfName;
  final String userId;
  final String? customerName;
  final String? customerPhone;
  final String? sport;
  final String date;
  final List<String> timeSlots;
  final double totalPrice;
  final String status;
  final String? paymentMethod;
  final String? paymentId;
  final String? razorpayOrderId;
  final bool emailSent;
  final DateTime? createdAt;
  final String? groundId;
  final int? startHour;
  final int? duration;

  const Booking({
    required this.id,
    required this.turfId,
    required this.turfName,
    required this.userId,
    this.customerName,
    this.customerPhone,
    this.sport,
    required this.date,
    this.timeSlots = const [],
    required this.totalPrice,
    this.status = 'pending',
    this.paymentMethod,
    this.paymentId,
    this.razorpayOrderId,
    this.emailSent = false,
    this.createdAt,
    this.groundId,
    this.startHour,
    this.duration,
  });

  factory Booking.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};

    // Parse date from multiple possible fields
    String bookingDate = '';
    if (data['bookedDate'] != null) {
      bookingDate = data['bookedDate'].toString();
    } else if (data['date'] != null) {
      bookingDate = data['date'].toString();
    } else if (data['bookingDate'] != null) {
      bookingDate = data['bookingDate'].toString();
    }

    // Parse createdAt
    DateTime? created;
    if (data['createdAt'] is Timestamp) {
      created = (data['createdAt'] as Timestamp).toDate();
    }

    return Booking(
      id: doc.id,
      turfId: data['turfId']?.toString() ?? '',
      turfName: data['turfName']?.toString() ?? '',
      userId: data['userId']?.toString() ?? '',
      customerName: data['customerName']?.toString(),
      customerPhone: data['customerPhone']?.toString(),
      sport: data['sport']?.toString(),
      date: bookingDate,
      timeSlots: List<String>.from(data['timeSlots'] ?? []),
      totalPrice: (data['totalPrice'] ?? data['amount'] ?? 0).toDouble(),
      status: data['status']?.toString() ?? 'pending',
      paymentMethod: data['paymentMethod']?.toString(),
      paymentId: data['paymentId']?.toString(),
      razorpayOrderId: data['razorpayOrderId']?.toString(),
      emailSent: data['emailSent'] == true,
      createdAt: created,
      groundId: data['groundId']?.toString(),
      startHour: data['startHour'] is num ? (data['startHour'] as num).toInt() : null,
      duration: data['duration'] is num ? (data['duration'] as num).toInt() : null,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
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
      'status': status,
      'paymentMethod': paymentMethod,
      'paymentId': paymentId,
      'razorpayOrderId': razorpayOrderId,
      'emailSent': emailSent,
      'createdAt': FieldValue.serverTimestamp(),
      if (groundId != null) 'groundId': groundId,
      if (startHour != null) 'startHour': startHour,
      if (duration != null) 'duration': duration,
    };
  }
}
