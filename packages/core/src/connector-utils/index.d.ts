/**
 * Connector Utilities
 * ===================
 *
 * Standard utilities for use across all connector packages.
 * Provides consistent error handling, content extraction, stream validation,
 * and logging patterns.
 *
 * @package @blackunicorn/bonklm/core
 *
 * @example
 * ```ts
 * import {
 *   ConnectorValidationError,
 *   StreamValidationError,
 *   extractContentFromResponse,
 *   validateBufferBeforeAccumulation,
 *   createStandardLogger,
 * } from '@blackunicorn/bonklm/core/connector-utils';
 * ```
 */
export { ConnectorValidationError, StreamValidationError, ConnectorConfigurationError, ConnectorTimeoutError, } from './errors.js';
export { extractContentFromResponse, extractContentFirstSuccess, extractContentJoined, type ContentExtractorOptions, } from './content-extractor.js';
export { validateBufferBeforeAccumulation, updateStreamValidatorState, shouldValidateStream, markStreamBlocked, resetStreamValidatorState, processStreamChunk, createStreamValidatorState, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_VALIDATION_INTERVAL, type StreamValidationOptions, type StreamValidatorState, } from './stream-validator.js';
export { createStandardLogger, createConnectorLogger, sanitizeLogMetadata, logValidationFailure, logTimeout, type StandardLoggerOptions, } from './logger.js';
//# sourceMappingURL=index.d.ts.map