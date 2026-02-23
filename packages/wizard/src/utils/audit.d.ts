/**
 * Audit Logging System
 *
 * This module provides tamper-evident audit logging for security-relevant events.
 *
 * SECURITY: Audit Log Tampering Protection (HP-5)
 * - HMAC signing for entry integrity verification
 * - File locking to prevent concurrent write corruption
 * - Secure file permissions (0o600 for files, 0o700 for directories)
 * - Never logs credentials (keys, tokens, secrets)
 *
 * The audit log uses JSONL format (one JSON object per line) with HMAC signatures.
 */
/**
 * Valid audit action types
 *
 * These represent all security-relevant actions in the wizard.
 * NEVER include credential values in audit events.
 */
export type AuditAction = 'connector_detected' | 'connector_added' | 'connector_removed' | 'connector_tested' | 'credential_validated' | 'env_written' | 'env_read' | 'wizard_started' | 'wizard_completed' | 'error_occurred';
/**
 * Audit event structure
 *
 * SECURITY CRITICAL: NEVER include credentials in audit events!
 * - No API keys, tokens, passwords, or secrets
 * - Only metadata about what action occurred
 * - connector_id identifies which connector, not the credential
 */
export interface AuditEvent {
    /** ISO 8601 timestamp */
    timestamp: string;
    /** Action that occurred */
    action: AuditAction;
    /** Optional connector identifier (never a credential value) */
    connector_id?: string;
    /** Whether the action succeeded */
    success: boolean;
    /** Optional error code if action failed */
    error_code?: string;
    /** Optional metadata (must not contain credentials) */
    metadata?: Record<string, unknown>;
}
/**
 * Manages audit logging with tamper-evident integrity
 *
 * This class provides secure audit logging with:
 * - HMAC signing for entry integrity (HP-5 fix)
 * - File locking for concurrent write safety (HP-5 fix)
 * - Secure permissions on files and directories
 * - JSONL format for easy parsing
 * - Never logs credentials
 *
 * @example
 * ```ts
 * const audit = new AuditLogger();
 *
 * await audit.log({
 *   action: 'connector_added',
 *   connector_id: 'openai',
 *   success: true,
 * });
 *
 * const recent = await audit.read(50);
 * ```
 */
export declare class AuditLogger {
    /**
     * Path to the audit log file
     */
    private readonly logPath;
    /**
     * Path to the audit directory
     */
    private readonly auditDir;
    /**
     * Creates a new AuditLogger instance
     *
     * @param auditDir - Path to audit directory (default: .bonklm)
     * @param logFile - Name of log file (default: audit.log)
     */
    constructor(auditDir?: string, logFile?: string);
    /**
     * Logs an audit event with HMAC signature
     *
     * SECURITY HP-5: Uses file locking to prevent concurrent write corruption
     * - Opens file with 'wx' flag (exclusive create) for locking
     * - Appends entry with HMAC signature
     * - Ensures directory exists with secure permissions
     *
     * @param event - The audit event to log
     * @throws {WizardError} If logging fails
     */
    log(event: AuditEvent): Promise<void>;
    /**
     * Reads recent audit events
     *
     * Returns the most recent N events (default 100).
     * Validates HMAC signatures and excludes tampered entries.
     *
     * SECURITY: Tampered entries are EXCLUDED from results to prevent
     * leaking potentially modified data. A separate method can be added
     * to audit log integrity if needed.
     *
     * @param limit - Maximum number of entries to return
     * @returns Array of valid audit events (most recent first)
     */
    read(limit?: number): Promise<AuditEvent[]>;
    /**
     * Validates that an event doesn't contain credential values
     *
     * SECURITY: Prevents accidental credential logging
     *
     * @param event - The event to validate
     * @throws {WizardError} If event contains potential credentials
     */
    private validateEventForCredentials;
    /**
     * Ensures the audit directory exists with secure permissions
     *
     * Creates the directory if it doesn't exist, setting
     * permissions to 0o700 (owner only).
     *
     * @throws {WizardError} If directory creation fails
     */
    private ensureAuditDirectory;
    /**
     * Returns the log file path
     *
     * @returns The path to the audit log file
     */
    getLogPath(): string;
    /**
     * Returns the audit directory path
     *
     * @returns The path to the audit directory
     */
    getAuditDir(): string;
}
/**
 * Creates a standard audit event for connector operations
 *
 * @param action - The audit action
 * @param connectorId - Optional connector identifier
 * @param success - Whether the operation succeeded
 * @param errorCode - Optional error code
 * @returns Formatted audit event
 */
export declare function createAuditEvent(action: AuditAction, connectorId: string | undefined, success: boolean, errorCode?: string): AuditEvent;
//# sourceMappingURL=audit.d.ts.map