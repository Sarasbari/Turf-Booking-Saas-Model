import dotenv from 'dotenv';

dotenv.config();

export const config = {
    port: process.env.PORT || 5000,
    nodeEnv: process.env.NODE_ENV || 'development',
    
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: process.env.GOOGLE_REDIRECT_URI,
    },
    
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

    resend: {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: process.env.EMAIL_FROM || 'BookMyTurf <onboarding@resend.dev>',
    }
};

// Validate required environment variables
const requiredEnvVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REDIRECT_URI',
    'JWT_SECRET',
    'SESSION_SECRET',
    'RAZORPAY_KEY_ID',
    'RAZORPAY_KEY_SECRET',
    'FIREBASE_PROJECT_ID',
    'RESEND_API_KEY',
];

for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        console.error(`❌ Missing required environment variable: ${envVar}`);
        process.exit(1);
    }
}
