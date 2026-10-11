import dns from 'dns';
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
import adminAuthRoutes from './routes/admin/auth.routes.js';
import adminAdminsRoutes from './routes/admin/admins.routes.js';
import adminEventsRoutes from './routes/admin/events.routes.js';
import adminRegistrationsRoutes from './routes/admin/registrations.routes.js';
import adminMembersRoutes from './routes/admin/members.routes.js';
import adminMemberEditRequestsRoutes from './routes/admin/memberEditRequests.routes.js';
import newsRoutes from './routes/news.routes.js';
import adminNewsRoutes from './routes/admin/news.routes.js';
import registrationsRoutes from './routes/registrations.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import galleryRoutes from './routes/gallery.routes.js';
import adminGalleryRoutes from './routes/admin/gallery.routes.js';
import adminCategoriesRoutes from './routes/admin/categories.routes.js';
import adminMediaRoutes from './routes/admin/media.routes.js';
import adminDashboardRoutes from './routes/admin/dashboard.routes.js';
import adminMailsRoutes from './routes/admin/mails.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { sendSuccess, sendError } from './utils/response.js';
import { MESSAGES } from './constants/messages.js';
import logger from './utils/logger.js';
import { ensureDefaultCategories } from './services/category.service.js';
import { AppError } from './utils/AppError.js';
import { BULK_MAIL_BODY_LIMIT } from './constants/mails.js';

dotenv.config();

// Local-only: Node's resolver can end up pointed at 127.0.0.1 (no DNS listening),
// which breaks the mongodb+srv:// lookup with `querySrv ECONNREFUSED`.
if (process.env.NODE_ENV !== 'production') dns.setServers(['8.8.8.8', '1.1.1.1']);

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
      scriptSrc: ["'self'", 'https://maps.googleapis.com', 'https://maps.gstatic.com', 'https://sdk.cashfree.com'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc: ["'self'", 'data:', 'blob:', 'https://*.googleapis.com', 'https://*.gstatic.com', 'https://*.ggpht.com', 'https://*.cashfree.com', s3Origin],
      connectSrc: ["'self'", 'https://maps.googleapis.com', 'https://*.cashfree.com'],
      // Cashfree.js (payments) opens its checkout in a frame and loads its assets from *.cashfree.com.
      frameSrc: ["'self'", 'https://*.cashfree.com'],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      // Cashfree's redirect checkout POSTs the payment session to *.cashfree.com.
      formAction: ["'self'", 'https://*.cashfree.com'],
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
// Designed bulk emails carry a full HTML document, which blows past the default
// 100kb JSON limit. This must be registered before the global parser below —
// body-parser skips a request that has already been parsed.
app.use('/api/v1/admin/mails', express.json({ limit: BULK_MAIL_BODY_LIMIT }));
// Keep the raw bytes: the Cashfree webhook signature is computed over the exact body.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

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

// db health API
app.get(`${API_V1}/health/db`, (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  if (!dbConnected) {
    return sendError(res, { message: MESSAGES.GENERAL.DB_UNAVAILABLE, statusCode: 503, data: { db: 'down' } });
  }
  return sendSuccess(res, { message: MESSAGES.GENERAL.SERVER_OK, data: { db: 'up' } });
});

app.use(`${API_V1}/auth`, authRoutes);

app.use(`${API_V1}/members`, membersRoutes);
app.use(`${API_V1}/events`, eventsRoutes);
app.use(`${API_V1}/registrations`, registrationsRoutes);
app.use(`${API_V1}/payments`, paymentsRoutes);
app.use(`${API_V1}/admin/auth`, adminAuthRoutes);
app.use(`${API_V1}/admin/admins`, adminAdminsRoutes);
app.use(`${API_V1}/admin/events`, adminEventsRoutes);
app.use(`${API_V1}/admin/registrations`, adminRegistrationsRoutes);
app.use(`${API_V1}/admin/members`, adminMembersRoutes);
app.use(`${API_V1}/admin/member-edit-requests`, adminMemberEditRequestsRoutes);
app.use(`${API_V1}/news`, newsRoutes);
app.use(`${API_V1}/admin/news`, adminNewsRoutes);
app.use(`${API_V1}/gallery`, galleryRoutes);
app.use(`${API_V1}/admin/gallery`, adminGalleryRoutes);
app.use(`${API_V1}/admin/categories`, adminCategoriesRoutes);
app.use(`${API_V1}/admin/media`, adminMediaRoutes);
app.use(`${API_V1}/admin/dashboard`, adminDashboardRoutes);
app.use(`${API_V1}/admin/mails`, adminMailsRoutes);
app.use(`${API_V1}/kpi`, dashboardRoutes);

// Images referenced by outgoing emails (see templates/emails). Kept outside
// dist/ so they have stable, unhashed URLs that survive FE rebuilds.
app.use('/email', express.static(path.join(__dirname, 'public', 'email'), { maxAge: '7d' }));

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
    logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
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
