'use client'
import { useState } from 'react'

const BASE = 'https://my-task-diary-and-event.vercel.app'

const METHOD_COLORS = {
  GET:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  POST:   'bg-blue-100 text-blue-700 border-blue-200',
  PATCH:  'bg-amber-100 text-amber-700 border-amber-200',
  DELETE: 'bg-red-100 text-red-700 border-red-200',
}

const API_GROUPS = [
  {
    id: 'tasks',
    icon: '📝',
    name: 'Tasks',
    description: 'Create, read, update, delete tasks. Manage status, priority, tags.',
    color: 'from-violet-500 to-purple-600',
    endpoints: [
      {
        method: 'GET', path: '/api/tasks', desc: 'List all tasks',
        response: `[\n  {\n    "id": "cmqqmpc0b0000uv224we61dzp",\n    "title": "Buy groceries",\n    "status": "OPEN",\n    "priority": 0,\n    "dueDate": "2026-06-24T12:00:00.000Z",\n    "tags": ["personal"],\n    "createdAt": "2026-06-23T08:00:00.000Z"\n  }\n]`,
      },
      {
        method: 'POST', path: '/api/tasks', desc: 'Create a new task',
        body: `{\n  "title": "Buy groceries",\n  "dueDate": "2026-06-24T12:00:00.000Z",\n  "priority": 1,\n  "tags": ["personal"]\n}`,
        response: `{\n  "id": "cmqqmpc0b0000uv224we61dzp",\n  "title": "Buy groceries",\n  "status": "OPEN",\n  "priority": 1\n}`,
      },
      {
        method: 'GET', path: '/api/tasks/:id', desc: 'Get a task by ID',
        response: `{\n  "id": "cmqqmpc0b0000uv224we61dzp",\n  "title": "Buy groceries",\n  "status": "OPEN"\n}`,
      },
      {
        method: 'PATCH', path: '/api/tasks/:id', desc: 'Update task fields',
        body: `{\n  "title": "Buy groceries and milk",\n  "priority": 2\n}`,
        response: `{ "id": "...", "title": "Buy groceries and milk", "priority": 2 }`,
      },
      {
        method: 'DELETE', path: '/api/tasks/:id', desc: 'Delete a task',
        response: `{ "ok": true }`,
      },
      {
        method: 'POST', path: '/api/tasks/:id/complete', desc: 'Mark task as completed',
        response: `{ "id": "...", "status": "COMPLETED" }`,
      },
      {
        method: 'POST', path: '/api/tasks/:id/reopen', desc: 'Reopen a completed task',
        response: `{ "id": "...", "status": "OPEN" }`,
      },
      {
        method: 'POST', path: '/api/tasks/:id/tags', desc: 'Add a tag to task',
        body: `{ "tag": "urgent" }`,
        response: `{ "id": "...", "tags": ["personal", "urgent"] }`,
      },
      {
        method: 'DELETE', path: '/api/tasks/:id/tags/:tag', desc: 'Remove a tag from task',
        response: `{ "id": "...", "tags": ["personal"] }`,
      },
    ],
  },
  {
    id: 'events',
    icon: '📅',
    name: 'Events',
    description: 'Manage calendar events with start/end dates and tags.',
    color: 'from-blue-500 to-cyan-600',
    endpoints: [
      {
        method: 'GET', path: '/api/events', desc: 'List all events',
        response: `[\n  {\n    "id": "clxxx",\n    "title": "Team standup",\n    "startDate": "2026-06-24T10:00:00.000Z",\n    "endDate": null\n  }\n]`,
      },
      {
        method: 'POST', path: '/api/events', desc: 'Create a new event',
        body: `{\n  "title": "Team standup",\n  "startDate": "2026-06-24T10:00:00.000Z",\n  "endDate": "2026-06-24T10:30:00.000Z"\n}`,
        response: `{ "id": "clxxx", "title": "Team standup", "startDate": "..." }`,
      },
      {
        method: 'GET', path: '/api/events/:id', desc: 'Get event by ID',
        response: `{ "id": "clxxx", "title": "Team standup", "startDate": "..." }`,
      },
      {
        method: 'PATCH', path: '/api/events/:id', desc: 'Update event details',
        body: `{ "title": "Weekly standup", "endDate": "2026-06-24T11:00:00.000Z" }`,
        response: `{ "id": "clxxx", "title": "Weekly standup" }`,
      },
      {
        method: 'DELETE', path: '/api/events/:id', desc: 'Delete an event',
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    id: 'reminders',
    icon: '🔔',
    name: 'Reminders',
    description: 'Set reminders linked to tasks or events.',
    color: 'from-orange-500 to-amber-600',
    endpoints: [
      {
        method: 'GET', path: '/api/reminders', desc: 'List all reminders',
        response: `[\n  {\n    "id": "clyyy",\n    "relatedEntityType": "Task",\n    "relatedEntityId": "cmqqmpc...",\n    "scheduledAt": "2026-06-24T08:00:00.000Z",\n    "status": "PENDING"\n  }\n]`,
      },
      {
        method: 'POST', path: '/api/reminders', desc: 'Create a reminder',
        body: `{\n  "relatedEntityType": "Task",\n  "relatedEntityId": "cmqqmpc0b0000uv224we61dzp",\n  "scheduledAt": "2026-06-24T08:00:00.000Z"\n}`,
        response: `{ "id": "clyyy", "status": "PENDING" }`,
      },
      {
        method: 'GET', path: '/api/reminders/:id', desc: 'Get reminder by ID',
        response: `{ "id": "clyyy", "scheduledAt": "...", "status": "PENDING" }`,
      },
      {
        method: 'DELETE', path: '/api/reminders/:id', desc: 'Delete a reminder',
        response: `{ "ok": true }`,
      },
    ],
  },
  {
    id: 'notifications',
    icon: '📣',
    name: 'Notifications',
    description: 'Send Telegram messages to users programmatically.',
    color: 'from-pink-500 to-rose-600',
    endpoints: [
      {
        method: 'POST', path: '/api/notifications/send', desc: 'Send message to a specific user',
        body: `{\n  "telegramId": "123456789",\n  "message": "Your task is due soon!"\n}`,
        response: `{ "ok": true }`,
      },
      {
        method: 'POST', path: '/api/notifications/broadcast', desc: 'Broadcast to all users',
        body: `{ "message": "System maintenance at midnight." }`,
        response: `{ "ok": true, "sent": 42 }`,
      },
    ],
  },
  {
    id: 'system',
    icon: '⚙️',
    name: 'System',
    description: 'Health check and OpenAPI specification.',
    color: 'from-slate-500 to-gray-600',
    endpoints: [
      {
        method: 'GET', path: '/api/health', desc: 'Check API health and DB connectivity',
        response: `{ "status": "ok" }`,
      },
      {
        method: 'GET', path: '/api/openapi', desc: 'OpenAPI 3.1 spec (for ChatGPT Actions)',
        response: `{ "openapi": "3.1.0", "info": { ... }, "paths": { ... } }`,
      },
    ],
  },
]

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function EndpointCard({ ep }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left"
      >
        <span className={`text-xs font-bold px-2 py-1 rounded border font-mono ${METHOD_COLORS[ep.method]}`}>
          {ep.method}
        </span>
        <code className="text-sm text-slate-700 font-mono flex-1">{ep.path}</code>
        <span className="text-sm text-slate-500 hidden sm:block">{ep.desc}</span>
        <span className="text-slate-400 text-xs ml-2">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-slate-200 bg-slate-900 p-4 space-y-4">
          <p className="text-slate-300 text-sm">{ep.desc}</p>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 uppercase tracking-wider">URL</span>
              <CopyButton text={`${BASE}${ep.path}`} />
            </div>
            <code className="block text-xs text-emerald-400 bg-slate-800 px-3 py-2 rounded">
              {BASE}{ep.path}
            </code>
          </div>

          {ep.body && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Request Body</span>
                <CopyButton text={ep.body} />
              </div>
              <pre className="text-xs text-amber-300 bg-slate-800 px-3 py-2 rounded overflow-x-auto">{ep.body}</pre>
            </div>
          )}

          {ep.response && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 uppercase tracking-wider">Response</span>
                <CopyButton text={ep.response} />
              </div>
              <pre className="text-xs text-blue-300 bg-slate-800 px-3 py-2 rounded overflow-x-auto">{ep.response}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GroupCard({ group, isActive, onSelect }) {
  return (
    <button
      onClick={() => onSelect(group.id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
        isActive
          ? 'bg-slate-900 text-white border-slate-900'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
      }`}
    >
      <span>{group.icon}</span>
      <span>{group.name}</span>
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {group.endpoints.length}
      </span>
    </button>
  )
}

export default function DevPortal() {
  const [search, setSearch] = useState('')
  const [activeGroup, setActiveGroup] = useState('all')

  const totalEndpoints = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0)

  const filtered = API_GROUPS
    .filter(g => activeGroup === 'all' || g.id === activeGroup)
    .map(g => ({
      ...g,
      endpoints: g.endpoints.filter(ep =>
        !search ||
        ep.path.toLowerCase().includes(search.toLowerCase()) ||
        ep.desc.toLowerCase().includes(search.toLowerCase()) ||
        ep.method.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(g => g.endpoints.length > 0)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">📚</div>
            <div>
              <p className="text-slate-400 text-sm">My Task Diary & Event</p>
              <h1 className="text-2xl font-bold">Developer Portal</h1>
            </div>
          </div>
          <p className="text-slate-300 text-sm max-w-xl mb-6">
            REST API for tasks, events, reminders, and notifications. Use with ChatGPT Actions or any HTTP client.
          </p>

          {/* Stats row */}
          <div className="flex flex-wrap gap-4 mb-6">
            {[
              { label: 'Base URL', value: BASE, mono: true },
              { label: 'Endpoints', value: `${totalEndpoints} total` },
              { label: 'OpenAPI', value: 'v3.1.0' },
            ].map(s => (
              <div key={s.label} className="bg-white/10 rounded-lg px-4 py-2">
                <p className="text-xs text-slate-400">{s.label}</p>
                <p className={`text-sm text-white font-medium ${s.mono ? 'font-mono' : ''}`}>{s.value}</p>
              </div>
            ))}
          </div>

          {/* Quick links */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: '📄 OpenAPI JSON', href: `${BASE}/api/openapi` },
              { label: '🤖 ChatGPT Action', href: `${BASE}/api/openapi` },
              { label: '❤️ Health Check', href: `${BASE}/api/health` },
            ].map(l => (
              <a
                key={l.label}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10 transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="relative mb-6">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="text"
            placeholder="Search endpoints by path, method, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded-xl bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>

        {/* Group filter tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveGroup('all')}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              activeGroup === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
            }`}
          >
            All
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeGroup === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {totalEndpoints}
            </span>
          </button>
          {API_GROUPS.map(g => (
            <GroupCard key={g.id} group={g} isActive={activeGroup === g.id} onSelect={setActiveGroup} />
          ))}
        </div>

        {/* Endpoint groups */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No endpoints found</p>
            <p className="text-sm mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filtered.map(group => (
              <div key={group.id}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${group.color} flex items-center justify-center text-sm`}>
                    {group.icon}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">{group.name} API</h2>
                    <p className="text-xs text-slate-500">{group.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-slate-400">{group.endpoints.length} endpoint{group.endpoints.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="space-y-2">
                  {group.endpoints.map((ep, i) => <EndpointCard key={i} ep={ep} />)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center text-sm text-slate-400">
          <p>My Task Diary & Event — REST API</p>
          <p className="mt-1">
            <a href={`${BASE}/api/openapi`} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 underline">
              OpenAPI Spec
            </a>
            {' · '}
            <a href="https://t.me/my_task_diary_and_event_bot" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-slate-700 underline">
              Telegram Bot
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
