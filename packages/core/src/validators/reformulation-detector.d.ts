/**
 * BonkLM - Reformulation Detector
 * ========================================
 * Detects injection payloads disguised through various reformulation techniques.
 *
 * Detection Methods (TPI-09, TPI-10, TPI-11, TPI-13):
 * 1. Code format injection: Comments (10+ styles), markdown code blocks, variable/function names
 * 2. Character-level encoding: ROT13, ROT47, reverse text, acrostic, pig latin
 * 3. Context overload: Token flooding, many-shot, repetitive content
 * 4. Mathematical/logical encoding: Formal logic, pseudomath, conditional logic
 *
 * Ported from BMAD-CYBERSEC with framework-agnostic design.
 */
import { type GuardrailResult, Severity } from '../base/GuardrailResult.js';
import { type ReformulationConfig } from '../base/ValidatorConfig.js';
/**
 * Reformulation finding result.
 */
export interface ReformulationFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    source_type: string;
    extracted_text: string;
    description: string;
    weight?: number;
}
/**
 * Complete analysis result.
 */
export interface ReformulationAnalysisResult {
    findings: ReformulationFinding[];
    code_format_findings: ReformulationFinding[];
    character_encoding_findings: ReformulationFinding[];
    context_overload_findings: ReformulationFinding[];
    math_logic_findings: ReformulationFinding[];
    obfuscation_detected: boolean;
    session_escalated?: boolean;
    risk_score: number;
}
/**
 * ReformulationDetector - Main validator class
 *
 * Detects injection payloads disguised through reformulation techniques.
 */
export declare class ReformulationDetector {
    private readonly config;
    private readonly logger;
    constructor(config?: ReformulationConfig);
    /**
     * Analyze content for reformulation-based injection attempts.
     */
    analyze(content: string, sessionId?: string): ReformulationAnalysisResult;
    /**
     * Validate content and return a standardized GuardrailResult.
     */
    validate(content: string, sessionId?: string): GuardrailResult;
}
/**
 * Quick validation function for reformulation detection.
 */
export declare function validateReformulation(content: string, config?: ReformulationConfig): GuardrailResult;
/**
 * Analyze content for reformulation patterns (detailed result).
 */
export declare function analyzeReformulation(content: string, config?: ReformulationConfig): ReformulationAnalysisResult;
/**
 * Detect code format injection in content.
 */
export declare function detectCodeFormat(content: string): ReformulationFinding[];
/**
 * Detect character-level encoding in content.
 */
export declare function detectCharacterEncoding(content: string, maxSize?: number): ReformulationFinding[];
/**
 * Detect context overload in content.
 */
export declare function detectContextOverloadPatterns(content: string): ReformulationFinding[];
/**
 * Detect mathematical/logical encoding in content.
 */
export declare function detectMathLogic(content: string, maxSize?: number): ReformulationFinding[];
//# sourceMappingURL=reformulation-detector.d.ts.map