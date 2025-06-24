import { uploadFileSchema } from "@/features/agency-profile/model/file-upload.schema";
import { updateAgencyProfileSchema } from "@/features/agency-profile/model/schema";
import { db } from "@/lib/db";
import { agency, agencyDocuments, agencyProfile } from "@/lib/db/schema";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

import { eq } from "drizzle-orm";

export const agencyRouter = createTRPCRouter({
  getAgency: protectedProcedure.query(async ({ ctx: { session } }) => {
    const agencyRecord = await db.query.agency.findFirst({
      where: eq(agency.userId, session.user.id),
      with: {
        documents: true,
        tokens: true,
      },
    });

    return agencyRecord;
  }),
  update: protectedProcedure
    .input(updateAgencyProfileSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      const agencyRecord = await db.query.agency.findFirst({
        where: eq(agency.userId, session.user.id),
      });

      return db
        .update(agencyProfile)
        .set(input)
        .where(eq(agencyProfile.agencyId, agencyRecord.id));
    }),
  uploadDocuments: protectedProcedure
    .input(uploadFileSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      const agencyRecord = await db.query.agency.findFirst({
        where: eq(agency.userId, session.user.id),
      });

      if (agencyRecord) {
        const uploadDocuments = await db.query.agencyDocuments.findMany({
          where: eq(agencyDocuments.agencyId, agencyRecord.id),
        });
        console.log("SERVER", uploadDocuments);

        for (const doc in input) {
          const uploadDocument = uploadDocuments.find((d) => d.type === doc);

          if (uploadDocument) {
            await db
              .update(agencyDocuments)
              .set({
                name: input[doc]?.name,
                url: input[doc]?.name,
                status: "In progress",
                updatedAt: new Date(),
              })
              .where(eq(agencyDocuments.id, uploadDocument.id));
          } else {
            await db.insert(agencyDocuments).values({
              agencyId: agencyRecord.id,
              name: input[doc]?.name,
              url: input[doc]?.name,
              type: doc,
              status: "In progress",
              uploadedAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }
    }),
});
