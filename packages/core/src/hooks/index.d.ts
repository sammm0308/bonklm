/**
 * BonkLM - Hooks System
 * ==============================
 * Generic hook system for extending validation behavior.
 */
import { type Logger } from '../base/GenericLogger.js';
export * from './HookSandbox.js';
/**
 * Hook execution phases
 */
export declare enum HookPhase {
    BEFORE_VALIDATION = "before_validation",
    AFTER_VALIDATION = "after_validation",
    BEFORE_BLOCK = "before_block",
    AFTER_ALLOW = "after_allow"
}
/**
 * Hook handler context
 */
export interface HookContext {
    phase: HookPhase;
    content: string;
    metadata?: Record<string, unknown>;
}
/**
 * Hook handler function
 */
export type HookHandler<TContext = HookContext> = (context: TContext, execution: HookExecution) => Promise<HookResult> | HookResult;
/**
 * Hook execution metadata
 */
export interface HookExecution {
    hookId: string;
    timestamp: number;
    attemptNumber: number;
}
/**
 * Hook result
 */
export interface HookResult {
    success: boolean;
    data?: unknown;
    shouldBlock?: boolean;
    message?: string;
}
/**
 * Hook definition
 */
export interface HookDefinition<TContext = HookContext> {
    id: string;
    name: string;
    phase: HookPhase;
    handler: HookHandler<TContext>;
    priority: number;
    enabled: boolean;
    timeout?: number;
}
/**
 * Hook manager configuration
 */
export interface HookManagerConfig {
    logger?: Logger;
    defaultTimeout?: number;
    rateLimit?: {
        maxCalls: number;
        windowMs: number;
        perPhase?: boolean;
    };
}
/**
 * Generic Hook Manager
 */
export declare class HookManager<TContext extends HookContext = HookContext> {
    private readonly hooks;
    private readonly logger;
    private readonly defaultTimeout;
    private readonly rateLimitConfig?;
    private readonly rateLimitTracking;
    constructor(config?: HookManagerConfig);
    /**
     * Register a hook
     */
    registerHook(definition: Omit<HookDefinition<TContext>, 'id'>): string;
    /**
     * Unregister a hook
     */
    unregisterHook(hookId: string): boolean;
    /**
     * Execute hooks for a specific phase
     */
    executeHooks(phase: HookPhase, context: TContext): Promise<HookResult[]>;
    /**
     * S011-007: Check if rate limit allows execution
     * @returns true if within rate limit, false if exceeded
     */
    private checkRateLimit;
    /**
     * S011-007: Clean up old rate limit tracking entries
     */
    private cleanupRateLimitTracking;
    /**
     * Execute a single hook with timeout
     */
    private executeWithTimeout;
    /**
     * Get all registered hooks
     */
    getHooks(): Map<HookPhase, HookDefinition<TContext>[]>;
    /**
     * Clear all hooks
     */
    clearHooks(): void;
}
/**
 * Create a simple hook that blocks based on a condition
 */
export declare function createBlockingHook(name: string, phase: HookPhase, shouldBlockFn: (context: HookContext) => boolean | Promise<boolean>, priority?: number): HookDefinition;
/**
 * Create a hook that transforms content before validation
 */
export declare function createTransformHook(name: string, phase: HookPhase, transformFn: (content: string) => string | Promise<string>, priority?: number): HookDefinition;
//# sourceMappingURL=index.d.ts.map