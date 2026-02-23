/**
 * Base connector interfaces and types for the BonkLM Installation Wizard
 *
 * This module defines the core connector system that allows extensibility
 * for various LLM providers, frameworks, and vector databases.
 *
 * @module connectors/base
 */
import type { z } from 'zod';
/**
 * Supported connector categories
 *
 * - llm: Language Model providers (OpenAI, Anthropic, Ollama, etc.)
 * - framework: Framework integrations (Express, LangChain, etc.)
 * - vector-db: Vector database services (Chroma, Weaviate, Qdrant, etc.)
 */
export type ConnectorCategory = 'llm' | 'framework' | 'vector-db';
/**
 * Detection rules for auto-discovering connector configurations
 *
 * The wizard uses these rules to detect which connectors might be
 * available in the user's environment.
 */
export interface DetectionRules {
    /** Package names to check in package.json dependencies */
    packageJson?: string[];
    /** Environment variable names to check for credentials */
    envVars?: string[];
    /** TCP ports to check for running services */
    ports?: number[];
    /** Docker container name patterns to check */
    dockerContainers?: string[];
}
/**
 * Result of testing a connector connection
 *
 * Two-tier testing approach:
 * 1. connection: Basic connectivity (port open, auth valid)
 * 2. validation: Full functionality (can send queries, returns valid responses)
 */
export interface TestResult {
    /** True if basic connection succeeded */
    connection: boolean;
    /** True if full validation test succeeded */
    validation: boolean;
    /** Error message if connection or validation failed */
    error?: string;
    /** Latency in milliseconds */
    latency?: number;
}
/**
 * Connector definition interface
 *
 * All connectors must implement this interface to be compatible with
 * the wizard system.
 *
 * @example
 * ```ts
 * export const openaiConnector: ConnectorDefinition = {
 *   id: 'openai',
 *   name: 'OpenAI',
 *   category: 'llm',
 *   detection: { envVars: ['OPENAI_API_KEY'] },
 *   test: async (config) => { ... },
 *   generateSnippet: (config) => `...`,
 *   configSchema: openaiConfigSchema,
 * };
 * ```
 */
export interface ConnectorDefinition {
    /** Unique identifier for this connector */
    id: string;
    /** Human-readable display name */
    name: string;
    /** Category of this connector */
    category: ConnectorCategory;
    /** Rules for auto-detecting this connector */
    detection: DetectionRules;
    /**
     * Test function to verify connector configuration
     *
     * The function should respect the AbortSignal if provided to allow
     * timeout cancellation of long-running tests.
     *
     * @param config - Configuration values for the connector
     * @param signal - Optional AbortSignal for cancelling the test
     * @returns Promise resolving to test results
     */
    test: (config: Record<string, string>, signal?: AbortSignal) => Promise<TestResult>;
    /**
     * Generate code snippet for using this connector
     *
     * The snippet should be valid TypeScript/JavaScript code that
     * demonstrates how to use the connector with the provided configuration.
     *
     * @param config - Configuration values for the connector
     * @returns Code snippet as a string
     */
    generateSnippet: (config: Record<string, string>) => string;
    /**
     * Zod schema for validating connector configuration
     *
     * This schema is used to validate user input and ensure required
     * configuration values are present and correctly formatted.
     */
    configSchema: z.ZodSchema;
}
/**
 * Type guard to check if a value is a valid ConnectorCategory
 *
 * @param value - Value to check
 * @returns True if the value is a valid ConnectorCategory
 */
export declare function isConnectorCategory(value: unknown): value is ConnectorCategory;
/**
 * Type guard to check if a value is a valid TestResult
 *
 * @param value - Value to check
 * @returns True if the value is a valid TestResult
 */
export declare function isTestResult(value: unknown): value is TestResult;
/**
 * Type guard to check if a value is a valid ConnectorDefinition
 *
 * @param value - Value to check
 * @returns True if the value is a valid ConnectorDefinition
 */
export declare function isConnectorDefinition(value: unknown): value is ConnectorDefinition;
/**
 * Export Zod type for use in other modules
 *
 * This allows other modules to import the Zod type without
 * importing from the zod package directly.
 */
export type { z };
//# sourceMappingURL=base.d.ts.map