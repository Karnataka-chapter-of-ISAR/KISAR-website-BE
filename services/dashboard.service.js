import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import * as memberEditRequestRepository from '../repositories/memberEditRequest.repository.js';
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

const MEMBERSHIP_GROWTH_MONTHS = 12;

// Cumulative member count at the end of each of the last 12 calendar months
// (oldest first, current month last, which ends at today's total).
async function getMembershipGrowth(now = new Date()) {
  const windowStart = new Date(now.getFullYear(), now.getMonth() - (MEMBERSHIP_GROWTH_MONTHS - 1), 1);

  const [baseline, perMonth] = await Promise.all([
    memberRepository.countMembersCreatedBefore(windowStart),
    memberRepository.countMembersCreatedPerMonthSince(windowStart),
  ]);
  const addedByMonth = new Map(perMonth.map(({ year, month, count }) => [`${year}-${month}`, count]));

  let running = baseline;
  return Array.from({ length: MEMBERSHIP_GROWTH_MONTHS }, (_, i) => {
    const date = new Date(windowStart.getFullYear(), windowStart.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    running += addedByMonth.get(`${year}-${month}`) ?? 0;
    return { month: `${year}-${String(month).padStart(2, '0')}`, totalMembers: running };
  });
}

export async function getDashboardKpis() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

  const [
    totalMembers,
    membersAddedThisMonth,
    upcomingEventsCount,
    totalEventsHosted,
    eventsHostedThisMonth,
    totalRevenue,
    revenueThisMonth,
    pendingApprovals,
    membershipGrowth,
    nextEvent,
  ] =await Promise.all([
    memberRepository.countMembers(),
    memberRepository.countMembersCreatedSince(startOfMonth),
    eventRepository.countUpcomingEvents(startOfToday),
    eventRepository.countPastEvents(startOfToday),
    eventRepository.countEventsEndedBetween(startOfMonth, startOfToday),
    registrationRepository.sumConfirmedRevenue(),
    registrationRepository.sumConfirmedRevenue({ since: startOfMonth }),
    memberEditRequestRepository.countEditRequests({ status: 'pending' }),
    getMembershipGrowth(),
    eventRepository.findNextEvent(startOfToday),
  ]);

  const nextEventRegisteredCount = nextEvent
    ? (await registrationRepository.countConfirmedByEventIds([nextEvent._id])).get(String(nextEvent._id)) ?? 0
    : 0;

  return {
    totalMembers,
    membersAddedThisMonth,
    upcomingEventsCount,
    totalEventsHosted,
    eventsHostedThisMonth,
    totalRevenue,
    revenueThisMonth,
    pendingApprovals,
    membershipGrowth,
    nextEvent,
    nextEventRegisteredCount,
  };
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