import { NextResponse } from 'next/server'
import * as eventService from '../../../server/services/eventService'
import { rateLimit } from '../../../server/utils/rateLimit'

export async function GET(request) {
  const rl = rateLimit(request.headers.get('x-forwarded-for') || 'anon')
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const events = await eventService.listEvents()
  return NextResponse.json(events)
}

export async function POST(request) {
  const body = await request.json()
  const ev = await eventService.createEvent(body)
  return NextResponse.json(ev, { status: 201 })
}
