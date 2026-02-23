"use strict";
/**
 * Vercel AI SDK Connector Types
 *
 * This file contains all TypeScript type definitions for the Vercel AI SDK connector.
 * Includes security-related options for incremental stream validation, buffer limits,
 * and complex message content handling.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_VALIDATION_TIMEOUT = exports.DEFAULT_MAX_BUFFER_SIZE = exports.VALIDATION_INTERVAL = void 0;
/**
 * Validation interval for incremental stream validation.
 *
 * @internal
 */
exports.VALIDATION_INTERVAL = 10;
/**
 * Default max buffer size (1MB).
 *
 * @internal
 */
exports.DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024;
/**
 * Default validation timeout (30 seconds).
 *
 * @internal
 */
exports.DEFAULT_VALIDATION_TIMEOUT = 30000;
//# sourceMappingURL=types.js.map