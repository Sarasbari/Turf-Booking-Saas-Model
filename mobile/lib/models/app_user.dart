import 'package:cloud_firestore/cloud_firestore.dart';

class AppUser {
  final String uid;
  final String name;
  final String email;
  final String photoURL;
  final String role;
  final DateTime? createdAt;

  const AppUser({
    required this.uid,
    required this.name,
    required this.email,
    this.photoURL = '',
    this.role = 'user',
    this.createdAt,
  });

  factory AppUser.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};

    DateTime? created;
    if (data['createdAt'] is Timestamp) {
      created = (data['createdAt'] as Timestamp).toDate();
    }

    return AppUser(
      uid: doc.id,
      name: data['name']?.toString() ?? 'User',
      email: data['email']?.toString() ?? '',
      photoURL: data['photoURL']?.toString() ?? '',
      role: data['role']?.toString() ?? 'user',
      createdAt: created,
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'name': name,
      'email': email,
      'photoURL': photoURL,
      'role': role,
      'createdAt': FieldValue.serverTimestamp(),
    };
  }
}
