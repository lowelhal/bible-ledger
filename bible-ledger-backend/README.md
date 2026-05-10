# BibleLedger API

NestJS backend for the BibleLedger Bible reading tracker.

## Features

- **Authentication** via BetterAuth (email/password, Google OAuth)
- **Reading Feeds** — date→passage lookup tables (YouVersion VOTD, custom plans via CSV)
- **Ledger Entries** — track Bible reading sessions with auto/manual confirmation
- **Notes & Highlights** — per-verse annotations
- **Statistics** — reading streaks, completion tracking

## Setup

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate

# Start dev server
npm run start:dev
```

## Sync YouVersion VOTD

```bash
npx ts-node src/scripts/sync-youversion.ts 2026
```

## Import CSV Feed

```bash
npx ts-node src/scripts/import-csv.ts <feed-slug> <file.csv> [feed-name] [year]
```

## Deploy to Render

1. Push to GitHub
2. Connect repo in Render Dashboard
3. Set environment variables from `.env.example`
4. Render will auto-deploy on push

## Tech Stack

- NestJS + TypeScript
- Prisma ORM + PostgreSQL
- BetterAuth for authentication
