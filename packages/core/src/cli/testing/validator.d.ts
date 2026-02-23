/**
 * Connection Test Framework
 *
 * This module provides the two-tier testing framework for validating connectors:
 * 1. Connection test: Basic connectivity (port open, auth valid)
 * 2. Validation test: Full functionality (can send queries, returns valid responses)
 *
 * Features:
 * - Timeout enforcement with AbortController
 * - Secure credential handling with SecureCredential
 * - Graceful error handling with WizardError
 * - Latency measurement
 * - Comprehensive test results
 *
 * @module testing/validator
 */
import type { ConnectorDefinition, TestResult } from '../connectors/base.js';
/**
 * Validates a timeout value to ensure it's within acceptable bounds
 *
 * @param timeout - The timeout value in milliseconds
 * @returns A valid timeout value
 * @throws {WizardError} If timeout is negative or exceeds maximum
 */
export declare function validateTimeout(timeout: number): number;
/**
 * Tests a connector with the provided configuration
 *
 * This function measures latency and handles errors gracefully,
 * returning a TestResult object with connection status, validation status,
 * error message (if any), and latency in milliseconds.
 *
 * @param connector - The connector definition to test
 * @param config - Configuration values for the connector
 * @param signal - Optional AbortSignal for cancelling the test
 * @returns Promise resolving to test results with latency
 *
 * @example
 * ```ts
 * const result = await testConnector(openaiConnector, {
 *   apiKey: 'sk-...'
 * });
 * console.log(result.connection, result.validation, result.latency);
 * ```
 */
export declare function testConnector(connector: ConnectorDefinition, config: Record<string, string>, signal?: AbortSignal): Promise<TestResult>;
/**
 * Tests a connector with timeout enforcement
 *
 * This function wraps testConnector with an AbortController-based timeout.
 * If the test exceeds the specified timeout, it will be aborted and a
 * WizardError will be thrown with the TEST_TIMEOUT code.
 *
 * @param connector - The connector definition to test
 * @param config - Configuration values for the connector
 * @param timeout - Maximum time to wait in milliseconds (default: 10000)
 * @returns Promise resolving to test results with latency
 * @throws {WizardError} If the test times out
 *
 * @example
 * ```ts
 * const result = await testConnectorWithTimeout(
 *   openaiConnector,
 *   { apiKey: 'sk-...' },
 *   5000 // 5 second timeout
 * );
 * ```
 */
export declare function testConnectorWithTimeout(connector: ConnectorDefinition, config: Record<string, string>, timeout?: number): Promise<TestResult>;
/**
 * Tests multiple connectors in parallel
 *
 * This function runs multiple connector tests concurrently and returns
 * an array of results. This is useful when testing multiple connectors
 * at once, such as after the wizard has collected credentials.
 *
 * @param tests - Array of {connector, config} tuples to test
 * @param timeout - Maximum time to wait for each test in milliseconds
 * @returns Promise resolving to an array of test results
 *
 * @example
 * ```ts
 * const results = await testMultipleConnectors([
 *   [openaiConnector, { apiKey: 'sk-...' }],
 *   [anthropicConnector, { apiKey: 'sk-ant-...' }],
 * ]);
 * console.log(results); // [{ connectorId: 'openai', result: {...} }, ...]
 * ```
 */
export declare function testMultipleConnectors(tests: Array<{
    connectorId: string;
    connector: ConnectorDefinition;
    config: Record<string, string>;
}>, timeout?: number): Promise<Array<{
    connectorId: string;
    result: TestResult;
}>>;
/**
 * Validates that a connector configuration is complete
 *
 * This function checks if all required configuration values are present
 * for a connector before attempting to test it. This provides early
 * feedback to users about missing credentials or settings.
 *
 * @param connector - The connector definition to validate
 * @param config - Configuration values to check
 * @returns Object with isValid flag and missing keys array
 *
 * @example
 * ```ts
 * const validation = validateConnectorConfig(openaiConnector, {});
 * if (!validation.isValid) {
 *   console.log('Missing:', validation.missing); // ['apiKey']
 * }
 * ```
 */
export declare function validateConnectorConfig(connector: ConnectorDefinition, config: Record<string, string>): {
    isValid: boolean;
    missing: string[];
    errors: string[];
};
/**
 * Creates a test result with a specific status
 *
 * Utility function for creating consistent TestResult objects.
 *
 * @param connection - Connection status
 * @param validation - Validation status
 * @param error - Optional error message
 * @param latency - Optional latency in milliseconds
 * @returns A TestResult object
 */
export declare function createTestResult(connection: boolean, validation: boolean, error?: string, latency?: number): TestResult;
/**
 * Checks if a test result indicates success
 *
 * @param result - The test result to check
 * @returns True if both connection and validation succeeded
 */
export declare function isTestSuccessful(result: TestResult): boolean;
/**
 * Checks if a test result indicates a connection failure
 *
 * @param result - The test result to check
 * @returns True if connection failed but validation status is unknown
 */
export declare function isConnectionFailure(result: TestResult): boolean;
/**
 * Checks if a test result indicates a validation failure
 *
 * This occurs when connection succeeded but validation failed,
 * which typically means the service is reachable but credentials
 * or configuration are incorrect.
 *
 * @param result - The test result to check
 * @returns True if connection succeeded but validation failed
 */
export declare function isValidationFailure(result: TestResult): boolean;
/**
 * Formats a test result for human-readable display
 *
 * @param result - The test result to format
 * @returns A formatted string representation
 */
export declare function formatTestResult(result: TestResult): string;
//# sourceMappingURL=validator.d.ts.map