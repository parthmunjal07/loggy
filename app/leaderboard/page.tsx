// app/leaderboard/page.tsx
// Phase 7: Server component for the Weekly Leaderboard.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { LeaderboardClient, type LeaderboardEntry } from "./LeaderboardClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard - Loggy",
  description: "Weekly challenge execution leaderboard with composite score breakdowns.",
};

const TOP_N = 50;

function getCurrentISOWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay();
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const monday = new Date(now);
  monday.setUTCHours(0, 0, 0, 0);
  monday.setUTCDate(now.getUTCDate() - daysFromMonday);

  const nextMonday = new Date(monday);
  nextMonday.setUTCDate(monday.getUTCDate() + 7);

  return { start: monday, end: nextMonday };
}

export default async function LeaderboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { start, end } = getCurrentISOWeekBounds();

  // Fetch all PointsLedger rows for the current ISO week
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

  // Aggregate by user
  const scoreMap = new Map<string, { base: number; streakBonuses: number }>();

  for (const row of rows) {
    const bucket = scoreMap.get(row.userId) ?? { base: 0, streakBonuses: 0 };
    if (row.reason === "daily_completion") {
      bucket.base += row.points;
    } else if (row.reason.startsWith("streak_")) {
      bucket.streakBonuses += row.points;
    }
    scoreMap.set(row.userId, bucket);
  }

  const sorted = [...scoreMap.entries()]
    .map(([uid, { base, streakBonuses }]) => ({
      userId: uid,
      base,
      streakBonuses,
      total: base + streakBonuses,
    }))
    .sort((a, b) => b.total - a.total);

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

  const topEntries: LeaderboardEntry[] = topN.map((entry, i) => ({
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

  let requester: LeaderboardEntry | null = null;

  if (requesterInTopN) {
    requester = topEntries.find((e) => e.userId === userId) ?? null;
  } else if (requesterEntry) {
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
  } else {
    // Current user has 0 points this week
    requester = {
      rank: sorted.length + 1,
      userId,
      username: usernameMap.get(userId) ?? null,
      breakdown: { base: 0, streakBonuses: 0, noteTagBonus: 0, total: 0 },
      outsideTopN: true,
    };
  }

  return (
    <>
      <AppNav />
      <LeaderboardClient
        currentUserId={userId}
        weekStart={start.toISOString()}
        weekEnd={end.toISOString()}
        topEntries={topEntries}
        requesterEntry={requester}
      />
    </>
  );
}
