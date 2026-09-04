// app/page.tsx
// Dark-first, anti-slop marketing landing page for Loggy.
// Follows design-taste-frontend directives:
// - Hero fits initial viewport with strict copy limits (< 20 words subtext)
// - Top padding max pt-20
// - Exactly 3 bento cells with visual diversity
// - Zero em-dashes throughout
// - Phosphor icons exclusively
// - Single dark-mode theme lock

import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import {
  ArrowRight,
  Flame,
  Kanban,
  Lightning,
  Rows,
  Trophy,
} from "@phosphor-icons/react/dist/ssr";
import { LandingInteractiveDemo } from "@/components/LandingInteractiveDemo";

export default async function HomePage() {
  const { userId } = await auth();

  return (
    <div className="min-h-[100dvh] bg-[var(--surface-0)] text-[var(--text-primary)] flex flex-col selection:bg-[var(--accent)] selection:text-zinc-950">
      {/* ── 1. Top Navigation Bar (Single line, 56px) ──────────────────────── */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-5 sm:px-8 h-14 border-b border-[var(--border-subtle)] bg-[var(--surface-0)]/90 backdrop-blur-md">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-sm tracking-tight text-[var(--text-primary)]"
        >
          <div className="w-7 h-7 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--accent)]">
            <Lightning size={16} weight="fill" />
          </div>
          <span>Loggy</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/leaderboard"
            className="hidden sm:inline-block text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Leaderboard
          </Link>
          <Link
            href={userId ? "/dashboard" : "/sign-in"}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] text-zinc-950 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <span>{userId ? "Open Dashboard" : "Sign In"}</span>
            <ArrowRight size={13} weight="bold" />
          </Link>
        </div>
      </header>

      {/* ── 2. Hero Section (Strict layout discipline, fits initial viewport) ─ */}
      <section className="relative pt-12 sm:pt-16 pb-12 px-4 sm:px-6 max-w-5xl mx-auto w-full flex flex-col items-center text-center">
        {/* Eyebrow (1 of allowed max across page) */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-400 mb-6">
          <Flame size={14} weight="fill" className="text-amber-400" />
          <span>DAILY HABIT ENGINE FOR BUILDERS</span>
        </div>

        {/* Headline (Max 2 lines desktop) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight max-w-3xl mb-4 text-[var(--text-primary)]">
          Commit to your challenge. Build your heatmap.
        </h1>

        {/* Subtext (Strictly <= 20 words) */}
        <p className="text-sm sm:text-base text-[var(--text-secondary)] max-w-xl mb-8 leading-relaxed">
          Scope daily tasks on a Kanban board, safeguard your streak, and turn consistency into proof.
        </p>

        {/* CTAs (1 primary, 1 secondary, no duplicate intent) */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-12">
          <Link
            href={userId ? "/dashboard" : "/sign-up"}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[var(--accent)] text-zinc-950 hover:opacity-90 transition-opacity focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--accent)]"
          >
            <span>Start a challenge</span>
            <ArrowRight size={15} weight="bold" />
          </Link>
          <Link
            href="/leaderboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--surface-3)] transition-colors border border-[var(--border)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
          >
            <Trophy size={16} weight="duotone" className="text-amber-400" />
            <span>Weekly rankings</span>
          </Link>
        </div>

        {/* ── Interactive Live Simulation Demo ── */}
        <div className="w-full">
          <LandingInteractiveDemo />
        </div>
      </section>

      {/* ── 3. Three-Cell Bento Grid (Exact count: 3 items -> 3 cells) ──────── */}
      <section className="py-16 px-4 sm:px-6 max-w-5xl mx-auto w-full border-t border-[var(--border-subtle)]">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--text-primary)] mb-3">
            Engineered for daily execution
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Three interconnected systems ensure your daily work is structured, verified, and unalterable after midnight.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Bento Cell 1: Daily Scoped Kanban */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[var(--accent)] mb-4">
                <Kanban size={20} weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Scoped Kanban Board
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Tasks live on a 3-column board scoped exclusively to the current day. Move tasks to Done to trigger real-time completion recomputation.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-800/80 font-mono text-[11px] text-[var(--text-muted)]">
              Midnight lock protects historical integrity.
            </div>
          </div>

          {/* Bento Cell 2: Proportional Heatmap */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-[var(--accent)] mb-4">
                <Rows size={20} weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Proportional Heatmap
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Five discrete heat tiers scale automatically to fill the container block width. Each cell is accessible and links directly to that day&apos;s tasks.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-800/80 font-mono text-[11px] text-[var(--text-muted)]">
              Supports 30-day, 60-day, and 100-day challenges.
            </div>
          </div>

          {/* Bento Cell 3: Competitive Leaderboards */}
          <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/80 flex items-center justify-center text-amber-400 mb-4">
                <Trophy size={20} weight="duotone" />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                Weekly Ledger Rankings
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                Earn base points on completion and unlock compounding bonuses at 7, 30, and 100-day streak milestones. Rankings reset every Monday UTC.
              </p>
            </div>
            <div className="pt-6 mt-6 border-t border-zinc-800/80 font-mono text-[11px] text-[var(--text-muted)]">
              Public profile feeds verify consistency.
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Minimalist Dark Footer ───────────────────────────────────────── */}
      <footer className="mt-auto border-t border-[var(--border-subtle)] py-8 px-5 sm:px-8 text-xs text-[var(--text-muted)]">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Lightning size={14} weight="fill" className="text-[var(--accent)]" />
            <span className="font-medium text-[var(--text-secondary)]">Loggy</span>
            <span>: Challenge tracker and daily habit engine</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/leaderboard"
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              Leaderboard
            </Link>
            <Link
              href="/today"
              className="hover:text-[var(--text-secondary)] transition-colors"
            >
              Today
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
