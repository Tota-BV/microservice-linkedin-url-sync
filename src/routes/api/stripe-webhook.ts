import { createServerFileRoute } from "@tanstack/react-start/server";
import { sql } from "drizzle-orm";
import { Stripe } from "stripe";
import { db } from "@/lib/db";
import { agencyInvoices, agencyTokens } from "@/lib/db/schema";
import { stripe } from "@/lib/stripe";

async function getRawBody(request: Request): Promise<Buffer> {
	const reader = request.body?.getReader();
	const chunks: Uint8Array[] = [];

	if (!reader) throw new Error("Request body is missing");

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) chunks.push(value);
	}

	return Buffer.concat(chunks);
}

export const ServerRoute = createServerFileRoute("/api/stripe-webhook").methods(
	{
		POST: async ({ request }) => {
			const sig = request.headers.get("stripe-signature");

			if (!sig) {
				return new Response("Missing Stripe signature", { status: 400 });
			}

			let event: Stripe.Event;
			const body = await getRawBody(request);

			try {
				event = stripe.webhooks.constructEvent(
					body,
					sig,
					process.env.STRIPE_WEBHOOK_SECRET,
				);
			} catch (err: any) {
				console.error("Invalid Stripe signature:", err.message);
				return new Response(`Webhook Error: ${err.message}`, { status: 400 });
			}

			if (event.type === "checkout.session.completed") {
				const session = event.data.object;

				const paymentIntentId = session.payment_intent as string;
				const paymentIntent =
					await stripe.paymentIntents.retrieve(paymentIntentId);

				if (paymentIntent.status === "succeeded") {
					const userId = session.metadata?.userId;
					const agencyId = session.metadata?.agencyId;
					const tokenAmount = Number.parseInt(
						session.metadata?.tokenAmount ?? "0",
						10,
					);

					if (!userId || !agencyId || !tokenAmount) {
						return new Response("Missing metadata", { status: 400 });
					}

					try {
						await db
							.insert(agencyTokens)
							.values({
								agencyId,
								tokenCount: tokenAmount,
								lastPurchaseAt: new Date(),
							})
							.onConflictDoUpdate({
								target: agencyTokens.agencyId,
								set: {
									tokenCount: sql`${agencyTokens.tokenCount} + ${tokenAmount}`,
									lastPurchaseAt: new Date(),
								},
							});
					} catch (err) {
						console.error("Database error:", err);
						return new Response("Database error", { status: 500 });
					}
				} else {
					console.log("⏳ Betaling nog niet succesvol");
				}
			}
			if (event.type === "invoice.finalized") {
				const invoice = event.data.object;

				const agencyId = invoice.metadata?.agencyId;
				console.log(agencyId);

				if (!agencyId) {
					return new Response("Missing metadata", { status: 400 });
				}

				await db.insert(agencyInvoices).values({
					agencyId,
					date: new Date(invoice.created * 1000),
					amount: invoice.amount_paid ?? invoice.amount_due,
					status: invoice.status,
					type: "token_purchase",
					invoiceUrl: invoice.hosted_invoice_url ?? null,
					invoicePdf: invoice.invoice_pdf ?? null,
				});
			}

			return new Response(null, { status: 200 });
		},
	},
);
