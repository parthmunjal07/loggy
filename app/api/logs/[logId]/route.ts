// app/api/logs/[logId]/route.ts
//
// GET   /api/logs/[logId] — full day view: log metadata + all tasks with tags.
//                           Consumed by both the Kanban board and the sheet view.
// PATCH /api/logs/[logId] — the ONE manual write path on a Log: the note field only.
//                           Explicitly rejects any other field.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ logId: string }>;

// ─── GET /api/logs/[logId] ────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { logId } = await params;

  const log = await prisma.log.findUnique({
    where: { id: logId },
    include: {
      challenge: {
        select: { id: true, title: true, userId: true, status: true },
      },
      tasks: {
        orderBy: { createdAt: "asc" },
        include: {
          tags: {
            include: { tag: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  if (!log) return Response.json({ error: "Not found" }, { status: 404 });
  if (log.challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  return Response.json({ log });
}

// ─── PATCH /api/logs/[logId] ──────────────────────────────────────────────────

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { logId } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Reject any field that isn't 'note' — completionPct, tasksTotal, etc. are
  // all derived from tasks and must never be written directly.
  const forbidden = Object.keys(body).filter((k) => k !== "note");
  if (forbidden.length > 0) {
    return Response.json(
      {
        error: `Only 'note' can be updated directly on a Log. Received forbidden fields: ${forbidden.join(", ")}`,
      },
      { status: 422 }
    );
  }

  if (body.note !== null && typeof body.note !== "string") {
    return Response.json(
      { error: "note must be a string or null" },
      { status: 422 }
    );
  }

  // Ownership check
  const log = await prisma.log.findUnique({
    where: { id: logId },
    select: { challenge: { select: { userId: true } } },
  });

  if (!log) return Response.json({ error: "Not found" }, { status: 404 });
  if (log.challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const updated = await prisma.log.update({
    where: { id: logId },
    data: { note: body.note as string | null },
    select: {
      id: true,
      dayNumber: true,
      date: true,
      note: true,
      completionPct: true,
      tasksTotal: true,
      tasksDone: true,
    },
  });

  return Response.json({ log: updated });
}
