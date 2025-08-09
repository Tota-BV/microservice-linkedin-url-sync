import { Pool } from 'pg';
import { mapLinkedInToCandidate } from './linkedin-mapper';
import { loadFromCache } from './cache';

// Database connection
export const pool = new Pool({
	connectionString: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/candidates_db'
});

// Lightweight DB ping for health checks
export async function pingDatabase(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const startedAt = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - startedAt };
  } catch (error) {
    return { ok: false, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Interfaces
export interface Skill {
	id: string;
	name: string;
	source: 'esco' | 'user' | 'admin';
	is_active: boolean;
	esco_id?: string;
	abbreviations?: string[];
	created_at: Date;
	updated_at: Date;
	embedding?: any; // vector type
}

export interface Candidate {
	id: string;
	first_name: string;
	last_name: string;
	email: string;
	date_of_birth: string;
	linkedin_url: string;
	profile_image_url: string;
	working_location: string;
	bio: string;
	general_job_title: string;
	current_company: string;
	category: string | null;
	is_active: boolean;
	created_at: Date;
	updated_at: Date;
}

// Core database functions
export async function findSkillByName(skillName: string): Promise<Skill | null> {
	try {
		const result = await pool.query(
			'SELECT * FROM skills WHERE LOWER(name) = LOWER($1) AND is_active = true',
			[skillName]
		);
		return result.rows[0] || null;
	} catch (error) {
		console.error('Error finding skill by name:', error);
		return null;
	}
}

// Find a skill by its canonical name OR any of its abbreviations (synonyms)
export async function findSkillByNameOrAbbreviation(skillName: string): Promise<Skill | null> {
  const cleaned = (skillName || '').trim();
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
      [cleaned]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding skill by name or abbreviation:', error);
    return null;
  }
}

export async function createSkill(skillName: string): Promise<string> {
  try {
    const result = await pool.query(
      `INSERT INTO skills (name, source, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (LOWER(name)) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [skillName, 'user']
    );
    return result.rows[0].id;
  } catch (error) {
    // If ON CONFLICT cannot be used because the unique index is missing,
    // fall back to read-then-insert to avoid crashing.
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('no unique or exclusion constraint matching the ON CONFLICT specification')) {
      const existing = await findSkillByName(skillName);
      if (existing) return existing.id;
      const plain = await pool.query(
        'INSERT INTO skills (name, source, is_active) VALUES ($1, $2, true) RETURNING id',
        [skillName, 'user']
      );
      return plain.rows[0].id;
    }
    console.error('Error creating skill:', error);
    throw error;
  }
}

// Ensure all LinkedIn skills exist in our skills table before linking
export async function ensureSkillsExistFromLinkedInData(linkedinData: any): Promise<{
  total: number;
  createdCount: number;
  alreadyExistedCount: number;
}> {
  const skills = Array.isArray(linkedinData?.skills) ? linkedinData.skills : [];
  let createdCount = 0;
  let alreadyExistedCount = 0;

  for (const s of skills) {
    const skillName: string | undefined = s?.name?.trim();
    if (!skillName) continue;

    const existing = await findSkillByNameOrAbbreviation(skillName);
    if (existing) {
      alreadyExistedCount++;
      continue;
    }
    try {
      await createSkill(skillName);
      createdCount++;
    } catch (e) {
      // Ignore unique violations to keep idempotent
      console.warn(`Skill creation skipped for '${skillName}':`, e instanceof Error ? e.message : e);
    }
  }

  return { total: skills.length, createdCount, alreadyExistedCount };
}

export async function findCandidateByLinkedInUrl(linkedinUrl: string): Promise<Candidate | null> {
	try {
		const result = await pool.query(
			'SELECT * FROM candidates WHERE linkedin_url = $1',
			[linkedinUrl]
		);
		return result.rows[0] || null;
			} catch (error) {
		console.error('Error finding candidate by LinkedIn URL:', error);
		return null;
	}
}

export async function linkSkillsToCandidate(candidateId: string, skills: Array<{skillId: string, endorsementsCount: number, source: string}>) {
		for (const skill of skills) {
		try {
			// Check if already linked
			const existingLink = await pool.query(
				'SELECT id FROM candidates_skills WHERE candidate_id = $1 AND skill_id = $2',
				[candidateId, skill.skillId]
			);
			
			if (existingLink.rows.length > 0) {
				console.log(`⚠️ Skill ${skill.skillId} already linked to candidate ${candidateId}`);
				continue;
			}
			
			// Link skill to candidate
			await pool.query(
				'INSERT INTO candidates_skills (candidate_id, skill_id, is_core) VALUES ($1, $2, $3)',
				[candidateId, skill.skillId, false]
			);
			
			console.log(`✅ Linked skill ${skill.skillId} to candidate ${candidateId}`);
			} catch (error) {
			console.error(`❌ Error linking skill ${skill.skillId}:`, error);
		}
	}
}

// Main sequential processing function
export async function processLinkedInDataSequentially(linkedinUrl: string): Promise<{
	success: boolean;
  step3?: {
    totalSkillsDiscovered: number;
    createdSkills: number;
    alreadyExisted: number;
  };
	step4?: {
		skillsLinked: number;
		totalSkills: number;
	};
	step5?: {
		educationInserted: number;
		certificationsInserted: number;
		languagesInserted: number;
		verificationInserted: number;
	};
	error?: string;
}> {
	try {
		// STEP 1: Find existing candidate
		console.log(`🔄 Starting sequential processing for: ${linkedinUrl}`);
		const candidate = await findCandidateByLinkedInUrl(linkedinUrl);
		
		if (!candidate) {
			return { success: false, error: 'Candidate not found' };
		}
		
		console.log(`✅ Step 1: Found candidate ${candidate.id}`);
		
		// STEP 2: Get LinkedIn data
		const linkedinData = await loadFromCache(linkedinUrl);
		if (!linkedinData) {
			return { success: false, error: 'Failed to retrieve LinkedIn data' };
		}
		
		console.log(`✅ Step 2: Retrieved LinkedIn data`);
		
    // STEP 3: Ensure skills exist in our database
    const ensureResult = await ensureSkillsExistFromLinkedInData(linkedinData);
    console.log(`✅ Step 3: Ensured skills exist (created ${ensureResult.createdCount}, existed ${ensureResult.alreadyExistedCount})`);

    // Map LinkedIn data to candidate format (now that skills exist)
    const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
    console.log(`✅ Step 4: Mapped LinkedIn data to candidate format`);
		
    // STEP 4: Link skills to candidate (ONLY after skills are ensured to exist)
    console.log(`🔄 Step 5: Starting skills linking...`);
		
		const skillsToLink = candidateData.candidateProfile.skills
			.filter(skill => skill.skillId !== null)
			.map(skill => ({
				skillId: skill.skillId as string,
				endorsementsCount: skill.endorsementsCount,
				source: skill.source
			}));
		
		await linkSkillsToCandidate(candidate.id, skillsToLink);
		
		const step4Result = {
			linkedCount: skillsToLink.length,
			totalSkills: candidateData.candidateProfile.skills.length
		};
		
    console.log(`✅ Step 5: Skills linking completed (${step4Result.linkedCount}/${step4Result.totalSkills} skills linked)`);
		
    // STEP 5: Insert education and certifications (ONLY after Step 4 completes)
    console.log(`🔄 Step 6: Starting education and certifications insertion...`);
		
		const educationResult = await insertEducation(candidate.id, candidateData);
		const certificationResult = await insertCertifications(candidate.id, candidateData);
		const languageResult = await insertLanguages(candidate.id, candidateData);
		const verificationResult = await insertVerification(candidate.id, candidateData);
		
    console.log(`✅ Step 6: Education and certifications completed`);
		
		return {
			success: true,
      step3: {
        totalSkillsDiscovered: ensureResult.total,
        createdSkills: ensureResult.createdCount,
        alreadyExisted: ensureResult.alreadyExistedCount
      },
			step4: {
				skillsLinked: step4Result.linkedCount || 0,
				totalSkills: step4Result.totalSkills || 0
			},
			step5: {
				educationInserted: educationResult.insertedCount,
				certificationsInserted: certificationResult.insertedCount,
				languagesInserted: languageResult.insertedCount,
				verificationInserted: verificationResult.insertedCount
			}
		};
		
	} catch (error) {
		console.error('❌ Error in sequential processing:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Individual table insert functions
export async function insertEducation(candidateId: string, candidateData: any): Promise<{ success: boolean; insertedCount: number; error?: string }> {
	try {
		const educationData = candidateData.candidateProfile?.education || [];
		let insertedCount = 0;

		for (const edu of educationData) {
			const result = await pool.query(
				`INSERT INTO candidates_education (candidate_id, degree_title, start_year, end_year, institution, location) 
				 VALUES ($1, $2, $3, $4, $5, $6) 
				 ON CONFLICT DO NOTHING`,
				[
					candidateId,
					edu.degreeTitle,
					edu.startYear,
					edu.endYear,
					edu.institution,
					edu.location
				]
			);
			
			if (result.rowCount && result.rowCount > 0) {
				insertedCount++;
			}
		}

		return { success: true, insertedCount };
	} catch (error) {
		console.error('❌ Error inserting education:', error);
		return { success: false, insertedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function insertCertifications(candidateId: string, candidateData: any): Promise<{ success: boolean; insertedCount: number; error?: string }> {
	try {
		const certificationData = candidateData.candidateProfile?.certifications || [];
		let insertedCount = 0;

		for (const cert of certificationData) {
			const result = await pool.query(
				`INSERT INTO candidates_certifications (candidate_id, name, issuer, issue_date, expiry_date) 
				 VALUES ($1, $2, $3, $4, $5) 
				 ON CONFLICT DO NOTHING`,
				[
					candidateId,
					cert.name,
					cert.issuer,
					cert.issueDate,
					cert.expiryDate
				]
			);
			
			if (result.rowCount && result.rowCount > 0) {
				insertedCount++;
			}
		}

		return { success: true, insertedCount };
					} catch (error) {
		console.error('❌ Error inserting certifications:', error);
		return { success: false, insertedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function insertLanguages(candidateId: string, candidateData: any): Promise<{ success: boolean; insertedCount: number; error?: string }> {
	try {
		const languageData = candidateData.candidateProfile?.languages || [];
		let insertedCount = 0;

		for (const lang of languageData) {
			const result = await pool.query(
				`INSERT INTO candidates_languages (candidate_id, language, proficiency) 
				 VALUES ($1, $2, $3) 
				 ON CONFLICT DO NOTHING`,
							[
								candidateId,
					lang.language,
					lang.proficiency
				]
			);
			
			if (result.rowCount && result.rowCount > 0) {
				insertedCount++;
			}
		}

		return { success: true, insertedCount };
	} catch (error) {
		console.error('❌ Error inserting languages:', error);
		return { success: false, insertedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}

export async function insertVerification(candidateId: string, candidateData: any): Promise<{ success: boolean; insertedCount: number; error?: string }> {
	try {
		const verificationData = candidateData.candidateProfile?.verification || [];
		let insertedCount = 0;

		for (const verif of verificationData) {
								const result = await pool.query(
						`INSERT INTO candidates_verification (candidate_id, job_title, company_name, start_year, end_year, description, "order") 
						 VALUES ($1, $2, $3, $4, $5, $6, $7) 
						 ON CONFLICT DO NOTHING`,
						[
							candidateId,
							verif.jobTitle,
							verif.companyName,
							verif.startYear,
							verif.endYear,
							verif.description && Array.isArray(verif.description) ? `{${verif.description.map((d: string) => `"${d}"`).join(',')}}` : null,
							verif.order
						]
					);
			
			if (result.rowCount && result.rowCount > 0) {
				insertedCount++;
			}
		}

		return { success: true, insertedCount };
	} catch (error) {
		console.error('❌ Error inserting verification:', error);
		return { success: false, insertedCount: 0, error: error instanceof Error ? error.message : 'Unknown error' };
	}
}
