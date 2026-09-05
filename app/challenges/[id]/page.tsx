import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { ensureTodayLog } from "@/lib/ensureTodayLog";
import { ChallengeDetailClient } from "./ChallengeDetailClient";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ today?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: challenge ? `${challenge.title} - Loggy` : "Challenge - Loggy",
  };
}

export default async function ChallengePage({ params, searchParams }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const challengeBasic = await prisma.challenge.findUnique({
    where: { id },
    select: { id: true, userId: true, startDate: true, totalDays: true },
  });

  if (!challengeBasic) notFound();
  if (challengeBasic.userId !== userId) redirect("/dashboard");

  // For open-ended challenges, lazily create today's log row if missing
  if (challengeBasic.totalDays === null) {
    await ensureTodayLog(challengeBasic);
  }

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      logs: {
        orderBy: { dayNumber: "asc" },
        include: {
          tasks: {
            where: { status: "DONE" },
            include: {
              tags: {
                include: { tag: { select: { id: true, name: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!challenge) notFound();

  const logs = challenge.logs.map((l) => {
    // Extract distinct tags from completed tasks only
    const tagMap = new Map<string, { id: string; name: string }>();
    for (const t of l.tasks) {
      for (const tt of t.tags) {
        tagMap.set(tt.tag.id, tt.tag);
      }
    }

    return {
      id: l.id,
      dayNumber: l.dayNumber,
      date: l.date.toISOString(),
      completionPct: l.completionPct,
      tasksTotal: l.tasksTotal,
      tasksDone: l.tasksDone,
      note: l.note,
      completedTags: Array.from(tagMap.values()),
    };
  });

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const todayLog = challenge.logs.find((l) => {
    const d = new Date(l.date);
    d.setUTCHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });

  const shouldOpenToday =
    resolvedSearchParams.today === "true" ||
    (challenge.totalDays === null && challenge.logs.length <= 1);

  const initialActiveLogId = shouldOpenToday ? todayLog?.id ?? null : null;

  return (
    <>
      <AppNav />
      <ChallengeDetailClient
        challengeId={challenge.id}
        title={challenge.title}
        totalDays={challenge.totalDays}
        currentStreak={challenge.currentStreak}
        longestStreak={challenge.longestStreak}
        logs={logs}
        initialActiveLogId={initialActiveLogId}
      />
    </>
  );
}
