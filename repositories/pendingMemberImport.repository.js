import PendingMemberImport from '../models/PendingMemberImport.js';

export function createBatch({ batchId, rows, createdBy, expiresAt }) {
  return PendingMemberImport.create({ batchId, rows, createdBy, expiresAt });
}

export function findActiveBatch(batchId) {
  return PendingMemberImport.findOne({ batchId, expiresAt: { $gt: new Date() } }).lean();
}

export function deleteBatch(batchId, session) {
  return PendingMemberImport.deleteOne({ batchId }, { session });
}
