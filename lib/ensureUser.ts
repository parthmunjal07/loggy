// lib/ensureUser.ts
// Helper to ensure a User row exists in Postgres for the given Clerk userId.
// Prevents P2003 foreign key errors in dev when webhooks haven't fired.

import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function ensureUserInDb(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (existing) return existing;

  let primaryEmail = `${userId}@example.com`;
  let username: string | null = null;

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        primaryEmail;

      username = clerkUser.username || clerkUser.firstName?.toLowerCase() || null;
    }
  } catch (err) {
    console.error("Failed to fetch Clerk currentUser details:", err);
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: primaryEmail,
      username: username || undefined,
    },
    create: {
      id: userId,
      email: primaryEmail,
      username,
    },
    select: { id: true, email: true, username: true },
  });
}
