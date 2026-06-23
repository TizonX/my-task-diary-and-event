# Telegram Setup

1. Create a bot with BotFather and get the `TELEGRAM_BOT_TOKEN`.
2. Set the `TELEGRAM_BOT_TOKEN` in environment variables (see `.env.example`).
3. Deploy the app and set the webhook URL using BotFather or Telegram API:

```bash
curl -F "url=https://your-app.com/api/telegram/webhook" https://api.telegram.org/bot<token>/setWebhook
```

The webhook endpoint expects the Telegram message JSON and will parse basic commands described in the README.
