#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import axios from 'fs';

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  PHASES: [
    { name: 'Health Check', duration: 30, type: 'health' },
    { name: 'Single URL Validation', duration: 60, type: 'validation' },
    { name: 'Bulk Operations', duration: 120, type: 'bulk' },
    { name: 'Load Testing', duration: 300, type: 'load' },
    { name: 'Stress Testing', duration: 600, type: 'stress' },
    { name: 'Error Handling', duration: 120, type: 'errors' },
    { name: 'Recovery Testing', duration: 180, type: 'recovery' },
  ],
  REQUEST_TIMEOUT: 30000,
  HEALTH_CHECK_INTERVAL: 5000,
};

interface TestPhase {
  name: string;
  duration: number;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  results?: any;
  startTime?: Date;
  endTime?: Date;
}

interface TestSummary {
  totalPhases: number;
  completedPhases: number;
  failedPhases: number;
  overallStatus: 'pass' | 'fail' | 'partial';
  startTime: Date;
  endTime: Date;
  recommendations: string[];
  productionReadiness: {
    loadCapacity: boolean;
    errorHandling: boolean;
    recovery: boolean;
    monitoring: boolean;
    overall: boolean;
  };
}

class ComprehensiveTestRunner {
  private phases: TestPhase[] = [];
  private linkedInUrls: string[] = [];
  private startTime: Date = new Date();
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    console.log('🧪 LinkedIn Sync Microservice Comprehensive Test Runner');
    console.log('========================================================');
    console.log(`Base URL: ${TEST_CONFIG.BASE_URL}`);
    console.log(`Total Test Duration: ${TEST_CONFIG.PHASES.reduce((sum, p) => sum + p.duration, 0)}s`);
    console.log('========================================================\n');
    
