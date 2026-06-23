import { NextResponse } from 'next/server'
import * as eventService from '../../../../server/services/eventService'

export async function GET(request, { params }) {
  const ev = await eventService.getEvent(params.id)
  if (!ev) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(ev)
}

export async function PATCH(request, { params }) {
  const body = await request.json()
  const ev = await eventService.updateEvent(params.id, body)
  return NextResponse.json(ev)
}

export async function DELETE(request, { params }) {
  await eventService.deleteEvent(params.id)
  return NextResponse.json({ ok: true })
}
