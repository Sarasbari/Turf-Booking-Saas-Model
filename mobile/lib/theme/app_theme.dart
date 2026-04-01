import 'package:flutter/material.dart';

class AppTheme {
  // ── Brand Colors (match web design-system.ts) ─────────────────
  static const Color primary = Color(0xFFEA580C);
  static const Color primaryDark = Color(0xFFDC2626);
  static const Color primaryLight = Color(0xFFFB923C);
  static const Color accent = Color(0xFFEA580C);
  static const Color accentLight = Color(0xFFFB923C);

  // ── Background & Surface ───────────────────────────────────────
  static const Color background = Color(0xFFF5F5F5);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceLight = Color(0xFFF9FAFB);
  static const Color surfaceBorder = Color(0xFFE5E5E5);

  // ── Text ───────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFF333333);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textMuted = Color(0xFF999999);

  // ── Semantic ───────────────────────────────────────────────────
  static const Color error = Color(0xFFD9534F);
  static const Color warning = Color(0xFFF0AD4E);
  static const Color success = Color(0xFF5CB85C);
  static const Color info = Color(0xFF5BC0DE);

  // ── Sport Colors ───────────────────────────────────────────────
  static const Map<String, Color> sportColors = {
    'Cricket': Color(0xFF16A34A),
    'Football': Color(0xFF2563EB),
    'Volleyball': Color(0xFFF59E0B),
    'Basketball': Color(0xFFDC2626),
    'Tennis': Color(0xFF7C3AED),
    'Pickleball': Color(0xFFDB2777),
  };

  // ── Amenity Icons ──────────────────────────────────────────────
  static const Map<String, String> amenityIcons = {
    'Parking': '🚗',
    'Floodlights': '💡',
    'Changing Room': '👕',
    'Washrooms': '🚿',
    'Drinking Water': '💧',
    'First Aid Kit': '🏥',
    'First Aid': '🏥',
    'Seating Area': '🪑',
    'Seating': '🪑',
    'AC': '❄️',
    'Cafeteria': '☕',
    'WiFi': '📶',
    'Water': '💧',
    'Equipment Rental': '⚽',
    'Scoreboard': '📊',
  };

  // ── Radius ─────────────────────────────────────────────────────
  static const double radiusS = 8;
  static const double radiusM = 12;
  static const double radiusL = 16;
  static const double radiusXL = 24;

  // ── Helper: parse "HH:MM" or "H" to hour int ──────────────────
  static int parseHour(String time) {
    if (time.contains(':')) {
      return int.tryParse(time.split(':')[0]) ?? 6;
    }
    return int.tryParse(time) ?? 6;
  }
}
