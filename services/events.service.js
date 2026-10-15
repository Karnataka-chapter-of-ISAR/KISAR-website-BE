import mongoose from 'mongoose';
import ExcelJS from 'exceljs';
import { digitsToNumber } from '../utils/excel.js';
import * as eventRepository from '../repositories/event.repository.js';
import * as memberRepository from '../repositories/member.repository.js';
import * as registrationRepository from '../repositories/registration.repository.js';
import { getEventRefundSummary, cancelRemainingRegistrations } from './refund.service.js';
import { deleteBannerImage } from '../utils/storage.js';
import { startOfToday, eventEndDate } from '../utils/date.js';
import { AppError } from '../utils/AppError.js';
import { MESSAGES } from '../constants/messages.js';

// Attaches the number of confirmed registrations to each (lean) event.
export async function withRegisteredCounts(events) {
  const counts = await registrationRepository.countConfirmedByEventIds(events.map((event) => event._id));
  return events.map((event) => ({ ...event, registeredCount: counts.get(String(event._id)) ?? 0 }));
}

export async function createEvent({ data, bannerImage, createdBy }) {
  const event = await eventRepository.createEvent({ ...data, bannerImage, createdBy });
  return { ...event.toObject(), registeredCount: 0 };
}

export async function listEvents(search) {
  return withRegisteredCounts(await eventRepository.findAllEvents(search));
}

// Settles date/endDate on a partial update: a single-day event keeps following
// its start date when that moves, and the range must never end before it starts.
function resolveEventDates(payload, existing) {
  const start = payload.date ?? existing.date;
  const wasSingleDay = eventEndDate(existing).getTime() === existing.date.getTime();

  if (payload.endDate === undefined && payload.date !== undefined && wasSingleDay) {
    payload.endDate = payload.date;
  } else if (payload.endDate === null) {
    payload.endDate = start;
  }

  const end = payload.endDate ?? eventEndDate(existing);
  if (end < start) throw new AppError(MESSAGES.EVENTS.END_DATE_BEFORE_START, 422);
}

export async function updateEvent({ eventId, data, bannerImage }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const updatePayload = { ...data };
  if (bannerImage) updatePayload.bannerImage = bannerImage;

  const needsExisting = bannerImage || data.date !== undefined || data.endDate !== undefined;
  const previousEvent = needsExisting ? await eventRepository.findEventById(eventId) : null;
  if (previousEvent && (data.date !== undefined || data.endDate !== undefined)) {
    resolveEventDates(updatePayload, previousEvent);
  }

  const event = await eventRepository.updateEvent(eventId, updatePayload);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  if (previousEvent?.bannerImage) await deleteBannerImage(previousEvent.bannerImage);

  const [withCount] = await withRegisteredCounts([event]);
  return withCount;
}

export async function deleteEvent(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const existing = await eventRepository.findEventById(eventId);
  if (!existing) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  // Past events (paid or free) are a permanent record — never deletable.
  if (new Date(eventEndDate(existing)) < startOfToday()) throw new AppError(MESSAGES.EVENTS.PAST_EVENT_NOT_DELETABLE, 409);

  // Paid registrations must all be refunded first (see refund.service).
  const refunds = await getEventRefundSummary({ eventId });
  if (!refunds.readyToDelete) throw new AppError(MESSAGES.EVENTS.PAID_REGISTRATIONS_EXIST, 409, { refunds });

  const event = await eventRepository.deleteEvent(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  await cancelRemainingRegistrations(event._id);

  if (event.bannerImage) await deleteBannerImage(event.bannerImage);

  return event;
}

export async function listEventsForMember(email) {
  const [events, member] = await Promise.all([
    eventRepository.findAllEvents(),
    memberRepository.findMemberByEmail(email.toLowerCase()),
  ]);

  const withCounts = await withRegisteredCounts(events);
  const registeredIds = member
    ? await registrationRepository.findRegisteredEventIds({ email: member.email, eventIds: events.map((event) => event._id) })
    : new Set();

  return withCounts.map((event) => ({ ...event, registered: registeredIds.has(String(event._id)) }));
}

export async function getEventAttendees({ eventId, status, skip, limit }) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const [registrations, totalCount, registeredCount] = await Promise.all([
    registrationRepository.findForEventPaginated({ eventId: event._id, status, skip, limit }),
    registrationRepository.countForEvent({ eventId, status }),
    registrationRepository.countForEvent({ eventId }),
  ]);

  return { event, registrations, totalCount, registeredCount };
}

