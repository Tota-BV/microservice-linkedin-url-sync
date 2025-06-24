import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import {
  agency,
  agencyContact,
  agencyOfficeLocation,
  agencyProfile,
  countries,
} from "@/lib/db/schema";
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
    .query(async ({ input }) => {
      let createdUser:
        | Awaited<ReturnType<typeof auth.api.signUpEmail>>
        | undefined;

      try {
        createdUser = await auth.api.signUpEmail({
          body: {
            email: input.account.email,
            password: input.account.password,
            name: `${input.contact.name} ${input.contact.namePrefix ?? " "}${input.contact.surname}`,
          },
        });

        await db.transaction(async (tx) => {
          try {
            await tx
              .insert(countries)
              .values({
                code: input.agency.country.code,
                dialCode: input.agency.country.dial_code,
                emoji: input.agency.country.emoji,
                name: input.agency.country.name,
              })
              .onConflictDoNothing();

            const [insertedAgency] = await tx
              .insert(agency)
              .values({
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                userId: createdUser!.user.id,
                countryCode: input.agency.country.code,
                name: input.agency.company.name,
                agencyNumber: input.agency.company.number,
                website: input.agency.company.website,

                postalCode: input.agency.address.postalCode,
                houseNumber: input.agency.address.houseNumber,
                houseNumberAddition: input.agency.address.houseNumberAddition,
                street: input.agency.address.street,
                city: input.agency.address.city,
                phoneDialCode: input.agency.phone.dial_code,
                phoneNumber: input.agency.phone.number,
              })
              .returning();

            await tx.insert(agencyContact).values({
              agencyId: insertedAgency.id,
              pronounce: input.contact.pronounce,
              name: input.contact.name,
              surname: input.contact.surname,
              jobTitle: input.contact.jobTitle,
              phoneDialCode: input.contact.phone.dial_code,
              phoneNumber: input.contact.phone.number,
              namePrefix: input.contact.namePrefix,
            });

            const [insertedAgencyProfile] = await tx
              .insert(agencyProfile)
              .values({
                agencyId: insertedAgency.id,
              })
              .returning();

            await tx.insert(agencyOfficeLocation).values({
              profileId: insertedAgencyProfile.id,
              countryCode: input.agency.country.code,
              isPrimary: 1,
              city: input.agency.address.city,
            });
          } catch (err) {
            // biome-ignore lint/complexity/noUselessCatch: <explanation>
            throw err;
          }
        });

        return {
          userId: 11, // createdUser.user.id,
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
