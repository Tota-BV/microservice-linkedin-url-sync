import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { agencyContact, agencyProfile, countries } from "@/lib/db/schema";
import { createTRPCRouter, publicProcedure } from "@/lib/trpc/init";
import { z } from "zod";
import { accountSchema, agencySchema, contactSchema } from "../model/schema";

export const registerRouter = createTRPCRouter({
  agency: publicProcedure
    .input(
      z.object({
        agency: agencySchema,
        contact: contactSchema,
        account: accountSchema,
      }),
    )
    .query(async ({ input: { account, agency, contact } }) => {
      let createdUser:
        | Awaited<ReturnType<typeof auth.api.signUpEmail>>
        | undefined;

      try {
        createdUser = await auth.api.signUpEmail({
          body: {
            email: account.email,
            password: account.password,
            name: `${contact.name} ${contact.namePrefix ?? " "}${contact.surname}`,
          },
        });

        await db.transaction(async (tx) => {
          await tx
            .insert(countries)
            .values({
              code: agency.country.code,
              dialCode: agency.country.dial_code,
              emoji: agency.country.emoji,
              name: agency.country.name,
            })
            .onConflictDoNothing();

          const [insertedAgency] = await tx
            .insert(agencyProfile)
            .values({
              // biome-ignore lint/style/noNonNullAssertion: <explanation>
              userId: createdUser!.user.id,
              countryCode: agency.country.code,
              companyName: agency.company.name,
              companyNumber: agency.company.number,
              companyWebsite: agency.company.website,
              postalCode: agency.address.postalCode,
              houseNumber: agency.address.houseNumber,
              houseNumberAddition: agency.address.houseNumberAddition,
              street: agency.address.street,
              city: agency.address.city,
              phoneDialCode: agency.phone.dial_code,
              phoneNumber: agency.phone.number,
            })
            .returning();

          await tx.insert(agencyContact).values({
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            userId: createdUser!.user.id,
            agencyId: insertedAgency.id,
            pronounce: contact.pronounce,
            name: contact.name,
            surname: contact.surname,
            jobTitle: contact.jobTitle,
            phoneDialCode: contact.phone.dial_code,
            phoneNumber: contact.phone.number,
            namePrefix: contact.namePrefix,
          });
        });

        return {
          userId: createdUser.user.id,
          message: "Agency account created successfully.",
        };
      } catch (err) {
        if (createdUser?.token) {
          await auth.api.deleteUser({ body: { token: createdUser.token } });
        }

        throw {
          code: "AGENCY_CREATION_FAILED",
          message:
            "Something went wrong while creating your agency account. Please try again.",
          ...(process.env.NODE_ENV !== "production" && {
            details: err instanceof Error ? err.message : String(err),
          }),
        };
      }
    }),
});
