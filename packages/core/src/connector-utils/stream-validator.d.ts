/**
 * Connector Utilities - Stream Validator
 * ======================================
 *
 * Standard utilities for stream validation in connectors.
 * Provides shared streaming logic with buffer size protection.
 *
 * @package @blackunicorn/bonklm/core
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Default maximum buffer size for streaming (1MB).
 */
export declare const DEFAULT_MAX_BUFFER_SIZE: number;
/**
 * Default validation interval (number of chunks between validations).
 */
export declare const DEFAULT_VALIDATION_INTERVAL = 10;
/**
 * Stream validation options.
 */
export interface StreamValidationOptions {
    /** Maximum buffer size in bytes (default: 1MB) */
    maxBufferSize?: number;
    /** Number of chunks between validations (default: 10) */
    validationInterval?: number;
    /** Logger for validation events */
    logger?: Logger;
    /** Callback when stream is blocked */
    onBlocked?: (accumulated: string, reason: string) => void;
}
/**
 * Stream validator state for tracking accumulated content.
 */
export interface StreamValidatorState {
    /** Accumulated text content */
    accumulated: string;
    /** Chunk count since last validation */
    chunkCount: number;
    /** Whether stream has been blocked */
    blocked: boolean;
    /** Current byte size of accumulated content */
    byteSize: number;
}
/**
 * Creates a new stream validator state.
 *
 * @returns Initial validator state
 *
 * @example
 * ```ts
 * const state = createStreamValidatorState();
 * // Use in streaming loop
 * ```
 */
export declare function createStreamValidatorState(): StreamValidatorState;
/**
 * Validates buffer size before accumulating a new chunk.
 * Throws StreamValidationError if the buffer would exceed the maximum size.
 *
 * This check MUST happen BEFORE adding the chunk to the accumulator.
 *
 * @param state - Current validator state
 * @param chunk - New chunk to be added
 * @param options - Validation options
 * @throws {StreamValidationError} If buffer size would be exceeded
 *
 * @example
 * ```ts
 * // BEFORE accumulating the chunk
 * validateBufferBeforeAccumulation(state, chunk, { maxBufferSize: 1024 * 1024 });
 * state.accumulated += chunk;
 * ```
 */
export declare function validateBufferBeforeAccumulation(state: StreamValidatorState, chunk: string, options?: StreamValidationOptions): void;
/**
 * Updates validator state with a new chunk.
 * Call this AFTER validateBufferBeforeAccumulation.
 *
 * @param state - Current validator state
 * @param chunk - New chunk to add
 * @returns Updated chunk count
 *
 * @example
 * ```ts
 * validateBufferBeforeAccumulation(state, chunk);
 * const count = updateStreamValidatorState(state, chunk);
 * if (count % validationInterval === 0) {
 *   // Run validation
 * }
 * ```
 */
export declare function updateStreamValidatorState(state: StreamValidatorState, chunk: string): number;
/**
 * Checks if validation should run based on chunk count.
 *
 * @param state - Current validator state
 * @param interval - Validation interval
 * @returns True if validation should run
 *
 * @example
 * ```ts
 * if (shouldValidateStream(state, 10)) {
 *   const result = await engine.validate(state.accumulated);
 *   if (!result.allowed) {
 *     // Handle blocked content
 *   }
 * }
 * ```
 */
export declare function shouldValidateStream(state: StreamValidatorState, interval?: number): boolean;
/**
 * Marks the stream as blocked.
 * Use this when validation fails.
 *
 * @param state - Current validator state
 * @param reason - Reason for blocking
 *
 * @example
 * ```ts
 * if (!validationResult.allowed) {
 *   markStreamBlocked(state, validationResult.reason);
 *   throw new Error('Content blocked');
 * }
 * ```
 */
export declare function markStreamBlocked(state: StreamValidatorState, _reason: string): void;
/**
 * Resets validator state for a new stream.
 *
 * @param state - Current validator state
 *
 * @example
 * ```ts
 * resetStreamValidatorState(state);
 * ```
 */
export declare function resetStreamValidatorState(state: StreamValidatorState): void;
/**
 * Validates and processes a stream chunk with all safety checks.
 * This is a convenience function that combines all stream validation steps.
 *
 * @param state - Current validator state
 * @param chunk - New chunk to process
 * @param options - Validation options
 * @returns The accumulated content so far
 * @throws {StreamValidationError} If buffer size exceeded
 *
 * @example
 * ```ts
 * for await (const chunk of stream) {
 *   const accumulated = processStreamChunk(state, chunk, { maxBufferSize: 1024 * 1024 });
 *   if (shouldValidateStream(state, 10)) {
 *     // Run validation
 *   }
 * }
 * ```
 */
export declare function processStreamChunk(state: StreamValidatorState, chunk: string, options?: StreamValidationOptions): string;
//# sourceMappingURL=stream-validator.d.ts.map