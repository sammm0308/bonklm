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
export class ConnectorValidationError extends Error {
    /** Error category for grouping and filtering */
    category;
    /** HTTP status code (if applicable) */
    statusCode;
    constructor(message, category = 'validation', statusCode) {
        super(message);
        this.name = 'ConnectorValidationError';
        this.category = category;
        this.statusCode = statusCode;
    }
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
export class StreamValidationError extends Error {
    /** Specific reason for the stream validation failure */
    reason;
    /** Whether the content was blocked (default: true) */
    blocked;
    constructor(message, reason = 'buffer_exceeded', blocked = true) {
        super(message);
        this.name = 'StreamValidationError';
        this.reason = reason;
        this.blocked = blocked;
    }
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
export class ConnectorConfigurationError extends Error {
    /** The configuration field that caused the error */
    field;
    constructor(message, field) {
        super(message);
        this.name = 'ConnectorConfigurationError';
        this.field = field;
    }
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
export class ConnectorTimeoutError extends Error {
    /** The timeout duration in milliseconds */
    timeout;
    constructor(message, timeout) {
        super(message);
        this.name = 'ConnectorTimeoutError';
        this.timeout = timeout;
    }
}
//# sourceMappingURL=errors.js.map