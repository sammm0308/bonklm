/**
 * Connector Utilities - Stream Validator
 * ======================================
 *
 * Standard utilities for stream validation in connectors.
 * Provides shared streaming logic with buffer size protection.
 *
 * @package @blackunicorn/bonklm/core
 */
import { StreamValidationError } from './errors.js';
/**
 * Default maximum buffer size for streaming (1MB).
 */
export const DEFAULT_MAX_BUFFER_SIZE = 1024 * 1024;
/**
 * Default validation interval (number of chunks between validations).
 */
export const DEFAULT_VALIDATION_INTERVAL = 10;
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
export function createStreamValidatorState() {
    return {
        accumulated: '',
        chunkCount: 0,
        blocked: false,
        byteSize: 0,
    };
}
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
export function validateBufferBeforeAccumulation(state, chunk, options = {}) {
    const maxBufferSize = options.maxBufferSize ?? DEFAULT_MAX_BUFFER_SIZE;
    // Calculate byte size of new chunk
    const chunkByteSize = getByteSize(chunk);
    // Check if adding this chunk would exceed the limit
    if (state.byteSize + chunkByteSize > maxBufferSize) {
        const reason = 'Buffer overflow prevented';
        const message = `Stream buffer exceeded maximum size of ${maxBufferSize} bytes`;
        options.logger?.warn('[Stream Validator] Buffer overflow prevented', {
            currentSize: state.byteSize,
            chunkSize: chunkByteSize,
            maxSize: maxBufferSize,
        });
        options.onBlocked?.(state.accumulated, reason);
        throw new StreamValidationError(message, reason, true);
    }
}
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
export function updateStreamValidatorState(state, chunk) {
    state.accumulated += chunk;
    state.byteSize += getByteSize(chunk);
    return ++state.chunkCount;
}
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
export function shouldValidateStream(state, interval = DEFAULT_VALIDATION_INTERVAL) {
    return !state.blocked && state.chunkCount > 0 && state.chunkCount % interval === 0;
}
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
export function markStreamBlocked(state, _reason) {
    // Reason is accepted for API consistency and potential future logging
    state.blocked = true;
    state.accumulated = '';
    state.byteSize = 0;
    state.chunkCount = 0;
}
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
export function resetStreamValidatorState(state) {
    state.accumulated = '';
    state.blocked = false;
    state.byteSize = 0;
    state.chunkCount = 0;
}
/**
 * Gets the byte size of a string.
 * Handles UTF-16 encoding properly.
 *
 * @param str - String to measure
 * @returns Byte size
 *
 * @internal
 */
function getByteSize(str) {
    // JavaScript uses UTF-16, so each character is 2 bytes
    // For accurate byte size in UTF-8, we need to count properly
    let size = str.length;
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i);
        if (code > 0x7F && code <= 0x7FF) {
            size++;
        }
        else if (code > 0x7FF && code <= 0xFFFF) {
            size += 2;
        }
        else if (code >= 0x10000) {
            // Surrogate pair handling
            size += 3;
            i++; // Skip the next character (low surrogate)
        }
    }
    return size;
}
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
export function processStreamChunk(state, chunk, options = {}) {
    validateBufferBeforeAccumulation(state, chunk, options);
    updateStreamValidatorState(state, chunk);
    return state.accumulated;
}
//# sourceMappingURL=stream-validator.js.map