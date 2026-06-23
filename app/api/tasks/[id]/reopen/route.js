import { NextResponse } from 'next/server'
import * as taskService from '../../../../../server/services/taskService'

export async function POST(request, { params }) {
  await taskService.reopenTask(params.id)
  return NextResponse.json({ ok: true })
}
