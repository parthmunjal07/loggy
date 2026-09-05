// lib/ensureUser.ts
// Helper to ensure a User row exists in Postgres for the given Clerk userId.
// Prevents P2003 foreign key errors in dev when webhooks haven't fired.

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

/**
 * Resolves a safe, collision-free username for a user.
 * If the preferred username is already claimed by another user in the database,
 * an incremental suffix (_1, _2, etc.) is appended until an unused username is found.
 */
export async function resolveUniqueUsername(
  preferred: string | null | undefined,
  currentUserId: string,
  fallbackSeed?: string
): Promise<string> {
  const seed = preferred || fallbackSeed || "user";
  const base =
    seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "")
      .slice(0, 16) || "user";

  // Check if current user already owns this username
  const existingSelf = await prisma.user.findFirst({
    where: { username: base, id: currentUserId },
  });
  if (existingSelf) return base;

  // Check if it is completely untaken
  const existingOther = await prisma.user.findFirst({
    where: { username: base, NOT: { id: currentUserId } },
  });
  if (!existingOther) return base;

  // Try appending incremental suffixes: base_1, base_2, ...
  for (let i = 1; i <= 100; i++) {
    const candidate = `${base.slice(0, 12)}_${i}`;
    const taken = await prisma.user.findFirst({
      where: { username: candidate, NOT: { id: currentUserId } },
    });
    if (!taken) return candidate;
  }

  // Fallback random suffix
  return `${base.slice(0, 8)}_${Math.random().toString(36).slice(2, 6)}`;
}

export async function ensureUserInDb(userId: string) {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, username: true },
  });

  if (existing && existing.username && !existing.email.endsWith("@example.com")) {
    return existing;
  }

  let primaryEmail = `${userId}@example.com`;
  let rawUsername: string | null = null;
  let firstName: string | null = null;

  try {
    let clerkUser: {
      emailAddresses: { id: string; emailAddress: string }[];
      primaryEmailAddressId: string | null;
      username: string | null;
      firstName: string | null;
    } | null = null;

    try {
      clerkUser = await currentUser();
    } catch {
      // currentUser may throw outside React server component context
    }

    if (!clerkUser) {
      const client = await clerkClient();
      const u = await client.users.getUser(userId);
      if (u) {
        clerkUser = {
          emailAddresses: u.emailAddresses.map((e) => ({
            id: e.id,
            emailAddress: e.emailAddress,
          })),
          primaryEmailAddressId: u.primaryEmailAddressId,
          username: u.username,
          firstName: u.firstName,
        };
      }
    }

    if (clerkUser) {
      primaryEmail =
        clerkUser.emailAddresses.find(
          (e) => e.id === clerkUser.primaryEmailAddressId
        )?.emailAddress ||
        clerkUser.emailAddresses[0]?.emailAddress ||
        primaryEmail;

      rawUsername = clerkUser.username || null;
      firstName = clerkUser.firstName || null;
    }
  } catch (err) {
    console.error("Failed to fetch Clerk user details:", err);
  }

  const emailPrefix = primaryEmail.split("@")[0] || "user";
  const preferredSeed = rawUsername || firstName?.toLowerCase() || emailPrefix;
  const uniqueUsername = await resolveUniqueUsername(preferredSeed, userId, emailPrefix);

  // Guard against dev scenario where an email was previously linked to an older deleted Clerk user ID
  const existingWithEmail = await prisma.user.findUnique({
    where: { email: primaryEmail },
  });

  if (existingWithEmail && existingWithEmail.id !== userId) {
    const oldUserChallenges = await prisma.challenge.count({
      where: { userId: existingWithEmail.id },
    });

    if (oldUserChallenges === 0) {
      await prisma.user.update({
        where: { id: existingWithEmail.id },
        data: { email: `${existingWithEmail.id}@archived.local` },
      });
    } else {
      await prisma.$transaction([
        prisma.challenge.updateMany({
          where: { userId: existingWithEmail.id },
          data: { userId },
        }),
        prisma.user.update({
          where: { id: existingWithEmail.id },
          data: { email: `${existingWithEmail.id}@archived.local` },
        }),
      ]);
    }
  }

  return prisma.user.upsert({
    where: { id: userId },
    update: {
      email: primaryEmail,
      username: uniqueUsername,
    },
    create: {
      id: userId,
      email: primaryEmail,
      username: uniqueUsername,
    },
    select: { id: true, email: true, username: true },
  });
}
