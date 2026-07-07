import * as eventRepository from '../repositories/event.repository.js';

export async function createEvent({ data, bannerImage, createdBy }) {
  return eventRepository.createEvent({ ...data, bannerImage, createdBy });
}

export async function listEvents() {
  return eventRepository.findAllEvents();
}
