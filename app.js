import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import authRoutes from './routes/auth.routes.js';
import membersRoutes from './routes/members.routes.js';
import eventsRoutes from './routes/events.routes.js';
import adminEventsRoutes from './routes/admin/events.routes.js';
import adminMembersRoutes from './routes/admin/members.routes.js';
import adminMemberEditRequestsRoutes from './routes/admin/memberEditRequests.routes.js';
import newsRoutes from './routes/news.routes.js';
import adminNewsRoutes from './routes/admin/news.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import adminGalleryRoutes from './routes/admin/gallery.routes.js';
import adminCategoriesRoutes from './routes/admin/categories.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { sendSuccess, sendError } from './utils/response.js';
import { MESSAGES } from './constants/messages.js';
import logger from './utils/logger.js';
import { ensureDefaultCategories } from './services/category.service.js';
import { AppError } from './utils/AppError.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FE_DIST_DIR = path.join(__dirname, 'dist');

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set and at least 32 characters long');
}

const app = express();
app.set('trust proxy', 1);

// CSP is tuned for what the SPA in dist/ actually loads: Google Fonts
// (fonts.googleapis.com/gstatic.com) and the Google Maps JS SDK
// (maps.googleapis.com/gstatic.com) used by the Member Map page. 'unsafe-inline'
// on styleSrc is required because the app sets inline style={{...}} for
// per-theme CSS variables and Google Maps' own injected styles — there's no
// practical nonce/hash story for those. crossOriginEmbedderPolicy uses
// 'credentialless' rather than the 'require-corp' default: Google Fonts/Maps
// and other third-party assets don't send back Cross-Origin-Resource-Policy
// headers, so 'require-corp' would block them outright; 'credentialless'
// still isolates the page (strips credentials on cross-origin subrequests)
// without requiring every third party to opt in. crossOriginResourcePolicy
// stays relaxed to cross-origin because banner/gallery/news images are served
// from the S3 bucket but consumed by the separately-hosted FEs
// (kisar.netlify.app, kisar-admin.netlify.app) — the default same-origin
// policy would silently break those images.
const s3Origin = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com`;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.ggpht.com', s3Origin],
      connectSrc: ["'self'", 'https://maps.googleapis.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: { policy: 'credentialless' },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://kisar.netlify.app,https://kisar-admin.netlify.app').split(',');
app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)), credentials: true }));
app.use(cookieParser());
app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

const API_V1 = '/api/v1';

// health API
app.get(`${API_V1}/health`, (req, res) => sendSuccess(res, { message: MESSAGES.GENERAL.SERVER_OK }));

app.use(`${API_V1}/auth`, authRoutes);

app.use(`${API_V1}/members`, membersRoutes);
app.use(`${API_V1}/events`, eventsRoutes);
app.use(`${API_V1}/admin/events`, adminEventsRoutes);
app.use(`${API_V1}/admin/members`, adminMembersRoutes);
app.use(`${API_V1}/admin/member-edit-requests`, adminMemberEditRequestsRoutes);
app.use(`${API_V1}/news`, newsRoutes);
app.use(`${API_V1}/admin/news`, adminNewsRoutes);
app.use(`${API_V1}/gallery`, galleryRoutes);
app.use(`${API_V1}/admin/gallery`, adminGalleryRoutes);
app.use(`${API_V1}/admin/categories`, adminCategoriesRoutes);
app.use(`${API_V1}/admin/dashboard`, adminDashboardRoutes);
app.use(`${API_V1}/kpi`, dashboardRoutes);

app.use(express.static(FE_DIST_DIR));

app.get('*', (req, res, next) => {
  if (req.path.startsWith(`${API_V1}/`)) {
    return next();
  }
  res.sendFile(path.join(FE_DIST_DIR, 'index.html'));
});

app.use((err, req, res, next) => {
  // A streaming response (e.g. the members export) can fail after headers
  // are already flushed — nothing left to do but log and let Express's
  // default handler close the connection, since a JSON error body can no
  // longer be sent.
  if (res.headersSent) {
    logger.error(`Error after headers sent: ${err.stack || err.message}`);
    return next(err);
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? MESSAGES.UPLOAD.FILE_TOO_LARGE : MESSAGES.UPLOAD.UPLOAD_ERROR;
    return sendError(res, { message, statusCode: 400 });
  }

  if (err?.message?.startsWith('Invalid file type')) {
    return sendError(res, { message: err.message, statusCode: 400 });
  }

  if (err instanceof AppError) {
    return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
  }

  logger.error(`Unhandled error: ${err.stack || err.message}`);
  return sendError(res, { message: MESSAGES.GENERAL.INTERNAL_ERROR, statusCode: 500 });
});

// Last-resort safety net: with every route handler wrapped in asyncHandler,
// rejections/throws inside a request should always reach the error middleware
// above instead of here. These log anything that still slips through outside
// a request context (e.g. a background task) so it's visible instead of
// silently crashing the process.
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled promise rejection: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.stack || err.message}`);
});

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    logger.info('MongoDB connected');
    await ensureDefaultCategories();
    logger.info('Default categories ensured');
  })
  .catch((err) => logger.error(`MongoDB connection error: ${err.message}`));

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB connection error: ${err.message}`);
});

app.listen(process.env.PORT || 3000, () => {
  logger.info(`Server running on port ${process.env.PORT || 3000}`);
});
