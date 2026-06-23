export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import * as notif from '../../../../server/services/notificationService'

export async function POST(request) {
  const body = await request.json()
  const res = await notif.broadcast(body)
  return NextResponse.json(res)
}
