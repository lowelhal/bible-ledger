"use client";
import { useUser } from "@/contexts/UserContext";

import { useState, useEffect, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { fetchTranslations, fetchPassage, createHighlight, createNote, fetchHighlights, fetchNotes, fetchLedgerEntries } from "@/lib/api";
import { ChevronLeft, ChevronRight, Loader2, StickyNote } from "lucide-react";
import toast from "react-hot-toast";
import { BOOKS, BOOK_CHAPTER_COUNTS, SEARCH_SUPPORTED_TRANSLATIONS, USFM_TO_BOOK_NAME } from "@/lib/bible-data";

import { useReadingTracker } from "./hooks/useReadingTracker";
import { SearchBar } from "./components/SearchBar";
import { FloatingActionMenu } from "./components/FloatingActionMenu";
import { VerseHistoryModal } from "./components/VerseHistoryModal";
import { NoteModal, ColorModal, ViewNoteModal } from "./components/Modals";

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"];

function ReaderContent() {
  const searchParams = useSearchParams();
  const initBookParam = searchParams.get('book');
  const initChapterParam = searchParams.get('chapter');

  const [translations, setTranslations] = useState<any[]>([]);
  const [selectedTranslation, setSelectedTranslation] = useState("KJV");
  const [selectedBook, setSelectedBook] = useState(initBookParam || "JHN");
  const [selectedChapter, setSelectedChapter] = useState(initChapterParam ? Number(initChapterParam) : 3);

  const [passage, setPassage] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadRequestIdRef = useRef(0);

  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());

  // Modals
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [viewNoteModal, setViewNoteModal] = useState<any>(null);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [verseHistory, setVerseHistory] = useState<any[]>([]);

  const { userId } = useUser();

  // Auto-load last read passage
  useEffect(() => {
    fetchTranslations().then(data => {
      const available = data.filter((t: any) => t.available);
      setTranslations(available);
    }).catch(console.error);

    if (!initBookParam && !initChapterParam) {
      fetchLedgerEntries(userId).then(entries => {
        if (entries && entries.length > 0) {
          const last = entries[0];
          if (last.passage) {
            setSelectedBook(last.passage.book);
            setSelectedChapter(last.passage.chapter);
          }
        }
      }).catch(console.error);
    }
  }, [initBookParam, initChapterParam]);

  const { verseRef, readVerses, forceLogVerses, resetTracker } = useReadingTracker({
    userId,
    selectedBook,
    selectedChapter,
    selectedTranslation,
    loading
  });

  const loadChapterData = async () => {
    const requestId = ++loadRequestIdRef.current;
    setLoading(true);
    setError(null);
    setPassage(null);
    setSelectedVerses(new Set());
    resetTracker();

    try {
      const [passageData, allHighlights, allNotes] = await Promise.all([
        fetchPassage(selectedTranslation, selectedBook, selectedChapter),
        fetchHighlights(userId, selectedBook),
        fetchNotes(userId)
      ]);

      // Discard result if a newer request has been issued
      if (requestId !== loadRequestIdRef.current) return;

      setPassage(passageData);
      setHighlights(allHighlights.filter((h: any) => h.passage?.chapter === selectedChapter));
      setNotes(allNotes.filter((n: any) => n.passage?.book === selectedBook && n.passage?.chapter === selectedChapter));
    } catch (err: any) {
      if (requestId !== loadRequestIdRef.current) return;
      setError(err.message);
    } finally {
      if (requestId === loadRequestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadChapterData();
  }, [selectedTranslation, selectedBook, selectedChapter]);

  const openHistoryModal = async () => {
    setHistoryModalOpen(true);
    try {
      const chapterEntries = await fetchLedgerEntries(userId, {
        book: selectedBook,
        chapter: selectedChapter
      });
      const selectedArr = Array.from(selectedVerses);
      const minSelected = Math.min(...selectedArr);
      const maxSelected = Math.max(...selectedArr);

      const overlaps = chapterEntries.filter((entry: any) => {
        if (!entry.passage) return false;
        return Math.max(entry.passage.start_verse, minSelected) <= Math.min(entry.passage.end_verse, maxSelected);
      });
      setVerseHistory(overlaps);
    } catch (e) {
      console.error(e);
    }
  };

  const handleNextChapter = () => {
    const maxChapter = BOOK_CHAPTER_COUNTS[selectedBook] || 1;
    if (selectedChapter < maxChapter) {
      setSelectedChapter(prev => prev + 1);
    } else {
      const bookIdx = BOOKS.indexOf(selectedBook);
      if (bookIdx < BOOKS.length - 1) {
        setSelectedBook(BOOKS[bookIdx + 1]);
        setSelectedChapter(1);
      }
    }
  };

  const handlePrevChapter = () => {
    if (selectedChapter > 1) {
      setSelectedChapter(prev => prev - 1);
    } else {
      const bookIdx = BOOKS.indexOf(selectedBook);
      if (bookIdx > 0) {
        const prevBook = BOOKS[bookIdx - 1];
        setSelectedBook(prevBook);
        setSelectedChapter(BOOK_CHAPTER_COUNTS[prevBook] || 1);
      }
    }
  };

  const isFirstPassage = selectedBook === BOOKS[0] && selectedChapter === 1;
  const isLastPassage = selectedBook === BOOKS[BOOKS.length - 1] &&
    selectedChapter >= (BOOK_CHAPTER_COUNTS[selectedBook] || 1);

  const searchSupported = SEARCH_SUPPORTED_TRANSLATIONS.has(selectedTranslation);
  const searchTargetVerse = useRef<string | null>(null);

  const handleSearchResultClick = (result: any) => {
    const match = result.reference.match(/^(.+?)\s+(\d+):(\d+)$/);
    if (match) {
      searchTargetVerse.current = match[3];
      setSelectedBook(match[1]);
      setSelectedChapter(Number(match[2]));
    }
  };

  useEffect(() => {
    if (loading || !searchTargetVerse.current) return;
    const verseNum = searchTargetVerse.current;
    searchTargetVerse.current = null;
    const el = document.querySelector(`[data-verse="${verseNum}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-brand', '!bg-brand/20');
      setTimeout(() => el.classList.remove('ring-4', 'ring-brand', '!bg-brand/20'), 3000);
    }
  }, [loading]);

  const toggleVerseSelection = (verseNum: number) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      if (next.has(verseNum)) next.delete(verseNum);
      else next.add(verseNum);
      return next;
    });
  };

  const handleHighlight = async (color: string) => {
    if (selectedVerses.size === 0) return;
    try {
      forceLogVerses(selectedVerses);
      await createHighlight({
        user_id: userId,
        color_hex: color,
        passage: {
          book: selectedBook,
          chapter: selectedChapter,
          start_verse: Math.min(...Array.from(selectedVerses)),
          end_verse: Math.max(...Array.from(selectedVerses))
        }
      });
      setColorModalOpen(false);
      setSelectedVerses(new Set());
      const allHighlights = await fetchHighlights(userId);
      setHighlights(allHighlights.filter((h: any) => h.passage?.chapter === selectedChapter));
      toast.success("Highlight saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save highlight");
    }
  };

  const handleAddNote = async () => {
    if (!noteText.trim()) return;
    try {
      forceLogVerses(selectedVerses);
      await createNote({
        user_id: userId,
        content: noteText,
        passage: {
          book: selectedBook,
          chapter: selectedChapter,
          start_verse: Math.min(...Array.from(selectedVerses)),
          end_verse: Math.max(...Array.from(selectedVerses))
        }
      });
      setNoteModalOpen(false);
      setNoteText("");
      setSelectedVerses(new Set());
      const allNotes = await fetchNotes(userId);
      setNotes(allNotes.filter((n: any) => n.passage?.book === selectedBook && n.passage?.chapter === selectedChapter));
      toast.success("Note saved");
    } catch (err: any) {
      toast.error(err.message || "Failed to save note");
    }
  };

  const getHighlightColor = (verseNum: number) => {
    const highlight = highlights.find(h => verseNum >= h.passage?.start_verse && verseNum <= h.passage?.end_verse);
    return highlight ? `${highlight.color_hex}40` : undefined;
  };

  const getVerseNote = (verseNum: number) => {
    return notes.find(n => verseNum >= n.passage?.start_verse && verseNum <= n.passage?.end_verse);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-fade-in relative">
      <div className="glass px-4 sm:px-8 py-4 flex flex-wrap gap-4 items-center justify-between z-10 shrink-0 border-b border-slate-200 dark:border-white/10">
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <select
            value={selectedTranslation}
            onChange={e => setSelectedTranslation(e.target.value)}
            className="bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-brand outline-none cursor-pointer flex-1 sm:flex-none text-sm sm:text-base"
          >
            {translations.map(t => (
              <option key={t.id} value={t.id}>{t.id}</option>
            ))}
          </select>

          <select
            value={selectedBook}
            onChange={e => { setSelectedBook(e.target.value); setSelectedChapter(1); }}
            className="bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 font-bold focus:ring-2 focus:ring-brand outline-none cursor-pointer flex-1 sm:flex-none text-sm sm:text-base"
          >
            {BOOKS.map(b => (
              <option key={b} value={b}>{USFM_TO_BOOK_NAME[b]}</option>
            ))}
          </select>

          <div className="flex items-center bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden w-full sm:w-auto justify-between sm:justify-start">
            <button onClick={handlePrevChapter} disabled={isFirstPassage} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/40 disabled:opacity-50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="border-x border-slate-200 dark:border-white/10 flex items-center flex-1 sm:flex-none justify-center">
              <select
                value={selectedChapter}
                onChange={e => setSelectedChapter(Number(e.target.value))}
                className="bg-transparent px-2 sm:px-4 py-2 font-bold text-center appearance-none focus:outline-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors text-sm sm:text-base"
              >
                {Array.from({ length: BOOK_CHAPTER_COUNTS[selectedBook] || 150 }, (_, i) => i + 1).map(c => (
                  <option key={c} value={c} className="text-left dark:bg-slate-950">Ch. {c}</option>
                ))}
              </select>
            </div>
            <button onClick={handleNextChapter} disabled={isLastPassage} className="px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors disabled:opacity-50">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <SearchBar 
          selectedTranslation={selectedTranslation} 
          searchSupported={searchSupported} 
          onResultClick={handleSearchResultClick} 
        />
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 md:px-8 py-12 scroll-smooth pb-40"
        onClick={() => setSelectedVerses(new Set())}
      >
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-brand">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p className="font-medium animate-pulse">Fetching the Word...</p>
            </div>
          ) : error ? (
            <div className="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
              <p className="text-red-500 font-bold text-lg mb-2">Could not load passage</p>
              <p className="text-slate-600">{error}</p>
            </div>
          ) : passage ? (
            <div className="space-y-6">
              <h1 className="text-5xl font-extrabold tracking-tight mb-12 text-center font-serif">
                {USFM_TO_BOOK_NAME[passage.book] || passage.book} {passage.chapter}
              </h1>

              <div className="text-lg md:text-xl leading-relaxed md:leading-loose space-y-2 font-serif text-slate-900 dark:text-slate-100 pb-32">
                {passage.verses.map((verse: any) => {
                  const isSelected = selectedVerses.has(verse.verse_num);
                  const highlightColor = getHighlightColor(verse.verse_num);
                  const note = getVerseNote(verse.verse_num);

                  return (
                    <span key={verse.id} className="inline">
                      {note && note.passage?.start_verse === verse.verse_num && (
                        <button onClick={() => setViewNoteModal(note)} className="inline-flex items-center justify-center w-5 h-5 bg-brand text-white rounded-full mx-1 cursor-pointer hover:scale-110 transition-transform relative -top-1">
                          <StickyNote className="w-3 h-3" />
                        </button>
                      )}
                      <span
                        ref={(el) => verseRef(el, verse.verse_num)}
                        data-verse={verse.verse_num}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVerseSelection(verse.verse_num);
                        }}
                        style={{ backgroundColor: highlightColor }}
                        className={`inline mr-2 p-1 rounded transition-colors cursor-pointer ${note ? 'border-b-2 border-dashed border-brand/50 hover:border-brand' : ''} ${isSelected
                            ? 'bg-brand/30 text-brand dark:text-indigo-400 font-medium ring-2 ring-brand ring-inset'
                            : 'hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                      >
                        <sup className="text-xs font-bold text-slate-400 mr-1 select-none">{verse.verse_num}</sup>
                        {verse.text}
                      </span>
                    </span>
                  );
                })}
              </div>

              {passage?.verses?.length > 0 && (
                <div className="pt-6 pb-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                    <span>Reading progress</span>
                    <span className="font-bold text-brand">
                      {readVerses.size} / {passage.verses.length} verses
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-900/60 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-indigo-400 transition-all duration-500"
                      style={{ width: `${Math.round((readVerses.size / passage.verses.length) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex justify-between items-center pb-20">
                <button
                  onClick={handlePrevChapter}
                  disabled={isFirstPassage}
                  className="flex flex-col items-start gap-0.5 px-4 sm:px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 disabled:opacity-30 transition-colors font-bold text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">Prev</span>
                  </span>
                  {selectedChapter === 1 && BOOKS.indexOf(selectedBook) > 0 && (
                    <span className="text-xs font-normal text-slate-400 pl-6 sm:pl-0">
                      {USFM_TO_BOOK_NAME[BOOKS[BOOKS.indexOf(selectedBook) - 1]]}
                    </span>
                  )}
                </button>
                <button
                  onClick={handleNextChapter}
                  disabled={isLastPassage}
                  className="flex flex-col items-end gap-0.5 px-4 sm:px-6 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900/40 disabled:opacity-30 transition-colors font-bold text-brand text-sm sm:text-base cursor-pointer disabled:cursor-not-allowed"
                >
                  <span className="flex items-center gap-1">
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">Next</span>
                    <ChevronRight className="w-5 h-5" />
                  </span>
                  {selectedChapter >= (BOOK_CHAPTER_COUNTS[selectedBook] || 1) && BOOKS.indexOf(selectedBook) < BOOKS.length - 1 && (
                    <span className="text-xs font-normal text-slate-400">
                      {USFM_TO_BOOK_NAME[BOOKS[BOOKS.indexOf(selectedBook) + 1]]}
                    </span>
                  )}
                </button>
              </div>

            </div>
          ) : null}
        </div>
      </div>

      {!noteModalOpen && !colorModalOpen && (
        <FloatingActionMenu 
          selectedCount={selectedVerses.size}
          onHighlight={() => setColorModalOpen(true)}
          onAddNote={() => setNoteModalOpen(true)}
          onHistory={openHistoryModal}
        />
      )}

      <NoteModal 
        open={noteModalOpen} 
        onClose={() => setNoteModalOpen(false)} 
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        selectedVerses={selectedVerses}
        noteText={noteText}
        setNoteText={setNoteText}
        onSave={handleAddNote}
      />

      <ColorModal 
        open={colorModalOpen} 
        onClose={() => setColorModalOpen(false)} 
        onHighlight={handleHighlight} 
        colors={COLORS} 
      />

      <ViewNoteModal 
        note={viewNoteModal} 
        onClose={() => setViewNoteModal(null)} 
      />

      <VerseHistoryModal 
        open={historyModalOpen} 
        onClose={() => setHistoryModalOpen(false)} 
        selectedBook={selectedBook}
        selectedChapter={selectedChapter}
        selectedVerses={selectedVerses}
        history={verseHistory}
      />
    </div>
  );
}

export default function Reader() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>}>
      <ReaderContent />
    </Suspense>
  );
}



