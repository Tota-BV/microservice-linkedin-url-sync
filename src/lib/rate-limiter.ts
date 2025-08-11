/**
 * Rate Limiter voor RapidAPI calls
 * Voorkomt dat we de API quota overschrijden
 */

export class RateLimiter {
  private calls: number = 0;
  private lastReset: number = Date.now();
  private readonly maxCalls: number;
  private readonly windowMs: number;

  constructor(maxCalls: number = 5, windowMs: number = 60000) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  /**
   * Wacht indien nodig om rate limit te respecteren
   */
  async waitIfNeeded(): Promise<void> {
    const now = Date.now();
    
    // Reset counter als window voorbij is
    if (now - this.lastReset >= this.windowMs) {
      this.calls = 0;
      this.lastReset = now;
    }

    // Als we op limiet zitten, wacht tot window voorbij is
    if (this.calls >= this.maxCalls) {
      const waitTime = this.windowMs - (now - this.lastReset);
      console.log(`⏳ Rate limit bereikt, wacht ${waitTime}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, waitTime));
      
      // Reset na wachten
      this.calls = 0;
      this.lastReset = Date.now();
    }

    this.calls++;
    console.log(`📊 API call ${this.calls}/${this.maxCalls} in huidige window`);
  }

  /**
   * Reset de rate limiter (voor testing)
   */
  reset(): void {
    this.calls = 0;
    this.lastReset = Date.now();
  }

  /**
   * Krijg huidige status
   */
  getStatus(): { calls: number; maxCalls: number; windowMs: number; lastReset: number } {
    return {
      calls: this.calls,
      maxCalls: this.maxCalls,
      windowMs: this.windowMs,
      lastReset: this.lastReset
    };
  }
}

// Singleton instance voor de hele applicatie
export const rapidAPIRateLimiter = new RateLimiter(5, 60000); // 5 calls per minuut
