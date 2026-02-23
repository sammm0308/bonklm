/**
 * BonkLM - Bash Safety Guard
 * ==================================
 * Blocks dangerous bash commands that could cause irreversible damage.
 *
 * Features:
 * - Detects dangerous rm commands with path validation
 * - SQL injection pattern detection
 * - Command substitution detection
 * - Directory traversal detection
 * - Dangerous pattern blocking (dd, fork bomb, chmod 777, etc.)
 * - Pipe-to-bash detection (curl|bash, wget|bash)
 */
import { Severity as Sev } from '../base/GuardrailResult.js';
import { type ValidatorConfig } from '../base/ValidatorConfig.js';
export interface BashSafetyConfig extends ValidatorConfig {
    /**
     * Current working directory for path validation
     */
    cwd?: string;
    /**
     * Enable SQL injection detection
     */
    detectSqlInjection?: boolean;
    /**
     * Enable command substitution detection
     */
    detectCommandSubstitution?: boolean;
}
export interface BashFinding {
    category: string;
    pattern: string;
    severity: Sev;
    match: string;
    description: string;
}
/**
 * Split a command string into individual pipeline/chain segments
 */
export declare function splitCommandSegments(cmd: string): string[];
/**
 * Extract target paths from rm commands
 */
export declare function extractRmTargets(cmd: string): string[];
export interface SQLInjectionResult {
    isSQLi: boolean;
    testId?: string;
    subtype?: string;
    severity: string;
}
export declare function checkSQLInjection(cmd: string): SQLInjectionResult;
/**
 * Detect command substitution patterns
 */
export interface CommandSubstitution {
    type: string;
    match: string;
}
export declare function detectCommandSubstitution(cmd: string): CommandSubstitution[];
/**
 * Check for dangerous rm commands
 */
export declare function checkDangerousRm(cmd: string, cwd: string): {
    isDangerous: boolean;
    isAbsolute: boolean;
    message: string;
};
/**
 * Check for directory escape attempts
 */
export declare function checkDirectoryEscape(cmd: string, cwd: string): {
    isEscape: boolean;
    message: string;
};
/**
 * Check for other dangerous patterns
 */
export declare function checkDangerousPatterns(cmd: string): {
    isDangerous: boolean;
    message: string;
};
export declare class BashSafetyGuard {
    private readonly config;
    private logger;
    constructor(config?: BashSafetyConfig);
    /**
     * Validate a bash command for safety
     */
    validate(command: string): import('../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get the guard's configuration
     */
    getConfig(): BashSafetyConfig;
}
/**
 * Quick bash safety check.
 * @param command - Command to check
 * @param cwd - Current working directory (optional)
 * @returns Validation result
 */
export declare function checkBashSafety(command: string, cwd?: string): import('../base/GuardrailResult.js').GuardrailResult;
//# sourceMappingURL=bash-safety.d.ts.map