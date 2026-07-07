import mongoose from 'mongoose';
import { EVENT_TYPES, TIME_FORMAT_REGEX } from '../constants/events.js';

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    type:        { type: String, required: true, enum: EVENT_TYPES },
    capacity:    { type: Number, required: true, min: 1 },
    date:        { type: Date, required: true },
    time:        { type: String, required: true, match: TIME_FORMAT_REGEX },
    location:    { type: String, required: true, trim: true },
    meetingLink: { type: String, trim: true, default: null },
    bannerImage: { type: String, trim: true, default: null },
    createdBy:   { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

export default mongoose.model('Event', eventSchema);
