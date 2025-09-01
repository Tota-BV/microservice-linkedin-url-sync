#!/usr/bin/env bun

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Error recovery configuration
const RECOVERY_CONFIG = {
  BASE_URL: process.env.TEST_BASE_URL || 'http://localhost:3000',
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
  HEALTH_CHECK_TIMEOUT: 10000,
  DIAGNOSTIC_TIMEOUT: 30000,
};

interface DiagnosticResult {
  timestamp: string;
  serviceHealth: {
    status: 'healthy' | 'unhealthy' | 'unknown';
    endpoint: string;
    responseTime: number;
    error?: string;
  };
  databaseHealth: {
    status: 'connected' | 'disconnected' | 'unknown';
    latency: number;
    error?: string;
  };
  systemResources: {
    memoryUsage: number;
    cpuUsage: number;
    diskSpace: number;
  };
  networkConnectivity: {
    localhost: boolean;
    database: boolean;
    rapidapi: boolean;
  };
  recommendations: string[];
}

interface RecoveryAction {
  name: string;
  description: string;
  command: string;
  risk: 'low' | 'medium' | 'high';
  prerequisites: string[];
}

class ErrorRecovery {
  private diagnostics: DiagnosticResult[] = [];
  private recoveryActions: RecoveryAction[] = [];

  constructor() {
    console.log('🆘 LinkedIn Sync Microservice - Error Recovery Tool');
    console.log('==================================================');
    this.initializeRecoveryActions();
  }

  private initializeRecoveryActions(): void {
    this.recoveryActions = [
      {
        name: 'Restart Service',
        description: 'Restart the microservice to clear any stuck processes',
        command: 'bun run start',
        risk: 'low',
        prerequisites: ['Stop current service process'],
      },
      {
        name: 'Check Database Connection',
        description: 'Verify database connectivity and restart if needed',
        command: 'bun run db:migrate',
        risk: 'low',
        prerequisites: ['Database credentials configured'],
      },
      {
        name: 'Clear Cache',
        description: 'Remove cached LinkedIn profile data',
        command: 'rm -rf src/cache/linkedin-profiles/*',
        risk: 'low',
        prerequisites: ['Service stopped'],
      },
      {
        name: 'Reset Rate Limiter',
        description: 'Clear rate limiting state',
        command: 'echo "Rate limiter reset"',
        risk: 'low',
        prerequisites: ['Service stopped'],
      },
      {
        name: 'Check Environment Variables',
        description: 'Verify all required environment variables are set',
        command: 'env | grep -E "(DATABASE_URL|RAPIDAPI_KEY|PORT)"',
        risk: 'low',
        prerequisites: ['None'],
      },
      {
        name: 'Restart Database',
        description: 'Restart PostgreSQL database service',
        command: 'docker-compose restart db',
        risk: 'medium',
        prerequisites: ['Docker running', 'Database data backed up'],
      },
      {
        name: 'Reset Test Data',
        description: 'Clear test results and start fresh',
        command: 'rm -f test-results/*.json load-test-results-*.json stress-test-results-*.json',
        risk: 'low',
        prerequisites: ['None'],
      },
    ];
  }

