export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import * as taskService from '../../../server/services/taskService'
import { rateLimit } from '../../../server/utils/rateLimit'
import logger from '../../../server/logger'

export async function GET(request) {
  const rl = rateLimit(request.headers.get('x-forwarded-for') || 'anon')
  if (!rl.ok) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const url = new URL(request.url)
  const params = Object.fromEntries(url.searchParams.entries())
  const tasks = await taskService.listTasks(params)
  return NextResponse.json(tasks)
}

export async function POST(request) {
  try {
    const body = await request.json()
    const task = await taskService.createTask(body)
    return NextResponse.json(task, { status: 201 })
  } catch (err) {
    logger.error({ err }, 'create_task_error')
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
