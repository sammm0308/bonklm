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
// Error classes
export { ConnectorValidationError, StreamValidationError, ConnectorConfigurationError, ConnectorTimeoutError, } from './errors.js';
// Content extraction
export { extractContentFromResponse, extractContentFirstSuccess, extractContentJoined, } from './content-extractor.js';
// Stream validation
export { validateBufferBeforeAccumulation, updateStreamValidatorState, shouldValidateStream, markStreamBlocked, resetStreamValidatorState, processStreamChunk, createStreamValidatorState, DEFAULT_MAX_BUFFER_SIZE, DEFAULT_VALIDATION_INTERVAL, } from './stream-validator.js';
// Logger utilities
export { createStandardLogger, createConnectorLogger, sanitizeLogMetadata, logValidationFailure, logTimeout, } from './logger.js';
//# sourceMappingURL=index.js.map