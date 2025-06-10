import { uploadFileSchema } from "@/features/agency-profile/model/file-upload.schema";
import { updateAgencyProfileSchema } from "@/features/agency-profile/model/schema";
import { db } from "@/lib/db";
import { agencyDocuments, agencyProfile } from "@/lib/db/schema";

import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { eq } from "drizzle-orm";

export const agencyRouter = createTRPCRouter({
  getProfile: protectedProcedure.query(async ({ ctx: { session } }) => {
    return db.query.agencyProfile.findFirst({
      where: eq(agencyProfile.userId, session.user.id),
      with: {
        country: true,
        documents: true,
      },
    });
  }),
  updateProfile: protectedProcedure
    .input(updateAgencyProfileSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      return db
        .update(agencyProfile)
        .set(input)
        .where(eq(agencyProfile.userId, session.user.id));
    }),
  uploadDocuments: protectedProcedure
    .input(uploadFileSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      console.log("SERVER", input);

      const profile = await db.query.agencyProfile.findFirst({
        where: eq(agencyProfile.userId, session.user.id),
      });

      if (profile) {
        const uploadDocuments = await db.query.agencyDocuments.findMany({
          where: eq(agencyDocuments.agencyProfileId, profile.id),
        });

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
              agencyProfileId: profile.id,
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
