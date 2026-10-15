import ActivityLog from '../models/ActivityLog.js';
import Registration from '../models/Registration.js';
import MemberEditRequest from '../models/MemberEditRequest.js';
import News from '../models/News.js';
import Event from '../models/Event.js';
import Admin from '../models/Admin.js';
import { ACTIVITY_PER_SOURCE_LIMIT as LIMIT } from '../constants/activity.js';

export function createLog(data) {
  return ActivityLog.create(data);
}

export function findLogsSince(since) {
  return ActivityLog.find({ createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(LIMIT).lean();
}

// Every registration that was actually paid for, whatever happened to it afterwards.
export function findPaymentsSince(since) {
  return Registration.find(
    { 'payment.paidAt': { $gte: since } },
    { name: 1, eventTitle: 1, amount: 1, currency: 1, payment: 1 },
  ).sort({ 'payment.paidAt': -1 }).limit(LIMIT).lean();
}

export function findEditRequestsSince(since) {
  return MemberEditRequest.find({ submittedAt: { $gte: since } })
    .sort({ submittedAt: -1 })
    .limit(LIMIT)
    .populate('memberId', 'name')
    .lean();
}

export function findNewsSince(since) {
  return News.find({ createdAt: { $gte: since } }, { title: 1, author: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(LIMIT).lean();
}

export function findEventsSince(since) {
  return Event.find({ createdAt: { $gte: since } }, { title: 1, createdBy: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(LIMIT).lean();
}

export function findAdminsSince(since) {
  return Admin.find({ createdAt: { $gte: since } }, { name: 1, email: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(LIMIT).lean();
}
