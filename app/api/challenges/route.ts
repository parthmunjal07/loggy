// app/api/challenges/route.ts
//
// POST /api/challenges — create a challenge (structured with bulk logs, or open-ended with lazy logs)
// GET  /api/challenges — list the current user's challenges with progress

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ensureUserInDb } from "@/lib/ensureUser";

class DuplicateOpenEndedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateOpenEndedError";
  }
}

// ─── POST /api/challenges ─────────────────────────────────────────────────────

type CreateChallengeBody = {
  title: string;
  totalDays?: number | null;
  startDate?: string; // ISO date string e.g. "2024-01-15"
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

  const isOpenEnded = totalDays === undefined || totalDays === null;

  if (!isOpenEnded) {
    if (!Number.isInteger(totalDays) || totalDays < 1 || totalDays > 366) {
      return Response.json(
        { error: "totalDays must be an integer between 1 and 366" },
        { status: 422 }
      );
    }
  }

  let start: Date;
  if (startDate) {
    if (isNaN(Date.parse(startDate))) {
      return Response.json(
        { error: "startDate must be a valid ISO date string" },
        { status: 422 }
      );
    }
    start = new Date(startDate);
  } else {
    start = new Date();
  }

  // Normalize startDate to midnight UTC
  start.setUTCHours(0, 0, 0, 0);

  try {
    const challenge = await prisma.$transaction(async (tx) => {
      // If open-ended, check if user already has an ongoing open-ended log
      if (isOpenEnded) {
        const existingOpenEnded = await tx.challenge.findFirst({
          where: { userId, totalDays: null },
        });

        if (existingOpenEnded) {
          throw new DuplicateOpenEndedError(
            "You already have an ongoing log — edit it in settings instead of creating a new one."
          );
        }

        // Create open-ended challenge (no Log rows pre-created)
        return await tx.challenge.create({
          data: {
            userId,
            title: title.trim(),
            totalDays: null,
            startDate: start,
          },
        });
      }

      // Structured challenge: create challenge and bulk-insert one Log row per day
      const newChallenge = await tx.challenge.create({
        data: {
          userId,
          title: title.trim(),
          totalDays,
          startDate: start,
        },
      });

      const logData = Array.from({ length: totalDays }, (_, i) => {
        const date = new Date(start);
        date.setUTCDate(start.getUTCDate() + i);
        return {
          dayNumber: i + 1,
          date,
        };
      });

      await tx.log.createMany({
        data: logData.map(({ dayNumber, date }) => ({
          challengeId: newChallenge.id,
          dayNumber,
          date,
        })),
      });

      return newChallenge;
    });

    return Response.json({ challenge }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof DuplicateOpenEndedError) {
      return Response.json({ error: err.message }, { status: 409 });
    }
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
      // Days elapsed = number of days from startDate to today (capped at totalDays for structured challenges)
      const msPerDay = 1000 * 60 * 60 * 24;
      const rawElapsed = Math.max(
        0,
        Math.floor((now.getTime() - c.startDate.getTime()) / msPerDay) + 1
      );
      const elapsed =
        c.totalDays != null ? Math.min(c.totalDays, rawElapsed) : rawElapsed;

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
