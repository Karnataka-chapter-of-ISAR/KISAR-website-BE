import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default mongoose.model('Admin', adminSchema);
