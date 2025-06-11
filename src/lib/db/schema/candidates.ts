import { uuid } from "@/lib/utils";
import { relations, sql } from "drizzle-orm";
import { 
  pgTable, 
  text, 
  timestamp, 
  varchar, 
  date
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { user } from "./auth";

export const candidates = pgTable("candidates", {
  id: varchar("id", { length: 191 })
    .primaryKey()
    .$defaultFn(() => uuid()),
  
  name: text("name").notNull(),
  surname: text("surname").notNull(), 
  email: text("email").notNull(),
  telNumber: text("tel_number"),
  dateOfBirth: date("date_of_birth"),
  linkedIn: text("linkedin"),
  
  agencyId: text("agency_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const candidatesRelations = relations(candidates, ({ one }) => ({
  agency: one(user, {
    fields: [candidates.agencyId],
    references: [user.id],
  }),
}));

export const insertCandidateSchema = createSelectSchema(candidates)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  });

export const updateCandidateSchema = insertCandidateSchema.partial();

export const bulkUploadCandidateSchema = insertCandidateSchema
  .omit({ agencyId: true }); // Agency ID will be set from session

export type Candidate = typeof candidates.$inferSelect;
export type NewCandidate = z.infer<typeof insertCandidateSchema>;
export type BulkUploadCandidate = z.infer<typeof bulkUploadCandidateSchema>;
