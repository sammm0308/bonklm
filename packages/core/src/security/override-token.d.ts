/**
 * Override Token Validation
 *
 * S011-006: Cryptographic validation for override tokens.
 * Provides HMAC-based token validation with expiration and audit logging.
 *
 * @package @blackunicorn/bonklm
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Token scopes
 */
export declare enum TokenScope {
    /** Full bypass - use with extreme caution */
    ADMIN = "admin",
    /** Time-limited emergency bypass */
    EMERGENCY = "emergency",
    /** Read-only access - allows logging but no actual bypass */
    READONLY = "readonly"
}
/**
 * Token validation result
 */
export interface TokenValidationResult {
    /** Whether the token is valid */
    valid: boolean;
    /** Validation error message (if invalid) */
    error?: string;
    /** Token scope (if valid) */
    scope?: TokenScope;
    /** Token timestamp (if valid) */
    timestamp?: number;
}
/**
 * Override token configuration
 */
export interface OverrideTokenConfig {
    /** HMAC secret key (must be 32+ bytes) */
    secret: string;
    /** Token expiration in milliseconds (default 1 hour) */
    expirationMs?: number;
    /** Maximum number of tokens to track for replay protection */
    maxReplayCache?: number;
}
/**
 * Token usage for audit logging
 */
export interface TokenUsage {
    timestamp: number;
    scope: TokenScope;
    contentHash: string;
    success: boolean;
    error?: string;
}
/**
 * Override Token Validator
 *
 * Provides cryptographic validation for override tokens with:
 * - HMAC-SHA256 signature verification
 * - Token expiration checking
 * - Replay attack prevention
 * - Timing-safe comparison
 */
export declare class OverrideTokenValidator {
    private readonly secret;
    private readonly expirationMs;
    private readonly maxReplayCache;
    private readonly replayCache;
    private readonly tokenFormatRegex;
    constructor(config: OverrideTokenConfig);
    /**
     * Generate a new override token
     *
     * @param scope - Token scope
     * @param _customExpirationMs - Optional custom expiration (reserved for future use)
     * @returns Generated token string
     */
    generateToken(scope?: TokenScope, _customExpirationMs?: number): string;
    /**
     * Validate an override token
     *
     * @param token - Token string to validate
     * @returns Validation result
     */
    validateToken(token: string): TokenValidationResult;
    /**
     * Check if content contains a valid override token
     *
     * @param content - Content to check for token
     * @returns Validation result
     */
    validateContent(content: string): TokenValidationResult;
    /**
     * Log token usage for audit purposes
     *
     * @param logger - Logger instance
     * @param usage - Token usage details
     */
    logUsage(logger: Logger, usage: TokenUsage): void;
    /**
     * Clean up old replay cache entries
     *
     * @param olderThanMs - Remove entries older than this (default: 2x expiration)
     */
    cleanupReplayCache(olderThanMs?: number): void;
    /**
     * Clear the replay cache (for testing purposes)
     */
    clearReplayCache(): void;
    /**
     * Mark a token as used (replay protection)
     */
    private markTokenUsed;
    /**
     * Extract potential override tokens from content
     */
    private extractPotentialTokens;
    /**
     * Timing-safe string comparison
     *
     * Uses crypto.timingSafeEqual with proper length handling
     */
    private timingSafeEqualString;
}
/**
 * Create content hash for audit logging
 *
 * @param content - Content to hash
 * @returns Hash string (first 16 chars)
 */
export declare function hashContent(content: string): string;
/**
 * Get override token secret from environment
 *
 * Priority order:
 * 1. BONKLM_OVERRIDE_SECRET environment variable
 * 2. LLM_GUARDRAILS_OVERRIDE_SECRET (legacy)
 * 3. Throws error in production if not set
 *
 * @returns Secret key string
 * @throws Error if secret not available
 */
export declare function getOverrideTokenSecret(): string;
/**
 * Create an override token validator from environment
 *
 * @returns Configured validator instance
 */
export declare function createOverrideTokenValidator(): OverrideTokenValidator;
/**
 * Type for override token configuration in engine config
 */
export type OverrideTokenConfigString = string | OverrideTokenConfig;
/**
 * Parse override token configuration
 *
 * Supports both simple string (legacy) and new config object
 *
 * @param config - Configuration string or object
 * @returns Parsed configuration
 */
export declare function parseOverrideTokenConfig(config: OverrideTokenConfigString): OverrideTokenConfig;
//# sourceMappingURL=override-token.d.ts.map