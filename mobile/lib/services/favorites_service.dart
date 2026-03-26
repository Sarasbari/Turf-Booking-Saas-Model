import 'package:cloud_firestore/cloud_firestore.dart';

class FavoritesService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Add a turf to favorites
  Future<void> addFavorite(String userId, String turfId) async {
    final docId = '${userId}_$turfId';
    await _firestore.collection('favorites').doc(docId).set({
      'userId': userId,
      'turfId': turfId,
      'createdAt': FieldValue.serverTimestamp(),
    });
  }

  /// Remove a turf from favorites
  Future<void> removeFavorite(String userId, String turfId) async {
    final docId = '${userId}_$turfId';
    await _firestore.collection('favorites').doc(docId).delete();
  }

  /// Check if turf is favorited
  Stream<bool> isFavorited(String userId, String turfId) {
    final docId = '${userId}_$turfId';
    return _firestore
        .collection('favorites')
        .doc(docId)
        .snapshots()
        .map((snap) => snap.exists);
  }

  /// Get user's favorite turf IDs
  Stream<List<String>> getFavoriteIds(String userId) {
    return _firestore
        .collection('favorites')
        .where('userId', isEqualTo: userId)
        .snapshots()
        .map((snapshot) =>
            snapshot.docs.map((doc) => doc['turfId'].toString()).toList());
  }
}
