import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { sendOTP, verifyOTP, otpRequestLimiter, refreshAccessToken, logout } from './routes/auth.js';
import { uploadMiddleware, importMembers } from './routes/members.js';
import { authenticateToken } from './middleware/authenticate.js';
import { sendSuccess, sendError } from './utils/response.js';
import { MESSAGES } from './constants/messages.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://kisar.netlify.app').split(',');
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// health API
app.get('/', (req, res) => sendSuccess(res, { message: MESSAGES.GENERAL.SERVER_OK }));

// Auth Registers
app.post('/auth/send-otp',  otpRequestLimiter, sendOTP);
app.post('/auth/verify-otp', verifyOTP);
app.post('/auth/refresh',    refreshAccessToken);
app.post('/auth/logout',     authenticateToken, logout);

app.get('/me', authenticateToken, (req, res) => {
  sendSuccess(res, { message: MESSAGES.USER.FETCH_SUCCESS, data: { email: req.user.email } });
});

// Members
app.post('/members/import', authenticateToken, uploadMiddleware, importMembers);

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port', process.env.PORT || 3000);
  });
});
