import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';

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


export async function getDashboardOverview() {
  const [totalUsers, events] = await Promise.all([
    memberRepository.countMembers(),
    eventRepository.findAllEvents(),
  ]);

  return { totalUsers, events };
}