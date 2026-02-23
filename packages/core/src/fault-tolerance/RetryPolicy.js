/**
 * Retry Policy
 *
 * Implements retry logic with exponential backoff for transient failures.
 *
 * @package @blackunicorn/bonklm
 */
/**
 * Default retry configuration
 */
const DEFAULT_CONFIG = {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000, // 30 seconds
    jitter: 0.1, // 10% jitter
    enabled: true,
};
/**
 * Default retryable error codes (transient failures)
 */
const DEFAULT_RETRYABLE_CODES = [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'EPIPE',
    'ENOTFOUND',
    'EAI_AGAIN',
    // HTTP status codes
    '429', // Too Many Requests
    '502', // Bad Gateway
    '503', // Service Unavailable
    '504', // Gateway Timeout
];
/**
 * Default retryable error types
 */
const DEFAULT_RETRYABLE_TYPES = [
    'NetworkError',
    'TimeoutError',
];
/**
 * Retry Policy
 *
 * Implements retry logic with exponential backoff and jitter.
 * Supports configurable retry conditions for transient failures.
 */
export class RetryPolicy {
    config;
    retryableErrorCodes;
    retryableErrorTypes;
    logger;
    constructor(config = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config, logger: config.logger || console };
        this.retryableErrorCodes = new Set([
            ...DEFAULT_RETRYABLE_CODES,
            ...(config.retryableErrorCodes || []),
        ]);
        this.retryableErrorTypes = new Set([
            ...DEFAULT_RETRYABLE_TYPES,
            ...(config.retryableErrorTypes || []),
        ]);
        this.logger = this.config.logger;
    }
    /**
     * Execute a function with retry logic
     */
    async execute(fn) {
        if (!this.config.enabled) {
            try {
                const value = await fn({ attemptNumber: 1, delay: 0, remainingAttempts: 0 });
                return { success: true, value, attempts: 1, totalDelay: 0 };
            }
            catch (error) {
                return {
                    success: false,
                    error: error,
                    attempts: 1,
                    totalDelay: 0,
                };
            }
        }
        let lastError;
        let totalDelay = 0;
        let delay = this.config.initialDelay;
        for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
            const remainingAttempts = this.config.maxAttempts - attempt;
            try {
                const value = await fn({
                    attemptNumber: attempt,
                    delay,
                    remainingAttempts,
                });
                if (attempt > 1) {
                    this.logger.info(`[Retry] Success after ${attempt} attempts (total delay: ${totalDelay}ms)`);
                }
                return {
                    success: true,
                    value,
                    attempts: attempt,
                    totalDelay,
                };
            }
            catch (error) {
                lastError = error;
                // Check if error is retryable
                if (!this.isRetryableError(error) || attempt === this.config.maxAttempts) {
                    this.logger.warn(`[Retry] Non-retryable error or max attempts reached: ${lastError.message}`);
                    break;
                }
                // Calculate delay with jitter
                const actualDelay = this.calculateDelay(delay);
                totalDelay += actualDelay;
                this.logger.warn(`[Retry] Attempt ${attempt}/${this.config.maxAttempts} failed, retrying in ${actualDelay}ms: ${lastError.message}`);
                // Wait before retry
                await this.sleep(actualDelay);
                // Calculate next delay with exponential backoff
                delay = Math.min(delay * this.config.backoffMultiplier, this.config.maxDelay);
            }
        }
        return {
            success: false,
            error: lastError,
            attempts: this.config.maxAttempts,
            totalDelay,
        };
    }
    /**
     * Check if an error is retryable
     */
    isRetryableError(error) {
        // Check error code
        const code = error.code;
        if (code && this.retryableErrorCodes.has(String(code))) {
            return true;
        }
        // Check error type/name
        const name = error.name;
        if (name && this.retryableErrorTypes.has(name)) {
            return true;
        }
        // Check error message for common patterns
        const message = error.message.toLowerCase();
        if (message.includes('timeout') ||
            message.includes('network') ||
            message.includes('connection') ||
            message.includes('econnreset') ||
            message.includes('etimedout')) {
            return true;
        }
        return false;
    }
    /**
     * Calculate delay with jitter
     */
    calculateDelay(baseDelay) {
        if (this.config.jitter === 0) {
            return baseDelay;
        }
        // Add random jitter
        const jitterAmount = baseDelay * this.config.jitter;
        const randomJitter = (Math.random() - 0.5) * 2 * jitterAmount;
        return Math.max(0, Math.round(baseDelay + randomJitter));
    }
    /**
     * Sleep for specified milliseconds
     */
    sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Create a retry policy with default configuration
 */
export function createRetryPolicy(config) {
    return new RetryPolicy(config);
}
//# sourceMappingURL=RetryPolicy.js.map