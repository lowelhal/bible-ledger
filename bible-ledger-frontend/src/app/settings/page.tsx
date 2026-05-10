"use client";

import { useState, useEffect } from "react";
import { signOut, authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { LogOut, Bell, Rss, Settings2, Loader2, User, Lock, Trash2, AlertTriangle } from "lucide-react";
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
  const { userId, displayName, email } = useUser();
  const [loading, setLoading] = useState(true);

  const [autoConfirmReadings, setAutoConfirmReadings] = useState(true);
  const [autoConfirmSubs, setAutoConfirmSubs] = useState(false);
  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [subscribed, setSubscribed] = useState<Record<string, boolean>>({});

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await authClient.changePassword({
        currentPassword,
        newPassword,
        fetchOptions: {
          onSuccess: () => {
            toast.success("Password changed successfully");
            setShowPasswordForm(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
          },
          onError: (ctx: any) => {
            toast.error(ctx.error?.message || "Failed to change password");
          }
        }
      });
    } catch {
      toast.error("Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleting(true);
    try {
      await authClient.deleteUser({
        fetchOptions: {
          onSuccess: () => {
            toast.success("Account deleted");
            router.push("/auth");
          },
          onError: (ctx: any) => {
            toast.error(ctx.error?.message || "Failed to delete account");
          }
        }
      });
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeleting(false);
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

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
              <p className="text-slate-500 text-sm">Manage your reading preferences and account.</p>
            </div>
          </div>
        </div>

        <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
            <User className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Account</h2>
          </div>
          <div className="px-6 py-5 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
            <div className="w-14 h-14 rounded-full bg-brand/20 text-brand flex items-center justify-center text-lg font-bold shrink-0">
              {initials || <User className="w-6 h-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg font-bold truncate">{displayName}</p>
              <p className="text-sm text-slate-400 truncate">{email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-600 dark:text-slate-400 group"
          >
            <span className="font-medium text-sm">Sign Out</span>
            <LogOut className="w-4 h-4 opacity-70 group-hover:opacity-100" />
          </button>
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

        {/* ── Security ── */}
        <div className="glass rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center gap-2">
            <Lock className="w-4 h-4 text-brand" />
            <h2 className="font-bold text-sm uppercase tracking-widest text-slate-600 dark:text-slate-400">Security</h2>
          </div>

          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
            >
              <div>
                <span className="font-medium text-sm">Change Password</span>
                <p className="text-xs text-slate-400 mt-0.5">Update your account password.</p>
              </div>
              <Lock className="w-4 h-4 text-slate-400" />
            </button>
          ) : (
            <form onSubmit={handleChangePassword} className="px-6 py-5 space-y-4">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-brand text-sm transition-all"
              />
              <input
                type="password"
                placeholder="New password (min 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-brand text-sm transition-all"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-brand text-sm transition-all"
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {changingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); }}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Danger Zone ── */}
        <div className="glass rounded-3xl overflow-hidden border border-red-200 dark:border-red-900/30">
          <div className="px-6 py-4 border-b border-red-100 dark:border-red-900/20 bg-red-50 dark:bg-red-950/20">
            <h2 className="font-bold text-sm uppercase tracking-widest text-red-600 dark:text-red-400">Danger Zone</h2>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors text-red-600 dark:text-red-400 group"
            >
              <div>
                <span className="font-medium text-sm">Delete Account</span>
                <p className="text-xs text-red-400/70 mt-0.5">Permanently delete your account and all data.</p>
              </div>
              <Trash2 className="w-4 h-4 opacity-70 group-hover:opacity-100" />
            </button>
          ) : (
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30">
                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  This action is <strong>permanent</strong> and cannot be undone. All your reading history, notes, and highlights will be deleted.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-red-500 mb-1 block">Type DELETE to confirm</label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-900/30 bg-white/50 dark:bg-slate-900/50 outline-none focus:ring-2 focus:ring-red-500 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== "DELETE" || deleting}
                  className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center gap-2"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Delete Forever
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                  className="px-5 py-2.5 text-slate-500 hover:text-slate-700 rounded-xl font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
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
