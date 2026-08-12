import { toEventResponseDto } from '../events/event.response.dto.js';

export function toDashboardOverviewResponseDto({ totalUsers, events }) {
    return {
        totalUsers,
        events: events.map(toEventResponseDto),
    };
}