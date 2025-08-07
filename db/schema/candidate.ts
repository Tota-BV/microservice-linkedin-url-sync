import { relations } from "drizzle-orm";
import {
	boolean,
	customType,
	date,
	integer,
	json,
	pgEnum,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	vector,
} from "drizzle-orm/pg-core";
import type { AvailabilityType } from "@/features/candidates/profile/model/types";
import { agency } from "./agency";
import { skills } from "./skills";

const textArray = customType<{ data: string[]; driverData: string[] }>({
	dataType() {
		return "text[]";
	},
});

export const candidateCategory = pgEnum("candidate_category", [
	"developer",
	"cyber",
	"designer",
	"project_manager",
	"product_owner",
]);

export const candidate = pgTable("candidates", {
	id: uuid("id").primaryKey().defaultRandom(),
	agencyId: uuid("agency_id")
		.notNull()
		.references(() => agency.id),

	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	middleName: text("middle_name"),
	dateOfBirth: date("date_of_birth").notNull(),
	email: text("email").unique().notNull(),
	profileImageUrl: text("profile_image_url"),
	linkedinUrl: text("linkedin_url"),
	workingLocation: text("working_location"),
	bio: text("bio"),
	generalJobTitle: text("general_job_title"),
	currentCompany: text("current_company"),

	category: candidateCategory("category"),
	jobTitleEmbedding: vector("job_title_embedding", { dimensions: 1536 }),
	isActive: boolean("is_active").default(true),

	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidateVerificationStatus = pgEnum(
	"candidate_verification_status",
	["not-invited", "invited", "ready", "validated", "flagged"],
);

export const candidateVerification = pgTable("candidates_verification", {
	id: uuid("id").primaryKey().defaultRandom(),
	candidateId: uuid("candidate_id")
		.notNull()
		.references(() => candidate.id),
	status: candidateVerificationStatus("status").default("not-invited"),
	reportUrl: text("report_url"),
	reportNotes: text("report_notes"),
	createdAt: timestamp("created_at").notNull().defaultNow(),
	updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const candidateWorkExperience = pgTable("candidates_verification", {
	id: uuid("id").primaryKey().defaultRandom(),
	candidateId: uuid("candidate_id")
		.notNull()
		.references(() => candidate.id),
	jobTitle: text("job_title"),
	companyName: text("company_name"),
	startYear: integer("start_year"),
	endYear: integer("end_year"),
	description: textArray("description"),
	order: integer("order"),
});

export const candidateAvailability = pgTable("candidates_availability", {
	id: uuid("id").primaryKey().defaultRandom(),
	candidateId: uuid("candidate_id")
		.notNull()
		.references(() => candidate.id),
	startDate: timestamp("start_date"),
	endDate: timestamp("end_date"),
	available: boolean("available"),
	hoursMin: integer("hours_min"),
	hoursMax: integer("hours_max"),
	workingHoursDetail: json("working_hours_detail")
		.$type<AvailabilityType>()
		.default(
			(
				["monday", "tuesday", "wednesday", "thursday", "friday"] as const
			).reduce(
				(prev, cur) =>
					Object.assign(prev, {
						[cur]: { from: "08:00", to: "18:00" },
					}),
				{} as AvailabilityType,
			),
		),
	timezoneOffset: text("timezone_offset"),
	overlapBefore: integer("overlap_before").default(0),
	overlapAfter: integer("overlap_after").default(0),
	hourlyRateMin: integer("hourly_rate_min"),
	hourlyRateMax: integer("hourly_rate_max"),
});

export const candidateSkills = pgTable(
	"candidates_skills",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		candidateId: uuid("candidate_id")
			.notNull()
			.references(() => candidate.id),
		skillId: uuid("skill_id")
			.notNull()
			.references(() => skills.id),
		isPrimary: boolean("is_core").default(false),
	},
	(table) => [unique().on(table.candidateId, table.skillId)],
);

export const candidateEducation = pgTable("candidates_education", {
	id: uuid("id").primaryKey().defaultRandom(),
	candidateId: uuid("candidate_id")
		.notNull()
		.references(() => candidate.id),

	degreeTitle: text("degree_title").notNull(),
	startYear: integer("start_year").notNull(),
	endYear: integer("end_year").notNull(),
	institution: text("institution").notNull(),
	location: text("location"),
});

export const candidateCertifications = pgTable("candidates_certifications", {
	id: uuid("id").primaryKey().defaultRandom(),
	candidateId: uuid("candidate_id")
		.notNull()
		.references(() => candidate.id),

	title: text("title").notNull(),
	startYear: integer("start_year").notNull(),
	endYear: integer("end_year").notNull(),
});

export const candidateLanguagesProficiency = pgEnum("verification_status", [
	"basic",
	"conversational",
	"professional",
	"fluent",
	"native",
]);

export const candidateLanguages = pgTable(
	"candidates_languages",
	{
		id: uuid("id").primaryKey().defaultRandom(),
		candidateId: uuid("candidate_id")
			.notNull()
			.references(() => candidate.id),

		language: text("language").notNull(),
		proficiency: candidateLanguagesProficiency("proficiency").notNull(),
	},
	(table) => [unique().on(table.candidateId, table.language)],
);

// relations
export const candidateSkillsRelations = relations(
	candidateSkills,
	({ one }) => ({
		skill: one(skills, {
			fields: [candidateSkills.skillId],
			references: [skills.id],
		}),
	}),
);
