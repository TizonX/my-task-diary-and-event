import prisma from '../../lib/prisma'

export async function createEvent(data) {
  return prisma.event.create({ data })
}

export async function getEvent(id) {
  return prisma.event.findUnique({ where: { id } })
}

export async function listEvents({ where = {}, skip = 0, take = 50 } = {}) {
  return prisma.event.findMany({ where, skip, take, orderBy: { startDate: 'asc' } })
}

export async function updateEvent(id, data) {
  return prisma.event.update({ where: { id }, data })
}

export async function deleteEvent(id) {
  return prisma.event.delete({ where: { id } })
}
