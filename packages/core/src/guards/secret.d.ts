/**
 * BonkLM - Secret Guard
 * ==============================
 * Detects and blocks hardcoded secrets, API keys, and credentials.
 *
 * Features:
 * - 30+ API key patterns for major providers
 * - Shannon entropy validation for generic secrets
 * - Example/placeholder content detection
 */
import { type GuardrailResult } from '../base/GuardrailResult.js';
import type { SecretGuardConfig } from '../base/ValidatorConfig.js';
type Confidence = 'critical' | 'high' | 'medium';
interface SecretDetection {
    secretType: string;
    match: string;
    line: string;
    lineNumber: number;
    confidence: Confidence;
}
/**
 * Secret Guard class.
 */
export declare class SecretGuard {
    private readonly config;
    private readonly logger;
    constructor(config?: SecretGuardConfig);
    /**
     * Detect secrets in content.
     */
    detect(content: string, filePath?: string): SecretDetection[];
    /**
     * Validate content for secrets.
     */
    validate(content: string, filePath?: string): GuardrailResult;
}
/**
 * Convenience function to validate content for secrets.
 */
export declare function validateSecrets(content: string, filePath?: string, config?: SecretGuardConfig): GuardrailResult;
export {};
//# sourceMappingURL=secret.d.ts.map