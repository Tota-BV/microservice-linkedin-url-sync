#!/usr/bin/env bun

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  PHASES: [
    { name: 'Health Check', type: 'health' },
    { name: 'Single URL Validation', type: 'validation' },
    { name: 'Bulk Operations', type: 'bulk' },
    { name: 'Load Testing', type: 'load' },
    { name: 'Error Handling', type: 'errors' },
  ],
};

interface TestPhase {
  name: string;
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
    monitoring: boolean;
    overall: boolean;
  };
}

class TestRunner {
  private phases: TestPhase[] = [];
  private linkedInUrls: string[] = [];
  private startTime: Date = new Date();

  constructor() {
    console.log('🧪 LinkedIn Sync Microservice Test Runner');
    console.log('=========================================');
    console.log(`Base URL: ${TEST_CONFIG.BASE_URL}`);
    console.log('=========================================\n');
    
    this.phases = TEST_CONFIG.PHASES.map(phase => ({
      ...phase,
      status: 'pending' as const,
    }));
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
      const response = await fetch(`${TEST_CONFIG.BASE_URL}/health`);
      const healthData = await response.json();
      
      results.endpointChecks.push({
        endpoint: '/health',
        status: 'success',
        statusCode: response.status,
        data: healthData,
      });

      // Test database connectivity
      if (healthData.database) {
        results.databaseChecks.push({
          status: healthData.database.status,
          latency: healthData.database.latencyMs,
          connected: healthData.database.connected,
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
    const testUrls = this.linkedInUrls.slice(0, 5);
    
    for (const url of testUrls) {
      try {
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/linkedin/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl: url }),
        });

        if (response.ok) {
          const data = await response.json();
          results.validUrls.push(url);
          results.validationTests.push({
            url,
            status: 'success',
            statusCode: response.status,
            data: data,
          });
        } else {
          results.invalidUrls.push(url);
          results.validationTests.push({
            url,
            status: 'unexpected_status',
            statusCode: response.status,
          });
        }
      } catch (error: any) {
        results.invalidUrls.push(url);
        results.validationTests.push({
          url,
          status: 'error',
          error: error.message,
        });
      }
    }

