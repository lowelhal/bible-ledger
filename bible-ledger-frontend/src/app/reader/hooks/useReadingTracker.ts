import { useState, useEffect, useRef, useCallback } from "react";
import { createLedgerEntriesBulk } from "@/lib/api";

export function useReadingTracker({
  userId,
  selectedBook,
  selectedChapter,
  selectedTranslation,
  loading
}: {
  userId: string;
  selectedBook: string;
  selectedChapter: number;
  selectedTranslation: string;
  loading: boolean;
}) {
  const [visibleVerses, setVisibleVerses] = useState<Set<number>>(new Set());
  const [readVerses, setReadVerses] = useState<Set<number>>(new Set());
  const pendingLogVerses = useRef<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const resetTracker = useCallback(() => {
    setVisibleVerses(new Set());
    setReadVerses(new Set());
    pendingLogVerses.current = new Set();
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  const verseRef = useCallback((node: HTMLSpanElement | null, verseNum: number) => {
    if (typeof window === 'undefined') return;
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        setVisibleVerses((prev) => {
          const next = new Set(prev);
          entries.forEach(entry => {
            const vNum = Number(entry.target.getAttribute('data-verse'));
            if (entry.isIntersecting) next.add(vNum);
            else next.delete(vNum);
          });
          return next;
        });
      }, { threshold: 0.5 });
    }
    if (node) observerRef.current.observe(node);
  }, []);

  useEffect(() => {
    return () => { observerRef.current?.disconnect(); observerRef.current = null; };
  }, []);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(() => {
      setVisibleVerses(visible => {
        if (visible.size === 0) return visible;
        setReadVerses(read => {
          const unreadVisible = Array.from(visible).filter(v => !read.has(v));
          if (unreadVisible.length > 0) {
            const minUnread = Math.min(...unreadVisible);
            const nextRead = new Set(read);
            nextRead.add(minUnread);
            pendingLogVerses.current.add(minUnread);
            return nextRead;
          }
          return read;
        });
        return visible;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    const flushInterval = setInterval(() => {
      const pending = pendingLogVerses.current;
      if (pending.size === 0) return;

      const sorted = Array.from(pending).sort((a, b) => a - b);
      pendingLogVerses.current = new Set();

      const ranges = [];
      let start = sorted[0];
      let prev = sorted[0];

      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] === prev + 1) {
          prev = sorted[i];
        } else {
          ranges.push({ start, end: prev });
          start = sorted[i];
          prev = sorted[i];
        }
      }
      ranges.push({ start, end: prev });

      const dtos = ranges.map(r => ({
        user_id: userId,
        source: "USER_WEB",
        translation_id: selectedTranslation,
        tags: ["Auto-log"],
        passage: {
          book: selectedBook,
          chapter: selectedChapter,
          start_verse: r.start,
          end_verse: r.end
        }
      }));
      createLedgerEntriesBulk(dtos).catch(console.error);
    }, 10000);

    return () => clearInterval(flushInterval);
  }, [selectedBook, selectedChapter, selectedTranslation, userId]);

  const forceLogVerses = useCallback((versesToLog: Set<number>) => {
    setReadVerses(prev => {
      const next = new Set(prev);
      versesToLog.forEach(v => {
        next.add(v);
        pendingLogVerses.current.add(v);
      });
      return next;
    });
  }, []);

  return { verseRef, readVerses, forceLogVerses, resetTracker };
}