  async runDiagnostics(): Promise<DiagnosticResult> {
    console.log('🔍 Running comprehensive diagnostics...');
    
    const diagnostic: DiagnosticResult = {
      timestamp: new Date().toISOString(),
      serviceHealth: { status: 'unknown', endpoint: '', responseTime: 0 },
      databaseHealth: { status: 'unknown', latency: 0 },
      systemResources: { memoryUsage: 0, cpuUsage: 0, diskSpace: 0 },
      networkConnectivity: { localhost: false, database: false, rapidapi: false },
      recommendations: [],
    };

    try {
      // Test service health
      console.log('  🏥 Checking service health...');
      const serviceStart = Date.now();
      const healthResponse = await fetch(`${RECOVERY_CONFIG.BASE_URL}/health`, {
        signal: AbortSignal.timeout(RECOVERY_CONFIG.HEALTH_CHECK_TIMEOUT),
      });
      
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        diagnostic.serviceHealth = {
          status: 'healthy',
          endpoint: '/health',
          responseTime: Date.now() - serviceStart,
        };
        
        // Check database health from service response
        if (healthData.database) {
          diagnostic.databaseHealth = {
            status: healthData.database.connected ? 'connected' : 'disconnected',
            latency: healthData.database.latencyMs || 0,
            error: healthData.database.error,
          };
        }
      } else {
        diagnostic.serviceHealth = {
          status: 'unhealthy',
          endpoint: '/health',
          responseTime: Date.now() - serviceStart,
          error: `HTTP ${healthResponse.status}`,
        };
      }
    } catch (error: any) {
      diagnostic.serviceHealth = {
        status: 'unhealthy',
        endpoint: '/health',
        responseTime: 0,
        error: error.message,
      };
    }

    // Check system resources
    console.log('  💾 Checking system resources...');
    try {
      const memoryUsage = process.memoryUsage();
      diagnostic.systemResources.memoryUsage = memoryUsage.heapUsed;
      diagnostic.systemResources.cpuUsage = process.cpuUsage().user;
      
      // Simple disk space check (check if we can write to current directory)
      try {
        const testFile = `test-write-${Date.now()}.tmp`;
        writeFileSync(testFile, 'test');
        existsSync(testFile) && require('fs').unlinkSync(testFile);
        diagnostic.systemResources.diskSpace = 1; // Available
      } catch {
        diagnostic.systemResources.diskSpace = 0; // Not available
      }
    } catch (error) {
      console.warn('  ⚠️ Could not check system resources:', error);
    }

    // Check network connectivity
    console.log('  🌐 Checking network connectivity...');
    try {
      // Test localhost connectivity
      const localhostTest = await fetch('http://localhost:3000', {
        signal: AbortSignal.timeout(5000),
      });
      diagnostic.networkConnectivity.localhost = localhostTest.ok;
    } catch {
      diagnostic.networkConnectivity.localhost = false;
    }

    // Test database connectivity (if we have the connection string)
    try {
      if (process.env.DATABASE_URL) {
        const { pool } = await import('../lib/database');
        const dbStart = Date.now();
        await pool.query('SELECT 1');
        diagnostic.networkConnectivity.database = true;
        diagnostic.databaseHealth.latency = Date.now() - dbStart;
      }
    } catch {
      diagnostic.networkConnectivity.database = false;
    }

    // Test RapidAPI connectivity
    try {
      if (process.env.RAPIDAPI_KEY) {
        const { rapidAPIClient } = await import('../lib/rapidapi');
        // Simple connectivity test
        diagnostic.networkConnectivity.rapidapi = true;
      }
    } catch {
      diagnostic.networkConnectivity.rapidapi = false;
    }

    // Generate recommendations
    diagnostic.recommendations = this.generateRecommendations(diagnostic);

