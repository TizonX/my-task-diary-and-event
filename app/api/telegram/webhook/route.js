import { NextResponse } from 'next/server'
import { upsertTelegramUser } from '../../../../server/repositories/telegramUserRepository'
import * as taskService from '../../../../server/services/taskService'
import * as eventService from '../../../../server/services/eventService'
import logger from '../../../../server/logger'

async function handleCommand(text, from) {
  const parts = text.trim().split(' ')
  const cmd = parts[0].toLowerCase()
  const rest = parts.slice(1).join(' ')
  if (cmd === '/start' || cmd === '/help') {
    return { reply: 'Welcome to My Task Diary & Event. Use /add, /event, /tasks, /done, /search.' }
  }
  if (cmd === '/add') {
    const t = await taskService.createTask({ title: rest })
    return { reply: `Task created: ${t.title}` }
  }
  if (cmd === '/event') {
    const now = new Date()
    const ev = await eventService.createEvent({ title: rest || 'New event', startDate: now.toISOString() })
    return { reply: `Event created: ${ev.title}` }
  }
  if (cmd === '/done') {
    const id = rest.trim()
    await taskService.completeTask(id)
    return { reply: `Task ${id} marked done` }
  }
  if (cmd === '/delete') {
    const id = rest.trim()
    await taskService.deleteTask(id)
    return { reply: `Deleted ${id}` }
  }
  if (cmd === '/tag') {
    const [id, tag] = rest.split(' ')
    await taskService.addTag(id, tag)
    return { reply: `Tag ${tag} added to ${id}` }
  }
  if (cmd === '/search') {
    const q = rest.trim()
    const results = await taskService.listTasks({})
    const filtered = results.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    return { reply: `Found ${filtered.length} tasks` }
  }
  return { reply: "I didn't understand that command. Use /help" }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const message = body.message || body.edited_message
    if (!message) return NextResponse.json({ ok: true })
    const from = message.from || {}
    await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
    const text = message.text || ''
    const res = await handleCommand(text, from)
    // Responding back through Telegram API is done by notification send endpoint or by MCP
    return NextResponse.json({ ok: true, reply: res.reply })
  } catch (err) {
    logger.error({ err }, 'telegram_webhook_error')
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
