# BibleLedger

A comprehensive Bible reading tracker with automated daily reading feeds, verse tracking, and reading statistics.

## Architecture

```
bible-ledger-backend/     # NestJS API (deploy to Render)
bible-ledger-frontend/    # Next.js UI (deploy to Vercel)
```

## Features

- 📖 **Bible Reader** — Read any passage with chapter navigation
- 📊 **Dashboard** — Reading streaks, completion stats, activity charts
- 📋 **Ledger** — Manage pending & confirmed reading entries
- 📝 **Notes & Highlights** — Per-verse annotations
- 🔔 **Reading Feeds** — Auto-log daily passages from YouVersion VOTD and custom plans
- 🔐 **Auth** — Email/password and Google OAuth via BetterAuth

## Quick Start

### Backend

```bash
cd bible-ledger-backend
npm install
cp .env.example .env   # Edit with your DB credentials
npx prisma db push
npx prisma generate
npm run start:dev
```

### Frontend

```bash
cd bible-ledger-frontend
npm install
npm run dev
```

### Load Reading Feeds

```bash
# Sync YouVersion Verse of the Day for the year
cd bible-ledger-backend
npx ts-node src/scripts/sync-youversion.ts 2026

# Import a custom reading plan from CSV
npx ts-node src/scripts/import-csv.ts <feed-slug> <file.csv> [feed-name] [year]
```

## Deployment

| Service | Platform | Repo Path |
|---------|----------|-----------|
| **Database** | Supabase | — (connection string) |
| **Backend API** | Render | `bible-ledger-backend/` |
| **Frontend** | Vercel | `bible-ledger-frontend/` |

### Environment Variables

**Backend (Render):**
- `DATABASE_URL` — Supabase Postgres connection string
- `BETTER_AUTH_URL` — Frontend URL (Vercel)
- `BETTER_AUTH_SECRET` — Auth secret key
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth
- `YOUVERSION_API_KEY` — YouVersion API key

**Frontend (Vercel):**
- `NEXT_PUBLIC_API_URL` — Backend API URL (e.g. `https://api.example.com/v1`)

## Tech Stack

- **Backend:** NestJS, Prisma, PostgreSQL, BetterAuth
- **Frontend:** Next.js 16, TypeScript, Tailwind CSS, Recharts, Lucide
- **Database:** Supabase (PostgreSQL)
