/**
 * Environment Configuration Manager
 *
 * This module provides secure atomic .env file management with:
 * - Atomic write operations using mkdtemp() for security (C-2 fix)
 * - Cross-platform permission handling (0o600 on Unix, icacls on Windows)
 * - Same-filesystem verification for atomic rename guarantees
 * - Automatic temp directory cleanup
 *
 * SECURITY: TOCTOU Race Condition Protection (C-2)
 * - Uses mkdtemp() for unpredictable temp directory names
 * - Atomic rename prevents partial writes
 * - Proper cleanup prevents temp file leakage
 *
 * SECURITY: Insecure Random Number Generation (HP-7)
 * - mkdtemp() uses crypto-random suffixes, not Date.now()
 * - No predictable temp file patterns
 */
/**
 * Manages environment file (.env) operations with atomic writes
 *
 * This class provides secure read, write, and merge operations for
 * .env files with automatic permission handling and atomic updates.
 *
 * @example
 * ```ts
 * const envManager = new EnvManager('.env');
 *
 * // Read existing values
 * const current = await envManager.read();
 *
 * // Write new values (merges with existing)
 * await envManager.write({ API_KEY: 'sk-...' });
 *
 * // Atomic replace (no merge)
 * await envManager.write({ NEW_KEY: 'value' }, false);
 * ```
 */
export declare class EnvManager {
    /**
     * Path to the .env file being managed
     */
    private readonly path;
    /**
     * Creates a new EnvManager instance
     *
     * @param path - Path to the .env file (default: '.env' in current directory)
     */
    constructor(path?: string);
    /**
     * Reads and parses the .env file
     *
     * Returns an empty object if the file doesn't exist.
     * Uses dotenv.parse() for proper parsing of:
     * - Comments (# prefix)
     * - Quoted values (single and double quotes)
     * - Multi-line values
     * - Export statements
     *
     * @returns Parsed environment variables as key-value pairs
     * @throws {WizardError} If file exists but cannot be read
     */
    read(): Promise<Record<string, string>>;
    /**
     * Writes environment variables to the .env file
     *
     * By default, merges with existing values (new values overwrite).
     * Set `merge` to false to replace all existing content.
     *
     * The write operation is atomic:
     * 1. Create secure temp directory with mkdtemp()
     * 2. Write content to temp file with secure permissions
     * 3. Verify same filesystem for atomic rename
     * 4. Atomic rename from temp to target
     * 5. Cleanup temp directory (even if rename fails)
     *
     * @param entries - Key-value pairs to write
     * @param merge - Whether to merge with existing values (default: true)
     * @throws {WizardError} If write operation fails
     */
    write(entries: Record<string, string>, merge?: boolean): Promise<void>;
    /**
     * Performs an atomic write operation
     *
     * SECURITY FIX C-2: Uses mkdtemp() instead of predictable filenames
     * - Creates temp directory with crypto-random suffix
     * - No race condition from predictable temp names
     * - Atomic rename guarantees either complete success or complete failure
     *
     * @param content - The content to write
     * @throws {WizardError} If atomic write fails
     */
    private writeAtomic;
    /**
     * Resolves symlinks in a path to prevent symlink attacks
     *
     * @param path - The path to resolve
     * @returns The resolved path without symlinks
     */
    private resolveSymlinks;
    /**
     * Verifies both paths are on the same filesystem
     *
     * Atomic rename is only guaranteed within the same filesystem.
     * Cross-filesystem rename performs copy+delete which is not atomic.
     *
     * @param from - Source path
     * @param to - Target path
     * @throws {WizardError} If paths are on different filesystems
     */
    private ensureSameFilesystem;
    /**
     * Sets platform-specific secure file permissions
     *
     * Unix/macOS: Uses chmod to set 0o600 (owner read/write only)
     * Windows: Uses icacls to disable inheritance
     *
     * @param filePath - Path to the file
     */
    private setSecurePermissions;
    /**
     * Sets Windows-specific file permissions using icacls
     *
     * The /inheritance:r flag removes inherited permissions,
     * leaving only explicitly granted permissions.
     *
     * SECURITY: If icacls fails, we try alternative methods
     * and throw an error if all methods fail (rather than silently continuing).
     *
     * @param filePath - Path to the file
     * @throws {WizardError} If unable to set secure permissions
     */
    private setWindowsPermissions;
    /**
     * Verifies the file is readable and writable
     *
     * Uses access() with R_OK and W_OK flags to verify
     * the current process can read and write the file.
     *
     * @param filePath - Path to verify
     * @throws {WizardError} If file is not accessible
     */
    private verifyPermissions;
    /**
     * Formats entries as .env file content
     *
     * Simple KEY=value format, one entry per line.
     * Values are written as-is (caller is responsible for proper escaping).
     *
     * SECURITY: Validates keys to prevent injection attacks.
     * Only allows alphanumeric characters, underscore, and valid shell variable names.
     *
     * @param entries - Key-value pairs to format
     * @returns Formatted .env content
     * @throws {WizardError} If a key contains invalid characters
     */
    private formatEntries;
    /**
     * Returns the path being managed
     *
     * @returns The .env file path
     */
    getPath(): string;
}
//# sourceMappingURL=env.d.ts.map