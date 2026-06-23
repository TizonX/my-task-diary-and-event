# Vercel Deployment

1. Set environment variables in Vercel dashboard: `DATABASE_URL`, `TELEGRAM_BOT_TOKEN`, `LOG_LEVEL`, `BASE_URL` (pointing to your deployed site).
2. Push to Git and link the repository in Vercel.
3. Build command: `npm run build`. Output directory: default.
4. After deployment, set your Telegram webhook to `https://<your-vercel-domain>/api/telegram/webhook`.