// Throws (404) before any bytes are written, so the controller can still send a JSON error.
export async function getEventForExport(eventId) {
  if (!mongoose.Types.ObjectId.isValid(eventId)) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);

  const event = await eventRepository.findEventById(eventId);
  if (!event) throw new AppError(MESSAGES.EVENTS.NOT_FOUND, 404);
  return event;
}

const formatExportDateTime = (date) => (date
  ? new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' })
  : '');

const formatAnswerValue = (value) => {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return value ?? '';
};

// Streams an event's registrations (one status, like the admin tab: confirmed
// unless another is asked for) into an .xlsx written directly to `res`. One
// column per registration question the event defines, after the fixed ones.
export async function streamEventAttendeesToExcel({ event, status, res, baseUrl }) {
  const questions = event.registrationFields ?? [];
  const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: false, useSharedStrings: false });
  const worksheet = workbook.addWorksheet('Registrations');
  worksheet.columns = [
    { header: 'Name', key: 'name' },
    { header: 'Email', key: 'email' },
    { header: 'Phone', key: 'phone' },
    { header: 'Member / Non-member', key: 'memberType' },
    { header: 'KISAR ID', key: 'kisarId' },
    { header: 'ISAR Member ID', key: 'isarMemberId' },
    { header: 'Status', key: 'status' },
    { header: 'Entry Fee', key: 'baseAmount' },
    { header: 'CGST', key: 'cgst' },
    { header: 'SGST', key: 'sgst' },
    { header: 'Total Paid', key: 'amount' },
    { header: 'Invoice No', key: 'invoiceNumber' },
    { header: 'Invoice Link', key: 'invoiceLink' },
    { header: 'Paid At', key: 'paidAt' },
    { header: 'Registered At', key: 'registeredAt' },
    ...questions.map((question) => ({ header: question.label, key: `answer_${question.key}` })),
  ];

  for await (const registration of registrationRepository.getForEventCursor({ eventId: event._id, status })) {
    const answersByKey = new Map((registration.answers ?? []).map((answer) => [answer.key, answer.value]));
    const row = {
      name: registration.name,
      email: registration.email,
      phone: digitsToNumber(registration.phone),
      memberType: registration.isMember ? 'Member' : 'Non-member',
      kisarId: registration.kisarId ?? '',
      isarMemberId: digitsToNumber(registration.isarMemberId ?? ''),
      status: registration.status,
      baseAmount: registration.baseAmount ?? '',
      cgst: registration.cgst ?? '',
      sgst: registration.sgst ?? '',
      amount: registration.amount,
      invoiceNumber: registration.invoice?.number ?? '',
      // Clickable hyperlink cell; opens the PDF when the admin is signed in.
      invoiceLink: registration.invoice?.number
        ? { text: 'View invoice', hyperlink: `${baseUrl}/api/v1/admin/registrations/${registration._id}/invoice` }
        : '',
      paidAt: formatExportDateTime(registration.payment?.paidAt),
      registeredAt: formatExportDateTime(registration.createdAt),
    };
    for (const question of questions) row[`answer_${question.key}`] = formatAnswerValue(answersByKey.get(question.key));
    worksheet.addRow(row).commit();
  }

  worksheet.commit();
  await workbook.commit();
}
