/**
 * BonkLM - XSS (Cross-Site Scripting) Safety Guard
 * ==========================================================
 * Detects XSS patterns in content to prevent cross-site scripting attacks.
 *
 * OWASP Coverage:
 * - A03-201: Reflected XSS detection
 * - A03-202: Stored XSS detection
 * - A03-203: DOM-based XSS detection
 * - A03-204: Event handler XSS detection
 * - A03-205: Polyglot XSS detection
 * - A03-206: CSS expression XSS detection
 * - A03-207: SVG XSS detection
 * - A03-208: JavaScript URI XSS detection
 */
import { Severity as Sev } from '../base/GuardrailResult.js';
import { type ValidatorConfig } from '../base/ValidatorConfig.js';
export interface XSSGuardConfig extends ValidatorConfig {
    /**
     * Context for the content (filename, content type)
     */
    context?: string;
    /**
     * Detection mode: 'strict' (block on any) or 'permissive' (block on critical only)
     */
    mode?: 'strict' | 'permissive';
}
export interface XSSDetectionResult {
    hasXSS: boolean;
    severity: Sev;
    patterns: XSSPattern[];
    message: string;
}
export interface XSSPattern {
    pattern: string;
    category: string;
    testId: string;
    line?: number;
}
/**
 * Detect XSS patterns in content
 */
export declare function detectXSS(content: string, context?: string): XSSDetectionResult;
export declare class XSSGuard {
    private readonly config;
    constructor(config?: XSSGuardConfig);
    /**
     * Validate content for XSS patterns
     */
    validate(content: string): import('../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get detailed XSS report
     */
    getXSSReport(content: string): string;
    /**
     * Get the guard's configuration
     */
    getConfig(): XSSGuardConfig;
}
/**
 * Quick XSS check.
 * @param content - Content to check
 * @param context - Optional context (filename, content type)
 * @returns Validation result
 */
export declare function checkXSS(content: string, context?: string): import('../base/GuardrailResult.js').GuardrailResult;
/**
 * Get XSS report for content.
 * @param content - Content to check
 * @param context - Optional context (filename, content type)
 * @returns Human-readable report
 */
export declare function getXSSReport(content: string, context?: string): string;
//# sourceMappingURL=xss-safety.d.ts.map