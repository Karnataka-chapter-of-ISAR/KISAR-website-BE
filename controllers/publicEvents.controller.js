import { toEventResponseDto } from '../dto/events/event.response.dto.js';
import { listEvents } from '../services/events.service.js';
import { sendSuccess } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function getEventsController(req, res) {
  const events = await listEvents(req.query.search);

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.FETCH_SUCCESS,
    data: { events: events.map(toEventResponseDto) },
  });
}
