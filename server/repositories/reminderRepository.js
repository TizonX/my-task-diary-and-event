import prisma from '../../lib/prisma'

export async function createReminder(data) {
  return prisma.reminder.create({ data })
}

export async function getReminder(id) {
  return prisma.reminder.findUnique({ where: { id } })
}

export async function listReminders({ where = {}, skip = 0, take = 50 } = {}) {
  return prisma.reminder.findMany({ where, skip, take, orderBy: { scheduledAt: 'asc' } })
}

export async function updateReminder(id, data) {
  return prisma.reminder.update({ where: { id }, data })
}

export async function updateRemindersByTaskId(taskId, data) {
  return prisma.reminder.updateMany({
    where: { relatedEntityId: taskId, status: 'PENDING' },
    data,
  })
}

export async function deleteReminder(id) {
  return prisma.reminder.delete({ where: { id } })
}
