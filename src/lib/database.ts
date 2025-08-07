import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { getDatabaseUrl } from "./env.server";

// Database connection pool
const pool = new Pool({
	connectionString: getDatabaseUrl(),
	ssl: false,
});

// Drizzle database instance
export const db = drizzle(pool);

// Skills table schema (matches existing database)
export interface Skill {
	id: string;
	name: string;
	source: 'esco' | 'user' | 'admin' | 'linkedin';
	is_active: boolean;
	esco_id?: string;
	abbreviations?: string[];
	created_at: Date;
	updated_at: Date;
	embedding?: any; // vector type
}

// Candidate interface
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

// Find skill by name (works with existing table structure)
export async function findSkillByName(skillName: string): Promise<Skill | null> {
	try {
		const result = await pool.query(
			'SELECT * FROM skills WHERE name ILIKE $1 AND is_active = true',
			[skillName]
		);
		
		if (result.rows.length > 0) {
			return result.rows[0] as Skill;
		}
		
		return null;
	} catch (error) {
		console.error('Error finding skill by name:', error);
		return null;
	}
}

// Create new skill (works with existing table structure)
export async function createSkill(skillName: string, skillType: string): Promise<string> {
	try {
		const result = await pool.query(
			`INSERT INTO skills (id, name, source, is_active, created_at, updated_at, embedding) 
			 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW(), $4) 
			 RETURNING id`,
			[skillName, 'linkedin', true, '[0.1, 0.2, 0.3, ...]']
		);
		
		console.log(`✅ Created new skill: ${skillName}`);
		return result.rows[0].id;
	} catch (error) {
		console.error('Error creating skill:', error);
		throw new Error(`Failed to create skill: ${skillName}`);
	}
}

// Create candidate profile
export async function createCandidate(candidateData: any): Promise<string> {
	try {
		const result = await pool.query(
			`INSERT INTO candidates (
				id, first_name, last_name, email, date_of_birth, linkedin_url,
				profile_image_url, working_location, bio, general_job_title,
				current_company, category, is_active, created_at, updated_at
			) VALUES (
				gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
			) RETURNING id`,
			[
				candidateData.firstName,
				candidateData.lastName,
				candidateData.email,
				candidateData.dateOfBirth,
				candidateData.linkedinUrl,
				candidateData.profileImageUrl,
				candidateData.workingLocation,
				candidateData.bio,
				candidateData.generalJobTitle,
				candidateData.currentCompany,
				candidateData.category,
				candidateData.isActive
			]
		);
		
		console.log(`✅ Created candidate: ${candidateData.firstName} ${candidateData.lastName}`);
		return result.rows[0].id;
	} catch (error) {
		console.error('Error creating candidate:', error);
		throw new Error(`Failed to create candidate: ${candidateData.firstName} ${candidateData.lastName}`);
	}
}

// Link skills to candidate
export async function linkSkillsToCandidate(candidateId: string, skills: any[]): Promise<void> {
	try {
		for (const skill of skills) {
			// Find skill by name
			const skillRecord = await findSkillByName(skill.skillName);
			
			if (skillRecord) {
				// Link existing skill
				await pool.query(
					`INSERT INTO candidate_skills (
						candidate_id, skill_id, is_core, endorsements_count, source, created_at
					) VALUES ($1, $2, $3, $4, $5, NOW())
					ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
						is_core = EXCLUDED.is_core,
						endorsements_count = EXCLUDED.endorsements_count,
						updated_at = NOW()`,
					[
						candidateId,
						skillRecord.id,
						skill.isCore,
						skill.endorsementsCount,
						skill.source
					]
				);
				
				console.log(`🔗 Linked skill: ${skill.skillName} to candidate`);
			} else {
				// Create new skill and link
				const newSkillId = await createSkill(skill.skillName, skill.skillType);
				
				await pool.query(
					`INSERT INTO candidate_skills (
						candidate_id, skill_id, is_core, endorsements_count, source, created_at
					) VALUES ($1, $2, $3, $4, $5, NOW())`,
					[
						candidateId,
						newSkillId,
						skill.isCore,
						skill.endorsementsCount,
						skill.source
					]
				);
				
				console.log(`🆕 Created and linked skill: ${skill.skillName} to candidate`);
			}
		}
	} catch (error) {
		console.error('Error linking skills to candidate:', error);
		throw new Error('Failed to link skills to candidate');
	}
}

// Complete LinkedIn sync with database insertion
export async function syncLinkedInToDatabase(linkedinData: any, linkedinUrl: string): Promise<{
	success: boolean;
	candidateId?: string;
	skillsCreated?: number;
	skillsLinked?: number;
	error?: string;
}> {
	try {
		// Import the mapping function
		const { mapLinkedInToCandidate } = await import('./linkedin-mapper');
		
		// Map LinkedIn data to candidate format
		const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
		
		// Create candidate in database
		const candidateId = await createCandidate(candidateData.candidateProfile);
		
		// Link all skills to candidate
		await linkSkillsToCandidate(candidateId, candidateData.candidateProfile.skills);
		
		const skillsCreated = candidateData.databaseOperations.skillsToCreate.length;
		const skillsLinked = candidateData.candidateProfile.skills.length;
		
		console.log(`✅ LinkedIn sync complete: Candidate ${candidateId} with ${skillsLinked} skills (${skillsCreated} new)`);
		
		return {
			success: true,
			candidateId,
			skillsCreated,
			skillsLinked
		};
		
	} catch (error) {
		console.error('Error in LinkedIn sync to database:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

// Get all skills (for reference)
export async function getAllSkills(): Promise<Skill[]> {
  try {
    const result = await pool.query(
      'SELECT * FROM skills WHERE is_active = true ORDER BY name'
    );
    return result.rows as Skill[];
  } catch (error) {
    console.error('Error getting all skills:', error);
    return [];
  }
}
