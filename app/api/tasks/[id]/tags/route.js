import { NextResponse } from 'next/server'
import * as taskService from '../../../../../server/services/taskService'

export async function POST(request, { params }) {
  const { tag } = await request.json()
  const task = await taskService.addTag(params.id, tag)
  return NextResponse.json(task)
}

export async function DELETE(request, { params }) {
  // path: /api/tasks/:id/tags/:tag handled in separate file
  return NextResponse.json({ error: 'use /api/tasks/:id/tags/:tag' }, { status: 400 })
}
