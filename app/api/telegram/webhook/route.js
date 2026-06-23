export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { upsertTelegramUser } from '../../../../server/repositories/telegramUserRepository'
import * as taskService from '../../../../server/services/taskService'
import * as eventService from '../../../../server/services/eventService'
import * as reminderService from '../../../../server/services/reminderService'
import logger from '../../../../server/logger'
import { detectTags, splitIntoItems } from '../../../../server/utils/autoTagger'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const BASE_URL = process.env.BASE_URL || 'https://my-task-diary-and-event.vercel.app'
const API = `https://api.telegram.org/bot${BOT_TOKEN}`
const PAGE_SIZE = 3
const MDEL_SIZE = 6

// ─────────────────────────────────────────────────────────────────────────────
// Telegram helpers
// ─────────────────────────────────────────────────────────────────────────────

async function tg(method, body) {
  await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const send = (chat_id, text, extra = {}) =>
  tg('sendMessage', { chat_id, text, parse_mode: 'Markdown', ...extra })

const edit = (chat_id, message_id, text, extra = {}) =>
  tg('editMessageText', { chat_id, message_id, text, parse_mode: 'Markdown', ...extra })

const answer = (callback_query_id, text = '') =>
  tg('answerCallbackQuery', { callback_query_id, text })

const toast = (callback_query_id, text) =>
  tg('answerCallbackQuery', { callback_query_id, text, show_alert: false })

// ─────────────────────────────────────────────────────────────────────────────
// NLP — intent detection & date extraction
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_RE = /\b(meeting|call|standup|party|event|appointment|interview|lunch|dinner|breakfast|session|seminar|conference|hangout|outing|trip)\b/i

// ── Time helpers ──────────────────────────────────────────────────────────────

function parseTimeStr(timeStr, dayStr) {
  if (!timeStr) return null
  const m = timeStr.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i)
  if (!m) return null
  let h = parseInt(m[1])
  const min = parseInt(m[2] || '0')
  const ampm = (m[3] || '').toLowerCase()
  if (ampm === 'pm' && h < 12) h += 12
  if (ampm === 'am' && h === 12) h = 0
  const now = new Date()
  const d = new Date(now)
  if (dayStr && /tomorrow/i.test(dayStr)) d.setDate(d.getDate() + 1)
  d.setHours(h, min, 0, 0)
  return d.toISOString()
}

function resolveDay(text) {
  const now = new Date()
  if (/\btomorrow\b/i.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 1); return d }
  if (/\bnext week\b/i.test(text)) { const d = new Date(now); d.setDate(d.getDate() + 7); return d }
  if (/\bnext month\b/i.test(text)) { const d = new Date(now); d.setMonth(d.getMonth() + 1); return d }
  const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday']
  for (let i = 0; i < days.length; i++) {
    if (new RegExp(`\\b${days[i]}\\b`, 'i').test(text)) {
      const d = new Date(now)
      let diff = i - d.getDay()
      if (diff <= 0) diff += 7
      d.setDate(d.getDate() + diff)
      return d
    }
  }
  return new Date(now) // today
}

