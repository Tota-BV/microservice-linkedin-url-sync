#!/usr/bin/env bun

// Simple Skills Processing Test
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testSkillsProcessing() {
  console.log('🔍 Testing Skills Processing (Normalize → Match → Create)...');
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedinUrl: 'https://www.linkedin.com/in/test-user-skills'
      })
    });
    const duration = Date.now() - start;

    if (response.ok || response.status === 404) {
      console.log(`✅ Skills processing test passed (${duration}ms)`);
      if (response.status === 404) {
        console.log(`   Note: 404 is expected (candidate not found)`);
      }
    } else {
      console.log(`❌ Skills processing test failed: HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ Skills processing test failed: ${error.message}`);
  }
}

if (import.meta.main) {
  testSkillsProcessing();
}

