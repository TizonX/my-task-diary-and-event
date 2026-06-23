import * as repo from '../repositories/eventRepository'

export async function createEvent(payload) {
  const data = {
    title: payload.title,
    description: payload.description || null,
    startDate: new Date(payload.startDate),
    endDate: payload.endDate ? new Date(payload.endDate) : null,
    reminderDate: payload.reminderDate ? new Date(payload.reminderDate) : null,
    tags: payload.tags || []
  }
  return repo.createEvent(data)
}

export async function listEvents(query = {}) {
  const where = {}
  return repo.listEvents({ where })
}

export async function getEvent(id) {
  return repo.getEvent(id)
}

export async function updateEvent(id, payload) {
  const data = { ...payload }
  if (payload.startDate) data.startDate = new Date(payload.startDate)
  if (payload.endDate) data.endDate = new Date(payload.endDate)
  if (payload.reminderDate) data.reminderDate = new Date(payload.reminderDate)
  return repo.updateEvent(id, data)
}

export async function deleteEvent(id) {
  return repo.deleteEvent(id)
}
