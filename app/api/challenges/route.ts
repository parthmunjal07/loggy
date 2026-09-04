// app/api/challenges/route.ts
//
// POST /api/challenges — create a challenge and bulk-insert one Log row per day
// GET  /api/challenges — list the current user's challenges with progress

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ensureUserInDb } from "@/lib/ensureUser";
import { ChallengeStatus } from "@prisma/client";

// ─── POST /api/challenges ─────────────────────────────────────────────────────

type CreateChallengeBody = {
  title: string;
  totalDays: number;
  startDate: string; // ISO date string e.g. "2024-01-15"
};

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  // Ensure User record exists in Postgres (prevents P2003 in dev without webhooks)
  await ensureUserInDb(userId);

  let body: CreateChallengeBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { title, totalDays, startDate } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "title is required" }, { status: 422 });
  }
  if (!Number.isInteger(totalDays) || totalDays < 1 || totalDays > 366) {
    return Response.json(
      { error: "totalDays must be an integer between 1 and 366" },
      { status: 422 }
    );
  }
  if (!startDate || isNaN(Date.parse(startDate))) {
    return Response.json(
      { error: "startDate must be a valid ISO date string" },
      { status: 422 }
    );
  }

  // Normalize startDate to midnight UTC
  const start = new Date(startDate);
  start.setUTCHours(0, 0, 0, 0);

  // Build Log rows for all days upfront (no DB round-trips inside the loop)
  const logData = Array.from({ length: totalDays }, (_, i) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + i);
    return {
      dayNumber: i + 1,
      date,
    };
  });

  try {
    const challenge = await prisma.$transaction(async (tx) => {
      // 1. Create the challenge
      const newChallenge = await tx.challenge.create({
        data: {
          userId,
          title: title.trim(),
          totalDays,
          startDate: start,
        },
      });

      // 2. Bulk-insert Log rows (one per day)
      await tx.log.createMany({
        data: logData.map(({ dayNumber, date }) => ({
          challengeId: newChallenge.id,
          dayNumber,
          date,
          // tasksTotal, tasksDone, completionPct all default to 0 in schema
        })),
      });

      return newChallenge;
    });

    return Response.json({ challenge }, { status: 201 });
  } catch (err) {
    console.error("POST /api/challenges error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ─── GET /api/challenges ──────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  try {
    const challenges = await prisma.challenge.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        totalDays: true,
        startDate: true,
        status: true,
        currentStreak: true,
        longestStreak: true,
        createdAt: true,
        _count: { select: { logs: true } },
        logs: {
          select: { completionPct: true, date: true },
          orderBy: { dayNumber: "asc" },
        },
      },
    });

    const now = new Date();

    const result = challenges.map((c) => {
      // Days elapsed = number of days from startDate to today (capped at totalDays)
      const msPerDay = 1000 * 60 * 60 * 24;
      const elapsed = Math.min(
        c.totalDays,
        Math.max(
          0,
          Math.floor((now.getTime() - c.startDate.getTime()) / msPerDay) + 1
        )
      );

      // Percentage of logs with >0 completion
      const daysWithProgress = c.logs.filter(
        (l) => l.completionPct > 0
      ).length;

      return {
        id: c.id,
        title: c.title,
        totalDays: c.totalDays,
        startDate: c.startDate,
        status: c.status,
        currentStreak: c.currentStreak,
        longestStreak: c.longestStreak,
        createdAt: c.createdAt,
        daysElapsed: elapsed,
        daysWithProgress,
      };
    });

    return Response.json({ challenges: result });
  } catch (err) {
    console.error("GET /api/challenges error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
