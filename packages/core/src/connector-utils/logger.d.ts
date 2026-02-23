/**
 * Connector Utilities - Standard Logger
 * =====================================
 *
 * Standard logger creation for consistent logging across connectors.
 *
 * @package @blackunicorn/bonklm/core
 */
import { type Logger } from '../base/GenericLogger.js';
/**
 * Standard logger options for connectors.
 */
export interface StandardLoggerOptions {
    /** Logger instance (if not provided, creates a console logger) */
    logger?: Logger;
    /** Log level for the connector */
    logLevel?: 'debug' | 'info' | 'warn' | 'error' | 'silent';
    /** Prefix for log messages */
    prefix?: string;
}
/**
 * Creates a standard logger for connector use.
 * Ensures consistent logging patterns across all connectors.
 *
 * @param options - Logger options
 * @returns Logger instance
 *
 * @example
 * ```ts
 * const logger = createStandardLogger({ prefix: '[Pinecone Guardrails]' });
 * logger.info('Query executed', { topK: 10 });
 * ```
 */
export declare function createStandardLogger(options?: StandardLoggerOptions): Logger;
/**
 * Creates a logger specific to a connector type.
 *
 * @param connectorName - Name of the connector (e.g., 'pinecone', 'openai')
 * @param options - Logger options
 * @returns Logger instance
 *
 * @example
 * ```ts
 * const logger = createConnectorLogger('pinecone');
 * const logger = createConnectorLogger('openai', { logLevel: 'warn' });
 * ```
 */
export declare function createConnectorLogger(connectorName: string, options?: Omit<StandardLoggerOptions, 'prefix'>): Logger;
/**
 * Sanitizes sensitive data from log metadata.
 * Removes or masks API keys, tokens, and other sensitive information.
 *
 * @param meta - Metadata object to sanitize
 * @returns Sanitized metadata
 *
 * @example
 * ```ts
 * logger.info('Request sent', sanitizeLogMetadata({
 *   apiKey: 'sk-1234',
 *   model: 'gpt-4'
 * }));
 * // Logs: { apiKey: '[REDACTED]', model: 'gpt-4' }
 * ```
 */
export declare function sanitizeLogMetadata(meta: Record<string, unknown>): Record<string, unknown>;
/**
 * Logs a validation failure with consistent formatting.
 *
 * @param logger - Logger instance
 * @param reason - Reason for validation failure
 * @param context - Additional context about the failure
 *
 * @example
 * ```ts
 * logValidationFailure(logger, result.reason, {
 *   contentType: 'query',
 *   contentLength: query.length
 * });
 * ```
 */
export declare function logValidationFailure(logger: Logger, reason: string, context?: Record<string, unknown>): void;
/**
 * Logs a timeout with consistent formatting.
 *
 * @param logger - Logger instance
 * @param operation - Operation that timed out
 * @param timeoutMs - Timeout duration in milliseconds
 *
 * @example
 * ```ts
 * logTimeout(logger, 'query validation', 30000);
 * ```
 */
export declare function logTimeout(logger: Logger, operation: string, timeoutMs: number): void;
//# sourceMappingURL=logger.d.ts.map