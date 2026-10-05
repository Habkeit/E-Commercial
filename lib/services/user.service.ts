// lib/services/user.service.ts
/**
 * User data access — centralizes the "find-or-create user from Clerk" pattern
 * that was previously copy-pasted across 6 files.
 */
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { currentUser as getClerkUser } from "@clerk/nextjs/server";
import { uuidv7 } from "uuidv7";

export type UserRecord = typeof users.$inferSelect;

/**
 * Look up a user by their Clerk ID. Returns null if not found.
 */
export async function findUserByClerkId(
  clerkId: string,
): Promise<UserRecord | null> {
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  return user ?? null;
}

/**
 * Get an existing user or auto-provision one from the Clerk session.
 * On the fast path (user exists), this is a single SELECT query.
 * On the slow path (first visit), it fetches Clerk profile data and INSERTs.
 */
export async function getOrCreateUser(clerkId: string): Promise<UserRecord> {
  // Fast path — user already synced
  const existing = await findUserByClerkId(clerkId);
  if (existing) return existing;

  // Slow path — first-time user, fetch from Clerk SDK and provision
  const clerkUser = await getClerkUser();
  const email =
    clerkUser?.emailAddresses[0]?.emailAddress || "no-email@gmail.com";
  const fullName =
    `${clerkUser?.firstName || ""} ${clerkUser?.lastName || ""}`.trim() ||
    "User";

  const newUserId = uuidv7();
  await db.insert(users).values({
    id: newUserId,
    clerkId,
    email,
    fullName,
  });

  return {
    id: newUserId,
    clerkId,
    email,
    fullName,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
