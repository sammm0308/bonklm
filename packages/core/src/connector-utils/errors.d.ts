/**
 * Connector Utilities - Error Classes
 * ===================================
 *
 * Standard error classes for use across all connector packages.
 * These provide consistent error handling and reporting.
 *
 * @package @blackunicorn/bonklm/core
 */
/**
 * Base connector validation error.
 * Thrown when validation fails for connector-specific reasons.
 *
 * @example
 * ```ts
 * throw new ConnectorValidationError('Invalid API key format', 'authentication');
 * ```
 */
export declare class ConnectorValidationError extends Error {
    /** Error category for grouping and filtering */
    readonly category: string;
    /** HTTP status code (if applicable) */
    readonly statusCode?: number;
    constructor(message: string, category?: string, statusCode?: number);
}
/**
 * Stream validation error for buffer overflow protection.
 * Thrown when streaming content exceeds configured limits.
 *
 * This is a separate error from the one in GuardrailEngine to avoid
 * circular dependencies while providing the same functionality.
 *
 * @example
 * ```ts
 * if (bufferSize > maxSize) {
 *   throw new StreamValidationError(
 *     `Buffer exceeded ${maxSize} bytes`,
 *     'buffer_overflow'
 *   );
 * }
 * ```
 */
export declare class StreamValidationError extends Error {
    /** Specific reason for the stream validation failure */
    readonly reason: string;
    /** Whether the content was blocked (default: true) */
    readonly blocked: boolean;
    constructor(message: string, reason?: string, blocked?: boolean);
}
/**
 * Configuration error for invalid connector setup.
 * Thrown when connector options are invalid or missing.
 *
 * @example
 * ```ts
 * if (!options.apiKey) {
 *   throw new ConnectorConfigurationError('API key is required', 'apiKey');
 * }
 * ```
 */
export declare class ConnectorConfigurationError extends Error {
    /** The configuration field that caused the error */
    readonly field?: string;
    constructor(message: string, field?: string);
}
/**
 * Timeout error for connector operations.
 * Thrown when a connector operation exceeds its time limit.
 *
 * @example
 * ```ts
 * throw new ConnectorTimeoutError(
 *   'Validation timed out after 30s',
 *   30000
 * );
 * ```
 */
export declare class ConnectorTimeoutError extends Error {
    /** The timeout duration in milliseconds */
    readonly timeout: number;
    constructor(message: string, timeout: number);
}
//# sourceMappingURL=errors.d.ts.map