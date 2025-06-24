import { updateCandidateProfileSchema } from "@/features/candidates/model/schema";
import { db } from "@/lib/db";
import { candidateProfile } from "@/lib/db/schema";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

import { eq } from "drizzle-orm";
import { z } from "zod";

export const candidateProfileRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(z.object({ candidateId: z.string() }))
    .query(async ({ input }) => {
      const candidateRecord = await db.query.candidateProfile.findFirst({
        where: eq(candidateProfile.candidateId, input.candidateId),
      });

      return candidateRecord;
    }),
  update: protectedProcedure
    .input(updateCandidateProfileSchema)
    .mutation(async ({ input }) => {
      if (input.candidateId) {
        if (input.experience) {
          const currentProfile = await db.query.candidateProfile.findFirst({
            where: eq(candidateProfile.candidateId, input.candidateId),
          });

          const hasExperience = currentProfile?.experience.find(
            (cp) => cp.id === input.experience?.[0].id,
          );

          if (hasExperience) {
            const mergedExperience = currentProfile?.experience.map(
              (curExp) => {
                const existing = curExp.id === input.experience?.[0].id;
                return existing
                  ? { ...curExp, ...input.experience?.[0] }
                  : curExp;
              },
            );

            return db
              .update(candidateProfile)
              .set({ experience: mergedExperience })
              .where(eq(candidateProfile.candidateId, input.candidateId));
          }

          return db
            .update(candidateProfile)
            .set({
              experience: currentProfile?.experience.concat(
                input.experience[0],
              ),
            })
            .where(eq(candidateProfile.candidateId, input.candidateId));
        }

        return db
          .update(candidateProfile)
          .set(input)
          .where(eq(candidateProfile.candidateId, input.candidateId));
      }

      return false;
    }),
});
