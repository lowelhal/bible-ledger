import type {
  Translation,
  PassageResponse,
  SearchResult,
  Highlight,
  Note,
  LedgerEntry,
  UserStats,
  CreateHighlightDto,
  CreateNoteDto,
  CreateLedgerEntryDto,
} from "./types";

export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000/v1`;
  }
  return 'http://127.0.0.1:3000/v1';
};

export async function fetchTranslations(): Promise<Translation[]> {
  const res = await fetch(`${getApiUrl()}/bible/translations`);
  if (!res.ok) throw new Error(`Failed to fetch translations (Status: ${res.status})`);
  return res.json();
}

export async function fetchPassage(translation: string, book: string, chapter: number): Promise<PassageResponse> {
  const res = await fetch(`${getApiUrl()}/bible/${translation}/passage?book=${book}&chapter=${chapter}`);
  if (!res.ok) throw new Error(`Failed to fetch passage (Status: ${res.status})`);
  return res.json();
}

export async function searchBible(query: string, translationId = 'KJV'): Promise<SearchResult[]> {
  const res = await fetch(`${getApiUrl()}/bible/search?q=${encodeURIComponent(query)}&translation_id=${translationId}`);
  if (!res.ok) throw new Error(`Bible search failed (Status: ${res.status})`);
  return res.json();
}

export async function fetchHighlights(userId: string, book?: string): Promise<Highlight[]> {
  const url = new URL(`${getApiUrl()}/highlights`);
  url.searchParams.append('user_id', userId);
  if (book) url.searchParams.append('book', book);
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch highlights`);
  return res.json();
}

export async function createHighlight(data: CreateHighlightDto): Promise<Highlight> {
  const res = await fetch(`${getApiUrl()}/highlights`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create highlight`);
  return res.json();
}

export async function createNote(data: CreateNoteDto): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create note`);
  return res.json();
}

export async function fetchStats(userId: string): Promise<UserStats> {
  const res = await fetch(`${getApiUrl()}/stats/summary?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch stats`);
  return res.json();
}

export async function fetchLedgerEntries(userId: string, opts?: { book?: string; chapter?: number }): Promise<LedgerEntry[]> {
  const url = new URL(`${getApiUrl()}/ledger-entries`);
  url.searchParams.append('user_id', userId);
  if (opts?.book)    url.searchParams.append('book', opts.book);
  if (opts?.chapter) url.searchParams.append('chapter', String(opts.chapter));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch ledger entries`);
  return res.json();
}

export async function createLedgerEntry(data: CreateLedgerEntryDto): Promise<LedgerEntry> {
  const res = await fetch(`${getApiUrl()}/ledger-entries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create ledger entry`);
  return res.json();
}

export async function createLedgerEntriesBulk(data: CreateLedgerEntryDto[]): Promise<LedgerEntry[]> {
  const res = await fetch(`${getApiUrl()}/ledger-entries/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to create ledger entries in bulk`);
  return res.json();
}

export async function fetchNotes(userId: string): Promise<Note[]> {
  const res = await fetch(`${getApiUrl()}/notes?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch notes`);
  return res.json();
}

export async function updateNote(id: string, data: { content?: string; tags?: string[] }): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error(`Failed to update note`);
  return res.json();
}

export async function deleteNote(id: string): Promise<Note> {
  const res = await fetch(`${getApiUrl()}/notes/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete note`);
  return res.json();
}

export async function deleteHighlight(id: string): Promise<Highlight> {
  const res = await fetch(`${getApiUrl()}/highlights/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete highlight`);
  return res.json();
}

// ─── Feeds & Subscriptions ─────────────────────────────────────────────

export async function fetchAvailableFeeds() {
  const res = await fetch(`${getApiUrl()}/subscriptions/feeds`);
  if (!res.ok) throw new Error(`Failed to fetch feeds`);
  return res.json();
}

export async function fetchUserSubscriptions(userId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch subscriptions`);
  return res.json();
}

export async function toggleSubscription(userId: string, feedId: string, enabled: boolean) {
  const res = await fetch(`${getApiUrl()}/subscriptions/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, feed_id: feedId, enabled }),
  });
  if (!res.ok) throw new Error(`Failed to toggle subscription`);
  return res.json();
}

export async function processSubscriptions(userId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error(`Failed to process subscriptions`);
  return res.json();
}

// ─── Pending Entries ───────────────────────────────────────────────────

export async function fetchPendingEntries(userId: string): Promise<LedgerEntry[]> {
  const res = await fetch(`${getApiUrl()}/subscriptions/pending?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch pending entries`);
  return res.json();
}

export async function confirmEntry(entryId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions/confirm/${entryId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`Failed to confirm entry`);
  return res.json();
}

export async function confirmAllPending(userId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions/confirm-all`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error(`Failed to confirm all entries`);
  return res.json();
}

export async function rejectEntry(entryId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions/pending/${entryId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to reject entry`);
  return res.json();
}

// ─── User Settings ─────────────────────────────────────────────────────

export async function fetchUserSettings(userId: string) {
  const res = await fetch(`${getApiUrl()}/subscriptions/settings?user_id=${userId}`);
  if (!res.ok) throw new Error(`Failed to fetch settings`);
  return res.json();
}

export async function updateUserSettings(userId: string, data: {
  auto_confirm_readings?: boolean;
  auto_confirm_subscriptions?: boolean;
}) {
  const res = await fetch(`${getApiUrl()}/subscriptions/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, ...data }),
  });
  if (!res.ok) throw new Error(`Failed to update settings`);
  return res.json();
}
