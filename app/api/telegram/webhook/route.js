export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { upsertTelegramUser } from '../../../../server/repositories/telegramUserRepository'
import * as taskService from '../../../../server/services/taskService'
import * as eventService from '../../../../server/services/eventService'
import logger from '../../../../server/logger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendMessage(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text }),
  })
}

async function handleCommand(text, from) {
  const parts = text.trim().split(' ')
  const cmd = parts[0].toLowerCase()
  const rest = parts.slice(1).join(' ')

  if (cmd === '/start' || cmd === '/help') {
    return `👋 Welcome to My Task Diary & Event!\n\nCommands:\n/add <title> — create a task\n/tasks — list all tasks\n/done <id> — mark task complete\n/delete <id> — delete a task\n/tag <id> <tag> — add tag to task\n/search <keyword> — search tasks\n/event <title> — create an event`
  }

  if (cmd === '/add') {
    if (!rest) return '❌ Usage: /add <task title>\nExample: /add Get ready at 6:10pm'
    const t = await taskService.createTask({ title: rest })
    return `✅ Task created!\n📝 ${t.title}\n🆔 ${t.id}`
  }

  if (cmd === '/tasks') {
    const tasks = await taskService.listTasks({})
    if (!tasks.length) return '📭 No tasks found.'
    const lines = tasks.map(t => `• [${t.status}] ${t.title} (${t.id.slice(0, 8)}...)`).join('\n')
    return `📋 Your tasks (${tasks.length}):\n\n${lines}`
  }

  if (cmd === '/event') {
    const now = new Date()
    const ev = await eventService.createEvent({ title: rest || 'New event', startDate: now.toISOString() })
    return `✅ Event created!\n📅 ${ev.title}\n🆔 ${ev.id}`
  }

  if (cmd === '/done') {
    const id = rest.trim()
    if (!id) return '❌ Usage: /done <task-id>'
    await taskService.completeTask(id)
    return `✅ Task marked as done!`
  }

  if (cmd === '/delete') {
    const id = rest.trim()
    if (!id) return '❌ Usage: /delete <task-id>'
    await taskService.deleteTask(id)
    return `🗑️ Task deleted.`
  }

  if (cmd === '/tag') {
    const [id, tag] = rest.split(' ')
    if (!id || !tag) return '❌ Usage: /tag <task-id> <tag>'
    await taskService.addTag(id, tag)
    return `🏷️ Tag "${tag}" added to task.`
  }

  if (cmd === '/search') {
    const q = rest.trim()
    if (!q) return '❌ Usage: /search <keyword>'
    const results = await taskService.listTasks({})
    const filtered = results.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    if (!filtered.length) return `🔍 No tasks found for "${q}"`
    const lines = filtered.map(t => `• ${t.title} (${t.id.slice(0, 8)}...)`).join('\n')
    return `🔍 Found ${filtered.length} task(s):\n\n${lines}`
  }

  return "❓ Unknown command. Send /help to see all commands."
}

export async function POST(request) {
  try {
    const body = await request.json()
    const message = body.message || body.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const from = message.from || {}
    const chatId = message.chat.id

    await upsertTelegramUser({
      telegramId: String(from.id),
      username: from.username,
      firstName: from.first_name,
      lastName: from.last_name,
    })

    const text = message.text || ''
    const reply = await handleCommand(text, from)
    await sendMessage(chatId, reply)

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'telegram_webhook_error')
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
