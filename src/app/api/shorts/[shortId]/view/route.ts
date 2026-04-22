import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;
    const { userId: clerkId } = await auth();

    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if this user already viewed this short
    const existingView = await prisma.view.findUnique({
      where: {
        userId_shortId: {
          userId: user.id,
          shortId,
        },
      },
    });

    // Only increment viewCount if this is a new unique view
    if (!existingView) {
      await prisma.view.create({
        data: {
          userId: user.id,
          shortId,
        },
      });

      const short = await prisma.short.update({
        where: { id: shortId },
        data: { viewCount: { increment: 1 } },
      });

      return NextResponse.json({ viewCount: short.viewCount, newView: true });
    }

    // Already viewed — just return current count
    const short = await prisma.short.findUnique({
      where: { id: shortId },
      select: { viewCount: true },
    });

    return NextResponse.json({ viewCount: short?.viewCount ?? 0, newView: false });
  } catch (error) {
    console.error("Error tracking view:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
