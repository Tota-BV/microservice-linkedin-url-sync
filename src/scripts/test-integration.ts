#!/usr/bin/env bun

// Real Integration Test
// Tests the complete LinkedIn sync workflow with real candidates

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
import { pool } from "../lib/database";

interface TestResult {
  step: string;
  passed: boolean;
  duration: number;
  details: any;
  error?: string;
}

class IntegrationTester {
  private results: TestResult[] = [];
  private testCandidates: any[] = [];

  async setupTestCandidates(): Promise<void> {
    console.log('🔍 Finding test candidates in database...');
    
    try {
      const result = await pool.query(`
        SELECT id, first_name, last_name, linkedin_url, email
        FROM candidates 
        WHERE linkedin_url LIKE '%linkedin.com%'
        LIMIT 5
      `);
      
      this.testCandidates = result.rows;
      console.log(`✅ Found ${this.testCandidates.length} test candidates`);
      
      this.testCandidates.forEach(candidate => {
        console.log(`   - ${candidate.first_name} ${candidate.last_name}: ${candidate.linkedin_url}`);
      });
      
    } catch (error: any) {
      console.error('❌ Failed to find test candidates:', error.message);
      throw error;
    }
  }

  async testStep1_DatabaseConnection(): Promise<TestResult> {
    const start = Date.now();
    console.log('🔄 Step 1: Testing Database Connection...');
    
    try {
      const response = await fetch(`${BASE_URL}/health`);
      const data = await response.json();
      const duration = Date.now() - start;

      const passed = response.ok && data.database?.connected;
      
      return {
        step: 'Database Connection',
        passed,
        duration,
        details: {
          status: passed ? 'connected' : 'disconnected',
          latency: data.database?.latencyMs,
          error: data.database?.error
        }
      };
    } catch (error: any) {
      return {
        step: 'Database Connection',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  async testStep2_RapidAPIDataFetching(): Promise<TestResult> {
    const start = Date.now();
    console.log('🔄 Step 2: Testing RapidAPI LinkedIn Data Fetching...');
    
    if (this.testCandidates.length === 0) {
      return {
        step: 'RapidAPI LinkedIn Data Fetching',
        passed: false,
        duration: 0,
        error: 'No test candidates available'
      };
    }

    try {
      const candidate = this.testCandidates[0];
      const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: candidate.linkedin_url
        })
      });

      const data = await response.json();
      const duration = Date.now() - start;

      // This should succeed since we have a real candidate
      const passed = response.ok;
      
      return {
        step: 'RapidAPI LinkedIn Data Fetching',
        passed,
        duration,
        details: {
          candidate: `${candidate.first_name} ${candidate.last_name}`,
          linkedinUrl: candidate.linkedin_url,
          responseStatus: response.status,
          responseData: data
        },
        error: passed ? undefined : `HTTP ${response.status}: ${data.error || 'Unknown error'}`
      };
    } catch (error: any) {
      return {
        step: 'RapidAPI LinkedIn Data Fetching',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  async testStep3_DataMappingAndTransformation(): Promise<TestResult> {
    const start = Date.now();
    console.log('🔄 Step 3: Testing Data Mapping and Transformation...');
    
    if (this.testCandidates.length === 0) {
      return {
        step: 'Data Mapping and Transformation',
        passed: false,
        duration: 0,
        error: 'No test candidates available'
      };
    }

    try {
      const candidate = this.testCandidates[1] || this.testCandidates[0];
      const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: candidate.linkedin_url
        })
      });

      const data = await response.json();
      const duration = Date.now() - start;

      const passed = response.ok;
      
