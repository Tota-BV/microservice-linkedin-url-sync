import { db } from "@/lib/db";
import { agencyInvoices } from "@/lib/db/schema";
import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";
import { eq } from "drizzle-orm";
import z from "zod";

export const invoicesRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({ agencyId: z.string() }))
    .query(async ({ input, ctx }) => {
      const invoices = await db.query.agencyInvoices.findMany({
        where: eq(agencyInvoices.agencyId, input.agencyId),
      });

      return invoices;
    }),
});
