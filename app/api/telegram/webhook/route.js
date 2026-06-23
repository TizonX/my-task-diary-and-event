export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { upsertTelegramUser } from '../../../../server/repositories/telegramUserRepository'
import * as taskService from '../../../../server/services/taskService'
import * as eventService from '../../../../server/services/eventService'
import logger from '../../../../server/logger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const API = `https://api.telegram.org/bot${BOT_TOKEN}`

// ── Telegram helpers ──────────────────────────────────────────────────────────

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown', ...extra }),
  })
}

async function editMessage(chatId, messageId, text, extra = {}) {
  await fetch(`${API}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'Markdown', ...extra }),
  })
}

async function answerCallback(id, text = '') {
  await fetch(`${API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: id, text }),
  })
}

// ── Formatters ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function priorityLabel(p) {
  if (p === 2) return '🔴 High'
  if (p === 1) return '🟡 Medium'
  return '🟢 Low'
}

function statusEmoji(s) {
  return s === 'COMPLETED' || s === 'DONE' ? '✅' : '🔵'
}

function formatTaskCard(t, index) {
  const lines = [
    `*${index}. ${t.title}*`,
    `${statusEmoji(t.status)} ${t.status === 'COMPLETED' || t.status === 'DONE' ? 'Completed' : 'Open'}  ${priorityLabel(t.priority ?? 0)}`,
  ]
  if (t.dueDate) lines.push(`📅 Due: ${formatDate(t.dueDate)}`)
  if (t.reminderDate) lines.push(`🔔 Reminder: ${formatDate(t.reminderDate)}`)
  if (t.category) lines.push(`📁 ${t.category}`)
  if (t.tags?.length) lines.push(`🏷️ ${t.tags.join('  •  ')}`)
  lines.push(`🆔 \`${t.id}\``)
  return lines.join('\n')
}

function taskActionButtons(task) {
  const id = task.id
  const isDone = task.status === 'COMPLETED' || task.status === 'DONE'
  return [
    isDone
      ? { text: '🔄 Reopen', callback_data: `task_reopen_${id}` }
      : { text: '✅ Complete', callback_data: `task_done_${id}` },
    { text: '✏️ Edit Title', callback_data: `task_edit_${id}` },
    { text: '🗑️ Delete', callback_data: `task_del_${id}` },
  ]
}

// ── Keyboards ─────────────────────────────────────────────────────────────────

const MAIN_MENU = {
  reply_markup: {
    inline_keyboard: [
      [{ text: '📝 Add Task', callback_data: 'menu_add_task' }, { text: '📋 My Tasks', callback_data: 'menu_list_tasks' }],
      [{ text: '📅 Add Event', callback_data: 'menu_add_event' }, { text: '🔍 Search Tasks', callback_data: 'menu_search' }],
      [{ text: '❓ How to use', callback_data: 'menu_help' }],
    ],
  },
}

const BACK = [[{ text: '⬅️ Back to Menu', callback_data: 'menu_main' }]]

// ── Task list builder ─────────────────────────────────────────────────────────

async function buildTaskListMessage() {
  const tasks = await taskService.listTasks({})
  if (!tasks.length) {
    return {
      text: '📭 *No tasks yet.*\n\nTap *Add Task* to create your first one!',
      keyboard: BACK,
    }
  }

  const open = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE')
  const done = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'DONE')

  let text = `📋 *Your Tasks* — ${open.length} open, ${done.length} done\n`
  text += `━━━━━━━━━━━━━━━━━━━━\n\n`

  const keyboard = []

  let index = 1
  if (open.length) {
    text += `🔵 *Open Tasks*\n\n`
    for (const t of open) {
      text += formatTaskCard(t, index++) + '\n\n'
      keyboard.push(taskActionButtons(t))
    }
  }

  if (done.length) {
    text += `✅ *Completed Tasks*\n\n`
    for (const t of done) {
      text += formatTaskCard(t, index++) + '\n\n'
      keyboard.push(taskActionButtons(t))
    }
  }

  keyboard.push(BACK[0])
  return { text: text.trim(), keyboard }
}

