import mongoose from 'mongoose';
import { LOGGED_ACTIVITY_TYPES } from '../constants/activity.js';

// Only for admin actions that leave no record anywhere else (bulk mail,
// bulk member upload). Every other dashboard activity is derived from the
// collection it belongs to, so it is not duplicated here.
const activityLogSchema = new mongoose.Schema(
  {
    type:       { type: String, required: true, enum: LOGGED_ACTIVITY_TYPES },
    actorName:  { type: String, trim: true, default: null },
    actorEmail: { type: String, trim: true, default: null },
    metadata:   { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });

export default mongoose.model('ActivityLog', activityLogSchema);
