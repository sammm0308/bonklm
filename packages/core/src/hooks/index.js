/**
 * BonkLM - Hooks System
 * ==============================
 * Generic hook system for extending validation behavior.
 */
import { createLogger } from '../base/GenericLogger.js';
// Export HookSandbox
export * from './HookSandbox.js';
/**
 * Hook execution phases
 */
export var HookPhase;
(function (HookPhase) {
    HookPhase["BEFORE_VALIDATION"] = "before_validation";
    HookPhase["AFTER_VALIDATION"] = "after_validation";
    HookPhase["BEFORE_BLOCK"] = "before_block";
    HookPhase["AFTER_ALLOW"] = "after_allow";
})(HookPhase || (HookPhase = {}));
/**
 * Generic Hook Manager
 */
export class HookManager {
    hooks = new Map();
    logger;
    defaultTimeout;
    // S011-007: Rate limiting state
    rateLimitConfig;
    rateLimitTracking = new Map();
    constructor(config = {}) {
        this.logger = config.logger ?? createLogger('console');
        this.defaultTimeout = config.defaultTimeout ?? 30000;
        this.rateLimitConfig = config.rateLimit;
    }
    /**
     * Register a hook
     */
    registerHook(definition) {
        const id = `hook_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        const hook = {
            ...definition,
            id,
            priority: definition.priority ?? 0,
            enabled: definition.enabled !== false,
        };
        if (!this.hooks.has(hook.phase)) {
            this.hooks.set(hook.phase, []);
        }
        this.hooks.get(hook.phase).push(hook);
        this.hooks.get(hook.phase).sort((a, b) => a.priority - b.priority);
        this.logger.info('Hook registered', { id, name: hook.name, phase: hook.phase });
        return id;
    }
    /**
     * Unregister a hook
     */
    unregisterHook(hookId) {
        for (const hooks of this.hooks.values()) {
            const index = hooks.findIndex((h) => h.id === hookId);
            if (index !== -1) {
                hooks.splice(index, 1);
                this.logger.info('Hook unregistered', { hookId });
                return true;
            }
        }
        return false;
    }
    /**
     * Execute hooks for a specific phase
     */
    async executeHooks(phase, context) {
        // S011-007: Check rate limit before executing hooks
        if (this.rateLimitConfig && !this.checkRateLimit(phase)) {
            this.logger.warn('Hook execution rate limit exceeded', { phase });
            return [{
                    success: false,
                    shouldBlock: false,
                    message: `Rate limit exceeded for phase: ${phase}`,
                }];
        }
        const hooks = this.hooks.get(phase) || [];
        const results = [];
        for (const hook of hooks) {
            if (!hook.enabled) {
                continue;
            }
            const execution = {
                hookId: hook.id,
                timestamp: Date.now(),
                attemptNumber: 1,
            };
            try {
                const timeout = hook.timeout ?? this.defaultTimeout;
                const result = await this.executeWithTimeout(hook, context, execution, timeout);
                results.push(result);
                if (result.shouldBlock) {
                    this.logger.warn('Hook blocked execution', { hookId: hook.id, name: hook.name });
                    // Continue executing other hooks for logging purposes
                }
            }
            catch (error) {
                this.logger.error('Hook execution failed', {
                    hookId: hook.id,
                    name: hook.name,
                    error: error instanceof Error ? error.message : String(error),
                });
                results.push({
                    success: false,
                    shouldBlock: false,
                    message: `Hook ${hook.name} failed: ${error}`,
                });
            }
        }
        return results;
    }
    /**
     * S011-007: Check if rate limit allows execution
     * @returns true if within rate limit, false if exceeded
     */
    checkRateLimit(phase) {
        if (!this.rateLimitConfig)
            return true;
        const now = Date.now();
        const { maxCalls, windowMs, perPhase } = this.rateLimitConfig;
        const key = perPhase ? `rate:${phase}` : 'rate:global';
        // Get existing timestamps or initialize
        let timestamps = this.rateLimitTracking.get(key) || [];
        // Remove timestamps outside the current window
        timestamps = timestamps.filter(ts => now - ts < windowMs);
        // Check if limit exceeded
        if (timestamps.length >= maxCalls) {
            return false;
        }
        // Add current timestamp
        timestamps.push(now);
        this.rateLimitTracking.set(key, timestamps);
        // Cleanup old entries periodically
        if (Math.random() < 0.01) { // 1% chance to cleanup
            this.cleanupRateLimitTracking(now, windowMs);
        }
        return true;
    }
    /**
     * S011-007: Clean up old rate limit tracking entries
     */
    cleanupRateLimitTracking(now, windowMs) {
        for (const [key, timestamps] of this.rateLimitTracking.entries()) {
            const filtered = timestamps.filter(ts => now - ts < windowMs * 2);
            if (filtered.length === 0) {
                this.rateLimitTracking.delete(key);
            }
            else {
                this.rateLimitTracking.set(key, filtered);
            }
        }
    }
    /**
     * Execute a single hook with timeout
     */
    async executeWithTimeout(hook, context, execution, timeout) {
        return Promise.race([
            hook.handler(context, execution),
            new Promise((resolve) => setTimeout(() => resolve({
                success: false,
                shouldBlock: false,
                message: `Hook ${hook.name} timed out after ${timeout}ms`,
            }), timeout)),
        ]);
    }
    /**
     * Get all registered hooks
     */
    getHooks() {
        return new Map(this.hooks);
    }
    /**
     * Clear all hooks
     */
    clearHooks() {
        this.hooks.clear();
        this.logger.info('All hooks cleared');
    }
}
/**
 * Create a simple hook that blocks based on a condition
 */
export function createBlockingHook(name, phase, shouldBlockFn, priority = 0) {
    return {
        id: '',
        name,
        phase,
        priority,
        enabled: true,
        handler: async (context) => {
            const shouldBlock = await shouldBlockFn(context);
            return {
                success: true,
                shouldBlock,
                message: shouldBlock ? `Blocked by hook: ${name}` : undefined,
            };
        },
    };
}
/**
 * Create a hook that transforms content before validation
 */
export function createTransformHook(name, phase, transformFn, priority = 0) {
    return {
        id: '',
        name,
        phase,
        priority,
        enabled: true,
        handler: async (context) => {
            const transformed = await transformFn(context.content);
            return {
                success: true,
                data: { transformed },
            };
        },
    };
}
//# sourceMappingURL=index.js.map