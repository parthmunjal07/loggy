"use client";
// app/profile/[username]/PublicProfileClient.tsx
// Phase 7: Public profile with timeline/journal feed of daily progress and notes.
// Accessible to both signed-out visitors and authenticated users.

import { useState } from "react";
import Link from "next/link";
import {
  CalendarBlank,
  CheckCircle,
  Lightning,
  Sparkle,
  Fire,
  Quotes,
  User as UserIcon,
  ArrowRight,
  Target,
  Trophy,
} from "@phosphor-icons/react";
import { StreakBadge } from "@/components/StreakBadge";

export type PublicLog = {
  id: string;
  dayNumber: number;
  date: string;
  completionPct: number;
  tasksTotal: number;
  tasksDone: number;
  note: string | null;
  completedTasks: {
    id: string;
    title: string;
    tags: { tag: { id: string; name: string } }[];
  }[];
};

export type PublicChallenge = {
  id: string;
  title: string;
  totalDays: number;
  currentStreak: number;
  longestStreak: number;
  status: string;
  createdAt: string;
  logs: PublicLog[];
};

type Props = {
  username: string;
  userId: string;
  createdAt: string;
  totalPoints: number;
  challenges: PublicChallenge[];
  isAuthenticatedVisitor: boolean;
};

export function PublicProfileClient({
  username,
  userId,
  createdAt,
  totalPoints,
  challenges,
  isAuthenticatedVisitor,
}: Props) {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    challenges[0]?.id || ""
  );
  const [filterActiveOnly, setFilterActiveOnly] = useState<boolean>(true);

  const activeChallenge =
    challenges.find((c) => c.id === selectedChallengeId) || challenges[0];

  const memberSince = new Date(createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate stats across challenges
  const totalDaysCompleted = challenges.reduce(
    (acc, c) => acc + c.logs.filter((l) => l.completionPct >= 100).length,
    0
  );
  const maxStreak = Math.max(...challenges.map((c) => c.longestStreak), 0);

  // Filter logs for the selected challenge timeline
  const timelineLogs = activeChallenge
    ? activeChallenge.logs.filter((log) => {
        if (filterActiveOnly) {
          return log.completionPct > 0 || (log.note && log.note.trim().length > 0);
        }
        return true;
      })
    : [];

  return (
    <div
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Visitor Banner if signed out */}
      {!isAuthenticatedVisitor && (
        <div
          className="border-b px-5 py-3 flex items-center justify-between gap-4 text-xs font-mono"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-2">
            <Lightning size={16} weight="fill" style={{ color: "var(--accent)" }} />
            <span style={{ color: "var(--text-secondary)" }}>
              Viewing @{username}&apos;s verified challenge journal on Loggy.
            </span>
          </div>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-transform active:scale-[0.98]"
            style={{
              background: "var(--accent)",
              color: "var(--surface-0)",
            }}
          >
            <span>Start a challenge</span>
            <ArrowRight size={12} weight="bold" />
          </Link>
        </div>
      )}

      <main className="max-w-4xl w-full mx-auto px-5 py-10 flex-1 flex flex-col">
        {/* User Identity Header */}
        <div
          className="card rounded-2xl p-6 md:p-8 mb-8 border flex flex-col md:flex-row md:items-center justify-between gap-6"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl font-mono border"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
                color: "var(--accent)",
              }}
            >
              {username.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-2xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  @{username}
                </h1>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full border text-zinc-400"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                  }}
                >
                  Public Profile
                </span>
              </div>
              <p
                className="text-xs font-mono mt-1"
                style={{ color: "var(--text-muted)" }}
              >
                Committing to daily mastery since {memberSince}
              </p>
            </div>
          </div>

          {/* User Stats Pill */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 border-t md:border-t-0 pt-4 md:pt-0">
            <div
              className="px-3.5 py-2 rounded-xl border flex flex-col items-center"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-[10px] font-mono uppercase text-zinc-500">
                Points
              </span>
              <span
                className="text-base font-bold font-mono tabular-nums"
                style={{ color: "var(--accent)" }}
              >
                {totalPoints}
              </span>
            </div>
            <div
              className="px-3.5 py-2 rounded-xl border flex flex-col items-center"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-[10px] font-mono uppercase text-zinc-500">
                100% Days
              </span>
              <span className="text-base font-bold font-mono text-zinc-100 tabular-nums">
                {totalDaysCompleted}
              </span>
            </div>
            <div
              className="px-3.5 py-2 rounded-xl border flex flex-col items-center"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <span className="text-[10px] font-mono uppercase text-zinc-500">
                Best Streak
              </span>
              <span className="text-base font-bold font-mono text-amber-400 tabular-nums">
                {maxStreak}d
              </span>
            </div>
          </div>
        </div>

        {/* Challenge Selection & Progress */}
        {challenges.length > 0 ? (
          <div className="flex flex-col gap-6">
            {/* Challenge tabs if multiple */}
            {challenges.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {challenges.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedChallengeId(c.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono whitespace-nowrap border transition-colors ${
                      c.id === activeChallenge.id
                        ? "border-[var(--accent)] text-white bg-[var(--surface-2)]"
                        : "border-[var(--border)] text-zinc-400 hover:text-zinc-200 bg-[var(--surface-1)]"
                    }`}
                  >
                    {c.title}
                  </button>
                ))}
              </div>
            )}

            {/* Active Challenge Summary Card */}
            <div
              className="rounded-xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              style={{
                background: "var(--surface-1)",
                borderColor: "var(--border)",
              }}
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Target size={14} style={{ color: "var(--accent)" }} />
                  <span
                    className="text-xs font-mono uppercase tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    Commitment
                  </span>
                </div>
                <h2
                  className="text-xl font-bold tracking-tight"
                  style={{ color: "var(--text-primary)" }}
                >
                  {activeChallenge.title}
                </h2>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {activeChallenge.totalDays} Days Commitment
                </p>
              </div>

              <div className="flex items-center gap-3">
                <StreakBadge streak={activeChallenge.currentStreak} size="md" />
              </div>
            </div>

            {/* Journal Feed Section Header & Filter */}
            <div className="flex items-center justify-between pt-2">
              <div>
                <h3
                  className="text-base font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Daily Journal & Timeline
                </h3>
                <p
                  className="text-xs font-mono"
                  style={{ color: "var(--text-muted)" }}
                >
                  Documented execution and reflections
                </p>
              </div>

              {/* Filter */}
              <div
                className="flex items-center p-0.5 rounded-lg border text-xs font-mono"
                style={{
                  background: "var(--surface-1)",
                  borderColor: "var(--border)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(true)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    filterActiveOnly
                      ? "bg-[var(--surface-3)] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  Activity ({activeChallenge.logs.filter((l) => l.completionPct > 0 || l.note).length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActiveOnly(false)}
                  className={`px-2.5 py-1 rounded-md transition-colors ${
                    !filterActiveOnly
                      ? "bg-[var(--surface-3)] text-white"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  All ({activeChallenge.logs.length})
                </button>
              </div>
            </div>

            {/* Timeline Feed Container */}
            <div className="relative border-l-2 border-zinc-800 ml-4 md:ml-6 pl-6 md:pl-8 space-y-6 pt-2 pb-8">
              {timelineLogs.length > 0 ? (
                timelineLogs.map((log) => {
                  const formattedDate = new Date(log.date).toLocaleDateString(
                    "en-US",
                    {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    }
                  );

                  const isComplete = log.completionPct >= 100;
                  const hasProgress = log.completionPct > 0;

                  return (
                    <div key={log.id} className="relative group">
                      {/* Node indicator on the timeline thread */}
                      <div
                        className={`absolute -left-[31px] md:-left-[39px] top-4 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isComplete
                            ? "border-[var(--accent)] bg-[var(--accent)]"
                            : hasProgress
                            ? "border-[var(--accent)] bg-[var(--surface-0)]"
                            : "border-zinc-700 bg-[var(--surface-0)]"
                        }`}
                      >
                        {isComplete && (
                          <div
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: "var(--surface-0)" }}
                          />
                        )}
                      </div>

                      {/* Day Story Card */}
                      <div
                        className="rounded-xl border p-5 transition-all hover:border-zinc-700"
                        style={{
                          background: "var(--surface-1)",
                          borderColor: "var(--border)",
                        }}
                      >
                        {/* Day Card Header */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className="text-xs font-mono font-semibold"
                                style={{ color: "var(--accent)" }}
                              >
                                Day {log.dayNumber}
                              </span>
                              <span className="text-xs text-zinc-600">•</span>
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--text-muted)" }}
                              >
                                {formattedDate}
                              </span>
                            </div>
                          </div>

                          {/* Completion Badge */}
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[11px] font-mono px-2 py-0.5 rounded-md font-medium"
                              style={{
                                background: hasProgress
                                  ? "var(--surface-2)"
                                  : "transparent",
                                color: hasProgress
                                  ? "var(--accent)"
                                  : "var(--text-muted)",
                              }}
                            >
                              {log.completionPct}% done ({log.tasksDone}/{log.tasksTotal})
                            </span>
                          </div>
                        </div>

                        {/* Note / Journal Reflection if present */}
                        {log.note && (
                          <div
                            className="rounded-lg p-3.5 mb-3.5 border flex items-start gap-2.5"
                            style={{
                              background: "var(--surface-2)",
                              borderColor: "var(--border)",
                            }}
                          >
                            <Quotes
                              size={16}
                              weight="fill"
                              className="shrink-0 mt-0.5 text-zinc-500"
                            />
                            <p
                              className="text-xs font-mono leading-relaxed italic"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {log.note}
                            </p>
                          </div>
                        )}

                        {/* Completed Tasks List */}
                        {log.completedTasks && log.completedTasks.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-1">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                              Accomplished
                            </span>
                            <div className="flex flex-col gap-1.5">
                              {log.completedTasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-center justify-between gap-2 text-xs font-mono"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckCircle
                                      size={13}
                                      weight="fill"
                                      style={{ color: "var(--accent)" }}
                                      className="shrink-0"
                                    />
                                    <span style={{ color: "var(--text-secondary)" }}>
                                      {task.title}
                                    </span>
                                  </div>

                                  {/* Tags */}
                                  {task.tags && task.tags.length > 0 && (
                                    <div className="flex items-center gap-1">
                                      {task.tags.map(({ tag }) => (
                                        <span
                                          key={tag.id}
                                          className="text-[10px] font-mono px-1.5 py-0.5 rounded border text-zinc-400"
                                          style={{
                                            background: "var(--surface-2)",
                                            borderColor: "var(--border)",
                                          }}
                                        >
                                          {tag.name}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clean minimal footer if no tasks or notes */}
                        {!log.note && (!log.completedTasks || log.completedTasks.length === 0) && (
                          <p className="text-xs font-mono text-zinc-600">
                            Rest day or no actions recorded.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div
                  className="rounded-xl border p-8 text-center text-xs font-mono"
                  style={{
                    background: "var(--surface-1)",
                    borderColor: "var(--border)",
                    color: "var(--text-muted)",
                  }}
                >
                  <CalendarBlank size={24} className="mx-auto mb-2 text-zinc-600" />
                  <p>No active days recorded for this filter yet.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div
            className="rounded-xl border p-12 text-center text-xs font-mono"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
              color: "var(--text-muted)",
            }}
          >
            <p>@{username} has not launched any challenges yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}
