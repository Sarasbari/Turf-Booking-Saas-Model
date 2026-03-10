import fetch from 'node-fetch'; // if available

// Or using standard http
import http from 'http';

const data = JSON.stringify({
  razorpay_order_id: "order_test_123",
  razorpay_payment_id: "pay_test_123",
  razorpay_signature: "test_sig",
  bookingData: {
    turfId: "TRF123",
    slots: ["06:00"],
    date: "2026-03-10",
    totalPrice: 1,
    receipt: "TRF-2026-12345"
  }
});

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/payment/verify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
