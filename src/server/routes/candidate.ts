import { eq } from "drizzle-orm";
import { z } from "zod";
import {
	createCandidateSchema,
	updateCandidateSchema,
} from "@/features/candidates/model/schema";
import { db } from "@/lib/db";
import {
	candidate,
	candidateAvailability,
	candidateEducation,
	candidateVerification,
	candidateWorkExperience,
	// candidateMatchingCriteria,
	// candidateProfile,
} from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

export const candidateRouter = createTRPCRouter({
	getOne: protectedProcedure
		.input(z.object({ candidateId: z.string() }))
		.query(async ({ input }) => {
			const candidateRecord = await db.query.candidate.findFirst({
				where: eq(candidate.id, input.candidateId),
				// with: { profile: true, matchingCriteria: true },
			});

			return candidateRecord;
		}),
	getAll: protectedProcedure
		.input(z.object({ agencyId: z.string() }))
		.query(async ({ input }) => {
			const candidateRecords = await db.query.candidate.findMany({
				where: eq(candidate.agencyId, input.agencyId),
				// with: {
				// 	profile: true,
				// 	matchingCriteria: true,
				// },
			});

			return candidateRecords;
		}),
	create: protectedProcedure.input(z.any()).mutation(async ({ input }) => {
		console.log(input);

		return db
			.transaction(async (tx) => {
				const insertedCandidates = await tx
					.insert(candidate)
					.values(input)
					.returning();

				const candidateIds = insertedCandidates.map((row) => ({
					candidateId: row.id,
				}));

				await tx.insert(candidateAvailability).values(candidateIds);
			})
			.catch((err) => console.log(err));
	}),
	update: protectedProcedure
		.input(updateCandidateSchema)
		.mutation(async ({ input }) => {
			if (input.id) {
				return db
					.update(candidate)
					.set({ ...input, updatedAt: new Date() })
					.where(eq(candidate.id, input.id));
			}

			return false;
		}),
});
