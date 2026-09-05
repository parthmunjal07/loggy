// app/challenges/[id]/settings/page.tsx
// Challenge Settings: metadata management and recurring task templates.

import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { ChallengeSettingsClient } from "./ChallengeSettingsClient";
import type { Metadata } from "next";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: challenge ? `Settings: ${challenge.title} - Loggy` : "Challenge Settings - Loggy",
  };
}

export default async function ChallengeSettingsPage({ params }: Props) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      recurringTasks: {
        orderBy: { createdAt: "desc" },
        include: {
          tags: {
            include: { tag: { select: { id: true, name: true } } },
          },
          _count: {
            select: { tasks: true },
          },
        },
      },
    },
  });

  if (!challenge) notFound();
  if (challenge.userId !== userId) redirect("/dashboard");

  const availableTags = await prisma.tag.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  const serializedRecurringTasks = challenge.recurringTasks.map((rt) => ({
    id: rt.id,
    title: rt.title,
    isActive: rt.isActive,
    createdAt: rt.createdAt.toISOString(),
    tags: rt.tags.map((t) => ({ tag: t.tag })),
    tasksCount: rt._count.tasks,
  }));

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--surface-0)" }}>
      <AppNav />
      <main className="flex-1 max-w-4xl mx-auto w-full px-5 py-8 sm:py-12">
        <ChallengeSettingsClient
          challengeId={challenge.id}
          initialTitle={challenge.title}
          totalDays={challenge.totalDays}
          startDate={challenge.startDate.toISOString()}
          status={challenge.status}
          initialRecurringTasks={serializedRecurringTasks}
          availableTags={availableTags}
        />
      </main>
    </div>
  );
}
