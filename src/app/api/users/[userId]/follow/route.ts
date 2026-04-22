import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!currentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { userId: targetUserId } = await params;

    if (currentUser.id === targetUserId)
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser)
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow)
      return NextResponse.json(
        { error: "Already following this user" },
        { status: 409 }
      );

    const follow = await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    });

    await prisma.notification.create({
      data: {
        recipientId: targetUserId,
        actorId: currentUser.id,
        type: "FOLLOW",
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error) {
    console.error("Error following user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const currentUser = await prisma.user.findUnique({
      where: { clerkId },
    });
    if (!currentUser)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { userId: targetUserId } = await params;

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });

    if (!existingFollow)
      return NextResponse.json(
        { error: "Not following this user" },
        { status: 404 }
      );

    await prisma.follow.delete({
      where: { id: existingFollow.id },
    });

    return NextResponse.json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Error unfollowing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
