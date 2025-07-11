import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import type { z } from "zod";
import {
	candidate,
	// candidateMatchingCriteria,
	// candidateProfile,
} from "@/lib/db/schema";

// candidate
export const createCandidateSchema = createInsertSchema(candidate);
export type CreateCandidate = z.infer<typeof createCandidateSchema>;

export const selectCandidateSchema = createSelectSchema(candidate);
export type SelectCandidate = z.infer<typeof selectCandidateSchema>;

export const updateCandidateSchema = createUpdateSchema(candidate);
export type UpdateCandidate = z.infer<typeof updateCandidateSchema>;

// candidate profile
// export const createCandidateProfileSchema =
//   createInsertSchema(candidateProfile);
// export type CreateCandidateProfile = z.infer<
//   typeof createCandidateProfileSchema
// >;

// export const selectCandidateProfileSchema =
//   createSelectSchema(candidateProfile);
// export type SelectCandidateProfile = z.infer<
//   typeof selectCandidateProfileSchema
// >;

// export const updateCandidateProfileSchema =
//   createUpdateSchema(candidateProfile);
// export type UpdateCandidateProfile = z.infer<
//   typeof updateCandidateProfileSchema
// >;

// // candicate matching criteria
// export const createCandidateMatchingCriteraSchema = createInsertSchema(
//   candidateMatchingCriteria,
// );
// export type CreateCandidateMatchingCritera = z.infer<
//   typeof createCandidateMatchingCriteraSchema
// >;

// export const selectCandidateMatchingCriteraSchema = createSelectSchema(
//   candidateMatchingCriteria,
// );
// export type SelectCandidateMatchingCritera = z.infer<
//   typeof selectCandidateMatchingCriteraSchema
// >;

// export const updateCandidateMatchingCriteraSchema = createUpdateSchema(
//   candidateMatchingCriteria,
// );
// export type UpdateCandidateMatchingCritera = z.infer<
//   typeof updateCandidateMatchingCriteraSchema
// >;
