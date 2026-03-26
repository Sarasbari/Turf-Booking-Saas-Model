class Review {
  final String id;
  final String userId;
  final String userName;
  final String userPicture;
  final double rating;
  final String comment;
  final DateTime? timestamp;
  final bool isVerifiedBooking;

  const Review({
    required this.id,
    required this.userId,
    required this.userName,
    this.userPicture = '',
    required this.rating,
    required this.comment,
    this.timestamp,
    this.isVerifiedBooking = false,
  });

  factory Review.fromMap(String id, Map<String, dynamic> data) {
    DateTime? ts;
    if (data['timestamp'] != null) {
      try {
        ts = data['timestamp'].toDate();
      } catch (_) {}
    }

    return Review(
      id: id,
      userId: data['userId']?.toString() ?? '',
      userName: data['userName']?.toString() ?? 'Anonymous',
      userPicture: data['userPicture']?.toString() ?? '',
      rating: (data['rating'] ?? 0).toDouble(),
      comment: data['comment']?.toString() ?? '',
      timestamp: ts,
      isVerifiedBooking: data['isVerifiedBooking'] == true,
    );
  }
}
