import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

enum SignInRole { customer, owner }

enum OwnerAuthStatus { approved, pending, notRegistered }

class OwnerSignInResult {
  const OwnerSignInResult({required this.user, required this.status});

  final User user;
  final OwnerAuthStatus status;
}

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final GoogleSignIn _googleSignIn = GoogleSignIn();
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  User? get currentUser => _auth.currentUser;
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  Future<void> _upsertUserDocument(User user, {required String role}) async {
    final userRef = _firestore.collection('users').doc(user.uid);
    final userSnap = await userRef.get();

    if (!userSnap.exists) {
      await userRef.set({
        'id': user.uid,
        'name': user.displayName ?? 'User',
        'email': user.email ?? '',
        'picture': user.photoURL ?? '',
        'phone': null,
        'role': role,
        'ownerId': role == 'owner' ? user.uid : null,
        'preferredLocation': null,
        'favoriteSport': null,
        'favorites': [],
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      return;
    }

    await userRef.set({
      'name': user.displayName ?? userSnap.data()?['name'] ?? 'User',
      'email': user.email ?? userSnap.data()?['email'] ?? '',
      'picture': user.photoURL ?? userSnap.data()?['picture'] ?? '',
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));
  }

  Future<User?> signInWithGoogle({
    SignInRole role = SignInRole.customer,
  }) async {
    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) return null; // User cancelled

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final result = await _auth.signInWithCredential(credential);
      final user = result.user;

      if (user != null) {
        await _upsertUserDocument(
          user,
          role: role == SignInRole.owner ? 'owner' : 'customer',
        );

        if (role == SignInRole.owner) {
          final ownerRef = _firestore.collection('owners').doc(user.uid);
          final ownerSnap = await ownerRef.get();

          if (!ownerSnap.exists) {
            await signOut();
            throw Exception(
              'Owner account not found. Please register as an owner first.',
            );
          }

          final ownerData = ownerSnap.data() ?? <String, dynamic>{};
          final isApproved = ownerData['isApproved'] == true;

          if (!isApproved) {
            await signOut();
            throw Exception('Owner account is pending approval by admin.');
          }

          await _firestore.collection('users').doc(user.uid).set({
            'role': 'owner',
            'ownerId': user.uid,
            'updatedAt': FieldValue.serverTimestamp(),
          }, SetOptions(merge: true));
        }
      }

      return user;
    } catch (e) {
      rethrow;
    }
  }

  Future<OwnerSignInResult?> signInOwnerWithGoogle() async {
    final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
    if (googleUser == null) return null;

    final GoogleSignInAuthentication googleAuth =
        await googleUser.authentication;
    final credential = GoogleAuthProvider.credential(
      accessToken: googleAuth.accessToken,
      idToken: googleAuth.idToken,
    );

    final result = await _auth.signInWithCredential(credential);
    final user = result.user;
    if (user == null) return null;

    await _upsertUserDocument(user, role: 'customer');

    final ownerSnap = await _firestore.collection('owners').doc(user.uid).get();
    if (!ownerSnap.exists) {
      return OwnerSignInResult(
        user: user,
        status: OwnerAuthStatus.notRegistered,
      );
    }

    final ownerData = ownerSnap.data() ?? <String, dynamic>{};
    if (ownerData['isApproved'] == true) {
      await _firestore.collection('users').doc(user.uid).set({
        'role': 'owner',
        'ownerId': user.uid,
        'updatedAt': FieldValue.serverTimestamp(),
      }, SetOptions(merge: true));

      return OwnerSignInResult(user: user, status: OwnerAuthStatus.approved);
    }

    return OwnerSignInResult(user: user, status: OwnerAuthStatus.pending);
  }

  Future<void> registerOwner({
    required String phone,
    required String turfId,
    required String claimCode,
  }) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('Please sign in with Google first.');
    }

    final turfRef = _firestore.collection('turf').doc(turfId.trim());
    final ownerRef = _firestore.collection('owners').doc(user.uid);
    final userRef = _firestore.collection('users').doc(user.uid);

    final turfSnap = await turfRef.get();
    if (!turfSnap.exists) {
      throw Exception('Turf ID not found. Contact admin.');
    }

    final turfData = turfSnap.data() ?? <String, dynamic>{};
    final docClaimCode = turfData['claimCode']?.toString() ?? '';
    final docOwnerId = turfData['ownerId']?.toString() ?? '';
    final claimCodeUsed = turfData['claimCodeUsed'] == true;

    if (docClaimCode.isEmpty || docClaimCode != claimCode.trim()) {
      throw Exception('Invalid claim code.');
    }
    if (claimCodeUsed) {
      throw Exception('Claim code already used. Contact admin.');
    }
    if (docOwnerId.isNotEmpty) {
      throw Exception('This turf already has an owner.');
    }

    final batch = _firestore.batch();
    batch.set(ownerRef, {
      'uid': user.uid,
      'name': user.displayName ?? '',
      'email': user.email ?? '',
      'phone': phone.trim(),
      'photoURL': user.photoURL ?? '',
      'turfId': turfId.trim(),
      'role': 'owner',
      'isApproved': false,
      'createdAt': FieldValue.serverTimestamp(),
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    batch.update(turfRef, {
      'claimCodeUsed': true,
      'ownerId': user.uid,
      'updatedAt': FieldValue.serverTimestamp(),
    });

    batch.set(userRef, {
      'role': 'owner',
      'ownerId': user.uid,
      'updatedAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    await batch.commit();
  }

  Future<void> signOut() async {
    await _googleSignIn.signOut();
    await _auth.signOut();
  }
}
