---
description: Read this file before implementing or modifying server actions for data mutations in the project.
---

# Server Actions Instructions

This document outlines the standards and patterns for implementing server actions in this Next.js application.

## Core Principles

### 1. Server Actions for All Data Mutations

All data mutations (create, update, delete operations) MUST be performed through server actions. Never mutate data directly from client components or API routes.

### 2. File Naming and Colocation

- Server action files MUST be named `actions.ts`
- Colocate `actions.ts` in the same directory as the component that calls the action

**Example structure:**
```
dashboard/
  page.tsx          # Client component
  actions.ts        # Server actions for dashboard
```

### 3. Client Component Invocation

Server actions MUST be called from client components. Mark components with `"use client"` directive when they need to trigger mutations.

## Implementation Standards

### 4. Type Safety

- ALL data passed to server actions must have explicit TypeScript types
- **DO NOT** use the `FormData` TypeScript type
- Define proper interfaces or types for action parameters

**Good:**
```typescript
interface CreateLinkInput {
  url: string;
  customSlug?: string;
}

export async function createLink(input: CreateLinkInput) { ... }
```

**Bad:**
```typescript
export async function createLink(formData: FormData) { ... }
```

### 5. Data Validation with Zod

- ALL input data **MUST** be validated using Zod
- Define Zod schemas for each server action's input
- Validate at the beginning of every server action

```typescript
import { z } from "zod";

const createLinkSchema = z.object({
  url: z.string().url(),
  customSlug: z.string().optional(),
});

export async function createLink(input: unknown) {
  const validatedData = createLinkSchema.parse(input);
  // ... continue with validated data
}
```

### 6. Authentication Check

ALL server actions MUST check for a logged-in user BEFORE performing any database operations.

```typescript
import { auth } from "@clerk/nextjs/server";

export async function createLink(input: CreateLinkInput) {
  const { userId } = await auth();
  
  if (!userId) {
    return { error: "Unauthorized" };
  }
  
  // ... continue with database operations
}
```

### 7. Error Handling

Server actions MUST NOT throw errors. Instead, return an object with either:
- An `error` property containing the error message
- A `success` property (and optionally data) indicating successful operation

**Good:**
```typescript
export async function createLink(input: CreateLinkInput) {
  try {
    const validatedData = createLinkSchema.parse(input);
    const link = await createLinkInDb(validatedData);
    return { success: true, data: link };
  } catch (error) {
    return { error: "Failed to create link" };
  }
}
```

**Bad:**
```typescript
export async function createLink(input: CreateLinkInput) {
  throw new Error("Something went wrong"); // ❌ Never throw
}
```

### 8. Database Operations via Helper Functions

- Server actions MUST NOT contain direct Drizzle queries
- Use helper functions from the `/data` directory that wrap Drizzle queries
- Keep server actions focused on validation, authorization, and orchestration

**Good:**
```typescript
// actions.ts
import { createLinkInDb } from "@/data/links";

export async function createLink(input: CreateLinkInput) {
  const { userId } = await auth();
  if (!userId) return { error: "Unauthorized" };
  
  try {
    const validatedData = createLinkSchema.parse(input);
    const link = await createLinkInDb({ ...validatedData, userId });
    return { success: true, data: link };
  } catch (error) {
    return { error: "Failed to create link" };
  }
}
```

**Bad:**
```typescript
// actions.ts - DO NOT DO THIS
import { db } from "@/db";
import { links } from "@/db/schema";

export async function createLink(input: CreateLinkInput) {
  return await db.insert(links).values(input); // ❌ Direct Drizzle query
}
```

## Quick Checklist

Before committing a server action, verify:

- [ ] File is named `actions.ts` and colocated with calling component
- [ ] Called from a client component (`"use client"`)
- [ ] Uses proper TypeScript types (not FormData)
- [ ] Validates input with Zod
- [ ] Checks authentication with `auth()`
- [ ] Returns error/success object (never throws)
- [ ] Uses helper functions from `/data` directory
- [ ] No direct Drizzle queries in the action

## Example Server Action

```typescript
"use server";

import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createLinkInDb, updateLinkInDb } from "@/data/links";

const linkSchema = z.object({
  url: z.string().url("Invalid URL format"),
  customSlug: z.string().min(3).optional(),
});

interface LinkInput {
  url: string;
  customSlug?: string;
}

export async function createLink(input: LinkInput) {
  // 1. Check authentication
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  // 2. Validate input and perform database operation
  try {
    const validatedData = linkSchema.parse(input);
    
    // 3. Use helper function for database operation
    const link = await createLinkInDb({
      ...validatedData,
      userId,
    });
    
    return { success: true, data: link };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: "Invalid input data" };
    }
    return { error: "Failed to create link" };
  }
}
```
