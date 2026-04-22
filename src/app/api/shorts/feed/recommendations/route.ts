import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    const { userId: clerkId } = await auth();
    let user = null;
    if (clerkId) {
      user = await prisma.user.findUnique({ where: { clerkId } });
    }

    const whereClause = user
      ? { creatorId: { not: user.id } }
      : undefined;

    const [shorts, total] = await Promise.all([
      prisma.short.findMany({
        where: whereClause,
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
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.short.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      shorts,
      total,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
