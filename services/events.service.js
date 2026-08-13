import mongoose from 'mongoose';
import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import { deleteBannerImage } from '../utils/storage.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

export async function createEvent({ data, bannerImage, createdBy }) {
  return eventRepository.createEvent({ ...data, bannerImage, createdBy });
}

export async function listEvents() {
  return eventRepository.findAllEvents();
}

export async function updateEvent({ eventId, data, bannerImage }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (bannerImage) updatePayload.bannerImage = bannerImage;

  const previousEvent = bannerImage ? await eventRepository.findEventById(eventId) : null;

  const event = await eventRepository.updateEvent(eventId, updatePayload);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  if (previousEvent?.bannerImage) await deleteBannerImage(previousEvent.bannerImage);

  return event;
}

export async function deleteEvent(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.deleteEvent(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  if (event.bannerImage) await deleteBannerImage(event.bannerImage);

  return event;
}

export async function listEventsForMember(email) {
  const [events, member] = await Promise.all([
    eventRepository.findAllEvents(),
    memberRepository.findMemberByEmail(email.toLowerCase()),
  ]);

  return events.map((event) => ({
    ...event,
    registered: member ? event.registeredMembers.some((id) => id.equals(member._id)) : false,
  }));
}

export async function getEventAttendees({ eventId, skip, limit }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const memberIds = event.registeredMembers;
  const [members, totalCount] = await Promise.all([
    memberIds.length > 0 ? memberRepository.findMembersByIdsPaginated({ ids: memberIds, skip, limit }) : [],
    memberIds.length > 0 ? memberRepository.countMembersByIds(memberIds) : 0,
  ]);

  return { event, members, totalCount };
}

export async function registerForEvent({ eventId, email }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const member = await memberRepository.findMemberByEmail(email.toLowerCase());
  if (!member) throw new AppError(MESSAGES.EVENTS.NOT_A_MEMBER, 403);

  const updatedEvent = await eventRepository.registerMember(eventId, member._id);
  if (updatedEvent) return updatedEvent;

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const alreadyRegistered = event.registeredMembers.some((id) => id.equals(member._id));
  if (alreadyRegistered) throw new AppError(MESSAGES.EVENTS.ALREADY_REGISTERED, 409);

  throw new AppError(MESSAGES.EVENTS.EVENT_FULL, 409);
}
