import mongoose from 'mongoose';

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
    designation:       { type: String, trim: true, default: null },
    specialization:    { type: String, trim: true, default: null },
    institution:       { type: String, trim: true, default: null },
    address:           { type: String, trim: true, default: null },
    city:              { type: String, trim: true, default: null },
    district:          { type: String, trim: true, default: null },
    state:             { type: String, trim: true, default: null },
    pincode:           { type: String, trim: true, default: null },
    country:           { type: String, trim: true, default: null },
    zone:              { type: String, trim: true, default: null },
    chapter:           { type: String, trim: true, default: null },
    linkedin:          { type: String, trim: true, default: null },
    joined:            { type: Number, default: null },
    privacy:           { type: String, enum: ['public', 'limited', 'private'], default: 'public' },
    lat:               { type: Number, default: null },
    lng:               { type: Number, default: null },
    colorIndex:        { type: Number, default: 0 },
    // Field names currently awaiting admin review — see MemberEditRequest.
    // Locked fields are disabled for further edits until approved/rejected.
    lockedFields:      { type: [String], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Member', memberSchema);
