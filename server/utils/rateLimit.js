const LIMIT = 100 // per minute
const WINDOW_MS = 60 * 1000

const clients = new Map()

export function rateLimit(key) {
  const now = Date.now()
  const entry = clients.get(key) || { count: 0, start: now }
  if (now - entry.start > WINDOW_MS) {
    entry.count = 0
    entry.start = now
  }
  entry.count += 1
  clients.set(key, entry)
  return {
    ok: entry.count <= LIMIT,
    remaining: Math.max(0, LIMIT - entry.count)
  }
}
