"use client";
// app/today/TodayChallengeSelector.tsx
// Phase 7+: Interactive challenge picker when visiting /today with multiple active challenges.

import Link from "next/link";
import {
  Target,
  ArrowRight,
  Sparkle,
  CheckCircle,
  Plus,
} from "@phosphor-icons/react";
import { AppNav } from "@/components/AppNav";
import { StreakBadge } from "@/components/StreakBadge";

export type TodayChallengeItem = {
  id: string;
  title: string;
  totalDays: number;
  currentStreak: number;
  todayLogId: string | null;
  todayDayNumber: number | null;
  todayCompletionPct: number;
  todayTasksDone: number;
  todayTasksTotal: number;
};

type Props = {
  challenges: TodayChallengeItem[];
};

export function TodayChallengeSelector({ challenges }: Props) {
  return (
    <>
      <AppNav />
      <main
        className="min-h-dvh flex flex-col justify-center py-12 px-5"
        style={{ background: "var(--surface-0)" }}
      >
        <div className="max-w-2xl w-full mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono mb-3"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              <Sparkle size={13} weight="fill" />
              <span>Select Active Challenge</span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Which today&apos;s board would you like to open?
            </h1>
            <p
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              You have {challenges.length} active challenges. Select one to launch today&apos;s Kanban execution board.
            </p>
          </div>

          {/* Challenge List */}
          <div className="flex flex-col gap-3.5">
            {challenges.map((c) => {
              const targetUrl = c.todayLogId
                ? `/challenges/${c.id}/day/${c.todayLogId}`
                : `/challenges/${c.id}`;

              const isCompleteToday = c.todayCompletionPct >= 100;

              return (
                <Link
                  key={c.id}
                  href={targetUrl}
                  className="group card rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-150 hover:border-[var(--accent)] active:scale-[0.99]"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--accent)",
                      }}
                    >
                      <Target size={20} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2
                          className="text-base font-semibold group-hover:text-[var(--accent)] transition-colors"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {c.title}
                        </h2>
                        {isCompleteToday && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/80">
                            <CheckCircle size={11} weight="fill" /> Done
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                        {c.todayDayNumber ? (
                          <span>Day {c.todayDayNumber} of {c.totalDays}</span>
                        ) : (
                          <span>{c.totalDays} Days Total</span>
                        )}
                        <span>•</span>
                        <span>
                          {c.todayTasksDone}/{c.todayTasksTotal} tasks done ({c.todayCompletionPct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                    <StreakBadge streak={c.currentStreak} size="sm" />

                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors group-hover:bg-[var(--accent)] group-hover:text-[var(--surface-0)]"
                      style={{
                        background: "var(--surface-2)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <span>Open Board</span>
                      <ArrowRight
                        size={12}
                        className="group-hover:translate-x-0.5 transition-transform"
                      />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* New Challenge Footer Action */}
          <div className="text-center mt-8 pt-4">
            <Link
              href="/challenges/new"
              className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
            >
              <Plus size={13} />
              <span>Or launch a new challenge</span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
