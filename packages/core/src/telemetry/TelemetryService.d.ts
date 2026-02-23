/**
 * Telemetry Service
 *
 * Provides centralized telemetry data collection for monitoring and observability.
 *
 * @package @blackunicorn/bonklm
 */
import type { Logger } from '../base/GenericLogger.js';
/**
 * Telemetry event types
 */
export declare enum TelemetryEventType {
    VALIDATION_START = "validation.start",
    VALIDATION_COMPLETE = "validation.complete",
    VALIDATION_BLOCKED = "validation.blocked",
    VALIDATION_ERROR = "validation.error",
    STREAM_START = "stream.start",
    STREAM_CHUNK = "stream.chunk",
    STREAM_BLOCKED = "stream.blocked",
    STREAM_COMPLETE = "stream.complete",
    API_CALL_START = "api.call.start",
    API_CALL_COMPLETE = "api.call.complete",
    API_CALL_ERROR = "api.call.error",
    CIRCUIT_OPEN = "circuit.open",
    CIRCUIT_HALF_OPEN = "circuit.half_open",
    CIRCUIT_CLOSE = "circuit.close",
    RETRY_ATTEMPT = "retry.attempt"
}
/**
 * Telemetry metrics
 */
export interface TelemetryMetrics {
    /** Duration in milliseconds */
    duration?: number;
    /** Token count for streaming */
    tokenCount?: number;
    /** Character count */
    charCount?: number;
    /** Number of validators executed */
    validatorCount?: number;
    /** Number of findings */
    findingCount?: number;
    /** Risk score */
    riskScore?: number;
    /** Number of retries */
    retryCount?: number;
    /** Custom metrics */
    [key: string]: number | undefined;
}
/**
 * Telemetry event data
 */
export interface TelemetryEvent {
    /** Event type */
    type: TelemetryEventType;
    /** Timestamp (milliseconds since epoch) - auto-set if not provided */
    timestamp?: number;
    /** Unique run/operation identifier */
    runId?: string;
    /** Parent run ID for nested operations */
    parentRunId?: string;
    /** Connector name */
    connector?: string;
    /** Operation name */
    operation?: string;
    /** Metrics */
    metrics?: TelemetryMetrics;
    /** Additional context */
    context?: Record<string, unknown>;
    /** Error details (for error events) */
    error?: {
        name: string;
        message: string;
        code?: string;
    };
}
/**
 * Telemetry data collector interface
 */
export interface TelemetryCollector {
    /** Collect a telemetry event */
    collect(event: TelemetryEvent): void | Promise<void>;
    /** Flush any buffered events */
    flush?(): void | Promise<void>;
    /** Shutdown the collector */
    shutdown?(): void | Promise<void>;
}
/**
 * Telemetry service options
 */
export interface TelemetryServiceOptions {
    /** Logger instance */
    logger?: Logger;
    /** Telemetry collectors */
    collectors?: TelemetryCollector[];
    /** Enable/disable telemetry */
    enabled?: boolean;
    /** Sample rate (0-1) for reducing telemetry volume */
    sampleRate?: number;
    /** Maximum number of events to buffer before flushing */
    maxBufferSize?: number;
    /** Flush interval in milliseconds */
    flushInterval?: number;
}
/**
 * Console telemetry collector for development/debugging
 */
export declare class ConsoleTelemetryCollector implements TelemetryCollector {
    private readonly logger?;
    constructor(logger?: Logger | undefined);
    collect(event: TelemetryEvent): void;
}
/**
 * Callback telemetry collector for user-defined handling
 */
export declare class CallbackTelemetryCollector implements TelemetryCollector {
    private readonly callback;
    constructor(callback: (event: TelemetryEvent) => void | Promise<void>);
    collect(event: TelemetryEvent): Promise<void>;
}
/**
 * Buffered telemetry collector for batching events
 */
export declare class BufferedTelemetryCollector implements TelemetryCollector {
    private readonly delegate;
    private readonly maxBufferSize;
    private readonly flushInterval;
    private buffer;
    private flushTimer?;
    constructor(delegate: TelemetryCollector, maxBufferSize?: number, flushInterval?: number);
    collect(event: TelemetryEvent): void;
    flush(): void;
    shutdown(): void;
    private startFlushTimer;
    private stopFlushTimer;
}
/**
 * Telemetry Service
 *
 * Centralized service for collecting and managing telemetry events.
 * Supports multiple collectors and sampling for high-volume scenarios.
 */
export declare class TelemetryService {
    private readonly options;
    private readonly collectors;
    private readonly logger;
    constructor(options?: TelemetryServiceOptions);
    /**
     * Record a telemetry event
     */
    record(event: TelemetryEvent): void;
    /**
     * Record validation start
     */
    recordValidationStart(config: {
        runId: string;
        connector?: string;
        content: string;
        direction: 'input' | 'output';
    }): void;
    /**
     * Record validation complete
     */
    recordValidationComplete(config: {
        runId: string;
        connector?: string;
        duration: number;
        validatorCount: number;
        findingCount: number;
        riskScore: number;
        allowed: boolean;
    }): void;
    /**
     * Record validation error
     */
    recordValidationError(config: {
        runId: string;
        connector?: string;
        error: Error;
    }): void;
    /**
     * Record stream start
     */
    recordStreamStart(config: {
        runId: string;
        connector?: string;
    }): void;
    /**
     * Record stream chunk
     */
    recordStreamChunk(config: {
        runId: string;
        connector?: string;
        tokenCount: number;
        charCount: number;
    }): void;
    /**
     * Record stream blocked
     */
    recordStreamBlocked(config: {
        runId: string;
        connector?: string;
        accumulatedLength: number;
    }): void;
    /**
     * Record API call start
     */
    recordApiCallStart(config: {
        runId: string;
        connector: string;
        method: string;
    }): void;
    /**
     * Record API call complete
     */
    recordApiCallComplete(config: {
        runId: string;
        connector: string;
        method: string;
        duration: number;
        success: boolean;
    }): void;
    /**
     * Flush all buffered events
     */
    flush(): void;
    /**
     * Shutdown the telemetry service
     */
    shutdown(): void;
    /**
     * Add a collector
     */
    addCollector(collector: TelemetryCollector): void;
    /**
     * Remove a collector
     */
    removeCollector(collector: TelemetryCollector): void;
}
/**
 * Create a telemetry service with default console collector
 */
export declare function createTelemetryService(options?: TelemetryServiceOptions): TelemetryService;
//# sourceMappingURL=TelemetryService.d.ts.map