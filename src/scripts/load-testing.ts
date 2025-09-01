#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

// Test configuration
const CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  CONCURRENT_REQUESTS: parseInt(process.env.CONCURRENT_REQUESTS || '50'),
  TOTAL_REQUESTS: parseInt(process.env.TOTAL_REQUESTS || '1000'),
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT || '30000'),
  RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY || '100'),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '100'),
  HEALTH_CHECK_INTERVAL: parseInt(process.env.HEALTH_CHECK_INTERVAL || '5000'),
};

// Test results tracking
interface TestResult {
  url: string;
  success: boolean;
  responseTime: number;
  statusCode?: number;
  error?: string;
  timestamp: string;
}

interface TestSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errors: Map<string, number>;
  startTime: Date;
  endTime: Date;
}

class LoadTester {
  private results: TestResult[] = [];
  private startTime: Date = new Date();
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;

  constructor() {
    console.log('🚀 LinkedIn Sync Microservice Load Tester');
    console.log('==========================================');
    console.log(`Base URL: ${CONFIG.BASE_URL}`);
    console.log(`Concurrent Requests: ${CONFIG.CONCURRENT_REQUESTS}`);
    console.log(`Total Requests: ${CONFIG.TOTAL_REQUESTS}`);
    console.log(`Batch Size: ${CONFIG.BATCH_SIZE}`);
    console.log('==========================================\n');
  }

  async startHealthMonitoring(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${CONFIG.BASE_URL}/health`, {
          timeout: 5000,
        });
        const health = response.data;
        console.log(`🏥 Health Check: ${health.status} | DB: ${health.database?.status} | Latency: ${health.database?.latencyMs}ms`);
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, CONFIG.HEALTH_CHECK_INTERVAL);
  }

  async stopHealthMonitoring(): Promise<void> {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  async loadLinkedInUrls(): Promise<string[]> {
    try {
      const filePath = join(process.cwd(), 'linkedin_urls.txt');
      const content = readFileSync(filePath, 'utf-8');
      const urls = content.split('\n')
        .map(url => url.trim())
        .filter(url => url && url.startsWith('https://www.linkedin.com/in/'));
      
      console.log(`📚 Loaded ${urls.length} LinkedIn URLs from file`);
      return urls;
    } catch (error) {
      console.error('❌ Failed to load LinkedIn URLs:', error);
      throw error;
    }
  }

  async testSingleSync(url: string): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const response = await axios.post(
        `${CONFIG.BASE_URL}/api/linkedin/sync`,
        { linkedinUrl: url },
        {
          timeout: CONFIG.REQUEST_TIMEOUT,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const responseTime = Date.now() - startTime;
      
      return {
        url,
        success: true,
        responseTime,
        statusCode: response.status,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      return {
        url,
        success: false,
        responseTime,
        statusCode: error.response?.status,
        error: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async testBulkSync(urls: string[]): Promise<TestResult[]> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    try {
      const response = await axios.post(
        `${CONFIG.BASE_URL}/api/linkedin/sync-bulk`,
        { linkedinUrls: urls },
        {
          timeout: CONFIG.REQUEST_TIMEOUT * 2, // Longer timeout for bulk operations
          headers: { 'Content-Type': 'application/json' },
        }
      );

      // Process streaming response if available
      if (response.data && Array.isArray(response.data.results)) {
        response.data.results.forEach((result: any) => {
          results.push({
            url: result.url,
            success: result.success,
            responseTime: Date.now() - startTime,
            statusCode: response.status,
            error: result.error,
            timestamp: new Date().toISOString(),
          });
        });
      } else {
        // Fallback: create results for each URL
        urls.forEach(url => {
          results.push({
            url,
            success: true,
            responseTime: Date.now() - startTime,
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          });
        });
      }
    } catch (error: any) {
      // If bulk fails, mark all URLs as failed
      urls.forEach(url => {
        results.push({
          url,
          success: false,
          responseTime: Date.now() - startTime,
          statusCode: error.response?.status,
          error: error.message || 'Bulk operation failed',
          timestamp: new Date().toISOString(),
        });
      });
    }

    return results;
  }

  async runConcurrentTest(urls: string[]): Promise<void> {
    console.log(`🔄 Starting concurrent test with ${urls.length} URLs...`);
    
    const batches: string[][] = [];
    for (let i = 0; i < urls.length; i += CONFIG.BATCH_SIZE) {
      batches.push(urls.slice(i, i + CONFIG.BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of ${CONFIG.BATCH_SIZE} URLs each`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} URLs)`);

      // Process batch with concurrency limit
      const batchResults = await this.processBatchWithConcurrency(batch);
      this.results.push(...batchResults);

      // Progress update
      const processed = this.results.length;
      const successRate = (this.results.filter(r => r.success).length / processed * 100).toFixed(1);
      console.log(`✅ Batch ${batchIndex + 1} complete. Progress: ${processed}/${urls.length} (${successRate}% success)`);

      // Rate limiting between batches
      if (batchIndex < batches.length - 1) {
        await this.delay(CONFIG.RATE_LIMIT_DELAY);
      }
    }
  }

  private async processBatchWithConcurrency(urls: string[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const chunks: string[][] = [];

    // Split batch into concurrent chunks
    for (let i = 0; i < urls.length; i += CONFIG.CONCURRENT_REQUESTS) {
      chunks.push(urls.slice(i, i + CONFIG.CONCURRENT_REQUESTS));
    }

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(url => this.testSingleSync(url));
      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Small delay between chunks to prevent overwhelming
      if (chunks.length > 1) {
        await this.delay(50);
      }
    }

    return results;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  calculateSummary(): TestSummary {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    const responseTimes = this.results.map(r => r.responseTime).sort((a, b) => a - b);
    
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = this.results.length - successfulRequests;
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = responseTimes[0] || 0;
    const maxResponseTime = responseTimes[responseTimes.length - 1] || 0;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
    
    const throughput = (this.results.length / (duration / 1000)).toFixed(2);
    
    // Count errors by type
    const errors = new Map<string, number>();
    this.results.forEach(result => {
      if (!result.success && result.error) {
        const errorType = this.categorizeError(result.error);
        errors.set(errorType, (errors.get(errorType) || 0) + 1);
      }
    });

    return {
      totalRequests: this.results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      minResponseTime,
      maxResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      throughput: parseFloat(throughput),
      errors,
      startTime: this.startTime,
      endTime,
    };
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('network')) return 'Network Error';
    if (error.includes('rate limit')) return 'Rate Limited';
    if (error.includes('not found')) return 'Not Found';
    if (error.includes('validation')) return 'Validation Error';
    if (error.includes('database')) return 'Database Error';
    if (error.includes('RapidAPI')) return 'RapidAPI Error';
    return 'Other Error';
  }

  printSummary(summary: TestSummary): void {
    console.log('\n📊 LOAD TEST SUMMARY');
    console.log('====================');
    console.log(`Total Requests: ${summary.totalRequests}`);
    console.log(`Successful: ${summary.successfulRequests} (${(summary.successfulRequests / summary.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Failed: ${summary.failedRequests} (${(summary.failedRequests / summary.totalRequests * 100).toFixed(1)}%)`);
    console.log(`Duration: ${((summary.endTime.getTime() - summary.startTime.getTime()) / 1000).toFixed(1)}s`);
    console.log(`Throughput: ${summary.throughput} requests/second`);
    console.log('\n⏱️ Response Time Statistics:');
    console.log(`  Average: ${summary.averageResponseTime}ms`);
    console.log(`  Min: ${summary.minResponseTime}ms`);
    console.log(`  Max: ${summary.maxResponseTime}ms`);
    console.log(`  95th Percentile: ${summary.p95ResponseTime}ms`);
    console.log(`  99th Percentile: ${summary.p99ResponseTime}ms`);
    
    if (summary.errors.size > 0) {
      console.log('\n❌ Error Breakdown:');
      summary.errors.forEach((count, errorType) => {
        console.log(`  ${errorType}: ${count} occurrences`);
      });
    }

    // Performance assessment
    console.log('\n🎯 Performance Assessment:');
    if (summary.throughput >= 10) {
      console.log('✅ Excellent throughput - can handle 1000 syncs/day easily');
    } else if (summary.throughput >= 5) {
      console.log('⚠️ Good throughput - may need optimization for 1000 syncs/day');
    } else {
      console.log('❌ Low throughput - significant optimization needed for production');
    }

    if (summary.p95ResponseTime <= 30000) {
      console.log('✅ Response times within acceptable limits');
    } else {
      console.log('⚠️ Response times may be too slow for production use');
    }

    if (summary.failedRequests / summary.totalRequests <= 0.05) {
      console.log('✅ Error rate is acceptable for production');
    } else {
      console.log('❌ Error rate is too high for production use');
    }
  }

  async run(): Promise<void> {
    try {
      this.isRunning = true;
      
      // Start health monitoring
      await this.startHealthMonitoring();
      
      // Load LinkedIn URLs
      const urls = await this.loadLinkedInUrls();
      
      if (urls.length === 0) {
        throw new Error('No LinkedIn URLs found to test');
      }

      // Limit to configured total requests
      const testUrls = urls.slice(0, CONFIG.TOTAL_REQUESTS);
      console.log(`🎯 Testing with ${testUrls.length} URLs (limited from ${urls.length} available)`);

      // Run the load test
      await this.runConcurrentTest(testUrls);
      
      // Calculate and display results
      const summary = this.calculateSummary();
      this.printSummary(summary);
      
      // Save results to file
      await this.saveResults(summary);
      
    } catch (error) {
      console.error('❌ Load test failed:', error);
    } finally {
      this.isRunning = false;
      await this.stopHealthMonitoring();
    }
  }

  private async saveResults(summary: TestSummary): Promise<void> {
    try {
      const fs = await import('fs');
      const resultsData = {
        summary,
        results: this.results,
        config: CONFIG,
        timestamp: new Date().toISOString(),
      };
      
      const filename = `load-test-results-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(resultsData, null, 2));
      console.log(`\n💾 Results saved to ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save results:', error);
    }
  }
}

// Main execution
async function main() {
  const tester = new LoadTester();
  await tester.run();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { LoadTester };

