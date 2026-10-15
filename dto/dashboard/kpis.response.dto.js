function toNextEventDto(event, registeredCount) {
  if (!event) return null;

  return {
    id: event._id,
    registeredCount,
    title: event.title,
    date: event.date.toISOString().slice(0, 10),
    endDate: (event.endDate ?? event.date).toISOString().slice(0, 10),
    time: event.time,    location: event.location,
  };
}

export function toDashboardKpisResponseDto({
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
}) {
  return {
    totalMembers,
    membersAddedThisMonth,
    upcomingEventsCount,
    totalEventsHosted,
    eventsHostedThisMonth,
    pendingApprovals,
    membershipGrowth,
    nextEvent: toNextEventDto(nextEvent, nextEventRegisteredCount),
    totalRevenue,
    revenueThisMonth,
  };
}
