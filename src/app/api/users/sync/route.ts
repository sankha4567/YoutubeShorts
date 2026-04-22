import { NextResponse } from "next/server";
import { syncUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await syncUser();
    if (!user)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error("Error syncing user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
