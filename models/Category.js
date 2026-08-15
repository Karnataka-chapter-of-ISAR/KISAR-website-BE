import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
      enum: ['gallery', 'news', 'news-attachment'],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 80,
      index: true,
    },
    createdBy: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true },
);

categorySchema.index({ section: 1, slug: 1 }, { unique: true });

export default mongoose.model('Category', categorySchema);
