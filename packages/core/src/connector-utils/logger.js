/**
 * Connector Utilities - Standard Logger
 * =====================================
 *
 * Standard logger creation for consistent logging across connectors.
 *
 * @package @blackunicorn/bonklm/core
 */
import { createLogger } from '../base/GenericLogger.js';
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
export function createStandardLogger(options = {}) {
    const { logger, prefix } = options;
    if (logger) {
        // If prefix provided, wrap the logger to add prefix
        if (prefix) {
            return createPrefixedLogger(logger, prefix);
        }
        return logger;
    }
    // Default to console logger
    return createLogger('console');
}
/**
 * Wraps a logger to add a prefix to all messages.
 *
 * @param baseLogger - Base logger to wrap
 * @param prefix - Prefix to add to messages
 * @returns Wrapped logger
 *
 * @internal
 */
function createPrefixedLogger(baseLogger, prefix) {
    return {
        debug: (message, meta) => {
            baseLogger.debug(`${prefix} ${message}`, meta);
        },
        info: (message, meta) => {
            baseLogger.info(`${prefix} ${message}`, meta);
        },
        warn: (message, meta) => {
            baseLogger.warn(`${prefix} ${message}`, meta);
        },
        error: (message, error) => {
            // Convert Error to LogContext format
            const context = error instanceof Error
                ? { error: error.message, name: error.name }
                : error;
            baseLogger.error(`${prefix} ${message}`, context);
        },
    };
}
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
export function createConnectorLogger(connectorName, options = {}) {
    return createStandardLogger({
        ...options,
        prefix: `[${connectorName} Guardrails]`,
    });
}
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
export function sanitizeLogMetadata(meta) {
    const sanitized = { ...meta };
    const sensitiveKeys = [
        'apiKey',
        'api_key',
        'apikey',
        'token',
        'authorization',
        'password',
        'secret',
        'credential',
        'accessToken',
        'access_token',
        'refreshToken',
        'refresh_token',
        'privateKey',
        'private_key',
    ];
    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some((sk) => lowerKey.includes(sk.toLowerCase()))) {
            const value = sanitized[key];
            if (typeof value === 'string' && value.length > 0) {
                // Show first 4 and last 4 chars
                if (value.length <= 8) {
                    sanitized[key] = '[REDACTED]';
                }
                else {
                    sanitized[key] = `${value.slice(0, 4)}****${value.slice(-4)}`;
                }
            }
            else {
                sanitized[key] = '[REDACTED]';
            }
        }
    }
    return sanitized;
}
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
export function logValidationFailure(logger, reason, context) {
    logger.warn('Validation blocked', {
        reason,
        ...sanitizeLogMetadata(context ?? {}),
    });
}
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
export function logTimeout(logger, operation, timeoutMs) {
    logger.warn(`Timeout: ${operation}`, {
        timeout: `${timeoutMs}ms`,
    });
}
//# sourceMappingURL=logger.js.map