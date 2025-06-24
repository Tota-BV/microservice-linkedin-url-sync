import { agency, agencyDocuments, agencyProfile } from "@/lib/db/schema";
import { createUpdateSchema } from "drizzle-zod";
import type { z } from "zod";

export const updateAgencySchema = createUpdateSchema(agency);
export type UpdateAgency = z.infer<typeof updateAgencySchema>;

export const updateAgencyProfileSchema = createUpdateSchema(agencyProfile);
export type UpdateAgencyProfile = z.infer<typeof updateAgencyProfileSchema>;

export const updateAgencyDocumentsSchema = createUpdateSchema(agencyDocuments);
export type UpdateAgencyDocuments = z.infer<typeof updateAgencyDocumentsSchema>;
