// app/welcome/page.tsx
// First-run onboarding choice screen.
// Displayed exclusively when a user has zero challenges.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AppNav } from "@/components/AppNav";
import { WelcomeChoiceClient } from "./WelcomeChoiceClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get Started - Loggy",
  description: "Choose how you want to start logging your daily progress.",
};

export default async function WelcomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Gate check: If user already has challenges, send them directly to dashboard
  const count = await prisma.challenge.count({
    where: { userId },
  });

  if (count > 0) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: "var(--surface-0)" }}>
      <AppNav />
      <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-12 sm:py-20 flex flex-col justify-center">
        <WelcomeChoiceClient />
      </main>
    </div>
  );
}
