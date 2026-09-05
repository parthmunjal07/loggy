// lib/ensureTodayLog.ts
// Server-side lazy log row creation for open-ended challenges.
// If an open-ended challenge (totalDays === null) does not have a Log row
// for today's date, this creates it on the fly.

import { prisma } from "@/lib/prisma";

export async function ensureTodayLog(challenge: {
  id: string;
  startDate: Date;
  totalDays: number | null;
}) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // 1. Check if today's log already exists
  const existing = await prisma.log.findFirst({
    where: {
      challengeId: challenge.id,
      date: today,
    },
  });

  if (existing) {
    return existing;
  }

  // Only open-ended challenges lazily create log rows
  if (challenge.totalDays !== null) {
    return null;
  }

  // 2. Compute dayNumber = calendar days since startDate + 1
  const start = new Date(challenge.startDate);
  start.setUTCHours(0, 0, 0, 0);
  const msPerDay = 1000 * 60 * 60 * 24;
  const dayNumber = Math.max(
    1,
    Math.floor((today.getTime() - start.getTime()) / msPerDay) + 1
  );

  // 3. Create today's log row with concurrency protection
  try {
    const created = await prisma.$transaction(async (tx) => {
      const newLog = await tx.log.create({
        data: {
          challengeId: challenge.id,
          dayNumber,
          date: today,
        },
      });

      // Query active recurring tasks for this challenge
      const activeTemplates = await tx.recurringTask.findMany({
        where: { challengeId: challenge.id, isActive: true },
        include: { tags: true },
      });

      if (activeTemplates.length > 0) {
        for (const template of activeTemplates) {
          await tx.task.create({
            data: {
              logId: newLog.id,
              title: template.title,
              status: "TODO",
              recurringTaskId: template.id,
              ...(template.tags.length > 0 && {
                tags: {
                  create: template.tags.map((rt) => ({ tagId: rt.tagId })),
                },
              }),
            },
          });
        }

        await tx.log.update({
          where: { id: newLog.id },
          data: {
            tasksTotal: activeTemplates.length,
            tasksDone: 0,
            completionPct: 0,
          },
        });
      }

      return newLog;
    });

    return created;
  } catch {
    // If a concurrent request created it simultaneously, return the existing row
    return await prisma.log.findFirst({
      where: {
        challengeId: challenge.id,
        date: today,
      },
    });
  }
}
