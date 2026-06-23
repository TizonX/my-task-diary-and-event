const express = require('express')
const fetch = require('node-fetch')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json())

const BASE = process.env.BASE_URL || 'http://localhost:3000'

async function proxy(path, method = 'POST', body) {
  const url = `${BASE}${path}`
  const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  return res.json()
}

app.post('/tools/create_task', async (req, res) => {
  const resp = await proxy('/api/tasks', 'POST', req.body)
  res.json(resp)
})

app.post('/tools/update_task', async (req, res) => {
  const { id, ...body } = req.body
  const resp = await proxy(`/api/tasks/${id}`, 'PATCH', body)
  res.json(resp)
})

app.post('/tools/delete_task', async (req, res) => {
  const { id } = req.body
  const resp = await proxy(`/api/tasks/${id}`, 'DELETE')
  res.json(resp)
})

app.post('/tools/complete_task', async (req, res) => {
  const { id } = req.body
  const resp = await proxy(`/api/tasks/${id}/complete`, 'POST')
  res.json(resp)
})

app.post('/tools/list_tasks', async (req, res) => {
  const resp = await proxy('/api/tasks', 'GET')
  res.json(resp)
})

// events
app.post('/tools/create_event', async (req, res) => {
  const resp = await proxy('/api/events', 'POST', req.body)
  res.json(resp)
})

app.post('/tools/update_event', async (req, res) => {
  const { id, ...body } = req.body
  const resp = await proxy(`/api/events/${id}`, 'PATCH', body)
  res.json(resp)
})

app.post('/tools/delete_event', async (req, res) => {
  const { id } = req.body
  const resp = await proxy(`/api/events/${id}`, 'DELETE')
  res.json(resp)
})

// tags
app.post('/tools/add_tag', async (req, res) => {
  const { id, tag } = req.body
  const resp = await proxy(`/api/tasks/${id}/tags`, 'POST', { tag })
  res.json(resp)
})

app.post('/tools/remove_tag', async (req, res) => {
  const { id, tag } = req.body
  const resp = await proxy(`/api/tasks/${id}/tags/${encodeURIComponent(tag)}`, 'DELETE')
  res.json(resp)
})

// reminders
app.post('/tools/create_reminder', async (req, res) => {
  const resp = await proxy('/api/reminders', 'POST', req.body)
  res.json(resp)
})

app.post('/tools/delete_reminder', async (req, res) => {
  const { id } = req.body
  const resp = await proxy(`/api/reminders/${id}`, 'DELETE')
  res.json(resp)
})

// notifications
app.post('/tools/send_notification', async (req, res) => {
  const resp = await proxy('/api/notifications/send', 'POST', req.body)
  res.json(resp)
})

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`MCP server listening on ${port}`))
