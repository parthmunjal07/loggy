// app/dashboard/page.tsx — Dashboard: active challenges grid
// Server component — fetches challenges directly via Prisma (no API round-trip).

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { ChallengeCard } from "@/components/ChallengeCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Loggy",
  description: "Your active challenges and progress heatmaps.",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const challenges = await prisma.challenge.findMany({
    where: { userId, status: { in: ["ACTIVE", "PAUSED"] } },
    orderBy: { createdAt: "desc" },
    include: {
      logs: {
        orderBy: { dayNumber: "asc" },
        select: {
          id: true,
          dayNumber: true,
          date: true,
          completionPct: true,
        },
      },
    },
  });

  const now = new Date();

  const enriched = challenges.map((c) => {
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysElapsed = Math.min(
      c.totalDays,
      Math.max(
        0,
        Math.floor((now.getTime() - c.startDate.getTime()) / msPerDay) + 1
      )
    );
    const daysWithProgress = c.logs.filter((l) => l.completionPct > 0).length;

    return {
      ...c,
      daysElapsed,
      daysWithProgress,
      logs: c.logs.map((l) => ({
        ...l,
        date: l.date.toISOString(),
      })),
    };
  });

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold tracking-tight mb-1"
            style={{ color: "var(--text-primary)" }}
          >
            Your challenges
          </h1>
          <p
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            {enriched.length === 0
              ? "Start your first challenge to see your heatmap."
              : `${enriched.length} active`}
          </p>
        </div>

        <Link
          href="/challenges/new"
          id="new-challenge-btn"
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97]"
          style={{
            background: "var(--accent)",
            color: "var(--surface-0)",
          }}
        >
          <Plus size={15} weight="bold" />
          New challenge
        </Link>
      </div>

      {/* Challenges grid */}
      {enriched.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {enriched.map((c, i) => (
            <ChallengeCard
              key={c.id}
              id={c.id}
              title={c.title}
              totalDays={c.totalDays}
              daysElapsed={c.daysElapsed}
              daysWithProgress={c.daysWithProgress}
              currentStreak={c.currentStreak}
              status={c.status}
              logs={c.logs}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl py-20 px-8 text-center"
      style={{
        background: "var(--surface-1)",
        border: "1px dashed var(--border)",
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: "var(--accent-subtle)" }}
      >
        <Plus size={22} style={{ color: "var(--accent)" }} />
      </div>
      <h2
        className="text-base font-semibold mb-1.5"
        style={{ color: "var(--text-primary)" }}
      >
        No challenges yet
      </h2>
      <p
        className="text-sm mb-6 max-w-[280px]"
        style={{ color: "var(--text-muted)" }}
      >
        Pick a commitment: 30 days, 100 days, or whatever it takes. Plan your
        days on the Kanban board and watch the heatmap fill in.
      </p>
      <Link
        href="/challenges/new"
        id="empty-state-new-challenge-btn"
        className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150 active:scale-[0.97]"
        style={{
          background: "var(--accent)",
          color: "var(--surface-0)",
        }}
      >
        Start a challenge
      </Link>
    </div>
  );
}
