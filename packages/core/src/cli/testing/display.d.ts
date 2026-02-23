/**
 * Test Result Display
 *
 * This module provides functionality to display test results in various formats:
 * - Terminal-friendly table format with color-coded indicators
 * - JSON output for programmatic consumption
 * - Summary statistics for multiple test results
 *
 * The display functions adapt to terminal capabilities, showing colors when
 * available and falling back to plain text for non-TTY environments.
 *
 * @module testing/display
 */
import type { TestResult } from '../connectors/base.js';
/**
 * Test result with associated connector ID for display
 */
export interface TestDisplay {
    /** The connector identifier */
    connectorId: string;
    /** The connector name (optional, for better display) */
    connectorName?: string;
    /** The test result */
    result: TestResult;
}
/**
 * Summary statistics for multiple test results
 */
export interface TestSummary {
    /** Total number of tests */
    total: number;
    /** Number of successful tests */
    successful: number;
    /** Number of failed tests */
    failed: number;
    /** Number of connection failures */
    connectionFailures: number;
    /** Number of validation failures */
    validationFailures: number;
    /** Average latency in milliseconds */
    averageLatency: number;
    /** Success rate as percentage */
    successRate: number;
}
/**
 * Displays test results in terminal or JSON format
 *
 * @param tests - Array of test results to display
 * @param jsonMode - If true, output JSON instead of formatted text
 *
 * @example
 * ```ts
 * displayTestResults([
 *   { connectorId: 'openai', result: { connection: true, validation: true, latency: 123 } },
 *   { connectorId: 'anthropic', result: { connection: false, validation: false, error: 'Auth failed' } },
 * ]);
 * ```
 */
export declare function displayTestResults(tests: TestDisplay[], jsonMode?: boolean): void;
/**
 * Displays a single test result with detailed information
 *
 * @param connectorId - The connector identifier
 * @param connectorName - Optional connector name
 * @param result - The test result
 * @param supportsColor - Whether to use ANSI colors (default: auto-detect)
 *
 * @example
 * ```ts
 * displaySingleTestResult('openai', 'OpenAI', {
 *   connection: true,
 *   validation: true,
 *   latency: 123
 * });
 * ```
 */
export declare function displaySingleTestResult(connectorId: string, connectorName: string | undefined, result: TestResult, supportsColor?: boolean): void;
/**
 * Formats a test summary with statistics
 *
 * @param tests - Array of test results to summarize
 * @returns A TestSummary object with calculated statistics
 *
 * @example
 * ```ts
 * const summary = formatTestSummary(tests);
 * console.log(`Success rate: ${summary.successRate}%`);
 * ```
 */
export declare function formatTestSummary(tests: TestDisplay[]): TestSummary;
/**
 * Displays a test summary in terminal format
 *
 * @param summary - The test summary to display
 *
 * @example
 * ```ts
 * const summary = formatTestSummary(tests);
 * displayTestSummary(summary);
 * // Output:
 * // Test Summary
 * // ✓ 3 successful
 * // ✗ 1 failed
 * // Success rate: 75%
 * ```
 */
export declare function displayTestSummary(summary: TestSummary): void;
/**
 * Exports test results as JSON
 *
 * @param tests - Array of test results to export
 * @param pretty - Whether to pretty-print the JSON (default: true)
 *
 * @example
 * ```ts
 * exportTestResultsJson(tests);
 * // Output: [{"connectorId":"openai","result":{"connection":true,...}},...]
 * ```
 */
export declare function exportTestResultsJson(tests: TestDisplay[], pretty?: boolean): void;
/**
 * Exports test summary as JSON
 *
 * @param summary - The test summary to export
 * @param pretty - Whether to pretty-print the JSON (default: true)
 *
 * @example
 * ```ts
 * const summary = formatTestSummary(tests);
 * exportTestSummaryJson(summary);
 * // Output: {"total":5,"successful":4,...}
 * ```
 */
export declare function exportTestSummaryJson(summary: TestSummary, pretty?: boolean): void;
/**
 * Creates a progress bar for test execution
 *
 * @param current - Current test number
 * @param total - Total number of tests
 * @param width - Width of the progress bar (default: 30)
 * @returns A string representation of the progress bar
 *
 * @example
 * ```ts
 * console.log(createProgressBar(2, 5)); // [======.......] 40%
 * ```
 */
export declare function createProgressBar(current: number, total: number, width?: number): string;
/**
 * Formats a detailed test result for logging
 *
 * This function creates a detailed string representation suitable for
 * logging to files or external systems.
 *
 * @param test - The test display object to format
 * @returns A detailed string representation
 *
 * @example
 * ```ts
 * const detail = formatTestDetail({
 *   connectorId: 'openai',
 *   result: { connection: true, validation: true, latency: 123 }
 * });
 * console.log(detail);
 * // Output: [openai] Connection: ✓, Validation: ✓, Latency: 123ms
 * ```
 */
export declare function formatTestDetail(test: TestDisplay): string;
/**
 * Returns all test results that failed
 *
 * @param tests - Array of test results to filter
 * @returns Array of failed test results
 *
 * @example
 * ```ts
 * const failed = getFailedTests(tests);
 * console.log(`Failed tests: ${failed.map(t => t.connectorId).join(', ')}`);
 * ```
 */
export declare function getFailedTests(tests: TestDisplay[]): TestDisplay[];
/**
 * Returns all test results that succeeded
 *
 * @param tests - Array of test results to filter
 * @returns Array of successful test results
 *
 * @example
 * ```ts
 * const successful = getSuccessfulTests(tests);
 * console.log(`Successful tests: ${successful.length}`);
 * ```
 */
export declare function getSuccessfulTests(tests: TestDisplay[]): TestDisplay[];
//# sourceMappingURL=display.d.ts.map