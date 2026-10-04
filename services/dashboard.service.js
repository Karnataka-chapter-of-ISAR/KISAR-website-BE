import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import { withRegisteredCounts } from './events.service.js';

function getYearsActive() {
  const [day, month, year] = process.env.DATE_START.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const now = new Date();

  let years = now.getFullYear() - start.getFullYear();
  const anniversaryPassed = now.getMonth() > start.getMonth()
    || (now.getMonth() === start.getMonth() && now.getDate() >= start.getDate());
  if (!anniversaryPassed) years -= 1;

  return years;
}

export async function getDashboardKpis() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalMembers, upcomingEventsCount, nextEvent] = await Promise.all([
    memberRepository.countMembers(),
    eventRepository.countUpcomingEvents(startOfToday),
    eventRepository.findNextEvent(startOfToday),
  ]);

  return { totalMembers, upcomingEventsCount, nextEvent };
}


export async function getDashboardOverview({ email } = {}) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [totalUsers, events, eventsCount, citiesCovered, member] = await Promise.all([
    memberRepository.countMembers(),
    eventRepository.findHighlightedEvents(startOfToday),
    eventRepository.countPastEvents(startOfToday),
    memberRepository.countDistinctCities(),
    email ? memberRepository.findMemberByEmail(email.toLowerCase()) : null,
  ]);

  const eventsWithCounts = await withRegisteredCounts(events);
  const registeredIds = member
    ? await registrationRepository.findRegisteredEventIds({ email: member.email, eventIds: events.map((event) => event._id) })
    : null;

  const eventsWithRegistration = registeredIds
    ? eventsWithCounts.map((event) => ({ ...event, registered: registeredIds.has(String(event._id)) }))
    : eventsWithCounts;

  return {
    totalUsers,
    events: eventsWithRegistration,
    eventsCount,
    citiesCovered,
    yearsActive: getYearsActive(),
  };
}