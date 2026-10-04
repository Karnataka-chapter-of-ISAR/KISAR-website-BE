import Gallery from '../models/Gallery.js';
import Event from '../models/Event.js';

export function createGalleryItem(data) {
  return Gallery.create(data);
}

export function findAllGalleryItems() {
  return Gallery.find().sort({ createdAt: -1 }).lean();
}

const EVENT_TYPE_TO_GALLERY_CATEGORY = {
  Conference: 'conferences',
  Workshop: 'workshops',
  CME: 'cme',
};

// One page of the public gallery: admin gallery items unioned with every image
// attached to a past event (one tile per image), newest first. Done in a single
// aggregation so skip/limit and the total count apply across both sources.
export async function findPublicGalleryPage({ skip, limit, beforeDate }) {
  const [result] = await Gallery.aggregate([
    {
      $unionWith: {
        coll: Event.collection.name,
        pipeline: [
          { $match: { date: { $lt: beforeDate }, 'images.0': { $exists: true } } },
          { $unwind: { path: '$images', includeArrayIndex: 'imageIndex' } },
          {
            $project: {
              _id: { $concat: [{ $toString: '$_id' }, '-', { $toString: '$imageIndex' }] },
              title: 1,
              subtitle: '$location',
              location: 1,
              category: {
                $switch: {
                  branches: Object.entries(EVENT_TYPE_TO_GALLERY_CATEGORY).map(([type, category]) => ({
                    case: { $eq: ['$type', type] },
                    then: category,
                  })),
                  default: 'community',
                },
              },
              size: { $literal: 'normal' },
              image: '$images',
              source: { $literal: 'event' },
              eventId: '$_id',
              createdAt: '$date',
            },
          },
        ],
      },
    },
    { $sort: { createdAt: -1, _id: -1 } },
    {
      $facet: {
        items: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  return { items: result.items, totalCount: result.total[0]?.count ?? 0 };
}

export function findGalleryItemById(galleryId) {
  return Gallery.findById(galleryId).lean();
}

export function updateGalleryItem(galleryId, data) {
  return Gallery.findByIdAndUpdate(galleryId, data, { new: true, runValidators: true }).lean();
}

export function deleteGalleryItem(galleryId) {
  return Gallery.findByIdAndDelete(galleryId).lean();
}
