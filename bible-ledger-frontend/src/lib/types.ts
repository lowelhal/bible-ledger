// Shared TypeScript interfaces for the BibleLedger frontend

export interface Passage {
  book: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
  verse_ids?: string[];
}

export interface Verse {
  id: string;
  verse_num: number;
  text: string;
}

export interface PassageResponse {
  book: string;
  chapter: number;
  translation_id: string;
  verses: Verse[];
}

export interface Translation {
  id: string;
  name?: string;
  available: boolean;
}

export interface Highlight {
  id: string;
  user_id: string;
  color_hex: string | null;
  tags: string[];
  passage?: Passage;
}

export interface Note {
  id: string;
  user_id: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  passage?: Passage;
}

export interface LedgerEntry {
  id: string;
  user_id: string;
  status: "PENDING" | "CONFIRMED";
  source: string;
  start_time: string | null;
  end_time: string | null;
  translation_id: string | null;
  tags: string[];
  passage?: Passage;
}

export interface UserStats {
  user_id: string;
  total_verses_read: number;
  chapters_read: number;
  current_streak: number;
  longest_streak: number;
  last_read_date: string | null;
  updated_at: string;
}

export interface SearchResult {
  reference: string;
  text: string;
}

export interface CreateHighlightDto {
  user_id: string;
  color_hex: string;
  passage: Passage;
}

export interface CreateNoteDto {
  user_id: string;
  content: string;
  passage: Passage;
}

export interface CreateLedgerEntryDto {
  user_id: string;
  source: string;
  translation_id: string;
  tags: string[];
  passage: Passage;
}
