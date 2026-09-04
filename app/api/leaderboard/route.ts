// app/api/leaderboard/route.ts
//
// GET /api/leaderboard
//
// Returns the top N users by total PointsLedger points for the current ISO week,
// plus the requesting user's own entry even if they are outside the top N.
//
// ── Composite score breakdown ──────────────────────────────────────────────────
// The leaderboard never returns a single opaque number — every entry includes:
//   base          — sum of daily_completion points this week
//   streakBonuses — sum of streak_7 / streak_30 / streak_100 bonus points this week
//   noteTagBonus  — reserved for a future note/tag engagement signal (always 0 today)
//   total         — base + streakBonuses + noteTagBonus
//
// Streak milestones (streak_7 etc.) are awarded once per challenge and may fall
// outside the ISO week they were earned in (if the challenge spans weeks).
// We count them in the week their PointsLedger row was created, consistent
// with how base points are counted.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const TOP_N = 50;

// ─── ISO week helpers ─────────────────────────────────────────────────────────

/**
 * Returns [weekStart, weekEnd) boundaries for the current ISO week (Mon–Sun).
 * `weekEnd` is the start of next Monday (exclusive upper bound for < comparisons).
 */
function getCurrentISOWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday … 6 = Saturday

  // ISO weeks start on Monday; Sunday is day 7 (offset 6)
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(now.getUTCDate() - daysFromMonday);

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  return { start: monday, end: nextMonday };
}

// ─── Breakdown type ───────────────────────────────────────────────────────────

type ScoreBreakdown = {
  base: number;
  streakBonuses: number;
  noteTagBonus: number; // reserved; always 0 until the engagement signal is built
  total: number;
};

type LeaderboardEntry = {
  rank: number;
  userId: string;
  username: string | null;
  breakdown: ScoreBreakdown;
};

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { start, end } = getCurrentISOWeekBounds();

  // Fetch every PointsLedger row for the current ISO week
  // We pull all rows and group in memory — this avoids two round-trips and
  // keeps the breakdown logic readable.
  const rows = await prisma.pointsLedger.findMany({
    where: {
      createdAt: { gte: start, lt: end },
    },
    select: {
      userId: true,
      reason: true,
      points: true,
    },
  });

  // Aggregate per user
  const scoreMap = new Map<string, { base: number; streakBonuses: number }>();

  for (const row of rows) {
    const bucket = scoreMap.get(row.userId) ?? { base: 0, streakBonuses: 0 };

    if (row.reason === "daily_completion") {
      bucket.base += row.points;
    } else if (row.reason.startsWith("streak_")) {
      bucket.streakBonuses += row.points;
    }
    // future reasons (note_bonus, tag_bonus, …) will be handled here

    scoreMap.set(row.userId, bucket);
  }

  // Convert to a sorted array
  const sorted = [...scoreMap.entries()]
    .map(([uid, { base, streakBonuses }]) => ({
      userId: uid,
      base,
      streakBonuses,
      total: base + streakBonuses,
    }))
    .sort((a, b) => b.total - a.total);

  // Resolve usernames for the top N + the requester
  const topN = sorted.slice(0, TOP_N);
  const requesterEntry = sorted.find((e) => e.userId === userId);

  const requesterInTopN = topN.some((e) => e.userId === userId);
  const toResolve = requesterInTopN
    ? topN
    : [...topN, ...(requesterEntry ? [requesterEntry] : [])];

  const uniqueUserIds = [...new Set(toResolve.map((e) => e.userId))];

  const users = await prisma.user.findMany({
    where: { id: { in: uniqueUserIds } },
    select: { id: true, username: true },
  });

  const usernameMap = new Map(users.map((u) => [u.id, u.username]));

  // Build ranked leaderboard entries
  const leaderboard: LeaderboardEntry[] = topN.map((entry, i) => ({
    rank: i + 1,
    userId: entry.userId,
    username: usernameMap.get(entry.userId) ?? null,
    breakdown: {
      base: entry.base,
      streakBonuses: entry.streakBonuses,
      noteTagBonus: 0,
      total: entry.total,
    },
  }));

  // Append requester's entry if they're outside the top N
  let requester: (LeaderboardEntry & { outsideTopN: true }) | null = null;

  if (!requesterInTopN && requesterEntry) {
    const globalRank = sorted.findIndex((e) => e.userId === userId) + 1;
    requester = {
      rank: globalRank,
      userId,
      username: usernameMap.get(userId) ?? null,
      breakdown: {
        base: requesterEntry.base,
        streakBonuses: requesterEntry.streakBonuses,
        noteTagBonus: 0,
        total: requesterEntry.total,
      },
      outsideTopN: true,
    };
  } else if (!requesterEntry) {
    // User has no points this week at all — still include them at the bottom
    requester = {
      rank: sorted.length + 1,
      userId,
      username: usernameMap.get(userId) ?? null,
      breakdown: { base: 0, streakBonuses: 0, noteTagBonus: 0, total: 0 },
      outsideTopN: true,
    };
  }

  return Response.json({
    week: {
      start: start.toISOString(),
      end: new Date(end.getTime() - 1).toISOString(), // human-readable Sunday end
    },
    topN: TOP_N,
    leaderboard,
    ...(requester && { requester }),
  });
}
