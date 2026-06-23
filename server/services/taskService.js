import * as repo from '../repositories/taskRepository'

export async function createTask(payload) {
  const data = {
    title: payload.title,
    description: payload.description || null,
    status: payload.status || 'OPEN',
    priority: payload.priority != null ? payload.priority : 0,
    dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    reminderDate: payload.reminderDate ? new Date(payload.reminderDate) : null,
    tags: payload.tags || [],
    category: payload.category || null
  }
  return repo.createTask(data)
}

export async function listTasks(query = {}) {
  const where = {}
  if (query.status) where.status = query.status
  if (query.tag) where.tags = { has: query.tag }
  return repo.listTasks({ where })
}

export async function getTask(id) {
  return repo.getTask(id)
}

export async function updateTask(id, payload) {
  const data = { ...payload }
  if (payload.dueDate) data.dueDate = new Date(payload.dueDate)
  if (payload.reminderDate) data.reminderDate = new Date(payload.reminderDate)
  return repo.updateTask(id, data)
}

export async function deleteTask(id) {
  return repo.deleteTask(id)
}

export async function completeTask(id) {
  return repo.updateTask(id, { status: 'DONE' })
}

export async function reopenTask(id) {
  return repo.updateTask(id, { status: 'OPEN' })
}

export async function addTag(id, tag) {
  const task = await repo.getTask(id)
  const tags = Array.isArray(task.tags) ? [...task.tags, tag] : [tag]
  return repo.updateTask(id, { tags })
}

export async function removeTag(id, tag) {
  const task = await repo.getTask(id)
  const tags = (task.tags || []).filter(t => t !== tag)
  return repo.updateTask(id, { tags })
}
