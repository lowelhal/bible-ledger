# Bible Ledger — Comprehensive Review & Roadmap

---

## 1. UX / CX Perspective

### ✅ What Works Well
- **Auto-resume to last passage** — landing in the reader picks up where the user left off, a great comfort feature.
- **Contextual floating action bar** — select a verse, get highlight/note/history actions. Clean and discoverable.
- **Inline search with dropdown** — integrated without taking over the screen; debounced to avoid API spam.
- **Settings "Work in Progress" page** — no dead links; the user lands on something honest and polished.
- **Bottom chapter nav** — prevents the user from having to scroll all the way back up to continue reading.
- **Empty states** — all list pages (Notes, Highlights) link back to the reader when empty.

### ⚠️ Issues & Gaps

| # | Area | Issue |
|---|------|-------|
| 1 | **Multi-user** | `userId = "user-123"` is hardcoded in **every** component (`page.tsx`, `reader/page.tsx`, `notes/page.tsx`, `highlights/page.tsx`). There is zero authentication concept. Any future user would see the same data. |
| 2 | **Notes** | Notes cannot be **edited or deleted** once created. The Notes page is read-only. |
| 3 | **Highlights** | Highlights cannot be **edited (re-coloured)** or deleted either. |
| 4 | **Highlight card UX** | The Highlights page shows a colour circle and passage reference. It does **not show the actual verse text**. The user has to click through to know what the highlight says. |
| 5 | **Streak logic** | `current_streak` is always `1` if any entry exists. The streak counter on the Dashboard is perpetually incorrect (shows "1-day streak" regardless of actual reading habit). |
| 6 | **Activity heatmap** | Shows the last 7 days only, is not a true calendar heatmap (no grid, just a line chart). This makes it hard to see patterns over a month. |
| 7 | **Search — translation mismatch** | If the user selects "BSB" as their translation, then searches, the backend throws an error (`Search only supported for KJV`) that the UI silently swallows. The user sees "No results" with no explanation. |
| 8 | **Search result navigation** | The 800ms `setTimeout` before scrolling to the verse is a **fragile race condition** — it assumes the chapter fetch will complete in under 800ms. On slow networks this will silently fail to scroll to the verse. |
| 9 | **Manual log form** | The Tags field is still a free-text input. It's unclear to the user that it expects comma-separated values. Also the form has no close button — users must click the "Log Reading" button again to dismiss. |
| 10 | **Mobile — 5 nav items** | Five items in the mobile bottom nav is cramped on small phones. "Settings" may get cut off or overlap on devices < 360px wide. |
| 11 | **IntersectionObserver leak** | `observerRef.current` is never **disconnected** when the chapter changes or the component unmounts. Old verse observers accumulate silently on every chapter load. |
| 12 | **No feedback on auto-log** | The user has no visual indication that their reading is being tracked. No reading progress indicator, no "logged" confirmation. |
| 13 | **History modal fetches all ledger entries** | Opening the verse history modal calls `fetchLedgerEntries(userId)` which fetches *every* ledger entry for the user, then filters client-side. This will get slower as the ledger grows. |

---

## 2. Logic Flow & Data Integrity

### ✅ What Works Well
- **Unique verse counting** using a Set key (`Book-Chapter-Verse`) — accurate deduplication.
- **Contiguous merging** at the backend — avoids micro-entry spam. The boundary math (`max(a.start, b.start) <= min(a.end, b.end) + 1`) is correct.
- **`useRef` for pendingLogVerses** — correctly bypasses React's Strict Mode double-invoke problem.

### ⚠️ Issues & Gaps

| # | Area | Issue |
|---|------|-------|
| 1 | **Streak calculation** | The `recalculateUserStats` function always sets `current_streak = entries.length > 0 ? 1 : 0`. Real streak logic should group entries by calendar date and count consecutive days backwards from today. |
| 2 | **`recalculateUserStats` is called on every insert** | Each `create` call triggers a full table scan of **all confirmed entries** for the user to rebuild stats from scratch. At 1,000+ entries this becomes a noticeable latency hit on every auto-log flush. Consider an incremental update instead. |
| 3 | **`createBulk` counts wrong** | `createBulk` counts every DTO in the loop, even if `create` silently merged it into an existing entry (not a new insert). The `count` return value is misleading. |
| 4 | **No `updated_at` on LedgerEntry** | The Prisma schema for `LedgerEntry` has no `updated_at` column but the merge code sets `updated_at: new Date()`. This will throw a Prisma validation error silently. |
| 5 | **Observer recreated on re-render** | `verseRef` uses `useCallback([], [])` but the observer is lazily created on first call. If the component re-renders before any verse has been observed, the observer reference could be stale. |
| 6 | **`loadChapterData` is not memoised** | It is defined inline and referenced in a `useEffect` dependency array, which creates an ESLint warning and a possible infinite loop risk if the effect ever had `loadChapterData` in its deps. |
| 7 | **Status filter in `recalculateUserStats`** | Stats are computed from entries where `status = 'CONFIRMED'`, but all new entries are also created as `CONFIRMED` by default. The `PENDING` status is never used, making the filter redundant but potentially confusing. |
| 8 | **Highlight page fetches without `chapter` filter** | `fetchHighlights(userId)` (no book filter) is called from the Highlights list page, returning all highlights. Fine for now, but the backend supports filtering that's being ignored. |
| 9 | **No `translation_id` stored on Highlight** | The Highlight model doesn't have a `translation_id` field in the schema, but the highlights list page renders `{highlight.translation_id}`. This will always be `undefined`. |

