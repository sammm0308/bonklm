/**
 * Base connector interfaces and types for the BonkLM Installation Wizard
 *
 * This module defines the core connector system that allows extensibility
 * for various LLM providers, frameworks, and vector databases.
 *
 * @module connectors/base
 */
/**
 * Type guard to check if a value is a valid ConnectorCategory
 *
 * @param value - Value to check
 * @returns True if the value is a valid ConnectorCategory
 */
export function isConnectorCategory(value) {
    return typeof value === 'string' && ['llm', 'framework', 'vector-db'].includes(value);
}
/**
 * Type guard to check if a value is a valid TestResult
 *
 * @param value - Value to check
 * @returns True if the value is a valid TestResult
 */
export function isTestResult(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const result = value;
    return (typeof result.connection === 'boolean' &&
        typeof result.validation === 'boolean' &&
        (result.error === undefined || typeof result.error === 'string') &&
        (result.latency === undefined || typeof result.latency === 'number'));
}
/**
 * Type guard to check if a value is a valid ConnectorDefinition
 *
 * @param value - Value to check
 * @returns True if the value is a valid ConnectorDefinition
 */
export function isConnectorDefinition(value) {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const def = value;
    return (typeof def.id === 'string' &&
        typeof def.name === 'string' &&
        isConnectorCategory(def.category) &&
        typeof def.detection === 'object' &&
        typeof def.test === 'function' &&
        typeof def.generateSnippet === 'function' &&
        typeof def.configSchema === 'object' &&
        def.configSchema !== null &&
        'safeParse' in def.configSchema &&
        typeof def.configSchema.safeParse === 'function');
}
//# sourceMappingURL=base.js.map