/**
 * Mask Utility - Secure credential masking
 *
 * This module provides functions for masking sensitive values like API keys
 * while preventing timing attacks through randomization.
 */
/**
 * Masks a sensitive value (like an API key) for logging/display purposes.
 *
 * Shows only the first 2 and last 4 characters for values longer than 8 chars.
 * Uses random padding to prevent timing attacks based on output length.
 *
 * @param value - The sensitive value to mask (e.g., API key, token)
 * @returns The masked string with random padding
 *
 * @example
 * ```ts
 * maskKey('sk-1234567890abcdef') // 'sk***************1234'
 * maskKey('short')                // '***'
 * maskKey('')                     // '***'
 * ```
 */
export declare function maskKey(value: string): string;
/**
 * Masks a value while preserving a specific visible prefix length.
 *
 * @param value - The value to mask
 * @param visibleChars - Number of characters to show at the start
 * @param suffixChars - Number of characters to show at the end
 * @returns The masked string
 */
export declare function maskKeyWithCustomLength(value: string, visibleChars: number, suffixChars: number): string;
/**
 * Masks all but the last N characters of a value.
 *
 * Useful for showing just enough to identify the type of credential.
 *
 * @param value - The value to mask
 * @param visibleChars - Number of characters to show at the end
 * @returns The masked string
 */
export declare function maskAllButLast(value: string, visibleChars?: number): string;
/**
 * Checks if a value appears to be already masked.
 *
 * @param value - The value to check
 * @returns True if the value appears to be masked
 */
export declare function isMasked(value: string): boolean;
//# sourceMappingURL=mask.d.ts.map