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

// Check if database schema matches existing structure
export async function checkDatabaseSchema(): Promise<boolean> {
	try {
		console.log('🔍 Checking existing database schema...');
		
		// Check if required tables exist
		const requiredTables = ['candidates', 'skills', 'candidates_skills'];
		
		for (const tableName of requiredTables) {
			const tableExists = await pool.query(`
				SELECT EXISTS (
					SELECT FROM information_schema.tables 
					WHERE table_schema = 'public' 
					AND table_name = $1
				);
			`, [tableName]);
			
			if (!tableExists.rows[0].exists) {
				console.error(`❌ Required table '${tableName}' does not exist`);
				return false;
			}
		}
		
		console.log('✅ Database schema is compatible');
		return true;
		
	} catch (error) {
		console.error('❌ Error checking database schema:', error);
		return false;
	}
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

// Complete LinkedIn sync with database insertion (robust version)
export async function syncLinkedInToDatabase(linkedinData: any, linkedinUrl: string): Promise<{
	success: boolean;
	candidateId?: string;
	skillsCreated?: number;
	skillsLinked?: number;
	error?: string;
	duplicate?: boolean;
}> {
	const client = await pool.connect();
	
	try {
		// Start transaction
		await client.query('BEGIN');
		
		// Import the mapping function
		const { mapLinkedInToCandidate } = await import('./linkedin-mapper');
		
		// Map LinkedIn data to candidate format
		const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
		
		// Check if candidate already exists
		const existingCandidate = await client.query(
			'SELECT id FROM candidates WHERE linkedin_url = $1',
			[linkedinUrl]
		);
		
		if (existingCandidate.rows.length > 0) {
			console.log(`⚠️ Candidate already exists: ${linkedinUrl}`);
			await client.query('ROLLBACK');
			return {
				success: true,
				candidateId: existingCandidate.rows[0].id,
				skillsCreated: 0,
				skillsLinked: 0,
				duplicate: true
			};
		}
		
		// Create candidate in database
		const candidateResult = await client.query(
			`INSERT INTO candidates (
				first_name, last_name, email, date_of_birth, linkedin_url,
				profile_image_url, working_location, bio, general_job_title,
				current_company, category, is_active
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			RETURNING id`,
			[
				candidateData.candidateProfile.firstName,
				candidateData.candidateProfile.lastName,
				candidateData.candidateProfile.email,
				candidateData.candidateProfile.dateOfBirth,
				candidateData.candidateProfile.linkedinUrl,
				candidateData.candidateProfile.profileImageUrl,
				candidateData.candidateProfile.workingLocation,
				candidateData.candidateProfile.bio,
				candidateData.candidateProfile.generalJobTitle,
				candidateData.candidateProfile.currentCompany,
				candidateData.candidateProfile.category,
				candidateData.candidateProfile.isActive
			]
		);
		
		const candidateId = candidateResult.rows[0].id;
		console.log(`✅ Created candidate: ${candidateData.candidateProfile.firstName} ${candidateData.candidateProfile.lastName} (ID: ${candidateId})`);
		
		// Process skills with error handling
		let skillsCreated = 0;
		let skillsLinked = 0;
		
		for (const skill of candidateData.candidateProfile.skills) {
			try {
				// Find or create skill
				let skillId = skill.skillId;
				
				if (!skillId) {
					// Create new skill
					const skillResult = await client.query(
						`INSERT INTO skills (id, name, source, is_active, created_at, updated_at)
						 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
						 ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
						 RETURNING id`,
						[skill.skillName, 'linkedin', true]
					);
					
					skillId = skillResult.rows[0].id;
					skillsCreated++;
					console.log(`🆕 Created skill: ${skill.skillName} (ID: ${skillId})`);
				} else {
					console.log(`🔗 Using existing skill: ${skill.skillName} (ID: ${skillId})`);
				}
				
				// Link skill to candidate
				await client.query(
					`INSERT INTO candidate_skills (
						candidate_id, skill_id, is_core, endorsements_count, source
					) VALUES ($1, $2, $3, $4, $5)
					ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
						is_core = EXCLUDED.is_core,
						endorsements_count = EXCLUDED.endorsements_count,
						updated_at = NOW()`,
					[
						candidateId,
						skillId,
						skill.isCore,
						skill.endorsementsCount,
						skill.source
					]
				);
				
				skillsLinked++;
				console.log(`🔗 Linked skill: ${skill.skillName} to candidate`);
				
			} catch (skillError) {
				console.error(`❌ Error processing skill ${skill.skillName}:`, skillError);
				// Continue with other skills instead of failing completely
			}
		}
		
		// Commit transaction
		await client.query('COMMIT');
		
		console.log(`✅ LinkedIn sync complete: Candidate ${candidateId} with ${skillsLinked} skills (${skillsCreated} new)`);
		
		return {
			success: true,
			candidateId,
			skillsCreated,
			skillsLinked
		};
		
	} catch (error) {
		// Rollback transaction on error
		await client.query('ROLLBACK');
		console.error('❌ Error in LinkedIn sync to database:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	} finally {
		client.release();
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

// Check and create database schema if needed
export async function ensureDatabaseSchema(): Promise<boolean> {
	try {
		console.log('🔍 Checking database schema...');
		
		// Check if candidates table exists
		const candidatesTableExists = await pool.query(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'candidates'
			);
		`);
		
		if (!candidatesTableExists.rows[0].exists) {
			console.log('📋 Creating candidates table...');
			await pool.query(`
				CREATE TABLE candidates (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					first_name VARCHAR NOT NULL,
					last_name VARCHAR NOT NULL,
					email VARCHAR,
					date_of_birth DATE,
					linkedin_url VARCHAR UNIQUE,
					profile_image_url VARCHAR,
					working_location VARCHAR,
					bio TEXT,
					general_job_title VARCHAR,
					current_company VARCHAR,
					category VARCHAR,
					is_active BOOLEAN DEFAULT true,
					created_at TIMESTAMP DEFAULT NOW(),
					updated_at TIMESTAMP DEFAULT NOW()
				);
			`);
		}
		
		// Check if candidate_skills table exists
		const candidateSkillsTableExists = await pool.query(`
			SELECT EXISTS (
				SELECT FROM information_schema.tables 
				WHERE table_schema = 'public' 
				AND table_name = 'candidate_skills'
			);
		`);
		
		if (!candidateSkillsTableExists.rows[0].exists) {
			console.log('📋 Creating candidate_skills table...');
			await pool.query(`
				CREATE TABLE candidate_skills (
					id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
					candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
					skill_id UUID REFERENCES skills(id) ON DELETE CASCADE,
					is_core BOOLEAN DEFAULT false,
					endorsements_count INTEGER DEFAULT 0,
					source VARCHAR DEFAULT 'linkedin',
					created_at TIMESTAMP DEFAULT NOW(),
					UNIQUE(candidate_id, skill_id)
				);
			`);
		}
		
		console.log('✅ Database schema is ready');
		return true;
		
	} catch (error) {
		console.error('❌ Error ensuring database schema:', error);
		return false;
	}
}

// Complete database insertion workflow for webapp
export async function insertLinkedInDataToDatabase(linkedinUrl: string): Promise<{
	success: boolean;
	candidateId?: string;
	skillsCreated?: number;
	skillsLinked?: number;
	error?: string;
}> {
	const client = await pool.connect();
	
	try {
		// Start transaction
		await client.query('BEGIN');
		
		// Import the mapping function
		const { mapLinkedInToCandidate } = await import('./linkedin-mapper');
		
		// Check if candidate already exists
		const existingCandidate = await client.query(
			'SELECT id FROM candidates WHERE linkedin_url = $1',
			[linkedinUrl]
		);
		
		if (existingCandidate.rows.length > 0) {
			console.log(`⚠️ Candidate already exists: ${linkedinUrl}`);
			await client.query('ROLLBACK');
			return {
				success: true,
				candidateId: existingCandidate.rows[0].id,
				skillsCreated: 0,
				skillsLinked: 0
			};
		}
		
		// Get LinkedIn data (you'll need to pass this in or fetch it)
		// For now, we'll assume it's passed as parameter
		const linkedinData = await getLinkedInData(linkedinUrl);
		
		// Map LinkedIn data to candidate format
		const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
		
		// Step 1: Create new skills first
		let skillsCreated = 0;
		for (const skillToCreate of candidateData.databaseOperations.skillsToCreate) {
			try {
				const skillResult = await client.query(
					`INSERT INTO skills (id, name, source, is_active, created_at, updated_at)
					 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
					 ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
					 RETURNING id`,
					[skillToCreate.skillName, 'linkedin', true]
				);
				
				skillsCreated++;
				console.log(`🆕 Created skill: ${skillToCreate.skillName}`);
			} catch (error) {
				console.error(`❌ Error creating skill ${skillToCreate.skillName}:`, error);
			}
		}
		
		// Step 2: Insert candidate profile
		const candidateResult = await client.query(
			`INSERT INTO candidates (
				first_name, last_name, email, date_of_birth, linkedin_url,
				profile_image_url, working_location, bio, general_job_title,
				current_company, category, is_active
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			RETURNING id`,
			[
				candidateData.candidateProfile.firstName,
				candidateData.candidateProfile.lastName,
				candidateData.candidateProfile.email,
				candidateData.candidateProfile.dateOfBirth,
				candidateData.candidateProfile.linkedinUrl,
				candidateData.candidateProfile.profileImageUrl,
				candidateData.candidateProfile.workingLocation,
				candidateData.candidateProfile.bio,
				candidateData.candidateProfile.generalJobTitle,
				candidateData.candidateProfile.currentCompany,
				candidateData.candidateProfile.category,
				candidateData.candidateProfile.isActive
			]
		);
		
		const candidateId = candidateResult.rows[0].id;
		console.log(`✅ Created candidate: ${candidateData.candidateProfile.firstName} ${candidateData.candidateProfile.lastName}`);
		
		// Step 3: Link skills to candidate
		let skillsLinked = 0;
		for (const skill of candidateData.candidateProfile.skills) {
			try {
				// Find skill by name (including newly created ones)
				const skillResult = await client.query(
					'SELECT id FROM skills WHERE name ILIKE $1 AND is_active = true',
					[skill.skillName]
				);
				
				if (skillResult.rows.length > 0) {
					const skillId = skillResult.rows[0].id;
					
					// Link skill to candidate
					await client.query(
						`INSERT INTO candidates_skills (
							candidate_id, skill_id, is_core, endorsements_count, source
						) VALUES ($1, $2, $3, $4, $5)
						ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
							is_core = EXCLUDED.is_core,
							endorsements_count = EXCLUDED.endorsements_count`,
						[
							candidateId,
							skillId,
							skill.isCore,
							skill.endorsementsCount,
							skill.source
						]
					);
					
					skillsLinked++;
					console.log(`🔗 Linked skill: ${skill.skillName} to candidate`);
				}
			} catch (error) {
				console.error(`❌ Error linking skill ${skill.skillName}:`, error);
			}
		}
		
		// Commit transaction
		await client.query('COMMIT');
		
		console.log(`✅ Database insertion complete: Candidate ${candidateId} with ${skillsLinked} skills (${skillsCreated} new)`);
		
		return {
			success: true,
			candidateId,
			skillsCreated,
			skillsLinked
		};
		
	} catch (error) {
		// Rollback transaction on error
		await client.query('ROLLBACK');
		console.error('❌ Error in database insertion:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	} finally {
		client.release();
	}
}

// Complete database insertion with correct order (skills first, then candidate)
export async function insertLinkedInDataWithOrder(linkedinUrl: string): Promise<{
	success: boolean;
	candidateId?: string;
	skillsCreated?: number;
	skillsLinked?: number;
	error?: string;
	duplicate?: boolean;
}> {
	const client = await pool.connect();
	
	try {
		// Start transaction
		await client.query('BEGIN');
		
		// Import the mapping function
		const { mapLinkedInToCandidate } = await import('./linkedin-mapper');
		
		// Check if candidate already exists
		const existingCandidate = await client.query(
			'SELECT id FROM candidates WHERE linkedin_url = $1',
			[linkedinUrl]
		);
		
		if (existingCandidate.rows.length > 0) {
			console.log(`⚠️ Candidate already exists: ${linkedinUrl}`);
			await client.query('ROLLBACK');
			return {
				success: true,
				candidateId: existingCandidate.rows[0].id,
				skillsCreated: 0,
				skillsLinked: 0,
				duplicate: true
			};
		}
		
		// Get LinkedIn data
		const linkedinData = await getLinkedInData(linkedinUrl);
		
		// Map LinkedIn data to candidate format
		const candidateData = await mapLinkedInToCandidate(linkedinData, linkedinUrl);
		
		// STEP 1: Create new skills first (dependency for candidate)
		let skillsCreated = 0;
		for (const skillToCreate of candidateData.databaseOperations.skillsToCreate) {
			try {
				const skillResult = await client.query(
					`INSERT INTO skills (id, name, source, is_active, created_at, updated_at)
					 VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
					 ON CONFLICT (name) DO UPDATE SET updated_at = NOW()
					 RETURNING id`,
					[skillToCreate.skillName, 'linkedin', true]
				);
				
				skillsCreated++;
				console.log(`🆕 Created skill: ${skillToCreate.skillName}`);
			} catch (error) {
				console.error(`❌ Error creating skill ${skillToCreate.skillName}:`, error);
				// Continue with other skills instead of failing completely
			}
		}
		
		// STEP 2: Insert candidate profile (after skills are created)
		let candidateId;
		try {
			const candidateResult = await client.query(
				`INSERT INTO candidates (
					first_name, last_name, email, date_of_birth, linkedin_url,
					profile_image_url, working_location, bio, general_job_title,
					current_company, category, is_active
				) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
				RETURNING id`,
				[
					candidateData.candidateProfile.firstName,
					candidateData.candidateProfile.lastName,
					candidateData.candidateProfile.email,
					candidateData.candidateProfile.dateOfBirth,
					candidateData.candidateProfile.linkedinUrl,
					candidateData.candidateProfile.profileImageUrl,
					candidateData.candidateProfile.workingLocation,
					candidateData.candidateProfile.bio,
					candidateData.candidateProfile.generalJobTitle,
					candidateData.candidateProfile.currentCompany,
					candidateData.candidateProfile.category,
					candidateData.candidateProfile.isActive
				]
			);
			
			candidateId = candidateResult.rows[0].id;
			console.log(`✅ Created candidate: ${candidateData.candidateProfile.firstName} ${candidateData.candidateProfile.lastName} (ID: ${candidateId})`);
		} catch (error) {
			console.error(`❌ Error creating candidate:`, error);
			await client.query('ROLLBACK');
			return {
				success: false,
				error: `Failed to create candidate: ${error instanceof Error ? error.message : 'Unknown error'}`
			};
		}
		
		// STEP 3: Link skills to candidate (after both skills and candidate exist)
		let skillsLinked = 0;
		for (const skill of candidateData.candidateProfile.skills) {
			try {
				// Find skill by name (including newly created ones)
				const skillResult = await client.query(
					'SELECT id FROM skills WHERE name ILIKE $1 AND is_active = true',
					[skill.skillName]
				);
				
				if (skillResult.rows.length > 0) {
					const skillId = skillResult.rows[0].id;
					
					// Link skill to candidate
					await client.query(
						`INSERT INTO candidate_skills (
							candidate_id, skill_id, is_core, endorsements_count, source
						) VALUES ($1, $2, $3, $4, $5)
						ON CONFLICT (candidate_id, skill_id) DO UPDATE SET
							is_core = EXCLUDED.is_core,
							endorsements_count = EXCLUDED.endorsements_count,
							updated_at = NOW()`,
						[
							candidateId,
							skillId,
							skill.isCore,
							skill.endorsementsCount,
							skill.source
						]
					);
					
					skillsLinked++;
					console.log(`🔗 Linked skill: ${skill.skillName} to candidate`);
				}
			} catch (error) {
				console.error(`❌ Error linking skill ${skill.skillName}:`, error);
				// Continue with other skills instead of failing completely
			}
		}
		
		// Commit transaction
		await client.query('COMMIT');
		
		console.log(`✅ Database insertion complete: Candidate ${candidateId} with ${skillsLinked} skills (${skillsCreated} new)`);
		
		return {
			success: true,
			candidateId,
			skillsCreated,
			skillsLinked
		};
		
	} catch (error) {
		// Rollback transaction on error
		try {
			await client.query('ROLLBACK');
		} catch (rollbackError) {
			console.error('❌ Error during rollback:', rollbackError);
		}
		console.error('❌ Error in database insertion:', error);
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Unknown error'
		};
	} finally {
		client.release();
	}
}

// Helper function to get LinkedIn data
async function getLinkedInData(linkedinUrl: string) {
	try {
		// Check cache first
		const { isCacheFresh, loadFromCache, saveToCache } = await import('./cache');
		const { rapidAPIClient } = await import('./rapidapi');
		
		const isFresh = await isCacheFresh(linkedinUrl);
		if (isFresh) {
			console.log(`📋 Loading from cache: ${linkedinUrl}`);
			const cachedData = await loadFromCache(linkedinUrl);
			if (cachedData) {
				return cachedData;
			}
		}
		
		// Fetch from RapidAPI
		console.log(`🌐 Fetching from RapidAPI: ${linkedinUrl}`);
		const linkedinData = await rapidAPIClient.getProfileData(linkedinUrl);
		
		// Save to cache
		await saveToCache(linkedinUrl, linkedinData);
		
		return linkedinData;
	} catch (error) {
		console.error('Error getting LinkedIn data:', error);
		throw error;
	}
}
