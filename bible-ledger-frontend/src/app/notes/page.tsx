"use client";
import { useUser } from "@/contexts/UserContext";

import { useEffect, useState } from "react";
import { fetchNotes, updateNote, deleteNote } from "@/lib/api";
import { Loader2, Bookmark, Calendar, ArrowRight, Pencil, Trash2, Check, X } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { userId } = useUser();

  const load = () => {
    setLoading(true);
    fetchNotes(userId)
      .then(data => setNotes(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const startEdit = (note: any) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEdit = () => { setEditingId(null); setEditContent(""); };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const updated = await updateNote(id, { content: editContent });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, content: updated.content } : n));
      setEditingId(null);
      toast.success("Note saved");
    } catch { toast.error("Failed to save note."); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    setDeletingId(id);
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Note deleted");
    } catch { toast.error("Failed to delete note."); }
    finally { setDeletingId(null); }
  };

  return (
    <div className="flex-1 p-8 md:p-12 animate-fade-in overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-brand/10 text-brand rounded-2xl">
            <Bookmark className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight">Your Notes</h1>
            <p className="text-slate-600">Insights and reflections from your reading journey.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-red-500/10 text-red-500">{error}</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-20 bg-white/60 dark:bg-slate-950/40 rounded-3xl border border-slate-200 dark:border-white/10">
            <p className="text-lg text-slate-600 mb-4">You haven&apos;t written any notes yet.</p>
            <Link href="/reader" className="inline-flex items-center gap-2 px-6 py-3 bg-brand text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors">
              Start Reading <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
            {notes.map(note => (
              <div key={note.id} className="break-inside-avoid glass p-5 rounded-2xl border border-slate-200 dark:border-white/10 flex flex-col gap-3">

                {/* Reference + date */}
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/reader?book=${encodeURIComponent(note.passage.book)}&chapter=${note.passage.chapter}`}
                    className="flex flex-col hover:text-brand transition-colors">
                    <span className="font-bold text-base">
                      {note.passage.book} {note.passage.chapter}:{note.passage.start_verse}
                      {note.passage.start_verse !== note.passage.end_verse ? `–${note.passage.end_verse}` : ''}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" /> {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </Link>
                </div>

                {/* Content — edit mode or read mode */}
                {editingId === note.id ? (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={editContent}
                      onChange={e => setEditContent(e.target.value)}
                      rows={5}
                      className="w-full px-3 py-2 rounded-xl border border-brand/40 bg-white/80 dark:bg-slate-950/60 outline-none focus:ring-2 focus:ring-brand text-sm resize-none"
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={cancelEdit}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                        <X className="w-3 h-3" /> Cancel
                      </button>
                      <button onClick={() => saveEdit(note.id)} disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-brand text-white hover:bg-indigo-600 transition-colors disabled:opacity-50">
                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{note.content}</p>
                )}

                {/* Tags */}
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {note.tags.map((tag: string) => (
                      <span key={tag} className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-900/50 text-slate-600 font-medium">{tag}</span>
                    ))}
                  </div>
                )}

                {/* Action row — always visible, works on mobile & desktop */}
                {editingId !== note.id && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                    <button onClick={() => startEdit(note)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-brand/10 hover:text-brand transition-colors">
                      <Pencil className="w-3 h-3" /> Edit
                    </button>
                    <button onClick={() => handleDelete(note.id)} disabled={deletingId === note.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors disabled:opacity-50 ml-auto">
                      {deletingId === note.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                      {deletingId === note.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}



