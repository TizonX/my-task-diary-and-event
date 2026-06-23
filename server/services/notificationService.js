import fetch from 'node-fetch'
import logger from '../logger'

const TELEGRAM_API = 'https://api.telegram.org'

export async function sendNotification({ telegramId, message }) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured')
  const url = `${TELEGRAM_API}/bot${token}/sendMessage`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: telegramId, text: message })
  })
  const json = await res.json()
  logger.info({ telegramId, ok: json.ok }, 'sent_notification')
  return json
}

export async function broadcast({ telegramIds = [], message }) {
  const results = []
  for (const id of telegramIds) {
    try {
      results.push(await sendNotification({ telegramId: id, message }))
    } catch (err) {
      logger.error({ err, id }, 'broadcast_error')
      results.push({ ok: false, error: String(err) })
    }
  }
  return results
}
