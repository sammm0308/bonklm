/**
 * BonkLM - Jailbreak Validator
 * =====================================
 * Multi-layer defense against AI jailbreak attempts.
 *
 * Detection Layers:
 * 1. Unicode normalization and confusable character mapping
 * 2. Pattern matching (44 patterns across 10 categories)
 * 3. Multi-turn pattern detection
 * 4. Fuzzy matching for keyword variations
 * 5. Heuristic behavioral analysis
 * 6. Session risk tracking with decay and escalation
 *
 * Ported from BMAD-CYBERSEC with framework-agnostic design.
 */
import { type GuardrailResult, Severity } from '../base/GuardrailResult.js';
import { type JailbreakConfig } from '../base/ValidatorConfig.js';
import { type RegexCache } from './pattern-engine.js';
/**
 * Jailbreak finding result.
 */
export interface JailbreakFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    weight: number;
    match?: string;
    description: string;
    escalated?: boolean;
}
/**
 * Fuzzy finding result.
 */
export interface FuzzyFinding {
    category: string;
    matched_word: string;
    target_keyword: string;
    similarity: number;
    severity: Severity;
    weight: number;
    description: string;
}
/**
 * Heuristic finding result.
 */
export interface HeuristicFinding {
    category: string;
    heuristic_name: string;
    severity: Severity;
    weight: number;
    description: string;
    details?: string;
}
/**
 * Multi-turn finding result.
 */
export interface MultiTurnFinding {
    category: string;
    pattern_name: string;
    severity: Severity;
    weight: number;
    description: string;
}
/**
 * Complete analysis result.
 */
export interface JailbreakAnalysisResult {
    findings: JailbreakFinding[];
    fuzzy_findings: FuzzyFinding[];
    heuristic_findings: HeuristicFinding[];
    multi_turn_findings: MultiTurnFinding[];
    obfuscation_detected: boolean;
    highest_severity: Severity;
    should_block: boolean;
    risk_score: number;
    risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
    is_escalating: boolean;
}
/**
 * Fuzzy match keywords in text.
 * Reduced threshold from 0.85 to 0.75 to reduce false positives while maintaining detection.
 * S016-001: Uses cached regex patterns for phrase matching.
 */
export declare function fuzzyMatchKeywords(text: string, threshold?: number, cache?: RegexCache): FuzzyFinding[];
/**
 * Detect heuristic patterns.
 * S016-001: Uses cached regex patterns to prevent DoS via repeated compilation.
 */
export declare function detectHeuristicPatterns(text: string, cache?: RegexCache): HeuristicFinding[];
/**
 * Detect multi-turn setup patterns.
 */
export declare function detectMultiTurnPatterns(text: string): MultiTurnFinding[];
/**
 * Run jailbreak pattern detection on content.
 */
export declare function detectJailbreakPatterns(content: string): JailbreakFinding[];
/**
 * Jailbreak Validator class.
 */
export declare class JailbreakValidator {
    private readonly config;
    private readonly logger;
    constructor(config?: JailbreakConfig);
    /**
     * Analyze content for jailbreak attempts.
     */
    analyze(content: string, sessionId?: string): JailbreakAnalysisResult;
    /**
     * Create an empty analysis result.
     */
    private createEmptyResult;
    /**
     * Extract patterns from content and detect obfuscation.
     */
    private extractPatterns;
    /**
     * Merge unique findings into target array.
     */
    private mergeUniqueFindings;
    /**
     * Run fuzzy matching if enabled.
     */
    private detectFuzzyMatches;
    /**
     * Run heuristic detection if enabled.
     */
    private detectHeuristics;
    /**
     * Calculate risk score and level, handling session tracking if enabled.
     */
    private calculateRisk;
    /**
     * Calculate risk with session tracking.
     */
    private calculateSessionRisk;
    /**
     * Build session findings from all detection results.
     */
    private buildSessionFindings;
    /**
     * Calculate local risk without session tracking.
     */
    private calculateLocalRisk;
    /**
     * Determine risk level from score.
     */
    private determineRiskLevel;
    /**
     * Apply severity escalation for high-risk sessions.
     */
    private applyEscalation;
    /**
     * Calculate highest severity and blocking decision.
     */
    private calculateSeverityAndBlocking;
    /**
     * Get highest severity from all findings.
     */
    private getHighestSeverity;
    /**
     * Validate content for jailbreak attempts.
     */
    validate(content: string, sessionId?: string): GuardrailResult;
}
/**
 * Convenience function to validate content.
 */
export declare function validateJailbreak(content: string, config?: JailbreakConfig): GuardrailResult;
/**
 * Convenience function to analyze content.
 */
export declare function analyzeJailbreak(content: string, config?: JailbreakConfig, sessionId?: string): JailbreakAnalysisResult;
//# sourceMappingURL=jailbreak.d.ts.map