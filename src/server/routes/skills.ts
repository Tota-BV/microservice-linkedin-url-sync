import { and, eq, notInArray, sql } from "drizzle-orm";
import z from "zod";
import { db } from "@/lib/db";
import { candidateSkills } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

export const skillsRouter = createTRPCRouter({
	getMany: protectedProcedure.query(async () => {
		return db.query.skills.findMany();
	}),
	getManyByCandidateId: protectedProcedure
		.input(z.object({ candidateId: z.string() }))
		.query(async ({ input }) => {
			return db.query.candidateSkills.findMany({
				where: eq(candidateSkills.candidateId, input.candidateId),
				with: { skill: true },
			});
		}),
	update: protectedProcedure
		.input(
			z.array(
				z.object({
					candidateId: z.string(),
					skillId: z.string(),
					isPrimary: z.boolean().optional(),
				}),
			),
		)
		.mutation(async ({ input }) => {
			await db.transaction(async (tx) => {
				if (input.length === 0) return;

				const candidateId = input[0].candidateId;

				await tx
					.delete(candidateSkills)
					.where(eq(candidateSkills.candidateId, candidateId));

				await tx.insert(candidateSkills).values(input);
			});
		}),
});
