/**
 * Fault tolerance module
 *
 * Provides circuit breaker and retry mechanisms for resilience.
 *
 * @package @blackunicorn/bonklm
 */
export { CircuitBreaker, createCircuitBreaker, CircuitBreakerOpenError, CircuitState, } from './CircuitBreaker.js';
export { RetryPolicy, createRetryPolicy, } from './RetryPolicy.js';
//# sourceMappingURL=index.js.map