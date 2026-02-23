/**
 * Override Token Validation
 *
 * S011-006: Cryptographic validation for override tokens.
 * Provides HMAC-based token validation with expiration and audit logging.
 *
 * @package @blackunicorn/bonklm
 */
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
/**
 * Token format: timestamp:signature:nonce:scope
 * - timestamp: Unix timestamp for expiration check
 * - signature: HMAC-SHA256 signature
 * - nonce: Random bytes to prevent replay attacks
 * - scope: Token scope (admin, emergency, readonly)
 */
const TOKEN_FORMAT = '^(\\d+):([a-f0-9]{64}):([a-f0-9]{16,32}):([a-z_]+)$';
/**
 * Default token expiration: 1 hour (3600000 ms)
 */
const DEFAULT_TOKEN_EXPIRATION_MS = 3600000;
/**
 * HMAC algorithm for token signing
 */
const HMAC_ALGORITHM = 'sha256';
/**
 * Token scopes
 */
export var TokenScope;
(function (TokenScope) {
    /** Full bypass - use with extreme caution */
    TokenScope["ADMIN"] = "admin";
    /** Time-limited emergency bypass */
    TokenScope["EMERGENCY"] = "emergency";
    /** Read-only access - allows logging but no actual bypass */
    TokenScope["READONLY"] = "readonly";
})(TokenScope || (TokenScope = {}));
/**
 * Override Token Validator
 *
 * Provides cryptographic validation for override tokens with:
 * - HMAC-SHA256 signature verification
 * - Token expiration checking
 * - Replay attack prevention
 * - Timing-safe comparison
 */
export class OverrideTokenValidator {
    secret;
    expirationMs;
    maxReplayCache;
    replayCache;
    tokenFormatRegex;
    constructor(config) {
        if (!config.secret || config.secret.length < 32) {
            throw new Error('Override token secret must be at least 32 characters');
        }
        this.secret = Buffer.from(config.secret, 'utf-8');
        this.expirationMs = config.expirationMs ?? DEFAULT_TOKEN_EXPIRATION_MS;
        this.maxReplayCache = config.maxReplayCache ?? 10000;
        this.replayCache = new Map();
        this.tokenFormatRegex = new RegExp(TOKEN_FORMAT);
    }
    /**
     * Generate a new override token
     *
     * @param scope - Token scope
     * @param _customExpirationMs - Optional custom expiration (reserved for future use)
     * @returns Generated token string
     */
    generateToken(scope = TokenScope.ADMIN, _customExpirationMs) {
        const timestamp = Date.now();
        const nonce = randomBytes(16).toString('hex');
        // Create signature payload
        const payload = `${timestamp}:${nonce}:${scope}`;
        const signature = createHmac(HMAC_ALGORITHM, this.secret)
            .update(payload)
            .digest('hex');
        return `${timestamp}:${signature}:${nonce}:${scope}`;
    }
    /**
     * Validate an override token
     *
     * @param token - Token string to validate
     * @returns Validation result
     */
    validateToken(token) {
        // Parse token format
        const match = token.match(this.tokenFormatRegex);
        if (!match) {
            return { valid: false, error: 'Invalid token format' };
        }
        const [, timestampStr, providedSignature, nonce, scopeStr] = match;
        const timestamp = parseInt(timestampStr, 10);
        // Check expiration
        const now = Date.now();
        if (now - timestamp > this.expirationMs) {
            return { valid: false, error: 'Token expired' };
        }
        // Check for future timestamp (clock skew protection)
        if (timestamp > now + 60000) { // Allow 1 minute clock skew
            return { valid: false, error: 'Token timestamp in future' };
        }
        // Check replay protection
        const replayKey = `${nonce}:${scopeStr}`;
        if (this.replayCache.has(replayKey)) {
            return { valid: false, error: 'Token already used (replay attack detected)' };
        }
        // Verify scope
        if (!Object.values(TokenScope).includes(scopeStr)) {
            return { valid: false, error: 'Invalid token scope' };
        }
        // Verify signature
        const payload = `${timestamp}:${nonce}:${scopeStr}`;
        const expectedSignature = createHmac(HMAC_ALGORITHM, this.secret)
            .update(payload)
            .digest('hex');
        // Use timing-safe comparison to prevent timing attacks
        const signatureValid = this.timingSafeEqualString(providedSignature, expectedSignature);
        if (!signatureValid) {
            return { valid: false, error: 'Invalid token signature' };
        }
        // Mark token as used (after all validation passes)
        this.markTokenUsed(replayKey);
        return {
            valid: true,
            scope: scopeStr,
            timestamp,
        };
    }
    /**
     * Check if content contains a valid override token
     *
     * @param content - Content to check for token
     * @returns Validation result
     */
    validateContent(content) {
        // Token format: timestamp:signature:nonce:scope (approx 100+ chars)
        // Extract potential tokens from content
        const potentialTokens = this.extractPotentialTokens(content);
        for (const token of potentialTokens) {
            const result = this.validateToken(token);
            if (result.valid) {
                return result;
            }
        }
        return { valid: false, error: 'No valid override token found' };
    }
    /**
     * Log token usage for audit purposes
     *
     * @param logger - Logger instance
     * @param usage - Token usage details
     */
    logUsage(logger, usage) {
        if (usage.success) {
            logger.warn('Override token used', {
                scope: usage.scope,
                timestamp: new Date(usage.timestamp).toISOString(),
                contentHash: usage.contentHash,
            });
        }
        else {
            logger.warn('Override token validation failed', {
                error: usage.error,
                contentHash: usage.contentHash,
            });
        }
    }
    /**
     * Clean up old replay cache entries
     *
     * @param olderThanMs - Remove entries older than this (default: 2x expiration)
     */
    cleanupReplayCache(olderThanMs = this.expirationMs * 2) {
        const now = Date.now();
        const cutoff = now - olderThanMs;
        for (const [key, entry] of this.replayCache.entries()) {
            if (entry.usedAt < cutoff) {
                this.replayCache.delete(key);
            }
        }
    }
    /**
     * Clear the replay cache (for testing purposes)
     */
    clearReplayCache() {
        this.replayCache.clear();
    }
    /**
     * Mark a token as used (replay protection)
     */
    markTokenUsed(key) {
        // Evict oldest entries if cache is full
        if (this.replayCache.size >= this.maxReplayCache) {
            const oldestKey = this.replayCache.keys().next().value;
            if (oldestKey) {
                this.replayCache.delete(oldestKey);
            }
        }
        this.replayCache.set(key, {
            nonce: key,
            usedAt: Date.now(),
        });
    }
    /**
     * Extract potential override tokens from content
     */
    extractPotentialTokens(content) {
        const tokens = [];
        // Token format pattern (timestamp:signature:nonce:scope)
        // timestamp: 10-13 digits
        // signature: 64 hex chars
        // nonce: 16-32 hex chars
        // scope: lowercase letters and underscores
        // Use lookahead to ensure token ends with non-alphanumeric/: or end of string
        const tokenPattern = /(\d{10,13}:[a-f0-9]{64}:[a-f0-9]{16,32}:[a-z_]+)(?![a-z0-9_:])/gi;
        let match;
        while ((match = tokenPattern.exec(content)) !== null) {
            tokens.push(match[1]);
        }
        return tokens;
    }
    /**
     * Timing-safe string comparison
     *
     * Uses crypto.timingSafeEqual with proper length handling
     */
    timingSafeEqualString(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        try {
            return timingSafeEqual(Buffer.from(a, 'utf-8'), Buffer.from(b, 'utf-8'));
        }
        catch {
            return false;
        }
    }
}
/**
 * Create content hash for audit logging
 *
 * @param content - Content to hash
 * @returns Hash string (first 16 chars)
 */
