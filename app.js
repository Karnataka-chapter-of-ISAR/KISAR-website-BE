import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import { sendOTP, verifyOTP, otpRequestLimiter, logout } from './routes/auth.js';
import { authenticateToken } from './middleware/authenticate.js';
import { sendSuccess, sendError } from './utils/response.js';
import { MESSAGES } from './constants/messages.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json());

// health API
app.get('/', (req, res) => sendSuccess(res, { message: MESSAGES.GENERAL.SERVER_OK }));

// Auth Registers
app.post('/auth/send-otp', otpRequestLimiter, sendOTP);
app.post('/auth/verify-otp', verifyOTP);
app.post('/auth/logout', authenticateToken, logout);

app.get('/me', authenticateToken, (req, res) => {
  sendSuccess(res, { message: MESSAGES.USER.FETCH_SUCCESS, data: { email: req.user.email } });
});

mongoose.connect(process.env.MONGODB_URI).then(() => {
  app.listen(process.env.PORT || 3000, () => {
    console.log('Server running on port', process.env.PORT || 3000);
  });
});
