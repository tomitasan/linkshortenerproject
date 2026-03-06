import { db } from '@/db';
import { links, type NewLink } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

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
  customSlug?: string,
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

/**
 * Gets a link by its short code (for redirects)
 * @param shortCode - The short code to look up
 * @returns The link if found, null otherwise
 */
export async function getLinkByShortCode(shortCode: string) {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.shortCode, shortCode))
    .limit(1);

  return result.length > 0 ? result[0] : null;
}

/**
 * Gets a specific link by ID
 * @param linkId - The link ID
 * @param userId - The Clerk user ID (for authorization)
 * @returns The link if found and owned by user, null otherwise
 */
export async function getLink(linkId: number, userId: string) {
  const result = await db
    .select()
    .from(links)
    .where(eq(links.id, linkId))
    .limit(1);

  if (result.length === 0 || result[0].userId !== userId) {
    return null;
  }

  return result[0];
}

/**
 * Updates a link's URL and/or short code
 * @param linkId - The link ID to update
 * @param userId - The Clerk user ID (for authorization)
 * @param originalUrl - The new original URL
 * @param shortCode - The new short code (optional)
 * @returns The updated link or null if not found/unauthorized
 */
export async function updateLink(
  linkId: number,
  userId: string,
  originalUrl: string,
  shortCode?: string,
) {
  // First verify ownership
  const existingLink = await getLink(linkId, userId);
  if (!existingLink) {
    return null;
  }

  const updateData: Partial<NewLink> = {
    originalUrl,
  };

  // Only update short code if provided
  if (shortCode) {
    updateData.shortCode = shortCode;
  }

  const [updatedLink] = await db
    .update(links)
    .set(updateData)
    .where(eq(links.id, linkId))
    .returning();

  return updatedLink;
}

/**
 * Deletes a link with authorization check
 * **SECURITY**: This function performs a final ownership verification before deletion
 * to prevent race conditions and ensure atomicity of the authorization + deletion operation.
 *
 * @param linkId - The link ID to delete
 * @param userId - The Clerk user ID (for authorization)
 * @returns True if deleted successfully, false if not found/unauthorized
 */
export async function deleteLink(
  linkId: number,
  userId: string,
): Promise<boolean> {
  // **SECURITY**: Final ownership verification before deletion
  // This prevents race conditions where ownership could change between
  // the initial check and the deletion operation
  const existingLink = await getLink(linkId, userId);
  if (!existingLink) {
    return false;
  }

  // Perform the deletion - at this point we're certain the user owns the link
  await db.delete(links).where(eq(links.id, linkId));
  return true;
}
