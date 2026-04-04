import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',

    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d', // Token expires in 7 days
    },
    
    session: {
        secret: process.env.SESSION_SECRET,
    },
    
    frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:5173',
    },

    razorpay: {
        keyId: process.env.RAZORPAY_KEY_ID,
        keySecret: process.env.RAZORPAY_KEY_SECRET,
    },

    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID,
    },

    brevo: {
        apiKey: process.env.BREVO_API_KEY,
        senderEmail: process.env.BREVO_SENDER_EMAIL,
        senderName: process.env.BREVO_SENDER_NAME || 'aLiveHub',
    },

    // Upstash Redis (optional — caching degrades gracefully without it)
    redis: {
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },

    // BullMQ — ioredis TCP connection (optional — emails fall back to direct send)
    bullmq: {
        redisUrl: process.env.REDIS_URL,
    },

    // Admin secret for Bull Board dashboard
    adminSecret: process.env.ADMIN_SECRET,
};

// Validate required environment variables
const requiredEnvVars = [
    'JWT_SECRET',
    'SESSION_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'FIREBASE_PROJECT_ID',
    'BREVO_API_KEY',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
