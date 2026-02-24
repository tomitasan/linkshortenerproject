import { db } from "@/db";
import { links, type NewLink } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

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

/**
 * Creates a new shortened link in the database
 * @param userId - The Clerk user ID
 * @param originalUrl - The original URL to shorten
 * @param customSlug - Optional custom short code (defaults to generated nanoid)
 * @returns The created link object
 */
export async function createLink(
  userId: string,
  originalUrl: string,
  customSlug?: string
) {
  const shortCode = customSlug || nanoid(8);

  const newLink: NewLink = {
    userId,
    originalUrl,
    shortCode,
  };

  const [createdLink] = await db.insert(links).values(newLink).returning();
  return createdLink;
}

/**
 * Checks if a short code already exists
 * @param shortCode - The short code to check
 * @returns True if exists, false otherwise
 */
export async function shortCodeExists(shortCode: string): Promise<boolean> {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);
  
  return result.length > 0;
}
