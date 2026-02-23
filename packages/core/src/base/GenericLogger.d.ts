/**
 * Generic Logger Interface
 * ========================
 * Pluggable logging abstraction for BonkLM.
 * Supports console, pino, winston, or custom loggers.
 */
export declare enum LogLevel {
    DEBUG = "debug",
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export interface LogContext {
    [key: string]: unknown;
}
export interface Logger {
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
}
/**
 * Console-based logger implementation (default)
 */
export declare class ConsoleLogger implements Logger {
    private readonly level;
    private readonly readonly;
    constructor(level?: LogLevel);
    private shouldLog;
    private formatMessage;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext): void;
}
/**
 * Null logger for disabling output
 */
export declare class NullLogger implements Logger {
    debug(_message: string, _context?: LogContext): void;
    info(_message: string, _context?: LogContext): void;
    warn(_message: string, _context?: LogContext): void;
    error(_message: string, _context?: LogContext): void;
}
/**
 * Create a logger instance based on configuration
 */
export declare function createLogger(type?: 'console' | 'null' | 'custom', level?: LogLevel, customLogger?: Logger): Logger;
//# sourceMappingURL=GenericLogger.d.ts.map