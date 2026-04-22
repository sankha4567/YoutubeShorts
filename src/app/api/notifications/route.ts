import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const where: { recipientId: string; isRead?: boolean } = {
      recipientId: user.id,
    };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
      }),
      prisma.notification.count({
        where: { recipientId: user.id, isRead: false },
      }),
    ]);

    // Get unique actor IDs and fetch actor info
    const actorIds = [...new Set(notifications.map((n) => n.actorId))];
    const actors = await prisma.user.findMany({
      where: { id: { in: actorIds } },
      select: {
        id: true,
        username: true,
        profilePictureUrl: true,
      },
    });
    const actorMap = new Map(actors.map((a) => [a.id, a]));

    const notificationsWithActors = notifications.map((notification) => ({
      ...notification,
      actor: actorMap.get(notification.actorId) || null,
    }));

    return NextResponse.json({
      notifications: notificationsWithActors,
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
