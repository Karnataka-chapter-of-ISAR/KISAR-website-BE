import { validateCreateEventRequest } from '../dto/events/createEvent.request.dto.js';
import { validateUpdateEventRequest } from '../dto/events/updateEvent.request.dto.js';
import { toEventResponseDto } from '../dto/events/event.response.dto.js';
import { toEventAttendeeResponseDto } from '../dto/events/eventAttendee.response.dto.js';
import { createEvent, updateEvent, deleteEvent, listEventsForMember, getEventAttendees } from '../services/events.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { parsePagination, buildPaginationMeta } from '../utils/pagination.js';
import { MESSAGES } from '../constants/messages.js';
import { REGISTRATION_STATUS } from '../constants/events.js';
import { uploadBufferToS3, generateObjectKey } from '../utils/s3.js';

export async function createEventController(req, res) {
  const { valid, errors, data } = validateCreateEventRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.EVENTS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.file
    ? await uploadBufferToS3({ buffer: req.file.buffer, mimetype: req.file.mimetype, key: generateObjectKey('events', req.file.originalname) })
    : null;
  const event = await createEvent({ data, bannerImage, createdBy: req.admin?.email ?? null });

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.CREATE_SUCCESS,
    statusCode: 201,
    data: { event: toEventResponseDto(event) },
  });
}

export async function updateEventController(req, res) {
  const { valid, errors, data } = validateUpdateEventRequest(req.body);
  if (!valid) {
    return sendError(res, {
      message: MESSAGES.EVENTS.VALIDATION_ERROR,
      statusCode: 422,
      data: { errors },
    });
  }

  const bannerImage = req.file
    ? await uploadBufferToS3({ buffer: req.file.buffer, mimetype: req.file.mimetype, key: generateObjectKey('events', req.file.originalname) })
    : null;

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

// Standalone single-image upload used by the admin UI to build up the `images`
// array before sending it in create/update — stored under the same "events"
// S3 prefix as bannerImage.
export async function uploadEventImageController(req, res) {
  if (!req.file) {
    return sendError(res, {
      message: MESSAGES.UPLOAD.UPLOAD_ERROR,
      statusCode: 422,
      data: { errors: [MESSAGES.UPLOAD.FILE_REQUIRED] },
    });
  }

  const url = await uploadBufferToS3({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    key: generateObjectKey('events', req.file.originalname),
  });

  return sendSuccess(res, {
    message: MESSAGES.UPLOAD.UPLOAD_SUCCESS,
    statusCode: 201,
    data: { url },
  });
}

export async function getMyEventsController(req, res) {
  const events = await listEventsForMember(req.user.email);

  return sendSuccess(res, {
    message: MESSAGES.EVENTS.FETCH_SUCCESS,
    data: { events: events.map(toEventResponseDto) },
  });
}

export async function getEventAttendeesController(req, res) {
  const { page, limit, skip } = parsePagination(req.query);

  try {
    const status = Object.values(REGISTRATION_STATUS).includes(req.query.status) ? req.query.status : undefined;
    const { event, registrations, totalCount, registeredCount } = await getEventAttendees({ eventId: req.params.id, status, skip, limit });
    return sendSuccess(res, {
      message: MESSAGES.EVENTS.ATTENDEES_FETCH_SUCCESS,
      data: {
        event: {
          id:              event._id,
          title:           event.title,
          registeredCount,
        },
        attendees: registrations.map(toEventAttendeeResponseDto),
        pagination: buildPaginationMeta({ page, limit, totalCount }),
      },
    });
  } catch (err) {
    if (err instanceof AppError) {
      return sendError(res, { message: err.message, statusCode: err.statusCode, data: err.data });
    }
    throw err;
  }
}
