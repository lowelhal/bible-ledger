"use client";
import { useUser } from "@/contexts/UserContext";

import { useEffect, useState } from "react";
import { fetchHighlights, deleteHighlight, fetchPassage } from "@/lib/api";
import { Loader2, Highlighter, ArrowRight, Trash2 } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function HighlightsPage() {
  const [highlights, setHighlights] = useState<any[]>([]);
  const [verseTexts, setVerseTexts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { userId } = useUser();

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchHighlights(userId);
      setHighlights(data);
      // Fetch verse text for each unique book+chapter combination
      const seen = new Set<string>();
      const texts: Record<string, string> = {};
      await Promise.all(
        data.map(async (hl: any) => {
          const key = `${hl.passage?.book}-${hl.passage?.chapter}`;
          if (seen.has(key) || !hl.passage) return;
          seen.add(key);
          try {
            const passage = await fetchPassage('KJV', hl.passage.book, hl.passage.chapter);
            passage.verses?.forEach((v: any) => {
              texts[`${hl.passage.book}-${hl.passage.chapter}-${v.verse_num}`] = v.text;
            });
          } catch { /* ignore */ }
        })
      );
      setVerseTexts(texts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this highlight?")) return;
    setDeletingId(id);
    try {
      await deleteHighlight(id);
      setHighlights(prev => prev.filter(h => h.id !== id));
      toast.success("Highlight deleted");
    } catch { toast.error("Failed to delete highlight."); }
    finally { setDeletingId(null); }
  };

  const getVerseText = (hl: any): string => {
    if (!hl.passage) return "";
    const verses: string[] = [];
    for (let v = hl.passage.start_verse; v <= hl.passage.end_verse; v++) {
      const t = verseTexts[`${hl.passage.book}-${hl.passage.chapter}-${v}`];
      if (t) verses.push(`${v} ${t}`);
    }
    return verses.join(" ") || "";
  };

  return (
    <div className="flex-1 p-8 md:p-12 animate-fade-in overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <Highlighter className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Your Highlights</h1>
            <p className="text-slate-600">Verses that stood out to you.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-red-500/10 text-red-500">{error}</div>
        ) : highlights.length === 0 ? (
          <div className="text-center py-20 bg-white/60 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-white/10">
            <p className="text-lg text-slate-600 mb-4">You haven&apos;t highlighted any verses yet.</p>
            <Link href="/reader" className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
              Start Reading <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map(hl => {
              const verseText = getVerseText(hl);
              return (
                <div key={hl.id}
                  className="glass border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden flex flex-col group relative"
                  style={{ borderLeftColor: hl.color_hex || undefined, borderLeftWidth: hl.color_hex ? 4 : undefined }}
                >
                  {/* Colour tint background */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: hl.color_hex }} />

                  <div className="relative z-10 p-5 flex flex-col gap-3 flex-1">
                    {/* Reference + delete */}
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/reader?book=${encodeURIComponent(hl.passage?.book)}&chapter=${hl.passage?.chapter}`}
                        className="group/ref flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center shadow"
                          style={{ backgroundColor: hl.color_hex || '#a78bfa' }}>
                          <Highlighter className="w-4 h-4 text-white/80" />
                        </div>
                        <span className="font-extrabold text-base group-hover/ref:text-brand transition-colors">
                          {hl.passage?.book} {hl.passage?.chapter}:{hl.passage?.start_verse}
                          {hl.passage?.start_verse !== hl.passage?.end_verse ? `–${hl.passage?.end_verse}` : ''}
                        </span>
                      </Link>
                      <button onClick={() => handleDelete(hl.id)} disabled={deletingId === hl.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 shrink-0 disabled:opacity-50">
                        {deletingId === hl.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Verse text — Fix #8 */}
                    {verseText ? (
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic line-clamp-4">
                        &ldquo;{verseText}&rdquo;
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Loading verse text…</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}