export function hashContent(content) {
    return createHmac(HMAC_ALGORITHM, 'audit-hash')
        .update(content.slice(0, 1000)) // Only hash first 1000 chars
        .digest('hex')
        .slice(0, 16);
}
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
export function getOverrideTokenSecret() {
    const secret = process.env.BONKLM_OVERRIDE_SECRET ||
        process.env.LLM_GUARDRAILS_OVERRIDE_SECRET;
    if (!secret) {
        const isProduction = process.env.NODE_ENV === 'production' ||
            process.env.RAILS_ENV === 'production' ||
            process.env.FLASK_ENV === 'production';
        if (isProduction) {
            throw new Error('BONKLM_OVERRIDE_SECRET must be set in production. ' +
                'Generate with: openssl rand -base64 32');
        }
        // For development/testing, use a placeholder
        console.warn('[SECURITY] Using temporary override token secret for development. Set BONKLM_OVERRIDE_SECRET in production!');
        return randomBytes(32).toString('base64');
    }
    if (secret.length < 32) {
        throw new Error('BONKLM_OVERRIDE_SECRET must be at least 32 characters');
    }
    return secret;
}
/**
 * Create an override token validator from environment
 *
 * @returns Configured validator instance
 */
export function createOverrideTokenValidator() {
    const secret = getOverrideTokenSecret();
    return new OverrideTokenValidator({ secret });
}
/**
 * Parse override token configuration
 *
 * Supports both simple string (legacy) and new config object
 *
 * @param config - Configuration string or object
 * @returns Parsed configuration
 */
export function parseOverrideTokenConfig(config) {
    if (typeof config === 'string') {
        // Legacy mode: simple string (INSECURE - for backward compatibility)
        return { secret: config };
    }
    return config;
}
//# sourceMappingURL=override-token.js.map