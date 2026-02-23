/**
 * Error handling utilities for the BonkLM Installation Wizard
 *
 * This module provides the WizardError class with credential sanitization
 * to prevent sensitive data leakage in error messages and stack traces.
 */
/**
 * Sanitizes an error by redacting potential credentials from the message and stack trace.
 *
 * This prevents sensitive data from leaking through error handling pathways.
 *
 * The sanitization process:
 * 1. Applies each pattern to find potential credentials
 * 2. Checks each match for high entropy
 * 3. Redacts high-entropy matches, keeps low-entropy matches
 *
 * @param error - The error to sanitize
 * @param depth - Internal recursion guard (do not use)
 * @returns A new error with sanitized message and stack trace
 */
export declare function sanitizeError(error: Error, depth?: number): Error;
/**
 * Exit codes for CLI operations
 *
 * Following standard CLI conventions:
 * - 0: Success
 * - 1: Error
 * - 2: Partial success (some operations succeeded, some failed)
 */
export declare const ExitCode: {
    readonly SUCCESS: 0;
    readonly ERROR: 1;
    readonly PARTIAL: 2;
};
/**
 * Exit code type for type safety
 */
export type ExitCodeType = keyof typeof ExitCode;
/**
 * Custom error class for the BonkLM Installation Wizard
 *
 * Provides structured error information with:
 * - Error code for programmatic handling
 * - User-friendly message
 * - Actionable suggestion
 * - Sanitized cause error
 * - Appropriate exit code
 *
 * @example
 * ```ts
 * throw new WizardError(
 *   'CREDENTIAL_TOO_LARGE',
 *   'Credential size exceeds maximum',
 *   'Use a shorter API key',
 *   originalError,
 *   'ERROR'
 * );
 * ```
 */
export declare class WizardError extends Error {
    readonly code: string;
    readonly suggestion?: string | undefined;
    readonly cause?: Error | undefined;
    readonly exitCode?: 0 | 1 | 2 | undefined;
    /**
     * Creates a new WizardError
     *
     * @param code - Machine-readable error code (e.g., 'ENV_READ_FAILED')
     * @param message - Human-readable error message
     * @param suggestion - Optional actionable suggestion for the user
     * @param cause - Optional original error (will be sanitized)
     * @param exitCode - Optional CLI exit code (defaults to ERROR)
     */
    constructor(code: string, message: string, suggestion?: string | undefined, cause?: Error | undefined, exitCode?: 0 | 1 | 2 | undefined);
    /**
     * Formats the error for display to the user
     *
     * Includes the error code, message, and suggestion if available.
     * Does not include the stack trace for cleaner user experience.
     *
     * @returns Formatted error string
     */
    toString(): string;
}
//# sourceMappingURL=error.d.ts.map