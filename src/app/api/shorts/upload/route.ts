import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { title, description, hashtags, imageKitUrl, imageKitFileId } = body;

    if (!title)
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    if (!imageKitUrl || !imageKitFileId)
      return NextResponse.json(
        { error: "ImageKit upload data is required" },
        { status: 400 }
      );

    const short = await prisma.short.create({
      data: {
        creatorId: user.id,
        title,
        description: description || null,
        imageKitUrl,
        imageKitFileId,
        hashtags: hashtags || "",
      },
    });

    return NextResponse.json(short, { status: 201 });
  } catch (error) {
    console.error("Error saving short:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
