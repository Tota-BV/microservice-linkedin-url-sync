import type {
  AvailabilityType,
  EducationType,
  ExperienceType,
} from "@/features/candidates/profile/model/types";
import { relations } from "drizzle-orm";
import { date, json, numeric, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { agency } from "./agency";

export const candidate = pgTable("candidates", {
  id: uuid("id").primaryKey().defaultRandom(),

  agencyId: uuid("agency_id")
    .notNull()
    .references(() => agency.id),

  name: text("name").notNull(),
  surname: text("surname").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  birthdate: date("date_of_birth").notNull(),
});

export const candidateMatchingCriteria = pgTable(
  "candidates_matching_criteria",
  {
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => candidate.id),
    availability: json("availability").$type<AvailabilityType>(),
    priceFrom: numeric("price_from"),
    priceTo: numeric("price_to"),
    hoursPerWeek: json("hours_per_week").$type<[number, number]>(),
    languages: json("languages").$type<string[]>(),
  },
);

export const candidateProfile = pgTable("candidates_profile", {
  candidateId: uuid("candidate_id")
    .notNull()
    .references(() => candidate.id),

  linkedin: text("linkedin"),

  jobTitle: text("title"),
  description: text("description"),

  profileStrength: text("profile_strength").default("weak"),
  agencySummary: text("agency_summary"),
  skills: json("skills")
    .$type<Record<"value", string>[]>()
    .notNull()
    .default([]),
  experience: json("experience")
    .$type<ExperienceType[]>()
    .notNull()
    .default([]),
  education: json("education").$type<EducationType[]>().notNull().default([]),
});

// relations

// export const agencyCandidateRelations = relations(agency, ({ many }) => ({
//   candidates: many(candidate),
// }));

// export const candidateAgencyRelations = relations(candidate, ({ one }) => ({
//   agency: one(agency, {
//     fields: [candidate.agencyId],
//     references: [agency.id],
//   }),
// }));

export const candidateRelations = relations(candidate, ({ one }) => ({
  profile: one(candidateProfile, {
    fields: [candidate.id],
    references: [candidateProfile.candidateId],
  }),
}));