// ── Greeting ──────────────────────────────────────────────────────────────────

const GREETINGS = ['hi', 'hello', 'hey', 'hii', 'helo', 'howdy', 'yo', 'sup']

function isGreeting(text) {
  return GREETINGS.includes(text.trim().toLowerCase().replace(/[!.?,]/g, ''))
}

// ── Show main menu ────────────────────────────────────────────────────────────

async function showMainMenu(chatId, firstName) {
  await sendMessage(
    chatId,
    `👋 Hey ${firstName || 'there'}! Welcome to *My Task Diary & Event*.\n\nI help you manage tasks and events right from Telegram. Choose an option below:`,
    MAIN_MENU,
  )
}

// ── Callback handler ──────────────────────────────────────────────────────────

async function handleCallbackQuery(query) {
  const chatId = query.message.chat.id
  const messageId = query.message.message_id
  const data = query.data
  const firstName = query.from?.first_name || 'there'

  await answerCallback(query.id)

  // ── Main menu ──
  if (data === 'menu_main') {
    await editMessage(
      chatId, messageId,
      `👋 Hey ${firstName}! Choose an option below:`,
      MAIN_MENU,
    )
    return
  }

  // ── Help ──
  if (data === 'menu_help') {
    await editMessage(chatId, messageId,
      `❓ *How to use this bot*\n\n` +
      `*Create a task:*\n\`/add Buy groceries\`\n\n` +
      `*Create with due date:*\n\`/add Meeting at 5pm\`\n\n` +
      `*Mark done:* tap ✅ Complete in My Tasks\n\n` +
      `*Edit title:* tap ✏️ Edit Title — bot will prompt you\n\n` +
      `*Delete:* tap 🗑️ Delete in My Tasks\n\n` +
      `*Search:*\n\`/search groceries\`\n\n` +
      `*Add event:*\n\`/event Team meeting tomorrow\`\n\n` +
      `💡 *Tip:* Task IDs shown in \`code\` blocks — tap to copy!`,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }

  // ── Add task prompt ──
  if (data === 'menu_add_task') {
    await editMessage(chatId, messageId,
      `📝 *Add a Task*\n\nType your task and send it:\n\n\`/add <your task title>\`\n\n*Examples:*\n• \`/add Buy groceries\`\n• \`/add Call doctor at 3pm\`\n• \`/add Submit report by Friday\``,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }

  // ── Add event prompt ──
  if (data === 'menu_add_event') {
    await editMessage(chatId, messageId,
      `📅 *Add an Event*\n\nType and send:\n\n\`/event <event title>\`\n\n*Examples:*\n• \`/event Team standup tomorrow 10am\`\n• \`/event Birthday party Saturday\``,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }

  // ── List tasks ──
  if (data === 'menu_list_tasks' || data === 'tasks_refresh') {
    const { text, keyboard } = await buildTaskListMessage()
    await editMessage(chatId, messageId, text, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  // ── Search prompt ──
  if (data === 'menu_search') {
    await editMessage(chatId, messageId,
      `🔍 *Search Tasks*\n\nSend a keyword:\n\`/search <word>\`\n\nExample: \`/search groceries\``,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }

  // ── Task actions ──
  if (data.startsWith('task_done_')) {
    const id = data.replace('task_done_', '')
    await taskService.completeTask(id)
    const { text, keyboard } = await buildTaskListMessage()
    await editMessage(chatId, messageId, text, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  if (data.startsWith('task_reopen_')) {
    const id = data.replace('task_reopen_', '')
    await taskService.reopenTask(id)
    const { text, keyboard } = await buildTaskListMessage()
    await editMessage(chatId, messageId, text, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  if (data.startsWith('task_del_')) {
    const id = data.replace('task_del_', '')
    await taskService.deleteTask(id)
    const { text, keyboard } = await buildTaskListMessage()
    await editMessage(chatId, messageId, `🗑️ Task deleted.\n\n` + text, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  if (data.startsWith('task_edit_')) {
    const id = data.replace('task_edit_', '')
    const task = await taskService.getTask(id)
    await editMessage(chatId, messageId,
      `✏️ *Edit Task*\n\nCurrent title:\n*${task?.title || 'Unknown'}*\n\nSend the new title using:\n\`/update ${id} <new title>\`\n\n*Example:*\n\`/update ${id} Buy groceries and milk\``,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }
}

// ── Command handler ───────────────────────────────────────────────────────────

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
      await sendMessage(chatId, `❌ Please include a title.\n*Example:* \`/add Buy groceries\``)
      return
    }
    const t = await taskService.createTask({ title: rest })
    await sendMessage(chatId,
      `✅ *Task Created!*\n━━━━━━━━━━━━━━━━━━━━\n📝 *${t.title}*\n🔵 Open  🟢 Low priority\n🆔 \`${t.id}\``,
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

  if (cmd === '/update') {
    const [id, ...titleParts] = rest.split(' ')
    const newTitle = titleParts.join(' ')
    if (!id || !newTitle) {
      await sendMessage(chatId, `❌ Usage: \`/update <task-id> <new title>\``)
      return
    }
    const t = await taskService.updateTask(id, { title: newTitle })
    await sendMessage(chatId,
      `✅ *Task Updated!*\n━━━━━━━━━━━━━━━━━━━━\n📝 *${t.title}*\n🆔 \`${t.id}\``,
      { reply_markup: { inline_keyboard: [[{ text: '📋 View All Tasks', callback_data: 'menu_list_tasks' }], BACK[0]] } },
    )
    return
  }

  if (cmd === '/tasks') {
    const { text: listText, keyboard } = await buildTaskListMessage()
    await sendMessage(chatId, listText, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  if (cmd === '/event') {
    if (!rest) {
      await sendMessage(chatId, `❌ Usage: \`/event <title>\``)
      return
    }
    const ev = await eventService.createEvent({ title: rest, startDate: new Date().toISOString() })
    await sendMessage(chatId,
      `✅ *Event Created!*\n━━━━━━━━━━━━━━━━━━━━\n📅 *${ev.title}*\n🆔 \`${ev.id}\``,
      { reply_markup: { inline_keyboard: BACK } },
    )
    return
  }

  if (cmd === '/done') {
    if (!rest) { await sendMessage(chatId, `❌ Usage: \`/done <task-id>\``); return }
    await taskService.completeTask(rest.trim())
    await sendMessage(chatId, `✅ Task marked as *Completed!*`, { reply_markup: { inline_keyboard: [[{ text: '📋 View Tasks', callback_data: 'menu_list_tasks' }]] } })
    return
  }

  if (cmd === '/delete') {
    if (!rest) { await sendMessage(chatId, `❌ Usage: \`/delete <task-id>\``); return }
    await taskService.deleteTask(rest.trim())
    await sendMessage(chatId, `🗑️ Task *deleted.*`, { reply_markup: { inline_keyboard: [[{ text: '📋 View Tasks', callback_data: 'menu_list_tasks' }]] } })
    return
  }

  if (cmd === '/search') {
    if (!rest) { await sendMessage(chatId, `❌ Usage: \`/search <keyword>\``); return }
    const all = await taskService.listTasks({})
    const found = all.filter(t => t.title.toLowerCase().includes(rest.toLowerCase()))
    if (!found.length) {
      await sendMessage(chatId, `🔍 No tasks found for *"${rest}"*`, { reply_markup: { inline_keyboard: BACK } })
      return
    }
    let msg = `🔍 *Found ${found.length} task(s) for "${rest}":*\n━━━━━━━━━━━━━━━━━━━━\n\n`
    msg += found.map((t, i) => formatTaskCard(t, i + 1)).join('\n\n')
    const keyboard = found.map(t => taskActionButtons(t))
    keyboard.push(BACK[0])
    await sendMessage(chatId, msg, { reply_markup: { inline_keyboard: keyboard } })
    return
  }

  await sendMessage(chatId, `❓ Unknown command. Tap below to see options.`, { reply_markup: { inline_keyboard: BACK } })
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()

    if (body.callback_query) {
      const q = body.callback_query
      const from = q.from || {}
      await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
      await handleCallbackQuery(q)
      return NextResponse.json({ ok: true })
    }

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
