"use client";
import { useUser } from "@/contexts/UserContext";

import { useEffect, useState } from "react";
import { fetchLedgerEntries } from "@/lib/api";
import { History, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { USFM_TO_BOOK_NAME } from "@/lib/bible-data";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useUser();

  useEffect(() => {
    fetchLedgerEntries(userId).then(data => {
      setSessions(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-8 md:p-12 animate-fade-in overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-brand/10 text-brand rounded-xl">
            <History className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight">Reading History</h1>
        </div>

        <div className="glass p-8 rounded-3xl flex flex-col gap-4">
          {sessions.length === 0 && <p className="text-slate-600">No reading sessions found.</p>}
          {sessions.map((session, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 flex flex-col gap-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40 group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-xl">{USFM_TO_BOOK_NAME[session.passage?.book] || session.passage?.book} {session.passage?.chapter}</h3>
                  <p className="text-sm text-slate-500">Verses {session.passage?.start_verse} - {session.passage?.end_verse}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-slate-500 block mb-1">
                    {new Date(session.start_time).toLocaleDateString()}
                  </span>
                  <Link href={`/reader?book=${session.passage?.book}&chapter=${session.passage?.chapter}`} className="text-brand text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 justify-end">
                    Read again <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {session.tags?.map((tag: string) => (
                  <span key={tag} className="text-xs px-2 py-1 rounded bg-brand/10 text-brand font-medium">{tag}</span>
                ))}
                <span className="text-xs text-slate-600 font-bold">{session.translation_id}</span>
                <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{session.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}



