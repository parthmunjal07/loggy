// app/api/tasks/[taskId]/route.ts
//
// PATCH  /api/tasks/[taskId] — the core Kanban mutation.
//   Accepts: { status?, tagIds? }
//   After mutation, runs the full recompute pipeline in a single transaction.
//
// DELETE /api/tasks/[taskId] — remove a task, then run full recompute.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { recomputeLogAndChallenge, isTodayOrFuture } from "@/lib/recompute";
import { TaskStatus } from "@prisma/client";

type Params = Promise<{ taskId: string }>;

const VALID_STATUSES: TaskStatus[] = ["TODO", "IN_PROGRESS", "DONE"];

// ─── Shared: load task with ownership context ──────────────────────────────

async function loadTaskWithOwnership(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      logId: true,
      status: true,
      log: {
        select: {
          date: true,
          challengeId: true,
          challenge: { select: { userId: true } },
        },
      },
    },
  });
}

// ─── PATCH /api/tasks/[taskId] ────────────────────────────────────────────────

type PatchTaskBody = {
  status?: TaskStatus;
  tagIds?: string[];
};

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { taskId } = await params;

  const task = await loadTaskWithOwnership(taskId);

  if (!task) return Response.json({ error: "Not found" }, { status: 404 });
  if (task.log.challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isTodayOrFuture(task.log.date)) {
    return Response.json(
      { error: "This day is locked: past logs cannot be edited." },
      { status: 423 }
    );
  }

  let body: PatchTaskBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // ── Validate ──────────────────────────────────────────────────────────────
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    return Response.json(
      { error: `status must be one of: ${VALID_STATUSES.join(", ")}` },
      { status: 422 }
    );
  }
  if (body.tagIds !== undefined && !Array.isArray(body.tagIds)) {
    return Response.json({ error: "tagIds must be an array" }, { status: 422 });
  }
  if (body.status === undefined && body.tagIds === undefined) {
    return Response.json(
      { error: "Provide at least one of: status, tagIds" },
      { status: 422 }
    );
  }

  // ── Transaction: mutate + recompute ───────────────────────────────────────
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update task status
      if (body.status !== undefined) {
        await tx.task.update({
          where: { id: taskId },
          data: { status: body.status },
        });
      }

      // 2. Replace tag set (delete-all + re-insert)
      if (body.tagIds !== undefined) {
        await tx.taskTag.deleteMany({ where: { taskId } });
        if (body.tagIds.length > 0) {
          await tx.taskTag.createMany({
            data: body.tagIds.map((tagId) => ({ taskId, tagId })),
            skipDuplicates: true,
          });
        }
      }

      // 3. Recompute Log, Challenge, PointsLedger (shared pipeline)
      const recomputed = await recomputeLogAndChallenge(tx, task.logId);

      // 4. Return the updated task for the UI to optimistically confirm
      const updatedTask = await tx.task.findUnique({
        where: { id: taskId },
        include: {
          tags: {
            include: { tag: { select: { id: true, name: true } } },
          },
        },
      });

      return { task: updatedTask, ...recomputed };
    });

    return Response.json(result);
  } catch (err) {
    console.error("PATCH /api/tasks/[taskId] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ─── DELETE /api/tasks/[taskId] ───────────────────────────────────────────────

export async function DELETE(
  _req: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { taskId } = await params;

  const task = await loadTaskWithOwnership(taskId);

  if (!task) return Response.json({ error: "Not found" }, { status: 404 });
  if (task.log.challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }
  if (!isTodayOrFuture(task.log.date)) {
    return Response.json(
      { error: "This day is locked: past logs cannot be edited." },
      { status: 423 }
    );
  }

  // ── Transaction: delete + recompute ───────────────────────────────────────
  try {
    const result = await prisma.$transaction(async (tx) => {
      const logId = task.logId;

      // TaskTag rows cascade-delete via schema; deleting the task is enough.
      await tx.task.delete({ where: { id: taskId } });

      // Run the same recompute pipeline — deletion may change completionPct
      const recomputed = await recomputeLogAndChallenge(tx, logId);

      return recomputed;
    });

    return Response.json(result);
  } catch (err) {
    console.error("DELETE /api/tasks/[taskId] error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
