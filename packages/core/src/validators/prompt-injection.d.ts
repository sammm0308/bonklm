/**
 * BonkLM - Prompt Injection Validator
 * =============================================
 * Detects attempts to manipulate AI agent behavior through injected instructions.
 *
 * Features:
 * - Multi-layer pattern-based detection (35+ patterns)
 * - Unicode normalization and obfuscation detection
 * - Base64 payload detection
 * - Multi-layer encoding detection
 * - HTML comment injection detection
 */
import { type GuardrailResult, Severity } from '../base/GuardrailResult.js';
import type { PromptInjectionConfig } from '../base/ValidatorConfig.js';
import { type UnicodeFinding } from './text-normalizer.js';
import { type PatternFinding } from './pattern-engine.js';
/**
 * Base64 finding.
 */
export interface Base64Finding {
    category: string;
    severity: Severity;
    match_preview: string;
    decoded_preview?: string;
    description: string;
    contains_injection: boolean;
}
/**
 * Multi-layer encoding finding.
 */
export interface MultiLayerEncodingFinding {
    category: string;
    severity: Severity;
    encoding_layers: string[];
    original_encoded: string;
    final_decoded: string;
    description: string;
    contains_injection: boolean;
    decode_depth: number;
}
/**
 * HTML comment finding.
 */
export interface HtmlCommentFinding {
    category: string;
    severity: Severity;
    comment_preview: string;
    description: string;
}
/**
 * Complete analysis result.
 */
export interface PromptInjectionAnalysisResult {
    findings: PatternFinding[];
    unicode_findings: UnicodeFinding[];
    base64_findings: Base64Finding[];
    html_findings: HtmlCommentFinding[];
    multi_layer_findings: MultiLayerEncodingFinding[];
    highest_severity: Severity;
    should_block: boolean;
}
/**
 * Prompt Injection Validator class.
 */
export declare class PromptInjectionValidator {
    private readonly config;
    private readonly logger;
    constructor(config?: PromptInjectionConfig);
    /**
     * Analyze content for prompt injection attempts.
     */
    analyze(content: string): PromptInjectionAnalysisResult;
    /**
     * Validate content for prompt injection.
     */
    validate(content: string): GuardrailResult;
}
/**
 * Convenience function to validate content.
 */
export declare function validatePromptInjection(content: string, config?: PromptInjectionConfig): GuardrailResult;
/**
 * Convenience function to analyze content.
 */
export declare function analyzePromptInjection(content: string, config?: PromptInjectionConfig): PromptInjectionAnalysisResult;
//# sourceMappingURL=prompt-injection.d.ts.map