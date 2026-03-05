import {
  pgTable,
  text,
  varchar,
  timestamp,
  index,
  integer,
} from 'drizzle-orm/pg-core';
import { InferSelectModel, InferInsertModel } from 'drizzle-orm';

export const links = pgTable('links', {
  id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
  userId: text('user_id').notNull(),
  originalUrl: text('original_url').notNull(),
  shortCode: varchar('short_code', { length: 20 }).notNull().unique(),
  createdAt: timestamp('created_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

// Export TypeScript types
export type Link = InferSelectModel<typeof links>;
export type NewLink = InferInsertModel<typeof links>;
