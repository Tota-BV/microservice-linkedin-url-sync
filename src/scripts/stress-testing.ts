#!/usr/bin/env bun

import { readFileSync } from 'fs';
import { join } from 'path';
import axios from 'axios';

// Stress test configuration
const STRESS_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  PHASES: [
    { name: 'Warm-up', duration: 60, concurrency: 10, targetRPS: 5 },
    { name: 'Ramp-up', duration: 120, concurrency: 25, targetRPS: 15 },
    { name: 'Sustained Load', duration: 300, concurrency: 50, targetRPS: 25 },
    { name: 'Peak Load', duration: 180, concurrency: 100, targetRPS: 50 },
    { name: 'Overload', duration: 120, concurrency: 150, targetRPS: 75 },
    { name: 'Recovery', duration: 120, concurrency: 25, targetRPS: 15 },
  ],
  REQUEST_TIMEOUT: 60000, // 60 seconds for stress testing
  HEALTH_CHECK_INTERVAL: 10000, // 10 seconds
  MAX_MEMORY_USAGE: 1024 * 1024 * 1024, // 1GB
};

interface StressTestResult {
  phase: string;
  startTime: Date;
  endTime: Date;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errors: Map<string, number>;
  memoryUsage?: number;
  cpuUsage?: number;
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  timestamp: Date;
}

class StressTester {
  private results: StressTestResult[] = [];
  private isRunning = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private systemMetrics: SystemMetrics[] = [];
  private linkedInUrls: string[] = [];

  constructor() {
    console.log('🔥 LinkedIn Sync Microservice Stress Tester');
    console.log('==========================================');
    console.log(`Base URL: ${STRESS_CONFIG.BASE_URL}`);
    console.log(`Total Test Duration: ${STRESS_CONFIG.PHASES.reduce((sum, phase) => sum + phase.duration, 0)}s`);
    console.log(`Peak Concurrency: ${Math.max(...STRESS_CONFIG.PHASES.map(p => p.concurrency))}`);
    console.log(`Peak Target RPS: ${Math.max(...STRESS_CONFIG.PHASES.map(p => p.targetRPS))}`);
    console.log('==========================================\n');
  }

