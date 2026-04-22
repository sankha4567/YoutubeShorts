import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { shortId } = await req.json();

    if (!shortId) {
      return NextResponse.json(
        { error: "shortId is required" },
        { status: 400 }
      );
    }

    const short = await prisma.short.findUnique({ where: { id: shortId } });
    if (!short)
      return NextResponse.json({ error: "Short not found" }, { status: 404 });

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const shareLink = await prisma.shareLink.create({
      data: {
        token,
        userId: user.id,
        shortId,
        expiresAt,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${appUrl}/api/shares/${token}`;

    // Increment share count on the short
    await prisma.short.update({
      where: { id: shortId },
      data: { shareCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        token: shareLink.token,
        url: shareUrl,
        expiresAt: shareLink.expiresAt,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating share link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
