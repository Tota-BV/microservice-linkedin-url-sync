import {
	boolean,
	customType,
	date,
	pgEnum,
	pgTable,
	text,
	uuid,
	vector,
} from "drizzle-orm/pg-core";

export const skillType = pgEnum("skill_type", [
	"language",
	"library",
	"storage",
	"tool",
	"other",
]);

export const source = pgEnum("source", ["esco", "user", "admin"]);

const textArray = customType<{ data: string[]; driverData: string[] }>({
	dataType() {
		return "text[]";
	},
});

export const skills = pgTable("skills", {
	id: uuid("id").primaryKey().defaultRandom(),
	name: text("name").notNull(),
	skillType: skillType("skill_type").notNull(),
	source: source("source").notNull(),
	isActive: boolean("is_active").notNull().default(true),
	escoId: text("esco_id"),
	abbreviations: textArray("abbreviations"),
	createdAt: date("created_at").notNull().defaultNow(),
	updatedAt: date("updated_at").notNull().defaultNow(),

	embedding: vector("embedding", { dimensions: 1536 }).notNull(),
});
