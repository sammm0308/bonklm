/**
 * Monitoring Logger
 *
 * Enhanced logger with structured logging, metrics, and audit trails.
 *
 * @package @blackunicorn/bonklm
 */
import { redactPIIInStringSync, redactPIIInObject } from '../guards/pii/validators.js';
/**
 * Log level
 */
export var MonitoringLogLevel;
(function (MonitoringLogLevel) {
    MonitoringLogLevel[MonitoringLogLevel["DEBUG"] = 0] = "DEBUG";
    MonitoringLogLevel[MonitoringLogLevel["INFO"] = 1] = "INFO";
    MonitoringLogLevel[MonitoringLogLevel["WARN"] = 2] = "WARN";
    MonitoringLogLevel[MonitoringLogLevel["ERROR"] = 3] = "ERROR";
    MonitoringLogLevel[MonitoringLogLevel["SILENT"] = 4] = "SILENT";
})(MonitoringLogLevel || (MonitoringLogLevel = {}));
/**
 * Default monitoring logger options
 */
const DEFAULT_OPTIONS = {
    level: MonitoringLogLevel.INFO,
    json: false,
    metrics: false,
    audit: false,
    prefix: '',
    sampleRate: 1.0,
};
/**
 * Monitoring Logger
 *
 * Enhanced logger with structured logging, metrics collection, and audit trails.
 */
