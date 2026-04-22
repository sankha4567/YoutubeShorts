import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./prisma";

/**
 * Syncs the Clerk user to our database.
 * Creates the user if they don't exist, updates if Clerk data changed.
 * This removes the need for webhooks during development.
 */
export async function syncUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses?.[0]?.emailAddress;
  const username =
    clerkUser.username || email?.split("@")[0] || clerkId;
  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const profilePictureUrl = clerkUser.imageUrl || null;

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: {
      email,
      name,
      profilePictureUrl,
      // Don't overwrite username if user hasn't set one in Clerk
      ...(clerkUser.username ? { username: clerkUser.username } : {}),
    },
    create: {
      clerkId,
      email: email!,
      username,
      name,
      profilePictureUrl,
    },
  });

  return user;
}

export async function getCurrentUser() {
  return syncUser();
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
