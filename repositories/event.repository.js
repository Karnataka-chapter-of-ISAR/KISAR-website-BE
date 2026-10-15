import Event from '../models/Event.js';
import { EVENT_SEARCHABLE_STRING_FIELDS } from '../constants/events.js';
import { escapeRegex } from '../utils/regex.js';

// Events without `endDate` (legacy / single-day) end on their start date.
const endsOnOrAfter = (date) => ({ $or: [{ endDate: { $gte: date } }, { endDate: null, date: { $gte: date } }] });
const endedBefore = (date) => ({ $or: [{ endDate: { $lt: date } }, { endDate: null, date: { $lt: date } }] });

// Case-insensitive substring match across every searchable string field, plus
// a match on events running on that day when the term parses as a date (e.g. "2026-08-14").
function buildEventSearchFilter(search) {
  if (!search || !search.trim()) return {};

  const term = search.trim();
  const pattern = new RegExp(escapeRegex(term), 'i');
  const or = EVENT_SEARCHABLE_STRING_FIELDS.map(field => ({ [field]: pattern }));

  const parsedDate = new Date(term);
  if (!isNaN(parsedDate.getTime())) {
    const startOfDay = new Date(parsedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);
    or.push({ date: { $lt: endOfDay }, ...endsOnOrAfter(startOfDay) });
  }

  return { $or: or };
}

export function createEvent(data) {
  return Event.create(data);
}

export function findAllEvents(search) {
  return Event.find(buildEventSearchFilter(search)).sort({ date: 1, time: 1 }).lean();
}

export function findHighlightedEvents(fromDate) {
  return Event.find({ isHighlighted: true, ...endsOnOrAfter(fromDate) }).sort({ date: 1, time: 1 }).lean();
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

export function closeRegistrations(eventId) {
  return Event.findByIdAndUpdate(eventId, { registrationsClosed: true }, { new: true }).lean();
}

export function countUpcomingEvents(fromDate) {
  return Event.countDocuments(endsOnOrAfter(fromDate));
}

export function countPastEvents(beforeDate) {
  return Event.countDocuments(endedBefore(beforeDate));
}

// Events that finished within [fromDate, beforeDate).
export function countEventsEndedBetween(fromDate, beforeDate) {
  return Event.countDocuments({
    $or: [
      { endDate: { $gte: fromDate, $lt: beforeDate } },
      { endDate: null, date: { $gte: fromDate, $lt: beforeDate } },
    ],
  });
}

export function findNextEvent(fromDate) {
  return Event.findOne(endsOnOrAfter(fromDate)).sort({ date: 1, time: 1 }).lean();
}
