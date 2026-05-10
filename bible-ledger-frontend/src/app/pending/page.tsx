"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@/contexts/UserContext";
import { USFM_TO_BOOK_NAME } from "@/lib/bible-data";
import {
  fetchPendingEntries,
  fetchLedgerEntries,
  confirmEntry,
  confirmAllPending,
  rejectEntry,
  processSubscriptions,
} from "@/lib/api";
import { CheckCircle2, XCircle, Loader2, BookOpen, RefreshCw, Sparkles, Clock, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

export default function LedgerPage() {
  const { userId } = useUser();
  const [pending, setPending] = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [actionIds, setActionIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingData, allEntries] = await Promise.all([
        fetchPendingEntries(userId),
        fetchLedgerEntries(userId),
      ]);
      setPending(pendingData);
      // Show most recent 10 non-pending entries
      const recentEntries = allEntries
        .filter((e: any) => e.status !== "PENDING")
        .slice(0, 10);
      setConfirmed(recentEntries);
    } catch {
      toast.error("Failed to load ledger entries");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await processSubscriptions(userId);
      const msg = result.created + result.pending > 0
        ? `Synced: ${result.created} confirmed, ${result.pending} pending`
        : "No new entries to sync";
      toast.success(msg);
      await load();
    } catch {
      toast.error("Failed to process subscriptions");
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirm = async (id: string) => {
    setActionIds(prev => new Set(prev).add(id));
    try {
      await confirmEntry(id);
      setPending(prev => prev.filter(e => e.id !== id));
      toast.success("Reading confirmed");
      load(); // refresh confirmed list
    } catch {
      toast.error("Failed to confirm");
    } finally {
      setActionIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleReject = async (id: string) => {
    setActionIds(prev => new Set(prev).add(id));
    try {
      await rejectEntry(id);
      setPending(prev => prev.filter(e => e.id !== id));
      toast.success("Entry removed");
    } catch {
      toast.error("Failed to remove");
    } finally {
      setActionIds(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  };

  const handleConfirmAll = async () => {
    setConfirmingAll(true);
    try {
      await confirmAllPending(userId);
      setPending([]);
      toast.success("All readings confirmed!");
      load();
    } catch {
      toast.error("Failed to confirm all");
    } finally {
      setConfirmingAll(false);
    }
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const formatTime = (d: string) => {
    return new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const getSourceLabel = (entry: any) => {
    const tags: string[] = entry.tags || [];
    // New format: feed:youversion-votd-2026
    const feedTag = tags.find((t: string) => t.startsWith("feed:"));
    if (feedTag) {
      const slug = feedTag.replace("feed:", "");
      if (slug.includes("youversion")) return "VOTD";
      if (slug.includes("daily-bread")) return "ODB";
      // Generic: capitalize slug
      return slug.split("-").slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
    // Legacy format
    if (tags.some((t: string) => t.includes("YOUVERSION_VOTD"))) return "VOTD";
    if (tags.some((t: string) => t.includes("OUR_DAILY_BREAD"))) return "ODB";
    if (entry.source === "API_INTEGRATION") return "Auto";
    return entry.source === "MANUAL" ? "Manual" : entry.source || "Read";
  };

  const getSourceStyle = (entry: any) => {
    const label = getSourceLabel(entry);
    if (label === "VOTD") return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
    if (label === "ODB") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    if (entry.source === "API_INTEGRATION") return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
  };

  const passageLabel = (entry: any) => {
    const p = entry.passage || entry;
    const book = USFM_TO_BOOK_NAME[p.book] || p.book;
    const verseRange = p.start_verse === p.end_verse
      ? `:${p.start_verse}`
      : `:${p.start_verse}-${p.end_verse}`;
    return `${book} ${p.chapter}${verseRange}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-start px-4 sm:px-8 py-12 animate-fade-in">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Ledger</h1>
              <p className="text-slate-500 text-sm">Your reading history and pending confirmations.</p>
            </div>
          </div>
          <button
            onClick={handleProcess}
            disabled={processing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand/10 text-brand font-semibold text-sm hover:bg-brand/20 transition-colors disabled:opacity-50"
          >
            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Sync
          </button>
        </div>

        {/* ── Pending Section ── */}
        {pending.length > 0 && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <h2 className="font-bold text-sm uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Awaiting Confirmation ({pending.length})
                </h2>
              </div>
              <button
                onClick={handleConfirmAll}
                disabled={confirmingAll}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {confirmingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
                Confirm All
              </button>
            </div>

            <div className="space-y-2">
              {pending.map((entry) => (
                <div
                  key={entry.id}
                  className="glass rounded-2xl p-4 border border-amber-200 dark:border-amber-900/30 flex items-center gap-4 bg-amber-50/30 dark:bg-amber-900/5"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/reader?book=${(entry.passage || entry).book}&chapter=${(entry.passage || entry).chapter}`}
                        className="font-bold text-sm hover:text-brand transition-colors"
                      >
                        {passageLabel(entry)}
                      </Link>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSourceStyle(entry)}`}>
                        {getSourceLabel(entry)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {entry.start_time ? formatDate(entry.start_time) : "Today"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleConfirm(entry.id)}
                      disabled={actionIds.has(entry.id)}
                      className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Confirm"
                    >
                      {actionIds.has(entry.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleReject(entry.id)}
                      disabled={actionIds.has(entry.id)}
                      className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 flex items-center justify-center transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200 dark:border-white/10" />
          </>
        )}

        {/* ── Confirmed / Recent Section ── */}
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">
            Recent Readings ({confirmed.length})
          </h2>
        </div>

        {confirmed.length === 0 && pending.length === 0 && (
          <div className="glass rounded-3xl p-10 text-center border border-slate-200 dark:border-white/10">
            <Sparkles className="w-12 h-12 mx-auto text-brand/30 mb-4" />
            <h2 className="text-xl font-bold mb-2">No readings yet</h2>
            <p className="text-slate-400 text-sm">
              Start reading in the{" "}
              <Link href="/reader" className="text-brand hover:underline font-medium">Reader</Link>{" "}
              or subscribe to feeds in{" "}
              <Link href="/settings" className="text-brand hover:underline font-medium">Settings</Link>.
            </p>
          </div>
        )}

        {confirmed.length > 0 && (
          <div className="space-y-2">
            {confirmed.map((entry) => (
              <div
                key={entry.id}
                className="glass rounded-2xl p-4 border border-slate-200 dark:border-white/10 flex items-center gap-4"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/reader?book=${(entry.passage || entry).book}&chapter=${(entry.passage || entry).chapter}`}
                      className="font-bold text-sm hover:text-brand transition-colors"
                    >
                      {passageLabel(entry)}
                    </Link>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getSourceStyle(entry)}`}>
                      {getSourceLabel(entry)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {entry.start_time ? `${formatDate(entry.start_time)} at ${formatTime(entry.start_time)}` : "—"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 pb-8 mt-4">
          Subscribe to daily feeds in <Link href="/settings" className="text-brand hover:underline">Settings</Link> to auto-track readings.
        </p>
      </div>
    </div>
  );
}
