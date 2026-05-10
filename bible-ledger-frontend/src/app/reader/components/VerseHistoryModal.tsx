import React from "react";
import { X } from "lucide-react";
import { USFM_TO_BOOK_NAME } from "@/lib/bible-data";

interface VerseHistoryModalProps {
  open: boolean;
  onClose: () => void;
  selectedBook: string;
  selectedChapter: number;
  selectedVerses: Set<number>;
  history: any[];
}

export function VerseHistoryModal({ open, onClose, selectedBook, selectedChapter, selectedVerses, history }: VerseHistoryModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-up max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Reading History</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-6 font-bold">
          {USFM_TO_BOOK_NAME[selectedBook] || selectedBook} {selectedChapter}:{Math.min(...Array.from(selectedVerses))}{selectedVerses.size > 1 ? `-${Math.max(...Array.from(selectedVerses))}` : ''}
        </p>

        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {history.length === 0 ? (
            <p className="text-center text-slate-600 py-8">No recorded reading history for these verses.</p>
          ) : (
            history.map((entry, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold">{USFM_TO_BOOK_NAME[entry.passage.book] || entry.passage.book} {entry.passage.chapter}:{entry.passage.start_verse}-{entry.passage.end_verse}</span>
                  <span className="text-xs text-slate-600 font-medium">
                    {new Date(entry.start_time).toLocaleDateString()} {new Date(entry.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-xs px-2 py-1 bg-white dark:bg-slate-900 rounded font-bold text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-700">{entry.translation_id}</span>
                  {entry.tags?.map((t: string) => (
                    <span key={t} className="text-xs px-2 py-1 bg-brand/10 text-brand rounded font-medium">{t}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="mt-6 w-full py-4 rounded-xl font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
          Close History
        </button>
      </div>
    </div>
  );
}
