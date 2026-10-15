import * as activityRepository from '../repositories/activity.repository.js';
import { ACTIVITY_TYPES, ACTIVITY_MAX_ITEMS } from '../constants/activity.js';
import logger from '../utils/logger.js';

// Best-effort: an activity-log failure must never fail the admin action it describes.
export async function recordActivity({ type, admin, metadata }) {
  try {
    await activityRepository.createLog({
      type,
      actorName: admin?.name ?? null,
      actorEmail: admin?.email ?? null,
      metadata,
    });
  } catch (err) {
    logger.error(`[recordActivity] failed to log ${type}: ${err.message}`);
  }
}

function formatMailMessage({ sentCount, failedCount }) {
  const total = sentCount + failedCount;
  return `Sent to ${total} member${total === 1 ? '' : 's'}: ${sentCount} delivered, ${failedCount} failed`;
}

const toLoggedActivity = (log) => {
  const base = { id: String(log._id), type: log.type, timestamp: log.createdAt };
  const actor = log.actorName ?? log.actorEmail ?? null;

  if (log.type === ACTIVITY_TYPES.BULK_MAIL_SENT) {
    const { subject = null, sentCount = 0, failedCount = 0 } = log.metadata ?? {};
    return {
      ...base,
      title: 'Bulk mail sent',
      message: formatMailMessage({ sentCount, failedCount }),
      actor,
      metadata: { subject, sentCount, failedCount },
    };
  }

  const { count = 0 } = log.metadata ?? {};
  return {
    ...base,
    title: 'Members bulk uploaded',
    message: `${count} new member${count === 1 ? '' : 's'} added`,
    actor,
    metadata: { count },
  };
};

// Activities from the 1st of the current month until now, newest first.
export async function getRecentActivity(now = new Date()) {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [logs, payments, editRequests, news, events, admins] = await Promise.all([
    activityRepository.findLogsSince(startOfMonth),
    activityRepository.findPaymentsSince(startOfMonth),
    activityRepository.findEditRequestsSince(startOfMonth),
    activityRepository.findNewsSince(startOfMonth),
    activityRepository.findEventsSince(startOfMonth),
    activityRepository.findAdminsSince(startOfMonth),
  ]);

  const activities = [
    ...logs.map(toLoggedActivity),
    ...payments.map((reg) => ({
      id: `payment-${reg._id}`,
      type: ACTIVITY_TYPES.PAYMENT_RECEIVED,
      title: 'Payment received',
      message: `${reg.name} paid ${reg.currency} ${reg.amount} for ${reg.eventTitle}`,
      actor: reg.name,
      timestamp: reg.payment.paidAt,
      metadata: { amount: reg.amount, currency: reg.currency, eventTitle: reg.eventTitle },
    })),
    ...editRequests.map((request) => {
      const memberName = request.memberId?.name ?? 'A member';
      return {
        id: `approval-${request._id}`,
        type: ACTIVITY_TYPES.APPROVAL_REQUESTED,
        title: 'Approval request submitted',
        message: `${memberName} requested a change to ${(request.fields ?? []).join(', ')}`,
        actor: memberName,
        timestamp: request.submittedAt,
        metadata: { section: request.section, fields: request.fields ?? [], status: request.status },
      };
    }),
    ...news.map((item) => ({
      id: `article-${item._id}`,
      type: ACTIVITY_TYPES.ARTICLE_PUBLISHED,
      title: 'Article published',
      message: `"${item.title}" was published`,
      actor: item.author ?? null,
      timestamp: item.createdAt,
      metadata: { title: item.title },
    })),
    ...events.map((event) => ({
      id: `event-${event._id}`,
      type: ACTIVITY_TYPES.EVENT_CREATED,
      title: 'Event created',
      message: `"${event.title}" was created`,
      actor: event.createdBy ?? null,
      timestamp: event.createdAt,
      metadata: { title: event.title },
    })),
    ...admins.map((admin) => ({
      id: `admin-${admin._id}`,
      type: ACTIVITY_TYPES.ADMIN_ADDED,
      title: 'Admin added',
      message: `${admin.name} was added as an admin`,
      actor: null,
      timestamp: admin.createdAt,
      metadata: { name: admin.name, email: admin.email },
    })),
  ];

  return activities
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, ACTIVITY_MAX_ITEMS);
}