  async startHealthMonitoring(): Promise<void> {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${STRESS_CONFIG.BASE_URL}/health`, {
          timeout: 5000,
        });
        const health = response.data;
        console.log(`🏥 Health: ${health.status} | DB: ${health.database?.status} | Latency: ${health.database?.latencyMs}ms`);
        
        // Check for degradation
        if (health.database?.latencyMs > 1000) {
          console.warn('⚠️ Database latency is high!');
        }
      } catch (error) {
        console.error('❌ Health check failed:', error);
      }
    }, STRESS_CONFIG.HEALTH_CHECK_INTERVAL);
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
      
      console.log(`📚 Loaded ${this.linkedInUrls.length} LinkedIn URLs for stress testing`);
    } catch (error) {
      console.error('❌ Failed to load LinkedIn URLs:', error);
      throw error;
    }
  }

  async getRandomUrl(): Promise<string> {
    return this.linkedInUrls[Math.floor(Math.random() * this.linkedInUrls.length)];
  }

  async measureSystemMetrics(): Promise<SystemMetrics> {
    try {
      // Simple memory usage measurement
      const memoryUsage = process.memoryUsage();
      const metrics: SystemMetrics = {
        memoryUsage: memoryUsage.heapUsed,
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
        timestamp: new Date(),
      };
      
      this.systemMetrics.push(metrics);
      return metrics;
    } catch (error) {
      console.warn('⚠️ Failed to measure system metrics:', error);
      return {
        memoryUsage: 0,
        cpuUsage: 0,
        timestamp: new Date(),
      };
    }
  }

  async runPhase(phase: typeof STRESS_CONFIG.PHASES[0]): Promise<StressTestResult> {
    console.log(`\n🚀 Starting phase: ${phase.name}`);
    console.log(`   Duration: ${phase.duration}s | Concurrency: ${phase.concurrency} | Target RPS: ${phase.targetRPS}`);
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + phase.duration * 1000);
    const results: any[] = [];
    let requestCount = 0;
    
    // Calculate delay between requests to achieve target RPS
    const delayBetweenRequests = 1000 / phase.targetRPS;
    
    // Start concurrent workers
    const workers = Array.from({ length: phase.concurrency }, async (_, workerId) => {
      while (Date.now() < endTime.getTime()) {
        const requestStart = Date.now();
        try {
          const url = await this.getRandomUrl();
          
          const response = await axios.post(
            `${STRESS_CONFIG.BASE_URL}/api/linkedin/sync`,
            { linkedinUrl: url },
            {
              timeout: STRESS_CONFIG.REQUEST_TIMEOUT,
              headers: { 'Content-Type': 'application/json' },
            }
          );
          
          const responseTime = Date.now() - requestStart;
          results.push({
            success: true,
            responseTime,
            statusCode: response.status,
            workerId,
            timestamp: new Date().toISOString(),
          });
          
          requestCount++;
          
          // Rate limiting to achieve target RPS
          await this.delay(delayBetweenRequests);
          
        } catch (error: any) {
          const responseTime = Date.now() - requestStart;
          results.push({
            success: false,
            responseTime,
            statusCode: error.response?.status,
            error: error.message || 'Unknown error',
            workerId,
            timestamp: new Date().toISOString(),
          });
          
          requestCount++;
        }
      }
    });
    
    // Wait for phase to complete
    await Promise.all(workers);
    
    // Calculate phase results
    const successfulRequests = results.filter(r => r.success).length;
    const failedRequests = results.length - successfulRequests;
    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)] || 0;
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)] || 0;
    
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;
    const throughput = (results.length / duration);
    
    // Count errors by type
    const errors = new Map<string, number>();
    results.forEach(result => {
      if (!result.success && result.error) {
        const errorType = this.categorizeError(result.error);
        errors.set(errorType, (errors.get(errorType) || 0) + 1);
      }
    });
    
    // Get final system metrics
    const finalMetrics = await this.measureSystemMetrics();
    
    const phaseResult: StressTestResult = {
      phase: phase.name,
      startTime,
      endTime,
      totalRequests: results.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: Math.round(averageResponseTime),
      p95ResponseTime,
      p99ResponseTime,
      throughput: Math.round(throughput * 100) / 100,
      errors,
      memoryUsage: finalMetrics.memoryUsage,
      cpuUsage: finalMetrics.cpuUsage,
    };
    
    this.results.push(phaseResult);
    return phaseResult;
  }

  private categorizeError(error: string): string {
    if (error.includes('timeout')) return 'Timeout';
    if (error.includes('network')) return 'Network Error';
    if (error.includes('rate limit')) return 'Rate Limited';
    if (error.includes('not found')) return 'Not Found';
    if (error.includes('validation')) return 'Validation Error';
    if (error.includes('database')) return 'Database Error';
    if (error.includes('RapidAPI')) return 'RapidAPI Error';
    if (error.includes('ECONNRESET')) return 'Connection Reset';
    if (error.includes('ECONNREFUSED')) return 'Connection Refused';
    return 'Other Error';
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  printPhaseResult(result: StressTestResult): void {
    console.log(`\n📊 Phase: ${result.phase}`);
    console.log(`   Duration: ${((result.endTime.getTime() - result.startTime.getTime()) / 1000).toFixed(1)}s`);
    console.log(`   Total Requests: ${result.totalRequests}`);
    console.log(`   Success Rate: ${(result.successfulRequests / result.totalRequests * 100).toFixed(1)}%`);
    console.log(`   Throughput: ${result.throughput} requests/second`);
    console.log(`   Avg Response Time: ${result.averageResponseTime}ms`);
    console.log(`   95th Percentile: ${result.p95ResponseTime}ms`);
    console.log(`   99th Percentile: ${result.p99ResponseTime}ms`);
    
    if (result.errors.size > 0) {
      console.log(`   Errors:`);
      result.errors.forEach((count, errorType) => {
        console.log(`     ${errorType}: ${count}`);
      });
    }
    
    if (result.memoryUsage) {
      const memoryMB = (result.memoryUsage / 1024 / 1024).toFixed(1);
      console.log(`   Memory Usage: ${memoryMB}MB`);
    }
  }

  printOverallSummary(): void {
    console.log('\n🔥 STRESS TEST OVERALL SUMMARY');
    console.log('==============================');
    
    const totalRequests = this.results.reduce((sum, r) => sum + r.totalRequests, 0);
    const totalSuccessful = this.results.reduce((sum, r) => sum + r.successfulRequests, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failedRequests, 0);
    
    console.log(`Total Requests: ${totalRequests}`);
    console.log(`Overall Success Rate: ${(totalSuccessful / totalRequests * 100).toFixed(1)}%`);
    console.log(`Overall Failure Rate: ${(totalFailed / totalRequests * 100).toFixed(1)}%`);
    
    // Find the phase with highest load
    const peakPhase = this.results.reduce((peak, current) => 
      current.throughput > peak.throughput ? current : peak
    );
    
    console.log(`\nPeak Performance:`);
    console.log(`  Phase: ${peakPhase.phase}`);
    console.log(`  Throughput: ${peakPhase.throughput} requests/second`);
    console.log(`  Concurrency: ${STRESS_CONFIG.PHASES.find(p => p.name === peakPhase.phase)?.concurrency}`);
    
    // Performance degradation analysis
    console.log(`\nPerformance Analysis:`);
    const warmupPhase = this.results.find(r => r.phase === 'Warm-up');
    const peakLoadPhase = this.results.find(r => r.phase === 'Peak Load');
    
    if (warmupPhase && peakLoadPhase) {
      const throughputDegradation = ((warmupPhase.throughput - peakLoadPhase.throughput) / warmupPhase.throughput * 100).toFixed(1);
      const responseTimeDegradation = ((peakLoadPhase.averageResponseTime - warmupPhase.averageResponseTime) / warmupPhase.averageResponseTime * 100).toFixed(1);
      
      console.log(`  Throughput Degradation: ${throughputDegradation}%`);
      console.log(`  Response Time Degradation: ${responseTimeDegradation}%`);
    }
    
    // System health assessment
    console.log(`\nSystem Health Assessment:`);
    const memoryTrend = this.analyzeMemoryTrend();
    if (memoryTrend.increasing) {
      console.log(`  ⚠️ Memory usage is increasing (potential memory leak)`);
    } else {
      console.log(`  ✅ Memory usage is stable`);
    }
    
    // Production readiness assessment
    console.log(`\n🎯 Production Readiness Assessment:`);
    if (totalFailed / totalRequests <= 0.05) {
      console.log(`  ✅ Error rate is acceptable for production`);
    } else {
      console.log(`  ❌ Error rate is too high for production`);
    }
    
    if (peakPhase.throughput >= 25) {
      console.log(`  ✅ Peak throughput can handle 1000 syncs/day`);
    } else {
      console.log(`  ❌ Peak throughput insufficient for 1000 syncs/day`);
    }
    
    if (peakPhase.p95ResponseTime <= 30000) {
      console.log(`  ✅ Response times acceptable under peak load`);
    } else {
      console.log(`  ❌ Response times too slow under peak load`);
    }
  }

  private analyzeMemoryTrend(): { increasing: boolean; trend: number } {
    if (this.systemMetrics.length < 3) {
      return { increasing: false, trend: 0 };
    }
    
    const recentMetrics = this.systemMetrics.slice(-3);
    const trend = (recentMetrics[2].memoryUsage - recentMetrics[0].memoryUsage) / recentMetrics[0].memoryUsage;
    
    return {
      increasing: trend > 0.1, // 10% increase threshold
      trend: trend * 100,
    };
  }

  async saveResults(): Promise<void> {
    try {
      const fs = await import('fs');
      const resultsData = {
        summary: {
          totalPhases: this.results.length,
          totalRequests: this.results.reduce((sum, r) => sum + r.totalRequests, 0),
          totalSuccessful: this.results.reduce((sum, r) => sum + r.successfulRequests, 0),
          totalFailed: this.results.reduce((sum, r) => sum + r.failedRequests, 0),
          startTime: this.results[0]?.startTime,
          endTime: this.results[this.results.length - 1]?.endTime,
        },
        phases: this.results,
        systemMetrics: this.systemMetrics,
        config: STRESS_CONFIG,
        timestamp: new Date().toISOString(),
      };
      
      const filename = `stress-test-results-${Date.now()}.json`;
      fs.writeFileSync(filename, JSON.stringify(resultsData, null, 2));
      console.log(`\n💾 Stress test results saved to ${filename}`);
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
      
      console.log(`🎯 Starting stress test with ${this.linkedInUrls.length} available URLs`);
      
      // Run each phase
      for (const phase of STRESS_CONFIG.PHASES) {
        const phaseResult = await this.runPhase(phase);
        this.printPhaseResult(phaseResult);
        
        // Brief pause between phases
        if (phase !== STRESS_CONFIG.PHASES[STRESS_CONFIG.PHASES.length - 1]) {
          console.log('\n⏸️ Pausing between phases...');
          await this.delay(5000);
        }
      }
      
      // Print overall summary
      this.printOverallSummary();
      
      // Save results
      await this.saveResults();
      
    } catch (error) {
      console.error('❌ Stress test failed:', error);
    } finally {
      this.isRunning = false;
      await this.stopHealthMonitoring();
    }
  }
}

// Main execution
async function main() {
  const tester = new StressTester();
  await tester.run();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { StressTester };