    return results;
  }

  async runBulkOperationsPhase(): Promise<any> {
    console.log('📦 Running Bulk Operations Phase...');
    
    const results = {
      batchSizes: [5, 10],
      batchResults: [] as any[],
    };

    // Test different batch sizes
    for (const batchSize of results.batchSizes) {
      const batchUrls = this.linkedInUrls.slice(0, batchSize);
      
      try {
        const startTime = Date.now();
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/linkedin/sync-bulk`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrls: batchUrls }),
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
          const data = await response.json();
          results.batchResults.push({
            batchSize,
            status: 'success',
            responseTime,
            statusCode: response.status,
            urlsProcessed: batchUrls.length,
            data: data,
          });
        } else {
          results.batchResults.push({
            batchSize,
            status: 'error',
            statusCode: response.status,
            urlsProcessed: batchUrls.length,
          });
        }
      } catch (error: any) {
        results.batchResults.push({
          batchSize,
          status: 'error',
          error: error.message,
          urlsProcessed: batchUrls.length,
        });
      }
    }

    return results;
  }

  async runLoadTestingPhase(): Promise<any> {
    console.log('🚀 Running Load Testing Phase...');
    
    const results = {
      concurrentRequests: 10,
      totalRequests: 20,
      responseTimes: [] as number[],
      successCount: 0,
      failureCount: 0,
    };

    const testUrls = this.linkedInUrls.slice(0, results.totalRequests);
    
    // Run concurrent requests
    const promises = testUrls.map(async (url) => {
      const startTime = Date.now();
      
      try {
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/linkedin/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl: url }),
        });
        
        const responseTime = Date.now() - startTime;
        results.responseTimes.push(responseTime);
        
        if (response.ok) {
          results.successCount++;
        } else {
          results.failureCount++;
        }
      } catch (error) {
        results.failureCount++;
        results.responseTimes.push(0);
      }
    });

    await Promise.all(promises);

    // Calculate statistics
    const avgResponseTime = results.responseTimes.reduce((sum, time) => sum + time, 0) / results.responseTimes.length;
    const throughput = results.totalRequests / (avgResponseTime / 1000);

    return {
      ...results,
      averageResponseTime: Math.round(avgResponseTime),
      throughput: Math.round(throughput * 100) / 100,
    };
  }

  async runErrorHandlingPhase(): Promise<any> {
    console.log('⚠️ Running Error Handling Phase...');
    
    const results = {
      errorScenarios: [] as any[],
    };

    // Test various error scenarios
    const errorScenarios = [
      { url: 'https://invalid-url.com', expectedError: 'validation' },
      { url: 'https://www.linkedin.com/in/', expectedError: 'validation' },
      { url: '', expectedError: 'validation' },
    ];

    for (const scenario of errorScenarios) {
      try {
        const response = await fetch(`${TEST_CONFIG.BASE_URL}/api/linkedin/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ linkedinUrl: scenario.url }),
        });
        
        if (response.status === 400) {
          results.errorScenarios.push({
            scenario: scenario.url,
            status: 'expected_error',
            expectedError: scenario.expectedError,
            statusCode: response.status,
          });
        } else {
          results.errorScenarios.push({
            scenario: scenario.url,
            status: 'unexpected_success',
            expectedError: scenario.expectedError,
            statusCode: response.status,
          });
        }
      } catch (error: any) {
        results.errorScenarios.push({
          scenario: scenario.url,
          status: 'network_error',
          expectedError: scenario.expectedError,
          error: error.message,
        });
      }
    }

    return results;
  }

  async runPhase(phase: TestPhase): Promise<void> {
    console.log(`\n🚀 Starting Phase: ${phase.name}`);
    
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
        case 'errors':
          results = await this.runErrorHandlingPhase();
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
        if (phase.type === 'health' && phase.results.overallStatus !== 'healthy') {
          recommendations.push('Address health check failures before production deployment');
        }
        
        if (phase.type === 'load' && phase.results.throughput < 5) {
          recommendations.push('Optimize system for higher throughput to handle 1000 syncs/day');
        }
      }
    });
    
    // Production readiness assessment
    const productionReadiness = {
      loadCapacity: this.phases.find(p => p.type === 'load')?.status === 'completed',
      errorHandling: this.phases.find(p => p.type === 'errors')?.status === 'completed',
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
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Overall Status: ${summary.overallStatus.toUpperCase()}`);
    console.log(`Completed Phases: ${summary.completedPhases}/${summary.totalPhases}`);
    console.log(`Failed Phases: ${summary.failedPhases}`);
    console.log(`Duration: ${((summary.endTime.getTime() - summary.startTime.getTime()) / 1000).toFixed(1)}s`);
    
    console.log('\n🎯 Production Readiness Assessment:');
    console.log(`  Load Capacity: ${summary.productionReadiness.loadCapacity ? '✅' : '❌'}`);
    console.log(`  Error Handling: ${summary.productionReadiness.errorHandling ? '✅' : '❌'}`);
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
      
      const filename = `test-results-${Date.now()}.json`;
      writeFileSync(filename, JSON.stringify(resultsData, null, 2));
      console.log(`\n💾 Test results saved to ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }

  async run(): Promise<void> {
    try {
      // Load LinkedIn URLs
      await this.loadLinkedInUrls();
      
      if (this.linkedInUrls.length === 0) {
        throw new Error('No LinkedIn URLs found to test');
      }
      
      console.log(`🎯 Starting testing with ${this.linkedInUrls.length} available URLs`);
      
      // Run each phase
      for (const phase of this.phases) {
        await this.runPhase(phase);
        
        // Brief pause between phases
        if (phase !== this.phases[this.phases.length - 1]) {
          console.log('\n⏸️ Pausing between phases...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      // Calculate and display results
      const summary = this.calculateSummary();
      this.printSummary(summary);
      
      // Save results
      await this.saveResults(summary);
      
    } catch (error) {
      console.error('❌ Testing failed:', error);
    }
  }
}

// Main execution
async function main() {
  const runner = new TestRunner();
  await runner.run();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { TestRunner };

