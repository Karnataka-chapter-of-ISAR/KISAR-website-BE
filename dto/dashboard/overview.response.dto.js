import { toEventResponseDto } from '../events/event.response.dto.js';

export function toDashboardOverviewResponseDto({ totalUsers, events, eventsCount, citiesCovered, yearsActive }) {
    return {
        totalUsers,
        events: events.map(toEventResponseDto),
        eventsCount,
        citiesCovered,
        yearsActive,
    };
}