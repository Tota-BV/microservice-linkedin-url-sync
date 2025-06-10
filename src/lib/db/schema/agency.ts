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

export const agencyProfile = pgTable("agencies_profile", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  countryCode: text("country_code")
    .notNull()
    .references(() => countries.code),

  companyName: text("company_name").notNull(),
  companyNumber: text("company_number").notNull(),
  companyWebsite: text("company_website").notNull(),

  street: text("street").notNull(),
  postalCode: text("postal_code").notNull(),
  houseNumber: text("house_number").notNull(),
  houseNumberAddition: text("house_number_addition"),
  city: text("city").notNull(),

  phoneDialCode: text("phone_dial_code").notNull(),
  phoneNumber: integer("phone_number").notNull(),

  // after register
  companyDescription: text("company_description").notNull().default(""),
  overview: text("overview").notNull().default(""),
  usps: json("usps").notNull().default([]),
  skills: json("skills").notNull().default([]),
  referencesAndProjects: text("references_and_projects").notNull().default(""),
});

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

export const agencyDocuments = pgTable("agencies_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  agencyProfileId: uuid("agency_profile_id")
    .notNull()
    .references(() => agencyProfile.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  url: text("url").notNull(),
  type: docType().notNull(),
  status: verificationStatus().notNull().default("Not submitted"),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agencyProfileRelations = relations(
  agencyProfile,
  ({ one, many }) => ({
    country: one(countries, {
      fields: [agencyProfile.countryCode],
      references: [countries.code],
    }),
    documents: many(agencyDocuments),
  }),
);

export const agencyDocumentsRelations = relations(
  agencyDocuments,
  ({ one }) => ({
    agencyProfile: one(agencyProfile, {
      fields: [agencyDocuments.agencyProfileId],
      references: [agencyProfile.id],
    }),
  }),
);

export const agencyContact = pgTable("agencies_contact", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: text("user_id")
    .notNull()
    .references(() => user.id),

  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agencyProfile.id),

  pronounce: text("pronounce", {
    enum: ["Mr", "Mrs", "Other"],
  }).notNull(),

  name: text("name").notNull(),
  namePrefix: text("name_prefix"), // optional
  surname: text("surname").notNull(),
  jobTitle: text("job_title").notNull(),

  phoneDialCode: text("phone_dial_code").notNull(),
  phoneNumber: integer("phone_number").notNull(),
});
