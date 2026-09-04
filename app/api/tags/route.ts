// app/api/tags/route.ts
//
// GET  /api/tags — return preset (global) tags + the current user's own tags
// POST /api/tags — create a user-scoped tag; case-insensitive dedup before insert

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ensureUserInDb } from "@/lib/ensureUser";

// ─── GET /api/tags ────────────────────────────────────────────────────────────

export async function GET() {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const tags = await prisma.tag.findMany({
    where: {
      OR: [
        { userId: null },  // preset / global tags
        { userId },        // user's own tags
      ],
    },
    orderBy: [
      { userId: "asc" },  // presets first (null sorts before values in Postgres asc)
      { name: "asc" },
    ],
    select: { id: true, name: true, userId: true },
  });

  return Response.json({ tags });
}

// ─── POST /api/tags ───────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return new Response("Unauthorized", { status: 401 });

  await ensureUserInDb(userId);

  let body: { name?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { name } = body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return Response.json({ error: "name is required" }, { status: 422 });
  }

  const trimmedName = name.trim();

  // Case-insensitive dedup: check presets AND the user's own tags
  // The DB @unique on `name` is case-sensitive, so we guard in application code.
  const existing = await prisma.tag.findFirst({
    where: {
      name: { equals: trimmedName, mode: "insensitive" },
      OR: [{ userId: null }, { userId }],
    },
    select: { id: true, name: true, userId: true },
  });

  if (existing) {
    // Return the existing tag rather than erroring — idempotent by design
    return Response.json({ tag: existing, created: false }, { status: 200 });
  }

  const tag = await prisma.tag.create({
    data: { name: trimmedName, userId },
    select: { id: true, name: true, userId: true },
  });

  return Response.json({ tag, created: true }, { status: 201 });
}
