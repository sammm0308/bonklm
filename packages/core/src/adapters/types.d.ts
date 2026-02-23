/**
 * BonkLM - Adapter Types
 * ===============================
 * Generic adapter interface for framework integrations.
 *
 * This provides a common interface that all adapters should implement,
 * allowing the core guardrails to work with any framework.
 */
import type { GuardrailResult } from '../base/GuardrailResult.js';
import type { GuardrailEngine } from '../engine/GuardrailEngine.js';
/**
 * Generic input type for adapters
 */
export type AdapterInput<T = unknown> = {
    content: string;
    metadata?: T;
};
/**
 * Generic output type for adapters
 */
export type AdapterOutput<T = unknown> = {
    content?: string;
    allowed: boolean;
    result?: GuardrailResult;
    metadata?: T;
};
/**
 * Adapter configuration
 */
export interface AdapterConfig {
    /**
     * Adapter name (e.g., 'openclaw', 'express', 'vercel-ai')
     */
    name: string;
    /**
     * Adapter version
     */
    version: string;
    /**
     * Enable/disable the adapter
     */
    enabled?: boolean;
    /**
     * Custom logger
     */
    logger?: unknown;
}
/**
 * Framework context passed to adapters
 */
export interface FrameworkContext<T = unknown> {
    /**
     * Framework name (e.g., 'openclaw', 'express', 'nextjs')
     */
    framework: string;
    /**
     * Framework version
     */
    version?: string;
    /**
     * Request/operation metadata
     */
    metadata?: T;
    /**
     * Additional context
     */
    [key: string]: unknown;
}
/**
 * Generic GuardrailAdapter interface
 * All framework adapters should implement this interface
 */
export interface GuardrailAdapter<TInput = unknown, TOutput = unknown, TContext = unknown> {
    /**
     * Adapter name
     */
    readonly name: string;
    /**
     * Adapter version
     */
    readonly version: string;
    /**
     * Initialize the adapter with framework-specific context
     * Can optionally include engine in the context
     */
    initialize?(context: FrameworkContext<TContext> & {
        engine?: GuardrailEngine;
    }): Promise<void> | void;
    /**
     * Validate input using the guardrail engine
     * @param input - Input to validate
     * @returns Validation result
     */
    validate(input: AdapterInput<TInput>): Promise<GuardrailResult> | GuardrailResult;
    /**
     * Transform the result after validation
     * @param result - Guardrail validation result
     * @param input - Original input
     * @returns Transformed output
     */
    transform?(result: GuardrailResult, input: AdapterInput<TInput>): Promise<AdapterOutput<TOutput>> | AdapterOutput<TOutput>;
    /**
     * Cleanup and destroy the adapter
     */
    destroy?(): Promise<void> | void;
}
/**
 * Base adapter class that provides common functionality
 * Extend this class to create custom adapters
 */
export declare abstract class BaseAdapter<TInput = unknown, TOutput = unknown, TContext = unknown> implements GuardrailAdapter<TInput, TOutput, TContext> {
    protected readonly config: AdapterConfig;
    protected engine?: GuardrailEngine;
    protected context?: FrameworkContext<TContext>;
    constructor(config: AdapterConfig);
    /**
     * Get the adapter name
     */
    get name(): string;
    /**
     * Get the adapter version
     */
    get version(): string;
    /**
     * Initialize the adapter with the guardrail engine and context
     */
    initialize(context?: FrameworkContext<TContext> & {
        engine?: GuardrailEngine;
    }): Promise<void>;
    /**
     * Validate input using the guardrail engine
     */
    validate(input: AdapterInput<TInput>): Promise<GuardrailResult>;
    /**
     * Transform the result after validation
     * Override this method to provide custom transformation logic
     */
    transform?(result: GuardrailResult, _input: AdapterInput<TInput>): AdapterOutput<TOutput>;
    /**
     * Cleanup and destroy the adapter
     */
    destroy?(): Promise<void> | void;
    /**
     * Check if the adapter is enabled
     */
    isEnabled(): boolean;
    /**
     * Get the adapter configuration
     */
    getConfig(): AdapterConfig;
}
/**
 * Builder class for creating adapters with a fluent API
 */
export declare class AdapterBuilder<TInput = unknown, TOutput = unknown, TContext = unknown, TAdapter extends BaseAdapter<TInput, TOutput, TContext> = BaseAdapter<TInput, TOutput, TContext>> {
    private adapterClass;
    private config;
    private engine?;
    private context?;
    constructor(adapterClass: new (config: AdapterConfig) => TAdapter, name: string, version: string);
    /**
     * Set the adapter as enabled or disabled
     */
    withEnabled(enabled: boolean): this;
    /**
     * Set a custom logger
     */
    withLogger(logger: unknown): this;
    /**
     * Set the guardrail engine
     */
    withEngine(engine: GuardrailEngine): this;
    /**
     * Set the framework context
     */
    withContext(context: FrameworkContext<TContext>): this;
    /**
     * Build the adapter instance
     */
    build(): Promise<TAdapter>;
}
/**
 * Create a new adapter builder
 */
export declare function createAdapterBuilder<TInput = unknown, TOutput = unknown, TContext = unknown, TAdapter extends BaseAdapter<TInput, TOutput, TContext> = BaseAdapter<TInput, TOutput, TContext>>(adapterClass: new (config: AdapterConfig) => TAdapter, name: string, version: string): AdapterBuilder<TInput, TOutput, TContext, TAdapter>;
/**
 * Registry for managing multiple adapters
 */
export declare class AdapterRegistry<TInput = unknown, TOutput = unknown, TContext = unknown> {
    private adapters;
    /**
     * Register an adapter
     */
    register(adapter: GuardrailAdapter<TInput, TOutput, TContext>): void;
    /**
     * Unregister an adapter by name
     */
    unregister(name: string): boolean;
    /**
     * Get an adapter by name
     */
    get(name: string): GuardrailAdapter<TInput, TOutput, TContext> | undefined;
    /**
     * Check if an adapter is registered
     */
    has(name: string): boolean;
    /**
     * Get all registered adapter names
     */
    getAdapterNames(): string[];
    /**
     * Clear all adapters
     */
    clear(): void;
    /**
     * Get the number of registered adapters
     */
    get size(): number;
}
//# sourceMappingURL=types.d.ts.map