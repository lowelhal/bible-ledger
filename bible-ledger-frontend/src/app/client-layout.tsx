"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { LayoutDashboard, BookOpen, Bookmark, Settings, Highlighter, ScrollText, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { BOOKS, BOOK_CHAPTER_COUNTS } from "@/lib/bible-data";

function UserProfileBadge() {
  const { displayName, email, isAuthenticated } = useUser();
  if (!isAuthenticated) return null;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href="/settings" className="mx-4 mb-4 px-4 py-3 rounded-xl flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
      <div className="w-9 h-9 rounded-full bg-brand/20 text-brand flex items-center justify-center text-sm font-bold shrink-0">
        {initials || <User className="w-4 h-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold truncate">{displayName}</p>
        <p className="text-[11px] text-slate-400 truncate">{email}</p>
      </div>
    </Link>
  );
}

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const NAV_ITEMS = [
  { href: "/", icon: LayoutDashboard, label: "Home" },
  { href: "/reader", icon: BookOpen, label: "Read" },
  { href: "/notes", icon: Bookmark, label: "Notes" },
  { href: "/highlights", icon: Highlighter, label: "Highlights" },
  { href: "/pending", icon: ScrollText, label: "Ledger" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export default function ClientLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex bg-slate-50 dark:bg-slate-950">
        <UserProvider>

        {/* Sidebar (Desktop Only) */}
        {!pathname.startsWith('/auth') && (
          <aside className="hidden md:flex w-64 glass border-r border-slate-200 dark:border-white/10 flex-col py-8 transition-all relative z-20">
          <div className="px-8 mb-12 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand/20">
              B
            </div>
            <span className="font-bold text-xl tracking-tight">BibleLedger</span>
          </div>

          <nav className="w-full px-4 flex flex-col gap-2 flex-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${isActive(item.href)
                    ? "bg-brand/10 text-brand font-semibold"
                    : "text-slate-700 dark:text-slate-300 hover:text-brand hover:bg-slate-100 dark:hover:bg-white/5"
                  }`}
              >
                <item.icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive(item.href) ? "scale-110" : ""}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User profile at bottom of sidebar */}
          <UserProfileBadge />
        </aside>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-x-hidden pb-16 md:pb-0">
          <main className="flex-1 flex flex-col relative z-0">
              {children}
              <Toaster 
                position="bottom-right" 
                toastOptions={{
                  className: 'bg-white text-slate-900 dark:bg-slate-800 dark:text-white',
                  style: {
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.1)',
                  }
                }} 
              />
          </main>
        </div>

        {/* Bottom Navigation (Mobile Only) */}
        {!pathname.startsWith('/auth') && (
          <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-200 dark:border-white/10 flex items-stretch justify-around z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-lg">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-0.5 flex-1 min-w-0 transition-colors ${active
                    ? "text-brand"
                    : "text-slate-600 dark:text-slate-400 hover:text-brand"
                  }`}
              >
                {/* Active indicator dot */}
                <div className={`w-4 h-0.5 rounded-full mb-0.5 transition-all ${active ? "bg-brand" : "bg-transparent"}`} />
                <item.icon className={`w-5 h-5 max-[360px]:w-4 max-[360px]:h-4 shrink-0 ${active ? "scale-110" : ""} transition-transform`} />
                <span className={`text-[9px] max-[360px]:text-[8px] font-bold truncate w-full text-center leading-tight mt-0.5 ${active ? "opacity-100" : "opacity-80"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
          </nav>
        )}

        </UserProvider>
      </body>
    </html>
  );
}
