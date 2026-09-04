// app/challenges/[id]/page.tsx — Challenge detail: full heatmap
// Server component — fetches challenge + all logs directly via Prisma.

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { ChallengeDetailClient } from "./ChallengeDetailClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

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

export default async function ChallengePage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

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
  if (challenge.userId !== userId) redirect("/dashboard");

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
      />
    </>
  );
}
