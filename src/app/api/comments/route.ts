import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { shortId, text, parentCommentId } = await req.json();

    if (!shortId || !text) {
      return NextResponse.json(
        { error: "shortId and text are required" },
        { status: 400 }
      );
    }

    const short = await prisma.short.findUnique({ where: { id: shortId } });
    if (!short)
      return NextResponse.json({ error: "Short not found" }, { status: 404 });

    // If replying, validate parent comment exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
      });
      if (!parentComment)
        return NextResponse.json(
          { error: "Parent comment not found" },
          { status: 404 }
        );
    }

    const comment = await prisma.comment.create({
      data: {
        userId: user.id,
        shortId,
        text,
        parentCommentId: parentCommentId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePictureUrl: true,
          },
        },
      },
    });

    // Increment comment count on the short
    await prisma.short.update({
      where: { id: shortId },
      data: { commentCount: { increment: 1 } },
    });

    // Create notification
    if (parentCommentId) {
      // Reply notification - notify the parent comment author
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: { userId: true },
      });
      if (parentComment && parentComment.userId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: parentComment.userId,
            actorId: user.id,
            type: "REPLY",
            shortId,
            commentId: comment.id,
          },
        });
      }
    } else {
      // Comment notification - notify the short creator
      if (short.creatorId !== user.id) {
        await prisma.notification.create({
          data: {
            recipientId: short.creatorId,
            actorId: user.id,
            type: "COMMENT",
            shortId,
            commentId: comment.id,
          },
        });
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
