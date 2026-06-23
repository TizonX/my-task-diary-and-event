export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import * as reminderService from '../../../server/services/reminderService'

export async function GET() {
  const rems = await reminderService.listReminders()
  return NextResponse.json(rems)
}

export async function POST(request) {
  const body = await request.json()
  const r = await reminderService.createReminder(body)
  return NextResponse.json(r, { status: 201 })
}
