# API Documentation

Base URL: `/api`

Tasks
- `POST /api/tasks` create a task
- `GET /api/tasks` list tasks
- `GET /api/tasks/:id` get task
- `PATCH /api/tasks/:id` update task
- `DELETE /api/tasks/:id` delete task
- `POST /api/tasks/:id/complete` mark complete
- `POST /api/tasks/:id/reopen` reopen
- `POST /api/tasks/:id/tags` add tag (body: { tag })
- `DELETE /api/tasks/:id/tags/:tag` remove tag

Events
- `POST /api/events`
- `GET /api/events`
- `GET /api/events/:id`
- `PATCH /api/events/:id`
- `DELETE /api/events/:id`

Reminders
- `POST /api/reminders`
- `GET /api/reminders`
- `PATCH /api/reminders/:id`
- `DELETE /api/reminders/:id`

Notifications
- `POST /api/notifications/send` body: { telegramId, message }
- `POST /api/notifications/broadcast` body: { telegramIds: [], message }

Telegram
- `POST /api/telegram/webhook` configured as webhook endpoint in BotFather

Health
- `GET /api/health`
