#!/usr/bin/env bun

// Simple Database Connection Test
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

async function testDatabaseConnection() {
  console.log('🔌 Testing Database Connection...');
  
  try {
    const start = Date.now();
    const response = await fetch(`${BASE_URL}/health`);
    const data = await response.json();
    const duration = Date.now() - start;

    if (response.ok && data.database?.connected) {
      console.log(`✅ Database connected (${duration}ms)`);
      console.log(`   Status: ${data.database.status}`);
      console.log(`   Latency: ${data.database.latencyMs}ms`);
    } else {
      console.log(`❌ Database connection failed`);
      console.log(`   Error: ${data.database?.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.log(`❌ Connection failed: ${error.message}`);
  }
}

if (import.meta.main) {
  testDatabaseConnection();
}

