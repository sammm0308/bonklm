/**
 * BonkLM - Prompt Boundary Detector
 * ==========================================
 * Detects techniques that attempt to terminate system prompt sections
 * and inject attacker content at system level.
 *
 * Categories:
 * - Closing system tags: </system>, </s>, [/INST], [END SYSTEM]
 * - Control tokens: <|endoftext|>, </s>, <|im_start|>, <<SYS>>
 * - System prompt close markers: ---END SYSTEM PROMPT---, ===SYSTEM END===
 * - Meta-instruction boundaries: BEGIN USER CONTENT, END SYSTEM CONTENT
 */
import { type Severity } from '../base/GuardrailResult.js';
import { type ValidatorConfig } from '../base/ValidatorConfig.js';
export interface BoundaryFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    match: string;
    description: string;
}
export interface BoundaryDetectorConfig extends ValidatorConfig {
    /**
     * Enable detection of confusable variants (via normalized text)
     */
    detectConfusableVariants?: boolean;
}
/**
 * Detect prompt boundary manipulation attempts.
 * Runs on both raw content (pre-normalization) and normalized content
 * to catch confusable character variants.
 *
 * @param rawContent - Original content before normalization
 * @param normalizedContent - Content after normalizeText() processing (optional)
 * @returns Array of boundary manipulation findings
 */
export declare function detectBoundaryManipulation(rawContent: string, normalizedContent?: string): BoundaryFinding[];
export declare class BoundaryDetector {
    private readonly config;
    constructor(config?: BoundaryDetectorConfig);
    /**
     * Validate content for boundary manipulation attempts.
     */
    validate(content: string, normalizedContent?: string): import('../base/GuardrailResult.js').GuardrailResult;
    /**
     * Get the detector's configuration.
     */
    getConfig(): BoundaryDetectorConfig;
}
/**
 * Quick boundary manipulation detection.
 * @param content - Content to check
 * @param normalizedContent - Optional normalized content for confusable detection
 * @returns Detection result
 */
export declare function detectBoundary(content: string, normalizedContent?: string): import('../base/GuardrailResult.js').GuardrailResult;
//# sourceMappingURL=boundary-detector.d.ts.map