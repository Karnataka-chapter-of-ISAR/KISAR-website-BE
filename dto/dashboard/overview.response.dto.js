import { toEventResponseDto } from '../events/event.response.dto.js';

export function toDashboardOverviewResponseDto({ totalUsers, events, eventsCount, districtsCovered, yearsActive }) {
    return {
        totalUsers,
        events: events.map(toEventResponseDto),
        eventsCount,
        districtsCovered,
        yearsActive,
    };
}