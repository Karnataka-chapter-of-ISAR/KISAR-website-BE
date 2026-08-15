import mongoose from 'mongoose';
import { GALLERY_SIZES } from '../constants/gallery.js';

const gallerySchema = new mongoose.Schema(
  {
    title:     { type: String, required: true, trim: true },
    subtitle:  { type: String, trim: true, default: null },
    category:  { type: String, required: true, trim: true },
    size:      { type: String, enum: GALLERY_SIZES, default: 'normal' },
    image:     { type: String, required: true, trim: true },
    createdBy: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('Gallery', gallerySchema);
