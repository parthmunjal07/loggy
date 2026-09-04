"use client";
// app/leaderboard/LeaderboardClient.tsx
// Phase 7: Leaderboard UI with composite score breakdown, top-3 highlights,
// and guaranteed persistent visibility of the current user's standing.

import Link from "next/link";
import {
  Trophy,
  Medal,
  Crown,
  Lightning,
  Fire,
  User as UserIcon,
  ArrowRight,
  Sparkle,
} from "@phosphor-icons/react";

type ScoreBreakdown = {
  base: number;
  streakBonuses: number;
  noteTagBonus: number;
  total: number;
};

export type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string | null;
  breakdown: ScoreBreakdown;
  outsideTopN?: boolean;
};

type Props = {
  currentUserId: string;
  weekStart: string;
  weekEnd: string;
  topEntries: LeaderboardEntry[];
  requesterEntry: LeaderboardEntry | null;
};

function formatDisplayName(username: string | null, userId: string): string {
  if (username) return `@${username}`;
  return `User ${userId.slice(-6)}`;
}

export function LeaderboardClient({
  currentUserId,
  weekStart,
  weekEnd,
  topEntries,
  requesterEntry,
}: Props) {
  const startDateStr = new Date(weekStart).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const endDateStr = new Date(weekEnd).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const top3 = topEntries.slice(0, 3);
  const remaining = topEntries.slice(3);

  const isRequesterInTopEntries = topEntries.some(
    (e) => e.userId === currentUserId
  );

  return (
    <main
      className="min-h-dvh flex flex-col"
      style={{ background: "var(--surface-0)" }}
    >
      <div className="max-w-5xl w-full mx-auto px-5 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Trophy size={16} style={{ color: "var(--accent)" }} />
              <span
                className="text-xs font-mono font-medium uppercase tracking-wider"
                style={{ color: "var(--accent)" }}
              >
                Weekly Competition
              </span>
            </div>
            <h1
              className="text-2xl sm:text-3xl font-bold tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              Leaderboard
            </h1>
            <p
              className="text-xs font-mono mt-1"
              style={{ color: "var(--text-muted)" }}
            >
              Current ISO Week: {startDateStr} to {endDateStr}
            </p>
          </div>

          {/* Scoring rule explainer chip */}
          <div
            className="flex items-center gap-3 px-3.5 py-2 rounded-xl border text-[11px] font-mono"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
            }}
          >
            <span>Base points: up to 100/day</span>
            <span className="text-zinc-600">•</span>
            <span>Milestone bonuses: +50 / +200 / +1000</span>
          </div>
        </div>

        {/* Current User's Pinned Standing Card */}
        {requesterEntry && (
          <div
            className="rounded-xl border p-5 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-colors"
            style={{
              background: "var(--surface-1)",
              borderColor: "var(--accent)",
            }}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-mono font-bold text-lg border"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--accent)",
                  color: "var(--accent)",
                }}
              >
                #{requesterEntry.rank}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Your Weekly Standing
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full uppercase"
                    style={{
                      background: "var(--surface-3)",
                      color: "var(--accent)",
                    }}
                  >
                    Active
                  </span>
                </div>
                <p
                  className="text-xs font-mono mt-0.5"
                  style={{ color: "var(--text-muted)" }}
                >
                  {formatDisplayName(requesterEntry.username, requesterEntry.userId)}
                  {requesterEntry.outsideTopN && " (outside top 50)"}
                </p>
              </div>
            </div>

            {/* Breakdown stats */}
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Base pts
                </span>
                <span className="text-sm font-mono font-semibold text-zinc-200 tabular-nums">
                  {requesterEntry.breakdown.base}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  Streak bonus
                </span>
                <span className="text-sm font-mono font-semibold text-zinc-200 tabular-nums">
                  +{requesterEntry.breakdown.streakBonuses}
                </span>
              </div>
              <div
                className="flex flex-col px-3 py-1.5 rounded-lg border min-w-[90px] text-right"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                }}
              >
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Total Score
                </span>
                <span
                  className="text-lg font-mono font-bold tabular-nums"
                  style={{ color: "var(--accent)" }}
                >
                  {requesterEntry.breakdown.total}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium Cards (if entries exist) */}
        {top3.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {top3.map((entry, idx) => {
              const isCurrentUser = entry.userId === currentUserId;
              const medals = [
                {
                  label: "1st Place",
                  icon: Crown,
                  color: "text-amber-400",
                  bg: "bg-amber-400/10",
                  border: "border-amber-500/40",
                },
                {
                  label: "2nd Place",
                  icon: Medal,
                  color: "text-zinc-300",
                  bg: "bg-zinc-300/10",
                  border: "border-zinc-500/40",
                },
                {
                  label: "3rd Place",
                  icon: Medal,
                  color: "text-orange-400",
                  bg: "bg-orange-400/10",
                  border: "border-orange-500/40",
                },
              ];
              const medal = medals[idx];
              const IconComponent = medal.icon;

              return (
                <div
                  key={entry.userId}
                  className={`rounded-xl border p-5 flex flex-col justify-between gap-4 relative transition-all ${
                    isCurrentUser ? "ring-1 ring-[var(--accent)]" : ""
                  }`}
                  style={{
                    background: "var(--surface-1)",
                    borderColor: isCurrentUser ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border ${medal.bg} ${medal.border} ${medal.color}`}
                      >
                        <IconComponent size={16} weight="fill" />
                      </div>
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                          {medal.label}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {entry.username ? (
                            <Link
                              href={`/profile/${entry.username}`}
                              className="text-sm font-semibold hover:underline flex items-center gap-1"
                              style={{ color: "var(--text-primary)" }}
                            >
                              @{entry.username}
                              <ArrowRight size={11} className="text-zinc-500" />
                            </Link>
                          ) : (
                            <span
                              className="text-sm font-semibold"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {formatDisplayName(entry.username, entry.userId)}
                            </span>
                          )}
                          {isCurrentUser && (
                            <span
                              className="text-[10px] font-mono px-1.5 py-0.2 rounded"
                              style={{
                                background: "var(--surface-3)",
                                color: "var(--accent)",
                              }}
                            >
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className="text-xl font-mono font-bold tabular-nums"
                        style={{ color: "var(--accent)" }}
                      >
                        {entry.breakdown.total}
                      </span>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">
                        pts
                      </p>
                    </div>
                  </div>

                  {/* Score breakdown bar */}
                  <div
                    className="pt-3 border-t flex items-center justify-between text-xs font-mono"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>Base: {entry.breakdown.base} pts</span>
                    <span>Bonus: +{entry.breakdown.streakBonuses} pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div
          className="card rounded-xl overflow-hidden flex flex-col"
          style={{
            background: "var(--surface-1)",
            borderColor: "var(--border)",
          }}
        >
          <div
            className="px-5 py-4 border-b flex items-center justify-between"
            style={{ borderColor: "var(--border)" }}
          >
            <h2
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              All Participants
            </h2>
            <span
              className="text-xs font-mono"
              style={{ color: "var(--text-muted)" }}
            >
              Top {topEntries.length} Ranked
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr
                  className="border-b text-[11px] font-mono uppercase tracking-wider text-zinc-400"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                  }}
                >
                  <th className="py-3 px-5 font-medium w-16">Rank</th>
                  <th className="py-3 px-5 font-medium">User</th>
                  <th className="py-3 px-5 font-medium">Base Points</th>
                  <th className="py-3 px-5 font-medium">Streak Bonuses</th>
                  <th className="py-3 px-5 font-medium text-right">Total Score</th>
                </tr>
              </thead>
              <tbody>
                {topEntries.length > 0 ? (
                  topEntries.map((entry) => {
                    const isCurrentUser = entry.userId === currentUserId;

                    return (
                      <tr
                        key={entry.userId}
                        className={`border-b transition-colors hover:bg-[var(--surface-2)]/50 ${
                          isCurrentUser
                            ? "bg-[var(--surface-2)]/30 font-medium"
                            : ""
                        }`}
                        style={{ borderColor: "var(--border)" }}
                      >
                        {/* Rank */}
                        <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-zinc-400">
                          {entry.rank === 1 ? (
                            <span className="text-amber-400 font-bold">#1</span>
                          ) : entry.rank === 2 ? (
                            <span className="text-zinc-300 font-bold">#2</span>
                          ) : entry.rank === 3 ? (
                            <span className="text-orange-400 font-bold">#3</span>
                          ) : (
                            `#${entry.rank}`
                          )}
                        </td>

                        {/* User */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            {entry.username ? (
                              <Link
                                href={`/profile/${entry.username}`}
                                className="text-xs font-mono hover:underline flex items-center gap-1"
                                style={{ color: "var(--text-primary)" }}
                              >
                                @{entry.username}
                                <ArrowRight size={10} className="text-zinc-500" />
                              </Link>
                            ) : (
                              <span
                                className="text-xs font-mono"
                                style={{ color: "var(--text-secondary)" }}
                              >
                                {formatDisplayName(entry.username, entry.userId)}
                              </span>
                            )}
                            {isCurrentUser && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                                style={{
                                  background: "var(--surface-3)",
                                  color: "var(--accent)",
                                }}
                              >
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Base Points */}
                        <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-zinc-300">
                          {entry.breakdown.base}
                        </td>

                        {/* Streak Bonuses */}
                        <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-zinc-300">
                          {entry.breakdown.streakBonuses > 0 ? (
                            <span className="text-emerald-400">
                              +{entry.breakdown.streakBonuses}
                            </span>
                          ) : (
                            "0"
                          )}
                        </td>

                        {/* Total Score */}
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-sm tabular-nums" style={{ color: "var(--accent)" }}>
                          {entry.breakdown.total}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="py-12 text-center text-xs font-mono text-zinc-500"
                    >
                      No activity recorded for the current week yet. Complete your first daily task to get ranked!
                    </td>
                  </tr>
                )}

                {/* Outside Top N Pinned Row for current user */}
                {!isRequesterInTopEntries && requesterEntry && (
                  <tr
                    className="border-t-2 transition-colors bg-[var(--surface-2)]/60 font-medium"
                    style={{ borderColor: "var(--accent)" }}
                  >
                    <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-[var(--accent)] font-bold">
                      #{requesterEntry.rank}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-mono"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatDisplayName(
                            requesterEntry.username,
                            requesterEntry.userId
                          )}
                        </span>
                        <span
                          className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                          style={{
                            background: "var(--surface-3)",
                            color: "var(--accent)",
                          }}
                        >
                          You (outside top {topEntries.length})
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-zinc-300">
                      {requesterEntry.breakdown.base}
                    </td>
                    <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-zinc-300">
                      +{requesterEntry.breakdown.streakBonuses}
                    </td>
                    <td
                      className="py-3.5 px-5 text-right font-mono font-bold text-sm tabular-nums"
                      style={{ color: "var(--accent)" }}
                    >
                      {requesterEntry.breakdown.total}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
