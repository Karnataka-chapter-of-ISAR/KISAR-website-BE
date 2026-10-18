import mongoose from 'mongoose';
import { MEMBER_SOURCE } from '../constants/members.js';

const memberSchema = new mongoose.Schema(
  {
    memberId:          { type: String, unique: true, sparse: true, trim: true },
    ISARMemberID:      { type: String, required: true, unique: true, sparse: true, trim: true },
    name:              { type: String, required: true, trim: true },
    title:             { type: String, trim: true, default: null },
    membershipCategory:{ type: String, trim: true, default: null },
    email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    alternateEmail:    { type: String, trim: true, lowercase: true, default: null },
    phone:             { type: String, trim: true, default: null },
    alternatePhone:    { type: String, trim: true, default: null },
    address:           { type: String, trim: true, default: null },
    city:              { type: String, trim: true, default: null },
    district:          { type: String, trim: true, default: null },
    state:             { type: String, trim: true, default: null },
    pincode:           { type: String, trim: true, default: null },
    country:           { type: String, trim: true, default: null },
    zone:              { type: String, trim: true, default: null },
    chapter:           { type: String, trim: true, default: null },
    socialMedia:       { type: String, trim: true, default: null },
    joined:            { type: Number, default: null },
    colorIndex:        { type: Number, default: 0 },
    experience:        { type: String, trim: true, default: null },
    // Field names currently awaiting admin review — see MemberEditRequest.
    // Locked fields are disabled for further edits until approved/rejected.
    lockedFields:      { type: [String], default: [] },
    // 'manual' = added via the admin portal's "Add member", 'bulk_upload' = via
    // the bulk import. null for members created before this field existed.
    source:            { type: String, enum: Object.values(MEMBER_SOURCE), default: null },
  },
  { timestamps: true },
);

export default mongoose.model('Member', memberSchema);
