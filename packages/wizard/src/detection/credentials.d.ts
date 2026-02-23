/**
 * Credential Detection Module
 *
 * Scans the environment for known API keys and credentials.
 * Uses SecureCredential for memory safety and enforces whitelist validation
 * to prevent environment variable injection attacks.
 *
 * SECURITY: Environment Variable Injection Prevention (HP-4)
 * - All environment variable names are validated against a whitelist
 * - Only known credential patterns are checked
 * - Non-string values are rejected
 * - SecureCredential ensures memory is zeroed after use
 */
/**
 * Detected credential information
 *
 * The maskedValue is safe for logging/display as it only shows
 * the first 2 and last 4 characters with random padding.
 */
export interface DetectedCredential {
    /** Human-readable name of the credential provider */
    name: string;
    /** The actual environment variable name */
    key: string;
    /** Masked value for display (safe to log) */
    maskedValue: string;
    /** Whether the credential is currently set in the environment */
    present: boolean;
}
/**
 * Known credential patterns for detection
 *
 * Each entry maps a provider name to its environment variable name.
 * Only these specific patterns are checked - no arbitrary env vars.
 */
declare const CREDENTIAL_PATTERNS: {
    readonly openai: "OPENAI_API_KEY";
    readonly anthropic: "ANTHROPIC_API_KEY";
    readonly ollama: "OLLAMA_HOST";
};
/**
 * Type-safe list of all credential names we detect
 */
export type CredentialName = keyof typeof CREDENTIAL_PATTERNS;
/**
 * Scans the environment for known API credentials
 *
 * This function:
 * 1. Only checks whitelisted environment variable names
 * 2. Validates value types before processing
 * 3. Uses SecureCredential for memory safety
 * 4. Returns masked values safe for logging
 * 5. Properly disposes credentials after masking
 *
 * SECURITY: The maskedValue is safe to log - it only shows
 * first 2 + last 4 characters with random padding between.
 *
 * @returns Array of detected credentials (both present and absent)
 *
 * @example
 * ```ts
 * const credentials = detectCredentials();
 * // [
 * //   { name: 'openai', key: 'OPENAI_API_KEY', maskedValue: 'sk****1234', present: true },
 * //   { name: 'anthropic', key: 'ANTHROPIC_API_KEY', maskedValue: 'not set', present: false },
 * // ]
 * ```
 */
export declare function detectCredentials(): DetectedCredential[];
/**
 * Checks if a specific credential is present in the environment
 *
 * Convenience function for checking a single credential type.
 *
 * @param name - The credential name to check (e.g., 'openai', 'anthropic')
 * @returns True if the credential is present and valid
 *
 * @example
 * ```ts
 * if (isCredentialPresent('openai')) {
 *   // OPENAI_API_KEY is set
 * }
 * ```
 */
export declare function isCredentialPresent(name: CredentialName): boolean;
/**
 * Gets the masked value of a specific credential
 *
 * Returns the masked value for display purposes. The actual
 * credential value is never returned in plain text.
 *
 * @param name - The credential name to get
 * @returns The masked credential value, or 'not set' if absent
 *
 * @example
 * ```ts
 * const masked = getCredentialMasked('openai');
 * console.log(`OpenAI key: ${masked}`); // "OpenAI key: sk****1234"
 * ```
 */
export declare function getCredentialMasked(name: CredentialName): string;
/**
 * Gets all present credentials (filters out absent ones)
 *
 * Convenience function that returns only credentials that
 * are actually set in the environment.
 *
 * @returns Array of credentials that are present
 */
export declare function getPresentCredentials(): DetectedCredential[];
/**
 * Gets all credential patterns we support detecting
 *
 * Useful for UI display or configuration validation.
 *
 * @returns Array of supported credential names
 */
export declare function getSupportedCredentialNames(): CredentialName[];
export {};
//# sourceMappingURL=credentials.d.ts.map