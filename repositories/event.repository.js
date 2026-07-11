import Event from '../models/Event.js';

export function createEvent(data) {
  return Event.create(data);
}

export function findAllEvents() {
  return Event.find().sort({ date: 1, time: 1 }).lean();
}

export function findEventById(eventId) {
  return Event.findById(eventId).lean();
}

export function updateEvent(eventId, data) {
  return Event.findByIdAndUpdate(eventId, data, { new: true, runValidators: true }).lean();
}

export function deleteEvent(eventId) {
  return Event.findByIdAndDelete(eventId).lean();
}

export function registerMember(eventId, memberId) {
  return Event.findOneAndUpdate(
    {
      _id: eventId,
      registeredMembers: { $ne: memberId },
      $expr: { $lt: [{ $size: '$registeredMembers' }, '$capacity'] },
    },
    { $push: { registeredMembers: memberId } },
    { new: true },
  ).lean();
}
