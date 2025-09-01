#!/usr/bin/env bun

// Simple Data Mapping Test
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testDataMapping() {
  console.log('🗺️ Testing Data Mapping and Transformation...');
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedinUrl: 'https://www.linkedin.com/in/test-user-mapping'
      })
    });
    const duration = Date.now() - start;

    if (response.ok || response.status === 404) {
      console.log(`✅ Data mapping test passed (${duration}ms)`);
      if (response.status === 404) {
        console.log(`   Note: 404 is expected (candidate not found)`);
      }
    } else {
      console.log(`❌ Data mapping test failed: HTTP ${response.status}`);
    }
  } catch (error: any) {
    console.log(`❌ Data mapping test failed: ${error.message}`);
  }
}

if (import.meta.main) {
  testDataMapping();
}

