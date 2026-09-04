// app/profile/[username]/page.tsx
// Phase 7: Public profile server component (unauthenticated, read-only).

import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { AppNav } from "@/components/AppNav";
import { prisma } from "@/lib/prisma";
import { PublicProfileClient, type PublicChallenge } from "./PublicProfileClient";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ username: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
    select: { username: true },
  });

  if (!user) return { title: "Profile Not Found - Loggy" };

  return {
    title: `@${user.username} - Challenge Journal - Loggy`,
    description: `Track @${user.username}'s habits, verified streaks, and daily reflections on Loggy.`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const { userId: visitorUserId } = await auth();

  const user = await prisma.user.findFirst({
    where: {
      username: { equals: username, mode: "insensitive" },
    },
    include: {
      challenges: {
        orderBy: { createdAt: "desc" },
        include: {
          logs: {
            orderBy: { dayNumber: "asc" },
            include: {
              tasks: {
                where: { status: "DONE" },
                orderBy: { createdAt: "asc" },
                include: {
                  tags: {
                    include: {
                      tag: { select: { id: true, name: true } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      pointsLedger: {
        select: { points: true },
      },
    },
  });

  if (!user) notFound();

  const totalPoints = user.pointsLedger.reduce(
    (sum: number, p: { points: number }) => sum + p.points,
    0
  );

  const serializedChallenges: PublicChallenge[] = user.challenges.map((c: any) => ({
    id: c.id,
    title: c.title,
    totalDays: c.totalDays,
    currentStreak: c.currentStreak,
    longestStreak: c.longestStreak,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    logs: c.logs.map((l: any) => ({
      id: l.id,
      dayNumber: l.dayNumber,
      date: l.date.toISOString(),
      completionPct: l.completionPct,
      tasksTotal: l.tasksTotal,
      tasksDone: l.tasksDone,
      note: l.note,
      completedTasks: l.tasks.map((t: any) => ({
        id: t.id,
        title: t.title,
        tags: t.tags.map((tt: any) => ({
          tag: {
            id: tt.tag.id,
            name: tt.tag.name,
          },
        })),
      })),
    })),
  }));

  return (
    <>
      {visitorUserId && <AppNav />}
      <PublicProfileClient
        username={user.username || username}
        userId={user.id}
        createdAt={user.createdAt.toISOString()}
        totalPoints={totalPoints}
        challenges={serializedChallenges}
        isAuthenticatedVisitor={Boolean(visitorUserId)}
      />
    </>
  );
}
