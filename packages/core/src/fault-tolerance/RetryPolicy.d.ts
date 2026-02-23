/**
 * Retry Policy
 *
 * Implements retry logic with exponential backoff for transient failures.
 *
 * @package @blackunicorn/bonklm
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Retry configuration
 */
export interface RetryConfig {
    /** Maximum number of retry attempts */
    maxAttempts?: number;
    /** Initial delay in milliseconds */
    initialDelay?: number;
    /** Multiplier for exponential backoff */
    backoffMultiplier?: number;
    /** Maximum delay in milliseconds */
    maxDelay?: number;
    /** Jitter to add to delay (0-1) */
    jitter?: number;
    /** Logger instance */
    logger?: Logger;
    /** Enable/disable retry */
    enabled?: boolean;
    /** Error codes that should trigger retry */
    retryableErrorCodes?: string[];
    /** Error types that should trigger retry */
    retryableErrorTypes?: string[];
}
/**
 * Retry result
 */
export interface RetryResult<T> {
    success: boolean;
    value?: T;
    error?: Error;
    attempts: number;
    totalDelay: number;
}
/**
 * Retry options per attempt
 */
export interface RetryAttemptOptions {
    attemptNumber: number;
    delay: number;
    remainingAttempts: number;
}
/**
 * Retry Policy
 *
 * Implements retry logic with exponential backoff and jitter.
 * Supports configurable retry conditions for transient failures.
 */
export declare class RetryPolicy {
    private readonly config;
    private readonly retryableErrorCodes;
    private readonly retryableErrorTypes;
    private readonly logger;
    constructor(config?: RetryConfig);
    /**
     * Execute a function with retry logic
     */
    execute<T>(fn: (options: RetryAttemptOptions) => Promise<T> | T): Promise<RetryResult<T>>;
    /**
     * Check if an error is retryable
     */
    private isRetryableError;
    /**
     * Calculate delay with jitter
     */
    private calculateDelay;
    /**
     * Sleep for specified milliseconds
     */
    private sleep;
}
/**
 * Create a retry policy with default configuration
 */
export declare function createRetryPolicy(config?: RetryConfig): RetryPolicy;
//# sourceMappingURL=RetryPolicy.d.ts.map