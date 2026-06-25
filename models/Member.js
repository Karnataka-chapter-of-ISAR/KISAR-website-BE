import mongoose from 'mongoose';

const memberSchema = new mongoose.Schema(
  {
    name:           { type: String, required: true, trim: true },
    email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    designation:    { type: String, trim: true, default: null },
    specialization: { type: String, trim: true, default: null },
    institution:    { type: String, trim: true, default: null },
    city:           { type: String, trim: true, default: null },
    district:       { type: String, trim: true, default: null },
    phone:          { type: String, trim: true, default: null },
    linkedin:       { type: String, trim: true, default: null },
    joined:         { type: Number, default: null },
    privacy:        { type: String, enum: ['public', 'limited', 'private'], default: 'public' },
    lat:            { type: Number, default: null },
    lng:            { type: Number, default: null },
    colorIndex:     { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model('Member', memberSchema);
