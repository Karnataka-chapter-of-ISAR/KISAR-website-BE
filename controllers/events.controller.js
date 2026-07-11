import { validateCreateEventRequest } from '../dto/events/createEvent.request.dto.js';
import { toEventResponseDto } from '../dto/events/event.response.dto.js';
import { createEvent, updateEvent, deleteEvent, listEventsForMember, registerForEvent } from '../services/events.service.js';
import { AppError } from '../utils/AppError.js';
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

export async function updateEventController(req, res) {
  const { valid, errors, data } = validateCreateEventRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.EVENTS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.file ? `/uploads/events/${req.file.filename}` : null;

  try {
    const event = await updateEvent({ eventId: req.params.id, data, bannerImage });
    return sendSuccess(res, {
      message: MESSAGES.EVENTS.UPDATE_SUCCESS,
      data: { event: toEventResponseDto(event) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function deleteEventController(req, res) {
  try {
    await deleteEvent(req.params.id);
    return sendSuccess(res, { message: MESSAGES.EVENTS.DELETE_SUCCESS });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}

export async function getMyEventsController(req, res) {
  const events = await listEventsForMember(req.user.email);

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.FETCH_SUCCESS,
    data: { events: events.map(toEventResponseDto) },
  });
}

export async function registerForEventController(req, res) {
  try {
    const event = await registerForEvent({ eventId: req.params.id, email: req.user.email });
    return sendSuccess(res, {
      message: MESSAGES.EVENTS.REGISTER_SUCCESS,
      data: { event: toEventResponseDto(event) },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
