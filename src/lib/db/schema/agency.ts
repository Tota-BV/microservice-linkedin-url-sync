import type { ReferenceAndProject } from "@/features/agency-profile/model/types";
import { relations } from "drizzle-orm";
import {
  integer,
  json,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { countries } from "./countries";

export const verificationStatus = pgEnum("verification_status", [
  "In progress",
  "Approved",
  "Rejected",
  "Not submitted",
]);

export const docType = pgEnum("doc_type", [
  "business-registration",
  "bank-account",
  "customer-screening",
  "tax-verification",
]);

export const agency = pgTable("agencies", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  countryCode: text("country_code")
    .notNull()
    .references(() => countries.code),

  name: text("name").notNull(),
  agencyNumber: text("agency_number").notNull(),
  website: text("website").notNull(),

  description: text("description").notNull().default(""),

  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  houseNumber: text("house_number").notNull(),
  houseNumberAddition: text("house_number_addition"),
  city: text("city").notNull(),

  phoneDialCode: text("phone_dial_code").notNull(),
  phoneNumber: integer("phone_number").notNull(),
});

export const agencyProfile = pgTable("agencies_profile", {
  id: uuid("id").primaryKey().defaultRandom(),

  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id),

  // after register
  overview: text("overview").notNull().default(""),
  usps: json("usps").notNull().default([]),
  skills: json("skills")
    .$type<Record<"value", string>[]>()
    .notNull()
    .default([]),
  referencesAndProjects: json("references_and_projects")
    .$type<ReferenceAndProject[]>()
    .notNull()
    .default([]),
});

export const agencyOfficeLocation = pgTable("agencies_office_locations", {
  id: uuid("id").primaryKey().defaultRandom(),

  profileId: uuid("profile_id")
    .notNull()
    .references(() => agencyProfile.id, { onDelete: "cascade" }),

  city: text("city").notNull(),

  countryCode: text("country_code")
    .notNull()
    .references(() => countries.code),

  isPrimary: integer("is_primary").notNull().default(0),

  timezone: text("timezone"),
});

export const agencyContact = pgTable("agencies_contact", {
  id: uuid("id").primaryKey().defaultRandom(),

  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id),

  pronounce: text("pronounce", {
    enum: ["Mr", "Mrs", "Other"],
  }).notNull(),

  name: text("name").notNull(),
  namePrefix: text("name_prefix"),
  surname: text("surname").notNull(),
  jobTitle: text("job_title").notNull(),

  phoneDialCode: text("phone_dial_code").notNull(),
  phoneNumber: integer("phone_number").notNull(),
});

export const agencyDocuments = pgTable("agencies_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: docType().notNull(),
  status: verificationStatus().notNull().default("Not submitted"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyTokens = pgTable("agencies_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id, { onDelete: "cascade" })
    .unique(),
  tokenCount: integer("token_count").notNull().default(0),
  lastPurchaseAt: timestamp("last_purchase_at", { mode: "date" }),
});

export const agencyInvoices = pgTable("agencies_invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id, { onDelete: "cascade" }),
  date: timestamp("purchased_at", { mode: "date" }),
  amount: integer("amount").notNull(),
  status: text("status"),
  type: text("invoice_type"),
  invoiceUrl: text("invoice_url"),
  invoicePdf: text("invoice_pdf"),
});

// relations

export const agencyRelations = relations(agency, ({ one, many }) => ({
  country: one(countries, {
    fields: [agency.countryCode],
    references: [countries.code],
  }),
  profile: one(agencyProfile, {
    fields: [agency.id],
    references: [agencyProfile.agencyId],
  }),
  documents: many(agencyDocuments),
  tokens: one(agencyTokens, {
    fields: [agency.id],
    references: [agencyTokens.agencyId],
  }),
}));

export const agencyProfileRelations = relations(
  agencyProfile,
  ({ one, many }) => ({
    agency: one(agency, {
      fields: [agencyProfile.agencyId],
      references: [agency.id],
    }),
    contact: one(agencyContact, {
      fields: [agencyProfile.id],
      references: [agencyContact.agencyId],
    }),
    officeLocations: many(agencyOfficeLocation),
  }),
);

export const agencyOfficeLocationRelations = relations(
  agencyOfficeLocation,
  ({ one }) => ({
    profile: one(agencyProfile, {
      fields: [agencyOfficeLocation.profileId],
      references: [agencyProfile.id],
    }),
    country: one(countries, {
      fields: [agencyOfficeLocation.countryCode],
      references: [countries.code],
    }),
  }),
);

export const agencyDocumentsRelations = relations(
  agencyDocuments,
  ({ one }) => ({
    agencyProfile: one(agency, {
      fields: [agencyDocuments.agencyId],
      references: [agency.id],
    }),
  }),
);

export const agencyTokenRelations = relations(agencyTokens, ({ one }) => ({
  agency: one(agency, {
    fields: [agencyTokens.agencyId],
    references: [agency.id],
  }),
}));

export const agencyInvoiceRelations = relations(agencyInvoices, ({ one }) => ({
  agency: one(agency, {
    fields: [agencyInvoices.agencyId],
    references: [agency.id],
  }),
}));
