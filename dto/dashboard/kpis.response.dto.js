function toNextEventDto(event) {
  if (!event) return null;

  return {
    id: event._id,
    title: event.title,
    date: event.date.toISOString().slice(0, 10),
    time: event.time,
    location: event.location,
  };
}

export function toDashboardKpisResponseDto({ totalMembers, upcomingEventsCount, nextEvent }) {
  return {
    totalMembers,
    upcomingEventsCount,
    nextEvent: toNextEventDto(nextEvent),
  };
}
