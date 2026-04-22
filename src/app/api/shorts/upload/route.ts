import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { imagekit } from "@/lib/imagekit";

export async function POST(request: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    const formData = await request.formData();
    const file = formData.get("videoFile") as File | null;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const hashtags = formData.get("hashtags") as string | null;

    if (!file)
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );

    if (!title)
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await imagekit.upload({
      file: buffer,
      fileName: `${user.id}-${Date.now()}-${file.name}`,
      folder: "/shorts",
    });

    const short = await prisma.short.create({
      data: {
        creatorId: user.id,
        title,
        description: description || null,
        imageKitUrl: result.url,
        imageKitFileId: result.fileId,
        hashtags: hashtags || "",
      },
    });

    return NextResponse.json(short, { status: 201 });
  } catch (error) {
    console.error("Error uploading short:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
