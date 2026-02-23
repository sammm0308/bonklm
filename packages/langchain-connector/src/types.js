/**
 * LangChain Connector Types
 *
 * This file contains all TypeScript type definitions for the LangChain connector.
 * Includes security-related options for incremental stream validation, buffer limits,
 * and complex message content handling.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement
 * - SEC-006: Complex message content handling
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout
 * - DEV-001: Correct GuardrailEngine API
 * - DEV-002: Logger type
 */
/**
 * Error thrown when guardrails validation blocks content.
 *
 * @remarks
 * This error class is provided for type-checking and catching guardrails violations.
 *
 * To catch guardrails violations:
 * ```ts
 * try {
 *   await chain.invoke(input);
 * } catch (error) {
 *   if (error instanceof GuardrailsViolationError) {
 *     // Handle blocked content
 *   }
 * }
 * ```
 */
export class GuardrailsViolationError extends Error {
    reason;
    findings;
    riskScore;
    constructor(message, reason, findings = [], riskScore = 0) {
        super(message);
        this.reason = reason;
        this.findings = findings;
        this.riskScore = riskScore;
        this.name = 'GuardrailsViolationError';
    }
}
/**
 * Error thrown when stream validation fails.
 *
 * @remarks
 * This error class is provided for type-checking and catching stream validation errors.
 */
export class StreamValidationError extends Error {
    reason;
    blocked;
    constructor(message, reason, blocked = true) {
        super(message);
        this.reason = reason;
        this.blocked = blocked;
        this.name = 'StreamValidationError';
    }
}
/**
 * Default validation interval for incremental stream validation.
 *
 * @internal
 */
export const DEFAULT_VALIDATION_INTERVAL = 10;
/**
 * Default max buffer size (1MB).
 *
 * @internal
 */
export const DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024;
/**
 * Default validation timeout (30 seconds).
 *
 * @internal
 */
export const DEFAULT_VALIDATION_TIMEOUT = 30000;
//# sourceMappingURL=types.js.map