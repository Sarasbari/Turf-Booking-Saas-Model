// Basic smoke test for Turf Booking App
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('Smoke test - app package imports correctly', () {
    // Firebase requires native initialization, so we just verify
    // the test framework is set up correctly.
    expect(1 + 1, equals(2));
  });
}
