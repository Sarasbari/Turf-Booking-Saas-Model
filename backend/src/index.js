import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

const app = express();

// Middleware
app.use(cors({
    origin: config.frontend.url,
    credentials: true, // Allow cookies to be sent
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Turf Booking API is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        error: 'Not Found',
        message: `Route ${req.method} ${req.url} not found` 
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(config.nodeEnv === 'development' && { stack: err.stack }),
    });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${config.nodeEnv}`);
    console.log(`🌐 Frontend URL: ${config.frontend.url}`);
    console.log(`🔐 Google OAuth configured`);
});

export default app;
