"use server";

import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createLink, shortCodeExists } from "@/data/links";
import { revalidatePath } from "next/cache";

// Zod schema for validating input
const createLinkSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  customSlug: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, {
      message: "Custom slug can only contain letters, numbers, hyphens, and underscores",
    })
    .min(3, { message: "Custom slug must be at least 3 characters" })
    .max(20, { message: "Custom slug must be 20 characters or less" })
    .optional()
    .or(z.literal("")),
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
  input: CreateLinkInput
): Promise<CreateLinkResult> {
  // Check authentication
  const { userId } = await auth();

  if (!userId) {
    return { error: "Unauthorized. Please sign in to create links." };
  }

  // Validate input data
  try {
    const validatedData = createLinkSchema.parse(input);

    // Clean up custom slug - convert empty string to undefined
    const customSlug =
      validatedData.customSlug && validatedData.customSlug.trim() !== ""
        ? validatedData.customSlug.trim()
        : undefined;

    // If custom slug provided, check if it already exists
    if (customSlug) {
      const exists = await shortCodeExists(customSlug);
      if (exists) {
        return {
          error: "This custom slug is already taken. Please choose another one.",
        };
      }
    }

    // Create the link
    const link = await createLink(userId, validatedData.url, customSlug);

    // Revalidate the dashboard page to show the new link
    revalidatePath("/dashboard");

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
    console.error("Error creating link:", error);
    return { error: "Failed to create link. Please try again." };
  }
}
