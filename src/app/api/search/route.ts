import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    if (!q) {
      return NextResponse.json(
        { error: "Search query (q) is required" },
        { status: 400 }
      );
    }

    // Search by hashtag
    if (q.startsWith("#")) {
      const hashtag = q.toLowerCase();

      const [shorts, totalCount] = await Promise.all([
        prisma.short.findMany({
          where: {
            hashtags: {
              contains: hashtag,
              mode: "insensitive",
            },
          },
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
          skip,
          take: limit,
        }),
        prisma.short.count({
          where: {
            hashtags: {
              contains: hashtag,
              mode: "insensitive",
            },
          },
        }),
      ]);

      return NextResponse.json({
        type: "hashtag",
        results: shorts,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Search by username
    if (q.startsWith("@")) {
      const username = q.slice(1); // remove @

      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: {
            username: {
              contains: username,
              mode: "insensitive",
            },
          },
          select: {
            id: true,
            username: true,
            name: true,
            bio: true,
            profilePictureUrl: true,
          },
          orderBy: { username: "asc" },
          skip,
          take: limit,
        }),
        prisma.user.count({
          where: {
            username: {
              contains: username,
              mode: "insensitive",
            },
          },
        }),
      ]);

      return NextResponse.json({
        type: "user",
        results: users,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
        },
      });
    }

    // Default: general search (search shorts by title)
    const [shorts, totalCount] = await Promise.all([
      prisma.short.findMany({
        where: {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
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
        skip,
        take: limit,
      }),
      prisma.short.count({
        where: {
          title: {
            contains: q,
            mode: "insensitive",
          },
        },
      }),
    ]);

    return NextResponse.json({
      type: "general",
      results: shorts,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error searching:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
