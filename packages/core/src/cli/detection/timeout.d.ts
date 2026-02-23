/**
 * Timeout wrapper for detection operations
 *
 * Provides timeout enforcement for all detection phases to prevent
 * hanging operations and DoS vulnerabilities.
 *
 * @module detection/timeout
 */
/**
 * Detection timeout configuration (in milliseconds)
 *
 * These timeouts prevent any single detection phase from hanging
 * indefinitely, which could block the entire wizard.
 */
export declare const DETECTION_TIMEOUTS: {
    /** 2s for package.json parsing and framework detection */
    readonly framework: 2000;
    /** 5s for port scanning and Docker container detection */
    readonly services: 5000;
    /** 1s for environment variable reading */
    readonly credentials: 1000;
};
/**
 * Detection phase names for error messages
 */
export type DetectionPhase = keyof typeof DETECTION_TIMEOUTS;
/**
 * Wraps an async function with a timeout
 *
 * If the function does not complete within the specified timeout,
 * the timeout promise rejects and the operation is cancelled.
 *
 * Uses AbortController for cooperative cancellation where supported.
 *
 * @param fn - Async function to execute
 * @param timeout - Timeout in milliseconds
 * @param phase - Detection phase name for error messages
 * @returns Result of the function
 * @throws WizardError with code 'DETECTION_TIMEOUT' if timeout expires
 */
export declare function detectWithTimeout<T>(fn: () => Promise<T>, timeout: number, phase: DetectionPhase): Promise<T>;
/**
 * Creates a timeout promise that rejects after specified milliseconds
 *
 * Utility function for Promise.race() patterns.
 * The timeout is automatically cleared when the abort signal is received.
 *
 * @param ms - Milliseconds to wait before rejecting (must be > 0)
 * @param phase - Detection phase name for error messages
 * @param controller - AbortController to cancel the timeout
 * @returns Promise that rejects after timeout
 */
export declare function createTimeoutPromise(ms: number, phase: DetectionPhase, controller: AbortController): Promise<never>;
//# sourceMappingURL=timeout.d.ts.map