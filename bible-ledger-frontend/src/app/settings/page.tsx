"use client";

import { useState, useEffect } from "react";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Rss, Settings2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useUser } from "@/contexts/UserContext";
import {
  fetchUserSettings,
  updateUserSettings,
  fetchAvailableFeeds,
  fetchUserSubscriptions,
  toggleSubscription,
} from "@/lib/api";

interface Feed {
  id: string;
  slug: string;
  name: string;
  year: number | null;
  _count: { readings: number };
}

interface UserSub {
  feed_id: string;
  feed: Feed;
  enabled: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { userId } = useUser();
  const [loading, setLoading] = useState(true);

  const [autoConfirmReadings, setAutoConfirmReadings] = useState(true);
  const [autoConfirmSubs, setAutoConfirmSubs] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [settings, allFeeds, userSubs] = await Promise.all([
          fetchUserSettings(userId),
          fetchAvailableFeeds(),
          fetchUserSubscriptions(userId),
        ]);
        setAutoConfirmReadings(settings.auto_confirm_readings ?? true);
        setAutoConfirmSubs(settings.auto_confirm_subscriptions ?? false);
        setFeeds(allFeeds);

        // Build subscription map: feed_id → enabled
        const subMap: Record<string, boolean> = {};
        for (const sub of userSubs) {
          subMap[sub.feed_id] = sub.enabled;
        }
        setSubscribed(subMap);
      } catch {
        console.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleToggleSetting = async (key: "auto_confirm_readings" | "auto_confirm_subscriptions", value: boolean) => {
    try {
      await updateUserSettings(userId, { [key]: value });
      if (key === "auto_confirm_readings") setAutoConfirmReadings(value);
      else setAutoConfirmSubs(value);
      toast.success("Setting updated");
    } catch {
      toast.error("Failed to update setting");
    }
  };

  const handleToggleFeed = async (feedId: string) => {
    const newVal = !subscribed[feedId];
    try {
      await toggleSubscription(userId, feedId, newVal);
      setSubscribed(prev => ({ ...prev, [feedId]: newVal }));
      toast.success(newVal ? "Subscribed" : "Unsubscribed");
    } catch {
      toast.error("Failed to toggle subscription");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Signed out successfully");
            router.push("/auth");
          },
        },
      });
    } catch {
      toast.error("Failed to sign out");
    }
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
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center">
              <Settings2 className="w-6 h-6 text-brand" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
              <p className="text-slate-500 text-sm">Manage your reading preferences and subscriptions.</p>
            </div>
          </div>
        </div>

        {/* ── Feed Subscriptions ── */}
        <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
            <Rss className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Reading Feeds</h2>
          </div>
          <p className="px-6 pt-3 pb-1 text-xs text-slate-400">
            Subscribe to feeds to auto-log their daily passage to your ledger.
          </p>

          {feeds.length === 0 ? (
            <div className="px-6 py-6 text-center text-sm text-slate-400">
              No reading feeds are available at this time. Check back later.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {feeds.map((feed) => (
                <div key={feed.id} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <span className="font-medium text-sm">{feed.name}</span>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {feed._count.readings} readings loaded{feed.year ? ` · ${feed.year}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleFeed(feed.id)}
                    className={`relative w-12 h-7 rounded-full transition-colors ${subscribed[feed.id] ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"}`}
                  >
                    <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${subscribed[feed.id] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Tracking Preferences ── */}
        <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Tracking Preferences</h2>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-white/5">
            <ToggleRow
              label="Auto-confirm readings"
              description="Automatically confirm your manual reading sessions."
              enabled={autoConfirmReadings}
              onToggle={() => handleToggleSetting("auto_confirm_readings", !autoConfirmReadings)}
            />
            <ToggleRow
              label="Auto-confirm subscription entries"
              description="Auto-confirm feed entries instead of marking them pending."
              enabled={autoConfirmSubs}
              onToggle={() => handleToggleSetting("auto_confirm_subscriptions", !autoConfirmSubs)}
            />
          </div>
        </div>

        {/* ── Account Actions ── */}
        <div className="glass rounded-3xl overflow-hidden border border-red-200 dark:border-red-900/30">
          <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-950/20">
            <h2 className="font-bold text-sm uppercase tracking-widest text-red-600 dark:text-red-400">Account</h2>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400 group"
          >
            <span className="font-medium text-sm">Sign Out</span>
            <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          </button>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 pb-8">
          BibleLedger v1.6
        </p>
      </div>
    </div>
  );
}

// ─── Reusable Toggle Row ─────────────────────────────────────────────────

function ToggleRow({ label, description, enabled, onToggle }: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <div>
        <span className="font-medium text-sm">{label}</span>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative w-12 h-7 rounded-full transition-colors ${enabled ? "bg-brand" : "bg-slate-300 dark:bg-slate-700"}`}
      >
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${enabled ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}
