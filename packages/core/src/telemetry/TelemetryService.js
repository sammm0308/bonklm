/**
 * Telemetry Service
 *
 * Provides centralized telemetry data collection for monitoring and observability.
 *
 * @package @blackunicorn/bonklm
 */
/**
 * Telemetry event types
 */
export var TelemetryEventType;
(function (TelemetryEventType) {
    TelemetryEventType["VALIDATION_START"] = "validation.start";
    TelemetryEventType["VALIDATION_COMPLETE"] = "validation.complete";
    TelemetryEventType["VALIDATION_BLOCKED"] = "validation.blocked";
    TelemetryEventType["VALIDATION_ERROR"] = "validation.error";
    TelemetryEventType["STREAM_START"] = "stream.start";
    TelemetryEventType["STREAM_CHUNK"] = "stream.chunk";
    TelemetryEventType["STREAM_BLOCKED"] = "stream.blocked";
    TelemetryEventType["STREAM_COMPLETE"] = "stream.complete";
    TelemetryEventType["API_CALL_START"] = "api.call.start";
    TelemetryEventType["API_CALL_COMPLETE"] = "api.call.complete";
    TelemetryEventType["API_CALL_ERROR"] = "api.call.error";
    TelemetryEventType["CIRCUIT_OPEN"] = "circuit.open";
    TelemetryEventType["CIRCUIT_HALF_OPEN"] = "circuit.half_open";
    TelemetryEventType["CIRCUIT_CLOSE"] = "circuit.close";
    TelemetryEventType["RETRY_ATTEMPT"] = "retry.attempt";
})(TelemetryEventType || (TelemetryEventType = {}));
/**
 * Default telemetry options
 */
const DEFAULT_OPTIONS = {
    enabled: true,
    sampleRate: 1.0,
    maxBufferSize: 100,
    flushInterval: 30000, // 30 seconds
};
/**
 * Console telemetry collector for development/debugging
 */
export class ConsoleTelemetryCollector {
    logger;
    constructor(logger) {
        this.logger = logger;
    }
    collect(event) {
        if (this.logger) {
            this.logger.debug('[Telemetry]', {
                type: event.type,
                runId: event.runId,
                operation: event.operation,
                metrics: event.metrics,
            });
        }
        else {
            console.debug('[Telemetry]', event.type, event.runId, event.metrics);
        }
    }
}
/**
 * Callback telemetry collector for user-defined handling
 */
export class CallbackTelemetryCollector {
    callback;
    constructor(callback) {
        this.callback = callback;
    }
    async collect(event) {
        await this.callback(event);
    }
}
/**
 * Buffered telemetry collector for batching events
 */
export class BufferedTelemetryCollector {
    delegate;
    maxBufferSize;
    flushInterval;
    buffer = [];
    flushTimer;
    constructor(delegate, maxBufferSize = 100, flushInterval = 30000) {
        this.delegate = delegate;
        this.maxBufferSize = maxBufferSize;
        this.flushInterval = flushInterval;
        this.startFlushTimer();
    }
    collect(event) {
        this.buffer.push(event);
        if (this.buffer.length >= this.maxBufferSize) {
            this.flush();
        }
    }
    flush() {
        if (this.buffer.length === 0)
            return;
        const events = this.buffer.splice(0);
        for (const event of events) {
            try {
                this.delegate.collect(event);
            }
            catch (error) {
                console.error('[Telemetry] Error flushing event:', error);
            }
        }
    }
    shutdown() {
        this.stopFlushTimer();
        this.flush();
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }
    stopFlushTimer() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
    }
}
/**
 * Telemetry Service
 *
 * Centralized service for collecting and managing telemetry events.
 * Supports multiple collectors and sampling for high-volume scenarios.
 */