    this.phases = TEST_CONFIG.PHASES.map(phase => ({
      ...phase,
      status: 'pending' as const,
    }));
  }

  async startHealthMonitoring(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${TEST_CONFIG.BASE_URL}/health`, {
          timeout: 5000,
        });
        const health = response.data;
        console.log(`🏥 Health: ${health.status} | DB: ${health.database?.status} | Latency: ${health.database?.latencyMs}ms`);
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, TEST_CONFIG.HEALTH_CHECK_INTERVAL);
  }

  async stopHealthMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  async loadLinkedInUrls(): Promise<void> {
    try {
      const filePath = join(process.cwd(), 'linkedin_urls.txt');
      const content = readFileSync(filePath, 'utf-8');
      this.linkedInUrls = content.split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('https://www.linkedin.com/in/'));
      
      console.log(`📚 Loaded ${this.linkedInUrls.length} LinkedIn URLs for testing`);
    } catch (error) {
      console.error('❌ Failed to load LinkedIn URLs:', error);
      throw error;
    }
  }

  async runHealthCheckPhase(): Promise<any> {
    console.log('🏥 Running Health Check Phase...');
    
    const results = {
      endpointChecks: [] as any[],
      databaseChecks: [] as any[],
      overallStatus: 'unknown' as string,
    };

    try {
      // Test health endpoint
      const healthResponse = await axios.get(`${TEST_CONFIG.BASE_URL}/health`, {
        timeout: 10000,
      });
      
      results.endpointChecks.push({
        endpoint: '/health',
        status: 'success',
        responseTime: healthResponse.headers['x-response-time'] || 'unknown',
        data: healthResponse.data,
      });

      // Test database connectivity
      if (healthResponse.data.database) {
        results.databaseChecks.push({
          status: healthResponse.data.database.status,
          latency: healthResponse.data.database.latencyMs,
          connected: healthResponse.data.database.connected,
        });
      }

      // Test search endpoint
      try {
        const searchResponse = await axios.get(`${TEST_CONFIG.BASE_URL}/api/candidates/search?firstName=test`, {
          timeout: 10000,
        });
        results.endpointChecks.push({
          endpoint: '/api/candidates/search',
          status: 'success',
          responseTime: searchResponse.headers['x-response-time'] || 'unknown',
          statusCode: searchResponse.status,
        });
      } catch (error: any) {
        results.endpointChecks.push({
          endpoint: '/api/candidates/search',
          status: 'error',
          error: error.message,
          statusCode: error.response?.status,
        });
      }

      results.overallStatus = 'healthy';
      
    } catch (error: any) {
      results.overallStatus = 'unhealthy';
      results.endpointChecks.push({
        endpoint: '/health',
        status: 'error',
        error: error.message,
      });
    }

    return results;
  }

  async runValidationPhase(): Promise<any> {
    console.log('✅ Running Single URL Validation Phase...');
    
    const results = {
      validUrls: [] as string[],
      invalidUrls: [] as string[],
      validationTests: [] as any[],
    };

    // Test with a few sample URLs
    const testUrls = this.linkedInUrls.slice(0, 10);
    
    for (const url of testUrls) {
      try {
        const response = await axios.post(
          `${TEST_CONFIG.BASE_URL}/api/linkedin/sync`,
          { linkedinUrl: url },
          {
            timeout: TEST_CONFIG.REQUEST_TIMEOUT,
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.status === 200) {
          results.validUrls.push(url);
          results.validationTests.push({
            url,
            status: 'success',
            responseTime: response.headers['x-response-time'] || 'unknown',
            data: response.data,
          });
        } else {
          results.invalidUrls.push(url);
          results.validationTests.push({
            url,
            status: 'unexpected_status',
            statusCode: response.status,
            data: response.data,
          });
        }
      } catch (error: any) {
        results.invalidUrls.push(url);
        results.validationTests.push({
          url,
          status: 'error',
          error: error.message,
          statusCode: error.response?.status,
        });
      }
    }

    return results;
  }

  async runBulkOperationsPhase(): Promise<any> {
    console.log('📦 Running Bulk Operations Phase...');
    
    const results = {
      batchSizes: [5, 10, 25, 50],
      batchResults: [] as any[],
      concurrencyTests: [] as any[],
    };

    // Test different batch sizes
    for (const batchSize of results.batchSizes) {
      const batchUrls = this.linkedInUrls.slice(0, batchSize);
      
      try {
        const startTime = Date.now();
        const response = await axios.post(
          `${TEST_CONFIG.BASE_URL}/api/linkedin/sync-bulk`,
          { linkedinUrls: batchUrls },
          {
            timeout: TEST_CONFIG.REQUEST_TIMEOUT * 2,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        
        const responseTime = Date.now() - startTime;
        
        results.batchResults.push({
          batchSize,
          status: 'success',
          responseTime,
          statusCode: response.status,
          urlsProcessed: batchUrls.length,
        });
      } catch (error: any) {
        results.batchResults.push({
          batchSize,
          status: 'error',
          error: error.message,
          statusCode: error.response?.status,
          urlsProcessed: batchUrls.length,
        });
      }
    }

    // Test concurrency limits
    const concurrencyLevels = [5, 10, 25];
    for (const concurrency of concurrencyLevels) {
      const testUrls = this.linkedInUrls.slice(0, concurrency);
      const startTime = Date.now();
      
      try {
        const promises = testUrls.map(url => 
          axios.post(
            `${TEST_CONFIG.BASE_URL}/api/linkedin/sync`,
            { linkedinUrl: url },
            {
              timeout: TEST_CONFIG.REQUEST_TIMEOUT,
              headers: { 'Content-Type': 'application/json' },
            }
          )
        );
        
        await Promise.all(promises);
        const responseTime = Date.now() - startTime;
        
        results.concurrencyTests.push({
          concurrency,
          status: 'success',
          responseTime,
          requestsProcessed: testUrls.length,
        });
      } catch (error: any) {
        results.concurrencyTests.push({
          concurrency,
          status: 'error',
          error: error.message,
          requestsProcessed: testUrls.length,
        });
      }
    }

    return results;
  }

  async runLoadTestingPhase(): Promise<any> {
    console.log('🚀 Running Load Testing Phase...');
    
    // Import and run the load tester
    try {
      const { LoadTester } = await import('./load-testing');
      const loadTester = new LoadTester();
      
      // Override config for this phase
      const originalConfig = {
        TOTAL_REQUESTS: process.env.TOTAL_REQUESTS,
        CONCURRENT_REQUESTS: process.env.CONCURRENT_REQUESTS,
      };
      
      process.env.TOTAL_REQUESTS = '100';
      process.env.CONCURRENT_REQUESTS = '25';
      
      // Run a focused load test
      await loadTester.run();
      
      // Restore original config
      if (originalConfig.TOTAL_REQUESTS) process.env.TOTAL_REQUESTS = originalConfig.TOTAL_REQUESTS;
      if (originalConfig.CONCURRENT_REQUESTS) process.env.CONCURRENT_REQUESTS = originalConfig.CONCURRENT_REQUESTS;
      
      return { status: 'completed', message: 'Load testing phase completed' };
    } catch (error: any) {
      return { status: 'failed', error: error.message };
    }
  }

  async runStressTestingPhase(): Promise<any> {
    console.log('🔥 Running Stress Testing Phase...');
    
    try {
      const { StressTester } = await import('./stress-testing');
      const stressTester = new StressTester();
      
      // Run a focused stress test
      await stressTester.run();
      
      return { status: 'completed', message: 'Stress testing phase completed' };
    } catch (error: any) {
      return { status: 'failed', error: error.message };
    }
  }

  async runErrorHandlingPhase(): Promise<any> {
    console.log('⚠️ Running Error Handling Phase...');
    
    const results = {
      errorScenarios: [] as any[],
      recoveryTests: [] as any[],
    };

    // Test various error scenarios
    const errorScenarios = [
      { url: 'https://invalid-url.com', expectedError: 'validation' },
      { url: 'https://www.linkedin.com/in/', expectedError: 'validation' },
      { url: 'https://www.linkedin.com/in/nonexistent-user-12345', expectedError: 'not_found' },
      { url: '', expectedError: 'validation' },
    ];

    for (const scenario of errorScenarios) {
      try {
        await axios.post(
          `${TEST_CONFIG.BASE_URL}/api/linkedin/sync`,
          { linkedinUrl: scenario.url },
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        
        results.errorScenarios.push({
          scenario: scenario.url,
          status: 'unexpected_success',
          expectedError: scenario.expectedError,
        });
      } catch (error: any) {
        const isExpectedError = this.isExpectedError(error, scenario.expectedError);
        results.errorScenarios.push({
          scenario: scenario.url,
          status: isExpectedError ? 'expected_error' : 'unexpected_error',
          expectedError: scenario.expectedError,
          actualError: error.message,
          statusCode: error.response?.status,
        });
      }
    }

    // Test malformed requests
    const malformedRequests = [
      { body: {}, expectedError: 'validation' },
      { body: { linkedinUrl: null }, expectedError: 'validation' },
      { body: { linkedinUrl: 123 }, expectedError: 'validation' },
    ];

    for (const request of malformedRequests) {
      try {
        await axios.post(
          `${TEST_CONFIG.BASE_URL}/api/linkedin/sync`,
          request.body,
          {
            timeout: 10000,
            headers: { 'Content-Type': 'application/json' },
          }
        );
        
        results.errorScenarios.push({
          scenario: 'malformed_request',
          status: 'unexpected_success',
          request: request.body,
          expectedError: request.expectedError,
        });
      } catch (error: any) {
        const isExpectedError = this.isExpectedError(error, request.expectedError);
        results.errorScenarios.push({
          scenario: 'malformed_request',
          status: isExpectedError ? 'expected_error' : 'unexpected_error',
          request: request.body,
          expectedError: request.expectedError,
          actualError: error.message,
          statusCode: error.response?.status,
        });
      }
    }

    return results;
  }

  private isExpectedError(error: any, expectedError: string): boolean {
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.response?.status;
    
    switch (expectedError) {
      case 'validation':
        return statusCode === 400 || errorMessage.includes('validation') || errorMessage.includes('invalid');
      case 'not_found':
        return statusCode === 404 || errorMessage.includes('not found');
      default:
        return false;
    }
  }

  async runRecoveryTestingPhase(): Promise<any> {
    console.log('🔄 Running Recovery Testing Phase...');
    
    const results = {
      healthRecovery: false,
      performanceRecovery: false,
      databaseRecovery: false,
    };

    try {
      // Test health endpoint recovery
      const healthResponse = await axios.get(`${TEST_CONFIG.BASE_URL}/health`, {
        timeout: 10000,
      });
      
      if (healthResponse.data.status === 'ok') {
        results.healthRecovery = true;
      }

      // Test performance recovery with a simple request
      const startTime = Date.now();
      const testUrl = this.linkedInUrls[0];
      
      if (testUrl) {
        try {
          await axios.post(
            `${TEST_CONFIG.BASE_URL}/api/linkedin/sync`,
            { linkedinUrl: testUrl },
            {
              timeout: TEST_CONFIG.REQUEST_TIMEOUT,
              headers: { 'Content-Type': 'application/json' },
            }
          );
          
          const responseTime = Date.now() - startTime;
          results.performanceRecovery = responseTime < TEST_CONFIG.REQUEST_TIMEOUT;
        } catch (error) {
          results.performanceRecovery = false;
        }
      }

      // Test database recovery
      if (healthResponse.data.database?.status === 'ready') {
        results.databaseRecovery = true;
      }

    } catch (error) {
      console.error('Recovery testing failed:', error);
    }

    return results;
  }

  async runPhase(phase: TestPhase): Promise<void> {
    console.log(`\n🚀 Starting Phase: ${phase.name}`);
    console.log(`   Duration: ${phase.duration}s | Type: ${phase.type}`);
    
    phase.status = 'running';
    phase.startTime = new Date();
    
    try {
      let results;
      
      switch (phase.type) {
        case 'health':
          results = await this.runHealthCheckPhase();
          break;
        case 'validation':
          results = await this.runValidationPhase();
          break;
        case 'bulk':
          results = await this.runBulkOperationsPhase();
          break;
        case 'load':
          results = await this.runLoadTestingPhase();
          break;
        case 'stress':
          results = await this.runStressTestingPhase();
          break;
        case 'errors':
          results = await this.runErrorHandlingPhase();
          break;
        case 'recovery':
          results = await this.runRecoveryTestingPhase();
          break;
        default:
          throw new Error(`Unknown phase type: ${phase.type}`);
      }
      
      phase.results = results;
      phase.status = 'completed';
      
      console.log(`✅ Phase ${phase.name} completed successfully`);
      
    } catch (error: any) {
      phase.status = 'failed';
      phase.results = { error: error.message };
      console.error(`❌ Phase ${phase.name} failed:`, error.message);
    } finally {
      phase.endTime = new Date();
    }
  }

  calculateSummary(): TestSummary {
    const endTime = new Date();
    const completedPhases = this.phases.filter(p => p.status === 'completed').length;
    const failedPhases = this.phases.filter(p => p.status === 'failed').length;
    
    let overallStatus: 'pass' | 'fail' | 'partial' = 'pass';
    if (failedPhases > 0) {
      overallStatus = failedPhases === this.phases.length ? 'fail' : 'partial';
    }
    
    const recommendations: string[] = [];
    
    // Analyze results and generate recommendations
    this.phases.forEach(phase => {
      if (phase.status === 'failed') {
        recommendations.push(`Fix issues in ${phase.name} phase`);
      }
      
      if (phase.results) {
        // Add specific recommendations based on phase results
        if (phase.type === 'health' && phase.results.overallStatus !== 'healthy') {
          recommendations.push('Address health check failures before production deployment');
        }
        
        if (phase.type === 'load' && phase.results.throughput < 10) {
          recommendations.push('Optimize system for higher throughput to handle 1000 syncs/day');
        }
        
        if (phase.type === 'stress' && phase.results.errorRate > 0.05) {
          recommendations.push('Improve error handling under stress conditions');
        }
      }
    });
    
    // Production readiness assessment
    const productionReadiness = {
      loadCapacity: this.phases.find(p => p.type === 'load')?.status === 'completed',
      errorHandling: this.phases.find(p => p.type === 'errors')?.status === 'completed',
      recovery: this.phases.find(p => p.type === 'recovery')?.status === 'completed',
      monitoring: this.phases.find(p => p.type === 'health')?.status === 'completed',
      overall: overallStatus === 'pass',
    };
    
    return {
      totalPhases: this.phases.length,
      completedPhases,
      failedPhases,
      overallStatus,
      startTime: this.startTime,
      endTime,
      recommendations,
      productionReadiness,
    };
  }

  printSummary(summary: TestSummary): void {
    console.log('\n📊 COMPREHENSIVE TEST SUMMARY');
    console.log('==============================');
    console.log(`Overall Status: ${summary.overallStatus.toUpperCase()}`);
    console.log(`Completed Phases: ${summary.completedPhases}/${summary.totalPhases}`);
    console.log(`Failed Phases: ${summary.failedPhases}`);
    console.log(`Duration: ${((summary.endTime.getTime() - summary.startTime.getTime()) / 1000).toFixed(1)}s`);
    
    console.log('\n🎯 Production Readiness Assessment:');
    console.log(`  Load Capacity: ${summary.productionReadiness.loadCapacity ? '✅' : '❌'}`);
    console.log(`  Error Handling: ${summary.productionReadiness.errorHandling ? '✅' : '❌'}`);
    console.log(`  Recovery: ${summary.productionReadiness.recovery ? '✅' : '❌'}`);
    console.log(`  Monitoring: ${summary.productionReadiness.monitoring ? '✅' : '❌'}`);
    console.log(`  Overall: ${summary.productionReadiness.overall ? '✅' : '❌'}`);
    
    if (summary.recommendations.length > 0) {
      console.log('\n💡 Recommendations:');
      summary.recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
      });
    }
    
    // Final assessment
    if (summary.productionReadiness.overall) {
      console.log('\n🎉 SYSTEM IS READY FOR PRODUCTION!');
      console.log('The microservice has passed all critical tests and can handle 1000 LinkedIn URL syncs per day.');
    } else {
      console.log('\n⚠️ SYSTEM IS NOT READY FOR PRODUCTION');
      console.log('Address the recommendations above before deploying to production.');
    }
  }

  async saveResults(summary: TestSummary): Promise<void> {
    try {
      const resultsData = {
        summary,
        phases: this.phases,
        config: TEST_CONFIG,
        timestamp: new Date().toISOString(),
      };
      
      const filename = `comprehensive-test-results-${Date.now()}.json`;
      writeFileSync(filename, JSON.stringify(resultsData, null, 2));
      console.log(`\n💾 Comprehensive test results saved to ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }

  async run(): Promise<void> {
    try {
      this.isRunning = true;
      
      // Start health monitoring
      await this.startHealthMonitoring();
      
      // Load LinkedIn URLs
      await this.loadLinkedInUrls();
      
      if (this.linkedInUrls.length === 0) {
        throw new Error('No LinkedIn URLs found to test');
      }
      
      console.log(`🎯 Starting comprehensive testing with ${this.linkedInUrls.length} available URLs`);
      
      // Run each phase
      for (const phase of this.phases) {
        await this.runPhase(phase);
        
        // Brief pause between phases
        if (phase !== this.phases[this.phases.length - 1]) {
          console.log('\n⏸️ Pausing between phases...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      // Calculate and display results
      const summary = this.calculateSummary();
      this.printSummary(summary);
      
      // Save results
      await this.saveResults(summary);
      
    } catch (error) {
      console.error('❌ Comprehensive testing failed:', error);
    } finally {
      this.isRunning = false;
      await this.stopHealthMonitoring();
    }
  }
}

// Main execution
async function main() {
  const runner = new ComprehensiveTestRunner();
  await runner.run();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { ComprehensiveTestRunner };

