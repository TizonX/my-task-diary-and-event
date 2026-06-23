export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { upsertTelegramUser } from '../../../../server/repositories/telegramUserRepository'
import * as taskService from '../../../../server/services/taskService'
import * as eventService from '../../../../server/services/eventService'
import logger from '../../../../server/logger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ── Telegram API helpers ──────────────────────────────────────────────────────

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra }),
  })
}

async function answerCallback(callbackQueryId, text = '') {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  })
}

async function editMessage(chatId, messageId, text, extra = {}) {
  await fetch(`${API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown', ...extra }),
  })
}

// ── Keyboards ─────────────────────────────────────────────────────────────────

const MAIN_MENU = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '📝 Add Task', callback_data: 'menu_add_task' }, { text: '📋 My Tasks', callback_data: 'menu_list_tasks' }],
      [{ text: '📅 Add Event', callback_data: 'menu_add_event' }, { text: '🔍 Search', callback_data: 'menu_search' }],
      [{ text: '❓ How to use', callback_data: 'menu_help' }],
    ],
  },
}

const BACK_BUTTON = {
  reply_markup: {
    inline_keyboard: [[{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }]],
  },
}

// ── Greeting detection ────────────────────────────────────────────────────────

const GREETINGS = ['hi', 'hello', 'hey', 'hii', 'helo', 'howdy', 'yo', 'sup', 'start']

function isGreeting(text) {
  return GREETINGS.includes(text.trim().toLowerCase().replace(/[!.?,]/g, ''))
}

// ── Command / callback handlers ───────────────────────────────────────────────

async function showMainMenu(chatId, firstName) {
  await sendMessage(
    chatId,
    `👋 Hey ${firstName || 'there'}! Welcome to *My Task Diary & Event*.\n\nI help you manage tasks and events right from Telegram. Choose an option below:`,
    MAIN_MENU,
  )
}

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id
  const messageId = query.message.message_id
  const data = query.data
  const firstName = query.from?.first_name || 'there'

  await answerCallback(query.id)

  if (data === 'menu_main') {
    await editMessage(
      chatId,
      messageId,
      `👋 Hey ${firstName}! Welcome to *My Task Diary & Event*.\n\nChoose an option below:`,
      MAIN_MENU,
    )
    return
  }

  if (data === 'menu_help') {
    await editMessage(
      chatId,
      messageId,
      `❓ *How to use this bot*\n\n` +
      `*Tasks:*\n` +
      `• Type \`/add Buy groceries\` to create a task\n` +
      `• Or tap 📝 *Add Task* and follow the prompt\n\n` +
      `*Events:*\n` +
      `• Type \`/event Team meeting\` to create an event\n` +
      `• Or tap 📅 *Add Event*\n\n` +
      `*Other commands:*\n` +
      `\`/tasks\` — see all your tasks\n` +
      `\`/done <id>\` — mark a task complete\n` +
      `\`/delete <id>\` — delete a task\n` +
      `\`/search <word>\` — find tasks by keyword\n` +
      `\`/tag <id> <tag>\` — add a tag to a task`,
      BACK_BUTTON,
    )
    return
  }

  if (data === 'menu_add_task') {
    await editMessage(
      chatId,
      messageId,
      `📝 *Add a Task*\n\nSend me the task title. Example:\n\`/add Get ready by 6:10 PM\``,
      BACK_BUTTON,
    )
    return
  }

  if (data === 'menu_add_event') {
    await editMessage(
      chatId,
      messageId,
      `📅 *Add an Event*\n\nSend me the event title. Example:\n\`/event Team standup tomorrow 10 AM\``,
      BACK_BUTTON,
    )
    return
  }

  if (data === 'menu_list_tasks') {
    const tasks = await taskService.listTasks({})
    if (!tasks.length) {
      await editMessage(chatId, messageId, `📭 You have no tasks yet.\n\nTap *Add Task* to create one!`, BACK_BUTTON)
      return
    }
    const open = tasks.filter(t => t.status === 'OPEN')
    const done = tasks.filter(t => t.status === 'COMPLETED')
    let text = `📋 *Your Tasks* (${tasks.length} total)\n\n`
    if (open.length) {
      text += `*Open (${open.length}):*\n`
      text += open.map(t => `• ${t.title}\n  \`${t.id.slice(0, 10)}...\``).join('\n') + '\n\n'
    }
    if (done.length) {
      text += `*Completed (${done.length}):*\n`
      text += done.map(t => `✅ ~${t.title}~`).join('\n')
    }
    await editMessage(chatId, messageId, text, BACK_BUTTON)
    return
  }

  if (data === 'menu_search') {
    await editMessage(
      chatId,
      messageId,
      `🔍 *Search Tasks*\n\nSend me a keyword. Example:\n\`/search groceries\``,
      BACK_BUTTON,
    )
    return
  }
}

async function handleCommand(chatId, text, firstName) {
  const parts = text.trim().split(' ')
  const cmd = parts[0].toLowerCase()
  const rest = parts.slice(1).join(' ')

  if (cmd === '/start' || cmd === '/help' || isGreeting(text)) {
    await showMainMenu(chatId, firstName)
    return
  }

  if (cmd === '/add') {
    if (!rest) {
      await sendMessage(chatId, `❌ Please include a title.\nExample: \`/add Buy groceries\``)
      return
    }
    const t = await taskService.createTask({ title: rest })
    await sendMessage(
      chatId,
      `✅ *Task created!*\n\n📝 ${t.title}\n🆔 \`${t.id}\``,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 View All Tasks', callback_data: 'menu_list_tasks' }, { text: '➕ Add Another', callback_data: 'menu_add_task' }],
            [{ text: '🏠 Main Menu', callback_data: 'menu_main' }],
          ],
        },
      },
    )
    return
  }

  if (cmd === '/tasks') {
    const tasks = await taskService.listTasks({})
    if (!tasks.length) {
      await sendMessage(chatId, `📭 No tasks yet. Use /add to create one!`)
      return
    }
    const open = tasks.filter(t => t.status === 'OPEN')
    const done = tasks.filter(t => t.status === 'COMPLETED')
    let msg = `📋 *Your Tasks* (${tasks.length} total)\n\n`
    if (open.length) {
      msg += `*Open (${open.length}):*\n`
      msg += open.map(t => `• ${t.title}\n  \`${t.id.slice(0, 10)}...\``).join('\n') + '\n\n'
    }
    if (done.length) {
      msg += `*Completed (${done.length}):*\n`
      msg += done.map(t => `✅ ~${t.title}~`).join('\n')
    }
    await sendMessage(chatId, msg, BACK_BUTTON)
    return
  }

  if (cmd === '/event') {
    if (!rest) {
      await sendMessage(chatId, `❌ Please include a title.\nExample: \`/event Team meeting\``)
      return
    }
    const ev = await eventService.createEvent({ title: rest, startDate: new Date().toISOString() })
    await sendMessage(chatId, `✅ *Event created!*\n\n📅 ${ev.title}\n🆔 \`${ev.id}\``, BACK_BUTTON)
    return
  }

  if (cmd === '/done') {
    const id = rest.trim()
    if (!id) { await sendMessage(chatId, `❌ Usage: \`/done <task-id>\``); return }
    await taskService.completeTask(id)
    await sendMessage(chatId, `✅ Task marked as *completed!*`, BACK_BUTTON)
    return
  }

  if (cmd === '/delete') {
    const id = rest.trim()
    if (!id) { await sendMessage(chatId, `❌ Usage: \`/delete <task-id>\``); return }
    await taskService.deleteTask(id)
    await sendMessage(chatId, `🗑️ Task *deleted*.`, BACK_BUTTON)
    return
  }

  if (cmd === '/tag') {
    const [id, tag] = rest.split(' ')
    if (!id || !tag) { await sendMessage(chatId, `❌ Usage: \`/tag <task-id> <tag>\``); return }
    await taskService.addTag(id, tag)
    await sendMessage(chatId, `🏷️ Tag *"${tag}"* added to task.`, BACK_BUTTON)
    return
  }

  if (cmd === '/search') {
    const q = rest.trim()
    if (!q) { await sendMessage(chatId, `❌ Usage: \`/search <keyword>\``); return }
    const results = await taskService.listTasks({})
    const filtered = results.filter(t => t.title.toLowerCase().includes(q.toLowerCase()))
    if (!filtered.length) {
      await sendMessage(chatId, `🔍 No tasks found for *"${q}"*`, BACK_BUTTON)
      return
    }
    const lines = filtered.map(t => `• ${t.title}\n  \`${t.id.slice(0, 10)}...\``).join('\n')
    await sendMessage(chatId, `🔍 *Found ${filtered.length} task(s) for "${q}":*\n\n${lines}`, BACK_BUTTON)
    return
  }

  await sendMessage(
    chatId,
    `❓ I didn't understand that. Tap the button below to see what I can do.`,
    BACK_BUTTON,
  )
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()

    // Handle inline button clicks
    if (body.callback_query) {
      const q = body.callback_query
      const from = q.from || {}
      await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
      await handleCallbackQuery(q)
      return NextResponse.json({ ok: true })
    }

    // Handle regular messages
    const message = body.message || body.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const from = message.from || {}
    const chatId = message.chat.id
    const text = message.text || ''

    await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
    await handleCommand(chatId, text, from.first_name)

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'telegram_webhook_error')
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
