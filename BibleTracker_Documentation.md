# Bible Tracker App Documentation

## Overview
The Bible Tracking System is a comprehensive platform designed to help users track their Scripture reading across various contexts—whether it's a structured plan, spontaneous devotionals, or group Bible studies. It eliminates the friction of manual logging by integrating reading, tracking, note-taking, and progress statistics into a seamless experience.

## System Architecture
The application is split into two main components:
1. **Frontend (`bible-ledger-frontend`)**: A Next.js web application built with React, Tailwind CSS, and Recharts for data visualization.
2. **Backend (`bible-ledger-backend`)**: A NestJS server providing REST APIs, utilizing PostgreSQL (managed via Prisma) for robust data storage.

## Key Features

### 1. Integrated Bible Reader
- Read directly within the app without switching to external tools.
- Supports offline reading for default translations like KJV.
- Contextual floating action bar for highlighting verses, creating notes, and viewing verse history.
- Auto-resume functionality that automatically returns users to the last passage they were reading.
- Inline search with dropdown functionality.
- Bottom chapter navigation for seamless continuous reading.

### 2. Progress & Verse-Level Tracking
- **Granular Tracking**: Tracks progress at the specific verse level (deduplicated), rather than just by chapter.
- **Session-Based Logs**: Captures date, time, translation, and custom tags (e.g., General, Study, Devotional) for each reading instance.
- **Auto-Tracking**: Automatically logs verses as read based on screen viewport time, removing the need for manual check-ins.
- **Contiguous Merging**: Intelligently groups and merges consecutive read verses in the backend to maintain a clean ledger without micro-entry spam.

### 3. Personalization: Notes & Highlights
- **Highlights**: Users can select custom colors for specific verses to make them stand out in the text.
- **Notes**: Users can add personal annotations directly tied to specific verses or passages.
- Dedicated pages for reviewing past notes and highlights, which link directly back to the reader context.

### 4. Dashboard & Statistics
- Visualizes user reading habits with activity heatmaps and reading streaks.
- Displays metrics like total verses read, chapters read, and longest reading streaks.
- Deduplicates verse counts to provide an accurate representation of unique scriptures read.

### 5. Multi-Source Integration (Planned)
- Support for auto-tracking from external reading schedules (e.g., YouVersion, Bible reading plans).
- Exposes API endpoints for external applications to update users' reading progress, notes, and highlights.

## Core Data Models
The system relies on a robust schema managed via Prisma in the backend:
- **LedgerEntry**: Records reading sessions. Denormalizes passage data (book, chapter, verses) and tracks translation, status, and custom tags.
- **Note**: Stores user-generated text annotations linked to specific passages.
- **Highlight**: Stores color-coded verse selections.
- **UserStats**: A summarized, quickly retrievable cache of user metrics (total verses, chapters, current streak, longest streak).

## API Structure
The backend exposes a clear RESTful API structure logically grouped into modules:
- `/bible`: Endpoints for fetching chapters, verses, and translations.
- `/ledger-entries`: Endpoints for creating and querying reading progress (including bulk operations).
- `/notes` & `/highlights`: CRUD operations for user annotations.
- `/stats`: Endpoints for retrieving user dashboard metrics.
