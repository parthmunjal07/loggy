// app/api/logs/[logId]/tasks/route.ts
//
// POST /api/logs/[logId]/tasks — create a task under a specific day.
// Rejects if the log's date is in the past (locked).
// Does NOT run recompute — a new TODO task doesn't change completionPct.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { isTodayOrFuture } from "@/lib/recompute";

type Params = Promise<{ logId: string }>;

type CreateTaskBody = {
  title: string;
  tagIds?: string[];
};

export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { logId } = await params;

  // ── Ownership + lock check ────────────────────────────────────────────────
  const log = await prisma.log.findUnique({
    where: { id: logId },
    select: {
      date: true,
      challenge: { select: { userId: true, id: true } },
    },
  });

  if (!log) return Response.json({ error: "Not found" }, { status: 404 });
  if (log.challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isTodayOrFuture(log.date)) {
    return Response.json(
      { error: "This day is locked: past logs cannot be edited." },
      { status: 423 }
    );
  }

  // ── Parse + validate body ─────────────────────────────────────────────────
  let body: CreateTaskBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { title, tagIds = [] } = body;

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return Response.json({ error: "title is required" }, { status: 422 });
  }
  if (!Array.isArray(tagIds)) {
    return Response.json({ error: "tagIds must be an array" }, { status: 422 });
  }

  // ── Create task ───────────────────────────────────────────────────────────
  try {
    const task = await prisma.task.create({
      data: {
        logId,
        title: title.trim(),
        ...(tagIds.length > 0 && {
          tags: {
            create: tagIds.map((tagId: string) => ({ tagId })),
          },
        }),
      },
      include: {
        tags: {
          include: { tag: { select: { id: true, name: true } } },
        },
      },
    });

    return Response.json({ task }, { status: 201 });
  } catch (err) {
    console.error("POST /api/logs/[logId]/tasks error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
