import { candidate, candidateProfile } from "@/lib/db/schema";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";

export const createCandidateSchema = createInsertSchema(candidate);
export type CreateCandidate = z.infer<typeof createCandidateSchema>;

export const selectCandidateSchema = createSelectSchema(candidate);
export type SelectCandidate = z.infer<typeof selectCandidateSchema>;

export const updateCandidateSchema = createUpdateSchema(candidate);
export type UpdateCandidate = z.infer<typeof updateCandidateSchema>;

export const updateCandidateProfileSchema =
  createUpdateSchema(candidateProfile);
export type UpdateCandidateProfile = z.infer<
  typeof updateCandidateProfileSchema
>;
