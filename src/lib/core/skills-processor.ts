// ============================================================================
// CORE: Skills Processing (Normalize → Match → Create)
// ============================================================================
// Purpose: Handle skills processing business logic - no database operations
// Input: Raw skills data from LinkedIn
// Output: Processed skills data (database operations handled by repository)

export interface ProcessedSkill {
  skillName: string;
  endorsementsCount: number;
  source: string;
  isCore: boolean;
  needsCreation: boolean;
}

export interface SkillsProcessingResult {
  success: boolean;
  processedSkills: ProcessedSkill[];
  error?: string;
  metadata: {
    totalSkills: number;
    skillsToCreate: number;
    skillsToMatch: number;
    processedAt: string;
  };
}

export function processSkills(
  linkedinSkills: any[],
): SkillsProcessingResult {
  try {
    console.log(
      `🔄 [SKILLS] Starting skills processing for ${linkedinSkills.length} skills`,
    );

    if (!linkedinSkills || linkedinSkills.length === 0) {
      return {
        success: true,
        processedSkills: [],
        metadata: {
          totalSkills: 0,
          skillsToCreate: 0,
          skillsToMatch: 0,
          processedAt: new Date().toISOString(),
        },
      };
    }

    const processedSkills: ProcessedSkill[] = [];
    let skillsToCreate = 0;
    let skillsToMatch = 0;

    for (const skill of linkedinSkills) {
      try {
        const skillName = skill.name?.trim();
        if (!skillName) {
          console.warn(`⚠️ [SKILLS] Skipping skill with empty name:`, skill);
          continue;
        }

        console.log(`🔄 [SKILLS] Processing skill: ${skillName}`);

        // Business logic: Determine if skill needs creation
        const needsCreation = true; // All skills need database resolution
        const isCore = skill.passedSkillAssessment || false;
        const endorsementsCount = skill.endorsementsCount || 0;

        if (needsCreation) {
          skillsToCreate++;
        } else {
          skillsToMatch++;
        }

        // Add to processed skills
        processedSkills.push({
          skillName,
          endorsementsCount,
          source: "user",
          isCore,
          needsCreation,
        });

        console.log(
          `✅ [SKILLS] Processed: ${skillName} (${needsCreation ? 'needs creation' : 'will match'})`,
        );
      } catch (skillError) {
        console.error(
          `❌ [SKILLS] Error processing skill ${skill.name}:`,
          skillError,
        );
        // Continue with other skills
      }
    }

    console.log(
      `✅ [SKILLS] Skills processing completed: ${processedSkills.length} processed`,
    );

    return {
      success: true,
      processedSkills,
      metadata: {
        totalSkills: linkedinSkills.length,
        skillsToCreate,
        skillsToMatch,
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`❌ [SKILLS] Error in skills processing:`, error);
    return {
      success: false,
      processedSkills: [],
      error: error instanceof Error ? error.message : "Unknown error",
      metadata: {
        totalSkills: 0,
        skillsToCreate: 0,
        skillsToMatch: 0,
        processedAt: new Date().toISOString(),
      },
    };
  }
}

// Business logic functions (pure functions, no database calls)
export function normalizeSkillName(skillName: string): string {
  return skillName.trim().toLowerCase();
}

export function isCoreSkill(skill: any): boolean {
  return skill.passedSkillAssessment || false;
}

export function getSkillEndorsements(skill: any): number {
  return skill.endorsementsCount || 0;
}