---

## 3. Code Quality & Architecture

### ✅ What Works Well
- **`api.ts` utility layer** — all backend calls are centralised. Easy to swap or extend.
- **`getApiUrl()` runtime resolution** — elegant way to handle localhost vs 192.x vs production.
- **NestJS module structure** — clean separation: `bible`, `ledger-entries`, `notes`, `highlights`, `stats`.
- **Prisma flattened passage** — denormalising `book/chapter/start_verse/end_verse` directly onto each model (vs. a separate `Passage` table) is a pragmatic and performant choice for this use case.

### ⚠️ Issues & Gaps

| # | Area | Issue |
|---|------|-------|
| 1 | **BOOKS & BOOK_CHAPTER_COUNTS duplicated 3×** | Defined separately in `reader/page.tsx`, `page.tsx` (dashboard), and `client-layout.tsx`. Should be extracted to a single `src/lib/bible-data.ts` constants file. |
| 2 | **`userId = "user-123"` duplicated 4×** | Needs to come from a context/provider (even a mock `AuthContext`) so it's one source of truth. |
| 3 | **All API response types are `any`** | Zero TypeScript type safety on API responses. A `types.ts` file with interfaces for `LedgerEntry`, `Note`, `Highlight`, `UserStats`, `Passage` would enable autocomplete and catch bugs at compile time. |
| 4 | **`reader/page.tsx` is 706 lines** | A single file containing: viewport tracking, reading timer, batch flusher, history modal, note modal, highlight modal, color picker modal, search, and chapter navigation. This should be split into custom hooks and sub-components. |
| 5 | **`console.log("USING API URL:", ...)` in production code** | Dashboard `page.tsx` line 26 logs the API URL on every dashboard load. Should be removed. |
| 6 | **Error handling is inconsistent** | Some errors are silently swallowed (`catch(console.error)`), some show a UI error state, and one uses `alert()`. Needs a unified toast/notification system. |
| 7 | **`loadData()` not memoised** | Dashboard's `loadData` is recreated on every render, and calling it inside a useEffect without stable dependencies works but is fragile. |
| 8 | **`searchBible` falls through silently on BSB** | The backend throws a 400, `api.ts` throws a JS Error, but `handleSearchChange` catches it and just sets results to `[]` with no user-facing message. |
| 9 | **Scratch/migration scripts left in project root** | `read-stats.js` and `recalc-stats.js` are in `bible-ledger-backend/`. These should be deleted or moved to a `scripts/` folder. |
| 10 | **LedgerEntry missing `updated_at`** | As noted in logic section — needs a `updated_at DateTime @updatedAt` field added to the Prisma schema and migrated. |

---

## 4. Prioritised Next Steps

### 🔴 High Priority (Correctness / Stability)

1. **Fix `updated_at` missing on `LedgerEntry`** — Add the field to `schema.prisma`, run `prisma migrate dev`. The current merge code references it and will silently fail.
2. **Fix streak calculation** — Implement real consecutive-day logic in `recalculateUserStats`. This is a core metric being shown on the dashboard as permanently wrong.
3. **Extract `BOOKS`/`BOOK_CHAPTER_COUNTS` to `src/lib/bible-data.ts`** — Immediately eliminates 3× duplication and makes future changes one-place edits.
4. **Fix `IntersectionObserver` leak** — Call `observerRef.current.disconnect()` at the top of `loadChapterData` before creating the new observer, and on component unmount.
5. **Fix BSB search error messaging** — Catch the specific error and show "Bible text search is only available for KJV" rather than a blank result list.

### 🟡 Medium Priority (UX Completeness)

6. **Add Edit/Delete to Notes and Highlights** — These are read-only after creation. Users need CRUD.
7. **Show verse text on the Highlights list page** — Fetch and render the actual verse text so the page is meaningful without clicking through.
8. **Replace the 800ms scroll `setTimeout` with an event-based approach** — Listen for the passage `loading` state to become `false`, then scroll to the target verse. This is reliable regardless of network speed.
9. **Add a `AuthContext` / `UserContext`** — Even a simple mock context that provides `userId` and a `currentUser` object, so hardcoded `"user-123"` can be removed from all components.
10. **Add a toast notification system** — Standardise errors and successes (e.g., "Note saved ✓", "Failed to connect to backend") instead of the mix of silent failures and `alert()` calls.

### 🟢 Lower Priority (Quality / Polish)

11. **Add TypeScript interfaces for all API responses** in `src/types/index.ts`.
12. **Split `reader/page.tsx`** into: `useReadingTracker` hook, `useVerseSelection` hook, `SearchBar` component, `FloatingActionMenu` component, `VerseHistoryModal` component. Target <200 lines per file.
13. **Remove `console.log` statements** from production paths (`page.tsx` API URL log).
14. **Move `read-stats.js` / `recalc-stats.js`** to a `scripts/` directory and add them to `.gitignore` or document them as dev utilities.
15. **Optimise `recalculateUserStats`** — Replace the full-scan rebuild with an incremental update for the newly inserted verse range. Only rebuild fully when needed (e.g., on delete/status change).
16. **Replace activity line chart with a calendar heatmap** — A 52-week GitHub-style grid would be far more meaningful for tracking reading consistency over time.
17. **Add reading goal / progress percentage** — e.g., "You've read 1,856 of 31,102 Bible verses (6%)".
