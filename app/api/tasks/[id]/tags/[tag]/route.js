import { NextResponse } from 'next/server'
import * as taskService from '../../../../../../server/services/taskService'

export async function DELETE(request, { params }) {
  await taskService.removeTag(params.id, params.tag)
  return NextResponse.json({ ok: true })
}