export class TelemetryService {
    options;
    collectors;
    logger;
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
        this.collectors = options.collectors || [];
        this.logger = options.logger || console;
        // Wrap collectors in buffered collector if needed
        if (this.options.maxBufferSize > 0 && this.options.flushInterval > 0) {
            for (let i = 0; i < this.collectors.length; i++) {
                const collector = this.collectors[i];
                if (!(collector instanceof BufferedTelemetryCollector)) {
                    this.collectors[i] = new BufferedTelemetryCollector(collector, this.options.maxBufferSize, this.options.flushInterval);
                }
            }
        }
    }
    /**
     * Record a telemetry event
     */
    record(event) {
        if (!this.options.enabled)
            return;
        // Apply sampling
        if (this.options.sampleRate < 1.0 && Math.random() > this.options.sampleRate) {
            return;
        }
        // Ensure timestamp is set
        if (!event.timestamp) {
            event.timestamp = Date.now();
        }
        // Send to all collectors
        for (const collector of this.collectors) {
            try {
                collector.collect(event);
            }
            catch (error) {
                this.logger.warn('[Telemetry] Error collecting event', { error });
            }
        }
    }
    /**
     * Record validation start
     */
    recordValidationStart(config) {
        this.record({
            type: TelemetryEventType.VALIDATION_START,
            runId: config.runId,
            connector: config.connector,
            operation: `${config.direction}-validation`,
            metrics: {
                charCount: config.content.length,
            },
            context: {
                direction: config.direction,
            },
        });
    }
    /**
     * Record validation complete
     */
    recordValidationComplete(config) {
        this.record({
            type: config.allowed
                ? TelemetryEventType.VALIDATION_COMPLETE
                : TelemetryEventType.VALIDATION_BLOCKED,
            runId: config.runId,
            connector: config.connector,
            operation: 'validation',
            metrics: {
                duration: config.duration,
                validatorCount: config.validatorCount,
                findingCount: config.findingCount,
                riskScore: config.riskScore,
            },
            context: {
                allowed: config.allowed,
            },
        });
    }
    /**
     * Record validation error
     */
    recordValidationError(config) {
        this.record({
            type: TelemetryEventType.VALIDATION_ERROR,
            runId: config.runId,
            connector: config.connector,
            operation: 'validation',
            error: {
                name: config.error.name,
                message: config.error.message,
                code: config.error.code,
            },
        });
    }
    /**
     * Record stream start
     */
    recordStreamStart(config) {
        this.record({
            type: TelemetryEventType.STREAM_START,
            runId: config.runId,
            connector: config.connector,
            operation: 'stream',
        });
    }
    /**
     * Record stream chunk
     */
    recordStreamChunk(config) {
        this.record({
            type: TelemetryEventType.STREAM_CHUNK,
            runId: config.runId,
            connector: config.connector,
            operation: 'stream',
            metrics: {
                tokenCount: config.tokenCount,
                charCount: config.charCount,
            },
        });
    }
    /**
     * Record stream blocked
     */
    recordStreamBlocked(config) {
        this.record({
            type: TelemetryEventType.STREAM_BLOCKED,
            runId: config.runId,
            connector: config.connector,
            operation: 'stream',
            metrics: {
                charCount: config.accumulatedLength,
            },
        });
    }
    /**
     * Record API call start
     */
    recordApiCallStart(config) {
        this.record({
            type: TelemetryEventType.API_CALL_START,
            runId: config.runId,
            connector: config.connector,
            operation: config.method,
        });
    }
    /**
     * Record API call complete
     */
    recordApiCallComplete(config) {
        this.record({
            type: config.success
                ? TelemetryEventType.API_CALL_COMPLETE
                : TelemetryEventType.API_CALL_ERROR,
            runId: config.runId,
            connector: config.connector,
            operation: config.method,
            metrics: {
                duration: config.duration,
            },
        });
    }
    /**
     * Flush all buffered events
     */
    flush() {
        for (const collector of this.collectors) {
            if (collector.flush) {
                try {
                    collector.flush();
                }
                catch (err) {
                    this.logger.warn('[Telemetry] Error flushing collector', { error: err });
                }
            }
        }
    }
    /**
     * Shutdown the telemetry service
     */
    shutdown() {
        for (const collector of this.collectors) {
            if (collector.shutdown) {
                try {
                    collector.shutdown();
                }
                catch (err) {
                    this.logger.warn('[Telemetry] Error shutting down collector', { error: err });
                }
            }
        }
    }
    /**
     * Add a collector
     */
    addCollector(collector) {
        this.collectors.push(collector);
    }
    /**
     * Remove a collector
     */
    removeCollector(collector) {
        const index = this.collectors.indexOf(collector);
        if (index > -1) {
            this.collectors.splice(index, 1);
        }
    }
}
/**
 * Create a telemetry service with default console collector
 */
export function createTelemetryService(options) {
    const collectors = options?.collectors || [];
    // Add console collector if no collectors specified
    if (collectors.length === 0 && options?.enabled !== false) {
        collectors.push(new ConsoleTelemetryCollector(options?.logger));
    }
    return new TelemetryService({
        ...options,
        collectors,
    });
}
//# sourceMappingURL=TelemetryService.js.map