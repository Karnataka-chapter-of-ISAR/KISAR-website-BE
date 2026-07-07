import Event from '../models/Event.js';

export function createEvent(data) {
  return Event.create(data);
}

export function findAllEvents() {
  return Event.find().sort({ date: 1, time: 1 }).lean();
}
