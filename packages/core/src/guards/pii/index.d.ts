/**
 * BonkLM - PII Guard
 * ============================
 * Detects and blocks Personally Identifiable Information (PII) in content.
 *
 * Features:
 * - US patterns: SSN, phone, driver's license, passport, Medicare, ITIN
 * - EU patterns: IBAN, NINO, NHS, tax IDs, national IDs (18 countries)
 * - Common patterns: Credit cards, email, IP, DOB, MAC address
 * - Algorithmic validators: Luhn, IBAN MOD-97, NHS MOD-11, etc.
 * - Context detection for reducing false positives
 * - Test file and fake data exclusion
 */
import { type ValidatorConfig } from '../../base/ValidatorConfig.js';
import { type PiiSeverity } from './patterns.js';
export interface PIIGuardConfig extends ValidatorConfig {
    /**
     * File path to check (for test file detection)
     */
    filePath?: string;
    /**
     * Enable test file bypass
     */
    allowTestFiles?: boolean;
    /**
     * Minimum severity level to trigger blocking
     */
    minSeverity?: PiiSeverity;
}
export interface PiiDetection {
    patternName: string;
    match: string;
    line: string;
    lineNumber: number;
    severity: PiiSeverity;
}
/**
 * Check if a file path indicates a test/mock data file.
 */
export declare function isTestFile(filePath: string | undefined): boolean;
/**
 * Check if the content/line is in a sensitive context.
 */
export declare function isSensitiveContext(content: string, line: string): boolean;
/**
 * Check if content around a match indicates fake/test data.
 */
export declare function isFakeData(content: string, line: string): boolean;
/**
 * Detect PII in content.
 */
export declare function detectPii(content: string): PiiDetection[];
export declare class PIIGuard {
    private readonly config;
    constructor(config?: PIIGuardConfig);
    /**
     * Validate content for PII
     */
    validate(content: string, filePath?: string): import('../../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get detected PII in content
     */
    detect(content: string): PiiDetection[];
    /**
     * Get the guard's configuration
     */
    getConfig(): PIIGuardConfig;
}
/**
 * Quick PII check.
 * @param content - Content to check
 * @param filePath - Optional file path for test file detection
 * @returns Validation result
 */
export declare function checkPII(content: string, filePath?: string): import('../../base/GuardrailResult.js').GuardrailResult;
export * from './validators.js';
export * from './patterns.js';
//# sourceMappingURL=index.d.ts.map