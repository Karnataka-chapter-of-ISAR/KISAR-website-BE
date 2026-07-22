import path from 'path';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import authRoutes from './routes/auth.routes.js';
import membersRoutes from './routes/members.routes.js';
import eventsRoutes from './routes/events.routes.js';
import adminEventsRoutes from './routes/admin/events.routes.js';
import adminMembersRoutes from './routes/admin/members.routes.js';
import newsRoutes from './routes/news.routes.js';
import adminNewsRoutes from './routes/admin/news.routes.js';
import { UPLOADS_DIR } from './middleware/uploadBannerImage.js';
import { sendSuccess, sendError } from './utils/response.js';
import { MESSAGES } from './constants/messages.js';
import logger from './utils/logger.js';

dotenv.config();

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const app = express();
app.set('trust proxy', 1);
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://kisar.netlify.app,https://kisar-admin.netlify.app').split(',');
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(UPLOADS_DIR, '..')));

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

// health API
app.get('/', (req, res) => sendSuccess(res, { message: MESSAGES.GENERAL.SERVER_OK }));

app.use('/auth', authRoutes);

app.use('/members', membersRoutes);
app.use('/events', eventsRoutes);
app.use('/admin/events', adminEventsRoutes);
app.use('/admin/members', adminMembersRoutes);
app.use('/news', newsRoutes);
app.use('/admin/news', adminNewsRoutes);

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? MESSAGES.UPLOAD.FILE_TOO_LARGE : MESSAGES.UPLOAD.UPLOAD_ERROR;
    return sendError(res, { message, statusCode: 400 });
  }

  if (err?.message?.startsWith('Invalid file type')) {
    return sendError(res, { message: err.message, statusCode: 400 });
  }

  logger.error(`Unhandled error: ${err.stack || err.message}`);
  return sendError(res, { message: MESSAGES.GENERAL.INTERNAL_ERROR, statusCode: 500 });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

app.listen(process.env.PORT || 3000, () => {
  logger.info(`Server running on port ${process.env.PORT || 3000}`);
});
