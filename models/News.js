import mongoose from 'mongoose';
import { NEWS_CATEGORIES } from '../constants/news.js';

const newsSchema = new mongoose.Schema(
  {
    title:        { type: String, required: true, trim: true },
    category:     { type: String, required: true, enum: NEWS_CATEGORIES },
    excerpt:      { type: String, required: true, trim: true },
    content:      { type: String, required: true },
    author:       { type: String, required: true, trim: true },
    date:         { type: Date, required: true },
    bannerImage:  { type: String, trim: true, default: null },
    bannerVariant:{ type: Number, default: 1 },
    isFeatured:   { type: Boolean, default: false },
    createdBy:    { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('News', newsSchema);
