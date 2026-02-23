/**
 * Secure API Key Validation Protocol
 *
 * This module provides secure API key validation with the following security features:
 * - Rate limiting to prevent credential enumeration attacks (HP-8 fix)
 * - Credential caching to reduce API calls
 * - Timeout enforcement to prevent hanging
 * - Secure credential handling with automatic memory cleanup
 * - No credential logging
 *
 * SECURITY: Rate Limiting (HP-8)
 * - Maximum 5 validations per minute
 * - LRU cache with 60-second TTL
 * - Throws WizardError when rate limit exceeded
 *
 * @module validation
 */
/**
 * Configuration for secure API key validation
 *
 * This interface defines the parameters needed to validate an API key
 * without exposing sensitive information in logs.
 */
export interface SecureValidationConfig {
    /**
     * HTTP method to use for validation
     *
     * HEAD and OPTIONS are preferred as they don't return a body
     * GET may be necessary if the API doesn't support HEAD/OPTIONS
     */
    method: 'HEAD' | 'OPTIONS' | 'GET';
    /**
     * Whether to send the API key in the Authorization header
     *
     * If true, sends: `Authorization: Bearer ${apiKey}`
     * If false, the key must be sent in the query string or body
     */
    sendInHeader: boolean;
    /**
     * The endpoint URL to call for validation
     *
     * This should be a lightweight endpoint that validates the key
     * without performing expensive operations
     */
    testEndpoint: string;
    /**
     * Maximum time to wait for a response (milliseconds)
     *
     * After this timeout, the validation will be aborted and a
     * WizardError will be thrown
     */
    timeout: number;
    /**
     * Logging level - always 'none' for security
     *
     * This prevents accidental logging of credentials
     */
    logLevel: 'none';
}
/**
 * Validates an API key securely with rate limiting and timeout enforcement
 *
 * This function implements multiple security measures:
 * 1. Rate limiting via LRU cache (HP-8 fix)
 * 2. Timeout enforcement via AbortController
 * 3. Secure credential handling with automatic memory cleanup
 * 4. No credential logging
 *
 * @param apiKey - The API key to validate
 * @param config - Validation configuration
 * @returns Promise<boolean> - True if the key is valid, false otherwise
 * @throws {WizardError} If rate limited, timed out, or network error occurs
 *
 * @example
 * ```ts
 * const isValid = await validateApiKeySecure('sk-abc123', {
 *   method: 'GET',
 *   sendInHeader: true,
 *   testEndpoint: 'https://api.openai.com/v1/models',
 *   timeout: 5000,
 *   logLevel: 'none'
 * });
 * ```
 */
export declare function validateApiKeySecure(apiKey: string, config: SecureValidationConfig): Promise<boolean>;
/**
 * Clears the validation cache
 *
 * This can be useful for testing or when you want to force
 * re-validation of all keys.
 *
 * @example
 * ```ts
 * clearValidationCache();
 * // All future validations will hit the API
 * ```
 */
export declare function clearValidationCache(): void;
/**
 * Gets the current rate limit status
 *
 * Returns information about how many validations have been performed
 * in the current time window.
 *
 * @returns Rate limit status information
 *
 * @example
 * ```ts
 * const status = getRateLimitStatus();
 * console.log(`Used ${status.used}/${status.max} validations`);
 * ```
 */
export declare function getRateLimitStatus(): {
    used: number;
    max: number;
    resetTime: number;
};
//# sourceMappingURL=validation.d.ts.map