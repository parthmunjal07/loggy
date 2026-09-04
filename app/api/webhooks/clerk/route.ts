// app/api/webhooks/clerk/route.ts
// Handles Clerk webhook events. Verifies the svix signature before trusting
// the payload, then creates/updates User rows in Postgres.

import { headers } from "next/headers";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

type ClerkUserPayload = {
  id: string;
  email_addresses: { email_address: string; primary: boolean }[];
  username: string | null;
};

type WebhookEvent = {
  type: string;
  data: ClerkUserPayload;
};

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return new Response("Server misconfiguration", { status: 500 });
  }

  // Collect the raw body and the four svix signature headers
  const payload = await request.text();
  const headerStore = await headers();

  const svixId = headerStore.get("svix-id");
  const svixTimestamp = headerStore.get("svix-timestamp");
  const svixSignature = headerStore.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("Missing svix headers", { status: 400 });
  }

  // Verify the webhook signature
  const wh = new Webhook(webhookSecret);
  let event: WebhookEvent;

  try {
    event = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as unknown as WebhookEvent;
  } catch (err) {
    console.error("Svix signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // Handle user.created — insert the User row
  if (event.type === "user.created") {
    const { id, email_addresses, username } = event.data;

    const primaryEmail = email_addresses.find((e) => e.primary)?.email_address;

    if (!primaryEmail) {
      return new Response("No primary email in payload", { status: 422 });
    }

    try {
      await prisma.user.upsert({
        where: { id },
        update: { email: primaryEmail, username: username ?? null },
        create: { id, email: primaryEmail, username: username ?? null },
      });
    } catch (err) {
      console.error("Failed to upsert user:", err);
      return new Response("Database error", { status: 500 });
    }
  }

  return new Response("OK", { status: 200 });
}
