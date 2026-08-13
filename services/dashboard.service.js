import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';

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

  const [totalUsers, events, districts, member] = await Promise.all([
    memberRepository.countMembers(),
    eventRepository.findHighlightedEvents(startOfToday),
    memberRepository.countDistinctDistricts(),
    email ? memberRepository.findMemberByEmail(email.toLowerCase()) : null,
  ]);

  const eventsWithRegistration = member
    ? events.map((event) => ({
        ...event,
        registered: event.registeredMembers.some((id) => id.equals(member._id)),
      }))
    : events;

  return {
    totalUsers,
    events: eventsWithRegistration,
    eventsCount: events.length,
    districtsCovered: districts.length,
    yearsActive: getYearsActive(),
  };
}