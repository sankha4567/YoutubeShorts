import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error("CLERK_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Get the Svix headers
  const svix_id = req.headers.get("svix-id");
  const svix_timestamp = req.headers.get("svix-timestamp");
  const svix_signature = req.headers.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error("Missing svix headers");
    return NextResponse.json(
      { error: "Missing webhook headers" },
      { status: 400 }
    );
  }

  // Get the raw body
  const body = await req.text();

  // Verify the webhook signature
  const wh = new Webhook(WEBHOOK_SECRET);
  let payload: { type: string; data: Record<string, unknown> };

  try {
    payload = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const { type, data } = payload;
  console.log(`[Clerk Webhook] Event: ${type}`);

  try {
    if (type === "user.created") {
      const {
        id,
        email_addresses,
        username,
        first_name,
        last_name,
        image_url,
      } = data as {
        id: string;
        email_addresses: { email_address: string }[];
        username: string | null;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const email = email_addresses?.[0]?.email_address;
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || null;
      const uname = username || email?.split("@")[0] || id;

      const user = await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          username: uname,
          name,
          profilePictureUrl: image_url,
        },
        create: {
          clerkId: id,
          email: email!,
          username: uname,
          name,
          profilePictureUrl: image_url,
        },
      });

      console.log(`[Clerk Webhook] User created in DB: ${user.id} (${uname})`);
    }

    if (type === "user.updated") {
      const {
        id,
        email_addresses,
        username,
        first_name,
        last_name,
        image_url,
      } = data as {
        id: string;
        email_addresses: { email_address: string }[];
        username: string | null;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
      };

      const email = email_addresses?.[0]?.email_address;
      const name =
        [first_name, last_name].filter(Boolean).join(" ") || null;

      const user = await prisma.user.update({
        where: { clerkId: id },
        data: {
          email,
          username: username || undefined,
          name,
          profilePictureUrl: image_url,
        },
      });

      console.log(`[Clerk Webhook] User updated in DB: ${user.id}`);
    }

    if (type === "user.deleted") {
      const { id } = data as { id: string };

      // Delete user's ImageKit files before removing from DB
      const user = await prisma.user.findUnique({
        where: { clerkId: id },
        include: { shorts: { select: { imageKitFileId: true } } },
      });

      if (user) {
        // Note: ImageKit cleanup happens here too for webhook-triggered deletions
        await prisma.user.delete({ where: { id: user.id } });
        console.log(`[Clerk Webhook] User deleted from DB: ${user.id}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[Clerk Webhook] Error processing ${type}:`, error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
