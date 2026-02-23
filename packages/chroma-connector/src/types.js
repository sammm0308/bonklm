"use strict";
/**
 * ChromaDB Guarded Wrapper Types
 * =================================
 *
 * Type definitions for the ChromaDB guardrails connector.
 *
 * @package @blackunicorn/bonklm-chroma
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_MAX_N_RESULTS = exports.DEFAULT_VALIDATION_TIMEOUT = void 0;
/**
 * Default validation timeout in milliseconds.
 *
 * @defaultValue 30000 (30 seconds)
 *
 * @remarks
 * This prevents validation from hanging indefinitely. Adjust based on your
 * validator performance requirements.
 */
exports.DEFAULT_VALIDATION_TIMEOUT = 30000;
/**
 * Default maximum number of results to retrieve.
 *
 * @defaultValue 20
 *
 * @remarks
 * Prevents excessive data retrieval that could be used for data exfiltration.
 */
exports.DEFAULT_MAX_N_RESULTS = 20;
//# sourceMappingURL=types.js.map