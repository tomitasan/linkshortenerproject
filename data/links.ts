import { db } from "@/db";
import { links } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * Fetches all links for a specific user
 * @param userId - The Clerk user ID
 * @returns Array of links ordered by creation date (newest first)
 */
export async function getUserLinks(userId: string) {
  return await db
    .select()
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt));
}
