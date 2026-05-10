"use client";
import { useUser } from "@/contexts/UserContext";

import { useEffect, useState } from "react";
import { fetchTranslations, fetchStats, fetchLedgerEntries, fetchNotes, fetchHighlights, createLedgerEntry, getApiUrl, fetchPassage, processSubscriptions, fetchPendingEntries } from "@/lib/api";
import { BookOpen, LineChart, Target, Flame, ArrowRight, History, Plus, Loader2, ScrollText } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import toast from "react-hot-toast";
import { BOOKS, BOOK_CHAPTER_COUNTS, USFM_TO_BOOK_NAME } from "@/lib/bible-data";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [counts, setCounts] = useState({ notes: 0, highlights: 0 });
  const [translations, setTranslations] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]); // kept for month/year view
  const [activityView, setActivityView] = useState<'week' | 'month' | 'year'>('week');
  const [pendingCount, setPendingCount] = useState(0);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [form, setForm] = useState({ book: "GEN", chapter: 1, start_verse: 1, end_verse: 1, translation: "KJV", tags: "Manual" });
  const [verseCount, setVerseCount] = useState(31); // Genesis 1 has 31 verses
  const [verseCountLoading, setVerseCountLoading] = useState(false);

  const { userId } = useUser();

  const loadData = async () => {
    setLoading(true);
    try {
      const [st, entries, nots, highs, trans] = await Promise.all([
        fetchStats(userId),
        fetchLedgerEntries(userId),
        fetchNotes(userId),
        fetchHighlights(userId),
        fetchTranslations()
      ]);
      // Silently sync subscriptions and count pending entries
      processSubscriptions(userId).catch(() => {});
      fetchPendingEntries(userId).then(p => setPendingCount(p.length)).catch(() => {});
      // Calculate activity data for the last 7 days
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const today = new Date();
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        return {
          dateStr: d.toDateString(),
          dayName: days[d.getDay()],
          verses: 0
        };
      });

      entries.forEach((entry: any) => {
        if (!entry.start_time) return;
        const entryDate = new Date(entry.start_time).toDateString();
        const dayMatch = last7Days.find(d => d.dateStr === entryDate);
        if (dayMatch && entry.passage) {
          dayMatch.verses += (entry.passage.end_verse - entry.passage.start_verse + 1);
        }
      });

      setActivityData(last7Days.map(d => ({ date: d.dayName, verses: d.verses })));
      setAllEntries(entries);

      setStats(st);
      setSessions(entries.slice(0, 4));
      setCounts({ notes: nots.length || 0, highlights: highs.length || 0 });
      setTranslations(trans);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Fetch verse count when book/chapter/translation change
  useEffect(() => {
    if (!showForm) return;
    setVerseCountLoading(true);
    fetchPassage(form.translation, form.book, form.chapter)
      .then(data => {
        const count = data.verses?.length || 1;
        setVerseCount(count);
        setForm(prev => ({ ...prev, start_verse: 1, end_verse: count }));
      })
      .catch(() => setVerseCount(176)) // fallback
      .finally(() => setVerseCountLoading(false));
  }, [form.book, form.chapter, form.translation, showForm]);

  const handleBookChange = (book: string) => {
    setForm(prev => ({ ...prev, book, chapter: 1, start_verse: 1, end_verse: 1 }));
  };

  const handleChapterChange = (chapter: number) => {
    setForm(prev => ({ ...prev, chapter, start_verse: 1, end_verse: 1 }));
  };

  const handleManualEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await createLedgerEntry({
        user_id: userId,
        source: "USER_WEB",
        translation_id: form.translation,
        tags: form.tags.split(",").map(t => t.trim()),
        passage: {
          book: form.book,
          chapter: Number(form.chapter),
          start_verse: Number(form.start_verse),
          end_verse: Number(form.end_verse)
        }
      });
      setShowForm(false);
      loadData(); // refresh dashboard
      toast.success("Reading logged successfully");
    } catch (err) {
      toast.error("Failed to log reading.");
    } finally {
      setFormLoading(false);
    }
  };

  if (loading) {
    return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;
  }

  return (
    <div className="flex-1 p-4 sm:p-8 md:p-12 animate-fade-in overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-extrabold tracking-tight">Welcome Back.</h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              You're currently on a <span className="text-orange-500 font-bold">{stats?.current_streak || 0}-day</span> reading streak. Keep it up!
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-brand text-white px-6 py-3 rounded-full font-bold hover:shadow-lg hover:shadow-brand/30 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" /> Log Reading
          </button>
        </div>

        {/* Pending Readings Banner */}
        {pendingCount > 0 && (
          <Link
            href="/pending"
            className="flex items-center justify-between glass rounded-2xl p-4 border border-amber-300 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-900/10 hover:border-amber-400 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <ScrollText className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <span className="font-bold text-sm text-amber-700 dark:text-amber-400">{pendingCount} pending reading{pendingCount !== 1 ? "s" : ""}</span>
                <p className="text-xs text-slate-500">Tap to review and confirm</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}

        {/* Manual Entry Form */}
        {showForm && (
          <div className="glass p-8 rounded-3xl animate-slide-up border border-brand/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Manually Log a Reading</h2>
              <button onClick={() => setShowForm(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                aria-label="Close form">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleManualEntry} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">

              {/* Translation */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Translation</label>
                <select value={form.translation} onChange={e => setForm({ ...form, translation: e.target.value })}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand cursor-pointer">
                  {translations.filter((t: any) => t.available).map((t: any) => (
                    <option key={t.id} value={t.id}>{t.id}</option>
                  ))}
                </select>
              </div>

              {/* Book */}
              <div className="lg:col-span-2 flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Book</label>
                <select required value={form.book} onChange={e => handleBookChange(e.target.value)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand cursor-pointer">
                  {BOOKS.map(b => <option key={b} value={b}>{USFM_TO_BOOK_NAME[b]}</option>)}
                </select>
              </div>

              {/* Chapter */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Chapter</label>
                <select required value={form.chapter} onChange={e => handleChapterChange(Number(e.target.value))}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand cursor-pointer">
                  {Array.from({ length: BOOK_CHAPTER_COUNTS[form.book] || 1 }, (_, i) => i + 1).map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Verses */}
              <div className="flex flex-col gap-2 relative">
                <label className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                  Verses
                  {verseCountLoading && <Loader2 className="w-3 h-3 animate-spin text-brand" />}
                </label>
                <div className="flex items-center gap-2">
                  <select required value={form.start_verse}
                    onChange={e => setForm({ ...form, start_verse: Number(e.target.value), end_verse: Math.max(Number(e.target.value), form.end_verse) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand cursor-pointer">
                    {Array.from({ length: verseCount }, (_, i) => i + 1).map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                  <span className="text-slate-400 font-bold shrink-0">—</span>
                  <select required value={form.end_verse}
                    onChange={e => setForm({ ...form, end_verse: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand cursor-pointer">
                    {Array.from({ length: verseCount }, (_, i) => i + 1)
                      .filter(v => v >= form.start_verse)
                      .map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-600">Tags <span className="text-slate-400 font-normal">(comma-separated)</span></label>
                <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. Morning, Devotion"
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white/60 dark:bg-slate-950/40 outline-none focus:ring-2 focus:ring-brand" />
              </div>

              <div className="lg:col-span-6 flex gap-3 pt-2">
                <button disabled={formLoading || verseCountLoading} type="submit"
                  className="flex-1 py-2.5 bg-brand text-white rounded-xl font-bold hover:bg-indigo-600 transition-colors disabled:opacity-50">
                  {formLoading ? "Saving..." : "Save Log"}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors font-medium">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}


        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {[
            { label: "Verses Read", value: stats?.total_verses_read || 0, icon: BookOpen, color: "text-brand" },
            { label: "Completion", value: `${(((stats?.total_verses_read || 0) / 31102) * 100).toFixed(2)}%`, icon: Target, color: "text-emerald-500" },
            { label: "Chapters", value: stats?.chapters_read || 0, icon: Target, color: "text-emerald-500" },
            { label: "Total Notes", value: counts.notes, icon: BookOpen, color: "text-blue-500", link: "/notes" },
            { label: "Highlights", value: counts.highlights, icon: Flame, color: "text-orange-500", link: "/highlights" },
          ].map((stat, idx) => {
            const cardContent = (
              <div key={idx} className={`glass p-6 rounded-2xl flex flex-col items-start gap-4 transition-transform hover:-translate-y-1 hover:shadow-xl hover:shadow-brand/5 ${stat.link ? 'cursor-pointer hover:ring-2 hover:ring-brand' : ''}`}>
                <div className={`p-3 rounded-xl bg-slate-100 dark:bg-slate-950/50 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-extrabold">{stat.value}</p>
                </div>
              </div>
            );

            return stat.link ? (
              <Link href={stat.link} key={idx} className="block outline-none">
                {cardContent}
              </Link>
            ) : cardContent;
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart Section */}
          <div className="lg:col-span-2 glass p-8 rounded-3xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Reading Activity</h2>
              {/* View toggle */}
              <div className="flex bg-slate-100 dark:bg-slate-900/50 rounded-xl p-1 gap-1">
                {(['week', 'month', 'year'] as const).map(v => (
                  <button key={v} onClick={() => setActivityView(v)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all capitalize ${activityView === v
                        ? 'bg-brand text-white shadow'
                        : 'text-slate-600 hover:text-brand'
                      }`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* WEEK — area chart */}
            {activityView === 'week' && (
              <div className="h-[260px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorVerses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-brand)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-brand)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: 'none', borderRadius: '12px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="verses" stroke="var(--color-brand)" strokeWidth={3} fillOpacity={1} fill="url(#colorVerses)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* MONTH — calendar grid */}
            {activityView === 'month' && (() => {
              const today = new Date();
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
              const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
              const startOffset = firstDay.getDay(); // 0=Sun
              const versesByDate: Record<string, number> = {};
              allEntries.forEach((e: any) => {
                if (!e.start_time) return;
                const k = new Date(e.start_time).toDateString();
                versesByDate[k] = (versesByDate[k] || 0) + (e.passage ? e.passage.end_verse - e.passage.start_verse + 1 : 0);
              });
              const maxV = Math.max(1, ...Object.values(versesByDate));
              const cells = Array.from({ length: startOffset }, (_, i) => ({ day: 0, label: '', verses: 0 }))
                .concat(Array.from({ length: daysInMonth }, (_, i) => {
                  const d = new Date(today.getFullYear(), today.getMonth(), i + 1);
                  return { day: i + 1, label: d.toDateString(), verses: versesByDate[d.toDateString()] || 0 };
                }));
              const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
              const monthName = firstDay.toLocaleString('default', { month: 'long', year: 'numeric' });
              return (
                <div>
                  <p className="text-sm text-slate-400 mb-3 font-medium">{monthName}</p>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {dayNames.map(d => <div key={d} className="text-[10px] text-slate-400 font-bold pb-1">{d}</div>)}
                    {cells.map((cell, i) => {
                      if (cell.day === 0) return <div key={`empty-${i}`} />;
                      const intensity = cell.verses ? Math.max(0.15, (cell.verses as number) / maxV) : 0;
                      const isToday = cell.label === today.toDateString();
                      return (
                        <div key={cell.day} title={`${cell.verses} verses`}
                          className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-bold transition-all cursor-default ${isToday ? 'ring-2 ring-brand' : ''
                            } ${cell.verses ? 'text-white' : 'text-slate-400'}`}
                          style={{
                            backgroundColor: cell.verses
                              ? `rgba(99,102,241,${intensity})`
                              : 'rgba(148,163,184,0.08)'
                          }}>
                          {cell.day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* YEAR — 52-week GitHub-style grid */}
            {activityView === 'year' && (() => {
              const today = new Date();
              const versesByDate: Record<string, number> = {};
              allEntries.forEach((e: any) => {
                if (!e.start_time) return;
                const k = new Date(e.start_time).toISOString().slice(0, 10);
                versesByDate[k] = (versesByDate[k] || 0) + (e.passage ? e.passage.end_verse - e.passage.start_verse + 1 : 0);
              });
              const maxV = Math.max(1, ...Object.values(versesByDate));
              // Build 53 weeks × 7 days grid starting from 364 days ago
              const startDate = new Date(today);
              startDate.setDate(startDate.getDate() - 363);
              // Back up to Sunday
              startDate.setDate(startDate.getDate() - startDate.getDay());
              const weeks: { dateKey: string; verses: number }[][] = [];
              let current = new Date(startDate);
              while (current <= today) {
                const week: { dateKey: string; verses: number }[] = [];
                for (let d = 0; d < 7; d++) {
                  const key = current.toISOString().slice(0, 10);
                  week.push({ dateKey: key, verses: versesByDate[key] || 0 });
                  current.setDate(current.getDate() + 1);
                }
                weeks.push(week);
              }
              // Month labels
              const monthLabels: { col: number; label: string }[] = [];
              weeks.forEach((week, wi) => {
                const d = new Date(week[0].dateKey);
                if (d.getDate() <= 7) {
                  monthLabels.push({ col: wi, label: d.toLocaleString('default', { month: 'short' }) });
                }
              });
              return (
                <div className="overflow-x-auto">
                  <div className="inline-flex flex-col gap-0.5 min-w-full">
                    {/* Month row */}
                    <div className="flex gap-0.5 mb-1" style={{ paddingLeft: 18 }}>
                      {weeks.map((_, wi) => {
                        const label = monthLabels.find(m => m.col === wi);
                        return <div key={wi} className="w-3 text-[8px] text-slate-400 shrink-0">{label?.label ?? ''}</div>;
                      })}
                    </div>
                    {/* Day rows */}
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((dayLabel, di) => (
                      <div key={di} className="flex items-center gap-0.5">
                        <span className="text-[8px] text-slate-400 w-4 shrink-0">{di % 2 === 1 ? dayLabel : ''}</span>
                        {weeks.map((week, wi) => {
                          const cell = week[di];
                          if (!cell) return <div key={wi} className="w-3 h-3 shrink-0" />;
                          const isToday = cell.dateKey === today.toISOString().slice(0, 10);
                          const intensity = cell.verses ? Math.max(0.2, cell.verses / maxV) : 0;
                          return (
                            <div key={wi} title={`${cell.dateKey}: ${cell.verses} verses`}
                              className={`w-3 h-3 rounded-sm shrink-0 cursor-default ${isToday ? 'ring-1 ring-brand' : ''}`}
                              style={{
                                backgroundColor: cell.verses
                                  ? `rgba(99,102,241,${intensity})`
                                  : 'rgba(148,163,184,0.08)'
                              }} />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">Last 52 weeks · hover a cell for details</p>
                </div>
              );
            })()}
          </div>

          {/* Recent Reading Sessions */}
          <div className="glass p-8 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-xl font-bold">
                <History className="w-5 h-5 text-brand" />
                <h2>Recent Sessions</h2>
              </div>
              <Link href="/history" className="text-sm font-bold text-brand hover:underline">View All</Link>
            </div>
            <div className="flex-1 flex flex-col gap-4">
              {sessions.length === 0 && <p className="text-slate-600 text-sm">No recent sessions.</p>}
              {sessions.map((session, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-white/60 dark:bg-slate-950/40 border border-slate-200 dark:border-white/10 flex flex-col gap-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-lg">{USFM_TO_BOOK_NAME[session.passage?.book] || session.passage?.book} {session.passage?.chapter}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(session.start_time).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    {session.tags?.[0] && <span className="text-xs px-2 py-1 rounded bg-brand/10 text-brand font-medium">{session.tags[0]}</span>}
                    <span className="text-xs text-slate-600 font-bold">{session.translation_id}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/reader" className="mt-6 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand text-white font-semibold hover:bg-indigo-600 transition-colors">
              Continue Reading
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}



