/**
 * Guardrail Validation Test
 *
 * This module provides functionality to test BonkLM core package
 * integration by running a sample guardrail check after a connector test.
 *
 * The guardrail test validates that:
 * 1. The core package is available and can be imported
 * 2. The PromptInjectionValidator can be instantiated
 * 3. A sample guardrail check can be executed
 * 4. The validation returns expected results
 *
 * If the core package is not available, the test gracefully skips and returns
 * a neutral result rather than failing.
 *
 * @module testing/guardrail-test
 */
/**
 * Result of a guardrail validation test
 */
export interface GuardrailTestResult {
    /** Whether the guardrail test was executed */
    executed: boolean;
    /** Whether the guardrail correctly detected the test prompt */
    detected: boolean;
    /** Error message if the test failed (not if package is missing) */
    error?: string;
    /** Latency of the guardrail test in milliseconds */
    latency?: number;
}
/**
 * Checks if BonkLM core package is available
 *
 * This function attempts to dynamically import the core package to verify
 * it's installed and available without causing a hard failure if not.
 *
 * @returns Promise resolving to true if the package is available
 */
export declare function isCorePackageAvailable(): Promise<boolean>;
/**
 * Runs a guardrail validation test
 *
 * This function attempts to:
 * 1. Import the core package
 * 2. Create a GuardrailEngine with a PromptInjectionValidator
 * 3. Validate a known malicious prompt
 * 4. Return whether the prompt was correctly flagged
 *
 * If the core package is not available, this function returns a result
 * with executed: false rather than throwing an error.
 *
 * @returns Promise resolving to the guardrail test result
 *
 * @example
 * ```ts
 * const result = await runGuardrailTest();
 * if (result.executed) {
 *   console.log(`Guardrail test: ${result.detected ? 'PASS' : 'FAIL'}`);
 * } else {
 *   console.log('Core package not available, guardrail test skipped');
 * }
 * ```
 */
export declare function runGuardrailTest(): Promise<GuardrailTestResult>;
/**
 * Runs a guardrail test with a specific connector
 *
 * This function extends the basic guardrail test by including a connector
 * in the GuardrailEngine configuration. This tests both the core package
 * and the connector integration.
 *
 * @param connectorConfig - The connector configuration to test with
 * @returns Promise resolving to the guardrail test result
 *
 * @example
 * ```ts
 * const result = await runGuardrailTestWithConnector({
 *   type: 'openai',
 *   apiKey: 'sk-...'
 * });
 * ```
 */
export declare function runGuardrailTestWithConnector(connectorConfig: Record<string, unknown>): Promise<GuardrailTestResult>;
/**
 * Formats a guardrail test result for display
 *
 * @param result - The guardrail test result to format
 * @returns A human-readable string representation
 */
export declare function formatGuardrailResult(result: GuardrailTestResult): string;
/**
 * Checks if a guardrail test result indicates success
 *
 * @param result - The guardrail test result to check
 * @returns True if the test was executed and passed
 */
export declare function isGuardrailTestSuccessful(result: GuardrailTestResult): boolean;
//# sourceMappingURL=guardrail-test.d.ts.map