import prisma from '../../lib/prisma'

export async function createTask(data) {
  return prisma.task.create({ data })
}

export async function getTask(id) {
  return prisma.task.findUnique({ where: { id } })
}

export async function listTasks({ where = {}, skip = 0, take = 50 } = {}) {
  return prisma.task.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } })
}

export async function updateTask(id, data) {
  return prisma.task.update({ where: { id }, data })
}

export async function deleteTask(id) {
  return prisma.task.delete({ where: { id } })
}
