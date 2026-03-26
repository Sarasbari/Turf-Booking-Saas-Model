import 'dart:convert';
import 'package:http/http.dart' as http;

class PaymentService {
  // TODO: Replace with your actual backend URL
  static const String _baseUrl = 'http://10.0.2.2:5000/api';

  /// Create a Razorpay order via the backend
  Future<Map<String, dynamic>> createOrder({
    required double amount,
    required String turfId,
    required String userId,
    required String turfName,
    required String date,
    required List<String> timeSlots,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/bookings/create-order'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'amount': amount,
        'turfId': turfId,
        'userId': userId,
        'turfName': turfName,
        'date': date,
        'timeSlots': timeSlots,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create order: ${response.body}');
    }
  }

  /// Verify payment with the backend
  Future<Map<String, dynamic>> verifyPayment({
    required String razorpayPaymentId,
    required String razorpayOrderId,
    required String razorpaySignature,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/bookings/verify-payment'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_order_id': razorpayOrderId,
        'razorpay_signature': razorpaySignature,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Payment verification failed: ${response.body}');
    }
  }
}
