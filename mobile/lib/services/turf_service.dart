import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/turf.dart';
import '../models/review.dart';

class TurfService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Stream all active turfs
  Stream<List<Turf>> getTurfs() {
    return _firestore
        .collection('turf')
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Turf.fromFirestore(doc)).toList());
  }

  /// Stream turfs filtered by sport
  Stream<List<Turf>> getTurfsBySport(String sport) {
    return _firestore
        .collection('turf')
        .where('sports', arrayContains: sport)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Turf.fromFirestore(doc)).toList());
  }

  /// Stream turfs filtered by city
  Stream<List<Turf>> getTurfsByCity(String city) {
    return _firestore
        .collection('turf')
        .where('city', isEqualTo: city)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => Turf.fromFirestore(doc)).toList());
  }

  /// Stream a single turf by ID
  Stream<Turf?> getTurfById(String turfId) {
    return _firestore
        .collection('turf')
        .doc(turfId)
        .snapshots()
        .map((doc) => doc.exists ? Turf.fromFirestore(doc) : null);
  }

  /// Stream booked slots for a turf on a specific date (real-time)
  Stream<List<int>> getBookedSlots(String turfId, String date, {String? groundId}) {
    return _firestore
        .collection('bookings')
        .where('turfId', isEqualTo: turfId)
        .where('bookedDate', isEqualTo: date)
        .where('status', isEqualTo: 'confirmed')
        .snapshots()
        .map((snapshot) {
      final List<int> booked = [];
      for (final doc in snapshot.docs) {
        final data = doc.data();
        // Filter by ground if specified
        if (groundId != null && data['groundId'] != null && data['groundId'] != groundId) {
          continue;
        }
        // Schema 1: timeSlots array
        if (data['timeSlots'] is List && (data['timeSlots'] as List).isNotEmpty) {
          for (final slot in data['timeSlots']) {
            final hour = int.tryParse(slot.toString().split(':')[0]);
            if (hour != null) booked.add(hour);
          }
        }
        // Schema 2: startHour + duration
        else if (data['startHour'] != null && data['duration'] != null) {
          final start = (data['startHour'] as num).toInt();
          final dur = (data['duration'] as num).toInt();
          for (int h = 0; h < dur; h++) {
            booked.add(start + h);
          }
        }
        // Schema 3: startTime string
        else if (data['startTime'] != null) {
          final hour = int.tryParse(data['startTime'].toString().split(':')[0]);
          if (hour != null) {
            final dur = (data['duration'] as num?)?.toInt() ?? 1;
            for (int h = 0; h < dur; h++) {
              booked.add(hour + h);
            }
          }
        }
      }
      return booked;
    });
  }

  /// Stream blocked slots for a turf on a specific date
  Stream<List<int>> getBlockedSlots(String turfId, String date, {String? groundId}) {
    return _firestore
        .collection('blockedSlots')
        .where('turfId', isEqualTo: turfId)
        .where('date', isEqualTo: date)
        .snapshots()
        .map((snapshot) {
      final List<int> blocked = [];
      for (final doc in snapshot.docs) {
        final data = doc.data();
        if (groundId != null && data['groundId'] != null && data['groundId'] != groundId) {
          continue;
        }
        if (data['startTime'] != null) {
          final hour = int.tryParse(data['startTime'].toString().split(':')[0]);
          if (hour != null) blocked.add(hour);
        }
      }
      return blocked;
    });
  }

  /// Stream reviews for a turf
  Stream<List<Review>> getReviews(String turfId) {
    return _firestore
        .collection('turf')
        .doc(turfId)
        .collection('reviews')
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) => snapshot.docs
            .map((doc) => Review.fromMap(doc.id, doc.data()))
            .toList());
  }

  /// Submit a review
  Future<void> submitReview({
    required String turfId,
    required String userId,
    required String userName,
    required String userPicture,
    required double rating,
    required String comment,
  }) async {
    await _firestore.collection('turf').doc(turfId).collection('reviews').add({
      'userId': userId,
      'userName': userName,
      'userPicture': userPicture,
      'rating': rating,
      'comment': comment,
      'timestamp': Timestamp.now(),
      'isVerifiedBooking': false,
    });
  }
}
