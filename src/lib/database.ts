import { Pool } from "pg";
import { getDatabaseUrl } from "./env.server";

// Production-ready database connection with connection pooling
export const pool = new Pool({
  connectionString: getDatabaseUrl(),
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  maxUses: 7500, // Close (and replace) a connection after it has been used 7500 times
});

// Graceful shutdown handling
process.on("SIGINT", () => {
  pool.end();
  process.exit(0);
});

process.on("SIGTERM", () => {
  pool.end();
  process.exit(0);
});

// Enhanced database ping with detailed diagnostics
export async function pingDatabase(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
  details?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
}> {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    const details = {
      totalCount: pool.totalCount,
      idleCount: pool.idleCount,
      waitingCount: pool.waitingCount,
    };
    return {
      ok: true,
      latencyMs: Date.now() - startedAt,
      details,
    };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Check if database schema is compatible
export async function checkDatabaseSchema(): Promise<boolean> {
  try {
    // Simple check - try to query a few key tables
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'candidates') as candidates_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'skills') as skills_table,
        (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'candidates_skills') as candidates_skills_table
    `);

    const { candidates_table, skills_table, candidates_skills_table } = result.rows[0];

    return candidates_table > 0 && skills_table > 0 && candidates_skills_table > 0;
  } catch (error) {
    console.error("Database schema check failed:", error);
    return false;
  }
}

// Update candidate basic fields with LinkedIn data
export async function updateCandidate(
  candidateId: string,
  updateData: {
    firstName?: string;
    lastName?: string;
    bio?: string;
    generalJobTitle?: string;
    currentCompany?: string;
    profileImageUrl?: string;
    category?: string;
    dateOfBirth?: string;
    workingLocation?: string;
    updatedAt: Date;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`🔄 [DB] Updating candidate ${candidateId} with LinkedIn data:`, updateData);
    
    // Build dynamic update query
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;
    
    if (updateData.firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      updateValues.push(updateData.firstName);
    }
    
    if (updateData.lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      updateValues.push(updateData.lastName);
    }
    
    if (updateData.bio !== undefined) {
      updateFields.push(`bio = $${paramIndex++}`);
      updateValues.push(updateData.bio);
    }
    
    if (updateData.generalJobTitle !== undefined) {
      updateFields.push(`general_job_title = $${paramIndex++}`);
      updateValues.push(updateData.generalJobTitle);
    }
    
    if (updateData.currentCompany !== undefined) {
      updateFields.push(`current_company = $${paramIndex++}`);
      updateValues.push(updateData.currentCompany);
    }
    
    if (updateData.profileImageUrl !== undefined) {
      updateFields.push(`profile_image_url = $${paramIndex++}`);
      updateValues.push(updateData.profileImageUrl);
    }
    
    if (updateData.category !== undefined) {
      updateFields.push(`category = $${paramIndex++}`);
      updateValues.push(updateData.category);
    }
    
    if (updateData.dateOfBirth !== undefined) {
      updateFields.push(`date_of_birth = $${paramIndex++}`);
      updateValues.push(updateData.dateOfBirth);
    }
    
    if (updateData.workingLocation !== undefined) {
      updateFields.push(`working_location = $${paramIndex++}`);
      updateValues.push(updateData.workingLocation);
    }
    
    // Always update updated_at
    updateFields.push(`updated_at = $${paramIndex++}`);
    updateValues.push(updateData.updatedAt);
    
    if (updateFields.length === 0) {
      console.log(`⚠️ [DB] No fields to update for candidate ${candidateId}`);
      return { success: true };
    }
    
    const updateQuery = `
      UPDATE candidates 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
    `;
    
    updateValues.push(candidateId);
    
    console.log(`🔍 [DB] Executing update query:`, updateQuery);
    console.log(`🔍 [DB] Update values:`, updateValues);
    
    const result = await pool.query(updateQuery, updateValues);
    
    if (result.rowCount === 0) {
      console.warn(`⚠️ [DB] No rows updated for candidate ${candidateId}`);
      return { success: false, error: "No rows updated" };
    }
    
    console.log(`✅ [DB] Successfully updated ${result.rowCount} row(s) for candidate ${candidateId}`);
    return { success: true };
    
  } catch (error: any) {
    console.error(`❌ [DB] Failed to update candidate ${candidateId}:`, error);
    return { success: false, error: error.message };
  }
}

// Normalize LinkedIn URL for consistent matching
function normalizeLinkedInUrl(url: string): string {
  try {
    let normalized = url.trim().toLowerCase();
    
    // Remove trailing slash
    if (normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }
    
    // Remove query parameters
    if (normalized.includes('?')) {
      normalized = normalized.split('?')[0];
    }
    
    // Remove hash fragments
    if (normalized.includes('#')) {
      normalized = normalized.split('#')[0];
    }
    
    // Ensure www prefix for consistency
    if (!normalized.includes('www.')) {
      normalized = normalized.replace('https://linkedin.com/', 'https://www.linkedin.com/');
    }
    
    return normalized;
  } catch {
    return url; // Return original if normalization fails
  }
}

// Generate all possible URL variations for matching
function generateUrlVariations(url: string): string[] {
  const variations = new Set<string>();
  
  // Add original URL
  variations.add(url);
  
  // Remove trailing slash
  if (url.endsWith('/')) {
    variations.add(url.slice(0, -1));
  } else {
    variations.add(url + '/');
  }
  
  // Add/remove www
  if (url.includes('www.')) {
    variations.add(url.replace('https://www.linkedin.com/', 'https://linkedin.com/'));
  } else {
    variations.add(url.replace('https://linkedin.com/', 'https://www.linkedin.com/'));
  }
  
  // Remove trailing slash from www version
  if (url.includes('www.')) {
    const withoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;
    variations.add(withoutSlash.replace('https://www.linkedin.com/', 'https://linkedin.com/'));
  } else {
    const withoutSlash = url.endsWith('/') ? url.slice(0, -1) : url;
    variations.add(withoutSlash.replace('https://linkedin.com/', 'https://www.linkedin.com/'));
  }
  
  return Array.from(variations);
}

// Find candidate by LinkedIn URL (with improved normalization and matching)
export async function findCandidateByLinkedInUrl(linkedinUrl: string): Promise<any> {
  try {
    const normalizedUrl = normalizeLinkedInUrl(linkedinUrl);
    console.log(`🔍 [DATABASE] Looking for candidate with LinkedIn URL: ${linkedinUrl} (normalized: ${normalizedUrl})`);
    
    // Generate all possible URL variations
    const urlVariations = generateUrlVariations(linkedinUrl);
    console.log(`🔍 [DATABASE] Generated ${urlVariations.length} URL variations for matching`);
    
    // Try each variation until we find a match
    for (const variation of urlVariations) {
      console.log(`🔍 [DATABASE] Trying URL variation: ${variation}`);
      
      const result = await pool.query(
        "SELECT * FROM candidates WHERE linkedin_url = $1 LIMIT 1",
        [variation],
      );
      
      if (result.rows[0]) {
        console.log(`✅ [DATABASE] Found candidate with URL variation: ${variation}`);
        console.log(`✅ [DATABASE] Candidate: ${result.rows[0].first_name} ${result.rows[0].last_name} (ID: ${result.rows[0].id})`);
        return result.rows[0];
      }
    }
    
    // If no exact matches found, try fuzzy matching with LIKE
    console.log(`🔍 [DATABASE] No exact matches found, trying fuzzy matching...`);
    
    // Extract username from URL for fuzzy matching
    const usernameMatch = linkedinUrl.match(/\/in\/([^\/\?]+)/);
    if (usernameMatch) {
      const username = usernameMatch[1];
      console.log(`🔍 [DATABASE] Trying fuzzy match with username: ${username}`);
      
      const fuzzyResult = await pool.query(
        "SELECT * FROM candidates WHERE linkedin_url LIKE $1 LIMIT 1",
        [`%${username}%`],
      );
      
      if (fuzzyResult.rows[0]) {
        console.log(`✅ [DATABASE] Found candidate with fuzzy match: ${fuzzyResult.rows[0].first_name} ${fuzzyResult.rows[0].last_name}`);
        console.log(`✅ [DATABASE] Matched URL: ${fuzzyResult.rows[0].linkedin_url}`);
        return fuzzyResult.rows[0];
      }
    }
    
    console.log(`❌ [DATABASE] No candidate found for any URL format or variation`);
    return null;
  } catch (error) {
    console.error("❌ [DATABASE] Error finding candidate:", error);
    return null;
  }
}