// Main NLP parser — returns { title, dueDate, notifyAt, intent }
function parseNLMessage(text) {
  let working = text

  // 1. Extract notification instruction: "send me notification at Xpm today", "notify me at X"
  const notifyRe = /(?:send\s+(?:me\s+)?(?:a\s+)?notification(?:\s+as\s+well)?|notify\s+me|send\s+notification)\s+at\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(today|tomorrow)?/gi
  let notifyAt = null
  working = working.replace(notifyRe, (match, timeStr, dayStr) => {
    notifyAt = parseTimeStr(timeStr, dayStr)
    return ''
  })

  // 2. Extract due time: "at Xpm", "at X:XX"
  let dueDate = null
  const atTimeRe = /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/gi
  working = working.replace(atTimeRe, (match, timeStr) => {
    if (!dueDate) {
      const day = resolveDay(working)
      const t = parseTimeStr(timeStr, '')
      if (t) {
        const base = new Date(t)
        base.setFullYear(day.getFullYear(), day.getMonth(), day.getDate())
        dueDate = base.toISOString()
      }
    }
    return ''
  })

  // 3. Extract day keywords for due date
  const dayBase = resolveDay(working)
  if (!dueDate && /(tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|next month)/i.test(working)) {
    dueDate = dayBase.toISOString()
  }

  // 4. Clean up day/time words from title
  working = working
    .replace(/\b(tomorrow|today|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi, '')
    .replace(/\bI have to\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s([.,!?])/g, '$1')
    .replace(/^[.,\s]+|[.,\s]+$/g, '')
    .trim()

  const title = working || text.trim()

  // 5. Intent
  let intent = 'task'
  if (EVENT_RE.test(text)) intent = 'event'

  return { title, dueDate, notifyAt, intent }
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatters
// ─────────────────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short',
    year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

function priorityLabel(p) {
  return p === 2 ? '🔴 High' : p === 1 ? '🟡 Medium' : '🟢 Low'
}

function statusBadge(s) {
  return s === 'COMPLETED' || s === 'DONE' ? '✅ Done' : '🔵 Open'
}

function taskCard(t, idx) {
  const lines = [`*${idx}. ${t.title}*`, `${statusBadge(t.status)}   ${priorityLabel(t.priority ?? 0)}`]
  if (t.dueDate) lines.push(`📅 ${fmtDate(t.dueDate)}`)
  if (t.reminderDate) lines.push(`🔔 ${fmtDate(t.reminderDate)}`)
  if (t.category) lines.push(`📁 ${t.category}`)
  if (t.tags?.length) lines.push(`🏷 ${t.tags.join(' · ')}`)
  lines.push(`🆔 \`${t.id}\``)
  return lines.join('\n')
}

function multiTaskList(tasks) {
  const lines = tasks.map((t, i) => {
    const tags = t.tags?.length ? `  🏷 ${t.tags.join(' · ')}` : ''
    return `*${i + 1}.* ${t.title}${tags}\n    🆔 \`${t.id}\``
  })
  return lines.join('\n\n')
}

function eventCard(e, idx) {
  const lines = [`*${idx}. ${e.title}*`, `📅 ${fmtDate(e.startDate)}`]
  if (e.endDate) lines.push(`🏁 Ends: ${fmtDate(e.endDate)}`)
  if (e.tags?.length) lines.push(`🏷 ${e.tags.join(' · ')}`)
  lines.push(`🆔 \`${e.id}\``)
  return lines.join('\n')
}

function reminderCard(r, idx) {
  return [
    `*${idx}. ${r.relatedEntityType} reminder*`,
    `🔔 ${fmtDate(r.scheduledAt)}`,
    `📌 ${r.status}`,
    `🆔 \`${r.id}\``,
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Keyboards
// ─────────────────────────────────────────────────────────────────────────────

const MAIN_MENU_KB = {
  inline_keyboard: [
    [{ text: '📝 Tasks', callback_data: 'menu_tasks' }, { text: '📅 Events', callback_data: 'menu_events' }],
    [{ text: '🔔 Reminders', callback_data: 'menu_reminders' }, { text: '🏷 Tags', callback_data: 'menu_tags' }],
    [{ text: '⚡ Priorities', callback_data: 'menu_priorities' }, { text: '📊 Statistics', callback_data: 'menu_stats' }],
    [{ text: '📚 Developer Center', callback_data: 'menu_dev' }, { text: '❓ Help', callback_data: 'menu_help' }],
  ],
}

const BACK_HOME = [[{ text: '🏠 Main Menu', callback_data: 'menu_home' }]]

function tasksMenuKB() {
  return {
    inline_keyboard: [
      [{ text: '➕ Add Task', callback_data: 'task_add' }, { text: '📋 All Tasks', callback_data: 'tasks_p_0' }],
      [{ text: '✅ Completed', callback_data: 'tasks_done_0' }, { text: '🔍 Search', callback_data: 'task_search' }],
      [{ text: '⚡ High Priority', callback_data: 'tasks_hi_0' }, { text: '🏷 By Tag', callback_data: 'task_bytag' }],
      [{ text: '🗑 Multi-Delete', callback_data: 'mdel_s_0__' }],
      ...BACK_HOME,
    ],
  }
}

function eventsMenuKB() {
  return {
    inline_keyboard: [
      [{ text: '➕ Add Event', callback_data: 'event_add' }, { text: '📋 All Events', callback_data: 'events_p_0' }],
      [{ text: '🗑 Delete Event', callback_data: 'event_del_prompt' }],
      ...BACK_HOME,
    ],
  }
}

function remindersMenuKB() {
  return {
    inline_keyboard: [
      [{ text: '📋 All Reminders', callback_data: 'reminders_p_0' }],
      [{ text: '🗑 Delete Reminder', callback_data: 'reminder_del_prompt' }],
      ...BACK_HOME,
    ],
  }
}

function taskActionRow(t) {
  const isDone = t.status === 'COMPLETED' || t.status === 'DONE'
  return [
    isDone
      ? { text: '🔄 Reopen', callback_data: `t_reopen_${t.id}` }
      : { text: '✅ Done', callback_data: `t_done_${t.id}` },
    { text: '✏️ Edit', callback_data: `t_edit_${t.id}` },
    { text: '🗑 Del', callback_data: `t_confirmDel_${t.id}` },
  ]
}

function eventActionRow(e) {
  return [
    { text: '✏️ Edit', callback_data: `e_edit_${e.id}` },
    { text: '🗑 Del', callback_data: `e_confirmDel_${e.id}` },
  ]
}

function paginationRow(page, total, prefix) {
  const last = Math.ceil(total / PAGE_SIZE) - 1
  const row = []
  if (page > 0) row.push({ text: '◀ Prev', callback_data: `${prefix}_${page - 1}` })
  row.push({ text: `${page + 1}/${last + 1}`, callback_data: 'noop' })
  if (page < last) row.push({ text: 'Next ▶', callback_data: `${prefix}_${page + 1}` })
  return row
}

// ─────────────────────────────────────────────────────────────────────────────
// Multi-delete
// ─────────────────────────────────────────────────────────────────────────────

function parseSel(selStr) {
  if (!selStr || selStr === '_' || selStr === '') return new Set()
  return new Set(selStr.split(',').map(Number).filter(n => !isNaN(n)))
}

function encodeSel(sel) {
  return sel.size > 0 ? [...sel].sort((a, b) => a - b).join(',') : '_'
}

async function buildMultiDeleteView(page = 0, selStr = '_') {
  const all = await taskService.listTasks({})
  const open = all.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE')

  if (!open.length) return {
    text: '📭 *No open tasks to delete.*',
    kb: { inline_keyboard: [[{ text: '📝 Tasks Menu', callback_data: 'menu_tasks' }]] },
  }

  const sel = parseSel(selStr)
  const totalPages = Math.ceil(open.length / MDEL_SIZE)
  const slice = open.slice(page * MDEL_SIZE, (page + 1) * MDEL_SIZE)

  let text = `🗑 *Multi-Delete* — Select tasks to delete\n━━━━━━━━━━━━━━━━━━━━\n\n`
  slice.forEach((t, i) => {
    const gIdx = page * MDEL_SIZE + i
    text += `${sel.has(gIdx) ? '✅' : '⬜'} *${gIdx + 1}.* ${t.title}\n`
  })
  if (sel.size > 0) text += `\n_${sel.size} task${sel.size > 1 ? 's' : ''} selected_`

  const kb = { inline_keyboard: [] }

  // One toggle button per task (full width, shows checkbox + title)
  slice.forEach((t, i) => {
    const gIdx = page * MDEL_SIZE + i
    const checked = sel.has(gIdx)
    const newSel = new Set(sel)
    if (checked) newSel.delete(gIdx)
    else newSel.add(gIdx)
    const label = t.title.length > 32 ? t.title.slice(0, 31) + '…' : t.title
    kb.inline_keyboard.push([{
      text: `${checked ? '✅' : '⬜'} ${label}`,
      callback_data: `mdel_s_${page}_${encodeSel(newSel)}`,
    }])
  })

  // Select all / Deselect all for current page
  const allPageChecked = slice.every((_, i) => sel.has(page * MDEL_SIZE + i))
  const toggleAllSel = new Set(sel)
  if (allPageChecked) {
    slice.forEach((_, i) => toggleAllSel.delete(page * MDEL_SIZE + i))
    kb.inline_keyboard.push([{ text: '☐ Deselect All on Page', callback_data: `mdel_s_${page}_${encodeSel(toggleAllSel)}` }])
  } else {
    slice.forEach((_, i) => toggleAllSel.add(page * MDEL_SIZE + i))
    kb.inline_keyboard.push([{ text: '✅ Select All on Page', callback_data: `mdel_s_${page}_${encodeSel(toggleAllSel)}` }])
  }

  // Pagination (carry selection across pages)
  if (totalPages > 1) {
    const pRow = []
    if (page > 0) pRow.push({ text: '◀ Prev', callback_data: `mdel_s_${page - 1}_${encodeSel(sel)}` })
    pRow.push({ text: `${page + 1}/${totalPages}`, callback_data: 'noop' })
    if (page < totalPages - 1) pRow.push({ text: 'Next ▶', callback_data: `mdel_s_${page + 1}_${encodeSel(sel)}` })
    kb.inline_keyboard.push(pRow)
  }

  // Action row
  if (sel.size > 0) {
    kb.inline_keyboard.push([{
      text: `🗑 Delete ${sel.size} Selected`,
      callback_data: `mdel_confirm_${encodeSel(sel)}`,
    }])
  }
  kb.inline_keyboard.push([{ text: '✗ Cancel', callback_data: 'menu_tasks' }])

  return { text, kb, open }
}

// ─────────────────────────────────────────────────────────────────────────────
// Page builders
// ─────────────────────────────────────────────────────────────────────────────

async function buildTaskPage(page = 0, filter = 'all') {
  const all = await taskService.listTasks({})
  let tasks = all
  if (filter === 'done') tasks = all.filter(t => t.status === 'COMPLETED' || t.status === 'DONE')
  else if (filter === 'open') tasks = all.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE')
  else if (filter === 'hi') tasks = all.filter(t => (t.priority ?? 0) === 2)

  if (!tasks.length) return {
    text: '📭 *No tasks found.*\n\nTap ➕ Add Task to create one.',
    kb: { inline_keyboard: [[{ text: '➕ Add Task', callback_data: 'task_add' }], ...BACK_HOME] },
  }

  const slice = tasks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const filterLabel = { all: 'All', done: 'Completed', open: 'Open', hi: 'High Priority' }[filter]
  let text = `📋 *Tasks — ${filterLabel}* (${tasks.length} total)\n━━━━━━━━━━━━━━━━━━━━\n\n`
  text += slice.map((t, i) => taskCard(t, page * PAGE_SIZE + i + 1)).join('\n\n')

  const prefixMap = { all: 'tasks_p', done: 'tasks_done', open: 'tasks_open', hi: 'tasks_hi' }
  const kb = { inline_keyboard: [] }
  slice.forEach(t => kb.inline_keyboard.push(taskActionRow(t)))
  if (tasks.length > PAGE_SIZE) kb.inline_keyboard.push(paginationRow(page, tasks.length, prefixMap[filter]))
  kb.inline_keyboard.push([{ text: '📝 Tasks Menu', callback_data: 'menu_tasks' }, { text: '🏠 Home', callback_data: 'menu_home' }])
  return { text, kb }
}

async function buildEventPage(page = 0) {
  const events = await eventService.listEvents({})
  if (!events.length) return {
    text: '📭 *No events found.*\n\nTap ➕ Add Event to create one.',
    kb: { inline_keyboard: [[{ text: '➕ Add Event', callback_data: 'event_add' }], ...BACK_HOME] },
  }
  const slice = events.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  let text = `📅 *Events* (${events.length} total)\n━━━━━━━━━━━━━━━━━━━━\n\n`
  text += slice.map((e, i) => eventCard(e, page * PAGE_SIZE + i + 1)).join('\n\n')
  const kb = { inline_keyboard: [] }
  slice.forEach(e => kb.inline_keyboard.push(eventActionRow(e)))
  if (events.length > PAGE_SIZE) kb.inline_keyboard.push(paginationRow(page, events.length, 'events_p'))
  kb.inline_keyboard.push([{ text: '📅 Events Menu', callback_data: 'menu_events' }, { text: '🏠 Home', callback_data: 'menu_home' }])
  return { text, kb }
}

async function buildReminderPage(page = 0) {
  const reminders = await reminderService.listReminders({})
  if (!reminders.length) return {
    text: '📭 *No reminders set.*',
    kb: { inline_keyboard: BACK_HOME },
  }
  const slice = reminders.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  let text = `🔔 *Reminders* (${reminders.length} total)\n━━━━━━━━━━━━━━━━━━━━\n\n`
  text += slice.map((r, i) => reminderCard(r, page * PAGE_SIZE + i + 1)).join('\n\n')
  const kb = { inline_keyboard: [] }
  slice.forEach(r => kb.inline_keyboard.push([{ text: `🗑 Delete`, callback_data: `r_confirmDel_${r.id}` }]))
  if (reminders.length > PAGE_SIZE) kb.inline_keyboard.push(paginationRow(page, reminders.length, 'reminders_p'))
  kb.inline_keyboard.push(BACK_HOME[0])
  return { text, kb }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main menu
// ─────────────────────────────────────────────────────────────────────────────

async function showMainMenu(chatId, firstName, messageId = null) {
  const text = `🏠 *My Task Diary & Event*\n\nHey ${firstName || 'there'}! What would you like to do?\n\n_You can also just type naturally:_\n_"Buy milk tomorrow" or "Meeting Friday 4pm"_`
  const extra = { reply_markup: { inline_keyboard: MAIN_MENU_KB.inline_keyboard } }
  if (messageId) await edit(chatId, messageId, text, extra)
  else await send(chatId, text, extra)
}

// ─────────────────────────────────────────────────────────────────────────────
// Developer Center
// ─────────────────────────────────────────────────────────────────────────────

const DEV_CATEGORIES = [
  {
    name: '📝 Tasks API',
    cb: 'dev_tasks',
    endpoints: [
      { method: 'GET', path: '/api/tasks', desc: 'List all tasks' },
      { method: 'POST', path: '/api/tasks', desc: 'Create a task', body: '{ title, dueDate, priority, tags }' },
      { method: 'GET', path: '/api/tasks/:id', desc: 'Get task by ID' },
      { method: 'PATCH', path: '/api/tasks/:id', desc: 'Update task fields' },
      { method: 'DELETE', path: '/api/tasks/:id', desc: 'Delete a task' },
      { method: 'POST', path: '/api/tasks/:id/complete', desc: 'Mark as completed' },
      { method: 'POST', path: '/api/tasks/:id/reopen', desc: 'Reopen a task' },
      { method: 'POST', path: '/api/tasks/:id/tags', desc: 'Add tag', body: '{ tag }' },
      { method: 'DELETE', path: '/api/tasks/:id/tags/:tag', desc: 'Remove tag' },
    ],
  },
  {
    name: '📅 Events API',
    cb: 'dev_events',
    endpoints: [
      { method: 'GET', path: '/api/events', desc: 'List all events' },
      { method: 'POST', path: '/api/events', desc: 'Create an event', body: '{ title, startDate, endDate, tags }' },
      { method: 'GET', path: '/api/events/:id', desc: 'Get event by ID' },
      { method: 'PATCH', path: '/api/events/:id', desc: 'Update event' },
      { method: 'DELETE', path: '/api/events/:id', desc: 'Delete event' },
    ],
  },
  {
    name: '🔔 Reminders API',
    cb: 'dev_reminders',
    endpoints: [
      { method: 'GET', path: '/api/reminders', desc: 'List all reminders' },
      { method: 'POST', path: '/api/reminders', desc: 'Create reminder', body: '{ relatedEntityType, relatedEntityId, scheduledAt }' },
      { method: 'DELETE', path: '/api/reminders/:id', desc: 'Delete reminder' },
    ],
  },
  {
    name: '📣 Notifications API',
    cb: 'dev_notifications',
    endpoints: [
      { method: 'POST', path: '/api/notifications/send', desc: 'Send to a user', body: '{ telegramId, message }' },
      { method: 'POST', path: '/api/notifications/broadcast', desc: 'Broadcast to all users', body: '{ message }' },
    ],
  },
]

function devCenterMenu(chatId, messageId) {
  return edit(chatId, messageId,
    `📚 *Developer Center*\n━━━━━━━━━━━━━━━━━━━━\n\nBase URL:\n\`${BASE_URL}\`\n\nOpenAPI Spec:\n\`${BASE_URL}/api/openapi\`\n\nChatGPT Action URL:\n\`${BASE_URL}/api/openapi\`\n\nSelect a category to explore:`,
    {
      reply_markup: {
        inline_keyboard: [
          ...DEV_CATEGORIES.map(c => [{ text: c.name, callback_data: c.cb }]),
          [{ text: '🌐 Open Dev Portal', url: `${BASE_URL}/dev` }],
          ...BACK_HOME,
        ],
      },
    },
  )
}

function devCategoryPage(chatId, messageId, cb) {
  const cat = DEV_CATEGORIES.find(c => c.cb === cb)
  if (!cat) return
  const methodEmoji = { GET: '🟢', POST: '🔵', PATCH: '🟡', DELETE: '🔴' }
  let text = `${cat.name}\n━━━━━━━━━━━━━━━━━━━━\n\n`
  cat.endpoints.forEach(ep => {
    text += `${methodEmoji[ep.method] || '⚪'} \`${ep.method}\` \`${ep.path}\`\n`
    text += `   ${ep.desc}\n`
    if (ep.body) text += `   Body: \`${ep.body}\`\n`
    text += '\n'
  })
  return edit(chatId, messageId, text, {
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Open Full Docs', url: `${BASE_URL}/dev` }],
        [{ text: '◀ Back to Dev Center', callback_data: 'menu_dev' }],
        ...BACK_HOME,
      ],
    },
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Callback handler
// ─────────────────────────────────────────────────────────────────────────────

async function handleCallback(query) {
  const chatId = query.message.chat.id
  const msgId = query.message.message_id
  const data = query.data
  const firstName = query.from?.first_name || 'there'

  await answer(query.id)

  // ── noop ──
  if (data === 'noop') return

  // ── Main menu ──
  if (data === 'menu_home') { await showMainMenu(chatId, firstName, msgId); return }

  // ── Section menus ──
  if (data === 'menu_tasks') {
    await edit(chatId, msgId, `📝 *Tasks*\n\nWhat would you like to do?`, { reply_markup: tasksMenuKB() }); return
  }
  if (data === 'menu_events') {
    await edit(chatId, msgId, `📅 *Events*\n\nWhat would you like to do?`, { reply_markup: eventsMenuKB() }); return
  }
  if (data === 'menu_reminders') {
    await edit(chatId, msgId, `🔔 *Reminders*\n\nWhat would you like to do?`, { reply_markup: remindersMenuKB() }); return
  }

  // ── Tags ──
  if (data === 'menu_tags') {
    const tasks = await taskService.listTasks({})
    const allTags = [...new Set(tasks.flatMap(t => t.tags || []))]
    const text = allTags.length
      ? `🏷 *All Tags*\n━━━━━━━━━━━━━━━━━━━━\n\n${allTags.map(t => `• \`${t}\``).join('\n')}\n\n_Use_ \`/tag <task-id> <tag>\` _to add a tag._`
      : `🏷 *No tags yet.*\n\nUse \`/tag <task-id> <tag>\` to add one.`
    await edit(chatId, msgId, text, { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }

  // ── Priorities ──
  if (data === 'menu_priorities') {
    const tasks = await taskService.listTasks({})
    const hi = tasks.filter(t => t.priority === 2).length
    const mid = tasks.filter(t => t.priority === 1).length
    const lo = tasks.filter(t => (t.priority ?? 0) === 0).length
    await edit(chatId, msgId,
      `⚡ *Priority Overview*\n━━━━━━━━━━━━━━━━━━━━\n\n🔴 High Priority: *${hi}* tasks\n🟡 Medium Priority: *${mid}* tasks\n🟢 Low Priority: *${lo}* tasks`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔴 View High Priority', callback_data: 'tasks_hi_0' }],
            ...BACK_HOME,
          ],
        },
      }
    ); return
  }

  // ── Statistics ──
  if (data === 'menu_stats') {
    const [tasks, events, reminders] = await Promise.all([
      taskService.listTasks({}),
      eventService.listEvents({}),
      reminderService.listReminders({}),
    ])
    const open = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE').length
    const done = tasks.length - open
    const hi = tasks.filter(t => t.priority === 2).length
    const mid = tasks.filter(t => t.priority === 1).length
    const lo = tasks.filter(t => (t.priority ?? 0) === 0).length
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0
    const bar = '█'.repeat(Math.round(pct / 10)) + '░'.repeat(10 - Math.round(pct / 10))
    await edit(chatId, msgId,
      `📊 *Statistics*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
      `📝 *Tasks*\n` +
      `Total: *${tasks.length}*  ·  Open: *${open}*  ·  Done: *${done}*\n` +
      `Progress: \`${bar}\` ${pct}%\n\n` +
      `⚡ *By Priority*\n🔴 High: ${hi}  🟡 Medium: ${mid}  🟢 Low: ${lo}\n\n` +
      `📅 *Events:* ${events.length}\n` +
      `🔔 *Reminders:* ${reminders.length}`,
      { reply_markup: { inline_keyboard: BACK_HOME } },
    ); return
  }

  // ── Developer Center ──
  if (data === 'menu_dev') { await devCenterMenu(chatId, msgId); return }
  if (DEV_CATEGORIES.some(c => c.cb === data)) { await devCategoryPage(chatId, msgId, data); return }

  // ── Help ──
  if (data === 'menu_help') {
    await edit(chatId, msgId,
      `❓ *How to use*\n━━━━━━━━━━━━━━━━━━━━\n\n` +
      `*🗣 Just type naturally:*\n` +
      `_"Buy milk tomorrow"_ → creates task\n` +
      `_"Meeting Friday 4pm"_ → creates event\n` +
      `_"Remind me every Monday"_ → reminder\n\n` +
      `*📝 Task commands:*\n` +
      `\`/add <title>\` — create task\n` +
      `\`/update <id> <title>\` — edit task\n` +
      `\`/done <id>\` — complete task\n` +
      `\`/delete <id>\` — delete task\n` +
      `\`/tasks\` — list tasks\n` +
      `\`/search <word>\` — search\n\n` +
      `*📅 Event commands:*\n` +
      `\`/event <title>\` — create event\n\n` +
      `💡 *Tip:* Task IDs in \`code\` blocks — tap to copy!`,
      { reply_markup: { inline_keyboard: BACK_HOME } },
    ); return
  }

  // ── Task list pages ──
  if (data.startsWith('tasks_p_')) {
    const p = parseInt(data.split('_').pop())
    const { text, kb } = await buildTaskPage(p, 'all')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }
  if (data.startsWith('tasks_done_')) {
    const p = parseInt(data.split('_').pop())
    const { text, kb } = await buildTaskPage(p, 'done')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }
  if (data.startsWith('tasks_hi_')) {
    const p = parseInt(data.split('_').pop())
    const { text, kb } = await buildTaskPage(p, 'hi')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }

  // ── Event list pages ──
  if (data.startsWith('events_p_')) {
    const p = parseInt(data.split('_').pop())
    const { text, kb } = await buildEventPage(p)
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }

  // ── Reminder pages ──
  if (data.startsWith('reminders_p_')) {
    const p = parseInt(data.split('_').pop())
    const { text, kb } = await buildReminderPage(p)
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }

  // ── Add prompts ──
  if (data === 'task_add') {
    await edit(chatId, msgId,
      `📝 *Add a Task*\n\n_Just type naturally or use a command:_\n\n• \`/add Buy groceries\`\n• \`/add Call doctor tomorrow 3pm\`\n• Or just send: _"Submit report by Friday"_`,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }
  if (data === 'event_add') {
    await edit(chatId, msgId,
      `📅 *Add an Event*\n\n• \`/event Team standup tomorrow 10am\`\n• Or just send: _"Meeting with Rahul Friday 4pm"_`,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }
  if (data === 'task_search') {
    await edit(chatId, msgId,
      `🔍 *Search Tasks*\n\nSend: \`/search <keyword>\``,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }
  if (data === 'task_bytag') {
    const tasks = await taskService.listTasks({})
    const tags = [...new Set(tasks.flatMap(t => t.tags || []))]
    await edit(chatId, msgId,
      tags.length
        ? `🏷 *Filter by tag:*\n\nUse \`/search <tag>\` to find tasks by tag.\n\nAvailable tags:\n${tags.map(t => `• \`${t}\``).join('\n')}`
        : `🏷 *No tags yet.*\n\nAdd tags using \`/tag <task-id> <tag>\``,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }

  // ── Multi-delete ──
  if (data.startsWith('mdel_s_')) {
    // mdel_s_{page}_{selStr}
    const parts = data.slice(7).split('_')
    const page = parseInt(parts[0]) || 0
    const selStr = parts.slice(1).join('_')
    const { text: t, kb } = await buildMultiDeleteView(page, selStr)
    await edit(chatId, msgId, t, { reply_markup: kb }); return
  }

  if (data.startsWith('mdel_confirm_')) {
    const selStr = data.slice(13)
    const sel = parseSel(selStr)
    const all = await taskService.listTasks({})
    const open = all.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE')
    const toDelete = [...sel].map(i => open[i]).filter(Boolean)
    const titleList = toDelete.map(t => `• ${t.title}`).join('\n')
    await edit(chatId, msgId,
      `⚠️ *Delete ${toDelete.length} Task${toDelete.length > 1 ? 's' : ''}?*\n━━━━━━━━━━━━━━━━━━━━\n\n${titleList}\n\n_This cannot be undone._`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: `🗑 Yes, Delete All`, callback_data: `mdel_do_${selStr}` }, { text: '✗ Cancel', callback_data: `mdel_s_0_${selStr}` }],
          ],
        },
      }
    ); return
  }

  if (data.startsWith('mdel_do_')) {
    const selStr = data.slice(8)
    const sel = parseSel(selStr)
    const all = await taskService.listTasks({})
    const open = all.filter(t => t.status !== 'COMPLETED' && t.status !== 'DONE')
    const toDelete = [...sel].map(i => open[i]).filter(Boolean)
    await Promise.all(toDelete.map(t => taskService.deleteTask(t.id)))
    await toast(query.id, `🗑 ${toDelete.length} task${toDelete.length > 1 ? 's' : ''} deleted!`)
    const { text: listText, kb } = await buildTaskPage(0, 'all')
    await edit(chatId, msgId, `🗑 *Deleted ${toDelete.length} task(s)*\n\n` + listText, { reply_markup: kb }); return
  }

  // ── Task actions ──
  if (data.startsWith('t_done_')) {
    const id = data.slice(7)
    await taskService.completeTask(id)
    await toast(query.id, '✅ Marked as done!')
    const { text, kb } = await buildTaskPage(0, 'all')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }
  if (data.startsWith('t_reopen_')) {
    const id = data.slice(9)
    await taskService.reopenTask(id)
    await toast(query.id, '🔄 Task reopened!')
    const { text, kb } = await buildTaskPage(0, 'all')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }
  if (data.startsWith('t_edit_')) {
    const id = data.slice(7)
    const task = await taskService.getTask(id)
    await edit(chatId, msgId,
      `✏️ *Edit Task*\n\nCurrent: *${task?.title}*\n\nSend the new title:\n\`/update ${id} <new title>\``,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }
  if (data.startsWith('t_confirmDel_')) {
    const id = data.slice(13)
    const task = await taskService.getTask(id)
    await edit(chatId, msgId,
      `⚠️ *Delete Task?*\n\n"${task?.title}"\n\nThis cannot be undone.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗑 Yes, Delete', callback_data: `t_del_${id}` }, { text: '✗ Cancel', callback_data: 'tasks_p_0' }],
          ],
        },
      }); return
  }
  if (data.startsWith('t_del_')) {
    const id = data.slice(6)
    await taskService.deleteTask(id)
    await toast(query.id, '🗑 Task deleted!')
    const { text, kb } = await buildTaskPage(0, 'all')
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }

  // ── Event actions ──
  if (data.startsWith('e_edit_')) {
    const id = data.slice(7)
    const ev = await eventService.getEvent(id)
    await edit(chatId, msgId,
      `✏️ *Edit Event*\n\nCurrent: *${ev?.title}*\n\nSend: \`/updateevent ${id} <new title>\``,
      { reply_markup: { inline_keyboard: BACK_HOME } }); return
  }
  if (data.startsWith('e_confirmDel_')) {
    const id = data.slice(13)
    const ev = await eventService.getEvent(id)
    await edit(chatId, msgId,
      `⚠️ *Delete Event?*\n\n"${ev?.title}"\n\nThis cannot be undone.`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗑 Yes, Delete', callback_data: `e_del_${id}` }, { text: '✗ Cancel', callback_data: 'events_p_0' }],
          ],
        },
      }); return
  }
  if (data.startsWith('e_del_')) {
    const id = data.slice(6)
    await eventService.deleteEvent(id)
    await toast(query.id, '🗑 Event deleted!')
    const { text, kb } = await buildEventPage(0)
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }

  // ── Reminder delete ──
  if (data.startsWith('r_confirmDel_')) {
    const id = data.slice(13)
    await edit(chatId, msgId, `⚠️ *Delete this reminder?*`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🗑 Yes, Delete', callback_data: `r_del_${id}` }, { text: '✗ Cancel', callback_data: 'reminders_p_0' }],
          ],
        },
      }); return
  }
  if (data.startsWith('r_del_')) {
    const id = data.slice(6)
    await reminderService.deleteReminder(id)
    await toast(query.id, '🗑 Reminder deleted!')
    const { text, kb } = await buildReminderPage(0)
    await edit(chatId, msgId, text, { reply_markup: kb }); return
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Command + NLP handler
// ─────────────────────────────────────────────────────────────────────────────

const GREETINGS = /^(hi|hello|hey|hii|helo|howdy|yo|sup|start)[!?.]*$/i

async function handleMessage(chatId, text, firstName) {
  const trimmed = text.trim()
  const parts = trimmed.split(' ')
  const cmd = parts[0].toLowerCase()
  const rest = parts.slice(1).join(' ')

  // Slash commands
  if (cmd === '/start' || cmd === '/help' || GREETINGS.test(trimmed)) {
    await showMainMenu(chatId, firstName); return
  }

  if (cmd === '/add') {
    if (!rest) { await send(chatId, `❌ Usage: \`/add <title>\``); return }
    const items = splitIntoItems(rest)
    if (items && items.length > 1) {
      const tasks = await Promise.all(
        items.map(item => taskService.createTask({ title: item, tags: detectTags(item) }))
      )
      await send(chatId,
        `✅ *${tasks.length} Tasks Created!*\n━━━━━━━━━━━━━━━━━━━━\n\n${multiTaskList(tasks)}`,
        { reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] } }
      ); return
    }
    const autoTags = detectTags(rest)
    const t = await taskService.createTask({ title: rest, tags: autoTags })
    await send(chatId, `✅ *Task Created!*\n━━━━━━━━━━━━━━━━━━━━\n${taskCard(t, 1)}`, {
      reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] },
    }); return
  }

  if (cmd === '/update') {
    const [id, ...rest2] = rest.split(' ')
    const title = rest2.join(' ')
    if (!id || !title) { await send(chatId, `❌ Usage: \`/update <id> <new title>\``); return }
    const t = await taskService.updateTask(id, { title })
    await send(chatId, `✅ *Task Updated!*\n━━━━━━━━━━━━━━━━━━━━\n${taskCard(t, 1)}`, {
      reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }]] },
    }); return
  }

  if (cmd === '/updateevent') {
    const [id, ...rest2] = rest.split(' ')
    const title = rest2.join(' ')
    if (!id || !title) { await send(chatId, `❌ Usage: \`/updateevent <id> <new title>\``); return }
    const e = await eventService.updateEvent(id, { title })
    await send(chatId, `✅ *Event Updated!*\n\n📅 *${e.title}*`, {
      reply_markup: { inline_keyboard: [[{ text: '📅 My Events', callback_data: 'events_p_0' }]] },
    }); return
  }

  if (cmd === '/tasks') {
    const { text: t, kb } = await buildTaskPage(0, 'all')
    await send(chatId, t, { reply_markup: kb }); return
  }

  if (cmd === '/event') {
    if (!rest) { await send(chatId, `❌ Usage: \`/event <title>\``); return }
    const date = extractDate(rest) || new Date().toISOString()
    const e = await eventService.createEvent({ title: rest, startDate: date })
    await send(chatId, `✅ *Event Created!*\n━━━━━━━━━━━━━━━━━━━━\n${eventCard(e, 1)}`, {
      reply_markup: { inline_keyboard: [[{ text: '📅 My Events', callback_data: 'events_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] },
    }); return
  }

  if (cmd === '/done') {
    if (!rest) { await send(chatId, `❌ Usage: \`/done <id>\``); return }
    await taskService.completeTask(rest.trim())
    await send(chatId, `✅ Task marked *Completed!*`, { reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }]] } }); return
  }

  if (cmd === '/delete') {
    if (!rest) { await send(chatId, `❌ Usage: \`/delete <id>\``); return }
    await taskService.deleteTask(rest.trim())
    await send(chatId, `🗑 Task *deleted.*`, { reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }]] } }); return
  }

  if (cmd === '/search') {
    if (!rest) { await send(chatId, `❌ Usage: \`/search <keyword>\``); return }
    const all = await taskService.listTasks({})
    const found = all.filter(t => t.title.toLowerCase().includes(rest.toLowerCase()) || (t.tags || []).includes(rest))
    if (!found.length) { await send(chatId, `🔍 No tasks found for *"${rest}"*`); return }
    let msg = `🔍 *Found ${found.length} task(s):*\n━━━━━━━━━━━━━━━━━━━━\n\n`
    msg += found.map((t, i) => taskCard(t, i + 1)).join('\n\n')
    const kb = { inline_keyboard: [...found.map(t => taskActionRow(t)), BACK_HOME[0]] }
    await send(chatId, msg, { reply_markup: kb }); return
  }

  if (cmd === '/tag') {
    const [id, tag] = rest.split(' ')
    if (!id || !tag) { await send(chatId, `❌ Usage: \`/tag <id> <tag>\``); return }
    await taskService.addTag(id, tag)
    await send(chatId, `🏷 Tag *"${tag}"* added!`); return
  }

  // ── Natural language fallback ──
  if (!trimmed.startsWith('/')) {
    const { title, dueDate, notifyAt, intent } = parseNLMessage(trimmed)

    if (intent === 'event') {
      const e = await eventService.createEvent({ title, startDate: dueDate || new Date().toISOString() })
      await send(chatId,
        `✅ *Event Created!*\n━━━━━━━━━━━━━━━━━━━━\n${eventCard(e, 1)}`,
        { reply_markup: { inline_keyboard: [[{ text: '📅 My Events', callback_data: 'events_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] } }
      ); return
    }

    // Try splitting into multiple tasks first
    const items = splitIntoItems(text)
    if (items && items.length > 1) {
      const tasks = await Promise.all(
        items.map(item => taskService.createTask({ title: item, dueDate, tags: detectTags(item) }))
      )
      let msg = `✅ *${tasks.length} Tasks Created!*\n━━━━━━━━━━━━━━━━━━━━\n\n${multiTaskList(tasks)}`
      if (notifyAt) msg += `\n\n🔔 Notification scheduled for *${fmtDate(notifyAt)}*`
      await send(chatId, msg, {
        reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] },
      }); return
    }

    // Single task with auto-detected tags from original message
    const autoTags = detectTags(text)
    const t = await taskService.createTask({ title, dueDate, tags: autoTags })

    // Schedule reminder if notification time was mentioned
    let reminderNote = ''
    if (notifyAt) {
      await reminderService.createReminder({
        relatedEntityType: 'Task',
        relatedEntityId: t.id,
        scheduledAt: notifyAt,
        chatId: String(chatId),
        message: `🔔 *Reminder:* ${title}`,
      })
      reminderNote = `\n🔔 Notification scheduled for *${fmtDate(notifyAt)}*`
    }

    await send(chatId,
      `✅ *Task Created!*\n━━━━━━━━━━━━━━━━━━━━\n${taskCard(t, 1)}${reminderNote}`,
      { reply_markup: { inline_keyboard: [[{ text: '📋 My Tasks', callback_data: 'tasks_p_0' }, { text: '🏠 Home', callback_data: 'menu_home' }]] } }
    ); return
  }

  await send(chatId, `❓ Unknown command.`, { reply_markup: { inline_keyboard: BACK_HOME } })
}

// ─────────────────────────────────────────────────────────────────────────────
// Main handler
// ─────────────────────────────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const body = await request.json()

    if (body.callback_query) {
      const q = body.callback_query
      const from = q.from || {}
      await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
      await handleCallback(q)
      return NextResponse.json({ ok: true })
    }

    const message = body.message || body.edited_message
    if (!message) return NextResponse.json({ ok: true })

    const from = message.from || {}
    const chatId = message.chat.id
    const text = message.text || ''
    if (!text) return NextResponse.json({ ok: true })

    await upsertTelegramUser({ telegramId: String(from.id), username: from.username, firstName: from.first_name, lastName: from.last_name })
    await handleMessage(chatId, text, from.first_name)

    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'telegram_webhook_error')
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
