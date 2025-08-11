// ============================================================================
// REPOSITORY: Skills-Candidate Relationship Management
// ============================================================================
// Purpose: Handle the many-to-many relationship between skills and candidates
// Input: Candidate ID and skills data
// Output: Database operation results for skills-candidate links

import { pool } from "../database";

export interface SkillsCandidateLink {
  skillId: string;
  skillName: string;
  wasCreated: boolean;
  wasMatched: boolean;
}

export interface SkillsCandidateRepositoryResult {
  success: boolean;
  skillsLinked: number;
  error?: string;
  metadata: {
    processedAt: string;
    totalSkills: number;
    newLinks: number;
    existingLinks: number;
  };
}

export class SkillsCandidateRepository {
  async linkSkillsToCandidate(
    candidateId: string,
    skills: SkillsCandidateLink[],
  ): Promise<SkillsCandidateRepositoryResult> {
    if (!skills || skills.length === 0) {
      return {
        success: true,
        skillsLinked: 0,
        metadata: {
          processedAt: new Date().toISOString(),
          totalSkills: 0,
          newLinks: 0,
          existingLinks: 0,
        },
      };
    }

    try {
      console.log(
        `🔄 [SKILLS-CANDIDATE] Linking ${skills.length} skills to candidate: ${candidateId}`,
      );

      let newLinks = 0;
      let existingLinks = 0;

      for (const skill of skills) {
        // Check if skill-candidate link already exists
        const existingLink = await pool.query(
          "SELECT id FROM candidates_skills WHERE candidate_id = $1 AND skill_id = $2",
          [candidateId, skill.skillId],
        );

        if (existingLink.rows.length === 0) {
          // Create new link
          await pool.query(
            `INSERT INTO candidates_skills (
              candidate_id, skill_id, is_core
            ) VALUES ($1, $2, $3)`,
            [candidateId, skill.skillId, false],
          );
          newLinks++;
          console.log(
            `✅ [SKILLS-CANDIDATE] Linked skill: ${skill.skillName} to candidate: ${candidateId}`,
          );
        } else {
          existingLinks++;
          console.log(
            `ℹ️ [SKILLS-CANDIDATE] Skill already linked: ${skill.skillName} to candidate: ${candidateId}`,
          );
        }
      }

      const totalLinked = newLinks + existingLinks;
      console.log(
        `✅ [SKILLS-CANDIDATE] Skills linking completed: ${totalLinked} total, ${newLinks} new, ${existingLinks} existing`,
      );

      return {
        success: true,
        skillsLinked: totalLinked,
        metadata: {
          processedAt: new Date().toISOString(),
          totalSkills: skills.length,
          newLinks,
          existingLinks,
        },
      };
    } catch (error) {
      console.error("❌ [SKILLS-CANDIDATE] Error linking skills to candidate:", error);
      return {
        success: false,
        skillsLinked: 0,
        error: error instanceof Error ? error.message : "Unknown error",
        metadata: {
          processedAt: new Date().toISOString(),
          totalSkills: skills.length,
          newLinks: 0,
          existingLinks: 0,
        },
      };
    }
  }

  async getCandidateSkills(candidateId: string): Promise<any[]> {
    try {
      const result = await pool.query(
        `SELECT 
          cs.id,
          cs.candidate_id,
          cs.skill_id,
          cs.endorsements_count,
          cs.source,
          s.name as skill_name,
          s.description as skill_description
        FROM candidates_skills cs
        JOIN skills s ON cs.skill_id = s.id
        WHERE cs.candidate_id = $1
        ORDER BY cs.endorsements_count DESC, s.name ASC`,
        [candidateId],
      );
      return result.rows;
    } catch (error) {
      console.error("❌ [SKILLS-CANDIDATE] Error getting candidate skills:", error);
      return [];
    }
  }

  async removeSkillFromCandidate(
    candidateId: string,
    skillId: string,
  ): Promise<boolean> {
    try {
      const result = await pool.query(
        "DELETE FROM candidates_skills WHERE candidate_id = $1 AND skill_id = $2",
        [candidateId, skillId],
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("❌ [SKILLS-CANDIDATE] Error removing skill from candidate:", error);
      return false;
    }
  }
}
