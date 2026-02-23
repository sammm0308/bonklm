/**
 * BonkLM - Adapter Types
 * ===============================
 * Generic adapter interface for framework integrations.
 *
 * This provides a common interface that all adapters should implement,
 * allowing the core guardrails to work with any framework.
 */
// ============================================================================
// BASE ADAPTER CLASS
// =============================================================================
/**
 * Base adapter class that provides common functionality
 * Extend this class to create custom adapters
 */
export class BaseAdapter {
    config;
    engine;
    context;
    constructor(config) {
        this.config = {
            enabled: true,
            ...config,
        };
    }
    /**
     * Get the adapter name
     */
    get name() {
        return this.config.name;
    }
    /**
     * Get the adapter version
     */
    get version() {
        return this.config.version;
    }
    /**
     * Initialize the adapter with the guardrail engine and context
     */
    async initialize(context) {
        if (context?.engine) {
            this.engine = context.engine;
        }
        this.context = context;
    }
    /**
     * Validate input using the guardrail engine
     */
    async validate(input) {
        if (!this.engine) {
            throw new Error(`Adapter ${this.name} not initialized. Call initialize() first.`);
        }
        const result = await this.engine.validate(input.content);
        // Return the core result properties
        return {
            allowed: result.allowed,
            blocked: result.blocked,
            severity: result.severity,
            risk_level: result.risk_level,
            risk_score: result.risk_score,
            findings: result.findings,
            timestamp: result.timestamp,
        };
    }
    /**
     * Transform the result after validation
     * Override this method to provide custom transformation logic
     */
    transform(result, _input) {
        return {
            allowed: result.allowed,
            result,
        };
    }
    /**
     * Cleanup and destroy the adapter
     */
    destroy() {
        this.engine = undefined;
        this.context = undefined;
    }
    /**
     * Check if the adapter is enabled
     */
    isEnabled() {
        return this.config.enabled ?? true;
    }
    /**
     * Get the adapter configuration
     */
    getConfig() {
        return { ...this.config };
    }
}
// ============================================================================
// ADAPTER BUILDER
// =============================================================================
/**
 * Builder class for creating adapters with a fluent API
 */
export class AdapterBuilder {
    adapterClass;
    config;
    engine;
    context;
    constructor(adapterClass, name, version) {
        this.adapterClass = adapterClass;
        this.config = { name, version };
    }
    /**
     * Set the adapter as enabled or disabled
     */
    withEnabled(enabled) {
        this.config.enabled = enabled;
        return this;
    }
    /**
     * Set a custom logger
     */
    withLogger(logger) {
        this.config.logger = logger;
        return this;
    }
    /**
     * Set the guardrail engine
     */
    withEngine(engine) {
        this.engine = engine;
        return this;
    }
    /**
     * Set the framework context
     */
    withContext(context) {
        this.context = context;
        return this;
    }
    /**
     * Build the adapter instance
     */
    async build() {
        const adapter = new this.adapterClass(this.config);
        if (this.engine || this.context) {
            const contextWithEngine = {
                ...(this.context ?? {}),
                framework: this.context?.framework ?? 'generic',
                engine: this.engine,
            };
            await adapter.initialize(contextWithEngine);
        }
        return adapter;
    }
}
/**
 * Create a new adapter builder
 */
export function createAdapterBuilder(adapterClass, name, version) {
    return new AdapterBuilder(adapterClass, name, version);
}
// ============================================================================
// ADAPTER REGISTRY
// =============================================================================
/**
 * Registry for managing multiple adapters
 */
export class AdapterRegistry {
    adapters = new Map();
    /**
     * Register an adapter
     */
    register(adapter) {
        this.adapters.set(adapter.name, adapter);
    }
    /**
     * Unregister an adapter by name
     */
    unregister(name) {
        return this.adapters.delete(name);
    }
    /**
     * Get an adapter by name
     */
    get(name) {
        return this.adapters.get(name);
    }
    /**
     * Check if an adapter is registered
     */
    has(name) {
        return this.adapters.has(name);
    }
    /**
     * Get all registered adapter names
     */
    getAdapterNames() {
        return Array.from(this.adapters.keys());
    }
    /**
     * Clear all adapters
     */
    clear() {
        this.adapters.clear();
    }
    /**
     * Get the number of registered adapters
     */
    get size() {
        return this.adapters.size;
    }
}
//# sourceMappingURL=types.js.map