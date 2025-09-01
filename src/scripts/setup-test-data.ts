#!/usr/bin/env bun

// Setup Test Data for Real Integration Testing
// Creates test agency and candidates based on linkedin_urls.txt

import { pool } from "../lib/database";

interface TestCandidate {
  firstName: string;
  lastName: string;
  email: string;
  linkedinUrl: string;
  isActive: boolean;
}

async function setupTestData() {
  console.log('🏗️ Setting up test data for real integration testing...');
  
  try {
    // 1. Create test agency
    console.log('📋 Creating test agency...');
    const agencyResult = await pool.query(`
      INSERT INTO agencies (name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (name) DO UPDATE SET updated_at = $5
      RETURNING id
    `, ['Test Agency - LinkedIn Sync', 'Test agency for LinkedIn sync integration testing', true, new Date(), new Date()]);
    
    const agencyId = agencyResult.rows[0].id;
    console.log(`✅ Test agency created with ID: ${agencyId}`);

    // 2. Read LinkedIn URLs and create test candidates
    console.log('👥 Creating test candidates from linkedin_urls.txt...');
    
    const linkedinUrls = await Bun.file('linkedin_urls.txt').text();
    const urls = linkedinUrls.split('\n').filter(url => url.trim() && url.includes('linkedin.com'));
    
    console.log(`📊 Found ${urls.length} LinkedIn URLs to process`);
    
    // Take first 10 for testing (to avoid overwhelming the system)
    const testUrls = urls.slice(0, 10);
    console.log(`🧪 Using first ${testUrls.length} URLs for testing`);
    
    const candidates: TestCandidate[] = testUrls.map((url, index) => {
      const username = url.split('/in/')[1]?.split('?')[0] || `test-user-${index}`;
      const nameParts = username.split('-');
      const firstName = nameParts[0] || 'Test';
      const lastName = nameParts.slice(1).join('-') || `User${index}`;
      
      return {
        firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
        lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
        email: `test.${username}@example.com`,
        linkedinUrl: url.trim(),
        isActive: true
      };
    });

    // 3. Insert test candidates
    console.log('💾 Inserting test candidates into database...');
    
    for (const candidate of candidates) {
      try {
        const candidateResult = await pool.query(`
          INSERT INTO candidates (
            first_name, last_name, email, linkedin_url, agency_id, is_active, 
            created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (linkedin_url) DO UPDATE SET 
            first_name = EXCLUDED.first_name,
            last_name = EXCLUDED.last_name,
            email = EXCLUDED.email,
            updated_at = EXCLUDED.updated_at
          RETURNING id, first_name, last_name, linkedin_url
        `, [
          candidate.firstName,
          candidate.lastName,
          candidate.email,
          candidate.linkedinUrl,
          agencyId,
          candidate.isActive,
          new Date(),
          new Date()
        ]);
        
        const inserted = candidateResult.rows[0];
        console.log(`✅ Created candidate: ${inserted.first_name} ${inserted.last_name} (ID: ${inserted.id})`);
        console.log(`   LinkedIn: ${inserted.linkedin_url}`);
        
      } catch (error: any) {
        console.error(`❌ Failed to create candidate ${candidate.firstName} ${candidate.lastName}:`, error.message);
      }
    }

    // 4. Verify setup
    console.log('\n🔍 Verifying test data setup...');
    
    const candidateCount = await pool.query('SELECT COUNT(*) FROM candidates WHERE agency_id = $1', [agencyId]);
    const agencyCount = await pool.query('SELECT COUNT(*) FROM agencies WHERE id = $1', [agencyId]);
    
    console.log(`📊 Test agency: ${agencyCount.rows[0].count} agency found`);
    console.log(`👥 Test candidates: ${candidateCount.rows[0].count} candidates created`);
    
    console.log('\n🎉 Test data setup complete!');
    console.log(`🏢 Agency ID: ${agencyId}`);
    console.log(`🔗 You can now test with: bun run test:integration`);
    
  } catch (error: any) {
    console.error('❌ Failed to setup test data:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (import.meta.main) {
  setupTestData();
}

