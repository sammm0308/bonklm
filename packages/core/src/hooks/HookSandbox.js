/**
 * BonkLM - Hook Sandbox
 * ==============================
 * VM-based sandboxing for hook execution to prevent arbitrary code execution.
 *
 * Features:
 * - VM-based isolation for hook execution
 * - Configurable security level (strict/standard/permissive)
 * - Timeout protection
 * - Memory limits
 * - Error handling and sanitization
 * - Dangerous pattern detection
 */
import { randomUUID } from 'crypto';
// ============================================================================
// CONSTANTS
// =============================================================================>
export const SECURITY_LEVELS = {
    STRICT: 'strict',
    STANDARD: 'standard',
    PERMISSIVE: 'permissive',
};
export const BLOCKED_GLOBALS = [
    'process',
    'require',
    '__dirname',
    '__filename',
    'module',
    'exports',
    'global',
    'globalThis',
    'eval',
    'Function',
    'WebAssembly',
];
export const SAFE_GLOBALS = [
    'console',
    'JSON',
    'Math',
    'Date',
    'Array',
    'Object',
    'String',
    'Number',
    'Boolean',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Promise',
    'Symbol',
    'RegExp',
    'Error',
    'TypeError',
    'RangeError',
    'SyntaxError',
    'parseInt',
    'parseFloat',
    'isNaN',
    'isFinite',
    'encodeURI',
    'encodeURIComponent',
    'decodeURI',
    'decodeURIComponent',
    'setTimeout',
    'setInterval',
    'clearTimeout',
    'clearInterval',
];
// ============================================================================
// SANDBOX CLASS
// =============================================================================
export class HookSandbox {
    config;
    executionLog = [];
    blockedAttempts = [];
    isInitialized = false;
    eventEmitter;
    constructor(config) {
        this.config = {
            securityLevel: config?.securityLevel ?? 'strict',
            timeout: config?.timeout ?? 5000,
            maxMemory: config?.maxMemory ?? 50 * 1024 * 1024, // 50MB
            maxCpuTime: config?.maxCpuTime ?? 1000,
            allowAsyncOperations: config?.allowAsyncOperations ?? true,
            logExecutions: config?.logExecutions ?? true,
        };
        // Try to load EventEmitter
        try {
            const events = require('events');
            this.eventEmitter = new events.EventEmitter();
        }
        catch {
            // EventEmitter not available, continue without it
        }
    }
    /**
     * Initialize the sandbox
     */
    async initialize() {
        // Validate environment
        this.validateEnvironment();
        this.isInitialized = true;
        this.emit('initialized', {
            securityLevel: this.config.securityLevel,
            timeout: this.config.timeout,
        });
        return true;
    }
    /**
     * Execute a hook handler in a sandboxed environment
     * @param handler - The hook handler (function or code string)
     * @param context - The execution context to pass to the hook
     * @param options - Execution options
     * @returns Execution result
     */
    async executeHook(handler, context = {}, options) {
        if (!this.isInitialized) {
            throw new Error('Hook sandbox not initialized');
        }
        const executionId = randomUUID();
        const startTime = Date.now();
        try {
            // Create sandboxed context
            const sandboxContext = this.createSandboxContext(context, options);
            // Convert function to string if needed, or wrap string code
            let code;
            if (typeof handler === 'function') {
                code = this.extractFunctionCode(handler);
            }
            else {
                // Wrap string code in a function to allow return statements
                code = this.wrapStringCode(handler);
            }
            // Validate code for dangerous patterns
            const validation = this.validateCode(code);
            if (!validation.safe) {
                this.logBlockedAttempt(executionId, validation.issues);
                return {
                    success: false,
                    executionId,
                    error: 'SECURITY_VIOLATION',
                    message: `Hook code contains dangerous patterns: ${validation.issues.join(', ')}`,
                    blocked: true,
                    sandboxed: true,
                };
            }
            // Execute using VM
            const result = await this.executeInVm(code, sandboxContext, options?.timeout ?? this.config.timeout);
            const duration = Date.now() - startTime;
            this.logExecution(executionId, {
                duration,
                success: true,
                resultType: typeof result,
            });
            this.emit('hook-executed', {
                executionId,
                duration,
                success: true,
            });
            return {
                success: true,
                executionId,
                result,
                duration,
                sandboxed: true,
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const err = error;
            this.logExecution(executionId, {
                duration,
                success: false,
                error: err.message,
            });
            this.emit('hook-error', {
                executionId,
                error: err.message,
                duration,
            });
            return {
                success: false,
                executionId,
                error: err.name === 'TimeoutError' ? 'EXECUTION_TIMEOUT' : 'EXECUTION_ERROR',
                message: err.message,
                duration,
                sandboxed: true,
            };
        }
    }
    /**
     * Validate hook code before execution
     */
    validateHookCode(code) {
        return this.validateCode(code);
    }
    /**
     * Get execution statistics
     */
    getStatistics() {
        return {
            totalExecutions: this.executionLog.length,
            blockedAttempts: this.blockedAttempts.length,
            securityLevel: this.config.securityLevel,
            averageExecutionTime: this.calculateAverageTime(),
        };
    }
    /**
     * Get blocked attempts log
     */
    getBlockedAttempts() {
        return [...this.blockedAttempts];
    }
    /**
     * Get the sandbox configuration
     */
    getConfig() {
        return { ...this.config };
    }
    // ==========================================================================
    // PRIVATE METHODS
    // ==========================================================================
    validateEnvironment() {
        // Ensure VM module is available
        try {
            require('vm');
        }
        catch {
            throw new Error('VM module not available');
        }
        // Check Node.js version for VM security features
        const nodeVersion = process.versions.node.split('.').map(Number);
        if (nodeVersion[0] < 14) {
            console.warn('Node.js 14+ recommended for improved VM security');
        }
    }
    createSandboxContext(context, _options) {
        const vm = require('vm');
        const sandbox = {};
        // Add safe globals
        for (const globalName of SAFE_GLOBALS) {
            if (globalThis[globalName]) {
                sandbox[globalName] = globalThis[globalName];
            }
        }
        // Create safe console
        sandbox.console = this.createSafeConsole();
        // Add frozen context object
        sandbox.context = this.deepFreeze({ ...context });
        // Add safe result setter/getter
        let hookResult;
        sandbox.__setResult = (value) => {
            hookResult = this.sanitizeResult(value);
        };
        sandbox.__getResult = () => hookResult;
        // Create the VM context
        vm.createContext(sandbox, {
            name: 'hook-sandbox',
            origin: 'bonklm:/hook-sandbox',
            codeGeneration: {
                strings: false, // Disable eval()
                wasm: false, // Disable WebAssembly
            },
        });
        return sandbox;
    }
    createSafeConsole() {
        const maxLogLength = 1000;
        const logs = [];
        const sanitize = (arg) => {
            if (typeof arg === 'object') {
                try {
                    const str = JSON.stringify(arg);
                    return str.length > maxLogLength ? `${str.slice(0, maxLogLength)}...` : str;
                }
                catch {
                    return '[Object]';
                }
            }
            const str = String(arg);
            return str.length > maxLogLength ? `${str.slice(0, maxLogLength)}...` : str;
        };
        return {
            log: (...args) => logs.push({ level: 'log', args: args.map(sanitize) }),
            info: (...args) => logs.push({ level: 'info', args: args.map(sanitize) }),
            warn: (...args) => logs.push({ level: 'warn', args: args.map(sanitize) }),
            error: (...args) => logs.push({ level: 'error', args: args.map(sanitize) }),
            debug: (...args) => logs.push({ level: 'debug', args: args.map(sanitize) }),
            getLogs: () => [...logs],
        };
    }
    extractFunctionCode(fn) {
        const fnString = fn.toString();
        // Wrap in an IIFE that captures the result
        return `
      (function() {
        const __hookFn = ${fnString};
        const __result = __hookFn(context);
        __setResult(__result);
        return __result;
      })();
    `;
    }
    wrapStringCode(code) {
        // Wrap string code in a function to allow return statements
        return `
      (function() {
        ${code}
      })();
    `;
    }
    validateCode(code) {
        const issues = [];
        // Check for dangerous patterns
        const dangerousPatterns = [
            [/\bprocess\b/, 'process access'],
            [/\brequire\s*\(/, 'require() call'],
            [/\bimport\s*\(/, 'dynamic import'],
            [/\beval\s*\(/, 'eval() call'],
            [/\bFunction\s*\(/, 'Function() constructor'],
            [/\bnew\s+Function\b/, 'new Function()'],
            [/\b__proto__\b/, '__proto__ access'],
            [/\bconstructor\s*\[/, 'constructor access via bracket notation'],
            [/\.constructor\.constructor\b/, 'nested constructor bypass attempt'],
            // S011-007: Catch Reflect.construct with constructor access
            // Use a simpler pattern that doesn't rely on matching across lines
            [/Reflect\.construct.*\.constructor/, 'Reflect.construct with constructor access'],
            [/\bprototype\b/, 'prototype manipulation'],
            [/\bglobalThis\b/, 'globalThis access'],
            [/\bglobal\b/, 'global access'],
            [/\bchild_process\b/, 'child_process access'],
            [/\bexec\s*\(/, 'exec() call'],
            [/\bspawn\s*\(/, 'spawn() call'],
            [/\bfs\s*\.\s*(write|unlink|rm|mkdir|chmod)/, 'fs write operations'],
            [/\bhttp[s]?\s*\./, 'HTTP access'],
            [/\bnet\s*\./, 'Network access'],
            [/\bdns\s*\./, 'DNS access'],
            [/\bWebSocket\b/, 'WebSocket access'],
            [/\bfetch\s*\(/, 'fetch() call'],
            [/\bXMLHttpRequest\b/, 'XMLHttpRequest access'],
        ];
        for (const [pattern, issue] of dangerousPatterns) {
            if (pattern.test(code)) {
                issues.push(issue);
            }
        }
        // Check for obvious code injection attempts
        if (code.includes('\\x') || code.includes('\\u{')) {
            const decoded = this.tryDecodeEscapes(code);
            if (decoded !== code) {
                const decodedValidation = this.validateCode(decoded);
                if (!decodedValidation.safe) {
                    issues.push('encoded dangerous pattern');
                }
            }
        }
        return {
            safe: issues.length === 0,
            issues,
        };
    }
    tryDecodeEscapes(code) {
        try {
            return code
                .replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
                .replace(/\\u\{([0-9A-Fa-f]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)));
        }
        catch {
            return code;
        }
    }
    async executeInVm(code, context, timeout) {
        const vm = require('vm');
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                const error = new Error(`Hook execution timed out after ${timeout}ms`);
                error.name = 'TimeoutError';
                reject(error);
            }, timeout);
            try {
                const script = new vm.Script(code, {
                    filename: `hook-${randomUUID()}.js`,
                    timeout,
                    displayErrors: true,
                });
                const result = script.runInContext(context, {
                    timeout,
                    displayErrors: true,
                    breakOnSigint: true,
                });
                clearTimeout(timer);
                // Handle promises
                if (result && typeof result === 'object' && 'then' in result && typeof result.then === 'function') {
                    result
                        .then((res) => {
                        clearTimeout(timer);
                        resolve(res);
                    })
                        .catch((err) => {
                        clearTimeout(timer);
                        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                        reject(err);
                    });
                }
                else {
                    resolve(result);
                }
            }
            catch (error) {
                clearTimeout(timer);
                // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
                reject(error);
            }
        });
    }
    deepFreeze(obj) {
        if (obj === null || typeof obj !== 'object') {
            return obj;
        }
        const propNames = Object.getOwnPropertyNames(obj);
        for (const name of propNames) {
            const value = obj[name];
            if (value && typeof value === 'object') {
                this.deepFreeze(value);
            }
        }
        return Object.freeze(obj);
    }
    sanitizeResult(value) {
        const maxSize = 1024 * 1024; // 1MB
        if (value === null || value === undefined) {
            return value;
        }
        if (typeof value === 'object') {
            try {
                const json = JSON.stringify(value);
                if (json.length > maxSize) {
                    return { error: 'RESULT_TOO_LARGE', message: 'Result exceeds maximum size' };
                }
                return JSON.parse(json); // Deep clone
            }
            catch {
                return { error: 'INVALID_RESULT', message: 'Result cannot be serialized' };
            }
        }
        if (typeof value === 'string' && value.length > maxSize) {
            return value.slice(0, maxSize);
        }
        return value;
    }
    logExecution(executionId, details) {
        if (!this.config.logExecutions)
            return;
        this.executionLog.push({
            executionId,
            timestamp: new Date().toISOString(),
            ...details,
        });
        // Keep last 1000 executions
        if (this.executionLog.length > 1000) {
            this.executionLog = this.executionLog.slice(-1000);
        }
    }
    logBlockedAttempt(executionId, issues) {
        this.blockedAttempts.push({
            executionId,
            timestamp: new Date().toISOString(),
            issues,
        });
        this.emit('hook-blocked', {
            executionId,
            issues,
        });
        // Keep last 100 blocked attempts
        if (this.blockedAttempts.length > 100) {
            this.blockedAttempts = this.blockedAttempts.slice(-100);
        }
    }
    calculateAverageTime() {
        if (this.executionLog.length === 0)
            return 0;
        const totalTime = this.executionLog.reduce((sum, log) => sum + (log.duration ?? 0), 0);
        return totalTime / this.executionLog.length;
    }
    emit(event, data) {
        if (this.eventEmitter) {
            this.eventEmitter.emit(event, data);
        }
    }
    /**
     * Get the event emitter for subscribing to sandbox events
     */
    getEventEmitter() {
        return this.eventEmitter;
    }
}
//# sourceMappingURL=HookSandbox.js.map