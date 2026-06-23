import * as repo from '../repositories/reminderRepository'

export async function createReminder(payload) {
  const data = {
    relatedEntityType: payload.relatedEntityType,
    relatedEntityId: payload.relatedEntityId,
    scheduledAt: new Date(payload.scheduledAt),
    status: payload.status || 'PENDING',
    chatId: payload.chatId || null,
    message: payload.message || null,
  }
  return repo.createReminder(data)
}

export async function listReminders(query = {}) {
  const where = {}
  return repo.listReminders({ where })
}

export async function updateReminder(id, payload) {
  const data = { ...payload }
  if (payload.scheduledAt) data.scheduledAt = new Date(payload.scheduledAt)
  return repo.updateReminder(id, data)
}

export async function deleteReminder(id) {
  return repo.deleteReminder(id)
}
