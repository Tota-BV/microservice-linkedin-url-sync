import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
import { skills } from "@/lib/db/schema";

export const createSkillsSchema = createInsertSchema(skills);
export type CreateSkills = z.infer<typeof createSkillsSchema>;

export const selectSkillsSchema = createSelectSchema(skills);
export type SelectSkills = z.infer<typeof selectSkillsSchema>;

export const updateSkillsSchema = createUpdateSchema(skills);
export type UpdateSkills = z.infer<typeof updateSkillsSchema>;
