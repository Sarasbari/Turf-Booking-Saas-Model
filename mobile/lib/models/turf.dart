import 'package:cloud_firestore/cloud_firestore.dart';

class Turf {
  final String id;
  final String name;
  final String about;
  final String city;
  final String address;
  final String state;
  final String pincode;
  final String area;
  final List<String> sports;
  final List<String> amenities;
  final List<String> images;
  final double pricePerHour;
  final String priceRange;
  final double rating;
  final int totalReviews;
  final int totalBookings;
  final int bookingsLast30Days;
  final String openTime;
  final String closeTime;
  final String? weeklyOff;
  final String groundSize;
  final int totalGrounds;
  final String status;
  final bool isDiscountActive;
  final int discountPercent;
  final String discountDescription;
  final bool isUnderMaintenance;
  final String maintenanceNote;
  final String ownerName;
  final String ownerPhone;
  final String website;
  final GeoPoint? geoPoint;
  final String ownerId;

  const Turf({
    required this.id,
    required this.name,
    this.about = '',
    this.city = '',
    this.address = '',
    this.state = '',
    this.pincode = '',
    this.area = '',
    this.sports = const [],
    this.amenities = const [],
    this.images = const [],
    this.pricePerHour = 0,
    this.priceRange = '',
    this.rating = 0,
    this.totalReviews = 0,
    this.totalBookings = 0,
    this.bookingsLast30Days = 0,
    this.openTime = '06:00',
    this.closeTime = '22:00',
    this.weeklyOff,
    this.groundSize = '5-a-side',
    this.totalGrounds = 1,
    this.status = 'available',
    this.isDiscountActive = false,
    this.discountPercent = 0,
    this.discountDescription = '',
    this.isUnderMaintenance = false,
    this.maintenanceNote = '',
    this.ownerName = '',
    this.ownerPhone = '',
    this.website = '',
    this.geoPoint,
    this.ownerId = '',
  });

  static List<String> _asStringList(dynamic value) {
    if (value is List) {
      return value
          .where((item) => item != null)
          .map((item) => item.toString())
          .toList();
    }
    return const [];
  }

  static double _asDouble(dynamic value, {double fallback = 0}) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }

  static int _asInt(dynamic value, {int fallback = 0}) {
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? fallback;
    return fallback;
  }

  /// Normalize Firestore data — handles BOTH schemas (flat & nested)
  factory Turf.fromFirestore(DocumentSnapshot doc) {
    final data = doc.data() as Map<String, dynamic>? ?? {};
    final id = doc.id;

    // Handle nested location
    final location = data['location'] as Map<String, dynamic>? ?? {};
    final pricing = data['pricing'] as Map<String, dynamic>? ?? {};
    final operatingHours =
        data['operatingHours'] as Map<String, dynamic>? ?? {};

    // Handle geoPoint
    GeoPoint? geo;
    if (data['geoPoint'] != null && data['geoPoint'] is GeoPoint) {
      geo = data['geoPoint'] as GeoPoint;
    } else if (location['coordinates'] != null) {
      final coords = location['coordinates'] as Map<String, dynamic>;
      geo = GeoPoint(
        (coords['lat'] as num?)?.toDouble() ?? 0,
        (coords['lng'] as num?)?.toDouble() ?? 0,
      );
    }

    // Handle sports list
    List<String> sports = [];
    if (data['sports'] is List) {
      sports = _asStringList(data['sports']);
    } else if (data['sport'] is String) {
      sports = [data['sport'] as String];
    }

    // Handle status normalization
    String rawStatus = data['status']?.toString() ?? 'available';
    String status = rawStatus == 'active' ? 'available' : rawStatus;

    return Turf(
      id: id,
      name: data['name']?.toString() ?? 'Unnamed Turf',
      about: data['about']?.toString() ?? data['description']?.toString() ?? '',
      city: data['city']?.toString() ?? location['city']?.toString() ?? '',
      address:
          data['address']?.toString() ?? location['address']?.toString() ?? '',
      state: data['state']?.toString() ?? location['state']?.toString() ?? '',
      pincode:
          data['pincode']?.toString() ?? location['pincode']?.toString() ?? '',
      area: data['area']?.toString() ?? '',
      sports: sports,
      amenities: _asStringList(data['amenities']),
      images: _asStringList(
        data['images'] ??
            (data['coverImage'] != null ? [data['coverImage']] : []),
      ),
      pricePerHour: _asDouble(data['pricePerHour'] ?? pricing['basePrice']),
      priceRange: data['priceRange']?.toString() ?? '',
      rating: _asDouble(data['rating']),
      totalReviews: _asInt(data['totalReviews']),
      totalBookings: _asInt(data['totalBookings']),
      bookingsLast30Days: _asInt(data['bookingsLast30Days']),
      openTime:
          data['openTime']?.toString() ??
          operatingHours['opensAt']?.toString() ??
          '06:00',
      closeTime:
          data['closeTime']?.toString() ??
          operatingHours['closesAt']?.toString() ??
          '22:00',
      weeklyOff: data['weeklyOff']?.toString(),
      groundSize:
          data['groundSize']?.toString() ??
          data['turfSize']?.toString() ??
          '5-a-side',
      totalGrounds: _asInt(data['totalGrounds'], fallback: 1),
      status: status,
      isDiscountActive: data['isDiscountActive'] == true,
      discountPercent: _asInt(data['discountPercent']),
      discountDescription: data['discountDescription']?.toString() ?? '',
      isUnderMaintenance: data['isUnderMaintenance'] == true,
      maintenanceNote: data['maintenanceNote']?.toString() ?? '',
      ownerName: data['ownerName']?.toString() ?? '',
      ownerPhone: data['ownerPhone']?.toString() ?? '',
      website: data['website']?.toString() ?? '',
      geoPoint: geo,
      ownerId: data['ownerId']?.toString() ?? '',
    );
  }
}
