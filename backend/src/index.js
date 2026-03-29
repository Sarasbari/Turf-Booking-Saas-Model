// import dotenv from "dotenv";
// dotenv.config();

import express from "express";
import compression from 'compression';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import turfRoutes from './routes/turfRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { testRedis } from './config/redis.js';

const app = express();

// ✅ CORS — allow both localhost and production
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://bookmyturf-psi.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ✅ Handle preflight requests for ALL routes
app.options('*', cors());

app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Response time logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/turfs', turfRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Root health check — fixes the 404 on homepage
app.get('/', (req, res) => {
  res.json({ 
    status: '✅ BookMyTurf backend is live',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    message: 'Turf Booking API is running',
    timestamp: new Date().toISOString(),
  });
});

// ✅ Ping route for uptime monitoring
app.get('/ping', (req, res) => res.status(200).send('pong'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.url} not found`,
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ✅ Local dev only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    // Test Redis connection on startup
    await testRedis();
  });
}

// ✅ Export for Vercel — ES module style
export default app;