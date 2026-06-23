import { NextResponse } from 'next/server'
import * as taskService from '../../../../server/services/taskService'
import logger from '../../../../server/logger'

export async function GET(request, { params }) {
  const task = await taskService.getTask(params.id)
  if (!task) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  return NextResponse.json(task)
}

export async function PATCH(request, { params }) {
  try {
    const body = await request.json()
    const task = await taskService.updateTask(params.id, body)
    return NextResponse.json(task)
  } catch (err) {
    logger.error({ err }, 'update_task_error')
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}

export async function DELETE(request, { params }) {
  try {
    await taskService.deleteTask(params.id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    logger.error({ err }, 'delete_task_error')
    return NextResponse.json({ error: String(err) }, { status: 400 })
  }
}
