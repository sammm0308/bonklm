/**
 * BonkLM - GuardrailEngine
 * =================================
 * Main orchestration class for combining multiple validators and guards.
 *
 * @package @blackunicorn/bonklm
 */
import { type Logger } from '../base/GenericLogger.js';
import { type GuardrailResult } from '../base/GuardrailResult.js';
import { type OverrideTokenConfigString } from '../security/override-token.js';
/**
 * Stream validation error for buffer overflow protection.
 */
export declare class StreamValidationError extends Error {
    readonly reason: string;
    readonly blocked: boolean;
    constructor(message: string, reason?: string, blocked?: boolean);
}
/**
 * Circuit breaker state for preventing repeated buffer overflow attacks.
 */
declare enum CircuitBreakerState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Blocking requests after threshold
    HALF_OPEN = "HALF_OPEN"
}
/**
 * Circuit breaker metrics for tracking buffer overflow violations.
 */
interface CircuitBreakerMetrics {
    violationCount: number;
    lastViolationTime: number;
    state: CircuitBreakerState;
    openUntil?: number;
}
/**
 * Validator instance interface.
 * All validators must implement a validate method that accepts content
 * and returns a GuardrailResult.
 */
export interface Validator {
    /**
     * Validate content and return a result.
     */
    validate(content: string): GuardrailResult;
    /**
     * Optional validator name for identification.
     */
    name?: string;
}
/**
 * Guard instance interface.
 * Guards validate content with optional context (e.g., file path).
 */
export interface Guard {
    /**
     * Validate content and return a result.
     */
    validate(content: string, context?: string): GuardrailResult;
    /**
     * Optional guard name for identification.
     */
    name?: string;
}
/**
 * Execution order for validators.
 */
export type ExecutionOrder = 'sequential' | 'parallel';
/**
 * Engine configuration options.
 */
export interface GuardrailEngineConfig {
    /**
     * List of validators to run.
     */
    validators?: Validator[];
    /**
     * List of guards to run.
     */
    guards?: Guard[];
    /**
     * Whether to stop execution on first failure.
     * @default true
     */
    shortCircuit?: boolean;
    /**
     * Execution order for validators.
     * @default 'sequential'
     */
    executionOrder?: ExecutionOrder;
    /**
     * Custom logger.
     */
    logger?: Logger;
    /**
     * Whether to include individual validator results in the output.
     * @default true
     */
    includeIndividualResults?: boolean;
    /**
     * Global sensitivity level.
     * @default 'standard'
     */
    sensitivity?: 'strict' | 'standard' | 'permissive';
    /**
     * Global action mode.
     * @default 'block'
     */
    action?: 'block' | 'sanitize' | 'log' | 'allow';
    /**
     * Override token to bypass validation.
     * S011-006: Now supports cryptographic validation.
     * - string: Legacy plaintext token (INSECURE, not recommended)
     * - OverrideTokenConfig object: Secure HMAC-based token validation
     *
     * @example
     * // Legacy (insecure)
     * overrideToken: 'BYPASS-VALIDATION'
     *
     * // Secure (recommended)
     * overrideToken: { secret: 'your-32-char-secret' }
     */
    overrideToken?: OverrideTokenConfigString;
    /**
     * Maximum time in milliseconds for validation to complete.
     * Prevents DoS via complex regex patterns. @default 5000ms
     */
    validationTimeout?: number;
    /**
     * Maximum time for individual pattern matching.
     * Prevents ReDoS attacks. @default 100ms
     */
    patternTimeout?: number;
    /**
     * Maximum buffer size for streaming validation in bytes.
     * Prevents memory exhaustion through buffer overflow attacks. @default 1MB
     */
    maxBufferSize?: number;
    /**
     * Circuit breaker threshold for buffer overflow violations.
     * Triggers circuit breaker after this many violations. @default 3
     */
    circuitBreakerThreshold?: number;
    /**
     * Circuit breaker timeout in milliseconds.
     * How long to stay in OPEN state before attempting recovery. @default 60000ms (1 minute)
     */
    circuitBreakerTimeout?: number;
}
/**
 * Individual validator result with metadata.
 */
export interface ValidatorResult extends GuardrailResult {
    /**
     * Name of the validator that produced this result.
     */
    validatorName: string;
}
/**
 * Aggregated engine result.
 */
export interface EngineResult extends GuardrailResult {
    /**
     * Individual results from each validator/guard.
     */
    results: ValidatorResult[];
    /**
     * Number of validators run.
     */
    validatorCount: number;
    /**
     * Number of guards run.
     */
    guardCount: number;
    /**
     * Execution time in milliseconds.
     */
    executionTime: number;
}
/**
 * Callback function type for intercept events.
 * Called when validation completes with a result.
 *
 * @param result - The engine result from validation
 * @param context - Context including original content and optional validation context
 */
