import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { LikeType } from "@/generated/prisma/client";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const { shortId, type } = body as { shortId: string; type: LikeType };

    if (!shortId || !type)
      return NextResponse.json(
        { error: "shortId and type are required" },
        { status: 400 }
      );

    if (type !== "LIKE" && type !== "DISLIKE")
      return NextResponse.json(
        { error: "type must be LIKE or DISLIKE" },
        { status: 400 }
      );

    const short = await prisma.short.findUnique({ where: { id: shortId } });
    if (!short)
      return NextResponse.json({ error: "Short not found" }, { status: 404 });

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_shortId: {
          userId: user.id,
          shortId,
        },
      },
    });

    if (existingLike) {
      if (existingLike.type === type) {
        // Same type: remove the like (toggle off)
        await prisma.like.delete({ where: { id: existingLike.id } });

        const countField =
          type === "LIKE" ? "likeCount" : "dislikeCount";
        await prisma.short.update({
          where: { id: shortId },
          data: { [countField]: { decrement: 1 } },
        });

        return NextResponse.json({ message: "Like removed" });
      } else {
        // Different type: switch
        await prisma.like.update({
          where: { id: existingLike.id },
          data: { type },
        });

        const incrementField =
          type === "LIKE" ? "likeCount" : "dislikeCount";
        const decrementField =
          type === "LIKE" ? "dislikeCount" : "likeCount";

        await prisma.short.update({
          where: { id: shortId },
          data: {
            [incrementField]: { increment: 1 },
            [decrementField]: { decrement: 1 },
          },
        });

        if (type === "LIKE" && short.creatorId !== user.id) {
          await prisma.notification.create({
            data: {
              recipientId: short.creatorId,
              actorId: user.id,
              type: "LIKE",
              shortId,
            },
          });
        }

        return NextResponse.json({ message: "Like switched", type });
      }
    }

    // No existing like: create new
    const like = await prisma.like.create({
      data: {
        userId: user.id,
        shortId,
        type,
      },
    });

    const countField = type === "LIKE" ? "likeCount" : "dislikeCount";
    await prisma.short.update({
      where: { id: shortId },
      data: { [countField]: { increment: 1 } },
    });

    if (type === "LIKE" && short.creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          recipientId: short.creatorId,
          actorId: user.id,
          type: "LIKE",
          shortId,
        },
      });
    }

    return NextResponse.json(like, { status: 201 });
  } catch (error) {
    console.error("Error processing like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await request.json();
    const shortId = body.shortId as string | null;

    if (!shortId)
      return NextResponse.json(
        { error: "shortId is required" },
        { status: 400 }
      );

    const existingLike = await prisma.like.findUnique({
      where: {
        userId_shortId: {
          userId: user.id,
          shortId,
        },
      },
    });

    if (!existingLike)
      return NextResponse.json({ error: "Like not found" }, { status: 404 });

    await prisma.like.delete({ where: { id: existingLike.id } });

    const countField =
      existingLike.type === "LIKE" ? "likeCount" : "dislikeCount";
    await prisma.short.update({
      where: { id: shortId },
      data: { [countField]: { decrement: 1 } },
    });

    return NextResponse.json({ message: "Like removed" });
  } catch (error) {
    console.error("Error removing like:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
