// components/AppNav.tsx
// Top navigation bar — single line, 64px max, zinc-950 base with bottom border.
// Server component: no 'use client' needed.

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Lightning } from "@phosphor-icons/react/dist/ssr";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/today", label: "Today's Tasks" },
  { href: "/leaderboard", label: "Leaderboard" },
] as const;

export function AppNav() {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-5 h-14"
      style={{
        background: "var(--surface-0)",
        borderBottom: "1px solid var(--border-subtle)",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Logo */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2 font-semibold text-sm"
        style={{ color: "var(--text-primary)" }}
      >
        <Lightning
          size={18}
          weight="fill"
          style={{ color: "var(--accent)" }}
        />
        Loggy
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
        <Link
          href="/dashboard"
          className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors duration-150 hover:bg-[var(--surface-2)]"
          style={{ color: "var(--text-secondary)" }}
        >
          Dashboard
        </Link>
        <Link
          href="/today"
          className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors duration-150 hover:bg-[var(--surface-2)]"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="sm:hidden">Today</span>
          <span className="hidden sm:inline">Today&apos;s Tasks</span>
        </Link>
        <Link
          href="/leaderboard"
          className="px-2.5 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm transition-colors duration-150 hover:bg-[var(--surface-2)]"
          style={{ color: "var(--text-secondary)" }}
        >
          Leaderboard
        </Link>
      </nav>

      {/* User */}
      <div className="flex items-center">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "w-7 h-7",
              userButtonTrigger: "focus:shadow-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]",
            },
          }}
        />
      </div>
    </header>
  );
}
