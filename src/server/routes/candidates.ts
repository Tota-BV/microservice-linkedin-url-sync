import { db } from "@/lib/db";
import { candidates } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { insertCandidateSchema, bulkUploadCandidateSchema } from "@/lib/db/schema/candidates";

export const candidatesRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx: { session } }) => {
    return db.query.candidates.findMany({
      where: eq(candidates.agencyId, session.user.id),
      orderBy: (candidates, { desc }) => [desc(candidates.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(insertCandidateSchema)
    .mutation(async ({ input, ctx: { session } }) => {
      return db.insert(candidates).values({
        ...input,
        agencyId: session.user.id,
      }).returning();
    }),

  bulkUpload: protectedProcedure
    .input(z.array(bulkUploadCandidateSchema))
    .mutation(async ({ input, ctx: { session } }) => {
      const candidatesWithAgency = input.map(candidate => ({
        ...candidate,
        agencyId: session.user.id,
      }));
      
      return db.insert(candidates).values(candidatesWithAgency).returning();
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input, ctx: { session } }) => {
      return db
        .delete(candidates)
        .where(
          eq(candidates.id, input.id) && eq(candidates.agencyId, session.user.id)
        );
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      data: insertCandidateSchema.partial(),
    }))
    .mutation(async ({ input, ctx: { session } }) => {
      return db
        .update(candidates)
        .set(input.data)
        .where(
          eq(candidates.id, input.id) && eq(candidates.agencyId, session.user.id)
        );
    }),
});
