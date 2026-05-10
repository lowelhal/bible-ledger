# Bible Tracker: Issues & Next Steps (Updated)

*After a code-level verification, many of the initially identified issues have already been successfully addressed. Below is the updated roadmap of remaining issues and enhancements.*

## 1. High Priority (Refactoring & Reliability)
These issues affect code maintainability, performance, or edge-case reliability.

*   **Component Refactoring (`reader/page.tsx`)**:
    *   *Issue:* The main reader page remains monolithic (~800 lines) and handles too many responsibilities (viewport tracking, timer, searching, history modal, notes, highlights).
    *   *Action:* Split into smaller, focused custom hooks (e.g., `useReadingTracker`) and sub-components (`FloatingActionMenu`, `SearchBar`, `VerseHistoryModal`) inside the currently empty `reader/components` and `reader/hooks` directories.
*   **Search Error Handling**:
    *   *Issue:* Searching with translations other than KJV silently fails in the UI, returning an empty list without context.
    *   *Action:* Catch the backend 400 error and display a clear user-facing message (e.g., "Search only supported for KJV").
*   **Scroll Race Conditions**:
    *   *Issue:* The 800ms timeout for scrolling to a search result is fragile on slow networks.
    *   *Action:* Replace the `setTimeout` with an event-based approach tied to the chapter `loading` state.

## 2. Medium Priority (UX Completeness)
These items bridge the gap between a prototype and a fully polished user experience.

*   **Toast Notifications**:
    *   *Issue:* Error handling is inconsistent, still relying heavily on browser `alert()` popups across notes, highlights, and dashboard.
    *   *Action:* Introduce a unified toast/notification system (e.g., using `react-hot-toast` or similar) for successes and errors.
*   **Highlight Context**:
    *   *Issue:* The Highlights list page lacks the actual verse text, forcing users to click through to see what they highlighted.
    *   *Action:* Fetch and display verse text on the list view.
*   **Mobile Navigation**:
    *   *Issue:* The bottom navigation bar is cramped on smaller devices with 5 items.
    *   *Action:* Re-evaluate layout or collapse items into a menu for viewports < 360px.

## 3. Lower Priority (Quality & Polish)
These enhancements improve long-term scalability and user satisfaction.

*   **TypeScript Strictness**:
    *   *Issue:* API responses in the frontend (in `api.ts`) still rely heavily on `any` types.
    *   *Action:* Add proper interfaces (`LedgerEntry`, `Note`, `UserStats`, `Passage`) to a shared `src/types` directory to ensure compile-time type safety.
*   **Backend Performance Optimization (`recalculateUserStats`)**:
    *   *Issue:* `recalculateUserStats` triggers a full table scan (`findMany`) of all `CONFIRMED` entries on every verse insert.
    *   *Action:* Refactor to use incremental updates for newly inserted verse ranges rather than full rebuilds to prevent latency as user history grows.
*   **Calendar Heatmap**:
    *   *Issue:* The current 7-day line chart is limited for tracking long-term habits.
    *   *Action:* Upgrade to a full 52-week GitHub-style calendar grid for better long-term trend visualization.
*   **Reading Goals & Progress**:
    *   *Issue:* Users lack a macro-level view of their journey.
    *   *Action:* Implement progress percentages (e.g., "You've read 1,856 of 31,102 verses (6%)").

---
### ✅ Recently Addressed Issues (Verified)
The following issues from previous reviews have already been fixed in the codebase:
- **Fixed:** Missing `updated_at` logic on `LedgerEntry` (removed from backend update).
- **Fixed:** Streak Calculation Logic (now calculates properly based on consecutive dates).
- **Fixed:** Constants Duplication (extracted to `src/lib/bible-data.ts`).
- **Fixed:** CRUD for Notes & Highlights (Edit/Delete functionality added to UI and backend).
- **Fixed:** Authentication Context (extracted hardcoded string to `UserContext.tsx`).
- **Fixed:** IntersectionObserver Leak (disconnect logic implemented in reader).
