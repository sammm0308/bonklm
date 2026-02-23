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
import type { EventEmitter } from 'events';
export type SecurityLevel = 'strict' | 'standard' | 'permissive';
export interface SandboxConfig {
    /**
     * Security level for sandbox execution
     */
    securityLevel?: SecurityLevel;
    /**
     * Maximum execution time in milliseconds
     */
    timeout?: number;
    /**
     * Maximum memory size in bytes
     */
    maxMemory?: number;
    /**
     * Maximum CPU time in milliseconds
     */
    maxCpuTime?: number;
    /**
     * Allow async operations (setTimeout, setInterval)
     */
    allowAsyncOperations?: boolean;
    /**
     * Log all executions
     */
    logExecutions?: boolean;
}
export interface ExecutionContext {
    [key: string]: unknown;
}
export interface ExecutionResult {
    success: boolean;
    executionId: string;
    result?: unknown;
    error?: string;
    message?: string;
    duration?: number;
    sandboxed: boolean;
    blocked?: boolean;
}
export interface CodeValidationResult {
    safe: boolean;
    issues: string[];
}
export interface ExecutionLog {
    executionId: string;
    timestamp: string;
    duration?: number;
    success?: boolean;
    error?: string;
    resultType?: string;
}
export interface BlockedAttempt {
    executionId: string;
    timestamp: string;
    issues: string[];
}
export interface SandboxStatistics {
    totalExecutions: number;
    blockedAttempts: number;
    securityLevel: SecurityLevel;
    averageExecutionTime: number;
}
export declare const SECURITY_LEVELS: {
    readonly STRICT: "strict";
    readonly STANDARD: "standard";
    readonly PERMISSIVE: "permissive";
};
export declare const BLOCKED_GLOBALS: readonly ["process", "require", "__dirname", "__filename", "module", "exports", "global", "globalThis", "eval", "Function", "WebAssembly"];
export declare const SAFE_GLOBALS: readonly ["console", "JSON", "Math", "Date", "Array", "Object", "String", "Number", "Boolean", "Map", "Set", "WeakMap", "WeakSet", "Promise", "Symbol", "RegExp", "Error", "TypeError", "RangeError", "SyntaxError", "parseInt", "parseFloat", "isNaN", "isFinite", "encodeURI", "encodeURIComponent", "decodeURI", "decodeURIComponent", "setTimeout", "setInterval", "clearTimeout", "clearInterval"];
export declare class HookSandbox {
    private readonly config;
    private executionLog;
    private blockedAttempts;
    private isInitialized;
    private eventEmitter?;
    constructor(config?: SandboxConfig);
    /**
     * Initialize the sandbox
     */
    initialize(): Promise<boolean>;
    /**
     * Execute a hook handler in a sandboxed environment
     * @param handler - The hook handler (function or code string)
     * @param context - The execution context to pass to the hook
     * @param options - Execution options
     * @returns Execution result
     */
    executeHook(handler: string | ((context: ExecutionContext) => unknown), context?: ExecutionContext, options?: Partial<SandboxConfig>): Promise<ExecutionResult>;
    /**
     * Validate hook code before execution
     */
    validateHookCode(code: string): CodeValidationResult;
    /**
     * Get execution statistics
     */
    getStatistics(): SandboxStatistics;
    /**
     * Get blocked attempts log
     */
    getBlockedAttempts(): BlockedAttempt[];
    /**
     * Get the sandbox configuration
     */
    getConfig(): SandboxConfig;
    private validateEnvironment;
    private createSandboxContext;
    private createSafeConsole;
    private extractFunctionCode;
    private wrapStringCode;
    private validateCode;
    private tryDecodeEscapes;
    private executeInVm;
    private deepFreeze;
    private sanitizeResult;
    private logExecution;
    private logBlockedAttempt;
    private calculateAverageTime;
    private emit;
    /**
     * Get the event emitter for subscribing to sandbox events
     */
    getEventEmitter(): EventEmitter | undefined;
}
//# sourceMappingURL=HookSandbox.d.ts.map