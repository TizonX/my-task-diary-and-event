# MCP Server

The MCP server exposes a simple set of HTTP endpoints that act as tools. Each tool proxies to the internal REST API.

Start locally:

```bash
npm run mcp:start
```

Environment
- `BASE_URL` should point to the running Next.js app (e.g., `http://localhost:3000`)

Tools implemented:
- `POST /tools/create_task` body: { title, ... }
- `POST /tools/update_task` body: { id, ... }
- `POST /tools/delete_task` body: { id }
- `POST /tools/complete_task` body: { id }
- `POST /tools/list_tasks` body: {}
- `POST /tools/create_event` body: { title, ... }
- `POST /tools/update_event` body: { id, ... }
- `POST /tools/delete_event` body: { id }
- `POST /tools/add_tag` body: { id, tag }
- `POST /tools/remove_tag` body: { id, tag }
- `POST /tools/create_reminder` body: { relatedEntityType, relatedEntityId, scheduledAt }
- `POST /tools/delete_reminder` body: { id }
- `POST /tools/send_notification` body: { telegramId, message }
