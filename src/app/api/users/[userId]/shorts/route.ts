import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const [shorts, total] = await Promise.all([
      prisma.short.findMany({
        where: { creatorId: userId },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              name: true,
              profilePictureUrl: true,
            },
          },
        },
      }),
      prisma.short.count({ where: { creatorId: userId } }),
    ]);

    return NextResponse.json({
      shorts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching user shorts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
