import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";

export async function DELETE() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        shorts: { select: { imageKitFileId: true } },
      },
    });

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Delete all video files from ImageKit
    const deletePromises = user.shorts.map((short) =>
      imagekit.deleteFile(short.imageKitFileId).catch((err) => {
        console.error(`Failed to delete ImageKit file ${short.imageKitFileId}:`, err);
      })
    );
    await Promise.allSettled(deletePromises);

    // Cascade delete user from DB (all related data is deleted via onDelete: Cascade)
    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({ success: true, message: "Account deleted" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
