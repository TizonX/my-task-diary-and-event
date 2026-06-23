export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'My Task Diary & Event API',
    description: 'Create and manage tasks and events on behalf of the user.',
    version: '1.0.0',
  },
  servers: [{ url: 'https://my-task-diary-and-event.vercel.app' }],
  paths: {
    '/api/tasks': {
      get: {
        operationId: 'listTasks',
        summary: 'List all tasks',
        responses: {
          200: { description: 'Array of tasks' },
        },
      },
      post: {
        operationId: 'createTask',
        summary: 'Create a new task',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title'],
                properties: {
                  title: { type: 'string', description: 'Task title' },
                  description: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time', description: 'Due date in ISO 8601 format' },
                  priority: { type: 'integer', description: '0=low, 1=medium, 2=high' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created successfully' },
        },
      },
    },
    '/api/tasks/{id}': {
      get: {
        operationId: 'getTask',
        summary: 'Get a task by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Task object' } },
      },
      patch: {
        operationId: 'updateTask',
        summary: 'Update a task',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  dueDate: { type: 'string', format: 'date-time' },
                  priority: { type: 'integer' },
                  status: { type: 'string', enum: ['OPEN', 'COMPLETED'] },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'Updated task' } },
      },
      delete: {
        operationId: 'deleteTask',
        summary: 'Delete a task',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
    '/api/tasks/{id}/complete': {
      post: {
        operationId: 'completeTask',
        summary: 'Mark a task as completed',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Task marked complete' } },
      },
    },
    '/api/events': {
      get: {
        operationId: 'listEvents',
        summary: 'List all events',
        responses: { 200: { description: 'Array of events' } },
      },
      post: {
        operationId: 'createEvent',
        summary: 'Create a new event',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'startDate'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  startDate: { type: 'string', format: 'date-time' },
                  endDate: { type: 'string', format: 'date-time' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: { 201: { description: 'Event created' } },
      },
    },
    '/api/events/{id}': {
      delete: {
        operationId: 'deleteEvent',
        summary: 'Delete an event',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Deleted' } },
      },
    },
  },
}

export async function GET() {
  return NextResponse.json(spec, {
    headers: { 'Access-Control-Allow-Origin': '*' },
  })
}
