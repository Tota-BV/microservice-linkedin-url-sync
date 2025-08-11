/**
 * Streaming response utility voor grote batches
 * Voorkomt memory buildup door resultaten direct te versturen
 */

import { ServerResponse } from 'http';

export class StreamingResponse {
  private res: ServerResponse;
  private isFirstChunk: boolean = true;

  constructor(res: ServerResponse) {
    this.res = res;
    this.setupHeaders();
  }

  /**
   * Setup headers voor streaming response
   */
  private setupHeaders(): void {
    this.res.writeHead(200, {
      'Content-Type': 'text/plain', // Simpler format voor streaming
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
  }

  /**
   * Start de response met metadata
   */
  startResponse(metadata: any): void {
    const startChunk = {
      status: 'started',
      metadata,
      timestamp: new Date().toISOString()
    };

    this.res.write(JSON.stringify(startChunk) + '\n');
  }

  /**
   * Verstuur een resultaat chunk
   */
  sendChunk(data: any): void {
    const chunk = {
      status: 'processing',
      data,
      timestamp: new Date().toISOString()
    };

    this.res.write(JSON.stringify(chunk) + '\n');
  }

  /**
   * Verstuur progress update
   */
  sendProgress(current: number, total: number): void {
    const progress = {
      status: 'progress',
      current,
      total,
      percentage: Math.round((current / total) * 100),
      timestamp: new Date().toISOString()
    };

    this.res.write(JSON.stringify(progress) + '\n');
  }

  /**
   * Eindig de response met summary
   */
  endResponse(summary: any): void {
    const endChunk = {
      status: 'completed',
      summary,
      timestamp: new Date().toISOString()
    };

    this.res.write(JSON.stringify(endChunk) + '\n');
    this.res.end();
  }

  /**
   * Verstuur error en eindig response
   */
  sendError(error: any, context?: any): void {
    const errorChunk = {
      status: 'error',
      error: {
        message: error.message,
        type: error.type || 'UNKNOWN',
        recoverable: error.recoverable || false
      },
      context,
      timestamp: new Date().toISOString()
    };

    this.res.write(JSON.stringify(errorChunk) + '\n');
    this.res.end();
  }

  /**
   * Check of response nog actief is
   */
  isActive(): boolean {
    return !this.res.destroyed && !this.res.finished;
  }
}

/**
 * Batch processor die streaming gebruikt
 */
export class StreamingBatchProcessor {
  private streamingResponse: StreamingResponse;
  private results: any[] = [];
  private errors: any[] = [];
  private processed: number = 0;
  private total: number = 0;

  constructor(res: ServerResponse) {
    this.streamingResponse = new StreamingResponse(res);
  }

  /**
   * Start processing van een batch
   */
  startBatch(totalUrls: number, metadata: any): void {
    this.total = totalUrls;
    this.processed = 0;
    this.results = [];
    this.errors = [];

    this.streamingResponse.startResponse({
      ...metadata,
      totalUrls,
      estimatedTime: this.estimateProcessingTime(totalUrls)
    });
  }

  /**
   * Verwerk een enkel resultaat
   */
  processResult(result: any): void {
    this.processed++;
    
    if (result.success) {
      this.results.push(result);
      this.streamingResponse.sendChunk(result);
    } else {
      this.errors.push(result);
      this.streamingResponse.sendChunk(result);
    }

    // Verstuur progress elke 5 resultaten
    if (this.processed % 5 === 0 || this.processed === this.total) {
      this.streamingResponse.sendProgress(this.processed, this.total);
    }
  }

  /**
   * Eindig de batch processing
   */
  endBatch(): void {
    const summary = {
      total: this.total,
      successful: this.results.length,
      failed: this.errors.length,
      successRate: Math.round((this.results.length / this.total) * 100),
      processingTime: Date.now() - Date.now() // Placeholder
    };

    this.streamingResponse.endResponse(summary);
  }

  /**
   * Schat processing tijd
   */
  private estimateProcessingTime(totalUrls: number): string {
    const avgTimePerUrl = 3; // seconden per URL
    const totalSeconds = totalUrls * avgTimePerUrl;
    
    if (totalSeconds < 60) {
      return `${totalSeconds} seconden`;
    } else if (totalSeconds < 3600) {
      const minutes = Math.round(totalSeconds / 60);
      return `${minutes} minuten`;
    } else {
      const hours = Math.round(totalSeconds / 3600);
      return `${hours} uur`;
    }
  }

  /**
   * Check of response nog actief is
   */
  isActive(): boolean {
    return this.streamingResponse.isActive();
  }
}
