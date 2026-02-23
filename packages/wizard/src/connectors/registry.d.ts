/**
 * Connector Registry
 *
 * Central registry for all available connector definitions.
 * Provides methods to retrieve connectors by ID, category, or get all connectors.
 */
import type { ConnectorDefinition, ConnectorCategory } from './base.js';
/** Default timeout in milliseconds for API-based connector tests */
export declare const DEFAULT_API_TIMEOUT = 5000;
/** Default timeout in milliseconds for local service connector tests */
export declare const DEFAULT_LOCAL_TIMEOUT = 2000;
/**
 * Get a connector by its unique ID.
 *
 * @param id - The unique identifier of the connector
 * @returns The connector definition if found, undefined otherwise
 *
 * @example
 * ```ts
 * const openai = getConnector('openai');
 * if (openai) {
 *   console.log(openai.name); // 'OpenAI'
 * }
 * ```
 */
export declare function getConnector(id: string): ConnectorDefinition | undefined;
/**
 * Get all available connectors.
 *
 * @returns A shallow copy of the connectors array
 *
 * @example
 * ```ts
 * const all = getAllConnectors();
 * console.log(all.length); // 5
 * ```
 */
export declare function getAllConnectors(): ConnectorDefinition[];
/**
 * Get all connectors for a specific category.
 *
 * @param category - The category to filter by ('llm' | 'framework' | 'vector-db')
 * @returns An array of connectors in the specified category
 *
 * @example
 * ```ts
 * const llmConnectors = getConnectorsByCategory('llm');
 * console.log(llmConnectors.map(c => c.name)); // ['OpenAI', 'Anthropic', 'Ollama']
 * ```
 */
export declare function getConnectorsByCategory(category: ConnectorCategory): ConnectorDefinition[];
/**
 * Check if a connector with the given ID exists.
 *
 * @param id - The unique identifier of the connector
 * @returns true if the connector exists, false otherwise
 *
 * @example
 * ```ts
 * if (hasConnector('openai')) {
 *   // Use the connector
 * }
 * ```
 */
export declare function hasConnector(id: string): boolean;
/**
 * Get all connector IDs.
 *
 * @returns An array of all connector IDs
 *
 * @example
 * ```ts
 * const ids = getConnectorIds();
 * console.log(ids); // ['openai', 'anthropic', 'ollama', 'express', 'langchain']
 * ```
 */
export declare function getConnectorIds(): string[];
/**
 * Get all available categories.
 *
 * @returns An array of unique category values
 *
 * @example
 * ```ts
 * const categories = getCategories();
 * console.log(categories); // ['llm', 'framework']
 * ```
 */
export declare function getCategories(): ConnectorCategory[];
//# sourceMappingURL=registry.d.ts.map