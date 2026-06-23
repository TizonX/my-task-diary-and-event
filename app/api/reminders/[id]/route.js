import { NextResponse } from 'next/server'
import * as reminderService from '../../../../server/services/reminderService'

export async function PATCH(request, { params }) {
  const body = await request.json()
  const r = await reminderService.updateReminder(params.id, body)
  return NextResponse.json(r)
}

export async function DELETE(request, { params }) {
  await reminderService.deleteReminder(params.id)
  return NextResponse.json({ ok: true })
}
