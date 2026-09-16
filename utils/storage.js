import { deleteObjectFromS3 } from './s3.js';

// Single point of contact for removing a stored banner image from S3.
// Call sites stay the same regardless of how the object is actually stored.
export async function deleteBannerImage(bannerImageUrl) {
  await deleteObjectFromS3(bannerImageUrl);
}

export async function deleteNewsBannerImage(bannerImageUrl) {
  await deleteObjectFromS3(bannerImageUrl);
}

export async function deleteNewsAttachment(attachmentUrl) {
  await deleteObjectFromS3(attachmentUrl);
}

export async function deleteGalleryImage(imageUrl) {
  await deleteObjectFromS3(imageUrl);
}
