import React from "react";
import { X, StickyNote } from "lucide-react";
import { USFM_TO_BOOK_NAME } from "@/lib/bible-data";

interface NoteModalProps {
  open: boolean;
  onClose: () => void;
  selectedBook: string;
  selectedChapter: number;
  selectedVerses: Set<number>;
  noteText: string;
  setNoteText: (t: string) => void;
  onSave: () => void;
}

export function NoteModal({ open, onClose, selectedBook, selectedChapter, selectedVerses, noteText, setNoteText, onSave }: NoteModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-up">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Add Note</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-4 font-bold">
          {USFM_TO_BOOK_NAME[selectedBook] || selectedBook} {selectedChapter}:{Math.min(...Array.from(selectedVerses))}
          {selectedVerses.size > 1 ? `-${Math.max(...Array.from(selectedVerses))}` : ''}
        </p>
        <textarea
          autoFocus
          value={noteText}
          onChange={e => setNoteText(e.target.value)}
          className="w-full h-32 p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-brand resize-none mb-6"
          placeholder="What did you learn from this passage?"
        />
        <button onClick={onSave} className="w-full py-3 bg-brand text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors">
          Save Note
        </button>
      </div>
    </div>
  );
}

interface ColorModalProps {
  open: boolean;
  onClose: () => void;
  onHighlight: (color: string) => void;
  colors: string[];
}

export function ColorModal({ open, onClose, onHighlight, colors }: ColorModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scale-up text-center">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Highlight</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex justify-center gap-4 mb-8">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => onHighlight(color)}
              className="w-12 h-12 rounded-full shadow-md hover:scale-110 transition-transform flex items-center justify-center text-black/50"
              style={{ backgroundColor: color }}
            >
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ViewNoteModalProps {
  note: any;
  onClose: () => void;
}

export function ViewNoteModal({ note, onClose }: ViewNoteModalProps) {
  if (!note) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-up">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/10 text-brand rounded-lg">
              <StickyNote className="w-5 h-5" />
            </div>
            <h3 className="text-2xl font-bold">Your Note</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-6 font-bold px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full inline-block">
          {USFM_TO_BOOK_NAME[note.passage.book] || note.passage.book} {note.passage.chapter}:{note.passage.start_verse}
          {note.passage.start_verse !== note.passage.end_verse ? `-${note.passage.end_verse}` : ''}
        </p>
        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 whitespace-pre-wrap text-lg leading-relaxed">
          {note.content}
        </div>
      </div>
    </div>
  );
}
