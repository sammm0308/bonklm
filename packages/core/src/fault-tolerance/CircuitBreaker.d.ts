/**
 * Circuit Breaker
 *
 * Implements the circuit breaker pattern for fault tolerance.
 * Prevents cascading failures by failing fast when a service is down.
 *
 * @package @blackunicorn/bonklm
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Circuit breaker states
 */
export declare enum CircuitState {
    /** Normal operation, requests pass through */
    CLOSED = "closed",
    /** Circuit is tripped, all requests fail fast */
    OPEN = "open",
    /** Testing if service has recovered */
    HALF_OPEN = "half_open"
}
/**
 * Circuit breaker configuration
 */
export interface CircuitBreakerConfig {
    /** Minimum number of requests before calculating error rate */
    requestVolumeThreshold?: number;
    /** Error percentage threshold to trip the circuit (0-100) */
    errorThresholdPercentage?: number;
    /** Time in milliseconds before attempting recovery (half-open state) */
    recoveryTimeout?: number;
    /** Maximum number of requests to allow in half-open state */
    halfOpenMaxRequests?: number;
    /** Request timeout in milliseconds */
    timeout?: number;
    /** Logger instance */
    logger?: Logger;
    /** Enable/disable the circuit breaker */
    enabled?: boolean;
}
/**
 * Circuit breaker error - thrown when circuit is open
 */
export declare class CircuitBreakerOpenError extends Error {
    readonly state: CircuitState;
    readonly nextAttemptTime: Date;
    name: string;
    constructor(state: CircuitState, nextAttemptTime: Date);
}
/**
 * Circuit breaker statistics
 */
export interface CircuitBreakerStats {
    state: CircuitState;
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    errorPercentage: number;
    lastFailureTime?: Date;
    lastSuccessTime?: Date;
    openedAt?: Date;
    nextAttemptTime?: Date;
}
/**
 * Circuit breaker event listeners
 */
export interface CircuitBreakerListeners {
    /** Called when circuit transitions to open state */
    onOpen?: (stats: CircuitBreakerStats) => void;
    /** Called when circuit transitions to half-open state */
    onHalfOpen?: (stats: CircuitBreakerStats) => void;
    /** Called when circuit transitions to closed state */
    onClosed?: (stats: CircuitBreakerStats) => void;
    /** Called when a request fails */
    onFailure?: (error: Error, stats: CircuitBreakerStats) => void;
    /** Called when a request succeeds */
    onSuccess?: (stats: CircuitBreakerStats) => void;
}
/**
 * Circuit Breaker
 *
 * Prevents cascading failures by failing fast when a service is experiencing issues.
 * Implements three states: CLOSED (normal), OPEN (failing fast), HALF_OPEN (testing recovery).
 */
export declare class CircuitBreaker {
    private state;
    private stats;
    private halfOpenRequestCount;
    private openedAt?;
    private nextAttemptTimer?;
    private readonly config;
    private readonly logger;
    private readonly listeners;
    constructor(config?: CircuitBreakerConfig, listeners?: CircuitBreakerListeners);
    /**
     * Execute a function through the circuit breaker
     */
    execute<T>(fn: () => Promise<T> | T): Promise<T>;
    /**
     * Get current circuit breaker state
     */
    getState(): CircuitState;
    /**
     * Get current statistics
     */
    getStats(): CircuitBreakerStats;
    /**
     * Reset the circuit breaker to closed state
     */
    reset(): void;
    /**
     * Manually open the circuit
     */
    open(): void;
    /**
     * Manually close the circuit
     */
    close(): void;
    /**
     * Handle successful request
     */
    private handleSuccess;
    /**
     * Handle failed request
     */
    private handleFailure;
    /**
     * Transition to a new state
     */
    private transitionTo;
    /**
     * Check if recovery timeout has elapsed
     */
    private checkRecoveryTimeout;
    /**
     * Update error percentage
     */
    private updateErrorPercentage;
    /**
     * Reset counters (but not state)
     */
    private resetCounters;
    /**
     * Wrap a function with timeout
     */
    private withTimeout;
    /**
     * Cleanup timers
     */
    destroy(): void;
}
/**
 * Create a circuit breaker with default configuration
 */
export declare function createCircuitBreaker(config?: CircuitBreakerConfig, listeners?: CircuitBreakerListeners): CircuitBreaker;
//# sourceMappingURL=CircuitBreaker.d.ts.map