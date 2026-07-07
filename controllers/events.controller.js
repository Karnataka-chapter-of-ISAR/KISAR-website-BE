import { validateCreateEventRequest } from '../dto/events/createEvent.request.dto.js';
import { toEventResponseDto } from '../dto/events/event.response.dto.js';
import { createEvent, listEvents } from '../services/events.service.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { MESSAGES } from '../constants/messages.js';

export async function createEventController(req, res) {
  const { valid, errors, data } = validateCreateEventRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.EVENTS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.file ? `/uploads/events/${req.file.filename}` : null;
  const event = await createEvent({ data, bannerImage, createdBy: req.admin?.email ?? null });

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.CREATE_SUCCESS,
    statusCode: 201,
    data: { event: toEventResponseDto(event) },
  });
}

export async function getEventsController(req, res) {
  const events = await listEvents();

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.FETCH_SUCCESS,
    data: { events: events.map(toEventResponseDto) },
  });
}
