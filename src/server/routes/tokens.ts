import { createTRPCRouter, protectedProcedure } from "@/lib/trpc/init";

import { db } from "@/lib/db";
import { agency } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";
import { eq } from "drizzle-orm";
import z from "zod";

export function getPricePerToken(amount: number): number {
  if (amount <= 10) return 2100;
  if (amount > 10 && amount <= 50) return 2000;
  return 1900;
}

export const tokensRouter = createTRPCRouter({
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const price = getPricePerToken(input.amount);

      const agencyRecord = await db.query.agency.findFirst({
        where: eq(agency.userId, ctx.session.user.id),
      });

      if (!agencyRecord) {
        throw new Error("No agency");
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["ideal", "card"],
        invoice_creation: {
          enabled: true,
          invoice_data: {
            metadata: {
              userId: ctx.session.user.id,
              agencyId: agencyRecord.id,
            },
          },
        },
        line_items: [
          {
            quantity: input.amount,
            price_data: {
              currency: "eur",
              product_data: {
                name: `${input.amount} Tota tokens`,
              },
              unit_amount: price,
            },
          },
        ],
        metadata: {
          userId: ctx.session.user.id,
          agencyId: agencyRecord.id,
          tokenAmount: input.amount,
        },
        success_url: "http://localhost:3000/tokens/success",
        cancel_url: "http://localhost:3000/tokens/cancel",
      });

      return { url: session.url };
    }),
});
