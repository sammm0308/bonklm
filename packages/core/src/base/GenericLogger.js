/**
 * Generic Logger Interface
 * ========================
 * Pluggable logging abstraction for BonkLM.
 * Supports console, pino, winston, or custom loggers.
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "debug";
    LogLevel["INFO"] = "info";
    LogLevel["WARN"] = "warn";
    LogLevel["ERROR"] = "error";
})(LogLevel || (LogLevel = {}));
/**
 * Console-based logger implementation (default)
 */
export class ConsoleLogger {
    level;
    readonly = {
        [LogLevel.DEBUG]: 0,
        [LogLevel.INFO]: 1,
        [LogLevel.WARN]: 2,
        [LogLevel.ERROR]: 3,
    };
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }
    shouldLog(level) {
        return this.readonly[level] >= this.readonly[this.level];
    }
    formatMessage(message, context) {
        if (!context || Object.keys(context).length === 0) {
            return message;
        }
        const contextStr = Object.entries(context)
            .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
            .join(' ');
        return `${message} ${contextStr}`;
    }
    debug(message, context) {
        if (this.shouldLog(LogLevel.DEBUG)) {
            console.debug(`[DEBUG] ${this.formatMessage(message, context)}`);
        }
    }
    info(message, context) {
        if (this.shouldLog(LogLevel.INFO)) {
            console.info(`[INFO] ${this.formatMessage(message, context)}`);
        }
    }
    warn(message, context) {
        if (this.shouldLog(LogLevel.WARN)) {
            console.warn(`[WARN] ${this.formatMessage(message, context)}`);
        }
    }
    error(message, context) {
        if (this.shouldLog(LogLevel.ERROR)) {
            console.error(`[ERROR] ${this.formatMessage(message, context)}`);
        }
    }
}
/**
 * Null logger for disabling output
 */
export class NullLogger {
    debug(_message, _context) { }
    info(_message, _context) { }
    warn(_message, _context) { }
    error(_message, _context) { }
}
/**
 * Create a logger instance based on configuration
 */
export function createLogger(type = 'console', level = LogLevel.INFO, customLogger) {
    switch (type) {
        case 'console':
            return new ConsoleLogger(level);
        case 'null':
            return new NullLogger();
        case 'custom':
            return customLogger ?? new ConsoleLogger(level);
        default:
            return new ConsoleLogger(level);
    }
}
//# sourceMappingURL=GenericLogger.js.map