export type InterceptCallback = (result: EngineResult, context: {
    content: string;
    validation_context?: string;
}) => void | Promise<void>;
/**
 * GuardrailEngine - Main orchestration class for LLM guardrails.
 *
 * @example
 * ```typescript
 * const engine = new GuardrailEngine({
 *   validators: [
 *     new PromptInjectionValidator(),
 *     new JailbreakValidator()
 *   ],
 *   shortCircuit: true,
 * });
 *
 * const result = await engine.validate(userMessage);
 * if (!result.allowed) {
 *   console.log('Blocked:', result.reason);
 * }
 * ```
 */
export declare class GuardrailEngine {
    private readonly validators;
    private readonly guards;
    private readonly shortCircuit;
    private readonly executionOrder;
    private readonly logger;
    private readonly includeIndividualResults;
    private readonly sensitivity;
    private readonly action;
    private readonly overrideToken?;
    private readonly overrideTokenValidator?;
    private readonly validationTimeout;
    private readonly patternTimeout;
    private readonly maxBufferSize;
    private readonly circuitBreakerThreshold;
    private readonly circuitBreakerTimeout;
    private interceptCallbacks;
    private circuitBreaker;
    constructor(config?: GuardrailEngineConfig);
    /**
     * Check if pattern matching timeout has been exceeded.
     * Called by validators/guards to prevent ReDoS attacks.
     */
    isPatternTimeoutExpired(startTime: number): boolean;
    /**
     * S011-005: Validate buffer size before accumulation.
     * Throws StreamValidationError if buffer would exceed max size.
     *
     * @param currentBufferSize - Current accumulated buffer size in bytes
     * @param chunkSize - Size of the chunk being added
     * @throws {StreamValidationError} If buffer would exceed max size
     */
    validateBufferSize(currentBufferSize: number, chunkSize: number): void;
    /**
     * S011-005: Check if circuit breaker is tripped (blocking requests).
     * @returns true if circuit breaker is open and blocking requests
     */
    isCircuitBreakerOpen(): boolean;
    /**
     * S011-005: Record a buffer overflow violation and update circuit breaker state.
     * When in HALF_OPEN state, any violation immediately trips back to OPEN.
     */
    private recordBufferOverflowViolation;
    /**
     * S011-005: Reset circuit breaker after successful validation (in HALF_OPEN state).
     */
    private resetCircuitBreaker;
    /**
     * Get current circuit breaker state (for monitoring).
     */
    getCircuitBreakerState(): CircuitBreakerMetrics;
    /**
     * Register a callback to be invoked when content is intercepted (validated).
     * Multiple callbacks can be registered and will be invoked in order.
     *
     * Callbacks receive the validation result and original content.
     * They are invoked after validation completes, before the result is returned.
     * Callbacks are invoked asynchronously and errors are caught and logged.
     *
     * @example
     * ```typescript
     * const logger = new AttackLogger();
     * engine.onIntercept(logger.getInterceptCallback());
     *
     * // Or with a custom callback
     * engine.onIntercept((result, context) => {
     *   if (result.blocked) {
     *     console.log('Blocked attack:', context.content);
     *   }
     * });
     * ```
     */
    onIntercept(callback: InterceptCallback): void;
    /**
     * Invoke all registered intercept callbacks.
     * Callbacks are invoked asynchronously and errors are caught and logged.
     */
    private invokeInterceptCallbacks;
    /**
     * S011-006: Check for valid override token
     *
     * Supports both legacy plaintext tokens (INSECURE) and new cryptographic validation.
     *
     * @param content - Content to check for override token
     * @returns Token validation result
     */
    private checkOverrideToken;
    /**
     * Validate content against all registered validators and guards.
     *
     * @param content - The content to validate
     * @param context - Optional context (e.g., file path for guards)
     * @returns Aggregated validation result
     */
    validate(content: string, context?: string): Promise<EngineResult>;
    /**
     * Run all validators.
     */
    private runValidators;
    /**
     * Run validators sequentially.
     */
    private runValidatorsSequential;
    /**
     * Run validators in parallel.
     */
    private runValidatorsParallel;
    /**
     * Run all guards.
     */
    private runGuards;
    /**
     * Aggregate individual results into a final result.
     */
    private aggregateResults;
    /**
     * Add a validator to the engine.
     */
    addValidator(validator: Validator): void;
    /**
     * Add a guard to the engine.
     */
    addGuard(guard: Guard): void;
    /**
     * Remove a validator by name.
     */
    removeValidator(name: string): boolean;
    /**
     * Remove a guard by name.
     */
    removeGuard(name: string): boolean;
    /**
     * Get all registered validators.
     */
    getValidators(): Validator[];
    /**
     * Get all registered guards.
     */
    getGuards(): Guard[];
    /**
     * Get engine statistics.
     */
    getStats(): {
        validatorCount: number;
        guardCount: number;
        shortCircuit: boolean;
        executionOrder: ExecutionOrder;
        sensitivity: string;
        action: string;
    };
}
/**
 * Convenience function to create and run a GuardrailEngine in one call.
 *
 * @example
 * ```typescript
 * const result = await validateWithEngine(userMessage, {
 *   validators: [new PromptInjectionValidator()],
 * });
 * ```
 */
export declare function validateWithEngine(content: string, config?: GuardrailEngineConfig): Promise<EngineResult>;
export {};
//# sourceMappingURL=GuardrailEngine.d.ts.map