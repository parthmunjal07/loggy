// app/challenges/[id]/day/[logId]/page.tsx
// Phase 5: Dedicated server component for Day Kanban view.

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { isTodayOrFuture } from "@/lib/recompute";
import { DayPageClient } from "./DayPageClient";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string; logId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { logId } = await params;
  const log = await prisma.log.findUnique({
    where: { id: logId },
    select: {
      dayNumber: true,
      challenge: { select: { title: true } },
    },
  });

  if (!log) return { title: "Day View - Loggy" };

  return {
    title: `Day ${log.dayNumber} - ${log.challenge.title} - Loggy`,
  };
}

export default async function DayKanbanPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id: challengeId, logId } = await params;

  const log = await prisma.log.findUnique({
    where: { id: logId },
    include: {
      challenge: {
        select: {
          id: true,
          title: true,
          userId: true,
          totalDays: true,
        },
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

  if (!log || log.challengeId !== challengeId) {
    notFound();
  }

  if (log.challenge.userId !== userId) {
    redirect("/dashboard");
  }

  const [prevLog, nextLog] = await Promise.all([
    prisma.log.findFirst({
      where: { challengeId, dayNumber: log.dayNumber - 1 },
      select: { id: true, dayNumber: true },
    }),
    prisma.log.findFirst({
      where: { challengeId, dayNumber: log.dayNumber + 1 },
      select: { id: true, dayNumber: true },
    }),
  ]);

  const isLocked = !isTodayOrFuture(log.date);

  const serializedTasks = log.tasks.map((task) => ({
    ...task,
    createdAt: task.createdAt.toISOString(),
  }));

  return (
    <>
      <AppNav />
      <DayPageClient
        challengeId={challengeId}
        challengeTitle={log.challenge.title}
        logId={log.id}
        dayNumber={log.dayNumber}
        date={log.date.toISOString()}
        isLocked={isLocked}
        initialCompletionPct={log.completionPct}
        initialTasksTotal={log.tasksTotal}
        initialTasksDone={log.tasksDone}
        initialNote={log.note}
        tasks={serializedTasks}
        prevLogId={prevLog?.id}
        prevDayNumber={prevLog?.dayNumber}
        nextLogId={nextLog?.id}
        nextDayNumber={nextLog?.dayNumber}
      />
    </>
  );
}
