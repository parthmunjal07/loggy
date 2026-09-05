// app/api/challenges/[id]/recurring-tasks/[recurringTaskId]/route.ts
//
// PATCH /api/challenges/[id]/recurring-tasks/[recurringTaskId] — edit title/tags or toggle isActive
// Affects future day spawns only. Does not retroactively alter or delete already-spawned tasks.

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string; recurringTaskId: string }>;

type PatchRecurringTaskBody = {
  title?: string;
  isActive?: boolean;
  tagIds?: string[];
};

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id: challengeId, recurringTaskId } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { userId: true },
  });

  if (!challenge) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }
  if (challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  const existingTemplate = await prisma.recurringTask.findUnique({
    where: { id: recurringTaskId },
    select: { id: true, challengeId: true },
  });

  if (!existingTemplate || existingTemplate.challengeId !== challengeId) {
    return Response.json({ error: "Recurring task not found" }, { status: 404 });
  }

  let body: PatchRecurringTaskBody;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { title, isActive, tagIds } = body;

  const updateData: { title?: string; isActive?: boolean } = {};

  if (title !== undefined) {
    if (typeof title !== "string" || title.trim().length === 0) {
      return Response.json({ error: "title must be a non-empty string" }, { status: 422 });
    }
    updateData.title = title.trim();
  }

  if (isActive !== undefined) {
    if (typeof isActive !== "boolean") {
      return Response.json({ error: "isActive must be a boolean" }, { status: 422 });
    }
    updateData.isActive = isActive;
  }

  if (tagIds !== undefined && !Array.isArray(tagIds)) {
    return Response.json({ error: "tagIds must be an array" }, { status: 422 });
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      if (tagIds !== undefined) {
        // Replace existing tags
        await tx.recurringTaskTag.deleteMany({
          where: { recurringTaskId },
        });

        if (tagIds.length > 0) {
          await tx.recurringTaskTag.createMany({
            data: tagIds.map((tagId) => ({ recurringTaskId, tagId })),
          });
        }
      }

      return await tx.recurringTask.update({
        where: { id: recurringTaskId },
        data: updateData,
        include: {
          tags: {
            include: { tag: { select: { id: true, name: true } } },
          },
          _count: {
            select: { tasks: true },
          },
        },
      });
    });

    return Response.json({ recurringTask: updated });
  } catch (err) {
    console.error("PATCH recurring-tasks error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
