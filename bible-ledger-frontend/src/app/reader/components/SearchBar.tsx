import React, { useState, useRef, useEffect } from "react";
import { Search, Loader2, X } from "lucide-react";
import { searchBible } from "@/lib/api";

interface SearchBarProps {
  selectedTranslation: string;
  searchSupported: boolean;
  onResultClick: (result: any) => void;
}

export function SearchBar({ selectedTranslation, searchSupported, onResultClick }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim() || !searchSupported) { setSearchResults([]); setSearchLoading(false); setSearchError(null); return; }
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    setSearchLoading(true);
    setSearchError(null);
    searchTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchBible(q, selectedTranslation);
        setSearchResults(results.slice(0, 30));
        setSearchError(null);
      } catch (err: any) {
        setSearchResults([]);
        const msg = err?.message || 'Search failed';
        // Show user-friendly message for common HTTP errors
        if (msg.includes('400')) setSearchError('Invalid search query. Try a different term.');
        else if (msg.includes('500')) setSearchError('Search service is temporarily unavailable.');
        else setSearchError(msg);
      }
      finally { setSearchLoading(false); }
    }, 400);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full lg:w-auto lg:min-w-72">
      <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-all ${searchOpen
          ? 'border-brand/60 bg-white dark:bg-slate-950 shadow-lg shadow-brand/10'
          : 'border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40'
        }`}>
        {searchLoading
          ? <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />}
        <input
          value={searchQuery}
          onFocus={() => setSearchOpen(true)}
          onChange={handleSearchChange}
          placeholder="Search the Bible..."
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-400 min-w-0"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(""); setSearchResults([]); }}
            className="text-slate-400 hover:text-slate-600 transition-colors shrink-0">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {searchOpen && searchQuery && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl max-h-80 overflow-y-auto z-50">
          {!searchSupported ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-semibold text-amber-500 mb-1">Search not available for {selectedTranslation}</p>
              <p className="text-xs text-slate-400">Full-text search is supported for KJV (local). Switch your translation to search.</p>
            </div>
          ) : searchLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-brand" />
            </div>
          ) : searchError ? (
            <div className="px-4 py-5 text-center">
              <p className="text-sm font-semibold text-red-500 mb-1">Search Error</p>
              <p className="text-xs text-slate-400">{searchError}</p>
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-center text-slate-400 text-sm py-6">No results found</p>
          ) : (
            <>
              {searchResults.map((result, i) => (
                <button key={i} onClick={() => { onResultClick(result); setSearchQuery(""); setSearchResults([]); setSearchOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-white/5 last:border-0"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-brand">{result.reference}</span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 line-clamp-2 leading-snug">{result.text}</p>
                </button>
              ))}
              {searchResults.length >= 30 && (
                <p className="text-center text-xs text-slate-400 py-2">Showing top 30 results — refine your search</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
