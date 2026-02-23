/**
 * Exit handling utilities for the BonkLM Installation Wizard
 *
 * This module provides utilities for graceful process termination with
 * proper cleanup and logging.
 */
import { type ExitCodeType } from './error.js';
/**
 * Exit handler options
 */
export interface ExitOptions {
    /** Message to display before exiting */
    message?: string;
    /** Whether to log to stderr (default: true for errors, false for success) */
    useStderr?: boolean;
}
/**
 * Exits the process with the specified exit code
 *
 * This is the primary exit function that should be used for all
 * programmatic exits. It ensures consistent behavior across the CLI.
 *
 * @param code - Exit code key (SUCCESS, ERROR, or PARTIAL)
 * @param options - Optional exit options
 * @returns Never returns (always exits)
 */
export declare function exit(code?: ExitCodeType, options?: ExitOptions): never;
/**
 * Exits with an error, using WizardError information if available
 *
 * This function handles both WizardError instances and generic errors,
 * providing appropriate output formatting and exit codes.
 *
 * @param error - The error that caused the exit
 * @param defaultExitCode - Default exit code if not specified in error
 * @returns Never returns (always exits)
 */
export declare function exitWithError(error: unknown, defaultExitCode?: ExitCodeType): never;
/**
 * Exits successfully with an optional message
 *
 * Convenience function for successful exits.
 *
 * @param message - Optional success message
 * @returns Never returns (always exits)
 */
export declare function exitSuccess(message?: string): never;
/**
 * Graceful shutdown handler
 *
 * Registers cleanup handlers for common termination signals.
 * Returns a cleanup function that should be called with any cleanup logic.
 *
 * @example
 * ```ts
 * const cleanup = registerShutdownHandlers();
 *
 * process.on('cleanup', async () => {
 *   await cleanup();
 * });
 * ```
 */
export declare function registerShutdownHandlers(cleanupFn?: () => void | Promise<void>): () => void;
/**
 * Wraps an async function with error handling that exits on failure
 *
 * This is useful for CLI command handlers that need to handle errors
 * consistently.
 *
 * @param fn - Async function to wrap
 * @param options - Optional exit options
 * @returns Wrapped function that exits on error
 */
export declare function withErrorHandling<TArgs extends unknown[]>(fn: (...args: TArgs) => Promise<void>, options?: {
    errorMessage?: string;
    successMessage?: string;
}): (...args: TArgs) => Promise<void>;
/**
 * Checks if the process is exiting
 *
 * Useful for preventing operations during shutdown.
 */
export declare function isExiting(): boolean;
//# sourceMappingURL=exit.d.ts.map