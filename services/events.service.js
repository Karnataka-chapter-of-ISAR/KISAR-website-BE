import mongoose from 'mongoose';
import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import { getEventRefundSummary, cancelRemainingRegistrations } from './refund.service.js';
import { deleteBannerImage } from '../utils/storage.js';
import { startOfToday, eventEndDate } from '../utils/date.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

// Attaches the number of confirmed registrations to each (lean) event.
export async function withRegisteredCounts(events) {
  const counts = await registrationRepository.countConfirmedByEventIds(events.map((event) => event._id));
  return events.map((event) => ({ ...event, registeredCount: counts.get(String(event._id)) ?? 0 }));
}

export async function createEvent({ data, bannerImage, createdBy }) {
  const event = await eventRepository.createEvent({ ...data, bannerImage, createdBy });
  return { ...event.toObject(), registeredCount: 0 };
}

export async function listEvents(search) {
  return withRegisteredCounts(await eventRepository.findAllEvents(search));
}

// Settles date/endDate on a partial update: a single-day event keeps following
// its start date when that moves, and the range must never end before it starts.
function resolveEventDates(payload, existing) {
  const start = payload.date ?? existing.date;
  const wasSingleDay = eventEndDate(existing).getTime() === existing.date.getTime();

  if (payload.endDate === undefined && payload.date !== undefined && wasSingleDay) {
    payload.endDate = payload.date;
  } else if (payload.endDate === null) {
    payload.endDate = start;
  }

  const end = payload.endDate ?? eventEndDate(existing);
  if (end < start) throw new AppError(MESSAGES.EVENTS.END_DATE_BEFORE_START, 422);
}

export async function updateEvent({ eventId, data, bannerImage }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (bannerImage) updatePayload.bannerImage = bannerImage;

  const needsExisting = bannerImage || data.date !== undefined || data.endDate !== undefined;
  const previousEvent = needsExisting ? await eventRepository.findEventById(eventId) : null;
  if (previousEvent && (data.date !== undefined || data.endDate !== undefined)) {
    resolveEventDates(updatePayload, previousEvent);
  }

  const event = await eventRepository.updateEvent(eventId, updatePayload);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  if (previousEvent?.bannerImage) await deleteBannerImage(previousEvent.bannerImage);

  const [withCount] = await withRegisteredCounts([event]);
  return withCount;
}

export async function deleteEvent(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const existing = await eventRepository.findEventById(eventId);
  if (!existing) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  // Past events (paid or free) are a permanent record — never deletable.
  if (new Date(eventEndDate(existing)) < startOfToday()) throw new AppError(MESSAGES.EVENTS.PAST_EVENT_NOT_DELETABLE, 409);

  // Paid registrations must all be refunded first (see refund.service).
  const refunds = await getEventRefundSummary({ eventId });
  if (!refunds.readyToDelete) throw new AppError(MESSAGES.EVENTS.PAID_REGISTRATIONS_EXIST, 409, { refunds });

  const event = await eventRepository.deleteEvent(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  await cancelRemainingRegistrations(event._id);

  if (event.bannerImage) await deleteBannerImage(event.bannerImage);

  return event;
}

export async function listEventsForMember(email) {
  const [events, member] = await Promise.all([
    eventRepository.findAllEvents(),
    memberRepository.findMemberByEmail(email.toLowerCase()),
  ]);

  const withCounts = await withRegisteredCounts(events);
  const registeredIds = member
    ? await registrationRepository.findRegisteredEventIds({ email: member.email, eventIds: events.map((event) => event._id) })
    : new Set();

  return withCounts.map((event) => ({ ...event, registered: registeredIds.has(String(event._id)) }));
}

export async function getEventAttendees({ eventId, status, skip, limit }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const [registrations, totalCount, registeredCount] = await Promise.all([
    registrationRepository.findForEventPaginated({ eventId, status, skip, limit }),
    registrationRepository.countForEvent({ eventId, status }),
    registrationRepository.countForEvent({ eventId }),
  ]);

  return { event, registrations, totalCount, registeredCount };
}
