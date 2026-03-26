import 'package:flutter/material.dart';

class AppTheme {
  // ── Brand Colors ───────────────────────────────────────────────
  static const Color primary = Color(0xFF22C55E);       // green-500
  static const Color primaryDark = Color(0xFF16A34A);    // green-600
  static const Color accent = Color(0xFF10B981);         // emerald-500
  static const Color accentLight = Color(0xFF34D399);    // emerald-400

  // ── Background & Surface ───────────────────────────────────────
  static const Color background = Color(0xFF0F172A);      // slate-900
  static const Color surface = Color(0xFF1E293B);         // slate-800
  static const Color surfaceLight = Color(0xFF334155);    // slate-700
  static const Color surfaceBorder = Color(0xFF475569);   // slate-600

  // ── Text ───────────────────────────────────────────────────────
  static const Color textPrimary = Color(0xFFF8FAFC);     // slate-50
  static const Color textSecondary = Color(0xFF94A3B8);   // slate-400
  static const Color textMuted = Color(0xFF64748B);       // slate-500

  // ── Semantic ───────────────────────────────────────────────────
  static const Color error = Color(0xFFEF4444);           // red-500
  static const Color warning = Color(0xFFF59E0B);         // amber-500
  static const Color success = Color(0xFF22C55E);         // green-500
  static const Color info = Color(0xFF3B82F6);            // blue-500

  // ── Sport Colors ───────────────────────────────────────────────
  static const Map<String, Color> sportColors = {
    'Cricket': Color(0xFF22C55E),
    'Football': Color(0xFF3B82F6),
    'Volleyball': Color(0xFFF59E0B),
    'Basketball': Color(0xFFEF4444),
    'Tennis': Color(0xFF8B5CF6),
    'Pickleball': Color(0xFFEC4899),
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
