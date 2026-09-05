// app/api/challenges/[id]/route.ts
//
// GET    /api/challenges/[id] — full detail including all Log rows
// PATCH  /api/challenges/[id] — title / status only; rejects totalDays/startDate
// DELETE /api/challenges/[id] — cascade handles Tasks, Logs, PointsLedger

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ChallengeStatus } from "@prisma/client";
import { ensureTodayLog } from "@/lib/ensureTodayLog";

// ─── GET /api/challenges/[id] ────────────────────────────────────────────────

type Params = Promise<{ id: string }>;

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const challengeBasic = await prisma.challenge.findUnique({
      where: { id },
      select: { id: true, userId: true, startDate: true, totalDays: true },
    });

    if (!challengeBasic) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    // Only the owner can view their challenge
    if (challengeBasic.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // For open-ended challenges, lazily create today's log if it does not exist yet
    if (challengeBasic.totalDays === null) {
      await ensureTodayLog(challengeBasic);
    }

    const challenge = await prisma.challenge.findUnique({
      where: { id },
      include: {
        logs: {
          orderBy: { dayNumber: "asc" },
          select: {
            id: true,
            dayNumber: true,
            date: true,
            tasksTotal: true,
            tasksDone: true,
            completionPct: true,
            note: true,
          },
        },
      },
    });

    return Response.json({ challenge });
  } catch (err) {
    console.error("GET /api/challenges/[id] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ─── PATCH /api/challenges/[id] ──────────────────────────────────────────────

type PatchChallengeBody = {
  title?: string;
  status?: ChallengeStatus;
  // totalDays and startDate are explicitly forbidden post-creation
  totalDays?: unknown;
  startDate?: unknown;
};

const VALID_STATUSES: ChallengeStatus[] = [
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ABANDONED",
];

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  let body: PatchChallengeBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Explicitly reject immutable fields — changing them would desync day numbering
  if ("totalDays" in body || "startDate" in body) {
    return Response.json(
      {
        error:
          "totalDays and startDate cannot be changed after creation: doing so would desync day numbering.",
      },
      { status: 422 }
    );
  }

  // Validate allowed fields
  const update: { title?: string; status?: ChallengeStatus } = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim().length === 0) {
      return Response.json(
        { error: "title must be a non-empty string" },
        { status: 422 }
      );
    }
    update.title = body.title.trim();
  }

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as ChallengeStatus)) {
      return Response.json(
        { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 422 }
      );
    }
    update.status = body.status as ChallengeStatus;
  }

  if (Object.keys(update).length === 0) {
    return Response.json(
      { error: "No valid fields to update (allowed: title, status)" },
      { status: 422 }
    );
  }

  try {
    const existing = await prisma.challenge.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    const challenge = await prisma.challenge.update({
      where: { id },
      data: update,
    });

    return Response.json({ challenge });
  } catch (err) {
    console.error("PATCH /api/challenges/[id] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ─── DELETE /api/challenges/[id] ─────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const existing = await prisma.challenge.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }
    if (existing.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    // Cascade in schema handles: Log, Task, TaskTag, PointsLedger
    await prisma.challenge.delete({ where: { id } });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("DELETE /api/challenges/[id] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
