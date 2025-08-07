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

// Skills table schema (simplified for microservice)
export interface Skill {
  id: string;
  name: string;
  skill_type: 'language' | 'library' | 'storage' | 'tool' | 'other';
  source: 'esco' | 'user' | 'admin' | 'linkedin';
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Find skill by name
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

// Create new skill
export async function createSkill(skillName: string, skillType: string): Promise<string> {
  try {
    const result = await pool.query(
      `INSERT INTO skills (name, skill_type, source, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id`,
      [skillName, skillType, 'linkedin', true]
    );
    
    console.log(`✅ Created new skill: ${skillName} (${skillType})`);
    return result.rows[0].id;
  } catch (error) {
    console.error('Error creating skill:', error);
    throw new Error(`Failed to create skill: ${skillName}`);
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
