import { db } from "@/lib/db";

// import { updateCandidateMatchingCriteraSchema } from "@/features/candidates/model/schema";
// import { candidateMatchingCriteria } from "@/lib/db/schema";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

export const candidateMatchingCriteriaRouter = createTRPCRouter({
	getOne: protectedProcedure
		.input(z.object({ candidateId: z.string() }))
		.query(async ({ input }) => {
			// const record = await db.query.candidateMatchingCriteria.findFirst({
			//   where: eq(candidateMatchingCriteria.candidateId, input.candidateId),
			// });
			// return record;
		}),
	update: protectedProcedure
		// .input(updateCandidateMatchingCriteraSchema)
		.mutation(async ({ input }) => {
			// if (input.candidateId) {
			//   return db
			//     .update(candidateMatchingCriteria)
			//     .set(input)
			//     .where(eq(candidateMatchingCriteria.candidateId, input.candidateId));
			// }

			return false;
		}),
});
