import { updateAgencyProfileSchema } from "@/features/agency-profile/model/schema";
import { db } from "@/lib/db";
import { agency, agencyProfile } from "@/lib/db/schema";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";

export const agencyProfileRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx: { session } }) => {
    const agencyRecord = await db.query.agency.findFirst({
      where: eq(agency.userId, session.user.id),
    });

    if (!agencyRecord) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No agency found for user.",
      });
    }

    return db.query.agencyProfile.findFirst({
      where: eq(agencyProfile.agencyId, agencyRecord.id),
      with: {
        agency: {
          with: {
            country: true,
          },
        },
        officeLocations: {
          with: { country: true },
        },
      },
    });
  }),
  update: protectedProcedure
    .input(updateAgencyProfileSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      const agencyRecord = await db.query.agency.findFirst({
        where: eq(agency.userId, session.user.id),
      });

      if (!agencyRecord) {
        throw new Error("No agency found for user.");
      }

      return db
        .update(agencyProfile)
        .set(input)
        .where(eq(agencyProfile.agencyId, agencyRecord.id));
    }),
});
