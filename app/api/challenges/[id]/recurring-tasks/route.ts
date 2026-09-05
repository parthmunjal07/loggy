// app/api/challenges/[id]/recurring-tasks/route.ts
//
// GET  /api/challenges/[id]/recurring-tasks — list templates for this challenge
// POST /api/challenges/[id]/recurring-tasks — create template and instantiate onto today + future days

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>;

// ─── GET /api/challenges/[id]/recurring-tasks ────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!challenge) {
      return Response.json({ error: "Challenge not found" }, { status: 404 });
    }
    if (challenge.userId !== userId) {
      return new Response("Forbidden", { status: 403 });
    }

    const recurringTasks = await prisma.recurringTask.findMany({
      where: { challengeId: id },
      orderBy: { createdAt: "desc" },
      include: {
        tags: {
          include: { tag: { select: { id: true, name: true } } },
        },
        _count: {
          select: { tasks: true },
        },
      },
    });

    return Response.json({ recurringTasks });
  } catch (err) {
    console.error("GET recurring-tasks error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}

// ─── POST /api/challenges/[id]/recurring-tasks ───────────────────────────────

type CreateRecurringTaskBody = {
  title: string;
  tagIds?: string[];
};

export async function POST(
  request: Request,
  { params }: { params: Params }
) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { id: true, userId: true, totalDays: true, startDate: true },
  });

  if (!challenge) {
    return Response.json({ error: "Challenge not found" }, { status: 404 });
  }
  if (challenge.userId !== userId) {
    return new Response("Forbidden", { status: 403 });
  }

  let body: CreateRecurringTaskBody;
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

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the RecurringTask template
      const template = await tx.recurringTask.create({
        data: {
          challengeId: id,
          title: title.trim(),
          isActive: true,
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

      let todayTask = null;

      // 2. Structured challenges: instantiate into all logs where date >= today
      if (challenge.totalDays !== null) {
        const targetLogs = await tx.log.findMany({
          where: {
            challengeId: id,
            date: { gte: today },
          },
          select: { id: true, date: true, tasksTotal: true, tasksDone: true },
        });

        for (const log of targetLogs) {
          const createdTask = await tx.task.create({
            data: {
              logId: log.id,
              title: template.title,
              status: "TODO",
              recurringTaskId: template.id,
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

          const logDate = new Date(log.date);
          logDate.setUTCHours(0, 0, 0, 0);
          if (logDate.getTime() === today.getTime()) {
            todayTask = createdTask;
          }

          const newTotal = log.tasksTotal + 1;
          const newPct = (log.tasksDone / newTotal) * 100;
          await tx.log.update({
            where: { id: log.id },
            data: {
              tasksTotal: newTotal,
              completionPct: newPct,
            },
          });
        }
      } else {
        // 3. Open-ended challenges: if today's log already exists, instantiate into it
        const todayLog = await tx.log.findFirst({
          where: {
            challengeId: id,
            date: today,
          },
          select: { id: true, tasksTotal: true, tasksDone: true },
        });

        if (todayLog) {
          todayTask = await tx.task.create({
            data: {
              logId: todayLog.id,
              title: template.title,
              status: "TODO",
              recurringTaskId: template.id,
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

          const newTotal = todayLog.tasksTotal + 1;
          const newPct = (todayLog.tasksDone / newTotal) * 100;
          await tx.log.update({
            where: { id: todayLog.id },
            data: {
              tasksTotal: newTotal,
              completionPct: newPct,
            },
          });
        }
      }

      return { recurringTask: template, todayTask };
    });

    return Response.json(result, { status: 201 });
  } catch (err) {
    console.error("POST recurring-tasks error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
