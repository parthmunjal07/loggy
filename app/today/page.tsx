import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ensureTodayLog } from "@/lib/ensureTodayLog";
import {
  TodayChallengeSelector,
  type TodayChallengeItem,
} from "./TodayChallengeSelector";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today's Tasks - Loggy",
  description: "Select your active challenge to open today's execution board.",
};

export default async function TodayRedirectPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Fetch all active/paused challenges for the current user
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
          tasksDone: true,
          tasksTotal: true,
        },
      },
    },
  });

  if (challenges.length === 0) {
    redirect("/dashboard");
  }

  const challengeItems: TodayChallengeItem[] = await Promise.all(
    challenges.map(async (c) => {
      let todayLog = c.logs.find((l) => {
        const d = new Date(l.date);
        d.setUTCHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });

      if (!todayLog && c.totalDays === null) {
        const createdLog = await ensureTodayLog(c);
        if (createdLog) {
          todayLog = {
            id: createdLog.id,
            dayNumber: createdLog.dayNumber,
            date: createdLog.date,
            completionPct: createdLog.completionPct,
            tasksDone: createdLog.tasksDone,
            tasksTotal: createdLog.tasksTotal,
          };
        }
      }

      return {
        id: c.id,
        title: c.title,
        totalDays: c.totalDays,
        currentStreak: c.currentStreak,
        todayLogId: todayLog?.id || null,
        todayDayNumber: todayLog?.dayNumber || null,
        todayCompletionPct: todayLog?.completionPct || 0,
        todayTasksDone: todayLog?.tasksDone || 0,
        todayTasksTotal: todayLog?.tasksTotal || 0,
      };
    })
  );

  // If the user has exactly 1 active challenge, automatically redirect to today's board
  if (challengeItems.length === 1 && challengeItems[0].todayLogId) {
    redirect(
      `/challenges/${challengeItems[0].id}/day/${challengeItems[0].todayLogId}`
    );
  }

  // If the user has multiple challenges (or 1 challenge without today's log), display the picker
  return <TodayChallengeSelector challenges={challengeItems} />;
}