      return {
        step: 'Data Mapping and Transformation',
        passed,
        duration,
        details: {
          candidate: `${candidate.first_name} ${candidate.last_name}`,
          linkedinUrl: candidate.linkedin_url,
          hasEnrichment: !!data.enrichment,
          enrichmentData: data.enrichment
        },
        error: passed ? undefined : `HTTP ${response.status}: ${data.error || 'Unknown error'}`
      };
    } catch (error: any) {
      return {
        step: 'Data Mapping and Transformation',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  async testStep4_SkillsProcessing(): Promise<TestResult> {
    const start = Date.now();
    console.log('🔄 Step 4: Testing Skills Processing...');
    
    if (this.testCandidates.length === 0) {
      return {
        step: 'Skills Processing',
        passed: false,
        duration: 0,
        error: 'No test candidates available'
      };
    }

    try {
      const candidate = this.testCandidates[2] || this.testCandidates[0];
      const response = await fetch(`${BASE_URL}/api/linkedin/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkedinUrl: candidate.linkedin_url
        })
      });

      const data = await response.json();
      const duration = Date.now() - start;

      const passed = response.ok;
      
      return {
        step: 'Skills Processing',
        passed,
        duration,
        details: {
          candidate: `${candidate.first_name} ${candidate.last_name}`,
          linkedinUrl: candidate.linkedin_url,
          skillsLinked: data.enrichment?.skillsLinked || 0,
          skillsData: data.enrichment
        },
        error: passed ? undefined : `HTTP ${response.status}: ${data.error || 'Unknown error'}`
      };
    } catch (error: any) {
      return {
        step: 'Skills Processing',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  async testStep5_VerifyDatabaseData(): Promise<TestResult> {
    const start = Date.now();
    console.log('🔄 Step 5: Verifying Data in Database...');
    
    try {
      // Check if skills were created
      const skillsResult = await pool.query('SELECT COUNT(*) FROM skills WHERE source = $1', ['user']);
      const skillsCount = parseInt(skillsResult.rows[0].count);
      
      // Check if skills-candidate links were created
      const skillsCandidateResult = await pool.query('SELECT COUNT(*) FROM skills_candidates');
      const skillsCandidateCount = parseInt(skillsCandidateResult.rows[0].count);
      
      // Check if related data was inserted
      const educationResult = await pool.query('SELECT COUNT(*) FROM education');
      const educationCount = parseInt(educationResult.rows[0].count);
      
      const duration = Date.now() - start;
      
      const passed = skillsCount > 0 || skillsCandidateCount > 0;
      
      return {
        step: 'Verify Database Data',
        passed,
        duration,
        details: {
          skillsCreated: skillsCount,
          skillsLinked: skillsCandidateCount,
          educationAdded: educationCount,
          hasData: passed
        }
      };
    } catch (error: any) {
      return {
        step: 'Verify Database Data',
        passed: false,
        duration: Date.now() - start,
        error: error.message
      };
    }
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Real Integration Test - LinkedIn Sync Microservice');
    console.log('====================================================');
    console.log(`Testing: ${BASE_URL}\n`);

    try {
      // Setup test candidates first
      await this.setupTestCandidates();
      
      if (this.testCandidates.length === 0) {
        console.log('❌ No test candidates found. Run setup first: bun run setup:test-data');
        return;
      }

      const startTime = Date.now();

      // Run all tests
      const tests = [
        this.testStep1_DatabaseConnection(),
        this.testStep2_RapidAPIDataFetching(),
        this.testStep3_DataMappingAndTransformation(),
        this.testStep4_SkillsProcessing(),
        this.testStep5_VerifyDatabaseData()
      ];

      for (const testPromise of tests) {
        const result = await testPromise;
        this.results.push(result);
        
        const status = result.passed ? '✅' : '❌';
        console.log(`${status} ${result.step} (${result.duration}ms)`);
        
        if (!result.passed && result.error) {
          console.log(`   Error: ${result.error}`);
        }
        
        if (result.details) {
          console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`);
        }
        
        console.log(''); // Empty line for readability
      }

      const totalDuration = Date.now() - startTime;
      this.printResults(totalDuration);
      
    } catch (error: any) {
      console.error('❌ Integration test failed:', error.message);
    } finally {
      await pool.end();
    }
  }

  private printResults(totalDuration: number): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log('📊 Integration Test Results');
    console.log('===========================');
    console.log(`Total Steps: ${total}`);
    console.log(`Passed: ${passed}/${total}`);
    console.log(`Failed: ${total - passed}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);

    if (passed === total) {
      console.log('\n🎉 All integration tests passed!');
      console.log('✅ Your LinkedIn sync workflow is working end-to-end');
      console.log('✅ Data is being fetched, processed, and stored in the database');
    } else {
      console.log('\n⚠️ Some integration tests failed');
      console.log('🔍 Check the errors above to identify issues');
    }
  }
}

// Run if called directly
if (import.meta.main) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

export { IntegrationTester };

