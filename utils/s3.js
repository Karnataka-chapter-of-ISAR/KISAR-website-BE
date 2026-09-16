import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import logger from './logger.js';

const REGION = process.env.AWS_REGION;
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

function buildObjectUrl(key) {
  return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;
}

// Deterministic naming scheme carried over from the old disk-storage middleware,
// namespaced under a feature prefix (e.g. "events", "gallery", "news") as the S3 key prefix.
export function generateObjectKey(prefix, originalname) {
  const dotIndex = originalname.lastIndexOf('.');
  const ext = dotIndex !== -1 ? originalname.slice(dotIndex).toLowerCase() : '';
  return `${prefix}/${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

export async function uploadBufferToS3({ buffer, mimetype, key }) {
  await s3Client.send(new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }));

  return buildObjectUrl(key);
}

// Single point of contact for removing a stored object — accepts either a full
// S3 URL (current records) or a legacy local path like "/uploads/events/x.jpg"
// (pre-migration records), the latter simply no-ops since that key won't exist in the bucket.
export async function deleteObjectFromS3(fileUrl) {
  if (!fileUrl) return;

  const marker = '.amazonaws.com/';
  const markerIndex = fileUrl.indexOf(marker);
  const key = markerIndex !== -1 ? fileUrl.slice(markerIndex + marker.length) : fileUrl.replace(/^\/+/, '');
  if (!key) return;

  try {
    await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (err) {
    logger.error(`[deleteObjectFromS3] Failed to delete ${key}: ${err.message}`);
  }
}
