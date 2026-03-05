'use server';

import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import {
  createLink,
  shortCodeExists,
  updateLink,
  deleteLink,
  getLink,
} from '@/data/links';
import { revalidatePath } from 'next/cache';

// Zod schema for validating input
const createLinkSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, {
      message:
        'Custom slug can only contain letters, numbers, hyphens, and underscores',
    })
    .min(3, { message: 'Custom slug must be at least 3 characters' })
    .max(20, { message: 'Custom slug must be 20 characters or less' })
    .optional()
    .or(z.literal('')),
});

export interface CreateLinkInput {
  url: string;
  customSlug?: string;
}

export interface CreateLinkResult {
  success?: boolean;
  error?: string;
  data?: {
    id: number;
    shortCode: string;
    originalUrl: string;
  };
}

/**
 * Server action to create a new shortened link
 * @param input - The link creation input data
 * @returns Result object with success/error status and optional data
 */
export async function createLinkAction(
  input: CreateLinkInput,
): Promise<CreateLinkResult> {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized. Please sign in to create links.' };
  }

  // Validate input data
  try {
    const validatedData = createLinkSchema.parse(input);

    // Clean up custom slug - convert empty string to undefined
    const customSlug =
      validatedData.customSlug && validatedData.customSlug.trim() !== ''
        ? validatedData.customSlug.trim()
        : undefined;

    // If custom slug provided, check if it already exists
    if (customSlug) {
      const exists = await shortCodeExists(customSlug);
      if (exists) {
        return {
          error:
            'This custom slug is already taken. Please choose another one.',
        };
      }
    }

    // Create the link
    const link = await createLink(userId, validatedData.url, customSlug);

    // Revalidate the dashboard page to show the new link
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
      },
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { error: firstError.message };
    }

    // Handle other errors
    console.error('Error creating link:', error);
    return { error: 'Failed to create link. Please try again.' };
  }
}

// Zod schema for update link validation
const updateLinkSchema = z.object({
  url: z.string().url({ message: 'Please enter a valid URL' }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, {
      message:
        'Custom slug can only contain letters, numbers, hyphens, and underscores',
    })
    .min(3, { message: 'Custom slug must be at least 3 characters' })
    .max(20, { message: 'Custom slug must be 20 characters or less' })
    .optional()
    .or(z.literal('')),
});

export interface UpdateLinkInput {
  linkId: number;
  url: string;
  customSlug?: string;
}

export interface UpdateLinkResult {
  success?: boolean;
  error?: string;
  data?: {
    id: number;
    shortCode: string;
    originalUrl: string;
  };
}

/**
 * Server action to update an existing shortened link
 * @param input - The link update input data
 * @returns Result object with success/error status and optional data
 */
export async function updateLinkAction(
  input: UpdateLinkInput,
): Promise<UpdateLinkResult> {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized. Please sign in to update links.' };
  }

  // Validate input data
  try {
    const validatedData = updateLinkSchema.parse({
      url: input.url,
      customSlug: input.customSlug,
    });

    // Get the existing link to check current short code
    const existingLink = await getLink(input.linkId, userId);
    if (!existingLink) {
      return {
        error: "Link not found or you don't have permission to update it.",
      };
    }

    // Clean up custom slug - convert empty string to undefined
    const customSlug =
      validatedData.customSlug && validatedData.customSlug.trim() !== ''
        ? validatedData.customSlug.trim()
        : undefined;

    // If custom slug provided and different from current, check if it already exists
    if (customSlug && customSlug !== existingLink.shortCode) {
      const exists = await shortCodeExists(customSlug);
      if (exists) {
        return {
          error:
            'This custom slug is already taken. Please choose another one.',
        };
      }
    }

    // Update the link
    const link = await updateLink(
      input.linkId,
      userId,
      validatedData.url,
      customSlug,
    );

    if (!link) {
      return {
        error: "Link not found or you don't have permission to update it.",
      };
    }

    // Revalidate the dashboard page to show the updated link
    revalidatePath('/dashboard');

    return {
      success: true,
      data: {
        id: link.id,
        shortCode: link.shortCode,
        originalUrl: link.originalUrl,
      },
    };
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return { error: firstError.message };
    }

    // Handle other errors
    console.error('Error updating link:', error);
    return { error: 'Failed to update link. Please try again.' };
  }
}

export interface DeleteLinkResult {
  success?: boolean;
  error?: string;
}

/**
 * Server action to delete a shortened link
 * @param linkId - The ID of the link to delete
 * @returns Result object with success/error status
 */
export async function deleteLinkAction(
  linkId: number,
): Promise<DeleteLinkResult> {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return { error: 'Unauthorized. Please sign in to delete links.' };
  }

  try {
    // Delete the link
    const deleted = await deleteLink(linkId, userId);

    if (!deleted) {
      return {
        error: "Link not found or you don't have permission to delete it.",
      };
    }

    // Revalidate the dashboard page to remove the deleted link
    revalidatePath('/dashboard');

    return { success: true };
  } catch (error) {
    // Handle errors
    console.error('Error deleting link:', error);
    return { error: 'Failed to delete link. Please try again.' };
  }
}
