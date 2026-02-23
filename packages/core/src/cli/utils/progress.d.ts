/**
 * Progress Indicators
 *
 * This module provides utilities for displaying progress during
 * long-running operations in the wizard.
 *
 * Features:
 * - Spinner wrapper for async operations
 * - Progress bars for multi-step operations
 * - TTY capability detection for graceful fallback
 *
 * @module utils/progress
 */
/**
 * Wraps an async operation with a spinner
 *
 * In TTY environments, shows an animated spinner.
 * In non-TTY environments, logs a simple message.
 *
 * @param message - The message to display
 * @param fn - The async function to execute
 * @returns Promise resolving to the function's result
 *
 * @example
 * ```ts
 * const result = await withSpinner('Loading data...', async () => {
 *   return await fetchData();
 * });
 * ```
 */
export declare function withSpinner<T>(message: string, fn: () => Promise<T>): Promise<T>;
/**
 * Creates a progress bar for multi-step operations
 *
 * @param total - Total number of steps
 * @returns Object with update method
 *
 * @example
 * ```ts
 * const progress = createProgressBar(100);
 * for (let i = 0; i < 100; i++) {
 *   await doWork();
 *   progress.update(i + 1);
 * }
 * progress.complete();
 * ```
 */
export declare function createProgressBar(total: number): {
    update: (value: number) => void;
    complete: () => void;
};
/**
 * Runs an operation with a timeout and progress display
 *
 * @param message - Message to display
 * @param fn - Async function to execute
 * @param timeout - Timeout in milliseconds
 * @returns Promise resolving to the result
 * @throws Error if timeout is exceeded
 *
 * @example
 * ```ts
 * const result = await withTimeout(
 *   'Connecting to API...',
 *   () => fetch('https://api.example.com'),
 *   5000
 * );
 * ```
 */
export declare function withTimeout<T>(message: string, fn: () => Promise<T>, timeout: number): Promise<T>;
/**
 * Creates a multi-step progress tracker
 *
 * @param steps - Array of step names
 * @returns Object with methods to track progress
 *
 * @example
 * ```ts
 * const tracker = createStepTracker(['Step 1', 'Step 2', 'Step 3']);
 * await tracker.run('Step 1', async () => { ... });
 * await tracker.run('Step 2', async () => { ... });
 * tracker.complete();
 * ```
 */
export declare function createStepTracker(steps: string[]): {
    run: (step: string, fn: () => Promise<unknown>) => Promise<unknown>;
    complete: () => void;
};
/**
 * Displays a group of tasks with individual status
 *
 * @param tasks - Array of {name, fn} tuples
 * @returns Array of results with status
 *
 * @example
 * ```ts
 * const results = await runTaskGroup([
 *   { name: 'Task 1', fn: async () => 'result1' },
 *   { name: 'Task 2', fn: async () => 'result2' },
 * ]);
 * ```
 */
export declare function runTaskGroup<T>(tasks: Array<{
    name: string;
    fn: () => Promise<T>;
}>): Promise<Array<{
    name: string;
    status: 'success' | 'error';
    result?: T;
    error?: string;
}>>;
//# sourceMappingURL=progress.d.ts.map