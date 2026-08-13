import mongoose from 'mongoose';
import { MEMBER_EDIT_REQUEST_STATUS } from '../constants/members.js';

// One document per member-submitted edit (per set of fields changed together).
// previousValues doubles as the audit trail — this codebase has no other
// change-history mechanism for members.
const memberEditRequestSchema = new mongoose.Schema(
  {
    memberId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
    section:         { type: String, enum: ['details', 'membership'], required: true },
    fields:          { type: [String], required: true },
    proposedChanges: { type: mongoose.Schema.Types.Mixed, required: true },
    previousValues:  { type: mongoose.Schema.Types.Mixed, required: true },
    status:          { type: String, enum: MEMBER_EDIT_REQUEST_STATUS, default: 'pending' },
    submittedAt:     { type: Date, required: true },
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    reviewedAt:      { type: Date, default: null },
    rejectionReason: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

memberEditRequestSchema.index({ memberId: 1, status: 1 });
memberEditRequestSchema.index({ status: 1, submittedAt: 1 });

export default mongoose.model('MemberEditRequest', memberEditRequestSchema);
