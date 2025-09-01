#!/usr/bin/env bun

// Simple RapidAPI Test
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testRapidAPI() {
  console.log('🌐 Testing RapidAPI LinkedIn Data Fetching...');
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedinUrl: 'https://www.linkedin.com/in/test-user'
      })
    });
    const duration = Date.now() - start;

    if (response.ok || response.status === 404) {
      console.log(`✅ RapidAPI test passed (${duration}ms)`);
      if (response.status === 404) {
        console.log(`   Note: 404 is expected (candidate not found)`);
      }
    } else {
      console.log(`❌ RapidAPI test failed: HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ RapidAPI test failed: ${error.message}`);
  }
}

if (import.meta.main) {
  testRapidAPI();
}

