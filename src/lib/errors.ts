/**
 * Specifieke error types voor LinkedIn sync
 * Maakt debugging en recovery mogelijk
 */

export class LinkedInSyncError extends Error {
  constructor(
    message: string,
    public type: 'API' | 'DATABASE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN',
    public recoverable: boolean,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'LinkedInSyncError';
  }

  /**
   * Maak error van een bestaande error
   */
  static fromError(
    error: Error,
    type: 'API' | 'DATABASE' | 'NETWORK' | 'VALIDATION' | 'UNKNOWN',
    recoverable: boolean = false,
    context?: Record<string, any>
  ): LinkedInSyncError {
    return new LinkedInSyncError(
      error.message,
      type,
      recoverable,
      error,
      context
    );
  }

  /**
   * Maak error van RapidAPI response
   */
  static fromRapidAPI(
    message: string,
    status?: number,
    context?: Record<string, any>
  ): LinkedInSyncError {
    let type: 'API' | 'NETWORK' = 'API';
    let recoverable = false;

    // Bepaal of error recoverable is
    if (status === 429) {
      // Rate limit - recoverable
      type = 'API';
      recoverable = true;
    } else if (status === 500 || status === 502 || status === 503) {
      // Server error - recoverable
      type = 'API';
      recoverable = true;
    } else if (status === 404) {
      // Profile not found - niet recoverable
      type = 'API';
      recoverable = false;
    }

    return new LinkedInSyncError(message, type, recoverable, undefined, context);
  }

  /**
   * Maak error van database error
   */
  static fromDatabase(
    error: Error,
    context?: Record<string, any>
  ): LinkedInSyncError {
    let recoverable = false;
    
    // Bepaal of database error recoverable is
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      recoverable = true;
    } else if (error.message.includes('duplicate') || error.message.includes('constraint')) {
      recoverable = false;
    }

    return new LinkedInSyncError(
      `Database error: ${error.message}`,
      'DATABASE',
      recoverable,
      error,
      context
    );
  }

  /**
   * Maak error van network error
   */
  static fromNetwork(
    error: Error,
    context?: Record<string, any>
  ): LinkedInSyncError {
    return new LinkedInSyncError(
      `Network error: ${error.message}`,
      'NETWORK',
      true, // Network errors zijn meestal recoverable
      error,
      context
    );
  }

  /**
   * Maak error van validation error
   */
  static fromValidation(
    message: string,
    context?: Record<string, any>
  ): LinkedInSyncError {
    return new LinkedInSyncError(
      `Validation error: ${message}`,
      'VALIDATION',
      false, // Validation errors zijn niet recoverable
      undefined,
      context
    );
  }

  /**
   * Krijg error details voor logging
   */
  getDetails(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      recoverable: this.recoverable,
      stack: this.stack,
      context: this.context,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * Error codes voor verschillende scenario's
 */
export const ERROR_CODES = {
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PROFILE_NOT_FOUND: 'PROFILE_NOT_FOUND',
  DATABASE_CONNECTION_FAILED: 'DATABASE_CONNECTION_FAILED',
  INVALID_LINKEDIN_URL: 'INVALID_LINKEDIN_URL',
  CANDIDATE_NOT_FOUND: 'CANDIDATE_NOT_FOUND',
  RAPIDAPI_UNAVAILABLE: 'RAPIDAPI_UNAVAILABLE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT'
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
