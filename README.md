# My Task Diary & Event

Telegram-first personal productivity platform. This repository contains a Next.js landing page, REST APIs, Prisma schema for PostgreSQL, and an MCP server that exposes tools which call internal APIs.

Quick start

1. Copy environment variables:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run development server:

```bash
npm run dev
```

5. Start MCP server (separate process):

```bash
npm run mcp:start
```

Documentation

- API docs: docs/API.md
- MCP setup: docs/MCP.md
- Telegram setup: docs/TELEGRAM.md
- Vercel deployment: docs/VERCEL.md
