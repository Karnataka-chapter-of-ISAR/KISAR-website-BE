import mongoose from 'mongoose';

const pendingMemberImportSchema = new mongoose.Schema({
  batchId:   { type: String, required: true, unique: true, index: true },
  rows:      { type: Array, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  expiresAt: { type: Date, required: true },
});

// MongoDB auto-deletes documents when expiresAt is in the past
pendingMemberImportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('PendingMemberImport', pendingMemberImportSchema);