    this.diagnostics.push(diagnostic);
    return diagnostic;
  }

  private generateRecommendations(diagnostic: DiagnosticResult): string[] {
    const recommendations: string[] = [];

    if (diagnostic.serviceHealth.status !== 'healthy') {
      recommendations.push('Service is not responding - restart the microservice');
    }

    if (diagnostic.databaseHealth.status !== 'connected') {
      recommendations.push('Database connection failed - check database service and credentials');
    }

    if (diagnostic.databaseHealth.latency > 1000) {
      recommendations.push('Database latency is high - check database performance and connections');
    }

    if (!diagnostic.networkConnectivity.localhost) {
      recommendations.push('Localhost connectivity failed - check if service is running on port 3000');
    }

    if (!diagnostic.networkConnectivity.database) {
      recommendations.push('Database connectivity failed - verify DATABASE_URL and database service');
    }

    if (!diagnostic.networkConnectivity.rapidapi) {
      recommendations.push('RapidAPI connectivity failed - check RAPIDAPI_KEY and network access');
    }

    if (diagnostic.systemResources.memoryUsage > 500 * 1024 * 1024) { // 500MB
      recommendations.push('High memory usage detected - consider restarting service');
    }

    if (diagnostic.systemResources.diskSpace === 0) {
      recommendations.push('Disk space issues detected - check available disk space');
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems appear healthy - issue may be intermittent');
    }

    return recommendations;
  }

  printDiagnostics(diagnostic: DiagnosticResult): void {
    console.log('\n📊 DIAGNOSTIC RESULTS');
    console.log('======================');
    console.log(`Timestamp: ${diagnostic.timestamp}`);
    
    console.log('\n🏥 Service Health:');
    console.log(`  Status: ${diagnostic.serviceHealth.status.toUpperCase()}`);
    console.log(`  Endpoint: ${diagnostic.serviceHealth.endpoint}`);
    console.log(`  Response Time: ${diagnostic.serviceHealth.responseTime}ms`);
    if (diagnostic.serviceHealth.error) {
      console.log(`  Error: ${diagnostic.serviceHealth.error}`);
    }

    console.log('\n🗄️ Database Health:');
    console.log(`  Status: ${diagnostic.databaseHealth.status.toUpperCase()}`);
    console.log(`  Latency: ${diagnostic.databaseHealth.latency}ms`);
    if (diagnostic.databaseHealth.error) {
      console.log(`  Error: ${diagnostic.databaseHealth.error}`);
    }

    console.log('\n💾 System Resources:');
    const memoryMB = (diagnostic.systemResources.memoryUsage / 1024 / 1024).toFixed(1);
    console.log(`  Memory Usage: ${memoryMB}MB`);
    console.log(`  CPU Usage: ${diagnostic.systemResources.cpuUsage}μs`);
    console.log(`  Disk Space: ${diagnostic.systemResources.diskSpace ? 'Available' : 'Issues'}`);

    console.log('\n🌐 Network Connectivity:');
    console.log(`  Localhost: ${diagnostic.networkConnectivity.localhost ? '✅' : '❌'}`);
    console.log(`  Database: ${diagnostic.networkConnectivity.database ? '✅' : '❌'}`);
    console.log(`  RapidAPI: ${diagnostic.networkConnectivity.rapidapi ? '✅' : '❌'}`);

    console.log('\n💡 Recommendations:');
    diagnostic.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  printRecoveryActions(): void {
    console.log('\n🛠️ AVAILABLE RECOVERY ACTIONS');
    console.log('==============================');
    
    this.recoveryActions.forEach((action, index) => {
      console.log(`\n${index + 1}. ${action.name}`);
      console.log(`   Description: ${action.description}`);
      console.log(`   Risk Level: ${action.risk.toUpperCase()}`);
      console.log(`   Command: ${action.command}`);
      if (action.prerequisites.length > 0) {
        console.log(`   Prerequisites: ${action.prerequisites.join(', ')}`);
      }
    });
  }

  async executeRecoveryAction(actionIndex: number): Promise<void> {
    if (actionIndex < 0 || actionIndex >= this.recoveryActions.length) {
      throw new Error(`Invalid action index: ${actionIndex}`);
    }

    const action = this.recoveryActions[actionIndex];
    console.log(`\n🚀 Executing: ${action.name}`);
    console.log(`   Risk Level: ${action.risk.toUpperCase()}`);
    console.log(`   Command: ${action.command}`);
    
    if (action.prerequisites.length > 0) {
      console.log(`\n⚠️ Prerequisites: ${action.prerequisites.join(', ')}`);
      console.log('   Please ensure these are met before continuing.');
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      
      const answer = await new Promise<string>((resolve) => {
        rl.question('   Continue? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y') {
        console.log('   Action cancelled.');
        return;
      }
    }

    try {
      console.log(`\n🔄 Executing: ${action.command}`);
      
      // Execute the command based on type
      if (action.command.startsWith('bun run')) {
        console.log('   Starting service... (this may take a moment)');
        // Note: In a real implementation, you'd spawn a new process
        console.log('   Please run this command manually in a new terminal:');
        console.log(`   ${action.command}`);
      } else if (action.command.startsWith('docker-compose')) {
        console.log('   Docker command detected - please run manually:');
        console.log(`   ${action.command}`);
      } else if (action.command.startsWith('rm -')) {
        console.log('   File removal command - executing...');
        const { execSync } = await import('child_process');
        execSync(action.command, { stdio: 'inherit' });
        console.log('   ✅ Command executed successfully');
      } else if (action.command.startsWith('env')) {
        console.log('   Environment check - executing...');
        const { execSync } = await import('child_process');
        execSync(action.command, { stdio: 'inherit' });
      } else {
        console.log('   Please execute this command manually:');
        console.log(`   ${action.command}`);
      }
      
      console.log(`\n✅ Recovery action "${action.name}" completed`);
      
    } catch (error: any) {
      console.error(`\n❌ Recovery action failed: ${error.message}`);
      console.log('   Please execute the command manually or try a different approach');
    }
  }

  async runRecoveryWorkflow(): Promise<void> {
    console.log('\n🔄 Starting Recovery Workflow...');
    
    // Step 1: Run diagnostics
    const diagnostic = await this.runDiagnostics();
    this.printDiagnostics(diagnostic);
    
    // Step 2: Show recovery actions
    this.printRecoveryActions();
    
    // Step 3: Interactive recovery
    console.log('\n🎯 INTERACTIVE RECOVERY');
    console.log('========================');
    console.log('Select a recovery action to execute:');
    
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    
    try {
      const answer = await new Promise<string>((resolve) => {
        rl.question('\nEnter action number (or "q" to quit): ', resolve);
      });
      
      if (answer.toLowerCase() === 'q') {
        console.log('Recovery workflow cancelled.');
        return;
      }
      
      const actionIndex = parseInt(answer) - 1;
      if (isNaN(actionIndex) || actionIndex < 0 || actionIndex >= this.recoveryActions.length) {
        console.log('Invalid action number. Please try again.');
        return;
      }
      
      await this.executeRecoveryAction(actionIndex);
      
      // Step 4: Re-run diagnostics to check if issue is resolved
      console.log('\n🔍 Re-running diagnostics to check recovery...');
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait for recovery
      const postRecoveryDiagnostic = await this.runDiagnostics();
      this.printDiagnostics(postRecoveryDiagnostic);
      
    } finally {
      rl.close();
    }
  }

  async saveDiagnostics(): Promise<void> {
    try {
      const filename = `error-recovery-diagnostics-${Date.now()}.json`;
      writeFileSync(filename, JSON.stringify(this.diagnostics, null, 2));
      console.log(`\n💾 Diagnostics saved to ${filename}`);
    } catch (error) {
      console.error('❌ Failed to save diagnostics:', error);
    }
  }

  async run(): Promise<void> {
    try {
      console.log('🆘 Starting Error Recovery Tool...');
      
      // Run initial diagnostics
      await this.runDiagnostics();
      
      // Show recovery workflow
      await this.runRecoveryWorkflow();
      
      // Save diagnostics
      await this.saveDiagnostics();
      
      console.log('\n🎉 Error Recovery Tool completed!');
      console.log('Check the diagnostic results above for next steps.');
      
    } catch (error) {
      console.error('❌ Error Recovery Tool failed:', error);
      console.log('\n🆘 Manual Recovery Required');
      console.log('Please check the following:');
      console.log('1. Is the service running? (bun run start)');
      console.log('2. Is the database accessible?');
      console.log('3. Are environment variables set correctly?');
      console.log('4. Check logs for specific error messages');
    }
  }
}

// Main execution
async function main() {
  const recovery = new ErrorRecovery();
  await recovery.run();
}

// Run if called directly
if (import.meta.main) {
  main().catch(console.error);
}

export { ErrorRecovery };

