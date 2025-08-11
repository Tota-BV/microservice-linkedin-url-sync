// ============================================================================
// REPOSITORY: Skills Database Operations
// ============================================================================
// Purpose: Handle skills database operations - database layer only
// Input: Processed skills data
// Output: Database operation results

import { pool } from "../database";

export interface SkillDatabaseResult {
  skillId: string;
  skillName: string;
  wasCreated: boolean;
  wasMatched: boolean;
}

export interface SkillsRepositoryResult {
  success: boolean;
  processedSkills: SkillDatabaseResult[];
  error?: string;
  metadata: {
    totalSkills: number;
    skillsCreated: number;
    skillsMatched: number;
    processedAt: string;
  };
}

export class SkillsRepository {
  async findSkillByNameOrAbbreviation(skillName: string): Promise<any> {
    const cleaned = (skillName || "").trim();
    if (!cleaned) return null;

    try {
      const result = await pool.query(
        `SELECT *
         FROM skills
         WHERE is_active = true
           AND (
             LOWER(name) = LOWER($1)
             OR EXISTS (
               SELECT 1 FROM unnest(COALESCE(abbreviations, ARRAY[]::text[])) AS ab
               WHERE LOWER(ab) = LOWER($1)
             )
           )
         LIMIT 1`,
        [cleaned],
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        "❌ [SKILLS] Error finding skill by name or abbreviation:",
        error,
      );
      return null;
    }
  }

  async createSkill(skillName: string): Promise<string> {
    try {
      const result = await pool.query(
        `INSERT INTO skills (name, source, is_active)
         VALUES ($1, $2, true)
         ON CONFLICT (LOWER(name)) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [skillName, "user"],
      );
      return result.rows[0].id;
    } catch (error) {
      // Fallback for missing unique constraint
      const message = error instanceof Error ? error.message : String(error);
      if (
        message.includes(
          "no unique or exclusion constraint matching the ON CONFLICT specification",
        )
      ) {
        const existing = await this.findSkillByNameOrAbbreviation(skillName);
        if (existing) return existing.id;
        const plain = await pool.query(
          "INSERT INTO skills (name, source, is_active) VALUES ($1, $2, true) RETURNING id",
          [skillName, "user"],
        );
        return plain.rows[0].id;
      }
      console.error("❌ [SKILLS] Error creating skill:", error);
      throw error;
    }
  }

  async processSkillsForDatabase(
    processedSkills: Array<{ skillName: string; endorsementsCount: number; isCore: boolean }>,
  ): Promise<SkillsRepositoryResult> {
    try {
      console.log(
        `🔄 [SKILLS-REPO] Starting database operations for ${processedSkills.length} skills`,
      );

      if (!processedSkills || processedSkills.length === 0) {
        return {
          success: true,
          processedSkills: [],
          metadata: {
            totalSkills: 0,
            skillsCreated: 0,
            skillsMatched: 0,
            processedAt: new Date().toISOString(),
          },
        };
      }

      const databaseResults: SkillDatabaseResult[] = [];
      let skillsCreated = 0;
      let skillsMatched = 0;

      for (const skill of processedSkills) {
        try {
          const skillName = skill.skillName?.trim();
          if (!skillName) {
            console.warn(`⚠️ [SKILLS-REPO] Skipping skill with empty name:`, skill);
            continue;
          }

          console.log(`🔄 [SKILLS-REPO] Processing skill: ${skillName}`);

          // Try to find existing skill by name or abbreviation
          let existingSkill = await this.findSkillByNameOrAbbreviation(skillName);
          let wasCreated = false;
          let wasMatched = false;

          if (existingSkill) {
            // Skill already exists - use it
            console.log(
              `✅ [SKILLS-REPO] Found existing skill: ${skillName} (ID: ${existingSkill.id})`,
            );
            wasMatched = true;
            skillsMatched++;
          } else {
            // Skill doesn't exist - create it
            console.log(`🆕 [SKILLS-REPO] Creating new skill: ${skillName}`);
            const skillId = await this.createSkill(skillName);
            existingSkill = {
              id: skillId,
              name: skillName,
              source: "user" as const,
              is_active: true,
              created_at: new Date(),
              updated_at: new Date(),
            };
            wasCreated = true;
            skillsCreated++;
            console.log(
              `✅ [SKILLS-REPO] Created skill: ${skillName} (ID: ${skillId})`,
            );
          }

          // Add to database results
          databaseResults.push({
            skillId: existingSkill.id,
            skillName: existingSkill.name,
            wasCreated,
            wasMatched,
          });
        } catch (skillError) {
          console.error(
            `❌ [SKILLS-REPO] Error processing skill ${skill.skillName}:`,
            skillError,
          );
          // Continue with other skills
        }
      }

      console.log(
        `✅ [SKILLS-REPO] Database operations completed: ${databaseResults.length} processed`,
      );

      return {
        success: true,
        processedSkills: databaseResults,
        metadata: {
          totalSkills: processedSkills.length,
          skillsCreated,
          skillsMatched,
          processedAt: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error(`❌ [SKILLS-REPO] Error in skills database operations:`, error);
      return {
        success: false,
        processedSkills: [],
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          totalSkills: 0,
          skillsCreated: 0,
          skillsMatched: 0,
          processedAt: new Date().toISOString(),
        },
      };
    }
  }
}
