# BibleLedger

A premium Bible reading tracker built with Next.js.

## Features

- 📖 **Reader** — Read any Bible passage with chapter navigation
- 📝 **Notes** — Create notes on specific verses
- 🖍️ **Highlights** — Color-highlight verses
- 📊 **Dashboard** — Reading streaks, completion stats, activity charts
- 📋 **Ledger** — Manage pending & confirmed reading entries
- ⚙️ **Settings** — Subscribe to reading feeds, toggle auto-confirm

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL

# Start dev server
npm run dev
```

## Deploy to Vercel

1. Push to GitHub
2. Import project in Vercel Dashboard
3. Set `NEXT_PUBLIC_API_URL` environment variable
4. Vercel auto-deploys on push

## Tech Stack

- Next.js 16 + TypeScript
- Recharts for data visualization
- Lucide React for icons
- react-hot-toast for notifications
