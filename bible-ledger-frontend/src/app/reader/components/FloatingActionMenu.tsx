import React from "react";
import { Highlighter, PenTool, History } from "lucide-react";

interface FloatingActionMenuProps {
  selectedCount: number;
  onHighlight: () => void;
  onAddNote: () => void;
  onHistory: () => void;
}

export function FloatingActionMenu({ selectedCount, onHighlight, onAddNote, onHistory }: FloatingActionMenuProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed bottom-24 sm:bottom-12 left-1/2 -translate-x-1/2 px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-2xl shadow-brand/20 border-2 border-brand/50 flex items-center gap-4 sm:gap-6 animate-slide-up bg-white dark:bg-slate-950 z-50 text-slate-900 dark:text-slate-50"
    >
      <span className="font-bold text-sm bg-brand text-white px-3 py-1 rounded-full whitespace-nowrap">
        {selectedCount} selected
      </span>
      <div className="w-px h-6 bg-slate-300 dark:bg-slate-700"></div>
      <button
        onClick={onHighlight}
        className="flex items-center gap-2 font-medium hover:text-brand transition-colors whitespace-nowrap"
      >
        <Highlighter className="w-5 h-5" /> <span className="hidden sm:inline">Highlight</span>
      </button>
      <button
        onClick={onAddNote}
        className="flex items-center gap-2 font-medium hover:text-brand transition-colors whitespace-nowrap"
      >
        <PenTool className="w-5 h-5" /> <span className="hidden sm:inline">Add Note</span>
      </button>
      <button
        onClick={onHistory}
        className="flex items-center gap-2 font-medium hover:text-brand transition-colors whitespace-nowrap"
      >
        <History className="w-5 h-5" /> <span className="hidden sm:inline">History</span>
      </button>
    </div>
  );
}
