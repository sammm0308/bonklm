/**
 * Secure Credential Handling
 *
 * This module provides the SecureCredential class for safely handling
 * sensitive credential values in memory. It uses Buffer.alloc() for
 * clean memory initialization and enforces size limits to prevent
 * DoS attacks through memory exhaustion.
 *
 * SECURITY: Buffer Overflow Protection (C-5)
 * - Maximum credential size: 8KB (8192 bytes)
 * - Uses Buffer.alloc() for zero-initialized memory
 * - Automatic memory zeroing on disposal
 *
 * SECURITY IMPORTANT: JavaScript Limitations
 * - Strings are immutable and cannot be zeroed from memory
 * - toString() returns a string that may persist in memory indefinitely
 * - ALWAYS use use() or useSync() for automatic scoping
 * - NEVER capture the return value of toString() in a variable
 * - The callback in use()/useSync() MUST NOT capture the credential string
 */
/**
 * Symbol for custom inspect method to prevent credential leakage
 */
declare const INSPECT_CUSTOM: unique symbol;
/**
 * Securely wraps sensitive credential values in memory
 *
 * This class provides secure memory handling for credentials:
 * - Uses Buffer.alloc() for clean (zero-initialized) memory
 * - Enforces 8KB size limit to prevent DoS
 * - Automatically zeros memory after use
 * - Provides try/finally pattern for automatic cleanup
 *
 * @example
 * ```ts
 * // Manual usage
 * const credential = new SecureCredential(apiKey);
 * try {
 *   const result = await validateApiKey(credential.toString());
 * } finally {
 *   credential.dispose();
 * }
 *
 * // Automatic cleanup with use()
 * const credential = new SecureCredential(apiKey);
 * await credential.use(async (key) => {
 *   return await validateApiKey(key);
 * });
 * // Memory is already zeroed here
 * ```
 */
export declare class SecureCredential {
    /**
     * The underlying buffer containing the credential
     *
     * Marked private to prevent direct access
     */
    private buffer;
    /**
     * Track whether this credential has been disposed
     *
     * When true, toString() returns empty string instead of
     * accessing the zeroed buffer
     */
    private disposed;
    /**
     * Track whether use()/useSync() is currently active
     *
     * Prevents re-entry attacks and concurrent access
     */
    private inUse;
    /**
     * Creates a new SecureCredential
     *
     * @param value - The credential value to store securely
     * @throws {WizardError} If the credential exceeds MAX_CREDENTIAL_SIZE
     */
    constructor(value: string);
    /**
     * Returns the credential as a string
     *
     * This returns the actual credential value. Use with caution
     * and ensure the value is not logged or exposed in error messages.
     *
     * @returns The credential value as a UTF-8 string
     */
    toString(): string;
    /**
     * Securely zeros the memory containing the credential
     *
     * This method overwrites the buffer with zeros to prevent
     * credential data from remaining in memory.
     *
     * @security Note: JavaScript garbage collection means the memory may
     * be reallocated before being overwritten. This is a best-effort
     * security measure. The original string passed to the constructor
     * also remains in memory until garbage collected.
     *
     * After calling dispose(), the credential should not be used again.
     *
     * @example
     * ```ts
     * const credential = new SecureCredential(apiKey);
     * // ... use the credential ...
     * credential.dispose(); // Memory is zeroed
     * ```
     */
    dispose(): void;
    /**
     * Executes a callback with automatic credential cleanup
     *
     * This is the RECOMMENDED way to use credentials as it ensures
     * the memory is always zeroed, even if the callback throws an error.
     *
     * @param fn - Async callback function that receives the credential string
     * @returns The result of the callback function
     * @throws {WizardError} If the credential has already been disposed or is in use
     *
     * @security
     * The callback MUST NOT capture the credential string in a closure,
     * store it in a variable, or return it. Doing so completely bypasses
     * the security mechanism.
     *
     * @example
     * ```ts
     * const credential = new SecureCredential(apiKey);
     * const result = await credential.use(async (key) => {
     *   // Use key inline, DO NOT assign to a variable
     *   return await fetch('https://api.example.com/validate', {
     *     headers: { 'Authorization': `Bearer ${key}` }
     *   });
     * });
     * // credential.dispose() was already called automatically
     * ```
     */
    use<T>(fn: (credential: string) => Promise<T>): Promise<T>;
    /**
     * Synchronous version of use() for non-async callbacks
     * @param fn - Callback function that receives the credential string
     * @returns The result of the callback function
     * @throws {WizardError} If the credential has already been disposed or is in use
     * @security The callback MUST NOT capture the credential string.
     */
    useSync<T>(fn: (credential: string) => T): T;
    /** Returns whether this credential has been disposed */
    get isDisposed(): boolean;
    /** Custom inspect to prevent credential leakage in console.log */
    [INSPECT_CUSTOM](): string;
    /** Custom toJSON to prevent credential leakage in JSON.stringify */
    toJSON(): string;
    /** Custom valueOf to prevent accidental credential exposure */
    valueOf(): undefined;
}
/** Callback type for async use() method */
export type CredentialCallback<T> = (credential: string) => Promise<T>;
/** Callback type for sync useSync() method */
export type CredentialCallbackSync<T> = (credential: string) => T;
/** Error codes specific to SecureCredential */
export declare const SecureCredentialError: {
    readonly TOO_LARGE: "CREDENTIAL_TOO_LARGE";
    readonly DISPOSED: "CREDENTIAL_DISPOSED";
    readonly IN_USE: "CREDENTIAL_IN_USE";
};
export {};
//# sourceMappingURL=secure-credential.d.ts.map