export class MonitoringLogger {
    options;
    baseLogger;
    metrics = {
        counters: {},
        gauges: {},
        histograms: {},
        timestamps: {},
    };
    auditLog = [];
    maxAuditEntries = 1000;
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.baseLogger = options.logger || console;
    }
    /**
     * Log debug message
     */
    debug(message, context) {
        if (this.options.level <= MonitoringLogLevel.DEBUG) {
            this.log(MonitoringLogLevel.DEBUG, message, context);
        }
    }
    /**
     * Log info message
     */
    info(message, context) {
        if (this.options.level <= MonitoringLogLevel.INFO) {
            this.log(MonitoringLogLevel.INFO, message, context);
        }
    }
    /**
     * Log warning message
     */
    warn(message, context) {
        if (this.options.level <= MonitoringLogLevel.WARN) {
            this.log(MonitoringLogLevel.WARN, message, context);
        }
    }
    /**
     * Log error message
     */
    error(message, context) {
        if (this.options.level <= MonitoringLogLevel.ERROR) {
            this.log(MonitoringLogLevel.ERROR, message, context);
        }
    }
    /**
     * Increment a counter metric
     */
    incrementCounter(name, value = 1) {
        if (!this.options.metrics)
            return;
        this.metrics.counters[name] = (this.metrics.counters[name] || 0) + value;
    }
    /**
     * Set a gauge metric
     */
    setGauge(name, value) {
        if (!this.options.metrics)
            return;
        this.metrics.gauges[name] = value;
    }
    /**
     * Record a value in a histogram
     */
    recordHistogram(name, value) {
        if (!this.options.metrics)
            return;
        if (!this.metrics.histograms[name]) {
            this.metrics.histograms[name] = [];
        }
        this.metrics.histograms[name].push(value);
        // Keep only last 1000 values
        if (this.metrics.histograms[name].length > 1000) {
            this.metrics.histograms[name].shift();
        }
    }
    /**
     * Record a timestamp
     */
    recordTimestamp(name, timestamp = Date.now()) {
        if (!this.options.metrics)
            return;
        this.metrics.timestamps[name] = timestamp;
    }
    /**
     * Get all metrics
     */
    getMetrics() {
        return {
            counters: { ...this.metrics.counters },
            gauges: { ...this.metrics.gauges },
            histograms: Object.fromEntries(Object.entries(this.metrics.histograms).map(([k, v]) => [k, [...v]])),
            timestamps: { ...this.metrics.timestamps },
        };
    }
    /**
     * Reset all metrics
     */
    resetMetrics() {
        this.metrics.counters = {};
        this.metrics.gauges = {};
        this.metrics.histograms = {};
        this.metrics.timestamps = {};
    }
    /**
     * Get audit log
     */
    getAuditLog() {
        return [...this.auditLog];
    }
    /**
     * Clear audit log
     */
    clearAuditLog() {
        this.auditLog.length = 0;
    }
    /**
     * Sanitize context to prevent sensitive data exposure in logs.
     * Uses format-preserving PII redaction for string values.
     * Redacts potentially sensitive fields like 'content', 'match', 'secret', etc.
     */
    sanitizeContext(context) {
        if (!context)
            return undefined;
        const sanitized = { ...context };
        const sensitiveKeys = ['content', 'match', 'secret', 'token', 'password', 'key', 'credential'];
        for (const key of Object.keys(sanitized)) {
            const lowerKey = key.toLowerCase();
            const isSensitiveKey = sensitiveKeys.some(sk => lowerKey.includes(sk));
            const value = sanitized[key];
            if (isSensitiveKey) {
                // Apply PII redaction to sensitive fields
                if (typeof value === 'string' && value.length > 0) {
                    sanitized[key] = redactPIIInStringSync(value);
                }
                else if (Array.isArray(value)) {
                    // Redact each string element in the array
                    sanitized[key] = value.map((item) => typeof item === 'string' ? redactPIIInStringSync(item) :
                        typeof item === 'object' && item !== null ? this.sanitizeContext(item) :
                            item);
                }
                else if (typeof value === 'object' && value !== null) {
                    // Apply PII redaction to object values
                    sanitized[key] = redactPIIInObject(value);
                }
            }
            else {
                // For non-sensitive keys, still apply PII redaction as a safety measure
                if (typeof value === 'string') {
                    sanitized[key] = redactPIIInStringSync(value);
                }
                else if (Array.isArray(value)) {
                    // Redact each string element in the array
                    sanitized[key] = value.map((item) => typeof item === 'string' ? redactPIIInStringSync(item) :
                        typeof item === 'object' && item !== null ? this.sanitizeContext(item) :
                            item);
                }
                else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    // Recursively sanitize nested objects
                    sanitized[key] = this.sanitizeContext(value);
                }
            }
        }
        return sanitized;
    }
    /**
     * Sanitize stack traces to remove sensitive information.
     * Removes file paths, line numbers, and variable values while preserving
     * the error structure for debugging.
     *
     * @param stack - The stack trace to sanitize
     * @returns Sanitized stack trace
     */
    sanitizeStackTrace(stack) {
        if (!stack)
            return undefined;
        let sanitized = stack;
        // Remove file paths and line numbers from stack frames
        // Pattern: at FunctionName (/path/to/file.ts:123:45)
        sanitized = sanitized.replace(/\([^\s)]*\/[^\s)]*:\d+:\d+\)/g, '([REDACTED_FILE:LINE])');
        // Pattern: at FunctionName /path/to/file.ts:123:45
        sanitized = sanitized.replace(/at\s+[^\s]+\s+[^\s]+\/[^\s]+:\d+:\d+/g, 'at [FUNCTION] [REDACTED_FILE:LINE]');
        // Pattern: at filename.js:line:column (simple format without path)
        // Handle TypeScript and Node.js extensions: .js, .ts, .tsx, .mjs, .cjs
        sanitized = sanitized.replace(/at\s+[^\s]+\.(js|ts|tsx|mjs|cjs):\d+:\d+/g, 'at [FILE]:[LINE]');
        // Pattern: filename.js:line:column (standalone format)
        sanitized = sanitized.replace(/[^\s]+\.(js|ts|tsx|mjs|cjs):\d+:\d+/g, '[FILE]:[LINE]');
        // Handle async stack frames
        sanitized = sanitized.replace(/at\s+async\s+[^\s]+\s*\([^\)]*\)/g, 'at async [FUNCTION] ([REDACTED_FILE:LINE])');
        // Remove absolute paths from node internal modules
        sanitized = sanitized.replace(/node:[^\s]+/g, 'node:internal');
        // Remove potential credentials in error messages
        sanitized = redactPIIInStringSync(sanitized);
        return sanitized;
    }
    /**
     * Log a structured entry
     */
    log(level, message, context) {
        // Apply sampling for debug logs
        if (level === MonitoringLogLevel.DEBUG && this.options.sampleRate < 1.0) {
            if (Math.random() > this.options.sampleRate)
                return;
        }
        // Sanitize context to prevent sensitive data exposure
        const sanitizedContext = this.sanitizeContext(context);
        const entry = {
            level,
            timestamp: Date.now(),
            message: this.options.prefix ? `${this.options.prefix} ${message}` : message,
            context: sanitizedContext,
        };
        // Add error details if present
        if (context?.error instanceof Error) {
            const error = context.error;
            entry.error = {
                name: error.name,
                message: redactPIIInStringSync(error.message),
                stack: this.sanitizeStackTrace(error.stack),
                code: error.code,
            };
            // Remove error from context to avoid duplication
            const { error: _, ...rest } = sanitizedContext || {};
            entry.context = rest;
        }
        // Add metadata if present
        if (context?.metadata) {
            entry.metadata = context.metadata;
        }
        // Add to audit log if enabled
        if (this.options.audit && (level === MonitoringLogLevel.WARN || level === MonitoringLogLevel.ERROR)) {
            this.auditLog.push(entry);
            // Keep only last N entries
            if (this.auditLog.length > this.maxAuditEntries) {
                this.auditLog.shift();
            }
        }
        // Output the log
        if (this.options.json) {
            this.baseLogger.debug(JSON.stringify(entry));
        }
        else {
            const levelName = MonitoringLogLevel[level];
            const contextStr = sanitizedContext ? ` ${JSON.stringify(sanitizedContext)}` : '';
            this.baseLogger.debug(`[${levelName}] ${entry.message}${contextStr}`);
        }
    }
    /**
     * Create a child logger with additional metadata
     */
    child(_metadata) {
        const child = new MonitoringLogger({
            ...this.options,
            logger: this.baseLogger,
        });
        child.metrics.counters = { ...this.metrics.counters };
        child.metrics.gauges = { ...this.metrics.gauges };
        child.metrics.histograms = { ...this.metrics.histograms };
        child.metrics.timestamps = { ...this.metrics.timestamps };
        return child;
    }
}
/**
 * Create a monitoring logger
 */
export function createMonitoringLogger(options) {
    return new MonitoringLogger(options);
}
//# sourceMappingURL=MonitoringLogger.js.map