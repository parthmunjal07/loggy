// lib/recompute.ts — shared recompute pipeline for Phase 2
//
// The ONLY source of truth for completionPct, streaks, and points is this
// function. Every route that mutates tasks calls it inside the same transaction.

import { Prisma } from "@prisma/client";

// ─── Constants ────────────────────────────────────────────────────────────────

export const BASE_POINTS_PER_DAY = 100;

const STREAK_MILESTONES = [7, 30, 100] as const;
const STREAK_BONUS_POINTS: Record<number, number> = {
  7: 50,
  30: 200,
  100: 1000,
};

// ─── Date helpers ─────────────────────────────────────────────────────────────

function todayUTC(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Returns true if the log's date is today or in the future (i.e. writable).
 * A log is "locked" when its calendar date (UTC) is strictly before today.
 */
export function isTodayOrFuture(logDate: Date): boolean {
  const today = todayUTC();
  const logDay = new Date(logDate);
  logDay.setUTCHours(0, 0, 0, 0);
  return logDay >= today;
}

// ─── Recompute pipeline ───────────────────────────────────────────────────────

export type RecomputeResult = {
  completionPct: number;
  tasksTotal: number;
  tasksDone: number;
  currentStreak: number;
  longestStreak: number;
};

/**
 * Recomputes Log stats, Challenge streaks, and PointsLedger entries in a
 * single pass. Must be called inside a Prisma transaction (`tx`).
 *
 * Order of operations:
 *   1. Count tasks → derive tasksTotal / tasksDone / completionPct
 *   2. Update Log row
 *   3. Fetch all logs for the challenge → compute currentStreak / longestStreak
 *   4. Update Challenge row
 *   5. Upsert PointsLedger (daily_completion)
 *   6. Award streak-milestone bonuses if just hit (no DB constraint — query first)
 */
export async function recomputeLogAndChallenge(
  tx: Prisma.TransactionClient,
  logId: string
): Promise<RecomputeResult> {
  // ── Step 1: Derive completion stats from task statuses ──────────────────────
  const tasks = await tx.task.findMany({
    where: { logId },
    select: { status: true },
  });

  const tasksTotal = tasks.length;
  const tasksDone = tasks.filter((t: { status: string }) => t.status === "DONE").length;
  const completionPct =
    tasksTotal === 0 ? 0 : (tasksDone / tasksTotal) * 100;

  // ── Step 2: Update the Log row ───────────────────────────────────────────────
  const updatedLog = await tx.log.update({
    where: { id: logId },
    data: { tasksTotal, tasksDone, completionPct },
    select: { challengeId: true },
  });

  const { challengeId } = updatedLog;

  // ── Step 3: Compute streaks from all logs in the challenge ───────────────────
  const allLogs = await tx.log.findMany({
    where: { challengeId },
    orderBy: { dayNumber: "asc" },
    select: { completionPct: true, date: true },
  });

  const today = todayUTC();

  // Exclude future logs — streaks are computed from past-or-today days only
  const pastLogs = allLogs.filter((l: { date: Date }) => {
    const d = new Date(l.date);
    d.setUTCHours(0, 0, 0, 0);
    return d <= today;
  });

  // currentStreak: consecutive days counting backwards from the latest past log
  let currentStreak = 0;
  for (let i = pastLogs.length - 1; i >= 0; i--) {
    if (pastLogs[i].completionPct > 0) {
      currentStreak++;
    } else {
      break;
    }
  }

  // longestStreak: longest unbroken run of completionPct > 0 in past logs
  let longestStreak = 0;
  let run = 0;
  for (const l of pastLogs) {
    if (l.completionPct > 0) {
      run++;
      if (run > longestStreak) longestStreak = run;
    } else {
      run = 0;
    }
  }

  // ── Step 4: Update Challenge with new streak values ──────────────────────────
  const updatedChallenge = await tx.challenge.update({
    where: { id: challengeId },
    data: { currentStreak, longestStreak },
    select: { userId: true },
  });

  const { userId } = updatedChallenge;

  // ── Step 5: Upsert daily_completion PointsLedger row ────────────────────────
  const dailyPoints = Math.round((completionPct / 100) * BASE_POINTS_PER_DAY);

  await tx.pointsLedger.upsert({
    where: { logId_reason: { logId, reason: "daily_completion" } },
    update: { points: dailyPoints },
    create: {
      userId,
      challengeId,
      logId,
      reason: "daily_completion",
      points: dailyPoints,
    },
  });

  // ── Step 6: Award streak-milestone bonuses if just hit ──────────────────────
  // There is no DB unique constraint on (challengeId, reason) for bonus rows,
  // so we query first before inserting to avoid duplicates.
  for (const milestone of STREAK_MILESTONES) {
    if (currentStreak === milestone) {
      const reason = `streak_${milestone}`;
      const existing = await tx.pointsLedger.findFirst({
        where: { challengeId, reason },
        select: { id: true },
      });
      if (!existing) {
        await tx.pointsLedger.create({
          data: {
            userId,
            challengeId,
            logId: null,
            reason,
            points: STREAK_BONUS_POINTS[milestone],
          },
        });
      }
    }
  }

  return { completionPct, tasksTotal, tasksDone, currentStreak, longestStreak };
}
