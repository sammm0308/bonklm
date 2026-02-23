/**
 * BonkLM - Rate Limiter
 * ================================
 *
 * S016-003: Sliding window rate limiter to prevent DoS attacks.
 *
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - Per-key rate limiting (by sessionId, IP, etc.)
 * - Configurable window size and request limit
 * - Automatic cleanup of expired entries
 *
 * @package @blackunicorn/bonklm
 */
/**
 * Rate limiter configuration.
 */
export interface RateLimiterConfig {
    /** Maximum number of requests allowed in the time window */
    maxRequests: number;
    /** Time window in milliseconds */
    windowMs: number;
    /** Enable/disable rate limiting */
    enabled?: boolean;
}
/**
 * Rate limit check result.
 */
export interface RateLimitResult {
    /** Whether the request is allowed */
    allowed: boolean;
    /** Number of requests made in the current window */
    count: number;
    /** Number of requests remaining in the window */
    remaining: number;
    /** Time when the window will reset (milliseconds since epoch) */
    resetTime: number;
    /** Estimated time until next request is allowed (milliseconds) */
    retryAfter?: number;
}
/** Default rate limit: 100 requests per minute */
export declare const DEFAULT_RATE_LIMIT: RateLimiterConfig;
/**
 * Sliding window rate limiter.
 * Prevents DoS attacks by limiting request rate per key.
 */
export declare class RateLimiter {
    private readonly config;
    private readonly entries;
    private cleanupCounter;
    constructor(config?: RateLimiterConfig);
    /**
     * Check if a request is allowed for the given key.
     *
     * @param key - Identifier to rate limit (sessionId, IP, etc.)
     * @param timestamp - Current timestamp (defaults to Date.now())
     * @returns Rate limit result
     */
    checkLimit(key: string, timestamp?: number): RateLimitResult;
    /**
     * Reset the rate limit for a specific key.
     * Useful for admin actions or testing.
     *
     * @param key - Identifier to reset
     */
    reset(key: string): void;
    /**
     * Clear all rate limit entries.
     */
    clear(): void;
    /**
     * Get current statistics for a key.
     *
     * @param key - Identifier to check
     * @returns Current count or 0 if not found
     */
    getCount(key: string): number;
    /**
     * Get the number of tracked keys.
     */
    getKeyCount(): number;
    /**
     * Clean up expired entries (outside any window).
     */
    private cleanup;
}
/**
 * Create a rate limiter with the specified configuration.
 */
export declare function createRateLimiter(config?: RateLimiterConfig): RateLimiter;
/**
 * Create a rate limiter for common scenarios.
 */
export declare const CommonRateLimiters: {
    /** 100 requests per minute (default) */
    default: () => RateLimiter;
    /** Strict: 10 requests per minute */
    strict: () => RateLimiter;
    /** Lenient: 1000 requests per minute */
    lenient: () => RateLimiter;
    /** API endpoint: 60 requests per minute */
    api: () => RateLimiter;
    /** Per second: 5 requests per second */
    perSecond: () => RateLimiter;
    /** Disabled (always allows) */
    disabled: () => RateLimiter;
};
//# sourceMappingURL=rate-limiter.d.ts.map