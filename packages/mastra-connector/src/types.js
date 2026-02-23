/**
 * Mastra Framework Connector Types
 *
 * This file contains all TypeScript type definitions for the Mastra framework connector.
 * Includes security-related options for agent hook integration, streaming validation,
 * and complex message content handling.
 *
 * Security Features:
 * - SEC-002: Incremental stream validation with early termination
 * - SEC-003: Max buffer size enforcement
 * - SEC-005: Tool call injection protection
 * - SEC-006: Complex message content handling
 * - SEC-007: Production mode error messages
 * - SEC-008: Validation timeout
 * - SEC-010: Request size limits
 * - DEV-001: Correct GuardrailEngine API
 * - DEV-002: Logger type
 */
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
 * Validation interval for incremental stream validation.
 *
 * @internal
 */
export const VALIDATION_INTERVAL = 10;
/**
 * Default max buffer size (1MB).
 *
 * @internal
 */
export const DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024;
/**
 * Default max content length (100KB).
 *
 * @internal
 */
export const DEFAULT_MAX_CONTENT_LENGTH = 100_000;
/**
 * Default validation timeout (30 seconds).
 *
 * @internal
 */
export const DEFAULT_VALIDATION_TIMEOUT = 30000;
//# sourceMappingURL=types.js.map