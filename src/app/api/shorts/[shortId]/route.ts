import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { shortId } = await params;

    const short = await prisma.short.findUnique({
      where: { id: shortId },
      include: {
        creator: {
          select: {
            id: true,
            clerkId: true,
            username: true,
            name: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    if (!short)
      return NextResponse.json({ error: "Short not found" }, { status: 404 });

    let likeStatus: string | null = null;
    let isFollowing = false;

    const { userId: clerkId } = await auth();
    if (clerkId) {
      const currentUser = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (currentUser) {
        const [like, follow] = await Promise.all([
          prisma.like.findUnique({
            where: {
              userId_shortId: {
                userId: currentUser.id,
                shortId: short.id,
              },
            },
          }),
          prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUser.id,
                followingId: short.creatorId,
              },
            },
          }),
        ]);
        likeStatus = like?.type ?? null;
        isFollowing = !!follow;
      }
    }

    return NextResponse.json({
      ...short,
      likeStatus,
      isFollowing,
    });
  } catch (error) {
    console.error("Error fetching short:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ shortId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { shortId } = await params;

    const short = await prisma.short.findUnique({
      where: { id: shortId },
    });

    if (!short)
      return NextResponse.json({ error: "Short not found" }, { status: 404 });

    if (short.creatorId !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
      await imagekit.deleteFile(short.imageKitFileId);
    } catch (ikError) {
      console.error("Error deleting file from ImageKit:", ikError);
    }

    await prisma.short.delete({
      where: { id: shortId },
    });

    return NextResponse.json({ message: "Short deleted successfully" });
  } catch (error) {
    console.error("Error deleting short:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
