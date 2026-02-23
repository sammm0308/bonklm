/**
 * BonkLM - Hooks System
 * ==============================
 * Generic hook system for extending validation behavior.
 */

import { createLogger, type Logger } from '../base/GenericLogger.js';

// Export HookSandbox
export * from './HookSandbox.js';

/**
 * Hook execution phases
 */
export enum HookPhase {
  BEFORE_VALIDATION = 'before_validation',
  AFTER_VALIDATION = 'after_validation',
  BEFORE_BLOCK = 'before_block',
  AFTER_ALLOW = 'after_allow',
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
export type HookHandler<TContext = HookContext> = (
  context: TContext,
  execution: HookExecution
) => Promise<HookResult> | HookResult;

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
  // S011-007: Rate limiting configuration
  rateLimit?: {
    maxCalls: number; // Maximum calls per window
    windowMs: number; // Time window in milliseconds
    perPhase?: boolean; // Separate limits per phase
  };
}

/**
 * Generic Hook Manager
 */
export class HookManager<TContext extends HookContext = HookContext> {
  private readonly hooks: Map<HookPhase, HookDefinition<TContext>[]> = new Map();
  private readonly logger: Logger;
  private readonly defaultTimeout: number;
  // S011-007: Rate limiting state
  private readonly rateLimitConfig?: { maxCalls: number; windowMs: number; perPhase?: boolean };
  private readonly rateLimitTracking: Map<string, number[]> = new Map();

  constructor(config: HookManagerConfig = {}) {
    this.logger = config.logger ?? createLogger('console');
    this.defaultTimeout = config.defaultTimeout ?? 30000;
    this.rateLimitConfig = config.rateLimit;
  }

  /**
   * Register a hook
   */
  registerHook(definition: Omit<HookDefinition<TContext>, 'id'>): string {
    const id = `hook_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const hook: HookDefinition<TContext> = {
      ...definition,
      id,
      priority: definition.priority ?? 0,
      enabled: definition.enabled !== false,
    };

    if (!this.hooks.has(hook.phase)) {
      this.hooks.set(hook.phase, []);
    }

    this.hooks.get(hook.phase)!.push(hook);
    this.hooks.get(hook.phase)!.sort((a, b) => a.priority - b.priority);

    this.logger.info('Hook registered', { id, name: hook.name, phase: hook.phase });
    return id;
  }

  /**
   * Unregister a hook
   */
  unregisterHook(hookId: string): boolean {
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
  async executeHooks(
    phase: HookPhase,
    context: TContext
  ): Promise<HookResult[]> {
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
    const results: HookResult[] = [];

    for (const hook of hooks) {
      if (!hook.enabled) {
        continue;
      }

      const execution: HookExecution = {
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
      } catch (error) {
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
  private checkRateLimit(phase: HookPhase): boolean {
    if (!this.rateLimitConfig) return true;

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
  private cleanupRateLimitTracking(now: number, windowMs: number): void {
    for (const [key, timestamps] of this.rateLimitTracking.entries()) {
      const filtered = timestamps.filter(ts => now - ts < windowMs * 2);
      if (filtered.length === 0) {
        this.rateLimitTracking.delete(key);
      } else {
        this.rateLimitTracking.set(key, filtered);
      }
    }
  }

  /**
   * Execute a single hook with timeout
   */
  private async executeWithTimeout(
    hook: HookDefinition<TContext>,
    context: TContext,
    execution: HookExecution,
    timeout: number
  ): Promise<HookResult> {
    return Promise.race([
      hook.handler(context, execution),
      new Promise<HookResult>((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: false,
              shouldBlock: false,
              message: `Hook ${hook.name} timed out after ${timeout}ms`,
            }),
          timeout
        )
      ),
    ]);
  }

  /**
   * Get all registered hooks
   */
  getHooks(): Map<HookPhase, HookDefinition<TContext>[]> {
    return new Map(this.hooks);
  }

  /**
   * Clear all hooks
   */
  clearHooks(): void {
    this.hooks.clear();
    this.logger.info('All hooks cleared');
  }
}

/**
 * Create a simple hook that blocks based on a condition
 */
export function createBlockingHook(
  name: string,
  phase: HookPhase,
  shouldBlockFn: (context: HookContext) => boolean | Promise<boolean>,
  priority: number = 0
): HookDefinition {
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
export function createTransformHook(
  name: string,
  phase: HookPhase,
  transformFn: (content: string) => string | Promise<string>,
  priority: number = 0
): HookDefinition {
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
