export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import prisma from '../../../../lib/prisma'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

async function sendTelegram(chatId, text) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
}

export async function GET(request) {
  // Vercel calls this endpoint on the cron schedule.
  // Find all PENDING reminders that are due (scheduledAt <= now) and have a chatId.
  const now = new Date()

  const due = await prisma.reminder.findMany({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
      chatId: { not: null },
    },
  })

  let fired = 0
  for (const reminder of due) {
    try {
      const msg = reminder.message || `🔔 *Reminder!*\n\nYou have a ${reminder.relatedEntityType} due now.`
      await sendTelegram(reminder.chatId, msg)
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'SENT' },
      })
      fired++
    } catch (err) {
      // Mark as failed so it doesn't keep retrying
      await prisma.reminder.update({
        where: { id: reminder.id },
        data: { status: 'FAILED' },
      })
    }
  }

  return NextResponse.json({ ok: true, fired, total: due.length })
}
