/**
 * Monitoring Logger
 *
 * Enhanced logger with structured logging, metrics, and audit trails.
 *
 * @package @blackunicorn/bonklm
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Log level
 */
export declare enum MonitoringLogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    SILENT = 4
}
/**
 * Log entry
 */
export interface LogEntry {
    level: MonitoringLogLevel;
    timestamp: number;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string;
    };
    metadata?: {
        runId?: string;
        connector?: string;
        operation?: string;
        [key: string]: unknown;
    };
}
/**
 * Metrics data
 */
export interface MetricsData {
    counters: Record<string, number>;
    gauges: Record<string, number>;
    histograms: Record<string, number[]>;
    timestamps: Record<string, number>;
}
/**
 * Monitoring logger options
 */
export interface MonitoringLoggerOptions {
    /** Minimum log level */
    level?: MonitoringLogLevel;
    /** Enable JSON formatting */
    json?: boolean;
    /** Enable metrics collection */
    metrics?: boolean;
    /** Enable audit logging */
    audit?: boolean;
    /** Log prefix */
    prefix?: string;
    /** Custom logger implementation */
    logger?: Logger;
    /** Sample rate for debug logs (0-1) */
    sampleRate?: number;
}
/**
 * Monitoring Logger
 *
 * Enhanced logger with structured logging, metrics collection, and audit trails.
 */
export declare class MonitoringLogger implements Logger {
    private readonly options;
    private readonly baseLogger;
    private readonly metrics;
    private readonly auditLog;
    private readonly maxAuditEntries;
    constructor(options?: MonitoringLoggerOptions);
    /**
     * Log debug message
     */
    debug(message: string, context?: Record<string, unknown>): void;
    /**
     * Log info message
     */
    info(message: string, context?: Record<string, unknown>): void;
    /**
     * Log warning message
     */
    warn(message: string, context?: Record<string, unknown>): void;
    /**
     * Log error message
     */
    error(message: string, context?: Record<string, unknown>): void;
    /**
     * Increment a counter metric
     */
    incrementCounter(name: string, value?: number): void;
    /**
     * Set a gauge metric
     */
    setGauge(name: string, value: number): void;
    /**
     * Record a value in a histogram
     */
    recordHistogram(name: string, value: number): void;
    /**
     * Record a timestamp
     */
    recordTimestamp(name: string, timestamp?: number): void;
    /**
     * Get all metrics
     */
    getMetrics(): MetricsData;
    /**
     * Reset all metrics
     */
    resetMetrics(): void;
    /**
     * Get audit log
     */
    getAuditLog(): LogEntry[];
    /**
     * Clear audit log
     */
    clearAuditLog(): void;
    /**
     * Sanitize context to prevent sensitive data exposure in logs.
     * Uses format-preserving PII redaction for string values.
     * Redacts potentially sensitive fields like 'content', 'match', 'secret', etc.
     */
    private sanitizeContext;
    /**
     * Sanitize stack traces to remove sensitive information.
     * Removes file paths, line numbers, and variable values while preserving
     * the error structure for debugging.
     *
     * @param stack - The stack trace to sanitize
     * @returns Sanitized stack trace
     */
    private sanitizeStackTrace;
    /**
     * Log a structured entry
     */
    private log;
    /**
     * Create a child logger with additional metadata
     */
    child(_metadata: Record<string, unknown>): MonitoringLogger;
}
/**
 * Create a monitoring logger
 */
export declare function createMonitoringLogger(options?: MonitoringLoggerOptions): MonitoringLogger;
//# sourceMappingURL=MonitoringLogger.d.ts.map